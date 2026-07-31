'use strict';

const admin = require('firebase-admin');
const {
    buildFinancialFact,
    buildOutboxIntent,
    deterministicEffectId
} = require('./commerceEffects');
const { writeFinancialRollups } = require('./financialRollup');
const { hashPayload } = require('./idempotency');
const { reduceOrder, validateOrderV2 } = require('./orderState');
const { buildCommerceIncident } = require('./reconcilePayment');
const {
    transitionRefundAttempt,
    validateProviderRefund,
    validateRefundAttempt
} = require('./refundSaga');

function applierError(code, detail = null) {
    const error = new Error(detail ? `${code}:${detail}` : code);
    error.code = code;
    if (detail) error.detail = detail;
    return error;
}

function snapshotExists(snapshot) {
    return typeof snapshot.exists === 'function' ? snapshot.exists() : snapshot.exists === true;
}

function stripId(value) {
    const { id: _ignoredId, ...document } = value;
    return document;
}

function refundEffectiveAt(refund, clock) {
    return Number.isSafeInteger(refund?.created) && refund.created > 0
        ? new Date(refund.created * 1000).toISOString()
        : clock.now();
}

function createRefundEffectApplier({
    refs,
    clock,
    increment = admin.firestore.FieldValue.increment
}) {
    for (const name of [
        'order',
        'refundAttempt',
        'auditEvent',
        'incident',
        'financialFact',
        'financialDaily',
        'financialTotals',
        'outbox'
    ]) {
        if (typeof refs?.[name] !== 'function') {
            throw applierError('COMMERCE_REFUND_APPLIER_DEPENDENCY_INVALID', `refs.${name}`);
        }
    }
    if (typeof clock?.now !== 'function' || typeof increment !== 'function') {
        throw applierError('COMMERCE_REFUND_APPLIER_DEPENDENCY_INVALID');
    }

    async function persistIncident(transaction, {
        code,
        orderId = null,
        refund,
        details = null,
        order = null
    }) {
        const incidentId = deterministicEffectId([
            'incident',
            code,
            orderId || 'orphan',
            refund?.id || 'unknown'
        ]);
        const incidentRef = refs.incident(incidentId);
        const incidentSnap = await transaction.get(incidentRef);
        if (!snapshotExists(incidentSnap)) {
            transaction.set(incidentRef, {
                ...buildCommerceIncident({
                    code,
                    orderId,
                    providerObjectId: refund?.id || null,
                    details,
                    clock
                }),
                incidentId
            });
        }
        if (order && orderId) transaction.set(refs.order(orderId), stripId(order));
        return { action: 'incident', incidentId, order };
    }

    async function apply(transaction, { entry, refund }) {
        if (!transaction || typeof transaction.get !== 'function' || typeof transaction.set !== 'function') {
            throw applierError('COMMERCE_REFUND_APPLIER_TRANSACTION_INVALID');
        }
        const orderId = refund?.metadata?.orderId;
        const refundRequestId = refund?.metadata?.refundRequestId;
        if (
            typeof orderId !== 'string' || orderId.length < 8 ||
            typeof refundRequestId !== 'string' || refundRequestId.length < 8
        ) {
            return persistIncident(transaction, {
                code: 'refund_orphan',
                refund
            });
        }

        const orderRef = refs.order(orderId);
        const attemptRef = refs.refundAttempt(orderId, refundRequestId);
        const [orderSnap, attemptSnap] = await Promise.all([
            transaction.get(orderRef),
            transaction.get(attemptRef)
        ]);
        if (!snapshotExists(orderSnap) || !snapshotExists(attemptSnap)) {
            return persistIncident(transaction, {
                code: 'refund_attempt_or_order_missing',
                orderId,
                refund,
                details: {
                    orderMissing: !snapshotExists(orderSnap),
                    attemptMissing: !snapshotExists(attemptSnap)
                }
            });
        }

        const storedOrder = orderSnap.data();
        const storedAttempt = attemptSnap.data();
        validateOrderV2(storedOrder);
        validateRefundAttempt(storedAttempt);
        const order = { ...storedOrder, id: orderId };
        try {
            validateProviderRefund(refund, order, storedAttempt);
            const eventAccountId = entry?.scope === 'connect' ? entry.accountId : null;
            if (eventAccountId !== (storedAttempt.connectedAccountId || null)) {
                throw applierError('COMMERCE_CONNECT_PIN_MISMATCH');
            }
        } catch (cause) {
            const reviewed = reduceOrder(order, {
                type: 'mark_needs_review',
                reason: cause?.code || 'refund_mismatch'
            }, { clock });
            return persistIncident(transaction, {
                code: 'refund_mismatch',
                orderId,
                refund,
                details: {
                    reason: cause?.code || 'unknown',
                    fields: cause?.detail || null
                },
                order: reviewed
            });
        }

        const providerOutcome = refund.status === 'succeeded'
            ? 'succeeded'
            : (['failed', 'canceled'].includes(refund.status) ? 'failed' : 'pending');
        if (['succeeded', 'failed'].includes(storedAttempt.status)) {
            if (
                storedAttempt.status === providerOutcome &&
                storedAttempt.refundId === refund.id
            ) {
                return { action: providerOutcome, reused: true, order };
            }
            const reviewed = reduceOrder(order, {
                type: 'mark_needs_review',
                reason: 'terminal_refund_conflict'
            }, { clock });
            return persistIncident(transaction, {
                code: 'terminal_refund_conflict',
                orderId,
                refund,
                order: reviewed
            });
        }

        const nextAttempt = transitionRefundAttempt(storedAttempt, {
            type: 'provider_observed',
            refundId: refund.id,
            providerStatus: refund.status
        }, { clock });
        if (nextAttempt.status === 'provider_pending') {
            transaction.set(attemptRef, nextAttempt);
            return { action: 'pending', attempt: nextAttempt };
        }

        const outcome = nextAttempt.status;
        const auditRef = refs.auditEvent(orderId, `refund-${outcome}-${refundRequestId}`);
        const effectType = outcome === 'succeeded' ? 'refund_succeeded' : 'refund_failed';
        const fact = outcome === 'succeeded'
            ? buildFinancialFact({
                orderId,
                type: 'refund',
                amountCents: nextAttempt.amountCents,
                currency: nextAttempt.currency,
                connectedAccountId: nextAttempt.connectedAccountId,
                providerObjectId: refund.id,
                effectiveAt: refundEffectiveAt(refund, clock),
                commandId: refundRequestId
            })
            : null;
        const contextualFact = fact && order.testContext
            ? { ...fact, testContext: { ...order.testContext } }
            : fact;
        const emailEffectId = contextualFact?.effectId || deterministicEffectId([
            'refund',
            outcome,
            orderId,
            refundRequestId
        ]);
        const payloadSnapshot = {
            orderId,
            refundId: refund.id,
            amountCents: nextAttempt.amountCents,
            currency: nextAttempt.currency
        };
        const outboxes = [
            buildOutboxIntent({
                effectId: emailEffectId,
                aggregateType: 'order',
                aggregateId: orderId,
                effectType,
                template: outcome === 'succeeded' ? 'order-refunded' : 'order-refund-failed',
                recipientRole: 'customer',
                recipientHash: hashPayload({
                    email: order.customerSnapshot?.email || null,
                    ownerUid: order.userId
                }),
                payloadSnapshot,
                clock
            }),
            buildOutboxIntent({
                effectId: emailEffectId,
                aggregateType: 'order',
                aggregateId: orderId,
                effectType,
                template: outcome === 'succeeded' ? 'order-refunded-admin' : 'order-refund-failed-admin',
                recipientRole: 'admin',
                recipientHash: hashPayload({ role: 'admin', channel: 'transactional-sender' }),
                payloadSnapshot,
                clock
            })
        ].map((intent) => order.testContext
            ? { ...intent, testContext: { ...order.testContext } }
            : intent);
        const factRef = contextualFact ? refs.financialFact(contextualFact.effectId) : null;
        const outboxRefs = outboxes.map((intent) => refs.outbox(intent.outboxId));
        const snapshots = await Promise.all([
            transaction.get(auditRef),
            ...(factRef ? [transaction.get(factRef)] : []),
            ...outboxRefs.map((ref) => transaction.get(ref))
        ]);
        if (snapshotExists(snapshots[0])) {
            throw applierError('COMMERCE_AUDIT_APPEND_ONLY_CONFLICT');
        }

        const nextOrder = reduceOrder(order, {
            type: outcome === 'succeeded' ? 'refund_confirmed' : 'refund_failed',
            amountCents: nextAttempt.amountCents
        }, { clock });
        transaction.set(orderRef, stripId(nextOrder));
        transaction.set(attemptRef, nextAttempt);
        transaction.set(auditRef, {
            schemaVersion: 2,
            eventId: `refund-${outcome}-${refundRequestId}`,
            orderId,
            type: `refund_${outcome}`,
            actor: 'stripe_webhook_v2',
            reason: `refund_${refund.status}`,
            amountCents: nextAttempt.amountCents,
            currency: nextAttempt.currency,
            refundId: refund.id,
            connectedAccountId: nextAttempt.connectedAccountId,
            stateVersionBefore: order.stateVersion,
            stateVersionAfter: nextOrder.stateVersion,
            createdAt: clock.now()
        });
        let snapshotIndex = 1;
        if (factRef) {
            if (!snapshotExists(snapshots[snapshotIndex])) {
                transaction.set(factRef, contextualFact);
                writeFinancialRollups(transaction, {
                    refs,
                    fact: contextualFact,
                    updatedAt: clock.now(),
                    increment
                });
            }
            snapshotIndex += 1;
        }
        for (let index = 0; index < outboxes.length; index += 1) {
            if (!snapshotExists(snapshots[snapshotIndex + index])) {
                transaction.set(outboxRefs[index], outboxes[index]);
            }
        }
        return { action: outcome, order: nextOrder, attempt: nextAttempt };
    }

    return Object.freeze({ apply });
}

module.exports = { createRefundEffectApplier };
