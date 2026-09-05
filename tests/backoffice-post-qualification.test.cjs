'use strict';
require('./commerce/helpers/no-network.cjs');
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { createRequire } = require('node:module');
const { planSessionMessage } = require('../functions/src/analytics/sessionSequence');
const { planNewsletterProjection } = require('../functions/src/newsletter/newsletterProjectionDomain');
const { claim } = require('../functions/src/commerce/domain/outboxRepository');
test('I5 : les lecteurs ciblés reconnaissent aussi le nom Cloud Run sans FUNCTION_TARGET', () => {
  const { resolveReaderTarget, targets } = require('../functions/src/admin/readerEntrypoint');
  for (const name of targets) assert.equal(resolveReaderTarget({ K_SERVICE: name.toLowerCase() }), name);
  assert.equal(resolveReaderTarget({}), undefined);
  assert.equal(resolveReaderTarget({ K_SERVICE: 'another-service' }), undefined);
  assert.equal(resolveReaderTarget({ FUNCTION_TARGET: 'explicit', K_SERVICE: targets[0].toLowerCase() }), 'explicit');
});
const timestamp = (seconds) => ({ seconds, nanoseconds: 0 });

function memoryDb(initial) {
    const values = new Map(initial);
    const db = { doc: (key) => ({ path: key }), runTransaction: async (fn) => {
        const writes = [];
        const result = await fn({
            get: async (ref) => ({ exists: values.has(ref.path), data: () => values.get(ref.path), updateTime: timestamp(30) }),
            set: (ref, value) => writes.push([ref.path, value])
        });
        for (const [key, value] of writes) values.set(key, value);
        return result;
    } };
    return { db, values };
}

test('I3 / BA-01 : résolution puis ancienne création conserve les sept autres demandes', async () => {
    const sourcePath = 'orders/synthetic/customer_return_requests/request';
    const { db, values } = memoryDb([
        ['admin_action_summary/current', { pendingReturns: 7, revision: 1, ledgerBaselineReady: true }],
        [sourcePath, { status: 'completed' }]
    ]);
    let handler;
    const file = path.resolve('functions/src/admin/actionSummaryProjection.js');
    const actualRequire = createRequire(file);
    const firestore = () => db;
    firestore.FieldValue = { serverTimestamp: () => timestamp(30) };
    const testModule = { exports: {} };
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), { module: testModule, exports: testModule.exports, console: { info() {} },
        require: (name) => name === 'firebase-admin' ? { firestore }
            : name === 'firebase-functions/v2/firestore' ? { onDocumentWritten: (_options, callback) => { handler = callback; return callback; } }
                : actualRequire(name)
    }, { filename: file });
    const snapshot = (value, time) => ({ exists: value !== null, data: () => value, ref: { path: sourcePath }, updateTime: timestamp(time) });
    for (const [before, after, at] of [[{ status: 'pending_review' }, { status: 'completed' }, 20], [null, { status: 'pending_review' }, 10]]) {
        await handler({ params: {}, data: { before: snapshot(before, at - 1), after: snapshot(after, at) } });
    }
    assert.equal(values.get('admin_action_summary/current').pendingReturns, 7);
});

test('I3 / BA-02 : suppression avant création conserve vingt contacts ; baseline ancienne explicite', () => {
    const deleted = planNewsletterProjection({ currentCount: 20, ledger: null, baselineMember: false, present: false, sourceUpdateTime: timestamp(20), eventId: 'delete' });
    assert.equal(deleted.activeCount, 20);
    assert.equal(planNewsletterProjection({ currentCount: 20, ledger: { present: false, sourceUpdateTime: timestamp(20) }, present: true, sourceUpdateTime: timestamp(10), eventId: 'create' }).activeCount, 20);
    assert.equal(planNewsletterProjection({ currentCount: 20, baselineMember: true, present: false, sourceUpdateTime: timestamp(20), eventId: 'baseline-delete' }).activeCount, 19);
    assert.throws(() => planNewsletterProjection({ currentCount: 20, present: false, sourceUpdateTime: timestamp(20), eventId: 'ambiguous' }), /MEMBERSHIP_REQUIRED/);
});

test('I3 / BA-03 : événement 60 s après source 120 s ne fait pas régresser le fait', async () => {
    const { materializeSessionFact } = require('../functions/src/analytics/rollups');
    const session = { startedAt: Date.parse('2026-09-04T12:00:00Z'), duration: 120, sessionActive: false, type: 'anonymous', journey: [] };
    const { db, values } = memoryDb([['analytics_sessions/synthetic', session]]);
    await materializeSessionFact('synthetic', session, db);
    await materializeSessionFact('synthetic', { ...session, duration: 60 }, db);
    assert.equal(values.get('analytics_session_facts/synthetic').contribution.duration, 120);
    values.delete('analytics_sessions/synthetic');
    assert.equal(await materializeSessionFact('synthetic', session, db), 'ignored');
});

test('I3 / BA-04 : fermeture 120 s, ancien heartbeat, reprise et ancien beacon', () => {
    let current = { syncGeneration: 'generation-a', syncSequence: 0 };
    const apply = (sequence, duration, sessionActive) => {
        const result = planSessionMessage(current, { syncGeneration: 'generation-a', syncSequence: sequence }, { duration, sessionActive });
        if (result.updates) current = { ...current, ...result.updates };
        return result;
    };
    apply(2, 120, false);
    assert.equal(apply(1, 60, true).stale, true);
    assert.equal(current.duration, 120);
    assert.equal(current.sessionActive, false);
    apply(3, 130, true);
    apply(2, 120, false);
    assert.equal(current.sessionActive, true);
    assert.equal(planSessionMessage(current, { syncGeneration: 'old', syncSequence: 99 }, {}).generationMismatch, true);
});

test('I6 / BA-09 : échéance, tentative obsolète et interruption avant persistance', () => {
    const entry = { status: 'failed', attemptCount: 2, nextAttemptAt: 60000 };
    const lease = { leaseToken: 'test-lease-token', nowMillis: 1000, leaseMs: 60000 };
    assert.throws(() => claim(entry, lease), /NOT_DUE/);
    assert.throws(() => claim(entry, { ...lease, nowMillis: 60000, expectedAttemptCount: 1 }), /STALE_ATTEMPT/);
    const taken = claim(entry, { ...lease, nowMillis: 60000, expectedAttemptCount: 2, expectedNextAttemptAt: 60000 });
    assert.equal(taken.attemptCount, 3);
    assert.equal(claim({ ...taken, deliveryStartedAt: 60001 }, { ...lease, nowMillis: 120001 }).status, 'delivery_unknown');
});

test('I4 : une commande entièrement remboursée ne lit pas de tentative au seul affichage de liste', async () => {
    const { makeOrder, fixedClock } = require('./commerce/fixtures/order-v2.cjs');
    const { reduceOrder } = require('../functions/src/commerce/domain/orderState');
    const { serializeAdminOrder } = require('../functions/src/commerce/v2OrderQueries');
    const base = makeOrder();
    const options = { clock: fixedClock() };
    const paid = reduceOrder(base, { type: 'payment_succeeded', amountCents: base.amounts.totalCents, currency: 'EUR' }, options);
    const pending = reduceOrder(paid, { type: 'refund_requested', amountCents: base.amounts.totalCents }, options);
    const order = reduceOrder(pending, { type: 'refund_confirmed', amountCents: base.amounts.totalCents }, options);
    let reads = 0;
    const snapshot = { id: 'local-order', data: () => order, ref: { collection: () => { reads += 1; throw new Error('Unexpected detail read'); } } };
    const result = await serializeAdminOrder(snapshot, { uid: 'local-admin', role: 'admin', aal2: true }, { compact: true });
    assert.equal(reads, 0);
    assert.equal(result.refundDetailsDeferred, true);
});

test('I4 détail exact réservé au lecteur admin ; le lecteur client reste filtré par propriétaire', async () => {
    const { createListOrdersAdminHandler, createListMyOrdersHandler } = require('../functions/src/commerce/v2OrderQueries');
    let reads = 0;
    await assert.rejects(createListOrdersAdminHandler({ authorize: async () => { throw new Error('Denied'); }, dbFactory: () => { reads += 1; } })({orderId:'another-order'},{}),/Denied/);
    assert.equal(reads,0);
    const query = { where: (field,operator,uid) => { assert.deepEqual([field,operator,uid],['userId','==','owner']); return query; }, orderBy: () => query, limit: () => query, get: async () => ({size:0,docs:[]}), doc: () => { throw new Error('Exact cross-owner read forbidden'); } };
    const result = await createListMyOrdersHandler({ authorize: () => 'owner', dbFactory: () => ({collection:()=>query}) })({orderId:'another-order'},{});
    assert.deepEqual(result.orders,[]);
});
