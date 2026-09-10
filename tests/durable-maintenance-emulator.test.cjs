'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const admin = require('../functions/node_modules/firebase-admin');
const { intent, linkIntent, createDurableWork, writeCompactionIntent } = require('../functions/src/maintenance/durableWork.cjs');
const project = 'demo-secondevie-events';
let app, db;
before(() => {
    assert.equal(process.env.GCLOUD_PROJECT, project);
    assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^(127\.0\.0\.1|localhost):\d+$/);
    assert.ok(!process.env.GOOGLE_APPLICATION_CREDENTIALS);
    app = admin.initializeApp({ projectId: project }, 'event-qualification'); db = app.firestore();
});
after(async () => { if (app) await app.delete(); });

test('real Firestore transaction abort leaves neither business object nor intent', async () => {
    const ref = db.doc('orders/atomic_abort');
    await assert.rejects(db.runTransaction(async tx => {
        tx.create(ref, linkIntent({ checkout: { channel: 'admin_payment_link', status: 'active', expiresAt: new Date().toISOString() } }, ref.id));
        throw Error('injected_abort');
    }), /injected_abort/);
    assert.equal((await ref.get()).exists, false);
});
test('real concurrent delivery fences workers and preserves completed state', async () => {
    const now = Date.now(), ref = db.doc('orders/concurrent');
    const work = intent('link', ref.id, now);
    await ref.set({ maintenanceWork: work });
    let effects = 0, payload, enter, release;
    const entered = new Promise(resolve => { enter = resolve; });
    const engine = createDurableWork({ db, enqueue: async (_kind, data) => { payload = data; },
        execute: async () => { effects++; enter(); await new Promise(resolve => { release = resolve; }); return { outcome: 'expired' }; } });
    try {
        await engine.schedule(work); const first = engine.dispatch({ data: payload }); await entered;
        await assert.rejects(engine.dispatch({ data: payload }), /LEASE_BUSY/);
        release(); await first; await engine.dispatch({ data: payload });
        assert.equal(effects, 1); assert.equal((await ref.get()).data().maintenanceWork.state, 'succeeded');
    } finally { release?.(); await ref.delete(); }
});
test('compaction intent and shard commit together, coalesced concurrent writers', async () => {
    const day = '2026-09-10', ref = db.doc(`sys_analytics_maintenance/${day}`);
    const now = Date.now(), refs = [0, 1].map(i => db.doc(`analytics_rollup_days/${day}/summary_shards/${i}`));
    try {
        await Promise.all(refs.map(shard => db.runTransaction(async tx => {
            await writeCompactionIntent(tx, db, day, now, now + 75 * 86400000);
            tx.set(shard, { sessions: 1 });
        })));
        const first = (await ref.get()).data().maintenanceWork;
        assert.equal(first.state, 'pending');
        assert.equal((await db.doc(`sys_analytics_maintenance/archive_${day}`).get()).data().maintenanceWork.kind, 'archive');
        await db.runTransaction(tx => writeCompactionIntent(tx, db, day, now + 1));
        assert.deepEqual((await ref.get()).data().maintenanceWork, first);
        await db.runTransaction(tx => writeCompactionIntent(tx, db, day, now + 1, now + 75 * 86400000, true));
        assert.equal((await ref.get()).data().maintenanceWork.generation, 1);
        assert.equal((await db.doc(`sys_analytics_maintenance/archive_${day}`).get()).data().maintenanceWork.generation, 1);
        assert.ok((await Promise.all(refs.map(item => item.get()))).every(item => item.exists));
    } finally { await Promise.all([ref, db.doc(`sys_analytics_maintenance/archive_${day}`), ...refs].map(item => item.delete())); }
});
