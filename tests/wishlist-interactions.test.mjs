import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/kit/marketplace/wishlistState.js', import.meta.url), 'utf8');
let serial = 0;
async function setup() {
  const storage = new Map();
  const writes = [];
  const listeners = [];
  const userA = { uid: 'account-a' };
  const userB = { uid: 'account-b' };
  globalThis.window = Object.assign(new EventTarget(), {
    __svAuthUser: userA,
    localStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  });
  const sdk = {
    doc: (_db, ...parts) => parts.join('/'), collection: (_db, ...parts) => parts.join('/'),
    serverTimestamp: () => 'timestamp', query: (ref) => ref,
    setDoc: async (ref, payload) => {
      assert.ok(Object.values(payload).every((value) => value !== undefined));
      writes.push({ ref, payload });
    },
    deleteDoc: async () => { throw new Error('permission-denied'); },
    onSnapshot: (_query, next) => { const listener = { next, stopped: false }; listeners.push(listener); return () => { listener.stopped = true; }; },
  };
  globalThis.__wishlistAuditSdk = sdk;
  const injected = source.replace("import { getDb, loadFirestoreModule } from '../config/firebaseLazy';", 'const sdk = globalThis.__wishlistAuditSdk; const getDb = async () => ({}); const loadFirestoreModule = async () => sdk;');
  const loadedModule = await import(`data:text/javascript;base64,${Buffer.from(`${injected}\n// ${serial++}`).toString('base64')}`);
  return { module: loadedModule, storage, writes, listeners, userA, userB };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));

test('wishlist separates two accounts and guest; ambiguous legacy cache is never imported', async () => {
  const { module: m, storage, writes, userA, userB } = await setup();
  storage.set('sv_public_product_wishlist', JSON.stringify(['legacy-private']));
  m.writeWishlistIds(['private-a'], userA);
  assert.deepEqual(m.readWishlistIds(userB), []);
  assert.deepEqual(m.readWishlistIds(null), []);
  const stop = m.subscribeWishlistItems(userB, () => {});
  await flush();
  assert.equal(writes.length, 0);
  stop();
});

test('wishlist imports guests once, shares subscriptions and ignores callbacks after unsubscribe', async () => {
  const { module: m, writes, listeners, userA, userB } = await setup();
  m.writeWishlistIds(['guest-piece'], null);
  const changes = [];
  const stopA = m.subscribeWishlistItems(userA, (items) => changes.push(items));
  const stopB = m.subscribeWishlistItems(userA, () => {});
  await flush();
  assert.equal(writes.length, 1);
  assert.equal(listeners.length, 1);
  assert.deepEqual(m.readWishlistIds(null), []);
  listeners[0].next({ docs: [{ id: 'guest-piece', data: () => ({ originalId: 'guest-piece' }) }] });
  assert.deepEqual(m.readWishlistIds(userA), ['guest-piece']);
  assert.deepEqual(m.readWishlistIds(userB), []);
  stopA();
  assert.equal(listeners[0].stopped, false);
  stopB();
  assert.equal(listeners[0].stopped, true);
  const count = changes.length;
  listeners[0].next({ docs: [] });
  assert.equal(changes.length, count);
  assert.deepEqual(m.readWishlistIds(userA), ['guest-piece']);
});

test('wishlist omits undefined prices and does not persist a rejected deletion', async () => {
  const { module: m, writes, userA } = await setup();
  await m.setWishlistItem({ id: 'product-one', price: 80 }, true, userA);
  assert.equal(writes.length, 1);
  assert.deepEqual(m.readWishlistIds(userA), ['product-one']);
  await assert.rejects(m.setWishlistItem({ id: 'product-one' }, false, userA), /permission-denied/);
  assert.deepEqual(m.readWishlistIds(userA), ['product-one']);
});

test('a failed guest migration does not prevent reading the account wishlist', async () => {
  const { module: m, listeners, userA } = await setup();
  m.writeWishlistIds(['guest-piece'], null);
  globalThis.__wishlistAuditSdk.setDoc = async () => { throw new Error('import denied'); };
  const errors = [];
  const stop = m.subscribeWishlistItems(userA, () => {}, error => errors.push(error.message));
  await flush();
  assert.deepEqual(errors, ['import denied']);
  assert.equal(listeners.length, 1);
  assert.deepEqual(m.readWishlistIds(null), ['guest-piece']);
  stop();
});

test('large wishlist clears bounded batches and preserves concurrently added favorites', async () => {
  const { module: m, userA } = await setup();
  const ids = Array.from({ length: 805 }, (_, index) => `piece-${index}`);
  m.writeWishlistIds(ids, userA);
  const sizes = [];
  globalThis.__wishlistAuditSdk.writeBatch = () => {
    const deleted = [];
    return {
      delete: ref => deleted.push(ref),
      commit: async () => {
        sizes.push(deleted.length);
        m.writeWishlistIds([...m.readWishlistIds(userA), 'added-during-clear'], userA);
      },
    };
  };
  await m.clearWishlist(ids.map(id => ({ id })), userA);
  assert.deepEqual(sizes, [400, 400, 5]);
  assert.deepEqual(m.readWishlistIds(userA), ['added-during-clear']);
});
