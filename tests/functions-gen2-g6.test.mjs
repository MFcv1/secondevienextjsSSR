import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import {
  GCLOUD_GEN2_TARGETS,
  buildGcloudGen2DeployArgs,
  validateDeploymentRequest
} from '../scripts/deploy-functions-targeted.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const CALLABLES = Object.freeze([
  'getCatalogPublicationStatus', 'rebuildCatalogSnapshot', 'rollbackCatalogSnapshot',
  'sendRefundStatusEmailAdmin', 'sendTestEmail',
  'completeBillingGuideAdmin', 'getBillingGuideOperatorStatus', 'getBillingGuideStatus',
  'resetBillingGuideTest', 'saveBillingGuideProgress',
  'getManualInvoiceWorkspaceAdmin', 'prepareManualInvoicePdfAdmin',
  'saveManualInvoiceDraftAdmin', 'sendManualInvoiceAdmin',
  'createQuoteRequest', 'finalizeQuoteRequest', 'getQuoteRequestAdmin',
  'listQuoteRequestsAdmin', 'updateQuoteRequestAdmin', 'uploadQuoteRequestPhoto',
  'claimNewsletterReward', 'drawNewsletterReward', 'listMyNewsletterRewards'
]);
const TRIGGER = 'onQuoteRequestSubmitted';
const TARGETS = [...CALLABLES, TRIGGER].map((name) => `${name}Gen2`);

test('G6 exports exactly 24 Gen2 functions after Gen1 retirement', () => {
  const exported = require(path.join(root, 'functions/index.js'));
  assert.equal(Object.keys(exported).length, 160);
  for (const name of [...CALLABLES, TRIGGER]) {
    assert.equal(exported[name], undefined, `${name} Gen1 encore exportee`);
    assert.equal(typeof exported[`${name}Gen2`], 'function', `${name}Gen2 absent`);
  }
});

test('G6 client registry cuts over only the 23 callables', () => {
  const registry = read('src/kit/config/functionTargets.js');
  for (const name of CALLABLES) {
    assert.match(registry, new RegExp(`${name}: '${name}Gen2'`));
  }
  assert.doesNotMatch(registry, /onQuoteRequestSubmitted:\s*'onQuoteRequestSubmittedGen2'/);
});

test('G6 deployment definitions use six bounded runtime families', () => {
  const targets = TARGETS.map((name) => GCLOUD_GEN2_TARGETS[name]);
  assert.ok(targets.every((target) => target?.g6 === true && target.create === true));
  assert.equal(new Set(targets.map((target) => target.runtimeServiceAccount)).size, 6);
  assert.equal(GCLOUD_GEN2_TARGETS.onQuoteRequestSubmittedGen2.triggerType, 'event');
  assert.equal(GCLOUD_GEN2_TARGETS.onQuoteRequestSubmittedGen2.documentPathPattern, 'quote_requests/{quoteId}');
  for (const name of TARGETS.filter((target) => target !== 'onQuoteRequestSubmittedGen2')) {
    assert.equal(GCLOUD_GEN2_TARGETS[name].triggerType, 'http-callable');
    assert.equal(GCLOUD_GEN2_TARGETS[name].concurrency, '1');
    assert.equal(GCLOUD_GEN2_TARGETS[name].maxInstances, name === 'getCatalogPublicationStatusGen2' ? '2' : '1');
  }
  assert.match(read('functions/src/catalog/catalogMaintenance.js'), /CATALOG_STATUS_GEN2_RUNTIME[\s\S]*maxInstances:\s*2/);
});

test('G6 deploy requires one immutable remote archive and never local source', () => {
  const digest = 'a'.repeat(64);
  const sourceUri = `gs://gcf-v2-sources-231220287936-europe-west1/g6/${digest}/function-source.zip`;
  const targetName = 'getCatalogPublicationStatusGen2';
  const manifest = {
    metadata: { project: 'secondevienextjsssr', codebase: 'main', baselineCommit: 'f5886ba3f36610a2e990b342bec6ff97c9d3d228' },
    gates: { deploymentAllowed: true },
    deploymentPolicy: { forbiddenTargets: [], archiveUri: sourceUri, archiveSha256: digest, archiveGeneration: '123', archiveSize: 1 },
    functions: [{ name: targetName, cloud: { present: false }, decision: { classification: 'MIGRATION_PARALLEL' } }]
  };
  const validation = validateDeploymentRequest({
    args: {
      project: 'secondevienextjsssr', codebase: 'main', commit: 'f5886ba3f36610a2e990b342bec6ff97c9d3d228',
      allowlist: targetName, transport: 'gcloud-gen2-create', 'source-uri': sourceUri,
      'source-sha256': digest, 'source-generation': '123'
    },
    manifest,
    rootDir: root,
    manifestPath: path.join(root, 'apphostingaudit/manifests/functions-gen2-g6.json'),
    digestPath: path.join(root, 'apphostingaudit/manifests/functions-gen2-g6-digest.json'),
    currentCommit: 'f5886ba3f36610a2e990b342bec6ff97c9d3d228',
    activeFirebaseProject: 'secondevienextjsssr',
    baselineIsAncestor: true
  });
  const args = buildGcloudGen2DeployArgs(validation);
  assert.ok(args.includes(`--source=${sourceUri}`));
  assert.ok(!args.includes('--source=functions'));
});

test('G6 trigger keeps the Gen1 claim/outbox handler and adds a v2 update trigger', () => {
  const source = read('functions/src/quotes/quoteRequests.js');
  assert.match(source, /const onQuoteRequestSubmitted = regionalFunctions\(\)/);
  assert.match(source, /const onQuoteRequestSubmittedGen2 = onDocumentUpdated\(/);
  assert.match(source, /idempotencyKey: `quote-received\/\$\{change\.after\.id\}`/);
  assert.match(source, /db\.runTransaction\(async \(transaction\) =>/);
  assert.match(source, /delivery\.status === 'sending'/);
  assert.match(source, /if \(!claimed\) return null/);
  assert.match(source, /GEN1_QUOTE_EMAIL_HANDOFF_MS/);
});
