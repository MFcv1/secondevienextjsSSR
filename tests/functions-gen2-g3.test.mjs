import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const manifest = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g3-decisions.json'));
const packageJson = JSON.parse(read('package.json'));

const expectedNames = [
  'e2eCheckoutProof',
  'e2eStripeHardeningProof',
  'getProductPublicationSessionAdmin',
  'reportProductPublicationClientErrorAdmin',
  'retryProductPublicationFinalizationAdmin',
  'startProductPublicationAdmin'
];

test('G3 classe exactement les six cibles sans deploy ni suppression', () => {
  assert.equal(manifest.project, 'secondevienextjsssr');
  assert.equal(manifest.targetGuard.projectMatch, true);
  assert.equal(manifest.verdict, 'G3_COMPLETE_RETIRE_IN_G12_A_NO_CLOUD_REMOVAL');
  assert.equal(manifest.deploymentAllowed, false);
  assert.equal(manifest.cloudDeletionAllowed, false);
  assert.equal(manifest.dataDeletionAllowed, false);
  assert.deepEqual(manifest.decisions.map(({ name }) => name).sort(), expectedNames.sort());
  for (const decision of manifest.decisions) {
    assert.equal(decision.generation, 1, decision.name);
    assert.equal(decision.runtime, 'nodejs22', decision.name);
    assert.equal(decision.decision, 'RETIRE_G12_A', decision.name);
    assert.ok(decision.rollbackNow, decision.name);
    assert.ok(decision.g12Prerequisites.length >= 4, decision.name);
    assert.equal(decision.invokerIam[0].role, 'roles/cloudfunctions.invoker', decision.name);
  }
});

test('G3 constate zero session et aucun chemin callable depuis AdminForm', () => {
  assert.equal(manifest.observations.productPublicationSessionCount, 0);
  assert.equal(manifest.observations.historicalPublicationClientReachableFromAdminForm, false);
  const adminForm = read('src/kit/admin/AdminForm.jsx');
  const importBlock = adminForm.match(/import \{[\s\S]*?\} from '\.\/productPublicationClient';/)?.[0] || '';
  for (const forbidden of [
    'getProductPublicationSession',
    'resumeProductPublication',
    'startDurableProductPublication'
  ]) assert.doesNotMatch(importBlock, new RegExp(`\\b${forbidden}\\b`));
  assert.match(importBlock, /waitForPublicCatalogProduct/);
  assert.match(adminForm, /createPublishedProductAdmin/);
});

test('G3 conserve les protections App Check/admin et le containment finance', () => {
  const publication = read('functions/src/publication/productPublication.js');
  const checkoutProof = read('functions/src/commerce/e2eCheckoutProof.js');
  const hardeningProof = read('functions/src/commerce/e2eStripeHardeningProof.js');
  assert.match(publication, /runWith\(\{ enforceAppCheck: true/);
  assert.match(publication, /checkActiveStrongAdmin\(context\)/);
  for (const source of [checkoutProof, hardeningProof]) {
    assert.match(source, /getRuntimeProjectId\(\) === 'secondevienextjsssr'/);
    assert.match(source, /E2E_PROOF_ENABLED/);
    assert.match(source, /timingSafeEqual/);
  }
  assert.match(hardeningProof, /assertLegacyMutationBlocked\(functions, 'legacy-e2e-stripe-hardening'\)/);
});

test('les deux commandes Stripe en quarantaine echouent avant le script historique', () => {
  for (const command of ['e2e:hosted-stripe', 'e2e:refund-stripe']) {
    const packageCommand = packageJson.scripts[command];
    assert.equal(packageCommand, `node scripts/refuse-quarantined-commerce-e2e.mjs ${command}`);
    assert.doesNotMatch(packageCommand, /e2e-hosted-stripe-checkout|e2e-refund-latest-stripe-order|with-env/);
    const result = spawnSync(process.execPath, [
      path.join(ROOT, 'scripts/refuse-quarantined-commerce-e2e.mjs'),
      command
    ], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp(`DO_NOT_RUN:${command.replace(':', '\\:')}`));
  }
  assert.equal(fs.existsSync(path.join(ROOT, 'scripts/e2e-hosted-stripe-checkout.mjs')), true);
  assert.equal(fs.existsSync(path.join(ROOT, 'scripts/e2e-refund-latest-stripe-order.mjs')), true);
});
