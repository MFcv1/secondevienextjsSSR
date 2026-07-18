const assert = require('node:assert/strict');
const test = require('node:test');
const { recordCatalogMutation } = require('../../functions/src/catalog/onCatalogSourceWrite');
const { dispatchBuildRequest } = require('../../functions/src/catalog/buildCatalogSnapshot');

class FakeSnapshot {
  constructor(value) { this.value = value; this.exists = value !== undefined; }
  data() { return this.value; }
}

class FakeDocumentRef {
  constructor(db, path) { this.db = db; this.path = path; }
  async get() { return new FakeSnapshot(this.db.values.get(this.path)); }
  async set(value, options = {}) {
    const previous = this.db.values.get(this.path) || {};
    this.db.values.set(this.path, options.merge ? { ...previous, ...value } : value);
  }
}

class FakeFirestore {
  constructor() { this.values = new Map(); this.tail = Promise.resolve(); }
  doc(path) { return new FakeDocumentRef(this, path); }
  runTransaction(callback) {
    const result = this.tail.then(async () => {
      const writes = [];
      const transaction = {
        get: async (ref) => ref.get(),
        set: (ref, value, options = {}) => writes.push({ ref, value, options }),
      };
      const value = await callback(transaction);
      for (const write of writes) await write.ref.set(write.value, write.options);
      return value;
    });
    this.tail = result.catch(() => {});
    return result;
  }
}

const before = {
  status: 'published', name: 'Produit', description: 'Description', category: 'tables',
  stock: 3, sold: false, currentPrice: 100,
};

test('one event delivered 100 times assigns one monotone revision and stores no product payload', async () => {
  const db = new FakeFirestore();
  const taskIds = new Set();
  const enqueue = async ({ taskId }) => {
    const alreadyExists = taskIds.has(taskId);
    taskIds.add(taskId);
    return { scheduled: true, alreadyExists };
  };
  const dependencies = {
    db,
    enqueue,
    now: () => new Date('2026-07-17T00:00:00.000Z'),
    logger: () => {},
  };
  for (let index = 0; index < 100; index += 1) {
    await recordCatalogMutation(dependencies, {
      eventId: 'same-event', appId: 'secondevie', productId: 'p1',
      before, after: { ...before, stock: 2 },
    });
  }
  const control = db.values.get('sys_catalog_publication/secondevie');
  assert.equal(control.desiredRevision, 1);
  assert.equal(taskIds.size, 1);
  const ledger = [...db.values.entries()].find(([path]) => path.startsWith('sys_catalog_publication_events/'))[1];
  assert.equal(ledger.assignedRevision, 1);
  assert.equal(ledger.before, undefined);
  assert.equal(ledger.after, undefined);
  assert.equal(ledger.buyerId, undefined);
});

test('50 mutations coalesce into one build scan after the quiet window', async () => {
  const db = new FakeFirestore();
  const tasks = [];
  let nowMs = Date.parse('2026-07-17T00:00:00.000Z');
  const dependencies = {
    db,
    enqueue: async (task) => { tasks.push(task); return { scheduled: true, alreadyExists: false }; },
    now: () => new Date(nowMs),
    logger: () => {},
  };
  for (let index = 0; index < 50; index += 1) {
    await recordCatalogMutation(dependencies, {
      eventId: `event-${index}`, appId: 'secondevie', productId: `p-${index}`,
      before, after: { ...before, stock: 2 },
    });
    nowMs += 20;
  }
  const control = db.values.get('sys_catalog_publication/secondevie');
  assert.equal(control.desiredRevision, 50);
  assert.ok(control.quietUntil.getTime() <= Date.parse('2026-07-17T00:00:05.000Z'));

  nowMs = Date.parse('2026-07-17T00:00:06.000Z');
  let scans = 0;
  const build = async ({ db: buildDb }, input) => {
    scans += 1;
    const ref = buildDb.doc('sys_catalog_publication/secondevie');
    await ref.set({ dirty: false, publishedRevision: input.targetRevision }, { merge: true });
    return { result: 'published', revision: input.targetRevision };
  };
  for (const task of tasks) {
    await dispatchBuildRequest({ db, now: () => new Date(nowMs), build, enqueueSuccessor: async () => 'successor' }, {
      targetRevision: task.revision,
    });
  }
  assert.equal(scans, 1);
  assert.equal(db.values.get('sys_catalog_publication/secondevie').publishedRevision, 50);
});

test('out-of-order deliveries only advance revisions and never replay stale state', async () => {
  const db = new FakeFirestore();
  const observed = [];
  const dependencies = {
    db,
    enqueue: async ({ revision }) => { observed.push(revision); return { scheduled: true }; },
    now: () => new Date('2026-07-17T00:00:00.000Z'),
    logger: () => {},
  };
  for (const [eventId, stock] of [['C', 0], ['A', 2], ['B', 1]]) {
    await recordCatalogMutation(dependencies, {
      eventId, appId: 'secondevie', productId: 'p1', before, after: { ...before, stock },
    });
  }
  assert.deepEqual(observed, [1, 2, 3]);
  assert.equal(db.values.get('sys_catalog_publication/secondevie').desiredRevision, 3);
});
