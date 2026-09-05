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

test('Data : résultat métier distant, reprise après pause et réseau, sans faux zéro', async () => {
    const { createAnalyticsChannel, validateAnalyticsSnapshot, realtimeOverview } = await import('../src/kit/admin/adminAnalyticsRealtimeStore.js');
    const { disableNetwork, enableNetwork } = require('firebase/firestore');
    await db.doc('sys_admin_access/admin').set({ active: true });
    const client = environment.authenticatedContext('admin', { admin: true, firebase: { sign_in_provider: 'google.com' } }).firestore();
    let starts = 0;
    const channel = createAnalyticsChannel((next, error) => {
        starts++;
        return onSnapshot(query(collection(client, 'admin_analytics_realtime'), where(documentId(), 'in', ['recent', 'history'])), { includeMetadataChanges: true }, next, error);
    }, validateAnalyticsSnapshot);
    const waitFor = (count, status = 'ready') => new Promise((resolve, reject) => {
        const timer = setTimeout(() => { stop(); reject(new Error(`Expected ${count} sessions / ${status}`)); }, 10000);
        const check = () => {
            const state = channel.getSnapshot();
            if (state.status === status && realtimeOverview(state.data, '7j', now)?.kpis.totalSessions === count) {
                clearTimeout(timer); stop(); resolve();
            }
        };
        const stop = channel.subscribe(check);
        check();
    });
    const update = async (id) => {
        await db.doc(`analytics_sessions/${id}`).set({ userId: id, startedAt: now, sessionActive: true });
        await projectSession(id, db, now);
    };
    channel.setOwner('admin'); channel.start();
    try {
        await waitFor(0);
        await update('visible'); await waitFor(1);
        for (let i = 0; i < 30; i++) { const off = channel.subscribe(() => {}); off(); channel.start(); }
        assert.equal(starts, 1);
        channel.pause(); await update('hidden');
        await waitFor(1, 'cached'); channel.start(); await waitFor(2);
        await disableNetwork(client); await waitFor(2, 'cached');
        await update('offline');
        assert.equal(realtimeOverview(channel.getSnapshot().data, '7j', now).kpis.totalSessions, 2);
        await enableNetwork(client); await waitFor(3);
        await projectSession('offline', db, now); await waitFor(3);
        channel.setOwner('another-admin'); assert.equal(channel.getSnapshot().data, null);
    } finally { channel.clear(); await client.terminate(); }
});

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

test('Stats : projection distante visible, grâce expirée et reprise après masquage', async () => {
    const { createRetainedRead } = await import('../src/kit/admin/retainedRead.js');
    await db.doc('sys_admin_access/stats-admin').set({ active: true });
    const client = environment.authenticatedContext('stats-admin', { admin: true, firebase: { sign_in_provider: 'google.com' } }).firestore();
    const ref = db.doc('admin_dashboard/finance');
    await ref.set({ netRevenueCents: 12500, revision: 1 });
    let expire, visibilityChanged, starts=0, stops=0;
    const visibility = { visibilityState:'visible', addEventListener:(_name,fn)=>{visibilityChanged=fn;}, removeEventListener:()=>{} };
    const read = createRetainedRead((next,error)=>{
        starts++;
        const off=onSnapshot(doc(client,'admin_dashboard/finance'),{includeMetadataChanges:true},next,error);
        return ()=>{stops++;off();};
    }, {visibility:()=>visibility,schedule:fn=>{expire=fn;return 1;},cancel:()=>{expire=null;}});
    const waitFor = (amount, cached=false) => new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>{off();reject(new Error(`Expected revenue ${amount}`));},10000);
        let off=()=>{};
        const check=snapshot=>{
            if(snapshot.data()?.netRevenueCents===amount && snapshot.metadata.fromCache===cached){clearTimeout(timer);queueMicrotask(()=>off());resolve();}
        };
        off=read.subscribe(check,reject);
    });
    let off=read.subscribe(()=>{},()=>{});
    try {
        await waitFor(12500);
        await ref.update({netRevenueCents:25000,revision:2}); await waitFor(25000);
        for(let i=0;i<30;i++){off();off=read.subscribe(()=>{},()=>{});}
        assert.equal(starts,1);
        off(); await Promise.resolve(); expire(); assert.equal(stops,1);
        await ref.update({netRevenueCents:37500,revision:3});
        assert.equal(read.get().data().netRevenueCents,25000);
        off=read.subscribe(()=>{},()=>{}); await waitFor(37500);
        visibility.visibilityState='hidden'; visibilityChanged();
        await ref.update({netRevenueCents:50000,revision:4});
        assert.equal(read.get().data().netRevenueCents,37500);
        visibility.visibilityState='visible'; visibilityChanged(); await waitFor(50000);
        assert.equal(starts,3);
    } finally { off();read.clear();await client.terminate(); }
});

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
