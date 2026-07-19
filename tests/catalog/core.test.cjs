const assert = require('node:assert/strict');
const test = require('node:test');
const { products } = require('./fixtures/products.cjs');
const { buildInventoryOverview } = require('../../functions/src/catalog/inventoryProjection');
const { buildPublicProjection, sha256, toPublicProduct } = require('../../functions/src/catalog/publicProjection');
const { buildSnapshotFiles } = require('../../functions/src/catalog/snapshotStorage');
const {
  MAX_IMPACT_PRODUCTS,
  buildImpactPlan,
  validateImpactPlan,
} = require('../../functions/src/catalog/impactPlan');
const { getCatalogProductPath, slugifyCatalogValue } = require('../../functions/src/catalog/catalogRoutes');

const mutate = (id, patch) => products.map((product) => (
  product.id === id ? { ...product, data: { ...product.data, ...patch } } : product
));
const planFor = (afterSource, revision = 43) => {
  const before = buildPublicProjection(products);
  const after = buildPublicProjection(afterSource);
  return buildImpactPlan({
    beforeProducts: before.full,
    afterProducts: after.full,
    revision,
    aggregateSha256: after.aggregateSha256,
    generatedAt: '2026-07-19T00:00:00.000Z',
  });
};

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

test('prix, stock zero et suppression changent exactement la projection publiee', () => {
  const initial = buildPublicProjection(products);
  const priceChanged = buildPublicProjection(products.map((product) => (
    product.id === 'mirror-a'
      ? { ...product, data: { ...product.data, currentPrice: 145 } }
      : product
  )));
  const zeroStock = buildPublicProjection(products.map((product) => (
    product.id === 'mirror-a'
      ? { ...product, data: { ...product.data, stock: 0 } }
      : product
  )));
  const deleted = buildPublicProjection(products.filter((product) => product.id !== 'mirror-a'));

  assert.notEqual(priceChanged.aggregateSha256, initial.aggregateSha256);
  assert.equal(priceChanged.full.find((product) => product.id === 'mirror-a').currentPrice, 145);
  assert.notEqual(zeroStock.aggregateSha256, initial.aggregateSha256);
  assert.equal(zeroStock.full.find((product) => product.id === 'mirror-a').stock, 0);
  assert.notEqual(deleted.aggregateSha256, initial.aggregateSha256);
  assert.equal(deleted.full.some((product) => product.id === 'mirror-a'), false);
});

test('plan impact cible prix, stock, vente, image et ordre editorial sans invalider tout le catalogue', () => {
  const price = planFor(mutate('mirror-a', { currentPrice: 145 }));
  assert.equal(price.mode, 'targeted');
  assert.deepEqual(price.changedProductIds, ['mirror-a']);
  assert.ok(price.paths.includes('/produit/miroir-a-mirror-a'));
  assert.ok(price.paths.includes('/categorie/miroirs'));
  assert.ok(price.paths.includes('/categorie/decorations'));
  assert.ok(price.paths.includes('/api/search'));
  assert.equal(price.paths.includes('/sitemap.xml'), false);

  for (const patch of [{ stock: 0 }, { sold: true }, { stock: 1, sold: false }]) {
    const plan = planFor(mutate('mirror-a', patch));
    assert.equal(plan.products[0].purchasabilityChanged, true);
    assert.equal(plan.mode, 'targeted');
  }

  const image = planFor(mutate('mirror-a', {
    images: ['https://example.test/a-v2.webp'],
    imageVariants: [{ thumb384: 'https://example.test/a-v2-384.webp', detailFast: 'https://example.test/a-v2-detail.webp' }],
  }));
  assert.equal(image.affectsSitemap, true);
  assert.ok(image.paths.includes('/sitemap.xml'));

  const orderOnly = planFor(mutate('mirror-a', { nouveautesOrder: 1 }));
  assert.equal(orderOnly.affectsGallery, true);
  assert.equal(orderOnly.affectsSearch, false);
  assert.equal(orderOnly.affectsSitemap, false);
  assert.equal(orderOnly.paths.includes('/api/search'), false);
});

test('plan impact conserve ancien et nouveau slug, categories parentes, creation, depublication et suppression', () => {
  const renamed = planFor(mutate('mirror-a', { name: 'Miroir Etoile', category: 'chaises' }));
  assert.equal(renamed.products[0].beforePath, '/produit/miroir-a-mirror-a');
  assert.equal(renamed.products[0].afterPath, '/produit/miroir-etoile-mirror-a');
  assert.deepEqual(renamed.affectedCategoryIds, ['assises', 'chaises', 'decorations', 'miroirs']);
  renamed.products[0].beforePath = '/produit/autre-identite';
  assert.throws(() => validateImpactPlan(renamed), /HASH_MISMATCH/);

  const createdSource = [...products, {
    id: 'chair-created',
    data: { status: 'published', name: 'Chaise Creee', category: 'chaises', stock: 1, currentPrice: 90 },
  }];
  assert.equal(planFor(createdSource).products.find((item) => item.id === 'chair-created').changeType, 'created');
  assert.equal(planFor(mutate('mirror-a', { status: 'draft' })).products[0].changeType, 'deleted');
  assert.equal(planFor(products.filter((product) => product.id !== 'mirror-a')).products[0].changeType, 'deleted');
});

test('plan impact est deterministe, accepte un diff vide et bascule en full aux bornes', () => {
  const projection = buildPublicProjection(products);
  const first = buildImpactPlan({
    beforeProducts: [...projection.full].reverse(),
    afterProducts: projection.full,
    revision: 44,
    aggregateSha256: projection.aggregateSha256,
    generatedAt: '2026-07-19T00:00:00.000Z',
  });
  const second = buildImpactPlan({
    beforeProducts: projection.full,
    afterProducts: [...projection.full].reverse(),
    revision: 44,
    aggregateSha256: projection.aggregateSha256,
    generatedAt: '2026-07-20T00:00:00.000Z',
  });
  assert.deepEqual(first.paths, []);
  assert.deepEqual(first.products, []);
  assert.equal(first.planHash, second.planHash);

  const many = Array.from({ length: MAX_IMPACT_PRODUCTS + 1 }, (_, index) => ({
    id: `p-${index}`,
    status: 'published',
    name: `Produit ${index}`,
    category: 'tables',
    stock: 1,
    currentPrice: 1,
  }));
  const aggregateSha256 = sha256(many);
  const full = buildImpactPlan({ beforeProducts: [], afterProducts: many, revision: 45, aggregateSha256 });
  assert.equal(full.mode, 'full');
  assert.equal(full.fullReason, 'impact_limit_exceeded');
  assert.throws(() => validateImpactPlan({ ...full, mode: 'unknown' }), /MODE_INVALID/);
});

test('routes Functions gardent la parite de slug et le snapshot hash le plan immutable', async () => {
  const product = { id: 'id espace/42', name: 'Commode Étoile -- Ànaïs' };
  assert.equal(slugifyCatalogValue(product.name), 'commode-etoile-anais');
  assert.equal(getCatalogProductPath(product), '/produit/commode-etoile-anais-id%20espace%2F42');

  const projection = buildPublicProjection(products);
  const inventory = buildInventoryOverview(products);
  const impactPlan = buildImpactPlan({
    beforeProducts: [], afterProducts: projection.full, revision: 46,
    aggregateSha256: projection.aggregateSha256,
    generatedAt: '2026-07-19T00:00:00.000Z',
  });
  const snapshot = buildSnapshotFiles({
    projection, inventory, revision: 46,
    generatedAt: '2026-07-19T00:00:00.000Z', impactPlan,
  });
  assert.ok(snapshot.buffers['impact-plan.json']);
  assert.equal(snapshot.manifest.impactPlanSha256, snapshot.manifest.files['impact-plan.json'].sha256);
  assert.deepEqual(JSON.parse(snapshot.buffers['impact-plan.json']), impactPlan);

  const { slugify } = await import('../../src/utils/slug.js');
  assert.equal(slugify(product.name), slugifyCatalogValue(product.name));
  const { extractProductId } = await import('../../src/lib/server/productRoute.js');
  const routeProducts = [{ id: 'a' }, { id: 'mirror-a' }, { id: 'id espace' }];
  assert.equal(extractProductId('miroir-etoile-mirror-a', routeProducts), 'mirror-a');
  assert.equal(extractProductId('miroir-id%20espace', routeProducts), 'id espace');
  assert.equal(extractProductId('mirror-a', routeProducts), 'mirror-a');
});
