'use strict';

const admin = require('firebase-admin');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const {
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
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
    createProductCommandRepository
} = require('../../../functions/src/commerce/domain/productCommandRepository');
const {
    createOrderCommandRepository
} = require('../../../functions/src/commerce/domain/orderCommandRepository');
const {
    createRefundCoordinator
} = require('../../../functions/src/commerce/domain/refundCoordinator');
const {
    createRefundEffectApplier
} = require('../../../functions/src/commerce/domain/refundEffectApplier');
const {
    createRefundRepository
} = require('../../../functions/src/commerce/domain/refundRepository');
const {
    createRefundSagaService
} = require('../../../functions/src/commerce/domain/refundSagaService');
const {
    createReturnRepository
} = require('../../../functions/src/commerce/domain/returnRepository');
const {
    reduceOrder
} = require('../../../functions/src/commerce/domain/orderState');
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
const {
    createCheckoutRuntime,
    createReservationExpiryRuntime
} = require('../../../functions/src/commerce/domain/v2Runtime');
const {
    promotionCodeHash
} = require('../../../functions/src/commerce/domain/promotionCode');

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
        fixtureScope: (version) => doc(firestore, `commerce_fixture_scopes/${version}`),
        connectAccount: (accountId) => doc(firestore, `commerce_connect_accounts/${accountId}`),
        checkoutIdentity: (identityId) => doc(
            firestore,
            `commerce_checkout_identities/${identityId}`
        ),
        orderNumberCounter: () => doc(firestore, 'sys_counters/orders'),
        order: (orderId) => doc(firestore, `orders/${orderId}`),
        attempt: (orderId, attemptId) => doc(
            firestore,
            `orders/${orderId}/payment_attempts/${attemptId}`
        ),
        refundAttempt: (orderId, refundRequestId) => doc(
            firestore,
            `orders/${orderId}/refunds/${refundRequestId}`
        ),
        auditEvent: (orderId, eventId) => doc(
            firestore,
            `orders/${orderId}/events/${eventId}`
        ),
        commandResult: (commandId) => doc(
            firestore,
            `commerce_command_results/${commandId}`
        ),
        returnCase: (orderId, returnId) => doc(
            firestore,
            `orders/${orderId}/returns/${returnId}`
        ),
        returnAllocation: (orderId, lineId) => doc(
            firestore,
            `commerce_return_allocations/${orderId}_${lineId}`
        ),
        product: (groupValue) => doc(firestore, `gate3_products/${groupValue.inventoryKey}`),
        reservation: (orderId, inventoryKey) => doc(
            firestore,
            `inventory_reservations/${orderId}_${inventoryKey}`
        ),
        movement: (effectId) => doc(firestore, `inventory_movements/${effectId}`),
        incident: (incidentId) => doc(firestore, `commerce_incidents/${incidentId}`),
        financialFact: (factId) => doc(firestore, `commerce_financial_facts/${factId}`),
        financialDaily: (dateKey, currency) => doc(
            firestore,
            `commerce_financial_daily/${dateKey}_${currency}`
        ),
        financialTotals: (currency) => doc(firestore, `commerce_financial_totals/${currency}`),
        outbox: (outboxId) => doc(firestore, `commerce_outbox/${outboxId}`),
        document: (orderId, documentId) => doc(
            firestore,
            `orders/${orderId}/documents/${documentId}`
        ),
        promotion: (codeHash) => doc(
            firestore,
            `commerce_promotion_codes/${codeHash}`
        ),
        promotionCustomer: (codeHash, customerKey) => doc(
            firestore,
            `commerce_promotion_codes/${codeHash}/customers/${customerKey}`
        ),
        promotionRedemption: (codeHash, orderId) => doc(
            firestore,
            `commerce_promotion_codes/${codeHash}/redemptions/${orderId}`
        ),
        newsletterReward: (rewardId) => doc(
            firestore,
            `newsletter_rewards/${rewardId}`
        ),
        accessToken: (tokenHash) => doc(
            firestore,
            `commerce_order_access_tokens/${tokenHash}`
        )
    };
}

function gate4ProductRefs(firestore) {
    return {
        product: ({ collectionName, productId }) => doc(
            firestore,
            `artifacts/secondevie/public/data/${collectionName}/${productId}`
        ),
        commandResult: (commandId) => doc(
            firestore,
            `commerce_command_results/${commandId}`
        ),
        productAuditEvent: (collectionName, productId, eventId) => doc(
            firestore,
            `commerce_product_audits/${collectionName}_${productId}/events/${eventId}`
        )
    };
}

function gate3CheckoutInput() {
    return {
        clientOrderId: 'client-order-gate3',
        items: [{
            cartLineId: 'cart-line-gate3',
            cartRevision: 1,
            productId: 'fixture_gate3_product',
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
        productId: 'fixture_gate3_product',
        variantId: null
    });
    await setDoc(refs.control(), {
        newCheckoutMode: 'v2_fixture',
        legacyMode: 'disabled',
        adminMutationMode: 'v2',
        offlinePaymentMode: 'off',
        activePolicyVersion: 'fixture_policy_gate3',
        fixtureScopeVersion: 'fixture_gate3_20260726',
        fixtureScopeRef: 'commerce_fixture_scopes/fixture_gate3_20260726',
        controlRevision: 3
    });
    await setDoc(refs.policy('fixture_policy_gate3'), {
        schemaVersion: 2,
        version: 'fixture_policy_gate3',
        active: true,
        currency: 'EUR',
        offlinePaymentEnabled: false,
        stripeConnectedAccountId: 'acct_gate3ready01',
        holdDurationSeconds: 1800,
        deliveryModes: [{
            id: 'delivery-home',
            active: true,
            shippingCents: 1500,
            countries: ['FR'],
            postalPrefixes: ['75']
        }]
    });
    await setDoc(refs.fixtureScope('fixture_gate3_20260726'), {
        schemaVersion: 2,
        fixtureScopeVersion: 'fixture_gate3_20260726',
        environment: 'sandbox',
        projectId: 'secondevienextjsssr',
        policyVersion: 'fixture_policy_gate3',
        active: true,
        uids: ['owner-uid-gate3'],
        inventoryKeys: [inventoryKey],
        fixtureProducts: [{
            collectionName: 'furniture',
            productId: 'fixture_gate3_product',
            variantId: null
        }],
        expiresAt: '2026-08-26T13:00:00.000Z'
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
    await setDoc(refs.orderNumberCounter(), {
        nextOrderNumber: 1,
        updatedAt: '2026-07-26T12:00:00.000Z'
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
                runId: 'run_gate3_0001',
                fixtureScopeVersion: 'fixture_gate3_20260726'
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

    'gate3-v2-all-checkout-pins-policy-hold-expiry': async (context) => withBackend(async (firestore) => {
        const seeded = await seedGate3Checkout(firestore);
        await setDoc(seeded.refs.control(), {
            newCheckoutMode: 'v2_all'
        }, { merge: true });
        const request = {
            ownerUid: 'owner-uid-gate3',
            ownerEmail: 'client@example.test',
            input: gate3CheckoutInput()
        };
        const first = await seeded.checkoutRepository.prepareCheckout(request);
        const retry = await seeded.checkoutRepository.prepareCheckout(request);
        const reservation = (await getDoc(seeded.refs.reservation(
            first.order.id,
            seeded.inventoryKey
        ))).data();
        context.equal(
            first.order.checkout.expiresAt,
            '2026-07-26T12:30:00.000Z',
            'ordinary checkout pins the policy hold duration'
        );
        context.equal(
            reservation.expiresAt,
            first.order.checkout.expiresAt,
            'order and reservation share one authoritative expiry'
        );
        context.equal(
            retry.order.checkout.expiresAt,
            first.order.checkout.expiresAt,
            'idempotent retry never extends the hold'
        );
        context.equal(retry.reused, true, 'retry reuses the durable checkout');
        context.equal(
            (await getDoc(seeded.refs.product({ inventoryKey: seeded.inventoryKey }))).data().stock,
            1,
            'retry does not create a second hold'
        );
    }),

    'gate3-expired-hold-sweeper-cancels-provider-first-and-releases-once': async (context) => withBackend(async () => {
        const app = admin.initializeApp(
            { projectId: PROJECT_ID },
            `commerce-expiry-${Date.now()}-${Math.random().toString(36).slice(2)}`
        );
        try {
            const db = app.firestore();
            const productRef = db.doc('artifacts/secondevie/public/data/furniture/expiry-product');
            await Promise.all([
                db.doc('sys_commerce_control/current').set({
                    newCheckoutMode: 'v2_all',
                    legacyMode: 'disabled',
                    adminMutationMode: 'v2',
                    offlinePaymentMode: 'off',
                    activePolicyVersion: 'expiry-policy',
                    fixtureScopeVersion: null,
                    fixtureScopeRef: null,
                    controlRevision: 1
                }),
                db.doc('commerce_policy_versions/expiry-policy').set({
                    schemaVersion: 2,
                    version: 'expiry-policy',
                    active: true,
                    currency: 'EUR',
                    offlinePaymentEnabled: false,
                    stripeConnectedAccountId: 'acct_expiryready01',
                    holdDurationSeconds: 1800,
                    deliveryModes: [{
                        id: 'delivery-home',
                        active: true,
                        shippingCents: 1500,
                        countries: ['FR']
                    }]
                }),
                db.doc('commerce_connect_accounts/acct_expiryready01').set({
                    accountId: 'acct_expiryready01',
                    active: true,
                    activeRevision: 1,
                    chargesEnabled: true,
                    detailsSubmitted: true
                }),
                productRef.set({
                    name: 'Produit expiration',
                    status: 'published',
                    priceOnRequest: false,
                    currentPrice: 125,
                    stock: 2,
                    inventoryVersion: 0
                })
            ]);

            const intents = new Map();
            let createCalls = 0;
            let cancelCalls = 0;
            const stripe = {
                paymentIntents: {
                    async create(params, options) {
                        const key = options.idempotencyKey;
                        if (intents.has(key)) return intents.get(key);
                        createCalls += 1;
                        const intent = {
                            id: 'pi_expiry_emulator_0001',
                            client_secret: 'pi_expiry_emulator_0001_secret_test',
                            status: 'requires_payment_method',
                            amount: params.amount,
                            currency: params.currency,
                            metadata: params.metadata
                        };
                        intents.set(key, intent);
                        return intent;
                    },
                    async retrieve(paymentIntentId) {
                        return [...intents.values()].find((intent) => intent.id === paymentIntentId);
                    },
                    async cancel(paymentIntentId) {
                        cancelCalls += 1;
                        const [key, current] = [...intents.entries()]
                            .find(([, intent]) => intent.id === paymentIntentId);
                        const canceled = { ...current, status: 'canceled' };
                        intents.set(key, canceled);
                        return canceled;
                    }
                }
            };
            const checkoutRuntime = createCheckoutRuntime({
                db,
                stripe,
                appId: 'secondevie',
                clock: {
                    now: () => '2026-07-26T12:00:00.000Z',
                    nowMillis: () => Date.parse('2026-07-26T12:00:00.000Z')
                }
            });
            const checkout = await checkoutRuntime.checkout.createCheckout({
                ownerUid: 'owner-expiry-uid',
                ownerEmail: 'client@example.test',
                input: {
                    clientOrderId: 'client-order-expiry',
                    items: [{
                        cartLineId: 'cart-line-expiry',
                        cartRevision: 1,
                        productId: 'expiry-product',
                        collectionName: 'furniture',
                        variantId: null,
                        quantity: 1
                    }],
                    deliveryModeId: 'delivery-home',
                    shippingAddress: {
                        fullName: 'Client Expiration',
                        line1: '10 rue du Test',
                        line2: '',
                        postalCode: '75001',
                        city: 'Paris',
                        country: 'FR'
                    }
                }
            });
            context.equal((await productRef.get()).data().stock, 1, 'checkout holds stock before payment');
            context.equal(createCalls, 1, 'one idempotent payment intent exists before expiry');

            const expiryRuntime = createReservationExpiryRuntime({
                db,
                stripe,
                appId: 'secondevie',
                clock: {
                    now: () => '2026-07-26T12:31:00.000Z',
                    nowMillis: () => Date.parse('2026-07-26T12:31:00.000Z')
                }
            });
            const firstSweep = await expiryRuntime.sweepers.expiredReservations.run();
            const order = (await db.doc(`orders/${checkout.orderId}`).get()).data();
            const reservations = await db.collection('inventory_reservations')
                .where('orderId', '==', checkout.orderId)
                .get();
            context.equal(firstSweep.failures.length, 0, 'expiry sweep completes without hidden failures');
            context.equal(firstSweep.processed, 1, 'one expired reservation is processed');
            context.equal(cancelCalls, 1, 'provider cancellation happens exactly once');
            context.equal((await productRef.get()).data().stock, 2, 'stock is restored only after provider cancellation');
            context.equal(reservations.docs[0].data().status, 'released', 'reservation is durably released');
            context.equal(order.checkout.status, 'closed', 'expired checkout is durably closed');
            context.equal(order.payment.status, 'canceled', 'provider cancellation is projected on the order');

            const retrySweep = await expiryRuntime.sweepers.expiredReservations.run();
            context.equal(retrySweep.processed, 0, 'released reservation is no longer eligible');
            context.equal(cancelCalls, 1, 'retry never cancels or releases twice');
        } finally {
            await app.delete();
        }
    }),

    'gate7a-fixture-checkout-is-bound-to-control-uid-and-inventory': async (context) => withBackend(async (firestore) => {
        const seeded = await seedGate3Checkout(firestore);
        const exactFixture = {
            runId: 'run_gate7a_scope',
            fixtureScopeVersion: 'fixture_gate3_20260726'
        };
        for (const attempt of [
            {
                ownerUid: 'public-user-gate7a',
                input: gate3CheckoutInput(),
                fixtureContext: exactFixture,
                expected: 'COMMERCE_FIXTURE_UID_DENIED'
            },
            {
                ownerUid: 'owner-uid-gate3',
                input: {
                    ...gate3CheckoutInput(),
                    items: [{
                        ...gate3CheckoutInput().items[0],
                        productId: 'product-outside-fixture'
                    }]
                },
                fixtureContext: exactFixture,
                expected: 'COMMERCE_FIXTURE_INVENTORY_DENIED'
            },
            {
                ownerUid: 'owner-uid-gate3',
                input: gate3CheckoutInput(),
                fixtureContext: null,
                expected: 'COMMERCE_CHECKOUT_MODE_OFF'
            }
        ]) {
            let code = null;
            try {
                await seeded.checkoutRepository.prepareCheckout({
                    ownerUid: attempt.ownerUid,
                    ownerEmail: 'client@example.test',
                    input: attempt.input,
                    fixtureContext: attempt.fixtureContext
                });
            } catch (error) {
                code = error?.code;
            }
            context.equal(code, attempt.expected, `request is rejected with ${attempt.expected}`);
        }
        await setDoc(seeded.refs.control(), {
            newCheckoutMode: 'off'
        }, { merge: true });
        let offCode = null;
        try {
            await seeded.checkoutRepository.prepareCheckout({
                ownerUid: 'owner-uid-gate3',
                ownerEmail: 'client@example.test',
                input: gate3CheckoutInput(),
                fixtureContext: exactFixture
            });
        } catch (error) {
            offCode = error?.code;
        }
        context.equal(offCode, 'COMMERCE_FIXTURE_SCOPE_MISMATCH', 'control off rejects fixture context');
        context.equal((await getDocs(collection(firestore, 'orders'))).size, 0, 'rejected requests write no order');
    }),

    'gate3-success-commits-order-movement-fact-and-outbox-exactly-once': async (context) => withBackend(async (firestore) => {
        const seeded = await seedGate3Checkout(firestore);
        const prepared = await seeded.checkoutRepository.prepareCheckout({
            ownerUid: 'owner-uid-gate3',
            ownerEmail: 'client@example.test',
            input: gate3CheckoutInput(),
            fixtureContext: {
                runId: 'run_gate3_0002',
                fixtureScopeVersion: 'fixture_gate3_20260726'
            }
        });
        const applier = createPaymentEffectApplier({
            refs: seeded.refs,
            clock: { now: () => '2026-07-26T12:05:00.000Z' },
            increment
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
        const outboxSnapshot = await getDocs(collection(firestore, 'commerce_outbox'));
        context.equal(
            outboxSnapshot.size,
            2,
            'customer and admin outbox intents are each unique'
        );
        context.deepEqual(
            outboxSnapshot.docs.map((document) => document.data().template).sort(),
            ['order-paid', 'order-paid-admin'],
            'payment atomically creates one dedicated message per audience'
        );
        const commerceDocuments = await getDocs(collection(
            firestore,
            `orders/${prepared.order.id}/documents`
        ));
        context.equal(commerceDocuments.size, 1, 'payment receipt is atomically available');
        context.equal(
            commerceDocuments.docs[0].data().kind,
            'sandbox_payment_receipt',
            'the atomic payment document is the sandbox receipt'
        );
        context.equal(
            commerceDocuments.docs[0].data().issuedAt,
            order.payment.succeededAt,
            'the atomic receipt reuses the timestamp used by the rebuild fallback'
        );
    }),

    'gate3-promotion-is-reserved-with-checkout-and-committed-once-after-payment': async (context) => withBackend(async (firestore) => {
        const seeded = await seedGate3Checkout(firestore);
        const code = 'RECETTE-10';
        const codeHash = promotionCodeHash(code);
        await setDoc(seeded.refs.promotion(codeHash), {
            schemaVersion: 1,
            code,
            codeHash,
            name: 'Code transactionnel Gate 3',
            source: 'admin',
            status: 'active',
            discount: { type: 'percentage', percentage: 10 },
            scope: { type: 'products', productIds: ['fixture_gate3_product'] },
            audience: { type: 'public' },
            limits: { maxRedemptions: 1, maxPerCustomer: 1 },
            constraints: { minSubtotalCents: 0, maxDiscountCents: null },
            usage: { reserved: 0, committed: 0 },
            startsAt: '2026-07-25T00:00:00.000Z',
            expiresAt: '2026-08-25T00:00:00.000Z',
            createdAt: '2026-07-25T00:00:00.000Z',
            updatedAt: '2026-07-25T00:00:00.000Z'
        });
        const prepared = await seeded.checkoutRepository.prepareCheckout({
            ownerUid: 'owner-uid-gate3',
            ownerEmail: 'client@example.test',
            input: { ...gate3CheckoutInput(), promotionCode: code },
            fixtureContext: {
                runId: 'run_gate3_promotion',
                fixtureScopeVersion: 'fixture_gate3_20260726'
            }
        });
        context.equal(prepared.order.amounts.itemsCents, 12_500, 'subtotal is authoritative');
        context.equal(prepared.order.amounts.discountCents, 1_250, 'only the eligible product is discounted');
        context.equal(prepared.order.amounts.totalCents, 12_750, 'Stripe total includes shipping and server discount');
        context.equal(
            (await getDoc(seeded.refs.promotion(codeHash))).data().usage.reserved,
            1,
            'checkout atomically reserves the only global use'
        );
        const applier = createPaymentEffectApplier({
            refs: seeded.refs,
            clock: { now: () => '2026-07-26T12:05:00.000Z' },
            increment
        });
        const apply = () => runTransaction(firestore, (transaction) => applier.apply(transaction, {
            entry: { scope: 'connect', accountId: 'acct_gate3ready01' },
            paymentIntent: {
                id: 'pi_gate3_promotion_0001',
                status: 'succeeded',
                amount: prepared.order.amounts.totalCents,
                currency: 'eur',
                metadata: {
                    orderId: prepared.order.id,
                    requestHash: prepared.order.checkout.requestHash
                },
                connectedAccountId: 'acct_gate3ready01'
            }
        }));
        await apply();
        await apply();
        const promotion = (await getDoc(seeded.refs.promotion(codeHash))).data();
        context.deepEqual(promotion.usage, { reserved: 0, committed: 1 }, 'payment consumes the code exactly once');
        context.equal(
            (await getDoc(seeded.refs.promotionRedemption(codeHash, prepared.order.id))).data().status,
            'committed',
            'redemption is durably linked to the paid order'
        );
    }),

    'gate3-guest-resume-token-is-single-use-and-rotated-transactionally': async (context) => withBackend(async (firestore) => {
        const seeded = await seedGate3Checkout(firestore);
        const prepared = await seeded.checkoutRepository.prepareCheckout({
            ownerUid: 'owner-uid-gate3',
            ownerEmail: 'client@example.test',
            input: gate3CheckoutInput(),
            fixtureContext: {
                runId: 'run_gate3_token',
                fixtureScopeVersion: 'fixture_gate3_20260726'
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
    }),

    'gate4-command-retry-is-one-transition-with-one-append-only-audit': async (context) => withBackend(async (firestore) => {
        const seeded = await seedGate3Checkout(firestore);
        const prepared = await seeded.checkoutRepository.prepareCheckout({
            ownerUid: 'owner-uid-gate3',
            ownerEmail: 'client@example.test',
            input: gate3CheckoutInput(),
            fixtureContext: {
                runId: 'run_gate4_command',
                fixtureScopeVersion: 'fixture_gate3_20260726'
            }
        });
        const applier = createPaymentEffectApplier({
            refs: seeded.refs,
            clock: {
                now: () => '2026-07-26T12:05:00.000Z',
                nowMillis: () => Date.parse('2026-07-26T12:05:00.000Z')
            },
            increment
        });
        await runTransaction(firestore, (transaction) => applier.apply(transaction, {
            entry: { scope: 'connect', accountId: 'acct_gate3ready01' },
            paymentIntent: {
                id: 'pi_gate4_command_0001',
                status: 'succeeded',
                amount: prepared.order.amounts.totalCents,
                currency: 'eur',
                metadata: {
                    orderId: prepared.order.id,
                    requestHash: prepared.order.checkout.requestHash
                },
                connectedAccountId: 'acct_gate3ready01'
            }
        }));
        const paidOrder = (await getDoc(seeded.refs.order(prepared.order.id))).data();
        const commands = createOrderCommandRepository({
            db: { runTransaction: (run) => runTransaction(firestore, run) },
            refs: seeded.refs,
            clock: { now: () => '2026-07-26T12:10:00.000Z' }
        });
        const request = {
            orderId: prepared.order.id,
            action: 'fulfillment_prepare',
            command: {
                commandId: 'command-gate4-prepare-0001',
                expectedVersion: paidOrder.stateVersion
            },
            actor: {
                uid: 'admin-gate4',
                role: 'admin',
                aal2: true
            },
            reason: 'preparation atelier'
        };
        const first = await commands.execute(request);
        const retry = await commands.execute({
            ...request,
            command: {
                ...request.command,
                expectedVersion: 999
            }
        });
        context.deepEqual(retry, first, 'ack retry returns the first durable command result');
        context.equal(first.action, 'fulfillment_prepare', 'allowed admin action is applied');
        context.equal(
            (await getDoc(seeded.refs.order(prepared.order.id))).data().fulfillmentSummary.status,
            'preparing',
            'order transitioned once'
        );
        context.equal(
            (await getDocs(collection(
                firestore,
                `orders/${prepared.order.id}/events`
            ))).size,
            1,
            'one append-only audit event exists'
        );
    }),

    'gate4-partial-refunds-are-cumulative-idempotent-and-never-restock': async (context) => withBackend(async (firestore) => {
        const seeded = await seedGate3Checkout(firestore);
        const prepared = await seeded.checkoutRepository.prepareCheckout({
            ownerUid: 'owner-uid-gate3',
            ownerEmail: 'client@example.test',
            input: gate3CheckoutInput(),
            fixtureContext: {
                runId: 'run_gate4_refund',
                fixtureScopeVersion: 'fixture_gate3_20260726'
            }
        });
        const effectClock = {
            now: () => '2026-07-26T12:05:00.000Z',
            nowMillis: () => Date.parse('2026-07-26T12:05:00.000Z')
        };
        const applier = createPaymentEffectApplier({
            refs: seeded.refs,
            clock: effectClock,
            increment
        });
        await runTransaction(firestore, (transaction) => applier.apply(transaction, {
            entry: { scope: 'connect', accountId: 'acct_gate3ready01' },
            paymentIntent: {
                id: 'pi_gate4_refund_firestore',
                status: 'succeeded',
                amount: prepared.order.amounts.totalCents,
                currency: 'eur',
                metadata: {
                    orderId: prepared.order.id,
                    requestHash: prepared.order.checkout.requestHash
                },
                connectedAccountId: 'acct_gate3ready01'
            }
        }));
        const refundStore = new Map();
        const stripe = {
            async createRefund(params, options) {
                let refund = refundStore.get(options.idempotencyKey);
                if (!refund) {
                    refund = {
                        id: `re_firestore_${refundStore.size + 1}`,
                        status: 'succeeded',
                        amount: params.amount,
                        currency: 'eur',
                        payment_intent: params.payment_intent,
                        metadata: params.metadata,
                        connectedAccountId: options.connectedAccountId
                    };
                    refundStore.set(options.idempotencyKey, refund);
                }
                return { ...refund };
            },
            async retrieveRefund(refundId) {
                return [...refundStore.values()].find((value) => value.id === refundId) || null;
            }
        };
        const repository = createRefundRepository({
            db: { runTransaction: (run) => runTransaction(firestore, run) },
            refs: seeded.refs,
            clock: effectClock,
            increment
        });
        const coordinator = createRefundCoordinator({
            repository,
            sagaService: createRefundSagaService({
                stripe,
                repository,
                clock: effectClock
            })
        });
        const base = {
            orderId: prepared.order.id,
            actor: {
                uid: 'admin-gate4',
                role: 'admin',
                aal2: true
            },
            reason: 'geste commercial documente'
        };
        await coordinator.requestRefund({
            ...base,
            refundRequestId: 'refund-firestore-one',
            amountCents: 3000
        });
        await coordinator.requestRefund({
            ...base,
            refundRequestId: 'refund-firestore-one',
            amountCents: 3000
        });
        await coordinator.requestRefund({
            ...base,
            refundRequestId: 'refund-firestore-two',
            amountCents: 2000
        });
        const order = (await getDoc(seeded.refs.order(prepared.order.id))).data();
        context.equal(order.amounts.refundedCents, 5000, 'partial refunds sum exactly');
        context.equal(refundStore.size, 2, 'same request is deduped and distinct requests remain distinct');
        context.equal(
            (await getDocs(collection(firestore, 'inventory_movements'))).size,
            2,
            'refund adds no inventory movement after hold and commit'
        );
        context.equal(
            (await getDocs(collection(firestore, 'commerce_financial_facts'))).size,
            3,
            'one capture fact and two refund facts exist'
        );
        const commerceDocuments = await getDocs(collection(
            firestore,
            `orders/${prepared.order.id}/documents`
        ));
        context.equal(
            commerceDocuments.size,
            3,
            'one receipt and two refund confirmations are atomically available'
        );
    }),

    'gate4-refund-failed-webhook-settles-attempt-order-and-two-outboxes': async (context) => withBackend(async (firestore) => {
        const seeded = await seedGate3Checkout(firestore);
        const prepared = await seeded.checkoutRepository.prepareCheckout({
            ownerUid: 'owner-uid-gate3',
            ownerEmail: 'client@example.test',
            input: gate3CheckoutInput(),
            fixtureContext: {
                runId: 'run_gate4_refund_failed',
                fixtureScopeVersion: 'fixture_gate3_20260726'
            }
        });
        const effectClock = {
            now: () => '2026-07-26T12:05:00.000Z',
            nowMillis: () => Date.parse('2026-07-26T12:05:00.000Z')
        };
        const paymentApplier = createPaymentEffectApplier({
            refs: seeded.refs,
            clock: effectClock,
            increment
        });
        await runTransaction(firestore, (transaction) => paymentApplier.apply(transaction, {
            entry: { scope: 'connect', accountId: 'acct_gate3ready01' },
            paymentIntent: {
                id: 'pi_gate4_refund_failed',
                status: 'succeeded',
                amount: prepared.order.amounts.totalCents,
                currency: 'eur',
                metadata: {
                    orderId: prepared.order.id,
                    requestHash: prepared.order.checkout.requestHash
                },
                connectedAccountId: 'acct_gate3ready01'
            }
        }));
        const repository = createRefundRepository({
            db: { runTransaction: (run) => runTransaction(firestore, run) },
            refs: seeded.refs,
            clock: effectClock,
            increment
        });
        const refundRequestId = 'refund-failed-webhook-0001';
        await repository.prepareRefund({
            orderId: prepared.order.id,
            refundRequestId,
            amountCents: 3000,
            actor: { uid: 'admin-gate4', role: 'admin', aal2: true },
            reason: 'qualification webhook refund failed'
        });
        const refundApplier = createRefundEffectApplier({
            refs: seeded.refs,
            clock: effectClock,
            increment
        });
        const refund = {
            id: 're_gate4_failed_webhook',
            status: 'failed',
            amount: 3000,
            currency: 'eur',
            payment_intent: 'pi_gate4_refund_failed',
            metadata: {
                orderId: prepared.order.id,
                refundRequestId
            },
            connectedAccountId: 'acct_gate3ready01'
        };
        await runTransaction(firestore, (transaction) => refundApplier.apply(transaction, {
            entry: { scope: 'connect', accountId: 'acct_gate3ready01' },
            refund
        }));
        const order = (await getDoc(seeded.refs.order(prepared.order.id))).data();
        const attempt = (await getDoc(
            seeded.refs.refundAttempt(prepared.order.id, refundRequestId)
        )).data();
        const outboxes = await getDocs(collection(firestore, 'commerce_outbox'));
        context.equal(order.refundAggregate.status, 'needs_review', 'failed refund is durable');
        context.equal(order.refundAggregate.pendingCents, 0, 'failed pending amount is released');
        context.equal(attempt.status, 'failed', 'refund attempt is terminal failed');
        context.equal(
            (await getDocs(collection(firestore, 'commerce_financial_facts'))).size,
            1,
            'failed refund creates no false financial refund fact'
        );
        context.deepEqual(
            outboxes.docs.map((document) => document.data().template).sort(),
            [
                'order-paid',
                'order-paid-admin',
                'order-refund-failed',
                'order-refund-failed-admin'
            ],
            'failed refund adds one customer and one admin alert'
        );
    }),

    'gate4-refund-succeeded-then-failed-is-compensated-without-restock': async (context) => withBackend(async (firestore) => {
        const seeded = await seedGate3Checkout(firestore);
        const prepared = await seeded.checkoutRepository.prepareCheckout({
            ownerUid: 'owner-uid-gate3',
            ownerEmail: 'client@example.test',
            input: gate3CheckoutInput(),
            fixtureContext: {
                runId: 'run_gate4_refund_reversal',
                fixtureScopeVersion: 'fixture_gate3_20260726'
            }
        });
        const effectClock = {
            now: () => '2026-07-26T12:05:00.000Z',
            nowMillis: () => Date.parse('2026-07-26T12:05:00.000Z')
        };
        const paymentApplier = createPaymentEffectApplier({
            refs: seeded.refs,
            clock: effectClock,
            increment
        });
        await runTransaction(firestore, (transaction) => paymentApplier.apply(transaction, {
            entry: { scope: 'connect', accountId: 'acct_gate3ready01' },
            paymentIntent: {
                id: 'pi_gate4_refund_reversal',
                status: 'succeeded',
                amount: prepared.order.amounts.totalCents,
                currency: 'eur',
                metadata: {
                    orderId: prepared.order.id,
                    requestHash: prepared.order.checkout.requestHash
                },
                connectedAccountId: 'acct_gate3ready01'
            }
        }));
        const repository = createRefundRepository({
            db: { runTransaction: (run) => runTransaction(firestore, run) },
            refs: seeded.refs,
            clock: effectClock,
            increment
        });
        const refundRequestId = 'refund-reversal-webhook-0001';
        await repository.prepareRefund({
            orderId: prepared.order.id,
            refundRequestId,
            amountCents: 3000,
            actor: { uid: 'admin-gate4', role: 'admin', aal2: true },
            reason: 'qualification webhook refund reversal'
        });
        const refundApplier = createRefundEffectApplier({
            refs: seeded.refs,
            clock: effectClock,
            increment
        });
        const providerRefund = {
            id: 're_gate4_async_reversal',
            status: 'succeeded',
            amount: 3000,
            currency: 'eur',
            payment_intent: 'pi_gate4_refund_reversal',
            metadata: {
                orderId: prepared.order.id,
                refundRequestId
            },
            connectedAccountId: 'acct_gate3ready01'
        };
        await runTransaction(firestore, (transaction) => refundApplier.apply(transaction, {
            entry: { scope: 'connect', accountId: 'acct_gate3ready01' },
            refund: providerRefund
        }));
        await runTransaction(firestore, (transaction) => refundApplier.apply(transaction, {
            entry: { scope: 'connect', accountId: 'acct_gate3ready01' },
            refund: { ...providerRefund, status: 'failed' }
        }));
        const order = (await getDoc(seeded.refs.order(prepared.order.id))).data();
        const attempt = (await getDoc(
            seeded.refs.refundAttempt(prepared.order.id, refundRequestId)
        )).data();
        const facts = await getDocs(collection(firestore, 'commerce_financial_facts'));
        const outboxes = await getDocs(collection(firestore, 'commerce_outbox'));
        context.equal(attempt.status, 'failed', 'same refund attempt records the reversal');
        context.equal(order.amounts.refundedCents, 0, 'reversed refund is removed from amounts');
        context.equal(order.amounts.netCents, order.amounts.capturedCents, 'net amount is restored');
        context.equal(order.refundAggregate.succeededCents, 0, 'refund aggregate is compensated');
        context.equal(order.refundAggregate.hasFailure, true, 'failure remains explicit');
        context.equal(order.inventorySummary.committedQty, 1, 'inventory remains committed');
        context.equal(order.inventorySummary.restockedQty, 0, 'refund reversal never restocks');
        context.deepEqual(
            facts.docs.map((document) => document.data().type).sort(),
            ['capture', 'refund', 'refund_reversal'],
            'append-only facts contain the compensating reversal'
        );
        context.deepEqual(
            outboxes.docs.map((document) => document.data().template).sort(),
            [
                'order-paid',
                'order-paid-admin',
                'order-refund-failed',
                'order-refund-failed-admin',
                'order-refunded',
                'order-refunded-admin'
            ],
            'customer and admin receive the asynchronous failure alerts once'
        );
        const refundOutboxes = outboxes.docs
            .map((document) => document.data())
            .filter((entry) => ['order-refunded', 'order-refunded-admin'].includes(entry.template));
        context.equal(refundOutboxes.length, 2, 'success notices stay uniquely addressable');
        context.equal(
            refundOutboxes.every((entry) => (
                entry.payloadSnapshot.refundRequestId === refundRequestId &&
                entry.nextAttemptAt === effectClock.nowMillis() + (5 * 60 * 1000)
            )),
            true,
            'success notices wait for the asynchronous reversal window'
        );
    }),

    'gate4-concurrent-returns-and-partial-dispositions-conserve-quantities': async (context) => withBackend(async (firestore) => {
        const seeded = await seedGate3Checkout(firestore);
        await setDoc(seeded.refs.product({ inventoryKey: seeded.inventoryKey }), {
            stock: 5
        }, { merge: true });
        const input = gate3CheckoutInput();
        input.items[0].quantity = 5;
        const prepared = await seeded.checkoutRepository.prepareCheckout({
            ownerUid: 'owner-uid-gate3',
            ownerEmail: 'client@example.test',
            input,
            fixtureContext: {
                runId: 'run_gate4_returns',
                fixtureScopeVersion: 'fixture_gate3_20260726'
            }
        });
        const effectClock = {
            now: () => '2026-07-26T12:05:00.000Z',
            nowMillis: () => Date.parse('2026-07-26T12:05:00.000Z')
        };
        const applier = createPaymentEffectApplier({
            refs: seeded.refs,
            clock: effectClock,
            increment
        });
        await runTransaction(firestore, (transaction) => applier.apply(transaction, {
            entry: { scope: 'connect', accountId: 'acct_gate3ready01' },
            paymentIntent: {
                id: 'pi_gate4_returns_firestore',
                status: 'succeeded',
                amount: prepared.order.amounts.totalCents,
                currency: 'eur',
                metadata: {
                    orderId: prepared.order.id,
                    requestHash: prepared.order.checkout.requestHash
                },
                connectedAccountId: 'acct_gate3ready01'
            }
        }));
        const orderRef = seeded.refs.order(prepared.order.id);
        let delivered = {
            ...(await getDoc(orderRef)).data(),
            id: prepared.order.id
        };
        delivered = reduceOrder(delivered, {
            type: 'fulfillment_shipped',
            trackingNumber: 'TRACK-GATE4-RETURNS'
        }, { clock: effectClock });
        delivered = reduceOrder(delivered, {
            type: 'fulfillment_delivered'
        }, { clock: effectClock });
        const { id: _ignoredId, ...deliveredDocument } = delivered;
        await setDoc(orderRef, deliveredDocument);

        const returns = createReturnRepository({
            db: { runTransaction: (run) => runTransaction(firestore, run) },
            refs: seeded.refs,
            clock: effectClock
        });
        const actor = { uid: 'admin-gate4', role: 'admin', aal2: true };
        const lineId = prepared.order.items[0].lineId;
        const [first, second] = await Promise.all([
            returns.create({
                orderId: prepared.order.id,
                returnRequestId: 'return-firestore-first',
                requestedLines: [{ lineId, quantity: 3 }],
                actor,
                reason: 'premier colis retour'
            }),
            returns.create({
                orderId: prepared.order.id,
                returnRequestId: 'return-firestore-second',
                requestedLines: [{ lineId, quantity: 2 }],
                actor,
                reason: 'second colis retour'
            })
        ]);
        const allocationRef = seeded.refs.returnAllocation(prepared.order.id, lineId);
        context.equal(
            (await getDoc(allocationRef)).data().requestedQty,
            5,
            'two concurrent returns reserve exactly q=5'
        );
        let exceeded = false;
        try {
            await returns.create({
                orderId: prepared.order.id,
                returnRequestId: 'return-firestore-excess',
                requestedLines: [{ lineId, quantity: 1 }],
                actor,
                reason: 'depassement interdit'
            });
        } catch (error) {
            exceeded = error?.code === 'COMMERCE_RETURN_ALLOCATION_EXCEEDED';
        }
        context.equal(exceeded, true, 'aggregate return allocation cannot exceed sold quantity');
        await returns.apply({
            orderId: prepared.order.id,
            returnId: second.returnCase.returnId,
            commandId: 'command-return-cancel-0001',
            expectedVersion: 0,
            event: { type: 'cancel' },
            actor,
            reason: 'annulation du retour pending'
        });
        context.equal(
            (await getDoc(allocationRef)).data().requestedQty,
            3,
            'canceling a pending return releases only its allocation'
        );
        await returns.apply({
            orderId: prepared.order.id,
            returnId: first.returnCase.returnId,
            commandId: 'command-return-receive-0001',
            expectedVersion: 0,
            event: {
                type: 'receive',
                lines: [{ lineId, quantity: 2 }]
            },
            actor,
            reason: 'reception physique partielle'
        });
        await returns.apply({
            orderId: prepared.order.id,
            returnId: first.returnCase.returnId,
            commandId: 'command-return-restock-0001',
            expectedVersion: 1,
            event: {
                type: 'restock',
                lines: [{ lineId, quantity: 1 }]
            },
            actor,
            reason: 'inspection conforme'
        });
        await returns.apply({
            orderId: prepared.order.id,
            returnId: first.returnCase.returnId,
            commandId: 'command-return-writeoff-0001',
            expectedVersion: 2,
            event: {
                type: 'write_off',
                lines: [{ lineId, quantity: 1 }]
            },
            actor,
            reason: 'inspection non revendable'
        });
        await returns.apply({
            orderId: prepared.order.id,
            returnId: first.returnCase.returnId,
            commandId: 'command-return-resolve-0001',
            expectedVersion: 3,
            event: { type: 'resolve' },
            actor,
            reason: 'dossier inspecte'
        });
        const finalOrder = (await getDoc(orderRef)).data();
        context.equal(finalOrder.inventorySummary.restockedQty, 1, 'one unit is restocked');
        context.equal(finalOrder.inventorySummary.writtenOffQty, 1, 'one unit is written off');
        context.equal(finalOrder.inventorySummary.committedQty, 3, 'three committed units remain');
        context.equal(
            (await getDoc(seeded.refs.product({
                inventoryKey: seeded.inventoryKey
            }))).data().stock,
            1,
            'only inspected restock returns to available stock'
        );
    }),

    'gate4-product-commands-are-atomic-idempotent-and-soft-archive': async (context) => withBackend(async (firestore) => {
        const refs = gate4ProductRefs(firestore);
        const commands = createProductCommandRepository({
            db: { runTransaction: (run) => runTransaction(firestore, run) },
            refs,
            clock: { now: () => '2026-07-27T12:00:00.000Z' }
        });
        const actor = { uid: 'admin-gate4', role: 'admin', aal2: true };
        const productId = 'product-gate4-firestore';
        const base = {
            collectionName: 'furniture',
            productId,
            actor
        };
        const createRequest = {
            ...base,
            action: 'create_product',
            command: {
                commandId: 'command-product-create-0001',
                expectedVersion: 0
            },
            reason: 'creation catalogue auditee',
            payload: {
                editorial: {
                    name: 'Buffet Firestore Gate 4',
                    description: 'Buffet restaure avec une description detaillee et exploitable.',
                    material: 'Chene',
                    seoIndexable: true,
                    category: 'buffets'
                },
                media: {
                    images: ['https://example.test/product.webp'],
                    imageUrl: 'https://example.test/product.webp'
                }
            }
        };
        const [firstCreate, retryCreate] = await Promise.all([
            commands.execute(createRequest),
            commands.execute(createRequest)
        ]);
        context.deepEqual(retryCreate, firstCreate, 'concurrent create reuses one durable result');

        const offer = await commands.execute({
            ...base,
            action: 'update_product_offer',
            command: {
                commandId: 'command-product-offer-0001',
                expectedVersion: 0
            },
            reason: 'offre catalogue auditee',
            payload: {
                offer: {
                    currentPrice: 350,
                    startingPrice: 420,
                    priceOnRequest: false
                }
            }
        });
        const inventory = await commands.execute({
            ...base,
            action: 'adjust_inventory',
            command: {
                commandId: 'command-product-stock-0001',
                expectedVersion: offer.commerceVersion
            },
            reason: 'stock physique controle',
            payload: {
                delta: 1,
                expectedInventoryVersion: 0
            }
        });
        const publicationRequest = {
            ...base,
            action: 'publish_product',
            command: {
                commandId: 'command-product-publish-0001',
                expectedVersion: inventory.commerceVersion
            },
            reason: 'publication catalogue auditee',
            payload: { published: true }
        };
        const publication = await commands.execute(publicationRequest);
        const publicationRetry = await commands.execute({
            ...publicationRequest,
            command: {
                ...publicationRequest.command,
                expectedVersion: 999
            }
        });
        context.deepEqual(
            publicationRetry,
            publication,
            'acknowledged publication retry wins before stale version'
        );
        const deletion = await commands.execute({
            ...base,
            action: 'delete_product',
            command: {
                commandId: 'command-product-delete-0001',
                expectedVersion: publication.commerceVersion
            },
            reason: 'archivage controle demande',
            payload: {}
        });

        const product = await getDoc(refs.product({
            collectionName: 'furniture',
            productId
        }));
        context.equal(deletion.status, 'archived', 'delete command reports a soft archive');
        context.equal(product.exists(), true, 'source product remains available for commerce history');
        context.equal(product.data().status, 'archived', 'archived source is excluded from the public projection');
        context.equal(product.data().stock, 1, 'archive preserves the authoritative stock state');
        context.equal(product.data().inventoryVersion, 1, 'archive never rewrites inventory history');
        context.equal(product.data().archivedBy, actor.uid, 'archive records its strong-admin actor');
        context.equal(
            (await getDocs(collection(
                firestore,
                `commerce_product_audits/furniture_${productId}/events`
            ))).size,
            5,
            'each distinct product command has one append-only audit'
        );
    })
};

module.exports = { scenarios };
