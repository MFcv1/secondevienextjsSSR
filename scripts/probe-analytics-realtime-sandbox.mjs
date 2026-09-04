// Bounded P4 synthetic analytics only: no Auth account, payment, or commerce writes.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { validateAnalyticsSnapshot, realtimeOverview } from '../src/kit/admin/adminAnalyticsRealtimeStore.js';
const require = createRequire(import.meta.url);
const admin = require('../functions/node_modules/firebase-admin');
const { projectSession } = require('../functions/src/analytics/realtime');
const { hashOpaque } = require('../functions/helpers/observability');
const PROJECT = 'secondevienextjsssr';
const args = Object.fromEntries(process.argv.slice(2).map(arg => arg.replace(/^--/, '').split('=')));
const visibleHoldMs = Number(args['visible-hold-ms'] || 0);
if (!Number.isSafeInteger(visibleHoldMs) || visibleHoldMs < 0 || visibleHoldMs > 45000) throw new Error('PROBE_HOLD_BOUND');
if (args.project !== PROJECT || process.env.APPROVAL !== 'ANALYTICS_REALTIME_P4_SANDBOX'
    || process.env.FIRESTORE_EMULATOR_HOST) throw new Error('PROBE_AUTHORIZATION');
for (const key of ['GCLOUD_PROJECT', 'GOOGLE_CLOUD_PROJECT']) {
    if (process.env[key] && process.env[key] !== PROJECT) throw new Error('PROBE_PROJECT');
}
const app = admin.initializeApp({ projectId: PROJECT });
const db = admin.firestore();
const prefix = `p4-realtime-probe-${Date.now()}`;
const ids = ['a', 'b', 'c'].map(suffix => `${prefix}-${suffix}`);
let stop; let latest; let failure; let created = false; let removed = false;
const waiters = new Set();
const callbacks = [];
function wake() { for (const callback of waiters) callback(); }
function waitFor(predicate) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { waiters.delete(check); reject(new Error('PROBE_EVENT_TIMEOUT_45S')); }, 45000);
        function check() {
            if (!failure && (!latest || !predicate(latest))) return;
            clearTimeout(timer); waiters.delete(check);
            if (failure) reject(failure); else resolve(latest);
        }
        waiters.add(check); check();
    });
}
async function withdraw() {
    const batch = db.batch();
    for (const id of ids) {
        batch.set(db.doc(`analytics_session_exclusions/${id}`), { reason: 'admin_identity_resolved',
            expireAt: admin.firestore.Timestamp.fromMillis(Date.now() + 7 * 86400000) });
        batch.delete(db.doc(`analytics_sessions/${id}`));
    }
    await batch.commit(); removed = true;
}
try {
    const control = (await db.doc('analytics_realtime_control/current').get()).data();
    if (control?.mode !== 'shadow' || !control.bootstrapComplete) throw new Error('PROBE_REQUIRES_SHADOW');
    stop = db.collection('admin_analytics_realtime').where(admin.firestore.FieldPath.documentId(), 'in', ['recent', 'history'])
        .onSnapshot(snapshot => {
            const data = Object.fromEntries(snapshot.docs.map(doc => [doc.id, doc.data()]));
            if (!data.recent || !data.history || data.recent.revision !== data.history.revision) return;
            latest = data;
            const receivedAtMs = Date.now();
            const projectionCommitAtMs = Math.max(...snapshot.docs.map(doc => doc.updateTime.toMillis()));
            callbacks.push({ revision: data.history.revision, receivedAtMs, projectionCommitAtMs,
                initialSnapshot: callbacks.length === 0,
                crossClockDeltaMs: callbacks.length === 0 ? null : receivedAtMs - projectionCommitAtMs,
                clocksSynchronized: false });
            wake();
        }, error => { failure = error; wake(); });
    const baseline = await waitFor(() => true);
    const total = data => Object.entries(data.history.buckets).filter(([key]) => key.startsWith('year_')).reduce((sum, [, bucket]) => sum + bucket.sessions, 0);
    const before = total(baseline);
    const startedAt = admin.firestore.Timestamp.now();
    const batch = db.batch();
    for (let i = 0; i < ids.length; i++) batch.create(db.doc(`analytics_sessions/${ids[i]}`), {
        startedAt, lastActivityAt: startedAt, sessionActive: true, duration: 0, journeyCount: 1,
        userId: `${prefix}-${i < 2 ? 'shared' : 'other'}`, type: 'visitor', device: 'Desktop',
        expireAt: admin.firestore.Timestamp.fromMillis(Date.now() + 86400000)
    });
    const sourceRequestStarted = performance.now();
    const commits = await batch.commit(); created = true;
    const sourceAcknowledged = performance.now();
    const arrived = await waitFor(data => total(data) === before + 3);
    const creationReceivedAtMs = Date.now();
    const creationReceived = performance.now();
    const overview = data => realtimeOverview(validateAnalyticsSnapshot({ docs: Object.entries(data).map(([id, value]) => ({ id, data: () => value })) }), '1h');
    if (overview(baseline).kpis.totalSessions === 0) {
        assert.equal(overview(arrived).kpis.totalSessions, 3);
        assert.equal(overview(arrived).kpis.uniqueVisitors, 2);
    }
    // Manual duplicate delivery tests the exact production transaction, never invents event state.
    const replay = [];
    for (const id of [...ids].reverse()) replay.push(await projectSession(id, db));
    const afterReplay = (await db.doc('admin_analytics_realtime/history').get()).data();
    if (replay.some(result => result !== 'noop') || afterReplay.revision !== arrived.history.revision) throw new Error('PROBE_REPLAY_DIVERGED');
    const ledgerSnapshots = await db.getAll(...ids.map(id => db.doc(`analytics_realtime_ledgers/${hashOpaque(id)}`)));
    if (ledgerSnapshots.some(doc => !Number.isSafeInteger(doc.data()?.sourceVersion?.nanoseconds))) throw new Error('PROBE_SOURCE_VERSION');
    if (visibleHoldMs) {
        console.log(JSON.stringify({ stage: 'visible-fixture', probe: prefix, sessions: overview(arrived).kpis.totalSessions,
            visitors: overview(arrived).kpis.uniqueVisitors, visibleHoldMs }));
        await new Promise(resolve => setTimeout(resolve, visibleHoldMs));
    }
    await withdraw();
    const restored = await waitFor(data => total(data) === before);
    const years = data => Object.fromEntries(Object.entries(data.history.buckets).filter(([key]) => key.startsWith('year_')));
    assert.deepEqual(years(restored), years(baseline));
    const tombstones = await db.getAll(...ids.map(id => db.doc(`analytics_realtime_ledgers/${hashOpaque(id)}`)));
    if (tombstones.some(doc => doc.data()?.tombstone !== true)) throw new Error('PROBE_EXCLUSION_DIVERGED');
    const secondReplay = [];
    for (const id of ids) secondReplay.push(await projectSession(id, db));
    if (secondReplay.some(result => result !== 'tombstone')) throw new Error('PROBE_RESURRECTION');
    const cleanup = db.batch();
    for (const id of ids) cleanup.delete(db.doc(`analytics_session_exclusions/${id}`));
    await cleanup.commit();
    const report = { schemaVersion: 1, project: PROJECT, probe: prefix, beforeSessions: before,
        afterCreation: total(arrived), afterWithdrawal: total(restored), replay, secondReplay,
        sourceCommitToThreeProjectionsMs: creationReceivedAtMs - commits[0].writeTime.toMillis(),
        crossClockMeasurementOnly: true,
        sourceRequestToThreeProjectionsMs: creationReceived - sourceRequestStarted,
        sourceAcknowledgedToThreeProjectionsMs: creationReceived - sourceAcknowledged,
        initialRevision: baseline.history.revision, creationRevision: arrived.history.revision, finalRevision: restored.history.revision,
        callbacks, visibleHoldMs, browserMeasurement: false, p95Claim: false, sourceDocumentsRemoved: 3,
        temporaryExclusionsRemoved: 3, tombstonesRetained: 3, frontendCutover: false };
    const output = fileURLToPath(new URL(`../output/analytics-realtime/${prefix}.json`, import.meta.url));
    writeFileSync(output, JSON.stringify(report, null, 2), { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify(report, null, 2));
} catch (error) {
    // Fail safely: keep exclusion tombstones if event delivery failed; never leave test traffic counted intentionally.
    if (created && !removed) await withdraw().catch(() => {});
    console.error(`Probe failed: ${error.code || error.message}; fixture prefix ${prefix}. Inspect exclusions before retrying.`);
    process.exitCode = 1;
} finally { stop?.(); wake(); await app.delete(); }
