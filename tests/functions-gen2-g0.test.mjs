import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  EXPECTED_CLOUD_COUNT,
  EXPECTED_SOURCE_COUNT,
  HOLD_META_RECONCILIATION,
  KEEP_GEN1_AUTH,
  KEEP_GEN2,
  classificationFor,
  extractLocalExports
} from '../scripts/functions-gen2-inventory.mjs';
import {
  buildFirebaseCliEnv,
  buildFirebaseDeployArgs,
  buildGcloudGen1DeployArgs,
  parseDeployArgs,
  validateDeploymentRequest
} from '../scripts/deploy-functions-targeted.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(ROOT, 'apphostingaudit/manifests/functions-g0.json');
const PLATFORM_PATH = path.join(ROOT, 'apphostingaudit/manifests/functions-platform-g0.json');
const DIGEST_PATH = path.join(ROOT, 'apphostingaudit/manifests/functions-g0-digests.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const platform = JSON.parse(fs.readFileSync(PLATFORM_PATH, 'utf8'));

function validationArgs(overrides = {}) {
  return {
    project: 'secondevienextjsssr',
    codebase: 'main',
    commit: manifest.metadata.baselineCommit,
    manifest: path.relative(ROOT, MANIFEST_PATH),
    digest: path.relative(ROOT, DIGEST_PATH),
    allowlist: 'getCatalogPublicationStatus',
    ...overrides
  };
}

function validate(args) {
  return validateDeploymentRequest({
    args,
    manifest,
    rootDir: ROOT,
    manifestPath: MANIFEST_PATH,
    digestPath: DIGEST_PATH,
    currentCommit: manifest.metadata.baselineCommit,
    activeFirebaseProject: 'secondevienextjsssr'
  });
}

test('inventaire source: 157 exports uniques et sources resolues', () => {
  const exports = extractLocalExports(ROOT);
  assert.equal(exports.length, EXPECTED_SOURCE_COUNT);
  assert.equal(new Set(exports.map(({ name }) => name)).size, EXPECTED_SOURCE_COUNT);
  for (const entry of exports) {
    assert.ok(entry.sourceFile);
    assert.ok(fs.existsSync(path.join(ROOT, entry.sourceFile)), `${entry.name}: source absente`);
  }
});

test('manifeste G0: 157 source, 152 cloud, 139 Gen1 et 13 Gen2', () => {
  assert.equal(manifest.metadata.sourceCount, EXPECTED_SOURCE_COUNT);
  assert.equal(manifest.metadata.cloudCount, EXPECTED_CLOUD_COUNT);
  assert.equal(manifest.metadata.cloudGen1Count, 139);
  assert.equal(manifest.metadata.cloudGen2Count, 13);
  assert.equal(manifest.functions.length, EXPECTED_SOURCE_COUNT);
  assert.deepEqual(manifest.metadata.classifications, {
    HOLD_META_RECONCILIATION: 5,
    KEEP_GEN1_AUTH: 3,
    KEEP_GEN2: 13,
    MIGRATE: 116,
    MIGRATE_OR_RETIRE: 20
  });
});

test('manifeste G0: chaque Function porte les champs de decision et rollback requis', () => {
  for (const entry of manifest.functions) {
    assert.equal(entry.cloud.project, 'secondevienextjsssr', entry.name);
    assert.equal(entry.cloud.codebase, 'main', entry.name);
    assert.ok(entry.source.file, entry.name);
    assert.ok(entry.trigger.type, entry.name);
    assert.ok(Object.hasOwn(entry.identities, 'runtimeServiceAccount'), entry.name);
    assert.ok(Object.hasOwn(entry.identities, 'buildServiceAccount'), entry.name);
    assert.ok(Array.isArray(entry.identities.resourceIam), entry.name);
    assert.ok(Array.isArray(entry.secrets), entry.name);
    assert.ok(Object.hasOwn(entry.runtime, 'cpu'), entry.name);
    assert.ok(Object.hasOwn(entry.runtime, 'concurrency'), entry.name);
    assert.ok(Object.hasOwn(entry.runtime, 'retry'), entry.name);
    assert.ok(Array.isArray(entry.callers), entry.name);
    assert.ok(Array.isArray(entry.dataAccess.reads), entry.name);
    assert.ok(Array.isArray(entry.dataAccess.writes), entry.name);
    assert.ok(entry.idempotence.status, entry.name);
    assert.ok(entry.ownership.owner, entry.name);
    assert.equal(entry.decision.classification, classificationFor(entry.name), entry.name);
    assert.ok(entry.decision.target, entry.name);
    assert.ok(entry.decision.wave, entry.name);
    assert.ok(entry.decision.rollback, entry.name);
  }
});

test('les cinq seuls exports locaux absents du cloud restent en HOLD Meta', () => {
  const localOnly = manifest.functions.filter((entry) => !entry.cloud.present).map((entry) => entry.name).sort();
  assert.deepEqual(localOnly, [...HOLD_META_RECONCILIATION].sort());
  assert.deepEqual(manifest.deploymentPolicy.forbiddenTargets, [...HOLD_META_RECONCILIATION].sort());
  for (const name of localOnly) assert.equal(classificationFor(name), 'HOLD_META_RECONCILIATION');
});

test('les trois triggers Auth restent les seules exceptions Gen1', () => {
  const authGen1 = manifest.functions
    .filter((entry) => entry.trigger.eventType?.includes('firebase.auth'))
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(authGen1, [...KEEP_GEN1_AUTH].sort());
  for (const name of authGen1) {
    const entry = manifest.functions.find((candidate) => candidate.name === name);
    assert.equal(entry.cloud.generation, 1);
    assert.equal(entry.decision.classification, 'KEEP_GEN1_AUTH');
    assert.equal(entry.decision.target, name);
  }
  const authTriggerFiles = [];
  const visit = (directory) => {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, item.name);
      if (item.isDirectory() && item.name !== 'node_modules') visit(fullPath);
      else if (item.name.endsWith('.js') && /\.auth\.user\(\)\.(?:onCreate|onDelete)\(/.test(fs.readFileSync(fullPath, 'utf8'))) {
        authTriggerFiles.push(path.relative(ROOT, fullPath).split(path.sep).join('/'));
      }
    }
  };
  visit(path.join(ROOT, 'functions'));
  assert.deepEqual(authTriggerFiles.sort(), ['functions/src/auth/grantAdmin.js', 'functions/src/auth/userStats.js']);
});

test('aucun functions.config() ne peut revenir dans le code Functions', () => {
  const offenders = [];
  const visit = (directory) => {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, item.name);
      if (item.isDirectory() && item.name !== 'node_modules') visit(fullPath);
      else if (/\.(?:c?js|mjs)$/.test(item.name) && /functions\s*\.\s*config\s*\(/.test(fs.readFileSync(fullPath, 'utf8'))) {
        offenders.push(path.relative(ROOT, fullPath));
      }
    }
  };
  visit(path.join(ROOT, 'functions'));
  assert.deepEqual(offenders, []);
});

test('reconciliation plateforme: 13 Gen2, 8 schedulers, 2 queues et 7 Eventarc', () => {
  assert.equal(platform.metadata.gen2Count, 13);
  assert.equal(platform.metadata.schedulerCount, 8);
  assert.equal(platform.metadata.queueCount, 2);
  assert.equal(platform.metadata.eventarcCount, 7);
  assert.deepEqual(platform.gen2.map(({ name }) => name).sort(), [...KEEP_GEN2].sort());
  assert.equal(platform.schedulers.length, 8);
  assert.equal(platform.queues.length, 2);
  assert.equal(platform.eventarc.length, 7);
});

test('wrapper: parse une requete cible valide et construit seulement functions:main:<nom>', () => {
  const parsed = parseDeployArgs([
    '--project', 'secondevienextjsssr', '--codebase', 'main',
    '--commit', manifest.metadata.baselineCommit,
    '--manifest', 'apphostingaudit/manifests/functions-g0.json',
    '--digest', 'apphostingaudit/manifests/functions-g0-digests.json',
    '--allowlist', 'getCatalogPublicationStatus,sendTestEmail', '--execute'
  ]);
  const result = validate(parsed);
  assert.deepEqual(result.selectors, ['functions:main:getCatalogPublicationStatus', 'functions:main:sendTestEmail']);
  assert.deepEqual(buildFirebaseDeployArgs(result), [
    'deploy', '--project', 'secondevienextjsssr', '--only',
    'functions:main:getCatalogPublicationStatus,functions:main:sendTestEmail'
  ]);
});

test('wrapper: refuse projet, codebase, commit, allowlist vide, plus de dix et cible inconnue', () => {
  assert.throws(() => validate(validationArgs({ project: 'vibefx-v2' })), /Projet interdit/);
  assert.throws(() => validate(validationArgs({ codebase: 'other' })), /Codebase interdite/);
  assert.throws(() => validate(validationArgs({ commit: '0000000000000000000000000000000000000000' })), /HEAD/);
  assert.throws(() => validate(validationArgs({ allowlist: '' })), /Argument obligatoire|Allowlist vide/);
  assert.throws(() => validate(validationArgs({ allowlist: Array.from({ length: 11 }, (_, index) => `target${index}`).join(',') })), /limitee a 10/);
  assert.throws(() => validate(validationArgs({ allowlist: 'unknownTarget' })), /absente du manifeste/);
});

test('wrapper: accepte un commit de release descendant du baseline G0', () => {
  const releaseCommit = '1111111111111111111111111111111111111111';
  assert.doesNotThrow(() => validateDeploymentRequest({
    args: validationArgs({ commit: releaseCommit }),
    manifest,
    rootDir: ROOT,
    manifestPath: MANIFEST_PATH,
    digestPath: DIGEST_PATH,
    currentCommit: releaseCommit,
    activeFirebaseProject: 'secondevienextjsssr',
    baselineIsAncestor: true
  }));
  assert.throws(() => validateDeploymentRequest({
    args: validationArgs({ commit: releaseCommit }),
    manifest,
    rootDir: ROOT,
    manifestPath: MANIFEST_PATH,
    digestPath: DIGEST_PATH,
    currentCommit: releaseCommit,
    activeFirebaseProject: 'secondevienextjsssr',
    baselineIsAncestor: false
  }), /Baseline du manifeste absente/);
});

test('wrapper: refuse les cinq Instagram en hold et borne finance/webhook/scheduler a une cible', () => {
  for (const name of HOLD_META_RECONCILIATION) {
    assert.throws(() => validate(validationArgs({ allowlist: name })), /HOLD_META_RECONCILIATION|interdite/);
  }
  assert.doesNotThrow(() => validate(validationArgs({ allowlist: 'createCheckoutV2' })));
  assert.throws(() => validate(validationArgs({ allowlist: 'createCheckoutV2,getCatalogPublicationStatus' })), /une seule cible/);
  assert.throws(() => validate(validationArgs({ allowlist: 'catalogReconciler,getCatalogPublicationStatus' })), /une seule cible/);
  assert.throws(() => validate(validationArgs({ allowlist: 'stripeWebhookV2,getCatalogPublicationStatus' })), /une seule cible/);
});

test('le script package Functions ne contient plus de deploy global', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'functions/package.json'), 'utf8'));
  assert.equal(packageJson.scripts.deploy, 'node ../scripts/deploy-functions-targeted.mjs');
  assert.doesNotMatch(packageJson.scripts.deploy, /firebase\s+deploy\s+--only\s+functions(?:\s|$)/);
});

test('le reconciler G1 epingle son compte runtime dedie', () => {
  const source = fs.readFileSync(path.join(ROOT, 'functions/src/commerce/v2Operations.js'), 'utf8');
  assert.match(source, /COMMERCE_OPERATIONS_RUNTIME_SERVICE_ACCOUNT\s*=\s*\n?\s*['"]commerce-operations-reconciler@secondevienextjsssr\.iam\.gserviceaccount\.com['"]/);
  const reconciler = source.match(/const commerceOperationsReconciler = regionalFunctions\(\)([\s\S]*?)\.pubsub\.schedule\('every 60 minutes'\)/)?.[1] || '';
  assert.match(reconciler, /serviceAccount:\s*COMMERCE_OPERATIONS_RUNTIME_SERVICE_ACCOUNT/);
});

test('le wrapper Firebase borne le contournement DNS au processus CLI', () => {
  const env = buildFirebaseCliEnv({ NODE_OPTIONS: '--trace-warnings', KEEP_ME: 'yes' });
  assert.equal(env.KEEP_ME, 'yes');
  assert.equal(env.FIREBASE_CLI_DISABLE_UPDATE_CHECK, 'true');
  assert.equal(env.NODE_OPTIONS, '--trace-warnings --dns-result-order=ipv4first');
  assert.equal(
    buildFirebaseCliEnv(env).NODE_OPTIONS,
    '--trace-warnings --dns-result-order=ipv4first'
  );
});

test('le fallback gcloud Gen1 reste limite au reconciler et explicite toute sa configuration', () => {
  const request = validate({
    ...validationArgs({
      allowlist: 'commerceOperationsReconciler',
      transport: 'gcloud-gen1'
    })
  });
  const args = buildGcloudGen1DeployArgs(request);
  assert.deepEqual(args.slice(0, 3), ['functions', 'deploy', 'commerceOperationsReconciler']);
  for (const expected of [
    '--project=secondevienextjsssr',
    '--region=europe-west1',
    '--no-gen2',
    '--runtime=nodejs22',
    '--source=functions',
    '--entry-point=commerceOperationsReconciler',
    '--trigger-topic=firebase-schedule-commerceOperationsReconciler-europe-west1',
    '--service-account=commerce-operations-reconciler@secondevienextjsssr.iam.gserviceaccount.com',
    '--build-service-account=projects/secondevienextjsssr/serviceAccounts/231220287936-compute@developer.gserviceaccount.com',
    '--memory=512MB',
    '--timeout=300s',
    '--max-instances=1',
    '--no-retry',
    '--ingress-settings=all',
    '--quiet'
  ]) assert.ok(args.includes(expected), expected);
  assert.throws(() => validate({
    ...validationArgs({ allowlist: 'getCatalogPublicationStatus', transport: 'gcloud-gen1' })
  }), /limite aux schedulers G1 approuves/);
  assert.throws(() => validate({
    ...validationArgs({ allowlist: 'commerceOperationsReconciler', transport: 'direct-rest' })
  }), /Transport interdit/);
});

test('les trois workers G1 epinglent runtime, secrets et limites explicites', () => {
  const reservation = fs.readFileSync(path.join(ROOT, 'functions/src/commerce/v2ReservationExpiry.js'), 'utf8');
  const operations = fs.readFileSync(path.join(ROOT, 'functions/src/commerce/v2Operations.js'), 'utf8');
  const paymentLinks = fs.readFileSync(path.join(ROOT, 'functions/src/commerce/v2AdminPaymentLinks.js'), 'utf8');
  assert.match(reservation, /serviceAccount:\s*RESERVATION_EXPIRY_RUNTIME_SERVICE_ACCOUNT/);
  assert.match(operations, /serviceAccount:\s*COMMERCE_OUTBOX_RUNTIME_SERVICE_ACCOUNT/);
  assert.match(paymentLinks, /serviceAccount:\s*PAYMENT_LINK_EXPIRY_RUNTIME_SERVICE_ACCOUNT/);
  const cases = [
    ['commerceReservationExpiryDispatcher', '--service-account=commerce-reservation-expiry@secondevienextjsssr.iam.gserviceaccount.com', '--set-secrets=STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:4'],
    ['commerceOutboxDispatcher', '--service-account=commerce-outbox-dispatcher@secondevienextjsssr.iam.gserviceaccount.com', '--set-secrets=GMAIL_EMAIL=GMAIL_EMAIL:2,GMAIL_PASSWORD=GMAIL_PASSWORD:5,RESEND_API_KEY=RESEND_API_KEY:1'],
    ['expireAdminPaymentLinks', '--service-account=admin-payment-link-expiry@secondevienextjsssr.iam.gserviceaccount.com', '--set-secrets=STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:4,PAYMENT_LINK_HMAC_SECRET=PAYMENT_LINK_HMAC_SECRET:1']
  ];
  for (const [allowlist, serviceAccount, secrets] of cases) {
    const request = validate({ ...validationArgs({ allowlist, transport: 'gcloud-gen1' }) });
    const args = buildGcloudGen1DeployArgs(request);
    assert.ok(args.includes(serviceAccount));
    assert.ok(args.includes(secrets));
    assert.ok(args.includes('--max-instances=1'));
    assert.ok(args.includes('--no-retry'));
  }
});

test('le manifeste IAM G1 des workers prouve roles, secrets et absence de cles', () => {
  const workerIam = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'apphostingaudit/manifests/functions-gen2-g1-worker-iam.json'),
    'utf8'
  ));
  assert.equal(workerIam.project, 'secondevienextjsssr');
  assert.equal(workerIam.verdict, 'G1_WORKER_RUNTIME_IAM_MINIMAL_VERIFIED');
  assert.equal(workerIam.secretValuesRead, false);
  assert.equal(workerIam.accounts.length, 3);
  for (const account of workerIam.accounts) {
    assert.equal(account.rolesExact, true);
    assert.equal(account.secretsExact, true);
    assert.equal(account.userManagedKeys, 0);
    assert.deepEqual(account.publicImpersonation, []);
    assert.ok(Object.values(account.forbiddenCapabilities).every((value) => value === false));
  }
});

test('le resolver financier G1 est fail-closed et ne touche ni commande, refund, faits ou stock', () => {
  const source = fs.readFileSync(path.join(ROOT, 'scripts/resolve-commerce-incident-g1.mjs'), 'utf8');
  assert.match(source, /G1_RESOLVE_BALANCED_REVERSAL_NO_REPLAY/);
  assert.match(source, /args\.get\('approval'\) !== APPROVAL/);
  assert.match(source, /STRIPE_SECRET_KEY[^\n]+startsWith\('sk_test_'\)/);
  assert.match(source, /transaction\.update\(incidentDocument\.ref/);
  assert.match(source, /transaction\.set\(auditRef/);
  assert.doesNotMatch(source, /transaction\.(?:set|update|delete)\(orderRef/);
  assert.doesNotMatch(source, /transaction\.(?:set|update|delete)\(attemptDocument\.ref/);
  assert.doesNotMatch(source, /transaction\.delete\(/);
});
