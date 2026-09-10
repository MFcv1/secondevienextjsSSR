'use strict';
process.env.COMMERCE_EVENT_MAINTENANCE_MODE = 'durable';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createMemory } = require('./helpers/inactivityMemory.cjs');
const { withOutboxMaintenance } = require('../functions/src/commerce/domain/outboxMaintenance');
const { createOutboxRepository } = require('../functions/src/commerce/domain/outboxRepository');
const { createOutboxWorker } = require('../functions/src/commerce/domain/outboxWorker');
const { createOutboxMaintenanceRuntime } = require('../functions/src/commerce/domain/outboxMaintenanceRuntime');

function fixture() {
    const memory = createMemory(), id = 'outbox-fixture-123', path = `commerce_outbox/${id}`;
    let time = 100000, sends = 0, failEnqueue = false;
    const queued = new Map();
    const entry = () => memory.records.get(path);
    memory.records.set(path, withOutboxMaintenance({ outboxId: id, status: 'pending', attemptCount: 0, nextAttemptAt: time }));
    const repository = createOutboxRepository({ db: memory.db, refs: { outbox: value => memory.db.doc(`commerce_outbox/${value}`) } });
    const worker = createOutboxWorker({ repository, clock: { now: () => new Date(time).toISOString(), nowMillis: () => time },
        ids: { leaseToken: () => `lease-token-${time}` }, send: async () => { sends++; return { providerMessageId: 'provider-message' }; } });
    const runtime = createOutboxMaintenanceRuntime({ db: memory.db, worker, now: () => time,
        enqueue: async (_kind, data, options) => { if (failEnqueue) throw Error('QUEUE_DOWN'); queued.set(options.id, data); } });
    return { ...memory, id, entry, repository, runtime, queued,
        get sends() { return sends; }, advance: n => { time += n; }, failEnqueue: flag => { failEnqueue = flag; },
        claim: () => repository.claim(id, { leaseToken: 'abandoned-lease', nowMillis: time, leaseMs: 60000 }),
        begin: () => repository.beginDelivery(id, { leaseToken: 'abandoned-lease', nowMillis: time }),
        async deliver() { await runtime.schedule(entry().maintenanceWork); return runtime.dispatch({ data: [...queued.values()].at(-1) }); }
    };
}

test('commit et enqueue séparés : un refus de queue laisse une intention relivrable', async () => {
    const f = fixture(); f.failEnqueue(true);
    await assert.rejects(f.runtime.schedule(f.entry().maintenanceWork), /QUEUE_DOWN/);
    assert.equal(f.entry().maintenanceWork.state, 'pending');
    f.failEnqueue(false); await f.deliver();
    assert.equal(f.entry().status, 'sent'); assert.equal(f.sends, 1);
    assert.equal(f.entry().maintenanceWork.state, 'succeeded');
});

test('crash après claim avant envoi : échéance atomique et une seule reprise', async () => {
    const f = fixture(); const original = f.entry().maintenanceWork;
    await f.claim();
    assert.equal(f.entry().maintenanceWork.due, 161000);
    assert.notEqual(f.entry().maintenanceWork.version, original.version);
    f.advance(61000); await f.deliver();
    const message = [...f.queued.values()].at(-1);
    await f.runtime.dispatch({ data: message });
    assert.equal(f.sends, 1); assert.equal(f.entry().status, 'sent');
});

test('crash après beginDelivery ou acceptation : résultat inconnu sans second envoi', async () => {
    const f = fixture(); await f.claim(); const work = f.entry().maintenanceWork;
    await f.begin(); assert.deepEqual(f.entry().maintenanceWork, work);
    f.advance(61000); await f.deliver();
    assert.equal(f.sends, 0); assert.equal(f.entry().status, 'delivery_unknown');
    assert.equal(f.entry().maintenanceWork.state, 'needs_attention');
    await f.runtime.dispatch({ data: [...f.queued.values()].at(-1) });
    assert.equal(f.sends, 0);
});

test('transaction avortée : aucun lease métier sans son intention', async () => {
    const f = fixture(); const before = structuredClone(f.entry()); f.rejectCommit();
    await assert.rejects(f.claim(), /ABORTED_COMMIT/); assert.deepEqual(f.entry(), before);
});

test('ancienne livraison et semaine sans activité : aucun effet et aucune nouvelle tâche', async () => {
    const f = fixture(); await f.runtime.schedule(f.entry().maintenanceWork);
    const old = [...f.queued.values()][0]; await f.claim();
    assert.equal((await f.runtime.dispatch({ data: old })).outcome, 'superseded');
    f.advance(61000); await f.deliver(); const count = f.queued.size;
    f.advance(7 * 86400000); await f.runtime.schedule(f.entry().maintenanceWork);
    assert.equal(f.queued.size, count); assert.equal(f.sends, 1);
});

test('budget métier conservé : huitième échec définitif, sans intention de retry', async () => {
    const f = fixture(); f.records.set(`commerce_outbox/${f.id}`, withOutboxMaintenance({ ...f.entry(), attemptCount: 7 }));
    await f.claim();
    await f.repository.markFailed(f.id, { leaseToken: 'abandoned-lease', nowMillis: 100000, errorMessage: 'failure' });
    assert.equal(f.entry().status, 'dead_letter'); assert.equal(f.entry().nextAttemptAt, null);
    assert.equal(f.entry().maintenanceWork.state, 'needs_attention');
});
