'use strict';

const {
    assertHistoricalAmountsUnchanged,
    buildAmounts,
    validateMoneyInvariants
} = require('./money');
const {
    createHeldInventorySummary,
    deriveInventoryStatus,
    validateInventorySummary
} = require('./inventoryInvariants');
const {
    applyLegacyProjection,
    projectLegacyOrder,
    validateLegacyProjection
} = require('./legacyProjection');

const CHECKOUT_STATUSES = Object.freeze(['active', 'cancellation_requested', 'closed', 'needs_review']);
const CLOSE_REASONS = Object.freeze([null, 'paid', 'canceled', 'expired']);
const PAYMENT_PROVIDERS = Object.freeze(['stripe', 'offline']);
const PAYMENT_STATUSES = Object.freeze([
    'awaiting_method',
    'requires_action',
    'processing',
    'succeeded',
    'canceled',
    'needs_review'
]);
const FULFILLMENT_STATUSES = Object.freeze([
    'unfulfilled',
    'preparing',
    'ready_for_pickup',
    'shipped',
    'picked_up',
    'delivered',
    'partial',
    'canceled'
]);
const CUSTODY_STATUSES = Object.freeze(['merchant', 'carrier', 'customer', 'returned', 'mixed']);
const REFUND_STATUSES = Object.freeze(['none', 'pending', 'partial', 'full', 'needs_review']);
const EVENT_TYPES = Object.freeze([
    'payment_method_refused',
    'payment_requires_confirmation',
    'payment_requires_action',
    'payment_processing',
    'payment_succeeded',
    'cancellation_requested',
    'payment_canceled',
    'reservation_expired',
    'offline_payment_accepted',
    'fulfillment_preparing',
    'fulfillment_ready_for_pickup',
    'fulfillment_picked_up',
    'fulfillment_shipped',
    'fulfillment_delivered',
    'refund_requested',
    'refund_confirmed',
    'return_received',
    'return_restocked',
    'return_written_off',
    'mark_needs_review'
]);

function domainError(code, detail) {
    const error = new Error(detail ? `${code}:${detail}` : code);
    error.code = code;
    if (detail) error.detail = detail;
    return error;
}

function assertEnum(value, values, field) {
    if (!values.includes(value)) throw domainError('COMMERCE_ORDER_ENUM_INVALID', field);
}

function assertString(value, field, { nullable = false } = {}) {
    if (nullable && value === null) return;
    if (typeof value !== 'string' || value.length === 0) {
        throw domainError('COMMERCE_ORDER_STRING_INVALID', field);
    }
}

function cloneOrder(order) {
    return {
        ...order,
        amounts: { ...order.amounts },
        checkout: { ...order.checkout },
        payment: { ...order.payment },
        fulfillmentSummary: { ...order.fulfillmentSummary },
        refundAggregate: { ...order.refundAggregate },
        inventorySummary: { ...order.inventorySummary },
        items: order.items.map((item) => ({ ...item })),
        customerSnapshot: { ...order.customerSnapshot },
        shippingSnapshot: { ...order.shippingSnapshot },
        ...(order.testContext ? { testContext: { ...order.testContext } } : {})
    };
}

function validateLine(line, index) {
    const prefix = `items[${index}]`;
    for (const field of [
        'lineId',
        'cartLineId',
        'inventoryKey',
        'productId',
        'collectionName',
        'titleSnapshot'
    ]) {
        assertString(line[field], `${prefix}.${field}`);
    }
    if (line.variantId !== null) assertString(line.variantId, `${prefix}.variantId`);
    if (!Number.isSafeInteger(line.cartRevision) || line.cartRevision < 0) {
        throw domainError('COMMERCE_ORDER_LINE_INVALID', `${prefix}.cartRevision`);
    }
    if (!Number.isSafeInteger(line.unitAmountCents) || line.unitAmountCents < 0) {
        throw domainError('COMMERCE_ORDER_LINE_INVALID', `${prefix}.unitAmountCents`);
    }
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) {
        throw domainError('COMMERCE_ORDER_LINE_INVALID', `${prefix}.quantity`);
    }
}

function validateOrderV2(order, { requireProjection = true } = {}) {
    if (!order || typeof order !== 'object' || Array.isArray(order)) {
        throw domainError('COMMERCE_ORDER_INVALID_SHAPE');
    }
    if (order.schemaVersion !== 2) throw domainError('COMMERCE_ORDER_SCHEMA_UNSUPPORTED');
    if (!Number.isSafeInteger(order.stateVersion) || order.stateVersion < 0) {
        throw domainError('COMMERCE_ORDER_STATE_VERSION_INVALID');
    }
    if (order.currency !== 'EUR') throw domainError('COMMERCE_ORDER_CURRENCY_INVALID');
    assertString(order.userId, 'userId');

    validateMoneyInvariants(order.amounts);
    validateInventorySummary(order.inventorySummary);
    assertEnum(order.checkout?.status, CHECKOUT_STATUSES, 'checkout.status');
    assertEnum(order.checkout?.closeReason, CLOSE_REASONS, 'checkout.closeReason');
    assertString(order.checkout?.clientOrderId, 'checkout.clientOrderId');
    assertString(order.checkout?.requestHash, 'checkout.requestHash');
    assertString(order.checkout?.policyVersion, 'checkout.policyVersion');
    assertEnum(order.payment?.provider, PAYMENT_PROVIDERS, 'payment.provider');
    assertEnum(order.payment?.status, PAYMENT_STATUSES, 'payment.status');
    assertEnum(order.fulfillmentSummary?.status, FULFILLMENT_STATUSES, 'fulfillmentSummary.status');
    assertEnum(order.fulfillmentSummary?.custody, CUSTODY_STATUSES, 'fulfillmentSummary.custody');
    assertEnum(order.refundAggregate?.status, REFUND_STATUSES, 'refundAggregate.status');

    for (const field of ['requestedCents', 'pendingCents', 'succeededCents']) {
        if (!Number.isSafeInteger(order.refundAggregate?.[field]) || order.refundAggregate[field] < 0) {
            throw domainError('COMMERCE_ORDER_REFUND_INVALID', field);
        }
    }
    if (typeof order.refundAggregate?.hasFailure !== 'boolean') {
        throw domainError('COMMERCE_ORDER_REFUND_INVALID', 'hasFailure');
    }
    if (order.refundAggregate.succeededCents !== order.amounts.refundedCents) {
        throw domainError('COMMERCE_ORDER_REFUND_AMOUNT_MISMATCH');
    }
    if (order.checkout.status === 'closed' && order.checkout.closeReason === null) {
        throw domainError('COMMERCE_ORDER_CLOSE_REASON_REQUIRED');
    }
    if (order.checkout.status !== 'closed' && order.checkout.closeReason !== null) {
        throw domainError('COMMERCE_ORDER_CLOSE_REASON_FORBIDDEN');
    }
    if (order.payment.status === 'succeeded' && order.amounts.capturedCents !== order.amounts.totalCents) {
        throw domainError('COMMERCE_ORDER_CAPTURE_MISMATCH');
    }
    if (
        order.payment.status === 'succeeded' &&
        (order.checkout.status !== 'closed' || order.checkout.closeReason !== 'paid')
    ) {
        throw domainError('COMMERCE_ORDER_PAYMENT_CHECKOUT_MISMATCH');
    }
    if (
        order.payment.status === 'canceled' &&
        (
            order.checkout.status !== 'closed' ||
            !['canceled', 'expired'].includes(order.checkout.closeReason) ||
            order.inventorySummary.heldQty !== 0 ||
            order.inventorySummary.releasedQty !== order.inventorySummary.reservedQty
        )
    ) {
        throw domainError('COMMERCE_ORDER_CANCELLATION_MISMATCH');
    }
    if (
        !['unfulfilled', 'canceled'].includes(order.fulfillmentSummary.status) &&
        !['succeeded', 'needs_review'].includes(order.payment.status)
    ) {
        throw domainError('COMMERCE_ORDER_FULFILLMENT_REQUIRES_PAYMENT');
    }
    const refund = order.refundAggregate;
    if (refund.status === 'none' && (
        refund.requestedCents !== 0 ||
        refund.pendingCents !== 0 ||
        refund.succeededCents !== 0
    )) {
        throw domainError('COMMERCE_ORDER_REFUND_STATUS_MISMATCH');
    }
    if (refund.status === 'pending' && refund.pendingCents <= 0) {
        throw domainError('COMMERCE_ORDER_REFUND_STATUS_MISMATCH');
    }
    if (
        refund.status === 'partial' &&
        (
            refund.pendingCents !== 0 ||
            refund.succeededCents <= 0 ||
            refund.succeededCents >= order.amounts.capturedCents
        )
    ) {
        throw domainError('COMMERCE_ORDER_REFUND_STATUS_MISMATCH');
    }
    if (
        refund.status === 'full' &&
        (
            refund.pendingCents !== 0 ||
            order.amounts.capturedCents <= 0 ||
            refund.succeededCents !== order.amounts.capturedCents
        )
    ) {
        throw domainError('COMMERCE_ORDER_REFUND_STATUS_MISMATCH');
    }
    if (
        ['pending', 'partial', 'full'].includes(refund.status) &&
        !['succeeded', 'needs_review'].includes(order.payment.status)
    ) {
        throw domainError('COMMERCE_ORDER_REFUND_REQUIRES_PAYMENT');
    }
    if (!Array.isArray(order.items) || order.items.length === 0 || order.items.length > 50) {
        throw domainError('COMMERCE_ORDER_ITEMS_INVALID');
    }
    order.items.forEach(validateLine);
    const lineTotal = order.items.reduce(
        (sum, line) => sum + (line.unitAmountCents * line.quantity),
        0
    );
    if (lineTotal !== order.amounts.itemsCents) {
        throw domainError('COMMERCE_ORDER_ITEMS_AMOUNT_MISMATCH');
    }
    if (requireProjection) validateLegacyProjection(order);
    return true;
}

function createOrderV2({
    userId,
    clientOrderId,
    requestHash,
    policyVersion,
    items,
    shippingCents = 0,
    discountCents = 0,
    taxCents = 0,
    customerSnapshot = {},
    shippingSnapshot = {},
    expiresAt = null,
    paymentProvider = 'stripe',
    testContext = null,
    clock
}) {
    if (!clock || typeof clock.now !== 'function') {
        throw domainError('COMMERCE_CLOCK_REQUIRED');
    }
    if (!Array.isArray(items)) throw domainError('COMMERCE_ORDER_ITEMS_INVALID');
    const itemsCents = items.reduce((sum, line, index) => {
        validateLine(line, index);
        return sum + (line.unitAmountCents * line.quantity);
    }, 0);
    const reservedQty = items.reduce((sum, line) => sum + line.quantity, 0);
    const now = clock.now();
    const order = {
        schemaVersion: 2,
        stateVersion: 0,
        legacyProjectionVersion: 1,
        userId,
        userEmail: customerSnapshot.email || null,
        currency: 'EUR',
        amounts: buildAmounts({
            itemsCents,
            shippingCents,
            discountCents,
            taxCents
        }),
        checkout: {
            status: 'active',
            closeReason: null,
            clientOrderId,
            requestHash,
            policyVersion,
            expiresAt
        },
        payment: {
            provider: paymentProvider,
            status: 'awaiting_method',
            currentAttemptId: null,
            paymentIntentId: null,
            connectedAccountId: null,
            lastProviderStatus: null,
            succeededAt: null
        },
        fulfillmentSummary: {
            status: 'unfulfilled',
            custody: 'merchant',
            trackingNumber: null,
            shippedAt: null,
            deliveredAt: null
        },
        refundAggregate: {
            status: 'none',
            requestedCents: 0,
            pendingCents: 0,
            succeededCents: 0,
            hasFailure: false
        },
        inventorySummary: createHeldInventorySummary(reservedQty),
        items: items.map((line) => ({ ...line })),
        customerSnapshot: { ...customerSnapshot },
        shippingSnapshot: { ...shippingSnapshot },
        ...(testContext ? { testContext: { ...testContext } } : {}),
        createdAt: now,
        updatedAt: now
    };
    const projected = applyLegacyProjection(order);
    validateOrderV2(projected);
    return projected;
}

function markNeedsReview(next, detail) {
    next.checkout.status = 'needs_review';
    next.checkout.closeReason = null;
    next.payment.status = 'needs_review';
    next.payment.lastProviderStatus = detail || next.payment.lastProviderStatus;
    return next;
}

function setPaymentNonTerminal(next, status, providerStatus) {
    if (next.payment.status === 'succeeded' || next.payment.status === 'canceled') return false;
    next.payment.status = status;
    next.payment.lastProviderStatus = providerStatus;
    return true;
}

function assertPaid(next, eventType) {
    if (next.payment.status !== 'succeeded') {
        throw domainError('COMMERCE_TRANSITION_PRECONDITION_FAILED', eventType);
    }
}

function commitInventory(next) {
    if (next.inventorySummary.status === 'committed') return;
    if (next.inventorySummary.heldQty !== next.inventorySummary.reservedQty) {
        throw domainError('COMMERCE_INVENTORY_COMMIT_FORBIDDEN');
    }
    next.inventorySummary.committedQty = next.inventorySummary.heldQty;
    next.inventorySummary.heldQty = 0;
    next.inventorySummary.status = 'committed';
}

function releaseInventory(next) {
    if (next.inventorySummary.status === 'released') return;
    if (next.inventorySummary.heldQty !== next.inventorySummary.reservedQty) {
        throw domainError('COMMERCE_INVENTORY_RELEASE_FORBIDDEN');
    }
    next.inventorySummary.releasedQty = next.inventorySummary.heldQty;
    next.inventorySummary.heldQty = 0;
    next.inventorySummary.status = 'released';
}

function applyEvent(next, event, now) {
    switch (event.type) {
        case 'payment_method_refused':
        case 'payment_requires_confirmation':
            return setPaymentNonTerminal(next, 'awaiting_method', event.providerStatus || 'requires_payment_method');
        case 'payment_requires_action':
            return setPaymentNonTerminal(next, 'requires_action', event.providerStatus || 'requires_action');
        case 'payment_processing':
            return setPaymentNonTerminal(next, 'processing', event.providerStatus || 'processing');
        case 'payment_succeeded':
        case 'offline_payment_accepted': {
            if (next.payment.status === 'succeeded') return false;
            if (next.payment.status === 'canceled') {
                markNeedsReview(next, 'terminal_payment_conflict');
                return true;
            }
            if (event.type === 'offline_payment_accepted' && next.payment.provider !== 'offline') {
                throw domainError('COMMERCE_TRANSITION_PRECONDITION_FAILED', event.type);
            }
            if (event.amountCents !== next.amounts.totalCents || event.currency !== next.currency) {
                markNeedsReview(next, 'payment_amount_or_currency_mismatch');
                return true;
            }
            next.payment.status = 'succeeded';
            next.payment.lastProviderStatus = 'succeeded';
            next.payment.succeededAt = now;
            if (event.paymentIntentId) next.payment.paymentIntentId = event.paymentIntentId;
            next.amounts.capturedCents = event.amountCents;
            next.amounts.netCents = event.amountCents - next.amounts.refundedCents;
            next.checkout.status = 'closed';
            next.checkout.closeReason = 'paid';
            commitInventory(next);
            return true;
        }
        case 'cancellation_requested':
        case 'reservation_expired':
            if (next.payment.status === 'succeeded') {
                throw domainError('COMMERCE_TRANSITION_PRECONDITION_FAILED', event.type);
            }
            if (next.payment.status === 'canceled' || next.checkout.status === 'cancellation_requested') return false;
            next.checkout.status = 'cancellation_requested';
            next.checkout.closeReason = null;
            return true;
        case 'payment_canceled':
            if (next.payment.status === 'succeeded') {
                markNeedsReview(next, 'terminal_payment_conflict');
                return true;
            }
            if (next.payment.status === 'canceled') return false;
            next.payment.status = 'canceled';
            next.payment.lastProviderStatus = 'canceled';
            next.checkout.status = 'closed';
            next.checkout.closeReason = event.closeReason === 'expired' ? 'expired' : 'canceled';
            next.fulfillmentSummary.status = 'canceled';
            next.fulfillmentSummary.custody = 'merchant';
            releaseInventory(next);
            return true;
        case 'fulfillment_preparing':
            assertPaid(next, event.type);
            if (next.fulfillmentSummary.status !== 'unfulfilled') {
                throw domainError('COMMERCE_TRANSITION_PRECONDITION_FAILED', event.type);
            }
            next.fulfillmentSummary.status = 'preparing';
            return true;
        case 'fulfillment_ready_for_pickup':
            assertPaid(next, event.type);
            if (!['unfulfilled', 'preparing'].includes(next.fulfillmentSummary.status)) {
                throw domainError('COMMERCE_TRANSITION_PRECONDITION_FAILED', event.type);
            }
            next.fulfillmentSummary.status = 'ready_for_pickup';
            return true;
        case 'fulfillment_picked_up':
            assertPaid(next, event.type);
            if (next.fulfillmentSummary.status !== 'ready_for_pickup') {
                throw domainError('COMMERCE_TRANSITION_PRECONDITION_FAILED', event.type);
            }
            next.fulfillmentSummary.status = 'picked_up';
            next.fulfillmentSummary.custody = 'customer';
            next.fulfillmentSummary.deliveredAt = now;
            return true;
        case 'fulfillment_shipped':
            assertPaid(next, event.type);
            if (!['unfulfilled', 'preparing'].includes(next.fulfillmentSummary.status)) {
                throw domainError('COMMERCE_TRANSITION_PRECONDITION_FAILED', event.type);
            }
            next.fulfillmentSummary.status = 'shipped';
            next.fulfillmentSummary.custody = 'carrier';
            next.fulfillmentSummary.trackingNumber = event.trackingNumber || null;
            next.fulfillmentSummary.shippedAt = now;
            return true;
        case 'fulfillment_delivered':
            assertPaid(next, event.type);
            if (next.fulfillmentSummary.status !== 'shipped') {
                throw domainError('COMMERCE_TRANSITION_PRECONDITION_FAILED', event.type);
            }
            next.fulfillmentSummary.status = 'delivered';
            next.fulfillmentSummary.custody = 'customer';
            next.fulfillmentSummary.deliveredAt = now;
            return true;
        case 'refund_requested': {
            assertPaid(next, event.type);
            const available = next.amounts.capturedCents -
                next.refundAggregate.succeededCents -
                next.refundAggregate.pendingCents;
            if (!Number.isSafeInteger(event.amountCents) || event.amountCents <= 0 || event.amountCents > available) {
                throw domainError('COMMERCE_REFUND_AMOUNT_INVALID');
            }
            next.refundAggregate.requestedCents += event.amountCents;
            next.refundAggregate.pendingCents += event.amountCents;
            next.refundAggregate.status = 'pending';
            return true;
        }
        case 'refund_confirmed': {
            assertPaid(next, event.type);
            if (
                !Number.isSafeInteger(event.amountCents) ||
                event.amountCents <= 0 ||
                event.amountCents > next.refundAggregate.pendingCents
            ) {
                throw domainError('COMMERCE_REFUND_AMOUNT_INVALID');
            }
            next.refundAggregate.pendingCents -= event.amountCents;
            next.refundAggregate.succeededCents += event.amountCents;
            next.amounts.refundedCents = next.refundAggregate.succeededCents;
            next.amounts.netCents = next.amounts.capturedCents - next.amounts.refundedCents;
            next.refundAggregate.status = next.refundAggregate.pendingCents > 0
                ? 'pending'
                : (next.amounts.refundedCents === next.amounts.capturedCents ? 'full' : 'partial');
            return true;
        }
        case 'return_received':
            assertPaid(next, event.type);
            if (!['carrier', 'customer'].includes(next.fulfillmentSummary.custody)) {
                throw domainError('COMMERCE_TRANSITION_PRECONDITION_FAILED', event.type);
            }
            next.fulfillmentSummary.custody = 'returned';
            return true;
        case 'return_restocked': {
            if (next.fulfillmentSummary.custody !== 'returned') {
                throw domainError('COMMERCE_TRANSITION_PRECONDITION_FAILED', event.type);
            }
            const quantity = event.quantity;
            if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > next.inventorySummary.committedQty) {
                throw domainError('COMMERCE_INVENTORY_DISPOSITION_INVALID');
            }
            next.inventorySummary.committedQty -= quantity;
            next.inventorySummary.restockedQty += quantity;
            next.inventorySummary.dispositionPendingQty = Math.max(
                0,
                next.inventorySummary.dispositionPendingQty - quantity
            );
            next.inventorySummary.status = deriveInventoryStatus(next.inventorySummary);
            return true;
        }
        case 'return_written_off': {
            if (next.fulfillmentSummary.custody !== 'returned') {
                throw domainError('COMMERCE_TRANSITION_PRECONDITION_FAILED', event.type);
            }
            const quantity = event.quantity;
            if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > next.inventorySummary.committedQty) {
                throw domainError('COMMERCE_INVENTORY_DISPOSITION_INVALID');
            }
            next.inventorySummary.committedQty -= quantity;
            next.inventorySummary.writtenOffQty += quantity;
            next.inventorySummary.dispositionPendingQty = Math.max(
                0,
                next.inventorySummary.dispositionPendingQty - quantity
            );
            next.inventorySummary.status = deriveInventoryStatus(next.inventorySummary);
            return true;
        }
        case 'mark_needs_review':
            markNeedsReview(next, event.reason || 'manual_review');
            return true;
        default:
            throw domainError('COMMERCE_TRANSITION_NOT_ALLOWED', event.type);
    }
}

function reduceOrder(order, event, { clock }) {
    validateOrderV2(order);
    if (!event || typeof event !== 'object' || !EVENT_TYPES.includes(event.type)) {
        throw domainError('COMMERCE_TRANSITION_NOT_ALLOWED', event?.type || 'missing');
    }
    if (!clock || typeof clock.now !== 'function') throw domainError('COMMERCE_CLOCK_REQUIRED');
    const next = cloneOrder(order);
    const changed = applyEvent(next, event, clock.now());
    if (!changed) return order;

    next.stateVersion += 1;
    next.updatedAt = clock.now();
    const projected = applyLegacyProjection(next);
    assertHistoricalAmountsUnchanged(order.amounts, projected.amounts);
    if (order.currency !== projected.currency) throw domainError('COMMERCE_ORDER_CURRENCY_IMMUTABLE');
    validateOrderV2(projected);
    return projected;
}

function adaptOrderForRead(order, id = null) {
    if (order?.schemaVersion === 2) {
        validateOrderV2(order);
        const projection = projectLegacyOrder(order);
        return {
            id,
            schemaVersion: 2,
            stateVersion: order.stateVersion,
            status: projection.status,
            paymentStatus: order.payment.status,
            fulfillmentStatus: order.fulfillmentSummary.status,
            refundStatus: order.refundAggregate.status,
            total: projection.total,
            currency: order.currency,
            userEmail: order.customerSnapshot?.email || null,
            needsReview: projection.status === 'needs_review'
        };
    }
    return {
        id,
        schemaVersion: 1,
        stateVersion: null,
        status: order?.status || null,
        paymentStatus: order?.paymentStatus || null,
        fulfillmentStatus: null,
        refundStatus: order?.refundStatus || null,
        total: Number(order?.total || 0),
        currency: String(order?.currency || 'EUR').toUpperCase(),
        userEmail: order?.userEmail || null,
        needsReview: order?.status === 'needs_review'
    };
}

module.exports = {
    CHECKOUT_STATUSES,
    CLOSE_REASONS,
    CUSTODY_STATUSES,
    EVENT_TYPES,
    FULFILLMENT_STATUSES,
    PAYMENT_PROVIDERS,
    PAYMENT_STATUSES,
    REFUND_STATUSES,
    adaptOrderForRead,
    createOrderV2,
    reduceOrder,
    validateOrderV2
};
