import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  EXPECTED_CURRENT_CLOUD_COUNT,
  EXPECTED_CURRENT_SOURCE_COUNT,
  RETIRED_G12A_G3_TARGETS
} from '../scripts/functions-gen2-inventory.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));

test('G12-A:G3 ferme exactement les six Gen1 autorisees', () => {
  const manifest = readJson('apphostingaudit/manifests/functions-gen2-g12a-g3.json');
  assert.equal(manifest.metadata.status, 'G12_A_G3_CLOSED');
  assert.deepEqual(new Set(manifest.authorization.exactNames), RETIRED_G12A_G3_TARGETS);
  assert.equal(manifest.deletions.length, 6);
  assert.ok(manifest.deletions.every(({ generation, result }) => generation === 1 && result === 'DELETED'));
  assert.deepEqual(manifest.validation.finalInventory, { source: 266, cloud: 257, gen1: 123, gen2: 134 });
  assert.equal(manifest.validation.handlerInvocations, 0);
  assert.equal(manifest.validation.realDataDeletionCount, 0);
  assert.equal(manifest.authorization.g12BAllowed, false);
  assert.equal(EXPECTED_CURRENT_SOURCE_COUNT, 161);
  assert.equal(EXPECTED_CURRENT_CLOUD_COUNT, 158);
});

test('G12-A:G3 conserve les workers Gen2 et une archive rollback digestee', () => {
  const manifest = readJson('apphostingaudit/manifests/functions-gen2-g12a-g3.json');
  const rollback = readJson('apphostingaudit/manifests/functions-gen2-g12a-g3-rollback.json');
  assert.equal(manifest.relatedGen2Workers.length, 3);
  assert.ok(manifest.relatedGen2Workers.every(({ state, decision }) => state === 'ACTIVE' && decision === 'PRESERVED_OUTSIDE_AUTHORIZATION'));
  assert.equal(rollback.metadata.status, 'WINDOW_EXPIRED_BY_FORMAL_APPROVAL');
  assert.equal(rollback.sourceArchive.sha256, '6ba72b5a9a065d5bf458b6d32826805b4e39e0824248f829989797299a28c2df');
  assert.equal(rollback.sourceArchive.containsAllSixGen1Exports, true);
  assert.equal(rollback.functions.length, 6);
  assert.equal(rollback.rollbackWindow.status, 'EXPIRED_BY_FORMAL_APPROVAL');
  assert.equal(rollback.rollbackWindow.g12BAllowed, true);
});

test('G12-B:G3 retire le code exclusif et conserve les workers Gen2', () => {
  const manifest = readJson('apphostingaudit/manifests/functions-gen2-g12b-g3.json');
  const functionsIndex = fs.readFileSync(path.join(ROOT, 'functions/index.js'), 'utf8');
  const publication = fs.readFileSync(path.join(ROOT, 'functions/src/publication/productPublication.js'), 'utf8');
  assert.equal(manifest.metadata.status, 'G12_B_G3_CLOSED');
  assert.equal(manifest.sourceCleanup.sourceCountAfter, 260);
  assert.equal(manifest.cloudCleanup.secretVersionsDestroyed, 0);
  assert.equal(manifest.cloudCleanup.iamBindingsDeleted, 0);
  for (const name of manifest.dependencies.exactNames) {
    assert.doesNotMatch(functionsIndex, new RegExp(`exports\\.${name}\\s*=`));
  }
  for (const file of manifest.sourceCleanup.deletedFiles) assert.equal(fs.existsSync(path.join(ROOT, file)), false, file);
  assert.match(functionsIndex, /exports\.processProductPublicationImage/);
  assert.match(functionsIndex, /exports\.cleanupProductPublicationSessions/);
  assert.match(functionsIndex, /exports\.reconcileProductPublicationSessions/);
  assert.doesNotMatch(publication, /const (getProductPublicationSessionAdmin|reportProductPublicationClientErrorAdmin|retryProductPublicationFinalizationAdmin|startProductPublicationAdmin)\b/);
});
