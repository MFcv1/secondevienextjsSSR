import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  buildGcloudGen2DeployArgs,
  validateDeploymentRequest
} from '../scripts/deploy-functions-targeted.mjs';
import {
  EXPECTED_SOURCE_COUNT,
  PARALLEL_MIGRATION_EXPORTS,
  classificationFor,
  extractLocalExports
} from '../scripts/functions-gen2-inventory.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(ROOT, 'apphostingaudit/manifests/functions-gen2-g4-track-admin-ip.json');
const DIGEST_PATH = path.join(ROOT, 'apphostingaudit/manifests/functions-gen2-g4-track-admin-ip-digest.json');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

test('G4 garde les suppressions analytics hors migration', () => {
  assert.deepEqual(manifest.preflight.destructiveTargets, {
    clearAllAffiliateClicks: 'HOLD_G11_DESTRUCTIVE_PRECONDITIONS',
    clearAllSessions: 'HOLD_G11_DESTRUCTIVE_PRECONDITIONS',
    deleteSession: 'HOLD_G11_DESTRUCTIVE_PRECONDITIONS'
  });
  for (const target of Object.keys(manifest.preflight.destructiveTargets)) {
    assert.ok(manifest.deploymentPolicy.forbiddenTargets.includes(`${target}Gen2`));
  }
});

test('G4 ajoute une seule cible parallele sans masquer la baseline 157', () => {
  const exports = extractLocalExports(ROOT);
  assert.equal(exports.length, EXPECTED_SOURCE_COUNT + 1);
  assert.deepEqual([...PARALLEL_MIGRATION_EXPORTS], ['trackAdminIPGen2']);
  assert.equal(classificationFor('trackAdminIPGen2'), 'MIGRATION_PARALLEL');
  assert.ok(exports.some(({ name }) => name === 'trackAdminIP'));
  assert.ok(exports.some(({ name }) => name === 'trackAdminIPGen2'));
});

test('trackAdminIP Gen2 conserve App Check/admin et serialise la carte IP', () => {
  const source = read('functions/src/analytics/adminIP.js');
  for (const expected of [
    /cpu:\s*'gcf_gen1'/,
    /concurrency:\s*1/,
    /minInstances:\s*0/,
    /maxInstances:\s*1/,
    /memory:\s*'256MiB'/,
    /timeoutSeconds:\s*60/,
    /serviceAccount:\s*ANALYTICS_RUNTIME_SERVICE_ACCOUNT/,
    /enforceAppCheck:\s*true/,
    /checkActiveStrongAdmin\(context\)/,
    /db\.runTransaction/,
    /transaction\.set\(adminIpsRef, \{ ips: currentIps \}, \{ merge: true \}\)/
  ]) assert.match(source, expected);
  assert.doesNotMatch(source, /trackAdminIPGen2[\s\S]*appspot\.gserviceaccount\.com/);
});

test('le beacon accepte le content-type reel sans relacher origine, taille ou token', () => {
  const source = read('functions/src/analytics/sessions.js');
  const client = read('src/kit/shared/AnalyticsProvider.jsx');
  assert.match(source, /hasBeaconTextBody/);
  assert.match(source, /\^text\\\/plain/);
  assert.match(source, /originAllowed/);
  assert.match(source, /req\.rawBody\.length > 64 \* 1024/);
  assert.match(source, /verifySessionSyncToken/);
  assert.match(client, /navigator\.sendBeacon\(url, payload\)/);
  assert.match(client, /'Content-Type': 'text\/plain;charset=UTF-8'/);
});

test('le registre client reste sur Gen1 avant cutover', () => {
  const registry = read('src/kit/config/functionTargets.js');
  assert.match(registry, /trackAdminIP:\s*'trackAdminIP'/);
  assert.doesNotMatch(registry, /trackAdminIP:\s*'trackAdminIPGen2'/);
  assert.match(read('src/kit/config/firebaseLazy.js'), /getFunctionTarget\(name\)/);
  assert.equal(manifest.functions[0].clientRegistry.cutoverAllowed, false);
});

test('le wrapper de creation G4 est une cible unique, explicite et publique seulement au transport', () => {
  const currentCommit = '1111111111111111111111111111111111111111';
  const request = {
    args: {
      project: 'secondevienextjsssr',
      codebase: 'main',
      commit: currentCommit,
      manifest: path.relative(ROOT, MANIFEST_PATH),
      digest: path.relative(ROOT, DIGEST_PATH),
      allowlist: 'trackAdminIPGen2',
      transport: 'gcloud-gen2-create'
    },
    manifest,
    rootDir: ROOT,
    manifestPath: MANIFEST_PATH,
    digestPath: DIGEST_PATH,
    currentCommit,
    activeFirebaseProject: 'secondevienextjsssr',
    baselineIsAncestor: true
  };
  assert.equal(manifest.gates.deploymentAllowed, true);
  assert.equal(manifest.gates.runtimeIamReady, true);
  const validation = validateDeploymentRequest(request);
  const args = buildGcloudGen2DeployArgs(validation);
  for (const expected of [
    'functions', 'deploy', 'trackAdminIPGen2',
    '--project=secondevienextjsssr', '--region=europe-west1', '--gen2',
    '--entry-point=trackAdminIPGen2', '--trigger-http',
    '--run-service-account=analytics-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    '--build-service-account=projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    '--memory=256Mi', '--cpu=167m', '--timeout=60s', '--concurrency=1',
    '--min-instances=0', '--max-instances=1', '--allow-unauthenticated'
  ]) assert.ok(args.includes(expected), expected);
  assert.equal(args.includes('--set-secrets'), false);
  assert.ok(manifest.deploymentPolicy.forbiddenTargets.includes('clearAllSessionsGen2'));
});

test('la configuration IAM G4 est bornee, sans secret ni cle utilisateur', () => {
  const source = read('scripts/configure-functions-gen2-g4-analytics-iam.mjs');
  for (const expected of [
    /G4_CREATE_ANALYTICS_RUNTIME/,
    /SERVICE_ACCOUNT_ID = 'analytics-runtime'/,
    /SERVICE_ACCOUNT = `\$\{SERVICE_ACCOUNT_ID\}@\$\{PROJECT\}\.iam\.gserviceaccount\.com`/,
    /roles\/datastore\.user/,
    /roles\/logging\.logWriter/,
    /roles\/serviceusage\.serviceUsageConsumer/,
    /userManagedKeys\.length === 0/,
    /G4_IAM_EFFECTIVE_PROJECT_MISMATCH/,
    /G4_IAM_COMMIT_MISMATCH/
  ]) assert.match(source, expected);
  assert.doesNotMatch(source, /roles\/editor|roles\/owner/i);
  assert.match(source, /secretAccessor:\s*roles\.includes\('roles\/secretmanager\.secretAccessor'\)/);
  const iam = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g4-analytics-iam.json'));
  assert.equal(iam.ready, true);
  assert.deepEqual(iam.observedRoles, iam.requiredRoles);
  assert.equal(iam.userManagedKeyCount, 0);
  assert.equal(iam.secretAccessor, false);
});
