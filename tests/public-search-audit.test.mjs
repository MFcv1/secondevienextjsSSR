import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { resolveWishlistCatalogItems } from '../src/kit/marketplace/publicCatalogWishlist.js';

test('search route can return a visible product beyond the first 120 catalog cards', async () => {
  const source = await readFile(new URL('../app/api/search/route.js', import.meta.url), 'utf8');
  const dependencies = `
    const NextResponse = { json: (body) => body };
    const products = Array.from({length: 122}, (_, index) => ({ id: String(index), name: index >= 120 ? 'rare' : 'other', visible: index !== 121 }));
    const queryMaterializedCatalog = async ({limit} = {}) => ({ snapshot: {catalogVersion: 'local-test', aggregateSha256: 'local-hash'}, products: limit ? products.slice(0, limit) : products });
    const isProductPublicVisible = product => product.visible;
    const buildSearchResponse = (products, query, {limit}) => ({results: products.filter(product => product.name === query).slice(0, limit)});
  `;
  const route = await import(`data:text/javascript;base64,${Buffer.from(dependencies + source.replace(/^import .*;\n/gm, '')).toString('base64')}`);
  const response = await route.GET({ url: 'https://example.test/api/search?q=rare&limit=8' });
  assert.deepEqual(response.results.map(product => product.id), ['120']);
  assert.equal(response.catalogVersion, 'local-test');
});

test('wishlist resolves fresh catalog data in saved order and keeps unavailable products identifiable', () => {
  const current = { id: 'current', name: 'fresh', stock: 0 };
  const result = resolveWishlistCatalogItems([{ id: 'missing', image: '/saved.jpg' }, { originalId: 'current', name: 'stale', stock: 1 }], [current]);
  assert.deepEqual(result.map(product => product.id), ['missing', 'current']);
  assert.equal(result[1], current);
  assert.deepEqual(result[0].images, ['/saved.jpg']);
});
