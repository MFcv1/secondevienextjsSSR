const assert = require('node:assert/strict');
const test = require('node:test');
const { products } = require('./fixtures/products.cjs');
const { buildInventoryOverview } = require('../../functions/src/catalog/inventoryProjection');
const { buildPublicProjection } = require('../../functions/src/catalog/publicProjection');
const {
  buildSnapshotFiles,
  publishCurrentPointer,
  readCurrentPointer,
  readLastKnownGoodPointer,
  readPreviousPointer,
  verifyStoredRelease,
  writeImmutableRelease,
} = require('../../functions/src/catalog/snapshotStorage');
const { acquireLease, initialPublicationState } = require('../../functions/src/catalog/publicationState');

class FakeFile {
  constructor(name, store) { this.name = name; this.store = store; }
  async save(buffer, options = {}) {
    const current = this.store.get(this.name);
    const expected = options.preconditionOpts?.ifGenerationMatch;
    const generation = current ? current.generation : 0;
    if (expected !== undefined && Number(expected) !== generation) throw Object.assign(new Error('precondition'), { code: 412 });
    this.store.set(this.name, { buffer: Buffer.from(buffer), generation: generation + 1 });
  }
  async download() { return [Buffer.from(this.store.get(this.name).buffer)]; }
  async exists() { return [this.store.has(this.name)]; }
  async getMetadata() {
    const value = this.store.get(this.name);
    return [{ generation: String(value.generation), size: String(value.buffer.length) }];
  }
}
class FakeBucket {
  constructor() { this.store = new Map(); }
  file(name) { return new FakeFile(name, this.store); }
}

const release = async (bucket, revision) => {
  const projection = buildPublicProjection(products);
  const inventory = buildInventoryOverview(products);
  return writeImmutableRelease(bucket, buildSnapshotFiles({
    projection, inventory, revision, generatedAt: `2026-07-18T00:00:0${revision}.000Z`,
  }), revision);
};

test('publication CAS conserve current, previous et last-known-good valides', async () => {
  const bucket = new FakeBucket();
  let current = null;
  for (const revision of [1, 2, 3]) {
    const nextRelease = await release(bucket, revision);
    const published = await publishCurrentPointer(bucket, {
      revision,
      release: nextRelease,
      previous: current?.value || null,
      expectedGeneration: current?.generation || 0,
    });
    current = await readCurrentPointer(bucket);
    assert.equal(published.pointer.revision, revision);
  }
  const previous = await readPreviousPointer(bucket);
  const lastKnownGood = await readLastKnownGoodPointer(bucket);
  assert.equal(current.value.revision, 3);
  assert.equal(previous.value.revision, 2);
  assert.equal(lastKnownGood.value.revision, 1);
  await Promise.all([
    verifyStoredRelease(bucket, current.value),
    verifyStoredRelease(bucket, previous.value),
    verifyStoredRelease(bucket, lastKnownGood.value),
  ]);
  await assert.rejects(publishCurrentPointer(bucket, {
    revision: 4,
    release: await release(bucket, 4),
    previous: current.value,
    expectedGeneration: 0,
  }), (error) => Number(error.code) === 412);
});

test('seuls les modes active et paused ont un effet', () => {
  const now = new Date('2026-07-18T00:00:00.000Z');
  const active = { ...initialPublicationState(now), mode: 'active', dirty: true, desiredRevision: 1 };
  assert.ok(acquireLease(active, { targetRevision: 1, token: 'lease', now }));
  assert.equal(acquireLease({ ...active, mode: 'paused' }, { targetRevision: 1, token: 'lease', now }), null);
  assert.ok(acquireLease({ ...active, mode: 'legacy' }, { targetRevision: 1, token: 'lease', now }));
});
