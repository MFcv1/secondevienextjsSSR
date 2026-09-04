import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { COHORTS } from '../scripts/functions-gen2-g12-remaining.mjs';
import {
  EXPECTED_CURRENT_CLOUD_COUNT,
  EXPECTED_CURRENT_SOURCE_COUNT,
  extractLocalExports
} from '../scripts/functions-gen2-inventory.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'apphostingaudit/manifests/functions-gen2-g12-remaining-cohorts.json'), 'utf8'));

test('G12 restant fige neuf cohortes et 120 Gen1 uniques', () => {
  const names = Object.values(COHORTS).flat();
  assert.equal(Object.keys(COHORTS).length, 9);
  assert.equal(names.length, 120);
  assert.equal(new Set(names).size, 120);
  assert.equal(plan.metadata.exactLegacyCount, 120);
  assert.equal(plan.checks.allLegacyActive, true);
  assert.equal(plan.checks.allRequiredGen2OwnersActive, true);
  assert.equal(plan.checks.clientRegistryComplete, true);
  for (const protectedName of plan.checks.protectedAuthTriggers) assert.equal(names.includes(protectedName), false);
});

test('chaque cible possede une configuration de rollback et un owner explicite', () => {
  assert.equal(plan.archive.containsAll120Exports, true);
  assert.match(plan.archive.sha256, /^[a-f0-9]{64}$/);
  for (const cohort of plan.cohorts) {
    assert.deepEqual(cohort.names, COHORTS[cohort.id]);
    for (const fn of cohort.functions) {
      assert.equal(fn.generation, 1, fn.name);
      assert.equal(fn.status, 'ACTIVE', fn.name);
      assert.ok(fn.region, fn.name);
      assert.ok(fn.entryPoint, fn.name);
      if (fn.replacement) assert.match(fn.replacement, /Gen2$/);
    }
  }
});

test('G12-A restant est ferme par cohorte avec archive bornee et trois Auth Gen1 preservees', () => {
  const aggregate = JSON.parse(fs.readFileSync(path.join(ROOT, 'apphostingaudit/manifests/functions-gen2-g12a-remaining.json'), 'utf8'));
  assert.equal(aggregate.status, 'CLOSED');
  assert.equal(aggregate.cohorts.length, 9);
  assert.deepEqual(aggregate.inventory.after, { total: 137, gen1: 3, gen2: 134 });
  for (const cohort of aggregate.cohorts) {
    assert.equal(fs.existsSync(path.join(ROOT, 'apphostingaudit/manifests', cohort.closeoutFile)), true);
    assert.equal(fs.existsSync(path.join(ROOT, 'apphostingaudit/manifests', cohort.rollbackFile)), true);
  }
});

test('G12-B restant retire les 120 exports et les trois modules exclusivement Gen1', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'apphostingaudit/manifests/functions-gen2-g12b-remaining.json'), 'utf8'));
  const source = fs.readFileSync(path.join(ROOT, 'functions/index.js'), 'utf8');
  assert.equal(manifest.status, 'CLOSED');
  assert.equal(manifest.exactNames.length, 120);
  assert.equal(EXPECTED_CURRENT_SOURCE_COUNT, 161);
  assert.equal(EXPECTED_CURRENT_CLOUD_COUNT, 158);
  assert.equal(extractLocalExports(ROOT).length, 161);
  for (const name of manifest.exactNames) assert.doesNotMatch(source, new RegExp(`^exports\\.${name}\\s*=`, 'm'), name);
  for (const file of manifest.sourceCleanup.deletedExclusiveLegacyFiles) assert.equal(fs.existsSync(path.join(ROOT, file)), false, file);
  assert.equal(manifest.cloudCleanup.secretVersionsDestroyed, 0);
  assert.equal(manifest.cloudCleanup.iamBindingsDeleted, 0);
});
