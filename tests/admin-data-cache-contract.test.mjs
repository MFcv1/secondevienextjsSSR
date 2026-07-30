import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clearAdminDataCache,
  getAdminCachedData,
  loadAdminCachedData,
} from '../src/kit/admin/adminDataCache.js';

test.afterEach(() => {
  clearAdminDataCache();
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

test('admin data cache is cleared when the admin session ends', async () => {
  await loadAdminCachedData('dashboard', async () => ({ totalOrders: 24 }));
  assert.deepEqual(getAdminCachedData('dashboard'), { totalOrders: 24 });

  clearAdminDataCache();

  assert.equal(getAdminCachedData('dashboard'), null);
});
