'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { createRequire } = require('node:module');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const requireFromFunctions = createRequire(path.join(ROOT, 'functions/package.json'));
const admin = requireFromFunctions('firebase-admin');

if (!admin.apps.length) admin.initializeApp({ projectId: 'demo-functions-gen2-g2a' });

const {
    buildProjectionPlan,
    correlationId,
    requiresProjectionBaseline,
    summarizeOrder
} = require('../functions/src/commerce/orderStats');
const {
    claimDeliveryState,
    deliveryIdFor,
    failureState
} = require('../functions/src/email/legacyOrderEmailDelivery');
const { enqueueMediaCandidates } = require('../functions/src/catalog/mediaGarbageCollection');
const {
    mutationKeyFor,
    timestampKey
} = require('../functions/src/catalog/onCatalogSourceWrite');
const {
    reconcileCatalogWithStateRetry
} = require('../functions/src/catalog/catalogReconciler');

function order(overrides = {}) {
    return {
        schemaVersion: 1,
        status: 'pending',
        total: 125,
        createdAt: '2026-08-15T12:00:00.000Z',
        ...overrides
    };
}

test('G2-A stats: creation, replay et transition produisent des deltas deterministes', () => {
    const pending = summarizeOrder(order());
    const created = buildProjectionPlan({ currentOrder: order(), previousProjection: null });
    assert.deepEqual(created.dashboardDelta, {
        totalRevenue: 125,
        totalOrders: 1,
        pendingOrders: 1
    });
    assert.equal(created.dailyDeltas.length, 1);

    const replay = buildProjectionPlan({
        currentOrder: order(),
        previousProjection: { dateKey: created.nextProjection.dateKey, summary: pending }
    });
    assert.deepEqual(replay.dashboardDelta, {});
    assert.deepEqual(replay.dailyDeltas, []);

    const paid = buildProjectionPlan({
        currentOrder: order({ status: 'paid' }),
        previousProjection: { dateKey: created.nextProjection.dateKey, summary: pending }
    });
    assert.deepEqual(paid.dashboardDelta, { paidOrders: 1, pendingOrders: -1 });
});

test('G2-A stats: une commande legacy historique sans ledger echoue avant increment', () => {
    assert.equal(requiresProjectionBaseline({
        currentOrder: order({ status: 'paid' }),
        eventBefore: order({ status: 'pending' }),
        previousProjection: null
    }), true);
    assert.equal(requiresProjectionBaseline({
        currentOrder: order({ status: 'paid' }),
        eventBefore: null,
        previousProjection: null
    }), false);
    assert.equal(requiresProjectionBaseline({
        currentOrder: order({ status: 'paid' }),
        eventBefore: order({ status: 'pending' }),
        previousProjection: { dateKey: '2026-08-15', summary: summarizeOrder(order()) }
    }), false);
    assert.equal(requiresProjectionBaseline({
        currentOrder: order({ schemaVersion: 2 }),
        eventBefore: order({ schemaVersion: 2 }),
        previousProjection: null
    }), false);
});

test('G2-A stats: changement de jour, suppression et passage v2 retirent une seule projection', () => {
    const previous = {
        dateKey: '2026-08-14',
        summary: summarizeOrder(order({ status: 'paid' }))
    };
    const moved = buildProjectionPlan({
        currentOrder: order({ status: 'paid', createdAt: '2026-08-15T12:00:00.000Z' }),
        previousProjection: previous
    });
    assert.equal(moved.dailyDeltas.length, 2);
    assert.deepEqual(moved.dashboardDelta, {});
    assert.deepEqual(moved.dailyDeltas[0].delta, {
        totalRevenue: -125,
        totalOrders: -1,
        paidOrders: -1
    });

    for (const currentOrder of [null, order({ schemaVersion: 2 })]) {
        const removed = buildProjectionPlan({ currentOrder, previousProjection: previous });
        assert.equal(removed.nextProjection, null);
        assert.deepEqual(removed.dashboardDelta, {
            totalRevenue: -125,
            totalOrders: -1,
            paidOrders: -1
        });
    }
    assert.deepEqual(
        buildProjectionPlan({ currentOrder: order({ schemaVersion: 2 }), previousProjection: null }),
        { dashboardDelta: {}, dailyDeltas: [], nextProjection: null }
    );
});

test('G2-A stats: runtime, identite, retry et journal sont explicites sans event.id comme dedup', () => {
    const source = fs.readFileSync(
        path.join(ROOT, 'functions/src/commerce/orderStats.js'),
        'utf8'
    );
    for (const expected of [
        /cpu:\s*1/,
        /concurrency:\s*1/,
        /minInstances:\s*0/,
        /maxInstances:\s*1/,
        /memory:\s*'256MiB'/,
        /timeoutSeconds:\s*60/,
        /retry:\s*true/,
        /serviceAccount:\s*ORDER_STATS_RUNTIME_SERVICE_ACCOUNT/,
        /order-stats-projector@secondevienextjsssr\.iam\.gserviceaccount\.com/,
        /order_stats_projections\/\$\{orderId\}/,
        /transaction\.get\(orderRef\)/,
        /transaction\.get\(projectionRef\)/,
        /ORDER_STATS_PROJECTION_BASELINE_MISSING/,
        /order_stats_projection_completed/,
        /generation:\s*'gen2'/,
        /revision:\s*process\.env\.K_REVISION/
    ]) assert.match(source, expected);
    assert.doesNotMatch(source, /appspot\.gserviceaccount\.com|231220287936-compute/);
    assert.notEqual(correlationId('event-a'), 'event-a');
    assert.equal(correlationId('event-a'), correlationId('event-a'));
});

test('G2-A stats: le plan cloud reste read-only et le ledger est interdit aux clients', () => {
    const planner = fs.readFileSync(
        path.join(ROOT, 'scripts/plan-functions-gen2-g2a-stats.mjs'),
        'utf8'
    );
    const rules = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');
    assert.match(planner, /G2A_STATS_READ_ONLY_ONLY/);
    assert.match(planner, /deploymentAllowed:\s*false/);
    assert.match(planner, /G2_A_STATS_BOOTSTRAP_REQUIRED/);
    assert.doesNotMatch(planner, /runTransaction|writeBatch|\.batch\(\)/);
    assert.match(rules, /match \/order_stats_projections\/\{orderId\}/);
    assert.match(rules, /allow read, write: if false/);
});

test('G2-B stats: le bootstrap est borne, transactionnel et fail-closed', () => {
    const bootstrap = fs.readFileSync(
        path.join(ROOT, 'scripts/bootstrap-functions-gen2-g2b-stats.mjs'),
        'utf8'
    );
    for (const expected of [
        /EXPECTED_LEGACY_ORDERS\s*=\s*26/,
        /G2B_SEED_26_ORDER_STATS_LEDGERS/,
        /G2B_STATS_PROJECT_REQUIRED/,
        /G2B_STATS_COMMIT_MISMATCH/,
        /G2B_STATS_MANIFEST_DIGEST_MISMATCH/,
        /G2B_STATS_SOURCE_PRECONDITION_DRIFT/,
        /G2B_STATS_LEDGER_ALREADY_EXISTS/,
        /db\.runTransaction/,
        /transaction\.create\(db\.doc\(`order_stats_projections\/\$\{document\.id\}`\)/,
        /maxAttempts:\s*1/,
        /snapshot\.updateTime\.nanoseconds/,
        /collectionsWritten:\s*apply\s*\?\s*\['order_stats_projections'\]\s*:\s*\[\]/
    ]) assert.match(bootstrap, expected);
    assert.doesNotMatch(bootstrap, /transaction\.(?:set|update|delete)\(/);
    assert.doesNotMatch(bootstrap, /db\.doc\(`(?:orders|dashboard_stats|sales_stats_daily)\//);
});

test('G2-B stats: le bootstrap refuse projet et approbation incorrects avant credentials', () => {
    const script = path.join(ROOT, 'scripts/bootstrap-functions-gen2-g2b-stats.mjs');
    const base = [
        script,
        '--project=wrong-project',
        '--env=sandbox',
        `--commit=${'0'.repeat(40)}`,
        '--manifest=apphostingaudit/manifests/functions-gen2-g2a-stats.json',
        `--manifest-sha256=${'0'.repeat(64)}`,
        '--actor=test@example.invalid'
    ];
    const wrongProject = spawnSync(process.execPath, base, {
        cwd: ROOT,
        encoding: 'utf8',
        env: { ...process.env, FIREBASE_SERVICE_ACCOUNT_JSON: '' }
    });
    assert.notEqual(wrongProject.status, 0);
    assert.match(wrongProject.stderr, /G2B_STATS_PROJECT_REQUIRED/);

    const wrongApproval = spawnSync(process.execPath, [
        script,
        '--project=secondevienextjsssr',
        '--env=sandbox',
        `--commit=${spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim()}`,
        '--manifest=apphostingaudit/manifests/functions-gen2-g2a-stats.json',
        `--manifest-sha256=${'0'.repeat(64)}`,
        '--actor=test@example.invalid',
        '--apply=true',
        '--approval=WRONG'
    ], {
        cwd: ROOT,
        encoding: 'utf8',
        env: { ...process.env, FIREBASE_SERVICE_ACCOUNT_JSON: '' }
    });
    assert.notEqual(wrongApproval.status, 0);
    assert.match(wrongApproval.stderr, /G2B_STATS_APPLY_APPROVAL_REQUIRED/);
});

test('G2-B stats: IAM dediee sans cle, compte par defaut ni invoker public', () => {
    const iam = fs.readFileSync(
        path.join(ROOT, 'scripts/configure-functions-gen2-g2b-stats-iam.mjs'),
        'utf8'
    );
    for (const expected of [
        /G2B_CONFIGURE_STATS_IAM/,
        /order-stats-projector@/,
        /functions-gen2-builder@/,
        /functions-eventarc-invoker@/,
        /roles\/datastore\.user/,
        /roles\/logging\.logWriter/,
        /roles\/serviceusage\.serviceUsageConsumer/,
        /roles\/artifactregistry\.writer/,
        /roles\/storage\.objectViewer/,
        /roles\/eventarc\.eventReceiver/,
        /roles\/run\.invoker/,
        /roles\/iam\.serviceAccountUser/,
        /userManaged:\s*keys\.filter/,
        /projectWideRunInvoker:\s*false/,
        /publicInvoker:\s*false/
    ]) assert.match(iam, expected);
    assert.doesNotMatch(iam, /roles\/(?:editor|owner|storage\.admin)/i);
    assert.doesNotMatch(iam, /service-accounts keys create/);
    assert.doesNotMatch(iam, /allUsers|allAuthenticatedUsers/);
});

test('G2-A catalogue: les trois cibles a IAM deja dedie ont des limites source completes', () => {
    for (const relativePath of [
        'functions/src/catalog/onCatalogSourceWrite.js',
        'functions/src/catalog/catalogReconciler.js',
        'functions/src/catalog/mediaGarbageCollection.js'
    ]) {
        const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
        for (const expected of [
            /cpu:\s*1/,
            /concurrency:\s*1/,
            /minInstances:\s*0/,
            /maxInstances:\s*1/,
            /timeoutSeconds:\s*\d+/,
            /memory:\s*['"]\d+(?:MiB|GiB)['"]/
        ]) assert.match(source, expected, relativePath);
        assert.match(source, /serviceAccount:\s*CATALOG_(?:ENQUEUER|BUILDER)_SERVICE_ACCOUNT/);
    }
    assert.match(
        fs.readFileSync(path.join(ROOT, 'functions/src/catalog/onCatalogSourceWrite.js'), 'utf8'),
        /retry:\s*true/
    );
    for (const relativePath of [
        'functions/src/catalog/catalogReconciler.js',
        'functions/src/catalog/mediaGarbageCollection.js'
    ]) {
        assert.match(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'), /retryCount:\s*0/);
    }
});

test('G2-B scheduler catalogue: runtime de reprise et conflits de version sont explicites et bornes', async () => {
    const source = fs.readFileSync(path.join(ROOT, 'functions/src/catalog/catalogReconciler.js'), 'utf8');
    for (const expected of [
        /serviceAccount:\s*CATALOG_BUILDER_SERVICE_ACCOUNT/,
        /timeoutSeconds:\s*540/,
        /memory:\s*['"]512MiB['"]/,
        /retryCount:\s*0/,
        /MAX_STATE_ADVANCE_ATTEMPTS\s*=\s*3/,
        /error\?\.code\s*!==\s*'RECONCILE_STATE_ADVANCED'/
    ]) assert.match(source, expected);

    let attempts = 0;
    const logs = [];
    const result = await reconcileCatalogWithStateRetry({
        logger: (severity, entry) => logs.push({ severity, ...entry })
    }, {
        reconcile: async () => {
            attempts += 1;
            if (attempts < 3) {
                const error = new Error('RECONCILE_STATE_ADVANCED');
                error.code = 'RECONCILE_STATE_ADVANCED';
                throw error;
            }
            return { result: 'healthy' };
        }
    });
    assert.deepEqual(result, { result: 'healthy' });
    assert.equal(attempts, 3);
    assert.equal(logs.length, 2);

    await assert.rejects(() => reconcileCatalogWithStateRetry({}, {
        reconcile: async () => {
            const error = new Error('CATALOG_POINTER_INVALID');
            error.code = 'CATALOG_POINTER_INVALID';
            throw error;
        }
    }), /CATALOG_POINTER_INVALID/);
});

test('G2-B scheduler catalogue: preflight et IAM restent fail-closed et sans suppression', () => {
    const planner = fs.readFileSync(
        path.join(ROOT, 'scripts/plan-functions-gen2-g2b-catalog-reconciler.mjs'),
        'utf8'
    );
    const iam = fs.readFileSync(
        path.join(ROOT, 'scripts/configure-functions-gen2-g2b-catalog-reconciler-iam.mjs'),
        'utf8'
    );
    for (const expected of [
        /G2B_CATALOG_RECONCILER_READ_ONLY_ONLY/,
        /G2B_CATALOG_RECONCILER_CREDENTIAL_PROJECT_MISMATCH/,
        /catalogreconciler-00009-luf/,
        /SCHEDULER_OIDC_DRIFT/,
        /CATALOG_POINTER_UNHEALTHY/,
        /deploymentAllowed:\s*false/
    ]) assert.match(planner, expected);
    assert.doesNotMatch(planner, /runTransaction|\.set\(|\.update\(|\.delete\(/);
    for (const expected of [
        /G2B_CONFIGURE_CATALOG_RECONCILER_IAM/,
        /G2B_CATALOG_RECONCILER_IAM_COMMIT_MISMATCH/,
        /roles\/serviceusage\.serviceUsageConsumer/,
        /roles\/storage\.objectAdmin/,
        /roles\/run\.invoker/,
        /publicInvoker/,
        /noUserManagedKeys/
    ]) assert.match(iam, expected);
    assert.doesNotMatch(iam, /remove-iam-policy-binding|service-accounts keys create|roles\/(?:editor|owner)/i);
});

test('G2-B catalogue: la deduplication de mutation ne depend plus de event.id', () => {
    const input = {
        appId: 'secondevie',
        productId: 'product-a',
        mutationVersion: '1786884000:123456789'
    };
    assert.equal(mutationKeyFor(input), mutationKeyFor(input));
    assert.notEqual(mutationKeyFor(input), mutationKeyFor({ ...input, productId: 'product-b' }));
    assert.notEqual(mutationKeyFor(input), mutationKeyFor({ ...input, mutationVersion: '1786884001:0' }));
    assert.throws(
        () => mutationKeyFor({ ...input, mutationVersion: null }),
        /CATALOG_MUTATION_VERSION_REQUIRED/
    );
    assert.equal(timestampKey({ seconds: 1786884000, nanoseconds: 123456789 }), input.mutationVersion);
    assert.equal(timestampKey({ toMillis: () => 1786884000123 }), '1786884000:123000000');
    const recorder = fs.readFileSync(
        path.join(ROOT, 'functions/src/catalog/catalogMutationRecorder.js'),
        'utf8'
    );
    assert.match(recorder, /sys_catalog_publication_events\/\$\{mutationHash\}/);
    assert.doesNotMatch(recorder, /sys_catalog_publication_events\/\$\{eventHash\}/);
});

test('G2-B catalogue: le preflight cloud est strictement read-only et fail-closed', () => {
    const planner = fs.readFileSync(
        path.join(ROOT, 'scripts/plan-functions-gen2-g2b-catalog.mjs'),
        'utf8'
    );
    for (const expected of [
        /G2B_CATALOG_READ_ONLY_ONLY/,
        /HOLD_G2B_CATALOG_PREFLIGHT/,
        /G2B_CATALOG_PREFLIGHT_READY/,
        /CATALOG_CONTROL_DIRTY/,
        /CATALOG_LEASE_ACTIVE/,
        /CATALOG_LAST_ERROR_PRESENT/,
        /deploymentAllowed:\s*false/,
        /functions-eventarc-invoker@/,
        /functions-gen2-builder@/
    ]) assert.match(planner, expected);
    assert.doesNotMatch(planner, /runTransaction|writeBatch|transaction\.(?:set|update|delete)|document\.(?:set|update|delete)/);
});

test('G2-B catalogue: IAM ajoute seulement les droits manquants et conserve le rollback', () => {
    const iam = fs.readFileSync(
        path.join(ROOT, 'scripts/configure-functions-gen2-g2b-catalog-iam.mjs'),
        'utf8'
    );
    for (const expected of [
        /G2B_CONFIGURE_CATALOG_IAM/,
        /roles\/serviceusage\.serviceUsageConsumer/,
        /roles\/iam\.serviceAccountUser/,
        /roles\/run\.invoker/,
        /rollbackRuntimeInvokerRetained/,
        /noUserManagedKeys/,
        /publicInvoker:\s*false/
    ]) assert.match(iam, expected);
    assert.doesNotMatch(iam, /remove-iam-policy-binding|roles\/(?:editor|owner|storage\.admin)/i);
    assert.doesNotMatch(iam, /service-accounts keys create/);
});

test('G2-A publication: worker image rejette les pannes retryables et les trois runtimes sont bornes', () => {
    const source = fs.readFileSync(
        path.join(ROOT, 'functions/src/publication/productPublication.js'),
        'utf8'
    );
    assert.match(
        source,
        /product-publication-worker@secondevienextjsssr\.iam\.gserviceaccount\.com/
    );
    assert.equal((source.match(/serviceAccount:\s*PRODUCT_PUBLICATION_RUNTIME_SERVICE_ACCOUNT/g) || []).length, 3);
    assert.equal((source.match(/retryCount:\s*0/g) || []).length, 2);
    assert.match(source, /concurrency:\s*4,[\s\S]*maxInstances:\s*4,[\s\S]*retry:\s*true/);
    assert.match(source, /product_publication_image_failed[\s\S]*throw error;/);
    assert.match(
        source,
        /processingDecision === 'finalize'[\s\S]*product_publication_finalize_retry_required[\s\S]*return;/
    );
    assert.equal((source.match(/product_publication_finalize_retry_required/g) || []).length, 2);
    assert.doesNotMatch(source, /231220287936-compute|appspot\.gserviceaccount\.com/);
});

test('G2-A e-mail: le claim deterministe deduplique et borne les retries provider', () => {
    const input = {
        orderId: 'order-sensitive-id',
        kind: 'order-created-client',
        provider: 'resend',
        leaseToken: 'lease-token-a',
        now: new Date('2026-08-16T00:00:00.000Z'),
        nowMillis: Date.parse('2026-08-16T00:00:00.000Z'),
        leaseMs: 60_000,
        maxAttempts: 2
    };
    const claimed = claimDeliveryState(null, input);
    assert.equal(claimed.action, 'send');
    assert.equal(claimed.state.attemptCount, 1);
    assert.equal(claimed.state.orderIdHash.length, 64);
    assert.equal(JSON.stringify(claimed.state).includes(input.orderId), false);
    assert.equal(claimDeliveryState(claimed.state, { ...input, leaseToken: 'lease-token-b' }).action, 'skip');

    const failed = failureState(claimed.state, {
        error: { code: 'RESEND_TIMEOUT', retryable: true },
        now: input.now,
        nowMillis: input.nowMillis,
        maxAttempts: 2
    });
    assert.equal(failed.status, 'failed');
    const retried = claimDeliveryState(failed, {
        ...input,
        leaseToken: 'lease-token-b',
        nowMillis: failed.nextAttemptAt
    });
    assert.equal(retried.action, 'send');
    assert.equal(retried.state.attemptCount, 2);
    assert.equal(failureState(retried.state, {
        error: { code: 'RESEND_TIMEOUT', retryable: true },
        now: input.now,
        nowMillis: failed.nextAttemptAt,
        maxAttempts: 2
    }).status, 'dead_letter');
    assert.equal(deliveryIdFor(input.orderId, input.kind), deliveryIdFor(input.orderId, input.kind));
});

test('G2-A e-mail: Gmail ambigu devient delivery_unknown et les deux runtimes sont plafonnes', () => {
    const gmailFailure = failureState({
        provider: 'gmail',
        status: 'processing',
        attemptCount: 1,
        leaseToken: 'lease-token-a',
        processingUntil: 10_000
    }, {
        error: { code: 'ETIMEDOUT', retryable: true },
        now: new Date(0),
        nowMillis: 0
    });
    assert.equal(gmailFailure.status, 'delivery_unknown');
    const gmailLeaseExpired = claimDeliveryState({
        provider: 'gmail',
        status: 'processing',
        attemptCount: 1,
        leaseToken: 'lease-token-a',
        processingUntil: 10_000
    }, {
        orderId: 'order-sensitive-id',
        kind: 'order-created-client',
        provider: 'gmail',
        leaseToken: 'lease-token-b',
        now: new Date(20_000),
        nowMillis: 20_000,
        retentionMs: 90_000
    });
    assert.equal(gmailLeaseExpired.action, 'skip');
    assert.equal(gmailLeaseExpired.state.status, 'delivery_unknown');
    assert.equal(gmailLeaseExpired.state.processingUntil, null);
    assert.equal(gmailLeaseExpired.state.purgeAt.getTime(), 110_000);

    const source = fs.readFileSync(path.join(ROOT, 'functions/src/email/orderEmails.js'), 'utf8');
    const rules = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');
    const legacyTriggerRuntimes = [
        source.match(/exports\.onOrderCreated = onDocumentCreated\(\s*\{([\s\S]*?)\}\s*,\s*async/),
        source.match(/exports\.onOrderUpdated = onDocumentUpdated\(\s*\{([\s\S]*?)\}\s*,\s*async/)
    ].map((match) => match?.[1] || '');
    assert.equal((source.match(/serviceAccount:\s*LEGACY_ORDER_EMAIL_RUNTIME_SERVICE_ACCOUNT/g) || []).length, 2);
    assert.equal(legacyTriggerRuntimes.length, 2);
    for (const runtime of legacyTriggerRuntimes) {
        assert.match(runtime, /concurrency:\s*1/);
        assert.match(runtime, /maxInstances:\s*1/);
        assert.match(runtime, /retry:\s*true/);
    }
    assert.match(source, /legacy-order-email-worker@secondevienextjsssr\.iam\.gserviceaccount\.com/);
    assert.match(source, /createLegacyOrderEmailDelivery/);
    assert.doesNotMatch(source, /TRIGGERED! ID|commande \$\{orderId\}/);
    assert.match(rules, /match \/legacy_order_email_deliveries\/\{deliveryId\}/);
});

test('G2-A Tasks: runtime et deadlines sont alignes a 300 s apres mesure p99', () => {
    const build = fs.readFileSync(path.join(ROOT, 'functions/src/catalog/buildCatalogSnapshot.js'), 'utf8');
    const revalidation = fs.readFileSync(path.join(ROOT, 'functions/src/catalog/catalogRevalidation.js'), 'utf8');
    for (const source of [build, revalidation]) {
        for (const expected of [
            /cpu:\s*1/,
            /concurrency:\s*1/,
            /minInstances:\s*0/,
            /maxInstances:\s*1/,
            /timeoutSeconds:\s*300/,
            /maxConcurrentDispatches:\s*1/
        ]) assert.match(source, expected);
    }
    const catalogSources = [
        'functions/src/catalog/buildCatalogSnapshot.js',
        'functions/src/catalog/onCatalogSourceWrite.js',
        'functions/src/catalog/catalogMaintenance.js',
        'functions/src/catalog/catalogReconciler.js'
    ].map((relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8')).join('\n');
    assert.equal((catalogSources.match(/dispatchDeadlineSeconds:\s*300/g) || []).length, 6);
    assert.doesNotMatch(catalogSources, /dispatchDeadlineSeconds:\s*1800/);
    assert.match(revalidation, /retryConfig:\s*\{\s*maxAttempts:\s*1/);
    assert.match(build, /catalogRevalidationTaskId\(identity,\s*0\)/);
    assert.doesNotMatch(
        fs.readFileSync(path.join(ROOT, 'functions/src/catalog/catalogReconciler.js'), 'utf8'),
        /catalog-reconcile-revalidate[^\n]*timeBucket/
    );
});

test('G2-A artefacts: la quarantaine media est idempotente par chemin et generation', async () => {
    const documents = new Map();
    const db = {
        doc: (documentPath) => ({ path: documentPath }),
        runTransaction: async (run) => run({
            get: async (reference) => ({
                exists: documents.has(reference.path),
                data: () => documents.get(reference.path)
            }),
            set: (reference, value) => documents.set(reference.path, value)
        })
    };
    const bucket = {
        file: () => ({ getMetadata: async () => [{ generation: '42' }] })
    };
    const input = { paths: ['furniture/item/image.webp'], reason: 'product_update', productId: 'item' };
    const now = () => new Date('2026-08-16T00:00:00.000Z');
    assert.deepEqual(await enqueueMediaCandidates({ db, bucket, now }, input), { queued: 1 });
    assert.deepEqual(await enqueueMediaCandidates({ db, bucket, now }, input), { queued: 0 });
    assert.equal(documents.size, 1);
});

test('G2-A artefacts: les deux triggers sont bornes et ne suppriment plus les sous-collections', () => {
    for (const relativePath of [
        'functions/src/triggers/onArtifactUpdated.js',
        'functions/src/triggers/onArtifactDeleted.js'
    ]) {
        const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
        for (const expected of [
            /catalog-media-enqueuer@secondevienextjsssr\.iam\.gserviceaccount\.com/,
            /cpu:\s*1/,
            /concurrency:\s*1/,
            /minInstances:\s*0/,
            /maxInstances:\s*1/,
            /memory:\s*'256MiB'/,
            /timeoutSeconds:\s*300/,
            /retry:\s*true/
        ]) assert.match(source, expected, relativePath);
        assert.doesNotMatch(source, /appspot\.gserviceaccount\.com|231220287936-compute/);
    }
    const deleted = fs.readFileSync(path.join(ROOT, 'functions/src/triggers/onArtifactDeleted.js'), 'utf8');
    assert.doesNotMatch(deleted, /batch\.delete|deleteSubCollection|\.delete\(/);
});

test('le modele social legacy est absent de tout code Functions executable', () => {
    const sourceRoot = path.join(ROOT, 'functions/src');
    const files = fs.readdirSync(sourceRoot, { recursive: true })
        .filter((entry) => typeof entry === 'string' && entry.endsWith('.js'));
    const executableSource = files
        .map((entry) => fs.readFileSync(path.join(sourceRoot, entry), 'utf8'))
        .join('\n');
    assert.doesNotMatch(executableSource, /\b(?:likes|comments|likeCount|shareCount)\b/);
});

test('G2-B publication cleanup: la suppression exige la version Firestore observee', () => {
    const source = fs.readFileSync(path.join(ROOT, 'functions/src/publication/productPublication.js'), 'utf8');
    assert.match(source, /sessionSnapshot\.ref\.delete\(\{\s*lastUpdateTime:\s*sessionSnapshot\.updateTime\s*\}\)/);
    assert.match(source, /product_publication_cleanup_concurrent_update/);
});

test('G2-B publication reconciler: le marquage stalled relit le statut en transaction', () => {
    const source = fs.readFileSync(path.join(ROOT, 'functions/src/publication/productPublication.js'), 'utf8');
    assert.match(source, /const marked = await db\.runTransaction\(async \(transaction\) =>/);
    assert.match(source, /!\['uploading', 'processing'\]\.includes\(session\?\.status\)/);
    assert.doesNotMatch(source, /await snapshot\.ref\.set\(\{\s*clientState: 'attention_required'/);
});

test('G2-B GC catalogue: aucune suppression planifiee sans kill-switch explicite', () => {
    const source = fs.readFileSync(path.join(ROOT, 'functions/src/catalog/mediaGarbageCollection.js'), 'utf8');
    const logSource = fs.readFileSync(path.join(ROOT, 'functions/src/catalog/structuredLog.js'), 'utf8');
    assert.match(source, /destructiveCommit\s*=\s*CATALOG_MEDIA_GC_COMMIT\s*===\s*'true'/);
    assert.equal((source.match(/commit:\s*destructiveCommit/g) || []).length, 2);
    assert.doesNotMatch(source, /runReleaseGarbageCollection\([^\n]+\{\s*commit:\s*true\s*\}/);
    for (const field of ['candidateReleases', 'deletedReleases', 'deletedObjects', 'mediaResult', 'releaseResult']) {
        assert.match(logSource, new RegExp(`['"]${field}['"]`));
    }
});

test('G2-A manifeste: exactement treize Gen2 et aucun deploy autorise', () => {
    const manifest = JSON.parse(fs.readFileSync(
        path.join(ROOT, 'apphostingaudit/manifests/functions-gen2-g2a-plan.json'),
        'utf8'
    ));
    assert.equal(manifest.project, 'secondevienextjsssr');
    assert.equal(manifest.targetCount, 13);
    assert.equal(new Set(manifest.targets.map(({ name }) => name)).size, 13);
    assert.equal(manifest.deploymentAllowed, false);
    assert.match(manifest.verdict, /BLOCKED_ON_DATA_IAM_TTL/);
    assert.equal(manifest.targets.some(({ name }) => [
        'grantAdminOnAuth',
        'onRegisteredUserCreated',
        'onRegisteredUserDeleted',
        'startInstagramOAuthAdmin'
    ].includes(name)), false);
    for (const target of manifest.targets) {
        assert.equal(target.runtime.runtimeServiceAccount.includes('appspot.gserviceaccount.com'), false);
        assert.equal(target.runtime.runtimeServiceAccount.includes('231220287936-compute'), false);
        assert.match(target.rollback, /Redeploy .* only/);
    }
});

test('G2-A manifeste: le planificateur refuse mauvais projet et mode apply', () => {
    const script = path.join(ROOT, 'scripts/plan-functions-gen2-g2a.mjs');
    for (const argumentsList of [
        ['--project=vibefx-v2', '--env=sandbox'],
        ['--project=secondevienextjsssr', '--env=sandbox', '--apply=true']
    ]) {
        const result = spawnSync(process.execPath, [script, ...argumentsList], {
            cwd: ROOT,
            encoding: 'utf8'
        });
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /G2A_PLAN_(?:PROJECT_REQUIRED|READ_ONLY_LOCAL_ONLY)/);
    }
});
