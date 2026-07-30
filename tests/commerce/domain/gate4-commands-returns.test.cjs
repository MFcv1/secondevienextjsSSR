'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
    assertActionAllowed,
    computeAllowedActions
} = require('../../../functions/src/commerce/domain/allowedActions');
const {
    createReturnCase,
    reduceReturnCase
} = require('../../../functions/src/commerce/domain/returnCase');
const {
    createOrderV2,
    reduceOrder
} = require('../../../functions/src/commerce/domain/orderState');
const {
    applyProductAction,
    assertProductIdentity
} = require('../../../functions/src/commerce/domain/productCommands');
const {
    createAdminOrderCommandHandler,
    normalizeShipmentPayload
} = require('../../../functions/src/commerce/v2OrderCommands');
const {
    createClientCancellationHandler
} = require('../../../functions/src/commerce/v2Cancellation');
const {
    createCancellationRuntime,
    createRefundRuntime,
    createReturnRuntime
} = require('../../../functions/src/commerce/domain/v2Runtime');
const {
    createAdminRefundHandler
} = require('../../../functions/src/commerce/v2RefundCommands');
const {
    createAdminOpenReturnHandler,
    createAdminReturnCommandHandler
} = require('../../../functions/src/commerce/v2ReturnCommands');
const {
    fixedClock,
    makeLine,
    makeOrder
} = require('../fixtures/order-v2.cjs');

const laterClock = fixedClock('2026-07-27T10:00:00.000Z');
const repositoryRoot = path.resolve(__dirname, '..', '..', '..');

function paidOrder({ delivered = false, quantity = 1 } = {}) {
    const base = quantity === 1 ? makeOrder() : createOrderV2({
        userId: 'owner-uid-0001',
        clientOrderId: 'client-order-gate4',
        requestHash: 'a'.repeat(64),
        policyVersion: 'policy-0001',
        items: [makeLine({ quantity })],
        shippingCents: 1500,
        customerSnapshot: { email: 'client@example.test' },
        shippingSnapshot: { country: 'FR' },
        clock: laterClock
    });
    let order = reduceOrder(base, {
        type: 'payment_succeeded',
        amountCents: base.amounts.totalCents,
        currency: 'EUR',
        paymentIntentId: 'pi_gate4_0001'
    }, { clock: laterClock });
    if (delivered) {
        order = reduceOrder(order, {
            type: 'fulfillment_shipped',
            trackingNumber: 'TRACK-GATE4'
        }, { clock: laterClock });
        order = reduceOrder(order, {
            type: 'fulfillment_delivered'
        }, { clock: laterClock });
    }
    return { ...order, id: 'order-gate4-0001' };
}

test('allowedActions is server-derived and refuses weak admin or unpaid fulfillment', () => {
    const unpaid = { ...makeOrder(), id: 'order-gate4-0001' };
    assert.deepEqual(
        computeAllowedActions(unpaid, {
            uid: unpaid.userId,
            role: 'customer',
            aal2: false
        }),
        ['request_cancellation']
    );
    assert.deepEqual(
        computeAllowedActions(unpaid, {
            uid: 'admin-gate4',
            role: 'admin',
            aal2: false
        }),
        []
    );
    assert.throws(
        () => assertActionAllowed(unpaid, {
            uid: 'admin-gate4',
            role: 'admin',
            aal2: true
        }, 'fulfillment_ship'),
        { code: 'COMMERCE_ACTION_NOT_ALLOWED' }
    );
    const paid = paidOrder();
    const actions = computeAllowedActions(paid, {
        uid: 'admin-gate4',
        role: 'admin',
        aal2: true
    });
    assert.ok(actions.includes('fulfillment_prepare'));
    assert.ok(actions.includes('request_refund'));
    assert.equal(actions.includes('archive_order'), false);
    const delivered = paidOrder({ delivered: true });
    assert.ok(computeAllowedActions(delivered, {
        uid: 'admin-gate4',
        role: 'admin',
        aal2: true
    }).includes('archive_order'));
});

test('q=5 return supports partial receive, restock one and write-off one', () => {
    const order = paidOrder({ delivered: true, quantity: 5 });
    const value = createReturnCase({
        order,
        returnRequestId: 'return-request-gate4',
        requestedLines: [{ lineId: order.items[0].lineId, quantity: 5 }],
        reason: 'article endommage',
        actor: 'admin-gate4',
        clock: laterClock
    });
    const received = reduceReturnCase(value, {
        type: 'receive',
        lines: [{ lineId: order.items[0].lineId, quantity: 2 }]
    }, { clock: laterClock });
    const restocked = reduceReturnCase(received, {
        type: 'restock',
        lines: [{ lineId: order.items[0].lineId, quantity: 1 }]
    }, { clock: laterClock });
    const writtenOff = reduceReturnCase(restocked, {
        type: 'write_off',
        lines: [{ lineId: order.items[0].lineId, quantity: 1 }]
    }, { clock: laterClock });
    const resolved = reduceReturnCase(writtenOff, {
        type: 'resolve'
    }, { clock: laterClock });
    assert.equal(resolved.lines[0].restockedQty, 1);
    assert.equal(resolved.lines[0].writtenOffQty, 1);
    assert.equal(resolved.status, 'resolved');
});

test('return disposition never exceeds received quantity and pending can be canceled', () => {
    const order = paidOrder({ delivered: true });
    const value = createReturnCase({
        order,
        returnRequestId: 'return-request-cancel',
        requestedLines: [{ lineId: order.items[0].lineId, quantity: 1 }],
        reason: 'changement avis',
        actor: 'admin-gate4',
        clock: laterClock
    });
    assert.throws(
        () => reduceReturnCase(value, {
            type: 'restock',
            lines: [{ lineId: order.items[0].lineId, quantity: 1 }]
        }, { clock: laterClock }),
        { code: 'COMMERCE_RETURN_DISPOSITION_EXCEEDED' }
    );
    assert.throws(
        () => reduceReturnCase(value, {
            type: 'receive',
            lines: [{ lineId: 'unknown-return-line', quantity: 1 }]
        }, { clock: laterClock }),
        { code: 'COMMERCE_RETURN_QUANTITY_INVALID' }
    );
    const canceled = reduceReturnCase(value, { type: 'cancel' }, { clock: laterClock });
    assert.equal(canceled.status, 'canceled');
});

test('product commands separate creation, offer, inventory and publication', () => {
    const actor = { uid: 'admin-gate4', role: 'admin', aal2: true };
    const reason = 'publication initiale controlee';
    const draft = applyProductAction({
        action: 'create_product',
        product: null,
        payload: {
            editorial: {
                name: 'Buffet Gate 4',
                description: 'Buffet restaure avec une description suffisamment detaillee pour le SEO.',
                seoIndexable: true,
                category: 'buffets'
            },
            media: {
                images: ['https://example.test/buffet.webp'],
                imageUrl: 'https://example.test/buffet.webp',
                thumbnails: ['https://example.test/buffet-384.webp']
            }
        },
        actor,
        reason,
        now: laterClock.now()
    });
    assert.equal(draft.status, 'draft');
    assert.equal(draft.stock, 0);
    assert.equal(draft.currentPrice, 0);

    const offered = applyProductAction({
        action: 'update_product_offer',
        product: draft,
        payload: {
            offer: {
                currentPrice: 350,
                startingPrice: 420,
                priceOnRequest: false
            }
        },
        actor,
        reason: 'offre commerciale validee',
        now: laterClock.now()
    });
    const stocked = applyProductAction({
        action: 'adjust_inventory',
        product: offered,
        payload: {
            delta: 1,
            expectedInventoryVersion: 0
        },
        actor,
        reason: 'entree physique controlee',
        now: laterClock.now()
    });
    const published = applyProductAction({
        action: 'publish_product',
        product: stocked,
        payload: { published: true },
        actor,
        reason,
        now: laterClock.now()
    });
    assert.equal(published.status, 'published');
    assert.equal(published.stock, 1);
    assert.equal(published.sold, false);
    assert.equal(published.inventoryVersion, 1);
    assert.equal(published.commerceVersion, 3);
});

test('product command policy rejects weak admin, foreign collections and stock races', () => {
    assert.throws(
        () => assertProductIdentity('legacy_products', 'product-gate4'),
        { code: 'COMMERCE_PRODUCT_COLLECTION_FORBIDDEN' }
    );
    assert.throws(
        () => applyProductAction({
            action: 'create_product',
            product: null,
            payload: {
                editorial: {
                    name: 'Produit interdit',
                    description: '',
                    category: 'buffets'
                },
                media: {}
            },
            actor: { uid: 'admin-gate4', role: 'admin', aal2: false },
            reason: 'test assurance forte',
            now: laterClock.now()
        }),
        { code: 'COMMERCE_PRODUCT_ADMIN_AAL2_REQUIRED' }
    );

    const product = {
        name: 'Produit existant',
        description: 'Description',
        category: 'buffets',
        status: 'draft',
        stock: 2,
        sold: false,
        currentPrice: 100,
        startingPrice: 100,
        priceOnRequest: false,
        inventoryVersion: 4,
        commerceVersion: 8
    };
    assert.throws(
        () => applyProductAction({
            action: 'adjust_inventory',
            product,
            payload: {
                delta: -1,
                expectedInventoryVersion: 3
            },
            actor: { uid: 'admin-gate4', role: 'admin', aal2: true },
            reason: 'version stock obsolete',
            now: laterClock.now()
        }),
        { code: 'COMMERCE_PRODUCT_INVENTORY_ADJUSTMENT_INVALID' }
    );
});

test('product archive is a soft terminal state and never deletes history', () => {
    const archived = applyProductAction({
        action: 'archive_product',
        product: {
            name: 'Produit vendu',
            description: 'Description',
            category: 'buffets',
            status: 'published',
            stock: 0,
            sold: true,
            currentPrice: 250,
            startingPrice: 250,
            priceOnRequest: false,
            inventoryVersion: 2,
            commerceVersion: 5,
            createdAt: '2026-07-26T08:00:00.000Z'
        },
        payload: {},
        actor: { uid: 'admin-gate4', role: 'admin', aal2: true },
        reason: 'piece vendue et dossier conserve',
        now: laterClock.now()
    });
    assert.equal(archived.status, 'archived');
    assert.equal(archived.archivedBy, 'admin-gate4');
    assert.equal(archived.stock, 0);
    assert.equal(archived.createdAt, '2026-07-26T08:00:00.000Z');
    assert.equal(archived.commerceVersion, 6);
});

test('product callable transport is exported but server-control dormant', () => {
    const transport = fs.readFileSync(
        path.join(repositoryRoot, 'functions/src/commerce/v2ProductCommands.js'),
        'utf8'
    );
    const functionsIndex = fs.readFileSync(
        path.join(repositoryRoot, 'functions/index.js'),
        'utf8'
    );
    const client = fs.readFileSync(
        path.join(repositoryRoot, 'src/kit/commerce/adminProductCommandClient.js'),
        'utf8'
    );
    const adminIsland = fs.readFileSync(
        path.join(repositoryRoot, 'app/admin/AdminAppIsland.jsx'),
        'utf8'
    );
    const adminForm = fs.readFileSync(
        path.join(repositoryRoot, 'src/kit/admin/AdminForm.jsx'),
        'utf8'
    );
    for (const functionName of [
        'createProductAdmin',
        'preflightProductMutationAdmin',
        'updateProductOfferAdmin',
        'publishProductAdmin',
        'adjustInventoryAdmin',
        'archiveProductAdmin'
    ]) {
        assert.ok(transport.includes(functionName));
        assert.equal(functionsIndex.includes(functionName), true);
    }
    assert.ok(transport.includes('checkRecentActiveStrongAdmin(context)'));
    assert.ok(transport.includes('enforceAppCheck: true'));
    assert.ok(transport.includes('withCommerceMutationsEnabled'));
    assert.ok(client.includes('COMMERCE_V2_ADMIN_COMMANDS_ENABLED = true'));
    assert.ok(adminIsland.includes('isCommerceReadOnlyTab(adminCollection, commerceMutationsEnabled)'));
    assert.ok(adminIsland.includes("adminMutationMode === 'v2'"));
    assert.equal(adminIsland.includes('deleteDoc'), false);
    assert.equal(adminIsland.includes('updateDoc'), false);
    assert.equal(adminForm.includes('addDoc'), false);
    assert.ok(client.includes('preflightProductMutationAdmin'));
    assert.ok(adminForm.includes('preflightProductMutationAdmin'));
    assert.ok(
        adminForm.indexOf('await preflightProductMutationAdmin()')
        < adminForm.indexOf('await uploadProductVariantSet(')
    );
    assert.ok(adminForm.includes('createProductDraftAdmin'));
    assert.ok(adminForm.includes('updateProductOfferAdmin'));
    assert.ok(adminForm.includes('adjustInventoryAdmin'));
    assert.ok(adminForm.includes('publishProductAdmin'));
});

test('fulfillment callable transport derives its strong admin actor from Auth context', async () => {
    const calls = [];
    const handler = createAdminOrderCommandHandler(
        'fulfillment_ship',
        (data) => ({ trackingNumber: data.trackingNumber }),
        {
            authorize: async (context) => {
                assert.equal(context.auth.uid, 'trusted-admin-uid');
                return { access: { active: true } };
            },
            repositoryFactory: () => ({
                execute: async (request) => {
                    calls.push(request);
                    return { applied: true };
                }
            })
        }
    );
    const result = await handler({
        orderId: 'order-gate4-transport',
        commandId: 'command-gate4-transport',
        expectedVersion: 7,
        reason: 'expedition confirmee',
        trackingNumber: 'TRACK-42',
        uid: 'payload-attacker',
        role: 'customer',
        aal2: false
    }, {
        auth: {
            uid: 'trusted-admin-uid',
            token: {}
        }
    });
    assert.deepEqual(result, { applied: true });
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].actor, {
        uid: 'trusted-admin-uid',
        role: 'admin',
        aal2: true
    });
    assert.equal(calls[0].action, 'fulfillment_ship');
    assert.deepEqual(calls[0].command, {
        commandId: 'command-gate4-transport',
        expectedVersion: 7
    });
    assert.deepEqual(calls[0].payload, { trackingNumber: 'TRACK-42' });
});

test('fulfillment callable transport authorizes before repository access', async () => {
    let repositoryCalls = 0;
    const handler = createAdminOrderCommandHandler(
        'archive_order',
        () => ({}),
        {
            authorize: async () => {
                const error = new Error('weak admin');
                error.code = 'COMMERCE_ACTOR_INVALID';
                throw error;
            },
            repositoryFactory: () => {
                repositoryCalls += 1;
                return { execute: async () => ({}) };
            }
        }
    );
    await assert.rejects(
        handler({
            orderId: 'order-gate4-transport',
            commandId: 'command-gate4-transport',
            expectedVersion: 7,
            reason: 'archive controlee'
        }, {
            auth: {
                uid: 'weak-admin-uid',
                token: {}
            }
        }),
        (error) => error.code === 'permission-denied'
    );
    assert.equal(repositoryCalls, 0);
});

test('fulfillment callable transport rejects path injection and malformed tracking', async () => {
    let repositoryCalls = 0;
    const handler = createAdminOrderCommandHandler(
        'fulfillment_ship',
        normalizeShipmentPayload,
        {
            authorize: async () => ({ access: { active: true } }),
            repositoryFactory: () => {
                repositoryCalls += 1;
                return { execute: async () => ({}) };
            }
        }
    );
    const context = {
        auth: {
            uid: 'trusted-admin-uid',
            token: {}
        }
    };
    await assert.rejects(
        handler({
            orderId: 'order/escaped',
            commandId: 'command-gate4-transport',
            expectedVersion: 7,
            reason: 'expedition controlee'
        }, context),
        (error) => error.code === 'invalid-argument'
    );
    await assert.rejects(
        handler({
            orderId: 'order-gate4-transport',
            commandId: 'command/escaped',
            expectedVersion: 7,
            reason: 'expedition controlee'
        }, context),
        (error) => error.code === 'invalid-argument'
    );
    await assert.rejects(
        handler({
            orderId: 'order-gate4-transport',
            commandId: 'command-gate4-transport',
            expectedVersion: 7,
            reason: 'expedition controlee',
            trackingNumber: { forged: true }
        }, context),
        (error) => error.code === 'invalid-argument'
    );
    assert.equal(repositoryCalls, 0);
});

test('fulfillment and archive callables are exported behind App Check and server control', () => {
    const transport = fs.readFileSync(
        path.join(repositoryRoot, 'functions/src/commerce/v2OrderCommands.js'),
        'utf8'
    );
    const functionsIndex = fs.readFileSync(
        path.join(repositoryRoot, 'functions/index.js'),
        'utf8'
    );
    for (const functionName of [
        'markOrderPreparingAdmin',
        'markOrderReadyForPickupAdmin',
        'markOrderShippedAdmin',
        'markOrderPickedUpAdmin',
        'markOrderDeliveredAdmin',
        'archiveOrderAdmin'
    ]) {
        assert.ok(transport.includes(functionName));
        assert.equal(functionsIndex.includes(functionName), true);
    }
    assert.ok(transport.includes('checkRecentActiveStrongAdmin'));
    assert.ok(transport.includes('enforceAppCheck: true'));
    assert.ok(transport.includes('withCommerceMutationsEnabled'));
    assert.ok(transport.includes('uid: context.auth.uid'));
});

test('client cancellation transport derives ownership from Auth and ignores forged actor payload', async () => {
    const calls = [];
    const handler = createClientCancellationHandler({
        authorize: (context) => {
            assert.equal(context.auth.uid, 'owner-auth-uid');
            return context.auth.uid;
        },
        runtimeFactory: () => ({
            cancellations: {
                requestCancellation: async (request) => {
                    calls.push(request);
                    return { outcome: 'canceled' };
                }
            }
        })
    });
    const result = await handler({
        orderId: 'order-cancellation-transport',
        commandId: 'command-cancellation-transport',
        reason: 'demande du proprietaire',
        ownerUid: 'forged-owner-uid',
        uid: 'forged-owner-uid',
        role: 'admin',
        aal2: true
    }, {
        auth: {
            uid: 'owner-auth-uid',
            token: {}
        }
    });
    assert.deepEqual(result, { outcome: 'canceled' });
    assert.deepEqual(calls, [{
        orderId: 'order-cancellation-transport',
        commandId: 'command-cancellation-transport',
        ownerUid: 'owner-auth-uid',
        reason: 'demande du proprietaire'
    }]);
});

test('client cancellation transport rejects unauthenticated and malformed requests before runtime', async () => {
    let runtimeCalls = 0;
    const runtimeFactory = () => {
        runtimeCalls += 1;
        return {
            cancellations: {
                requestCancellation: async () => ({})
            }
        };
    };
    const handler = createClientCancellationHandler({ runtimeFactory });
    await assert.rejects(
        handler({
            orderId: 'order-cancellation-transport',
            commandId: 'command-cancellation-transport',
            reason: 'demande client'
        }, { auth: null }),
        (error) => error.code === 'unauthenticated'
    );
    await assert.rejects(
        handler({
            orderId: 'order/escaped',
            commandId: 'command-cancellation-transport',
            reason: 'demande client'
        }, {
            auth: { uid: 'owner-auth-uid', token: {} }
        }),
        (error) => error.code === 'invalid-argument'
    );
    await assert.rejects(
        handler({
            orderId: 'order-cancellation-transport',
            commandId: 'command-cancellation-transport',
            reason: 'x'
        }, {
            auth: { uid: 'owner-auth-uid', token: {} }
        }),
        (error) => error.code === 'invalid-argument'
    );
    assert.equal(runtimeCalls, 0);
});

test('client cancellation callable is exported behind App Check, Stripe secret and server control', () => {
    const transport = fs.readFileSync(
        path.join(repositoryRoot, 'functions/src/commerce/v2Cancellation.js'),
        'utf8'
    );
    const functionsIndex = fs.readFileSync(
        path.join(repositoryRoot, 'functions/index.js'),
        'utf8'
    );
    assert.ok(transport.includes('requestOrderCancellation'));
    assert.ok(transport.includes('enforceAppCheck: true'));
    assert.ok(transport.includes('secrets: [STRIPE_SECRET_KEY]'));
    assert.ok(transport.includes('const ownerUid = authorize(context)'));
    assert.ok(transport.includes('withCommerceMutationsEnabled'));
    assert.equal(functionsIndex.includes('requestOrderCancellation'), true);
});

test('client cancellation runtime wires only the provider-first cancellation surface', () => {
    const runtime = createCancellationRuntime({
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
    assert.equal(
        typeof runtime.cancellations.requestCancellation,
        'function'
    );
    assert.deepEqual(Object.keys(runtime), ['cancellations']);
});

test('admin refund transport derives its strong actor from Auth and forwards integer cents', async () => {
    const calls = [];
    const handler = createAdminRefundHandler({
        authorize: async (context) => {
            assert.equal(context.auth.uid, 'trusted-refund-admin');
            return { access: { active: true } };
        },
        runtimeFactory: () => ({
            refunds: {
                requestRefund: async (request) => {
                    calls.push(request);
                    return { outcome: 'succeeded', refundId: 're_transport_1' };
                }
            }
        })
    });
    const result = await handler({
        orderId: 'order-refund-transport',
        refundRequestId: 'refund-request-transport',
        amountCents: 3200,
        reason: 'geste commercial valide',
        uid: 'forged-admin',
        role: 'customer',
        aal2: false
    }, {
        auth: {
            uid: 'trusted-refund-admin',
            token: {}
        }
    });
    assert.deepEqual(result, {
        outcome: 'succeeded',
        refundId: 're_transport_1'
    });
    assert.deepEqual(calls, [{
        orderId: 'order-refund-transport',
        refundRequestId: 'refund-request-transport',
        amountCents: 3200,
        actor: {
            uid: 'trusted-refund-admin',
            role: 'admin',
            aal2: true
        },
        reason: 'geste commercial valide'
    }]);
});

test('admin refund transport authorizes and validates before runtime access', async () => {
    let runtimeCalls = 0;
    const runtimeFactory = () => {
        runtimeCalls += 1;
        return {
            refunds: {
                requestRefund: async () => ({})
            }
        };
    };
    const weakHandler = createAdminRefundHandler({
        authorize: async () => {
            const error = new Error('weak admin');
            error.code = 'COMMERCE_ACTOR_INVALID';
            throw error;
        },
        runtimeFactory
    });
    await assert.rejects(
        weakHandler({
            orderId: 'order-refund-transport',
            refundRequestId: 'refund-request-transport',
            amountCents: 3200,
            reason: 'geste commercial valide'
        }, {
            auth: { uid: 'weak-refund-admin', token: {} }
        }),
        (error) => error.code === 'permission-denied'
    );
    const handler = createAdminRefundHandler({
        authorize: async () => ({ access: { active: true } }),
        runtimeFactory
    });
    await assert.rejects(
        handler({
            orderId: 'order/refund-escaped',
            refundRequestId: 'refund-request-transport',
            amountCents: 3200,
            reason: 'geste commercial valide'
        }, {
            auth: { uid: 'trusted-refund-admin', token: {} }
        }),
        (error) => error.code === 'invalid-argument'
    );
    await assert.rejects(
        handler({
            orderId: 'order-refund-transport',
            refundRequestId: 'refund-request-transport',
            amountCents: '3200',
            reason: 'geste commercial valide'
        }, {
            auth: { uid: 'trusted-refund-admin', token: {} }
        }),
        (error) => error.code === 'invalid-argument'
    );
    assert.equal(runtimeCalls, 0);
});

test('admin refund callable is exported behind strong auth and server control', () => {
    const transport = fs.readFileSync(
        path.join(repositoryRoot, 'functions/src/commerce/v2RefundCommands.js'),
        'utf8'
    );
    const functionsIndex = fs.readFileSync(
        path.join(repositoryRoot, 'functions/index.js'),
        'utf8'
    );
    assert.ok(transport.includes('requestRefundAdmin'));
    assert.ok(transport.includes('checkRecentActiveStrongAdmin'));
    assert.ok(transport.includes('enforceAppCheck: true'));
    assert.ok(transport.includes('secrets: [STRIPE_SECRET_KEY]'));
    assert.ok(transport.includes('uid: context.auth.uid'));
    assert.ok(transport.includes('withCommerceMutationsEnabled'));
    assert.equal(functionsIndex.includes('requestRefundAdmin'), true);
});

test('admin refund runtime wires only the resumable refund surface', () => {
    const runtime = createRefundRuntime({
        db: {
            doc: (documentPath) => ({ path: documentPath }),
            runTransaction: async () => {
                throw new Error('not executed during wiring test');
            }
        },
        stripe: {
            refunds: {
                create: async () => ({}),
                retrieve: async () => ({})
            }
        },
        appId: 'secondevie'
    });
    assert.equal(typeof runtime.refunds.requestRefund, 'function');
    assert.deepEqual(Object.keys(runtime), ['refunds']);
});

test('admin return opening derives its actor from Auth and preserves line quantities', async () => {
    const calls = [];
    const handler = createAdminOpenReturnHandler({
        authorize: async (context) => {
            assert.equal(context.auth.uid, 'trusted-return-admin');
            return { access: { active: true } };
        },
        runtimeFactory: () => ({
            returns: {
                create: async (request) => {
                    calls.push(request);
                    return { returnCase: { returnId: 'return-transport-1' } };
                }
            }
        })
    });
    const result = await handler({
        orderId: 'order-return-transport',
        returnRequestId: 'return-request-transport',
        requestedLines: [
            { lineId: 'line-return-a', quantity: 2 },
            { lineId: 'line-return-b', quantity: 1 }
        ],
        reason: 'retour physique confirme',
        uid: 'forged-admin',
        role: 'customer',
        aal2: false
    }, {
        auth: { uid: 'trusted-return-admin', token: {} }
    });
    assert.deepEqual(result, {
        returnCase: { returnId: 'return-transport-1' }
    });
    assert.deepEqual(calls, [{
        orderId: 'order-return-transport',
        returnRequestId: 'return-request-transport',
        requestedLines: [
            { lineId: 'line-return-a', quantity: 2 },
            { lineId: 'line-return-b', quantity: 1 }
        ],
        actor: {
            uid: 'trusted-return-admin',
            role: 'admin',
            aal2: true
        },
        reason: 'retour physique confirme'
    }]);
});

test('admin return transitions use fixed event types and server Auth actor', async () => {
    const calls = [];
    const handler = createAdminReturnCommandHandler(
        'write_off',
        { withLines: true },
        {
            authorize: async () => ({ access: { active: true } }),
            runtimeFactory: () => ({
                returns: {
                    apply: async (request) => {
                        calls.push(request);
                        return { returnStatus: 'received' };
                    }
                }
            })
        }
    );
    const result = await handler({
        orderId: 'order-return-transport',
        returnId: 'return-case-transport',
        commandId: 'return-command-transport',
        expectedVersion: 3,
        lines: [{ lineId: 'line-return-a', quantity: 1 }],
        event: { type: 'restock' },
        reason: 'article non revendable',
        uid: 'forged-admin'
    }, {
        auth: { uid: 'trusted-return-admin', token: {} }
    });
    assert.deepEqual(result, { returnStatus: 'received' });
    assert.deepEqual(calls, [{
        orderId: 'order-return-transport',
        returnId: 'return-case-transport',
        commandId: 'return-command-transport',
        expectedVersion: 3,
        event: {
            type: 'write_off',
            lines: [{ lineId: 'line-return-a', quantity: 1 }]
        },
        actor: {
            uid: 'trusted-return-admin',
            role: 'admin',
            aal2: true
        },
        reason: 'article non revendable'
    }]);
});

test('admin return transport authorizes and validates before runtime access', async () => {
    let runtimeCalls = 0;
    const runtimeFactory = () => {
        runtimeCalls += 1;
        return {
            returns: {
                create: async () => ({}),
                apply: async () => ({})
            }
        };
    };
    const weakHandler = createAdminOpenReturnHandler({
        authorize: async () => {
            const error = new Error('weak admin');
            error.code = 'COMMERCE_ACTOR_INVALID';
            throw error;
        },
        runtimeFactory
    });
    await assert.rejects(
        weakHandler({
            orderId: 'order-return-transport',
            returnRequestId: 'return-request-transport',
            requestedLines: [{ lineId: 'line-return-a', quantity: 1 }],
            reason: 'retour physique confirme'
        }, {
            auth: { uid: 'weak-return-admin', token: {} }
        }),
        (error) => error.code === 'permission-denied'
    );
    const openingHandler = createAdminOpenReturnHandler({
        authorize: async () => ({ access: { active: true } }),
        runtimeFactory
    });
    await assert.rejects(
        openingHandler({
            orderId: 'order-return-transport',
            returnRequestId: 'return-request-transport',
            requestedLines: [
                { lineId: 'line-return-a', quantity: 1 },
                { lineId: 'line-return-a', quantity: 1 }
            ],
            reason: 'retour physique confirme'
        }, {
            auth: { uid: 'trusted-return-admin', token: {} }
        }),
        (error) => error.code === 'invalid-argument'
    );
    const transitionHandler = createAdminReturnCommandHandler(
        'receive',
        { withLines: true },
        {
            authorize: async () => ({ access: { active: true } }),
            runtimeFactory
        }
    );
    await assert.rejects(
        transitionHandler({
            orderId: 'order-return-transport',
            returnId: 'return-case-transport',
            commandId: 'return-command-transport',
            expectedVersion: -1,
            lines: [{ lineId: 'line-return-a', quantity: 1 }],
            reason: 'reception physique'
        }, {
            auth: { uid: 'trusted-return-admin', token: {} }
        }),
        (error) => error.code === 'invalid-argument'
    );
    assert.equal(runtimeCalls, 0);
});

test('admin return callables are exported behind strong auth and server control', () => {
    const transport = fs.readFileSync(
        path.join(repositoryRoot, 'functions/src/commerce/v2ReturnCommands.js'),
        'utf8'
    );
    const functionsIndex = fs.readFileSync(
        path.join(repositoryRoot, 'functions/index.js'),
        'utf8'
    );
    for (const name of [
        'openReturnAdmin',
        'cancelReturnAdmin',
        'markReturnReceivedAdmin',
        'restockReturnLinesAdmin',
        'writeOffReturnLinesAdmin',
        'resolveReturnAdmin'
    ]) {
        assert.ok(transport.includes(name));
        assert.equal(functionsIndex.includes(name), true);
    }
    assert.ok(transport.includes('checkRecentActiveStrongAdmin'));
    assert.ok(transport.includes('enforceAppCheck: true'));
    assert.ok(transport.includes('withCommerceMutationsEnabled'));
    assert.ok(transport.includes('uid: context.auth.uid'));
    assert.equal(transport.includes('data?.event'), false);
});

test('admin return runtime wires only the quantitative return surface', () => {
    const runtime = createReturnRuntime({
        db: {
            doc: (documentPath) => ({ path: documentPath }),
            runTransaction: async () => {
                throw new Error('not executed during wiring test');
            }
        },
        appId: 'secondevie'
    });
    assert.equal(typeof runtime.returns.create, 'function');
    assert.equal(typeof runtime.returns.apply, 'function');
    assert.deepEqual(Object.keys(runtime), ['returns']);
});
