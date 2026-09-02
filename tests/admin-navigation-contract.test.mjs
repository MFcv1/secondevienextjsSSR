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

test('Data affiche son cache immédiatement et espace les synchronisations automatiques', () => {
  const analytics = read('src/kit/admin/AdminAnalytics.jsx');
  const island = read('app/admin/AdminAppIsland.jsx');
  const sidebar = read('app/admin/AdminSidebar.jsx');
  assert.match(analytics, /ADMIN_ANALYTICS_REFRESH_TTL_MS\s*=\s*5 \* 60 \* 1000/);
  assert.match(analytics, /cachedAnalyticsSessions === null/);
  assert.match(analytics, /restoringSessions && sessions\.length === 0/);
  assert.doesNotMatch(analytics, /\(loading \|\| restoringSessions\) && sessions\.length === 0/);
  assert.match(island, /loadAdminAnalytics/);
  assert.match(sidebar, /onPointerEnter=\{\(\) => onIntent\?\.\(tab\.id\)\}/);
});

test('Système reste monté pendant le passage Commande afin de conserver son listener', () => {
  const consoleSource = read('src/kit/admin/AdminIncidentConsole.jsx');
  assert.match(consoleSource, /<div hidden=\{mode !== 'system'\}>/);
  assert.doesNotMatch(consoleSource, /mode === 'system'\s*\?\s*<SystemIncidentConsole/);
});
