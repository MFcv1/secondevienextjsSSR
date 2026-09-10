'use strict';
process.env.CATALOG_EVENT_MAINTENANCE_MODE = 'durable';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createMemory } = require('./helpers/inactivityMemory.cjs');
const { cycleIntent, cycleStatus, createCatalogCycleRuntime } = require('../functions/src/catalog/catalogCycle.cjs');

test('cent mutations du même cycle partagent la reprise', () => {
    let state = { stateVersion: 1, ...cycleIntent({ stateVersion: 1 }, 1000) };
    const version = state.maintenanceWork.version;
    for (let i = 0; i < 100; i++) state = { ...state, desiredRevision: i + 1, ...cycleIntent(state, 1000 + i) };
    assert.equal(state.maintenanceWork.version, version); assert.equal(state.maintenanceWork.due, 181000);
});
test('lease build, rollback et backoff révalidation respectent leurs échéances', () => {
    const pending = { desiredRevision: 2, publishedRevision: 1, dirty: true };
    assert.deepEqual(cycleStatus({ ...pending, leaseToken: 'build', leaseExpiresAt: new Date(10000) }, 1000), { due: 11000 });
    assert.deepEqual(cycleStatus({ ...pending, rollbackState: 'preparing', rollbackExpiresAt: new Date(20000) }, 1000), { due: 21000 });
    assert.deepEqual(cycleStatus({ ...pending, revalidationRetryNotBefore: new Date(30000) }, 1000), { due: 30000 });
});
test('la seule publication ne vaut pas preuve de version servie', () => {
    const state = { desiredRevision: 2, publishedRevision: 2, revalidatedRevision: 2, dirty: false, invalidationState: 'accepted', servedState: 'failed' };
    assert.equal(cycleStatus(state, 1000).outcome, 'recover');
    assert.equal(cycleStatus({ ...state, servedState: 'observed' }, 1000).outcome, 'completed');
});
test('reprises sans progrès bornées à cinq, puis intervention explicite', async () => {
    const f = createMemory(), path = 'sys_catalog_publication/secondevie'; let now = 1000, repairs = 0;
    f.records.set(path, { dirty: true, ...cycleIntent({}, now, now) });
    const queue = new Map();
    const runtime = createCatalogCycleRuntime({ db: f.db, now: () => now, reconcile: async () => { repairs++; },
        enqueue: async (_kind, data, options) => queue.set(options.id, data) });
    await runtime.schedule(f.records.get(path).maintenanceWork);
    for (let i = 0; i < 6; i++) { await runtime.dispatch({ data: [...queue.values()].at(-1) }); now += 180000; }
    assert.equal(repairs, 5); assert.equal(f.records.get(path).maintenanceWork.state, 'needs_attention');
    const count = queue.size; now += 7 * 86400000;
    await runtime.schedule(f.records.get(path).maintenanceWork); assert.equal(queue.size, count);
});

test('mutation entre inspection et clôture : la transaction conserve une reprise', async () => {
    const f = createMemory(), path = 'sys_catalog_publication/secondevie';
    f.records.set(path, { desiredRevision: 1, publishedRevision: 1, revalidatedRevision: 1,
        servedState: 'observed', invalidationState: 'accepted', ...cycleIntent({}, 1000, 1000) });
    let transactions = 0;
    const queue = new Map();
    const db = { ...f.db, runTransaction: callback => {
        transactions++;
        // schedule bookkeeping, acquisition, then final acknowledgment.
        if (transactions === 3) f.records.set(path, { ...f.records.get(path), dirty: true, desiredRevision: 2 });
        return f.db.runTransaction(callback);
    } };
    const runtime = createCatalogCycleRuntime({ db, now: () => 1000,
        reconcile: async () => assert.fail('healthy initial inspection requires no repair'),
        enqueue: async (_kind, data, options) => queue.set(options.id, data) });
    await runtime.schedule(f.records.get(path).maintenanceWork);
    await runtime.dispatch({ data: [...queue.values()][0] });
    assert.equal(queue.size, 2);
    assert.equal(f.records.get(path).maintenanceWork.state, 'scheduled');
    assert.equal(f.records.get(path).maintenanceWork.generation, 1);
});
