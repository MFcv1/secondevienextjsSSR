'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawnSync } = require('node:child_process');
const { createPasskeyTimer } = require('../functions/src/auth/passkeyPerformance');

test('stage timings are independent between concurrent requests and contain no identity', () => {
    let clock = 100;
    const entries = [];
    const options = { now: () => clock, log: (...args) => entries.push(args) };
    const first = createPasskeyTimer('verify', options);
    clock = 120;
    const second = createPasskeyTimer('verify', options);
    clock = 150;
    first('rate-limit');
    second('rate-limit');
    clock = 170;
    first('challenge-read');
    assert.deepEqual(entries.map(([, data]) => data.elapsedMs), [50, 30, 20]);
    for (const [event, data] of entries) {
        assert.equal(event, 'passkey_stage_perf');
        assert.deepEqual(Object.keys(data), ['event', 'ceremony', 'stage', 'elapsedMs']);
    }
    assert.throws(() => first('user@example.com'), /Unknown passkey stage/);
    assert.equal(entries.length, 3);
    const brokenLogger = createPasskeyTimer('options', { log: () => { throw new Error('logging failed'); } });
    assert.doesNotThrow(() => brokenLogger('challenge-write'));
});

for (const target of ['generatePasskeyAuthenticationOptionsGen2', 'verifyPasskeyAuthenticationGen2']) {
    test(`${target} uses an isolated entrypoint with the same secured handler and bounded capacity`, () => {
        const result = spawnSync(process.execPath, ['-e', `
            const assert = require('node:assert/strict');
            const target = ${JSON.stringify(target)};
            const entry = require('./functions');
            assert.deepEqual(Object.keys(entry), [target]);
            const direct = require('./functions/src/auth/passkeys')[target];
            assert.equal(entry[target], direct);
            const endpoint = direct.__endpoint;
            assert.equal(endpoint.cpu, 1);
            assert.equal(endpoint.concurrency, 8);
            assert.equal(endpoint.minInstances, 1);
            assert.equal(endpoint.maxInstances, 2);
            assert.ok(!Object.keys(require.cache).some(file =>
                /functions\\/src\\/(commerce|email|invoicing)\\//.test(file) ||
                /node_modules\\/(sharp|stripe|nodemailer|jspdf)\\//.test(file)));
        `], {
            cwd: require('node:path').resolve(__dirname, '..'),
            env: { ...process.env, FUNCTION_TARGET: target, GCLOUD_PROJECT: 'demo-passkey-performance' },
            encoding: 'utf8', timeout: 15000
        });
        assert.equal(result.status, 0, result.stderr || result.stdout);
    });
}
