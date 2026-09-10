'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const admin = require('../functions/node_modules/firebase-admin');
const { runCommerceTransaction } = require('../functions/src/commerce/domain/reconciliationActivity.cjs');
const { createReconciliationWork } = require('../functions/src/commerce/domain/reconciliationWork.cjs');
const { gcGroup, markGcGroup, createGcWork } = require('../functions/src/catalog/gcGroups.cjs');
const { withOutboxMaintenance } = require('../functions/src/commerce/domain/outboxMaintenance');
const { createOutboxRepository } = require('../functions/src/commerce/domain/outboxRepository');
let app, db;
before(() => {
    assert.equal(process.env.GCLOUD_PROJECT, 'demo-secondevie-events');
    assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^(127\.0\.0\.1|localhost):\d+$/);
    app = admin.initializeApp({ projectId: 'demo-secondevie-events' }, 'final-maintenance'); db = app.firestore();
    process.env.COMMERCE_EVENT_MAINTENANCE_MODE = 'durable';
});
after(async () => { if (app) await app.delete(); });
test('transactions réelles concurrentes : commandes et watermark sans perte', async () => {
    const now = Date.parse('2026-09-10T12:00:00Z'), options = { enabled: true, now: () => now };
    const refs = Array.from({ length: 12 }, (_, i) => db.doc(`orders/maintenance_atomic_${i}`));
    await Promise.all(refs.map(ref => runCommerceTransaction(db, tx => tx.set(ref, { schemaVersion: 2 }), options)));
    assert.ok((await db.doc('sys_commerce_reconciliation/2026-09-10').get()).data().dirtyToken);
    assert.ok((await db.doc('sys_commerce_reconciliation_watermark/current').get()).data().token);
    await assert.rejects(runCommerceTransaction(db, tx => { tx.set(db.doc('orders/aborted_maintenance'), {}); throw Error('ABORT'); }, options), /ABORT/);
    assert.equal((await db.doc('orders/aborted_maintenance').get()).exists, false);
    await Promise.all(refs.map(ref => ref.delete()));
});
test('finance réelle : mutation pendant inspection, aucune génération déclarée vérifiée', async () => {
    let now = Date.parse('2026-09-10T12:00:00Z'); const queue = [];
    const work = createReconciliationWork({ db, now: () => now,
        enqueue: async (_kind, data) => queue.push(data), inspect: async () => {
            await runCommerceTransaction(db, tx => tx.set(db.doc('orders/changed_during_inspection'), {}), { enabled: true, now: () => now });
            return { divergences: [] };
        } });
    await work.scheduleDay('2026-09-10'); now = queue.at(-1).due;
    await work.dispatch({ data: queue[0] });
    assert.equal((await db.doc('sys_commerce_reconciliation/2026-09-10').get()).data().verifiedToken, undefined);
    assert.equal(queue.length, 2);
});
test('outbox réelle : claim et son alarme atomiques, début de livraison interdit un renvoi', async () => {
    const id = 'maintenance_outbox', ref = db.doc(`commerce_outbox/${id}`);
    await ref.set(withOutboxMaintenance({ outboxId: id, status: 'pending', attemptCount: 0, nextAttemptAt: 1000 }));
    const repository = createOutboxRepository({ db, refs: { outbox: () => ref } });
    await repository.claim(id, { leaseToken: 'first-lease', nowMillis: 1000, leaseMs: 60000 });
    assert.equal((await ref.get()).data().maintenanceWork.due, 62000);
    await repository.beginDelivery(id, { leaseToken: 'first-lease', nowMillis: 1001 });
    const recovered = await repository.claim(id, { leaseToken: 'recovery-lease', nowMillis: 62000, leaseMs: 60000 });
    assert.equal(recovered.status, 'delivery_unknown');
    assert.equal((await ref.get()).data().maintenanceWork.state, 'needs_attention');
});
test('GC réel : fusion des marqueurs et continuation de page sans perdre les champs', async () => {
    const group = gcGroup('media', 86400000); let now = group.due, inspected = 0; const queue = [];
    await db.runTransaction(async tx => markGcGroup(tx, db, group));
    const engine = createGcWork({ db, now: () => now, enqueue: async (_kind, data) => queue.push(data),
        inspect: async () => ({ report: { deleted: 0 }, cursor: ++inspected === 1 ? 'page1' : null }) });
    await engine.scheduleGroup(group.id); await engine.dispatch({ data: queue[0] });
    now += 60000; await engine.dispatch({ data: queue[1] });
    const record = (await db.doc(`sys_catalog_gc_groups/${group.id}`).get()).data();
    assert.equal(record.maintenanceWork.state, 'succeeded'); assert.equal(record.dirtyToken, record.inspectedToken);
    assert.equal(record.report.deleted, 0);
});
