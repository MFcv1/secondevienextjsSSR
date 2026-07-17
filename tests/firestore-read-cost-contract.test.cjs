const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const loadPublicCatalogHandler = () => {
  let firestoreReadAttempts = 0;
  const db = {
    collection() {
      firestoreReadAttempts += 1;
      throw new Error('Firestore must not be reached for an invalid request');
    },
  };

  class Timestamp {
    constructor(seconds, nanoseconds = 0) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }
  }

  const firestore = () => db;
  firestore.Timestamp = Timestamp;
  const adminStub = { firestore };
  const functionsStub = { https: { onRequest: (handler) => handler } };
  const catalogPath = path.join(root, 'functions-public/src/public/catalog.js');
  const resolvedCatalogPath = require.resolve(catalogPath);
  const originalLoad = Module._load;

  delete require.cache[resolvedCatalogPath];
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === 'firebase-admin') return adminStub;
    if (request === 'firebase-functions/v1') return functionsStub;
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    return {
      handler: require(resolvedCatalogPath).publicCatalog,
      getFirestoreReadAttempts: () => firestoreReadAttempts,
    };
  } finally {
    Module._load = originalLoad;
    delete require.cache[resolvedCatalogPath];
  }
};

const createResponse = () => {
  const response = {
    body: null,
    headers: {},
    statusCode: 200,
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(value) {
      this.statusCode = value;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
    type() {
      return this;
    },
    send(value) {
      this.body = value;
      return this;
    },
  };
  return response;
};

test('publicCatalog rejects malformed pagination before Firestore', async () => {
  const { handler, getFirestoreReadAttempts } = loadPublicCatalogHandler();
  const cases = [
    { query: { limit: '0' }, error: 'invalid_limit' },
    { query: { limit: 'abc' }, error: 'invalid_limit' },
    { query: { limit: '' }, error: 'invalid_limit' },
    { query: { cursor: 'invalid' }, error: 'invalid_cursor' },
    { query: { limit: '10', cursor: 'invalid' }, error: 'invalid_cursor' },
  ];

  for (const scenario of cases) {
    const response = createResponse();
    await handler({
      method: 'GET',
      query: scenario.query,
      get: () => undefined,
    }, response);
    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.body, { error: scenario.error });
  }

  assert.equal(getFirestoreReadAttempts(), 0);
});

test('read-cost safeguards keep realtime quality and intent-based prefetch', () => {
  const catalog = read('functions-public/src/public/catalog.js');
  const search = read('app/api/search/route.js');
  const analyticsProvider = read('src/kit/shared/AnalyticsProvider.jsx');
  const updateUserSessions = read('functions/src/analytics/updateUserSessions.js');
  const galleryActions = read('src/kit/marketplace/GalleryGridActionsIsland.jsx');
  const premiumMenu = read('src/kit/marketplace/PremiumMegaMenuIsland.jsx');
  const adminPage = read('app/admin/page.jsx');
  const adminIsland = read('app/admin/AdminAppIsland.jsx');
  const adminCatalog = read('src/kit/admin/adminPublicCatalog.js');
  const adminDashboard = read('src/kit/admin/AdminDashboard.jsx');

  assert.ok(
    catalog.indexOf("if (hasLimit && !limit)") < catalog.indexOf('const catalogVersion = await readCatalogVersion()'),
    'invalid limits are rejected before the catalog version read',
  );
  assert.match(catalog, /const cursor = rawCursor \? canonicalizeCursor\(rawCursor\) : '';/);
  assert.match(search, /scope=cards&limit=120/);
  assert.doesNotMatch(search, /getPublicCatalog\('scope=cards&limit=160'\)/);
  assert.match(search, /getPublicCatalogFallback\(\{ limitCount: 160 \}\)/);

  assert.match(analyticsProvider, /document\.visibilityState !== 'visible'/);
  assert.match(analyticsProvider, /sessionActive: true,\s*ensureView: true/);
  assert.doesNotMatch(updateUserSessions, /db\.doc\(`users\/\$\{userId\}`\)/);
  assert.match(updateUserSessions, /const isAdmin = accessSnap\.exists/);

  assert.match(galleryActions, /const shouldPrefetchRoute = intent === 'hover' \|\| intent === 'press';/);
  assert.match(galleryActions, /if \(shouldPrefetchRoute && productUrl/);
  assert.match(premiumMenu, /onPointerEnter=\{\(\) => prefetchMenuHref\(href\)\}/);

  assert.doesNotMatch(adminPage, /getPublicCatalog|getPublicCatalogFallback|initialItems/);
  assert.match(adminIsland, /ADMIN_PUBLIC_CATALOG_TABS = new Set\(\['analytics', 'map', 'inventory'\]\)/);
  assert.match(adminIsland, /onMouseEnter=\{\(\) => handleAdminTabIntent\(tab\.id\)\}/);
  assert.match(adminIsland, /onFocus=\{\(\) => handleAdminTabIntent\(tab\.id\)\}/);
  assert.match(adminCatalog, /if \(inflightRequest\) return inflightRequest;/);
  assert.match(adminCatalog, /PUBLIC_ITEMS_FULL_CACHE_KEY/);
  assert.doesNotMatch(adminDashboard, /legacy furniture fallback|collection\(db, 'artifacts', appId, 'public', 'data', 'furniture'\)/);
});
