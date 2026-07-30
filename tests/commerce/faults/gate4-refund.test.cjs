'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    createRefundAttempt,
    transitionRefundAttempt
} = require('../../../functions/src/commerce/domain/refundSaga');
const {
    createRefundRepository
} = require('../../../functions/src/commerce/domain/refundRepository');
const {
    createRefundSagaService
} = require('../../../functions/src/commerce/domain/refundSagaService');
const {
    createFailpointController
} = require('../../../functions/src/commerce/domain/failpoints');
const { reduceOrder } = require('../../../functions/src/commerce/domain/orderState');
const { fixedClock, makeOrder } = require('../fixtures/order-v2.cjs');

const clock = fixedClock('2026-07-27T12:00:00.000Z');

function paidOrder() {
    const base = makeOrder();
    base.payment.connectedAccountId = 'acct_gate4refund01';
    return {
        ...reduceOrder(base, {
            type: 'payment_succeeded',
            amountCents: base.amounts.totalCents,
            currency: 'EUR',
            paymentIntentId: 'pi_gate4_refund_0001'
        }, { clock }),
        id: 'order-gate4-refund-0001'
    };
}

function prepare(order, {
    refundRequestId = 'refund-request-0001',
    amountCents = 3000
} = {}) {
    const attempt = createRefundAttempt({
        order,
        refundRequestId,
        amountCents,
        actorUid: 'admin-gate4',
        reason: 'remboursement partiel',
        clock
    });
    const pendingOrder = reduceOrder(order, {
        type: 'refund_requested',
        amountCents
    }, { clock });
    return { order: pendingOrder, attempt };
}

function fakeStripe({ loseFirstResponse = false, status = 'succeeded' } = {}) {
    const byKey = new Map();
    let lost = false;
    let calls = 0;
    return {
        byKey,
        get calls() {
            return calls;
        },
        async createRefund(params, options) {
            calls += 1;
            let refund = byKey.get(options.idempotencyKey);
            if (!refund) {
                refund = {
                    id: `re_gate4_${byKey.size + 1}`,
                    status,
                    amount: params.amount,
                    currency: 'eur',
                    payment_intent: params.payment_intent,
                    metadata: params.metadata,
                    connectedAccountId: options.connectedAccountId
                };
                byKey.set(options.idempotencyKey, refund);
            }
            if (loseFirstResponse && !lost) {
                lost = true;
                throw new Error('response lost after Stripe accepted refund');
            }
            return { ...refund };
        },
        async retrieveRefund(refundId) {
            const refund = [...byKey.values()].find((value) => value.id === refundId);
            return refund ? { ...refund } : null;
        }
    };
}

function fakeRepository(prepared) {
    let order = prepared.order;
    let attempt = prepared.attempt;
    let stockEffects = 0;
    return {
        get order() {
            return order;
        },
        get attempt() {
            return attempt;
        },
        get stockEffects() {
            return stockEffects;
        },
        async saveAttempt(next) {
            attempt = next;
        },
        async confirmRefund(_order, next) {
            attempt = next;
            order = reduceOrder(order, {
                type: 'refund_confirmed',
                amountCents: next.amountCents
            }, { clock });
        },
        async failRefund(_order, next) {
            attempt = next;
            order = reduceOrder(order, {
                type: 'refund_failed',
                amountCents: next.amountCents
            }, { clock });
        },
        recordStockEffect() {
            stockEffects += 1;
        }
    };
}

test('refund accepted then response lost resumes one provider refund and one cumulative effect', async () => {
    const prepared = prepare(paidOrder());
    const repository = fakeRepository(prepared);
    const stripe = fakeStripe({ loseFirstResponse: true });
    const service = createRefundSagaService({ stripe, repository, clock });
    await assert.rejects(
        service.ensureRefund({ order: repository.order, attempt: repository.attempt }),
        { code: 'COMMERCE_REFUND_RESULT_UNKNOWN' }
    );
    assert.equal(repository.attempt.status, 'unknown');
    const result = await service.ensureRefund({
        order: repository.order,
        attempt: repository.attempt
    });
    assert.equal(result.outcome, 'succeeded');
    assert.equal(stripe.byKey.size, 1);
    assert.equal(repository.order.amounts.refundedCents, 3000);
    assert.equal(repository.stockEffects, 0);
});

test('stored pending refund can be resumed by another strong admin without creating a new request', async () => {
    const prepared = prepare(paidOrder());
    const inflight = transitionRefundAttempt(
        prepared.attempt,
        { type: 'create_started' },
        { clock }
    );
    const unknown = transitionRefundAttempt(
        inflight,
        { type: 'create_unknown' },
        { clock }
    );
    const { id: _ignoredOrderId, ...storedOrder } = prepared.order;
    const documents = new Map([
        ['orders/order-gate4-refund-0001', storedOrder],
        ['orders/order-gate4-refund-0001/refunds/refund-request-0001', unknown],
        ['orders/order-gate4-refund-0001/events/refund-requested-refund-request-0001', {
            type: 'refund_requested'
        }]
    ]);
    const ref = (path) => ({ path });
    const snapshot = (documentRef) => ({
        exists: documents.has(documentRef.path),
        data: () => documents.get(documentRef.path)
    });
    const repository = createRefundRepository({
        db: {
            runTransaction: async (run) => run({
                get: async (documentRef) => snapshot(documentRef),
                set: (documentRef, value) => documents.set(documentRef.path, value)
            })
        },
        refs: {
            order: (orderId) => ref(`orders/${orderId}`),
            refundAttempt: (orderId, refundRequestId) => ref(
                `orders/${orderId}/refunds/${refundRequestId}`
            ),
            auditEvent: (orderId, eventId) => ref(
                `orders/${orderId}/events/${eventId}`
            ),
            financialFact: (effectId) => ref(`commerce_financial_facts/${effectId}`),
            financialDaily: (dateKey, currency) => ref(
                `commerce_financial_daily/${dateKey}_${currency}`
            ),
            financialTotals: (currency) => ref(`commerce_financial_totals/${currency}`),
            outbox: (outboxId) => ref(`commerce_outbox/${outboxId}`)
        },
        clock
    });
    const resumed = await repository.prepareRefund({
        orderId: 'order-gate4-refund-0001',
        refundRequestId: 'refund-request-0001',
        amountCents: 3000,
        actor: {
            uid: 'second-strong-admin',
            role: 'admin',
            aal2: true
        },
        reason: 'reprise du rapprochement'
    });
    assert.equal(resumed.reused, true);
    assert.equal(resumed.attempt.status, 'unknown');
    assert.equal(resumed.attempt.actorUid, 'admin-gate4');
    assert.equal(
        [...documents.values()].some(
            (document) => document?.type === 'refund_resume_requested'
                && document?.actor?.uid === 'second-strong-admin'
        ),
        true
    );

    await assert.rejects(
        repository.prepareRefund({
            orderId: 'order-gate4-refund-0001',
            refundRequestId: 'refund-request-0001',
            amountCents: 3000,
            actor: {
                uid: 'weak-admin',
                role: 'admin',
                aal2: false
            },
            reason: 'reprise faible'
        }),
        { code: 'COMMERCE_REFUND_ACCESS_DENIED' }
    );
});

test('failed refund clears pending money without any inventory disposition', async () => {
    const prepared = prepare(paidOrder());
    const repository = fakeRepository(prepared);
    const stripe = fakeStripe({ status: 'failed' });
    const result = await createRefundSagaService({
        stripe,
        repository,
        clock
    }).ensureRefund({
        order: repository.order,
        attempt: repository.attempt
    });
    assert.equal(result.outcome, 'failed');
    assert.equal(repository.order.refundAggregate.pendingCents, 0);
    assert.equal(repository.order.refundAggregate.succeededCents, 0);
    assert.equal(repository.order.refundAggregate.hasFailure, true);
    assert.equal(repository.order.inventorySummary.committedQty, 1);
    assert.equal(repository.stockEffects, 0);
});

test('crash after refund response before persistence resumes the same refund', async () => {
    const prepared = prepare(paidOrder());
    const repository = fakeRepository(prepared);
    const stripe = fakeStripe();
    const crashing = createRefundSagaService({
        stripe,
        repository,
        clock,
        failpoints: createFailpointController({
            'refund.after_provider_response_before_persist': 1
        })
    });
    await assert.rejects(
        crashing.ensureRefund({
            order: repository.order,
            attempt: repository.attempt
        }),
        { code: 'COMMERCE_FAILPOINT_TRIGGERED' }
    );
    assert.equal(repository.order.amounts.refundedCents, 0);
    assert.equal(repository.stockEffects, 0);
    const result = await createRefundSagaService({
        stripe,
        repository,
        clock
    }).ensureRefund({
        order: repository.order,
        attempt: repository.attempt
    });
    assert.equal(result.outcome, 'succeeded');
    assert.equal(stripe.byKey.size, 1);
    assert.equal(repository.order.amounts.refundedCents, 3000);
});

test('two distinct partial request IDs use distinct Stripe keys and sum exactly', async () => {
    const stripe = fakeStripe();
    const firstPrepared = prepare(paidOrder(), {
        refundRequestId: 'refund-request-partial-one',
        amountCents: 3000
    });
    const firstRepository = fakeRepository(firstPrepared);
    await createRefundSagaService({
        stripe,
        repository: firstRepository,
        clock
    }).ensureRefund({
        order: firstRepository.order,
        attempt: firstRepository.attempt
    });

    const secondPrepared = prepare(firstRepository.order, {
        refundRequestId: 'refund-request-partial-two',
        amountCents: 2000
    });
    const secondRepository = fakeRepository(secondPrepared);
    await createRefundSagaService({
        stripe,
        repository: secondRepository,
        clock
    }).ensureRefund({
        order: secondRepository.order,
        attempt: secondRepository.attempt
    });
    assert.equal(stripe.byKey.size, 2);
    assert.notEqual(
        firstPrepared.attempt.stripeIdempotencyKey,
        secondPrepared.attempt.stripeIdempotencyKey
    );
    assert.equal(secondRepository.order.amounts.refundedCents, 5000);
});

test('historical refund stays pinned to the order Connect account', async () => {
    const prepared = prepare(paidOrder());
    const stripe = fakeStripe();
    const repository = fakeRepository(prepared);
    await createRefundSagaService({ stripe, repository, clock }).ensureRefund({
        order: repository.order,
        attempt: repository.attempt
    });
    const refund = [...stripe.byKey.values()][0];
    assert.equal(refund.connectedAccountId, 'acct_gate4refund01');
});
