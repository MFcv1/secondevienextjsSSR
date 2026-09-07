'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { createCheckoutRepository } = require('../../../functions/src/commerce/domain/checkoutRepository');
const { createCheckoutSagaService } = require('../../../functions/src/commerce/domain/checkoutSagaService');
const { createPaymentAttempt } = require('../../../functions/src/commerce/domain/checkoutSaga');
const { createAdminPaymentLinkCoordinator } = require('../../../functions/src/commerce/domain/adminPaymentLinkCoordinator');
const { createPaymentLinkState } = require('../../../functions/src/commerce/domain/adminPaymentLink');
const { makeOrder, fixedClock } = require('../fixtures/order-v2.cjs');

const refs = new Proxy({}, { get: (_, name) => (...ids) => `${String(name)}/${ids.join('/')}` });

test('expiry rechecks the deadline transactionally before any Stripe call when an extension won', async () => {
    const clock = fixedClock('2026-07-26T11:00:00.000Z');
    const attempt = createPaymentAttempt({ orderId: 'order-expiry-audit', attemptId: 'attempt-expiry-audit', requestHash: 'a'.repeat(64), connectedAccountId: 'acct_expiryaudit', clock });
    const order = makeOrder({ id: attempt.orderId });
    const fresh = { ...order, checkout: { ...order.checkout, expiresAt: '2026-07-26T13:00:00.000Z' } };
    let writes = 0, providerCalls = 0;
    const db = { runTransaction: callback => callback({ get: async ref => ({ exists: true, data: () => ref.startsWith('attempt/') ? attempt : fresh }), set: () => { writes++; } }) };
    const repository = createCheckoutRepository({ db, refs, ids: { orderId() {}, attemptId() {}, commandId() {} }, clock });
    const service = createCheckoutSagaService({
        clock, repository: { ...repository, releaseHeldInventory() {}, commitHeldInventory() {} },
        stripe: { createPaymentIntent() { providerCalls++; }, retrievePaymentIntent() { providerCalls++; }, cancelPaymentIntent() { providerCalls++; } },
    });
    const result = await service.cancelProviderFirst({ order, attempt, expectedExpiry: order.checkout.expiresAt });
    assert.equal(result.outcome, 'not_due');
    assert.equal(writes, 0);
    assert.equal(providerCalls, 0);
});

test('extension refuses a cancellation already claimed in the payment attempt transaction', async () => {
    const clock = { ...fixedClock(), nowMillis: () => Date.parse(fixedClock().now()) };
    const base = makeOrder();
    const order = { ...base, id: 'order-expiry-audit', payment: { ...base.payment, currentAttemptId: 'attempt-expiry-audit' }, checkout: { ...base.checkout, channel: 'admin_payment_link', paymentLink: createPaymentLinkState({ actorUid: 'admin-expiry-audit', tokenNonce: 'nonce-abcdefghijklmnop', now: clock.now() }) } };
    for (const status of ['cancel_requested', 'canceled', 'needs_review']) {
        let writes = 0;
        const coordinator = createAdminPaymentLinkCoordinator({
            db: { collection() {}, runTransaction: callback => callback({ get: async ref => ({ exists: true, data: () => ref.startsWith('attempt/') ? { status } : order }), set: () => { writes++; }, update: () => { writes++; } }) },
            refs, clock, checkoutRepository: { prepareCheckout() {}, loadCheckout() {} }, sagaService: { ensurePaymentIntent() {}, cancelProviderFirst() {} }, ids: { requestId() {}, tokenNonce() {} }, tokenSecret: 'local-secret-for-tests-only-00000000', siteUrl: 'https://example.test',
        });
        await assert.rejects(coordinator.extend({ orderId: order.id, actorUid: 'admin-expiry-audit', expiryMinutes: 120 }), { code: 'COMMERCE_ADMIN_PAYMENT_LINK_CANCELLATION_IN_PROGRESS' });
        assert.equal(writes, 0);
    }
});
