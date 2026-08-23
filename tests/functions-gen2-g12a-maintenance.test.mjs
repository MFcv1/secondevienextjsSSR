import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

test('G12-A retire les deux appelants UI des purges analytics globales', () => {
  const analytics = read('src/kit/admin/AdminAnalytics.jsx');
  const registry = read('src/kit/config/functionTargets.js');

  for (const retiredName of ['clearAllAffiliateClicks', 'clearAllSessions']) {
    assert.doesNotMatch(analytics, new RegExp(`getCallableFunction\\('${retiredName}'\\)`));
    assert.doesNotMatch(registry, new RegExp(`${retiredName}:`));
  }
  assert.doesNotMatch(analytics, /Purger Data/);
  assert.match(registry, /deleteSession:\s*'deleteSessionGen2'/);
});

test('G12-A ferme la cohorte exacte puis expire sa fenetre sur approbation G12-B', () => {
  const manifest = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g12a-maintenance.json'));
  const rollback = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g12a-maintenance-rollback.json'));

  assert.equal(manifest.metadata.status, 'G12_A_MAINTENANCE_CLOSED');
  assert.deepEqual(manifest.validation.finalInventory, { source: 276, cloud: 263, gen1: 129, gen2: 134 });
  assert.equal(manifest.deletions.length, 10);
  assert.ok(manifest.deletions.every(({ generation, result }) => generation === 1 && result === 'DELETED'));
  assert.equal(manifest.validation.realDataDeletionCount, 0);
  assert.equal(manifest.authorization.g12BAllowed, false);
  assert.equal(rollback.metadata.status, 'WINDOW_EXPIRED_BY_FORMAL_APPROVAL');
  assert.equal(rollback.rollbackWindow.expiresAt, '2026-08-22T22:45:38Z');
  assert.equal(rollback.rollbackWindow.g12BAllowed, true);
  assert.equal(rollback.functions.length, 10);
});

test('G12-B retire les dix exports legacy sans toucher deleteSessionGen2', () => {
  const finalManifest = JSON.parse(read('apphostingaudit/manifests/functions-gen2-g12b-maintenance.json'));
  const functionsIndex = read('functions/index.js');
  const sessions = read('functions/src/analytics/sessions.js');
  const dashboard = read('src/kit/admin/AdminDashboard.jsx');
  const retiredNames = finalManifest.dependencies.exactNames;

  assert.equal(finalManifest.metadata.status, 'G12_B_MAINTENANCE_CLOSED');
  assert.equal(finalManifest.metadata.sourceCountAfter, 266);
  assert.equal(finalManifest.cloudCleanup.iamBindingsDeleted, 0);
  assert.equal(finalManifest.cloudCleanup.secretVersionsDestroyed, 0);
  assert.equal(fs.existsSync(path.join(ROOT, 'functions/src/maintenance/tools.js')), false);
  for (const name of retiredNames) {
    assert.doesNotMatch(functionsIndex, new RegExp(`exports\\.${name}\\s*=`));
  }
  assert.doesNotMatch(sessions, /exports\.(deleteSession|clearAllSessions|clearAllAffiliateClicks)\s*=/);
  assert.doesNotMatch(dashboard, /getCallableFunction\('(resetAllOrders|runGarbageCollector|resetAllUsers|purgeAnonymousUsers|purgeAllProducts)'\)/);
  assert.match(functionsIndex, /exports\.deleteSessionGen2\s*=\s*deleteSessionGen2/);
});
