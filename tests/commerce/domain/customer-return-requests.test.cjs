'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
    createCustomerReturnRequest,
    transitionCustomerReturnRequest,
    validateCustomerReturnRequest
} = require('../../../functions/src/commerce/domain/customerReturnRequest');
const {
    calculateRequestedRefundAmount,
    createAdminCustomerReturnDecisionHandler,
    createCustomerReturnRequestHandler
} = require('../../../functions/src/commerce/v2CustomerReturnRequests');
const { reduceOrder } = require('../../../functions/src/commerce/domain/orderState');
const { fixedClock, makeOrder } = require('../fixtures/order-v2.cjs');

const repositoryRoot = path.resolve(__dirname, '..', '..', '..');

function snapshot(value, reference = null) {
    return {
        exists: value !== undefined,
        data: () => value,
        ref: reference
    };
}

function fakeDb(initial = {}) {
    const values = new Map(Object.entries(initial));
    const reference = (documentPath) => ({
        path: documentPath,
        get: async () => snapshot(values.get(documentPath))
    });
    return {
        values,
        doc: reference,
        runTransaction: async (run) => run({
            get: async (ref) => snapshot(values.get(ref.path), ref),
            set: (ref, value) => values.set(ref.path, value)
        })
    };
}

function paidOrder() {
    const order = makeOrder();
    return reduceOrder(order, {
        type: 'payment_succeeded',
        amountCents: order.amounts.totalCents,
        currency: 'EUR',
        paymentIntentId: 'pi_customer_return'
    }, { clock: fixedClock() });
}

test('customer return request model keeps review, return and refund as separate states', () => {
    const order = { ...paidOrder(), id: 'order-customer-return' };
    const request = createCustomerReturnRequest({
        requestId: 'customer-return-request-1',
        order,
        lines: [{ lineId: 'line-0001', quantity: 1 }],
        reason: 'changed_mind',
        note: 'Je souhaite annuler mon achat.',
        requestHash: 'a'.repeat(64),
        clock: fixedClock()
    });
    assert.equal(request.status, 'pending_review');
    assert.equal(request.resolutionMode, null);
    assert.equal(validateCustomerReturnRequest(request), true);

    const authorized = transitionCustomerReturnRequest(request, {
        type: 'authorize_return',
        returnId: 'return-case-1',
        actorUid: 'admin-uid-1',
        reason: 'La piece a quitte l atelier'
    }, { clock: fixedClock() });
    assert.equal(authorized.status, 'return_authorized');
    assert.equal(authorized.resolutionMode, 'return_then_refund');

    const completed = transitionCustomerReturnRequest(authorized, {
        type: 'refund_started',
        mode: 'return_then_refund',
        refundRequestId: 'customer-refund-1',
        outcome: 'succeeded',
        actorUid: 'admin-uid-1',
        reason: 'Retour recu et inspecte'
    }, { clock: fixedClock() });
    assert.equal(completed.status, 'completed');
});

test('customer request transport derives ownership and queues one admin notification', async () => {
    const order = paidOrder();
    const db = fakeDb({ 'orders/order-customer-return': order });
    const handler = createCustomerReturnRequestHandler({
        dbFactory: () => db,
        requestClock: {
            now: () => '2026-08-01T10:00:00.000Z',
            nowMillis: () => 1785578400000
        }
    });
    const result = await handler({
        orderId: 'order-customer-return',
        requestId: 'customer-return-request-transport',
        lines: [{ lineId: 'line-0001', quantity: 1 }],
        reason: 'changed_mind',
        note: 'Demande depuis mon espace.'
    }, {
        auth: { uid: order.userId, token: { email: 'client@example.test' } }
    });
    assert.equal(result.request.status, 'pending_review');
    assert.equal(
        db.values.get('orders/order-customer-return/customer_return_requests/customer-return-request-transport').userId,
        order.userId
    );
    const outboxes = [...db.values.entries()].filter(([key]) => key.startsWith('commerce_outbox/'));
    assert.equal(outboxes.length, 1);
    assert.equal(outboxes[0][1].template, 'customer-return-requested-admin');
    assert.equal(outboxes[0][1].recipientRole, 'admin');
});

test('admin chooses direct refund at merchant or return workflow after shipment', async () => {
    const merchantOrder = paidOrder();
    const request = createCustomerReturnRequest({
        requestId: 'customer-return-decision',
        order: { ...merchantOrder, id: 'order-decision' },
        lines: [{ lineId: 'line-0001', quantity: 1 }],
        reason: 'changed_mind',
        note: '',
        requestHash: 'b'.repeat(64),
        clock: fixedClock()
    });
    const db = fakeDb({
        'orders/order-decision': merchantOrder,
        'orders/order-decision/customer_return_requests/customer-return-decision': request
    });
    const refundCalls = [];
    const handler = createAdminCustomerReturnDecisionHandler({
        authorize: async () => ({ access: { active: true } }),
        runtimeFactory: () => ({
            db,
            refunds: {
                requestRefund: async (input) => {
                    refundCalls.push(input);
                    return { outcome: 'succeeded', refundId: 're_customer_return' };
                }
            },
            returns: { create: async () => assert.fail('return should not open') }
        }),
        decisionClock: fixedClock('2026-08-01T11:00:00.000Z')
    });
    const result = await handler({
        orderId: 'order-decision',
        requestId: 'customer-return-decision',
        decision: 'refund_now',
        reason: 'Piece encore a l atelier'
    }, { auth: { uid: 'admin-strong-uid', token: {} } });
    assert.equal(result.request.status, 'completed');
    assert.equal(result.request.resolutionMode, 'direct_refund');
    assert.equal(refundCalls[0].amountCents, merchantOrder.amounts.capturedCents);

    const shipped = reduceOrder(merchantOrder, {
        type: 'fulfillment_shipped',
        carrierCode: 'other',
        carrierName: 'Transport test',
        trackingNumber: null
    }, { clock: fixedClock() });
    db.values.set('orders/order-decision', shipped);
    db.values.set('orders/order-decision/customer_return_requests/customer-return-shipped', {
        ...request,
        requestId: 'customer-return-shipped',
        requestHash: 'c'.repeat(64)
    });
    await assert.rejects(
        handler({
            orderId: 'order-decision',
            requestId: 'customer-return-shipped',
            decision: 'refund_now',
            reason: 'Tentative directe apres expedition'
        }, { auth: { uid: 'admin-strong-uid', token: {} } }),
        (error) => error.code === 'failed-precondition'
    );
});

test('refund amount follows requested lines and never exceeds the captured balance', () => {
    const order = paidOrder();
    const firstLine = order.items[0];
    const extraLine = {
        ...firstLine,
        lineId: 'line-0002',
        quantity: 1,
        unitAmountCents: 2500
    };
    const multiLineOrder = {
        ...order,
        items: [firstLine, extraLine],
        amounts: {
            ...order.amounts,
            itemsCents: order.amounts.itemsCents + 2500,
            totalCents: order.amounts.totalCents + 2500,
            capturedCents: order.amounts.capturedCents + 2500,
            netCents: order.amounts.netCents + 2500
        }
    };
    assert.equal(
        calculateRequestedRefundAmount(multiLineOrder, [{ lineId: 'line-0002', quantity: 1 }]),
        2500
    );
    assert.equal(
        calculateRequestedRefundAmount(multiLineOrder, [
            { lineId: firstLine.lineId, quantity: firstLine.quantity },
            { lineId: 'line-0002', quantity: 1 }
        ]),
        multiLineOrder.amounts.capturedCents
    );
});

test('client and admin surfaces use the durable request workflow', () => {
    const functionsIndex = fs.readFileSync(path.join(repositoryRoot, 'functions/index.js'), 'utf8');
    const myOrders = fs.readFileSync(path.join(repositoryRoot, 'src/kit/commerce/MyOrdersView.jsx'), 'utf8');
    const adminReturns = fs.readFileSync(path.join(repositoryRoot, 'src/kit/admin/AdminReturns.jsx'), 'utf8');
    const emails = fs.readFileSync(path.join(repositoryRoot, 'functions/src/email/commerceEmailTemplates.js'), 'utf8');
    for (const name of [
        'requestCustomerReturn',
        'decideCustomerReturnRequestAdmin',
        'listCustomerReturnRequestsAdminV2'
    ]) {
        assert.equal(functionsIndex.includes(name), true);
    }
    assert.equal(myOrders.includes('mailto:'), false);
    assert.equal(myOrders.includes('requestCustomerReturn'), true);
    assert.equal(adminReturns.includes('Rembourser maintenant'), true);
    assert.equal(adminReturns.includes("openCustomerDecision(request, 'refund_after_return')"), true);
    assert.equal(emails.includes('customer-return-requested-admin'), true);
});
