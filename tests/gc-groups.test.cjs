'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createMemory } = require('./helpers/inactivityMemory.cjs');
const { gcGroup, markGcGroup, createGcWork } = require('../functions/src/catalog/gcGroups.cjs');
const { enqueueMediaCandidates, mediaCandidateId } = require('../functions/src/catalog/mediaGarbageCollection');
test('un retrait après cohorte terminée renouvelle la quarantaine sans multiplier les doublons actifs', async () => {
    const priorMode = process.env.CATALOG_GC_MODE;
    process.env.CATALOG_GC_MODE = 'grouped_dry_run';
    try {
        for (const state of ['scheduled', 'running', 'succeeded']) {
            const f = createMemory(), path = 'furniture/example/detail.webp';
            const id = mediaCandidateId(path), oldGroup = gcGroup('media', 86400000);
            f.records.set(`sys_catalog_media_gc/${id}`, { path, generation: '123', state: 'pending', gcGroupId: oldGroup.id });
            f.records.set(`sys_catalog_gc_groups/${oldGroup.id}`, { maintenanceWork: { state } });
            const now = new Date('2026-09-10T12:00:00Z');
            const result = await enqueueMediaCandidates({ db: f.db, now: () => now,
                bucket: { file: () => ({ getMetadata: async () => [{ generation: '123' }] }) } }, { paths: [path, path] });
            assert.equal(result.queued, state === 'succeeded' ? 1 : 0);
            if (state === 'succeeded') {
                const candidate = f.records.get(`sys_catalog_media_gc/${id}`);
                assert.equal(candidate.notBefore.getTime(), now.getTime() + 90 * 86400000);
                assert.notEqual(candidate.gcGroupId, oldGroup.id);
                assert.ok(f.records.get(`sys_catalog_gc_groups/${candidate.gcGroupId}`).dirtyToken);
            } else assert.equal(f.metrics.writes, 0);
        }
    } finally {
        if (priorMode === undefined) delete process.env.CATALOG_GC_MODE;
        else process.env.CATALOG_GC_MODE = priorMode;
    }
});
test('quarantaine réelle de 90 jours : relais bornés, puis arrêt sans suppression', async () => {
    const f = createMemory(); let now = Date.parse('2026-09-10T12:00:00Z'), inspections = 0;
    const group = gcGroup('media', now + 90 * 86400000), queue = new Map();
    await f.db.runTransaction(tx => markGcGroup(tx, f.db, group));
    const runtime = createGcWork({ db: f.db, now: () => now, inspect: async () => { inspections++; return { report: { deleted: 0 }, cursor: null }; },
        enqueue: async (_kind, data, options) => queue.set(options.id, data) });
    await runtime.scheduleGroup(group.id);
    for (let i = 0; i < 4; i++) { const data = [...queue.values()].at(-1); assert.ok(data.due - now <= 28 * 86400000); now = data.due; await runtime.dispatch({ data }); }
    assert.equal(inspections, 1); assert.equal(queue.size, 4);
    now += 7 * 86400000; await runtime.scheduleGroup(group.id); assert.equal(queue.size, 4);
});
test('groupe vidé avant échéance : dernier réveil vide puis arrêt', async () => {
    const f = createMemory(), group = gcGroup('media', 90 * 86400000), queue = new Map(); let now = 0;
    await f.db.runTransaction(tx => markGcGroup(tx, f.db, group));
    const runtime = createGcWork({ db: f.db, now: () => now, hasCandidates: async () => false,
        inspect: async () => assert.fail('aucun inventaire Storage à vide'),
        enqueue: async (_kind, data, options) => queue.set(options.id, data) });
    await runtime.scheduleGroup(group.id); const data = [...queue.values()][0]; now = data.due;
    await runtime.dispatch({ data }); await runtime.scheduleGroup(group.id); assert.equal(queue.size, 1);
});
test('pagination et nouvel objet pendant inspection : reprise depuis le début, aucun candidat sauté', async () => {
    const f = createMemory(), group = gcGroup('release', 1000), queue = new Map(); let now = group.due, calls = 0;
    await f.db.runTransaction(tx => markGcGroup(tx, f.db, group));
    const runtime = createGcWork({ db: f.db, now: () => now, inspect: async input => {
        calls++; if (calls === 1) { await f.db.runTransaction(tx => markGcGroup(tx, f.db, group)); return { cursor: 'z', report: { deleted: 0 } }; }
        assert.equal(input.cursor, null); return { cursor: null, report: { deleted: 0 } };
    }, enqueue: async (_kind, data, options) => queue.set(options.id, data) });
    await runtime.scheduleGroup(group.id); await runtime.dispatch({ data: [...queue.values()].at(-1) }); now += 60000;
    await runtime.dispatch({ data: [...queue.values()].at(-1) }); assert.equal(calls, 2);
    assert.equal(f.records.get(`sys_catalog_gc_groups/${group.id}`).maintenanceWork.state, 'succeeded');
});
