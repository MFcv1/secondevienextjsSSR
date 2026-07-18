const assert = require('node:assert/strict');
const test = require('node:test');
const { products } = require('./fixtures/products.cjs');
const { buildInventoryOverview } = require('../../functions/src/catalog/inventoryProjection');
const { buildPublicProjection, sha256, toPublicProduct } = require('../../functions/src/catalog/publicProjection');
const { buildSnapshotFiles } = require('../../functions/src/catalog/snapshotStorage');

test('projection publique: allowlist, statut, prix et stock zero', () => {
  const projected = toPublicProduct('zero-stock', {
    status: 'published', name: 'Zero', stock: 0, sold: true, currentPrice: 125,
    images: [], buyerId: 'secret', refundedFromOrderId: 'secret-order',
  });
  assert.equal(projected.stock, 0);
  assert.equal(projected.sold, true);
  assert.equal(projected.currentPrice, 125);
  assert.equal(projected.buyerId, undefined);
  assert.equal(projected.refundedFromOrderId, undefined);

  const result = buildPublicProjection([
    { id: 'published', data: { status: 'published', name: 'Visible', stock: 1, currentPrice: 10 } },
    { id: 'draft', data: { status: 'draft', name: 'Cache', stock: 1, currentPrice: 10 } },
  ]);
  assert.deepEqual(result.full.map((item) => item.id), ['published']);
  assert.deepEqual(buildPublicProjection([]).full, []);
});

test('manifeste et inventaire sont deterministes et integralement hashes', () => {
  const projection = buildPublicProjection(products);
  const inventory = buildInventoryOverview(products);
  const first = buildSnapshotFiles({ projection, inventory, revision: 42, generatedAt: '2026-07-18T00:00:00.000Z' });
  const second = buildSnapshotFiles({ projection, inventory, revision: 42, generatedAt: '2026-07-18T00:00:00.000Z' });
  assert.deepEqual(first.manifest, second.manifest);
  Object.entries(first.manifest.files).forEach(([name, metadata]) => {
    assert.equal(metadata.sha256, sha256(first.buffers[name].toString('utf8')));
    assert.equal(metadata.bytes, first.buffers[name].length);
  });
  assert.equal(inventory.totalStockValue, 390);
});
