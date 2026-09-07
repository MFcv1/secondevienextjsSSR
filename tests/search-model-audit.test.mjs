import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import KIT_CONFIG from '../src/kit/config/constants.js';
import * as purchasing from '../src/kit/commerce/purchasability.js';
import { getCategoryUrl, getProductUrl } from '../src/utils/slug.js';

const source = readFileSync(new URL('../src/kit/marketplace/searchModel.js', import.meta.url), 'utf8');
function model() {
  let imageReads = 0;
  const build = vm.runInNewContext(source.replace(/^import .*;\n/gm, '').replace(/^export /gm, '') + '\nbuildSearchResponse', {
    KIT_CONFIG, ...purchasing, getCategoryUrl, getProductUrl,
    getProductCardImage: () => { imageReads++; return { src: '/test.webp', srcSet: '' }; },
  });
  return { build, imageReads: () => imageReads };
}

test('search counts all matches while ranking once and serializing only displayed results', () => {
  const h = model();
  const products = Array.from({ length: 100 }, (_, index) => ({ id: String(index), name: 'Buffet ancien', category: 'buffets', stock: 1, currentPrice: 150 }));
  const result = h.build(products, 'buffet', { limit: 8 });
  assert.equal(result.total, 100);
  assert.equal(result.products.length, 8);
  assert.equal(result.hasMore, true);
  assert.equal(h.imageReads(), 108);
});

test('price and availability intents retain furniture terms and exclude unsuitable items', () => {
  const products = [
    { id: 'cheap', name: 'Buffet', category: 'buffets', stock: 1, currentPrice: 150 },
    { id: 'expensive', name: 'Buffet', category: 'buffets', stock: 1, currentPrice: 600 },
    { id: 'sold', name: 'Buffet', category: 'buffets', stock: 0, sold: true, currentPrice: 100 },
    { id: 'chair', name: 'Chaise', category: 'chaises', stock: 1, currentPrice: 90 },
  ];
  const result = model().build(products, 'buffet petit prix disponible');
  assert.equal(result.products.length, 1);
  assert.equal(result.products[0].id, 'cheap');
});
