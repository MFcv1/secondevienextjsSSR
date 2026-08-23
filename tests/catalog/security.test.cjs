const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  markCatalogRevalidationFailure,
  revalidateCatalog,
  signRevalidationBody,
  verifyServedCatalog,
} = require('../../functions/src/catalog/catalogRevalidation');
const { buildImpactPlan } = require('../../functions/src/catalog/impactPlan');
const { sha256 } = require('../../functions/src/catalog/publicProjection');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const readTree = (folder) => fs.readdirSync(path.join(root, folder), { recursive: true })
  .filter((file) => /\.(?:js|jsx)$/.test(file))
  .map((file) => read(path.join(folder, file)))
  .join('\n');

const response = ({ status = 200, json = {}, text = '', contentType = 'application/json' } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (name) => name.toLowerCase() === 'content-type' ? contentType : null },
  json: async () => json,
  text: async () => text,
});

class FakeDb {
  constructor(control) { this.values = new Map([['sys_catalog_publication/secondevie', { ...control }]]); }
  doc(target) { return { path: target }; }
  async runTransaction(callback) {
    return callback({
      get: async (ref) => {
        const value = this.values.get(ref.path);
        return { exists: Boolean(value), data: () => value ? { ...value } : undefined };
      },
      set: (ref, patch, options = {}) => {
        this.values.set(ref.path, options.merge ? { ...(this.values.get(ref.path) || {}), ...patch } : { ...patch });
      },
    });
  }
}

const buildSignedPlan = (revision = 7) => {
  const before = [{ id: 'mirror-a', name: 'Miroir A', category: 'miroirs', stock: 1, currentPrice: 100 }];
  const after = [{ ...before[0], name: 'Miroir Etoile', currentPrice: 120 }];
  const aggregateSha256 = sha256(after);
  const impactPlan = buildImpactPlan({ beforeProducts: before, afterProducts: after, revision, aggregateSha256 });
  return { aggregateSha256, impactPlan };
};

test('Firestore public ne lit pas les meubles et public/meta a disparu', () => {
  const rules = read('firestore.rules');
  assert.match(rules, /match \/artifacts\/\{appId\}\/public\/data\/\{collectionName\}\/\{itemId\}[\s\S]*?allow read: if isStrongArtisan\(\);/);
  assert.doesNotMatch(rules, /public\/meta/);
});

test('la confirmation admin lit le pointeur frais sans ouvrir un contournement public du cache', () => {
  const route = read('app/api/admin/catalog-publication-status/route.js');
  const authorization = read('src/lib/server/adminAuthorization.js');
  const publicRoute = read('app/api/catalog/route.js');
  assert.match(route, /authorizeAdminRequest\(request\)/);
  assert.match(authorization, /verifyIdToken\(token, true\)/);
  assert.match(authorization, /verifyToken\(appCheckToken\)/);
  assert.match(authorization, /sys_admin_access/);
  assert.match(authorization, /hasAal2/);
  assert.match(route, /pointerCache: 'fresh'/);
  assert.match(route, /cache-control': 'no-store/);
  assert.doesNotMatch(publicRoute, /searchParams\.get\('fresh'\)/);
});

test('signature HMAC est stable et lie timestamp et corps', () => {
  const first = signRevalidationBody('secret', '100', '{"revision":1}');
  assert.equal(first, signRevalidationBody('secret', '100', '{"revision":1}'));
  assert.notEqual(first, signRevalidationBody('secret', '101', '{"revision":1}'));
  assert.notEqual(first, signRevalidationBody('secret', '100', '{"revision":2}'));
});

test('contrat de revalidation valide projet, audience, plan exact et signature non expiree', async () => {
  const { validateCatalogRevalidationBody, getCatalogRevalidationTargets, verifyCatalogMachineSignature } = await import('../../src/lib/server/catalogRevalidationContract.js');
  const { aggregateSha256, impactPlan } = buildSignedPlan();
  const body = {
    schemaVersion: 1,
    projectId: 'secondevienextjsssr',
    audience: 'https://example.test',
    revision: 7,
    manifestSha256: 'a'.repeat(64),
    aggregateSha256,
    impactPlanPath: 'catalog-projection/v1/releases/r7/impact-plan.json',
    impactPlanSha256: 'b'.repeat(64),
    planHash: impactPlan.planHash,
    mode: impactPlan.mode,
    impactPlan,
  };
  const contract = validateCatalogRevalidationBody(body, {
    projectId: 'secondevienextjsssr', audience: 'https://example.test',
  });
  const targets = getCatalogRevalidationTargets(contract);
  assert.ok(targets.pathEntries.some(({ path: target }) => target === '/produit/miroir-a-mirror-a'));
  assert.ok(targets.pathEntries.some(({ path: target }) => target === '/produit/miroir-etoile-mirror-a'));
  assert.equal(targets.pathEntries.some(({ path: target }) => target === '/produit/[slugOrId]'), false);
  assert.equal(targets.pathEntries.some(({ path: target }) => target === '/sitemap.xml'), true);

  assert.throws(() => validateCatalogRevalidationBody({ ...body, audience: 'https://evil.test' }, {
    projectId: 'secondevienextjsssr', audience: 'https://example.test',
  }), /invalid_audience/);
  assert.throws(() => validateCatalogRevalidationBody({ ...body, impactPlan: { ...impactPlan, paths: ['/admin'] } }, {
    projectId: 'secondevienextjsssr', audience: 'https://example.test',
  }), /invalid_plan_hash/);

  const rawBody = JSON.stringify(body);
  const timestamp = '1000';
  const signature = signRevalidationBody('secret', timestamp, rawBody);
  assert.equal(verifyCatalogMachineSignature({ secret: 'secret', timestamp, signature, rawBody, nowSeconds: 1100 }), true);
  assert.equal(verifyCatalogMachineSignature({ secret: 'secret', timestamp, signature, rawBody, nowSeconds: 1400 }), false);
  assert.equal(verifyCatalogMachineSignature({ secret: 'secret', timestamp, signature, rawBody: `${rawBody} `, nowSeconds: 1100 }), false);
});

test('dispatcher refuse redirection et JSON incoherent, et N ne peut pas marquer N+1 sain', async () => {
  const { aggregateSha256, impactPlan } = buildSignedPlan(7);
  const input = {
    revision: 7,
    manifestSha256: 'a'.repeat(64),
    aggregateSha256,
    impactPlanSha256: 'b'.repeat(64),
    planHash: impactPlan.planHash,
    impactPlan,
  };
  const base = {
    db: new FakeDb({ stateVersion: 4, publishedRevision: 7, currentManifestSha256: input.manifestSha256 }),
    endpoint: 'https://example.test/api/revalidate-catalog', secret: 'secret', projectId: 'secondevienextjsssr',
    now: () => new Date('2026-07-19T00:00:00.000Z'), delayImpl: async () => {}, logger: () => {},
  };
  await assert.rejects(revalidateCatalog({ ...base, fetchImpl: async () => response({ status: 307 }) }, input), /REDIRECT_REFUSED/);
  await assert.rejects(revalidateCatalog({
    ...base,
    fetchImpl: async () => response({ json: { ok: true, acceptedRevision: 99 } }),
  }, input), /RESPONSE_IDENTITY_MISMATCH/);

  const newerDb = new FakeDb({
    stateVersion: 9,
    publishedRevision: 8,
    currentManifestSha256: 'd'.repeat(64),
    buildState: 'published',
  });
  const fetchImpl = async (url, options = {}) => {
    if (options.method === 'POST') return response({ json: {
      ok: true,
      projectId: 'secondevienextjsssr',
      acceptedRevision: 7,
      manifestSha256: input.manifestSha256,
      aggregateSha256,
      planHash: impactPlan.planHash,
      mode: impactPlan.mode,
    } });
    if (String(url).includes('/api/catalog/version')) return response({ json: { revision: 7, aggregateSha256 } });
    if (String(url).includes('/produit/miroir-a-mirror-a')) {
      return response({ status: 404, contentType: 'text/html', text: 'Not found' });
    }
    return response({ contentType: 'text/html', text: `<main data-catalog-version="${aggregateSha256}"></main>` });
  };
  const result = await revalidateCatalog({ ...base, db: newerDb, fetchImpl }, input);
  assert.equal(result.result, 'stale');
  assert.equal(newerDb.values.get('sys_catalog_publication/secondevie').publishedRevision, 8);
  assert.equal(newerDb.values.has('sys_catalog_live/current'), false);

  const currentDb = new FakeDb({
    stateVersion: 10,
    publishedRevision: 7,
    currentManifestSha256: input.manifestSha256,
    desiredRevision: 7,
    buildState: 'verifying_served_version',
  });
  const currentFetchImpl = async (url, options = {}) => {
    if (!options.method && !String(url).includes('/api/catalog/version')) {
      assert.equal(currentDb.values.has('sys_catalog_live/current'), true);
    }
    return fetchImpl(url, options);
  };
  const accepted = await revalidateCatalog({ ...base, db: currentDb, fetchImpl: currentFetchImpl }, input);
  assert.equal(accepted.result, 'revalidated');
  assert.equal(currentDb.values.get('sys_catalog_publication/secondevie').servedState, 'observed');
  const signal = currentDb.values.get('sys_catalog_live/current');
  assert.deepEqual({ ...signal, publishedAt: Boolean(signal.publishedAt) }, {
    schemaVersion: 1,
    revision: 7,
    aggregateSha256,
    changedProductIds: ['mirror-a'],
    affectedCategoryIds: ['decorations', 'miroirs'],
    affectsGallery: true,
    affectsSearch: true,
    full: false,
    publishedAt: true,
  });
});

test('preuve HTML ancienne reste served failed et reparable', async () => {
  const { aggregateSha256, impactPlan } = buildSignedPlan(7);
  const fetchImpl = async (url) => String(url).includes('/api/catalog/version')
    ? response({ json: { revision: 7, aggregateSha256 } })
    : response({ contentType: 'text/html', text: '<main data-catalog-version="old"></main>' });
  await assert.rejects(
    verifyServedCatalog(fetchImpl, 'https://example.test/api/revalidate-catalog', {
      revision: 7, manifestSha256: 'a'.repeat(64), aggregateSha256,
    }, impactPlan, async () => {}),
    /CATALOG_SERVED_ROUTE_STALE/,
  );
  const db = new FakeDb({
    stateVersion: 1, publishedRevision: 7, currentManifestSha256: 'a'.repeat(64),
    invalidationState: 'accepted', servedState: 'pending',
  });
  const input = {
    revision: 7,
    manifestSha256: 'a'.repeat(64),
    aggregateSha256,
    impactPlanSha256: 'b'.repeat(64),
    planHash: impactPlan.planHash,
    impactPlan,
  };
  const revalidationFetch = async (url, options = {}) => {
    if (options.method === 'POST') return response({ json: {
      ok: true,
      projectId: 'secondevienextjsssr',
      acceptedRevision: 7,
      manifestSha256: input.manifestSha256,
      aggregateSha256,
      planHash: impactPlan.planHash,
      mode: impactPlan.mode,
    } });
    return fetchImpl(url, options);
  };
  await assert.rejects(revalidateCatalog({
    db,
    endpoint: 'https://example.test/api/revalidate-catalog',
    secret: 'secret',
    projectId: 'secondevienextjsssr',
    now: () => new Date('2026-07-19T00:00:00.000Z'),
    delayImpl: async () => {},
    logger: () => {},
    fetchImpl: revalidationFetch,
  }, input), /CATALOG_SERVED_ROUTE_STALE/);
  const earlySignal = db.values.get('sys_catalog_live/current');
  assert.equal(earlySignal.aggregateSha256, aggregateSha256);
  assert.equal(earlySignal.affectsGallery, true);

  await markCatalogRevalidationFailure(db, { revision: 7, manifestSha256: 'a'.repeat(64) }, {
    code: 'CATALOG_SERVED_ROUTE_STALE', message: 'CATALOG_SERVED_ROUTE_STALE',
  });
  const state = db.values.get('sys_catalog_publication/secondevie');
  assert.equal(state.invalidationState, 'accepted');
  assert.equal(state.servedState, 'failed');
  assert.equal(state.buildState, 'degraded');
});

test('archivage accepte la disparition 404 de l ancienne fiche et verifie les surfaces restantes', async () => {
  const before = [{
    id: 'product-archive', name: 'Chevet archive', category: 'commodes',
    status: 'published', stock: 0, currentPrice: 25,
  }];
  const aggregateSha256 = sha256([]);
  const impactPlan = buildImpactPlan({
    beforeProducts: before,
    afterProducts: [],
    revision: 8,
    aggregateSha256,
  });
  const fetchedPaths = [];
  const fetchImpl = async (url) => {
    const path = new URL(String(url)).pathname;
    fetchedPaths.push(path);
    if (path === '/api/catalog/version') {
      return response({ json: { revision: 8, aggregateSha256 } });
    }
    if (path.startsWith('/produit/')) {
      return response({ status: 404, contentType: 'text/html', text: 'Not found' });
    }
    return response({
      contentType: 'text/html',
      text: `<main data-catalog-version="${aggregateSha256}"></main>`,
    });
  };

  await assert.doesNotReject(verifyServedCatalog(fetchImpl, 'https://example.test/api/revalidate-catalog', {
    revision: 8,
    manifestSha256: 'a'.repeat(64),
    aggregateSha256,
  }, impactPlan, async () => {}));
  assert.ok(fetchedPaths.some((path) => path.startsWith('/produit/chevet-archive-')));
  assert.ok(fetchedPaths.includes('/'));
  assert.ok(fetchedPaths.includes('/categorie/commodes'));
});

test('aucun moteur catalogue legacy ne subsiste dans le code executable', () => {
  const executable = [
    read('app/api/catalog/route.js'),
    read('src/lib/server/products.js'),
    read('src/lib/server/env.js'),
    read('functions/index.js'),
    read('firebase.json'),
  ].join('\n');
  assert.doesNotMatch(executable, /publicCatalog|PUBLIC_CATALOG_SOURCE|snapshot_canary|x-catalog-canary|functions-public/);
  assert.match(read('functions/src/catalog/catalogReconciler.js'), /if \(!impactPlan && !pendingPlanDeclared\)/);
  assert.equal(fs.existsSync(path.join(root, 'scripts/e2e-hosted-stripe-checkout.mjs')), false);
  const createOrder = read('functions/src/commerce/createOrder.js');
  assert.match(createOrder, /reason: 'price_changed'/);
  assert.equal((createOrder.match(/itemDb\.status !== 'published'/g) || []).length, 2);
  assert.equal((createOrder.match(/itemDb\.currentPrice \?\? itemDb\.startingPrice \?\? itemDb\.price/g) || []).length, 2);
  assert.doesNotMatch(createOrder, /itemDb\.currentPrice \|\| itemDb\.startingPrice/);

  const revalidationRoute = read('app/api/revalidate-catalog/route.js');
  assert.match(revalidationRoute, /validateCatalogRevalidationBody/);
  assert.match(revalidationRoute, /audience: publicEnv\.siteUrl/);
  assert.match(revalidationRoute, /revalidateTag\(tag,\s*\{\s*expire:\s*0\s*\}\)/);
  assert.doesNotMatch(revalidationRoute, /audience: new URL\(request\.url\)\.origin/);
  assert.match(read('src/lib/server/catalogRevalidationContract.js'), /catalog:api-pointer/);
  assert.doesNotMatch(revalidationRoute, /revalidatePath\([^\n]+,\s*'route'\)/);
});

test('images, categorie, warmup et navigation respectent le contrat unifie', () => {
  const marketplace = readTree('src/kit/marketplace');
  const layout = readTree('src/kit/layout');
  const category = read('src/kit/marketplace/CategoryServerView.jsx');
  const gallery = read('src/kit/marketplace/ProductSectionsServer.jsx');
  const liveGallery = read('src/kit/marketplace/GalleryLiveProductGridIsland.jsx');
  const media = read('src/kit/marketplace/ProductCardMediaServer.jsx');
  const imageUtils = read('src/utils/imageUtils.js');
  const gridActions = read('src/kit/marketplace/GalleryGridActionsIsland.jsx');
  const productMediaFlow = `${category}\n${gallery}\n${liveGallery}\n${media}\n${gridActions}`;
  assert.equal((category.match(/\{filteredItems\.map\(/g) || []).length, 1);
  assert.match(category, /priority=\{index < 3\}/);
  assert.match(liveGallery, /priority=\{false\}/);
  assert.match(media, /srcSet=\{cardImage\.srcSet/);
  assert.doesNotMatch(media, /dominantColor/);
  assert.doesNotMatch(media, /blurDataUrl/);
  assert.match(media, /data-product-media-state="loading"/);
  assert.match(media, /data-product-image-state="loading"/);
  assert.match(gridActions, /image\.decode\(\)/);
  assert.match(gridActions, /setProductImageState\(image, 'ready'\)/);
  assert.match(gridActions, /document\.addEventListener\('load', onProductImageLoad, true\)/);
  assert.doesNotMatch(media, /\.full\b/);
  assert.doesNotMatch(`${productMediaFlow}\n${imageUtils}`, /deferImagesUntilCalm|data-image-loaded|data-image-cold|data-cold-scroll-deferred/);
  assert.doesNotMatch(marketplace, /data-cold-scroll-deferred|deferred-section-(?:placeholder|reveal)|footer-delivery-image-in/);
  assert.equal((gridActions.match(/new Image\(/g) || []).length, 0);
  assert.match(imageUtils, /MAX_CONCURRENT_IMAGE_WARMUPS = 2/);
  assert.match(imageUtils, /export const clearQueuedProductImageWarmups/);
  assert.match(gridActions, /clearQueuedProductImageWarmups\(\);\s*warmupProduct/);
  assert.ok((gridActions.match(/clearQueuedProductImageWarmups\(\)/g) || []).length >= 2);
  const cardSrcSetHelper = imageUtils.slice(
    imageUtils.indexOf('const cardSrcSet'),
    imageUtils.indexOf('const thumbSrcSet'),
  );
  assert.doesNotMatch(cardSrcSetHelper, /primary\?\.medium|primary\?\.large|primary\?\.full/);
  assert.match(imageUtils, /saveData/);
  assert.match(imageUtils, /\(\^\|-\)2g\$/);
  assert.match(gridActions, /intent === 'hover' \|\| intent === 'press'/);
  assert.doesNotMatch(`${marketplace}\n${layout}`, /window\.location\.assign/);
  assert.doesNotMatch(marketplace, /<a[^>]+href=["']\/(?![#])/);
  assert.match(marketplace, /href=\{`tel:/);
  assert.match(marketplace, /href=\{`mailto:/);
  assert.match(marketplace, /target="_blank"/);

  const fixture = require('./fixtures/build-snapshot.cjs');
  assert.ok(fixture.full[0].imageVariants[0].detailFast);
  assert.ok(fixture.full[0].imageMetadata[0].dominantColor);
});

test('endpoint version retourne contractuellement 200 puis 304 sans donnees produit', async () => {
  const { getCatalogVersionHttpState } = await import('../../src/lib/server/catalogVersionContract.js');
  const snapshot = require('./fixtures/build-snapshot.cjs');
  const cold = getCatalogVersionHttpState(snapshot);
  assert.equal(cold.status, 200);
  assert.deepEqual(Object.keys(cold.payload).sort(), ['aggregateSha256', 'publishedAt', 'revision']);
  const warm = getCatalogVersionHttpState(snapshot, cold.headers.etag);
  assert.equal(warm.status, 304);
  assert.equal(warm.headers.etag, cold.headers.etag);
});

test('ile de version ecoute un seul document uniquement dans les onglets visibles et sans polling', () => {
  const island = read('src/kit/marketplace/CatalogVersionSyncIsland.jsx');
  const liveGallery = read('src/kit/marketplace/GalleryLiveProductGridIsland.jsx');
  assert.match(island, /doc\(db, 'sys_catalog_live', 'current'\)/);
  assert.match(island, /document\.visibilityState !== 'visible'/);
  assert.match(island, /visibilitychange/);
  assert.match(island, /pageshow/);
  assert.match(island, /router\.refresh\(\)/);
  assert.match(island, /refreshedVersionsRef/);
  assert.match(island, /confirmSignaledVersion/);
  assert.match(liveGallery, /api\/catalog\?scope=cards&limit=48/);
  assert.match(liveGallery, /payload\?\.aggregateSha256 === aggregateSha256/);
  assert.match(liveGallery, /sv:catalog-version-changed/);
  assert.match(liveGallery, /setRelease/);
  assert.doesNotMatch(island, /setInterval|furniture/);
  const rules = read('firestore.rules');
  assert.match(rules, /match \/sys_catalog_live\/\{docId\}[\s\S]*allow read: if docId == 'current';[\s\S]*allow write: if false;/);
});

test('la fixture de build catalogue reste strictement bornee a la CI', () => {
  assert.match(read('.github/workflows/quality.yml'), /CATALOG_BUILD_FIXTURE:\s*["']true["']/);
  assert.doesNotMatch(read('apphosting.yaml'), /CATALOG_BUILD_FIXTURE/);
  assert.match(read('src/lib/server/materializedCatalog.js'), /process\.env\.CATALOG_BUILD_FIXTURE !== 'true'/);
});
