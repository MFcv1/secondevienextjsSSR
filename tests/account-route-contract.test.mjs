import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../app/mes-commandes/OrdersPageIsland.jsx', import.meta.url), 'utf8');

test('signed-out account route does not wait for the full orders workspace bundle', () => {
  assert.doesNotMatch(source, /import MyOrdersView from/);
  assert.match(source, /dynamic\(\(\) => import\('\.\.\/\.\.\/src\/kit\/commerce\/MyOrdersView'\)/);
  assert.match(source, /if \(!effectiveUser \|\| effectiveUser\.isAnonymous\)/);
  assert.match(source, /<AccountDashboardFallback darkMode=\{darkMode\} isSignedOut \/>/);
});

test('account route owns loading state instead of a segment streaming fallback', async () => {
  await assert.rejects(
    access(new URL('../app/mes-commandes/loading.jsx', import.meta.url)),
    { code: 'ENOENT' },
  );
});
