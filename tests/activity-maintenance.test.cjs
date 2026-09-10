'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createActivityMaintenance, planWrite, INACTIVITY_MS } = require('../functions/src/maintenance/activityMaintenanceCore.cjs');
const { rescueSchedule } = require('../functions/src/maintenance/rescueSchedule.cjs');
const NOW = Date.parse('2026-09-10T12:00:00Z');
const link = due => ({ checkout: { channel: 'admin_payment_link', status: 'active', expiresAt: new Date(due).toISOString() } });
function fixture(data, extra = {}) {
    let record = data, version = 1;
    const calls = [], queued = [];
    const snapshot = () => { const v = version; return { exists: record != null, data: () => record, updateTime: { isEqual: other => other.value === v, value: v } }; };
    const ref = { get: async () => snapshot() };
    const db = { doc: () => ref, runTransaction: async fn => fn({ get: async () => snapshot(), update: (_ref, values) => { record = { ...record, ...values }; version++; } }) };
    const engine = createActivityMaintenance({ db, now: () => NOW, serverTimestamp: () => NOW,
        enqueue: async (...args) => queued.push(args), expireLink: async id => { calls.push(id); return { outcome: 'expired' }; },
        finalizePublication: async () => ({ status: 'published' }), compactPeriod: async id => calls.push(id), ...extra });
    return { ...engine, queued, calls, record: () => record, change: value => { record = value; version++; } };
}
const request = (kind, due = NOW - 1, id = 'item_1') => ({ data: { schemaVersion: 1, kind, due, id } });

test('only creation and extension of active links schedule work', () => {
    assert.equal(planWrite('link', 'x', null, null), null);
    assert.equal(planWrite('link', 'x', link(NOW), link(NOW)), null);
    assert.equal(planWrite('link', 'x', link(NOW), link(NOW + 1000)).due, NOW + 1000);
    assert.equal(planWrite('link', 'x', link(NOW), { checkout: { status: 'closed' } }), null);
});
test('enqueue identity is stable and delivery failure is not acknowledged', async () => {
    const f = fixture(null); const p = planWrite('link', 'x', null, link(NOW));
    await f.schedule(p); await f.schedule(p);
    assert.equal(f.queued[0][2].id, f.queued[1][2].id);
    const broken = fixture(null, { enqueue: async () => { throw Error('unavailable'); } });
    await assert.rejects(broken.schedule(p), /unavailable/);
    const duplicate = fixture(null, { enqueue: async () => { throw Object.assign(Error(), { code: 6 }); } });
    assert.equal((await duplicate.schedule(p)).outcome, 'duplicate');
});
test('old expiry cannot call the business handler after extension or closing', async () => {
    for (const data of [null, link(NOW + 1000), { checkout: { status: 'closed' } }]) {
        const f = fixture(data); assert.equal((await f.dispatch(request('link'))).outcome, 'stale'); assert.equal(f.calls.length, 0);
    }
    const f = fixture(link(NOW - 1)); await f.dispatch(request('link')); assert.equal(f.calls.length, 1);
});
test('early delivery retries without acting', async () => {
    const f = fixture(link(NOW + 1000)); await assert.rejects(f.dispatch(request('link', NOW + 1000)), /EARLY/); assert.equal(f.calls.length, 0);
});
test('session heartbeat does not enqueue and reactivation does', () => {
    const before = { sessionActive: true, lastActivityAt: NOW - 1000 };
    const after = { ...before, lastActivityAt: NOW };
    assert.equal(planWrite('session', 'x', before, after), null);
    assert.equal(planWrite('session', 'x', { ...before, sessionActive: false }, after).due, NOW + INACTIVITY_MS);
    assert.equal(planWrite('session', 'x', null, { ...after, type: 'admin' }), null);
});
test('session task rereads recent activity and schedules its next deadline', async () => {
    const f = fixture({ sessionActive: true, lastActivityAt: NOW - 1000 });
    assert.equal((await f.dispatch(request('session'))).outcome, 'deferred');
    assert.equal(f.record().sessionActive, true); assert.equal(f.queued[0][1].due, NOW - 1000 + INACTIVITY_MS);
});
test('inactive session closes once; duplicate, deleted and admin sessions do nothing', async () => {
    const f = fixture({ sessionActive: true, lastActivityAt: NOW - INACTIVITY_MS });
    assert.equal((await f.dispatch(request('session'))).outcome, 'finalized');
    assert.equal((await f.dispatch(request('session'))).outcome, 'stale');
    for (const data of [null, { sessionActive: true, type: 'admin', lastActivityAt: 1 }]) assert.equal((await fixture(data).dispatch(request('session'))).outcome, 'stale');
});
test('session reschedule failure propagates so delivery retries', async () => {
    const f = fixture({ sessionActive: true, lastActivityAt: NOW }, { enqueue: async () => { throw Error('offline'); } });
    await assert.rejects(f.dispatch(request('session')), /offline/);
});
test('publication internal failure writes cannot create new retry chains', () => {
    const before = { status: 'finalizing', slots: {}, updatedAt: NOW };
    assert.equal(planWrite('publication', 'x', before, { ...before, status: 'failed' }), null);
    assert.ok(planWrite('publication', 'x', before, { ...before, status: 'ready' }));
    assert.equal(planWrite('publication', 'x', before, { ...before, status: 'published' }), null);
});
test('publication uploads are deferred then signalled, never finalized early', async () => {
    const f = fixture({ status: 'uploading', updatedAt: NOW - 1000 });
    assert.equal((await f.dispatch(request('publication'))).outcome, 'deferred');
    const stalled = fixture({ status: 'processing', updatedAt: NOW - 20 * 60000 });
    assert.equal((await stalled.dispatch(request('publication'))).outcome, 'attention');
    assert.equal(stalled.record().clientState, 'attention_required');
});
test('published and expired publications cannot be resumed', async () => {
    assert.equal((await fixture({ status: 'published' }).dispatch(request('publication'))).outcome, 'stale');
    assert.equal((await fixture({ status: 'ready', expiresAt: NOW - 1 }).dispatch(request('publication'))).outcome, 'expired');
});
test('finalization lease is respected and exhausted retries surface attention', async () => {
    const f = fixture({ status: 'finalizing', finalizationLeaseExpiresAt: NOW + 1000 });
    assert.equal((await f.dispatch(request('publication'))).outcome, 'deferred');
    const broken = fixture({ status: 'failed' }, { finalizePublication: async () => { throw Error('fail'); } });
    await assert.rejects(broken.dispatch({ ...request('publication'), retryCount: 4 }), /fail/);
    assert.equal(broken.record().clientState, 'attention_required');
});
test('shard writes coalesce before the boundary and next bucket differs', () => {
    const a = planWrite('compaction', '2026-09-10', null, {}, NOW);
    const b = planWrite('compaction', '2026-09-10', {}, {}, NOW + 1000);
    const c = planWrite('compaction', '2026-09-10', {}, {}, NOW + 300000);
    assert.equal(a.due, b.due); assert.notEqual(a.due, c.due);
});
test('compaction targets its original day after midnight, including deletion events', async () => {
    const f = fixture(null); await f.dispatch(request('compaction', NOW - 1, '2026-09-09'));
    assert.deepEqual(f.calls, ['2026-09-09']);
    assert.ok(planWrite('compaction', '2026-09-09', {}, null, NOW));
});
test('invalid payloads and distant deadlines fail explicitly', async () => {
    const f = fixture(null);
    await assert.rejects(f.dispatch(request('link', NOW, '../escape')), /INVALID/);
    await assert.rejects(f.schedule({ kind: 'link', id: 'x', due: NOW + 31 * 86400000 }), /DISTANT/);
});
test('the abandoned slow-scan candidate cannot be activated', () => {
    assert.equal(rescueSchedule('fast', 'slow', {}), 'fast');
    assert.throws(() => rescueSchedule('fast', 'slow', { ACTIVITY_MAINTENANCE_SLOW_RESCUE: 'true' }), /RETIRED/);
    assert.throws(() => rescueSchedule('fast', 'slow', { ACTIVITY_MAINTENANCE_SLOW_RESCUE: 'true', ACTIVITY_MAINTENANCE_ENABLED: 'true' }), /RETIRED/);
});

test('deployed task definitions isolate domains, preserve private invocation and bounded retries', () => {
    const endpoints = require('../functions/src/maintenance/activityMaintenance');
    assert.equal(Object.keys(endpoints).length, 12);
    for (const [name, fn] of Object.entries(endpoints)) {
        assert.equal(fn.__endpoint.minInstances, 0);
        assert.equal(fn.__endpoint.maxInstances, 1);
        if (name.startsWith('dispatch')) {
            assert.equal(fn.__endpoint.taskQueueTrigger.retryConfig.maxAttempts, 10);
            assert.equal(fn.__endpoint.taskQueueTrigger.invoker.length, 1);
            assert.ok(!fn.__endpoint.taskQueueTrigger.invoker.includes('public'));
        } else assert.equal(fn.__endpoint.eventTrigger.retry, true);
    }
});

test('targeted deployment matches the SDK task limits and CloudEvent format', async () => {
    const { GCLOUD_GEN2_TARGETS: targets } = await import('../scripts/deploy-functions-targeted.mjs');
    const endpoints = require('../functions/src/maintenance/activityMaintenance');
    for (const [name, fn] of Object.entries(endpoints)) {
        const target = targets[name];
        assert.ok(target, name);
        assert.equal(target.cpu, '1'); assert.equal(target.memory, '512Mi');
        assert.equal(target.timeout, '540s');
        assert.ok(target.environmentVariableNames.includes('ACTIVITY_MAINTENANCE_ENABLED'));
        if (name.startsWith('dispatch')) {
            assert.equal(target.queueMaxAttempts, fn.__endpoint.taskQueueTrigger.retryConfig.maxAttempts);
            assert.equal(target.queueMaxConcurrentDispatches, 1);
            assert.equal(target.queueMaxDispatchesPerSecond, 1);
            assert.equal(target.runtimeServiceAccount, fn.__endpoint.serviceAccountEmail);
        } else assert.ok(target.environmentVariables.includes('FUNCTION_SIGNATURE_TYPE=cloudevent'));
    }
});
