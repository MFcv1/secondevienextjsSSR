'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

test('completed checkout cannot erase another account or another order recovery', async () => {
    const recovery = await import('../../../src/kit/commerce/checkoutRecovery.js');
    const storage = new Map();
    const events = [];
    global.window = {
        localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
        dispatchEvent: event => events.push(event.type)
    };
    try {
        const descriptor = recovery.createCheckoutRecoveryDescriptor({ ownerUid: 'owner-other-tab', clientOrderId: 'client-other-tab', orderId: 'order-other-tab', cartLines: [{ cartLineId: 'cart-line-other-tab', cartRevision: 1 }] });
        recovery.writeCheckoutRecoveryDescriptor(descriptor, { enabled: true });
        for (const input of [{}, { ownerUid: 'owner-other-tab', orderId: 'order-paid-tab' }, { ownerUid: 'owner-stranger', orderId: descriptor.orderId }]) {
            assert.equal(recovery.clearCheckoutRecoveryDescriptor({ enabled: true, ...input }), false);
            assert.equal(recovery.readCheckoutRecoveryDescriptor(descriptor.ownerUid, { enabled: true }).orderId, descriptor.orderId);
        }
        assert.equal(recovery.clearCheckoutRecoveryDescriptor({ enabled: true, ownerUid: descriptor.ownerUid, orderId: descriptor.orderId }), true);
        assert.equal(storage.size, 0);
        assert.deepEqual(events, [recovery.CHECKOUT_RECOVERY_CHANGED_EVENT, recovery.CHECKOUT_RECOVERY_CHANGED_EVENT]);
    } finally { delete global.window; }
});

test('guest import removes only confirmed unchanged lines and preserves remote additions', async () => {
    const source = fs.readFileSync('src/kit/commerce/cartMigration.js', 'utf8');
    const body = source.slice(source.indexOf('let migration')).replace('export function', 'function');
    const imported = { id: 'piece-a', cartLineId: 'guest-line-a', cartRevision: 1, name: 'Guest' };
    const changed = { id: 'piece-b', cartLineId: 'guest-line-b', cartRevision: 1 };
    let guests = [imported, changed];
    const remote = new Map([['piece-b', { name: 'Account version', quantity: 3, cartRevision: 8 }]]);
    const recovery = await import('../../../src/kit/commerce/checkoutRecovery.js');
    const migrate = vm.runInNewContext(`${body}\nmigrateGuestCartToUserCart`, {
        readGuestCart: () => [...guests], writeGuestCart: values => { guests = values; },
        getCartDocumentId: item => item.id, isPurchasedCartLineUnchanged: recovery.isPurchasedCartLineUnchanged
    });
    let calls = 0;
    const firestore = {
        doc: (_db, _users, _uid, _cart, id) => id, serverTimestamp: () => 'now',
        runTransaction: async (_db, work) => {
            if (calls++ === 0) {
                guests = [imported, { ...changed, cartRevision: 2 }, { id: 'piece-c', cartLineId: 'new-line-c', cartRevision: 1 }];
            }
            return work({ get: async id => ({ exists: () => remote.has(id), data: () => remote.get(id) }), set: (id, value) => remote.set(id, value) });
        }
    };
    await migrate({}, firestore, { uid: 'owner-audit' });
    assert.deepEqual(guests.map(item => item.id), ['piece-b', 'piece-c']);
    assert.equal(remote.get('piece-b').name, 'Account version');
    assert.equal(remote.get('piece-b').cartRevision, 8);
    assert.equal(remote.get('piece-a').cartLineId, 'guest-line-a');
});

test('guest import survives a failed write and ignores an obsolete account', async () => {
    const source = fs.readFileSync('src/kit/commerce/cartMigration.js', 'utf8');
    const body = source.slice(source.indexOf('let migration')).replace('export function', 'function');
    let guests = [{ id: 'piece-a', cartLineId: 'line-a', cartRevision: 1 }];
    const migrate = vm.runInNewContext(`${body}\nmigrateGuestCartToUserCart`, {
        readGuestCart: () => [...guests], writeGuestCart: values => { guests = values; },
        getCartDocumentId: item => item.id,
        isPurchasedCartLineUnchanged: (a, b) => a.cartLineId === b.cartLineId && a.cartRevision === b.cartRevision
    });
    const owners = [];
    let fail = true;
    const firestore = {
        doc: (_db, _users, uid) => uid, serverTimestamp: () => 'now',
        runTransaction: async (_db, work) => {
            if (fail) throw new Error('offline');
            return work({ get: async () => ({ exists: () => false }), set: uid => owners.push(uid) });
        }
    };
    await assert.rejects(migrate({}, firestore, { uid: 'a' }), /offline/);
    assert.equal(guests.length, 1);
    fail = false;
    await Promise.all([
        migrate({}, firestore, { uid: 'a' }, () => false),
        migrate({}, firestore, { uid: 'b' }),
        migrate({}, firestore, { uid: 'b' })
    ]);
    assert.deepEqual(owners, ['b']);
    assert.equal(guests.length, 0);
});
