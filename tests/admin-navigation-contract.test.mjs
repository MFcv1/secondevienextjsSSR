import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('Incidents reste le dernier item du menu lateral Admin', () => {
  const island = read('app/admin/AdminAppIsland.jsx');
  const constants = read('src/kit/config/constants.js');
  const groups = island.match(/const ADMIN_NAV_GROUPS = \[([\s\S]*?)\n\];/)?.[1] || '';
  const tabs = constants.match(/adminTabs:\s*\[([\s\S]*?)\n {2}\],/)?.[1] || '';
  const tabIds = [...tabs.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]);

  assert.doesNotMatch(groups, /Vue d'ensemble[^\n]*incidents/);
  assert.match(groups, /\{ label: 'Administration', tabs: \['account', 'users', 'incidents'\] \},\s*$/);
  assert.equal(tabIds.at(-1), 'incidents');
  assert.equal(tabIds.filter((id) => id === 'incidents').length, 1);
});
