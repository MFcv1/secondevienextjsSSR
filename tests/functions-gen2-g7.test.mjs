import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { GCLOUD_GEN2_TARGETS, buildGcloudGen2DeployArgs } from '../scripts/deploy-functions-targeted.mjs';
import { EXPECTED_CURRENT_SOURCE_COUNT, PARALLEL_MIGRATION_EXPORTS, extractLocalExports } from '../scripts/functions-gen2-inventory.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

const CLOUD_NAMES = Object.freeze([
  'disconnectMetaConnectionAdmin',
  'getMetaConnectionStatusAdmin',
  'getSocialPublicationStatusAdmin',
  'metaOAuthCallback',
  'prepareSocialPublicationAdmin',
  'runSocialPublicationAdmin',
  'selectMetaAssetAdmin',
  'startMetaOAuthAdmin',
  'verifyMetaConnectionAdmin'
]);
const INSTAGRAM_NAMES = Object.freeze([
  'disconnectInstagramConnectionAdmin',
  'getInstagramConnectionStatusAdmin',
  'instagramOAuthCallback',
  'startInstagramOAuthAdmin',
  'verifyInstagramConnectionAdmin'
]);
const LOGICAL_NAMES = Object.freeze([...CLOUD_NAMES, ...INSTAGRAM_NAMES]);
const TARGETS = Object.freeze(LOGICAL_NAMES.map((name) => `${name}Gen2`));
const CALLBACKS = new Set(['metaOAuthCallback', 'instagramOAuthCallback']);

test('G7 conserve exactement ses 14 Gen2 apres le retrait des proprietaires Gen1', () => {
  const exported = require(path.join(ROOT, 'functions/index.js'));
  assert.equal(Object.keys(exported).length, EXPECTED_CURRENT_SOURCE_COUNT);
  for (const name of CLOUD_NAMES) {
    assert.equal(exported[name], undefined, `${name} Gen1 encore exportee`);
    assert.equal(typeof exported[`${name}Gen2`], 'function', `${name}Gen2 absent`);
  }
  for (const name of INSTAGRAM_NAMES) {
    assert.equal(typeof exported[name], 'function', `${name} alias local conserve absent`);
    assert.equal(typeof exported[`${name}Gen2`], 'function', `${name}Gen2 absent`);
  }
});

test('G7 reconciles the inventory extractor through G6 and the 14 G7 exports', () => {
  const exports = extractLocalExports(ROOT);
  assert.equal(exports.length, EXPECTED_CURRENT_SOURCE_COUNT);
  assert.equal(PARALLEL_MIGRATION_EXPORTS.size, 119);
  assert.deepEqual(
    exports.filter(({ name }) => name.endsWith('Gen2') && !PARALLEL_MIGRATION_EXPORTS.has(name)),
    []
  );
});

test('G7 wrappers share handlers, enforce App Check on callables and keep callbacks public HTTP', () => {
  const source = read('functions/src/integrations/meta.js');
  assert.match(source, /const \{ onCall, onRequest \} = require\('firebase-functions\/v2\/https'\)/);
  assert.match(source, /META_GEN2_CALLABLE_RUNTIME[\s\S]*?enforceAppCheck:\s*true/);
  assert.match(source, /META_GEN2_PUBLICATION_RUNTIME[\s\S]*?timeoutSeconds:\s*300[\s\S]*?memory:\s*'512MiB'/);
  assert.match(source, /metaOAuthCallbackGen2:\s*onRequest\([\s\S]*?metaOAuthCallbackHandler/);
  assert.match(source, /instagramOAuthCallbackGen2:\s*onRequest\([\s\S]*?instagramOAuthCallbackHandler/);
  for (const name of LOGICAL_NAMES.filter((name) => !CALLBACKS.has(name))) {
    assert.match(source, new RegExp(`${name}Gen2:\\s*onCall\\(`));
  }
});

test('G7 deployment definitions use one bounded runtime and exact secret families', () => {
  for (const targetName of TARGETS) {
    const target = GCLOUD_GEN2_TARGETS[targetName];
    assert.equal(target?.g7, true, `${targetName}: definition G7 absente`);
    assert.equal(target.create, true);
    assert.equal(target.region, 'europe-west1');
    assert.equal(target.runtime, 'nodejs22');
    assert.equal(target.runtimeServiceAccount, 'meta-runtime@secondevienextjsssr.iam.gserviceaccount.com');
    assert.equal(target.concurrency, '1');
    assert.equal(target.maxInstances, '1');
  }
  assert.equal(GCLOUD_GEN2_TARGETS.metaOAuthCallbackGen2.triggerType, 'http-public');
  assert.equal(GCLOUD_GEN2_TARGETS.instagramOAuthCallbackGen2.triggerType, 'http-public');
  assert.deepEqual(GCLOUD_GEN2_TARGETS.getSocialPublicationStatusAdminGen2.secrets, []);
  assert.deepEqual(GCLOUD_GEN2_TARGETS.startMetaOAuthAdminGen2.secrets, [
    'META_APP_ID=META_APP_ID:1',
    'META_APP_SECRET=META_APP_SECRET:1',
    'META_OAUTH_REDIRECT_URI=META_OAUTH_REDIRECT_URI:2',
    'META_TOKEN_ENCRYPTION_KEY=META_TOKEN_ENCRYPTION_KEY:1'
  ]);
  assert.deepEqual(GCLOUD_GEN2_TARGETS.startInstagramOAuthAdminGen2.secrets, [
    'INSTAGRAM_APP_ID=INSTAGRAM_APP_ID:1',
    'INSTAGRAM_APP_SECRET=INSTAGRAM_APP_SECRET:1',
    'INSTAGRAM_OAUTH_REDIRECT_URI=INSTAGRAM_OAUTH_REDIRECT_URI:2',
    'META_TOKEN_ENCRYPTION_KEY=META_TOKEN_ENCRYPTION_KEY:1'
  ]);
});

test('G7 deploy arguments reuse one immutable G7 archive', () => {
  const digest = 'a'.repeat(64);
  const sourceUri = `gs://gcf-v2-sources-231220287936-europe-west1/g7/${digest}/function-source.zip`;
  const validation = {
    transport: 'gcloud-gen2-create',
    project: 'secondevienextjsssr',
    allowlist: ['startMetaOAuthAdminGen2'],
    sourceUri,
    commit: 'b'.repeat(40)
  };
  const args = buildGcloudGen2DeployArgs(validation);
  assert.ok(args.includes(`--source=${sourceUri}`));
  assert.ok(args.includes('--entry-point=startMetaOAuthAdminGen2'));
  assert.ok(!args.includes('--source=functions'));
});

test('G7 client registry cuts over the 12 callables but never the two callbacks', () => {
  const registry = read('src/kit/config/functionTargets.js');
  for (const name of LOGICAL_NAMES.filter((name) => !CALLBACKS.has(name))) {
    assert.match(registry, new RegExp(`${name}: '${name}Gen2'`));
  }
  assert.doesNotMatch(registry, /metaOAuthCallback:\s*'metaOAuthCallbackGen2'/);
  assert.doesNotMatch(registry, /instagramOAuthCallback:\s*'instagramOAuthCallbackGen2'/);
});

test('G7 runtime IAM is bounded to Firestore, logs, service usage and seven named secrets', () => {
  const source = read('scripts/configure-functions-gen2-g7-iam.mjs');
  for (const expected of [
    /G7_CREATE_META_RUNTIME/,
    /SERVICE_ACCOUNT_ID = 'meta-runtime'/,
    /roles\/datastore\.user/,
    /roles\/logging\.logWriter/,
    /roles\/serviceusage\.serviceUsageConsumer/,
    /roles\/secretmanager\.secretAccessor/,
    /userManagedKeys\.length === 0/
  ]) assert.match(source, expected);
  assert.doesNotMatch(source, /roles\/(?:editor|owner|storage\.objectAdmin|firebaseauth\.admin)/i);
});
