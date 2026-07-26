'use strict';

const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const {
    collection,
    doc,
    getDoc,
    getDocs,
    runTransaction,
    setDoc
} = require('firebase/firestore');
const {
    createCheckoutRepository
} = require('../../../functions/src/commerce/domain/checkoutRepository');
const {
    createCheckoutAccessTokenRepository
} = require('../../../functions/src/commerce/domain/checkoutAccessTokenRepository');
const {
    transitionAttempt
} = require('../../../functions/src/commerce/domain/checkoutSaga');
const {
    createPaymentEffectApplier
} = require('../../../functions/src/commerce/domain/paymentEffectApplier');
const {
    executeIdempotentCommand
} = require('../../../functions/src/commerce/domain/idempotency');
const {
    createFailpointController
} = require('../../../functions/src/commerce/domain/failpoints');
const {
    createReservationRepository
} = require('../../../functions/src/commerce/domain/reservationRepository');
const {
    createInventoryKey
} = require('../../../functions/src/commerce/domain/inventoryKey');
const {
    createInboxEntry
} = require('../../../functions/src/commerce/domain/webhookInbox');
const {
    createWebhookInboxRepository
} = require('../../../functions/src/commerce/domain/webhookInboxRepository');

const PROJECT_ID = 'demo-secondevie-commerce';
const FIRESTORE_PORT = 8185;

function assertEmulatorBoundary() {
    if (
        process.env.GCLOUD_PROJECT !== PROJECT_ID ||
        process.env.GOOGLE_CLOUD_PROJECT !== PROJECT_ID ||
        process.env.FIRESTORE_EMULATOR_HOST !== `127.0.0.1:${FIRESTORE_PORT}`
    ) {
        throw new Error('Firestore domain tests require the fixed demo emulator');
    }
}

async function withBackend(run) {
    assertEmulatorBoundary();
    const environment = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
            host: '127.0.0.1',
            port: FIRESTORE_PORT
        }
    });
    try {
        await environment.clearFirestore();
        return await environment.withSecurityRulesDisabled(async (context) => run(context.firestore()));
    } finally {
        await environment.cleanup();
    }
}

function reservationRefs(firestore) {
    return {
        product: (group) => doc(firestore, `gate2_products/${group.inventoryKey}`),
        reservation: (orderId, inventoryKey) => doc(
            firestore,
            `inventory_reservations/${orderId}_${inventoryKey}`
        ),
        movement: (effectId) => doc(firestore, `inventory_movements/${effectId}`)
    };
}

function group(productId, quantity) {
    const identity = {
        collectionName: 'furniture',
        productId,
        variantId: null
    };
    return {
        ...identity,
        inventoryKey: createInventoryKey(identity),
        quantity,
        lineAllocations: [{
            cartLineId: `cart-${productId}`,
            cartRevision: 1,
            quantity
        }]
    };
}

function repository(firestore) {
    return createReservationRepository({
        db: {
            runTransaction: (run) => runTransaction(firestore, run)
        },
        refs: reservationRefs(firestore),
        clock: { now: () => '2026-07-26T12:00:00.000Z' }
    });
}

function movementInput(type, orderId, groups) {
    return {
        type,
        orderId,
        commandId: `command-${type}-${orderId}`,
        groups,
        actor: 'system-gate2',
        reason: `gate2-${type}-proof`,
        expiresAt: '2026-07-26T13:00:00.000Z'
    };
}

function inboxRepository(firestore) {
    return createWebhookInboxRepository({
        db: {
            runTransaction: (run) => runTransaction(firestore, run)
        },
        refs: {
            inbox: (inboxId) => doc(firestore, `commerce_webhook_inbox/${inboxId}`)
        }
    });
}

function gate3Refs(firestore) {
    return {
        control: () => doc(firestore, 'commerce_control/current'),
        policy: (version) => doc(firestore, `commerce_policy_versions/${version}`),
        connectAccount: (accountId) => doc(firestore, `commerce_connect_accounts/${accountId}`),
        checkoutIdentity: (identityId) => doc(
            firestore,
            `commerce_checkout_identities/${identityId}`
        ),
        order: (orderId) => doc(firestore, `orders/${orderId}`),
        attempt: (orderId, attemptId) => doc(
            firestore,
            `orders/${orderId}/payment_attempts/${attemptId}`
        ),
        product: (groupValue) => doc(firestore, `gate3_products/${groupValue.inventoryKey}`),
        reservation: (orderId, inventoryKey) => doc(
            firestore,
            `inventory_reservations/${orderId}_${inventoryKey}`
        ),
        movement: (effectId) => doc(firestore, `inventory_movements/${effectId}`),
        incident: (incidentId) => doc(firestore, `commerce_incidents/${incidentId}`),
        financialFact: (factId) => doc(firestore, `commerce_financial_facts/${factId}`),
        outbox: (outboxId) => doc(firestore, `commerce_outbox/${outboxId}`),
        accessToken: (tokenHash) => doc(
            firestore,
            `commerce_order_access_tokens/${tokenHash}`
        )
    };
}

function gate3CheckoutInput() {
    return {
        clientOrderId: 'client-order-gate3',
        items: [{
            cartLineId: 'cart-line-gate3',
            cartRevision: 1,
            productId: 'product-gate3',
            collectionName: 'furniture',
            variantId: null,
            quantity: 1
        }],
        deliveryModeId: 'delivery-home',
        shippingAddress: {
            fullName: 'Client Gate Trois',
            line1: '10 rue du Test',
            line2: '',
            postalCode: '75001',
            city: 'Paris',
            country: 'FR'
        }
    };
}

async function seedGate3Checkout(firestore) {
    const refs = gate3Refs(firestore);
    const inventoryKey = createInventoryKey({
        collectionName: 'furniture',
        productId: 'product-gate3',
        variantId: null
    });
    await setDoc(refs.control(), {
        newCheckoutMode: 'v2_fixture',
        legacyMode: 'disabled',
        adminMutationMode: 'v2',
        offlinePaymentMode: 'off',
        activePolicyVersion: 'policy-gate3',
        fixtureScopeVersion: 'fixture-gate3',
        fixtureScopeRef: 'commerce_fixture_scopes/fixture-gate3',
        controlRevision: 3
    });
    await setDoc(refs.policy('policy-gate3'), {
        schemaVersion: 2,
        version: 'policy-gate3',
        active: true,
        currency: 'EUR',
        offlinePaymentEnabled: false,
        stripeConnectedAccountId: 'acct_gate3ready01',
        deliveryModes: [{
            id: 'delivery-home',
            active: true,
            shippingCents: 1500,
            countries: ['FR'],
            postalPrefixes: ['75']
        }]
    });
    await setDoc(refs.connectAccount('acct_gate3ready01'), {
        accountId: 'acct_gate3ready01',
        active: true,
        activeRevision: 1,
        chargesEnabled: true,
        detailsSubmitted: true
    });
    await setDoc(refs.product({ inventoryKey }), {
        name: 'Produit Gate 3',
        status: 'published',
        priceOnRequest: false,
        currentPrice: 125,
        stock: 2,
        inventoryVersion: 0
    });
    let orderCounter = 0;
    let attemptCounter = 0;
    let commandCounter = 0;
    const checkoutRepository = createCheckoutRepository({
        db: {
            runTransaction: (run) => runTransaction(firestore, run)
        },
        refs,
        ids: {
            orderId: () => `order-gate3-${String(++orderCounter).padStart(4, '0')}`,
            attemptId: () => `attempt-gate3-${String(++attemptCounter).padStart(4, '0')}`,
            commandId: () => `command-gate3-${String(++commandCounter).padStart(4, '0')}`
        },
        clock: { now: () => '2026-07-26T12:00:00.000Z' }
    });
    return { checkoutRepository, inventoryKey, refs };
}

const scenarios = {
    'firestore-command-result-is-atomic-and-retryable': async (context) => withBackend(async (firestore) => {
        const commandRef = doc(firestore, 'commerce_command_results/command-firestore-0001');
        let transitions = 0;
        const execute = (order) => runTransaction(firestore, async (transaction) => {
            return executeIdempotentCommand({
                order,
                command: {
                    commandId: 'command-firestore-0001',
                    expectedVersion: 0,
                    payload: { type: 'advance', orderId: 'order-firestore-0001' }
                },
                lookupResult: async () => {
                    const snapshot = await transaction.get(commandRef);
                    return snapshot.exists() ? snapshot.data() : null;
                },
                persistResult: async (record) => transaction.set(commandRef, record),
                transition: (current) => {
                    transitions += 1;
                    return { ...current, stateVersion: current.stateVersion + 1 };
                }
            });
        });

        const first = await execute({ stateVersion: 0 });
        const retry = await execute({ stateVersion: 99 });
        context.deepEqual(retry, first, 'acknowledged retry returns the durable result');
        context.equal(transitions, 1, 'transition executes once across retry');
        context.equal((await getDoc(commandRef)).exists(), true, 'command result is durable');
    }),

    'firestore-transaction-rolls-back-before-persist-failpoint': async (context) => withBackend(async (firestore) => {
        const commandRef = doc(firestore, 'commerce_command_results/command-firestore-rollback');
        let failed = false;
        try {
            await runTransaction(firestore, async (transaction) => executeIdempotentCommand({
                order: { stateVersion: 0 },
                command: {
                    commandId: 'command-firestore-rollback',
                    expectedVersion: 0,
                    payload: { type: 'advance' }
                },
                lookupResult: async () => {
                    const snapshot = await transaction.get(commandRef);
                    return snapshot.exists() ? snapshot.data() : null;
                },
                persistResult: async (record) => transaction.set(commandRef, record),
                transition: (current) => ({ ...current, stateVersion: 1 }),
                failpoints: createFailpointController({
                    'command.after_transition_before_persist': 1
                })
            }));
        } catch (error) {
            failed = error?.code === 'COMMERCE_FAILPOINT_TRIGGERED';
        }
        context.equal(failed, true, 'named failpoint interrupted the transaction');
        context.equal((await getDoc(commandRef)).exists(), false, 'no partial command result escaped');
    }),

    'gate2-stock-one-allows-a-single-concurrent-hold': async (context) => withBackend(async (firestore) => {
        const reservedGroup = group('product-stock-one', 1);
        const productRef = reservationRefs(firestore).product(reservedGroup);
        await setDoc(productRef, { stock: 1, inventoryVersion: 0 });
        const store = repository(firestore);
        const outcomes = await Promise.allSettled([
            store.applyMovement(movementInput('hold', 'order-buyer-one', [reservedGroup])),
            store.applyMovement(movementInput('hold', 'order-buyer-two', [reservedGroup]))
        ]);
        context.equal(outcomes.filter((outcome) => outcome.status === 'fulfilled').length, 1, 'one hold wins');
        context.equal(outcomes.filter((outcome) => outcome.status === 'rejected').length, 1, 'one hold is refused');
        context.equal((await getDoc(productRef)).data().stock, 0, 'available stock cannot become negative');
    }),

    'gate2-holds-and-release-use-quantity-deltas-exactly-once': async (context) => withBackend(async (firestore) => {
        const firstGroup = group('product-stock-ten', 1);
        const secondGroup = group('product-stock-ten', 2);
        const productRef = reservationRefs(firestore).product(firstGroup);
        await setDoc(productRef, { stock: 10, inventoryVersion: 0 });
        const store = repository(firestore);
        await store.applyMovement(movementInput('hold', 'order-hold-one', [firstGroup]));
        await store.applyMovement(movementInput('hold', 'order-hold-two', [secondGroup]));
        await store.applyMovement(movementInput('release', 'order-hold-one', [firstGroup]));
        await store.applyMovement(movementInput('release', 'order-hold-one', [firstGroup]));
        const product = (await getDoc(productRef)).data();
        context.equal(product.stock, 8, '10 - 1 - 2 + 1 remains 8 after duplicate release');
        const reservationRef = reservationRefs(firestore).reservation(
            'order-hold-one',
            firstGroup.inventoryKey
        );
        const reservation = (await getDoc(reservationRef)).data();
        context.equal(reservation.releasedQty, 1, 'release is represented once');
        context.equal(reservation.heldQty, 0, 'released quantity no longer remains held');
    }),

    'gate2-multi-sku-hold-is-atomic': async (context) => withBackend(async (firestore) => {
        const available = group('product-multi-available', 1);
        const unavailable = group('product-multi-unavailable', 2);
        const refs = reservationRefs(firestore);
        await setDoc(refs.product(available), { stock: 5, inventoryVersion: 0 });
        await setDoc(refs.product(unavailable), { stock: 1, inventoryVersion: 0 });
        let refused = false;
        try {
            await repository(firestore).applyMovement(
                movementInput('hold', 'order-multi-atomic', [available, unavailable])
            );
        } catch (error) {
            refused = error?.code === 'COMMERCE_INVENTORY_INSUFFICIENT';
        }
        context.equal(refused, true, 'insufficient second SKU refuses the transaction');
        context.equal((await getDoc(refs.product(available))).data().stock, 5, 'first SKU was not partially held');
        context.equal((await getDoc(refs.product(unavailable))).data().stock, 1, 'second SKU remains unchanged');
    }),

    'gate3-inbox-fencing-and-domain-effect-commit-are-atomic': async (context) => withBackend(async (firestore) => {
        const store = inboxRepository(firestore);
        const entry = createInboxEntry({
            event: {
                id: 'evt_firestore_inbox_0001',
                type: 'payment_intent.succeeded',
                created: 1,
                livemode: false,
                data: { object: { id: 'pi_firestore_inbox_0001' } }
            },
            scope: 'platform',
            payloadHash: 'e'.repeat(64),
            clock: { now: () => '2026-07-26T12:00:00.000Z' }
        });
        await store.persist(entry);
        await store.persist(entry);
        await store.claim(entry.inboxId, {
            leaseToken: 'lease-firestore-one',
            nowMillis: 1000,
            leaseMs: 100
        });
        await store.claim(entry.inboxId, {
            leaseToken: 'lease-firestore-two',
            nowMillis: 1100,
            leaseMs: 100
        });
        const factRef = doc(firestore, 'commerce_financial_facts/fact-inbox-0001');
        let oldFenceRejected = false;
        try {
            await store.applyProcessed({
                inboxId: entry.inboxId,
                leaseToken: 'lease-firestore-one',
                nowMillis: 1110,
                processedAt: 'old-worker',
                applyDomainEffects: async (transaction) => {
                    transaction.set(factRef, { effectId: 'forbidden-old-worker' });
                }
            });
        } catch (error) {
            oldFenceRejected = error?.code === 'COMMERCE_INBOX_FENCE_LOST';
        }
        context.equal(oldFenceRejected, true, 'stale worker loses the fencing check');
        context.equal((await getDoc(factRef)).exists(), false, 'stale worker committed no financial fact');
        await store.applyProcessed({
            inboxId: entry.inboxId,
            leaseToken: 'lease-firestore-two',
            nowMillis: 1110,
            processedAt: '2026-07-26T12:00:00.000Z',
            applyDomainEffects: async (transaction) => {
                transaction.set(factRef, {
                    schemaVersion: 2,
                    effectId: 'fact-inbox-0001',
                    orderId: 'order-inbox-0001'
                });
                return { applied: true };
            }
        });
        const inboxSnapshot = await getDoc(doc(
            firestore,
            `commerce_webhook_inbox/${entry.inboxId}`
        ));
        context.equal(inboxSnapshot.data().status, 'processed', 'inbox and domain effect commit together');
        context.equal((await getDoc(factRef)).exists(), true, 'winning worker committed one financial fact');
    }),

    'gate3-inbox-failpoints-converge-across-every-commit-window': async (context) => withBackend(async (firestore) => {
        const entry = createInboxEntry({
            event: {
                id: 'evt_firestore_failpoints_0001',
                type: 'payment_intent.succeeded',
                created: 1,
                livemode: false,
                data: { object: { id: 'pi_firestore_failpoints_0001' } }
            },
            scope: 'platform',
            payloadHash: 'f'.repeat(64),
            clock: {
                now: () => '2026-07-26T12:00:00.000Z',
                nowMillis: () => 1000
            }
        });
        const refs = {
            inbox: (inboxId) => doc(firestore, `commerce_webhook_inbox/${inboxId}`)
        };
        const database = {
            runTransaction: (run) => runTransaction(firestore, run)
        };
        const persistCrash = createWebhookInboxRepository({
            db: database,
            refs,
            failpoints: createFailpointController({ 'inbox.after_persist': 1 })
        });
        let failedAfterPersist = false;
        try {
            await persistCrash.persist(entry);
        } catch (error) {
            failedAfterPersist = error?.code === 'COMMERCE_FAILPOINT_TRIGGERED';
        }
        context.equal(failedAfterPersist, true, 'persist response can be lost after durable write');
        context.equal(
            (await getDoc(refs.inbox(entry.inboxId))).data().status,
            'received',
            'persisted inbox survives lost response'
        );

        const claimCrash = createWebhookInboxRepository({
            db: database,
            refs,
            failpoints: createFailpointController({ 'inbox.after_claim': 1 })
        });
        let failedAfterClaim = false;
        try {
            await claimCrash.claim(entry.inboxId, {
                leaseToken: 'lease-failpoint-one',
                nowMillis: 1000,
                leaseMs: 100
            });
        } catch (error) {
            failedAfterClaim = error?.code === 'COMMERCE_FAILPOINT_TRIGGERED';
        }
        context.equal(failedAfterClaim, true, 'claim response can be lost after durable lease');
        context.equal(
            (await getDoc(refs.inbox(entry.inboxId))).data().status,
            'processing',
            'lost claim is recoverable by lease expiry'
        );

        const factRef = doc(firestore, 'commerce_financial_facts/fact-failpoint-window');
        const applyCrash = createWebhookInboxRepository({
            db: database,
            refs,
            failpoints: createFailpointController({ 'inbox.before_apply_commit': 1 })
        });
        let failedBeforeCommit = false;
        try {
            await applyCrash.applyProcessed({
                inboxId: entry.inboxId,
                leaseToken: 'lease-failpoint-one',
                nowMillis: 1010,
                processedAt: 'never',
                applyDomainEffects: async (transaction) => {
                    transaction.set(factRef, { effectId: 'must-roll-back' });
                }
            });
        } catch (error) {
            failedBeforeCommit = error?.code === 'COMMERCE_FAILPOINT_TRIGGERED';
        }
        context.equal(failedBeforeCommit, true, 'apply abort is surfaced');
        context.equal((await getDoc(factRef)).exists(), false, 'apply abort rolls back domain effects');

        const commitCrash = createWebhookInboxRepository({
            db: database,
            refs,
            failpoints: createFailpointController({ 'inbox.after_commit': 1 })
        });
        let failedAfterCommit = false;
        try {
            await commitCrash.applyProcessed({
                inboxId: entry.inboxId,
                leaseToken: 'lease-failpoint-one',
                nowMillis: 1010,
                processedAt: '2026-07-26T12:00:00.000Z',
                applyDomainEffects: async (transaction) => {
                    transaction.set(factRef, { effectId: 'fact-failpoint-window' });
                }
            });
        } catch (error) {
            failedAfterCommit = error?.code === 'COMMERCE_FAILPOINT_TRIGGERED';
        }
        context.equal(failedAfterCommit, true, 'commit response can be lost');
        context.equal(
            (await getDoc(refs.inbox(entry.inboxId))).data().status,
            'processed',
            'processed marker survives lost commit response'
        );
        context.equal((await getDoc(factRef)).exists(), true, 'domain effect survives with marker');
    }),

    'gate3-create-checkout-is-atomic-and-idempotent-before-stripe': async (context) => withBackend(async (firestore) => {
        const seeded = await seedGate3Checkout(firestore);
        const request = {
            ownerUid: 'owner-uid-gate3',
            ownerEmail: 'client@example.test',
            input: gate3CheckoutInput(),
            fixtureContext: {
                runId: 'run-gate3-0001',
                fixtureScopeVersion: 'fixture-gate3',
                policyVersion: 'policy-gate3',
                expiresAt: '2026-07-26T13:00:00.000Z'
            }
        };
        const first = await seeded.checkoutRepository.prepareCheckout(request);
        const retry = await seeded.checkoutRepository.prepareCheckout(request);
        context.equal(first.order.id, retry.order.id, 'same client order returns the durable order');
        context.equal(retry.reused, true, 'retry does not create another hold');
        context.equal(first.order.payment.currentAttemptId, first.attempt.attemptId, 'attempt is pinned at creation');
        const product = (await getDoc(seeded.refs.product({
            inventoryKey: seeded.inventoryKey
        }))).data();
        context.equal(product.stock, 1, 'stock is held exactly once before Stripe');
        context.equal(
            (await getDocs(collection(firestore, 'inventory_movements'))).size,
            1,
            'one hold movement exists'
        );
        context.equal(
            (await getDocs(collection(firestore, 'orders'))).size,
            1,
            'one order exists'
        );
        const inflight = transitionAttempt(first.attempt, {
            type: 'create_started'
        }, {
            clock: { now: () => '2026-07-26T12:01:00.000Z' }
        });
        await seeded.checkoutRepository.saveAttempt(inflight);
        const attached = transitionAttempt(inflight, {
            type: 'payment_intent_attached',
            paymentIntentId: 'pi_gate3_attached_0001',
            providerStatus: 'requires_payment_method'
        }, {
            clock: { now: () => '2026-07-26T12:02:00.000Z' }
        });
        await seeded.checkoutRepository.saveAttempt(attached);
        const attachedOrder = (await getDoc(seeded.refs.order(first.order.id))).data();
        context.equal(
            attachedOrder.payment.paymentIntentId,
            'pi_gate3_attached_0001',
            'PI attachment is durable on the order before client response'
        );
    }),

    'gate3-success-commits-order-movement-fact-and-outbox-exactly-once': async (context) => withBackend(async (firestore) => {
        const seeded = await seedGate3Checkout(firestore);
        const prepared = await seeded.checkoutRepository.prepareCheckout({
            ownerUid: 'owner-uid-gate3',
            ownerEmail: 'client@example.test',
            input: gate3CheckoutInput(),
            fixtureContext: {
                runId: 'run-gate3-0002',
                fixtureScopeVersion: 'fixture-gate3',
                policyVersion: 'policy-gate3',
                expiresAt: '2026-07-26T13:00:00.000Z'
            }
        });
        const applier = createPaymentEffectApplier({
            refs: seeded.refs,
            clock: { now: () => '2026-07-26T12:05:00.000Z' }
        });
        const paymentIntent = {
            id: 'pi_gate3_success_0001',
            status: 'succeeded',
            amount: prepared.order.amounts.totalCents,
            currency: 'eur',
            created: 1785067500,
            metadata: {
                orderId: prepared.order.id,
                requestHash: prepared.order.checkout.requestHash
            },
            connectedAccountId: 'acct_gate3ready01'
        };
        const apply = () => runTransaction(firestore, (transaction) => applier.apply(transaction, {
            entry: {
                scope: 'connect',
                accountId: 'acct_gate3ready01'
            },
            paymentIntent
        }));
        await apply();
        await apply();
        const order = (await getDoc(seeded.refs.order(prepared.order.id))).data();
        context.equal(order.payment.status, 'succeeded', 'durable order is paid');
        context.equal(order.inventorySummary.committedQty, 1, 'hold is committed');
        context.equal(
            (await getDocs(collection(firestore, 'inventory_movements'))).size,
            2,
            'one hold and one commit movement exist'
        );
        context.equal(
            (await getDocs(collection(firestore, 'commerce_financial_facts'))).size,
            1,
            'capture fact is unique'
        );
        context.equal(
            (await getDocs(collection(firestore, 'commerce_outbox'))).size,
            1,
            'outbox intent is unique'
        );
    }),

    'gate3-guest-resume-token-is-single-use-and-rotated-transactionally': async (context) => withBackend(async (firestore) => {
        const seeded = await seedGate3Checkout(firestore);
        const prepared = await seeded.checkoutRepository.prepareCheckout({
            ownerUid: 'owner-uid-gate3',
            ownerEmail: 'client@example.test',
            input: gate3CheckoutInput(),
            fixtureContext: {
                runId: 'run-gate3-token',
                fixtureScopeVersion: 'fixture-gate3',
                policyVersion: 'policy-gate3',
                expiresAt: '2026-07-26T13:00:00.000Z'
            }
        });
        let tokenCounter = 0;
        const tokens = createCheckoutAccessTokenRepository({
            db: {
                runTransaction: (run) => runTransaction(firestore, run)
            },
            refs: seeded.refs,
            ids: {
                rawToken: () => `gate3-token-${String(++tokenCounter).padStart(4, '0')}`.padEnd(48, 'x')
            },
            clock: {
                now: () => '2026-07-26T12:10:00.000Z',
                nowMillis: () => Date.parse('2026-07-26T12:10:00.000Z')
            }
        });
        const issued = await tokens.issue({
            orderId: prepared.order.id,
            ownerUid: 'owner-uid-gate3'
        });
        const rotated = await tokens.consumeAndRotate({
            rawToken: issued.rawToken,
            ownerUid: 'owner-uid-gate3'
        });
        context.equal(rotated.orderId, prepared.order.id, 'token resolves only its durable order');
        context.ok(
            rotated.nextRawToken !== issued.rawToken,
            'successful consume rotates the token'
        );
        let denied = false;
        try {
            await tokens.consumeAndRotate({
                rawToken: issued.rawToken,
                ownerUid: 'owner-uid-gate3'
            });
        } catch (error) {
            denied = error?.code === 'COMMERCE_ACCESS_TOKEN_DENIED';
        }
        context.equal(denied, true, 'consumed token cannot be replayed');
    })
};

module.exports = { scenarios };
