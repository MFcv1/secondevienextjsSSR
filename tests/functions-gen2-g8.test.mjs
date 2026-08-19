import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { GCLOUD_GEN2_TARGETS, buildGcloudGen2DeployArgs } from '../scripts/deploy-functions-targeted.mjs';
import { PARALLEL_MIGRATION_EXPORTS, extractLocalExports } from '../scripts/functions-gen2-inventory.mjs';

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

test('G8 exposes 35 fixed plus l=2 parallel Gen2 callables and preserves Gen1', () => {
  const exported = require(path.join(ROOT, 'functions/index.js'));
  assert.equal(Object.keys(exported).length, 251);
  assert.equal(FIXED.length, 35);
  assert.equal(MIGRATED_LEGACY.length, 2);
  for (const name of LOGICAL) {
    assert.equal(typeof exported[name], 'function', `${name} Gen1 absent`);
    assert.equal(typeof exported[`${name}Gen2`], 'function', `${name}Gen2 absent`);
  }
  for (const name of RETIRE_G12_A) assert.equal(typeof exported[name], 'function', `${name} Gen1 retiree trop tot`);
});

test('G8 inventory extractor recognizes every parallel export', () => {
  const exports = extractLocalExports(ROOT);
  assert.equal(exports.length, 251);
  assert.equal(PARALLEL_MIGRATION_EXPORTS.size, 94);
  assert.deepEqual(exports.filter(({ name }) => name.endsWith('Gen2') && !PARALLEL_MIGRATION_EXPORTS.has(name)), []);
});

test('G8 wrappers reuse Gen1 run handlers with App Check and bounded runtime', () => {
  const source = read('functions/src/commerce/gen2G8.js');
  assert.match(source, /legacyFunction\.run\(request\.data, request\)/);
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

test('G8 client registry cuts over exactly the 37 retained callables', () => {
  const registry = read('src/kit/config/functionTargets.js');
  for (const name of LOGICAL) assert.match(registry, new RegExp(`${name}: '${name}Gen2'`));
  for (const name of RETIRE_G12_A) assert.doesNotMatch(registry, new RegExp(`${name}: '${name}Gen2'`));
  assert.match(read('src/kit/commerce/CheckoutView.jsx'), /getFunctionTarget\('createOrder'\)/);
  assert.match(read('src/kit/commerce/CheckoutStripeModal.jsx'), /getFunctionTarget\('getOrderStatusClient'\)/);
});
