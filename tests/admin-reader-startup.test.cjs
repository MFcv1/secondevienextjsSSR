'use strict';
require('./commerce/helpers/no-network.cjs');
const assert = require('node:assert/strict');
const test = require('node:test');
const { spawnSync } = require('node:child_process');

for (const [target, group] of [
    ['listPromotionCodesAdminGen2', 'gen2G8'],
    ['getDeliveryPolicyAdminGen2', 'gen2G8'],
    ['listAdminPaymentLinksGen2', 'gen2G9']
]) {
    test(`${target}: isolated startup preserves endpoint and refuses unauthenticated reads`, () => {
        const script = `
            const assert = require('node:assert/strict');
            const { createRequire } = require('node:module');
            const r = createRequire(process.cwd() + '/functions/index.js');
            r('firebase-admin').initializeApp({ projectId: 'local-reader-test' });
            const reader = r('./src/admin/readerEntrypoint').loadReaderTarget(${JSON.stringify(target)});
            const loaded = Object.keys(require.cache);
            assert.ok(!loaded.some(file => /\\/src\\/(analytics|email)\\//.test(file)));
            assert.ok(!loaded.some(file => /\\/commerce\\/gen2G[89]\\.js$/.test(file)));
            const original = r('./src/commerce/${group}')[${JSON.stringify(target)}];
            assert.deepEqual(reader.__endpoint, original.__endpoint);
            (async () => {
                await assert.rejects(reader.run({ data: {}, auth: null }), error => error.code === 'unauthenticated');
            })().catch(error => { console.error(error); process.exitCode = 1; });
        `;
        const result = spawnSync(process.execPath, [
            '--require', './tests/commerce/helpers/no-network.cjs', '-e', script
        ], { encoding: 'utf8' });
        assert.equal(result.status, 0, result.stderr || result.stdout);
    });
}
