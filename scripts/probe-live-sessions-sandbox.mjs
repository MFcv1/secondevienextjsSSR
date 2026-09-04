// Four bounded phases, synthetic source only; always withdraws the test session.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const admin = require('../functions/node_modules/firebase-admin');
if (!process.argv.includes('--project=secondevienextjsssr') || process.env.APPROVAL !== 'LIVE_SESSIONS_SANDBOX' || process.env.FIRESTORE_EMULATOR_HOST) throw new Error('PROBE_AUTHORIZATION');
const app = admin.initializeApp({ projectId: 'secondevienextjsssr' });
const db = app.firestore();
const id = `live-probe-${Date.now()}`;
const source = db.doc(`analytics_sessions/${id}`);
let card, detail, failure, changedAt = 0, phase = 'initial', withdrawn = false;
const samples = [];
const stops = [];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(predicate) {
    const deadline = Date.now() + 45000;
    while (!predicate()) {
        if (failure) throw failure;
        if (Date.now() > deadline) throw new Error('LIVE_PROBE_TIMEOUT');
        await delay(100); // local listener state only, no cloud polling
    }
    samples.push({ phase, sourceToCallbackMs: Date.now() - changedAt });
    console.log(JSON.stringify({ phase, id, sourceToCallbackMs: Date.now() - changedAt }));
}
async function withdraw() {
    if (withdrawn) return;
    const batch = db.batch();
    batch.set(db.doc(`analytics_session_exclusions/${id}`), { reason: 'admin_identity_resolved', expireAt: admin.firestore.Timestamp.fromMillis(Date.now() + 7 * 86400000) });
    batch.delete(source); await batch.commit(); withdrawn = true;
}
try {
    for (const [name, assign] of [['admin_analytics_sessions', value => { card = value; }], ['admin_analytics_session_details', value => { detail = value; }]]) {
        stops.push(db.doc(`${name}/${id}`).onSnapshot(snapshot => assign(snapshot.exists ? snapshot.data() : null), error => { failure = error; }));
    }
    phase = 'created'; changedAt = Date.now();
    await source.create({ startedAt: admin.firestore.Timestamp.now(), lastActivityAt: admin.firestore.Timestamp.now(),
        userId: id, type: 'visitor', sessionActive: true, device: 'Desktop', os: 'Linux', browser: 'Firefox',
        journey: [{ page: 'gallery', timestampMs: Date.now(), duration: 0 }], journeyCount: 1,
        expireAt: admin.firestore.Timestamp.fromMillis(Date.now() + 3600000) });
    await waitFor(() => card?.sessionActive && detail?.journey.length === 1);
    await delay(45000);
    phase = 'journey-updated'; changedAt = Date.now();
    await source.update({ lastActivityAt: admin.firestore.Timestamp.now(), journeyCount: 2, duration: 45,
        journey: [{ page: 'gallery', timestampMs: Date.now() - 45000, duration: 0 }, { page: 'category', itemId: 'tables | Libelle non recopie', timestampMs: Date.now(), duration: 45 }] });
    await waitFor(() => card?.journeyCount === 2 && detail?.journey.length === 2);
    await delay(30000);
    phase = 'closed'; changedAt = Date.now();
    await source.update({ sessionActive: false, lastActivityAt: admin.firestore.Timestamp.now(), duration: 75 });
    await waitFor(() => card?.sessionActive === false);
    await delay(15000);
    phase = 'withdrawn'; changedAt = Date.now(); await withdraw();
    await waitFor(() => card === null && detail === null);
    assert.equal((await source.get()).exists, false);
    console.log(JSON.stringify({ success: true, samples, cleanup: 'source and both projections absent; exclusion expires in 7 days' }));
} finally {
    await withdraw();
    stops.forEach(stop => stop()); await app.delete();
}
