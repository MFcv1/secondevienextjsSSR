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

test('product callable transport is AAL2/App Check guarded and remains dormant', () => {
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
        'updateProductOfferAdmin',
        'publishProductAdmin',
        'adjustInventoryAdmin',
        'archiveProductAdmin'
    ]) {
        assert.ok(transport.includes(functionName));
        assert.equal(functionsIndex.includes(functionName), false);
    }
    assert.ok(transport.includes('checkRecentActiveStrongAdmin(context)'));
    assert.ok(transport.includes('enforceAppCheck: true'));
    assert.ok(client.includes('COMMERCE_V2_ADMIN_COMMANDS_ENABLED = false'));
    assert.ok(adminIsland.includes('isCommerceReadOnlyTab(adminCollection)'));
    assert.equal(adminIsland.includes('deleteDoc'), false);
    assert.equal(adminIsland.includes('updateDoc'), false);
    assert.equal(adminForm.includes('addDoc'), false);
    assert.ok(adminForm.includes('createProductDraftAdmin'));
    assert.ok(adminForm.includes('updateProductOfferAdmin'));
    assert.ok(adminForm.includes('adjustInventoryAdmin'));
    assert.ok(adminForm.includes('publishProductAdmin'));
});
