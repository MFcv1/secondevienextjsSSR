import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import admin from 'firebase-admin';

const requireFromFunctions = createRequire(new URL('../functions/package.json', import.meta.url));
const Stripe = requireFromFunctions('stripe');
const { createCancellationRuntime } = requireFromFunctions('./src/commerce/domain/v2Runtime');

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const REGION = 'europe-west1';
const SCOPE_ID = 'fixture_gate6_20260728';
const APP_ID = 'secondevie';
const APP_URL = 'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app';
const FUNCTIONS_BASE = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;
const MAX_PAYMENT_INTENTS = 2;

function parseArgs(argv) {
    return new Map(argv.map((argument) => {
        if (!argument.startsWith('--')) throw new Error(`D4_ARGUMENT_INVALID:${argument}`);
        const [key, ...parts] = argument.slice(2).split('=');
        return [key, parts.length ? parts.join('=') : 'true'];
    }));
}

function invariant(condition, code) {
    if (!condition) throw new Error(code);
}

function opaque(prefix, value) {
    return `${prefix}_${crypto.createHash('sha256').update(value).digest('hex').slice(0, 24)}`;
}

function publicEvidence(value) {
    return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 12);
}

async function callable(name, data, tokens, { consume = true } = {}) {
    const request = fetch(`${FUNCTIONS_BASE}/${name}`, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${tokens.idToken}`,
            'X-Firebase-AppCheck': tokens.appCheckToken,
            'content-type': 'application/json'
        },
        body: JSON.stringify({ data })
    });
    if (!consume) return request.catch(() => null);
    const response = await request;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.error) {
        const error = new Error(`D4_CALLABLE_FAILED:${name}:${response.status}`);
        error.details = payload.error?.details || null;
        throw error;
    }
    return payload.result;
}

async function tokenForUid(auth, uid, apiKey, appCheckToken, claims = undefined) {
    const customToken = await auth.createCustomToken(uid, claims);
    const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'X-Firebase-AppCheck': appCheckToken
            },
            body: JSON.stringify({ token: customToken, returnSecureToken: true })
        }
    );
    const payload = await response.json().catch(() => ({}));
    invariant(
        response.ok && payload.idToken,
        `D4_AUTH_TOKEN_EXCHANGE_FAILED:${String(payload.error?.message || response.status).slice(0, 120)}`
    );
    return { idToken: payload.idToken, appCheckToken };
}

async function waitFor(getter, predicate, code, timeoutMs = 60_000, intervalMs = 500) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        const value = await getter();
        if (predicate(value)) return { value, elapsedMs: Date.now() - startedAt };
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error(code);
}

function checkoutInput(product, runId, label) {
    return {
        clientOrderId: opaque(`client_${label}`, runId),
        items: [{
            cartLineId: opaque(`line_${label}`, runId),
            cartRevision: 1,
            productId: product.productId,
            collectionName: product.collectionName,
            variantId: product.variantId,
            quantity: 1
        }],
        deliveryModeId: 'fixture_delivery_fr',
        shippingAddress: {
            fullName: 'Test resilience D4',
            line1: '1 rue du Test',
            line2: '',
            postalCode: '75001',
            city: 'Paris',
            country: 'FR'
        }
    };
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    invariant(
        args.get('project') === PROJECT_ID &&
        args.get('env') === ENVIRONMENT &&
        args.get('commit') === 'true' &&
        args.get('confirm') === `RUN_D4_${PROJECT_ID}` &&
        Number(args.get('max-payment-intents')) === MAX_PAYMENT_INTENTS,
        'D4_EXPLICIT_CONFIRMATION_REQUIRED'
    );
    for (const key of [
        'FIREBASE_SERVICE_ACCOUNT_JSON',
        'STRIPE_SECRET_KEY',
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_APP_ID'
    ]) invariant(process.env[key], `D4_ENV_MISSING:${key}`);
    invariant(process.env.STRIPE_SECRET_KEY.startsWith('sk_test_'), 'D4_STRIPE_LIVE_FORBIDDEN');

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    invariant(serviceAccount.project_id === PROJECT_ID, 'D4_SERVICE_ACCOUNT_PROJECT_MISMATCH');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: PROJECT_ID
    });
    const db = admin.firestore();
    const auth = admin.auth();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const runRoot = `run_d4_${Date.now()}`;
    const runIds = {
        lostResponse: `${runRoot}_r05`,
        nominal: `${runRoot}_r00`
    };
    const reportPath = path.resolve(
        args.get('report') || `logs/commerce/resilience/${runRoot}.json`
    );
    const report = {
        schemaVersion: 1,
        gate: 'D4',
        project: PROJECT_ID,
        environment: ENVIRONMENT,
        stripeMode: 'test',
        runRoot,
        startedAt: new Date().toISOString(),
        budget: { paymentIntents: MAX_PAYMENT_INTENTS, refunds: 0, emails: 0 },
        scenarios: [],
        identifiers: {},
        rollback: { attempted: false, restored: false }
    };
    let originalControl = null;
    let switchedRevision = null;
    let requiresWindowSwitch = false;
    let cancellations = null;

    const record = (id, status, evidence) => {
        report.scenarios.push({ id, status, evidence });
    };
    const orderForRun = async (runId) => {
        const snapshot = await db.collection('orders')
            .where('testContext.runId', '==', runId)
            .limit(3)
            .get();
        return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
    };

    try {
        const [controlSnapshot, scopeSnapshot, operationsSnapshot, hosted] = await Promise.all([
            db.doc('sys_commerce_control/current').get(),
            db.doc(`commerce_fixture_scopes/${SCOPE_ID}`).get(),
            db.doc('sys_commerce_operations/current').get(),
            fetch(APP_URL, { redirect: 'manual' })
        ]);
        invariant(controlSnapshot.exists && scopeSnapshot.exists && operationsSnapshot.exists, 'D4_PREFLIGHT_DOC_MISSING');
        originalControl = controlSnapshot.data();
        const scope = scopeSnapshot.data();
        const operations = operationsSnapshot.data();
        invariant(
            ['v2_all', 'v2_fixture'].includes(originalControl.newCheckoutMode) &&
            originalControl.offlinePaymentMode === 'off' &&
            scope.active === true &&
            scope.projectId === PROJECT_ID &&
            scope.fixtureScopeVersion === SCOPE_ID &&
            operations.status === 'healthy' &&
            hosted.status === 200,
            'D4_PREFLIGHT_STATE_UNSAFE'
        );
        const existingWindowMatches = (
            originalControl.newCheckoutMode === 'v2_fixture' &&
            originalControl.fixtureScopeVersion === SCOPE_ID &&
            originalControl.activePolicyVersion === scope.policyVersion &&
            originalControl.adminMutationMode === 'read_only'
        );
        requiresWindowSwitch = !existingWindowMatches;
        if (!requiresWindowSwitch) {
            report.rollback.restored = true;
            report.rollback.notRequired = true;
        }
        const expiresAt = typeof scope.expiresAt?.toDate === 'function'
            ? scope.expiresAt.toDate()
            : new Date(scope.expiresAt);
        invariant(expiresAt > new Date(), 'D4_FIXTURE_SCOPE_EXPIRED');
        const availableProducts = [];
        for (const product of scope.fixtureProducts || []) {
            const snapshot = await db.doc(
                `artifacts/secondevie/public/data/${product.collectionName}/${product.productId}`
            ).get();
            const data = snapshot.data();
            if (
                snapshot.exists &&
                data?.e2eOnly === true &&
                data?.status === 'published' &&
                Number.isSafeInteger(data.stock) &&
                data.stock >= MAX_PAYMENT_INTENTS
            ) availableProducts.push({ ...product, stock: data.stock });
        }
        invariant(availableProducts.length === 1, 'D4_SAFE_FIXTURE_PRODUCT_COUNT_INVALID');
        const product = availableProducts[0];
        const policySnapshot = await db.doc(`commerce_policy_versions/${scope.policyVersion}`).get();
        invariant(policySnapshot.exists, 'D4_FIXTURE_POLICY_MISSING');
        const accountId = policySnapshot.data()?.stripeConnectedAccountId;
        invariant(/^acct_[A-Za-z0-9]+$/.test(String(accountId || '')), 'D4_CONNECT_ACCOUNT_MISSING');
        const account = await stripe.accounts.retrieve(accountId);
        invariant(account.livemode !== true && account.charges_enabled === true, 'D4_CONNECT_ACCOUNT_UNSAFE');
        record('preflight', 'passed', {
            checkoutModeBefore: originalControl.newCheckoutMode,
            operationsStatus: operations.status,
            hostedStatus: hosted.status,
            safeFixtureProducts: 1,
            availableStock: product.stock,
            stripeLivemode: false
        });

        const appCheck = await admin.appCheck().createToken(
            process.env.VITE_FIREBASE_APP_ID,
            { ttlMillis: 30 * 60 * 1000 }
        );
        const fixtureUid = scope.uids[0];
        const fixtureTokens = await tokenForUid(
            auth,
            fixtureUid,
            process.env.VITE_FIREBASE_API_KEY,
            appCheck.token
        );
        const adminEmail = process.env.E2E_ADMIN_EMAIL ||
            process.env.SUPER_ADMIN_EMAIL ||
            'loa.gto15@gmail.com';
        const adminUser = await auth.getUserByEmail(adminEmail);
        const adminTokens = await tokenForUid(
            auth,
            adminUser.uid,
            process.env.VITE_FIREBASE_API_KEY,
            appCheck.token,
            { authMethod: 'passkey', authAssurance: 'aal2', userVerified: true }
        );

        if (requiresWindowSwitch) {
            const nextRevision = Number(originalControl.controlRevision || 0) + 1;
            await db.runTransaction(async (transaction) => {
                const current = await transaction.get(db.doc('sys_commerce_control/current'));
                invariant(current.exists, 'D4_CONTROL_DISAPPEARED');
                invariant(
                    current.data().controlRevision === originalControl.controlRevision &&
                    current.data().newCheckoutMode === originalControl.newCheckoutMode,
                    'D4_CONTROL_CHANGED_DURING_PREFLIGHT'
                );
                transaction.update(current.ref, {
                    newCheckoutMode: 'v2_fixture',
                    activePolicyVersion: scope.policyVersion,
                    fixtureScopeVersion: SCOPE_ID,
                    fixtureScopeRef: `commerce_fixture_scopes/${SCOPE_ID}`,
                    adminMutationMode: 'read_only',
                    offlinePaymentMode: 'off',
                    controlRevision: nextRevision,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            switchedRevision = nextRevision;
        }
        record('fixture_window_open', 'passed', {
            mode: 'v2_fixture',
            controlRevision: switchedRevision || originalControl.controlRevision,
            reusedExistingWindow: switchedRevision === null,
            outboxPolicy: 'suppressed_test'
        });

        const cancelRuntime = createCancellationRuntime({ db, stripe, appId: APP_ID });
        cancellations = cancelRuntime.cancellations;
        const create = (runId, label, options = {}) => callable(
            'createCheckoutV2Gen2',
            {
                input: checkoutInput(product, runId, label),
                fixture: { runId, fixtureScopeVersion: SCOPE_ID }
            },
            fixtureTokens,
            options
        );

        const lostRequest = create(runIds.lostResponse, 'lost_response', { consume: false });
        const durableLost = await waitFor(
            () => orderForRun(runIds.lostResponse),
            (orders) => orders.length === 1 && Boolean(orders[0].payment?.paymentIntentId),
            'D4_R05_DURABLE_ORDER_NOT_FOUND',
            60_000
        );
        await lostRequest;
        const retry = await create(runIds.lostResponse, 'lost_response');
        const lostOrders = await orderForRun(runIds.lostResponse);
        invariant(
            lostOrders.length === 1 &&
            retry.orderId === lostOrders[0].id &&
            retry.paymentIntentId === lostOrders[0].payment.paymentIntentId,
            'D4_R05_IDEMPOTENCY_FAILED'
        );
        const lostIntent = await stripe.paymentIntents.retrieve(
            retry.paymentIntentId,
            {},
            { stripeAccount: retry.connectedAccountId }
        );
        invariant(lostIntent.livemode === false, 'D4_R05_LIVE_INTENT_FORBIDDEN');
        const canceled = await cancellations.requestCancellation({
            orderId: retry.orderId,
            commandId: opaque('cancel', runIds.lostResponse),
            ownerUid: fixtureUid,
            reason: 'D4 lost response cleanup'
        });
        invariant(canceled.outcome === 'canceled', 'D4_R05_CANCELLATION_FAILED');
        record('R05', 'passed', {
            durableBeforeResponseConsumption: true,
            retryReusedOrder: true,
            retryReusedPaymentIntent: true,
            paymentIntentLivemode: false,
            providerFirstCleanup: canceled.outcome,
            discoveryLatencyMs: durableLost.elapsedMs
        });
        report.identifiers.R05 = {
            orderHash: publicEvidence(retry.orderId),
            paymentIntentHash: publicEvidence(retry.paymentIntentId)
        };

        const invalidEventId = opaque('evt_invalid', runRoot);
        const invalidResponse = await fetch(
            `${FUNCTIONS_BASE}/stripeConnectWebhookV2Gen2`,
            {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'stripe-signature': 'invalid-d4-signature'
                },
                body: JSON.stringify({
                    id: invalidEventId,
                    type: 'payment_intent.succeeded',
                    livemode: false,
                    account: accountId,
                    data: { object: { id: opaque('pi_invalid', runRoot) } }
                })
            }
        );
        const invalidInbox = await db.collection('commerce_webhook_inbox')
            .where('eventId', '==', invalidEventId)
            .limit(1)
            .get();
        invariant(invalidResponse.status === 400 && invalidInbox.empty, 'D4_R18_REJECTION_FAILED');
        record('R18', 'passed', { status: 400, inboxWrites: 0 });

        const nominal = await create(runIds.nominal, 'nominal');
        const paymentIntent = await stripe.paymentIntents.confirm(
            nominal.paymentIntentId,
            { payment_method: 'pm_card_visa', return_url: `${APP_URL}/checkout` },
            { stripeAccount: nominal.connectedAccountId }
        );
        invariant(paymentIntent.livemode === false && paymentIntent.status === 'succeeded', 'D4_R00_STRIPE_CONFIRM_FAILED');
        const durablePaid = await waitFor(
            async () => (await db.doc(`orders/${nominal.orderId}`).get()).data(),
            (order) => order?.payment?.status === 'succeeded',
            'D4_R00_DURABLE_PAYMENT_TIMEOUT',
            90_000,
            1000
        );
        const paidOrder = durablePaid.value;
        invariant(
            paidOrder.checkout?.closeReason === 'paid' &&
            paidOrder.inventorySummary?.status === 'committed',
            'D4_R00_DURABLE_INVARIANT_FAILED'
        );
        const [facts, movements, outboxes, inboxes] = await Promise.all([
            db.collection('commerce_financial_facts').where('orderId', '==', nominal.orderId).limit(10).get(),
            db.collection('inventory_movements').where('orderId', '==', nominal.orderId).limit(10).get(),
            db.collection('commerce_outbox').where('aggregateId', '==', nominal.orderId).limit(10).get(),
            db.collection('commerce_webhook_inbox').where('objectId', '==', nominal.paymentIntentId).limit(10).get()
        ]);
        invariant(facts.size === 1, 'D4_R00_FINANCIAL_FACT_COUNT_INVALID');
        invariant(movements.docs.filter((document) => document.data().type === 'commit').length === 1, 'D4_R00_COMMIT_COUNT_INVALID');
        invariant(outboxes.size === 2, 'D4_R00_OUTBOX_COUNT_INVALID');
        invariant(inboxes.docs.some((document) => document.data().status === 'processed'), 'D4_R00_INBOX_NOT_PROCESSED');

        const diagnostic = await callable(
            'getDiagnosticTimelineAdminGen2',
            { kind: 'order', value: nominal.orderId },
            adminTokens
        );
        invariant(diagnostic.matches?.length === 1, 'D4_R00_DIAGNOSTIC_MISSING');
        record('R00', 'passed', {
            durableStatus: paidOrder.payment.status,
            inventoryStatus: paidOrder.inventorySummary.status,
            financialFacts: facts.size,
            commitMovements: 1,
            outboxIntents: outboxes.size,
            processedWebhookObserved: true,
            consoleMatches: diagnostic.matches.length,
            providerToDurableMs: durablePaid.elapsedMs
        });
        report.identifiers.R00 = {
            orderHash: publicEvidence(nominal.orderId),
            paymentIntentHash: publicEvidence(nominal.paymentIntentId)
        };

        const suppressed = await waitFor(
            async () => {
                const snapshot = await db.collection('commerce_outbox')
                    .where('aggregateId', '==', nominal.orderId)
                    .limit(10)
                    .get();
                return snapshot.docs.map((document) => document.data().status);
            },
            (statuses) => statuses.length === 2 && statuses.every((status) => status === 'suppressed_test'),
            'D4_OUTBOX_NOT_SUPPRESSED',
            180_000,
            2000
        );
        record('outbox_neutralization', 'passed', {
            statuses: ['suppressed_test', 'suppressed_test'],
            emailsSent: 0,
            convergenceMs: suppressed.elapsedMs
        });

        for (const runId of Object.values(runIds)) {
            const dryRun = await callable('cleanupFixtureRunAdminGen2', { runId }, adminTokens);
            invariant(dryRun.complete === true && dryRun.plan?.deletes === 0, 'D4_CLEANUP_DRY_RUN_INVALID');
            const cleanup = await callable(
                'cleanupFixtureRunAdminGen2',
                { runId, commit: true, confirm: `QUARANTINE_${runId}` },
                adminTokens
            );
            invariant(cleanup.complete === true && cleanup.plan?.deletes === 0, 'D4_CLEANUP_COMMIT_INVALID');
            record(`cleanup_${runId.slice(-3)}`, 'passed', {
                protectedPreserved: cleanup.plan.actions.filter((entry) => entry.action === 'preserve').length,
                auxiliaryQuarantined: cleanup.plan.actions.filter((entry) => entry.action === 'quarantine').length,
                deletes: 0
            });
        }

        record('R07', 'not_executed', {
            reason: 'no external seam can interrupt Firestore after Stripe effect without a deployed failpoint'
        });
        record('R10', 'partially_observed', {
            reason: 'real Stripe webhook delivery cannot be delayed safely without mutating the shared endpoint',
            observedProviderToDurableMs: durablePaid.elapsedMs
        });
        report.status = 'partial';
    } finally {
        if (originalControl && switchedRevision !== null) {
            report.rollback.attempted = true;
            await db.runTransaction(async (transaction) => {
                const current = await transaction.get(db.doc('sys_commerce_control/current'));
                invariant(current.exists, 'D4_ROLLBACK_CONTROL_MISSING');
                invariant(
                    current.data().controlRevision === switchedRevision &&
                    current.data().newCheckoutMode === 'v2_fixture',
                    'D4_ROLLBACK_PRECONDITION_FAILED'
                );
                transaction.update(current.ref, {
                    newCheckoutMode: originalControl.newCheckoutMode,
                    activePolicyVersion: originalControl.activePolicyVersion,
                    fixtureScopeVersion: originalControl.fixtureScopeVersion === undefined
                        ? admin.firestore.FieldValue.delete()
                        : originalControl.fixtureScopeVersion,
                    fixtureScopeRef: originalControl.fixtureScopeRef === undefined
                        ? admin.firestore.FieldValue.delete()
                        : originalControl.fixtureScopeRef,
                    adminMutationMode: originalControl.adminMutationMode,
                    offlinePaymentMode: originalControl.offlinePaymentMode,
                    controlRevision: switchedRevision + 1,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            const restored = (await db.doc('sys_commerce_control/current').get()).data();
            const fixtureScopeRestored = Object.hasOwn(originalControl, 'fixtureScopeVersion')
                ? restored.fixtureScopeVersion === originalControl.fixtureScopeVersion
                : !Object.hasOwn(restored, 'fixtureScopeVersion');
            const fixtureScopeRefRestored = Object.hasOwn(originalControl, 'fixtureScopeRef')
                ? restored.fixtureScopeRef === originalControl.fixtureScopeRef
                : !Object.hasOwn(restored, 'fixtureScopeRef');
            report.rollback.restored = (
                restored.newCheckoutMode === originalControl.newCheckoutMode &&
                restored.activePolicyVersion === originalControl.activePolicyVersion &&
                restored.adminMutationMode === originalControl.adminMutationMode &&
                restored.offlinePaymentMode === originalControl.offlinePaymentMode &&
                fixtureScopeRestored &&
                fixtureScopeRefRestored
            );
            invariant(report.rollback.restored, 'D4_ROLLBACK_VERIFICATION_FAILED');
        }
        report.completedAt = new Date().toISOString();
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
        await admin.app().delete();
    }

    console.log(JSON.stringify({
        ok: true,
        status: report.status,
        runHash: publicEvidence(runRoot),
        scenarios: report.scenarios.map(({ id, status }) => ({ id, status })),
        rollback: report.rollback,
        reportPath: path.relative(process.cwd(), reportPath)
    }));
}

try {
    await main();
} catch (error) {
    console.error(JSON.stringify({
        ok: false,
        error: String(error?.message || error)
    }));
    process.exitCode = 1;
}
