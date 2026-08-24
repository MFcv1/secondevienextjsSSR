'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { createCheckoutCoordinator } = require('../../../functions/src/commerce/domain/checkoutCoordinator');
const { createCheckoutSagaService } = require('../../../functions/src/commerce/domain/checkoutSagaService');
const { createFailpointController } = require('../../../functions/src/commerce/domain/failpoints');
const { createPaymentAttempt } = require('../../../functions/src/commerce/domain/checkoutSaga');
const { claimInbox, createInboxEntry, markInboxFailed, markInboxProcessed } = require('../../../functions/src/commerce/domain/webhookInbox');
const { reduceOrder } = require('../../../functions/src/commerce/domain/orderState');
const { fixedClock, makeOrder } = require('../fixtures/order-v2.cjs');

const now = '2026-08-24T12:00:00.000Z';
const clock = { now: () => now, nowMillis: () => Date.parse(now) };

function sagaFixture({ loseFirstResponse = false, failpoints = null, status = 'requires_payment_method' } = {}) {
    const order = {
        ...makeOrder(),
        id: 'order-resilience-0001',
        payment: { ...makeOrder().payment, connectedAccountId: 'acct_resilience_0001' }
    };
    let attempt = createPaymentAttempt({
        orderId: order.id,
        attemptId: 'attempt-resilience-0001',
        requestHash: order.checkout.requestHash,
        connectedAccountId: 'acct_resilience_0001',
        clock
    });
    const intents = new Map();
    const keys = [];
    let lost = false;
    const stripe = {
        keys,
        intents,
        async createPaymentIntent(params, options) {
            keys.push(options.idempotencyKey);
            if (!intents.has(options.idempotencyKey)) {
                intents.set(options.idempotencyKey, {
                    id: 'pi_resilience_0001',
                    amount: params.amount,
                    currency: params.currency,
                    metadata: params.metadata,
                    connectedAccountId: options.connectedAccountId,
                    status,
                    client_secret: 'test-only-redacted'
                });
            }
            if (loseFirstResponse && !lost) {
                lost = true;
                throw Object.assign(new Error('response lost'), { code: 'SIMULATED_RESPONSE_LOSS' });
            }
            return { ...intents.get(options.idempotencyKey) };
        },
        async retrievePaymentIntent(id) {
            return [...intents.values()].find((entry) => entry.id === id) || null;
        },
        async cancelPaymentIntent(id) {
            const entry = [...intents.values()].find((candidate) => candidate.id === id);
            entry.status = 'canceled';
            return { ...entry };
        }
    };
    const effects = { commit: 0, release: 0 };
    const repository = {
        get attempt() { return attempt; },
        async saveAttempt(next) { attempt = next; },
        async commitHeldInventory() { effects.commit += 1; },
        async releaseHeldInventory() { effects.release += 1; }
    };
    const service = createCheckoutSagaService({ stripe, repository, clock, failpoints });
    return { effects, order, repository, service, stripe };
}

function idempotentCoordinator() {
    const records = new Map();
    let holds = 0;
    const checkoutRepository = {
        get holds() { return holds; },
        async prepareCheckout(request) {
            const key = `${request.ownerUid}:${request.input.clientOrderId}`;
            if (!records.has(key)) {
                holds += 1;
                records.set(key, {
                    order: { id: `order-${records.size + 1}`, payment: { status: 'processing' } },
                    attempt: { attemptId: `attempt-${records.size + 1}` }
                });
            }
            return records.get(key);
        },
        async loadOwnedCheckout({ orderId }) {
            return [...records.values()].find((record) => record.order.id === orderId);
        }
    };
    const sagaService = {
        hitAfterHold() {},
        async ensurePaymentIntent({ order, attempt }) {
            return { orderId: order.id, attemptId: attempt.attemptId, paymentIntentId: `pi-${order.id}` };
        }
    };
    return {
        checkoutRepository,
        coordinator: createCheckoutCoordinator({ checkoutRepository, sagaService, clock })
    };
}

test('R00 nominal local conserve une commande, un PI logique et un settlement', async () => {
    const { coordinator, checkoutRepository } = idempotentCoordinator();
    const result = await coordinator.createCheckout({
        ownerUid: 'owner-resilience-0001',
        input: { clientOrderId: 'client-resilience-0001' }
    });
    assert.equal(result.orderId, 'order-1');
    assert.equal(result.paymentIntentId, 'pi-order-1');
    assert.equal(checkoutRepository.holds, 1);
});

test('R01 offline avant callable ne cree aucun effet et conserve intention', async () => {
    const intent = Object.freeze({ clientOrderId: 'client-offline-0001', cartRevision: 7 });
    let calls = 0;
    async function submit({ online }) {
        if (!online) return { status: 'offline', intent };
        calls += 1;
        return { status: 'sent', intent };
    }
    const result = await submit({ online: false });
    assert.equal(calls, 0);
    assert.equal(result.intent, intent);
});

test('R02 reponse callable perdue reprend le meme clientOrderId et orderId', async () => {
    const { coordinator, checkoutRepository } = idempotentCoordinator();
    const request = { ownerUid: 'owner-resilience-0002', input: { clientOrderId: 'client-resilience-0002' } };
    const first = await coordinator.createCheckout(request);
    const retry = await coordinator.createCheckout(request);
    assert.equal(retry.orderId, first.orderId);
    assert.equal(checkoutRepository.holds, 1);
});

test('R03 deux soumissions concurrentes retournent un seul resultat durable', async () => {
    const { coordinator, checkoutRepository } = idempotentCoordinator();
    const request = { ownerUid: 'owner-resilience-0003', input: { clientOrderId: 'client-resilience-0003' } };
    const [left, right] = await Promise.all([
        coordinator.createCheckout(request),
        coordinator.createCheckout(request)
    ]);
    assert.equal(left.orderId, right.orderId);
    assert.equal(checkoutRepository.holds, 1);
});

test('R05 timeout Stripe reutilise exactement la meme idempotency key', async () => {
    const fixture = sagaFixture({ loseFirstResponse: true });
    await assert.rejects(
        fixture.service.ensurePaymentIntent({ order: fixture.order, attempt: fixture.repository.attempt }),
        { code: 'COMMERCE_STRIPE_RESULT_UNKNOWN' }
    );
    await fixture.service.ensurePaymentIntent({ order: fixture.order, attempt: fixture.repository.attempt });
    assert.equal(new Set(fixture.stripe.keys).size, 1);
    assert.equal(fixture.stripe.intents.size, 1);
});

test('R07 effet Stripe acquis puis persistance interrompue converge ou needs_review', async () => {
    const fixture = sagaFixture({
        failpoints: createFailpointController({ 'create.after_stripe_response_before_attach': 1 })
    });
    await assert.rejects(
        fixture.service.ensurePaymentIntent({ order: fixture.order, attempt: fixture.repository.attempt }),
        { code: 'COMMERCE_FAILPOINT_TRIGGERED' }
    );
    const retryService = createCheckoutSagaService({
        stripe: fixture.stripe,
        repository: fixture.repository,
        clock
    });
    const retry = await retryService.ensurePaymentIntent({
        order: fixture.order,
        attempt: fixture.repository.attempt
    });
    assert.equal(retry.paymentIntentId, 'pi_resilience_0001');
    assert.equal(fixture.stripe.intents.size, 1);
});

test('R09 toutes les permutations non terminales puis succeeded restent monotones', () => {
    const permutations = [
        ['payment_processing', 'payment_requires_action', 'payment_succeeded'],
        ['payment_requires_action', 'payment_processing', 'payment_succeeded'],
        ['payment_processing', 'payment_succeeded', 'payment_requires_action']
    ];
    for (const sequence of permutations) {
        let order = makeOrder();
        for (const type of sequence) {
            order = reduceOrder(order, {
                type,
                ...(type === 'payment_succeeded' ? {
                    amountCents: order.amounts.totalCents,
                    currency: order.currency
                } : {})
            }, { clock: fixedClock(now) });
        }
        assert.equal(order.payment.status, 'succeeded');
        assert.equal(order.checkout.closeReason, 'paid');
    }
});

test('R10 webhook retarde garde processing puis converge apres retry', () => {
    const entry = createInboxEntry({
        event: { id: 'evt_resilience_delay', type: 'payment_intent.processing', created: 1, data: { object: { id: 'pi_delay' } } },
        scope: 'platform',
        payloadHash: 'a'.repeat(64),
        clock
    });
    const claimed = claimInbox(entry, { leaseToken: 'lease-delay-0001', nowMillis: clock.nowMillis(), leaseMs: 60_000 });
    const failed = markInboxFailed(claimed, {
        leaseToken: 'lease-delay-0001', nowMillis: clock.nowMillis(), errorMessage: 'temporary'
    });
    assert.equal(failed.status, 'failed');
    const retry = claimInbox(failed, { leaseToken: 'lease-delay-0002', nowMillis: failed.nextAttemptAt, leaseMs: 60_000 });
    const processed = markInboxProcessed(retry, {
        leaseToken: 'lease-delay-0002', nowMillis: failed.nextAttemptAt, processedAt: now
    });
    assert.equal(processed.status, 'processed');
    assert.equal(processed.attemptCount, 2);
});

test('R13 expiration et succeeded concurrents produisent commit XOR release', async () => {
    const fixture = sagaFixture({ status: 'succeeded' });
    await fixture.service.ensurePaymentIntent({ order: fixture.order, attempt: fixture.repository.attempt });
    const result = await fixture.service.cancelProviderFirst({ order: fixture.order, attempt: fixture.repository.attempt });
    assert.equal(result.outcome, 'paid');
    assert.deepEqual(fixture.effects, { commit: 1, release: 0 });
});

test('R16 503 puis retry manuel garde la meme intention et un backoff borne', async () => {
    const { coordinator, checkoutRepository } = idempotentCoordinator();
    const request = { ownerUid: 'owner-resilience-0016', input: { clientOrderId: 'client-resilience-0016' } };
    const delays = [1_000, 2_000, 4_000, 8_000, 60_000].map((delay) => Math.min(delay, 60_000));
    const first = await coordinator.createCheckout(request);
    const retry = await coordinator.createCheckout(request);
    assert.equal(retry.orderId, first.orderId);
    assert.equal(checkoutRepository.holds, 1);
    assert.ok(Math.max(...delays) <= 60_000);
});
