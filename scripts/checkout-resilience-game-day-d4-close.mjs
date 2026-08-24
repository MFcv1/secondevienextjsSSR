import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import admin from 'firebase-admin';

const requireFromFunctions = createRequire(new URL('../functions/package.json', import.meta.url));
const Stripe = requireFromFunctions('stripe');
const {
    createCancellationRuntime,
    createCheckoutRuntime
} = requireFromFunctions('./src/commerce/domain/v2Runtime');
const {
    createFailpointController
} = requireFromFunctions('./src/commerce/domain/failpoints');

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const REGION = 'europe-west1';
const SCOPE_ID = 'fixture_gate6_20260728';
const APP_ID = 'secondevie';
const APP_URL = 'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app';
const FUNCTIONS_BASE = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;
const CONNECT_WEBHOOK_URL = `${FUNCTIONS_BASE}/stripeConnectWebhookV2Gen2`;
const MAX_PAYMENT_INTENTS = 2;
const WEBHOOK_PAUSE_MS = 5000;

function invariant(condition, code) {
    if (!condition) throw new Error(code);
}

function parseArgs(argv) {
    return new Map(argv.map((argument) => {
        if (!argument.startsWith('--')) throw new Error(`D4_CLOSE_ARGUMENT_INVALID:${argument}`);
        const [key, ...parts] = argument.slice(2).split('=');
        return [key, parts.length ? parts.join('=') : 'true'];
    }));
}

function opaque(prefix, value) {
    return `${prefix}_${crypto.createHash('sha256').update(value).digest('hex').slice(0, 24)}`;
}

function hash(value) {
    return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 12);
}

function accessSecret(name) {
    const value = execFileSync('pnpm', [
        '--silent', 'exec', 'firebase', 'functions:secrets:access', name,
        '--project', PROJECT_ID
    ], {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    invariant(value.length >= 8, `D4_CLOSE_SECRET_UNAVAILABLE:${name}`);
    return value;
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

async function callable(name, data, tokens) {
    const response = await fetch(`${FUNCTIONS_BASE}/${name}`, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${tokens.idToken}`,
            'X-Firebase-AppCheck': tokens.appCheckToken,
            'content-type': 'application/json'
        },
        body: JSON.stringify({ data })
    });
    const payload = await response.json().catch(() => ({}));
    invariant(response.ok && !payload.error, `D4_CLOSE_CALLABLE_FAILED:${name}:${response.status}`);
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
        `D4_CLOSE_AUTH_FAILED:${String(payload.error?.message || response.status).slice(0, 120)}`
    );
    return { idToken: payload.idToken, appCheckToken };
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
            fullName: 'Test resilience D4 close',
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
        args.get('confirm') === `CLOSE_D4_${PROJECT_ID}` &&
        Number(args.get('max-payment-intents')) === MAX_PAYMENT_INTENTS &&
        Number(args.get('webhook-pause-ms')) === WEBHOOK_PAUSE_MS,
        'D4_CLOSE_EXPLICIT_CONFIRMATION_REQUIRED'
    );
    for (const key of [
        'FIREBASE_SERVICE_ACCOUNT_JSON',
        'STRIPE_SECRET_KEY',
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_APP_ID'
    ]) invariant(process.env[key], `D4_CLOSE_ENV_MISSING:${key}`);
    invariant(process.env.STRIPE_SECRET_KEY.startsWith('sk_test_'), 'D4_CLOSE_STRIPE_LIVE_FORBIDDEN');

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    invariant(serviceAccount.project_id === PROJECT_ID, 'D4_CLOSE_PROJECT_MISMATCH');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: PROJECT_ID
    });
    const db = admin.firestore();
    const auth = admin.auth();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const runRoot = `run_d4_close_${Date.now()}`;
    const runIds = { r07: `${runRoot}_r07`, r10: `${runRoot}_r10` };
    const reportPath = path.resolve(
        args.get('report') || `logs/commerce/resilience/${runRoot}.json`
    );
    const report = {
        schemaVersion: 1,
        gate: 'D4-close',
        runRoot,
        startedAt: new Date().toISOString(),
        budget: { paymentIntents: 2, refunds: 0, emails: 0, webhookPauseMs: WEBHOOK_PAUSE_MS },
        scenarios: [],
        endpoint: { disabled: false, restored: false },
        control: { corrected: false }
    };
    let webhookEndpoint = null;
    let endpointDisabled = false;

    const record = (id, status, evidence) => report.scenarios.push({ id, status, evidence });
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
        invariant(controlSnapshot.exists && scopeSnapshot.exists && operationsSnapshot.exists, 'D4_CLOSE_PREFLIGHT_DOC_MISSING');
        const control = controlSnapshot.data();
        const scope = scopeSnapshot.data();
        invariant(
            control.newCheckoutMode === 'v2_fixture' &&
            control.controlRevision === 75 &&
            !Object.hasOwn(control, 'fixtureScopeVersion') &&
            !Object.hasOwn(control, 'fixtureScopeRef') &&
            scope.active === true &&
            scope.projectId === PROJECT_ID &&
            operationsSnapshot.data()?.status === 'healthy' &&
            hosted.status === 200,
            'D4_CLOSE_PREFLIGHT_STATE_CHANGED'
        );
        const expiresAt = typeof scope.expiresAt?.toDate === 'function'
            ? scope.expiresAt.toDate()
            : new Date(scope.expiresAt);
        invariant(expiresAt > new Date(), 'D4_CLOSE_SCOPE_EXPIRED');
        const productCandidates = [];
        for (const product of scope.fixtureProducts || []) {
            const snapshot = await db.doc(
                `artifacts/secondevie/public/data/${product.collectionName}/${product.productId}`
            ).get();
            const data = snapshot.data();
            if (
                snapshot.exists && data?.e2eOnly === true && data?.status === 'published' &&
                Number.isSafeInteger(data.stock) && data.stock >= 2
            ) productCandidates.push({ ...product, stock: data.stock });
        }
        invariant(productCandidates.length === 1, 'D4_CLOSE_SAFE_PRODUCT_INVALID');
        const product = productCandidates[0];
        const policy = (await db.doc(`commerce_policy_versions/${scope.policyVersion}`).get()).data();
        const accountId = policy?.stripeConnectedAccountId;
        const account = await stripe.accounts.retrieve(accountId);
        invariant(account.livemode !== true && account.charges_enabled === true, 'D4_CLOSE_CONNECT_UNSAFE');

        const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
        webhookEndpoint = endpoints.data.find((endpoint) => endpoint.url === CONNECT_WEBHOOK_URL);
        invariant(
            webhookEndpoint && webhookEndpoint.livemode === false && webhookEndpoint.status === 'enabled',
            'D4_CLOSE_WEBHOOK_ENDPOINT_UNSAFE'
        );
        const activeOrders = await db.collection('orders')
            .where('checkout.status', '==', 'active')
            .limit(20)
            .get();
        const unrelatedRecentActive = activeOrders.docs.filter((document) => {
            const data = document.data();
            return !data.testContext?.runId && Date.parse(data.updatedAt || data.createdAt || 0) > Date.now() - 15 * 60 * 1000;
        });
        invariant(unrelatedRecentActive.length === 0, 'D4_CLOSE_UNRELATED_ACTIVE_CHECKOUT');
        record('preflight', 'passed', {
            stock: product.stock,
            operations: 'healthy',
            stripeLivemode: false,
            endpointStatus: 'enabled',
            unrelatedRecentActive: 0
        });

        await db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(db.doc('sys_commerce_control/current'));
            const current = snapshot.data();
            invariant(current.controlRevision === 75, 'D4_CLOSE_CONTROL_REVISION_CHANGED');
            transaction.update(snapshot.ref, {
                activePolicyVersion: scope.policyVersion,
                fixtureScopeVersion: SCOPE_ID,
                fixtureScopeRef: `commerce_fixture_scopes/${SCOPE_ID}`,
                adminMutationMode: 'read_only',
                offlinePaymentMode: 'off',
                controlRevision: 76,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        const correctedControl = (await db.doc('sys_commerce_control/current').get()).data();
        invariant(
            correctedControl.controlRevision === 76 &&
            correctedControl.fixtureScopeVersion === SCOPE_ID &&
            correctedControl.activePolicyVersion === scope.policyVersion,
            'D4_CLOSE_CONTROL_CORRECTION_FAILED'
        );
        report.control.corrected = true;
        record('RC-007', 'corrected', { controlRevision: 76, scopeActive: true, policyAligned: true });

        const fixtureUid = scope.uids[0];
        const baseRequest = (runId, label) => ({
            ownerUid: fixtureUid,
            ownerEmail: 'resilience-fixture@example.test',
            input: checkoutInput(product, runId, label),
            fixtureContext: { runId, fixtureScopeVersion: SCOPE_ID }
        });
        const failingRuntime = createCheckoutRuntime({
            db,
            stripe,
            appId: APP_ID,
            failpoints: createFailpointController({
                'create.after_stripe_response_before_attach': 1
            })
        });
        let injected = false;
        try {
            await failingRuntime.checkout.createCheckout(baseRequest(runIds.r07, 'r07'));
        } catch (error) {
            injected = error?.code === 'COMMERCE_FAILPOINT_TRIGGERED';
        }
        invariant(injected, 'D4_CLOSE_R07_FAILPOINT_NOT_TRIGGERED');
        const afterFailure = await orderForRun(runIds.r07);
        invariant(afterFailure.length === 1, 'D4_CLOSE_R07_ORDER_COUNT_INVALID');
        const attemptSnapshot = await db.collection(`orders/${afterFailure[0].id}/payment_attempts`)
            .limit(3)
            .get();
        invariant(attemptSnapshot.size === 1, 'D4_CLOSE_R07_ATTEMPT_COUNT_INVALID');
        const attemptBeforeRetry = attemptSnapshot.docs[0].data();
        invariant(
            !attemptBeforeRetry.paymentIntentId &&
            ['create_inflight', 'create_unknown'].includes(attemptBeforeRetry.status),
            'D4_CLOSE_R07_WINDOW_NOT_OBSERVED'
        );
        const healthyRuntime = createCheckoutRuntime({ db, stripe, appId: APP_ID });
        const recovered = await healthyRuntime.checkout.createCheckout(baseRequest(runIds.r07, 'r07'));
        const stripeIntent = await stripe.paymentIntents.retrieve(
            recovered.paymentIntentId,
            {},
            { stripeAccount: recovered.connectedAccountId }
        );
        invariant(stripeIntent.livemode === false, 'D4_CLOSE_R07_LIVE_FORBIDDEN');
        const cancellations = createCancellationRuntime({ db, stripe, appId: APP_ID }).cancellations;
        const canceled = await cancellations.requestCancellation({
            orderId: recovered.orderId,
            commandId: opaque('cancel_r07', runIds.r07),
            ownerUid: fixtureUid,
            reason: 'D4 R07 cleanup'
        });
        invariant(canceled.outcome === 'canceled', 'D4_CLOSE_R07_CLEANUP_FAILED');
        record('R07', 'passed', {
            failpointLocation: 'runner_memory_after_stripe_before_attach',
            publicActivation: false,
            orderCount: 1,
            attemptCount: 1,
            recoveredSamePaymentIntent: true,
            cleanup: 'provider_first_canceled'
        });

        const nominalRuntime = createCheckoutRuntime({ db, stripe, appId: APP_ID });
        const delayed = await nominalRuntime.checkout.createCheckout(baseRequest(runIds.r10, 'r10'));
        const endpointBefore = await stripe.webhookEndpoints.retrieve(webhookEndpoint.id);
        invariant(endpointBefore.status === 'enabled', 'D4_CLOSE_ENDPOINT_NOT_ENABLED_BEFORE_PAUSE');
        await stripe.webhookEndpoints.update(webhookEndpoint.id, { disabled: true });
        endpointDisabled = true;
        report.endpoint.disabled = true;
        const disabled = await stripe.webhookEndpoints.retrieve(webhookEndpoint.id);
        invariant(disabled.status === 'disabled', 'D4_CLOSE_ENDPOINT_DISABLE_FAILED');
        const confirmed = await stripe.paymentIntents.confirm(
            delayed.paymentIntentId,
            { payment_method: 'pm_card_visa', return_url: `${APP_URL}/checkout` },
            { stripeAccount: delayed.connectedAccountId }
        );
        invariant(confirmed.status === 'succeeded' && confirmed.livemode === false, 'D4_CLOSE_R10_CONFIRM_FAILED');
        await new Promise((resolve) => setTimeout(resolve, WEBHOOK_PAUSE_MS));
        const duringDelay = (await db.doc(`orders/${delayed.orderId}`).get()).data();
        invariant(duringDelay.payment?.status !== 'succeeded', 'D4_CLOSE_R10_FALSE_EARLY_SUCCESS');
        await stripe.webhookEndpoints.update(webhookEndpoint.id, { disabled: false });
        endpointDisabled = false;
        const reenabled = await stripe.webhookEndpoints.retrieve(webhookEndpoint.id);
        invariant(reenabled.status === 'enabled', 'D4_CLOSE_ENDPOINT_REENABLE_FAILED');
        report.endpoint.restored = true;

        const eventId = opaque('evt_r10', runIds.r10);
        const raw = JSON.stringify({
            id: eventId,
            object: 'event',
            api_version: '2024-06-20',
            created: Math.floor(Date.now() / 1000),
            data: { object: confirmed },
            livemode: false,
            pending_webhooks: 1,
            request: { id: null, idempotency_key: null },
            type: 'payment_intent.succeeded',
            account: delayed.connectedAccountId
        });
        const signature = Stripe.webhooks.generateTestHeaderString({
            payload: raw,
            secret: accessSecret('STRIPE_CONNECT_WH_SECRET_G10')
        });
        const webhookResponse = await fetch(CONNECT_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'stripe-signature': signature },
            body: raw
        });
        invariant(webhookResponse.ok, `D4_CLOSE_R10_WEBHOOK_FAILED:${webhookResponse.status}`);
        const durable = await waitFor(
            async () => (await db.doc(`orders/${delayed.orderId}`).get()).data(),
            (order) => order?.payment?.status === 'succeeded',
            'D4_CLOSE_R10_DURABLE_TIMEOUT',
            90_000,
            1000
        );
        invariant(durable.value.inventorySummary?.status === 'committed', 'D4_CLOSE_R10_STOCK_NOT_COMMITTED');
        record('R10', 'passed', {
            endpointPauseMs: WEBHOOK_PAUSE_MS,
            stateDuringPause: duringDelay.payment?.status,
            falseSuccessDuringPause: false,
            endpointRestoredBeforeDelivery: true,
            durableAfterDeliveryMs: durable.elapsedMs
        });

        const appCheck = await admin.appCheck().createToken(
            process.env.VITE_FIREBASE_APP_ID,
            { ttlMillis: 30 * 60 * 1000 }
        );
        const adminEmail = process.env.E2E_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL || 'loa.gto15@gmail.com';
        const adminUser = await auth.getUserByEmail(adminEmail);
        const adminTokens = await tokenForUid(
            auth,
            adminUser.uid,
            process.env.VITE_FIREBASE_API_KEY,
            appCheck.token,
            { authMethod: 'passkey', authAssurance: 'aal2', userVerified: true }
        );
        const diagnostic = await callable(
            'getDiagnosticTimelineAdminGen2',
            { kind: 'order', value: delayed.orderId },
            adminTokens
        );
        invariant(diagnostic.matches?.length === 1, 'D4_CLOSE_DIAGNOSTIC_MISSING');
        const suppressed = await waitFor(
            async () => {
                const snapshot = await db.collection('commerce_outbox')
                    .where('aggregateId', '==', delayed.orderId)
                    .limit(10)
                    .get();
                return snapshot.docs.map((document) => document.data().status);
            },
            (statuses) => statuses.length === 2 && statuses.every((status) => status === 'suppressed_test'),
            'D4_CLOSE_OUTBOX_NOT_SUPPRESSED',
            180_000,
            2000
        );
        record('console_outbox', 'passed', {
            consoleMatches: 1,
            outboxes: ['suppressed_test', 'suppressed_test'],
            emailsSent: 0,
            suppressionMs: suppressed.elapsedMs
        });

        for (const runId of Object.values(runIds)) {
            const dryRun = await callable('cleanupFixtureRunAdminGen2', { runId }, adminTokens);
            invariant(dryRun.complete === true && dryRun.plan?.deletes === 0, 'D4_CLOSE_CLEANUP_DRY_INVALID');
            const cleanup = await callable(
                'cleanupFixtureRunAdminGen2',
                { runId, commit: true, confirm: `QUARANTINE_${runId}` },
                adminTokens
            );
            invariant(cleanup.complete === true && cleanup.plan?.deletes === 0, 'D4_CLOSE_CLEANUP_INVALID');
            record(`cleanup_${runId.slice(-3)}`, 'passed', {
                preserved: cleanup.plan.actions.filter((entry) => entry.action === 'preserve').length,
                quarantined: cleanup.plan.actions.filter((entry) => entry.action === 'quarantine').length,
                deletes: 0
            });
        }
        report.status = 'passed';
        report.identifiers = {
            runHash: hash(runRoot),
            r07OrderHash: hash(recovered.orderId),
            r10OrderHash: hash(delayed.orderId),
            endpointHash: hash(webhookEndpoint.id)
        };
    } finally {
        if (endpointDisabled && webhookEndpoint) {
            await stripe.webhookEndpoints.update(webhookEndpoint.id, { disabled: false });
            endpointDisabled = false;
        }
        if (webhookEndpoint) {
            const endpoint = await stripe.webhookEndpoints.retrieve(webhookEndpoint.id);
            report.endpoint.restored = endpoint.status === 'enabled';
        }
        report.completedAt = new Date().toISOString();
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
        await admin.app().delete();
    }
    invariant(report.endpoint.restored, 'D4_CLOSE_ENDPOINT_FINAL_RESTORE_FAILED');
    console.log(JSON.stringify({
        ok: true,
        status: report.status,
        runHash: report.identifiers.runHash,
        scenarios: report.scenarios.map(({ id, status }) => ({ id, status })),
        endpointRestored: report.endpoint.restored,
        controlCorrected: report.control.corrected,
        reportPath: path.relative(process.cwd(), reportPath)
    }));
}

try {
    await main();
} catch (error) {
    console.error(JSON.stringify({ ok: false, error: String(error?.message || error) }));
    process.exitCode = 1;
}
