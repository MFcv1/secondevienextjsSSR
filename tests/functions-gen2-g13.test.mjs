import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  G13_REACTIVATION,
  G13_ROLLBACKS,
  assertGen2RollbackObject,
  buildGcloudGen2DeployArgs,
  buildGcloudGen2RollbackArgs,
  validateDeploymentRequest
} from '../scripts/deploy-functions-targeted.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));

function expectedStripeLivemode(environment) {
  if (environment === 'sandbox') return false;
  if (environment === 'production') return true;
  throw new Error(`Environnement Stripe non supporte: ${environment}`);
}

test('G13-A observe exactement 140 source, 137 cloud et trois Auth Gen1', () => {
  const manifest = readJson('apphostingaudit/manifests/functions-gen2-g13-observation.json');
  assert.equal(manifest.metadata.project, 'secondevienextjsssr');
  assert.equal(manifest.metadata.window.seconds, 7 * 24 * 60 * 60);
  assert.deepEqual(manifest.inventory, {
    source: 140,
    cloud: 137,
    gen1: 3,
    gen2: 134,
    exactGen1: ['grantAdminOnAuth', 'onRegisteredUserCreated', 'onRegisteredUserDeleted'],
    allGen2Active: true
  });
  assert.equal(manifest.monitoring.enabledAlertPolicies, 8);
  assert.equal(manifest.monitoring.dashboards, 1);
});

test('G13-B borne le seul tuning et conserve un rollback par digest', () => {
  const load = readJson('apphostingaudit/manifests/functions-gen2-g13-load.json');
  const rollback = readJson('apphostingaudit/manifests/functions-gen2-g13-tuning-rollback.json');
  assert.equal(load.status, 'CLOSED_WITH_BOUNDED_SATURATION');
  assert.equal(load.tuning.target, 'getCatalogPublicationStatusGen2');
  assert.equal(load.tuning.deploymentCount, 1);
  assert.equal(load.tuning.countermeasureCount, 1);
  assert.equal(load.effects.realDataWrites, 0);
  assert.equal(load.effects.stripeCalls, 0);
  assert.equal(rollback.status, 'AVAILABLE_BY_VERSIONED_OBJECT_DIGEST');
  assert.match(rollback.deployed.archive.sha256, /^[a-f0-9]{64}$/);
  assert.match(rollback.rollback.sha256, /^[a-f0-9]{64}$/);
  assert.equal(rollback.rollback.maxInstances, 1);
});

test('G13-B expose un rollback fail-closed via le wrapper cible', () => {
  const manifestPath = path.join(ROOT, 'apphostingaudit/manifests/functions-gen2-g6.json');
  const digestPath = path.join(ROOT, 'apphostingaudit/manifests/functions-gen2-g6-digest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const target = 'getCatalogPublicationStatusGen2';
  const rollback = G13_ROLLBACKS[target];
  assert.equal(rollback.sourceGeneration, '1787449114510784');
  assert.equal(rollback.sourceSize, '381285');
  assert.equal(rollback.temporaryHoldRequired, true);
  assert.match(rollback.source, new RegExp(`/g13-rollback/${rollback.sourceSha256}/function-source\\.zip#${rollback.sourceGeneration}$`));
  assertGen2RollbackObject({
    metadata: {
      generation: rollback.sourceGeneration,
      size: rollback.sourceSize,
      temporary_hold: true
    },
    rollback,
    actualSha256: rollback.sourceSha256
  });
  const args = {
    project: 'secondevienextjsssr',
    codebase: 'main',
    commit: manifest.metadata.baselineCommit,
    allowlist: target,
    transport: 'gcloud-gen2-rollback',
    approval: rollback.approval,
    'expected-revision': rollback.expectedRevision,
    'rollback-source-sha256': rollback.sourceSha256
  };
  const validation = validateDeploymentRequest({
    args,
    manifest,
    rootDir: ROOT,
    manifestPath,
    digestPath,
    currentCommit: manifest.metadata.baselineCommit,
    activeFirebaseProject: 'secondevienextjsssr'
  });
  const deployArgs = buildGcloudGen2RollbackArgs(validation, {
    sourceDir: '/private/tmp/verified-g13-rollback-source'
  });

  for (const expected of [
    '--source=/private/tmp/verified-g13-rollback-source',
    '--trigger-http',
    '--allow-unauthenticated',
    '--run-service-account=catalog-builder@secondevienextjsssr.iam.gserviceaccount.com',
    '--build-service-account=projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    '--memory=512Mi',
    '--timeout=60s',
    '--concurrency=1',
    '--min-instances=0',
    '--max-instances=1'
  ]) assert.ok(deployArgs.includes(expected), expected);
  assert.equal(deployArgs.includes(`--source=${rollback.source}`), false);
  assert.equal(deployArgs.includes('--max-instances=2'), false);

  assert.throws(() => assertGen2RollbackObject({
    metadata: {
      generation: rollback.sourceGeneration,
      size: rollback.sourceSize,
      temporary_hold: false
    },
    rollback,
    actualSha256: rollback.sourceSha256
  }), /Objet source rollback Gen2 inattendu/);
  assert.throws(() => assertGen2RollbackObject({
    metadata: {
      generation: rollback.sourceGeneration,
      size: rollback.sourceSize,
      temporary_hold: true
    },
    rollback,
    actualSha256: '0'.repeat(64)
  }), /SHA-256 archive source rollback Gen2/);

  assert.throws(() => validateDeploymentRequest({
    args: { ...args, approval: 'G13_ROLLBACK_WRONG' },
    manifest,
    rootDir: ROOT,
    manifestPath,
    digestPath,
    currentCommit: manifest.metadata.baselineCommit,
    activeFirebaseProject: 'secondevienextjsssr'
  }), /Approbation rollback Gen2 invalide/);
  assert.throws(() => validateDeploymentRequest({
    args: { ...args, 'expected-revision': 'getcatalogpublicationstatusgen2-00003-zzz' },
    manifest,
    rootDir: ROOT,
    manifestPath,
    digestPath,
    currentCommit: manifest.metadata.baselineCommit,
    activeFirebaseProject: 'secondevienextjsssr'
  }), /revision rollback approuvee/);
});

test('G13-B verrouille aussi la source immuable de reactivation max 2', () => {
  assert.equal(G13_REACTIVATION.target, 'getCatalogPublicationStatusGen2');
  assert.equal(G13_REACTIVATION.gate, 'FINALISATION:F5_REACTIVATION');
  assert.equal(G13_REACTIVATION.sourceGeneration, '1787442998284455');
  assert.equal(G13_REACTIVATION.sourceSize, '370918');
  assert.equal(G13_REACTIVATION.temporaryHoldRequired, true);
  assert.equal(G13_REACTIVATION.sourceSha256, '3ba9c8d5890e7fc678d12117099653f00f33ea48982f20b27097434f1df2dd81');
  assert.match(G13_REACTIVATION.source, new RegExp(`/g13/${G13_REACTIVATION.sourceSha256}/function-source\\.zip$`));
  const deployArgs = buildGcloudGen2DeployArgs({
    transport: 'gcloud-gen2-update',
    allowlist: [G13_REACTIVATION.target],
    commit: 'a'.repeat(40),
    sourceUri: G13_REACTIVATION.source
  }, { sourceDir: '/private/tmp/verified-g13-reactivation-source' });
  assert.ok(deployArgs.includes('--source=/private/tmp/verified-g13-reactivation-source'));
  assert.equal(deployArgs.includes(`--source=${G13_REACTIVATION.source}`), false);
  assert.ok(deployArgs.includes('--max-instances=2'));
});

test('G13-C rend l attente Stripe livemode dependante de l environnement sans ouvrir le live', () => {
  assert.equal(expectedStripeLivemode('sandbox'), false);
  assert.equal(expectedStripeLivemode('production'), true);
  assert.throws(() => expectedStripeLivemode('preview'), /non supporte/);
  assert.equal(process.env.STRIPE_LIVE_ENABLED, undefined);
});

test('G13 ferme le chantier sans production, donnees destructives ni retrait Auth', () => {
  const manifest = readJson('apphostingaudit/manifests/functions-gen2-g13.json');
  assert.equal(manifest.status, 'CLOSED');
  assert.deepEqual(manifest.inventory.protectedGen1, [
    'grantAdminOnAuth',
    'onRegisteredUserCreated',
    'onRegisteredUserDeleted'
  ]);
  assert.equal(manifest.inventory.gen1, 3);
  assert.equal(manifest.inventory.gen2, 134);
  assert.equal(manifest.effects.realDataWrites, 0);
  assert.equal(manifest.effects.destructiveInvocations, 0);
  assert.equal(manifest.effects.productionCalls, 0);
  assert.equal(manifest.effects.globalDeployments, 0);
  assert.equal(manifest.prohibitionsRespected.authTriggersPreserved, true);
});
