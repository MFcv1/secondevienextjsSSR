'use strict';

const admin = require('firebase-admin');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    runTransaction,
    setDoc
} = require('firebase/firestore');
const {
    createFailpointController
} = require('../../../functions/src/commerce/domain/failpoints');
const {
    executeIdempotentCommand
} = require('../../../functions/src/commerce/domain/idempotency');
const {
    createInventoryKey
} = require('../../../functions/src/commerce/domain/inventoryKey');
const {
    reduceOrder
} = require('../../../functions/src/commerce/domain/orderState');
const {
    createReservationRepository
} = require('../../../functions/src/commerce/domain/reservationRepository');
const {
    createInboxEntry
} = require('../../../functions/src/commerce/domain/webhookInbox');
const {
    createWebhookInboxRepository
} = require('../../../functions/src/commerce/domain/webhookInboxRepository');
const {
    buildOrderDiagnostic
} = require('../../../functions/src/observability/diagnosticTimeline');
const { makeOrder } = require('../fixtures/order-v2.cjs');

const PROJECT_ID = 'demo-secondevie-commerce';
const FIRESTORE_PORT = 8185;
const FIXED_TIME = '2026-08-24T12:00:00.000Z';

function assertEmulatorBoundary() {
    if (
        process.env.GCLOUD_PROJECT !== PROJECT_ID ||
        process.env.GOOGLE_CLOUD_PROJECT !== PROJECT_ID ||
        process.env.FIRESTORE_EMULATOR_HOST !== `127.0.0.1:${FIRESTORE_PORT}`
    ) {
        throw new Error('D3 requires the fixed local demo Firestore emulator');
    }
}

async function withBackend(runId, context, run) {
    assertEmulatorBoundary();
    if (!/^run_d3_[a-z0-9_]+$/.test(runId)) throw new Error('D3 runId is invalid');
    const environment = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: { host: '127.0.0.1', port: FIRESTORE_PORT }
    });
    try {
        await environment.clearFirestore();
        await environment.withSecurityRulesDisabled(async (rulesContext) => {
            const firestore = rulesContext.firestore();
            const tracked = new Map();
            const fixtures = {
                runId,
                track: (reference) => {
                    tracked.set(reference.path, reference);
                    return reference;
                },
                async set(reference, data) {
                    tracked.set(reference.path, reference);
                    await setDoc(reference, {
                        ...data,
                        testContext: { ...(data.testContext || {}), runId }
                    });
                },
                async cleanup() {
                    const references = [...tracked.values()].reverse();
                    await Promise.all(references.map((reference) => deleteDoc(reference)));
                    const snapshots = await Promise.all(references.map((reference) => getDoc(reference)));
                    context.equal(
                        snapshots.filter((snapshot) => snapshot.exists()).length,
                        0,
                        `all ${runId} fixtures are deleted before emulator teardown`
                    );
                }
            };
            await run(firestore, fixtures);
        });
    } finally {
        await environment.clearFirestore();
        await environment.cleanup();
    }
}

function reservationGroup(runId) {
    const identity = {
        collectionName: 'furniture',
        productId: `product_${runId}`,
        variantId: null
    };
    return {
        ...identity,
        inventoryKey: createInventoryKey(identity),
        quantity: 1,
        lineAllocations: [{
            cartLineId: `cart_${runId}`,
            cartRevision: 1,
            quantity: 1
        }]
    };
}

function reservationRefs(firestore) {
    return {
        product: (group) => doc(firestore, `d3_products/${group.inventoryKey}`),
        reservation: (orderId, inventoryKey) => doc(
            firestore,
            `inventory_reservations/${orderId}_${inventoryKey}`
        ),
        movement: (effectId) => doc(firestore, `inventory_movements/${effectId}`)
    };
}

function reservationRepository(firestore) {
    return createReservationRepository({
        db: { runTransaction: (run) => runTransaction(firestore, run) },
        refs: reservationRefs(firestore),
        clock: { now: () => FIXED_TIME }
    });
}

function movementInput(runId, orderId, group) {
    return {
        type: 'hold',
        orderId,
        commandId: `command_${runId}_${orderId}`,
        groups: [group],
        actor: 'system-d3',
        reason: `resilience-${runId}`,
        expiresAt: '2026-08-24T12:10:00.000Z'
    };
}

function inboxRepository(firestore) {
    return createWebhookInboxRepository({
        db: { runTransaction: (run) => runTransaction(firestore, run) },
        refs: {
            inbox: (inboxId) => doc(firestore, `commerce_webhook_inbox/${inboxId}`)
        }
    });
}

const scenarios = {
    'd3-transaction-rollback-is-atomic-and-cleaned': async (context) => {
        const runId = 'run_d3_transaction_rollback';
        await withBackend(runId, context, async (firestore, fixtures) => {
            const commandRef = fixtures.track(doc(
                firestore,
                `commerce_command_results/command_${runId}`
            ));
            await context.rejects(
                runTransaction(firestore, async (transaction) => executeIdempotentCommand({
                    order: { stateVersion: 0 },
                    command: {
                        commandId: `command_${runId}`,
                        expectedVersion: 0,
                        payload: { type: 'advance', runId }
                    },
                    lookupResult: async () => {
                        const snapshot = await transaction.get(commandRef);
                        return snapshot.exists() ? snapshot.data() : null;
                    },
                    persistResult: async (record) => transaction.set(commandRef, {
                        ...record,
                        testContext: { runId }
                    }),
                    transition: (order) => ({ ...order, stateVersion: 1 }),
                    failpoints: createFailpointController({
                        'command.after_transition_before_persist': 1
                    })
                })),
                (error) => error?.code === 'COMMERCE_FAILPOINT_TRIGGERED'
            );
            context.equal((await getDoc(commandRef)).exists(), false, 'rollback exposes no partial result');
            await fixtures.cleanup();
        });
    },

    'd3-stock-one-concurrency-has-one-winner-and-cleans': async (context) => {
        const runId = 'run_d3_stock_concurrency';
        await withBackend(runId, context, async (firestore, fixtures) => {
            const group = reservationGroup(runId);
            const refs = reservationRefs(firestore);
            const productRef = refs.product(group);
            await fixtures.set(productRef, { stock: 1, inventoryVersion: 0 });
            const orderIds = [`order_${runId}_one`, `order_${runId}_two`];
            const outcomes = await Promise.allSettled(orderIds.map((orderId) => (
                reservationRepository(firestore).applyMovement(
                    movementInput(runId, orderId, group)
                )
            )));
            context.equal(outcomes.filter(({ status }) => status === 'fulfilled').length, 1, 'one buyer wins');
            context.equal(outcomes.filter(({ status }) => status === 'rejected').length, 1, 'one buyer is rejected');
            context.equal((await getDoc(productRef)).data().stock, 0, 'stock never becomes negative');
            for (const orderId of orderIds) fixtures.track(refs.reservation(orderId, group.inventoryKey));
            for (const outcome of outcomes) {
                if (outcome.status === 'fulfilled') {
                    for (const result of outcome.value) fixtures.track(refs.movement(result.effectId));
                }
            }
            await fixtures.cleanup();
        });
    },

    'd3-duplicate-webhook-produces-one-domain-effect-and-cleans': async (context) => {
        const runId = 'run_d3_duplicate_webhook';
        await withBackend(runId, context, async (firestore, fixtures) => {
            const entry = {
                ...createInboxEntry({
                    event: {
                        id: `evt_${runId}`,
                        type: 'payment_intent.succeeded',
                        created: 1,
                        livemode: false,
                        data: { object: { id: `pi_${runId}` } }
                    },
                    scope: 'platform',
                    payloadHash: 'd'.repeat(64),
                    clock: { now: () => FIXED_TIME }
                }),
                testContext: { runId }
            };
            const store = inboxRepository(firestore);
            const inboxRef = fixtures.track(doc(
                firestore,
                `commerce_webhook_inbox/${entry.inboxId}`
            ));
            const factRef = fixtures.track(doc(
                firestore,
                `commerce_financial_facts/fact_${runId}`
            ));
            const persisted = await Promise.all([store.persist(entry), store.persist(entry)]);
            context.deepEqual(persisted[0], persisted[1], 'duplicate deliveries reuse one inbox entry');
            await store.claim(entry.inboxId, {
                leaseToken: `lease_${runId}`,
                nowMillis: 1000,
                leaseMs: 1000
            });
            await store.applyProcessed({
                inboxId: entry.inboxId,
                leaseToken: `lease_${runId}`,
                nowMillis: 1100,
                processedAt: FIXED_TIME,
                applyDomainEffects: async (transaction) => {
                    transaction.set(factRef, {
                        effectId: `effect_${runId}`,
                        orderId: `order_${runId}`,
                        testContext: { runId }
                    });
                }
            });
            context.equal((await getDocs(collection(firestore, 'commerce_webhook_inbox'))).size, 1, 'one inbox document exists');
            context.equal((await getDocs(collection(firestore, 'commerce_financial_facts'))).size, 1, 'one financial effect exists');
            context.equal((await getDoc(inboxRef)).data().status, 'processed', 'inbox and effect converge');
            await fixtures.cleanup();
        });
    },

    'd3-late-processing-event-cannot-regress-paid-order-and-cleans': async (context) => {
        const runId = 'run_d3_out_of_order';
        await withBackend(runId, context, async (firestore, fixtures) => {
            const orderRef = doc(firestore, `orders/order_${runId}`);
            const initialOrder = makeOrder({ testContext: { runId } });
            await fixtures.set(orderRef, initialOrder);
            const store = inboxRepository(firestore);
            const webhook = (suffix, type, payloadHash) => ({
                ...createInboxEntry({
                    event: {
                        id: `evt_${runId}_${suffix}`,
                        type,
                        created: suffix === 'succeeded' ? 2 : 1,
                        livemode: false,
                        data: { object: { id: `pi_${runId}` } }
                    },
                    scope: 'platform',
                    payloadHash,
                    clock: { now: () => FIXED_TIME }
                }),
                testContext: { runId }
            });
            const succeeded = webhook('succeeded', 'payment_intent.succeeded', 'a'.repeat(64));
            const processing = webhook('processing', 'payment_intent.processing', 'b'.repeat(64));
            for (const entry of [succeeded, processing]) {
                fixtures.track(doc(firestore, `commerce_webhook_inbox/${entry.inboxId}`));
                await store.persist(entry);
            }
            const apply = async (entry, event, nowMillis, now) => {
                const leaseToken = `lease_${entry.eventId}`;
                await store.claim(entry.inboxId, { leaseToken, nowMillis, leaseMs: 1000 });
                return store.applyProcessed({
                    inboxId: entry.inboxId,
                    leaseToken,
                    nowMillis: nowMillis + 1,
                    processedAt: now,
                    applyDomainEffects: async (transaction) => {
                        const snapshot = await transaction.get(orderRef);
                        const next = reduceOrder(snapshot.data(), event, { clock: { now: () => now } });
                        transaction.set(orderRef, next);
                        return next;
                    }
                });
            };
            const paid = await apply(succeeded, {
                type: 'payment_succeeded',
                amountCents: initialOrder.amounts.totalCents,
                currency: initialOrder.currency,
                paymentIntentId: `pi_${runId}`
            }, 1000, '2026-08-24T12:00:01.000Z');
            const afterLateEvent = await apply(processing, {
                type: 'payment_processing',
                providerStatus: 'processing'
            }, 2000, '2026-08-24T12:00:02.000Z');
            context.equal(paid.payment.status, 'succeeded', 'success becomes durable first');
            context.equal(afterLateEvent.payment.status, 'succeeded', 'late non-terminal event cannot regress payment');
            context.equal(afterLateEvent.checkout.closeReason, 'paid', 'checkout remains durably paid');
            context.equal(afterLateEvent.stateVersion, paid.stateVersion, 'ignored late event creates no transition');
            context.equal(
                (await getDocs(collection(firestore, 'commerce_webhook_inbox'))).size,
                2,
                'both out-of-order deliveries remain observable'
            );
            await fixtures.cleanup();
        });
    },

    'd3-timeline-is-bounded-at-one-hundred-and-cleans': async (context) => {
        const runId = 'run_d3_timeline_bound';
        await withBackend(runId, context, async (_firestore, fixtures) => {
            const app = admin.initializeApp({ projectId: PROJECT_ID }, runId);
            try {
                const db = app.firestore();
                const orderId = `order_${runId}`;
                const orderRef = db.doc(`orders/${orderId}`);
                const outboxRef = db.doc(`commerce_outbox/email_${runId}`);
                const batch = db.batch();
                batch.set(orderRef, {
                    ...makeOrder({ testContext: { runId } }),
                    status: 'pending'
                });
                for (let index = 0; index < 101; index += 1) {
                    batch.set(orderRef.collection('events').doc(`event_${String(index).padStart(3, '0')}`), {
                        type: 'checkout.test',
                        createdAt: new Date(Date.parse(FIXED_TIME) + index).toISOString(),
                        eventId: `event_${runId}_${index}`,
                        testContext: { runId }
                    });
                }
                batch.set(outboxRef, {
                    aggregateId: orderId,
                    template: 'order_confirmation',
                    status: 'failed',
                    attemptCount: 3,
                    createdAt: FIXED_TIME,
                    testContext: { runId }
                });
                await batch.commit();
                const diagnostic = await buildOrderDiagnostic(db, orderId);
                context.equal(diagnostic.timeline.length, 100, 'timeline response remains bounded');
                context.equal(diagnostic.truncated, true, 'truncation is explicit');
                context.ok(
                    diagnostic.timeline.some((event) => event.attemptCount === 3),
                    'worker attempt count remains visible in the bounded proof'
                );

                const cleanup = db.batch();
                const events = await orderRef.collection('events').get();
                for (const event of events.docs) cleanup.delete(event.ref);
                cleanup.delete(outboxRef);
                cleanup.delete(orderRef);
                await cleanup.commit();
                context.equal((await orderRef.get()).exists, false, 'admin order fixture is deleted');
                context.equal((await orderRef.collection('events').get()).empty, true, 'admin event fixtures are deleted');
                context.equal((await outboxRef.get()).exists, false, 'admin outbox fixture is deleted');
                await fixtures.cleanup();
            } finally {
                await app.delete();
            }
        });
    },

    'd3-runid-scope-does-not-leave-fixtures': async (context) => {
        const runId = 'run_d3_cleanup_proof';
        await withBackend(runId, context, async (firestore, fixtures) => {
            const first = doc(firestore, `d3_cleanup/${runId}_one`);
            const second = doc(firestore, `d3_cleanup/${runId}_two`);
            await fixtures.set(first, { marker: 'one' });
            await fixtures.set(second, { marker: 'two' });
            context.equal((await getDocs(collection(firestore, 'd3_cleanup'))).size, 2, 'runId fixtures exist only during the scenario');
            await fixtures.cleanup();
            context.equal((await getDocs(collection(firestore, 'd3_cleanup'))).empty, true, 'runId fixture collection is empty after cleanup');
        });
    }
};

module.exports = { scenarios };
