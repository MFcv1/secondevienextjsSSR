import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createPasskeyPost, PasskeyHttpError } from '../src/lib/server/passkeyHttp.mjs';
import { PUBLIC_OPERATIONS, getPublicOperation, getPublicOperationEndpoint } from '../shared/publicOperationTransport.mjs';
import { createImmutableReleaseCache } from '../src/lib/server/immutableReleaseCache.mjs';
import { createPrivateReadCoalescer } from '../src/kit/auth/privateReadCoalescer.mjs';

const origin = 'https://site.example';
test('private concurrent reads coalesce and discard responses after logout without retaining results', async () => {
  const read = createPrivateReadCoalescer();
  let user = {};
  let calls = 0;
  let complete;
  const load = () => { calls++; return new Promise(resolve => { complete = resolve; }); };
  const one = read(user, 'orders', load, () => user);
  const two = read(user, 'orders', load, () => user);
  await Promise.resolve();
  assert.equal(calls, 1);
  user = null;
  complete({ orders: ['private'] });
  await assert.rejects(one, error => error.code === 'functions/unauthenticated');
  await assert.rejects(two, error => error.code === 'functions/unauthenticated');
  user = {};
  assert.deepEqual(await read(user, 'orders', async () => ({ orders: [] }), () => user), { orders: [] });
  assert.equal(await read(user, 'orders', async () => 'fresh', () => user), 'fresh');
});
const request = (headers = {}) => new Request(`${origin}/api/public/test`, {
  method: 'POST', headers: { origin, 'x-firebase-appcheck': 'fixture', ...headers },
  body: JSON.stringify({ data: { actorUid: 'forged-uid' } }),
});
function setup(overrides = {}) {
  const calls = [];
  return { calls, post: createPasskeyPost({
    resolveOperation: getPublicOperation, enabled: () => true, origin: () => origin,
    readBody: async req => ({ body: await req.json() }),
    verifyAppCheck: async () => ({ appId: 'fixture' }),
    verifyIdToken: async () => ({ uid: 'verified-uid' }),
    resolveClientIp: () => '192.0.2.2',
    getHandlers: async name => ({ [getPublicOperation(name).handler]: async (data, context) => {
      calls.push({ name, data, context }); return { success: true };
    } }), log: () => {}, ...overrides,
  }) };
}

test('every migrated operation uses a closed group flag and keeps Functions rollback', () => {
  for (const [name, policy] of Object.entries(PUBLIC_OPERATIONS)) {
    assert.equal(getPublicOperationEndpoint(name), null);
    assert.equal(getPublicOperationEndpoint(name, 'functions'), null);
    assert.equal(getPublicOperationEndpoint(name, policy.group), `/api/public/${name}`);
  }
  for (const name of ['__proto__', 'constructor', 'deleteSession', 'getUserStats', 'createPromotionCodeAdmin', 'uploadQuoteRequestPhoto']) {
    assert.equal(getPublicOperation(name), null);
  }
});

test('OTP and order-status callers use the reversible transport; newsletter preparation executes no draw', () => {
  const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  for (const file of ['src/kit/marketplace/LegacyLoginModalFullIsland.jsx', 'src/kit/commerce/CheckoutView.jsx', 'src/kit/commerce/CheckoutStripeModal.jsx']) {
    assert.doesNotMatch(read(file), /httpsCallable\([^\n]*getFunctionTarget\('(sendCustomerLoginOtp|verifyCustomerLoginOtp|sendGuestCheckoutOtp|verifyGuestCheckoutOtp|getOrderStatusClient)'/);
  }
  const gallery = read('src/kit/marketplace/GalleryFixedSectionsInteractions.jsx');
  const preparation = gallery.slice(gallery.indexOf('const prepareNewsletterRuntime'), gallery.indexOf('const labelText', gallery.indexOf('const prepareNewsletterRuntime')));
  assert.match(preparation, /import\('\.\/newsletterRewardClient'\)/);
  assert.match(preparation, /saveData/);
  assert.doesNotMatch(preparation, /drawNewsletterReward|claimNewsletterReward|createNewsletterPlayId/);
  assert.equal((gallery.match(/api\.drawNewsletterReward\(/g) || []).length, 1);
});

test('public business modules load without Functions deployment, images or PDF runtime', () => {
  const require = createRequire(import.meta.url);
  for (const file of [
    'auth/customerLoginOtpHandlers.cjs', 'auth/guestCheckoutOtpHandlers.cjs', 'auth/passkeyHandlers.cjs',
    'analytics/updateUserSessionsHandler.cjs', 'commerce/checkoutHandlers.cjs', 'commerce/customerOrderQueries.cjs',
    'commerce/orderStatusHandler.cjs', 'commerce/publicCheckoutRuntime.cjs', 'commerce/publicPaymentLinkHandlers.cjs',
    'commerce/publicPromotionHandlers.cjs', 'newsletter/newsletterHandlers.cjs', 'quotes/publicQuoteHandlers.cjs',
  ]) require(`../functions/src/${file}`);
  assert.deepEqual(Object.keys(require.cache).filter(file => /firebase-functions|\/sharp\/|pdfkit|\/functions\/index\.js$/.test(file)), []);
});

test('every route rejects missing App Check and revoked supplied tokens before loading business code', async () => {
  for (const name of Object.keys(PUBLIC_OPERATIONS)) {
    const { post, calls } = setup({ verifyIdToken: async () => { throw Error('revoked'); } });
    assert.equal((await post(request({ 'x-firebase-appcheck': '' }), name)).status, 401);
    assert.equal((await post(request({ authorization: 'Bearer revoked' }), name)).status, 401);
    assert.equal(calls.length, 0);
  }
});

test('owner routes require verified Auth; rate-limited operations require established proxy IP', async () => {
  for (const [name, policy] of Object.entries(PUBLIC_OPERATIONS)) {
    const { post, calls } = setup({ resolveClientIp: () => null });
    if (policy.auth) assert.equal((await post(request(), name)).status, 401);
    if (policy.ip) assert.equal((await post(request({ authorization: 'Bearer fixture' }), name)).status, 503);
    if (policy.auth || policy.ip) assert.equal(calls.length, 0);
    const accepted = setup();
    const response = await accepted.post(request({ authorization: 'Bearer fixture' }), name);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('cache-control'), /private, no-store/);
    assert.equal(accepted.calls[0].context.auth.uid, 'verified-uid');
  }
});

test('an ambiguous mutation is invoked once and keeps its callable error for explicit recovery', async () => {
  let calls = 0;
  const { post } = setup({ getHandlers: async () => ({ createCheckoutV2: async () => {
    calls++; throw new PasskeyHttpError('aborted', 'Reprendre', { reason: 'COMMERCE_RESULT_UNKNOWN' });
  } }) });
  const response = await post(request({ authorization: 'Bearer fixture' }), 'createCheckoutV2');
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error.details.reason, 'COMMERCE_RESULT_UNKNOWN');
  assert.equal(calls, 1);
});

test('validated release cache coalesces concurrent loads, revalidates changed pointers, supports rollback', async () => {
  const cache = createImmutableReleaseCache();
  let loads = 0;
  const load = async pointer => { loads++; return { revision: pointer.revision }; };
  const first = { manifestPath: 'release/1', manifestSha256: 'a', revision: 1 };
  await Promise.all(Array.from({ length: 16 }, () => cache(first, load)));
  assert.equal(loads, 1);
  await cache({ ...first, manifestSha256: 'corrupt' }, async () => { loads++; throw Error('hash'); }).catch(() => {});
  await cache({ ...first, revision: 2 }, load);
  assert.equal((await cache(first, load)).revision, 1);
  assert.equal(loads, 3);
});

test('release cache bounds retained bytes and entries, and never retains rejected loads', async () => {
  const cache = createImmutableReleaseCache({ maxEntries: 2, maxBytes: 100 });
  let loads = 0;
  const load = async () => { loads++; return { payload: 'x'.repeat(200) }; };
  await cache({ revision: 1 }, load);
  await cache({ revision: 1 }, load);
  assert.equal(loads, 2);
  let failures = 0;
  for (let i = 0; i < 2; i++) await assert.rejects(cache({ revision: 2 }, async () => { failures++; throw Error('transient'); }));
  assert.equal(failures, 2);
  const bounded = createImmutableReleaseCache({ maxEntries: 1 });
  let finish;
  const pending = bounded({ revision: 1 }, () => new Promise(resolve => { finish = resolve; }));
  await Promise.resolve();
  await bounded({ revision: 2 }, async () => 2);
  finish(1);
  await pending;
  assert.equal(await bounded({ revision: 2 }, () => assert.fail('evicted promise repopulated cache')), 2);
});
