'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

const source = fs.readFileSync(require.resolve('../functions/src/auth/passkeyHandlers.cjs'), 'utf8');
const retrySource = source.slice(source.indexOf('async function resumeFailedTokenMint('), source.indexOf('function getClientIp('));

test('a Firestore transaction retry cannot retain permission from an aborted passkey token claim', async () => {
    let minted = 0;
    const operation = { uid: 'customer-audit', status: 'failed_retryable', responseHash: 'response-audit', retryCount: 0, expiresAtMillis: Date.now() + 60_000 };
    const run = vm.runInNewContext(`${retrySource}; resumeFailedTokenMint`, {
        db: { runTransaction: async callback => {
            await callback({ get: async () => ({ exists: true, data: () => operation }), update: () => {} });
            // The first transaction loses its commit race. Firestore reruns it
            // against the operation already claimed by a competing request.
            return callback({ get: async () => ({ exists: true, data: () => ({ ...operation, status: 'token_issued', retryCount: 1 }) }), update: () => assert.fail('no second claim') });
        } },
        admin: { firestore: { FieldValue: { serverTimestamp: () => 'server-time' } } },
        mintPasskeyCustomToken: async () => { minted++; return 'test-only-token'; }
    });
    assert.equal(await run({ update: async () => assert.fail('no mint result') }, 'response-audit'), null);
    assert.equal(minted, 0);
});

test('authentication rejects a credential changed after cryptographic verification', async () => {
    const start = source.indexOf('const freshPasskey = freshPasskeySnap.data();');
    const end = source.indexOf('transaction.update(passkeyRef,', start);
    assert.ok(start > 0 && end > start);
    const check = vm.runInNewContext(`(passkey, freshPasskeySnap) => { ${source.slice(start, end)} }`, {
        functions: { https: { HttpsError: class extends Error { constructor(code, message) { super(message); this.code = code; } } } }
    });
    const verified = { publicKey: 'original-public-key', counter: 3 };
    for (const changed of [{ ...verified, counter: 4 }, { ...verified, publicKey: 'replaced-public-key' }]) {
        assert.throws(() => check(verified, { data: () => changed }), { code: 'aborted' });
    }
    check(verified, { data: () => verified });
    check({ publicKey: 'synced-key', counter: 0 }, { data: () => ({ publicKey: 'synced-key', counter: 0 }) });
});

test('challenge attempt uses one atomic read and keeps missing, exhausted and concurrent states distinct', async () => {
    const start = source.indexOf('async function recordChallengeAttempt(');
    const end = source.indexOf('const generatePasskeyRegistrationOptionsHandler', start);
    let current = { exists: true, data: () => ({ status: 'active', challenge: 'expected', attemptCount: 0, expiresAtMillis: Date.now() + 60000 }) };
    let reads = 0;
    let writes = 0;
    let deletes = 0;
    const run = vm.runInNewContext(`${source.slice(start, end)}; recordChallengeAttempt`, {
        db: { runTransaction: async callback => callback({
            get: async () => { reads++; return current; },
            update: () => { writes++; }, delete: () => { deletes++; }
        }) },
        MAX_CHALLENGE_ATTEMPTS: 5,
        admin: { firestore: { FieldValue: { serverTimestamp: () => 'time' } } },
        functions: { https: { HttpsError: class extends Error { constructor(code, message) { super(message); this.code = code; } } } }
    });
    assert.equal((await run({}, 'expected', true)).challenge, 'expected');
    assert.equal(reads, 1);
    assert.equal(writes, 1);
    current = { exists: false };
    assert.equal(await run({}, 'expected', true), null);
    await assert.rejects(run({}, 'expected'), { code: 'failed-precondition' });
    current = { exists: true, data: () => ({ status: 'active', challenge: 'expected', attemptCount: 5, expiresAtMillis: Date.now() + 60000 }) };
    await assert.rejects(run({}, 'expected', true), { code: 'resource-exhausted' });
    assert.equal(deletes, 1);
    current = { exists: true, data: () => ({ status: 'active', challenge: 'replaced', expiresAtMillis: Date.now() + 60000 }) };
    await assert.rejects(run({}, 'expected', true), { code: 'failed-precondition' });
    assert.equal(writes, 1);
});
