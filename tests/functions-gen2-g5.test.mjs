import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { GCLOUD_GEN2_TARGETS } from '../scripts/deploy-functions-targeted.mjs';
import { classificationFor, extractLocalExports } from '../scripts/functions-gen2-inventory.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

test('G5 prepare uniquement getUserStatsGen2 avec handler et securite partages', () => {
  const source = read('functions/src/auth/adminManagement.js');
  const exports = extractLocalExports(ROOT);
  const target = GCLOUD_GEN2_TARGETS.getUserStatsGen2;
  assert.ok(exports.some(({ name }) => name === 'getUserStats'));
  assert.ok(exports.some(({ name }) => name === 'getUserStatsGen2'));
  assert.equal(classificationFor('getUserStatsGen2'), 'MIGRATION_PARALLEL');
  assert.match(source, /const getUserStatsHandler = async \(data, context\) =>/);
  assert.match(source, /exports\.getUserStats = regionalFunctions\(\)[\s\S]*?onCall\(getUserStatsHandler\)/);
  assert.match(source, /exports\.getUserStatsGen2 = onCall\(/);
  assert.match(source, /await checkActiveStrongAdmin\(context\)/);
  assert.match(source, /enforceAppCheck:\s*true/);
  assert.equal(target.runtimeServiceAccount, 'auth-reader-runtime@secondevienextjsssr.iam.gserviceaccount.com');
  assert.equal(target.cpu, '167m');
  assert.equal(target.concurrency, '1');
  assert.equal(target.maxInstances, '1');
  assert.match(read('src/kit/config/functionTargets.js'), /getUserStats:\s*'getUserStatsGen2'/);
});

test('G5-A2 prepare logUserConnectionGen2 sans basculer le registre client', () => {
  const source = read('functions/src/auth/adminManagement.js');
  const exports = extractLocalExports(ROOT);
  const target = GCLOUD_GEN2_TARGETS.logUserConnectionGen2;
  assert.ok(exports.some(({ name }) => name === 'logUserConnection'));
  assert.ok(exports.some(({ name }) => name === 'logUserConnectionGen2'));
  assert.equal(classificationFor('logUserConnectionGen2'), 'MIGRATION_PARALLEL');
  assert.match(source, /const logUserConnectionHandler = async \(data, context\) =>/);
  assert.match(source, /exports\.logUserConnection = regionalFunctions\(\)[\s\S]*?onCall\(logUserConnectionHandler\)/);
  assert.match(source, /exports\.logUserConnectionGen2 = onCall\(/);
  assert.match(source, /enforceAppCheck:\s*true/);
  assert.equal(target.runtimeServiceAccount, 'auth-session-runtime@secondevienextjsssr.iam.gserviceaccount.com');
  assert.equal(target.cpu, '167m');
  assert.equal(target.concurrency, '1');
  assert.equal(target.maxInstances, '1');
  assert.doesNotMatch(read('src/kit/config/functionTargets.js'), /logUserConnection:\s*'logUserConnectionGen2'/);
});

test('G5-A2 borne la creation IAM du runtime de session Auth', () => {
  const iam = read('scripts/configure-functions-gen2-g5-auth-session-iam.mjs');
  for (const expected of [
    /G5_CREATE_AUTH_SESSION_RUNTIME/,
    /SERVICE_ACCOUNT_ID = 'auth-session-runtime'/,
    /roles\/datastore\.user/,
    /roles\/logging\.logWriter/,
    /roles\/serviceusage\.serviceUsageConsumer/,
    /userManagedKeys\.length === 0/,
    /G5_IAM_EFFECTIVE_PROJECT_MISMATCH/,
    /G5_IAM_COMMIT_MISMATCH/,
  ]) assert.match(iam, expected);
  assert.doesNotMatch(iam, /roles\/(?:editor|owner|firebaseauth\.admin)/i);
});

test('G5-A2 bloque deploy et cutover avant IAM', () => {
  const manifest = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g5-log-user-connection.json'));
  assert.equal(manifest.preflight.sourceExportsWithParallel, 164);
  assert.equal(manifest.preflight.targetAbsentBeforeCreate, true);
  assert.equal(manifest.functions[0].name, 'logUserConnectionGen2');
  assert.equal(manifest.functions[0].clientRegistry.currentTarget, 'logUserConnection');
  assert.equal(manifest.gates.runtimeIamReady, false);
  assert.equal(manifest.gates.deploymentAllowed, false);
  assert.equal(manifest.gates.clientCutoverAuthorized, false);
});

test('G5 garde les trois triggers Auth exclusivement en Gen1', () => {
  const index = read('functions/index.js');
  for (const name of ['grantAdminOnAuth', 'onRegisteredUserCreated', 'onRegisteredUserDeleted']) {
    assert.doesNotMatch(index, new RegExp(`${name}Gen2`));
  }
});

test('G5 injecte le jeton App Check ephemere dans Auth et Functions pendant la recette sandbox', () => {
  const harness = read('scripts/e2e-sandbox-role-session.mjs');
  assert.match(harness, /context\.route\('https:\/\/identitytoolkit\.googleapis\.com\/\*\*'/);
  assert.match(harness, /context\.route\('\*\*\/\*\.cloudfunctions\.net\/\*\*'/);
  assert.equal((harness.match(/'X-Firebase-AppCheck': appCheckToken\.token/g) || []).length, 2);
  assert.match(harness, /readArg\('expect-user-count'\)/);
  assert.match(harness, /Clients inscrits en cours de chargement/);
  assert.match(harness, /userCountVerified: expectedUserCount \? Number\(expectedUserCount\) : null/);
  assert.doesNotMatch(harness, /console\.(?:log|info)\([^\n]*customToken/);
});

test('G5-A1 ferme le cutover getUserStats sans retrait Gen1', () => {
  const rollout = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g5-get-user-stats-rollout.json'));
  assert.equal(rollout.metadata.project, 'secondevienextjsssr');
  assert.equal(rollout.function.name, 'getUserStatsGen2');
  assert.equal(rollout.function.legacyOwnerPreserved, 'getUserStats');
  assert.equal(rollout.appHosting.previousBuild, 'build-2026-08-17-004');
  assert.equal(rollout.appHosting.build.name, 'build-2026-08-17-005');
  assert.equal(rollout.appHosting.rollout.state, 'SUCCEEDED');
  assert.equal(rollout.dataAndLogs.positiveProbe.returnedCount, 34);
  assert.equal(rollout.dataAndLogs.quietWindow.gen2Errors, 0);
  assert.equal(rollout.dataAndLogs.quietWindow.newGen1LogEntries, 0);
  assert.equal(rollout.authentication.tokenPersisted, false);
  assert.equal(rollout.gates.nextCloudTargetAllowed, true);
});
