'use strict';

function outboxError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function snapshotExists(snapshot) {
    return typeof snapshot.exists === 'function' ? snapshot.exists() : snapshot.exists === true;
}

function assertFence(entry, leaseToken, nowMillis) {
    if (
        entry.status !== 'processing' ||
        entry.leaseToken !== leaseToken ||
        !Number.isSafeInteger(entry.processingUntil) ||
        entry.processingUntil <= nowMillis
    ) {
        throw outboxError('COMMERCE_OUTBOX_FENCE_LOST');
    }
}

function claim(entry, { leaseToken, nowMillis, leaseMs, expectedAttemptCount, expectedNextAttemptAt }) {
    if (Number.isFinite(entry.nextAttemptAt) && entry.nextAttemptAt > nowMillis) throw outboxError('COMMERCE_OUTBOX_NOT_DUE');
    if ((expectedAttemptCount !== undefined && expectedAttemptCount !== entry.attemptCount)
        || (expectedNextAttemptAt !== undefined && expectedNextAttemptAt !== (entry.nextAttemptAt || 0))) {
        throw outboxError('COMMERCE_OUTBOX_STALE_ATTEMPT');
    }
    const expired = entry.status === 'processing' &&
        Number.isSafeInteger(entry.processingUntil) &&
        entry.processingUntil <= nowMillis;
    if (
        typeof leaseToken !== 'string' ||
        leaseToken.length < 8 ||
        !Number.isSafeInteger(nowMillis) ||
        !Number.isSafeInteger(leaseMs) ||
        leaseMs <= 0 ||
        (!['pending', 'failed'].includes(entry.status) && !expired)
    ) {
        throw outboxError('COMMERCE_OUTBOX_NOT_CLAIMABLE');
    }
    if (expired && (entry.deliveryStartedAt != null || entry.deliveryContractVersion !== 2)) return {
        ...entry, status: 'delivery_unknown', leaseToken: null, processingUntil: null, nextAttemptAt: null
    };
    return {
        ...entry,
        status: 'processing',
        deliveryContractVersion: 2,
        leaseToken,
        processingUntil: nowMillis + leaseMs,
        attemptCount: entry.attemptCount + 1
    };
}

function createOutboxRepository({ db, refs }) {
    if (typeof db?.runTransaction !== 'function' || typeof refs?.outbox !== 'function') {
        throw outboxError('COMMERCE_OUTBOX_REPOSITORY_DEPENDENCY_INVALID');
    }

    return Object.freeze({
        async beginDelivery(outboxId, { leaseToken, nowMillis }) {
            const ref = refs.outbox(outboxId);
            return db.runTransaction(async (transaction) => {
                const snapshot = await transaction.get(ref);
                if (!snapshotExists(snapshot)) throw outboxError('COMMERCE_OUTBOX_MISSING');
                const entry = snapshot.data();
                assertFence(entry, leaseToken, nowMillis);
                transaction.set(ref, { ...entry, deliveryStartedAt: nowMillis });
            });
        },
        async claim(outboxId, lease) {
            const ref = refs.outbox(outboxId);
            return db.runTransaction(async (transaction) => {
                const snapshot = await transaction.get(ref);
                if (!snapshotExists(snapshot)) throw outboxError('COMMERCE_OUTBOX_MISSING');
                const next = claim(snapshot.data(), lease);
                transaction.set(ref, next);
                return next;
            });
        },

        async markSent(outboxId, {
            leaseToken,
            nowMillis,
            providerMessageId,
            sentAt,
            purgeAt
        }) {
            const ref = refs.outbox(outboxId);
            return db.runTransaction(async (transaction) => {
                const snapshot = await transaction.get(ref);
                if (!snapshotExists(snapshot)) throw outboxError('COMMERCE_OUTBOX_MISSING');
                const entry = snapshot.data();
                assertFence(entry, leaseToken, nowMillis);
                const next = {
                    ...entry,
                    status: 'sent',
                    leaseToken: null,
                    processingUntil: null,
                    nextAttemptAt: null,
                    providerMessageId,
                    lastError: null,
                    sentAt,
                    purgeAt
                };
                transaction.set(ref, next);
                return next;
            });
        },

        async markSuppressed(outboxId, {
            leaseToken,
            nowMillis,
            suppressedAt,
            purgeAt,
            reason = 'fixture'
        }) {
            const ref = refs.outbox(outboxId);
            return db.runTransaction(async (transaction) => {
                const snapshot = await transaction.get(ref);
                if (!snapshotExists(snapshot)) throw outboxError('COMMERCE_OUTBOX_MISSING');
                const entry = snapshot.data();
                assertFence(entry, leaseToken, nowMillis);
                const next = {
                    ...entry,
                    status: reason === 'fixture' ? 'suppressed_test' : 'suppressed_stale',
                    leaseToken: null,
                    processingUntil: null,
                    nextAttemptAt: null,
                    providerMessageId: null,
                    lastError: null,
                    suppressedReason: reason,
                    suppressedAt,
                    purgeAt
                };
                transaction.set(ref, next);
                return next;
            });
        },

        async markFailed(outboxId, {
            leaseToken,
            nowMillis,
            errorMessage,
            maxAttempts = 8,
            baseBackoffMs = 1000
        }) {
            const ref = refs.outbox(outboxId);
            return db.runTransaction(async (transaction) => {
                const snapshot = await transaction.get(ref);
                if (!snapshotExists(snapshot)) throw outboxError('COMMERCE_OUTBOX_MISSING');
                const entry = snapshot.data();
                assertFence(entry, leaseToken, nowMillis);
                const deadLetter = entry.attemptCount >= maxAttempts;
                const delay = Math.min(
                    baseBackoffMs * (2 ** Math.max(0, entry.attemptCount - 1)),
                    60 * 60 * 1000
                );
                const next = {
                    ...entry,
                    status: deadLetter ? 'dead_letter' : 'failed',
                    leaseToken: null,
                    processingUntil: null,
                    nextAttemptAt: deadLetter ? null : nowMillis + delay,
                    deliveryStartedAt: null,
                    lastError: String(errorMessage || 'unknown').slice(0, 500)
                };
                transaction.set(ref, next);
                return next;
            });
        },

        async markDeliveryUnknown(outboxId, {
            leaseToken,
            nowMillis,
            errorMessage,
            observedAt
        }) {
            const ref = refs.outbox(outboxId);
            return db.runTransaction(async (transaction) => {
                const snapshot = await transaction.get(ref);
                if (!snapshotExists(snapshot)) throw outboxError('COMMERCE_OUTBOX_MISSING');
                const entry = snapshot.data();
                assertFence(entry, leaseToken, nowMillis);
                const next = {
                    ...entry,
                    status: 'delivery_unknown',
                    leaseToken: null,
                    processingUntil: null,
                    nextAttemptAt: null,
                    lastError: String(errorMessage || 'gmail_delivery_unknown').slice(0, 500),
                    deliveryUnknownAt: observedAt
                };
                transaction.set(ref, next);
                return next;
            });
        }
    });
}

module.exports = {
    assertFence,
    claim,
    createOutboxRepository
};
