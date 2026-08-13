'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const {
    adaptOrderForRead,
    createOrderV2,
    reduceOrder,
    validateOrderV2
} = require('../../../functions/src/commerce/domain/orderState');
const {
    buildAmounts,
    validateMoneyInvariants
} = require('../../../functions/src/commerce/domain/money');
const {
    createHeldInventorySummary,
    validateInventorySummary
} = require('../../../functions/src/commerce/domain/inventoryInvariants');
const {
    applyLegacyProjection,
    validateLegacyProjection
} = require('../../../functions/src/commerce/domain/legacyProjection');
const {
    mayCreateV2Checkout,
    normalizeCommerceControl
} = require('../../../functions/src/commerce/domain/policy');
const { createCommerceDependencies } = require('../../../functions/src/commerce/domain/dependencies');
const { fixedClock, makeLine, makeOrder } = require('../fixtures/order-v2.cjs');

const laterClock = fixedClock('2026-07-26T10:05:00.000Z');

test('factory creates a complete valid v2 order with integer cents', () => {
    const order = makeOrder();
    assert.equal(validateOrderV2(order), true);
    assert.equal(order.schemaVersion, 2);
    assert.equal(order.status, 'pending_payment');
    assert.equal(order.amounts.totalCents, 14000);
    assert.equal(order.inventorySummary.heldQty, 1);
    assert.deepEqual(order.deliverySnapshot, {
        id: 'delivery-carrier',
        shippingCents: 1500,
        policyVersion: 'policy-0001'
    });
});

test('floating, incoherent and excessive money values are rejected', () => {
    assert.throws(
        () => buildAmounts({ itemsCents: 10.5 }),
        { code: 'COMMERCE_MONEY_INVALID_CENTS' }
    );
    assert.throws(
        () => validateMoneyInvariants({
            itemsCents: 100,
            shippingCents: 0,
            discountCents: 0,
            taxCents: 0,
            totalCents: 99,
            capturedCents: 0,
            refundedCents: 0,
            netCents: 0
        }),
        { code: 'COMMERCE_MONEY_TOTAL_MISMATCH' }
    );
    assert.throws(
        () => validateMoneyInvariants({
            itemsCents: 100,
            shippingCents: 0,
            discountCents: 0,
            taxCents: 0,
            totalCents: 100,
            capturedCents: 50,
            refundedCents: 60,
            netCents: 0
        }),
        { code: 'COMMERCE_MONEY_REFUND_EXCEEDS_CAPTURE' }
    );
});

test('inventory quantities are conserved and status is derived', () => {
    assert.equal(validateInventorySummary(createHeldInventorySummary(3)), true);
    assert.throws(
        () => validateInventorySummary({
            ...createHeldInventorySummary(3),
            heldQty: 2
        }),
        { code: 'COMMERCE_INVENTORY_ACCOUNTING_MISMATCH' }
    );
});

test('closed matrix rejects unlisted transitions and unpaid fulfillment', () => {
    assert.throws(
        () => reduceOrder(makeOrder(), { type: 'invented_transition' }, { clock: laterClock }),
        { code: 'COMMERCE_TRANSITION_NOT_ALLOWED' }
    );
    assert.throws(
        () => reduceOrder(makeOrder(), { type: 'fulfillment_shipped' }, { clock: laterClock }),
        { code: 'COMMERCE_TRANSITION_PRECONDITION_FAILED' }
    );
});

test('retryable payment states keep the hold and succeeded is monotone', () => {
    let order = makeOrder();
    order = reduceOrder(order, { type: 'payment_method_refused' }, { clock: laterClock });
    assert.equal(order.payment.status, 'awaiting_method');
    assert.equal(order.inventorySummary.status, 'held');
    order = reduceOrder(order, { type: 'payment_requires_action' }, { clock: laterClock });
    order = reduceOrder(order, { type: 'payment_processing' }, { clock: laterClock });
    order = reduceOrder(order, {
        type: 'payment_succeeded',
        amountCents: 14000,
        currency: 'EUR',
        paymentIntentId: 'pi_test_0001'
    }, { clock: laterClock });
    assert.equal(order.payment.status, 'succeeded');
    assert.equal(order.inventorySummary.status, 'committed');
    assert.equal(order.status, 'paid');
    const unchanged = reduceOrder(order, { type: 'payment_method_refused' }, { clock: laterClock });
    assert.strictEqual(unchanged, order);
});

test('provider cancellation is required before inventory release', () => {
    let order = makeOrder();
    order = reduceOrder(order, { type: 'cancellation_requested' }, { clock: laterClock });
    assert.equal(order.checkout.status, 'cancellation_requested');
    assert.equal(order.inventorySummary.status, 'held');
    order = reduceOrder(order, {
        type: 'payment_canceled',
        closeReason: 'canceled'
    }, { clock: laterClock });
    assert.equal(order.payment.status, 'canceled');
    assert.equal(order.inventorySummary.status, 'released');
    assert.equal(order.status, 'canceled');
});

test('terminal payment conflict becomes needs_review without speculative release', () => {
    let order = makeOrder();
    order = reduceOrder(order, {
        type: 'payment_canceled',
        closeReason: 'canceled'
    }, { clock: laterClock });
    order = reduceOrder(order, {
        type: 'payment_succeeded',
        amountCents: 14000,
        currency: 'EUR'
    }, { clock: laterClock });
    assert.equal(order.status, 'needs_review');
    assert.equal(order.inventorySummary.status, 'released');
});

test('refund and fulfillment projections are deterministic', () => {
    let order = reduceOrder(makeOrder(), {
        type: 'payment_succeeded',
        amountCents: 14000,
        currency: 'EUR'
    }, { clock: laterClock });
    order = reduceOrder(order, {
        type: 'fulfillment_shipped',
        carrierCode: 'colissimo',
        trackingNumber: 'TRACK-1'
    }, { clock: laterClock });
    assert.equal(order.status, 'shipped');
    order = reduceOrder(order, {
        type: 'fulfillment_tracking_updated',
        carrierCode: 'chronopost',
        trackingNumber: 'TRACK-2'
    }, { clock: laterClock });
    assert.equal(order.status, 'shipped');
    assert.equal(order.fulfillmentSummary.carrierCode, 'chronopost');
    assert.equal(order.fulfillmentSummary.trackingNumber, 'TRACK-2');
    order = reduceOrder(order, { type: 'fulfillment_delivered' }, { clock: laterClock });
    assert.equal(order.status, 'completed');
    order = reduceOrder(order, { type: 'refund_requested', amountCents: 5000 }, { clock: laterClock });
    assert.equal(order.status, 'refund_pending');
    order = reduceOrder(order, { type: 'refund_confirmed', amountCents: 5000 }, { clock: laterClock });
    assert.equal(order.status, 'paid');
    assert.equal(order.refundAggregate.status, 'partial');
});

test('an incoherent stored legacy projection is rejected', () => {
    const order = { ...makeOrder(), status: 'paid' };
    assert.throws(
        () => validateLegacyProjection(order),
        { code: 'COMMERCE_LEGACY_PROJECTION_MISMATCH' }
    );
    assert.equal(validateLegacyProjection(applyLegacyProjection(order)), true);
});

test('v2 read adapter never promotes a forged legacy status', () => {
    const order = { ...makeOrder(), status: 'completed' };
    const projected = applyLegacyProjection(order);
    const read = adaptOrderForRead(projected, 'order-1');
    assert.equal(read.schemaVersion, 2);
    assert.equal(read.status, 'pending_payment');
    assert.equal(read.paymentStatus, 'awaiting_method');
});

test('control is fail-closed unless its complete contract is valid', () => {
    assert.deepEqual(normalizeCommerceControl({ newCheckoutMode: 'v2_all' }), {
        newCheckoutMode: 'off',
        legacyMode: 'reconcile_only',
        adminMutationMode: 'read_only',
        offlinePaymentMode: 'off',
        activePolicyVersion: null,
        fixtureScopeVersion: null,
        fixtureScopeRef: null,
        controlRevision: null
    });
    assert.equal(mayCreateV2Checkout({
        newCheckoutMode: 'v2_all',
        legacyMode: 'disabled',
        adminMutationMode: 'v2',
        offlinePaymentMode: 'off',
        activePolicyVersion: 'policy-1',
        controlRevision: 1
    }), true);
});

test('clock, IDs, Stripe and Firestore boundaries are injectable', () => {
    const dependencies = createCommerceDependencies({
        clock: fixedClock(),
        ids: { orderId: () => 'order-1', commandId: () => 'command-1' },
        stripe: { paymentIntents: {} },
        firestore: { runTransaction: async (run) => run({}) }
    });
    assert.equal(dependencies.clock.now(), '2026-07-26T10:00:00.000Z');
    assert.equal(dependencies.ids.orderId(), 'order-1');
});

test('v2 factory rejects line totals that cannot be represented safely', () => {
    assert.throws(
        () => createOrderV2({
            userId: 'owner-uid-0001',
            clientOrderId: 'client-order-0001',
            requestHash: 'a'.repeat(64),
            policyVersion: 'policy-0001',
            items: [makeLine({ unitAmountCents: 1.2 })],
            clock: fixedClock()
        }),
        { code: 'COMMERCE_ORDER_LINE_INVALID' }
    );
});

test('frontend controller and recovery descriptor are active by default', async () => {
    const root = path.resolve(__dirname, '..', '..', '..');
    const controller = await import(pathToFileURL(path.join(root, 'src/kit/commerce/checkoutController.js')));
    const adapter = await import(pathToFileURL(path.join(root, 'src/kit/commerce/orderAdapter.js')));
    const recovery = await import(pathToFileURL(path.join(root, 'src/kit/commerce/checkoutRecovery.js')));

    const initial = controller.createCheckoutControllerState();
    const creating = controller.reduceCheckoutController(initial, { type: 'START' });
    assert.equal(creating.status, 'creating');
    const restored = controller.reduceCheckoutController(initial, {
        type: 'RESTORE',
        orderId: 'order-id-restore-0001',
        clientOrderId: 'client-order-restore-0001'
    }, { enabled: true });
    assert.deepEqual(restored, {
        status: 'awaiting_method',
        orderId: 'order-id-restore-0001',
        clientOrderId: 'client-order-restore-0001',
        errorCode: null
    });
    assert.throws(
        () => controller.reduceCheckoutController(restored, { type: 'START' }, { enabled: true }),
        /COMMERCE_CHECKOUT_CONTROLLER_TRANSITION_DENIED:awaiting_method:START/
    );
    assert.equal(controller.COMMERCE_V2_CHECKOUT_ENABLED, true);
    assert.equal(recovery.COMMERCE_V2_RECOVERY_ENABLED, true);

    const adapted = adapter.adaptCommerceOrder(makeOrder(), 'order-v2');
    assert.equal(adapted.status, 'pending_payment');
    const needsReview = adapter.adaptCommerceOrder({
        ...makeOrder(),
        status: 'needs_review',
        refundStatus: 'needs_review'
    }, 'order-v2-review');
    assert.equal(needsReview.status, 'needs_review');
    assert.equal(needsReview.needsReview, true);
    const descriptor = recovery.createCheckoutRecoveryDescriptor({
        ownerUid: 'owner-uid-0001',
        clientOrderId: 'client-order-0001',
        orderId: 'order-id-0001',
        cartLines: [{ cartLineId: 'cart-line-0001', cartRevision: 1 }]
    });
    assert.equal(recovery.validateCheckoutRecoveryDescriptor(descriptor, 'owner-uid-0001'), true);
    assert.equal(recovery.validateCheckoutRecoveryDescriptor(descriptor, 'other-owner-0001'), false);
    assert.equal(recovery.getCheckoutRecoveryTerminalReason({
        code: 'functions/failed-precondition',
        details: { reason: 'COMMERCE_CHECKOUT_TERMINAL_EXPIRED' }
    }), 'expired');
    assert.equal(recovery.getCheckoutRecoveryTerminalReason({
        code: 'functions/failed-precondition',
        details: { reason: 'COMMERCE_CHECKOUT_TERMINAL_PAID' }
    }), 'paid');
    assert.equal(recovery.getCheckoutRecoveryTerminalReason({
        code: 'functions/unavailable'
    }), null);
    assert.match(
        recovery.getCheckoutRecoveryTerminalMessage('expired'),
        /réservation a expiré/
    );
    assert.match(
        recovery.getCheckoutRecoveryTerminalMessage('paid'),
        /déjà confirmée/
    );
    assert.deepEqual(
        recovery.getCheckoutRecoveryTerminalCartLines('paid', descriptor),
        descriptor.cartLines
    );
    assert.deepEqual(
        recovery.getCheckoutRecoveryTerminalCartLines('canceled', descriptor),
        []
    );
    assert.deepEqual(
        recovery.getCheckoutRecoveryOrderItems({
            items: [{
                cartLineId: 'cart-line-recovery-0001',
                productId: 'product-recovery-0001',
                name: 'Commode de reprise',
                quantity: 1,
                unitAmountCents: 6500
            }]
        }),
        [{
            id: 'cart-line-recovery-0001',
            originalId: 'product-recovery-0001',
            name: 'Commode de reprise',
            price: 65,
            quantity: 1
        }]
    );
});
