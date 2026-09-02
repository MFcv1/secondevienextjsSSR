import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  EXPECTED_CLOUD_COUNT,
  EXPECTED_CURRENT_SOURCE_COUNT,
  EXPECTED_SOURCE_COUNT,
  HOLD_META_RECONCILIATION,
  KEEP_GEN1_AUTH,
  KEEP_GEN2,
  PARALLEL_MIGRATION_EXPORTS,
  classificationFor,
  extractLocalExports
} from '../scripts/functions-gen2-inventory.mjs';
import {
  GCLOUD_GEN2_TARGETS,
  buildFirebaseCliEnv,
  buildFirebaseDeployArgs,
  buildGcloudGen1DeployArgs,
  buildGcloudGen2DeployArgs,
  buildGcloudGen2RollbackArgs,
  buildGcloudSchedulerUpdateArgs,
  buildGcloudTaskQueueUpdateArgs,
  assertGen2RollbackObject,
  assertTaskQueuePreconditions,
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

test('inventaire source courant: 160 exports dont sept event-driven actifs sur le sandbox', () => {
  const exports = extractLocalExports(ROOT);
  const expectedCurrentCount = EXPECTED_CURRENT_SOURCE_COUNT;
  assert.equal(exports.length, expectedCurrentCount);
  assert.equal(new Set(exports.map(({ name }) => name)).size, expectedCurrentCount);
  assert.deepEqual(
    exports.filter(({ name }) => PARALLEL_MIGRATION_EXPORTS.has(name)).map(({ name }) => name).sort(),
    [...PARALLEL_MIGRATION_EXPORTS].sort()
  );
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
  const reconciler = source.match(/const commerceOperationsReconciler = regionalFunctions\(\)([\s\S]*?)\.pubsub\.schedule\('17 3 \* \* \*'\)/)?.[1] || '';
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

test('le fallback gcloud Gen1 reste allowliste et explicite toute sa configuration', () => {
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

test('le transport gcloud Gen2 est limite au premier lot stats et explicite IAM et limites', () => {
  const request = validate({
    ...validationArgs({ allowlist: 'onOrderStatsWrite', transport: 'gcloud-gen2' })
  });
  const args = buildGcloudGen2DeployArgs(request);
  assert.deepEqual(args.slice(0, 3), ['functions', 'deploy', 'onOrderStatsWrite']);
  for (const expected of [
    '--project=secondevienextjsssr',
    '--region=europe-west1',
    '--gen2',
    '--runtime=nodejs22',
    '--source=functions',
    '--entry-point=onOrderStatsWrite',
    '--trigger-event-filters=type=google.cloud.firestore.document.v1.written,database=(default),namespace=(default)',
    '--trigger-event-filters-path-pattern=document=orders/{orderId}',
    '--trigger-location=eur3',
    '--trigger-service-account=functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    '--run-service-account=order-stats-projector@secondevienextjsssr.iam.gserviceaccount.com',
    '--build-service-account=projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    '--memory=256Mi', '--cpu=1', '--timeout=60s', '--concurrency=1',
    '--min-instances=0', '--max-instances=1', '--retry',
    '--ingress-settings=all', '--no-allow-unauthenticated',
    `--update-labels=deployment-tool=codex-targeted,migration-source-commit=${manifest.metadata.baselineCommit}`,
    '--quiet'
  ]) assert.ok(args.includes(expected), expected);
  assert.throws(() => validate({
    ...validationArgs({ allowlist: 'getCatalogPublicationStatus', transport: 'gcloud-gen2' })
  }), /limite a la cible G2-B approuvee/);
  const catalogRequest = validate({
    ...validationArgs({ allowlist: 'onCatalogSourceWrite', transport: 'gcloud-gen2' })
  });
  const catalogArgs = buildGcloudGen2DeployArgs(catalogRequest);
  for (const expected of [
    '--entry-point=onCatalogSourceWrite',
    '--trigger-event-filters-path-pattern=document=artifacts/{appId}/public/data/furniture/{productId}',
    '--run-service-account=catalog-enqueuer@secondevienextjsssr.iam.gserviceaccount.com',
    '--trigger-service-account=functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    '--concurrency=1', '--max-instances=1', '--retry'
  ]) assert.ok(catalogArgs.includes(expected), expected);

  const schedulerRequest = validate({
    ...validationArgs({ allowlist: 'catalogReconciler', transport: 'gcloud-gen2' })
  });
  const schedulerFunctionArgs = buildGcloudGen2DeployArgs(schedulerRequest);
  for (const expected of [
    '--trigger-http',
    '--run-service-account=catalog-builder@secondevienextjsssr.iam.gserviceaccount.com',
    '--build-service-account=projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    '--memory=512Mi', '--cpu=1', '--timeout=540s', '--concurrency=1',
    '--min-instances=0', '--max-instances=1', '--no-allow-unauthenticated'
  ]) assert.ok(schedulerFunctionArgs.includes(expected), expected);
  assert.equal(schedulerFunctionArgs.includes('--retry'), false);
  const schedulerJobArgs = buildGcloudSchedulerUpdateArgs(schedulerRequest);
  for (const expected of [
    'firebase-schedule-catalogReconciler-europe-west1',
    '--project=secondevienextjsssr', '--location=europe-west1',
    '--schedule=every 60 minutes', '--time-zone=UTC', '--http-method=POST',
    '--uri=https://europe-west1-secondevienextjsssr.cloudfunctions.net/catalogReconciler',
    '--oidc-service-account-email=catalog-enqueuer@secondevienextjsssr.iam.gserviceaccount.com',
    '--oidc-token-audience=https://europe-west1-secondevienextjsssr.cloudfunctions.net/catalogReconciler',
    '--attempt-deadline=540s', '--max-retry-attempts=0'
  ]) assert.ok(schedulerJobArgs.includes(expected), expected);

  const gcRequest = validate({
    ...validationArgs({ allowlist: 'catalogMediaGarbageCollector', transport: 'gcloud-gen2' })
  });
  const gcFunctionArgs = buildGcloudGen2DeployArgs(gcRequest);
  for (const expected of [
    '--entry-point=catalogMediaGarbageCollector', '--trigger-http',
    '--run-service-account=catalog-builder@secondevienextjsssr.iam.gserviceaccount.com',
    '--memory=512Mi', '--timeout=540s', '--concurrency=1', '--max-instances=1'
  ]) assert.ok(gcFunctionArgs.includes(expected), expected);
  const gcJobArgs = buildGcloudSchedulerUpdateArgs(gcRequest);
  for (const expected of [
    'firebase-schedule-catalogMediaGarbageCollector-europe-west1',
    '--schedule=every 24 hours',
    '--oidc-service-account-email=catalog-builder@secondevienextjsssr.iam.gserviceaccount.com',
    '--attempt-deadline=540s'
  ]) assert.ok(gcJobArgs.includes(expected), expected);
  assert.match(
    fs.readFileSync(path.join(ROOT, 'scripts/deploy-functions-targeted.mjs'), 'utf8'),
    /target\.triggerType === 'http-scheduler' && target\.schedulerUpdateRequired !== false/
  );
  const artifactRequest = validate({
    ...validationArgs({ allowlist: 'onArtifactUpdated', transport: 'gcloud-gen2' })
  });
  const artifactArgs = buildGcloudGen2DeployArgs(artifactRequest);
  for (const expected of [
    '--entry-point=onArtifactUpdated',
    '--trigger-event-filters=type=google.cloud.firestore.document.v1.updated,database=(default),namespace=(default)',
    '--trigger-event-filters-path-pattern=document=artifacts/{appId}/public/data/{collection}/{docId}',
    '--trigger-service-account=functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    '--run-service-account=catalog-media-enqueuer@secondevienextjsssr.iam.gserviceaccount.com',
    '--memory=256Mi', '--timeout=300s', '--concurrency=1', '--max-instances=1', '--retry'
  ]) assert.ok(artifactArgs.includes(expected), expected);
  const artifactDeleteRequest = validate({
    ...validationArgs({ allowlist: 'onArtifactDeleted', transport: 'gcloud-gen2' })
  });
  const artifactDeleteArgs = buildGcloudGen2DeployArgs(artifactDeleteRequest);
  for (const expected of [
    '--entry-point=onArtifactDeleted',
    '--trigger-event-filters=type=google.cloud.firestore.document.v1.deleted,database=(default),namespace=(default)',
    '--trigger-event-filters-path-pattern=document=artifacts/{appId}/public/data/{collection}/{docId}',
    '--trigger-service-account=functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    '--run-service-account=catalog-media-enqueuer@secondevienextjsssr.iam.gserviceaccount.com',
    '--memory=256Mi', '--timeout=300s', '--concurrency=1', '--max-instances=1', '--retry'
  ]) assert.ok(artifactDeleteArgs.includes(expected), expected);
  const imageRequest = validate({
    ...validationArgs({ allowlist: 'processProductPublicationImage', transport: 'gcloud-gen2' })
  });
  const imageArgs = buildGcloudGen2DeployArgs(imageRequest);
  for (const expected of [
    '--entry-point=processProductPublicationImage',
    '--trigger-event-filters=type=google.cloud.storage.object.v1.finalized,bucket=secondevienextjsssr.firebasestorage.app',
    '--trigger-location=us-central1',
    '--trigger-service-account=functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    '--run-service-account=product-publication-worker@secondevienextjsssr.iam.gserviceaccount.com',
    '--memory=1024Mi', '--cpu=1', '--timeout=540s', '--concurrency=4',
    '--min-instances=0', '--max-instances=4', '--retry'
  ]) assert.ok(imageArgs.includes(expected), expected);
  assert.equal(imageArgs.some((arg) => arg.startsWith('--trigger-event-filters-path-pattern=')), false);

  const publicationCleanupRequest = validate({
    ...validationArgs({ allowlist: 'cleanupProductPublicationSessions', transport: 'gcloud-gen2' })
  });
  const publicationCleanupArgs = buildGcloudGen2DeployArgs(publicationCleanupRequest);
  for (const expected of [
    '--entry-point=cleanupProductPublicationSessions', '--trigger-http',
    '--run-service-account=product-publication-worker@secondevienextjsssr.iam.gserviceaccount.com',
    '--memory=512Mi', '--timeout=540s', '--concurrency=1', '--max-instances=1'
  ]) assert.ok(publicationCleanupArgs.includes(expected), expected);
  const publicationCleanupJobArgs = buildGcloudSchedulerUpdateArgs(publicationCleanupRequest);
  for (const expected of [
    'firebase-schedule-cleanupProductPublicationSessions-europe-west1',
    '--schedule=every 24 hours',
    '--oidc-service-account-email=product-publication-worker@secondevienextjsssr.iam.gserviceaccount.com',
    '--attempt-deadline=540s', '--max-retry-attempts=0'
  ]) assert.ok(publicationCleanupJobArgs.includes(expected), expected);
  assert.match(
    fs.readFileSync(path.join(ROOT, 'scripts/deploy-functions-targeted.mjs'), 'utf8'),
    /expectedSchedulerServiceAccount:\s*'231220287936-compute@developer\.gserviceaccount\.com'/
  );

  const publicationReconcilerRequest = validate({
    ...validationArgs({ allowlist: 'reconcileProductPublicationSessions', transport: 'gcloud-gen2' })
  });
  const publicationReconcilerArgs = buildGcloudGen2DeployArgs(publicationReconcilerRequest);
  for (const expected of [
    '--entry-point=reconcileProductPublicationSessions', '--trigger-http',
    '--run-service-account=product-publication-worker@secondevienextjsssr.iam.gserviceaccount.com',
    '--memory=512Mi', '--timeout=540s', '--concurrency=1', '--max-instances=1'
  ]) assert.ok(publicationReconcilerArgs.includes(expected), expected);
  const publicationReconcilerJobArgs = buildGcloudSchedulerUpdateArgs(publicationReconcilerRequest);
  for (const expected of [
    'firebase-schedule-reconcileProductPublicationSessions-europe-west1',
    '--schedule=every 15 minutes',
    '--oidc-service-account-email=product-publication-worker@secondevienextjsssr.iam.gserviceaccount.com',
    '--attempt-deadline=540s', '--max-retry-attempts=0'
  ]) assert.ok(publicationReconcilerJobArgs.includes(expected), expected);

  const orderCreatedRequest = validate({
    ...validationArgs({ allowlist: 'onOrderCreated', transport: 'gcloud-gen2' })
  });
  const orderCreatedArgs = buildGcloudGen2DeployArgs(orderCreatedRequest);
  for (const expected of [
    '--entry-point=onOrderCreated',
    '--trigger-event-filters=type=google.cloud.firestore.document.v1.created,database=(default),namespace=(default)',
    '--trigger-event-filters-path-pattern=document=orders/{orderId}',
    '--trigger-service-account=functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    '--run-service-account=legacy-order-email-worker@secondevienextjsssr.iam.gserviceaccount.com',
    '--memory=256Mi', '--timeout=60s', '--concurrency=1', '--max-instances=1', '--retry',
    '--set-secrets=GMAIL_EMAIL=GMAIL_EMAIL:2,GMAIL_PASSWORD=GMAIL_PASSWORD:5,RESEND_API_KEY=RESEND_API_KEY:1'
  ]) assert.ok(orderCreatedArgs.includes(expected), expected);

  const orderUpdatedRequest = validate({
    ...validationArgs({ allowlist: 'onOrderUpdated', transport: 'gcloud-gen2' })
  });
  const orderUpdatedArgs = buildGcloudGen2DeployArgs(orderUpdatedRequest);
  for (const expected of [
    '--entry-point=onOrderUpdated',
    '--trigger-event-filters=type=google.cloud.firestore.document.v1.updated,database=(default),namespace=(default)',
    '--trigger-event-filters-path-pattern=document=orders/{orderId}',
    '--trigger-service-account=functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    '--run-service-account=legacy-order-email-worker@secondevienextjsssr.iam.gserviceaccount.com',
    '--memory=256Mi', '--timeout=60s', '--concurrency=1', '--max-instances=1', '--retry',
    '--set-secrets=GMAIL_EMAIL=GMAIL_EMAIL:2,GMAIL_PASSWORD=GMAIL_PASSWORD:5,RESEND_API_KEY=RESEND_API_KEY:1'
  ]) assert.ok(orderUpdatedArgs.includes(expected), expected);

  const catalogBuildRequest = validate({
    ...validationArgs({ allowlist: 'dispatchCatalogBuild', transport: 'gcloud-gen2' })
  });
  const catalogBuildArgs = buildGcloudGen2DeployArgs(catalogBuildRequest);
  for (const expected of [
    '--entry-point=dispatchCatalogBuild', '--trigger-http',
    '--run-service-account=catalog-builder@secondevienextjsssr.iam.gserviceaccount.com',
    '--build-service-account=projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    '--memory=512Mi', '--timeout=300s', '--concurrency=1', '--max-instances=1',
    '--update-labels=deployment-tool=codex-targeted,migration-source-commit=f80dc7213a8d738fb1edde11a926028bcb57ab28,deployment-taskqueue=true'
  ]) assert.ok(catalogBuildArgs.includes(expected), expected);
  assert.equal(catalogBuildArgs.includes('--retry'), false);
  assert.doesNotThrow(() => assertTaskQueuePreconditions({
    name: 'projects/secondevienextjsssr/locations/europe-west1/queues/dispatchCatalogBuild',
    state: 'RUNNING',
    rateLimits: { maxConcurrentDispatches: 1, maxDispatchesPerSecond: 1, maxBurstSize: 10 },
    retryConfig: { maxAttempts: 10, minBackoff: '5s', maxBackoff: '300s', maxDoublings: 5 }
  }, {
    queueName: 'dispatchCatalogBuild', queueMaxConcurrentDispatches: 1,
    queueMaxDispatchesPerSecond: 1, queueMaxBurstSize: 10, queueMaxAttempts: 10,
    queueMinBackoff: '5s', queueMaxBackoff: '300s', queueMaxDoublings: 5
  }, []));
  assert.throws(() => assertTaskQueuePreconditions({
    name: 'projects/secondevienextjsssr/locations/europe-west1/queues/dispatchCatalogBuild',
    state: 'RUNNING',
    rateLimits: { maxConcurrentDispatches: 1, maxDispatchesPerSecond: 1, maxBurstSize: 10 },
    retryConfig: { maxAttempts: 10, minBackoff: '5s', maxBackoff: '300s', maxDoublings: 5 }
  }, {
    queueName: 'dispatchCatalogBuild', queueMaxConcurrentDispatches: 1,
    queueMaxDispatchesPerSecond: 1, queueMaxBurstSize: 10, queueMaxAttempts: 10,
    queueMinBackoff: '5s', queueMaxBackoff: '300s', queueMaxDoublings: 5
  }, [{ name: 'task-in-flight' }]), /Cloud Tasks en vol/);

  const catalogRevalidationRequest = validate({
    ...validationArgs({ allowlist: 'dispatchCatalogRevalidation', transport: 'gcloud-gen2' })
  });
  const catalogRevalidationArgs = buildGcloudGen2DeployArgs(catalogRevalidationRequest);
  for (const expected of [
    '--entry-point=dispatchCatalogRevalidation', '--trigger-http',
    '--run-service-account=catalog-builder@secondevienextjsssr.iam.gserviceaccount.com',
    '--build-service-account=projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    '--memory=256Mi', '--timeout=300s', '--concurrency=1', '--max-instances=1',
    '--set-secrets=CATALOG_REVALIDATION_HMAC_SECRET=CATALOG_REVALIDATION_HMAC_SECRET:3',
    '--update-labels=deployment-tool=codex-targeted,migration-source-commit=f80dc7213a8d738fb1edde11a926028bcb57ab28,deployment-taskqueue=true'
  ]) assert.ok(catalogRevalidationArgs.includes(expected), expected);
  assert.equal(catalogRevalidationArgs.includes('--retry'), false);
  assert.doesNotThrow(() => assertTaskQueuePreconditions({
    name: 'projects/secondevienextjsssr/locations/europe-west1/queues/dispatchCatalogRevalidation',
    state: 'RUNNING',
    rateLimits: { maxConcurrentDispatches: 1, maxDispatchesPerSecond: 1, maxBurstSize: 10 },
    retryConfig: { maxAttempts: 1, minBackoff: '5s', maxBackoff: '300s', maxDoublings: 5 }
  }, {
    queueName: 'dispatchCatalogRevalidation', queueMaxConcurrentDispatches: 1,
    queueMaxDispatchesPerSecond: 1, queueMaxBurstSize: 10, queueMaxAttempts: 1,
    queueMinBackoff: '5s', queueMaxBackoff: '300s', queueMaxDoublings: 5
  }, []));
  assert.deepEqual(buildGcloudTaskQueueUpdateArgs(catalogRevalidationRequest), [
    'tasks', 'queues', 'update', 'dispatchCatalogRevalidation',
    '--project=secondevienextjsssr', '--location=europe-west1',
    '--max-concurrent-dispatches=1', '--max-dispatches-per-second=1',
    '--max-attempts=1', '--min-backoff=5s', '--max-backoff=300s',
    '--max-doublings=5', '--quiet'
  ]);
});

test('l agregateur analytics se deploie avec une identite Eventarc distincte et bornee', () => {
  const target = GCLOUD_GEN2_TARGETS.aggregateAnalyticsSessionGen2;
  assert.equal(target.triggerType, 'event');
  assert.equal(target.eventType, 'google.cloud.firestore.document.v1.written');
  assert.equal(target.documentPathPattern, 'analytics_sessions/{sessionId}');
  assert.equal(target.triggerLocation, 'eur3');
  assert.equal(
    target.triggerServiceAccount,
    'functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com'
  );
  assert.equal(
    target.runtimeServiceAccount,
    'analytics-runtime@secondevienextjsssr.iam.gserviceaccount.com'
  );
  assert.notEqual(target.triggerServiceAccount, target.runtimeServiceAccount);
  assert.equal(target.minInstances, '0');
  assert.equal(target.maxInstances, '1');
  assert.equal(target.concurrency, '1');
});

test('le rollback G2-B est borne a la revision et a l archive source preservee', () => {
  const request = validate({
    ...validationArgs({
      allowlist: 'onOrderStatsWrite',
      transport: 'gcloud-gen2-rollback',
      approval: 'G2B_ROLLBACK_ON_ORDER_STATS_WRITE',
      'expected-revision': 'onorderstatswrite-00026-cec',
      'rollback-source-sha256': 'fd96218906ece6f8f97be3ca31ca69388bac38ac510494eb0e0e368465971d92'
    })
  });
  const args = buildGcloudGen2RollbackArgs(request);
  for (const expected of [
    '--source=gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/onOrderStatsWrite/onorderstatswrite-00025-nac-function-source.zip',
    '--run-service-account=order-stats-projector@secondevienextjsssr.iam.gserviceaccount.com',
    '--build-service-account=projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    '--trigger-service-account=functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    '--concurrency=80', '--max-instances=20', '--no-retry',
    '--update-labels=deployment-tool=codex-targeted,migration-rollback-source=onorderstatswrite-00025-nac'
  ]) assert.ok(args.includes(expected), expected);
  assert.throws(() => assertGen2RollbackObject({
    metadata: { generation: '1', size: '2', temporary_hold: false },
    rollback: {
      sourceGeneration: '1', sourceSize: '2', sourceSha256: 'a'.repeat(64),
      temporaryHoldRequired: true
    },
    actualSha256: 'a'.repeat(64)
  }), /Objet source rollback Gen2 inattendu/);
  assert.throws(() => validate({
    ...validationArgs({
      allowlist: 'onOrderStatsWrite', transport: 'gcloud-gen2-rollback',
      approval: 'WRONG', 'expected-revision': 'onorderstatswrite-00026-cec',
      'rollback-source-sha256': 'fd96218906ece6f8f97be3ca31ca69388bac38ac510494eb0e0e368465971d92'
    })
  }), /Approbation rollback/);
  const catalogRequest = validate({
    ...validationArgs({
      allowlist: 'onCatalogSourceWrite',
      transport: 'gcloud-gen2-rollback',
      approval: 'G2B_ROLLBACK_ON_CATALOG_SOURCE_WRITE',
      'expected-revision': 'oncatalogsourcewrite-00011-abc',
      'rollback-source-sha256': '3c9a44606a3098c774be1d80be6f0af82e54c0bbe3b63534e4a28fb81e8674b4'
    })
  });
  const catalogArgs = buildGcloudGen2RollbackArgs(catalogRequest);
  for (const expected of [
    '--source=gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/onCatalogSourceWrite/oncatalogsourcewrite-00010-gis-function-source.zip',
    '--run-service-account=catalog-enqueuer@secondevienextjsssr.iam.gserviceaccount.com',
    '--trigger-service-account=functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    '--concurrency=80', '--max-instances=20', '--retry',
    '--update-labels=deployment-tool=codex-targeted,migration-rollback-source=oncatalogsourcewrite-00010-gis'
  ]) assert.ok(catalogArgs.includes(expected), expected);

  const schedulerRequest = validate({
    ...validationArgs({
      allowlist: 'catalogReconciler',
      transport: 'gcloud-gen2-rollback',
      approval: 'G2B_ROLLBACK_CATALOG_RECONCILER',
      'expected-revision': 'catalogreconciler-00010-abc',
      'rollback-source-sha256': 'fd96218906ece6f8f97be3ca31ca69388bac38ac510494eb0e0e368465971d92'
    })
  });
  const schedulerFunctionArgs = buildGcloudGen2RollbackArgs(schedulerRequest);
  for (const expected of [
    '--source=gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/catalogReconciler/catalogreconciler-00009-luf-function-source.zip',
    '--trigger-http',
    '--run-service-account=catalog-enqueuer@secondevienextjsssr.iam.gserviceaccount.com',
    '--memory=256Mi', '--timeout=120s', '--concurrency=80', '--max-instances=20'
  ]) assert.ok(schedulerFunctionArgs.includes(expected), expected);
  const schedulerJobArgs = buildGcloudSchedulerUpdateArgs(schedulerRequest, { rollback: true });
  assert.ok(schedulerJobArgs.includes('--attempt-deadline=180s'));

  const gcRequest = validate({
    ...validationArgs({
      allowlist: 'catalogMediaGarbageCollector',
      transport: 'gcloud-gen2-rollback',
      approval: 'G2B_ROLLBACK_CATALOG_MEDIA_GC',
      'expected-revision': 'catalogmediagarbagecollector-00010-abc',
      'rollback-source-sha256': 'fd96218906ece6f8f97be3ca31ca69388bac38ac510494eb0e0e368465971d92'
    })
  });
  const gcArgs = buildGcloudGen2RollbackArgs(gcRequest);
  for (const expected of [
    '--source=gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/catalogMediaGarbageCollector/catalogmediagarbagecollector-00009-geb-function-source.zip',
    '--trigger-http', '--concurrency=80', '--max-instances=20', '--timeout=540s'
  ]) assert.ok(gcArgs.includes(expected), expected);
  const artifactRequest = validate({
    ...validationArgs({
      allowlist: 'onArtifactUpdated', transport: 'gcloud-gen2-rollback',
      approval: 'G2B_ROLLBACK_ON_ARTIFACT_UPDATED',
      'expected-revision': 'onartifactupdated-00024-abc',
      'rollback-source-sha256': 'fd96218906ece6f8f97be3ca31ca69388bac38ac510494eb0e0e368465971d92'
    })
  });
  const artifactArgs = buildGcloudGen2RollbackArgs(artifactRequest);
  for (const expected of [
    '--source=gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/onArtifactUpdated/onartifactupdated-00023-riw-function-source.zip',
    '--run-service-account=catalog-media-enqueuer@secondevienextjsssr.iam.gserviceaccount.com',
    '--concurrency=80', '--max-instances=20', '--no-retry'
  ]) assert.ok(artifactArgs.includes(expected), expected);
  const artifactDeleteRequest = validate({
    ...validationArgs({
      allowlist: 'onArtifactDeleted', transport: 'gcloud-gen2-rollback',
      approval: 'G2B_ROLLBACK_ON_ARTIFACT_DELETED_SAFE_INFRA_ONLY',
      'expected-revision': 'onartifactdeleted-00024-abc',
      'rollback-source-sha256': '15f6b946217a9b90a967abc9214bff741e8b8b6cd5b5be5601080ed525afc1bf'
    })
  });
  const artifactDeleteArgs = buildGcloudGen2RollbackArgs(artifactDeleteRequest);
  for (const expected of [
    '--source=gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/onArtifactDeleted/safe-baseline-d385c3c-function-source.zip',
    '--run-service-account=catalog-media-enqueuer@secondevienextjsssr.iam.gserviceaccount.com',
    '--concurrency=80', '--max-instances=20', '--no-retry',
    '--update-labels=deployment-tool=codex-targeted,migration-rollback-source=safe-baseline-d385c3c'
  ]) assert.ok(artifactDeleteArgs.includes(expected), expected);
  assert.equal(artifactDeleteArgs.some((arg) => arg.includes('unsafe-cloud-revision')), false);
  const imageRequest = validate({
    ...validationArgs({
      allowlist: 'processProductPublicationImage', transport: 'gcloud-gen2-rollback',
      approval: 'G2B_ROLLBACK_PROCESS_PRODUCT_PUBLICATION_IMAGE',
      'expected-revision': 'processproductpublicationimage-00004-abc',
      'rollback-source-sha256': 'bce7ff79ecfc2308ae744ee61cb889cd02fba781b466d16a383fa610b7d91880'
    })
  });
  const imageArgs = buildGcloudGen2RollbackArgs(imageRequest);
  for (const expected of [
    '--source=gs://gcf-v2-sources-231220287936-us-central1/g2b-rollback/processProductPublicationImage/processproductpublicationimage-00003-por-function-source.zip',
    '--run-service-account=product-publication-worker@secondevienextjsssr.iam.gserviceaccount.com',
    '--concurrency=4', '--max-instances=20', '--retry',
    '--update-labels=deployment-tool=codex-targeted,migration-rollback-source=processproductpublicationimage-00003-por'
  ]) assert.ok(imageArgs.includes(expected), expected);

  const publicationCleanupRequest = validate({
    ...validationArgs({
      allowlist: 'cleanupProductPublicationSessions', transport: 'gcloud-gen2-rollback',
      approval: 'G2B_ROLLBACK_CLEANUP_PRODUCT_PUBLICATION_SESSIONS',
      'expected-revision': 'cleanupproductpublicationsessions-00003-abc',
      'rollback-source-sha256': 'bce7ff79ecfc2308ae744ee61cb889cd02fba781b466d16a383fa610b7d91880'
    })
  });
  const publicationCleanupArgs = buildGcloudGen2RollbackArgs(publicationCleanupRequest);
  for (const expected of [
    '--source=gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/cleanupProductPublicationSessions/cleanupproductpublicationsessions-00002-qih-function-source.zip',
    '--trigger-http',
    '--run-service-account=231220287936-compute@developer.gserviceaccount.com',
    '--memory=512Mi', '--timeout=540s', '--concurrency=80', '--max-instances=20',
    '--update-labels=deployment-tool=codex-targeted,migration-rollback-source=cleanupproductpublicationsessions-00002-qih'
  ]) assert.ok(publicationCleanupArgs.includes(expected), expected);
  const publicationCleanupJobArgs = buildGcloudSchedulerUpdateArgs(publicationCleanupRequest, { rollback: true });
  assert.ok(publicationCleanupJobArgs.includes('--attempt-deadline=540s'));

  const publicationReconcilerRequest = validate({
    ...validationArgs({
      allowlist: 'reconcileProductPublicationSessions', transport: 'gcloud-gen2-rollback',
      approval: 'G2B_ROLLBACK_RECONCILE_PRODUCT_PUBLICATION_SESSIONS',
      'expected-revision': 'reconcileproductpublicationsessions-00004-abc',
      'rollback-source-sha256': 'bce7ff79ecfc2308ae744ee61cb889cd02fba781b466d16a383fa610b7d91880'
    })
  });
  const publicationReconcilerArgs = buildGcloudGen2RollbackArgs(publicationReconcilerRequest);
  for (const expected of [
    '--source=gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/reconcileProductPublicationSessions/reconcileproductpublicationsessions-00003-bit-function-source.zip',
    '--trigger-http',
    '--run-service-account=231220287936-compute@developer.gserviceaccount.com',
    '--concurrency=80', '--max-instances=20',
    '--update-labels=deployment-tool=codex-targeted,migration-rollback-source=reconcileproductpublicationsessions-00003-bit'
  ]) assert.ok(publicationReconcilerArgs.includes(expected), expected);

  const orderCreatedRequest = validate({
    ...validationArgs({
      allowlist: 'onOrderCreated', transport: 'gcloud-gen2-rollback',
      approval: 'G2B_ROLLBACK_ON_ORDER_CREATED',
      'expected-revision': 'onordercreated-00029-abc',
      'rollback-source-sha256': 'bce7ff79ecfc2308ae744ee61cb889cd02fba781b466d16a383fa610b7d91880'
    })
  });
  const orderCreatedArgs = buildGcloudGen2RollbackArgs(orderCreatedRequest);
  for (const expected of [
    '--source=gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/onOrderCreated/onordercreated-00028-dov-function-source.zip',
    '--run-service-account=231220287936-compute@developer.gserviceaccount.com',
    '--concurrency=80', '--max-instances=20', '--no-retry',
    '--set-secrets=GMAIL_EMAIL=GMAIL_EMAIL:2,GMAIL_PASSWORD=GMAIL_PASSWORD:5,RESEND_API_KEY=RESEND_API_KEY:1',
    '--update-labels=deployment-tool=codex-targeted,migration-rollback-source=onordercreated-00028-dov'
  ]) assert.ok(orderCreatedArgs.includes(expected), expected);

  const orderUpdatedRequest = validate({
    ...validationArgs({
      allowlist: 'onOrderUpdated', transport: 'gcloud-gen2-rollback',
      approval: 'G2B_ROLLBACK_ON_ORDER_UPDATED',
      'expected-revision': 'onorderupdated-00029-abc',
      'rollback-source-sha256': 'bce7ff79ecfc2308ae744ee61cb889cd02fba781b466d16a383fa610b7d91880'
    })
  });
  const orderUpdatedArgs = buildGcloudGen2RollbackArgs(orderUpdatedRequest);
  for (const expected of [
    '--source=gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/onOrderUpdated/onorderupdated-00028-hoc-function-source.zip',
    '--run-service-account=231220287936-compute@developer.gserviceaccount.com',
    '--concurrency=80', '--max-instances=20', '--no-retry',
    '--set-secrets=GMAIL_EMAIL=GMAIL_EMAIL:2,GMAIL_PASSWORD=GMAIL_PASSWORD:5,RESEND_API_KEY=RESEND_API_KEY:1',
    '--update-labels=deployment-tool=codex-targeted,migration-rollback-source=onorderupdated-00028-hoc'
  ]) assert.ok(orderUpdatedArgs.includes(expected), expected);

  const catalogBuildRequest = validate({
    ...validationArgs({
      allowlist: 'dispatchCatalogBuild', transport: 'gcloud-gen2-rollback',
      approval: 'G2B_ROLLBACK_DISPATCH_CATALOG_BUILD',
      'expected-revision': 'dispatchcatalogbuild-00013-abc',
      'rollback-source-sha256': '3c9a44606a3098c774be1d80be6f0af82e54c0bbe3b63534e4a28fb81e8674b4'
    })
  });
  const catalogBuildArgs = buildGcloudGen2RollbackArgs(catalogBuildRequest);
  for (const expected of [
    '--source=gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/dispatchCatalogBuild/dispatchcatalogbuild-00012-coh-function-source.zip',
    '--trigger-http', '--run-service-account=catalog-builder@secondevienextjsssr.iam.gserviceaccount.com',
    '--memory=256Mi', '--timeout=60s', '--concurrency=80', '--max-instances=20',
    '--update-labels=deployment-tool=codex-targeted,migration-rollback-source=dispatchcatalogbuild-00012-coh,deployment-taskqueue=true'
  ]) assert.ok(catalogBuildArgs.includes(expected), expected);
  assert.equal(catalogBuildArgs.includes('--retry'), false);
  assert.equal(catalogBuildArgs.includes('--no-retry'), false);

  const catalogRevalidationRequest = validate({
    ...validationArgs({
      allowlist: 'dispatchCatalogRevalidation', transport: 'gcloud-gen2-rollback',
      approval: 'G2B_ROLLBACK_DISPATCH_CATALOG_REVALIDATION',
      'expected-revision': 'dispatchcatalogrevalidation-00012-abc',
      'rollback-source-sha256': '309254de3352ec0c6395b3e125adf41072bf85be9d9facaaf56bedffbfc995bd'
    })
  });
  const catalogRevalidationArgs = buildGcloudGen2RollbackArgs(catalogRevalidationRequest);
  for (const expected of [
    '--source=gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/dispatchCatalogRevalidation/dispatchcatalogrevalidation-00011-her-function-source.zip',
    '--trigger-http', '--run-service-account=catalog-builder@secondevienextjsssr.iam.gserviceaccount.com',
    '--memory=256Mi', '--timeout=60s', '--concurrency=80', '--max-instances=20',
    '--set-secrets=CATALOG_REVALIDATION_HMAC_SECRET=CATALOG_REVALIDATION_HMAC_SECRET:3',
    '--update-labels=deployment-tool=codex-targeted,migration-rollback-source=dispatchcatalogrevalidation-00011-her,deployment-taskqueue=true'
  ]) assert.ok(catalogRevalidationArgs.includes(expected), expected);
  assert.equal(catalogRevalidationArgs.includes('--retry'), false);
  assert.equal(catalogRevalidationArgs.includes('--no-retry'), false);
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

test('la preuve G1 du dispatcher reste bornee a une expiration Stripe test idempotente', () => {
  const source = fs.readFileSync(
    path.join(ROOT, 'scripts/prove-commerce-reservation-expiry-g1.mjs'),
    'utf8'
  );
  assert.match(source, /G1_RESERVATION_EXPIRY_STRIPE_TEST_ONLY_NO_REFUND_NO_RESTOCK/);
  assert.match(source, /args\.get\('confirm'\) === CONFIRMATION/);
  assert.match(source, /args\.get\('commit'\) === currentCommit\(\)/);
  assert.match(source, /STRIPE_SECRET_KEY\.startsWith\('sk_test_'\)/);
  assert.match(source, /account\.livemode !== true/);
  assert.match(source, /accountState\?\.livemode === false/);
  assert.match(source, /beforeProduct\.e2eOnly === true/);
  assert.match(source, /checkoutExpiresAt:\s*expiresAt/);
  assert.match(source, /checkoutChannel:\s*'g1_reservation_expiry_proof'/);
  assert.equal((source.match(/runScheduler\(\);/g) || []).length, 2);
  assert.match(source, /secondMovementSnap\.updateTime\.toMillis\(\) === firstMovementUpdateTime/);
  assert.match(source, /secondReservationSnap\.data\(\)\?\.restockedQty === 0/);
  assert.doesNotMatch(source, /stripe\.refunds|createRefundRuntime|transaction\.delete\(/);
  assert.match(source, /`--project=\$\{PROJECT_ID\}`/);
});
