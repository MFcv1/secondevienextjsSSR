'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { APP_ID } = require('../../helpers/config');
const {
    GMAIL_EMAIL,
    GMAIL_PASSWORD,
    RESEND_API_KEY,
    RESEND_FROM_EMAIL,
    TRANSACTIONAL_EMAIL_PROVIDER
} = require('../../helpers/secrets');
const {
    checkRecentActiveStrongAdmin,
    normalizeFirestoreId
} = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const {
    createTransactionalEmailSender
} = require('../email/transactionalEmail');
const {
    buildPaymentReceipt,
    buildRefundConfirmation
} = require('./domain/commerceDocuments');
const {
    buildFinancialProjection
} = require('./domain/financialProjection');
const {
    createFirestoreWorkerQueries
} = require('./domain/firestoreWorkerQueries');
const {
    planFixtureCleanup
} = require('./domain/fixtureCleanup');
const {
    evaluateCommerceHealth
} = require('./domain/operationsHealth');
const {
    createOutboxRepository
} = require('./domain/outboxRepository');
const {
    createOutboxWorker
} = require('./domain/outboxWorker');
const {
    createBoundedWorkerSweeper
} = require('./domain/boundedWorkerSweeper');

const db = admin.firestore();
const OUTBOX_SECRETS = [GMAIL_EMAIL, GMAIL_PASSWORD, RESEND_API_KEY];
const MAX_FACTS = 5000;
const MAX_ORDERS = 500;
const FIXTURE_COLLECTIONS = [
    'commerce_checkout_identities',
    'commerce_command_results',
    'commerce_financial_facts',
    'commerce_incidents',
    'commerce_order_access_tokens',
    'commerce_outbox',
    'commerce_webhook_inbox',
    'inventory_movements',
    'inventory_reservations',
    'orders'
];

function operationsError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function createClock() {
    return Object.freeze({
        now: () => new Date().toISOString(),
        nowMillis: () => Date.now()
    });
}

function outboxRefs() {
    return {
        outbox: (outboxId) => db.doc(`commerce_outbox/${outboxId}`)
    };
}

function createEmailSender() {
    const provider = String(TRANSACTIONAL_EMAIL_PROVIDER.value() || 'gmail').toLowerCase();
    return createTransactionalEmailSender({
        provider,
        gmail: {
            user: GMAIL_EMAIL.value(),
            password: GMAIL_PASSWORD.value()
        },
        resend: {
            apiKey: RESEND_API_KEY.value()
        }
    });
}

function messageFor(entry, order, senderEmail) {
    const recipient = order?.customerSnapshot?.email || order?.userEmail || null;
    if (typeof recipient !== 'string' || !recipient.includes('@')) {
        throw operationsError('COMMERCE_OUTBOX_RECIPIENT_MISSING');
    }
    const amount = Number(entry.payloadSnapshot?.amountCents || 0);
    const amountLabel = `${(amount / 100).toFixed(2)} EUR`;
    if (entry.template === 'order-paid') {
        return {
            from: senderEmail,
            to: recipient,
            subject: 'Paiement sandbox confirme',
            text: `Votre paiement sandbox de ${amountLabel} est confirme. Ce message ne constitue pas une facture.`
        };
    }
    if (entry.template === 'order-refunded') {
        return {
            from: senderEmail,
            to: recipient,
            subject: 'Remboursement sandbox confirme',
            text: `Votre remboursement sandbox de ${amountLabel} est confirme. Le delai bancaire reste indicatif.`
        };
    }
    throw operationsError('COMMERCE_OUTBOX_TEMPLATE_UNSUPPORTED');
}

function ambiguousGmailError(error, provider) {
    return provider === 'gmail' && (
        ['ECONNRESET', 'ESOCKET', 'ETIMEDOUT', 'GMAIL_SEND_FAILED'].includes(error?.code)
    );
}

function createOutboxRuntime() {
    const clock = createClock();
    const sender = createEmailSender();
    const repository = createOutboxRepository({
        db: { runTransaction: (run) => db.runTransaction(run) },
        refs: outboxRefs()
    });
    const worker = createOutboxWorker({
        repository,
        ids: { leaseToken: () => crypto.randomUUID() },
        clock,
        send: async (entry) => {
            const orderId = normalizeFirestoreId(
                entry.payload?.orderId || entry.aggregateId || entry.payloadSnapshot?.orderId,
                'Commande outbox'
            );
            const orderSnapshot = await db.doc(`orders/${orderId}`).get();
            if (!orderSnapshot.exists) throw operationsError('COMMERCE_OUTBOX_ORDER_MISSING');
            try {
                const result = await sender.send(
                    messageFor(
                        {
                            template: entry.template,
                            payloadSnapshot: entry.payload
                        },
                        orderSnapshot.data(),
                        sender.provider === 'resend'
                            ? RESEND_FROM_EMAIL.value()
                            : GMAIL_EMAIL.value()
                    ),
                    { idempotencyKey: entry.idempotencyKey }
                );
                if (!result?.id) throw operationsError('COMMERCE_OUTBOX_PROVIDER_RESPONSE_INVALID');
                return { providerMessageId: result.id };
            } catch (error) {
                if (ambiguousGmailError(error, sender.provider)) {
                    error.code = 'GMAIL_DELIVERY_UNKNOWN';
                    error.deliveryUnknown = true;
                }
                throw error;
            }
        }
    });
    const queries = createFirestoreWorkerQueries({ db });
    const sweeper = (listEligible) => createBoundedWorkerSweeper({
        listEligible,
        processItem: (item) => worker.process(item.id),
        clock,
        pageSize: 25,
        maxPages: 4
    });
    return {
        due: sweeper(queries.listDueOutbox),
        expiredLeases: sweeper(queries.listExpiredOutboxLeases)
    };
}

async function upsertImmutableDocument(reference, document) {
    try {
        await reference.create(document);
        return 'created';
    } catch (error) {
        if (error?.code !== 6 && error?.code !== 'already-exists') throw error;
        const existing = await reference.get();
        if (!existing.exists || existing.data()?.contentHash !== document.contentHash) {
            throw operationsError('COMMERCE_DOCUMENT_IMMUTABILITY_CONFLICT');
        }
        return 'reused';
    }
}

async function rebuildDocuments(facts) {
    const factsByOrder = new Map();
    for (const fact of facts) {
        if (!factsByOrder.has(fact.orderId)) factsByOrder.set(fact.orderId, []);
        factsByOrder.get(fact.orderId).push(fact);
    }
    const orders = await db.collection('orders')
        .where('schemaVersion', '==', 2)
        .limit(MAX_ORDERS)
        .get();
    let created = 0;
    let reused = 0;
    for (const snapshot of orders.docs) {
        const order = { id: snapshot.id, ...snapshot.data() };
        const orderFacts = factsByOrder.get(snapshot.id) || [];
        if (order.payment?.status === 'succeeded') {
            const receipt = buildPaymentReceipt({
                order,
                facts: orderFacts,
                issuedAt: order.payment.succeededAt || new Date().toISOString()
            });
            const result = await upsertImmutableDocument(
                snapshot.ref.collection('documents').doc(receipt.documentId),
                receipt
            );
            if (result === 'created') created += 1;
            else reused += 1;
        }
        const refundIds = [...new Set(
            orderFacts
                .filter((fact) => fact.type === 'refund')
                .map((fact) => fact.providerObjectId)
        )];
        for (const refundId of refundIds) {
            const confirmation = buildRefundConfirmation({
                order,
                facts: orderFacts,
                refundId,
                issuedAt: orderFacts.find((fact) => fact.providerObjectId === refundId)?.effectiveAt
            });
            const result = await upsertImmutableDocument(
                snapshot.ref.collection('documents').doc(confirmation.documentId),
                confirmation
            );
            if (result === 'created') created += 1;
            else reused += 1;
        }
    }
    return { scannedOrders: orders.size, created, reused };
}

async function countQuery(query) {
    const snapshot = await query.limit(100).get();
    return snapshot.size;
}

async function connectDriftCount() {
    const [legacy, control] = await Promise.all([
        db.doc('sys_metadata/stripe_connect').get(),
        db.doc('sys_commerce_control/current').get()
    ]);
    const activeAccountId = legacy.exists ? legacy.data()?.activeAccountId : null;
    const policyVersion = control.exists ? control.data()?.activePolicyVersion : null;
    if (!activeAccountId || !policyVersion) return 1;
    const [account, policy] = await Promise.all([
        db.doc(`commerce_connect_accounts/${activeAccountId}`).get(),
        db.doc(`commerce_policy_versions/${policyVersion}`).get()
    ]);
    if (!account.exists || !policy.exists) return 1;
    return (
        account.data()?.active !== true ||
        account.data()?.chargesEnabled !== true ||
        account.data()?.detailsSubmitted !== true ||
        account.data()?.livemode === true ||
        policy.data()?.stripeConnectedAccountId !== activeAccountId
    ) ? 1 : 0;
}

async function buildHealth(projection) {
    const nowMillis = Date.now();
    const now = new Date(nowMillis).toISOString();
    const openIncidentsPromise = db.collection('commerce_incidents')
        .where('status', '==', 'open')
        .limit(100)
        .get();
    const [
        dueInbox,
        expiredInboxLeases,
        deadLetterOutbox,
        deliveryUnknown,
        expiredHolds,
        openIncidents,
        connectDrift
    ] = await Promise.all([
        countQuery(db.collection('commerce_webhook_inbox')
            .where('status', 'in', ['received', 'failed'])
            .where('nextAttemptAt', '<=', nowMillis)),
        countQuery(db.collection('commerce_webhook_inbox')
            .where('status', '==', 'processing')
            .where('processingUntil', '<=', nowMillis)),
        countQuery(db.collection('commerce_outbox').where('status', '==', 'dead_letter')),
        countQuery(db.collection('commerce_outbox').where('status', '==', 'delivery_unknown')),
        countQuery(db.collection('inventory_reservations')
            .where('status', '==', 'held')
            .where('expiresAt', '<=', now)),
        openIncidentsPromise,
        connectDriftCount()
    ]);
    const incidentCodes = openIncidents.docs.map((document) => document.data()?.code);
    const orphanPayments = incidentCodes
        .filter((code) => ['payment_orphan', 'payment_intent_orphan'].includes(code))
        .length;
    const refundStockDivergences = incidentCodes
        .filter((code) => ['refund_stock_divergence', 'inventory_conflict'].includes(code))
        .length;
    return evaluateCommerceHealth({
        dueInbox,
        expiredInboxLeases,
        deadLetterOutbox,
        deliveryUnknown,
        expiredHolds,
        orphanPayments,
        refundStockDivergences,
        connectDrift,
        projectionDivergences: projection.divergences.length
    }, { evaluatedAt: new Date().toISOString() });
}

async function persistHealthIncidents(health) {
    const batch = db.batch();
    for (const [code, count] of Object.entries(health.counters)) {
        const reference = db.doc(`commerce_incidents/operations-${code}`);
        batch.set(reference, {
            schemaVersion: 2,
            code: `operations_${code}`,
            status: count > 0 ? 'open' : 'closed',
            count,
            source: 'commerce_operations_reconciler',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
    await batch.commit();
}

async function runOperationsRebuild() {
    const factsSnapshot = await db.collection('commerce_financial_facts').limit(MAX_FACTS).get();
    const facts = factsSnapshot.docs.map((document) => document.data());
    const builtAt = new Date().toISOString();
    const projection = buildFinancialProjection(facts, { builtAt });
    await db.doc('commerce_financial_projections/current').set(projection);
    const documents = await rebuildDocuments(facts);
    const health = await buildHealth(projection);
    await Promise.all([
        db.doc('sys_commerce_operations/current').set({
            ...health,
            projection: {
                source: projection.source,
                projectionHash: projection.projectionHash,
                factCount: projection.factCount,
                builtAt,
                divergenceCount: projection.divergences.length,
                currencies: projection.currencies
            },
            documents,
            appId: APP_ID
        }),
        persistHealthIncidents(health)
    ]);
    return { projection, health, documents };
}

async function runOutboxDispatcher() {
    const runtime = createOutboxRuntime();
    const due = await runtime.due.run();
    const expiredLeases = await runtime.expiredLeases.run();
    return { due, expiredLeases };
}

const commerceOutboxDispatcher = regionalFunctions()
    .runWith({ secrets: OUTBOX_SECRETS, timeoutSeconds: 300, memory: '512MB' })
    .pubsub.schedule('every 2 minutes')
    .onRun(runOutboxDispatcher);

const commerceOperationsReconciler = regionalFunctions()
    .runWith({ timeoutSeconds: 300, memory: '512MB' })
    .pubsub.schedule('every 5 minutes')
    .onRun(runOperationsRebuild);

const getCommerceOperationsStatusAdmin = regionalFunctions()
    .runWith({ enforceAppCheck: true })
    .https.onCall(async (_data, context) => {
        await checkRecentActiveStrongAdmin(context);
        const [operations, control] = await Promise.all([
            db.doc('sys_commerce_operations/current').get(),
            db.doc('sys_commerce_control/current').get()
        ]);
        return {
            success: true,
            operations: operations.exists ? operations.data() : null,
            control: control.exists ? {
                newCheckoutMode: control.data()?.newCheckoutMode || 'off',
                adminMutationMode: control.data()?.adminMutationMode || 'read_only',
                fixtureScopeVersion: control.data()?.fixtureScopeVersion || null,
                controlRevision: control.data()?.controlRevision || null
            } : null
        };
    });

const rebuildCommerceOperationsAdmin = regionalFunctions()
    .runWith({ enforceAppCheck: true, timeoutSeconds: 300, memory: '512MB' })
    .https.onCall(async (_data, context) => {
        await checkRecentActiveStrongAdmin(context);
        const result = await runOperationsRebuild();
        return {
            success: true,
            projectionHash: result.projection.projectionHash,
            factCount: result.projection.factCount,
            healthStatus: result.health.status,
            documents: result.documents
        };
    });

const cleanupFixtureRunAdmin = regionalFunctions()
    .runWith({ enforceAppCheck: true, timeoutSeconds: 180, memory: '512MB' })
    .https.onCall(async (data, context) => {
        await checkRecentActiveStrongAdmin(context);
        const runId = normalizeFirestoreId(data?.runId, 'Run fixture');
        if (!runId.startsWith('run_')) {
            throw new functions.https.HttpsError('invalid-argument', 'Run fixture invalide.');
        }
        const dryRun = data?.commit !== true;
        if (!dryRun && data?.confirm !== `QUARANTINE_${runId}`) {
            throw new functions.https.HttpsError(
                'failed-precondition',
                'Confirmation de quarantaine fixture invalide.'
            );
        }
        const documents = [];
        let boundedLimitReached = false;
        for (const collection of FIXTURE_COLLECTIONS) {
            const snapshot = await db.collection(collection)
                .where('testContext.runId', '==', runId)
                .limit(100)
                .get();
            if (snapshot.size === 100) boundedLimitReached = true;
            for (const document of snapshot.docs) {
                documents.push({
                    collection,
                    id: document.id,
                    status: document.data()?.status || null,
                    testContext: document.data()?.testContext || null
                });
            }
        }
        const plan = planFixtureCleanup({ runId, documents, dryRun });
        if (!dryRun) {
            const quarantine = plan.actions.filter((entry) => entry.action === 'quarantine');
            for (let offset = 0; offset < quarantine.length; offset += 400) {
                const batch = db.batch();
                for (const entry of quarantine.slice(offset, offset + 400)) {
                    batch.set(db.doc(`${entry.collection}/${entry.id}`), {
                        fixtureCleanup: {
                            schemaVersion: 2,
                            status: 'quarantined',
                            runId,
                            reason: entry.reason,
                            operationId: `cleanup_${runId}`
                        },
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
                await batch.commit();
            }
        }
        return {
            success: true,
            complete: !boundedLimitReached,
            plan
        };
    });

module.exports = {
    cleanupFixtureRunAdmin,
    commerceOperationsReconciler,
    commerceOutboxDispatcher,
    getCommerceOperationsStatusAdmin,
    rebuildCommerceOperationsAdmin,
    runOperationsRebuild,
    runOutboxDispatcher
};
