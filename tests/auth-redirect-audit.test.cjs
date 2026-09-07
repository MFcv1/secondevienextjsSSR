'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');

test('a failed Google redirect retains the Firebase observer for subsequent session changes', async () => {
    let observer, subscriptions = 0, cleared = 0;
    const source = fs.readFileSync('src/kit/auth/authStore.js', 'utf8')
        .replace(/^import[\s\S]*?;\n/gm, '').replace(/export /g, '');
    const api = vm.runInNewContext(`${source}\n({ initializeAuthStore, getAuthSnapshot })`, {
        getFirebaseAuth: async () => ({}),
        loadAuthModule: async () => ({ getRedirectResult: async () => { throw new Error('redirect interrupted'); }, onIdTokenChanged: (_, callback) => { subscriptions++; observer = callback; return () => {}; } }),
        setAdminCacheAuthorization() {}, hasAuthRedirectPending: () => true, clearAuthRedirectPending: () => { cleared++; },
    });
    await assert.rejects(api.initializeAuthStore({ forceInitialize: true }), /redirect interrupted/);
    assert.equal(subscriptions, 1); assert.equal(cleared, 1);
    observer(null);
    assert.equal(api.getAuthSnapshot().status, 'anonymous');
    assert.equal(api.getAuthSnapshot().authReady, true);
    await api.initializeAuthStore({ forceInitialize: true });
    assert.equal(subscriptions, 1);
});
