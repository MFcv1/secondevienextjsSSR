const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '../..');

class Timestamp {
  constructor(seconds, nanoseconds = 0) { this.seconds = seconds; this.nanoseconds = nanoseconds; }
}

const createDoc = (id, data) => ({ id, data: () => data, exists: data !== undefined });

function loadHandler({ products = [], meta = { catalogVersion: 'v1' }, metaError = null } = {}) {
  let reads = 0;
  class Ref {
    constructor(segments = [], query = {}) { this.segments = segments; this.query = query; }
    collection(name) { return new Ref([...this.segments, name], this.query); }
    doc(name) { return new Ref([...this.segments, name], this.query); }
    where(field, op, value) { return new Ref(this.segments, { ...this.query, where: [...(this.query.where || []), [field, op, value]] }); }
    orderBy(field, direction) { return new Ref(this.segments, { ...this.query, orderBy: [field, direction] }); }
    startAfter(value) { return new Ref(this.segments, { ...this.query, startAfter: value }); }
    limit(value) { return new Ref(this.segments, { ...this.query, limit: value }); }
    async get() {
      reads += 1;
      const joined = this.segments.join('/');
      if (joined === 'artifacts/secondevie/public/meta') {
        if (metaError) throw metaError;
        return createDoc('meta', meta);
      }
      const productPrefix = 'artifacts/secondevie/public/data/furniture/';
      if (joined.startsWith(productPrefix)) {
        const id = joined.slice(productPrefix.length);
        const product = products.find((item) => item.id === id);
        return createDoc(id, product?.data);
      }
      let filtered = [...products];
      for (const [field, op, value] of this.query.where || []) {
        if (op === '==') filtered = filtered.filter((item) => item.data[field] === value);
        if (op === 'in') filtered = filtered.filter((item) => value.includes(item.data[field]));
      }
      filtered.sort((left, right) => right.data.createdAt.seconds - left.data.createdAt.seconds);
      if (this.query.startAfter) {
        filtered = filtered.filter((item) => item.data.createdAt.seconds < this.query.startAfter.seconds);
      }
      if (this.query.limit) filtered = filtered.slice(0, this.query.limit);
      return { docs: filtered.map((item) => createDoc(item.id, item.data)) };
    }
  }
  const firestore = () => new Ref();
  firestore.Timestamp = Timestamp;
  const adminStub = { firestore };
  const functionsStub = { https: { onRequest: (handler) => handler } };
  const catalogPath = require.resolve(path.join(root, 'functions-public/src/public/catalog.js'));
  const originalLoad = Module._load;
  const previousSource = process.env.PUBLIC_CATALOG_SOURCE;
  process.env.PUBLIC_CATALOG_SOURCE = 'legacy';
  delete require.cache[catalogPath];
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === 'firebase-admin') return adminStub;
    if (request === 'firebase-functions/v1') return functionsStub;
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    const catalogModule = require(catalogPath);
    return { handler: catalogModule.publicCatalog, internals: catalogModule.__catalogInternals, reads: () => reads };
  } finally {
    Module._load = originalLoad;
    delete require.cache[catalogPath];
    if (previousSource === undefined) delete process.env.PUBLIC_CATALOG_SOURCE;
    else process.env.PUBLIC_CATALOG_SOURCE = previousSource;
  }
}

function response() {
  return {
    statusCode: 200, headers: {}, body: null,
    set(name, value) { this.headers[name] = value; return this; },
    status(value) { this.statusCode = value; return this; },
    type(value) { this.headers['Content-Type'] = value; return this; },
    json(value) { this.body = value; return this; },
    send(value) { this.body = value; return this; },
  };
}

function request(query = {}, headers = {}, method = 'GET') {
  return { method, query, get: (name) => headers[String(name).toLowerCase()] };
}

const fixtures = [
  {
    id: 'a',
    data: {
      status: 'published', name: 'A', description: 'Alpha', category: 'miroirs', stock: 1,
      createdAt: new Timestamp(300, 3), images: ['a.webp'], imageVariants: [{ thumb384: 'a-384.webp', full: 'a-full.webp' }]
    }
  },
  { id: 'b', data: { status: 'published', name: 'B', category: 'buffets', stock: 1, createdAt: new Timestamp(200, 2) } },
  { id: 'draft', data: { status: 'draft', name: 'Draft', createdAt: new Timestamp(100, 1) } },
];

test('historical list/card response shape and cache headers remain compatible', async () => {
  const { handler } = loadHandler({ products: fixtures });
  const res = response();
  await handler(request({ scope: 'cards', limit: '1' }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['Cache-Control'], 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
  const payload = JSON.parse(res.body);
  assert.deepEqual(Object.keys(payload).sort(), [
    'appId', 'catalogVersion', 'categories', 'collections', 'cursor', 'cursors', 'generatedAt',
    'limit', 'nextCursor', 'partial', 'scope'
  ].sort());
  assert.equal(payload.collections.furniture.length, 1);
  assert.equal(payload.collections.furniture[0].id, 'a');
  assert.deepEqual(payload.collections.furniture[0].imageVariants, [{ thumb384: 'a-384.webp' }]);
  assert.ok(payload.nextCursor);
});

test('product, 404 and origin failure remain distinct', async () => {
  const available = loadHandler({ products: fixtures });
  const found = response();
  await available.handler(request({ id: 'a' }), found);
  assert.equal(found.statusCode, 200);
  assert.equal(JSON.parse(found.body).product.id, 'a');

  const missing = response();
  await available.handler(request({ id: 'missing' }), missing);
  assert.equal(missing.statusCode, 404);
  assert.deepEqual(missing.body, { error: 'product_not_found' });

  const failing = loadHandler({ products: fixtures, metaError: new Error('origin down') });
  const unavailable = response();
  await failing.handler(request({ id: 'a' }), unavailable);
  assert.equal(unavailable.statusCode, 500);
  assert.deepEqual(unavailable.body, { error: 'catalog_unavailable' });
});

test('invalid pagination and OPTIONS perform zero backend reads', async () => {
  const invalid = loadHandler({ products: fixtures });
  const invalidResponse = response();
  await invalid.handler(request({ limit: '0' }), invalidResponse);
  assert.equal(invalidResponse.statusCode, 400);
  assert.equal(invalid.reads(), 0);

  const options = loadHandler({ products: fixtures });
  const optionsResponse = response();
  await options.handler(request({}, {}, 'OPTIONS'), optionsResponse);
  assert.equal(optionsResponse.statusCode, 204);
  assert.equal(options.reads(), 0);
});

test('ETag supports stable conditional 304 while payload is cached', async () => {
  const { handler } = loadHandler({ products: fixtures });
  const first = response();
  await handler(request({ scope: 'cards', limit: '1' }), first);
  const second = response();
  await handler(request({ scope: 'cards', limit: '1' }, { 'if-none-match': first.headers.ETag }), second);
  assert.equal(second.statusCode, 304);
  assert.equal(second.body, '');
});
