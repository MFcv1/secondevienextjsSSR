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
    ingressSettings: 'all'
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
  if (!['firebase', 'gcloud-gen1'].includes(transport)) fail(`Transport interdit: ${transport}`);
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
      fail('Fallback gcloud Gen1 limite au reconciler G1 approuve');
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
  return [
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
    if (before.name !== expectedName || before.status !== 'ACTIVE' || before.entryPoint !== target.entryPoint) {
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
