'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createMemory } = require('./helpers/inactivityMemory.cjs');
const { createDurableWork } = require('../functions/src/maintenance/durableWork.cjs');
const { createActivityMaintenance } = require('../functions/src/maintenance/activityMaintenanceCore.cjs');
const { trackingPatch, migrationPatch, groupFor, configuration, createGroupedInactivity, INACTIVITY_MS, WINDOW_MS } = require('../functions/src/maintenance/groupedInactivity.cjs');
const NOW = Date.parse('2026-09-10T12:00:00Z');
function harness(pageSize = 100) {
    const memory = createMemory(), { db, records } = memory;
    let time = NOW, enqueues = 0, calls = 0;
    const queue = new Map(), grouped = createGroupedInactivity({ db, now: () => time, pageSize });
    const individual = createActivityMaintenance({ db, now: () => time, serverTimestamp: () => time });
    const engine = createDurableWork({ db, now: () => time, token: () => `lease-${++calls}`,
        enqueue: async (_kind, payload, config) => { enqueues++; if (queue.has(config.id)) throw Object.assign(Error('DUPLICATE'), { code: 6 }); queue.set(config.id, payload); },
        execute: r => r.data.kind === 'sessionGroup' ? grouped.dispatch(r) : individual.dispatch(r) });
    async function message(id, active, mode = 'grouped') {
        return db.runTransaction(async tx => {
            const ref = db.doc(`analytics_sessions/${id}`), current = (await tx.get(ref)).data();
            const patch = await trackingPatch(tx, db, id, current, active, time, { mode, partitions: 1 });
            tx.set(ref, { ...current, type: 'visitor', duration: 123, sessionActive: active, lastActivityAt: time, ...patch });
        });
    }
    async function schedule() {
        for (const [path, record] of [...records]) if (path.startsWith('analytics_inactivity_groups/') && record.maintenanceWork?.state === 'pending') await engine.schedule(record.maintenanceWork);
    }
    return { ...memory, message, schedule, engine, queue, grouped, individual,
        setTime: value => { time = value; }, now: () => time, enqueues: () => enqueues,
        session: id => records.get(`analytics_sessions/${id}`),
        deliver: payload => engine.dispatch({ data: payload || [...queue.values()].at(-1) }) };
}
test('bucket boundaries, partitions and configuration are explicit and bounded', () => {
    for (const offset of [0, 1, WINDOW_MS - 1, WINDOW_MS]) {
        const due = NOW + INACTIVITY_MS + offset, g = groupFor('session', due, NOW);
        assert.ok(g.due >= due && g.due - due < WINDOW_MS);
    }
    assert.deepEqual(configuration({}), { mode: 'individual', partitions: 4 });
    assert.throws(() => configuration({ ANALYTICS_INACTIVITY_MODE: 'bad' }));
    assert.throws(() => groupFor('id', NOW, NOW, 3));
});
test('idle seven days creates nothing', async () => {
    const h = harness(); h.setTime(NOW + 7 * 86400000); await h.schedule();
    assert.equal(h.records.size, 0); assert.equal(h.enqueues(), 0);
});
test('one shared task, no enrollment on heartbeat, normal exit unchanged', async () => {
    const h = harness(); await h.message('one', true); await h.message('two', true); await h.schedule();
    assert.equal(h.queue.size, 1);
    const pointer = structuredClone(h.session('one').inactivityGroup), size = h.records.size;
    h.setTime(NOW + 60000); await h.message('one', true); await h.message('two', false);
    assert.deepEqual(h.session('one').inactivityGroup, pointer); assert.equal(h.records.size, size);
    h.setTime(NOW + INACTIVITY_MS); await h.deliver();
    assert.equal(h.session('one').sessionActive, true);
    assert.equal(h.session('two').sessionActive, false);
    assert.notEqual(h.session('one').inactivityGroup.groupId, pointer.groupId);
    const groupId = h.session('one').inactivityGroup.groupId;
    await h.schedule(); h.setTime(h.records.get(`analytics_inactivity_groups/${groupId}`).due); await h.deliver();
    assert.equal(h.session('one').sessionActive, false); assert.equal(h.session('one').duration, 123);
});
test('reactivation invalidates an old member, even in the same bucket', async () => {
    const h = harness(); await h.message('one', true); const old = h.session('one').inactivityGroup;
    await h.message('one', false); h.setTime(NOW + 1); await h.message('one', true);
    assert.notEqual(h.session('one').inactivityGroup.generation, old.generation);
    await h.schedule(); h.setTime(NOW + INACTIVITY_MS); await h.deliver([...h.queue.values()][0]);
    assert.equal(h.session('one').sessionActive, true);
});
test('aborted enrollment leaves no session, group or member', async () => {
    const h = harness(); h.rejectCommit(); await assert.rejects(h.message('one', true), /ABORTED_COMMIT/);
    assert.equal(h.records.size, 0); assert.equal(h.enqueues(), 0);
});
test('bounded continuation drains members without skipping or double finalization', async () => {
    const h = harness(2);
    for (let i = 0; i < 5; i++) await h.message(`session${i}`, true);
    await h.schedule(); const original = [...h.queue.values()][0]; h.setTime(NOW + INACTIVITY_MS);
    await h.deliver(original); h.setTime(h.now() + 1000); await h.deliver(); h.setTime(h.now() + 1000); await h.deliver();
    for (let i = 0; i < 5; i++) assert.equal(h.session(`session${i}`).finalizedBy, 'inactivity_group');
    assert.equal((await h.db.collection('analytics_sessions').where('sessionActive', '==', true).get()).size, 0);
    assert.equal(h.enqueues(), 3);
    const writes = h.metrics.writes; await h.deliver(original); assert.equal(h.metrics.writes, writes);
    const root = h.records.get(`analytics_inactivity_groups/${original.id}`);
    assert.equal(root.maintenanceWork.state, 'succeeded'); assert.ok(root.expireAt);
});
test('excluded, deleted and admin sessions are not resurrected or finalized', async () => {
    const h = harness(); for (const id of ['excluded', 'deleted', 'admin']) await h.message(id, true);
    h.records.set('analytics_session_exclusions/excluded', { reason: 'test' });
    h.records.delete('analytics_sessions/deleted'); h.session('admin').type = 'admin';
    await h.schedule(); h.setTime(NOW + INACTIVITY_MS); await h.deliver();
    assert.equal(h.session('excluded').sessionActive, true); assert.equal(h.session('admin').sessionActive, true);
    assert.equal(h.session('deleted'), undefined);
});
test('group lease fences every mutation; individual worker ignores grouped ownership', async () => {
    const h = harness(); await h.message('one', true); await h.schedule(); h.setTime(NOW + INACTIVITY_MS);
    const payload = [...h.queue.values()][0];
    await assert.rejects(h.grouped.dispatch({ data: payload, workLease: 'stolen' }), /LEASE_LOST/);
    assert.equal(h.session('one').sessionActive, true);
    assert.equal((await h.individual.dispatch({ data: { schemaVersion: 1, kind: 'session', id: 'one', due: h.now() } })).outcome, 'stale');
});
test('activation is sticky: existing individual sessions retain their owner', async () => {
    const h = harness(); await h.message('old', true, 'individual'); await h.message('old', true, 'grouped');
    assert.equal(h.session('old').inactivityGroup, undefined); assert.equal(h.session('old').maintenanceWork.kind, 'session');
    await h.message('new', true); await h.message('new', false, 'individual'); await h.message('new', true, 'individual');
    assert.equal(h.session('new').inactivityGroup.mode, 'grouped');
});
test('Firestore sub-millisecond timestamps defer safely without premature closure', async () => {
    const h = harness(); await h.message('one', true); h.session('one').lastActivityAt = NOW + 0.125;
    await h.schedule(); h.setTime(NOW + INACTIVITY_MS); await h.deliver();
    assert.equal(h.session('one').sessionActive, true);
    assert.notEqual(h.session('one').inactivityGroup.groupId, [...h.queue.values()][0].id);
    h.records.set('analytics_sessions/individual', { type: 'visitor', sessionActive: true, lastActivityAt: NOW + 0.125 });
    const r = await h.individual.dispatch({ durable: true, data: { schemaVersion: 1, kind: 'session', id: 'individual', due: h.now() } });
    assert.equal(r.due, NOW + INACTIVITY_MS + 1);
});

test('failure after one committed closure resumes the remaining page', async () => {
    const h = harness(); await h.message('a', true); await h.message('b', true); await h.schedule();
    h.setTime(NOW + INACTIVITY_MS);
    const original = [...h.queue.values()][0], runTransaction = h.db.runTransaction;
    let injected = false;
    h.db.runTransaction = callback => {
        if (!injected && h.session('a').sessionActive === false && h.session('b').sessionActive) {
            injected = true; return Promise.reject(Error('SIMULATED_CRASH'));
        }
        return runTransaction(callback);
    };
    await assert.rejects(h.deliver(original), /SIMULATED_CRASH/);
    assert.equal(h.session('a').sessionActive, false);
    assert.equal(h.session('b').sessionActive, true);
    const finalizedAt = h.session('a').finalizedAt;
    assert.equal(h.records.get(`analytics_inactivity_groups/${original.id}`).expireAt, undefined);
    await h.deliver(original);
    assert.equal(h.session('b').sessionActive, false);
    assert.deepEqual(h.session('a').finalizedAt, finalizedAt);
    assert.equal(h.records.get(`analytics_inactivity_groups/${original.id}`).maintenanceWork.state, 'succeeded');
});

test('migration and rollback preserve facts and exclude the old owner', async () => {
    const h = harness(); await h.message('one', true, 'individual');
    const original = structuredClone(h.session('one'));
    const migrate = direction => h.db.runTransaction(async tx => {
        const ref = h.db.doc('analytics_sessions/one'), current = (await tx.get(ref)).data();
        const patch = await migrationPatch(tx, h.db, 'one', current, direction, h.now(), 1);
        if (patch) tx.update(ref, patch);
    });
    await migrate('grouped');
    assert.equal(h.session('one').maintenanceWork.state, 'superseded');
    assert.equal(require('../functions/src/maintenance/bootstrapCore.cjs').bootstrapPatch('session', 'one', h.session('one'), h.now()), null);
    await h.schedule(); const payload = [...h.queue.values()][0];
    await migrate('individual');
    h.setTime(NOW + INACTIVITY_MS); await h.deliver(payload);
    assert.equal(h.session('one').sessionActive, true);
    assert.equal(h.session('one').maintenanceWork.state, 'pending');
    assert.equal(h.session('one').duration, original.duration);
    assert.equal(h.session('one').lastActivityAt, original.lastActivityAt);
});
