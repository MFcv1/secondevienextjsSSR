'use strict';

// Preuves d'audit hors ligne. Aucune connexion Firebase, aucun envoi, aucune
// mutation du projet. Les assertions constatent les défauts AVANT correction.
// Elles devront être remplacées par des attentes corrigées dans les tests métier.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../../..');
require(path.join(root, 'tests/commerce/helpers/no-network.cjs'));
const timestamp = seconds => ({ seconds, nanoseconds: 0 });

function memoryDb(initial = []) {
  const values = new Map(initial);
  const db = {
    doc: key => ({ path: key }),
    runTransaction: async fn => {
      const writes = [];
      const result = await fn({
        get: async ref => ({ exists: values.has(ref.path), data: () => values.get(ref.path) }),
        set: (ref, value) => writes.push([ref.path, value]),
      });
      for (const [key, value] of writes) values.set(key, value);
      return result;
    },
  };
  return { db, values };
}

async function reproduceActionCounter() {
  const { db, values } = memoryDb([
    ['admin_action_summary/current', { pendingReturns: 7, revision: 1 }],
  ]);
  let handler;
  const file = path.join(root, 'functions/src/admin/actionSummaryProjection.js');
  const actualRequire = createRequire(file);
  const firestore = () => db;
  firestore.FieldValue = { serverTimestamp: () => timestamp(30) };
  firestore.Timestamp = { fromDate: date => timestamp(date.getTime() / 1000) };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
    module, exports: module.exports, console: { info() {} },
    require: name => name === 'firebase-admin' ? { firestore }
      : name === 'firebase-functions/v2/firestore'
        ? { onDocumentWritten: (_options, callback) => { handler = callback; return callback; } }
        : actualRequire(name),
  }, { filename: file });
  const sourcePath = 'orders/synthetic-order/customer_return_requests/synthetic-request';
  const snapshot = (data, at) => ({ exists: data !== null, data: () => data,
    ref: { path: sourcePath }, updateTime: timestamp(at) });
  const event = (before, after, at) => ({ id: `synthetic-${at}`, params: {},
    data: { before: snapshot(before, at - 1), after: snapshot(after, at) } });
  // Sept AUTRES demandes sont en attente. La nouvelle a été créée puis traitée.
  // La résolution arrive avant la création : le bon total final reste sept.
  await handler(event({ status: 'pending_review' }, { status: 'completed' }, 20));
  await handler(event(null, { status: 'pending_review' }, 10));
  const observed = values.get('admin_action_summary/current').pendingReturns;
  assert.equal(observed, 6);
  return { finding: 'BA-01', expected: 7, observed, defectReproduced: true };
}

function reproduceNewsletterCounter() {
  const { planNewsletterProjection } = require(path.join(root,
    'functions/src/newsletter/newsletterProjectionDomain.js'));
  // Vingt contacts de baseline ; un NOUVEAU contact est créé puis supprimé.
  const deletion = planNewsletterProjection({ currentCount: 20, ledger: null,
    previousPresent: true, present: false, sourceUpdateTime: timestamp(20), eventId: 'delete' });
  const lateCreation = planNewsletterProjection({ currentCount: deletion.activeCount,
    ledger: { present: false, sourceUpdateTime: timestamp(20), eventId: 'delete' },
    previousPresent: false, present: true, sourceUpdateTime: timestamp(10), eventId: 'create' });
  assert.equal(lateCreation.activeCount, 19);
  return { finding: 'BA-02', expected: 20, observed: lateCreation.activeCount, defectReproduced: true };
}

async function reproduceStaleAnalyticsFact() {
  const { materializeSessionFact } = require(path.join(root, 'functions/src/analytics/rollups.js'));
  const { db, values } = memoryDb();
  const session = { startedAt: Date.parse('2026-09-04T12:00:00Z'),
    userId: 'synthetic', sessionActive: false, journeyCount: 2, device: 'Desktop' };
  await materializeSessionFact('synthetic-session', { ...session, duration: 120 }, db);
  await materializeSessionFact('synthetic-session', { ...session, duration: 60 }, db);
  const observed = values.get('analytics_session_facts/synthetic-session').contribution.duration;
  assert.equal(observed, 60);
  return { finding: 'BA-03', expectedDuration: 120, observedDuration: observed, defectReproduced: true };
}

function reproduceEarlyOutboxClaim() {
  const { claim } = require(path.join(root, 'functions/src/commerce/domain/outboxRepository.js'));
  const nowMillis = 100000;
  const result = claim({ status: 'failed', attemptCount: 1, nextAttemptAt: nowMillis + 60000 },
    { leaseToken: 'synthetic-lease', nowMillis, leaseMs: 60000 });
  assert.equal(result.status, 'processing');
  return { finding: 'BA-09', expected: 'not-due', observed: result.status, defectReproduced: true };
}

async function reproduceBeaconRace() {
  const file = path.join(root, 'functions/src/analytics/sessions.js');
  const actualRequire = createRequire(file);
  const syncToken = 'synthetic-audit-token-never-valid-in-cloud';
  let value = { syncTokenHash: actualRequire('./sessionSecurity').hashSyncToken(syncToken),
    duration: 0, sessionActive: true };
  const reference = { id: 'synthetic-session',
    get: async () => ({ exists: true, data: () => value }),
    update: async patch => { value = { ...value, ...patch }; } };
  const firestore = () => ({ collection: () => ({ doc: () => reference }) });
  firestore.FieldValue = { serverTimestamp: () => timestamp(30), increment: () => 1 };
  const regional = { runWith() { return this; }, https: { onCall: fn => fn, onRequest: fn => fn } };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
    module, exports: module.exports, Buffer, URL,
    require: name => name === 'firebase-admin' ? { firestore }
      : name === '../../helpers/runtime' ? { functions: {}, regionalFunctions: () => regional }
        : name === 'firebase-functions/v2/https' ? { onCall: (_o, fn) => fn, onRequest: (_o, fn) => fn }
          : name === '../../helpers/config' ? { getSiteUrl: () => 'https://audit.invalid' }
            : name === './sessionMaintenance' ? { createDeleteSessionHandler: () => () => {} }
              : name === '../../helpers/observability' ? { hashOpaque: value => value, structuredLog() {} }
                : actualRequire(name),
  }, { filename: file });
  const payload = { sessionId: 'synthetic-session', syncToken, duration: 120,
    sessionActive: false, journeyCount: 2 };
  const response = { set() { return this; }, status(value) { this.code = value; return this; }, send() { return this; } };
  await module.exports.syncSessionBeaconHandler({ headers: { origin: 'https://audit.invalid', 'content-type': 'text/plain' },
    method: 'POST', body: JSON.stringify(payload) }, response);
  assert.equal(response.code, 200);
  await module.exports.syncSessionHandler({ ...payload, duration: 60, sessionActive: true }, { auth: { uid: 'synthetic' } });
  assert.equal(value.duration, 60);
  assert.equal(value.sessionActive, true);
  return { finding: 'BA-04', expected: { duration: 120, sessionActive: false },
    observed: { duration: value.duration, sessionActive: value.sessionActive }, defectReproduced: true };
}

(async () => {
  const results = [await reproduceActionCounter(), reproduceNewsletterCounter(),
    await reproduceStaleAnalyticsFact(), await reproduceBeaconRace(), reproduceEarlyOutboxClaim()];
  process.stdout.write(`${JSON.stringify({ network: 'disabled', results }, null, 2)}\n`);
})().catch(error => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
