// One synthetic, expiring session in the explicitly selected sandbox.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
const require = createRequire(import.meta.url);
const { sessionIntent } = require('../functions/src/maintenance/durableWork.cjs');
const flags = new Set(process.argv.slice(2));
if (!flags.has('--project=secondevienextjsssr') || !flags.has('--env=sandbox')
    || !flags.has('--execute') || !flags.has('--confirm=QUALIFY_SYNTHETIC_INACTIVITY')) throw Error('EXPLICIT_SANDBOX_DRILL_REQUIRED');
initializeApp({ projectId: 'secondevienextjsssr', credential: applicationDefault() });
const db = getFirestore(), now = Date.now(), id = `qualification_inactivity_${now}`;
const ref = db.doc(`analytics_sessions/${id}`);
const record = { startedAt: Timestamp.fromMillis(now - 40 * 60000), lastActivityAt: Timestamp.fromMillis(now - 36 * 60000),
    sessionActive: true, userId: id, type: 'visitor', device: 'Desktop', duration: 240, journeyCount: 1,
    expireAt: Timestamp.fromMillis(now + 86400000), qualification: true, ...sessionIntent({}, now - 36 * 60000, id) };
const result = { id, startedAt: new Date(now).toISOString(), observations: [] };
try {
    await ref.create(record);
    for (let i = 0; i < 24; i++) {
        const data = (await ref.get()).data();
        result.observations.push({ at: new Date().toISOString(), active: data.sessionActive, state: data.maintenanceWork.state,
            result: data.maintenanceWork.result, finalizedBy: data.finalizedBy || null });
        if (!data.sessionActive && data.finalizedBy === 'inactivity_task' && data.maintenanceWork.state === 'succeeded') { result.passed = true; break; }
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
} finally {
    const snap = await ref.get();
    if (snap.exists) {
        if (snap.data().qualification !== true || snap.data().userId !== id) throw Error('FIXTURE_CHANGED');
        result.beforeCleanup = snap.data();
        // Use the existing exclusion mechanism to retract the synthetic contribution.
        const batch = db.batch();
        batch.set(db.doc(`analytics_session_exclusions/${id}`), { reason: 'admin_identity_resolved', expireAt: Timestamp.fromMillis(Date.now() + 7 * 86400000) });
        batch.delete(ref); await batch.commit();
    }
    fs.writeFileSync(`/tmp/${id}.json`, JSON.stringify(result, null, 2), { mode: 0o600 });
}
console.log(JSON.stringify({ id, passed: Boolean(result.passed), observations: result.observations, syntheticSessionRemoved: true }));
if (!result.passed) process.exitCode = 1;
