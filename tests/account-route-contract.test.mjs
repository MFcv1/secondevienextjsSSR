import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../app/mes-commandes/OrdersPageIsland.jsx', import.meta.url), 'utf8');

test('signed-out account route does not wait for the full orders workspace bundle', () => {
  assert.doesNotMatch(source, /import MyOrdersView from/);
  assert.match(source, /dynamic\(\(\) => import\('\.\.\/\.\.\/src\/kit\/commerce\/MyOrdersView'\)/);
  assert.match(source, /if \(!effectiveUser \|\| effectiveUser\.isAnonymous\)/);
  assert.match(source, /<AccountDashboardFallback darkMode=\{darkMode\} isSignedOut \/>/);
});
