'use strict';

function workerError(code, cause = null) {
    const error = new Error(code);
    error.code = code;
    if (cause) error.cause = cause;
    return error;
}

function createWebhookWorker({
    inboxRepository,
    retrievePaymentIntent,
    applyPaymentIntent,
    ids,
    clock,
    leaseMs = 60_000,
    failpoints = null
}) {
    if (
        !inboxRepository ||
        typeof inboxRepository.claim !== 'function' ||
        typeof inboxRepository.applyProcessed !== 'function' ||
        typeof inboxRepository.fail !== 'function' ||
        typeof retrievePaymentIntent !== 'function' ||
        typeof applyPaymentIntent !== 'function' ||
        typeof ids?.leaseToken !== 'function' ||
        typeof clock?.now !== 'function' ||
        typeof clock?.nowMillis !== 'function' ||
        !Number.isSafeInteger(leaseMs) ||
        leaseMs <= 0
    ) {
        throw workerError('COMMERCE_WEBHOOK_WORKER_DEPENDENCY_INVALID');
    }

    async function process(inboxId) {
        const leaseToken = ids.leaseToken();
        const claimed = await inboxRepository.claim(inboxId, {
            leaseToken,
            nowMillis: clock.nowMillis(),
            leaseMs
        });
        try {
            if (
                !claimed.objectId ||
                !claimed.type.startsWith('payment_intent.')
            ) {
                throw workerError('COMMERCE_WEBHOOK_EVENT_UNSUPPORTED');
            }
            const accountId = claimed.scope === 'connect' ? claimed.accountId : null;
            const paymentIntent = await retrievePaymentIntent(claimed.objectId, accountId);
            failpoints?.hit('inbox.after_retrieve');
            if (
                !paymentIntent ||
                paymentIntent.id !== claimed.objectId ||
                (paymentIntent.connectedAccountId || null) !== accountId
            ) {
                throw workerError('COMMERCE_WEBHOOK_PROVIDER_SCOPE_MISMATCH');
            }
            return await inboxRepository.applyProcessed({
                inboxId,
                leaseToken,
                nowMillis: clock.nowMillis(),
                processedAt: clock.now(),
                applyDomainEffects: (transaction, entry) => applyPaymentIntent(transaction, {
                    entry,
                    paymentIntent
                })
            });
        } catch (cause) {
            try {
                await inboxRepository.fail(inboxId, {
                    leaseToken,
                    nowMillis: clock.nowMillis(),
                    errorMessage: cause?.code || cause?.message || 'unknown'
                });
            } catch (failureCause) {
                if (failureCause?.code !== 'COMMERCE_INBOX_FENCE_LOST') throw failureCause;
            }
            throw cause;
        }
    }

    return Object.freeze({ process });
}

module.exports = { createWebhookWorker };
