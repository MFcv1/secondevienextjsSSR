'use strict';

const crypto = require('node:crypto');
const { createInboxEntry } = require('./webhookInbox');

function ingressError(code, cause = null) {
    const error = new Error(code);
    error.code = code;
    if (cause) error.cause = cause;
    return error;
}

function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function createStripeWebhookIngress({
    verifyPlatformEvent,
    verifyConnectEvent,
    inboxRepository,
    clock
}) {
    if (
        typeof verifyPlatformEvent !== 'function' ||
        typeof verifyConnectEvent !== 'function' ||
        !inboxRepository ||
        typeof inboxRepository.persist !== 'function' ||
        !clock ||
        typeof clock.now !== 'function'
    ) {
        throw ingressError('COMMERCE_WEBHOOK_INGRESS_DEPENDENCY_INVALID');
    }

    async function ingest({ scope, rawBody, signature, accountId = null }) {
        if (
            !['platform', 'connect'].includes(scope) ||
            !(Buffer.isBuffer(rawBody) || typeof rawBody === 'string') ||
            typeof signature !== 'string' ||
            signature.length < 8
        ) {
            throw ingressError('COMMERCE_WEBHOOK_REQUEST_INVALID');
        }
        let event;
        try {
            event = scope === 'platform'
                ? await verifyPlatformEvent(rawBody, signature)
                : await verifyConnectEvent(rawBody, signature);
        } catch (cause) {
            throw ingressError('COMMERCE_WEBHOOK_SIGNATURE_INVALID', cause);
        }
        const effectiveAccountId = scope === 'connect'
            ? (accountId || event?.account || null)
            : null;
        if (!event || (
            scope === 'connect' &&
            (
                typeof effectiveAccountId !== 'string' ||
                event.account !== effectiveAccountId
            )
        ) || (scope === 'platform' && event.account)) {
            throw ingressError('COMMERCE_WEBHOOK_SCOPE_MISMATCH');
        }
        if (!event.type.startsWith('payment_intent.')) {
            return {
                ignored: true,
                eventId: event.id,
                type: event.type
            };
        }
        const entry = createInboxEntry({
            event,
            scope,
            accountId: effectiveAccountId,
            payloadHash: sha256(rawBody),
            clock
        });
        return inboxRepository.persist(entry);
    }

    return Object.freeze({ ingest });
}

module.exports = { createStripeWebhookIngress };
