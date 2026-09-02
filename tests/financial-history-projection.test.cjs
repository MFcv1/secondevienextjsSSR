'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
    normalizeFinancialHistorySource,
    planFinancialHistorySource
} = require('../functions/src/admin/financialHistoryDomain');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const timestamp = (seconds, nanoseconds = 0) => ({ seconds, nanoseconds });

test('les jours legacy et commerce sont normalises en centimes EUR sans double compte', () => {
    assert.deepEqual(normalizeFinancialHistorySource('legacy', {
        dateKey: '2026-09-02', totalRevenue: 12.34
    }), { dateKey: '2026-09-02', revenueCents: 1234 });
    assert.deepEqual(normalizeFinancialHistorySource('commerce', {
        dateKey: '2026-09-02', currency: 'EUR', netCents: 950
    }), { dateKey: '2026-09-02', revenueCents: 950 });
    assert.equal(normalizeFinancialHistorySource('commerce', {
        dateKey: '2026-09-02', currency: 'USD', netCents: 950
    }).ignored, true);
});

test('la contribution absolue absorbe rejeu, correction et tombstone', () => {
    const first = planFinancialHistorySource({
        existingSource: null,
        nextContribution: { dateKey: '2026-09-02', revenueCents: 1000 },
        sourceUpdateTime: timestamp(10),
        eventId: 'one'
    });
    assert.equal(first.deltaCents, 1000);
    const existingSource = first.nextSource;
    assert.equal(planFinancialHistorySource({
        existingSource,
        nextContribution: { dateKey: '2026-09-02', revenueCents: 1000 },
        sourceUpdateTime: timestamp(10),
        eventId: 'one'
    }).outcome, 'noop');
    assert.equal(planFinancialHistorySource({
        existingSource,
        nextContribution: { dateKey: '2026-09-02', revenueCents: 1300 },
        sourceUpdateTime: timestamp(11),
        eventId: 'two'
    }).deltaCents, 300);
    const deleted = planFinancialHistorySource({
        existingSource,
        nextContribution: null,
        sourceUpdateTime: timestamp(12),
        eventId: 'delete'
    });
    assert.equal(deleted.deltaCents, -1000);
    assert.equal(deleted.nextSource.tombstone, true);
});

test('le dashboard ne lit jamais 3650 jours et borne max aux annees materialisees', () => {
    const dashboard = read('src/kit/admin/AdminDashboard.jsx');
    assert.doesNotMatch(dashboard, /limit\(Math\.min\(days, 3650\)\)/);
    assert.match(dashboard, /admin_finance_history_months/);
    assert.match(dashboard, /admin_finance_history_years/);
    assert.match(dashboard, /limit\(50\)/);
});
