'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseBudgetMessage, mergeCosts, buildCostView, correlation } = require('../functions/src/billing/projectCostsCore.cjs');
const now = Date.parse('2026-09-15T12:00:00Z');
const message = (cost, published = '2026-09-15T10:00:00Z') => ({
    attributes: { billingAccountId: 'account', budgetId: 'budget', schemaVersion: '1.0' }, publishTime: published,
    data: Buffer.from(JSON.stringify({ costAmount: cost, currencyCode: 'EUR', costIntervalStart: '2026-09-01T07:00:00Z' })).toString('base64'),
});
const config = { account: 'account', budget: 'budget' };
test('budget notifications preserve zero, credits and provisional coverage', () => {
    assert.equal(parseBudgetMessage(message(0), config, now).cost, 0);
    assert.equal(parseBudgetMessage(message(-1), config, now).cost, -1);
    assert.equal(parseBudgetMessage(message(4), config, now).complete, false);
});
test('budget identity and payload validation fail closed', () => {
    assert.throws(() => parseBudgetMessage(message(1), {}, now), /not_configured/);
    assert.throws(() => parseBudgetMessage(message(1), { ...config, budget: 'wrong' }, now), /source_mismatch/);
    assert.throws(() => parseBudgetMessage(message('1'), config, now), /invalid/);
    assert.throws(() => parseBudgetMessage(message(1, '2026-10-01T00:00:00Z'), config, now), /invalid/);
});
test('duplicate and out-of-order messages do not write; newer downward correction is accepted', () => {
    const row = parseBudgetMessage(message(10), config, now);
    const first = mergeCosts(null, [row], null, now);
    assert.equal(mergeCosts(first, [row], null, now), null);
    assert.equal(mergeCosts(first, [{ ...row, sourceUpdatedAtMs: row.sourceUpdatedAtMs - 1 }], null, now), null);
    assert.equal(mergeCosts(first, [{ ...row, cost: 8, sourceUpdatedAtMs: row.sourceUpdatedAtMs + 1 }], null, now).months['2026-09'].cost, 8);
});
test('only received Google months are displayed; no calendar padding or manual values', () => {
    assert.deepEqual(buildCostView(null, null, now).rows, []);
    const row = parseBudgetMessage(message(0), config, now);
    const snapshot = mergeCosts(null, [row], null, now);
    snapshot.months['2026-08'] = { cost: 4, currency: 'EUR', source: 'monthly_import' };
    const view = buildCostView(snapshot, null, now);
    assert.equal(view.rows.length, 1);
    assert.equal(view.rows[0].month, '2026-09');
    assert.equal(view.rows[0].cost, 0);
    assert.equal(view.rows[0].costPerThousand, null);
});
test('non-Google sources cannot be ingested', () => {
    assert.equal(mergeCosts(null, [{ month: '2026-08', cost: 5, source: 'manual' }], null, now), null);
});
test('correlation needs six comparable months and nonconstant series', () => {
    const rows = Array.from({ length: 6 }, (_, index) => ({ cost: index * 2, complete: true, traffic: { complete: true, sessions: index + 1 } }));
    assert.equal(correlation(rows.slice(0, 5)).value, null);
    assert.equal(correlation(rows).value, 1);
    assert.equal(correlation(rows.map(row => ({ ...row, cost: 2 }))).reason, 'no_variation');
    assert.equal(correlation(rows.map(row => ({ ...row, complete: false }))).samples, 0);
});
