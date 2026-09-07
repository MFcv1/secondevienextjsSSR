'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { createReturnCase, reduceReturnCase } = require('../../../functions/src/commerce/domain/returnCase');
const { createRefundRepository } = require('../../../functions/src/commerce/domain/refundRepository');
const { createReturnRepository } = require('../../../functions/src/commerce/domain/returnRepository');
const { createCustomerReturnRequest, isReturnReceiptComplete } = require('../../../functions/src/commerce/domain/customerReturnRequest');
const { createAdminCustomerReturnDecisionHandler } = require('../../../functions/src/commerce/v2CustomerReturnRequests');
const { reduceOrder } = require('../../../functions/src/commerce/domain/orderState');
const { makeOrder, fixedClock } = require('../fixtures/order-v2.cjs');

const clock = fixedClock();
const actor = { uid: 'admin-audit', role: 'admin', aal2: true };
const orderId = 'order-return-audit';
const requestId = 'request-return-audit';
const requestPath = `orders/${orderId}/customer_return_requests/${requestId}`;

function fixture() {
    const base = makeOrder();
    base.payment.connectedAccountId = 'acct_auditreturns';
    const order = { ...reduceOrder(base, { type: 'payment_succeeded', amountCents: base.amounts.totalCents, currency: 'EUR', paymentIntentId: 'pi_auditreturns' }, { clock }), id: orderId };
    const request = createCustomerReturnRequest({ requestId, order, lines: [{ lineId: 'line-0001', quantity: 1 }], reason: 'changed_mind', note: '', requestHash: 'a'.repeat(64), clock });
    const records = new Map([[`orders/${orderId}`, order], [requestPath, request]]);
    const snapshot = ref => ({ exists: records.has(ref.path), data: () => structuredClone(records.get(ref.path)) });
    const doc = path => ({ path, get: async () => snapshot({ path }) });
    const db = { doc, async runTransaction(run) {
        const writes = [];
        const result = await run({ get: async ref => snapshot(ref), set: (ref, data) => writes.push([ref.path, data]), update: (ref, data) => writes.push([ref.path, { ...records.get(ref.path), ...data }]) });
        writes.forEach(([path, data]) => records.set(path, data));
        return result;
    } };
    const refs = {
        order: id => doc(`orders/${id}`),
        refundAttempt: (id, refundId) => doc(`orders/${id}/refunds/${refundId}`),
        auditEvent: (id, eventId) => doc(`orders/${id}/events/${eventId}`),
        returnCase: (id, returnId) => doc(`orders/${id}/returns/${returnId}`),
        customerReturnRequest: (id, requestId) => doc(`orders/${id}/customer_return_requests/${requestId}`),
        returnAllocation: (id, lineId) => doc(`allocations/${id}-${lineId}`),
    };
    for (const key of ['financialFact', 'financialDaily', 'financialTotals', 'outbox', 'document', 'reservation', 'product', 'movement', 'commandResult']) refs[key] = id => doc(`${key}/${id}`);
    return { db, records, order, request, refs };
}

test('return cannot resolve without a receipt; a partial receipt does not authorize refund of all requested items', () => {
    const { order, request } = fixture();
    const delivered = reduceOrder(reduceOrder(order, { type: 'fulfillment_shipped' }, { clock }), { type: 'fulfillment_delivered' }, { clock });
    const pending = createReturnCase({ order: delivered, returnRequestId: requestId, requestedLines: request.lines, reason: 'audit return', actor: actor.uid, clock });
    assert.throws(() => reduceReturnCase(pending, { type: 'resolve' }, { clock }), { code: 'COMMERCE_RETURN_RESOLUTION_INCOMPLETE' });
    const receipt = { ...pending, status: 'resolved', lines: pending.lines.map(line => ({ ...line, receivedQty: 1, restockedQty: 1 })) };
    assert.equal(isReturnReceiptComplete(receipt, request), true);
    assert.equal(isReturnReceiptComplete(receipt, { ...request, lines: [{ lineId: 'line-0001', quantity: 2 }] }), false);
    assert.equal(isReturnReceiptComplete({ ...receipt, orderId: 'other-order' }, request), false);
});

test('refund preparation rechecks a rejected request and changed custody before any money is reserved', async () => {
    for (const change of ['reject', 'ship']) {
        const f = fixture();
        if (change === 'reject') f.records.set(requestPath, { ...f.request, status: 'rejected', resolutionMode: 'rejected' });
        else f.records.set(`orders/${orderId}`, reduceOrder(f.order, { type: 'fulfillment_shipped' }, { clock }));
        const repository = createRefundRepository({ ...f, clock });
        const before = [...f.records.keys()];
        await assert.rejects(repository.prepareRefund({ orderId, refundRequestId: `customer-${requestId}`, amountCents: 1000, actor, reason: 'audit refund', customerRequestId: requestId, customerDecision: 'refund_now' }), error => /TRANSITION_DENIED|CUSTODY_INVALID/.test(error.code));
        assert.deepEqual([...f.records.keys()], before);
        assert.equal(f.records.get(`orders/${orderId}`).refundAggregate.pendingCents, 0);
    }
});

test('customer request checks are wired through the actual refund and return runtimes', async () => {
    const { createRefundRuntime, createReturnRuntime } = require('../../../functions/src/commerce/domain/v2Runtime');
    const f = fixture();
    f.records.set(requestPath, { ...f.request, status: 'rejected', resolutionMode: 'rejected' });
    const runtime = createRefundRuntime({
        db: f.db, appId: 'audit-app', clock,
        stripe: { refunds: { create: async () => assert.fail('no provider call'), retrieve: async () => assert.fail('no provider call') } }
    });
    await assert.rejects(runtime.refunds.requestRefund({ orderId, refundRequestId: `customer-${requestId}`, amountCents: 1000, actor, reason: 'audit refund', customerRequestId: requestId, customerDecision: 'refund_now' }), { code: 'COMMERCE_CUSTOMER_RETURN_REQUEST_TRANSITION_DENIED' });
    f.records.set(`orders/${orderId}`, reduceOrder(f.order, { type: 'fulfillment_shipped' }, { clock }));
    const returns = createReturnRuntime({ db: f.db, appId: 'audit-app', clock });
    await assert.rejects(returns.returns.create({ orderId, returnRequestId: requestId, requestedLines: f.request.lines, actor, reason: 'audit return', customerRequestId: requestId }), { code: 'COMMERCE_CUSTOMER_RETURN_REQUEST_TRANSITION_DENIED' });
});

test('refund preparation records customer intent in the same transaction, preventing a competing rejection', async () => {
    const f = fixture();
    const repository = createRefundRepository({ ...f, clock });
    await repository.prepareRefund({ orderId, refundRequestId: `customer-${requestId}`, amountCents: 1000, actor, reason: 'audit refund', customerRequestId: requestId, customerDecision: 'refund_now' });
    assert.equal(f.records.get(requestPath).status, 'refund_initiated');
    assert.equal(f.records.get(requestPath).refundRequestId, `customer-${requestId}`);
    const handler = createAdminCustomerReturnDecisionHandler({ authorize: async () => {}, runtimeFactory: () => ({ db: f.db }), decisionClock: clock });
    await assert.rejects(handler({ orderId, requestId, decision: 'reject', reason: 'stale rejection' }, { auth: actor }), { code: 'failed-precondition' });
});

test('return creation rechecks the customer request before allocating returned quantities', async () => {
    const f = fixture();
    f.records.set(`orders/${orderId}`, reduceOrder(f.order, { type: 'fulfillment_shipped' }, { clock }));
    f.records.set(requestPath, { ...f.request, status: 'rejected', resolutionMode: 'rejected' });
    const repository = createReturnRepository({ ...f, clock });
    await assert.rejects(repository.create({ orderId, returnRequestId: requestId, requestedLines: f.request.lines, actor, reason: 'audit return', customerRequestId: requestId }), { code: 'COMMERCE_CUSTOMER_RETURN_REQUEST_TRANSITION_DENIED' });
    assert.equal(f.records.size, 2);
});

test('refund retry uses the stored attempt amount when all captured money is already pending', async () => {
    const f = fixture();
    const repository = createRefundRepository({ ...f, clock });
    let calls = 0;
    const refunds = { async requestRefund(input) {
        const result = await repository.prepareRefund(input);
        calls++;
        if (calls === 1) throw Object.assign(new Error('provider unknown'), { code: 'COMMERCE_REFUND_RESULT_UNKNOWN' });
        assert.equal(result.reused, true);
        assert.equal(input.amountCents, f.order.amounts.capturedCents);
        return { outcome: 'pending' };
    } };
    const handler = createAdminCustomerReturnDecisionHandler({ authorize: async () => {}, runtimeFactory: () => ({ db: f.db, refunds }), decisionClock: clock });
    const input = { orderId, requestId, decision: 'refund_now', reason: 'audit refund' };
    await assert.rejects(handler(input, { auth: actor }));
    assert.equal(f.records.get(`orders/${orderId}`).refundAggregate.pendingCents, f.order.amounts.capturedCents);
    assert.equal((await handler(input, { auth: actor })).outcome, 'pending');
    f.records.set(requestPath, { ...f.records.get(requestPath), status: 'completed' });
    assert.equal((await handler(input, { auth: actor })).request.status, 'completed');
});
