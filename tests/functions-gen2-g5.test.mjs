import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { GCLOUD_GEN2_TARGETS } from '../scripts/deploy-functions-targeted.mjs';
import { classificationFor, extractLocalExports } from '../scripts/functions-gen2-inventory.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

test('G5 prepare uniquement getUserStatsGen2 avec handler et securite partages', () => {
  const source = read('functions/src/auth/adminManagement.js');
  const exports = extractLocalExports(ROOT);
  const target = GCLOUD_GEN2_TARGETS.getUserStatsGen2;
  assert.ok(exports.some(({ name }) => name === 'getUserStats'));
  assert.ok(exports.some(({ name }) => name === 'getUserStatsGen2'));
  assert.equal(classificationFor('getUserStatsGen2'), 'MIGRATION_PARALLEL');
  assert.match(source, /const getUserStatsHandler = async \(data, context\) =>/);
  assert.match(source, /exports\.getUserStats = regionalFunctions\(\)[\s\S]*?onCall\(getUserStatsHandler\)/);
  assert.match(source, /exports\.getUserStatsGen2 = onCall\(/);
  assert.match(source, /await checkActiveStrongAdmin\(context\)/);
  assert.match(source, /enforceAppCheck:\s*true/);
  assert.equal(target.runtimeServiceAccount, 'auth-reader-runtime@secondevienextjsssr.iam.gserviceaccount.com');
  assert.equal(target.cpu, '167m');
  assert.equal(target.concurrency, '1');
  assert.equal(target.maxInstances, '1');
  assert.match(read('src/kit/config/functionTargets.js'), /getUserStats:\s*'getUserStatsGen2'/);
});

test('G5 garde les trois triggers Auth exclusivement en Gen1', () => {
  const index = read('functions/index.js');
  for (const name of ['grantAdminOnAuth', 'onRegisteredUserCreated', 'onRegisteredUserDeleted']) {
    assert.doesNotMatch(index, new RegExp(`${name}Gen2`));
  }
});
