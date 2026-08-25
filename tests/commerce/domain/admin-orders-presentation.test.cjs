'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const test = require('node:test');

const presentationUrl = pathToFileURL(path.resolve(
    __dirname,
    '../../../src/kit/admin/components/orders/orderPresentation.js'
)).href;

const loadPresentation = () => import(presentationUrl);

function order({
    allowedActions = [],
    capturedCents = 12000,
    custody = 'merchant',
    fulfillment = 'unfulfilled',
    hasFailure = false,
    id = 'order-test',
    orderNumber = 132,
    refund = 'none',
    status = 'paid',
} = {}) {
    return {
        id,
        orderNumber,
        schemaVersion: 2,
        status,
        payment: { status: 'succeeded' },
        fulfillmentSummary: { status: fulfillment, custody },
        refundAggregate: { status: refund, hasFailure },
        amounts: { capturedCents, totalCents: capturedCents },
        total: capturedCents / 100,
        shipping: { fullName: `Client ${id}`, city: 'Marseille' },
        items: [{ name: `Article ${id}`, quantity: 1, price: capturedCents / 100 }],
        allowedActions,
    };
}

test('sales reference and CSV use C orderNumber without opaque fallback', async () => {
    const { buildCsvRows, orderReference } = await loadPresentation();
    const current = order({ id: 'order-opaque', orderNumber: 132 });
    assert.equal(orderReference(current), 'C132');
    assert.equal(orderReference({ id: 'order-opaque' }), 'Référence indisponible');
    assert.equal(buildCsvRows([current])[0]['Référence commande'], 'C132');
    assert.equal(Object.hasOwn(buildCsvRows([current])[0], 'ID Commande'), false);
});

test('sales segments keep refunded goods on site actionable and close departed goods', async () => {
    const { getOrderSegment, isRefundedWithGoodsOnSite } = await loadPresentation();
    const onSite = order({ refund: 'full', status: 'refunded', custody: 'merchant' });
    const delivered = order({
        refund: 'full',
        status: 'refunded',
        custody: 'customer',
        fulfillment: 'delivered',
    });

    assert.equal(isRefundedWithGoodsOnSite(onSite), true);
    assert.equal(getOrderSegment(onSite), 'todo');
    assert.equal(isRefundedWithGoodsOnSite(delivered), false);
    assert.equal(getOrderSegment(delivered), 'done');
});

test('sales presentation distinguishes open refund failure and partial refund', async () => {
    const { getOrderJourney, getOrderSegment } = await loadPresentation();
    const failed = order({ refund: 'pending', hasFailure: true, status: 'refund_pending' });
    const partial = order({ refund: 'partial', status: 'paid' });

    assert.equal(getOrderSegment(failed), 'todo');
    assert.equal(getOrderJourney(failed).label, 'Remboursement à vérifier');
    assert.equal(getOrderJourney(partial).detail, 'Remboursement partiel');
});

test('sales action plan rejects stale fulfillment actions during blocked refunds', async () => {
    const { buildActionPlan } = await loadPresentation();
    const staleFull = order({
        refund: 'full',
        status: 'refunded',
        fulfillment: 'ready_for_pickup',
        allowedActions: ['fulfillment_pickup'],
    });
    const stalePending = order({
        refund: 'pending',
        status: 'refund_pending',
        allowedActions: ['fulfillment_prepare', 'fulfillment_ship'],
    });
    const partial = order({
        refund: 'partial',
        allowedActions: ['fulfillment_prepare'],
    });

    assert.equal(buildActionPlan(staleFull).primary, null);
    assert.equal(buildActionPlan(stalePending).primary, null);
    assert.equal(buildActionPlan(partial).primary?.id, 'fulfillment_prepare');
});

test('all sales are ordered by actionability while preserving order inside each segment', async () => {
    const { filterOrders } = await loadPresentation();
    const closed = order({ id: 'closed', fulfillment: 'delivered', custody: 'customer', status: 'completed' });
    const waiting = order({ id: 'waiting', fulfillment: 'ready_for_pickup' });
    const todoFirst = order({ id: 'todo-first' });
    const todoSecond = order({ id: 'todo-second', fulfillment: 'preparing' });

    assert.deepEqual(
        filterOrders([closed, waiting, todoFirst, todoSecond]).map(({ id }) => id),
        ['todo-first', 'todo-second', 'waiting', 'closed']
    );
});

test('sales summary exposes loaded scope and gross captured amount', async () => {
    const { buildOrdersSummary } = await loadPresentation();
    const summary = buildOrdersSummary([
        order({ id: 'paid', capturedCents: 12000 }),
        order({ id: 'refunded', capturedCents: 8000, refund: 'full', status: 'refunded' }),
    ]);

    assert.equal(summary.total, 2);
    assert.equal(summary.todo, 2);
    assert.equal(summary.grossCapturedAmount, 200);
    assert.equal(Object.hasOwn(summary, 'collectedAmount'), false);
});
