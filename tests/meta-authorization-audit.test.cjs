'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

function harness({ active = true, connection = {}, status = 'processing' } = {}) {
    const startedAt = Date.now() - 10000;
    const stamp = (value) => ({ toMillis: () => value });
    const records = new Map([
        ['state', { uid: 'admin-local', status, createdAt: stamp(startedAt), expiresAt: stamp(Date.now() + 10000) }],
        ['sys_admin_access/admin-local', { active }],
        ['connections/local', connection],
        ['choices/choice-local', { uid: 'admin-local', expiresAt: stamp(Date.now() + 10000), candidates: [{ id: 'candidate-local', pageToken: 'encrypted-local' }] }]
    ]);
    const database = {
        collection: (name) => ({ doc: (id) => `${name}/${id}` }), doc: (path) => path,
        runTransaction: async (run) => {
            const writes = [];
            const result = await run({
                get: async (ref) => ({ exists: records.has(ref), data: () => records.get(ref) }),
                set: (ref, value) => writes.push([ref, value]),
                update: (ref, value) => writes.push([ref, value]),
                create: (ref, value) => writes.push([ref, value]),
                delete: (ref) => writes.push([ref, null])
            });
            for (const [ref, value] of writes) {
                if (value) records.set(ref, { ...records.get(ref), ...value });
                else records.delete(ref);
            }
            return result;
        }
    };
    class HttpsError extends Error {
        constructor(code, message) { super(message); this.code = code; }
    }
    const scope = vm.createContext({
        db: () => database, CONNECTION_COLLECTION: 'connections', META_CONNECTION_ID: 'local', ASSET_CHOICE_COLLECTION: 'choices',
        serverTimestamp: () => stamp(Date.now()), functions: { https: { HttpsError } },
        checkActiveStrongAdmin: async () => {}, normalizeFirestoreId: (value) => value,
        connectionDocument: (candidate) => ({ status: 'connected', candidateId: candidate.id }),
        auditMeta: async () => {}, publicConnectionState: (value) => value
    });
    const source = fs.readFileSync('functions/src/integrations/meta.js', 'utf8');
    vm.runInContext(source.slice(source.indexOf('async function persistOAuthConnection('), source.indexOf('function callbackHtml(')), scope);
    vm.runInContext(source.slice(source.indexOf('async function selectMetaAssetHandler('), source.indexOf('async function verifyMetaConnectionHandler(')), scope);
    return { records, startedAt, stamp,
        complete: () => scope.persistOAuthConnection({ stateRef: 'state', stateData: { uid: 'admin-local' }, connectionId: 'local', connection: { status: 'connected' } }),
        select: () => scope.selectMetaAssetHandler({ sessionId: 'choice-local', candidateId: 'candidate-local' }, { auth: { uid: 'admin-local' } })
    };
}

test('OAuth completion checks current admin access and refuses an intervening disconnect or newer connection', async () => {
    for (const options of [
        { active: false },
        { connection: { disconnectedAt: { toMillis: () => Date.now() } } },
        { connection: { oauthStartedAt: { toMillis: () => Date.now() } } }
    ]) {
        const h = harness(options);
        await assert.rejects(h.complete(), /META_OAUTH_/);
        assert.equal(h.records.get('state').status, 'processing');
        assert.notEqual(h.records.get('connections/local').status, 'connected');
    }
    const h = harness();
    await h.complete();
    assert.equal(h.records.get('state').status, 'completed');
    assert.equal(h.records.get('connections/local').status, 'connected');
    await assert.rejects(h.complete(), /META_OAUTH_AUTHORIZATION_EXPIRED/);
});

test('an old Meta asset selection cannot reconnect a disconnected account or replace a newer selection', async () => {
    for (const connection of [{ status: 'not_connected' }, { status: 'selection_required', selectionSessionId: 'newer-choice' }]) {
        const h = harness({ connection });
        await assert.rejects(h.select(), { code: 'failed-precondition' });
        assert.equal(h.records.has('choices/choice-local'), true);
    }
    const h = harness({ connection: { status: 'selection_required', selectionSessionId: 'choice-local' } });
    await h.select();
    assert.equal(h.records.get('connections/local').candidateId, 'candidate-local');
    assert.equal(h.records.has('choices/choice-local'), false);
    await assert.rejects(h.select(), { code: 'failed-precondition' });
});
