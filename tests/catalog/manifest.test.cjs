const assert = require('node:assert/strict');
const test = require('node:test');
const { products } = require('./fixtures/products.cjs');
const { buildPublicProjection, sha256 } = require('../../functions/src/catalog/publicProjection');
const { buildInventoryOverview } = require('../../functions/src/catalog/inventoryProjection');
const { buildSnapshotFiles } = require('../../functions/src/catalog/snapshotStorage');

test('snapshot manifest covers every immutable payload with deterministic checksums', () => {
  const projection = buildPublicProjection(products);
  const inventory = buildInventoryOverview(products);
  const first = buildSnapshotFiles({ projection, inventory, revision: 42, generatedAt: '2026-07-17T00:00:00.000Z' });
  const second = buildSnapshotFiles({ projection, inventory, revision: 42, generatedAt: '2026-07-17T00:00:00.000Z' });
  assert.deepEqual(first.manifest, second.manifest);
  assert.deepEqual(Object.keys(first.buffers).sort(), [
    'catalog-cards.json', 'catalog-full.json', 'checksums.json', 'inventory-overview.json',
    'manifest.json', 'media-index.json', 'search-index.json'
  ]);
  Object.entries(first.manifest.files).forEach(([name, metadata]) => {
    assert.equal(metadata.sha256, sha256(first.buffers[name].toString('utf8')));
    assert.equal(metadata.bytes, first.buffers[name].length);
  });
});
