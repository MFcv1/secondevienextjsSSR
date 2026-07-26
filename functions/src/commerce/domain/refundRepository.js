'use strict';

const { buildFinancialFact, buildOutboxIntent } = require('./commerceEffects');
const { assertActionAllowed } = require('./allowedActions');
const { hashPayload } = require('./idempotency');
const { reduceOrder, validateOrderV2 } = require('./orderState');
const {
    createRefundAttempt,
    validateRefundAttempt
} = require('./refundSaga');

function repositoryError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function snapshotExists(snapshot) {
    return typeof snapshot.exists === 'function' ? snapshot.exists() : snapshot.exists === true;
}

function requireDependency(value, name) {
    if (typeof value !== 'function') {
        const error = repositoryError('COMMERCE_REFUND_REPOSITORY_DEPENDENCY_INVALID');
        error.detail = name;
        throw error;
    }
}

function createRefundRepository({ db, refs, clock }) {
    requireDependency(db?.runTransaction, 'db.runTransaction');
    for (const name of [
        'order',
        'refundAttempt',
        'auditEvent',
        'financialFact',
        'outbox'
    ]) {
        requireDependency(refs?.[name], `refs.${name}`);
    }
    requireDependency(clock?.now, 'clock.now');

    async function prepareRefund({
        orderId,
        refundRequestId,
        amountCents,
        actor,
        reason
    }) {
        const orderRef = refs.order(orderId);
        const attemptRef = refs.refundAttempt(orderId, refundRequestId);
        const auditRef = refs.auditEvent(orderId, `refund-requested-${refundRequestId}`);
        return db.runTransaction(async (transaction) => {
            const [orderSnap, attemptSnap, auditSnap] = await Promise.all([
                transaction.get(orderRef),
                transaction.get(attemptRef),
                transaction.get(auditRef)
            ]);
            if (!snapshotExists(orderSnap)) throw repositoryError('COMMERCE_ORDER_NOT_FOUND');
            const storedOrder = orderSnap.data();
            validateOrderV2(storedOrder);
            const order = { ...storedOrder, id: orderId };
            assertActionAllowed(order, actor, 'request_refund');
            if (snapshotExists(attemptSnap)) {
                const existing = attemptSnap.data();
                validateRefundAttempt(existing);
                if (
                    existing.orderId !== orderId ||
                    existing.refundRequestId !== refundRequestId ||
                    existing.amountCents !== amountCents ||
                    existing.actorUid !== actor.uid
                ) {
                    throw repositoryError('COMMERCE_REFUND_IDEMPOTENCY_CONFLICT');
                }
                return { order, attempt: existing, reused: true };
            }
            if (snapshotExists(auditSnap)) {
                throw repositoryError('COMMERCE_AUDIT_APPEND_ONLY_CONFLICT');
            }
            const attempt = createRefundAttempt({
                order,
                refundRequestId,
                amountCents,
                actorUid: actor.uid,
                reason,
                clock
            });
            const nextOrder = reduceOrder(order, {
                type: 'refund_requested',
                amountCents
            }, { clock });
            transaction.set(orderRef, stripId(nextOrder));
            transaction.set(attemptRef, attempt);
            transaction.set(auditRef, {
                schemaVersion: 2,
                eventId: `refund-requested-${refundRequestId}`,
                orderId,
                type: 'refund_requested',
                actor: {
                    uid: actor.uid,
                    role: actor.role,
                    aal2: actor.aal2
                },
                reason,
                amountCents,
                currency: order.currency,
                connectedAccountId: order.payment.connectedAccountId,
                stateVersionBefore: order.stateVersion,
                stateVersionAfter: nextOrder.stateVersion,
                createdAt: clock.now()
            });
            return {
                order: nextOrder,
                attempt,
                reused: false
            };
        });
    }

    async function saveAttempt(nextAttempt) {
        validateRefundAttempt(nextAttempt);
        const ref = refs.refundAttempt(nextAttempt.orderId, nextAttempt.refundRequestId);
        return db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(ref);
            if (!snapshotExists(snapshot)) throw repositoryError('COMMERCE_REFUND_ATTEMPT_MISSING');
            const current = snapshot.data();
            validateRefundAttempt(current);
            if (
                current.stripeIdempotencyKey !== nextAttempt.stripeIdempotencyKey ||
                current.amountCents !== nextAttempt.amountCents ||
                current.connectedAccountId !== nextAttempt.connectedAccountId
            ) {
                throw repositoryError('COMMERCE_REFUND_ATTEMPT_IDENTITY_CONFLICT');
            }
            if (current.stateVersion === nextAttempt.stateVersion) {
                if (hashPayload(current) !== hashPayload(nextAttempt)) {
                    throw repositoryError('COMMERCE_REFUND_ATTEMPT_VERSION_CONFLICT');
                }
                return current;
            }
            if (nextAttempt.stateVersion !== current.stateVersion + 1) {
                throw repositoryError('COMMERCE_REFUND_ATTEMPT_VERSION_CONFLICT');
            }
            transaction.set(ref, nextAttempt);
            return nextAttempt;
        });
    }

    async function settleRefund(order, nextAttempt, refund, outcome) {
        validateRefundAttempt(nextAttempt);
        const orderRef = refs.order(order.id);
        const attemptRef = refs.refundAttempt(order.id, nextAttempt.refundRequestId);
        const auditRef = refs.auditEvent(
            order.id,
            `refund-${outcome}-${nextAttempt.refundRequestId}`
        );
        const fact = outcome === 'succeeded'
            ? buildFinancialFact({
                orderId: order.id,
                type: 'refund',
                amountCents: nextAttempt.amountCents,
                currency: nextAttempt.currency,
                connectedAccountId: nextAttempt.connectedAccountId,
                providerObjectId: refund.id,
                effectiveAt: clock.now(),
                commandId: nextAttempt.refundRequestId
            })
            : null;
        const outbox = fact
            ? buildOutboxIntent({
                effectId: fact.effectId,
                aggregateType: 'order',
                aggregateId: order.id,
                effectType: 'refund_succeeded',
                template: 'order-refunded',
                recipientRole: 'customer',
                recipientHash: hashPayload({
                    email: order.customerSnapshot?.email || null,
                    ownerUid: order.userId
                }),
                payloadSnapshot: {
                    orderId: order.id,
                    refundId: refund.id,
                    amountCents: nextAttempt.amountCents,
                    currency: nextAttempt.currency
                },
                clock
            })
            : null;
        const factRef = fact ? refs.financialFact(fact.effectId) : null;
        const outboxRef = outbox ? refs.outbox(outbox.outboxId) : null;

        return db.runTransaction(async (transaction) => {
            const reads = [
                transaction.get(orderRef),
                transaction.get(attemptRef),
                transaction.get(auditRef)
            ];
            if (factRef) reads.push(transaction.get(factRef));
            if (outboxRef) reads.push(transaction.get(outboxRef));
            const snapshots = await Promise.all(reads);
            if (!snapshotExists(snapshots[0]) || !snapshotExists(snapshots[1])) {
                throw repositoryError('COMMERCE_REFUND_SETTLEMENT_INCOMPLETE');
            }
            const storedOrder = snapshots[0].data();
            const storedAttempt = snapshots[1].data();
            validateOrderV2(storedOrder);
            validateRefundAttempt(storedAttempt);
            if (storedAttempt.status === outcome) {
                return {
                    order: { ...storedOrder, id: order.id },
                    attempt: storedAttempt,
                    reused: true
                };
            }
            if (storedAttempt.stateVersion + 1 !== nextAttempt.stateVersion) {
                throw repositoryError('COMMERCE_REFUND_ATTEMPT_VERSION_CONFLICT');
            }
            if (snapshotExists(snapshots[2])) {
                throw repositoryError('COMMERCE_AUDIT_APPEND_ONLY_CONFLICT');
            }
            const event = outcome === 'succeeded'
                ? { type: 'refund_confirmed', amountCents: nextAttempt.amountCents }
                : { type: 'refund_failed', amountCents: nextAttempt.amountCents };
            const nextOrder = reduceOrder(
                { ...storedOrder, id: order.id },
                event,
                { clock }
            );
            transaction.set(orderRef, stripId(nextOrder));
            transaction.set(attemptRef, nextAttempt);
            transaction.set(auditRef, {
                schemaVersion: 2,
                eventId: `refund-${outcome}-${nextAttempt.refundRequestId}`,
                orderId: order.id,
                type: `refund_${outcome}`,
                actor: nextAttempt.actorUid,
                reason: nextAttempt.reason,
                amountCents: nextAttempt.amountCents,
                currency: nextAttempt.currency,
                refundId: refund.id,
                connectedAccountId: nextAttempt.connectedAccountId,
                stateVersionBefore: storedOrder.stateVersion,
                stateVersionAfter: nextOrder.stateVersion,
                createdAt: clock.now()
            });
            if (factRef && !snapshotExists(snapshots[3])) transaction.set(factRef, fact);
            if (outboxRef && !snapshotExists(snapshots[4])) transaction.set(outboxRef, outbox);
            return { order: nextOrder, attempt: nextAttempt, reused: false };
        });
    }

    return Object.freeze({
        prepareRefund,
        saveAttempt,
        confirmRefund: (order, attempt, refund) => settleRefund(
            order,
            attempt,
            refund,
            'succeeded'
        ),
        failRefund: (order, attempt, refund) => settleRefund(
            order,
            attempt,
            refund,
            'failed'
        )
    });
}

function stripId(value) {
    const { id: _ignoredId, ...document } = value;
    return document;
}

module.exports = { createRefundRepository };
