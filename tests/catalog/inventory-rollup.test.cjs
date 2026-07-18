const assert = require('node:assert/strict');
const test = require('node:test');
const { products } = require('./fixtures/products.cjs');
const { buildInventoryOverview } = require('../../functions/src/catalog/inventoryProjection');

test('materialized inventory preserves the historical rollup semantics', () => {
  const overview = buildInventoryOverview(products);
  assert.deepEqual(overview, {
    totalStockValue: 390,
    totalItemsForSale: 4,
    totalItems: 4,
    soldItems: 0,
    publishedItems: 3,
  });
});

test('sold and zero-stock items are excluded from stock value', () => {
  const overview = buildInventoryOverview([
    { id: 'a', data: { status: 'published', currentPrice: 100, stock: 0, sold: false } },
    { id: 'b', data: { status: 'draft', startingPrice: 50, stock: 2, sold: true } },
  ]);
  assert.equal(overview.totalStockValue, 0);
  assert.equal(overview.totalItemsForSale, 0);
  assert.equal(overview.soldItems, 2);
  assert.equal(overview.publishedItems, 1);
});
