const crypto = require('node:crypto');

const SUPPORTED_CONTRACT_VERSIONS = new Set([1]);
const sha256 = (input) => crypto.createHash('sha256').update(input).digest('hex');

function assertContractVersion(value) {
  if (!SUPPORTED_CONTRACT_VERSIONS.has(Number(value))) {
    throw new Error(`CATALOG_SCHEMA_UNSUPPORTED:${value}`);
  }
}

function validateMaterializedRelease({ pointer, manifestBody, manifest, fullBody, fullBundle, cardsBody, cardsBundle }) {
  if (!pointer?.manifestPath || !pointer?.manifestSha256) throw new Error('CATALOG_POINTER_INVALID');
  if (Number(pointer.schemaVersion) !== 1) throw new Error('CATALOG_POINTER_SCHEMA_UNSUPPORTED');
  assertContractVersion(pointer.projectionContractVersion);
  if (sha256(manifestBody) !== pointer.manifestSha256) throw new Error('CATALOG_MANIFEST_HASH_MISMATCH');
  if (Number(manifest?.schemaVersion) !== 1) throw new Error('CATALOG_MANIFEST_SCHEMA_UNSUPPORTED');
  assertContractVersion(manifest.projectionContractVersion);
  if (Number(manifest.revision) !== Number(pointer.revision)) throw new Error('CATALOG_REVISION_MISMATCH');
  if (sha256(fullBody) !== manifest.files?.['catalog-full.json']?.sha256) throw new Error('CATALOG_FULL_HASH_MISMATCH');
  if (sha256(cardsBody) !== manifest.files?.['catalog-cards.json']?.sha256) throw new Error('CATALOG_CARDS_HASH_MISMATCH');

  for (const [name, bundle] of [['catalog-full.json', fullBundle], ['catalog-cards.json', cardsBundle]]) {
    if (Number(bundle?.schemaVersion) !== 1) throw new Error(`CATALOG_BUNDLE_SCHEMA_UNSUPPORTED:${name}`);
    if (Number(bundle.projectionContractVersion) !== Number(manifest.projectionContractVersion)) {
      throw new Error(`CATALOG_BUNDLE_CONTRACT_MISMATCH:${name}`);
    }
    if (Number(bundle.revision) !== Number(pointer.revision)) throw new Error(`CATALOG_BUNDLE_REVISION_MISMATCH:${name}`);
  }
  const full = Array.isArray(fullBundle.products) ? fullBundle.products : null;
  const cards = Array.isArray(cardsBundle.products) ? cardsBundle.products : null;
  if (!full || !cards) throw new Error('CATALOG_PRODUCTS_INVALID');
  if (full.length !== Number(manifest.productCount) || cards.length !== full.length) {
    throw new Error('CATALOG_PRODUCT_COUNT_MISMATCH');
  }
  if (full.some((product, index) => product.id !== cards[index]?.id)) throw new Error('CATALOG_CARD_ORDER_MISMATCH');
  return {
    revision: Number(pointer.revision),
    catalogVersion: String(pointer.revision),
    generatedAt: manifest.generatedAt,
    aggregateSha256: manifest.aggregateSha256,
    manifestSha256: pointer.manifestSha256,
    full,
    cards,
  };
}

module.exports = { SUPPORTED_CONTRACT_VERSIONS, sha256, validateMaterializedRelease };
