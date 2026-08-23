import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  fetchPublicCatalogProduct,
  mergeCatalogProducts,
  resolveWishlistCatalogItems,
} from '../src/kit/marketplace/publicCatalogWishlist.js';

const source = await readFile(new URL('../app/mes-commandes/OrdersPageIsland.jsx', import.meta.url), 'utf8');
const wishlistSource = await readFile(new URL('../app/wishlist/WishlistPageIsland.jsx', import.meta.url), 'utf8');

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

test('account wishlist preview resolves missing products through the public catalog', async () => {
  assert.match(source, /missingIds\.map\(\(id\) => fetchPublicCatalogProduct\(id\)\)/);
  assert.match(source, /items=\{catalogItems\}/);

  const requested = [];
  const product = await fetchPublicCatalogProduct('buffet-1', async (url, options) => {
    requested.push({ url, options });
    return {
      ok: true,
      json: async () => ({ product: { id: 'buffet-1', name: 'Buffet', currentPrice: 800 } }),
    };
  });

  assert.equal(product.name, 'Buffet');
  assert.equal(product.originalId, 'buffet-1');
  assert.equal(product.collectionName, 'furniture');
  assert.deepEqual(requested, [{
    url: '/api/catalog?id=buffet-1',
    options: { cache: 'no-store', headers: { accept: 'application/json' } },
  }]);
  assert.deepEqual(
    mergeCatalogProducts([{ id: 'other', name: 'Other' }], [product]).map((item) => item.id),
    ['other', 'buffet-1'],
  );
});

test('wishlist uses the document id when a historical favorite has no originalId', () => {
  assert.match(wishlistSource, /missingIds\.map\(\(id\) => fetchPublicCatalogProduct\(id\)\)/);
  assert.doesNotMatch(wishlistSource, /missingIds\.map\(fetchPublicCatalogProduct\)/);

  const [resolved] = resolveWishlistCatalogItems(
    [{ id: 'buffet-1', image: 'stale.webp' }],
    [{ id: 'buffet-1', name: 'Buffet', currentPrice: 800, stock: 1, status: 'published' }],
  );

  assert.equal(resolved.name, 'Buffet');
  assert.equal(resolved.currentPrice, 800);
  assert.equal(resolved.stock, 1);
});
