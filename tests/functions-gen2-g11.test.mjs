import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import {
  buildGcloudGen2DeployArgs,
  GCLOUD_GEN2_TARGETS
} from '../scripts/deploy-functions-targeted.mjs';
import {
  EXPECTED_CURRENT_CLOUD_COUNT,
  EXPECTED_CURRENT_SOURCE_COUNT,
  extractLocalExports,
  waveFor
} from '../scripts/functions-gen2-inventory.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const {
  DELETE_SESSION_ACTION,
  createDeleteSessionHandler
} = require('../functions/src/analytics/sessionMaintenance.js');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

const UPDATE_TIME = '2026-08-22T14:00:00.000Z';

function createHarness({ sessionExists = true, checkAdmin = async () => ({}) } = {}) {
  const state = {
    sessionExists,
    deletes: 0,
    auditWrites: 0,
    audits: new Map(),
    cacheRemovals: []
  };
  const snapshot = (exists, data = {}) => ({
    exists,
    data: () => data,
    updateTime: exists ? { toDate: () => new Date(UPDATE_TIME) } : null
  });
  const ref = (collection, id) => ({
    collection,
    id,
    path: `${collection}/${id}`,
    async get() {
      if (collection === 'analytics_sessions') return snapshot(state.sessionExists);
      return snapshot(state.audits.has(id), state.audits.get(id));
    }
  });
  const db = {
    collection(name) {
      return { doc: (id) => ref(name, id) };
    },
    async runTransaction(callback) {
      const transaction = {
        get: (documentRef) => documentRef.get(),
        delete(documentRef) {
          assert.equal(documentRef.collection, 'analytics_sessions');
          state.sessionExists = false;
          state.deletes += 1;
        },
        set(documentRef, value) {
          assert.equal(documentRef.collection, 'sys_audit_security');
          state.audits.set(documentRef.id, value);
          state.auditWrites += 1;
        }
      };
      return callback(transaction);
    }
  };
  const handler = createDeleteSessionHandler({
    db,
    checkAdmin,
    getAuditInfo: () => ({ uid: 'admin-fixture' }),
    serverTimestamp: () => 'SERVER_TIMESTAMP',
    auditExpiry: () => 'AUDIT_EXPIRY',
    authorizationCache: { remove: (id) => state.cacheRemovals.push(id) }
  });
  return { handler, state };
}

const request = (overrides = {}) => ({
  mode: 'dry_run',
  sessionId: 'session-fixture-1',
  operationId: 'operation-fixture-1',
  confirmation: {
    action: DELETE_SESSION_ACTION,
    sessionId: 'session-fixture-1'
  },
  ...overrides
});

test('G11 refuse un appel sans admin fort avant toute lecture', async () => {
  const denied = Object.assign(new Error('denied'), { code: 'permission-denied' });
  const { handler, state } = createHarness({ checkAdmin: async () => { throw denied; } });
  await assert.rejects(handler(request(), {}), denied);
  assert.equal(state.deletes, 0);
  assert.equal(state.auditWrites, 0);
});

test('G11 exige une confirmation structuree exacte', async () => {
  const { handler, state } = createHarness();
  await assert.rejects(
    handler(request({ confirmation: { action: DELETE_SESSION_ACTION, sessionId: 'other' } }), {}),
    (error) => error.code === 'invalid-argument'
  );
  assert.equal(state.deletes, 0);
  assert.equal(state.auditWrites, 0);
});

test('G11 dry-run est le defaut, borne une cible et ne produit aucune ecriture', async () => {
  const { handler, state } = createHarness();
  const result = await handler(request({ mode: undefined }), {});
  assert.deepEqual(result, {
    mode: 'dry_run',
    operationId: 'operation-fixture-1',
    wouldDelete: true,
    batch: { size: 1, limit: 1, resumable: true },
    precondition: { updateTime: UPDATE_TIME }
  });
  assert.equal(state.deletes, 0);
  assert.equal(state.auditWrites, 0);
});

test('G11 commit exige la version exacte issue du dry-run', async () => {
  const { handler, state } = createHarness();
  await assert.rejects(
    handler(request({ mode: 'commit', expectedUpdateTime: '2026-08-22T13:59:59.000Z' }), {}),
    (error) => error.code === 'failed-precondition' && error.details?.reason === 'SESSION_VERSION_CHANGED'
  );
  assert.equal(state.deletes, 0);
  assert.equal(state.auditWrites, 0);
});

test('G11 commit est atomique, audite et reprenable par operationId', async () => {
  const { handler, state } = createHarness();
  const payload = request({ mode: 'commit', expectedUpdateTime: UPDATE_TIME });
  const first = await handler(payload, {});
  const retry = await handler(payload, {});
  assert.deepEqual(first, {
    mode: 'commit',
    operationId: 'operation-fixture-1',
    deleted: true,
    alreadyApplied: false
  });
  assert.equal(retry.deleted, true);
  assert.equal(retry.alreadyApplied, true);
  assert.equal(state.deletes, 1);
  assert.equal(state.auditWrites, 1);
  assert.deepEqual(state.cacheRemovals, ['session-fixture-1', 'session-fixture-1']);
});

test('G11 Gen2 est une cible unique, App Check et runtime moindre privilege', () => {
  const exports = extractLocalExports(ROOT);
  assert.equal(exports.length, 276);
  assert.equal(EXPECTED_CURRENT_SOURCE_COUNT, 276);
  assert.equal(EXPECTED_CURRENT_CLOUD_COUNT, 273);
  assert.equal(waveFor('deleteSessionGen2', 'MIGRATION_PARALLEL'), 'G11');
  assert.ok(exports.some(({ name }) => name === 'deleteSession'));
  assert.ok(exports.some(({ name }) => name === 'deleteSessionGen2'));

  const source = read('functions/src/analytics/sessions.js');
  assert.match(source, /exports\.deleteSessionGen2 = onCall\(/);
  assert.match(source, /ANALYTICS_CALLABLE_GEN2_RUNTIME/);
  assert.match(source, /enforceAppCheck:\s*true/);
  assert.match(read('src/kit/config/functionTargets.js'), /deleteSession:\s*'deleteSessionGen2'/);

  const target = GCLOUD_GEN2_TARGETS.deleteSessionGen2;
  assert.equal(target.g11, true);
  assert.equal(target.runtimeServiceAccount, 'analytics-runtime@secondevienextjsssr.iam.gserviceaccount.com');
  assert.equal(target.concurrency, '1');
  assert.equal(target.maxInstances, '1');
  assert.equal(target.memory, '256Mi');
  const args = buildGcloudGen2DeployArgs({
    transport: 'gcloud-gen2-create',
    project: 'secondevienextjsssr',
    allowlist: ['deleteSessionGen2'],
    sourceUri: `gs://gcf-v2-sources-231220287936-europe-west1/g11/${'a'.repeat(64)}/function-source.zip`,
    commit: 'b'.repeat(40)
  });
  assert.ok(args.includes('--entry-point=deleteSessionGen2'));
  assert.ok(args.includes('--concurrency=1'));
  assert.ok(args.includes('--max-instances=1'));
  assert.ok(args.includes('--allow-unauthenticated'));
});
