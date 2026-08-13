'use strict';

const crypto = require('node:crypto');
const { hashPayload } = require('./idempotency');

function effectError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function deterministicEffectId(parts) {
    if (!Array.isArray(parts) || parts.length === 0 || parts.some((part) => typeof part !== 'string' || !part)) {
        throw effectError('COMMERCE_EFFECT_ID_INVALID');
    }
    return crypto.createHash('sha256')
        .update(`v1|${parts.map((part) => `${Buffer.byteLength(part)}:${part}`).join('|')}`)
        .digest('hex');
}

function buildFinancialFact({
    orderId,
    type,
    amountCents,
    currency,
    connectedAccountId,
    providerObjectId,
    effectiveAt,
    commandId
}) {
    if (
        !['capture', 'refund', 'refund_reversal'].includes(type) ||
        !Number.isSafeInteger(amountCents) ||
        amountCents <= 0 ||
        currency !== 'EUR'
    ) {
        throw effectError('COMMERCE_FINANCIAL_FACT_INVALID');
    }
    const effectId = deterministicEffectId([
        'financial',
        type,
        connectedAccountId || 'platform',
        providerObjectId
    ]);
    return {
        schemaVersion: 2,
        effectId,
        orderId,
        type,
        amountCents,
        currency,
        connectedAccountId: connectedAccountId || null,
        providerObjectId,
        effectiveAt,
        commandId
    };
}

function buildOutboxIntent({
    effectId,
    aggregateType,
    aggregateId,
    effectType,
    template,
    recipientRole,
    recipientHash,
    payloadSnapshot,
    clock
}) {
    if (!clock || typeof clock.now !== 'function') throw effectError('COMMERCE_CLOCK_REQUIRED');
    const now = clock.now();
    const nowMillis = typeof clock.nowMillis === 'function'
        ? clock.nowMillis()
        : Date.parse(now);
    if (!Number.isSafeInteger(nowMillis)) throw effectError('COMMERCE_CLOCK_REQUIRED');
    const outboxId = deterministicEffectId([effectId, template, recipientRole, 'email']);
    return {
        schemaVersion: 2,
        outboxId,
        effectId,
        aggregateType,
        aggregateId,
        effectType,
        template,
        recipientRole,
        recipientHash,
        channel: 'email',
        payloadVersion: 1,
        payloadSnapshot,
        payloadHash: hashPayload(payloadSnapshot),
        status: 'pending',
        leaseToken: null,
        processingUntil: null,
        attemptCount: 0,
        nextAttemptAt: nowMillis,
        providerMessageId: null,
        lastError: null,
        createdAt: now,
        sentAt: null,
        purgeAt: null
    };
}

module.exports = {
    buildFinancialFact,
    buildOutboxIntent,
    deterministicEffectId
};
