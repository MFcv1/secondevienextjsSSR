'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { resolveCheckoutEmail } = require('../../../functions/src/commerce/checkoutEmailIdentity');
const { createOutboxWorker } = require('../../../functions/src/commerce/domain/outboxWorker');

test('checkout contact comes from verified Auth or server OTP, never an unverified token email', async () => {
    const verified = { auth: { uid: 'customer-one', token: { email: 'Owner@example.test', email_verified: true } } };
    const calls = [];
    const verify = async (...args) => { calls.push(args); return args[1]; };
    assert.equal(await resolveCheckoutEmail(verified, {}, verify), 'owner@example.test');
    assert.equal(calls.length, 0);
    assert.equal(await resolveCheckoutEmail(verified, { customerEmail: 'Other@example.test', checkoutOtpToken: 'proof' }, verify), 'other@example.test');
    assert.deepEqual(calls.pop(), ['customer-one', 'other@example.test', 'proof']);
    const guest = { auth: { uid: 'anonymous-one', token: {} } };
    assert.equal(await resolveCheckoutEmail(guest, { customerEmail: 'Guest@example.test', checkoutOtpToken: 'proof' }, verify), 'guest@example.test');
    assert.deepEqual(calls.pop(), ['anonymous-one', 'guest@example.test', 'proof']);
    await assert.rejects(resolveCheckoutEmail(guest, {}, verify), { code: 'invalid-argument' });
    const denied = () => { throw new Error('OTP_REQUIRED'); };
    await assert.rejects(resolveCheckoutEmail({ auth: { uid: 'customer-one', token: { email: 'owner@example.test' } } }, {}, denied), /OTP_REQUIRED/);
    await assert.rejects(resolveCheckoutEmail(verified, { customerEmail: 'attacker@example.test' }, denied), /OTP_REQUIRED/);
});

test('paid cart cleanup preserves additions and revisions committed after the initial listing', async () => {
    const { clearPurchasedRemoteCart } = await import('../../../src/kit/commerce/purchasedCartCleanup.js');
    const original = { cartLineId: 'cart-line-one', cartRevision: 1 };
    const deleted = [];
    const state = new Map([
        ['modified', { ...original, cartRevision: 2 }],
        ['unchanged', { cartLineId: 'cart-line-two', cartRevision: 3 }],
        ['readded', { cartLineId: 'cart-line-new', cartRevision: 1 }],
    ]);
    const firestore = {
        collection: (...args) => { assert.deepEqual(args, ['db', 'users', 'customer-one', 'cart']); return 'cart'; },
        getDocs: async () => ({ docs: [
            { ref: 'modified', data: () => original },
            { ref: 'unchanged', data: () => state.get('unchanged') },
            { ref: 'readded', data: () => original },
        ] }),
        runTransaction: async (_db, callback) => callback({
            get: async (ref) => ({ exists: () => state.has(ref), data: () => state.get(ref) }),
            delete: (ref) => deleted.push(ref),
        }),
    };
    await clearPurchasedRemoteCart({ db: 'db', firestore, ownerUid: 'customer-one', purchasedCartLines: [original, state.get('unchanged')] });
    assert.deepEqual(deleted, ['unchanged']);
});

test('an incomplete email acknowledgement is ambiguous and never queued for automatic redelivery', async () => {
    for (const response of [null, {}, { providerMessageId: '' }]) {
        const effects = [];
        const worker = createOutboxWorker({
            repository: {
                claim: async () => ({ outboxId: 'email-one', status: 'processing' }),
                markSent: async () => effects.push('sent'),
                markFailed: async () => effects.push('retry'),
                markDeliveryUnknown: async () => effects.push('unknown'),
            },
            send: async () => response,
            ids: { leaseToken: () => 'lease-local-one' },
            clock: { now: () => '2026-09-07T10:00:00Z', nowMillis: () => 1 },
        });
        await assert.rejects(worker.process('email-one'), /COMMERCE_OUTBOX_PROVIDER_RESPONSE_INVALID/);
        assert.deepEqual(effects, ['unknown']);
    }
});
