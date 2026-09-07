'use strict';
require('./commerce/helpers/no-network.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { createListMyOrdersHandler } = require('../functions/src/commerce/v2OrderQueries');

function fixture({ exists = true, owner = 'customer' } = {}) {
    const calls = { cursorReads: 0, queries: 0 };
    const cursor = { exists, data: () => ({ userId: owner }) };
    const query = {
        doc: () => ({ get: async () => { calls.cursorReads++; return cursor; } }),
        where(field, operator, uid) {
            assert.deepEqual([field, operator, uid], ['userId', '==', 'customer']);
            return this;
        },
        orderBy: () => query,
        startAfter(value) { assert.equal(value, cursor); calls.startAfter = true; return this; },
        limit(value) { assert.equal(value, 1); return this; },
        get: async () => { calls.queries++; return { size: 1, docs: [row] }; }
    };
    const emptyChildren = { orderBy: () => emptyChildren, limit: () => emptyChildren,
        get: async () => ({ empty: true, docs: [] }) };
    const row = { id: 'next-order', data: () => ({ schemaVersion: 1, userId: 'customer', status: 'paid' }),
        ref: { collection: () => emptyChildren } };
    const handler = createListMyOrdersHandler({ dbFactory: () => ({ collection: () => query }) });
    return { calls, run: data => handler(data, { auth: { uid: 'customer' } }) };
}

test('Mes commandes : une seule lecture du curseur autorisé, même page et continuation', async () => {
    const { calls, run } = fixture();
    const result = await run({ cursor: 'previous-order', pageSize: 1 });
    assert.equal(calls.cursorReads, 1);
    assert.equal(calls.queries, 1);
    assert.equal(calls.startAfter, true);
    assert.equal(result.nextCursor, 'next-order');
    assert.equal(result.orders[0].id, 'next-order');
    assert.deepEqual(result.orders[0].documents, []);
    assert.deepEqual(result.orders[0].allowedActions, []);
});

test('Mes commandes : première page sans lecture de curseur', async () => {
    const { calls, run } = fixture();
    await run({ pageSize: 1 });
    assert.equal(calls.cursorReads, 0);
    assert.equal(calls.queries, 1);
});

for (const scenario of [{ exists: false }, { owner: 'another-customer' }]) {
    test(`Mes commandes : curseur refusé avant la requête ${JSON.stringify(scenario)}`, async () => {
        const { calls, run } = fixture(scenario);
        await assert.rejects(run({ cursor: 'previous-order', pageSize: 1 }), { code: 'permission-denied' });
        assert.equal(calls.cursorReads, 1);
        assert.equal(calls.queries, 0);
    });
}

test('Mes commandes : entrée légère, metadata et réponse autorisée identiques à la découverte', () => {
    const program = `
        const started = performance.now();
        const api = require('./functions');
        const importMs = performance.now() - started;
        const modules = Object.keys(require.cache).length;
        const rss = process.memoryUsage().rss;
        const Firestore = require('./functions/node_modules/@google-cloud/firestore');
        let queries = 0;
        Firestore.Query.prototype.get = async function () {
            queries++; return { docs: [], size: 0, empty: true };
        };
        const fn = api.listMyOrdersV2Gen2;
        (async () => {
            let rejected;
            try { await fn.run({ data: {}, auth: null }); } catch (error) { rejected = error.code; }
            const result = await fn.run({ data: {}, auth: { uid: 'customer' } });
            console.log('RESULT:' + JSON.stringify({ importMs, modules, rss, queries, rejected, result,
                endpoint: fn.__endpoint, exports: Object.keys(api).length }));
        })().catch(() => { process.exitCode = 1; });
    `;
    const runs = {};
    for (const mode of ['discovery', 'targeted']) {
        runs[mode] = Array.from({ length: 3 }, () => {
            const child = spawnSync(process.execPath, ['--require', './tests/commerce/helpers/no-network.cjs', '-e', program], {
                encoding: 'utf8', env: { ...process.env, FUNCTION_TARGET: mode === 'targeted' ? 'listMyOrdersV2Gen2' : '', GOOGLE_FUNCTION_TARGET: '', K_SERVICE: '' }
            });
            assert.equal(child.status, 0, child.stderr);
            return JSON.parse(child.stdout.split('\n').find(line => line.startsWith('RESULT:')).slice(7));
        });
    }
    for (const run of [...runs.discovery, ...runs.targeted]) {
        assert.deepEqual(run.endpoint, runs.discovery[0].endpoint);
        assert.deepEqual(run.result, { orders: [], nextCursor: null });
        assert.equal(run.rejected, 'unauthenticated');
        assert.equal(run.queries, 1);
    }
    assert.equal(runs.targeted[0].exports, 1);
    assert.ok(runs.targeted[0].modules < runs.discovery[0].modules);
    console.info('LOCAL_IMPORTS', JSON.stringify(Object.fromEntries(Object.entries(runs).map(([mode, values]) =>
        [mode, values.map(({ importMs, modules, rss }) => ({ importMs, modules, rss }))]))));
});
