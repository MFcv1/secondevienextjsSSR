import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createAnalyticsChannel, validateAnalyticsSnapshot, realtimeOverview } from '../src/kit/admin/adminAnalyticsRealtimeStore.js';
import { prepareSeedReport } from '../scripts/prepare-analytics-realtime-seed.mjs';
import { prepareInventory, parisMidnight } from '../scripts/inventory-analytics-realtime-sandbox.mjs';
import { buildGcloudGen2DeployArgs } from '../scripts/deploy-functions-targeted.mjs';
const require = createRequire(import.meta.url);
const { buildSeed, contribution, changeBucket, projectSession, keysFor, MAX_BYTES } = require('../functions/src/analytics/realtime.js');
const now = Date.parse('2026-09-04T12:30:00Z');
const since = Date.parse('2026-04-30T22:00:00Z');
const version = { seconds: Math.floor(now / 1000), nanoseconds: 12345 };
const session = (userId = 'synthetic-client', startedAt = now) => ({ userId, startedAt, sessionActive: true, device: 'Mobile', duration: 0 });
const seed = (sessions = []) => buildSeed({ epoch: 'test', mutableSinceMs: since, coverageStartMs: since, sessions, now });
const snapshot = (data, fromCache = false) => ({ metadata: { fromCache, hasPendingWrites: false }, docs: ['recent', 'history'].map(id => ({ id, data: () => data[id] })) });

test('sandbox inventory preserves admin tombstones and strips exported identities', () => {
    const client = { ...session('private-uid'), sessionActive: false };
    const result = prepareInventory({ epoch: 'inventory', now, sessions: [
        { id: 'client', data: client, updateTime: version },
        { id: 'admin', data: { ...client, type: 'admin' }, updateTime: version }
    ], facts: [], days: [], exclusions: [] });
    assert.equal(result.report.expectedSessions, 1);
    assert.equal(result.report.tombstones, 1);
    assert.doesNotMatch(JSON.stringify(result.input), /private-uid|userId/);
    assert.deepEqual(buildSeed(result.input), result.seed);
    assert.equal(result.report.cloudWrites, 0);
    assert.equal(result.report.historyComplete, false);
    assert.equal(new Date(parisMidnight('2026-10-25')).toISOString(), '2026-10-24T22:00:00.000Z');
    assert.equal(new Date(parisMidnight('2026-03-29')).toISOString(), '2026-03-28T23:00:00.000Z');
    assert.throws(() => prepareInventory({ epoch: 'inventory', now, sessions: [{ id: 'client', data: client, updateTime: version }],
        facts: [{ id: 'orphan', data: { contribution: { dateKey: '2026-09-04' } } }], days: [], exclusions: [] }), /ORPHAN_MUTABLE/);
});
test('projector deploy enables only its flag without replacing runtime environment', () => {
    const args = buildGcloudGen2DeployArgs({ allowlist: ['aggregateAnalyticsSessionGen2'], transport: 'gcloud-gen2', project: 'secondevienextjsssr', commit: 'a'.repeat(40) });
    assert.ok(args.includes('--update-env-vars=ANALYTICS_REALTIME_ENABLED=true'));
    assert.ok(!args.some(arg => arg.startsWith('--set-env-vars')));
    assert.ok(args.includes('--min-instances=0'));
});

function memoryDb(initial) {
    const docs = new Map(Object.entries(initial));
    let reads = 0; let writes = 0;
    const db = { doc: path => ({ path }),
        async runTransaction(work) {
            const pending = [];
            const result = await work({
                async get(ref) { reads++; const value = docs.get(ref.path); return { exists: value !== undefined, data: () => value, updateTime: version }; },
                set(ref, value) { pending.push([ref.path, value]); }
            });
            for (const [path, value] of pending) { docs.set(path, value); writes++; }
            return result;
        }
    };
    return { db, docs, costs: () => ({ reads, writes }), reset: () => { reads = 0; writes = 0; } };
}
function prepared() {
    const base = seed();
    return memoryDb({
        'analytics_realtime_control/current': { ...base.control, mode: 'shadow', bootstrapComplete: true },
        'admin_analytics_realtime/recent': base.recent, 'admin_analytics_realtime/history': base.history
    });
}

test('active session counted immediately; heartbeat identical; closed metrics explicit', () => {
    const first = contribution('s', session());
    assert.deepEqual(contribution('s', { ...session(), duration: 90, lastActivityAt: now + 90000 }), first);
    assert.equal(contribution('s', { ...session(), duration: 90, sessionActive: false }).duration, 90);
    assert.equal(contribution('s', { ...session(), type: 'admin' }), null);
});
test('reversible sketch preserves duplicate visitors and restores after admin withdrawal', () => {
    const first = contribution('a', session());
    const second = contribution('b', session());
    const original = changeBucket(null, null, first);
    const two = changeBucket(original, null, second);
    assert.equal(two.sessions, 2);
    assert.equal(two.uniqueHll, original.uniqueHll);
    const one = changeBucket(two, first, null);
    assert.equal(one.uniqueHll, original.uniqueHll);
    const zero = changeBucket(one, second, null);
    assert.equal(zero.sessions, 0);
    assert.ok(Buffer.from(zero.uniqueHll, 'base64').every(value => value === 0));
    assert.throws(() => changeBucket(zero, first, null), /COUNTER_INVALID/);
});
test('replay is 4 reads / 0 writes, new contribution 11 reads / 8 writes, no scans', async () => {
    const memory = prepared();
    memory.docs.set('analytics_sessions/a', session());
    assert.equal(await projectSession('a', memory.db, now), 'created');
    assert.deepEqual(memory.costs(), { reads: 11, writes: 8 });
    memory.reset();
    assert.equal(await projectSession('a', memory.db, now), 'noop');
    assert.deepEqual(memory.costs(), { reads: 4, writes: 0 });
    const data = validateAnalyticsSnapshot(snapshot({ recent: memory.docs.get('admin_analytics_realtime/recent'), history: memory.docs.get('admin_analytics_realtime/history') }));
    for (const period of ['1h', '1j', '7j', '1mois', '1ans', 'tout']) {
        assert.equal(realtimeOverview(data, period, now).kpis.totalSessions, 1);
    }
});
test('TTL preserves history, exclusion removes once, delayed event cannot resurrect', async () => {
    const memory = prepared();
    memory.docs.set('analytics_sessions/a', session());
    await projectSession('a', memory.db, now);
    memory.docs.delete('analytics_sessions/a');
    assert.equal(await projectSession('a', memory.db, now), 'ttl-or-missing');
    memory.docs.set('analytics_session_exclusions/a', { reason: 'admin_identity_resolved' });
    assert.equal(await projectSession('a', memory.db, now), 'removed');
    assert.equal(await projectSession('a', memory.db, now), 'tombstone');
    const data = validateAnalyticsSnapshot(snapshot({ recent: memory.docs.get('admin_analytics_realtime/recent'), history: memory.docs.get('admin_analytics_realtime/history') }));
    assert.equal(realtimeOverview(data, '1j', now).kpis.uniqueVisitors, 0);
});
test('identity correction changes uniques without changing session count', async () => {
    const memory = prepared();
    for (const id of ['a', 'b']) { memory.docs.set(`analytics_sessions/${id}`, session(id)); await projectSession(id, memory.db, now); }
    memory.docs.set('analytics_sessions/b', session('a'));
    await projectSession('b', memory.db, now);
    const data = validateAnalyticsSnapshot(snapshot({ recent: memory.docs.get('admin_analytics_realtime/recent'), history: memory.docs.get('admin_analytics_realtime/history') }));
    assert.equal(realtimeOverview(data, '1j', now).kpis.uniqueVisitors, 1);
    assert.equal(realtimeOverview(data, '1j', now).kpis.totalSessions, 2);
});
test('seed disjoint history, size caps, no identifiers in global documents', () => {
    const base = seed([{ id: 'secret-session', data: session('secret-user'), updateTime: version }]);
    assert.doesNotMatch(JSON.stringify([base.recent, base.history]), /secret-|userId|subject|point/);
    assert.ok(Buffer.byteLength(JSON.stringify(base.recent)) < MAX_BYTES);
    assert.throws(() => seed([{ id: 's', data: session('user', since - 1), updateTime: version }]), /OVERLAP/);
    assert.throws(() => seed([{ id: 's', data: session(), updateTime: version }, { id: 's', data: session(), updateTime: version }]), /DUPLICATE/);
});
test('full public rings stay below the 256 KiB budget', () => {
    const base = seed([{ id: 's', data: session(), updateTime: version }]);
    const bucket = Object.values(base.recent.buckets)[0];
    const recent = {};
    for (let i = 0; i < 61; i++) recent[`minute_${Math.floor(now / 60000) - i}`] = bucket;
    for (let i = 0; i < 25; i++) recent[`hour_${Math.floor(now / 3600000) - i}`] = bucket;
    const history = {};
    for (let i = 0; i < 31; i++) history[`day_${new Date(now - i * 86400000).toISOString().slice(0, 10)}`] = bucket;
    for (let i = 0; i < 13; i++) history[`month_${new Date(Date.UTC(2026, 8 - i, 1)).toISOString().slice(0, 7)}`] = bucket;
    for (let i = 0; i < 50; i++) history[`year_${2026 - i}`] = bucket;
    base.recent.buckets = recent; base.history.buckets = history;
    validateAnalyticsSnapshot(snapshot(base));
    assert.ok(Buffer.byteLength(JSON.stringify(base.recent)) < MAX_BYTES);
    assert.ok(Buffer.byteLength(JSON.stringify(base.history)) < MAX_BYTES);
});
test('immutable historic baseline survives withdrawal of a newer matching visitor', async () => {
    const client = session();
    const sketch = changeBucket(null, null, contribution('s', client)).uniqueHll;
    const base = buildSeed({ epoch: 'test', mutableSinceMs: since, coverageStartMs: since - 86400000, now,
        sessions: [{ id: 's', data: client, updateTime: version }],
        legacyDays: [{ dateKey: '2026-04-30', sessions: 1, duration: 0, bounces: 0, mobile: 1, uniqueHll: sketch }] });
    const year = base.buckets.year_2026;
    const corrected = changeBucket(year, contribution('s', client), null);
    assert.equal(corrected.sessions, 1);
    assert.equal(corrected.uniqueHll, sketch);
});
test('a delayed transaction cannot prune newer buckets using an older clock', async () => {
    const memory = prepared();
    memory.docs.set('analytics_sessions/newer', session('newer', now + 60000));
    await projectSession('newer', memory.db, now + 60000);
    memory.docs.set('analytics_sessions/older', session());
    await projectSession('older', memory.db, now);
    const recent = memory.docs.get('admin_analytics_realtime/recent');
    assert.equal(recent.generatedAtMs, now + 60000);
    assert.ok(recent.buckets[keysFor(now + 60000)[0]]);
});
test('window expiry uses local clock, DST repeated hours remain separate', () => {
    const before = Date.parse('2026-10-25T00:30:00Z');
    const after = Date.parse('2026-10-25T01:30:00Z');
    assert.notEqual(keysFor(before)[1], keysFor(after)[1]);
    const base = seed([{ id: 's', data: session(), updateTime: version }]);
    const data = validateAnalyticsSnapshot(snapshot(base));
    assert.equal(realtimeOverview(data, '1h', now + 61 * 60000).kpis.totalSessions, 0);
    assert.equal(realtimeOverview(data, 'tout', now).dataQuality.isWindowComplete, false);
});
test('shared listener, cache->server, auth cleanup, missing and regressive data fail closed', () => {
    let accepts; let calls = 0; let stops = 0;
    const channel = createAnalyticsChannel(next => { accepts = next; calls++; return () => { stops++; }; }, validateAnalyticsSnapshot);
    channel.start(); assert.equal(calls, 0);
    channel.setOwner('admin'); channel.start();
    accepts({ docs: [], metadata: { fromCache: true } });
    assert.equal(channel.getSnapshot().status, 'loading');
    const unsubscribe = channel.subscribe(() => {});
    channel.start(); unsubscribe(); channel.start(); assert.equal(calls, 1);
    const base = seed();
    accepts(snapshot(base, true)); assert.equal(channel.getSnapshot().status, 'cached');
    accepts(snapshot(base)); assert.equal(channel.getSnapshot().status, 'ready');
    accepts({ docs: [] }); assert.equal(channel.getSnapshot().status, 'error');
    accepts(snapshot(base)); assert.equal(channel.getSnapshot().status, 'ready');
    const changed = structuredClone(base); changed.recent.revision++; changed.history.revision++;
    accepts(snapshot(changed)); accepts(snapshot(base)); assert.equal(channel.getSnapshot().status, 'error');
    channel.clear(); accepts(snapshot(changed)); assert.equal(channel.getSnapshot().status, 'idle'); assert.equal(stops, 1);
});
test('corrupt, pending and incomplete projections are not zeros', () => {
    const base = seed();
    const corrupt = structuredClone(base); corrupt.history.buckets.year_2026 = { sessions: -1 };
    assert.throws(() => validateAnalyticsSnapshot(snapshot(corrupt)));
    const pending = snapshot(base); pending.metadata.hasPendingWrites = true;
    assert.throws(() => validateAnalyticsSnapshot(pending));
});
test('bootstrap prioritizes current source, excludes admins, preserves old facts and reports no cloud writes', () => {
    const { contributionFor } = require('../functions/src/analytics/rollups');
    const oldDate = Date.parse('2026-08-01T12:00:00Z');
    const input = { epoch: 'seed-facts', now, mutableSinceMs: since, coverageStartMs: since,
        sessions: [{ id: 'current', data: session(), updateTime: version }],
        facts: ['current', 'old', 'excluded'].map(id => ({ id, data: { contribution: contributionFor(id,
            { ...session(id, oldDate), sessionActive: false }) }, updateTime: version })),
        exclusions: ['excluded'] };
    const base = buildSeed(input);
    assert.equal(Object.keys(base.ledgers).length, 2);
    const data = validateAnalyticsSnapshot(snapshot(base));
    assert.equal(realtimeOverview(data, '1j', now).kpis.totalSessions, 1);
    assert.equal(realtimeOverview(data, 'tout', now).kpis.totalSessions, 2);
    const report = prepareSeedReport(input);
    assert.equal(report.cloudWrites, 0); assert.equal(report.readyForCutover, false);
    assert.doesNotMatch(JSON.stringify(report), /current|excluded|userId/);
    assert.equal(prepareSeedReport(input).digest, report.digest);
    input.facts = [{ id: 'recent-without-source', data: { contribution: contributionFor('s', session()) }, updateTime: version }];
    assert.throws(() => buildSeed(input), /REQUIRES_SOURCE/);
});
