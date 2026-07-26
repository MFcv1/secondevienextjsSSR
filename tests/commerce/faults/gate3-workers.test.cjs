'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    createBoundedWorkerSweeper
} = require('../../../functions/src/commerce/domain/boundedWorkerSweeper');
const {
    createCheckoutCoordinator
} = require('../../../functions/src/commerce/domain/checkoutCoordinator');
const {
    createFailpointController
} = require('../../../functions/src/commerce/domain/failpoints');
const {
    createOutboxWorker
} = require('../../../functions/src/commerce/domain/outboxWorker');
const {
    createStripeWebhookIngress
} = require('../../../functions/src/commerce/domain/stripeWebhookIngress');
const {
    createWebhookWorker
} = require('../../../functions/src/commerce/domain/webhookWorker');
const {
    createCommerceV2Runtime
} = require('../../../functions/src/commerce/domain/v2Runtime');

function fixedRuntimeClock() {
    return {
        now: () => '2026-07-26T12:00:00.000Z',
        nowMillis: () => 1_000
    };
}

function paymentIntent(accountId = 'acct_workerready01') {
    return {
        id: 'pi_worker_0001',
        status: 'processing',
        amount: 14000,
        currency: 'eur',
        metadata: {
            orderId: 'order-worker-0001',
            requestHash: 'a'.repeat(64)
        },
        connectedAccountId: accountId
    };
}

function fakeInboxRepository(entry) {
    let failed = 0;
    let applied = 0;
    return {
        get failed() {
            return failed;
        },
        get applied() {
            return applied;
        },
        async claim() {
            return { ...entry };
        },
        async applyProcessed({ applyDomainEffects }) {
            applied += 1;
            return applyDomainEffects({}, entry);
        },
        async fail() {
            failed += 1;
        }
    };
}

test('create crash after hold resumes the durable checkout without a second hold', async () => {
    let prepares = 0;
    let ensures = 0;
    const prepared = {
        order: { id: 'order-worker-0001' },
        attempt: { attemptId: 'attempt-worker-0001' }
    };
    const checkoutRepository = {
        async prepareCheckout() {
            prepares += 1;
            return { ...prepared, reused: prepares > 1 };
        },
        async loadOwnedCheckout() {
            return prepared;
        }
    };
    const sagaService = {
        hitAfterHold() {
            const error = new Error('COMMERCE_FAILPOINT_TRIGGERED');
            error.code = 'COMMERCE_FAILPOINT_TRIGGERED';
            throw error;
        },
        async ensurePaymentIntent(value) {
            ensures += 1;
            return value;
        }
    };
    const coordinator = createCheckoutCoordinator({ checkoutRepository, sagaService });
    await assert.rejects(coordinator.createCheckout({}), {
        code: 'COMMERCE_FAILPOINT_TRIGGERED'
    });
    assert.equal(ensures, 0);
    const retry = await coordinator.createCheckout({});
    assert.equal(retry.order.id, 'order-worker-0001');
    assert.equal(prepares, 2);
    assert.equal(ensures, 1);
});

test('webhook ingress rejects a wrong secret and separates two Connect accounts', async () => {
    const persisted = [];
    const ingress = createStripeWebhookIngress({
        verifyPlatformEvent: async (rawBody, signature) => {
            if (signature !== 'platform-secret') throw new Error('bad signature');
            return JSON.parse(rawBody.toString());
        },
        verifyConnectEvent: async (rawBody, signature) => {
            if (signature !== 'connect-secret') throw new Error('bad signature');
            return JSON.parse(rawBody.toString());
        },
        inboxRepository: {
            async persist(entry) {
                persisted.push(entry);
                return entry;
            }
        },
        clock: fixedRuntimeClock()
    });
    const event = (eventId, account) => Buffer.from(JSON.stringify({
        id: eventId,
        type: 'payment_intent.succeeded',
        account,
        created: 1,
        livemode: false,
        data: { object: { id: `pi_${eventId}` } }
    }));
    await assert.rejects(ingress.ingest({
        scope: 'connect',
        rawBody: event('evt_worker_bad', 'acct_workerready01'),
        signature: 'wrong-secret',
        accountId: 'acct_workerready01'
    }), { code: 'COMMERCE_WEBHOOK_SIGNATURE_INVALID' });
    await ingress.ingest({
        scope: 'connect',
        rawBody: event('evt_worker_one', 'acct_workerready01'),
        signature: 'connect-secret',
        accountId: 'acct_workerready01'
    });
    await ingress.ingest({
        scope: 'connect',
        rawBody: event('evt_worker_two', 'acct_workerready02'),
        signature: 'connect-secret',
        accountId: 'acct_workerready02'
    });
    assert.equal(persisted.length, 2);
    assert.notEqual(persisted[0].inboxId, persisted[1].inboxId);
    assert.deepEqual(persisted.map((entry) => entry.accountId), [
        'acct_workerready01',
        'acct_workerready02'
    ]);
});

test('worker crash after retrieve is retryable and commits no domain effect', async () => {
    const repository = fakeInboxRepository({
        inboxId: 'inbox-worker-0001',
        type: 'payment_intent.processing',
        objectId: 'pi_worker_0001',
        scope: 'connect',
        accountId: 'acct_workerready01'
    });
    const worker = createWebhookWorker({
        inboxRepository: repository,
        retrievePaymentIntent: async () => paymentIntent(),
        applyPaymentIntent: async () => {
            throw new Error('must not run');
        },
        ids: { leaseToken: () => 'lease-worker-0001' },
        clock: fixedRuntimeClock(),
        failpoints: createFailpointController({
            'inbox.after_retrieve': 1
        })
    });
    await assert.rejects(worker.process('inbox-worker-0001'), {
        code: 'COMMERCE_FAILPOINT_TRIGGERED'
    });
    assert.equal(repository.applied, 0);
    assert.equal(repository.failed, 1);
});

test('worker pins provider retrieval to the inbox Connect account', async () => {
    const repository = fakeInboxRepository({
        inboxId: 'inbox-worker-0002',
        type: 'payment_intent.processing',
        objectId: 'pi_worker_0001',
        scope: 'connect',
        accountId: 'acct_workerready01'
    });
    const worker = createWebhookWorker({
        inboxRepository: repository,
        retrievePaymentIntent: async () => paymentIntent('acct_workerready02'),
        applyPaymentIntent: async () => ({ applied: true }),
        ids: { leaseToken: () => 'lease-worker-0002' },
        clock: fixedRuntimeClock()
    });
    await assert.rejects(worker.process('inbox-worker-0002'), {
        code: 'COMMERCE_WEBHOOK_PROVIDER_SCOPE_MISMATCH'
    });
    assert.equal(repository.applied, 0);
    assert.equal(repository.failed, 1);
});

test('bounded sweeper finds an eligible item behind more than fifty irrelevant rows', async () => {
    const irrelevant = Array.from({ length: 75 }, (_, index) => ({
        id: `irrelevant-${String(index).padStart(4, '0')}`,
        eligible: false
    }));
    const source = [
        ...irrelevant,
        { id: 'eligible-worker-0001', eligible: true }
    ];
    const processed = [];
    const sweeper = createBoundedWorkerSweeper({
        listEligible: async ({ limit, cursor }) => {
            assert.equal(limit, 25);
            const eligible = source.filter((item) => item.eligible);
            const offset = cursor ? Number(cursor) : 0;
            const items = eligible.slice(offset, offset + limit);
            const nextOffset = offset + items.length;
            return {
                items,
                nextCursor: nextOffset < eligible.length ? String(nextOffset) : null
            };
        },
        processItem: async (item) => {
            processed.push(item.id);
        },
        clock: fixedRuntimeClock(),
        pageSize: 25,
        maxPages: 2
    });
    const result = await sweeper.run();
    assert.deepEqual(processed, ['eligible-worker-0001']);
    assert.equal(result.processed, 1);
    assert.equal(result.failures.length, 0);
});

test('outbox worker forwards the deterministic outbox id as provider idempotency key', async () => {
    let sentInput = null;
    let marked = null;
    const worker = createOutboxWorker({
        repository: {
            async claim() {
                return {
                    outboxId: 'outbox-worker-0001',
                    template: 'order-paid',
                    recipientRole: 'customer',
                    payloadSnapshot: { orderId: 'order-worker-0001' }
                };
            },
            async markSent(outboxId, input) {
                marked = { outboxId, ...input };
                return marked;
            },
            async markFailed() {
                throw new Error('must not fail');
            }
        },
        send: async (input) => {
            sentInput = input;
            return { providerMessageId: 'message-worker-0001' };
        },
        ids: { leaseToken: () => 'lease-outbox-0001' },
        clock: fixedRuntimeClock()
    });
    await worker.process('outbox-worker-0001');
    assert.equal(sentInput.idempotencyKey, 'outbox-worker-0001');
    assert.equal(marked.providerMessageId, 'message-worker-0001');
});

test('dormant v2 runtime wires every writer and worker without exporting a Function', () => {
    const runtime = createCommerceV2Runtime({
        db: {
            doc: (path) => ({ path }),
            collection: () => ({}),
            runTransaction: async (run) => run({})
        },
        stripe: {
            paymentIntents: {
                create: async () => null,
                retrieve: async () => null,
                cancel: async () => null
            },
            refunds: {
                create: async () => null,
                retrieve: async () => null
            },
            webhooks: {
                constructEvent: () => null
            }
        },
        appId: 'seconde-vie',
        platformWebhookSecret: 'whsec_platform_test',
        connectWebhookSecret: 'whsec_connect_test',
        sendOutbox: async () => ({ providerMessageId: 'message-runtime-0001' }),
        clock: fixedRuntimeClock()
    });
    assert.equal(typeof runtime.checkout.createCheckout, 'function');
    assert.equal(typeof runtime.checkout.resumeCheckout, 'function');
    assert.equal(typeof runtime.guestCheckout.resumeCheckout, 'function');
    assert.equal(typeof runtime.webhookIngress.ingest, 'function');
    assert.equal(typeof runtime.webhookWorker.process, 'function');
    assert.equal(typeof runtime.outboxWorker.process, 'function');
    assert.equal(typeof runtime.expiryWorker.process, 'function');
    assert.equal(typeof runtime.orderCommands.execute, 'function');
    assert.equal(typeof runtime.productCommands.execute, 'function');
    assert.equal(typeof runtime.cancellations.requestCancellation, 'function');
    assert.equal(typeof runtime.refunds.requestRefund, 'function');
    assert.equal(typeof runtime.returns.create, 'function');
    assert.equal(typeof runtime.sweepers.dueInbox.run, 'function');
    assert.equal(typeof runtime.sweepers.expiredReservations.run, 'function');
});
