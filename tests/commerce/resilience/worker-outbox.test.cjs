'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { createFailpointController } = require('../../../functions/src/commerce/domain/failpoints');
const { createOutboxWorker } = require('../../../functions/src/commerce/domain/outboxWorker');
const { createStripeWebhookIngress } = require('../../../functions/src/commerce/domain/stripeWebhookIngress');
const { createWebhookWorker } = require('../../../functions/src/commerce/domain/webhookWorker');

const now = '2026-08-24T13:00:00.000Z';
const clock = { now: () => now, nowMillis: () => Date.parse(now) };

function webhookEvent() {
    return {
        id: 'evt_resilience_worker_0001',
        type: 'payment_intent.succeeded',
        created: 1,
        livemode: false,
        data: { object: { id: 'pi_resilience_worker_0001' } }
    };
}

function webhookRepository() {
    let status = 'received';
    let effectCount = 0;
    let attempts = 0;
    let currentLease = null;
    return {
        get effectCount() { return effectCount; },
        get status() { return status; },
        get attempts() { return attempts; },
        async claim() {
            attempts += 1;
            currentLease = `lease-worker-${attempts}`;
            status = 'processing';
            return {
                inboxId: 'inbox-resilience-worker-0001',
                type: 'payment_intent.succeeded',
                objectId: 'pi_resilience_worker_0001',
                scope: 'platform',
                accountId: null
            };
        },
        async applyProcessed({ leaseToken, applyDomainEffects }) {
            if (leaseToken !== currentLease || status === 'processed') {
                throw Object.assign(new Error('fence lost'), { code: 'COMMERCE_INBOX_FENCE_LOST' });
            }
            const result = await applyDomainEffects({}, {});
            effectCount += 1;
            status = 'processed';
            return result;
        },
        async fail() {
            if (status === 'processed') {
                throw Object.assign(new Error('fence lost'), { code: 'COMMERCE_INBOX_FENCE_LOST' });
            }
            status = 'failed';
        }
    };
}

function outboxFixture(send) {
    const entry = {
        outboxId: 'outbox-resilience-0001',
        template: 'payment_confirmation',
        recipientRole: 'customer',
        payloadSnapshot: { orderId: 'order-resilience-0001' },
        status: 'pending',
        attemptCount: 0
    };
    const repository = {
        entry,
        async claim() {
            entry.status = 'processing';
            entry.attemptCount += 1;
            return { ...entry };
        },
        async markSent() { entry.status = 'sent'; return { ...entry }; },
        async markFailed(id, options) {
            entry.status = options.maxAttempts === 1 ? 'dead_letter' : 'failed';
            entry.lastError = options.errorMessage;
            return { ...entry };
        },
        async markDeliveryUnknown() { entry.status = 'delivery_unknown'; return { ...entry }; },
        async markSuppressed() { entry.status = 'suppressed_fixture'; return { ...entry }; }
    };
    return {
        entry,
        worker: createOutboxWorker({
            repository,
            send,
            ids: { leaseToken: () => 'lease-outbox-0001' },
            clock
        })
    };
}

test('R08 livraison webhook dupliquee ne produit qu un effet', async () => {
    const persisted = new Map();
    const ingress = createStripeWebhookIngress({
        verifyPlatformEvent: async (rawBody) => JSON.parse(rawBody.toString()),
        verifyConnectEvent: async () => { throw new Error('unused'); },
        inboxRepository: {
            async persist(entry) {
                if (!persisted.has(entry.inboxId)) persisted.set(entry.inboxId, entry);
                return persisted.get(entry.inboxId);
            }
        },
        clock
    });
    const request = {
        scope: 'platform',
        rawBody: Buffer.from(JSON.stringify(webhookEvent())),
        signature: 'signature-test-only'
    };
    const first = await ingress.ingest(request);
    const duplicate = await ingress.ingest(request);
    assert.equal(first.inboxId, duplicate.inboxId);
    assert.equal(persisted.size, 1);
});

test('R11 interruption apres claim perd la fence et le successeur commit une fois', async () => {
    const repository = webhookRepository();
    const base = {
        inboxRepository: repository,
        retrievePaymentIntent: async () => ({
            id: 'pi_resilience_worker_0001', connectedAccountId: null
        }),
        applyPaymentIntent: async () => ({ applied: true }),
        ids: { leaseToken: () => `lease-worker-${repository.attempts + 1}` },
        clock
    };
    const crashing = createWebhookWorker({
        ...base,
        failpoints: createFailpointController({ 'inbox.after_retrieve': 1 })
    });
    await assert.rejects(crashing.process('inbox-resilience-worker-0001'), {
        code: 'COMMERCE_FAILPOINT_TRIGGERED'
    });
    const result = await createWebhookWorker(base).process('inbox-resilience-worker-0001');
    assert.deepEqual(result, { applied: true });
    assert.equal(repository.effectCount, 1);
    assert.equal(repository.attempts, 2);
});

test('R11 interruption apres commit rend le retry sans effet supplementaire', async () => {
    let effects = 0;
    let processed = false;
    const repository = {
        async claim() {
            return { type: 'payment_intent.succeeded', objectId: 'pi_resilience_worker_0001', scope: 'platform', accountId: null };
        },
        async applyProcessed({ applyDomainEffects }) {
            if (processed) return { duplicate: true };
            await applyDomainEffects({}, {});
            effects += 1;
            processed = true;
            return { applied: true };
        },
        async fail() {}
    };
    const worker = createWebhookWorker({
        inboxRepository: repository,
        retrievePaymentIntent: async () => ({ id: 'pi_resilience_worker_0001', connectedAccountId: null }),
        applyPaymentIntent: async () => ({ ok: true }),
        ids: { leaseToken: () => 'lease-worker-post-commit' },
        clock
    });
    await worker.process('inbox-resilience-worker-0001');
    const retry = await worker.process('inbox-resilience-worker-0001');
    assert.deepEqual(retry, { duplicate: true });
    assert.equal(effects, 1);
});

test('R12 echec retryable e-mail devient failed sans inverser le paiement', async () => {
    const payment = { status: 'succeeded' };
    const fixture = outboxFixture(async () => {
        throw Object.assign(new Error('temporary'), { code: 'SMTP_TEMPORARY', retryable: true });
    });
    await assert.rejects(fixture.worker.process(fixture.entry.outboxId), { code: 'SMTP_TEMPORARY' });
    assert.equal(fixture.entry.status, 'failed');
    assert.equal(payment.status, 'succeeded');
});

test('R12 echec non retryable devient dead_letter a la premiere tentative', async () => {
    const fixture = outboxFixture(async () => {
        throw Object.assign(new Error('configuration'), { code: 'SMTP_CONFIGURATION', retryable: false });
    });
    await assert.rejects(fixture.worker.process(fixture.entry.outboxId), { code: 'SMTP_CONFIGURATION' });
    assert.equal(fixture.entry.status, 'dead_letter');
    assert.equal(fixture.entry.attemptCount, 1);
});

test('R12 accuse Gmail ambigu devient delivery_unknown sans nouvel envoi', async () => {
    let sends = 0;
    const fixture = outboxFixture(async () => {
        sends += 1;
        throw Object.assign(new Error('unknown'), { code: 'GMAIL_DELIVERY_UNKNOWN', deliveryUnknown: true });
    });
    await assert.rejects(fixture.worker.process(fixture.entry.outboxId), { code: 'GMAIL_DELIVERY_UNKNOWN' });
    assert.equal(fixture.entry.status, 'delivery_unknown');
    assert.equal(sends, 1);
});

test('R18 signature invalide est rejetee avant persist et sans payload sensible', async () => {
    let persists = 0;
    const ingress = createStripeWebhookIngress({
        verifyPlatformEvent: async () => { throw new Error('invalid signature'); },
        verifyConnectEvent: async () => { throw new Error('unused'); },
        inboxRepository: { async persist() { persists += 1; } },
        clock
    });
    await assert.rejects(ingress.ingest({
        scope: 'platform',
        rawBody: Buffer.from('{"sensitive":"redacted-test-value"}'),
        signature: 'invalid-signature'
    }), (error) => {
        assert.equal(error.code, 'COMMERCE_WEBHOOK_SIGNATURE_INVALID');
        assert.equal(String(error).includes('redacted-test-value'), false);
        return true;
    });
    assert.equal(persists, 0);
});
