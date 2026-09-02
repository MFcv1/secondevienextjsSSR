'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
    buildFinanceProjection,
    compareTimestamps,
    diffOrderSummaries,
    mergeActivityProjection,
    planUserStatsEvent,
    summarizeAdminOrder,
    validateOrderPartition
} = require('../functions/src/admin/dashboardProjection');
const {
    applyIncidentSummaryDelta,
    buildIncidentSummaryDelta,
    classifyIncidentCode,
    incidentStateAffectsSummary
} = require('../functions/src/observability/incidentProjection');
const { buildFinancialRollupDelta } = require('../functions/src/commerce/domain/financialRollup');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const timestamp = (seconds, nanoseconds = 0) => ({ seconds, nanoseconds });

test('finance est une projection absolue en centimes avec compteurs de faits explicites', () => {
    const projection = buildFinanceProjection({
        currency: 'EUR', capturedCents: 12000, refundedCents: 2500, netCents: 9500,
        capturedOrderCount: 3, factCount: 5,
    }, { sourceUpdateTime: timestamp(10, 7), updatedAt: timestamp(11), revision: 4 });
    assert.equal(projection.netCents, 9500);
    assert.equal(projection.capturedOrderCount, 3);
    assert.equal(projection.sourceFactCount, 5);
    assert.throws(() => buildFinanceProjection({
        currency: 'EUR', capturedCents: 100, refundedCents: 20, netCents: 100,
        capturedOrderCount: 1, factCount: 2,
    }, { sourceUpdateTime: timestamp(1), updatedAt: timestamp(1), revision: 1 }), /ADMIN_FINANCE_NET_INVALID/);
});

test('capture, refund et reversal exposent des deltas comptables distincts', () => {
    const base = { amountCents: 1000, currency: 'EUR', effectiveAt: '2026-09-01T00:00:00Z' };
    assert.deepEqual(
        ['capture', 'refund', 'refund_reversal'].map((type) => buildFinancialRollupDelta({ ...base, type }))
            .map(({ captureCount, refundCount, refundReversalCount }) => [captureCount, refundCount, refundReversalCount]),
        [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
    );
});

test('orders legacy et v2 forment une partition exhaustive et les deltas se recomposent', () => {
    const statuses = {
        paid: 'paid', shipped: 'shipped', pending: 'pending_payment', cancelled: 'canceled',
    };
    let aggregate = { totalOrders: 0, paidOrders: 0, shippedOrders: 0, pendingOrders: 0, cancelledOrders: 0 };
    let previous = summarizeAdminOrder({ schemaVersion: 2, status: statuses.pending });
    aggregate = Object.fromEntries(Object.keys(aggregate).map((key) => [key, aggregate[key] + previous[key]]));
    for (const status of [statuses.paid, statuses.shipped, statuses.cancelled, statuses.pending]) {
        const next = summarizeAdminOrder({ schemaVersion: status === 'paid' ? 1 : 2, status });
        const delta = diffOrderSummaries(next, previous);
        aggregate = Object.fromEntries(Object.keys(aggregate).map((key) => [key, aggregate[key] + Number(delta[key] || 0)]));
        assert.deepEqual(validateOrderPartition(aggregate), aggregate);
        previous = next;
    }
    assert.throws(() => summarizeAdminOrder({ schemaVersion: 2, status: 'future_status' }), /ADMIN_ORDER_STATUS_UNKNOWN/);
});

test('statut legacy absent et payment_failed gardent la semantique pending auditee', () => {
    const pending = { totalOrders: 1, paidOrders: 0, shippedOrders: 0, pendingOrders: 1, cancelledOrders: 0 };
    assert.deepEqual(summarizeAdminOrder({ schemaVersion: 1 }), pending);
    assert.deepEqual(summarizeAdminOrder({ schemaVersion: 1, status: 'payment_failed' }), pending);
});

test('la precision nanoseconde absorbe les rejeux sans confondre deux commits', () => {
    assert.equal(compareTimestamps(timestamp(10, 1), timestamp(10, 0)), 1);
    assert.equal(compareTimestamps(timestamp(10, 1), timestamp(10, 1)), 0);
    assert.equal(compareTimestamps(timestamp(9, 999999999), timestamp(10, 0)), -1);
});

test('une suppression utilise le temps Eventarc posterieur au dernier updateTime source', () => {
    const orderProjector = read('functions/src/commerce/orderStats.js');
    const incidentProjector = read('functions/src/observability/businessEvents.js');
    assert.match(orderProjector, /deletionEventTimestamp\(event\)/);
    assert.match(orderProjector, /new Date\(value\)/);
    assert.match(incidentProjector, /event\.time \? new Date\(event\.time\)/);
    assert.match(incidentProjector, /tombstoned_no_summary_change/);
    assert.match(read('functions/src/observability/businessEvents.js'), /admin_finance_capture_projections/);
});

test('le ledger utilisateurs absorbe rejeu et desordre avec tombstone', () => {
    const created = planUserStatsEvent({
        currentCount: 4, ledger: null, present: true, sourceEventTime: timestamp(10), eventId: 'create-1',
    });
    assert.deepEqual(created, { outcome: 'apply', registeredUsers: 5, delta: 1 });
    const ledger = { present: true, sourceEventTime: timestamp(10), eventId: 'create-1' };
    assert.equal(planUserStatsEvent({
        currentCount: 5, ledger, present: true, sourceEventTime: timestamp(10), eventId: 'create-1',
    }).outcome, 'noop');
    assert.equal(planUserStatsEvent({
        currentCount: 5, ledger, present: false, sourceEventTime: timestamp(9), eventId: 'delete-old',
    }).outcome, 'noop');
    assert.equal(planUserStatsEvent({
        currentCount: 5, ledger, present: false, sourceEventTime: timestamp(11), eventId: 'delete-1',
    }).registeredUsers, 4);
});

test('activity preserve les revisions independantes users et catalogue', () => {
    const current = {
        users: { registeredUsers: 4, sourceRevision: 2, sourceUpdatedAt: timestamp(2) },
        catalog: { stockValueCents: 5000, sourceRevision: 7, sourceUpdatedAt: timestamp(7) },
    };
    const next = mergeActivityProjection(current, {
        users: { registeredUsers: 5, sourceRevision: 3, sourceUpdatedAt: timestamp(3) },
    }, { updatedAt: timestamp(8), revision: 9 });
    assert.equal(next.users.sourceRevision, 3);
    assert.equal(next.catalog.sourceRevision, 7);
});

test('incidents open/update/close sont idempotents et les codes inconnus fail-closed', () => {
    assert.deepEqual(classifyIncidentCode('refund_orphan'), {
        code: 'refund_orphan', severity: 'critical', category: 'refund', known: true,
    });
    assert.deepEqual(classifyIncidentCode('nouveau_code_non_contractuel'), {
        code: 'nouveau_code_non_contractuel', severity: 'critical', category: 'unknown', known: false,
    });
    const open = { code: 'inventory_conflict', status: 'open' };
    const closed = { ...open, status: 'closed' };
    assert.equal(buildIncidentSummaryDelta(null, open).activeTotal, 1);
    assert.equal(buildIncidentSummaryDelta(open, open).activeTotal, 0);
    assert.equal(buildIncidentSummaryDelta(open, closed).activeTotal, -1);
    assert.equal(incidentStateAffectsSummary(open, { ...open, lastSeenAt: timestamp(20) }), false);
    assert.equal(incidentStateAffectsSummary(null, closed), false);
    assert.equal(incidentStateAffectsSummary(closed, null), false);
    assert.deepEqual(applyIncidentSummaryDelta({ activeCritical: 1, activeWarnings: 0, activeTotal: 1 }, {
        activeCritical: -1, activeWarnings: 0, activeTotal: -1,
    }), { activeCritical: 0, activeWarnings: 0, activeTotal: 0 });
    assert.throws(() => applyIncidentSummaryDelta({ activeCritical: 0, activeWarnings: 0, activeTotal: 0 }, {
        activeCritical: -1, activeWarnings: 0, activeTotal: -1,
    }), /ADMIN_INCIDENT_SUMMARY_INVALID/);
});

test('la table d incidents couvre tous les codes statiques emis par les writers commerce', () => {
    const files = [
        'functions/src/commerce/domain/reconcilePayment.js',
        'functions/src/commerce/domain/paymentEffectApplier.js',
        'functions/src/commerce/domain/refundEffectApplier.js',
        'functions/src/commerce/domain/financialProjection.js',
    ];
    const codes = files.flatMap((file) => [...read(file).matchAll(/code:\s*['"]([^'"]+)['"]/g)]
        .map((match) => match[1]));
    assert.ok(codes.length > 0);
    for (const code of codes) assert.equal(classifyIncidentCode(code).known, true, code);
});

test('le chemin Stats est borne, listener-driven et sans fallback couteux', () => {
    const dashboard = read('src/kit/admin/AdminDashboard.jsx');
    const island = read('app/admin/AdminAppIsland.jsx');
    assert.match(dashboard, /where\(documentId\(\), 'in', CRITICAL_DOCUMENT_IDS\)/);
    assert.match(dashboard, /includeMetadataChanges:\s*true/);
    assert.match(dashboard, /admin-dashboard-backoffice-ready-to-kpi/);
    assert.match(dashboard, /admin-dashboard-strong-auth-to-kpi/);
    assert.match(read('functions/src/observability/businessEvents.js'), /admin_dashboard_projection_completed/);
    assert.doesNotMatch(dashboard, /analytics_sessions|limit\(366\)|loadAdminDashboardCoreData/);
    assert.doesNotMatch(island, /getCommerceOperationsStatusAdmin|preloadAdminCommerceData|preloadAdminInvoicesData/);
    assert.doesNotMatch(dashboard, /Santé commerce/);
});

test('le validateur UI termine le squelette et marque tout document absent indisponible', async () => {
    const { validateCriticalSnapshot, validateInsights } = await import('../src/kit/admin/adminDashboardProjection.js');
    const finance = {
        schemaVersion: 1, currency: 'EUR', capturedCents: 100, refundedCents: 20,
        netCents: 80, capturedOrderCount: 1, sourceFactCount: 2,
        sourceUpdateTime: timestamp(1), updatedAt: timestamp(2), revision: 1,
    };
    const result = validateCriticalSnapshot({
        docs: [{ id: 'finance', data: () => finance }],
        metadata: { fromCache: false },
    });
    assert.equal(result.serverConfirmed, true);
    assert.equal(result.domains.finance.status, 'ready');
    assert.equal(result.domains.orders.status, 'unavailable');
    assert.equal(result.domains.activity.status, 'unavailable');
    const regressive = validateCriticalSnapshot({
        docs: [{ id: 'finance', data: () => finance }], metadata: { fromCache: true },
    }, { finance: 2 });
    assert.equal(regressive.fromCache, true);
    assert.equal(regressive.domains.finance.status, 'unavailable');
    const quoteWindows = Object.fromEntries(['30d', '3m', '6m', '1y'].map((period) => [
        period, { visits: 1, starts: 1, submitted: 0 }
    ]));
    assert.ok(validateInsights({
        schemaVersion: 2,
        windowDays: 30,
        quote: quoteWindows['30d'],
        quoteWindows,
        productsState: 'ready',
        products: [{ id: 'chaise', views: 2, viewers: 1, dailyViews: [0, 2] }],
        coverageThrough: timestamp(2),
        updatedAt: timestamp(2),
        revision: 2
    }));
});

test('la reconciliation est nocturne et ne relit plus 366 jours', () => {
    const operations = read('functions/src/commerce/v2Operations.js');
    const gen2 = read('functions/src/commerce/gen2G9.js');
    const scheduledProjection = operations.match(/async function buildProjectionFromRollups[\s\S]*?\n}\n\nasync function countQuery/)?.[0] || '';
    assert.doesNotMatch(scheduledProjection, /commerce_financial_daily|limit\(366\)/);
    assert.match(operations, /pubsub\.schedule\('17 3 \* \* \*'\)/);
    assert.match(gen2, /schedule:\s*'17 3 \* \* \*'/);
});

test('le watchdog observe seulement les deux trous webhook prouves avec des probes limit(1)', () => {
    const operations = read('functions/src/commerce/v2Operations.js');
    const watchdog = operations.match(/async function runWebhookCoverageWatchdog[\s\S]*?\n}\n\nconst PAID_ORDER_STATUSES/)?.[0] || '';
    assert.match(watchdog, /commerce_webhook_inbox/);
    assert.match(watchdog, /nextAttemptAt/);
    assert.match(watchdog, /processingUntil/);
    assert.equal((watchdog.match(/\.limit\(1\)/g) || []).length, 2);
    assert.doesNotMatch(watchdog, /commerce_outbox|inventory_reservations|payment_links/);
    assert.match(read('functions/src/commerce/gen2G9.js'), /schedule:\s*'every 15 minutes'/);
});
