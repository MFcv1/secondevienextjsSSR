#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(SCRIPT_DIR, '..');
const PLAN_PATH = 'apphostingaudit/FINALISATION_MIGRATION_GEN2.md';
const REQUIRED_SECONDS = 604800;
const OBSERVATION_START = '2026-08-23T21:13:00.000Z';
const OBSERVATION_END = '2026-08-30T21:13:00.000Z';
const FINAL_REVISION = 'getcatalogpublicationstatusgen2-00004-hiv';
const TARGET = 'getCatalogPublicationStatusGen2';
const AUTH_GEN1 = [
  'grantAdminOnAuth',
  'onRegisteredUserCreated',
  'onRegisteredUserDeleted'
].sort();

const MANIFEST_PATHS = Object.freeze({
  localGates: 'apphostingaudit/manifests/functions-gen2-finalisation-local-gates.json',
  f4: 'apphostingaudit/manifests/functions-gen2-finalisation-f4.json',
  f5: 'apphostingaudit/manifests/functions-gen2-finalisation-f5.json',
  f6: 'apphostingaudit/manifests/functions-gen2-finalisation-f6-observation.json',
  f7: 'apphostingaudit/manifests/functions-gen2-finalisation-f7-errors.json'
});

function fail(message) {
  throw new Error(message);
}

function requireValue(condition, message) {
  if (!condition) fail(message);
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

export function loadEvidence(root = DEFAULT_ROOT) {
  return Object.fromEntries(Object.entries(MANIFEST_PATHS).map(([key, relativePath]) => (
    [key, readJson(root, relativePath)]
  )));
}

function validateLocalGates(localGates) {
  requireValue(localGates.status === 'GREEN', 'Gates locales non vertes');
  requireValue(/^v22\./.test(localGates.node), `Baseline locale non Node 22: ${localGates.node}`);
  const required = [
    'npm run test:functions-gen2',
    'npm run test:catalog:core',
    'npm run test:auth',
    'npm run test:commerce:unit',
    'npm run lint:functions',
    'npm run lint -- --quiet',
    'git diff --check'
  ];
  const commands = new Map(localGates.commands.map((entry) => [entry.command, entry]));
  for (const command of required) {
    requireValue(commands.get(command)?.result === 'PASS', `Gate locale absente ou rouge: ${command}`);
  }
  requireValue(
    localGates.sensitiveRetirementCoverage.length === 4 &&
      localGates.sensitiveRetirementCoverage.every((entry) => entry.result === 'PASS'),
    'Couverture des retraits sensibles incomplete'
  );
}

function validateF4(f4) {
  const immutable = f4.immutableRollbackObject;
  requireValue(f4.status === 'ROLLBACK_OBJECT_PROTECTED' && f4.target === TARGET, 'Preuve F4 invalide');
  requireValue(
    immutable?.generation === '1787449114510784' && immutable.size === 381285 &&
      immutable.sha256 === 'dacf4c1eb1257fdd18c94a03889822dfa042642d0835b0dd68b3be8f9b8f46da' &&
      immutable.temporaryHold === true && immutable.readBackVerified === true,
    'Archive rollback F4 non prouvee exactement'
  );
}

function validateF5(f5) {
  requireValue(f5.status === 'ROLLBACK_AND_REACTIVATION_EXERCISED' && f5.target === TARGET, 'Preuve F5 invalide');
  const sequence = Object.fromEntries(f5.sequence.map((entry) => [entry.step, entry]));
  requireValue(
    sequence.before?.revision === 'getcatalogpublicationstatusgen2-00002-yoq' && sequence.before.maxInstances === 2 &&
      sequence.rollback?.revision === 'getcatalogpublicationstatusgen2-00003-mol' && sequence.rollback.maxInstances === 1 && sequence.rollback.trafficPercent === 100 &&
      sequence.reactivation?.revision === FINAL_REVISION && sequence.reactivation.maxInstances === 2 && sequence.reactivation.trafficPercent === 100,
    'Sequence rollback/reactivation F5 incoherente'
  );
  requireValue(
    f5.finalConfig.runtime === 'nodejs22' && f5.finalConfig.region === 'europe-west1' &&
      f5.finalConfig.maxInstances === 2 && f5.finalConfig.minInstances === 0 &&
      f5.finalConfig.concurrency === 1 && f5.finalConfig.timeoutSeconds === 60,
    'Configuration finale F5 incoherente'
  );
  requireValue(
    f5.inventoryAfter.cloudFunctions === 137 && f5.inventoryAfter.gen2Active === 134 &&
      [...f5.inventoryAfter.gen1AuthActive].sort().join(',') === AUTH_GEN1.join(',') &&
      f5.inventoryAfter.functionsUpdatedSinceF5Start.join(',') === TARGET,
    'Inventaire final F5 incoherent'
  );
  const sources = Object.fromEntries(f5.protectedSources.map((entry) => [entry.role, entry]));
  requireValue(
    sources['rollback-max-1']?.generation === '1787449114510784' &&
      sources['rollback-max-1'].sha256 === 'dacf4c1eb1257fdd18c94a03889822dfa042642d0835b0dd68b3be8f9b8f46da' &&
      sources['rollback-max-1'].temporaryHold === true &&
      sources['reactivation-max-2']?.generation === '1787442998284455' &&
      sources['reactivation-max-2'].sha256 === '3ba9c8d5890e7fc678d12117099653f00f33ea48982f20b27097434f1df2dd81' &&
      sources['reactivation-max-2'].temporaryHold === true,
    'Sources protegees F5 incoherentes'
  );
  requireValue(
    f5.effects.functionDeployments === 2 && f5.effects.targetsChanged.join(',') === TARGET &&
      f5.effects.appHostingBuilds === 0 && f5.effects.dataWrites === 0 &&
      f5.effects.stripeCalls === 0 && f5.effects.iamChanges === 0 &&
      f5.effects.secretChanges === 0 && f5.effects.schedulerChanges === 0,
    'Effets F5 hors perimetre ou incomplets'
  );
}

function validateF7(f7) {
  requireValue(f7.status === 'HISTORICAL_ERRORS_QUALIFIED', 'Qualification F7 incomplete');
  requireValue(
    f7.reconciliation.http500Classified === 258 && f7.reconciliation.http500Unclassified === 0 &&
      f7.reconciliation.http429Classified === 17 && f7.reconciliation.http429Unclassified === 0 &&
      f7.reconciliation.historicalAggregateCanProveFinalHealth === false,
    'Reconciliation des erreurs historiques F7 incomplete'
  );
}

function validateCheckpoint(checkpoint, index) {
  requireValue(checkpoint.revisionUnchanged === true, `Revision modifiee au checkpoint ${index}`);
  requireValue(checkpoint.configUnchanged === true, `Configuration modifiee au checkpoint ${index}`);
  requireValue(checkpoint.trafficPercent === 100, `Trafic incomplet au checkpoint ${index}`);
  requireValue(
    checkpoint.cloudFunctions === 137 && checkpoint.gen2Active === 134 && checkpoint.gen1AuthActive === 3,
    `Inventaire incoherent au checkpoint ${index}`
  );
  if (checkpoint.functionsUpdatedSinceStart) {
    requireValue(checkpoint.functionsUpdatedSinceStart.length === 0, `Deploy inattendu au checkpoint ${index}`);
  }
  if ('rollbackSourceHeld' in checkpoint) {
    requireValue(
      checkpoint.rollbackSourceHeld === true && checkpoint.reactivationSourceHeld === true,
      `Archive non protegee au checkpoint ${index}`
    );
  }
  const failures = Number(checkpoint.request429 || 0) + Number(checkpoint.request5xx || 0) + Number(checkpoint.errorSeverityEntries || 0);
  if (failures > 0) {
    requireValue(
      checkpoint.unqualifiedErrors === 0 && /QUALIFIED/.test(checkpoint.qualification || ''),
      `Erreur finale non qualifiee au checkpoint ${index}`
    );
  }
}

function validateF6(f6, requireReady) {
  requireValue(
    f6.reference.function === TARGET && f6.reference.revision === FINAL_REVISION &&
      f6.reference.state === 'ACTIVE' && f6.reference.maxInstances === 2 &&
      f6.reference.concurrency === 1 && f6.reference.trafficPercent === 100,
    'Reference finale F6 incoherente'
  );
  requireValue(
    f6.window.start === OBSERVATION_START && f6.window.minimumEnd === OBSERVATION_END &&
      f6.window.requiredSeconds === REQUIRED_SECONDS,
    'Fenetre F6 incoherente'
  );
  requireValue(Array.isArray(f6.checkpoints) && f6.checkpoints.length > 0, 'Aucun checkpoint F6');
  f6.checkpoints.forEach(validateCheckpoint);
  const latest = f6.checkpoints.at(-1);
  requireValue(/^v22\./.test(latest.collectorNode || ''), 'Dernier checkpoint non prouve sous Node 22');
  if (!requireReady) return;
  requireValue(f6.status === 'COMPLETE', 'F6 pas marquee COMPLETE');
  requireValue(
    latest.observedSeconds >= REQUIRED_SECONDS && Date.parse(latest.checkedAt) >= Date.parse(OBSERVATION_END),
    'Sept jours complets non observes'
  );
  requireValue(
    f6.window.observedSeconds >= REQUIRED_SECONDS && f6.acceptance.fullDurationReached === true &&
      f6.acceptance.revisionUnchanged === true && f6.acceptance.configUnchanged === true &&
      f6.acceptance.allErrorsQualified === true && f6.acceptance.readyToClose === true,
    'Acceptation finale F6 incomplete'
  );
}

export function validateEvidence(evidence, { requireReady = false } = {}) {
  validateLocalGates(evidence.localGates);
  validateF4(evidence.f4);
  validateF5(evidence.f5);
  validateF6(evidence.f6, requireReady);
  validateF7(evidence.f7);
  return {
    localGates: 'PASS',
    rollbackProtected: true,
    rollbackExercised: true,
    historicalErrorsQualified: true,
    observationReady: requireReady
  };
}

export function validateReferenceState({ planExists, referenceFiles, automationStatus }, mode) {
  if (mode === 'closed') {
    requireValue(planExists === false, 'Plan temporaire encore present');
    requireValue(referenceFiles.length === 0, `References mortes vers le plan: ${referenceFiles.join(', ')}`);
    requireValue(automationStatus === 'DISABLED', 'Heartbeat non consigne comme desactive');
  } else {
    requireValue(planExists === true, 'Plan temporaire retire avant la fermeture F6');
    requireValue(referenceFiles.length > 0, 'Plan temporaire non indexe pendant son execution');
    requireValue(automationStatus === 'ACTIVE', 'Heartbeat F6 inactif avant la fermeture');
  }
}

function trackedMarkdownReferences(root) {
  const files = execFileSync('git', ['ls-files', '*.md'], { cwd: root, encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);
  return files.filter((relativePath) => {
    const absolutePath = path.join(root, relativePath);
    return fs.existsSync(absolutePath) && relativePath !== PLAN_PATH &&
      fs.readFileSync(absolutePath, 'utf8').includes('FINALISATION_MIGRATION_GEN2.md');
  });
}

function validateExecutableContracts(root) {
  const packageJson = readJson(root, 'package.json');
  const aggregate = packageJson.scripts['test:functions-gen2'] || '';
  const requiredTests = [
    'functions-gen2-g0.test.mjs', 'functions-gen2-g2a.test.cjs', 'functions-gen2-g3.test.mjs',
    'functions-gen2-g4.test.mjs', 'functions-gen2-g5.test.mjs', 'functions-gen2-g6.test.mjs',
    'functions-gen2-g7.test.mjs', 'functions-gen2-g8.test.mjs', 'functions-gen2-g9.test.mjs',
    'functions-gen2-g10.test.mjs', 'functions-gen2-g11.test.mjs', 'functions-gen2-g12-remaining.test.mjs',
    'functions-gen2-g13.test.mjs', 'functions-gen2-final-observe.test.mjs',
    'functions-gen2-final-closeout.test.mjs'
  ];
  for (const test of requiredTests) requireValue(aggregate.includes(test), `Test absent de l'agregat Gen2: ${test}`);
  requireValue(
    packageJson.scripts['functions:gen2:final-closeout'] === 'node scripts/functions-gen2-final-closeout.mjs',
    'Commande de cloture absente'
  );
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/quality.yml'), 'utf8');
  requireValue(workflow.includes('pnpm test:functions-gen2'), 'Agregat Gen2 absent de la CI');
}

export function runCloseout(root = DEFAULT_ROOT, mode = 'preflight') {
  requireValue(['preflight', 'ready', 'closed'].includes(mode), `Mode inconnu: ${mode}`);
  validateExecutableContracts(root);
  const evidence = loadEvidence(root);
  const requireReady = mode !== 'preflight';
  const result = validateEvidence(evidence, { requireReady });
  const referenceFiles = trackedMarkdownReferences(root);
  validateReferenceState({
    planExists: fs.existsSync(path.join(root, PLAN_PATH)),
    referenceFiles,
    automationStatus: evidence.f6.automation.status
  }, mode);
  return { mode, ...result, referenceFiles, status: 'PASS' };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const option = process.argv[2] || '--preflight';
    const mode = option.replace(/^--require-/, '').replace(/^--/, '');
    process.stdout.write(`${JSON.stringify(runCloseout(DEFAULT_ROOT, mode), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`functions-gen2-final-closeout: ${error.message}\n`);
    process.exitCode = 1;
  }
}
