'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const containment = require('../../../functions/src/commerce/legacyContainment');

test('the real legacy entrypoint rejects every payment mode without loading a provider or writing', async () => {
    class HttpsError extends Error {
        constructor(code, message, details) { super(message); Object.assign(this, { code, details }); }
    }
    let reads = 0;
    const db = { doc: () => ({ get: async () => {
        reads += 1;
        return { exists: true, data: () => ({ legacyMode: 'enabled' }) };
    } }) };
    const runtime = { runWith: () => ({ https: { onCall: (handler) => handler } }) };
    const exported = {};
    vm.runInNewContext(fs.readFileSync('functions/src/commerce/createOrder.js', 'utf8'), {
        exports: exported,
        require: (name) => {
            if (name === 'firebase-admin') return { firestore: () => db };
            if (name === '../../helpers/runtime') return {
                functions: { https: { HttpsError } }, regionalFunctions: () => runtime, logFunctionPerf: () => {}
            };
            if (name === '../../helpers/secrets') return {};
            if (name === './legacyContainment') return containment;
            throw new Error(`Unexpected dependency: ${name}`);
        }
    });
    for (const paymentMethod of ['stripe_elements', 'stripe', 'manual', 'deferred', null]) {
        await assert.rejects(exported.createOrder({ orderData: { paymentMethod } }), (error) => {
            assert.equal(error.code, 'failed-precondition');
            assert.equal(error.details.reason, 'COMMERCE_READ_ONLY');
            return true;
        });
    }
    assert.equal(reads, 5);
});
