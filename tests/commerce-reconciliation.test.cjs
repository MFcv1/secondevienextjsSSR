'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createMemory } = require('./helpers/inactivityMemory.cjs');
const { runCommerceTransaction, reconciliationDue } = require('../functions/src/commerce/domain/reconciliationActivity.cjs');
const { createReconciliationWork } = require('../functions/src/commerce/domain/reconciliationWork.cjs');

test('marqueur et commande sont atomiques, sans marquer les écritures hors commerce', async () => {
    const f = createMemory(), options = { enabled: true, now: () => Date.parse('2026-09-10T10:00:00Z') };
    f.rejectCommit();
    await assert.rejects(runCommerceTransaction(f.db, tx => tx.set(f.db.doc('orders/order-one'), { status: 'pending' }), options), /ABORTED/);
    assert.equal(f.records.size, 0);
    await runCommerceTransaction(f.db, tx => tx.set(f.db.doc('analytics_sessions/one'), {}), options);
    assert.equal(f.records.size, 1);
    await runCommerceTransaction(f.db, tx => tx.set(f.db.doc('orders/order-one'), { status: 'pending' }), options);
    assert.ok(f.records.get('sys_commerce_reconciliation/2026-09-10').dirtyToken);
    assert.ok(f.records.get('sys_commerce_reconciliation_watermark/current').token);
});
test('03:17 Paris respecte les deux changements d’heure', () => {
    assert.equal(new Date(reconciliationDue('2026-03-28', 0)).toISOString(), '2026-03-29T01:17:00.000Z');
    assert.equal(new Date(reconciliationDue('2026-10-24', 0)).toISOString(), '2026-10-25T02:17:00.000Z');
});
test('mille transactions du même jour produisent une tâche et le contrôle lit la génération récente', async () => {
    const f = createMemory(), day = '2026-09-10', path = `sys_commerce_reconciliation/${day}`;
    let now = Date.parse(`${day}T10:00:00Z`), inspections = 0;
    const queue = new Map();
    const runtime = createReconciliationWork({ db: f.db, now: () => now, inspect: async () => { inspections++; return { divergences: [] }; },
        enqueue: async (_kind, data, options) => queue.set(options.id, data) });
    for (let i = 0; i < 1000; i++) {
        await runCommerceTransaction(f.db, tx => tx.set(f.db.doc('orders/one'), { stateVersion: i }), { enabled: true, now: () => now });
        await runtime.scheduleDay(day);
    }
    assert.equal(queue.size, 1);
    now = [...queue.values()][0].due;
    await runtime.dispatch({ data: [...queue.values()][0] });
    assert.equal(inspections, 1);
    assert.equal(f.records.get(path).dirtyToken, f.records.get(path).verifiedToken);
    now += 7 * 86400000; await runtime.scheduleDay(day); assert.equal(queue.size, 1);
});
test('mutation concurrente et remboursement ancien empêchent un faux résultat vérifié', async () => {
    const f = createMemory(), day = '2026-09-01', path = `sys_commerce_reconciliation/${day}`;
    let now = Date.parse('2026-09-10T12:00:00Z'); const queue = new Map();
    const write = () => runCommerceTransaction(f.db, tx => tx.set(f.db.doc('commerce_financial_facts/refund-one'), { effectiveAt: `${day}T12:00:00Z` }), { enabled: true, now: () => now });
    await write();
    const runtime = createReconciliationWork({ db: f.db, now: () => now, inspect: async () => { await write(); return { divergences: [] }; },
        enqueue: async (_kind, data, options) => queue.set(options.id, data) });
    await runtime.scheduleDay(day); now += 300000;
    await runtime.dispatch({ data: [...queue.values()][0] });
    assert.equal(f.records.get(path).verifiedToken, undefined); assert.equal(queue.size, 2);
});
