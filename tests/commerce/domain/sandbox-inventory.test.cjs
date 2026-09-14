'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { createSandboxInventoryRepository } = require('../../../functions/src/commerce/domain/sandboxInventoryRepository');
const { createReturnRuntime } = require('../../../functions/src/commerce/domain/v2Runtime');
const { reduceOrder } = require('../../../functions/src/commerce/domain/orderState');
const { validateInventorySummary } = require('../../../functions/src/commerce/domain/inventoryInvariants');
const { makeOrder, fixedClock } = require('../fixtures/order-v2.cjs');

const actor = { uid: 'admin-sandbox', role: 'admin', aal2: true };
const productPath = 'artifacts/secondevie/public/data/furniture/product-0001';
const orderPath = 'orders/order-sandbox';
const reservationPath = 'inventory_reservations/order-sandbox_inventory-key-0001';
const clock = fixedClock();

// Buffered commits and a serialized transaction queue exercise replay and rollback
// locally. These tests do not claim to qualify hosted Firestore contention.
function fixture() {
    const base = makeOrder();
    const order = reduceOrder(base, { type: 'payment_succeeded', amountCents: base.amounts.totalCents,
        currency: 'EUR', paymentIntentId: 'pi_sandbox' }, { clock });
    order.payment.connectedAccountId = 'acct_sandbox';
    const records = new Map([
        [orderPath, order],
        [productPath, { name: 'Fauteuil', stock: 0, status: 'published', sold: false,
            availability: 'sold', commerceVersion: 2, inventoryVersion: 1 }],
        [reservationPath, { schemaVersion: 2, orderId: 'order-sandbox', productId: 'product-0001',
            collectionName: 'furniture', inventoryKey: 'inventory-key-0001', status: 'committed',
            reservedQty: 1, heldQty: 0, committedQty: 1, releasedQty: 0, dispositionPendingQty: 0,
            restockedQty: 0, writtenOffQty: 0, inventoryVersion: 1, stateVersion: 1 }],
        ['commerce_connect_accounts/acct_sandbox', { livemode: false }],
        ['sys_commerce_control/current', { newCheckoutMode: 'v2_all', adminMutationMode: 'v2',
            offlinePaymentMode: 'off', legacyMode: 'disabled', controlRevision: 1 }]
    ]);
    const doc = path => ({ path, id: path.split('/').at(-1) });
    const snapshot = ref => ({ ref, exists: records.has(ref.path), data: () => structuredClone(records.get(ref.path)) });
    const reads = [];
    let failCommit = false;
    let queue = Promise.resolve();
    const db = {
        doc,
        collection(path) {
            return { path, filters: [], cap: Infinity,
                where(field, op, value) { assert.equal(op, '=='); this.filters.push([field, value]); return this; },
                limit(cap) { this.cap = cap; return this; } };
        },
        runTransaction(run) {
            const result = queue.then(async () => {
                const writes = [];
                const result = await run({
                    get: async ref => {
                        assert.equal(writes.length, 0, 'all reads precede writes');
                        reads.push(ref);
                        if (!ref.filters) return snapshot(ref);
                        assert.ok(Number.isFinite(ref.cap), 'queries must be bounded');
                        return { docs: [...records.entries()].filter(([path, data]) =>
                            path.startsWith(`${ref.path}/`) && !path.slice(ref.path.length + 1).includes('/')
                            && ref.filters.every(([field, value]) => data[field] === value))
                            .slice(0, ref.cap).map(([path]) => snapshot(doc(path))) };
                    },
                    set: (ref, data) => writes.push([ref.path, structuredClone(data)]),
                    update: (ref, data) => writes.push([ref.path, { ...records.get(ref.path), ...structuredClone(data) }])
                });
                if (failCommit) { failCommit = false; throw new Error('commit unavailable'); }
                writes.forEach(([path, value]) => records.set(path, value));
                return result;
            });
            queue = result.catch(() => {});
            return result;
        }
    };
    const input = { productId: 'product-0001', collectionName: 'furniture',
        command: { commandId: 'sandbox-restore-0001', expectedVersion: 2 }, expectedInventoryVersion: 1, actor };
    const repository = createSandboxInventoryRepository({ db, appId: 'secondevie', projectId: 'secondevienextjsssr', clock });
    return { db, records, reads, input, repository, failCommit: () => { failCommit = true; } };
}

test('sandbox restore proves a sale and atomically writes one stock, credit, movement, audit and result', async () => {
    const f = fixture();
    const originalOrder = structuredClone(f.records.get(orderPath));
    const result = await f.repository.restore(f.input);
    assert.equal(result.stock, 1);
    assert.equal(f.records.get(productPath).sold, false);
    assert.equal(f.records.get(productPath).availability, 'available');
    assert.equal(f.records.get(productPath).inventoryVersion, 2);
    assert.equal(f.records.get(reservationPath).committedQty, 1);
    assert.equal(f.records.get(reservationPath).sandboxRestockCreditQty, 1);
    assert.deepEqual(f.records.get(orderPath), originalOrder, 'payment and order are unchanged');
    for (const prefix of ['inventory_movements/', 'commerce_product_audits/', 'commerce_command_results/']) {
        assert.equal([...f.records.keys()].filter(path => path.startsWith(prefix)).length, 1);
    }
    assert.equal(f.records.size, 8);
});

test('concurrent duplicate, lost response and later retry keep exactly one effect', async () => {
    const f = fixture();
    const [first, second] = await Promise.all([f.repository.restore(f.input), f.repository.restore(f.input)]);
    assert.deepEqual(first, second);
    // A retry after another purchase must not restore the new reservation.
    f.records.set(productPath, { ...f.records.get(productPath), stock: 0, inventoryVersion: 3 });
    assert.deepEqual(await f.repository.restore(f.input), first);
    assert.equal(f.records.get(productPath).stock, 0);
    assert.equal(f.records.size, 8);
});

test('different concurrent commands cannot each add an item; a failed commit leaves no partial effects', async () => {
    const f = fixture();
    const original = structuredClone([...f.records]);
    f.failCommit();
    await assert.rejects(f.repository.restore(f.input), /commit unavailable/);
    assert.deepEqual([...f.records], original);
    const results = await Promise.allSettled([f.repository.restore(f.input), f.repository.restore({ ...f.input,
        command: { ...f.input.command, commandId: 'sandbox-restore-0002' } })]);
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(f.records.get(productPath).stock, 1);
});

for (const scenario of ['active hold', 'overdue hold', 'unknown sale', 'stale version', 'missing order',
    'unpaid order', 'live account', 'missing mode', 'read only', 'fixture mode', 'offline enabled',
    'refund', 'return', 'already credited', 'partial sale', 'uncertain history']) {
    test(`sandbox restore refuses ${scenario} without changing anything`, async () => {
        const f = fixture();
        const reservation = f.records.get(reservationPath);
        const order = f.records.get(orderPath);
        const control = f.records.get('sys_commerce_control/current');
        if (scenario.includes('hold')) {
            f.records.set('inventory_reservations/other-hold', { ...reservation, orderId: 'other-order',
                status: 'held', heldQty: 1, committedQty: 0,
                expiresAt: scenario === 'overdue hold' ? '2000-01-01T00:00:00Z' : '2099-01-01T00:00:00Z' });
        }
        if (scenario === 'unknown sale') f.records.delete(reservationPath);
        if (scenario === 'stale version') f.records.get(productPath).inventoryVersion++;
        if (scenario === 'missing order') f.records.delete(orderPath);
        if (scenario === 'unpaid order') f.records.set(orderPath, makeOrder());
        if (scenario === 'live account') f.records.get('commerce_connect_accounts/acct_sandbox').livemode = true;
        if (scenario === 'missing mode') delete f.records.get('commerce_connect_accounts/acct_sandbox').livemode;
        if (scenario === 'read only') control.adminMutationMode = 'read_only';
        if (scenario === 'fixture mode') control.newCheckoutMode = 'v2_fixture';
        if (scenario === 'offline enabled') control.offlinePaymentMode = 'v2';
        if (scenario === 'refund') f.records.set(orderPath, reduceOrder(order, { type: 'refund_requested', amountCents: 1000 }, { clock }));
        if (scenario === 'return') f.records.set(`${orderPath}/returns/return-open`, { status: 'pending' });
        if (scenario === 'already credited') reservation.sandboxRestockCreditQty = 1;
        if (scenario === 'partial sale') { reservation.committedQty = 2; reservation.reservedQty = 2; }
        if (scenario === 'uncertain history') for (let i = 0; i < 51; i++) f.records.set(`inventory_reservations/history-${i}`, { ...reservation });
        const original = structuredClone([...f.records]);
        await assert.rejects(f.repository.restore(f.input));
        assert.deepEqual([...f.records], original);
    });
}

test('sandbox restore denies other environments, weak admins, reused keys and forged credit', async () => {
    const f = fixture();
    const other = createSandboxInventoryRepository({ db: f.db, appId: 'secondevie', projectId: 'production', clock });
    await assert.rejects(other.restore(f.input), { code: 'COMMERCE_SANDBOX_RESTOCK_ENVIRONMENT' });
    await assert.rejects(f.repository.restore({ ...f.input, actor: { ...actor, aal2: false } }));
    assert.equal(f.reads.length, 0);
    await f.repository.restore(f.input);
    await assert.rejects(f.repository.restore({ ...f.input, actor: { ...actor, uid: 'other-admin' } }));
    assert.throws(() => validateInventorySummary({ ...f.records.get(reservationPath), sandboxRestockCreditQty: 2 }));
});

async function disposeReturn(f, type) {
    const runtime = createReturnRuntime({ db: f.db, appId: 'secondevie', clock });
    const current = f.records.get(orderPath);
    const shipped = reduceOrder(current, { type: 'fulfillment_shipped', trackingNumber: 'TEST' }, { clock });
    f.records.set(orderPath, shipped);
    const created = await runtime.returns.create({ orderId: 'order-sandbox', returnRequestId: 'test-return',
        requestedLines: [{ lineId: 'line-0001', quantity: 1 }], actor, reason: 'Retour de test' });
    const returnId = created.returnCase.returnId;
    const received = await runtime.returns.apply({ orderId: 'order-sandbox', returnId,
        commandId: 'return-receive-0001', expectedVersion: 0, actor, reason: 'Réception test',
        event: { type: 'receive', lines: [{ lineId: 'line-0001', quantity: 1 }] } });
    const input = { orderId: 'order-sandbox', returnId, commandId: 'return-dispose-0001',
        expectedVersion: received.returnStateVersion, actor, reason: 'Disposition test',
        event: { type, lines: [{ lineId: 'line-0001', quantity: 1 }] } };
    const result = await runtime.returns.apply(input);
    assert.deepEqual(await runtime.returns.apply(input), result);
}

for (const type of ['restock', 'write_off']) {
    test(`sandbox credit survives a new purchase and is consumed once by a later ${type}`, async () => {
        const f = fixture();
        await f.repository.restore(f.input);
        // Another customer now holds the test unit. The old return cannot expose it.
        f.records.set(productPath, { ...f.records.get(productPath), stock: 0, inventoryVersion: 3 });
        const held = { ...f.records.get(reservationPath), orderId: 'new-order', heldQty: 1,
            committedQty: 0, status: 'held', sandboxRestockCreditQty: 0, inventoryVersion: 3 };
        f.records.set('inventory_reservations/new-order', held);
        await disposeReturn(f, type);
        assert.equal(f.records.get(productPath).stock, 0);
        assert.equal(f.records.get(productPath).inventoryVersion, 3);
        assert.deepEqual(f.records.get('inventory_reservations/new-order'), held);
        assert.equal(f.records.get(reservationPath).sandboxRestockCreditQty, 0);
        assert.equal(f.records.get(reservationPath).committedQty, 0);
        const movement = [...f.records.values()].find(value => value.type === `return_${type}`);
        assert.equal(movement.availableDelta, 0);
        assert.equal(movement.sandboxRestockCreditConsumed, 1);
    });
}

test('normal physical return still restores stock exactly once', async () => {
    const f = fixture();
    await disposeReturn(f, 'restock');
    assert.equal(f.records.get(productPath).stock, 1);
    assert.equal(f.records.get(productPath).inventoryVersion, 2);
    assert.equal(f.records.get(reservationPath).restockedQty, 1);
    assert.equal(f.records.get(reservationPath).sandboxRestockCreditQty, undefined);
});

test('a return after sandbox restoration leaves stock at one, never two', async () => {
    const f = fixture();
    await f.repository.restore(f.input);
    await disposeReturn(f, 'restock');
    assert.equal(f.records.get(productPath).stock, 1);
});

test('a new confirmed sale permits another reset while old sale credits remain intact', async () => {
    const f = fixture();
    await f.repository.restore(f.input);
    const previousSale = structuredClone(f.records.get(reservationPath));
    f.records.set(productPath, { ...f.records.get(productPath), stock: 0, inventoryVersion: 3 });
    f.records.set('orders/second-order', structuredClone(f.records.get(orderPath)));
    f.records.set('inventory_reservations/second-order', { ...previousSale, orderId: 'second-order',
        inventoryVersion: 3, sandboxRestockCreditQty: 0 });
    await f.repository.restore({ ...f.input, expectedInventoryVersion: 3,
        command: { commandId: 'sandbox-restore-0002', expectedVersion: 3 } });
    assert.equal(f.records.get(productPath).stock, 1);
    assert.deepEqual(f.records.get(reservationPath), previousSale);
    assert.equal(f.records.get('inventory_reservations/second-order').sandboxRestockCreditQty, 1);
});

test('UI offers a sandbox reset at zero even without sold, and explains reservation refusals', async () => {
    const { canRequestSandboxRestock, sandboxRestockError } = await import('../../../src/kit/admin/sandboxRestockUi.js');
    assert.equal(canRequestSandboxRestock({ status: 'published', stock: 0, sold: false }, 'secondevienextjsssr'), true);
    for (const stock of [1, -1, null, undefined]) assert.equal(canRequestSandboxRestock({ status: 'published', stock }, 'secondevienextjsssr'), false);
    assert.equal(canRequestSandboxRestock({ status: 'draft', stock: 0 }, 'secondevienextjsssr'), false);
    assert.equal(canRequestSandboxRestock({ status: 'published', stock: 0 }, 'production'), false);
    assert.match(sandboxRestockError({ details: { reason: 'COMMERCE_SANDBOX_RESTOCK_RESERVED' } }), /réservation/);
});
