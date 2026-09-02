import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import {
  GCLOUD_GEN2_TARGETS,
  buildGcloudGen2DeployArgs,
  validateDeploymentRequest
} from '../scripts/deploy-functions-targeted.mjs';
import {
  ACTIVE_OBSERVABILITY_EXPORTS,
  CLOUD_ONLY_PARALLEL_TARGETS,
  EXPECTED_CURRENT_CLOUD_COUNT,
  EXPECTED_CURRENT_SOURCE_COUNT,
  HOLD_META_RECONCILIATION,
  KEEP_GEN1_AUTH,
  PARALLEL_MIGRATION_EXPORTS,
  PENDING_OBSERVABILITY_EXPORTS,
  buildInventory,
  extractLocalExports,
  waveFor
} from '../scripts/functions-gen2-inventory.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const FIXED = Object.freeze([
  'adjustInventoryAdmin', 'archiveOrderAdmin', 'cancelReturnAdmin', 'createProductAdmin',
  'createPromotionCodeAdmin', 'createPublishedProductAdmin', 'decideCustomerReturnRequestAdmin',
  'deleteProductAdmin', 'getDeliveryPolicyAdmin', 'getOrderTimelineAdminV2',
  'listCustomerReturnRequestsAdminV2', 'listMyOrdersV2', 'listOrdersAdminV2',
  'listPromotionCodesAdmin', 'listReturnsAdminV2', 'markOrderDeliveredAdmin',
  'markOrderPickedUpAdmin', 'markOrderPreparingAdmin', 'markOrderReadyForPickupAdmin',
  'markOrderShippedAdmin', 'markReturnReceivedAdmin', 'openReturnAdmin',
  'preflightProductMutationAdmin', 'prepareCommerceDocumentDelivery', 'previewPromotionCodeV2',
  'publishProductAdmin', 'requestCustomerReturn', 'requestOrderCancellation',
  'resolveReturnAdmin', 'restockReturnLinesAdmin', 'saveDeliveryPolicyAdmin',
  'setPromotionCodeStatusAdmin', 'updateOrderTrackingAdmin', 'updateProductOfferAdmin',
  'writeOffReturnLinesAdmin'
]);
const MIGRATED_LEGACY = Object.freeze(['createOrder', 'getOrderStatusClient']);
const RETIRE_G12_A = Object.freeze(['cancelOrderClient', 'refundOrderAdmin', 'syncRefundStatusAdmin']);
const LOGICAL = Object.freeze([...FIXED, ...MIGRATED_LEGACY]);
const TARGETS = Object.freeze(LOGICAL.map((name) => `${name}Gen2`));

test('G8 exposes 35 fixed plus l=2 Gen2 callables after the Gen1 retirement', () => {
  const exported = require(path.join(ROOT, 'functions/index.js'));
  assert.equal(Object.keys(exported).length, 160);
  assert.equal(FIXED.length, 35);
  assert.equal(MIGRATED_LEGACY.length, 2);
  for (const name of LOGICAL) {
    assert.equal(exported[name], undefined, `${name} Gen1 encore exportee`);
    assert.equal(typeof exported[`${name}Gen2`], 'function', `${name}Gen2 absent`);
  }
  for (const name of RETIRE_G12_A) assert.equal(exported[name], undefined, `${name} Gen1 encore exportee`);
});

test('G8 inventory extractor recognizes every parallel export', () => {
  const exports = extractLocalExports(ROOT);
  assert.equal(exports.length, 160);
  assert.equal(EXPECTED_CURRENT_SOURCE_COUNT, 160);
  assert.equal(EXPECTED_CURRENT_CLOUD_COUNT, 150);
  assert.equal(PARALLEL_MIGRATION_EXPORTS.size, 120);
  assert.deepEqual(exports.filter(({ name }) => name.endsWith('Gen2') && !PARALLEL_MIGRATION_EXPORTS.has(name) && !PENDING_OBSERVABILITY_EXPORTS.has(name) && !ACTIVE_OBSERVABILITY_EXPORTS.has(name)), []);
});

test('G8 inventory rebuild accepts the current 150 cloud targets and assigns the real wave', () => {
  const exports = extractLocalExports(ROOT);
  const cloudNames = exports
    .map(({ name }) => name)
    .filter((name) => !HOLD_META_RECONCILIATION.has(name) && !PENDING_OBSERVABILITY_EXPORTS.has(name))
    .concat([...CLOUD_ONLY_PARALLEL_TARGETS]);
  const firebaseRows = cloudNames.map((id) => ({
    id,
    state: 'ACTIVE',
    project: 'secondevienextjsssr',
    codebase: 'main',
    platform: KEEP_GEN1_AUTH.has(id) ? 'gcfv1' : 'gcfv2',
    region: 'europe-west1',
    runtime: 'nodejs22',
    callableTrigger: {}
  }));
  const inventory = buildInventory({
    rootDir: ROOT,
    firebaseRows,
    gcloudRows: [],
    iamPolicies: new Map(),
    projectIam: { bindings: [] },
    commit: 'c'.repeat(40),
    operator: 'test'
  });
  assert.equal(inventory.metadata.sourceCount, 160);
  assert.equal(inventory.metadata.cloudCount, 150);
  assert.equal(inventory.metadata.cloudGen1Count, 3);
  assert.equal(inventory.metadata.cloudGen2Count, 147);
  for (const name of TARGETS) assert.equal(waveFor(name, 'MIGRATION_PARALLEL'), 'G8');
});

test('G8 wrappers reuse Gen1 run handlers with App Check and bounded runtime', () => {
  const source = read('functions/src/commerce/gen2G8.js');
  assert.match(source, /legacyFunction\.run\(data, request\)/);
  assert.match(source, /enforceAppCheck:\s*true/);
  assert.match(source, /cpu:\s*'gcf_gen1'/);
  assert.match(source, /concurrency:\s*1/);
  assert.match(source, /maxInstances:\s*1/);
});

test('G8 deploy definitions use one immutable archive and exact secrets', () => {
  const digest = 'a'.repeat(64);
  const sourceUri = `gs://gcf-v2-sources-231220287936-europe-west1/g8/${digest}/function-source.zip`;
  for (const name of TARGETS) {
    const target = GCLOUD_GEN2_TARGETS[name];
    assert.equal(target?.g8, true, `${name}: definition G8 absente`);
    assert.equal(target.runtime, 'nodejs22');
    assert.equal(target.concurrency, '1');
    assert.equal(target.maxInstances, '1');
    const args = buildGcloudGen2DeployArgs({
      transport: 'gcloud-gen2-create', project: 'secondevienextjsssr',
      allowlist: [name], sourceUri, commit: 'b'.repeat(40)
    });
    assert.ok(args.includes(`--source=${sourceUri}`));
  }
  assert.deepEqual(GCLOUD_GEN2_TARGETS.createOrderGen2.secrets, [
    'GMAIL_EMAIL=GMAIL_EMAIL:2', 'GMAIL_PASSWORD=GMAIL_PASSWORD:5',
    'STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:4'
  ]);
  assert.deepEqual(GCLOUD_GEN2_TARGETS.requestOrderCancellationGen2.secrets, ['STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:4']);
});

test('G8 targeted remediation uses the committed local source when no archive is supplied', () => {
  const args = buildGcloudGen2DeployArgs({
    transport: 'gcloud-gen2',
    project: 'secondevienextjsssr',
    allowlist: ['prepareCommerceDocumentDeliveryGen2'],
    sourceUri: null,
    commit: 'b'.repeat(40)
  });
  assert.ok(args.includes('--source=functions'));
  assert.equal(args.some((entry) => entry === '--source=null' || entry === '--source=undefined'), false);
});

test('G8 deploy validation binds URI, digest, generation and size to the manifest', () => {
  const manifest = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g8.json'));
  const target = manifest.functions[0].name;
  manifest.functions[0].cloud = { present: false };
  const common = {
    args: {
      project: 'secondevienextjsssr',
      codebase: 'main',
      commit: 'c'.repeat(40),
      allowlist: target,
      transport: 'gcloud-gen2-create',
      'source-uri': manifest.deploymentPolicy.archiveUri,
      'source-sha256': manifest.deploymentPolicy.archiveSha256,
      'source-generation': manifest.deploymentPolicy.archiveGeneration
    },
    manifest,
    rootDir: ROOT,
    manifestPath: path.join(ROOT, 'apphostingaudit/manifests/functions-gen2-g8.json'),
    digestPath: path.join(ROOT, 'apphostingaudit/manifests/functions-gen2-g8-digest.json'),
    currentCommit: 'c'.repeat(40),
    activeFirebaseProject: 'secondevienextjsssr',
    baselineIsAncestor: true
  };
  const valid = validateDeploymentRequest(common);
  assert.equal(valid.sourceGeneration, manifest.deploymentPolicy.archiveGeneration);
  assert.equal(valid.sourceSize, manifest.deploymentPolicy.archiveSize);
  assert.throws(() => validateDeploymentRequest({
    ...common,
    args: {
      ...common.args,
      'source-generation': String(Number(manifest.deploymentPolicy.archiveGeneration) + 1)
    }
  }), /differente du manifeste approuve/);
  assert.throws(() => validateDeploymentRequest({
    ...common,
    args: {
      ...common.args,
      'source-sha256': 'f'.repeat(64)
    }
  }), /URI et SHA-256 source G8 divergents|differente du manifeste approuve/);
});

test('G8 fixture suppresses provider delivery and proves cleanup before success', () => {
  const worker = read('functions/src/commerce/domain/outboxWorker.js');
  const fixture = read('scripts/prove-functions-gen2-g8.mjs');
  assert.match(worker, /entry\.testContext\?\.runId \|\| entry\.testContext\?\.fixtureScopeVersion/);
  assert.match(worker, /return repository\.markSuppressed/);
  assert.match(fixture, /Promise\.allSettled\(operations\)/);
  assert.match(fixture, /G8_PROOF_CLEANUP_OWNERSHIP/);
  assert.ok(
    fixture.indexOf('await cleanupFixture();') < fixture.indexOf('process.stdout.write'),
    'le succes ne doit etre imprime qu apres verification du cleanup'
  );
});

test('G8 inventoryVersion proof is deterministic and remains read-only', () => {
  const manifest = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g8.json'));
  const p1 = manifest.p1DryRun;
  assert.equal(p1.scanned, 37);
  assert.equal(p1.candidates, 10);
  assert.equal(p1.ready, 10);
  assert.equal(p1.refused, 0);
  assert.equal(p1.writePerformed, false);
  assert.equal(p1.preconditions.length, 10);
  assert.deepEqual(
    p1.preconditions.map(({ id }) => id),
    p1.preconditions.map(({ id }) => id).toSorted((left, right) => left.localeCompare(right))
  );
  const digest = crypto.createHash('sha256')
    .update(JSON.stringify(p1.preconditions))
    .digest('hex');
  assert.equal(digest, p1.lastUpdateTimeDigest);
  const planner = read('scripts/plan-functions-gen2-g1-data.mjs');
  assert.match(planner, /args\.has\('commit'\) \|\| args\.has\('apply'\) \|\| args\.has\('write'\)/);
  assert.match(planner, /LAST_UPDATE_TIME_PRECONDITION/);
  assert.match(planner, /executionState:\s*'NOT_EXECUTED'/);
});

test('G8 client registry cuts over exactly the 37 retained callables', () => {
  const registry = read('src/kit/config/functionTargets.js');
  for (const name of LOGICAL) assert.match(registry, new RegExp(`${name}: '${name}Gen2'`));
  for (const name of RETIRE_G12_A) assert.doesNotMatch(registry, new RegExp(`${name}: '${name}Gen2'`));
  assert.match(read('src/kit/commerce/CheckoutView.jsx'), /getFunctionTarget\('createOrder'\)/);
  assert.match(read('src/kit/commerce/CheckoutStripeModal.jsx'), /getFunctionTarget\('getOrderStatusClient'\)/);
});
