'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { assertProviderCreateWindow, PROVIDER_CREATE_WINDOW_MS } = require('../../../functions/src/commerce/domain/providerCreateWindow');
const { createCheckoutSagaService } = require('../../../functions/src/commerce/domain/checkoutSagaService');
const { createRefundSagaService } = require('../../../functions/src/commerce/domain/refundSagaService');
const { createPaymentAttempt } = require('../../../functions/src/commerce/domain/checkoutSaga');
const { createRefundAttempt } = require('../../../functions/src/commerce/domain/refundSaga');
const { reduceOrder } = require('../../../functions/src/commerce/domain/orderState');
const { fixedClock, makeOrder } = require('../fixtures/order-v2.cjs');

const createdAt = '2026-09-01T10:00:00.000Z';
const creationClock = fixedClock(createdAt);
const expiredClock = fixedClock('2026-09-03T10:00:00.000Z');

test('provider creation window is immutable, strict and rejects missing or future timestamps', () => {
    const millis = Date.parse(createdAt);
    assert.doesNotThrow(() => assertProviderCreateWindow({ createdAt }, fixedClock(new Date(millis + PROVIDER_CREATE_WINDOW_MS - 1).toISOString())));
    for (const timestamp of [createdAt, undefined, 'invalid', '2026-09-04T10:00:00.000Z']) {
        assert.throws(() => assertProviderCreateWindow({ createdAt: timestamp, updatedAt: expiredClock.now() }, expiredClock), { code: 'COMMERCE_PROVIDER_RECONCILIATION_REQUIRED' });
    }
    assert.throws(() => assertProviderCreateWindow({ createdAt }, fixedClock(new Date(millis + PROVIDER_CREATE_WINDOW_MS).toISOString())), { code: 'COMMERCE_PROVIDER_RECONCILIATION_REQUIRED' });
});

test('expired unresolved checkout cannot recreate a payment even to cancel it or release stock', async () => {
    const effects = [];
    const effect = async () => { effects.push('unexpected'); };
    const service = createCheckoutSagaService({
        stripe: { createPaymentIntent: effect, retrievePaymentIntent: effect, cancelPaymentIntent: effect },
        repository: { saveAttempt: effect, releaseHeldInventory: effect, commitHeldInventory: effect },
        clock: expiredClock,
    });
    const attempt = createPaymentAttempt({ orderId: 'order-audit-window', attemptId: 'attempt-audit-window', requestHash: 'a'.repeat(64), connectedAccountId: 'acct_auditwindow', clock: creationClock });
    for (const status of ['create_pending', 'create_inflight', 'create_unknown']) {
        const candidate = { ...attempt, status };
        await assert.rejects(service.ensurePaymentIntent({ order: {}, attempt: candidate }), { code: 'COMMERCE_PROVIDER_RECONCILIATION_REQUIRED' });
        await assert.rejects(service.cancelProviderFirst({ order: {}, attempt: candidate }), { code: 'COMMERCE_PROVIDER_RECONCILIATION_REQUIRED' });
    }
    assert.deepEqual(effects, []);
});

test('old unidentified refund never sends another create; a known refund remains reconcilable', async () => {
    const base = makeOrder();
    base.payment.connectedAccountId = 'acct_auditwindow';
    const order = { ...reduceOrder(base, { type: 'payment_succeeded', amountCents: base.amounts.totalCents, currency: 'EUR', paymentIntentId: 'pi_auditwindow' }, { clock: creationClock }), id: 'order-audit-window' };
    const attempt = createRefundAttempt({ order, refundRequestId: 'refund-audit-window', amountCents: 1000, actorUid: 'admin-audit', reason: 'audit local', clock: creationClock });
    const effects = [];
    let observed = { id: 're_auditwindow', payment_intent: 'pi_auditwindow', amount: 1000, currency: 'eur', metadata: { orderId: order.id, refundRequestId: attempt.refundRequestId }, connectedAccountId: 'acct_auditwindow', status: 'succeeded' };
    const service = createRefundSagaService({
        stripe: { createRefund: async () => { effects.push('create'); }, retrieveRefund: async () => { effects.push('retrieve'); return observed; } },
        repository: { saveAttempt: async () => effects.push('save'), confirmRefund: async () => effects.push('confirm'), failRefund: async () => effects.push('fail') },
        clock: expiredClock,
    });
    await assert.rejects(service.ensureRefund({ order, attempt: { ...attempt, status: 'unknown', updatedAt: expiredClock.now() } }), { code: 'COMMERCE_PROVIDER_RECONCILIATION_REQUIRED' });
    assert.deepEqual(effects, []);
    const known = { ...attempt, status: 'provider_pending', refundId: observed.id };
    assert.equal((await service.ensureRefund({ order, attempt: known })).outcome, 'succeeded');
    assert.deepEqual(effects, ['save', 'retrieve', 'confirm']);
    effects.length = 0;
    observed = null;
    await assert.rejects(service.ensureRefund({ order, attempt: known }), { code: 'COMMERCE_PROVIDER_RECONCILIATION_REQUIRED' });
    assert.deepEqual(effects, ['save', 'retrieve']);
});
