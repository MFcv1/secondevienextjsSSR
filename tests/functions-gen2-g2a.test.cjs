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

    const source = fs.readFileSync(path.join(ROOT, 'functions/src/email/orderEmails.js'), 'utf8');
    const rules = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');
    assert.equal((source.match(/serviceAccount:\s*LEGACY_ORDER_EMAIL_RUNTIME_SERVICE_ACCOUNT/g) || []).length, 2);
    assert.equal((source.match(/concurrency:\s*1/g) || []).length, 2);
    assert.equal((source.match(/maxInstances:\s*1/g) || []).length, 2);
    assert.equal((source.match(/retry:\s*true/g) || []).length, 2);
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
