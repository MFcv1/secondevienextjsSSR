'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const {
    createCheckoutRuntime
} = require('../../../functions/src/commerce/domain/v2Runtime');
const {
    validateCheckoutInput
} = require('../../../functions/src/commerce/domain/checkoutInput');
const {
    createCheckoutHandler,
    createResumeCheckoutHandler,
    normalizeFixtureRequest
} = require('../../../functions/src/commerce/v2Checkout');
const {
    requireCommerceMutationsEnabled,
    withCommerceMutationsEnabled
} = require('../../../functions/src/commerce/v2ControlGuard');
const {
    buildAdminOrderTimeline,
    createGetOrderTimelineAdminHandler,
    createListMyOrdersHandler,
    createListOrdersAdminHandler,
    createListReturnsAdminHandler,
    decodeReturnCursor,
    normalizePageSize,
    returnActions,
    serializeCommerceDocument
} = require('../../../functions/src/commerce/v2OrderQueries');

const repositoryRoot = path.resolve(__dirname, '..', '..', '..');
const source = (relativePath) => fs.readFileSync(
    path.join(repositoryRoot, relativePath),
    'utf8'
);

test('deployed v2 mutations fail closed until the server control enables them', async () => {
    await assert.rejects(
        requireCommerceMutationsEnabled({
            db: {
                doc: () => ({
                    get: async () => ({ exists: false })
                })
            }
        }),
        (error) => (
            error.code === 'failed-precondition' &&
            error.details?.reason === 'COMMERCE_ADMIN_MUTATIONS_OFF'
        )
    );

    let handlerCalls = 0;
    const guarded = withCommerceMutationsEnabled(
        async () => {
            handlerCalls += 1;
            return { ok: true };
        },
        async () => ({
            adminMutationMode: 'v2'
        })
    );
    assert.deepEqual(await guarded({}, {}), { ok: true });
    assert.equal(handlerCalls, 1);
});

test('Gate 8 admin mutations are restricted to the active fixture scope', async () => {
    const documents = new Map([
        ['sys_commerce_control/current', {
            newCheckoutMode: 'v2_fixture',
            legacyMode: 'reconcile_only',
            adminMutationMode: 'v2',
            offlinePaymentMode: 'off',
            activePolicyVersion: 'fixture_policy_gate6_20260728',
            fixtureScopeVersion: 'fixture_gate6_20260728',
            fixtureScopeRef: 'commerce_fixture_scopes/fixture_gate6_20260728',
            controlRevision: 8
        }],
        ['orders/order-gate8-fixture', {
            schemaVersion: 2,
            testContext: {
                runId: 'run_gate8_fixture_scope',
                fixtureScopeVersion: 'fixture_gate6_20260728'
            }
        }],
        ['orders/order-customer', {
            schemaVersion: 2
        }],
        ['artifacts/secondevie/public/data/furniture/fixture_gate6_stock1_01', {
            schemaVersion: 2,
            e2eOnly: true,
            fixtureScopeVersion: 'fixture_gate6_20260728'
        }]
    ]);
    const db = {
        doc: (documentPath) => ({
            get: async () => ({
                exists: documents.has(documentPath),
                data: () => documents.get(documentPath)
            })
        })
    };

    await assert.doesNotReject(requireCommerceMutationsEnabled({
        db,
        data: { orderId: 'order-gate8-fixture' }
    }));
    await assert.doesNotReject(requireCommerceMutationsEnabled({
        db,
        data: {
            collectionName: 'furniture',
            productId: 'fixture_gate6_stock1_01'
        }
    }));
    await assert.rejects(
        requireCommerceMutationsEnabled({
            db,
            data: { orderId: 'order-customer' }
        }),
        (error) => (
            error.code === 'permission-denied' &&
            error.details?.reason === 'COMMERCE_ADMIN_FIXTURE_SCOPE_DENIED'
        )
    );
    await assert.rejects(
        requireCommerceMutationsEnabled({ db, data: {} }),
        (error) => error.details?.reason === 'COMMERCE_ADMIN_FIXTURE_SCOPE_DENIED'
    );
});

test('checkout v2 transport derives owner identity from Auth and ignores payload identity', async () => {
    const calls = [];
    const handler = createCheckoutHandler({
        authorize: (context) => ({
            uid: context.auth.uid,
            email: context.auth.token.email
        }),
        runtimeFactory: () => ({
            checkout: {
                createCheckout: async (request) => {
                    calls.push(request);
                    return { orderId: 'order-v2-transport' };
                }
            }
        })
    });
    const input = {
        clientOrderId: 'client-order-v2',
        items: [],
        deliveryModeId: 'delivery-v2',
        shippingAddress: {}
    };
    const result = await handler({
        input,
        ownerUid: 'forged-owner',
        fixtureContext: { runId: 'forged-fixture' }
    }, {
        auth: {
            uid: 'trusted-owner-uid',
            token: { email: 'owner@example.test' }
        }
    });
    assert.deepEqual(result, { orderId: 'order-v2-transport' });
    assert.deepEqual(calls, [{
        ownerUid: 'trusted-owner-uid',
        ownerEmail: 'owner@example.test',
        input,
        fixtureContext: null
    }]);
});

test('checkout fixture transport accepts only the bounded public request fields', async () => {
    assert.deepEqual(normalizeFixtureRequest({
        runId: 'run_gate7a_20260728',
        fixtureScopeVersion: 'fixture_gate6_20260728'
    }), {
        runId: 'run_gate7a_20260728',
        fixtureScopeVersion: 'fixture_gate6_20260728'
    });
    assert.throws(
        () => normalizeFixtureRequest({
            runId: 'run_gate7a_20260728',
            fixtureScopeVersion: 'fixture_gate6_20260728',
            ownerUid: 'forged-owner'
        }),
        (error) => error.code === 'invalid-argument'
    );
});

test('checkout resume derives owner from Auth and validates before runtime', async () => {
    let runtimeCalls = 0;
    const handler = createResumeCheckoutHandler({
        authorize: (context) => ({ uid: context.auth.uid, email: null }),
        runtimeFactory: () => {
            runtimeCalls += 1;
            return {
                checkout: {
                    resumeCheckout: async (request) => request
                }
            };
        }
    });
    await assert.rejects(
        handler({ orderId: 'bad/order' }, {
            auth: { uid: 'trusted-owner-uid', token: {} }
        }),
        (error) => error.code === 'invalid-argument'
    );
    assert.equal(runtimeCalls, 0);
    assert.deepEqual(
        await handler({ orderId: 'order-v2-resume' }, {
            auth: { uid: 'trusted-owner-uid', token: {} }
        }),
        { orderId: 'order-v2-resume', ownerUid: 'trusted-owner-uid' }
    );
});

test('checkout runtime exposes only create/resume checkout coordination', () => {
    const runtime = createCheckoutRuntime({
        db: {
            doc: (documentPath) => ({ path: documentPath }),
            runTransaction: async () => {
                throw new Error('not executed during wiring test');
            }
        },
        stripe: {
            paymentIntents: {
                create: async () => ({}),
                retrieve: async () => ({}),
                cancel: async () => ({})
            }
        },
        appId: 'secondevie'
    });
    assert.equal(typeof runtime.checkout.createCheckout, 'function');
    assert.equal(typeof runtime.checkout.resumeCheckout, 'function');
    assert.deepEqual(Object.keys(runtime), ['checkout']);
});

test('checkout and query Functions are exported with App Check and fail-closed checkout control', () => {
    const checkout = source('functions/src/commerce/v2Checkout.js');
    const queries = source('functions/src/commerce/v2OrderQueries.js');
    const functionsIndex = source('functions/index.js');
    for (const functionName of [
        'createCheckoutV2',
        'resumeCheckoutV2',
        'getOrderTimelineAdminV2',
        'listMyOrdersV2',
        'listOrdersAdminV2',
        'listReturnsAdminV2'
    ]) {
        assert.ok(checkout.includes(functionName) || queries.includes(functionName));
        assert.equal(functionsIndex.includes(functionName), true);
    }
    assert.ok(checkout.includes('enforceAppCheck: true'));
    assert.ok(checkout.includes('secrets: [STRIPE_SECRET_KEY]'));
    assert.ok(queries.includes('checkActiveStrongAdmin'));
    assert.ok(queries.includes('enforceAppCheck: true'));
});

test('admin order timeline keeps exact payment, cancellation and refund event times', () => {
    const timeline = buildAdminOrderTimeline({
        createdAt: { seconds: 100 },
        payment: {
            status: 'succeeded',
            succeededAt: { _seconds: 200, _nanoseconds: 500000000 }
        },
        refundAggregate: {
            requestedCents: 8000
        },
        status: 'refunded'
    }, [
        {
            type: 'refund_succeeded',
            amountCents: 8000,
            currency: 'EUR',
            createdAt: new Date(400000)
        },
        {
            type: 'refund_requested',
            amountCents: 8000,
            currency: 'EUR',
            createdAt: '1970-01-01T00:05:00.000Z'
        },
        {
            type: 'cancellation_completed',
            createdAt: { seconds: 250 }
        }
    ]);

    assert.deepEqual(timeline.map((event) => event.type), [
        'order_created',
        'payment_succeeded',
        'order_cancelled',
        'refund_requested',
        'refund_succeeded'
    ]);
    assert.deepEqual(timeline[1].at, {
        _seconds: 200,
        _nanoseconds: 500000000
    });
    assert.equal(timeline[4].amountCents, 8000);
    assert.equal(typeof createGetOrderTimelineAdminHandler, 'function');
});

test('order query guards reject invalid pagination and authorize before Firestore', async () => {
    assert.equal(normalizePageSize(undefined), 25);
    assert.throws(() => normalizePageSize(51), (error) => error.code === 'invalid-argument');

    let dbCalls = 0;
    const ownerHandler = createListMyOrdersHandler({
        authorize: () => {
            const error = new Error('unauthenticated');
            error.code = 'unauthenticated';
            throw error;
        },
        dbFactory: () => {
            dbCalls += 1;
            return {};
        }
    });
    await assert.rejects(
        ownerHandler({}, {}),
        (error) => error.code === 'unauthenticated'
    );
    const adminHandler = createListOrdersAdminHandler({
        authorize: async () => {
            const error = new Error('weak admin');
            error.code = 'permission-denied';
            throw error;
        },
        dbFactory: () => {
            dbCalls += 1;
            return {};
        }
    });
    await assert.rejects(
        adminHandler({}, { auth: { uid: 'weak-admin' } }),
        (error) => error.code === 'permission-denied'
    );
    const returnsHandler = createListReturnsAdminHandler({
        authorize: async () => {
            const error = new Error('weak admin');
            error.code = 'permission-denied';
            throw error;
        },
        dbFactory: () => {
            dbCalls += 1;
            return {};
        }
    });
    await assert.rejects(
        returnsHandler({}, { auth: { uid: 'weak-admin' } }),
        (error) => error.code === 'permission-denied'
    );
    assert.equal(dbCalls, 0);
    assert.equal(
        decodeReturnCursor(
            Buffer.from('orders/order-cursor/returns/return-cursor')
                .toString('base64url')
        ),
        'orders/order-cursor/returns/return-cursor'
    );
    assert.throws(
        () => decodeReturnCursor(Buffer.from('orders/order-cursor').toString('base64url')),
        (error) => error.code === 'invalid-argument'
    );
});

test('return actions are server-derived from quantitative state', () => {
    const pending = {
        status: 'pending',
        lines: [{
            requestedQty: 2,
            receivedQty: 0,
            restockedQty: 0,
            writtenOffQty: 0
        }]
    };
    assert.deepEqual(returnActions(pending), ['cancel_return', 'receive_return']);
    const received = {
        status: 'received',
        lines: [{
            requestedQty: 2,
            receivedQty: 2,
            restockedQty: 1,
            writtenOffQty: 0
        }]
    };
    assert.deepEqual(returnActions(received), ['restock_return', 'write_off_return']);
    assert.deepEqual(returnActions({
        ...received,
        lines: [{
            ...received.lines[0],
            writtenOffQty: 1
        }]
    }), ['resolve_return']);
});

test('customer order documents expose only bounded non-fiscal metadata', () => {
    const snapshot = {
        id: 'document-receipt',
        ref: {
            parent: {
                parent: { id: 'order-document' }
            }
        },
        data: () => ({
            schemaVersion: 2,
            documentId: 'document-receipt',
            orderId: 'order-document',
            ownerUid: 'owner-document',
            kind: 'sandbox_payment_receipt',
            legalStatus: 'non_fiscal_sandbox',
            currency: 'EUR',
            capturedCents: 40000,
            sourceEffectIds: ['effect-private'],
            contentHash: 'hash-private',
            issuedAt: '2026-07-29T12:00:00.000Z'
        })
    };
    assert.deepEqual(
        serializeCommerceDocument(snapshot, { userId: 'owner-document' }),
        {
            documentId: 'document-receipt',
            kind: 'sandbox_payment_receipt',
            legalStatus: 'non_fiscal_sandbox',
            currency: 'EUR',
            capturedCents: 40000,
            refundedCents: null,
            issuedAt: '2026-07-29T12:00:00.000Z'
        }
    );
    assert.equal(
        serializeCommerceDocument(snapshot, { userId: 'other-owner' }),
        null
    );
});

test('recovery descriptor is identity-bound and cleanup matches line plus revision', async () => {
    const recovery = await import(pathToFileURL(path.join(
        repositoryRoot,
        'src/kit/commerce/checkoutRecovery.js'
    )));
    const descriptor = recovery.createCheckoutRecoveryDescriptor({
        ownerUid: 'owner-uid-gate5',
        clientOrderId: 'client-order-gate5',
        orderId: 'order-id-gate5',
        cartLines: [{ cartLineId: 'cart-line-gate5', cartRevision: 4 }]
    });
    assert.equal(
        recovery.validateCheckoutRecoveryDescriptor(descriptor, 'owner-uid-gate5'),
        true
    );
    assert.equal(
        recovery.validateCheckoutRecoveryDescriptor(descriptor, 'other-owner-gate5'),
        false
    );
    assert.equal(recovery.isPurchasedCartLineUnchanged(
        { cartLineId: 'cart-line-gate5', cartRevision: 4 },
        descriptor.cartLines[0]
    ), true);
    assert.equal(recovery.isPurchasedCartLineUnchanged(
        { cartLineId: 'cart-line-gate5', cartRevision: 5 },
        descriptor.cartLines[0]
    ), false);
    assert.equal(recovery.isPurchasedCartLineUnchanged(
        { cartLineId: 'cart-line-readded', cartRevision: 4 },
        descriptor.cartLines[0]
    ), false);
});

test('browser checkout contract maps UI delivery/address without forwarding price', async () => {
    const contract = await import(pathToFileURL(path.join(
        repositoryRoot,
        'src/kit/commerce/checkoutContract.js'
    )));
    const input = contract.buildCheckoutV2Input({
        clientOrderId: 'client-order-contract',
        cartItems: [{
            id: 'cart-document-contract',
            cartLineId: 'cart-line-contract',
            cartRevision: 3,
            originalId: 'product-contract',
            collectionName: 'furniture',
            quantity: 1,
            price: 999999
        }],
        deliveryModeId: 'retrait',
        shippingAddress: {
            fullName: 'Client Test',
            phone: '06 12 34 56 78',
            address: '1 rue du Test',
            zip: '13001',
            city: 'Marseille',
            country: 'France'
        }
    });
    assert.equal(input.deliveryModeId, 'delivery-pickup');
    assert.equal(input.shippingAddress.country, 'FR');
    assert.equal(input.shippingAddress.phone, '06 12 34 56 78');
    assert.equal(Object.hasOwn(input.items[0], 'price'), false);
    const validated = validateCheckoutInput(input);
    assert.equal(validated.value.shippingAddress.phone, '06 12 34 56 78');
});

test('Gate 4/5 consumers contain no direct commerce writer on v2 surfaces', () => {
    const adminOrders = source('src/kit/admin/AdminOrders.jsx');
    const adminReturns = source('src/kit/admin/AdminReturns.jsx');
    const adminDelivery = source('src/kit/admin/AdminLivraison.jsx');
    const adminPayment = source('src/kit/admin/AdminPaymentSettings.jsx');
    const myOrders = source('src/kit/commerce/MyOrdersView.jsx');
    const checkout = source('src/kit/commerce/CheckoutView.jsx');
    const checkoutPage = source('app/checkout/CheckoutPageIsland.jsx');
    const commandClient = source('src/kit/commerce/commerceCommandClient.js');
    const consumerClient = source('src/kit/commerce/commerceV2Client.js');
    const uiFlags = source('src/kit/commerce/commerceUiFlags.js');
    const cartPanel = source('src/kit/marketplace/CartPanelIsland.jsx');

    assert.equal(adminOrders.includes('updateDoc'), false);
    assert.equal(adminOrders.includes('deleteDoc'), false);
    assert.equal(adminOrders.includes('refundOrderAdmin'), false);
    assert.equal(adminReturns.includes('refundOrderAdmin'), false);
    assert.equal(adminReturns.includes('syncRefundStatusAdmin'), false);
    assert.equal(adminReturns.includes('sendRefundStatusEmailAdmin'), false);
    assert.equal(adminDelivery.includes('setDoc'), false);
    assert.equal(adminDelivery.includes('updateDoc'), false);
    assert.equal(adminPayment.includes('setDoc'), false);
    assert.equal(adminPayment.includes('updateDoc'), false);
    assert.ok(adminOrders.includes('markOrderShippedAdmin'));
    assert.ok(adminOrders.includes('markOrderPreparingAdmin'));
    assert.ok(adminOrders.includes('markOrderReadyForPickupAdmin'));
    assert.ok(adminOrders.includes('markOrderPickedUpAdmin'));
    assert.ok(adminOrders.includes('markOrderDeliveredAdmin'));
    assert.ok(adminOrders.includes('archiveOrderAdmin'));
    assert.ok(adminReturns.includes('openReturnAdmin'));
    assert.ok(adminReturns.includes('markReturnReceivedAdmin'));
    assert.ok(myOrders.includes('listMyOrdersV2'));
    assert.ok(myOrders.includes('generateCommerceDocument'));
    assert.ok(myOrders.includes('order.documents'));
    assert.ok(myOrders.includes('requestOrderCancellation'));
    assert.ok(adminReturns.includes('adaptCommerceOrder'));
    assert.ok(adminReturns.includes('returnLineSummary'));
    assert.ok(adminReturns.includes('Promise.allSettled'));
    assert.equal(adminReturns.includes("text: error.message || String(error)"), false);
    assert.ok(checkout.includes('createCheckoutV2(input, {'));
    assert.ok(checkout.includes('readCheckoutRecoveryDescriptor(identity.uid'));
    assert.ok(checkout.includes('await resumeCheckoutV2(descriptor.orderId)'));
    assert.ok(checkout.includes('await openExistingPayment()'));
    assert.ok(checkout.includes("setCheckoutState('payment_paused')"));
    assert.ok(checkoutPage.includes('resumeCheckoutV2(recoverableOrderId)'));
    assert.ok(checkoutPage.includes('isPurchasedCartLineUnchanged'));
    assert.equal(checkout.includes('pagehide'), false);
    assert.equal(checkout.includes('beforeunload'), false);
    assert.ok(commandClient.includes("import { COMMERCE_V2_UI_ENABLED } from './commerceUiFlags.js'"));
    assert.ok(commandClient.includes('COMMERCE_V2_ADMIN_ORDER_COMMANDS_ENABLED = true'));
    assert.ok(commandClient.includes('COMMERCE_V2_ADMIN_RETURN_COMMANDS_ENABLED = true'));
    assert.ok(commandClient.includes('COMMERCE_V2_CLIENT_COMMANDS_ENABLED = COMMERCE_V2_UI_ENABLED'));
    assert.ok(commandClient.includes("commandId: cancellationRequestId || createCommerceCommandId('cancel')"));
    assert.equal(commandClient.includes('cancellationRequestId: cancellationRequestId'), false);
    assert.ok(consumerClient.includes("import { COMMERCE_V2_UI_ENABLED } from './commerceUiFlags.js'"));
    assert.ok(consumerClient.includes('COMMERCE_V2_ORDER_READERS_ENABLED = true'));
    assert.ok(consumerClient.includes('COMMERCE_V2_ADMIN_READERS_ENABLED = true'));
    assert.ok(uiFlags.includes('process.env.NEXT_PUBLIC_COMMERCE_V2_UI'));
    assert.ok(uiFlags.includes('process.env.NEXT_PUBLIC_COMMERCE_GATE8_FIXTURE_UI'));
    assert.equal(uiFlags.includes('commerceEnv.'), false);
    assert.ok(cartPanel.includes('await auth.authStateReady?.()'));
    assert.ok(cartPanel.includes('return auth.currentUser || null'));
    assert.equal(cartPanel.includes('hasPersistedFirebaseUser'), false);
});
