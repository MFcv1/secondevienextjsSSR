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
  assert.match(read('src/kit/config/functionTargets.js'), /sendGuestCheckoutOtp:\s*'sendGuestCheckoutOtpGen2'/);
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

test('G5-A5 prepare uniquement verifyGuestCheckoutOtpGen2 avec handler et secret epingle', () => {
  const source = read('functions/src/auth/guestCheckoutOtp.js');
  const exports = extractLocalExports(ROOT);
  const target = GCLOUD_GEN2_TARGETS.verifyGuestCheckoutOtpGen2;
  assert.ok(exports.some(({ name }) => name === 'verifyGuestCheckoutOtp'));
  assert.ok(exports.some(({ name }) => name === 'verifyGuestCheckoutOtpGen2'));
  assert.equal(classificationFor('verifyGuestCheckoutOtpGen2'), 'MIGRATION_PARALLEL');
  assert.match(source, /const verifyGuestCheckoutOtpHandler = async \(data, context\) =>/);
  assert.match(source, /exports\.verifyGuestCheckoutOtp = regionalFunctions\(\)[\s\S]*?onCall\(verifyGuestCheckoutOtpHandler\)/);
  assert.match(source, /exports\.verifyGuestCheckoutOtpGen2 = onCall\(/);
  assert.match(source, /GUEST_OTP_VERIFY_GEN2_RUNTIME[\s\S]*?enforceAppCheck:\s*true[\s\S]*?secrets:\s*\[OTP_HMAC_SECRET\]/);
  assert.equal(target.runtimeServiceAccount, 'auth-otp-verify-runtime@secondevienextjsssr.iam.gserviceaccount.com');
  assert.equal(target.cpu, '167m');
  assert.equal(target.concurrency, '1');
  assert.equal(target.maxInstances, '1');
  assert.deepEqual(target.secrets, ['OTP_HMAC_SECRET=OTP_HMAC_SECRET:1']);
  assert.match(read('src/kit/config/functionTargets.js'), /verifyGuestCheckoutOtp:\s*'verifyGuestCheckoutOtpGen2'/);
  assert.match(read('src/kit/commerce/CheckoutView.jsx'), /getFunctionTarget\('verifyGuestCheckoutOtp'\)/);
});

test('G5-A5 borne IAM au runtime de verification OTP et au seul secret HMAC', () => {
  const iam = read('scripts/configure-functions-gen2-g5-auth-otp-verify-iam.mjs');
  for (const expected of [
    /G5_CREATE_AUTH_OTP_VERIFY_RUNTIME/,
    /SERVICE_ACCOUNT_ID = 'auth-otp-verify-runtime'/,
    /OTP_HMAC_SECRET', version: '1'/,
    /roles\/datastore\.user/,
    /roles\/logging\.logWriter/,
    /roles\/serviceusage\.serviceUsageConsumer/,
    /roles\/secretmanager\.secretAccessor/,
    /userManagedKeys\.length === 0/,
    /G5_OTP_VERIFY_IAM_EFFECTIVE_PROJECT_MISMATCH/,
    /G5_OTP_VERIFY_IAM_COMMIT_MISMATCH/,
  ]) assert.match(iam, expected);
  assert.doesNotMatch(iam, /roles\/(?:editor|owner|firebaseauth\.admin)/i);
  assert.match(read('package.json'), /configure-functions-gen2-g5-auth-otp-verify-iam\.mjs --project secondevienextjsssr --env sandbox/);
});

test('G5-A5 prouve le runtime OTP et autorise seulement le cutover client', () => {
  const manifest = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g5-verify-guest-checkout-otp.json'));
  assert.equal(manifest.preflight.sourceExportsWithParallel, 167);
  assert.equal(manifest.preflight.cloudFunctions, 161);
  assert.equal(manifest.functions[0].name, 'verifyGuestCheckoutOtpGen2');
  assert.equal(manifest.functions[0].cloud.present, true);
  assert.equal(manifest.functions[0].cloud.revision, 'verifyguestcheckoutotpgen2-00001-wim');
  assert.equal(manifest.functions[0].clientRegistry.currentTarget, 'verifyGuestCheckoutOtpGen2');
  assert.equal(manifest.functions[0].clientRegistry.hostedBuildTarget, 'verifyGuestCheckoutOtpGen2');
  assert.equal(manifest.gates.runtimeIamReady, true);
  assert.equal(manifest.gates.runtimeIamVerified, true);
  assert.deepEqual(manifest.iamEvidence.forbiddenProjectRoles, []);
  assert.equal(manifest.iamEvidence.userManagedKeyCount, 0);
  assert.equal(manifest.gates.deploymentAllowed, false);
  assert.equal(manifest.gates.clientCutoverAllowed, true);
  assert.equal(manifest.gates.boundedOtpVerificationExecuted, true);
  assert.equal(manifest.runtimeEvidence.negativeUnauthenticatedWithoutAppCheckHttpStatus, 401);
  assert.equal(manifest.runtimeEvidence.positiveVerifyHttpStatus, 200);
  assert.equal(manifest.runtimeEvidence.otpHashDeleted, true);
  assert.equal(manifest.runtimeEvidence.verifiedTokenHashPresent, true);
  assert.equal(manifest.runtimeEvidence.otpDisplayed, false);
  assert.equal(manifest.runtimeEvidence.checkoutTokenDisplayed, false);
  assert.equal(manifest.postDeploymentInventory.cloudFunctions, 162);
  assert.equal(manifest.postDeploymentInventory.cloudGen2, 23);
  const proof = read('scripts/prove-guest-otp-verification-g5.mjs');
  assert.match(proof, /SEND_TARGET = 'sendGuestCheckoutOtpGen2'/);
  assert.match(proof, /VERIFY_TARGET = 'verifyGuestCheckoutOtpGen2'/);
  assert.match(proof, /RSA_PKCS1_OAEP_PADDING/);
  assert.match(proof, /otpHashDeleted: !afterData\.otpHash/);
  assert.match(proof, /checkoutTokenDisplayed: false/);
  assert.match(proof, /ttlMillis: 30 \* 60 \* 1000/);
  assert.doesNotMatch(proof, /console\.(?:log|info)\([^\n]*(?:otp|checkoutOtpToken)/i);
});

test('G5-A5 ferme le cutover, le rollback reel et la reactivation finale', () => {
  const manifest = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g5-verify-guest-checkout-otp-rollout.json'));
  assert.equal(manifest.reconciliation.sourceExports, 167);
  assert.equal(manifest.reconciliation.cloudFunctions, 162);
  assert.equal(manifest.reconciliation.cloudGen1, 139);
  assert.equal(manifest.reconciliation.cloudGen2, 23);
  assert.equal(manifest.function.name, 'verifyGuestCheckoutOtpGen2');
  assert.equal(manifest.function.legacyOwnerState, 'ACTIVE');
  assert.equal(manifest.appHosting.activeBuild, 'build-2026-08-18-004');
  assert.equal(manifest.appHosting.cutover.state, 'SUCCEEDED');
  assert.equal(manifest.appHosting.rollbackDrill.build, 'build-2026-08-18-003');
  assert.equal(manifest.appHosting.rollbackDrill.state, 'SUCCEEDED');
  assert.equal(manifest.appHosting.finalActivation.state, 'SUCCEEDED');
  assert.equal(manifest.appHosting.servedChecks.oldBuild003SessionStillAuthenticated, true);
  assert.equal(manifest.authentication.registeredUsers, 34);
  assert.equal(manifest.dataAndLogs.positiveProbe.otpDisplayed, false);
  assert.equal(manifest.dataAndLogs.positiveProbe.checkoutTokenDisplayed, false);
  assert.equal(manifest.dataAndLogs.quietWindow.gen2Errors, 0);
  assert.equal(manifest.dataAndLogs.quietWindow.newGen1LogEntries, 0);
  assert.equal(manifest.dataAndLogs.quietWindow.dataChanged, false);
  assert.equal(manifest.gates.nextCloudTargetAllowed, true);
});

test('G5-A4 prouve le deploy et autorise uniquement le cutover client', () => {
  const manifest = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g5-send-guest-checkout-otp.json'));
  assert.equal(manifest.preflight.sourceExportsWithParallel, 166);
  assert.equal(manifest.preflight.cloudFunctions, 161);
  assert.equal(manifest.functions[0].name, 'sendGuestCheckoutOtpGen2');
  assert.equal(manifest.functions[0].cloud.present, true);
  assert.equal(manifest.functions[0].cloud.revision, 'sendguestcheckoutotpgen2-00001-neh');
  assert.equal(manifest.functions[0].clientRegistry.currentTarget, 'sendGuestCheckoutOtpGen2');
  assert.equal(manifest.functions[0].clientRegistry.hostedBuildTarget, 'sendGuestCheckoutOtpGen2');
  assert.equal(manifest.gates.runtimeIamReady, true);
  assert.equal(manifest.gates.runtimeIamVerified, true);
  assert.deepEqual(manifest.iamEvidence.forbiddenProjectRoles, []);
  assert.equal(manifest.iamEvidence.userManagedKeyCount, 0);
  assert.equal(manifest.gates.deploymentAllowed, false);
  assert.equal(manifest.gates.clientCutoverAllowed, true);
  assert.equal(manifest.gates.realOtpSent, true);
  assert.equal(manifest.deploymentEvidence.positiveProbe.emailCount, 1);
  assert.equal(manifest.deploymentEvidence.positiveProbe.otpRead, false);
  assert.equal(manifest.deploymentEvidence.logs.gen2ErrorCount, 0);
  assert.equal(manifest.deploymentEvidence.logs.newLegacyEntriesSinceDeploy, 0);
  assert.equal(manifest.appHostingCutover.build, 'build-2026-08-18-003');
  assert.equal(manifest.appHostingCutover.previousBuild, 'build-2026-08-18-002');
  assert.equal(manifest.appHostingCutover.quietWindowGen2Errors, 0);
  const rollout = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g5-send-guest-checkout-otp-rollout.json'));
  assert.equal(rollout.appHosting.rollout.state, 'SUCCEEDED');
  assert.equal(rollout.appHosting.servedChecks.oldBuild002TabRenderedAfterCutover, true);
  assert.equal(rollout.dataAndLogs.positiveProbe.boundedEmailCount, 1);
  assert.equal(rollout.dataAndLogs.quietWindow.newGen1LogEntries, 0);
  const sandboxHarness = read('scripts/e2e-sandbox-role-session.mjs');
  assert.match(sandboxHarness, /'sendGuestCheckoutOtpGen2'/);
  assert.match(sandboxHarness, /\? \{ email: ROLE_EMAILS\.client \}/);
  const clientRegistry = read('src/kit/config/functionTargets.js');
  const checkout = read('src/kit/commerce/CheckoutView.jsx');
  assert.match(clientRegistry, /sendGuestCheckoutOtp: 'sendGuestCheckoutOtpGen2'/);
  assert.match(checkout, /httpsCallable\(functions, getFunctionTarget\('sendGuestCheckoutOtp'\)\)/);
  assert.doesNotMatch(checkout, /httpsCallable\(functions, 'sendGuestCheckoutOtp'\)/);
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
  for (const callable of [
    'logUserConnectionGen2',
    'ensureAdminAccessRegistryGen2',
    'sendGuestCheckoutOtpGen2',
  ]) assert.match(harness, new RegExp(`'${callable}'`));
  assert.match(harness, /accounts:signInWithCustomToken/);
  assert.match(harness, /cloudfunctions\.net\/\$\{probeCallable\}/);
  assert.match(harness, /migrated: typeof callablePayload\?\.result\?\.migrated === 'boolean'/);
  assert.match(harness, /role: \['owner', 'admin'\]\.includes\(callablePayload\?\.result\?\.role\)/);
  assert.match(harness, /Clients inscrits en cours de chargement/);
  assert.match(harness, /userCountVerified: expectedUserCount \? Number\(expectedUserCount\) : null/);
  assert.match(harness, /CHECKPOINT_READY/);
  assert.match(harness, /sessionStillAuthenticated: true/);
  assert.match(harness, /\/tmp\\\/secondevie-/);
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
