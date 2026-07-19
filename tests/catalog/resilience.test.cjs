const assert = require('node:assert/strict');
const test = require('node:test');
const { products } = require('./fixtures/products.cjs');
const { buildInventoryOverview } = require('../../functions/src/catalog/inventoryProjection');
const { buildPublicProjection } = require('../../functions/src/catalog/publicProjection');
const {
  POINTER_PATHS,
  SNAPSHOT_ROOT,
  buildSnapshotFiles,
  publishCurrentPointer,
  readCurrentPointer,
  readLastKnownGoodPointer,
  readPointerState,
  readPreviousPointer,
  verifyStoredRelease,
  writeImmutableRelease,
  writePointer,
} = require('../../functions/src/catalog/snapshotStorage');
const {
  acquireLease,
  assertLease,
  buildRollbackControlUpdate,
  initialPublicationState,
  needsCatalogRevalidation,
} = require('../../functions/src/catalog/publicationState');
const { collectRetainedSnapshotPaths } = require('../../functions/src/catalog/mediaGarbageCollection');
const { planReleaseGarbageCollection } = require('../../functions/src/catalog/releaseGarbageCollection');

class FakeFile {
  constructor(name, store) { this.name = name; this.store = store; }
  async save(buffer, options = {}) {
    const current = this.store.get(this.name);
    const expected = options.preconditionOpts?.ifGenerationMatch;
    const generation = current ? current.generation : 0;
    if (expected !== undefined && Number(expected) !== generation) throw Object.assign(new Error('precondition'), { code: 412 });
    this.store.set(this.name, {
      buffer: Buffer.from(buffer),
      generation: generation + 1,
      timeCreated: current?.timeCreated || new Date().toISOString(),
    });
  }
  async download() { return [Buffer.from(this.store.get(this.name).buffer)]; }
  async exists() { return [this.store.has(this.name)]; }
  async getMetadata() {
    const value = this.store.get(this.name);
    return [{ generation: String(value.generation), size: String(value.buffer.length), timeCreated: value.timeCreated }];
  }
}
class FakeBucket {
  constructor() { this.store = new Map(); }
  file(name) { return new FakeFile(name, this.store); }
  async getFiles({ prefix }) {
    return [[...this.store.keys()].filter((name) => name.startsWith(prefix)).map((name) => this.file(name))];
  }
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
  const [currentAfterConflict, previousAfterConflict, lastKnownGoodAfterConflict] = await Promise.all([
    readCurrentPointer(bucket),
    readPreviousPointer(bucket),
    readLastKnownGoodPointer(bucket),
  ]);
  assert.equal(currentAfterConflict.value.revision, 3);
  assert.equal(previousAfterConflict.value.revision, 2);
  assert.equal(lastKnownGoodAfterConflict.value.revision, 1);
});

test('rollback conserve le high-water mark et force la revalidation de l identite cible', () => {
  const current = {
    revision: 41,
    manifestPath: `${SNAPSHOT_ROOT}/releases/r41-current/manifest.json`,
    manifestSha256: 'a'.repeat(64),
  };
  const target = {
    revision: 40,
    manifestPath: `${SNAPSHOT_ROOT}/releases/r40-previous/manifest.json`,
    manifestSha256: 'b'.repeat(64),
  };
  const update = buildRollbackControlUpdate({
    desiredRevision: 41,
    publishedRevision: 41,
    revalidatedRevision: 41,
    revalidatedManifestSha256: current.manifestSha256,
  }, { current, target, currentPointerGeneration: '12' });

  assert.equal(update.desiredRevision, 41);
  assert.equal(update.publishedRevision, 40);
  assert.equal(update.revalidatedRevision, null);
  assert.equal(update.revalidatedManifestSha256, null);
  assert.equal(Math.max(update.desiredRevision, update.publishedRevision) + 1, 42);
  assert.equal(needsCatalogRevalidation(update, target), true);
});

test('seuls les modes active et paused ont un effet', () => {
  const now = new Date('2026-07-18T00:00:00.000Z');
  const active = { ...initialPublicationState(now), mode: 'active', dirty: true, desiredRevision: 1 };
  assert.ok(acquireLease(active, { targetRevision: 1, token: 'lease', now }));
  assert.equal(acquireLease({ ...active, mode: 'paused' }, { targetRevision: 1, token: 'lease', now }), null);
  assert.ok(acquireLease({ ...active, mode: 'legacy' }, { targetRevision: 1, token: 'lease', now }));
  assert.throws(
    () => assertLease({ ...active, mode: 'paused', leaseToken: 'lease', leaseRevision: 1 }, 'lease', 1),
    /BUILD_PAUSED/
  );
});

test('un retry apres publication partielle repare previous et last-known-good', async () => {
  const bucket = new FakeBucket();
  let current = null;
  for (const revision of [1, 2, 3]) {
    const nextRelease = await release(bucket, revision);
    await publishCurrentPointer(bucket, {
      revision,
      release: nextRelease,
      previous: current?.value || null,
      expectedGeneration: current?.generation || 0,
    });
    current = await readCurrentPointer(bucket);
  }

  const release4 = await release(bucket, 4);
  const pointer4 = {
    revision: 4,
    manifestPath: release4.manifestPath,
    manifestSha256: release4.manifestSha256,
  };
  await writePointer(bucket, POINTER_PATHS.current, pointer4, current.generation);
  const partialCurrent = await readCurrentPointer(bucket);
  await publishCurrentPointer(bucket, {
    revision: 4,
    release: release4,
    previous: current.value,
    lastKnownGood: (await readPreviousPointer(bucket)).value,
    expectedGeneration: partialCurrent.generation,
  });

  assert.equal((await readCurrentPointer(bucket)).value.revision, 4);
  assert.equal((await readPreviousPointer(bucket)).value.revision, 3);
  assert.equal((await readLastKnownGoodPointer(bucket)).value.revision, 2);
});

test('une release rejetee par rollback ne peut pas devenir last-known-good', async () => {
  const bucket = new FakeBucket();
  let current = null;
  const releases = new Map();
  for (const revision of [1, 2, 3]) {
    const nextRelease = await release(bucket, revision);
    releases.set(revision, nextRelease);
    await publishCurrentPointer(bucket, {
      revision,
      release: nextRelease,
      previous: current?.value || null,
      expectedGeneration: current?.generation || 0,
    });
    current = await readCurrentPointer(bucket);
  }
  const rejected = current.value;
  await writePointer(bucket, POINTER_PATHS.current, {
    revision: 2,
    manifestPath: releases.get(2).manifestPath,
    manifestSha256: releases.get(2).manifestSha256,
  }, current.generation);
  const rolledBack = await readCurrentPointer(bucket);
  const release4 = await release(bucket, 4);
  await publishCurrentPointer(bucket, {
    revision: 4,
    release: release4,
    previous: rolledBack.value,
    lastKnownGood: rejected,
    excludedManifestSha256: rejected.manifestSha256,
    expectedGeneration: rolledBack.generation,
  });

  assert.equal((await readPreviousPointer(bucket)).value.revision, 2);
  assert.equal((await readLastKnownGoodPointer(bucket)).value.revision, 1);
});

test('le GC protege les pointeurs, les dix dernieres releases et la grace', async () => {
  const bucket = new FakeBucket();
  let current = null;
  for (let revision = 1; revision <= 14; revision += 1) {
    const nextRelease = await release(bucket, revision);
    const createdAt = new Date(`2026-06-${String(revision).padStart(2, '0')}T00:00:00.000Z`).toISOString();
    for (const [name, value] of bucket.store) {
      if (name.startsWith(nextRelease.releasePrefix)) value.timeCreated = createdAt;
    }
    await publishCurrentPointer(bucket, {
      revision,
      release: nextRelease,
      previous: current?.value || null,
      expectedGeneration: current?.generation || 0,
    });
    current = await readCurrentPointer(bucket);
  }

  const plan = await planReleaseGarbageCollection(bucket, {
    now: new Date('2026-07-18T00:00:00.000Z'),
    graceMs: 48 * 60 * 60 * 1000,
    minimumRecent: 10,
  });
  assert.equal(plan.totalReleases, 14);
  assert.equal(plan.retained.length, 10);
  assert.equal(plan.candidates.length, 4);
  assert.ok(plan.retained.some((item) => item.prefix.includes('/r14-')));
  assert.ok(plan.retained.some((item) => item.prefix.includes('/r12-')));
});

test('le GC media protege explicitement current, previous et last-known-good', async () => {
  const bucket = new FakeBucket();
  const pointer = (revision) => ({
    revision,
    manifestPath: `${SNAPSHOT_ROOT}/releases/r${revision}-media/manifest.json`,
    manifestSha256: String(revision).padStart(64, '0'),
  });
  for (let revision = 1; revision <= 14; revision += 1) {
    const mediaPath = `${SNAPSHOT_ROOT}/releases/r${revision}-media/media-index.json`;
    await bucket.file(mediaPath).save(Buffer.from(JSON.stringify({
      products: [{ id: `p${revision}`, urls: [`gs://catalog/furniture/r${revision}.webp`] }],
    })));
    bucket.store.get(mediaPath).timeCreated = `2026-05-${String(revision).padStart(2, '0')}T00:00:00.000Z`;
  }
  await writePointer(bucket, POINTER_PATHS.current, pointer(14));
  await writePointer(bucket, POINTER_PATHS.previous, pointer(2));
  await writePointer(bucket, POINTER_PATHS.lastKnownGood, pointer(1));

  const retained = await collectRetainedSnapshotPaths(bucket, new Date('2026-07-18T00:00:00.000Z'));
  assert.ok(retained.has('furniture/r14.webp'));
  assert.ok(retained.has('furniture/r2.webp'));
  assert.ok(retained.has('furniture/r1.webp'));
});

test('le GC media refuse de supprimer si un pointeur est corrompu', async () => {
  const bucket = new FakeBucket();
  await bucket.file(POINTER_PATHS.previous).save(Buffer.from('{invalid-json'));
  const state = await readPointerState(bucket, POINTER_PATHS.previous);
  assert.ok(state.error);
  assert.equal(state.generation, '1');
  await assert.rejects(
    collectRetainedSnapshotPaths(bucket),
    /CATALOG_JSON_INVALID/
  );
});
