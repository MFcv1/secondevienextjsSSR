'use strict';
process.env.COMMERCE_EVENT_MAINTENANCE_MODE = 'durable';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createMemory } = require('./helpers/inactivityMemory.cjs');
const { withReservationMaintenance, createReservationMaintenanceRuntime } = require('../functions/src/commerce/domain/reservationMaintenance');

function fixture() {
    const memory = createMemory(), id = 'order-fixture-123', path = `orders/${id}`;
    let now = 100000, calls = 0;
    const queue = new Map(), entry = () => memory.records.get(path);
    const order = { checkout: { status: 'active', expiresAt: new Date(now + 60000).toISOString() }, payment: { status: 'pending' } };
    memory.records.set(path, withReservationMaintenance(order, id));
    const runtime = createReservationMaintenanceRuntime({ db: memory.db, now: () => now,
        enqueue: async (_kind, data, options) => queue.set(options.id, data),
        worker: { process: async () => { calls++; memory.records.set(path, { ...entry(), checkout: { ...entry().checkout, status: 'closed' } }); } } });
    return { ...memory, runtime, id, path, entry, queue, advance: n => { now += n; }, get calls() { return calls; },
        async schedule() { await runtime.schedule(entry().reservationExpiryWork); return [...queue.values()].at(-1); } };
}

test('checkout entier : une échéance, indépendamment du nombre de lignes', () => {
    const f = fixture();
    const updated = withReservationMaintenance({ ...f.entry(), items: new Array(20).fill({ quantity: 1 }) }, f.id);
    assert.deepEqual(updated.reservationExpiryWork, f.entry().reservationExpiryWork);
    assert.equal(updated.reservationExpiryWork.due, 160000);
});
test('lien admin : son propriétaire existant suffit', () => {
    const f = fixture(); const { reservationExpiryWork: _reservationExpiryWork, ...order } = f.entry();
    assert.equal(withReservationMaintenance({ ...order, checkout: { ...order.checkout, channel: 'admin_payment_link' } }, f.id).reservationExpiryWork, undefined);
});
test('paiement terminé entre planification et livraison : aucune annulation', async () => {
    const f = fixture(), data = await f.schedule();
    f.records.set(f.path, { ...f.entry(), payment: { status: 'succeeded' } }); f.advance(60000);
    await f.runtime.dispatch({ data }); assert.equal(f.calls, 0);
    assert.equal(f.entry().reservationExpiryWork.state, 'superseded');
});
test('prolongation : message ancien inoffensif, nouvelle échéance honorée', async () => {
    const f = fixture(), old = await f.schedule();
    f.records.set(f.path, withReservationMaintenance({ ...f.entry(), checkout: { ...f.entry().checkout, expiresAt: new Date(220000).toISOString() } }, f.id));
    f.advance(60000); await f.runtime.dispatch({ data: old }); assert.equal(f.calls, 0);
    const fresh = await f.schedule(); f.advance(60000); await f.runtime.dispatch({ data: fresh });
    await f.runtime.dispatch({ data: fresh }); assert.equal(f.calls, 1);
    assert.equal(f.entry().reservationExpiryWork.state, 'succeeded');
});
test('absence d’activité après clôture : aucune nouvelle tâche pendant sept jours', async () => {
    const f = fixture(), data = await f.schedule(); f.advance(60000);
    await f.runtime.dispatch({ data }); const count = f.queue.size;
    f.advance(7 * 86400000); await f.schedule(); assert.equal(f.queue.size, count);
});
