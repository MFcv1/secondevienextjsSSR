const assert = require('node:assert/strict');
const test = require('node:test');
const { products } = require('./fixtures/products.cjs');
const {
  buildPublicProjection,
  sha256,
  stableStringify,
  toPublicProduct,
} = require('../../functions/src/catalog/publicProjection');

test('public projection uses an explicit allowlist and excludes sensitive fields', () => {
  const projected = toPublicProduct(products[0].id, products[0].data);
  assert.equal(projected.id, 'mirror-a');
  assert.equal(projected.collectionName, 'furniture');
  assert.equal(projected.buyerId, undefined);
  assert.equal(projected.stripePaymentIntentId, undefined);
  assert.equal(projected.adminNotes, undefined);
  assert.deepEqual(projected.createdAt, { nanoseconds: 3, seconds: 300 });
});

test('projection and aggregate hashes are deterministic across source ordering', () => {
  const first = buildPublicProjection(products);
  const second = buildPublicProjection([...products].reverse());
  assert.equal(first.aggregateSha256, second.aggregateSha256);
  assert.deepEqual(first.full, second.full);
  assert.equal(first.full.length, 2);
  assert.deepEqual(Object.keys(first.productHashes), ['mirror-a', 'mirror-b']);
});

test('card projection keeps only the first optimized media variants', () => {
  const projection = buildPublicProjection(products);
  const card = projection.cards.find((item) => item.id === 'mirror-a');
  assert.deepEqual(card.imageVariants, [{ thumb384: 'https://example.test/a-384.webp' }]);
  assert.equal(card.imageVariants[0].full, undefined);
  assert.equal(card.imageUrl, 'https://example.test/a.webp');
});

test('canonical JSON rejects non-serializable values and sorts object keys', () => {
  assert.equal(stableStringify({ z: 1, a: { y: 2, b: 3 } }), '{"a":{"b":3,"y":2},"z":1}');
  assert.equal(sha256({ b: 2, a: 1 }), sha256({ a: 1, b: 2 }));
  assert.throws(() => stableStringify({ invalid: Number.NaN }), /Non-finite/);
  const circular = {};
  circular.self = circular;
  assert.throws(() => stableStringify(circular), /Circular/);
});
