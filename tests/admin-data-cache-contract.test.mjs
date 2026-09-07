import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

import {
  clearAdminDataCache,
  getAdminCachedData,
  loadAdminCachedData,
  setAdminCacheAuthorization,
  getAdminPreference,
  setAdminPreference,
} from '../src/kit/admin/adminDataCache.js';

test.beforeEach(() => setAdminCacheAuthorization('local-admin'));

test.afterEach(() => {
  clearAdminDataCache();
});

test('périodes sans TTL, isolées par propriétaire et purgées à la révocation', async () => {
  setAdminPreference('stats:quote-period', '3m');
  setAdminPreference('data:period', '7j');
  await loadAdminCachedData('expired', async () => 3, { maxAgeMs: 0 });
  assert.equal(getAdminCachedData('expired'), null);
  assert.equal(getAdminCachedData('expired', { allowStale: true }), 3);
  assert.equal(getAdminPreference('stats:quote-period', '30d'), '3m');
  assert.equal(getAdminPreference('data:period', '1j'), '7j');
  setAdminCacheAuthorization('another-admin');
  assert.equal(getAdminPreference('data:period', '1j'), '1j');
  setAdminPreference('data:period', '7j');
  setAdminCacheAuthorization(null);
  setAdminCacheAuthorization('another-admin');
  assert.equal(getAdminPreference('data:period', '1j'), '1j');
});

test('admin data cache deduplicates concurrent reads and reuses known data', async () => {
  let calls = 0;
  const loader = async () => {
    calls += 1;
    return { orders: [1, 2, 3] };
  };

  const [first, second] = await Promise.all([
    loadAdminCachedData('orders', loader),
    loadAdminCachedData('orders', loader),
  ]);
  const third = await loadAdminCachedData('orders', loader);

  assert.equal(calls, 1);
  assert.deepEqual(first, second);
  assert.deepEqual(third, first);
  assert.deepEqual(getAdminCachedData('orders'), first);
});

test('stale page remains visible through refresh and error, then authorization still purges it', async () => {
  await loadAdminCachedData('stale', async () => ['known'], { maxAgeMs: 0 });
  let fail;
  const refresh = loadAdminCachedData('stale', () => new Promise((_, reject) => { fail = reject; }), { force: true });
  await Promise.resolve();
  assert.deepEqual(getAdminCachedData('stale', { allowStale: true }), ['known']);
  fail(new Error('offline'));
  await assert.rejects(refresh);
  assert.deepEqual(getAdminCachedData('stale', { allowStale: true }), ['known']);
  setAdminCacheAuthorization(null);
  assert.equal(getAdminCachedData('stale'), null);
});

test('returns partial refresh preserves cached rows, but an authorization failure purges all rows', async () => {
  const source = await readFile(new URL('../src/kit/admin/adminCommerceData.js', import.meta.url), 'utf8');
  const cacheUrl = new URL('../src/kit/admin/adminDataCache.js', import.meta.url).href;
  let returnsFailure = new Error('offline');
  globalThis.__returnsReadMock = {
    listOrdersAdminV2: async () => ({ orders: ['fresh-order'] }),
    listReturnsAdminV2: async () => { throw returnsFailure; },
    listCustomerReturnRequestsAdminV2: async () => ({ requests: ['fresh-request'] }),
  };
  try {
    const isolated = source.replace(/import\s*\{[\s\S]*?\}\s*from '\.\.\/commerce\/commerceV2Client';/, 'const { listOrdersAdminV2, listReturnsAdminV2, listCustomerReturnRequestsAdminV2 } = globalThis.__returnsReadMock;')
      .replace("'./adminDataCache'", JSON.stringify(cacheUrl));
    const { loadAdminReturnsFirstPage, ADMIN_RETURNS_FIRST_PAGE_KEY } = await import(`data:text/javascript;base64,${Buffer.from(isolated).toString('base64')}`);
    await loadAdminCachedData(ADMIN_RETURNS_FIRST_PAGE_KEY, async () => ({ returns: ['known-return'] }));
    const partial = await loadAdminReturnsFirstPage({ force: true });
    assert.deepEqual(partial.returns, ['known-return']);
    assert.deepEqual(partial.orders, ['fresh-order']);
    assert.equal(partial.returnsOutcome.status, 'rejected');
    returnsFailure = Object.assign(new Error('denied'), { code: 'permission-denied' });
    await assert.rejects(loadAdminReturnsFirstPage({ force: true }), { code: 'permission-denied' });
    assert.equal(getAdminCachedData(ADMIN_RETURNS_FIRST_PAGE_KEY, { allowStale: true }), null);
  } finally {
    delete globalThis.__returnsReadMock;
  }
});

test('admin data cache is cleared when the admin session ends', async () => {
  await loadAdminCachedData('dashboard', async () => ({ totalOrders: 24 }));
  assert.deepEqual(getAdminCachedData('dashboard'), { totalOrders: 24 });

  clearAdminDataCache();

  assert.equal(getAdminCachedData('dashboard'), null);
});

test('an in-flight read cannot repopulate the cache after logout', async () => {
  let resolveLoader;
  const pending = loadAdminCachedData('dashboard', () => new Promise((resolve) => {
    resolveLoader = resolve;
  }));
  await Promise.resolve();
  clearAdminDataCache();
  resolveLoader({ totalOrders: 24 });
  await assert.rejects(pending, { code: 'admin/authorization-changed' });
  assert.equal(getAdminCachedData('dashboard'), null);
});

test('logout hors admin puis autre propriétaire et révocation même UID purgent les données', async () => {
  await loadAdminCachedData('quotes', async () => ['private-a']);
  setAdminCacheAuthorization(null);
  assert.equal(getAdminCachedData('quotes'), null);
  await assert.rejects(loadAdminCachedData('quotes', async () => ['forbidden']), { code: 'admin/authorization-changed' });
  setAdminCacheAuthorization('admin-b');
  assert.deepEqual(await loadAdminCachedData('quotes', async () => ['private-b']), ['private-b']);
  await assert.rejects(loadAdminCachedData('denied', async () => { throw Object.assign(new Error('Denied'), {code:'permission-denied'}); }));
  assert.equal(getAdminCachedData('quotes'), null);
  setAdminCacheAuthorization('admin-b');
  assert.deepEqual(await loadAdminCachedData('quotes', async () => ['fresh-b']), ['fresh-b']);
});

test('un refus tardif du premier admin ne purge pas les données du suivant', async () => {
  let rejectLoader;
  const pending = loadAdminCachedData('old', () => new Promise((_, reject) => { rejectLoader = reject; }));
  await Promise.resolve();
  setAdminCacheAuthorization('admin-b');
  await loadAdminCachedData('current', async () => ['private-b']);
  rejectLoader(Object.assign(new Error('Denied'), { code: 'permission-denied' }));
  await assert.rejects(pending, { code: 'permission-denied' });
  assert.deepEqual(getAdminCachedData('current'), ['private-b']);
});
