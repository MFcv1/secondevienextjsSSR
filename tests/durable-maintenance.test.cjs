'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { intent, linkIntent, sessionIntent, createDurableWork, FIELD } = require('../functions/src/maintenance/durableWork.cjs');
const { createActivityMaintenance } = require('../functions/src/maintenance/activityMaintenanceCore.cjs');
const { inspectInbox } = require('../functions/src/maintenance/inboxCheck.cjs');
const { inspectPayment, finishLinkWork } = require('../functions/src/maintenance/paymentCheck.cjs');
const { createInboxEntry, claimInbox, markInboxProcessed } = require('../functions/src/commerce/domain/webhookInbox');
const NOW = Date.parse('2026-09-10T12:00:00Z');

function harness(initial = {}, effect = async () => ({ outcome: 'completed' })) {
    let time = NOW, tail = Promise.resolve(), offline = false, failCommit = false;
    const records = new Map(Object.entries(structuredClone(initial))), queue = new Map(), observations = [];
    let deliveries = 0;
    const snapshot = path => ({ exists: records.has(path), data: () => structuredClone(records.get(path)) });
    const db = { doc: path => ({ path, get: async () => snapshot(path) }), runTransaction: fn => {
        const result = tail.then(async () => {
            const writes = [];
            const result = await fn({ get: async ref => snapshot(ref.path),
                update: (ref, values) => writes.push([ref.path, { ...records.get(ref.path), ...values }]),
                set: (ref, values) => writes.push([ref.path, values]) });
            if (failCommit) { failCommit = false; throw Error('commit_lost'); }
            for (const [path, value] of writes) records.set(path, structuredClone(value));
            return result;
        });
        tail = result.catch(() => {}); return result;
    } };
    const worker = createDurableWork({ db, now: () => time, execute: request => effect(request, api),
        observe: (state, data) => observations.push({ state, ...data }),
        enqueue: async (_kind, data, options) => {
            deliveries++;
            if (offline) throw Error('queue_unavailable');
            if (queue.has(options.id)) throw Object.assign(Error('exists'), { code: 6 });
            queue.set(options.id, data);
        } });
    const api = { db, worker, queue, records, observations, deliveries: () => deliveries,
        now: () => time, advance: ms => { time += ms; }, offline: value => { offline = value; },
        failCommit: () => { failCommit = true; },
        work: (path = 'orders/link1') => structuredClone(records.get(path)?.[FIELD]),
        deliver: data => worker.dispatch({ data: data || [...queue.values()].at(-1) }) };
    return api;
}
const initialLink = () => ({ 'orders/link1': { checkout: { channel: 'admin_payment_link', status: 'active', expiresAt: new Date(NOW).toISOString() }, [FIELD]: intent('link', 'link1', NOW) } });

test('idle seven days produces no invocation, task or document', async () => {
    const h = harness(); h.advance(7 * 86400000);
    assert.deepEqual(await h.worker.schedule(null), { outcome: 'ignored' });
    assert.equal(h.deliveries(), 0); assert.equal(h.records.size, 0);
});
test('pure creation/extension intent preserves identity until the expiry changes', () => {
    const order = initialLink()['orders/link1'];
    assert.equal(linkIntent(order, 'link1'), order);
    const extended = linkIntent({ ...order, checkout: { ...order.checkout, expiresAt: new Date(NOW + 1000).toISOString() } }, 'link1');
    assert.notEqual(extended[FIELD].version, order[FIELD].version);
    assert.equal(extended[FIELD].operationId, order[FIELD].operationId);
    assert.deepEqual(sessionIntent({ type: 'admin' }, NOW, 'session'), {});
    assert.deepEqual(sessionIntent({ sessionActive: true, [FIELD]: intent('session', 'session', NOW) }, NOW, 'session'), {});
    const first = sessionIntent({}, NOW, 'session');
    const next = sessionIntent({ ...first, sessionActive: false }, NOW, 'session');
    assert.notEqual(first[FIELD].version, next[FIELD].version);
    assert.throws(() => intent('constructor', 'id', NOW), /INVALID/);
});
test('commit before enqueue survives queue outage; replay uses one task identity', async () => {
    const h = harness(initialLink()); h.offline(true);
    await assert.rejects(h.worker.schedule(h.work()), /queue_unavailable/);
    assert.equal(h.work().state, 'pending'); h.offline(false);
    await h.worker.schedule(h.work()); await h.worker.schedule(h.work());
    assert.equal(h.queue.size, 1); assert.equal(h.work().state, 'scheduled');
});
test('enqueue success before acknowledgement commit failure is safely replayable', async () => {
    const h = harness(initialLink()); h.failCommit();
    await assert.rejects(h.worker.schedule(h.work()), /commit_lost/);
    assert.equal(h.work().state, 'pending'); assert.equal(h.queue.size, 1);
    await h.worker.schedule(h.work()); assert.equal(h.queue.size, 1); assert.equal(h.work().state, 'scheduled');
});
test('completed work and duplicate task apply effect once', async () => {
    let effects = 0;
    const h = harness(initialLink(), async () => { effects++; return { outcome: 'expired' }; });
    await h.worker.schedule(h.work()); await h.deliver(); await h.deliver();
    assert.equal(effects, 1); assert.equal(h.work().state, 'succeeded');
});
test('extension invalidates an old delivery without executing it', async () => {
    let effects = 0; const h = harness(initialLink(), async () => { effects++; });
    await h.worker.schedule(h.work());
    h.records.get('orders/link1')[FIELD] = intent('link', 'link1', NOW + 1000);
    assert.equal((await h.deliver()).outcome, 'superseded'); assert.equal(effects, 0);
});
test('concurrent worker cannot acquire a live lease', async () => {
    let release, entered;
    const started = new Promise(resolve => { entered = resolve; });
    const h = harness(initialLink(), async () => { entered(); await new Promise(resolve => { release = resolve; }); return { outcome: 'expired' }; });
    await h.worker.schedule(h.work()); const first = h.deliver(); await started;
    await assert.rejects(h.deliver(), /LEASE_BUSY/); release(); await first;
    assert.equal(h.work().state, 'succeeded');
});
test('effect failure has a durable bounded attempt budget across deliveries', async () => {
    const h = harness(initialLink(), async () => { throw Error('provider_unavailable'); });
    await h.worker.schedule(h.work());
    for (let i = 0; i < 4; i++) await assert.rejects(h.deliver(), /provider_unavailable/);
    assert.equal((await h.deliver()).outcome, 'attention');
    await h.deliver(); assert.equal(h.work().attempt, 5); assert.equal(h.work().state, 'needs_attention');
});
test('deferred work is persisted before a failing enqueue and remains recoverable', async () => {
    const h = harness(initialLink(), async () => { h.offline(true); return { outcome: 'deferred', due: NOW + 1000 }; });
    await h.worker.schedule(h.work()); await assert.rejects(h.deliver(), /queue_unavailable/);
    assert.equal(h.work().state, 'pending'); assert.equal(h.work().generation, 1);
    h.offline(false); await h.worker.schedule(h.work()); assert.equal(h.queue.size, 2);
});
test('explicit repair requires current version and a new delivery generation', async () => {
    const h = harness(initialLink()); await h.worker.schedule(h.work()); const original = h.work();
    await h.worker.repair(original); assert.equal(h.work().generation, 1); assert.equal(h.queue.size, 2);
    await assert.rejects(h.worker.repair(original), /VERSION_CHANGED/);
    await h.deliver(); await assert.rejects(h.worker.repair(h.work()), /TERMINAL/);
});
test('domain reread prevents expiration of a paid/closed order', async () => {
    let effects = 0;
    const h = harness(initialLink(), async request => createActivityMaintenance({ db: h.db, now: h.now, expireLink: async () => { effects++; } }).dispatch(request));
    await h.worker.schedule(h.work()); h.records.get('orders/link1').checkout.status = 'closed';
    await h.deliver(); assert.equal(effects, 0); assert.equal(h.work().state, 'superseded');
});
test('inbox intent follows receive/lease/terminal transitions and closes its own incident', async () => {
    const entry = createInboxEntry({ event: { id: 'evt_one', type: 'test', data: { object: { id: 'pi_one' } } }, scope: 'platform', payloadHash: 'a'.repeat(64), clock: { now: () => new Date(NOW).toISOString(), nowMillis: () => NOW } });
    const path = `commerce_webhook_inbox/${entry.inboxId}`;
    assert.equal(entry[FIELD].due, NOW + 60000);
    const claimed = claimInbox(entry, { leaseToken: 'lease_token_1', nowMillis: NOW, leaseMs: 120000 });
    assert.equal(claimed[FIELD].due, NOW + 121000);
    const h = harness({ [path]: entry });
    assert.equal((await inspectInbox(h.db, entry.inboxId, NOW + 60000)).outcome, 'attention');
    const processed = markInboxProcessed(claimed, { leaseToken: 'lease_token_1', nowMillis: NOW + 1000, processedAt: new Date(NOW + 1000).toISOString() });
    h.records.set(path, processed); await inspectInbox(h.db, entry.inboxId, NOW + 2000);
    assert.equal(h.records.get(`commerce_incidents/maintenance_inbox_${entry.inboxId}`).status, 'closed');
    assert.equal(processed[FIELD].state, 'succeeded');
});
test('a crash after an idempotent domain effect retries after lease expiry without a second effect', async () => {
    const effects = new Set(); let crash = true;
    const h = harness(initialLink(), async request => {
        effects.add(request.data.id);
        if (crash) { crash = false; h.failCommit(); }
        return { outcome: 'expired' };
    });
    await h.worker.schedule(h.work()); await assert.rejects(h.deliver(), /commit_lost/);
    await assert.rejects(h.deliver(), /LEASE_BUSY/); h.advance(601000);
    await h.deliver(); assert.equal(effects.size, 1); assert.equal(h.work().state, 'succeeded');
});
test('an expired lease cannot acknowledge unfinished bookkeeping as success', async () => {
    const h = harness(initialLink(), async () => { h.advance(601000); return { outcome: 'expired' }; });
    await h.worker.schedule(h.work()); await assert.rejects(h.deliver(), /WORK_LEASE_EXPIRED/);
    assert.equal(h.work().state, 'running');
});
test('checkout observer distinguishes pending user payment, lost creation and eventual success', async () => {
    const order = { checkout: { status: 'active', expiresAt: new Date(NOW + 900000).toISOString() }, payment: { currentAttemptId: 'attempt_1' } };
    const h = harness({ 'orders/payment_1': order, 'orders/payment_1/payment_attempts/attempt_1': { status: 'attached' } });
    assert.deepEqual(await inspectPayment(h.db, 'payment_1', NOW), { outcome: 'deferred', due: NOW + 960000 });
    assert.equal(h.records.size, 2);
    h.records.get('orders/payment_1/payment_attempts/attempt_1').status = 'create_unknown';
    assert.equal((await inspectPayment(h.db, 'payment_1', NOW)).outcome, 'attention');
    h.records.get('orders/payment_1').payment.status = 'succeeded';
    h.records.get('orders/payment_1').paymentWatchWork = { ...intent('payment', 'payment_1', NOW), state: 'needs_attention' };
    await inspectPayment(h.db, 'payment_1', NOW + 1000);
    assert.equal(h.records.get('commerce_incidents/maintenance_payment_payment_1').status, 'closed');
    assert.equal(h.records.get('orders/payment_1').paymentWatchWork.state, 'succeeded');
});
test('payment completion supersedes the link task immediately', async () => {
    const h = harness(initialLink()); h.records.get('orders/link1').payment = { status: 'succeeded' };
    await finishLinkWork(h.db, 'link1', NOW); assert.equal(h.work().state, 'superseded');
});
test('archive relays are bounded by a real existing day, then stop after completion', async () => {
    const id = 'archive_2026-09-10'; let archived = 0;
    const h = harness({ [`sys_analytics_maintenance/${id}`]: { archiveAt: NOW + 75 * 86400000, maintenanceWork: intent('archive', id, NOW) } },
        request => createActivityMaintenance({ db: h.db, now: h.now, archivePeriod: async key => { assert.equal(key, '2026-09-10'); archived++; } }).dispatch(request));
    const path = `sys_analytics_maintenance/${id}`;
    await h.worker.schedule(h.work(path));
    for (const days of [0, 28, 28, 19]) { h.advance(days * 86400000); await h.deliver(); }
    assert.equal(archived, 1); assert.equal(h.work(path).state, 'succeeded');
    await h.deliver(); assert.equal(archived, 1);
});
