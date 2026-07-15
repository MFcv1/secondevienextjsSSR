import test from 'node:test';
import assert from 'node:assert/strict';
import { buildJourney, buildOverview, classifyAnalyticsCallableError, formatDuration, getOverviewState } from '../src/kit/admin/data-studio/model.js';
import { PREVIEW_SESSIONS, getDataStudioPreview } from '../src/kit/admin/data-studio/previewData.js';

test('overview keeps estimated, observed and server facts distinct', () => {
    const model = buildOverview({
        sessions: 4, pageViews: 10, activeDurationMs: 40_000, uniqueVisitorsApprox: 3,
        detailedCoverage: 0.25, provisional: true, sourceDocuments: 2,
        pages: { quote: 2, product: 5 }, actions: { quote_start: 1, quote_email_intent: 1 },
        business: { order_created_server: 1, payment_paid_server: 1, refund_server: 0 },
        timeline: [{ key: '2026-07-15', sessions: 4, quoteViews: 2 }],
    }, '7d');

    assert.equal(model.kpis[0].value, '≈ 3');
    assert.equal(model.kpis[1].tone, 'observed');
    assert.equal(model.kpis[3].tone, 'server');
    assert.equal(model.pulse.pagesPerSession, 2.5);
    assert.equal(model.commerce[1].value, 1);
    assert.equal(model.timeline[0].quoteViews, 2);
});

test('overview does not invent visitors or product metrics', () => {
    const model = buildOverview({ sessions: 1, pageViews: 1, products: null });
    assert.equal(model.kpis[0].value, '—');
    assert.deepEqual(model.products, []);
});

test('catalog images remain visible without invented product ranking', () => {
    const model = buildOverview({ sessions: 1 }, '7d', [{ id: 'p1', name: 'Commode', images: ['/commode.webp'] }]);
    assert.equal(model.products[0].name, 'Commode');
    assert.equal(model.products[0].image, '/commode.webp');
    assert.equal(model.products[0].metricsAvailable, false);
});

test('a product metric never inherits an unrelated catalogue image by position', () => {
    const model = buildOverview({ sessions: 2, products: [{ id: 'missing-product', views: 4 }] }, '7d', [{ id: 'p1', name: 'Commode', images: ['/commode.webp'] }]);
    assert.equal(model.products[0].name, 'Pièce suivie');
    assert.equal(model.products[0].image, '');
    assert.equal(model.products[0].views, 4);
});

test('overview states distinguish connection, an accessible empty engine, measured zero and partial data', () => {
    assert.equal(getOverviewState(null, { loading: true }), 'connecting');
    assert.equal(getOverviewState(null, { error: { kind: 'unavailable' } }), 'error');
    assert.equal(getOverviewState({ sourceDocuments: 0, sessions: 0 }), 'empty-engine');
    assert.equal(getOverviewState({ sourceDocuments: 2, sessions: 0, pageViews: 0, events: 0, business: {} }), 'measured-zero');
    assert.equal(getOverviewState({ sourceDocuments: 2, sessions: 1, provisional: true }), 'partial');
    assert.equal(getOverviewState({ sourceDocuments: 2, sessions: 1, expectedDocuments: 2 }), 'available');
});

test('callable errors keep their real operational meaning', () => {
    assert.equal(classifyAnalyticsCallableError({ code: 'functions/permission-denied' }).kind, 'permission-denied');
    assert.equal(classifyAnalyticsCallableError({ code: 'functions/unauthenticated' }).kind, 'unauthenticated');
    assert.equal(classifyAnalyticsCallableError({ code: 'functions/failed-precondition', message: 'Session admin trop ancienne. Reconnectez-vous.' }).kind, 'reauthentication-required');
    assert.equal(classifyAnalyticsCallableError({ code: 'functions/failed-precondition', message: 'App Check token rejected' }).kind, 'app-check');
    assert.equal(classifyAnalyticsCallableError({ code: 'functions/unavailable' }).kind, 'unavailable');
});

test('the live activity contract stays visibly provisional and contains no visitor identifier', () => {
    const live = { schemaVersion: 3, activeSessions: 1, provisionalPageViews: 2, provisionalEvents: 3, sessions: [{ routeKey: 'product', eventName: 'product_view', lastReceivedAt: Date.now() }] };
    assert.equal(live.activeSessions, 1);
    assert.equal(live.sessions[0].routeKey, 'product');
    assert.equal('id' in live.sessions[0], false);
    assert.equal('visitorLabel' in live.sessions[0], false);
});

test('journey model builds a bounded exact route atlas', () => {
    const model = buildJourney({ transitions: { home__product: 3, product__quote: 2, home__quote: 1 } });
    assert.equal(model.total, 6);
    assert.equal(model.topTransitions[0].key, 'home__product');
    assert.ok(model.nodes.length <= 8);
    assert.equal(model.transitions.find((transition) => transition.key === 'home__product').value, 3);
});

test('duration formatter remains compact and human-readable', () => {
    assert.equal(formatDuration(42_000), '42 s');
    assert.equal(formatDuration(90_000), '1 min 30 s');
});

test('local preview is populated, deterministic and unmistakably labelled', () => {
    const preview = getDataStudioPreview('30d');
    assert.equal(preview.__preview, true);
    assert.ok(preview.timeline.length > 10);
    assert.ok(preview.products.length > 0);
    assert.ok(PREVIEW_SESSIONS.every((session) => session.id.startsWith('preview-')));
});
