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
        typeof repository?.markDeliveryUnknown !== 'function' ||
        typeof send !== 'function' ||
        typeof ids?.leaseToken !== 'function' ||
        typeof clock?.now !== 'function' ||
        typeof clock?.nowMillis !== 'function' ||
        !Number.isSafeInteger(leaseMs) ||
        leaseMs <= 0
    ) {
        throw workerError('COMMERCE_OUTBOX_WORKER_DEPENDENCY_INVALID');
    }

    async function process(outboxId, attempt = {}) {
        const leaseToken = ids.leaseToken();
        const entry = await repository.claim(outboxId, {
            leaseToken,
            nowMillis: clock.nowMillis(),
            leaseMs,
            ...attempt
        });
        if (entry.status === 'delivery_unknown') return entry;
        if (entry.testContext?.runId || entry.testContext?.fixtureScopeVersion) {
            if (typeof repository.markSuppressed !== 'function') {
                throw workerError('COMMERCE_OUTBOX_FIXTURE_SUPPRESSION_UNAVAILABLE');
            }
            const nowMillis = clock.nowMillis();
            return repository.markSuppressed(outboxId, {
                leaseToken,
                nowMillis,
                suppressedAt: clock.now(),
                purgeAt: new Date(nowMillis + retentionMs)
            });
        }
        let accepted = false;
        try {
            if (repository.beginDelivery) await repository.beginDelivery(outboxId, { leaseToken, nowMillis: clock.nowMillis() });
            const response = await send({
                idempotencyKey: entry.outboxId,
                template: entry.template,
                recipientRole: entry.recipientRole,
                payload: entry.payloadSnapshot
            });
            if (response?.suppressed === true) {
                const nowMillis = clock.nowMillis();
                return repository.markSuppressed(outboxId, {
                    leaseToken,
                    nowMillis,
                    suppressedAt: clock.now(),
                    purgeAt: new Date(nowMillis + retentionMs),
                    reason: response.reason || 'stale_effect'
                });
            }
            // A resolved sender may already have delivered the message even if
            // its acknowledgement is incomplete. Never retry it blindly.
            accepted = true;
            if (!response || typeof response.providerMessageId !== 'string' || !response.providerMessageId.trim()) {
                throw workerError('COMMERCE_OUTBOX_PROVIDER_RESPONSE_INVALID');
            }
            return await repository.markSent(outboxId, {
                leaseToken,
                nowMillis: clock.nowMillis(),
                providerMessageId: response.providerMessageId,
                sentAt: clock.now(),
                purgeAt: new Date(clock.nowMillis() + retentionMs)
            });
        } catch (cause) {
            try {
                if (accepted || cause?.deliveryUnknown === true || cause?.code === 'GMAIL_DELIVERY_UNKNOWN') {
                    await repository.markDeliveryUnknown(outboxId, {
                        leaseToken,
                        nowMillis: clock.nowMillis(),
                        errorMessage: cause?.code || cause?.message || 'unknown',
                        observedAt: clock.now()
                    });
                } else {
                    await repository.markFailed(outboxId, {
                        leaseToken,
                        nowMillis: clock.nowMillis(),
                        errorMessage: cause?.code || cause?.message || 'unknown',
                        // Une erreur d'authentification/configuration ne guerira
                        // pas avec huit retries SMTP identiques. Elle part
                        // immediatement en dead-letter et devient visible par la
                        // supervision.
                        ...(cause?.retryable === false ? { maxAttempts: 1 } : {})
                    });
                }
            } catch (failureCause) {
                if (failureCause?.code !== 'COMMERCE_OUTBOX_FENCE_LOST') throw failureCause;
            }
            throw cause;
        }
    }

    return Object.freeze({ process });
}

module.exports = { createOutboxWorker };
