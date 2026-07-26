'use strict';

function workerError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function createOutboxWorker({
    repository,
    send,
    ids,
    clock,
    leaseMs = 60_000,
    retentionMs = 90 * 24 * 60 * 60 * 1000
}) {
    if (
        typeof repository?.claim !== 'function' ||
        typeof repository?.markSent !== 'function' ||
        typeof repository?.markFailed !== 'function' ||
        typeof send !== 'function' ||
        typeof ids?.leaseToken !== 'function' ||
        typeof clock?.now !== 'function' ||
        typeof clock?.nowMillis !== 'function' ||
        !Number.isSafeInteger(leaseMs) ||
        leaseMs <= 0
    ) {
        throw workerError('COMMERCE_OUTBOX_WORKER_DEPENDENCY_INVALID');
    }

    async function process(outboxId) {
        const leaseToken = ids.leaseToken();
        const entry = await repository.claim(outboxId, {
            leaseToken,
            nowMillis: clock.nowMillis(),
            leaseMs
        });
        try {
            const response = await send({
                idempotencyKey: entry.outboxId,
                template: entry.template,
                recipientRole: entry.recipientRole,
                payload: entry.payloadSnapshot
            });
            if (!response || typeof response.providerMessageId !== 'string') {
                throw workerError('COMMERCE_OUTBOX_PROVIDER_RESPONSE_INVALID');
            }
            return repository.markSent(outboxId, {
                leaseToken,
                nowMillis: clock.nowMillis(),
                providerMessageId: response.providerMessageId,
                sentAt: clock.now(),
                purgeAt: new Date(clock.nowMillis() + retentionMs).toISOString()
            });
        } catch (cause) {
            try {
                await repository.markFailed(outboxId, {
                    leaseToken,
                    nowMillis: clock.nowMillis(),
                    errorMessage: cause?.code || cause?.message || 'unknown'
                });
            } catch (failureCause) {
                if (failureCause?.code !== 'COMMERCE_OUTBOX_FENCE_LOST') throw failureCause;
            }
            throw cause;
        }
    }

    return Object.freeze({ process });
}

module.exports = { createOutboxWorker };
