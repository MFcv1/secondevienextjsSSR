// Executes the actual maintenance engine against an instrumented transactional
// memory store. Operation counts are comparable; timings are NOT cloud capacity.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createMemory } = require('../tests/helpers/inactivityMemory.cjs');
const { createDurableWork } = require('../functions/src/maintenance/durableWork.cjs');
const { createActivityMaintenance } = require('../functions/src/maintenance/activityMaintenanceCore.cjs');
const { createGroupedInactivity, trackingPatch } = require('../functions/src/maintenance/groupedInactivity.cjs');
const base = Date.parse('2026-09-10T12:00:00Z');
async function measure(size, mode, partitions, scenario) {
    const { db, records, metrics } = createMemory();
    let time = base, taskAttempts = 0, invocations = 0;
    const queue = [], scheduled = new Set();
    const grouped = createGroupedInactivity({ db, now: () => time });
    const individual = createActivityMaintenance({ db, now: () => time, serverTimestamp: () => time });
    const engine = createDurableWork({ db, now: () => time,
        enqueue: async (_kind, payload, options) => {
            taskAttempts++;
            if (scheduled.has(options.id)) throw Object.assign(Error('exists'), { code: 6 });
            scheduled.add(options.id); queue.push(payload);
        }, execute: r => r.data.kind === 'sessionGroup' ? grouped.dispatch(r) : individual.dispatch(r) });
    const started = performance.now();
    async function messages(active, create = false) {
        for (let i = 0; i < size; i++) await db.runTransaction(async tx => {
            const ref = db.doc(`analytics_sessions/visitor${i}`), previous = create ? null : (await tx.get(ref)).data();
            const patch = await trackingPatch(tx, db, ref.id, previous, active, time, { mode, partitions });
            tx.set(ref, { ...previous, type: 'visitor', sessionActive: active, lastActivityAt: time, duration: Math.round((time - base) / 1000), ...patch });
        });
    }
    async function flushIntents() {
        for (const value of records.values()) {
            if (value.maintenanceWork?.state === 'pending') await engine.schedule(value.maintenanceWork);
        }
        queue.sort((a, b) => a.due - b.due);
    }
    async function drainUntil(end) {
        while (queue.length && queue[0].due <= end) {
            const payload = queue.shift(); time = Math.max(time, payload.due); invocations++;
            await engine.dispatch({ data: payload });
            // Only group moves create a new root outside the durable continuation.
            if (mode === 'grouped') await flushIntents();
        }
        if (Number.isFinite(end)) time = end;
    }
    await messages(true, true); await flushIntents();
    if (scenario === 'normal_exit') { await drainUntil(base + 5 * 60000); await messages(false); }
    if (scenario === 'long_visit') {
        for (const minute of [34, 68]) { await drainUntil(base + minute * 60000); await messages(true); }
        await drainUntil(base + 90 * 60000); await messages(false);
    }
    await drainUntil(Infinity);
    const sessions = [...records.entries()].filter(([path]) => path.startsWith('analytics_sessions/')).map(([, data]) => data);
    if (sessions.length !== size || sessions.some(s => s.sessionActive)) throw Error('RESULT_MISMATCH');
    const resultDigest = require('node:crypto').createHash('sha256').update(JSON.stringify(sessions.map(s => [s.sessionActive, s.duration, s.lastActivityAt]))).digest('hex');
    return { size, mode, partitions, scenario, taskAttempts, invocations, ...metrics,
        resultDigest, modelDurationMs: Math.round(performance.now() - started) };
}
const rows = [];
for (const size of [1, 100, 1000, 10000]) {
    for (const scenario of ['lost_exit', 'normal_exit', 'long_visit']) {
        const baseline = await measure(size, 'individual', 1, scenario); rows.push(baseline);
        for (const partitions of [1, 4, 16]) {
            const grouped = await measure(size, 'grouped', partitions, scenario);
            if (grouped.resultDigest !== baseline.resultDigest) throw Error('ANALYTICS_DIFFERENT');
            rows.push(grouped);
        }
    }
}
const report = { at: new Date().toISOString(), scope: 'local_instrumented_model',
    limitations: ['No cloud latency or monetary cost measured.', 'Intermediate heartbeat writes common to both strategies omitted; long visits include signals at 34 and 68 minutes and departure at 90.', 'Document write events counted; actual downstream Firestore projection reads/writes and transport retries require sandbox measurement.'], rows };
const output = process.argv[2];
if (output) fs.writeFileSync(output, JSON.stringify(report, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ cases: rows.length, identicalResults: true,
    sample: rows.filter(r => r.size === 10000 && (r.mode === 'individual' || r.partitions === 4)) }));
