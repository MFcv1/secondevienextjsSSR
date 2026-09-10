'use strict';
const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const admin = require('../functions/node_modules/firebase-admin');
const { initializeTestEnvironment, assertFails } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc } = require('firebase/firestore');
const { trackingPatch, migrationPatch, createGroupedInactivity, INACTIVITY_MS } = require('../functions/src/maintenance/groupedInactivity.cjs');
const { createDurableWork } = require('../functions/src/maintenance/durableWork.cjs');
const project = 'demo-secondevie-events';
let app, db, rules, time, queue, worker;
before(async () => {
    assert.equal(process.env.GCLOUD_PROJECT, project);
    assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^(localhost|127\.0\.0\.1):\d+$/);
    assert.ok(!process.env.GOOGLE_APPLICATION_CREDENTIALS);
    app = admin.initializeApp({ projectId: project }, 'grouped-qualification'); db = app.firestore();
    const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
    rules = await initializeTestEnvironment({ projectId: project, firestore: { host, port: Number(port), rules: fs.readFileSync('firestore.rules', 'utf8') } });
});
beforeEach(async () => {
    await rules.clearFirestore(); time = Date.parse('2026-09-10T12:00:00Z'); queue = [];
    const grouped = createGroupedInactivity({ db, now: () => time, pageSize: 2 });
    worker = createDurableWork({ db, now: () => time, execute: grouped.dispatch,
        enqueue: async (_kind, data) => { queue.push(data); } });
});
after(async () => { await rules?.cleanup(); await app?.delete(); });
async function create(id) {
    const ref = db.doc(`analytics_sessions/${id}`);
    await db.runTransaction(async tx => {
        const patch = await trackingPatch(tx, db, id, null, true, time, { mode: 'grouped', partitions: 1 });
        tx.create(ref, { sessionActive: true, type: 'visitor', duration: 42, lastActivityAt: admin.firestore.Timestamp.fromMillis(time), ...patch });
    });
    return ref;
}
async function firstGroup() { return (await db.collection('analytics_inactivity_groups').limit(1).get()).docs[0]; }
const members = id => db.collection('analytics_sessions').where('sessionActive', '==', true).where('inactivityGroup.groupId', '==', id);
test('concurrent enrollment creates one group and all members; aborted commit is atomic', async () => {
    await Promise.all(Array.from({ length: 12 }, (_, i) => create(`visitor${i}`)));
    const roots = await db.collection('analytics_inactivity_groups').get(); assert.equal(roots.size, 1);
    assert.equal((await members(roots.docs[0].id).get()).size, 12);
    await assert.rejects(db.runTransaction(async tx => {
        const patch = await trackingPatch(tx, db, 'aborted', null, true, time, { mode: 'grouped', partitions: 1 });
        tx.create(db.doc('analytics_sessions/aborted'), { ...patch, sessionActive: true }); throw Error('ABORT');
    }), /ABORT/);
    assert.equal((await db.doc('analytics_sessions/aborted').get()).exists, false);
    assert.equal((await members(roots.docs[0].id).get()).size, 12);
});
test('real pages and duplicate delivery close each session once and empty the group', async () => {
    for (let i = 0; i < 5; i++) await create(`visitor${i}`);
    const group = await firstGroup(); await worker.schedule(group.data().maintenanceWork); time += INACTIVITY_MS;
    const first = queue[0]; await worker.dispatch({ data: first });
    time += 1000; await worker.dispatch({ data: queue.at(-1) });
    time += 1000; await worker.dispatch({ data: queue.at(-1) });
    await worker.dispatch({ data: first });
    const sessions = await db.collection('analytics_sessions').get();
    assert.ok(sessions.docs.every(s => s.data().sessionActive === false && s.data().duration === 42));
    assert.equal((await members(group.id).get()).size, 0);
    assert.equal((await group.ref.get()).data().maintenanceWork.state, 'succeeded');
});
test('migration back to individual ownership prevents pending group effects', async () => {
    const ref = await create('visitor'); const group = await firstGroup(); await worker.schedule(group.data().maintenanceWork);
    await db.runTransaction(async tx => {
        const current = (await tx.get(ref)).data(); const patch = await migrationPatch(tx, db, ref.id, current, 'individual', time);
        tx.update(ref, patch);
    });
    time += INACTIVITY_MS; await worker.dispatch({ data: queue[0] });
    const session = (await ref.get()).data(); assert.equal(session.sessionActive, true);
    assert.equal(session.inactivityGroup.mode, 'individual'); assert.equal(session.maintenanceWork.state, 'pending');
});
test('new heartbeat after scheduling moves membership atomically to a later group', async () => {
    const ref = await create('visitor'); const old = await firstGroup(); await worker.schedule(old.data().maintenanceWork);
    time += INACTIVITY_MS - 60000;
    await ref.update({ lastActivityAt: admin.firestore.Timestamp.fromMillis(time) });
    time += 60000; await worker.dispatch({ data: queue[0] });
    const session = (await ref.get()).data();
    assert.equal(session.sessionActive, true); assert.notEqual(session.inactivityGroup.groupId, old.id);
    assert.equal((await members(old.id).get()).size, 0);
    assert.equal((await members(session.inactivityGroup.groupId).get()).size, 1);
});
test('browser access to group roots and authoritative sessions is forbidden, including admin claims', async () => {
    for (const context of [rules.unauthenticatedContext(), rules.authenticatedContext('admin', { admin: true })]) {
        const client = context.firestore();
        for (const path of ['analytics_inactivity_groups/test', 'analytics_sessions/test']) {
            await assertFails(getDoc(doc(client, path))); await assertFails(setDoc(doc(client, path), { value: true }));
        }
    }
});
