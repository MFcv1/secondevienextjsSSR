import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

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
