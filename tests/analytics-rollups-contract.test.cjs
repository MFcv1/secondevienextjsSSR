'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
    addHll,
    buildDashboardInsightsContent,
    contributionFor,
    estimateHll,
    mergeHll,
    rebuildShardFromFacts
} = require('../functions/src/analytics/rollups');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

test('les visiteurs uniques restent fusionnables sans conserver leur identifiant', () => {
    let first = null;
    let second = null;
    for (let index = 0; index < 1000; index += 1) {
        first = addHll(first, `visitor-${index}`);
        second = addHll(second, `visitor-${index + 500}`);
    }
    const estimate = estimateHll(mergeHll([first, second]));
    assert.ok(estimate >= 1350 && estimate <= 1650, `estimation inattendue: ${estimate}`);
    assert.doesNotMatch(first, /visitor/);
});

test('une session produit uniquement des compteurs bornes et un sujet pseudonymise', () => {
    const contribution = contributionFor('session-secret', {
        userId: 'uid-secret',
        startedAt: Date.UTC(2026, 7, 24, 12),
        duration: 50,
        device: 'Mobile',
        journeyCount: 4,
        pageCounts: { home: 2, checkout: 1, 'route-inconnue': 3 },
        actionCounts: { cart_add: 2, 'action-inconnue': 8 }
    });
    assert.equal(contribution.sessions, 1);
    assert.equal(contribution.mobile, 1);
    assert.equal(contribution.journeySteps, 4);
    assert.equal(contribution.pageCounts.home, 2);
    assert.equal(contribution.pageCounts.unknown, 3);
    assert.equal(contribution.actionCounts.cart_add, 2);
    assert.equal(contribution.actionCounts.unknown, 8);
    assert.notEqual(contribution.subject, 'uid-secret');
});

test('les intentions devis sont des drapeaux de session et insights reste borne aux rollups', () => {
    const contribution = contributionFor('quote-session', {
        startedAt: Date.UTC(2026, 8, 1, 12),
        duration: 50,
        journeyCount: 4,
        pageCounts: { quote: 3 },
        actionCounts: { quote_start: 4, quote_submitted: 2, quote_email_opened: 2 }
    });
    assert.deepEqual(contribution.quoteSessions, { visits: 1, starts: 1, submitted: 1 });
    const legacyEmailOnly = contributionFor('legacy-quote-session', {
        startedAt: Date.UTC(2026, 8, 1, 12),
        pageCounts: { quote: 1 },
        actionCounts: { quote_email_opened: 1 }
    });
    assert.deepEqual(legacyEmailOnly.quoteSessions, { visits: 1, starts: 0, submitted: 0 });
    const productContribution = contributionFor('product-session', {
        startedAt: Date.UTC(2026, 8, 1, 12),
        journey: [
            { page: 'detail', itemId: 'chaise-bleue' },
            { page: 'detail', itemId: 'chaise-bleue' },
            { page: 'detail', itemId: '../invalide' }
        ]
    });
    assert.deepEqual(productContribution.productViews, { 'chaise-bleue': 2 });
    assert.deepEqual(productContribution.productViewSessions, { 'chaise-bleue': 1 });
    const insights = buildDashboardInsightsContent([
        { dateKey: '2026-08-31', quoteSessions: { visits: 2, starts: 1 }, productViews: { a: 2 }, productViewSessions: { a: 1 } },
        { dateKey: '2026-09-01', quoteSessions: { visits: 3, submitted: 1 }, productViews: { a: 1, b: 4 }, productViewSessions: { a: 1, b: 2 } }
    ], [
        { monthKey: '2026-09', quoteSessions: { visits: 5, starts: 1, submitted: 1 } },
        { monthKey: '2026-08', quoteSessions: { visits: 8, starts: 3, submitted: 2 } }
    ]);
    assert.deepEqual(insights.quoteWindows['30d'], { visits: 5, starts: 1, submitted: 1 });
    assert.deepEqual(insights.quoteWindows['3m'], { visits: 13, starts: 4, submitted: 3 });
    assert.equal(insights.products[0].id, 'b');
    assert.deepEqual(insights.products[1].dailyViews, [2, 1]);
    const source = read('functions/src/analytics/rollups.js');
    const materializer = source.match(/async function materializeDashboardInsights[\s\S]*?\n}\n\nfunction keysInMonth/)?.[0] || '';
    assert.match(materializer, /Array\.from\(\{ length: 30 \}/);
    assert.match(materializer, /Array\.from\(\{ length: 12 \}/);
    assert.match(materializer, /sourceDigest/);
    assert.match(materializer, /productsState: 'ready'/);
    assert.doesNotMatch(materializer, /analytics_sessions/);
});

test('le rail admin lit des rollups et charge le detail seulement a la demande', () => {
    const functionSource = read('functions/src/analytics/rollups.js');
    const uiSource = read('src/kit/admin/AdminAnalytics.jsx');
    const rulesSource = read('firestore.rules');
    const indexes = JSON.parse(read('firestore.indexes.json'));

    assert.match(functionSource, /analytics_rollup_years/);
    assert.match(functionSource, /MAX_ADMIN_PAGE_SIZE\s*=\s*50/);
    assert.match(functionSource, /private\/analytics-archives\/v1/);
    assert.doesNotMatch(functionSource, /email:\s*value\.|ip:\s*value\.|userAgent:\s*value\./);
    assert.match(uiSource, /action:\s*'overview_bundle'/);
    assert.match(uiSource, /action:\s*'detail'/);
    assert.match(uiSource, /ADMIN_SESSION_PAGE_SIZE\s*=\s*10/);
    assert.match(uiSource, /Charger 10 sessions plus anciennes/);
    assert.doesNotMatch(uiSource, /MAX_ANALYTICS_SESSIONS\s*=\s*5000/);
    assert.match(rulesSource, /match \/analytics_rollup_days\/\{dayId\}[\s\S]*allow read, write: if false/);

    const ttlGroups = new Set(indexes.fieldOverrides.filter((entry) => entry.ttl).map((entry) => entry.collectionGroup));
    assert.ok(ttlGroups.has('analytics_sessions'));
    assert.ok(ttlGroups.has('analytics_session_facts'));
    assert.ok(ttlGroups.has('summary_shards'));
});

test('les heures analytics utilisent Europe Paris et un retrait reconstruit le HLL', () => {
    const summer = contributionFor('summer-session', {
        startedAt: Date.parse('2026-09-02T21:53:00.000Z'),
        duration: 20,
        journeyCount: 2
    });
    assert.equal(summer.dateKey, '2026-09-02');
    assert.equal(summer.hourKey, '23');

    const winter = contributionFor('winter-session', {
        startedAt: Date.parse('2026-12-02T22:53:00.000Z'),
        duration: 20,
        journeyCount: 2
    });
    assert.equal(winter.hourKey, '23');

    const documents = [
        { id: 'keep', data: () => ({ shardId: '00', contribution: { ...summer, subject: 'keep' } }) },
        { id: 'remove', data: () => ({ shardId: '00', contribution: { ...summer, subject: 'remove' } }) }
    ];
    const rebuilt = rebuildShardFromFacts('2026-09-02', '00', documents, 'remove');
    assert.equal(rebuilt.sessions, 1);
    assert.equal(estimateHll(rebuilt.uniqueHll), 1);
});

test('la reparation historique est bornee, sans identifiant affiche et dry-run par defaut', () => {
    const source = read('scripts/repair-analytics-day-sandbox.cjs');
    assert.match(source, /MAX_FACTS = 400/);
    assert.match(source, /ageDays > 14/);
    assert.match(source, /REPAIR_ANALYTICS_DAY_SANDBOX/);
    assert.match(source, /identifiersExposed: false/);
    assert.match(source, /const apply = process\.argv\.includes\('--apply'\)/);
});

test('le transport Eventarc de l agregateur analytics est repare sans invoker public', () => {
    const deploy = read('scripts/deploy-functions-targeted.mjs');
    const iam = read('scripts/configure-analytics-aggregate-trigger-iam.mjs');
    const target = deploy.match(/aggregateAnalyticsSessionGen2: Object\.freeze\([\s\S]*?\n[ ]{2}\}\),/)?.[0] || '';
    assert.match(target, /triggerServiceAccount: 'functions-eventarc-invoker@secondevienextjsssr\.iam\.gserviceaccount\.com'/);
    assert.match(target, /runtimeServiceAccount: 'analytics-runtime@secondevienextjsssr\.iam\.gserviceaccount\.com'/);
    assert.match(target, /documentPathPattern: 'analytics_sessions\/\{sessionId\}'/);
    assert.match(iam, /roles\/eventarc\.eventReceiver/);
    assert.match(iam, /roles\/run\.invoker/);
    assert.match(iam, /FIX_ANALYTICS_AGGREGATE_TRIGGER_IAM/);
    assert.match(iam, /userManagedKeyCount === 0/);
    assert.doesNotMatch(iam, /allUsers|roles\/owner|roles\/editor/);
});

test('le rejeu des faits analytics est borne, idempotent et sans donnee personnelle', () => {
    const backfill = read('scripts/backfill-analytics-session-facts-sandbox.cjs');
    assert.match(backfill, /MAX_SESSIONS\s*=\s*5000/);
    assert.match(backfill, /BACKFILL_ANALYTICS_FACTS_SANDBOX/);
    assert.match(backfill, /materializeSessionFact/);
    assert.match(backfill, /compactDay/);
    assert.match(backfill, /materializeDashboardInsights/);
    assert.doesNotMatch(backfill, /email|userAgent|ipAddress/);
});

test('les commandes ont un compteur transactionnel et un affichage lisible', () => {
    const repository = read('functions/src/commerce/domain/checkoutRepository.js');
    const state = read('functions/src/commerce/domain/orderState.js');
    const presentation = read('src/kit/admin/components/orders/orderPresentation.js');
    const backfill = read('scripts/backfill-observability-sandbox.cjs');

    assert.match(repository, /orderNumberCounter/);
    assert.match(repository, /nextOrderNumber/);
    assert.match(state, /orderNumber/);
    assert.match(presentation, /getOrderReference/);
    assert.match(backfill, /BACKFILL_SANDBOX_OBSERVABILITY/);
    assert.match(backfill, /EXPECTED_PROJECT\s*=\s*'secondevienextjsssr'/);
});
