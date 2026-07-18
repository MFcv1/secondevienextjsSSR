const assert = require('node:assert/strict');
const test = require('node:test');
const { buildPublicProjection, sha256 } = require('../../functions/src/catalog/publicProjection');
const { buildInventoryOverview } = require('../../functions/src/catalog/inventoryProjection');
const { buildSnapshotFiles } = require('../../functions/src/catalog/snapshotStorage');
const { validateMaterializedRelease } = require('../../src/lib/server/materializedCatalogValidation.cjs');
const { products: sourceProducts } = require('./fixtures/products.cjs');

function fixture() {
  const projection = buildPublicProjection(sourceProducts);
  const inventory = buildInventoryOverview(sourceProducts);
  const { buffers, manifest } = buildSnapshotFiles({
    projection,
    inventory,
    revision: 7,
    generatedAt: '2026-07-17T12:00:00.000Z',
  });
  const manifestBody = buffers['manifest.json'].toString('utf8');
  return {
    pointer: {
      schemaVersion: 1,
      projectionContractVersion: 1,
      revision: 7,
      manifestPath: 'catalog-projection/v1/releases/r7/manifest.json',
      manifestSha256: sha256(manifestBody),
    },
    manifest,
    manifestBody,
    fullBody: buffers['catalog-full.json'].toString('utf8'),
    fullBundle: JSON.parse(buffers['catalog-full.json']),
    cardsBody: buffers['catalog-cards.json'].toString('utf8'),
    cardsBundle: JSON.parse(buffers['catalog-cards.json']),
  };
}

test('reader accepts a complete checksummed release', () => {
  const snapshot = validateMaterializedRelease(fixture());
  assert.equal(snapshot.revision, 7);
  assert.equal(snapshot.full.length, snapshot.cards.length);
});

test('reader rejects corrupt manifests, unknown contracts and card drift', () => {
  const corrupt = fixture();
  corrupt.manifestBody += ' ';
  assert.throws(() => validateMaterializedRelease(corrupt), /MANIFEST_HASH_MISMATCH/);

  const unknown = fixture();
  unknown.pointer.projectionContractVersion = 2;
  assert.throws(() => validateMaterializedRelease(unknown), /SCHEMA_UNSUPPORTED/);

  const drift = fixture();
  drift.cardsBundle.products[0].id = 'drifted-id';
  drift.cardsBody = JSON.stringify(drift.cardsBundle);
  drift.manifest.files['catalog-cards.json'].sha256 = sha256(drift.cardsBody);
  drift.manifestBody = JSON.stringify(drift.manifest);
  drift.pointer.manifestSha256 = sha256(drift.manifestBody);
  assert.throws(() => validateMaterializedRelease(drift), /CARD_ORDER_MISMATCH/);
});
