import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = readFileSync('src/kit/commerce/useCartFavorites.js', 'utf8')
  .replace(/^import .*;\n/gm, '').replace('export default function', 'function');
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture(fetchProduct, enabled = true) {
  let state, change, failure, cleanup;
  const hook = vm.runInNewContext(`${source}\nuseCartFavorites`, {
    useState: initial => { state = initial; return [state, next => { state = next; }]; },
    useEffect: effect => { cleanup = effect(); },
    subscribeWishlistItems: (_user, onChange, onError) => { change = onChange; failure = onError; return () => {}; },
    fetchPublicCatalogProduct: fetchProduct,
  });
  hook(null, enabled);
  return { change: items => change(items), fail: () => failure(), stop: () => cleanup(), state: () => state };
}

test('closed panel keeps the selection counter current without fetching product details', async () => {
  const calls = [];
  const f = fixture(async id => { calls.push(id); return { id }; }, false);
  f.change([{ id: 'one' }, { id: 'two' }, { id: 'one' }, { id: 'three' }]);
  await tick();
  assert.equal(f.state().count, 3);
  assert.deepEqual(Array.from(f.state().ids), ['one', 'two', 'three']);
  assert.equal(f.state().loading, false);
  assert.equal(calls.length, 0);
});

test('favorites retain sold and available pieces, with at most twelve catalog reads', async () => {
  const calls = [];
  const f = fixture(async id => { calls.push(id); return { id, sold: id === '0', stock: id === '0' ? 0 : 1 }; });
  f.change(Array.from({ length: 20 }, (_, id) => ({ id: String(id) })));
  await tick();
  assert.equal(calls.length, 12);
  assert.equal(f.state().count, 20);
  assert.equal(f.state().items.length, 12);
  assert.equal(f.state().items[0].sold, true);
  assert.equal(f.state().loading, false);
});

test('a delayed old selection cannot replace new favorites or revive after close', async () => {
  const pending = new Map();
  const f = fixture(id => new Promise(resolve => pending.set(id, resolve)));
  f.change([{ id: 'old' }]);
  f.change([{ id: 'new' }]);
  pending.get('new')({ id: 'new' });
  await tick();
  pending.get('old')({ id: 'old' });
  await tick();
  assert.equal(f.state().items[0].id, 'new');
  f.change([{ id: 'closing' }]);
  f.stop();
  pending.get('closing')({ id: 'closing' });
  await tick();
  assert.equal(f.state().items.length, 0);
});

test('missing catalogue and failed subscription remain explicit and non-purchasable', async () => {
  const f = fixture(async () => null);
  f.change([{ id: 'missing' }]);
  await tick();
  assert.equal(f.state().items[0].catalogUnavailable, true);
  assert.equal(f.state().items[0].stock, undefined);
  f.fail();
  assert.match(f.state().error, /n’ont pas pu être chargés/);
  assert.equal(f.state().loading, false);
});
