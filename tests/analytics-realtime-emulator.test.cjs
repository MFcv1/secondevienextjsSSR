'use strict';
const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const admin = require('node:module').createRequire(path.resolve(__dirname, '../functions/package.json'))('firebase-admin');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, getDocs, collection, query, where, documentId, limit, orderBy, onSnapshot } = require('firebase/firestore');
const { buildSeed, projectSession } = require('../functions/src/analytics/realtime');
const PROJECT = 'demo-secondevie-analytics';
let environment; let db; let app;
const now = Date.parse('2026-09-04T12:00:00Z');
const since = Date.parse('2026-04-30T22:00:00Z');

before(async () => {
    assert.equal(process.env.GCLOUD_PROJECT, PROJECT);
    assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^(127\.0\.0\.1|localhost):\d+$/);
    assert.ok(!process.env.GOOGLE_APPLICATION_CREDENTIALS);
    environment = await initializeTestEnvironment({ projectId: PROJECT,
        firestore: { rules: fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8') } });
    app = admin.initializeApp({ projectId: PROJECT }, 'realtime-emulator');
    db = app.firestore();
});
beforeEach(async () => {
    await environment.clearFirestore();
    const seed = buildSeed({ epoch: 'emulator', mutableSinceMs: since, coverageStartMs: since, now });
    const batch = db.batch();
    batch.set(db.doc('analytics_realtime_control/current'), { ...seed.control, mode: 'shadow', bootstrapComplete: true });
    batch.set(db.doc('admin_analytics_realtime/recent'), seed.recent);
    batch.set(db.doc('admin_analytics_realtime/history'), seed.history);
    await batch.commit();
});
after(async () => { await environment?.cleanup(); await app?.delete(); });

test('live cards/detail stream securely, deduplicate replays and disappear after admin exclusion', async () => {
    const { projectLiveSession } = require('../functions/src/analytics/liveSessions');
    await db.doc('sys_admin_access/admin').set({ active: true });
    const strong = environment.authenticatedContext('admin', { admin: true, firebase: { sign_in_provider: 'google.com' } }).firestore();
    const client = environment.authenticatedContext('client').firestore();
    const ref = db.doc('analytics_sessions/live-fixture');
    await ref.set({ startedAt: now, lastActivityAt: now, userId: 'private', sessionActive: true, journey: [{ page: 'gallery', timestampMs: now }] });
    assert.equal(await projectLiveSession(ref.id, db), 2);
    assert.equal(await projectLiveSession(ref.id, db), 0);
    const liveQuery = query(collection(strong, 'admin_analytics_sessions'), orderBy('lastActivityAt', 'desc'), limit(10));
    await assertSucceeds(getDocs(liveQuery));
    await assertFails(getDocs(collection(strong, 'admin_analytics_sessions')));
    await assertFails(getDocs(query(collection(strong, 'admin_analytics_sessions'), limit(11))));
    await assertFails(getDoc(doc(client, 'admin_analytics_sessions/live-fixture')));
    await assertFails(getDoc(doc(strong, 'analytics_sessions/live-fixture')));
    await assertFails(setDoc(doc(strong, 'admin_analytics_sessions/live-fixture'), {}));
    await assertSucceeds(getDoc(doc(strong, 'admin_analytics_session_details/live-fixture')));
    await assertFails(getDocs(collection(strong, 'admin_analytics_session_details')));
    const observed = [];
    let stop;
    const removed = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('LIVE_CALLBACK_TIMEOUT')), 10000);
        stop = onSnapshot(liveQuery, snapshot => { observed.push(snapshot.size); if (snapshot.empty) { clearTimeout(timer); resolve(); } }, reject);
    });
    await ref.update({ lastActivityAt: now + 60000 });
    assert.equal(await projectLiveSession(ref.id, db), 1); // heartbeat does not rewrite detail
    await ref.update({ journey: [{ page: 'gallery' }, { page: 'detail', itemId: 'chair' }], journeyCount: 2 });
    assert.equal(await projectLiveSession(ref.id, db), 2);
    assert.equal((await getDoc(doc(strong, 'admin_analytics_session_details/live-fixture'))).data().journey.length, 2);
    await db.doc('analytics_session_exclusions/live-fixture').set({ reason: 'admin_identity_resolved' });
    await Promise.all([projectLiveSession(ref.id, db), projectLiveSession(ref.id, db)]);
    await removed; stop();
    assert.ok(observed.includes(0));
    assert.equal((await db.doc('admin_analytics_session_details/live-fixture').get()).exists, false);
    await ref.delete();
    assert.equal(await projectLiveSession(ref.id, db), 'removed');
});

test('bootstrap is create-only, resumable, verified before shadow and catches paused mutations', async () => {
    const { bootstrap } = await import('../scripts/bootstrap-analytics-realtime-sandbox.mjs');
    const { createHash } = require('node:crypto');
    await environment.clearFirestore();
    const clock = Date.now();
    const data = { startedAt: clock - 1000, sessionActive: true, userId: 'synthetic' };
    const ref = db.doc('analytics_sessions/bootstrap');
    await ref.create(data);
    const source = await ref.get();
    const input = { epoch: 'bootstrap', mutableSinceMs: since, coverageStartMs: since, now: clock,
        sessions: [{ id: 'bootstrap', data, updateTime: source.updateTime }] };
    const seed = buildSeed(input);
    const digest = createHash('sha256').update(JSON.stringify(seed)).digest('hex');
    await assert.rejects(bootstrap(db, input, 'bad', 'seed'), /DIGEST/);
    const first = await bootstrap(db, input, digest, 'seed');
    assert.ok(first.created > 0);
    assert.equal((await bootstrap(db, input, digest, 'seed')).created, 0);
    // Event ignored while paused must be recovered from the source after activation.
    await ref.update({ sessionActive: false, duration: 30, journeyCount: 2 });
    const activated = await bootstrap(db, input, digest, 'activate');
    assert.equal(activated.outcomes.updated, 1);
    assert.equal((await db.doc('admin_analytics_realtime/history').get()).data().buckets.year_2026.duration, 30);
    assert.equal((await bootstrap(db, input, digest, 'activate')).outcomes.noop, 1);
    await assert.rejects(bootstrap(db, input, digest, 'seed'), /NOT_PAUSED/);
    assert.equal((await bootstrap(db, input, digest, 'pause')).mode, 'paused');
    assert.equal((await ref.get()).data().duration, 30);
});

test('parallel sources/replays are atomic, latest source wins and full timestamps are retained', async () => {
    await Promise.all(['a', 'b', 'c'].map(id => db.doc(`analytics_sessions/${id}`).set({
        userId: id, startedAt: admin.firestore.Timestamp.fromMillis(now), sessionActive: true, device: 'Mobile'
    })));
    await Promise.all(['a', 'b', 'c'].map(id => projectSession(id, db, now)));
    await Promise.all(['c', 'b', 'a'].map(id => projectSession(id, db, now)));
    let current = (await db.doc('admin_analytics_realtime/history').get()).data();
    assert.equal(current.buckets.year_2026.sessions, 3);
    assert.equal(current.revision, 4);
    // Delivered event payload is irrelevant: only the current document is read.
    await db.doc('analytics_sessions/a').update({ duration: 42, sessionActive: false, journeyCount: 3 });
    await projectSession('a', db, now);
    current = (await db.doc('admin_analytics_realtime/history').get()).data();
    assert.equal(current.buckets.year_2026.duration, 42);
    const ledgers = await db.collection('analytics_realtime_ledgers').get();
    assert.equal(ledgers.size, 3);
    for (const ledger of ledgers.docs) {
        assert.ok(Number.isSafeInteger(ledger.data().sourceVersion.seconds));
        assert.ok(Number.isSafeInteger(ledger.data().sourceVersion.nanoseconds));
    }
    const recent = (await db.doc('admin_analytics_realtime/recent').get()).data();
    assert.equal(recent.revision, current.revision);
});

test('admin exclusion races with delayed delivery without resurrection; TTL keeps history', async () => {
    await db.doc('analytics_sessions/client').set({ userId: 'user', startedAt: now, sessionActive: true });
    await projectSession('client', db, now);
    const batch = db.batch();
    batch.set(db.doc('analytics_session_exclusions/client'), { reason: 'admin_identity_resolved' });
    batch.delete(db.doc('analytics_sessions/client'));
    await batch.commit();
    await Promise.all([projectSession('client', db, now), projectSession('client', db, now)]);
    assert.equal((await db.doc('admin_analytics_realtime/history').get()).data().buckets.year_2026.sessions, 0);
    await db.doc('analytics_sessions/other').set({ userId: 'other', startedAt: now, sessionActive: true });
    await projectSession('other', db, now);
    await db.doc('analytics_sessions/other').delete();
    await projectSession('other', db, now);
    assert.equal((await db.doc('admin_analytics_realtime/history').get()).data().buckets.year_2026.sessions, 1);
});

test('two public projections require strong admin; raw state never readable or writable', async () => {
    await db.doc('sys_admin_access/admin').set({ active: true });
    await db.doc('sys_admin_access/revoked').set({ active: false });
    const strong = environment.authenticatedContext('admin', { admin: true, firebase: { sign_in_provider: 'google.com' } }).firestore();
    const denied = [environment.unauthenticatedContext().firestore(), environment.authenticatedContext('client').firestore(),
        environment.authenticatedContext('admin', { admin: true, firebase: { sign_in_provider: 'password' } }).firestore(),
        environment.authenticatedContext('revoked', { admin: true, firebase: { sign_in_provider: 'google.com' } }).firestore()];
    await assertSucceeds(getDocs(query(collection(strong, 'admin_analytics_realtime'), where(documentId(), 'in', ['recent', 'history']))));
    await assertFails(getDocs(collection(strong, 'admin_analytics_realtime')));
    for (const client of denied) await assertFails(getDoc(doc(client, 'admin_analytics_realtime/recent')));
    for (const client of [...denied, strong]) {
        await assertFails(setDoc(doc(client, 'admin_analytics_realtime/recent'), { revision: 9 }));
        for (const target of ['analytics_realtime_ledgers/test', 'analytics_realtime_buckets/year_2026', 'analytics_realtime_control/current']) {
            await assertFails(getDoc(doc(client, target)));
            await assertFails(setDoc(doc(client, target), {}));
        }
    }
});
