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
  readJsonObjectState,
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
  buildRollbackPreparationUpdate,
  computeQuietUntil,
  initialPublicationState,
  isRollbackActive,
  needsCatalogRevalidation,
  nextStateVersion,
} = require('../../functions/src/catalog/publicationState');
const { collectRetainedSnapshotPaths } = require('../../functions/src/catalog/mediaGarbageCollection');
const { planReleaseGarbageCollection } = require('../../functions/src/catalog/releaseGarbageCollection');
const { reconcileCatalog } = require('../../functions/src/catalog/catalogReconciler');
const { renewBuildLease } = require('../../functions/src/catalog/buildCatalogSnapshot');

class FakeFile {
  constructor(name, bucket, options = {}) {
    this.name = name;
    this.bucket = bucket;
    this.store = bucket.store;
    this.requestedGeneration = options.generation ? Number(options.generation) : null;
  }
  value() {
    if (this.requestedGeneration === null) return this.store.get(this.name);
    return this.bucket.versions.get(`${this.name}:${this.requestedGeneration}`);
  }
  async save(buffer, options = {}) {
    const current = this.store.get(this.name);
    const expected = options.preconditionOpts?.ifGenerationMatch;
    const generation = current ? current.generation : 0;
    if (expected !== undefined && Number(expected) !== generation) throw Object.assign(new Error('precondition'), { code: 412 });
    const value = {
      buffer: Buffer.from(buffer),
      generation: generation + 1,
      timeCreated: current?.timeCreated || new Date().toISOString(),
    };
    this.store.set(this.name, value);
    this.bucket.versions.set(`${this.name}:${value.generation}`, { ...value, buffer: Buffer.from(value.buffer) });
  }
  async download() {
    if (this.requestedGeneration !== null && this.bucket.onPinnedDownload) {
      await this.bucket.onPinnedDownload(this.name, this.requestedGeneration);
    }
    const value = this.value();
    if (!value) throw Object.assign(new Error('generation missing'), { code: 404 });
    return [Buffer.from(value.buffer)];
  }
  async exists() { return [this.store.has(this.name)]; }
  async getMetadata() {
    const value = this.value();
    if (!value) throw Object.assign(new Error('generation missing'), { code: 404 });
    return [{ generation: String(value.generation), size: String(value.buffer.length), timeCreated: value.timeCreated }];
  }
}
class FakeBucket {
  constructor() { this.store = new Map(); this.versions = new Map(); this.onPinnedDownload = null; }
  file(name, options) { return new FakeFile(name, this, options); }
  async getFiles({ prefix }) {
    return [[...this.store.keys()].filter((name) => name.startsWith(prefix)).map((name) => this.file(name))];
  }
}

class FakeDb {
  constructor(values = {}) { this.values = new Map(Object.entries(values)); }
  doc(target) {
    return {
      path: target,
      get: async () => {
        const value = this.values.get(target);
        return { exists: Boolean(value), data: () => value ? { ...value } : undefined };
      },
      set: async (patch, options = {}) => {
        this.values.set(target, options.merge ? { ...(this.values.get(target) || {}), ...patch } : { ...patch });
      },
    };
  }
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

class SerializedFakeDb extends FakeDb {
  constructor(values = {}) {
    super(values);
    this.transactionTail = Promise.resolve();
  }
  runTransaction(callback) {
    const run = this.transactionTail.then(() => super.runTransaction(callback));
    this.transactionTail = run.catch(() => null);
    return run;
  }
}

const release = async (bucket, revision) => {
  const projection = buildPublicProjection(products);
  const inventory = buildInventoryOverview(products);
  return writeImmutableRelease(bucket, buildSnapshotFiles({
    projection, inventory, revision, generatedAt: `2026-07-18T00:00:0${revision}.000Z`,
  }), revision);
};

test('le debounce catalogue privilegie la publication interactive sans perdre la borne de lot', () => {
  const nowMs = Date.parse('2026-08-08T18:00:00.000Z');
  assert.equal(
    computeQuietUntil({ nowMs, publicFields: ['name', 'images'] }).getTime() - nowMs,
    750
  );
  assert.equal(
    computeQuietUntil({ nowMs, publicFields: ['stock', 'currentPrice'] }).getTime() - nowMs,
    500
  );
  assert.equal(
    computeQuietUntil({ dirtySince: new Date(nowMs - 4800), nowMs, publicFields: ['name'] }).getTime() - nowMs,
    200
  );
});

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

test('lecture pointeur epingle metadata et corps a une seule generation', async () => {
  const bucket = new FakeBucket();
  await bucket.file(POINTER_PATHS.current).save(Buffer.from(JSON.stringify({ revision: 1, marker: 'old' })));
  let replaced = false;
  bucket.onPinnedDownload = async (name, generation) => {
    if (replaced || name !== POINTER_PATHS.current || generation !== 1) return;
    replaced = true;
    await bucket.file(name).save(Buffer.from(JSON.stringify({ revision: 2, marker: 'new' })));
  };
  const state = await readJsonObjectState(bucket, POINTER_PATHS.current);
  assert.equal(state.generation, '1');
  assert.deepEqual(state.value, { revision: 1, marker: 'old' });
  assert.equal((await readJsonObjectState(bucket, POINTER_PATHS.current)).value.revision, 2);
});

test('lecture pointeur recommence si la generation epinglee disparait pendant le telechargement', async () => {
  const bucket = new FakeBucket();
  await bucket.file(POINTER_PATHS.current).save(Buffer.from(JSON.stringify({ revision: 1 })));
  let replaced = false;
  bucket.onPinnedDownload = async (name, generation) => {
    if (replaced || name !== POINTER_PATHS.current || generation !== 1) return;
    replaced = true;
    bucket.versions.delete(`${name}:${generation}`);
    await bucket.file(name).save(Buffer.from(JSON.stringify({ revision: 2 })));
  };
  const state = await readJsonObjectState(bucket, POINTER_PATHS.current);
  assert.equal(state.generation, '2');
  assert.equal(state.value.revision, 2);
});

test('un CAS current reussi puis une panne callback reste identifiable et reparable sans rotation prematuree', async () => {
  const bucket = new FakeBucket();
  const release1 = await release(bucket, 1);
  await publishCurrentPointer(bucket, { revision: 1, release: release1, expectedGeneration: 0 });
  const current1 = await readCurrentPointer(bucket);
  const release2 = await release(bucket, 2);
  await assert.rejects(publishCurrentPointer(bucket, {
    revision: 2,
    release: release2,
    previous: current1.value,
    expectedGeneration: current1.generation,
    onCurrentCommitted: async () => { throw new Error('FIRESTORE_AFTER_CAS'); },
  }), /FIRESTORE_AFTER_CAS/);
  assert.equal((await readCurrentPointer(bucket)).value.revision, 2);
  assert.equal(await readPreviousPointer(bucket), null);

  const partial = await readCurrentPointer(bucket);
  await publishCurrentPointer(bucket, {
    revision: 2,
    release: release2,
    previous: current1.value,
    expectedGeneration: partial.generation,
  });
  assert.equal((await readPreviousPointer(bucket)).value.revision, 1);
});

test('le reconciler finalise pointer_committed_control_pending sans creer une autre release', async () => {
  const bucket = new FakeBucket();
  const prepared = await release(bucket, 2);
  const published = await writePointer(bucket, POINTER_PATHS.current, {
    revision: 2,
    manifestPath: prepared.manifestPath,
    manifestSha256: prepared.manifestSha256,
    aggregateSha256: prepared.aggregateSha256,
    impactPlanPath: prepared.impactPlanPath,
    impactPlanSha256: prepared.impactPlanSha256,
  });
  const db = new FakeDb({
    'sys_catalog_publication/secondevie': {
      ...initialPublicationState(new Date('2026-07-19T00:00:00.000Z')),
      stateVersion: 8,
      dirty: false,
      desiredRevision: 2,
      preparedRevision: 2,
      preparedManifestPath: prepared.manifestPath,
      preparedManifestSha256: prepared.manifestSha256,
      preparedAggregateSha256: prepared.aggregateSha256,
      preparedImpactPlanPath: prepared.impactPlanPath,
      preparedImpactPlanSha256: prepared.impactPlanSha256,
      publishedRevision: 2,
      currentManifestPath: prepared.manifestPath,
      currentManifestSha256: prepared.manifestSha256,
      currentPointerGeneration: published.generation,
      buildState: 'pointer_committed_control_pending',
    },
  });
  const enqueued = [];
  const beforeObjects = bucket.store.size;
  const result = await reconcileCatalog({
    db,
    bucket,
    now: () => new Date('2026-07-19T00:00:30.000Z'),
    enqueue: async (...args) => { enqueued.push(args); return true; },
    logger: () => {},
  });
  const control = db.values.get('sys_catalog_publication/secondevie');
  assert.equal(control.buildState, 'revalidating');
  assert.equal(control.publishedRevision, 2);
  assert.equal(control.leaseToken, null);
  assert.equal(bucket.store.size, beforeObjects);
  assert.equal(enqueued[0][0], 'dispatchCatalogRevalidation');
  assert.ok(result.repairs.includes('pointer_commit_finalized'));
});

test('un rollback vivant reste possede par son operation et un rollback expire est repris une seule fois', async () => {
  const bucket = new FakeBucket();
  const target = await release(bucket, 1);
  await writePointer(bucket, POINTER_PATHS.current, {
    revision: 1,
    manifestPath: target.manifestPath,
    manifestSha256: target.manifestSha256,
    aggregateSha256: target.aggregateSha256,
    impactPlanPath: target.impactPlanPath,
    impactPlanSha256: target.impactPlanSha256,
  });
  const base = {
    ...initialPublicationState(new Date('2026-07-19T00:00:00.000Z')),
    stateVersion: 3,
    mode: 'paused',
    rollbackState: 'preparing',
    rollbackOperationId: 'rollback-1',
    rollbackOwner: 'admin-1',
    rollbackTargetRevision: 1,
    rollbackTargetManifestSha256: target.manifestSha256,
  };
  const liveDb = new FakeDb({
    'sys_catalog_publication/secondevie': {
      ...base,
      rollbackExpiresAt: new Date('2026-07-19T00:02:00.000Z'),
    },
  });
  const live = await reconcileCatalog({
    db: liveDb, bucket, now: () => new Date('2026-07-19T00:01:00.000Z'), logger: () => {}, enqueue: async () => true,
  });
  assert.equal(live.result, 'rollback_operation_active');
  assert.equal(liveDb.values.get('sys_catalog_publication/secondevie').rollbackOwner, 'admin-1');

  const expiredDb = new FakeDb({
    'sys_catalog_publication/secondevie': {
      ...base,
      rollbackExpiresAt: new Date('2026-07-18T23:59:00.000Z'),
    },
  });
  const first = await reconcileCatalog({
    db: expiredDb, bucket, now: () => new Date('2026-07-19T00:01:00.000Z'), logger: () => {}, enqueue: async () => true,
  });
  const second = await reconcileCatalog({
    db: expiredDb, bucket, now: () => new Date('2026-07-19T00:01:01.000Z'), logger: () => {}, enqueue: async () => true,
  });
  assert.ok(first.repairs.includes('rollback_recovery_claimed'));
  assert.ok(first.repairs.includes('rollback_finalized'));
  assert.equal(second.repairs.includes('rollback_recovery_claimed'), false);
  assert.equal(expiredDb.values.get('sys_catalog_publication/secondevie').rollbackOperationId, null);
});

test('une reparation stale ne peut ni voler une nouvelle operation ni rabaisser desiredRevision', async () => {
  const bucket = new FakeBucket();
  const target = await release(bucket, 1);
  await writePointer(bucket, POINTER_PATHS.current, {
    revision: 1,
    manifestPath: target.manifestPath,
    manifestSha256: target.manifestSha256,
    aggregateSha256: target.aggregateSha256,
    impactPlanPath: target.impactPlanPath,
    impactPlanSha256: target.impactPlanSha256,
  });
  const db = new FakeDb({
    'sys_catalog_publication/secondevie': {
      ...initialPublicationState(new Date('2026-07-19T00:00:00.000Z')),
      stateVersion: 4,
      desiredRevision: 1,
      mode: 'paused',
      rollbackState: 'preparing',
      rollbackOperationId: 'rollback-old',
      rollbackOwner: 'admin-old',
      rollbackExpiresAt: new Date('2026-07-18T23:59:00.000Z'),
      rollbackTargetRevision: 1,
      rollbackTargetManifestSha256: target.manifestSha256,
    },
  });
  let advanced = false;
  bucket.onPinnedDownload = async (name) => {
    if (advanced || name !== POINTER_PATHS.current) return;
    advanced = true;
    db.values.set('sys_catalog_publication/secondevie', {
      ...db.values.get('sys_catalog_publication/secondevie'),
      stateVersion: 5,
      desiredRevision: 2,
      rollbackOperationId: 'rollback-new',
      rollbackOwner: 'admin-new',
      rollbackExpiresAt: new Date('2026-07-19T00:03:00.000Z'),
    });
  };
  await assert.rejects(reconcileCatalog({
    db, bucket, now: () => new Date('2026-07-19T00:01:00.000Z'), logger: () => {}, enqueue: async () => true,
  }), /RECONCILE_STATE_ADVANCED/);
  const state = db.values.get('sys_catalog_publication/secondevie');
  assert.equal(state.desiredRevision, 2);
  assert.equal(state.rollbackOperationId, 'rollback-new');
  assert.equal(state.rollbackOwner, 'admin-new');
});

test('deux reconciliations concurrentes convergent sans ecraser une identite plus recente', async () => {
  const bucket = new FakeBucket();
  const target = await release(bucket, 1);
  const published = await writePointer(bucket, POINTER_PATHS.current, {
    revision: 1,
    manifestPath: target.manifestPath,
    manifestSha256: target.manifestSha256,
    aggregateSha256: target.aggregateSha256,
    impactPlanPath: target.impactPlanPath,
    impactPlanSha256: target.impactPlanSha256,
  });
  const db = new SerializedFakeDb({
    'sys_catalog_publication/secondevie': {
      ...initialPublicationState(new Date('2026-07-19T00:00:00.000Z')),
      stateVersion: 2,
      desiredRevision: 1,
      publishedRevision: 0,
    },
  });
  const dependencies = {
    db, bucket, now: () => new Date('2026-07-19T00:01:00.000Z'), logger: () => {}, enqueue: async () => true,
  };
  const results = await Promise.allSettled([
    reconcileCatalog(dependencies),
    reconcileCatalog(dependencies),
  ]);
  assert.equal(results.filter(({ status }) => status === 'fulfilled').length, 1);
  assert.match(results.find(({ status }) => status === 'rejected').reason.message, /RECONCILE_STATE_ADVANCED/);
  const state = db.values.get('sys_catalog_publication/secondevie');
  assert.equal(state.publishedRevision, 1);
  assert.equal(state.currentManifestSha256, target.manifestSha256);
  assert.equal(String(state.currentPointerGeneration), String(published.generation));
});

test('le lease proche du CAS est renouvele et un token perdu interdit la publication', async () => {
  const now = new Date('2026-07-19T00:00:00.000Z');
  const db = new FakeDb({
    'sys_catalog_publication/secondevie': {
      ...initialPublicationState(now),
      stateVersion: 2,
      dirty: true,
      desiredRevision: 7,
      leaseToken: 'lease-7',
      leaseOwner: 'worker',
      leaseTargetRevision: 7,
      leaseExpiresAt: new Date(now.getTime() + 5000),
    },
  });
  const renewed = await renewBuildLease(db, {
    leaseToken: 'lease-7', targetRevision: 7, now, minimumRemainingMs: 120000,
  });
  assert.equal(renewed.renewed, true);
  assert.ok(renewed.state.leaseExpiresAt.getTime() >= now.getTime() + 120000);
  db.values.set('sys_catalog_publication/secondevie', {
    ...db.values.get('sys_catalog_publication/secondevie'), leaseToken: 'lease-new',
  });
  await assert.rejects(renewBuildLease(db, {
    leaseToken: 'lease-7', targetRevision: 7, now,
  }), /LEASE_LOST/);
});

test('stateVersion, lease et rollback forment une barriere monotone compatible avec les anciens documents', () => {
  const now = new Date('2026-07-19T00:00:00.000Z');
  const legacy = { mode: 'active', desiredRevision: 7, publishedRevision: 6, dirty: true };
  assert.equal(nextStateVersion(legacy), 1);
  const lease = acquireLease(legacy, { targetRevision: 7, token: 'build-7', owner: 'worker', now });
  assert.equal(lease.stateVersion, 1);
  const leased = { ...legacy, ...lease };
  assert.equal(assertLease(leased, 'build-7', 7, now.getTime()), true);
  assert.throws(() => assertLease({ ...leased, desiredRevision: 8 }, 'build-7', 7, now.getTime()), /BUILD_OBSOLETE/);

  const rollback = buildRollbackPreparationUpdate(leased, {
    token: 'rollback-1', owner: 'admin', targetName: 'previous',
    target: { revision: 6, manifestSha256: 'b'.repeat(64) }, updatedAt: now,
  });
  const fenced = { ...leased, ...rollback };
  assert.equal(rollback.stateVersion, 2);
  assert.equal(isRollbackActive(fenced, now.getTime()), true);
  assert.equal(acquireLease(fenced, { targetRevision: 7, token: 'other', now }), null);
  assert.throws(() => assertLease(fenced, 'build-7', 7, now.getTime()), /BUILD_PAUSED/);
});
