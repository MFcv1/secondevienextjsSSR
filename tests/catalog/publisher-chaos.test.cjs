const assert = require('node:assert/strict');
const test = require('node:test');
const {
  publishCurrentPointer,
  readCurrentPointer,
  saveImmutable,
} = require('../../functions/src/catalog/snapshotStorage');

class FakeFile {
  constructor(name, store) { this.name = name; this.store = store; }
  async save(buffer, options = {}) {
    const current = this.store.get(this.name);
    const expected = options.preconditionOpts?.ifGenerationMatch;
    const generation = current ? current.generation : 0;
    if (expected !== undefined && Number(expected) !== Number(generation)) throw Object.assign(new Error('precondition'), { code: 412 });
    this.store.set(this.name, { buffer: Buffer.from(buffer), generation: generation + 1, options });
  }
  async download() {
    const value = this.store.get(this.name);
    if (!value) throw Object.assign(new Error('missing'), { code: 404 });
    return [Buffer.from(value.buffer)];
  }
  async getMetadata() {
    const value = this.store.get(this.name);
    if (!value) throw Object.assign(new Error('missing'), { code: 404 });
    return [{ generation: String(value.generation), size: String(value.buffer.length) }];
  }
  async exists() { return [this.store.has(this.name)]; }
}

class FakeBucket {
  constructor() { this.store = new Map(); }
  file(name) { return new FakeFile(name, this.store); }
}

test('immutable upload is idempotent but rejects a hash collision', async () => {
  const bucket = new FakeBucket();
  const file = bucket.file('release/catalog.json');
  await saveImmutable(file, Buffer.from('same'));
  await saveImmutable(file, Buffer.from('same'));
  await assert.rejects(saveImmutable(file, Buffer.from('different')), /REVISION_COLLISION/);
});

test('pointer CAS lets only one concurrent worker win and never moves backward', async () => {
  const bucket = new FakeBucket();
  const releaseA = { manifestPath: 'release/a/manifest.json', manifestSha256: 'a'.repeat(64) };
  const releaseB = { manifestPath: 'release/b/manifest.json', manifestSha256: 'b'.repeat(64) };
  const first = await publishCurrentPointer(bucket, { revision: 1, release: releaseA, previous: null, expectedGeneration: 0 });
  await assert.rejects(
    publishCurrentPointer(bucket, { revision: 2, release: releaseB, previous: first.pointer, expectedGeneration: 0 }),
    (error) => Number(error.code) === 412,
  );
  const pointer = await readCurrentPointer(bucket);
  assert.equal(pointer.value.revision, 1);
  assert.equal(pointer.value.manifestPath, releaseA.manifestPath);
});

test('a crash before pointer CAS leaves the current release unchanged', async () => {
  const bucket = new FakeBucket();
  const release = { manifestPath: 'release/stable/manifest.json', manifestSha256: 'c'.repeat(64) };
  await publishCurrentPointer(bucket, { revision: 10, release, previous: null, expectedGeneration: 0 });
  await saveImmutable(bucket.file('release/orphan/catalog.json'), Buffer.from('{}'));
  const pointer = await readCurrentPointer(bucket);
  assert.equal(pointer.value.revision, 10);
});
