const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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

const readWorkspaceFile = (relativePath) => fs.readFileSync(path.join(__dirname, '..', '..', relativePath), 'utf8');

test('publication admin attend la projection publique exacte sans attendre le HTML ISR', () => {
  const client = readWorkspaceFile('src/kit/admin/productPublicationClient.js');
  const form = readWorkspaceFile('src/kit/admin/AdminForm.jsx');
  const workspace = readWorkspaceFile('src/kit/admin/AdminPublicationWorkspace.jsx');

  assert.match(client, /timeoutMs = 5 \* 60 \* 1000/);
  assert.match(client, /CATALOG_POLL_INTERVAL_MS = 750/);
  assert.match(client, /fetch\('\/api\/admin\/catalog-publication-status'/);
  assert.match(client, /authorization: `Bearer \$\{idToken\}`/);
  assert.doesNotMatch(client, /fetch\('\/api\/catalog\/version'/);
  assert.doesNotMatch(client, /fetch\('\/'/);
  assert.doesNotMatch(client, /sys_catalog_live/);
  assert.match(form, /publicationPhase !== 'complete' \|\| !completedProduct/);
  assert.match(form, /showPublishedProduct\(\)/);
  assert.match(workspace, /setView\('history'\)/);
});

test('apercu publication ne presente jamais un slug seul comme URL produit valide', () => {
  const form = readWorkspaceFile('src/kit/admin/AdminForm.jsx');
  const review = readWorkspaceFile('src/kit/admin/components/PublicationReviewStep.jsx');
  const preview = readWorkspaceFile('src/kit/admin/components/SitePublicationPreview.jsx');

  assert.match(form, /productId=\{editData\?\.id \|\| null\}/);
  assert.match(review, /productId=\{productId\}/);
  assert.match(preview, /getProductUrl\(\{ id: productId, title \}\)/);
  assert.match(preview, /id-apres-publication/);
  assert.doesNotMatch(preview, /const url = `secondevie\.fr\/produit\/\$\{slugify\(title\)\}`/);
});

test('progression admin annonce des etapes reelles sans faux pourcentage', () => {
  const dialog = readWorkspaceFile('src/kit/admin/components/PublicationProgressDialog.jsx');
  assert.match(dialog, /Étape \$\{Math\.min\(activeIndex \+ 1, phases\.length\)\}\/\$\{phases\.length\}/);
  assert.match(dialog, /Chaque coche correspond à une opération terminée/);
  assert.doesNotMatch(dialog, /percent|aria-valuenow|%<\/span>/);
});

test('liste admin prechargee pendant la creation et confirmation placee en bas', () => {
  const workspace = readWorkspaceFile('src/kit/admin/AdminPublicationWorkspace.jsx');
  assert.match(workspace, /view === 'create' \? 'h-full min-h-0' : 'hidden'/);
  assert.match(workspace, /view === 'history' \? 'h-full min-h-0' : 'hidden'/);
  assert.match(workspace, /key=\{formRevision\}/);
  assert.match(workspace, /setFormRevision\(\(current\) => current \+ 1\)/);
  assert.match(workspace, /fixed bottom-4 right-4/);
  assert.doesNotMatch(workspace, /fixed right-4 top-4/);
  assert.match(workspace, /pointer-events-auto fixed bottom-4 right-4/);
  assert.doesNotMatch(workspace, /pointer-events-none fixed bottom-4 right-4/);
  assert.match(workspace, /focusProduct=\$\{encodeURIComponent\(successNotice\.productId\)\}/);
  assert.match(workspace, /data-route-transition-variant="galleryReturn"/);
  assert.doesNotMatch(workspace, /target="_blank"/);
});

test('lien post-publication revele le meuble exact dans la galerie', () => {
  const liveGrid = readWorkspaceFile('src/kit/marketplace/GalleryLiveProductGridIsland.jsx');
  const sections = readWorkspaceFile('src/kit/marketplace/ProductSectionsServer.jsx');
  const card = readWorkspaceFile('src/kit/marketplace/GalleryProductCardServer.jsx');
  const transition = readWorkspaceFile('app/route-transition.config.js');
  const transitionIsland = readWorkspaceFile('app/RouteTransitionIsland.jsx');

  assert.match(liveGrid, /api\/catalog\?id=/);
  assert.match(liveGrid, /return \[focusedProduct, \.\.\.release\.items\]/);
  assert.match(liveGrid, /scrollIntoView/);
  assert.doesNotMatch(sections, /GalleryProductFocusIsland/);
  assert.doesNotMatch(liveGrid, /Votre dernière publication|data-gallery-focused-publication/);
  assert.match(card, /data-product-id=\{productId \|\| undefined\}/);
  assert.match(transition, /'\/': \{/);
  assert.match(transition, /variant: 'galleryCurtain'/);
  assert.match(transition, /galleryReturn:[\s\S]*showBrand: false/);
  assert.match(transitionIsland, /data-route-transition-variant/);
  assert.match(transitionIsland, /activeVariant\.showBrand === false \? null/);
});

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
    { id: 'archived', data: { status: 'archived', name: 'Historique', stock: 1, currentPrice: 10 } },
  ]);
  assert.deepEqual(result.full.map((item) => item.id), ['published']);
  assert.equal(buildInventoryOverview([
    { id: 'published', data: { status: 'published', stock: 1, currentPrice: 10 } },
    { id: 'archived', data: { status: 'archived', stock: 1, currentPrice: 10 } },
  ]).totalItems, 1);
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
  assert.equal(inventory.totalStockValue, 340);
  assert.equal(inventory.totalItemsForSale, 3);
  assert.equal(inventory.soldItems, 0);
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
  assert.equal(price.affectsGallery, true);
  assert.ok(price.paths.includes('/'));

  for (const patch of [
    { stock: 0 },
    { sold: true },
    { stock: 1, sold: false },
    { name: 'Miroir actualise' },
  ]) {
    const plan = planFor(mutate('mirror-a', patch));
    if (!Object.hasOwn(patch, 'name')) assert.equal(plan.products[0].purchasabilityChanged, true);
    assert.equal(plan.mode, 'targeted');
    assert.equal(plan.affectsGallery, true);
    assert.ok(plan.paths.includes('/'));
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
  assert.equal(planFor(createdSource).affectsGallery, true);
  const unpublished = planFor(mutate('mirror-a', { status: 'draft' }));
  const deleted = planFor(products.filter((product) => product.id !== 'mirror-a'));
  assert.equal(unpublished.products[0].changeType, 'deleted');
  assert.equal(deleted.products[0].changeType, 'deleted');
  assert.equal(unpublished.affectsGallery, true);
  assert.equal(deleted.affectsGallery, true);
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
