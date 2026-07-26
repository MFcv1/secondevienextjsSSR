'use strict';

const { hashPayload } = require('./idempotency');

function repositoryError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function snapshotExists(snapshot) {
    return typeof snapshot.exists === 'function' ? snapshot.exists() : snapshot.exists === true;
}

function createCancellationAuditRepository({ db, refs, clock }) {
    if (
        typeof db?.runTransaction !== 'function' ||
        typeof refs?.order !== 'function' ||
        typeof refs?.commandResult !== 'function' ||
        typeof refs?.auditEvent !== 'function' ||
        typeof clock?.now !== 'function'
    ) {
        throw repositoryError('COMMERCE_CANCELLATION_AUDIT_DEPENDENCY_INVALID');
    }

    return Object.freeze({
        async lookup(commandId, actorUid, requestHash) {
            const commandRef = refs.commandResult(commandId);
            return db.runTransaction(async (transaction) => {
                const snapshot = await transaction.get(commandRef);
                if (!snapshotExists(snapshot)) return null;
                const record = snapshot.data();
                if (record.actorUid !== actorUid || record.requestHash !== requestHash) {
                    throw repositoryError('COMMERCE_IDEMPOTENCY_PAYLOAD_CONFLICT');
                }
                return record.result;
            });
        },

        async record({
            orderId,
            commandId,
            actor,
            reason,
            outcome,
            paymentIntentId
        }) {
            const commandRef = refs.commandResult(commandId);
            const auditRef = refs.auditEvent(orderId, commandId);
            const orderRef = refs.order(orderId);
            const payloadHash = hashPayload({
                orderId,
                actorUid: actor.uid,
                reason,
                outcome,
                paymentIntentId
            });
            const requestHash = hashPayload({
                orderId,
                actorUid: actor.uid,
                reason
            });
            return db.runTransaction(async (transaction) => {
                const [commandSnap, auditSnap, orderSnap] = await Promise.all([
                    transaction.get(commandRef),
                    transaction.get(auditRef),
                    transaction.get(orderRef)
                ]);
                if (snapshotExists(commandSnap)) {
                    const record = commandSnap.data();
                    if (record.actorUid !== actor.uid || record.requestHash !== requestHash) {
                        throw repositoryError('COMMERCE_IDEMPOTENCY_PAYLOAD_CONFLICT');
                    }
                    return record.result;
                }
                if (snapshotExists(auditSnap) || !snapshotExists(orderSnap)) {
                    throw repositoryError('COMMERCE_CANCELLATION_AUDIT_CONFLICT');
                }
                const result = {
                    orderId,
                    commandId,
                    outcome,
                    paymentIntentId
                };
                transaction.set(commandRef, {
                    schemaVersion: 2,
                    commandId,
                    orderId,
                    actorUid: actor.uid,
                    requestHash,
                    payloadHash,
                    result,
                    createdAt: clock.now()
                });
                transaction.set(auditRef, {
                    schemaVersion: 2,
                    eventId: commandId,
                    orderId,
                    type: outcome === 'paid'
                        ? 'cancellation_refused_paid'
                        : 'cancellation_completed',
                    actor,
                    reason,
                    outcome,
                    paymentIntentId,
                    payloadHash,
                    createdAt: clock.now()
                });
                return result;
            });
        }
    });
}

module.exports = { createCancellationAuditRepository };
