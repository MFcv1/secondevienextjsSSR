#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const EXPECTED_PROJECT = 'secondevienextjsssr';
export const EXPECTED_CODEBASE = 'main';
export const MAX_BATCH_SIZE = 10;
const FIREBASE_DNS_NODE_OPTION = '--dns-result-order=ipv4first';
const GCLOUD_GEN1_TARGETS = Object.freeze({
  commerceOperationsReconciler: Object.freeze({
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'commerceOperationsReconciler',
    triggerTopic: 'firebase-schedule-commerceOperationsReconciler-europe-west1',
    serviceAccount: 'commerce-operations-reconciler@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/231220287936-compute@developer.gserviceaccount.com',
    memory: '512MB',
    timeout: '300s',
    maxInstances: '1',
    ingressSettings: 'all',
    expectedVersion: '12',
    expectedServiceAccount: 'commerce-operations-reconciler@secondevienextjsssr.iam.gserviceaccount.com',
    secrets: []
  }),
  commerceReservationExpiryDispatcher: Object.freeze({
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'commerceReservationExpiryDispatcher',
    triggerTopic: 'firebase-schedule-commerceReservationExpiryDispatcher-europe-west1',
    serviceAccount: 'commerce-reservation-expiry@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/231220287936-compute@developer.gserviceaccount.com',
    memory: '512MB',
    timeout: '300s',
    maxInstances: '1',
    ingressSettings: 'all',
    expectedVersion: '2',
    expectedServiceAccount: 'secondevienextjsssr@appspot.gserviceaccount.com',
    secrets: ['STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:4']
  }),
  commerceOutboxDispatcher: Object.freeze({
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'commerceOutboxDispatcher',
    triggerTopic: 'firebase-schedule-commerceOutboxDispatcher-europe-west1',
    serviceAccount: 'commerce-outbox-dispatcher@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/231220287936-compute@developer.gserviceaccount.com',
    memory: '512MB',
    timeout: '300s',
    maxInstances: '1',
    ingressSettings: 'all',
    expectedVersion: '10',
    expectedServiceAccount: 'secondevienextjsssr@appspot.gserviceaccount.com',
    secrets: [
      'GMAIL_EMAIL=GMAIL_EMAIL:2',
      'GMAIL_PASSWORD=GMAIL_PASSWORD:5',
      'RESEND_API_KEY=RESEND_API_KEY:1'
    ]
  }),
  expireAdminPaymentLinks: Object.freeze({
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'expireAdminPaymentLinks',
    triggerTopic: 'firebase-schedule-expireAdminPaymentLinks-europe-west1',
    serviceAccount: 'admin-payment-link-expiry@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/231220287936-compute@developer.gserviceaccount.com',
    memory: '512MB',
    timeout: '300s',
    maxInstances: '1',
    ingressSettings: 'all',
    expectedVersion: '4',
    expectedServiceAccount: 'secondevienextjsssr@appspot.gserviceaccount.com',
    secrets: [
      'STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:4',
      'PAYMENT_LINK_HMAC_SECRET=PAYMENT_LINK_HMAC_SECRET:1'
    ]
  })
});
const GCLOUD_GEN2_TARGETS = Object.freeze({
  onOrderStatsWrite: Object.freeze({
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'onOrderStatsWrite',
    eventType: 'google.cloud.firestore.document.v1.written',
    eventFilters: 'type=google.cloud.firestore.document.v1.written,database=(default),namespace=(default)',
    documentPathPattern: 'orders/{orderId}',
    eventPathPattern: 'document=orders/{orderId}',
    triggerLocation: 'eur3',
    triggerServiceAccount: 'functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    runtimeServiceAccount: 'order-stats-projector@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '1',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  onCatalogSourceWrite: Object.freeze({
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'onCatalogSourceWrite',
    eventType: 'google.cloud.firestore.document.v1.written',
    eventFilters: 'type=google.cloud.firestore.document.v1.written,database=(default),namespace=(default)',
    documentPathPattern: 'artifacts/{appId}/public/data/furniture/{productId}',
    eventPathPattern: 'document=artifacts/{appId}/public/data/furniture/{productId}',
    triggerLocation: 'eur3',
    triggerServiceAccount: 'functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    runtimeServiceAccount: 'catalog-enqueuer@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '1',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  })
});
const G2B_ROLLBACKS = Object.freeze({
  onOrderStatsWrite: Object.freeze({
    approval: 'G2B_ROLLBACK_ON_ORDER_STATS_WRITE',
    sourceRevision: 'onorderstatswrite-00025-nac',
    source: 'gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/onOrderStatsWrite/onorderstatswrite-00025-nac-function-source.zip',
    sourceGeneration: '1786883731057943',
    sourceSize: '345983',
    sourceSha256: 'fd96218906ece6f8f97be3ca31ca69388bac38ac510494eb0e0e368465971d92',
    concurrency: '80',
    maxInstances: '20',
    retry: false
  }),
  onCatalogSourceWrite: Object.freeze({
    approval: 'G2B_ROLLBACK_ON_CATALOG_SOURCE_WRITE',
    sourceRevision: 'oncatalogsourcewrite-00010-gis',
    source: 'gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/onCatalogSourceWrite/oncatalogsourcewrite-00010-gis-function-source.zip',
    sourceGeneration: '1786885189999864',
    sourceSize: '372482',
    sourceSha256: '3c9a44606a3098c774be1d80be6f0af82e54c0bbe3b63534e4a28fb81e8674b4',
    concurrency: '80',
    maxInstances: '20',
    retry: true
  })
});

function fail(message) {
  throw new Error(message);
}

export function buildFirebaseCliEnv(baseEnv = process.env) {
  const nodeOptions = String(baseEnv.NODE_OPTIONS || '')
    .split(/\s+/)
    .filter(Boolean);
  if (!nodeOptions.includes(FIREBASE_DNS_NODE_OPTION)) nodeOptions.push(FIREBASE_DNS_NODE_OPTION);
  return {
    ...baseEnv,
    FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true',
    NODE_OPTIONS: nodeOptions.join(' ')
  };
}

export function parseDeployArgs(argv) {
  const args = { execute: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--execute') {
      args.execute = true;
      continue;
    }
    if (!token.startsWith('--')) fail(`Argument inattendu: ${token}`);
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) fail(`Valeur manquante pour --${key}`);
    if (Object.hasOwn(args, key)) fail(`Argument duplique: --${key}`);
    args[key] = value;
    index += 1;
  }
  return args;
}

function required(args, key) {
  if (!args[key]) fail(`Argument obligatoire manquant: --${key}`);
  return args[key];
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    env: buildFirebaseCliEnv(process.env),
    stdio: options.stdio || ['ignore', 'pipe', 'pipe']
  });
  if (result.error) fail(`${command}: ${result.error.message}`);
  if (result.status !== 0) fail(`${command} ${args.join(' ')} a echoue: ${(result.stderr || result.stdout || '').trim()}`);
  return result.stdout || '';
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function resolveRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

function parseAllowlist(raw) {
  const names = raw.split(',').map((name) => name.trim()).filter(Boolean);
  if (!names.length) fail('Allowlist vide interdite');
  if (names.length > MAX_BATCH_SIZE) fail(`Allowlist limitee a ${MAX_BATCH_SIZE} cibles`);
  if (new Set(names).size !== names.length) fail('Allowlist dupliquee interdite');
  for (const name of names) if (!/^[A-Za-z][A-Za-z0-9_-]{0,62}$/.test(name)) fail(`Nom de cible invalide: ${name}`);
  return names;
}

function assertManifestDigest(rootDir, manifestPath, digestPath) {
  const digest = JSON.parse(fs.readFileSync(digestPath, 'utf8'));
  const relativeManifest = path.relative(rootDir, manifestPath).split(path.sep).join('/');
  const expected = digest.files?.[relativeManifest];
  if (!expected) fail(`Digest absent pour ${relativeManifest}`);
  const actual = sha256File(manifestPath);
  if (actual !== expected) fail(`Digest manifeste invalide pour ${relativeManifest}`);
}

function readFirebaseProject(rootDir) {
  const firebaserc = JSON.parse(fs.readFileSync(path.join(rootDir, '.firebaserc'), 'utf8'));
  return firebaserc.projects?.default || null;
}

function assertCodebase(rootDir, expectedCodebase) {
  const firebase = JSON.parse(fs.readFileSync(path.join(rootDir, 'firebase.json'), 'utf8'));
  const rows = Array.isArray(firebase.functions) ? firebase.functions : [firebase.functions].filter(Boolean);
  const match = rows.find((row) => row.codebase === expectedCodebase);
  if (!match || match.source !== 'functions') fail(`Codebase ${expectedCodebase} absent ou source inattendue`);
}

function assertCleanDeploymentInputs(rootDir) {
  const result = spawnSync('git', ['status', '--porcelain', '--untracked-files=all', '--', 'functions', 'firebase.json', 'scripts/deploy-functions-targeted.mjs', 'apphostingaudit/manifests'], {
    cwd: rootDir,
    encoding: 'utf8'
  });
  if (result.status !== 0) fail('Impossible de verifier le worktree Git');
  if (result.stdout.trim()) fail('Deploiement refuse: inputs Functions/manifeste non committes');
}

export function validateDeploymentRequest({
  args,
  manifest,
  rootDir,
  manifestPath,
  digestPath,
  currentCommit,
  activeFirebaseProject,
  baselineIsAncestor = manifest.metadata?.baselineCommit === currentCommit
}) {
  const project = required(args, 'project');
  const codebase = required(args, 'codebase');
  const commit = required(args, 'commit');
  const allowlist = parseAllowlist(required(args, 'allowlist'));
  const transport = args.transport || 'firebase';
  if (project !== EXPECTED_PROJECT) fail(`Projet interdit: ${project}`);
  if (codebase !== EXPECTED_CODEBASE) fail(`Codebase interdite: ${codebase}`);
  if (!['firebase', 'gcloud-gen1', 'gcloud-gen2', 'gcloud-gen2-rollback'].includes(transport)) fail(`Transport interdit: ${transport}`);
  if (activeFirebaseProject !== EXPECTED_PROJECT) fail(`Projet Firebase effectif different: ${activeFirebaseProject || 'absent'}`);
  if (readFirebaseProject(rootDir) !== EXPECTED_PROJECT) fail('Alias Firebase local different du sandbox attendu');
  if (manifest.metadata?.project !== EXPECTED_PROJECT || manifest.metadata?.codebase !== EXPECTED_CODEBASE) fail('Manifeste projet/codebase invalide');
  if (currentCommit !== commit) fail(`HEAD ${currentCommit} different du commit demande ${commit}`);
  if (!/^[0-9a-f]{40}$/.test(manifest.metadata?.baselineCommit || '')) fail('Baseline du manifeste invalide');
  if (!baselineIsAncestor) fail('Baseline du manifeste absente de l historique du commit demande');
  assertManifestDigest(rootDir, manifestPath, digestPath);
  assertCodebase(rootDir, codebase);
  const byName = new Map((manifest.functions || []).map((entry) => [entry.name, entry]));
  const entries = allowlist.map((name) => {
    const entry = byName.get(name);
    if (!entry) fail(`Cible absente du manifeste: ${name}`);
    if (entry.decision?.classification === 'HOLD_META_RECONCILIATION') fail(`Cible sous HOLD_META_RECONCILIATION: ${name}`);
    if (manifest.deploymentPolicy?.forbiddenTargets?.includes(name)) fail(`Cible interdite par le manifeste: ${name}`);
    return entry;
  });
  if (entries.some((entry) => entry.decision?.deploymentMaxBatchSize === 1) && entries.length !== 1) {
    fail('Finance, webhook ou scheduler: une seule cible autorisee');
  }
  const selectors = allowlist.map((name) => `functions:${codebase}:${name}`);
  if (selectors.some((selector) => selector === `functions:${codebase}` || selector === 'functions')) fail('Selecteur Functions global interdit');
  if (transport === 'gcloud-gen1') {
    if (allowlist.length !== 1 || !GCLOUD_GEN1_TARGETS[allowlist[0]]) {
      fail('Fallback gcloud Gen1 limite aux schedulers G1 approuves');
    }
  }
  if (transport === 'gcloud-gen2') {
    if (allowlist.length !== 1 || !GCLOUD_GEN2_TARGETS[allowlist[0]]) {
      fail('Transport gcloud Gen2 limite a la cible G2-B approuvee');
    }
    if (entries[0].cloud?.generation !== 2 || entries[0].decision?.classification !== 'KEEP_GEN2') {
      fail('Transport gcloud Gen2 exige une cible Gen2 existante KEEP_GEN2');
    }
  }
  if (transport === 'gcloud-gen2-rollback') {
    const rollback = allowlist.length === 1 ? G2B_ROLLBACKS[allowlist[0]] : null;
    if (!rollback) fail('Rollback gcloud Gen2 limite aux cibles G2-B approuvees');
    if (args.approval !== rollback.approval) fail('Approbation rollback G2-B invalide');
    const revisionPrefix = allowlist[0].toLowerCase();
    if (!new RegExp(`^${revisionPrefix}-[0-9]{5}-[a-z0-9]{3}$`).test(args['expected-revision'] || '')) {
      fail('Revision Gen2 courante obligatoire pour rollback');
    }
    if (args['rollback-source-sha256'] !== rollback.sourceSha256) {
      fail('Digest source rollback G2-B invalide');
    }
  }
  return { project, codebase, commit, allowlist, selectors, entries, transport };
}

export function buildFirebaseDeployArgs(validation) {
  return [
    'deploy',
    '--project', validation.project,
    '--only', validation.selectors.join(',')
  ];
}

export function buildGcloudGen1DeployArgs(validation) {
  const name = validation.allowlist[0];
  const target = GCLOUD_GEN1_TARGETS[name];
  if (validation.transport !== 'gcloud-gen1' || validation.allowlist.length !== 1 || !target) {
    fail('Fallback gcloud Gen1 non autorise');
  }
  const deployArgs = [
    'functions', 'deploy', name,
    `--project=${validation.project}`,
    `--region=${target.region}`,
    '--no-gen2',
    `--runtime=${target.runtime}`,
    '--source=functions',
    `--entry-point=${target.entryPoint}`,
    `--trigger-topic=${target.triggerTopic}`,
    `--service-account=${target.serviceAccount}`,
    `--build-service-account=${target.buildServiceAccount}`,
    `--memory=${target.memory}`,
    `--timeout=${target.timeout}`,
    `--max-instances=${target.maxInstances}`,
    '--no-retry',
    `--ingress-settings=${target.ingressSettings}`,
    '--quiet'
  ];
  if (target.secrets.length) deployArgs.push(`--set-secrets=${target.secrets.join(',')}`);
  return deployArgs;
}

export function buildGcloudGen2DeployArgs(validation) {
  const name = validation.allowlist[0];
  const target = GCLOUD_GEN2_TARGETS[name];
  if (validation.transport !== 'gcloud-gen2' || validation.allowlist.length !== 1 || !target) {
    fail('Transport gcloud Gen2 non autorise');
  }
  return [
    'functions', 'deploy', name,
    `--project=${validation.project}`,
    `--region=${target.region}`,
    '--gen2',
    `--runtime=${target.runtime}`,
    '--source=functions',
    `--entry-point=${target.entryPoint}`,
    `--trigger-event-filters=${target.eventFilters}`,
    `--trigger-event-filters-path-pattern=${target.eventPathPattern}`,
    `--trigger-location=${target.triggerLocation}`,
    `--trigger-service-account=${target.triggerServiceAccount}`,
    `--run-service-account=${target.runtimeServiceAccount}`,
    `--build-service-account=${target.buildServiceAccount}`,
    `--memory=${target.memory}`,
    `--cpu=${target.cpu}`,
    `--timeout=${target.timeout}`,
    `--concurrency=${target.concurrency}`,
    `--min-instances=${target.minInstances}`,
    `--max-instances=${target.maxInstances}`,
    '--retry',
    `--ingress-settings=${target.ingressSettings}`,
    '--no-allow-unauthenticated',
    `--update-labels=deployment-tool=codex-targeted,migration-source-commit=${validation.commit}`,
    '--quiet'
  ];
}

export function buildGcloudGen2RollbackArgs(validation) {
  const name = validation.allowlist[0];
  const target = GCLOUD_GEN2_TARGETS[name];
  const rollback = G2B_ROLLBACKS[name];
  if (validation.transport !== 'gcloud-gen2-rollback' || !target || !rollback) {
    fail('Rollback gcloud Gen2 non autorise');
  }
  const args = [
    'functions', 'deploy', name,
    `--project=${validation.project}`,
    `--region=${target.region}`,
    '--gen2',
    `--runtime=${target.runtime}`,
    `--source=${rollback.source}`,
    `--entry-point=${target.entryPoint}`,
    `--trigger-event-filters=${target.eventFilters}`,
    `--trigger-event-filters-path-pattern=${target.eventPathPattern}`,
    `--trigger-location=${target.triggerLocation}`,
    `--trigger-service-account=${target.triggerServiceAccount}`,
    `--run-service-account=${target.runtimeServiceAccount}`,
    `--build-service-account=${target.buildServiceAccount}`,
    `--memory=${target.memory}`, `--cpu=${target.cpu}`, `--timeout=${target.timeout}`,
    `--concurrency=${rollback.concurrency}`, '--min-instances=0',
    `--max-instances=${rollback.maxInstances}`,
    `--ingress-settings=${target.ingressSettings}`,
    '--no-allow-unauthenticated',
    `--update-labels=deployment-tool=codex-targeted,migration-rollback-source=${rollback.sourceRevision}`,
    '--quiet'
  ];
  args.splice(args.indexOf(`--ingress-settings=${target.ingressSettings}`), 0, rollback.retry ? '--retry' : '--no-retry');
  return args;
}

function assertGcloudGen2Preconditions(before, validation) {
  const name = validation.allowlist[0];
  const target = GCLOUD_GEN2_TARGETS[name];
  const manifestEntry = validation.entries[0];
  const filters = new Map((before.eventTrigger?.eventFilters || []).map((entry) =>
    [entry.attribute, `${entry.operator || 'exact'}:${entry.value}`]));
  const expectedName = `projects/${validation.project}/locations/${target.region}/functions/${name}`;
  if (
    before.name !== expectedName || before.state !== 'ACTIVE' ||
    before.buildConfig?.runtime !== target.runtime ||
    before.buildConfig?.entryPoint !== target.entryPoint ||
    before.buildConfig?.serviceAccount !== manifestEntry.identities?.buildServiceAccount ||
    before.serviceConfig?.revision !== manifestEntry.cloud?.revision ||
    before.serviceConfig?.serviceAccountEmail !== manifestEntry.identities?.runtimeServiceAccount ||
    before.eventTrigger?.eventType !== target.eventType ||
    before.eventTrigger?.triggerRegion !== target.triggerLocation ||
    before.eventTrigger?.serviceAccountEmail !== manifestEntry.trigger?.transportServiceAccount ||
    filters.get('database') !== 'exact:(default)' ||
    filters.get('namespace') !== 'exact:(default)' ||
    filters.get('document') !== `match-path-pattern:${target.documentPathPattern}`
  ) fail('Etat cloud Gen2 inattendu avant deploiement');
}

export function main(argv = process.argv.slice(2), dependencies = {}) {
  const rootDir = dependencies.rootDir || resolveRoot();
  const args = parseDeployArgs(argv);
  const manifestPath = path.resolve(rootDir, required(args, 'manifest'));
  const digestPath = path.resolve(rootDir, required(args, 'digest'));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const currentCommit = dependencies.currentCommit || run('git', ['rev-parse', 'HEAD'], { cwd: rootDir }).trim();
  const activeFirebaseProject = dependencies.activeFirebaseProject || readFirebaseProject(rootDir);
  const baselineCheck = spawnSync('git', [
    'merge-base', '--is-ancestor', manifest.metadata?.baselineCommit || '', currentCommit
  ], { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const validation = validateDeploymentRequest({
    args,
    manifest,
    rootDir,
    manifestPath,
    digestPath,
    currentCommit,
    activeFirebaseProject,
    baselineIsAncestor: baselineCheck.status === 0
  });
  if (!args.execute) fail('Validation reussie mais deploiement refuse sans --execute explicite');
  assertCleanDeploymentInputs(rootDir);
  if (validation.transport === 'gcloud-gen1') {
    const name = validation.allowlist[0];
    const target = GCLOUD_GEN1_TARGETS[name];
    const before = JSON.parse(run('gcloud', [
      'functions', 'describe', name,
      `--region=${target.region}`,
      `--project=${validation.project}`,
      '--format=json'
    ], { cwd: rootDir }));
    const expectedName = `projects/${validation.project}/locations/${target.region}/functions/${name}`;
    const expectedTopic = `projects/${validation.project}/topics/${target.triggerTopic}`;
    if (
      before.name !== expectedName || before.status !== 'ACTIVE' ||
      before.entryPoint !== target.entryPoint || before.versionId !== target.expectedVersion ||
      before.serviceAccountEmail !== target.expectedServiceAccount
    ) {
      fail('Etat cloud Gen1 inattendu avant fallback gcloud');
    }
    if (before.eventTrigger?.resource !== expectedTopic || before.eventTrigger?.eventType !== 'google.pubsub.topic.publish') {
      fail('Trigger cloud Gen1 inattendu avant fallback gcloud');
    }
    process.stdout.write(`Projet: ${validation.project}\nCibles: ${validation.selectors.join(',')}\nCommit: ${validation.commit}\nTransport: gcloud-gen1\n`);
    const result = spawnSync('gcloud', buildGcloudGen1DeployArgs(validation), {
      cwd: rootDir,
      env: process.env,
      stdio: 'inherit'
    });
    if (result.error) fail(result.error.message);
    if (result.status !== 0) process.exitCode = result.status || 1;
    return;
  }
  if (validation.transport === 'gcloud-gen2') {
    const name = validation.allowlist[0];
    const target = GCLOUD_GEN2_TARGETS[name];
    const before = JSON.parse(run('gcloud', [
      'functions', 'describe', name,
      '--gen2',
      `--region=${target.region}`,
      `--project=${validation.project}`,
      '--format=json'
    ], { cwd: rootDir }));
    assertGcloudGen2Preconditions(before, validation);
    process.stdout.write(`Projet: ${validation.project}\nCibles: ${validation.selectors.join(',')}\nCommit: ${validation.commit}\nTransport: gcloud-gen2\n`);
    const result = spawnSync('gcloud', buildGcloudGen2DeployArgs(validation), {
      cwd: rootDir,
      env: process.env,
      stdio: 'inherit'
    });
    if (result.error) fail(result.error.message);
    if (result.status !== 0) process.exitCode = result.status || 1;
    return;
  }
  if (validation.transport === 'gcloud-gen2-rollback') {
    const name = validation.allowlist[0];
    const target = GCLOUD_GEN2_TARGETS[name];
    const rollback = G2B_ROLLBACKS[name];
    const before = JSON.parse(run('gcloud', [
      'functions', 'describe', name, '--gen2',
      `--region=${target.region}`, `--project=${validation.project}`, '--format=json'
    ], { cwd: rootDir }));
    if (
      before.state !== 'ACTIVE' || before.serviceConfig?.revision !== args['expected-revision'] ||
      before.serviceConfig?.serviceAccountEmail !== target.runtimeServiceAccount ||
      before.buildConfig?.serviceAccount !== target.buildServiceAccount ||
      before.eventTrigger?.serviceAccountEmail !== target.triggerServiceAccount ||
      before.eventTrigger?.retryPolicy !== 'RETRY_POLICY_RETRY'
    ) fail('Etat cloud Gen2 inattendu avant rollback');
    const rollbackObject = JSON.parse(run('gcloud', [
      'storage', 'objects', 'describe', rollback.source,
      `--project=${validation.project}`, '--format=json'
    ], { cwd: rootDir }));
    if (
      String(rollbackObject.generation) !== rollback.sourceGeneration ||
      String(rollbackObject.size) !== rollback.sourceSize ||
      rollbackObject.temporary_hold !== true
    ) fail('Objet source rollback G2-B inattendu');
    process.stdout.write(`Projet: ${validation.project}\nCible: functions:main:${name}\nCommit wrapper: ${validation.commit}\nRevision remplacee: ${args['expected-revision']}\nTransport: gcloud-gen2-rollback\n`);
    const result = spawnSync('gcloud', buildGcloudGen2RollbackArgs(validation), {
      cwd: rootDir,
      env: process.env,
      stdio: 'inherit'
    });
    if (result.error) fail(result.error.message);
    if (result.status !== 0) process.exitCode = result.status || 1;
    return;
  }
  const firebaseCli = path.join(rootDir, 'node_modules/.bin/firebase');
  if (!fs.existsSync(firebaseCli)) fail('Firebase CLI locale epinglee introuvable');
  const effective = JSON.parse(run(firebaseCli, ['use', '--json'], { cwd: rootDir }));
  if (effective.status !== 'success' || effective.result !== EXPECTED_PROJECT) fail(`Projet Firebase effectif different: ${effective.result || 'inconnu'}`);
  const deployArgs = buildFirebaseDeployArgs(validation);
  process.stdout.write(`Projet: ${validation.project}\nCibles: ${validation.selectors.join(',')}\nCommit: ${validation.commit}\n`);
  const result = spawnSync(firebaseCli, deployArgs, {
    cwd: rootDir,
    env: buildFirebaseCliEnv(process.env),
    stdio: 'inherit'
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) process.exitCode = result.status || 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`deploy-functions-targeted: ${error.message}\n`);
    process.exitCode = 1;
  }
}
