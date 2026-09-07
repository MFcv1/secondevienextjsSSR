'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { updateOtpStateIfCurrent } = require('../functions/src/auth/otpState');

test('late OTP mail and login callbacks preserve a newer challenge and its attempts', async () => {
    for (const expected of [{ expiresAtMillis: 100, otpHash: 'old-hmac' }, { expiresAtMillis: 100, status: 'active' }, { responseHash: 'old-response-hmac' }]) {
        const state = { expiresAtMillis: 200, otpHash: 'new-hmac', status: 'active', attempts: 2 };
        let updates = 0;
        const db = { runTransaction: run => run({
            get: async () => ({ exists: true, data: () => state }),
            update: () => { updates++; }
        }) };
        assert.equal(await updateOtpStateIfCurrent(db, 'otp-ref', expected, { status: 'token_issued' }), false);
        assert.equal(updates, 0);
        assert.equal(state.attempts, 2);
    }
});

test('OTP operation updates apply only to the matching durable generation', async () => {
    const state = { responseHash: 'current-hmac', status: 'issuing' };
    const db = { runTransaction: run => run({
        get: async () => ({ exists: true, data: () => state }),
        update: (_ref, patch) => Object.assign(state, patch)
    }) };
    assert.equal(await updateOtpStateIfCurrent(db, 'otp-ref', { responseHash: 'current-hmac' }, { status: 'token_issued' }), true);
    assert.equal(state.status, 'token_issued');
});
