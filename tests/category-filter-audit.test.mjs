import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import KIT_CONFIG from '../src/kit/config/constants.js';
import * as purchasing from '../src/kit/commerce/purchasability.js';

const source = readFileSync(new URL('../src/kit/marketplace/categoryViewModel.js', import.meta.url), 'utf8');
const model = vm.runInNewContext(source.replace(/^import .*;\n/gm, '').replace(/^export /gm, '')
  + '\n({ getCategoryQueryState, filterAndSortCategoryItems, buildCategoryHref, getCategoryFilterOptions })', {
  KIT_CONFIG, ...purchasing, URLSearchParams,
});

test('zero maximum survives URL round trip and excludes paid furniture', () => {
  const state = model.getCategoryQueryState(new URLSearchParams('maxPrice=0'), { maxPrice: 250 });
  assert.equal(state.priceRange[1], 0);
  assert.equal(model.filterAndSortCategoryItems([{ id: 'paid', stock: 1, currentPrice: 150 }], state, 250).length, 0);
  assert.equal(model.buildCategoryHref('meubles', state), '/categorie/meubles?maxPrice=0');
});

test('filter facets count published products once and retain special object keys safely', () => {
  const products = [
    { material: '__proto__', style: 'ancien', category: 'buffets', currentPrice: 123.45 },
    { material: '__proto__', style: 'ancien', category: 'buffets', currentPrice: 99 },
    { material: 'chêne', category: 'buffets', status: 'draft', currentPrice: 900 },
  ];
  const options = model.getCategoryFilterOptions(products, 'meubles');
  assert.equal(options.counts.materials.__proto__, 2);
  assert.equal(options.counts.styles.ancien, 2);
  assert.equal(options.maxPrice, 123.45);
});
