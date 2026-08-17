import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  buildGcloudGen2DeployArgs,
  GCLOUD_GEN2_TARGETS,
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
const CUTOVER_PATH = path.join(ROOT, 'apphostingaudit/manifests/functions-gen2-g4-track-admin-ip-cutover.json');
const ROLLOUT_PATH = path.join(ROOT, 'apphostingaudit/manifests/functions-gen2-g4-track-admin-ip-rollout.json');
const UPDATE_USER_SESSIONS_MANIFEST_PATH = path.join(ROOT, 'apphostingaudit/manifests/functions-gen2-g4-update-user-sessions.json');
const UPDATE_USER_SESSIONS_DIGEST_PATH = path.join(ROOT, 'apphostingaudit/manifests/functions-gen2-g4-update-user-sessions-digest.json');
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

test('G4 prepare deux cibles paralleles sans masquer la baseline 157', () => {
  const exports = extractLocalExports(ROOT);
  assert.equal(exports.length, EXPECTED_SOURCE_COUNT + 2);
  assert.deepEqual([...PARALLEL_MIGRATION_EXPORTS], ['trackAdminIPGen2', 'updateUserSessionsGen2']);
  assert.equal(classificationFor('trackAdminIPGen2'), 'MIGRATION_PARALLEL');
  assert.equal(classificationFor('updateUserSessionsGen2'), 'MIGRATION_PARALLEL');
  assert.ok(exports.some(({ name }) => name === 'trackAdminIP'));
  assert.ok(exports.some(({ name }) => name === 'trackAdminIPGen2'));
  assert.ok(exports.some(({ name }) => name === 'updateUserSessions'));
  assert.ok(exports.some(({ name }) => name === 'updateUserSessionsGen2'));
});

test('updateUserSessions Gen2 partage exactement le handler Gen1 et borne son runtime', () => {
  const source = read('functions/src/analytics/updateUserSessions.js');
  for (const expected of [
    /const updateUserSessionsHandler = async \(_data, context\) =>/,
    /exports\.updateUserSessions = regionalFunctions\(\)/,
    /\.https\.onCall\(updateUserSessionsHandler\)/,
    /exports\.updateUserSessionsGen2 = onCall\(/,
    /updateUserSessionsHandler\(request\.data, request\)/,
    /cpu:\s*'gcf_gen1'/,
    /concurrency:\s*1/,
    /minInstances:\s*0/,
    /maxInstances:\s*1/,
    /memory:\s*'256MiB'/,
    /timeoutSeconds:\s*60/,
    /serviceAccount:\s*ANALYTICS_RUNTIME_SERVICE_ACCOUNT/,
    /enforceAppCheck:\s*true/
  ]) assert.match(source, expected);
  assert.doesNotMatch(source, /updateUserSessionsGen2[\s\S]*appspot\.gserviceaccount\.com/);
});

test('updateUserSessions Gen2 est autorisee seule apres fermeture acceleree G4-A1', () => {
  const prepared = JSON.parse(fs.readFileSync(UPDATE_USER_SESSIONS_MANIFEST_PATH, 'utf8'));
  const registry = read('src/kit/config/functionTargets.js');
  const target = GCLOUD_GEN2_TARGETS.updateUserSessionsGen2;

  assert.equal(prepared.metadata.project, 'secondevienextjsssr');
  assert.equal(prepared.functions.length, 1);
  assert.equal(prepared.functions[0].name, 'updateUserSessionsGen2');
  assert.equal(prepared.functions[0].cloud.present, false);
  assert.equal(prepared.functions[0].decision.deploymentMaxBatchSize, 1);
  assert.equal(prepared.gates.deploymentAllowed, true);
  assert.equal(prepared.gates.clientCutoverAuthorized, false);
  assert.equal(prepared.preflight.trackAdminIPObservationState, 'CLOSED_ACCELERATED_BY_USER');
  assert.match(registry, /updateUserSessions:\s*'updateUserSessions'/);
  assert.doesNotMatch(registry, /updateUserSessions:\s*'updateUserSessionsGen2'/);
  assert.deepEqual(target, {
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'updateUserSessionsGen2',
    runtimeServiceAccount: 'analytics-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  });

  const validation = validateDeploymentRequest({
    args: {
      project: 'secondevienextjsssr',
      codebase: 'main',
      commit: prepared.metadata.baselineCommit,
      manifest: path.relative(ROOT, UPDATE_USER_SESSIONS_MANIFEST_PATH),
      digest: path.relative(ROOT, UPDATE_USER_SESSIONS_DIGEST_PATH),
      allowlist: 'updateUserSessionsGen2',
      transport: 'gcloud-gen2-create'
    },
    manifest: prepared,
    rootDir: ROOT,
    manifestPath: UPDATE_USER_SESSIONS_MANIFEST_PATH,
    digestPath: UPDATE_USER_SESSIONS_DIGEST_PATH,
    currentCommit: prepared.metadata.baselineCommit,
    activeFirebaseProject: 'secondevienextjsssr',
    baselineIsAncestor: true
  });
  const deployArgs = buildGcloudGen2DeployArgs(validation);
  assert.equal(validation.allowlist.length, 1);
  assert.deepEqual(deployArgs.slice(0, 3), ['functions', 'deploy', 'updateUserSessionsGen2']);
  assert.ok(deployArgs.includes('--project=secondevienextjsssr'));
  assert.ok(deployArgs.includes('--entry-point=updateUserSessionsGen2'));
  assert.ok(deployArgs.includes('--run-service-account=analytics-runtime@secondevienextjsssr.iam.gserviceaccount.com'));
  assert.ok(deployArgs.includes('--allow-unauthenticated'));
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

test('le registre client bascule seulement trackAdminIP vers la cible Gen2 autorisee', () => {
  const registry = read('src/kit/config/functionTargets.js');
  const cutover = JSON.parse(fs.readFileSync(CUTOVER_PATH, 'utf8'));
  assert.match(registry, /trackAdminIP:\s*'trackAdminIPGen2'/);
  assert.match(read('src/kit/config/firebaseLazy.js'), /getFunctionTarget\(name\)/);
  assert.equal(cutover.gates.clientCutoverAuthorized, true);
  assert.equal(cutover.function.target, 'trackAdminIPGen2');
  assert.equal(cutover.function.legacyOwnerPreserved, 'trackAdminIP');
  assert.equal(cutover.rollback.appHostingBuild, 'build-2026-08-13-002');
  for (const [logicalName, target] of Object.entries(cutover.clientRegistry)) {
    if (logicalName === 'trackAdminIP') assert.equal(target, 'trackAdminIPGen2');
    else assert.equal(target, logicalName);
  }
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

test('le lanceur App Hosting de cutover est borne au sandbox et ne persiste aucun jeton', () => {
  const source = read('scripts/firebase-apphosting-sandbox.cjs');
  for (const expected of [
    /PROJECT = 'secondevienextjsssr'/,
    /BACKEND = 'secondevie-next-sandbox'/,
    /OPERATOR = 'matthis\.fradin2@gmail\.com'/,
    /setDefaultResultOrder\('ipv4first'\)/,
    /APPHOSTING_SANDBOX_\$\{code\}/,
    /COMMAND_NOT_ALLOWLISTED/,
    /PROJECT_MISMATCH/,
    /OPERATOR_MISMATCH/,
    /auth', 'print-access-token'/,
    /setAccessToken\(token\)/,
    /gcloud-access-token-preloaded-in-memory/
  ]) assert.match(source, expected);
  assert.doesNotMatch(source, /writeFile|appendFile|console\.log\(token\)|process\.env\.[A-Z_]+\s*=\s*token/);
});

test('le rollout G4 conserve la Gen1 et documente la fermeture acceleree', () => {
  const rollout = JSON.parse(fs.readFileSync(ROLLOUT_PATH, 'utf8'));
  assert.equal(rollout.metadata.project, 'secondevienextjsssr');
  assert.equal(rollout.reconciliation.cloudFunctions, 153);
  assert.equal(rollout.reconciliation.cloudGen1, 139);
  assert.equal(rollout.reconciliation.cloudGen2, 14);
  assert.equal(rollout.function.legacyOwnerPreserved, 'trackAdminIP');
  assert.equal(rollout.appHosting.build.state, 'READY');
  assert.equal(rollout.appHosting.rollout.state, 'SUCCEEDED');
  assert.equal(rollout.appHosting.rollout.trafficPercent, 100);
  assert.equal(rollout.dataAndLogs.adminIpsAfter.updateTime, rollout.dataAndLogs.adminIpsBefore.updateTime);
  assert.equal(rollout.dataAndLogs.adminIpsAfter.entries, rollout.dataAndLogs.adminIpsBefore.entries);
  assert.equal(rollout.observation.state, 'CLOSED_ACCELERATED_BY_USER');
  assert.equal(rollout.observation.nextCloudTargetAllowed, true);
  assert.equal(rollout.dataAndLogs.acceleratedAdminProbe.successfulCallableResponses, 2);
  assert.equal(rollout.dataAndLogs.acceleratedAdminProbe.legacyTrafficAfterCutover, 0);
  assert.equal(rollout.rollback.functionAction, 'none; preserve trackAdminIP and trackAdminIPGen2');
});
