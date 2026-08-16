'use strict';

const crypto = require('crypto');

const DEFAULT_LEASE_MS = 60_000;
const DEFAULT_MAX_ATTEMPTS = 8;
const DEFAULT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

function deliveryError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function deliveryIdFor(orderId, kind) {
    return crypto.createHash('sha256')
        .update(`${String(orderId || '')}\u001f${String(kind || '')}`)
        .digest('hex');
}

function claimDeliveryState(current, input) {
    const nowMillis = Number(input?.nowMillis);
    const leaseMs = Number(input?.leaseMs || DEFAULT_LEASE_MS);
    const maxAttempts = Number(input?.maxAttempts || DEFAULT_MAX_ATTEMPTS);
    const retentionMs = Number(input?.retentionMs || DEFAULT_RETENTION_MS);
    const leaseToken = String(input?.leaseToken || '');
    if (!Number.isSafeInteger(nowMillis) || !Number.isSafeInteger(leaseMs) || leaseMs <= 0
        || !Number.isSafeInteger(maxAttempts) || maxAttempts <= 0
        || !Number.isSafeInteger(retentionMs) || retentionMs <= 0 || leaseToken.length < 8) {
        throw deliveryError('LEGACY_EMAIL_CLAIM_INPUT_INVALID');
    }

    const existing = current || {};
    if (['sent', 'dead_letter', 'delivery_unknown'].includes(existing.status)) {
        return { action: 'skip', state: existing };
    }
    if (existing.status === 'processing' && Number(existing.processingUntil || 0) > nowMillis) {
        return { action: 'skip', state: existing };
    }
    if (existing.status === 'processing' && existing.provider === 'gmail') {
        return {
            action: 'skip',
            state: {
                ...existing,
                status: 'delivery_unknown',
                leaseToken: null,
                processingUntil: null,
                nextAttemptAt: null,
                purgeAt: new Date(nowMillis + retentionMs),
                lastError: 'GMAIL_LEASE_EXPIRED_AFTER_AMBIGUOUS_DELIVERY',
                updatedAt: input.now
            }
        };
    }
    if (existing.status === 'failed' && Number(existing.nextAttemptAt || 0) > nowMillis) {
        return { action: 'retry_later', state: existing };
    }

    const attemptCount = Number(existing.attemptCount || 0);
    if (attemptCount >= maxAttempts) {
        return {
            action: 'skip',
            state: {
                ...existing,
                status: 'dead_letter',
                leaseToken: null,
                processingUntil: null,
                nextAttemptAt: null,
                purgeAt: new Date(nowMillis + retentionMs)
            }
        };
    }

    return {
        action: 'send',
        state: {
            schemaVersion: 1,
            kind: input.kind,
            orderIdHash: crypto.createHash('sha256').update(String(input.orderId || '')).digest('hex'),
            status: 'processing',
            attemptCount: attemptCount + 1,
            leaseToken,
            processingUntil: nowMillis + leaseMs,
            nextAttemptAt: null,
            provider: input.provider,
            lastError: null,
            createdAt: existing.createdAt || input.now,
            updatedAt: input.now
        }
    };
}

function assertFence(current, leaseToken, nowMillis) {
    if (current?.status !== 'processing' || current?.leaseToken !== leaseToken
        || Number(current?.processingUntil || 0) <= nowMillis) {
        throw deliveryError('LEGACY_EMAIL_FENCE_LOST');
    }
}

function failureState(current, {
    error,
    now,
    nowMillis,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    retentionMs = DEFAULT_RETENTION_MS
}) {
    const deliveryUnknown = current.provider === 'gmail' && (
        error?.deliveryUnknown === true
        || ['ECONNRESET', 'ESOCKET', 'ETIMEDOUT', 'GMAIL_SEND_FAILED'].includes(error?.code)
    );
    const retryable = error?.retryable === true && !deliveryUnknown;
    const exhausted = Number(current.attemptCount || 0) >= maxAttempts;
    const status = deliveryUnknown ? 'delivery_unknown' : (retryable && !exhausted ? 'failed' : 'dead_letter');
    const delayMs = Math.min(1000 * (2 ** Math.max(0, Number(current.attemptCount || 1) - 1)), 60 * 60 * 1000);
    return {
        ...current,
        status,
        leaseToken: null,
        processingUntil: null,
        nextAttemptAt: status === 'failed' ? nowMillis + delayMs : null,
        purgeAt: status === 'failed' ? null : new Date(nowMillis + retentionMs),
        lastError: String(error?.code || error?.name || 'EMAIL_SEND_FAILED').slice(0, 120),
        updatedAt: now
    };
}

function createLegacyOrderEmailDelivery({
    db,
    sender,
    provider,
    clock = { now: () => new Date(), nowMillis: () => Date.now() },
    leaseTokenFactory = () => crypto.randomUUID(),
    leaseMs = DEFAULT_LEASE_MS,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    retentionMs = DEFAULT_RETENTION_MS
}) {
    if (typeof db?.runTransaction !== 'function' || typeof db?.doc !== 'function'
        || typeof sender?.send !== 'function' || !['gmail', 'resend'].includes(provider)) {
        throw deliveryError('LEGACY_EMAIL_DELIVERY_DEPENDENCY_INVALID');
    }

    return async function deliver({ orderId, kind, message }) {
        const deliveryId = deliveryIdFor(orderId, kind);
        const reference = db.doc(`legacy_order_email_deliveries/${deliveryId}`);
        const leaseToken = leaseTokenFactory();
        const claim = await db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(reference);
            const now = clock.now();
            const next = claimDeliveryState(snapshot.exists ? snapshot.data() : null, {
                orderId,
                kind,
                provider,
                leaseToken,
                leaseMs,
                maxAttempts,
                retentionMs,
                now,
                nowMillis: clock.nowMillis()
            });
            if (next.action === 'send' || ['dead_letter', 'delivery_unknown'].includes(next.state.status)) {
                transaction.set(reference, next.state, { merge: true });
            }
            return next;
        });

        if (claim.action === 'retry_later') throw deliveryError('LEGACY_EMAIL_BACKOFF_ACTIVE');
        if (claim.action === 'skip') {
            return { status: claim.state.status || 'processing', skipped: true, deliveryId };
        }

        try {
            const result = await sender.send(message, { idempotencyKey: `legacy-order/${deliveryId}` });
            if (!result?.id) throw deliveryError('LEGACY_EMAIL_PROVIDER_RESPONSE_INVALID');
            await db.runTransaction(async (transaction) => {
                const snapshot = await transaction.get(reference);
                if (!snapshot.exists) throw deliveryError('LEGACY_EMAIL_DELIVERY_MISSING');
                const now = clock.now();
                const nowMillis = clock.nowMillis();
                assertFence(snapshot.data(), leaseToken, nowMillis);
                transaction.set(reference, {
                    ...snapshot.data(),
                    status: 'sent',
                    leaseToken: null,
                    processingUntil: null,
                    nextAttemptAt: null,
                    purgeAt: new Date(nowMillis + retentionMs),
                    providerMessageId: String(result.id).slice(0, 512),
                    sentAt: now,
                    updatedAt: now
                });
            });
            return { status: 'sent', skipped: false, deliveryId };
        } catch (error) {
            const failed = await db.runTransaction(async (transaction) => {
                const snapshot = await transaction.get(reference);
                if (!snapshot.exists) throw deliveryError('LEGACY_EMAIL_DELIVERY_MISSING');
                const now = clock.now();
                const nowMillis = clock.nowMillis();
                assertFence(snapshot.data(), leaseToken, nowMillis);
                const next = failureState(snapshot.data(), {
                    error,
                    now,
                    nowMillis,
                    maxAttempts,
                    retentionMs
                });
                transaction.set(reference, next);
                return next;
            });
            if (failed.status === 'failed') throw error;
            return { status: failed.status, skipped: false, deliveryId };
        }
    };
}

module.exports = {
    DEFAULT_LEASE_MS,
    DEFAULT_MAX_ATTEMPTS,
    DEFAULT_RETENTION_MS,
    assertFence,
    claimDeliveryState,
    createLegacyOrderEmailDelivery,
    deliveryIdFor,
    failureState
};
