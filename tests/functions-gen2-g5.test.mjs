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

test('G5-A2 prepare et bascule uniquement logUserConnectionGen2 dans le registre client', () => {
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
  assert.match(read('src/kit/config/functionTargets.js'), /logUserConnection:\s*'logUserConnectionGen2'/);
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
  assert.match(read('package.json'), /configure-functions-gen2-g5-auth-session-iam\.mjs --project secondevienextjsssr --env sandbox/);
});

test('G5-A3 prepare uniquement ensureAdminAccessRegistryGen2 avec parite et secret epingle', () => {
  const source = read('functions/src/auth/adminManagement.js');
  const exports = extractLocalExports(ROOT);
  const target = GCLOUD_GEN2_TARGETS.ensureAdminAccessRegistryGen2;
  assert.ok(exports.some(({ name }) => name === 'ensureAdminAccessRegistry'));
  assert.ok(exports.some(({ name }) => name === 'ensureAdminAccessRegistryGen2'));
  assert.equal(classificationFor('ensureAdminAccessRegistryGen2'), 'MIGRATION_PARALLEL');
  assert.match(source, /const ensureAdminAccessRegistryHandler = async \(_data, context\) =>/);
  assert.match(source, /exports\.ensureAdminAccessRegistry = regionalFunctions\(\)[\s\S]*?onCall\(ensureAdminAccessRegistryHandler\)/);
  assert.match(source, /exports\.ensureAdminAccessRegistryGen2 = onCall\(/);
  assert.match(source, /AUTH_REGISTRY_GEN2_RUNTIME[\s\S]*?enforceAppCheck:\s*true[\s\S]*?secrets:\s*\[SUPER_ADMIN_EMAIL_SECRET\]/);
  assert.equal(target.runtimeServiceAccount, 'auth-registry-runtime@secondevienextjsssr.iam.gserviceaccount.com');
  assert.equal(target.cpu, '167m');
  assert.equal(target.concurrency, '1');
  assert.equal(target.maxInstances, '1');
  assert.deepEqual(target.secrets, ['SUPER_ADMIN_EMAIL=SUPER_ADMIN_EMAIL:3']);
  assert.match(read('src/kit/config/functionTargets.js'), /ensureAdminAccessRegistry:\s*'ensureAdminAccessRegistryGen2'/);
});

test('G5-A3 borne IAM au runtime registre et au seul secret proprietaire', () => {
  const iam = read('scripts/configure-functions-gen2-g5-auth-registry-iam.mjs');
  for (const expected of [
    /G5_CREATE_AUTH_REGISTRY_RUNTIME/,
    /SERVICE_ACCOUNT_ID = 'auth-registry-runtime'/,
    /SECRET = 'SUPER_ADMIN_EMAIL'/,
    /roles\/datastore\.user/,
    /roles\/logging\.logWriter/,
    /roles\/serviceusage\.serviceUsageConsumer/,
    /secrets', 'add-iam-policy-binding'/,
    /roles\/secretmanager\.secretAccessor/,
    /userManagedKeys\.length === 0/,
    /G5_REGISTRY_IAM_EFFECTIVE_PROJECT_MISMATCH/,
    /G5_REGISTRY_IAM_COMMIT_MISMATCH/,
  ]) assert.match(iam, expected);
  assert.doesNotMatch(iam, /roles\/(?:editor|owner|firebaseauth\.admin)/i);
  assert.match(read('package.json'), /configure-functions-gen2-g5-auth-registry-iam\.mjs --project secondevienextjsssr --env sandbox/);
});

test('G5-A4 prepare uniquement sendGuestCheckoutOtpGen2 avec handler et secrets epingles', () => {
  const source = read('functions/src/auth/guestCheckoutOtp.js');
  const exports = extractLocalExports(ROOT);
  const target = GCLOUD_GEN2_TARGETS.sendGuestCheckoutOtpGen2;
  assert.ok(exports.some(({ name }) => name === 'sendGuestCheckoutOtp'));
  assert.ok(exports.some(({ name }) => name === 'sendGuestCheckoutOtpGen2'));
  assert.equal(classificationFor('sendGuestCheckoutOtpGen2'), 'MIGRATION_PARALLEL');
  assert.match(source, /const sendGuestCheckoutOtpHandler = async \(data, context\) =>/);
  assert.match(source, /exports\.sendGuestCheckoutOtp = regionalFunctions\(\)[\s\S]*?onCall\(sendGuestCheckoutOtpHandler\)/);
  assert.match(source, /exports\.sendGuestCheckoutOtpGen2 = onCall\(/);
  assert.match(source, /GUEST_OTP_SEND_GEN2_RUNTIME[\s\S]*?enforceAppCheck:\s*true[\s\S]*?secrets:\s*\[\.\.\.TRANSACTIONAL_EMAIL_SECRETS, OTP_HMAC_SECRET\]/);
  assert.equal(target.runtimeServiceAccount, 'auth-otp-email-runtime@secondevienextjsssr.iam.gserviceaccount.com');
  assert.equal(target.cpu, '167m');
  assert.equal(target.concurrency, '1');
  assert.equal(target.maxInstances, '1');
  assert.deepEqual(target.secrets, [
    'GMAIL_EMAIL=GMAIL_EMAIL:2',
    'GMAIL_PASSWORD=GMAIL_PASSWORD:5',
    'RESEND_API_KEY=RESEND_API_KEY:1',
    'OTP_HMAC_SECRET=OTP_HMAC_SECRET:1'
  ]);
  assert.ok(target.environmentVariables.includes('TRANSACTIONAL_EMAIL_PROVIDER=gmail'));
  assert.doesNotMatch(read('src/kit/config/functionTargets.js'), /sendGuestCheckoutOtp:\s*'sendGuestCheckoutOtpGen2'/);
});

test('G5-A4 borne IAM au runtime OTP et aux quatre secrets epingles', () => {
  const iam = read('scripts/configure-functions-gen2-g5-auth-otp-email-iam.mjs');
  for (const expected of [
    /G5_CREATE_AUTH_OTP_EMAIL_RUNTIME/,
    /SERVICE_ACCOUNT_ID = 'auth-otp-email-runtime'/,
    /GMAIL_EMAIL', version: '2'/,
    /GMAIL_PASSWORD', version: '5'/,
    /OTP_HMAC_SECRET', version: '1'/,
    /RESEND_API_KEY', version: '1'/,
    /roles\/datastore\.user/,
    /roles\/logging\.logWriter/,
    /roles\/serviceusage\.serviceUsageConsumer/,
    /roles\/secretmanager\.secretAccessor/,
    /userManagedKeys\.length === 0/,
    /G5_OTP_IAM_EFFECTIVE_PROJECT_MISMATCH/,
    /G5_OTP_IAM_COMMIT_MISMATCH/,
  ]) assert.match(iam, expected);
  assert.doesNotMatch(iam, /roles\/(?:editor|owner|firebaseauth\.admin)/i);
  assert.match(read('package.json'), /configure-functions-gen2-g5-auth-otp-email-iam\.mjs --project secondevienextjsssr --env sandbox/);
});

test('G5-A4 reste fail-closed avant IAM, deploy et envoi OTP', () => {
  const manifest = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g5-send-guest-checkout-otp.json'));
  assert.equal(manifest.preflight.sourceExportsWithParallel, 166);
  assert.equal(manifest.preflight.cloudFunctions, 160);
  assert.equal(manifest.functions[0].name, 'sendGuestCheckoutOtpGen2');
  assert.equal(manifest.functions[0].cloud.present, false);
  assert.equal(manifest.functions[0].clientRegistry.currentTarget, 'sendGuestCheckoutOtp');
  assert.equal(manifest.gates.runtimeIamReady, false);
  assert.equal(manifest.gates.deploymentAllowed, false);
  assert.equal(manifest.gates.clientCutoverAllowed, false);
  assert.equal(manifest.gates.realOtpSent, false);
});

test('G5-A3 prouve le deploy et autorise uniquement le cutover client', () => {
  const manifest = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g5-ensure-admin-access-registry.json'));
  assert.equal(manifest.preflight.sourceExportsWithParallel, 165);
  assert.equal(manifest.preflight.cloudFunctions, 159);
  assert.equal(manifest.functions[0].name, 'ensureAdminAccessRegistryGen2');
  assert.equal(manifest.functions[0].cloud.present, true);
  assert.equal(manifest.functions[0].cloud.revision, 'ensureadminaccessregistrygen2-00001-lak');
  assert.equal(manifest.functions[0].clientRegistry.currentTarget, 'ensureAdminAccessRegistryGen2');
  assert.equal(manifest.gates.runtimeIamReady, true);
  assert.equal(manifest.gates.deploymentAllowed, false);
  assert.equal(manifest.gates.negativeProbe.missingAuthAndAppCheckHttpStatus, 401);
  assert.equal(manifest.gates.positiveProbe.httpStatus, 200);
  assert.equal(manifest.gates.positiveProbe.migrated, false);
  assert.equal(manifest.gates.dataProbe.registryAfterUpdateTime, manifest.gates.dataProbe.registryBeforeUpdateTime);
  assert.equal(manifest.gates.logs.errors, 0);
  assert.equal(manifest.gates.logs.newGen1Entries, 0);
  assert.equal(manifest.gates.clientCutoverAllowed, true);
  assert.equal(manifest.gates.clientCutoverCompleted, true);
  const rollout = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g5-ensure-admin-access-registry-rollout.json'));
  assert.equal(rollout.function.legacyOwnerPreserved, 'ensureAdminAccessRegistry');
  assert.equal(rollout.appHosting.previousBuild, 'build-2026-08-18-001');
  assert.equal(rollout.appHosting.build.name, 'build-2026-08-18-002');
  assert.equal(rollout.appHosting.rollout.state, 'SUCCEEDED');
  assert.equal(rollout.dataAndLogs.positiveProbe.migrated, false);
  assert.equal(rollout.dataAndLogs.registryAfter.updateTime, rollout.dataAndLogs.registryBefore.updateTime);
  assert.equal(rollout.dataAndLogs.quietWindow.gen2Errors, 0);
  assert.equal(rollout.dataAndLogs.quietWindow.newGen1LogEntries, 0);
  assert.equal(rollout.authentication.tokenPersisted, false);
  assert.equal(rollout.gates.nextCloudTargetAllowed, true);
  const iam = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g5-auth-registry-iam.json'));
  assert.equal(iam.ready, true);
  assert.deepEqual(iam.observedRoles, iam.requiredRoles);
  assert.equal(iam.userManagedKeyCount, 0);
  assert.deepEqual(iam.secretBindings, [{ secret: 'SUPER_ADMIN_EMAIL', version: '3', secretAccessor: true }]);
});

test('G5-A2 prouve le deploy et autorise uniquement le cutover client', () => {
  const manifest = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g5-log-user-connection.json'));
  assert.equal(manifest.preflight.sourceExportsWithParallel, 164);
  assert.equal(manifest.preflight.targetAbsentBeforeCreate, true);
  assert.equal(manifest.functions[0].name, 'logUserConnectionGen2');
  assert.equal(manifest.functions[0].cloud.present, true);
  assert.equal(manifest.functions[0].cloud.revision, 'loguserconnectiongen2-00001-fab');
  assert.equal(manifest.functions[0].clientRegistry.currentTarget, 'logUserConnectionGen2');
  assert.equal(manifest.gates.runtimeIamReady, true);
  assert.equal(manifest.gates.deploymentAllowed, false);
  assert.equal(manifest.gates.negativeProbe.missingAuthAndAppCheckHttpStatus, 401);
  assert.equal(manifest.gates.positiveProbe.httpStatus, 200);
  assert.equal(manifest.gates.logs.errors, 0);
  assert.equal(manifest.gates.clientCutoverAuthorized, true);
  assert.equal(manifest.gates.clientCutoverCompleted, true);
  const rollout = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g5-log-user-connection-rollout.json'));
  assert.equal(rollout.function.legacyOwnerPreserved, 'logUserConnection');
  assert.equal(rollout.appHosting.previousBuild, 'build-2026-08-17-005');
  assert.equal(rollout.appHosting.build.name, 'build-2026-08-18-001');
  assert.equal(rollout.appHosting.rollout.state, 'SUCCEEDED');
  assert.equal(rollout.dataAndLogs.positiveProbe.httpStatus, 200);
  assert.equal(rollout.dataAndLogs.quietWindow.gen2Errors, 0);
  assert.equal(rollout.dataAndLogs.quietWindow.newGen1LogEntries, 0);
  assert.equal(rollout.authentication.tokenPersisted, false);
  assert.equal(rollout.gates.nextCloudTargetAllowed, true);
  const iam = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g5-auth-session-iam.json'));
  assert.equal(iam.ready, true);
  assert.deepEqual(iam.observedRoles, iam.requiredRoles);
  assert.equal(iam.userManagedKeyCount, 0);
  assert.equal(iam.secretAccessor, false);
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
  assert.equal((harness.match(/'X-Firebase-AppCheck': appCheckToken\.token/g) || []).length, 4);
  assert.match(harness, /readArg\('expect-user-count'\)/);
  assert.match(harness, /'logUserConnectionGen2', 'ensureAdminAccessRegistryGen2'/);
  assert.match(harness, /accounts:signInWithCustomToken/);
  assert.match(harness, /cloudfunctions\.net\/\$\{probeCallable\}/);
  assert.match(harness, /migrated: typeof callablePayload\?\.result\?\.migrated === 'boolean'/);
  assert.match(harness, /role: \['owner', 'admin'\]\.includes\(callablePayload\?\.result\?\.role\)/);
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
