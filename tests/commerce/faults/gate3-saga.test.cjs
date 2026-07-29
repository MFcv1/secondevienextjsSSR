'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    createPaymentAttempt,
    resumeCreateAction,
    transitionAttempt,
    validatePaymentIntentForOrder
} = require('../../../functions/src/commerce/domain/checkoutSaga');
const {
    createCheckoutSagaService
} = require('../../../functions/src/commerce/domain/checkoutSagaService');
const {
    createCancellationCoordinator
} = require('../../../functions/src/commerce/domain/cancellationCoordinator');
const {
    createFailpointController
} = require('../../../functions/src/commerce/domain/failpoints');
const {
    assertInboxFence,
    claimInbox,
    createInboxEntry,
    markInboxFailed,
    markInboxProcessed
} = require('../../../functions/src/commerce/domain/webhookInbox');
const {
    buildFinancialFact,
    buildOutboxIntent
} = require('../../../functions/src/commerce/domain/commerceEffects');
const {
    consumeAndRotateAccessToken,
    createAccessTokenRecord
} = require('../../../functions/src/commerce/domain/checkoutAccessToken');
const {
    reconcilePaymentIntent
} = require('../../../functions/src/commerce/domain/reconcilePayment');
const { makeOrder, fixedClock } = require('../fixtures/order-v2.cjs');

function makeSagaOrder() {
    const order = makeOrder();
    return {
        ...order,
        id: 'order-saga-0001',
        payment: {
            ...order.payment,
            connectedAccountId: 'acct_sagaready01'
        }
    };
}

function makeAttempt() {
    return createPaymentAttempt({
        orderId: 'order-saga-0001',
        attemptId: 'attempt-saga-0001',
        requestHash: 'a'.repeat(64),
        connectedAccountId: 'acct_sagaready01',
        clock: fixedClock()
    });
}

function fakeStripe({
    loseFirstResponse = false,
    loseFirstCancelResponse = false,
    initialStatus = 'requires_payment_method'
} = {}) {
    const byKey = new Map();
    let createCalls = 0;
    let lost = false;
    let cancelLost = false;
    return {
        byKey,
        get createCalls() {
            return createCalls;
        },
        async createPaymentIntent(params, options) {
            createCalls += 1;
            let paymentIntent = byKey.get(options.idempotencyKey);
            if (!paymentIntent) {
                paymentIntent = {
                    id: `pi_saga_${byKey.size + 1}`,
                    amount: params.amount,
                    currency: params.currency,
                    metadata: params.metadata,
                    connectedAccountId: options.connectedAccountId,
                    status: initialStatus,
                    client_secret: `secret_${byKey.size + 1}`
                };
                byKey.set(options.idempotencyKey, paymentIntent);
            }
            if (loseFirstResponse && !lost) {
                lost = true;
                throw new Error('simulated response loss after provider acceptance');
            }
            return { ...paymentIntent };
        },
        async retrievePaymentIntent(paymentIntentId) {
            const paymentIntent = [...byKey.values()].find((entry) => entry.id === paymentIntentId);
            return paymentIntent ? { ...paymentIntent } : null;
        },
        async cancelPaymentIntent(paymentIntentId) {
            const paymentIntent = [...byKey.values()].find((entry) => entry.id === paymentIntentId);
            paymentIntent.status = 'canceled';
            if (loseFirstCancelResponse && !cancelLost) {
                cancelLost = true;
                throw new Error('simulated cancel response loss after provider acceptance');
            }
            return { ...paymentIntent };
        }
    };
}

function fakeRepository(initialAttempt) {
    let attempt = initialAttempt;
    const released = new Set();
    const committed = new Set();
    return {
        get attempt() {
            return attempt;
        },
        get releaseCount() {
            return released.size;
        },
        get commitCount() {
            return committed.size;
        },
        async saveAttempt(next) {
            attempt = next;
        },
        async releaseHeldInventory(order, paymentIntent) {
            released.add(`${order.id}:${paymentIntent.id}`);
        },
        async commitHeldInventory(order, paymentIntent) {
            committed.add(`${order.id}:${paymentIntent.id}`);
        }
    };
}

test('Stripe accepts then response is lost: retry reuses one PI and attaches it', async () => {
    const stripe = fakeStripe({ loseFirstResponse: true });
    const repository = fakeRepository(makeAttempt());
    const service = createCheckoutSagaService({
        stripe,
        repository,
        clock: fixedClock('2026-07-26T12:00:00.000Z')
    });
    await assert.rejects(
        service.ensurePaymentIntent({ order: makeSagaOrder(), attempt: repository.attempt }),
        { code: 'COMMERCE_STRIPE_RESULT_UNKNOWN' }
    );
    assert.equal(repository.attempt.status, 'create_unknown');
    const result = await service.ensurePaymentIntent({
        order: makeSagaOrder(),
        attempt: repository.attempt
    });
    assert.equal(result.paymentIntentId, 'pi_saga_1');
    assert.equal(result.totalCents, makeSagaOrder().amounts.totalCents);
    assert.equal(stripe.byKey.size, 1);
    assert.equal(repository.attempt.status, 'attached');
});

test('crash after Stripe response resumes with the same key and one PI', async () => {
    const stripe = fakeStripe();
    const repository = fakeRepository(makeAttempt());
    const firstService = createCheckoutSagaService({
        stripe,
        repository,
        clock: fixedClock(),
        failpoints: createFailpointController({
            'create.after_stripe_response_before_attach': 1
        })
    });
    await assert.rejects(
        firstService.ensurePaymentIntent({ order: makeSagaOrder(), attempt: repository.attempt }),
        { code: 'COMMERCE_FAILPOINT_TRIGGERED' }
    );
    assert.equal(repository.attempt.status, 'create_inflight');
    const retryService = createCheckoutSagaService({ stripe, repository, clock: fixedClock() });
    await retryService.ensurePaymentIntent({ order: makeSagaOrder(), attempt: repository.attempt });
    assert.equal(stripe.byKey.size, 1);
    assert.equal(repository.attempt.paymentIntentId, 'pi_saga_1');
});

test('crash after attach returns the attached PI on retry without creation', async () => {
    const stripe = fakeStripe();
    const repository = fakeRepository(makeAttempt());
    const firstService = createCheckoutSagaService({
        stripe,
        repository,
        clock: fixedClock(),
        failpoints: createFailpointController({
            'create.after_attach_before_response': 1
        })
    });
    await assert.rejects(
        firstService.ensurePaymentIntent({ order: makeSagaOrder(), attempt: repository.attempt }),
        { code: 'COMMERCE_FAILPOINT_TRIGGERED' }
    );
    const createCalls = stripe.createCalls;
    const retry = await createCheckoutSagaService({
        stripe,
        repository,
        clock: fixedClock()
    }).ensurePaymentIntent({ order: makeSagaOrder(), attempt: repository.attempt });
    assert.equal(retry.reused, true);
    assert.equal(retry.totalCents, makeSagaOrder().amounts.totalCents);
    assert.equal(stripe.createCalls, createCalls);
});

test('provider-first cancel never releases before canceled and converges after crash', async () => {
    const stripe = fakeStripe();
    const repository = fakeRepository(makeAttempt());
    const baseService = createCheckoutSagaService({ stripe, repository, clock: fixedClock() });
    await baseService.ensurePaymentIntent({ order: makeSagaOrder(), attempt: repository.attempt });
    const crashing = createCheckoutSagaService({
        stripe,
        repository,
        clock: fixedClock(),
        failpoints: createFailpointController({
            'cancel.after_stripe_cancel_before_release': 1
        })
    });
    await assert.rejects(
        crashing.cancelProviderFirst({ order: makeSagaOrder(), attempt: repository.attempt }),
        { code: 'COMMERCE_FAILPOINT_TRIGGERED' }
    );
    assert.equal(repository.releaseCount, 0);
    const result = await baseService.cancelProviderFirst({
        order: makeSagaOrder(),
        attempt: repository.attempt
    });
    assert.equal(result.outcome, 'canceled');
    assert.equal(repository.releaseCount, 1);
});

test('cancel during create_pending replays the create key, cancels one PI, then releases', async () => {
    const stripe = fakeStripe();
    const repository = fakeRepository(makeAttempt());
    const service = createCheckoutSagaService({ stripe, repository, clock: fixedClock() });
    const result = await service.cancelProviderFirst({
        order: makeSagaOrder(),
        attempt: repository.attempt
    });
    assert.equal(result.outcome, 'canceled');
    assert.equal(stripe.byKey.size, 1);
    assert.equal(stripe.createCalls, 1);
    assert.equal(repository.attempt.status, 'canceled');
    assert.equal(repository.releaseCount, 1);
});

test('lost Stripe cancel response keeps the hold until retry observes canceled', async () => {
    const stripe = fakeStripe({ loseFirstCancelResponse: true });
    const repository = fakeRepository(makeAttempt());
    const service = createCheckoutSagaService({ stripe, repository, clock: fixedClock() });
    await service.ensurePaymentIntent({ order: makeSagaOrder(), attempt: repository.attempt });
    await assert.rejects(
        service.cancelProviderFirst({
            order: makeSagaOrder(),
            attempt: repository.attempt
        }),
        { code: 'COMMERCE_PAYMENT_INTENT_CANCEL_UNKNOWN' }
    );
    assert.equal(repository.releaseCount, 0);
    const retry = await service.cancelProviderFirst({
        order: makeSagaOrder(),
        attempt: repository.attempt
    });
    assert.equal(retry.outcome, 'canceled');
    assert.equal(repository.releaseCount, 1);
    assert.equal(stripe.byKey.size, 1);
});

test('succeeded PI wins a cancellation race and commits instead of releasing', async () => {
    const stripe = fakeStripe({ initialStatus: 'succeeded' });
    const repository = fakeRepository(makeAttempt());
    const service = createCheckoutSagaService({ stripe, repository, clock: fixedClock() });
    await service.ensurePaymentIntent({ order: makeSagaOrder(), attempt: repository.attempt });
    const result = await service.cancelProviderFirst({
        order: makeSagaOrder(),
        attempt: repository.attempt
    });
    assert.equal(result.outcome, 'paid');
    assert.equal(repository.commitCount, 1);
    assert.equal(repository.releaseCount, 0);
});

test('client cancellation retry returns one audited provider-first result', async () => {
    let auditResult = null;
    let cancellationCalls = 0;
    const coordinator = createCancellationCoordinator({
        checkoutRepository: {
            async loadOwnedCheckout() {
                return {
                    order: makeSagaOrder(),
                    attempt: makeAttempt()
                };
            }
        },
        sagaService: {
            async cancelProviderFirst() {
                cancellationCalls += 1;
                return {
                    outcome: 'canceled',
                    paymentIntentId: 'pi_cancel_audited_0001'
                };
            }
        },
        auditRepository: {
            async lookup() {
                return auditResult;
            },
            async record(input) {
                auditResult = {
                    orderId: input.orderId,
                    commandId: input.commandId,
                    outcome: input.outcome,
                    paymentIntentId: input.paymentIntentId
                };
                return auditResult;
            }
        }
    });
    const request = {
        orderId: 'order-saga-0001',
        commandId: 'command-cancel-audited-0001',
        ownerUid: 'owner-uid-0001',
        reason: 'annulation client'
    };
    const first = await coordinator.requestCancellation(request);
    const retry = await coordinator.requestCancellation(request);
    assert.deepEqual(retry, first);
    assert.equal(cancellationCalls, 1);
    assert.equal(first.outcome, 'canceled');
});

test('attempt matrix is closed and resumes unknown creation with the same key', () => {
    const attempt = makeAttempt();
    const inflight = transitionAttempt(attempt, { type: 'create_started' }, { clock: fixedClock() });
    const unknown = transitionAttempt(inflight, { type: 'create_unknown' }, { clock: fixedClock() });
    assert.equal(resumeCreateAction(unknown), 'create_with_same_idempotency_key');
    assert.equal(unknown.stripeIdempotencyKey, attempt.stripeIdempotencyKey);
    assert.throws(
        () => transitionAttempt(attempt, { type: 'invented' }, { clock: fixedClock() }),
        { code: 'COMMERCE_PAYMENT_ATTEMPT_TRANSITION_DENIED' }
    );
});

test('PI validation rejects amount, currency, order, request hash and Connect mismatches', () => {
    const order = makeSagaOrder();
    const attempt = makeAttempt();
    const valid = {
        id: 'pi_validation_0001',
        amount: order.amounts.totalCents,
        currency: 'eur',
        metadata: {
            orderId: order.id,
            requestHash: order.checkout.requestHash
        },
        connectedAccountId: attempt.connectedAccountId
    };
    const mismatches = [
        { ...valid, amount: valid.amount + 1 },
        { ...valid, currency: 'usd' },
        { ...valid, metadata: { ...valid.metadata, orderId: 'order-wrong-0001' } },
        { ...valid, metadata: { ...valid.metadata, requestHash: 'b'.repeat(64) } },
        { ...valid, connectedAccountId: 'acct_wrongready01' }
    ];
    for (const paymentIntent of mismatches) {
        assert.throws(
            () => validatePaymentIntentForOrder(paymentIntent, order, attempt),
            { code: 'COMMERCE_PAYMENT_INTENT_MISMATCH' }
        );
    }
});

test('webhook inbox supports duplicate identity, lease takeover and fencing', () => {
    const event = {
        id: 'evt_inbox_0001',
        type: 'payment_intent.succeeded',
        created: 1,
        livemode: false,
        data: { object: { id: 'pi_saga_1' } }
    };
    const entry = createInboxEntry({
        event,
        scope: 'platform',
        payloadHash: 'b'.repeat(64),
        clock: fixedClock()
    });
    const duplicate = createInboxEntry({
        event,
        scope: 'platform',
        payloadHash: 'b'.repeat(64),
        clock: fixedClock()
    });
    assert.equal(entry.inboxId, duplicate.inboxId);
    const first = claimInbox(entry, { leaseToken: 'lease-token-one', nowMillis: 1000, leaseMs: 100 });
    assert.throws(
        () => claimInbox(first, { leaseToken: 'lease-token-two', nowMillis: 1050, leaseMs: 100 }),
        { code: 'COMMERCE_INBOX_NOT_CLAIMABLE' }
    );
    const second = claimInbox(first, { leaseToken: 'lease-token-two', nowMillis: 1100, leaseMs: 100 });
    assert.throws(
        () => assertInboxFence(second, 'lease-token-one', 1110),
        { code: 'COMMERCE_INBOX_FENCE_LOST' }
    );
    const processed = markInboxProcessed(second, {
        leaseToken: 'lease-token-two',
        nowMillis: 1110,
        processedAt: '2026-07-26T12:00:00.000Z'
    });
    assert.equal(processed.status, 'processed');
});

test('webhook failure backoff ends in dead-letter and effects are deterministic', () => {
    const base = createInboxEntry({
        event: {
            id: 'evt_inbox_0002',
            type: 'payment_intent.succeeded',
            created: 1,
            livemode: false,
            data: { object: { id: 'pi_saga_2' } }
        },
        scope: 'platform',
        payloadHash: 'c'.repeat(64),
        clock: fixedClock()
    });
    const claimed = claimInbox({ ...base, attemptCount: 7 }, {
        leaseToken: 'lease-token-dead',
        nowMillis: 1000,
        leaseMs: 100
    });
    const failed = markInboxFailed(claimed, {
        leaseToken: 'lease-token-dead',
        nowMillis: 1010,
        errorMessage: 'terminal test',
        maxAttempts: 8
    });
    assert.equal(failed.status, 'dead_letter');

    const fact = buildFinancialFact({
        orderId: 'order-saga-0001',
        type: 'capture',
        amountCents: 14000,
        currency: 'EUR',
        connectedAccountId: 'acct_sagaready01',
        providerObjectId: 'pi_saga_1',
        effectiveAt: '2026-07-26T12:00:00.000Z',
        commandId: 'command-capture-0001'
    });
    const outbox = buildOutboxIntent({
        effectId: fact.effectId,
        aggregateType: 'order',
        aggregateId: 'order-saga-0001',
        effectType: 'payment_succeeded',
        template: 'order-paid',
        recipientRole: 'customer',
        recipientHash: 'd'.repeat(64),
        payloadSnapshot: { orderId: 'order-saga-0001' },
        clock: fixedClock()
    });
    assert.equal(outbox.effectId, fact.effectId);
    assert.equal(outbox.status, 'pending');
});

test('guest resume token is opaque, single-use, owner-bound and rotated', () => {
    const rawToken = 'raw-token-'.padEnd(48, 'a');
    const nextRawToken = 'next-token-'.padEnd(48, 'b');
    const record = createAccessTokenRecord({
        rawToken,
        orderId: 'order-saga-0001',
        ownerUid: 'owner-uid-0001',
        expiresAt: '2026-07-26T13:00:00.000Z',
        purgeAt: '2026-08-26T13:00:00.000Z'
    });
    assert.notEqual(record.tokenHash, rawToken);
    const rotated = consumeAndRotateAccessToken(record, {
        rawToken,
        ownerUid: 'owner-uid-0001',
        nowMillis: 1000,
        expiresAtMillis: 2000,
        consumedAt: '2026-07-26T12:00:00.000Z',
        nextRawToken,
        nextExpiresAt: '2026-07-26T14:00:00.000Z',
        nextPurgeAt: '2026-08-26T14:00:00.000Z'
    });
    assert.equal(rotated.consumed.consumedAt, '2026-07-26T12:00:00.000Z');
    assert.equal(rotated.next.rotation, 1);
    assert.throws(
        () => consumeAndRotateAccessToken(rotated.consumed, {
            rawToken,
            ownerUid: 'owner-uid-0001',
            nowMillis: 1000,
            expiresAtMillis: 2000,
            consumedAt: 'again',
            nextRawToken,
            nextExpiresAt: 'later',
            nextPurgeAt: 'later'
        }),
        { code: 'COMMERCE_ACCESS_TOKEN_DENIED' }
    );
});

test('reconciler covers all PI statuses without releasing a non-terminal hold', () => {
    for (const status of [
        'requires_payment_method',
        'requires_confirmation',
        'requires_action',
        'processing'
    ]) {
        const result = reconcilePaymentIntent({
            order: makeSagaOrder(),
            paymentIntent: {
                id: 'pi_reconcile_0001',
                status,
                amount: 14000,
                currency: 'eur'
            },
            clock: fixedClock()
        });
        assert.equal(result.action, 'keep_hold');
        assert.equal(result.order.inventorySummary.status, 'held');
    }
    const manualCapture = reconcilePaymentIntent({
        order: makeSagaOrder(),
        paymentIntent: {
            id: 'pi_reconcile_capture',
            status: 'requires_capture',
            amount: 14000,
            currency: 'eur'
        },
        clock: fixedClock()
    });
    assert.equal(manualCapture.action, 'incident');
    assert.equal(manualCapture.order.status, 'needs_review');
});

test('reconciler persists an incident for a succeeded orphan instead of skipping', () => {
    const result = reconcilePaymentIntent({
        order: null,
        paymentIntent: {
            id: 'pi_orphan_succeeded',
            status: 'succeeded',
            amount: 14000,
            currency: 'eur'
        },
        clock: fixedClock()
    });
    assert.equal(result.action, 'incident');
    assert.equal(result.incident.code, 'paid_payment_intent_orphan');
});

test('reconciler freezes terminal conflicts and mismatches without compensation', () => {
    const canceled = reconcilePaymentIntent({
        order: makeSagaOrder(),
        paymentIntent: {
            id: 'pi_terminal_canceled',
            status: 'canceled',
            amount: 14000,
            currency: 'eur'
        },
        clock: fixedClock()
    }).order;
    const conflict = reconcilePaymentIntent({
        order: canceled,
        paymentIntent: {
            id: 'pi_terminal_canceled',
            status: 'succeeded',
            amount: 14000,
            currency: 'eur'
        },
        clock: fixedClock()
    });
    assert.equal(conflict.action, 'incident');
    assert.equal(conflict.order.status, 'needs_review');
    assert.equal(conflict.order.inventorySummary.status, 'released');

    const mismatch = reconcilePaymentIntent({
        order: makeSagaOrder(),
        paymentIntent: {
            id: 'pi_amount_mismatch',
            status: 'succeeded',
            amount: 1,
            currency: 'eur'
        },
        clock: fixedClock()
    });
    assert.equal(mismatch.action, 'incident');
    assert.equal(mismatch.order.inventorySummary.status, 'held');
});
