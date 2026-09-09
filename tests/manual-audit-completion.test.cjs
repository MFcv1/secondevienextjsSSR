'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { hashSyncToken, isValidSyncToken } = require('../functions/src/analytics/sessionSecurity');
const { finalizeInactiveSessions, removeMaterializedSessionFact } = require('../functions/src/analytics/rollups');
const { compareTimestamps } = require('../functions/src/admin/dashboardProjection');
const { classifyIncidentCode } = require('../functions/src/observability/incidentProjection');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const extract = (file, start, end) => {
    const source = read(file);
    const from = source.indexOf(start);
    const to = source.indexOf(end, from);
    assert.ok(from >= 0 && to > from, `Missing source boundaries: ${file}`);
    return source.slice(from, to);
};
const stamp = millis => ({ toMillis: () => millis });

test('session conversion checks the current token and does not claim an unprotected legacy session', async () => {
    const source = extract('functions/src/analytics/updateUserSessionsHandler.cjs', 'const updateUserSessionsHandler', '\nreturn updateUserSessionsHandler');
    for (const [current, token, expected] of [
        [{ type: 'anonymous' }, 'arbitrary', 0],
        [{ type: 'anonymous', syncTokenHash: hashSyncToken('fresh') }, 'old', 0],
        [{ type: 'anonymous', syncTokenHash: hashSyncToken('fresh') }, 'fresh', 1],
    ]) {
        const writes = [];
        const db = {
            collection: name => ({ doc: id => `${name}/${id}` }),
            runTransaction: run => run({
                get: async ref => ({ exists: !ref.startsWith('sys_admin_access'), data: () => current }),
                update: (ref, data) => writes.push({ ref, data }),
            }),
        };
        const run = vm.runInNewContext(source + '\nupdateUserSessionsHandler', {
            db, isValidSyncToken, functions: { https: { HttpsError: Error } }, structuredLog() {},
            admin: { firestore: { FieldValue: { serverTimestamp: () => 'now' } } },
        });
        const result = await run({ sessionId: 'session-audit', syncToken: token }, { auth: { uid: 'new-client' } });
        assert.equal(writes.length, expected);
        if (expected) {
            assert.equal(result.updatedCount, 1);
            assert.equal(writes[0].data.userId, 'new-client');
            assert.equal(writes[0].data.originalType, 'anonymous');
        } else assert.equal(result.skipped, true);
    }
});

test('inactivity finalization preserves a session refreshed after the initial query', async () => {
    const now = Date.now();
    const writes = [];
    const docs = ['stale', 'refreshed', 'deleted'].map(id => ({ ref: id }));
    const query = { where: () => query, orderBy: () => query, limit: () => query, get: async () => ({ empty: false, docs }) };
    const db = {
        collection: () => query,
        runTransaction: run => run({
            getAll: async () => docs.map(({ ref }) => ({
                ref, exists: ref !== 'deleted',
                data: () => ref === 'deleted' ? undefined : { sessionActive: true, lastActivityAt: stamp(ref === 'stale' ? now - 3600000 : now) },
            })),
            update: ref => writes.push(ref),
        }),
    };
    assert.equal(await finalizeInactiveSessions(db), 1);
    assert.deepEqual(writes, ['stale']);
});

test('materialized fact removal fails closed if its contribution changed before the transaction', async () => {
    const fact = { dateKey: '2026-09-07', shardId: '00', contribution: { duration: 10 } };
    const query = { where: () => query, orderBy: () => query, limit: () => query };
    const db = {
        doc: () => ({ get: async () => ({ exists: true, data: () => fact }) }),
        collection: () => query,
        runTransaction: run => run({ get: async () => ({ exists: true, data: () => ({ ...fact, contribution: { duration: 20 } }) }) }),
    };
    await assert.rejects(removeMaterializedSessionFact('session-audit', db), /ANALYTICS_FACT_CHANGED_RETRY_REQUIRED/);
});

test('duplicate and reordered provider events cannot reopen a resolved incident', async () => {
    const source = extract('functions/src/observability/businessEvents.js', 'async function upsertSourceIncident', '\nconst journalOrderEventGen2');
    let state = null;
    let writes = 0;
    const db = {
        doc: path => path,
        runTransaction: run => run({
            get: async () => ({ exists: Boolean(state), data: () => state }),
            set: (_ref, next) => { writes++; state = { ...state, ...next }; },
        }),
    };
    const run = vm.runInNewContext(source + '\nupsertSourceIncident', {
        compareTimestamps, classifyIncidentCode, hashOpaque: x => x, toTimestamp: stamp,
        admin: { firestore: Object.assign(() => db, { FieldValue: { serverTimestamp: () => 'now' } }) },
    });
    const base = { sourceKind: 'outbox', sourceId: 'message', code: 'operations_failedOutbox' };
    await run({ ...base, active: true, occurredAt: 100, sourceUpdateTime: stamp(100) });
    await run({ ...base, active: false, occurredAt: 200, sourceUpdateTime: stamp(200) });
    await run({ ...base, active: true, occurredAt: 100, sourceUpdateTime: stamp(100) });
    await run({ ...base, active: false, occurredAt: 200, sourceUpdateTime: stamp(200) });
    assert.equal(state.status, 'closed');
    assert.equal(state.occurrenceCount, 2);
    assert.equal(writes, 2);
    assert.equal(classifyIncidentCode('constructor').known, false);
});

test('foreign-currency captures never increment the EUR counter', async () => {
    const source = extract('functions/src/observability/businessEvents.js', 'async function ensureCapturedOrderCount', '\nasync function markFinanceProjectionUnavailable');
    const run = vm.runInNewContext(source + '\nensureCapturedOrderCount', {});
    assert.equal((await run('fact-usd', { type: 'capture', currency: 'USD' })).outcome, 'other_currency');
});

test('homepage saves reject stale fields while allowing unrelated concurrent edits', async () => {
    const source = extract('src/kit/admin/AdminHomepage.jsx', '    const saveFields =', '\n    const reportAction');
    let writes = 0;
    const documents = { about: { title: 'initial', subtitle: 'initial' } };
    let current = { title: 'new title', subtitle: 'initial' };
    const run = vm.runInNewContext(source + '\nsaveFields', {
        documents, db: {}, doc: (_db, _collection, id) => id,
        runTransaction: (_db, work) => work({
            get: async () => ({ exists: () => true, data: () => current }),
            set: () => { writes++; },
        }),
    });
    await assert.rejects(run('about', { title: 'my title' }), /autre session/);
    assert.equal(writes, 0);
    await run('about', { subtitle: 'my subtitle' });
    assert.equal(writes, 1);
});

test('image crop waits for persistence, blocks double submission and stays open on save failure', async () => {
    const source = extract('src/kit/admin/components/ImageCropperModal.jsx', '    const handleGenerateCroppedImage =', '\n    if (!isOpen');
    let settle, closed = 0, saves = 0;
    const errors = [];
    const runningRef = { current: false };
    const context = {
        image: 'local-image', croppedAreaPixels: {}, rotation: 0, runningRef,
        activeRef: { current: true }, generationRef: { current: 1 },
        setBusy() {}, setError: error => errors.push(error), getCroppedImg: async () => 'blob',
        onCropComplete: () => { saves++; return new Promise((_resolve, reject) => { settle = reject; }); },
        onClose: () => { closed++; },
    };
    const run = vm.runInNewContext(source + '\nhandleGenerateCroppedImage', context);
    const pending = run();
    await Promise.resolve();
    await run();
    assert.equal(saves, 1);
    assert.equal(closed, 0);
    settle(new Error('save failed'));
    await pending;
    assert.equal(errors.at(-1), 'save failed');
    assert.equal(closed, 0);
    assert.equal(runningRef.current, false);
});

test('an obsolete crop result cannot be published for a new image', async () => {
    const source = extract('src/kit/admin/components/ImageCropperModal.jsx', '    const handleGenerateCroppedImage =', '\n    if (!isOpen');
    let resolveCrop, saves = 0;
    const generationRef = { current: 1 };
    const run = vm.runInNewContext(source + '\nhandleGenerateCroppedImage', {
        image: 'first-image', croppedAreaPixels: {}, rotation: 0, runningRef: { current: false },
        activeRef: { current: true }, generationRef, setBusy() {}, setError() {},
        getCroppedImg: () => new Promise(resolve => { resolveCrop = resolve; }),
        onCropComplete: () => { saves++; }, onClose() {},
    });
    const pending = run();
    generationRef.current++;
    resolveCrop('old-blob');
    await pending;
    assert.equal(saves, 0);
});

test('late analytics completion cannot rearm a heartbeat after unmount', () => {
    const source = extract('src/kit/shared/AnalyticsProvider.jsx', '    armHeartbeatRef.current =', '\n    flushSessionRef.current =');
    let timers = 0;
    const mountedRef = { current: false };
    const context = { armHeartbeatRef: {}, clearHeartbeatTimer() {}, mountedRef, sessionIdRef: { current: 'session' },
        isAdmin: false, hasConsent: () => true, document: { visibilityState: 'visible' }, lastSyncAtRef: { current: Date.now() },
        heartbeatTimerRef: {}, ANALYTICS_SYNC_INTERVAL_MS: 30000, setTimeout: () => { timers++; },
    };
    const arm = vm.runInNewContext(source + '\narmHeartbeatRef.current', context);
    arm();
    assert.equal(timers, 0);
    mountedRef.current = true;
    arm();
    assert.equal(timers, 1);
});
