const assert = require('node:assert/strict');
const test = require('node:test');
const { classifyCatalogMutation } = require('../../functions/src/catalog/mutationClassifier');

const base = {
  status: 'published', name: 'Table', description: 'Table ancienne', category: 'tables',
  stock: 2, sold: false, currentPrice: 300, buyerId: 'private-a'
};

test('private/admin-only mutations do not rebuild the public projection', () => {
  const result = classifyCatalogMutation({
    productId: 'table-a',
    before: base,
    after: { ...base, buyerId: 'private-b', adminNotes: 'changed' }
  });
  assert.equal(result.publicImpact, false);
  assert.equal(result.inventoryImpact, false);
});

test('stock, price, publication and editorial changes are classified', () => {
  const stock = classifyCatalogMutation({ productId: 'table-a', before: base, after: { ...base, stock: 1 } });
  assert.equal(stock.publicImpact, true);
  assert.equal(stock.inventoryImpact, true);
  assert.deepEqual(stock.changedPublicFields, ['stock']);

  const editorial = classifyCatalogMutation({
    productId: 'table-a', before: base, after: { ...base, nouveautesOrder: 4 }
  });
  assert.equal(editorial.publicImpact, true);
  assert.equal(editorial.inventoryImpact, false);
});

test('duplicate and out-of-order event payloads are safely reduced to final fingerprints', () => {
  const first = classifyCatalogMutation({ productId: 'table-a', before: base, after: { ...base, stock: 1 } });
  const duplicate = classifyCatalogMutation({ productId: 'table-a', before: base, after: { ...base, stock: 1 } });
  assert.equal(first.afterFingerprint, duplicate.afterFingerprint);
  const final = classifyCatalogMutation({ productId: 'table-a', before: { ...base, stock: 1 }, after: { ...base, stock: 3 } });
  assert.notEqual(final.afterFingerprint, first.afterFingerprint);
});

test('draft-only edits do not schedule a public rebuild', () => {
  const before = { status: 'draft', name: 'Brouillon', internalNote: 'a' };
  const after = { ...before, name: 'Brouillon retouche', internalNote: 'b' };
  const result = classifyCatalogMutation({ productId: 'draft', before, after });
  assert.equal(result.publicImpact, false);
  assert.equal(result.inventoryImpact, false);
});

test('E2E visibility transitions are public mutations even though flags are private', () => {
  const hidden = classifyCatalogMutation({
    productId: 'table-a',
    before: base,
    after: { ...base, e2eOnly: true }
  });
  assert.equal(hidden.publicImpact, true);
  const restored = classifyCatalogMutation({
    productId: 'table-a',
    before: { ...base, e2ePurpose: 'checkout' },
    after: base
  });
  assert.equal(restored.publicImpact, true);
});
