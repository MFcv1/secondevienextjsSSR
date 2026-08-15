'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { createRequire } = require('node:module');

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
