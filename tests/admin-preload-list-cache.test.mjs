import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setAdminCacheAuthorization, clearAdminDataCache } from '../src/kit/admin/adminDataCache.js';

const cacheUrl = new URL('../src/kit/admin/adminDataCache.js', import.meta.url).href;
async function client(path, calls, handler) {
  const key = `__preload_test_${Math.random()}`;
  globalThis[key] = async name => async payload => {
    calls.push({ name, payload });
    if (handler) return { data: await handler(name, payload) };
    return { data: { links: [], promotions: [], serial: calls.length } };
  };
  let source = await readFile(new URL(path, import.meta.url), 'utf8');
  source = source.replace(/import \{ getCallableFunction \} from '[^']+';/, `const getCallableFunction = globalThis[${JSON.stringify(key)}];`)
    .replace(/from '[^']*adminDataCache';/, `from ${JSON.stringify(cacheUrl)};`);
  try { return await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`); }
  finally { delete globalThis[key]; }
}

test.beforeEach(() => { clearAdminDataCache(); setAdminCacheAuthorization('local-admin'); });
test.afterEach(() => setAdminCacheAuthorization(null));

test('payment links: preload and opening share one read; refresh, filters and every mutation stay authoritative', async () => {
  const calls = [], api = await client('../src/kit/commerce/adminPaymentLinkClient.js', calls);
  const [a, b] = await Promise.all([api.listAdminPaymentLinks(), api.listAdminPaymentLinks()]);
  assert.deepEqual(a, b);
  assert.equal(calls.length, 1);
  await api.listAdminPaymentLinks();
  assert.equal(calls.length, 1);
  await api.listAdminPaymentLinks({ force: true });
  assert.equal(calls.length, 2);
  await api.listAdminPaymentLinks({ reference: 'C42' });
  await api.listAdminPaymentLinks({ cursor: 'next' });
  assert.equal(calls.length, 4);
  for (const mutate of [
    () => api.createAdminPaymentLink({}), () => api.extendAdminPaymentLink('order', 120),
    () => api.regenerateAdminPaymentLink('order'), () => api.recreateAdminPaymentLink('order'),
    () => api.cancelAdminPaymentLink('order'),
  ]) {
    const before = calls.length;
    await mutate(); await api.listAdminPaymentLinks();
    assert.equal(calls.length, before + 2);
  }
  const before = calls.length;
  await api.getAdminPaymentLinkPublic('order', 'synthetic');
  await api.getAdminPaymentLinkPublic('order', 'synthetic');
  assert.equal(calls.length, before + 2, 'Public calls are never cached by the admin workspace');
});

test('promotions: shared read invalidated after create/status and isolated on account change', async () => {
  const calls = [], api = await client('../src/kit/admin/promotionCodeClient.js', calls);
  await Promise.all([api.listPromotionCodesAdmin(), api.listPromotionCodesAdmin()]);
  assert.equal(calls.length, 1);
  await api.createPromotionCodeAdmin({}); await api.listPromotionCodesAdmin();
  await api.setPromotionCodeStatusAdmin('SYNTHETIC', false); await api.listPromotionCodesAdmin();
  assert.equal(calls.length, 5);
  setAdminCacheAuthorization('other-admin');
  await api.listPromotionCodesAdmin();
  assert.equal(calls.length, 6);
  setAdminCacheAuthorization(null);
  await assert.rejects(api.listPromotionCodesAdmin(), { code: 'admin/authorization-changed' });
  assert.equal(calls.length, 6);
});

test('an old speculative list cannot populate the cache after a concurrent mutation', async () => {
  const calls = [];
  let release;
  const api = await client('../src/kit/admin/promotionCodeClient.js', calls, name => {
    if (name === 'listPromotionCodesAdmin' && !release) return new Promise(resolve => { release = resolve; });
    return { promotions: ['new-version'] };
  });
  const pending = api.listPromotionCodesAdmin();
  while (!release) await Promise.resolve();
  const rejected = assert.rejects(pending, { code: 'admin/read-invalidated' });
  await api.createPromotionCodeAdmin({});
  release({ promotions: ['old-version'] });
  await rejected;
  assert.deepEqual(await api.listPromotionCodesAdmin(), { promotions: ['new-version'] });
});
