'use strict';

const crypto = require('node:crypto');

const INBOX_STATUSES = Object.freeze(['received', 'processing', 'processed', 'failed', 'dead_letter']);

function inboxError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function inboxIdFor(scope, accountId, eventId) {
    return crypto.createHash('sha256')
        .update(`v1|${scope}|${accountId || 'platform'}|${eventId}`)
        .digest('hex');
}

function createInboxEntry({ event, scope, accountId = null, payloadHash, clock }) {
    if (!clock || typeof clock.now !== 'function') throw inboxError('COMMERCE_CLOCK_REQUIRED');
    if (
        !event ||
        typeof event.id !== 'string' ||
        typeof event.type !== 'string' ||
        !['platform', 'connect'].includes(scope) ||
        (scope === 'connect' && !accountId) ||
        typeof payloadHash !== 'string' ||
        !/^[a-f0-9]{64}$/.test(payloadHash)
    ) {
        throw inboxError('COMMERCE_INBOX_EVENT_INVALID');
    }
    const serializedPayload = JSON.stringify(event);
    if (serializedPayload.length > 100_000) throw inboxError('COMMERCE_INBOX_EVENT_TOO_LARGE');
    const now = clock.now();
    const nowMillis = typeof clock.nowMillis === 'function'
        ? clock.nowMillis()
        : Date.parse(now);
    if (!Number.isSafeInteger(nowMillis)) throw inboxError('COMMERCE_CLOCK_REQUIRED');
    return {
        schemaVersion: 2,
        inboxId: inboxIdFor(scope, accountId, event.id),
        eventId: event.id,
        scope,
        accountId,
        objectId: event.data?.object?.id || null,
        type: event.type,
        eventCreated: event.created,
        apiVersion: event.api_version || null,
        livemode: event.livemode === true,
        payloadHash,
        verifiedPayloadSnapshot: JSON.parse(serializedPayload),
        signatureVerifiedAt: now,
        status: 'received',
        leaseToken: null,
        processingUntil: null,
        attemptCount: 0,
        nextAttemptAt: nowMillis,
        lastError: null,
        receivedAt: now,
        processedAt: null
    };
}

function claimInbox(entry, { leaseToken, nowMillis, leaseMs }) {
    if (!entry || !INBOX_STATUSES.includes(entry.status)) throw inboxError('COMMERCE_INBOX_INVALID');
    if (typeof leaseToken !== 'string' || leaseToken.length < 8 || !Number.isSafeInteger(nowMillis) ||
        !Number.isSafeInteger(leaseMs) || leaseMs <= 0) {
        throw inboxError('COMMERCE_INBOX_LEASE_INVALID');
    }
    const expired = entry.status === 'processing' &&
        Number.isSafeInteger(entry.processingUntil) &&
        entry.processingUntil <= nowMillis;
    if (!['received', 'failed'].includes(entry.status) && !expired) {
        throw inboxError('COMMERCE_INBOX_NOT_CLAIMABLE');
    }
    return {
        ...entry,
        status: 'processing',
        leaseToken,
        processingUntil: nowMillis + leaseMs,
        attemptCount: entry.attemptCount + 1
    };
}

function assertInboxFence(entry, leaseToken, nowMillis) {
    if (
        entry.status !== 'processing' ||
        entry.leaseToken !== leaseToken ||
        !Number.isSafeInteger(entry.processingUntil) ||
        entry.processingUntil <= nowMillis
    ) {
        throw inboxError('COMMERCE_INBOX_FENCE_LOST');
    }
    return true;
}

function markInboxProcessed(entry, { leaseToken, nowMillis, processedAt }) {
    assertInboxFence(entry, leaseToken, nowMillis);
    return {
        ...entry,
        status: 'processed',
        leaseToken: null,
        processingUntil: null,
        nextAttemptAt: null,
        lastError: null,
        processedAt
    };
}

function markInboxFailed(entry, {
    leaseToken,
    nowMillis,
    errorMessage,
    maxAttempts = 8,
    baseBackoffMs = 1000
}) {
    assertInboxFence(entry, leaseToken, nowMillis);
    const deadLetter = entry.attemptCount >= maxAttempts;
    const delay = Math.min(baseBackoffMs * (2 ** Math.max(0, entry.attemptCount - 1)), 60 * 60 * 1000);
    return {
        ...entry,
        status: deadLetter ? 'dead_letter' : 'failed',
        leaseToken: null,
        processingUntil: null,
        nextAttemptAt: deadLetter ? null : nowMillis + delay,
        lastError: String(errorMessage || 'unknown').slice(0, 500)
    };
}

module.exports = {
    INBOX_STATUSES,
    assertInboxFence,
    claimInbox,
    createInboxEntry,
    inboxIdFor,
    markInboxFailed,
    markInboxProcessed
};
