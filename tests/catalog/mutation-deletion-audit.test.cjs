'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const crypto = require('node:crypto');
const classifier = require('../../functions/src/catalog/mutationClassifier');
const publication = require('../../functions/src/catalog/publicationState');

test('product deletion creates a new catalog revision even with the last write timestamp, and its replay stays idempotent', async () => {
    const exported = { exports: {} };
    vm.runInNewContext(fs.readFileSync('functions/src/catalog/catalogMutationRecorder.js', 'utf8'), {
        module: exported, Date,
        require: (name) => {
            if (name === 'crypto') return crypto;
            if (name === 'firebase-admin') return { firestore: { FieldValue: { serverTimestamp: () => new Date(1000) } } };
            if (name === './mutationClassifier') return classifier;
            if (name === './publicationState') return publication;
            if (name === './structuredLog') return { catalogLog() {} };
            throw new Error(name);
        }
    });
    const records = new Map();
    const db = {
        doc: (path) => ({ path, set: async (patch) => records.set(path, { ...records.get(path), ...patch }) }),
        runTransaction: async (run) => run({
            get: async (ref) => ({ exists: records.has(ref.path), data: () => records.get(ref.path) }),
            set: (ref, value) => records.set(ref.path, { ...records.get(ref.path), ...value })
        })
    };
    const deps = { db, enqueue: async () => ({ scheduled: true }), now: () => new Date(1000), logger() {} };
    const product = { status: 'published', name: 'Meuble', stock: 1 };
    const identity = { appId: 'secondevie', productId: 'product-one', mutationVersion: '123:456' };
    const write = await exported.exports.recordCatalogMutation(deps, { ...identity, eventId: 'created', before: null, after: product });
    const deletion = { ...identity, eventId: 'deleted', before: product, after: null };
    const removed = await exported.exports.recordCatalogMutation(deps, deletion);
    const replay = await exported.exports.recordCatalogMutation(deps, { ...deletion, eventId: 'replayed-delete' });
    assert.equal(write.revision, 1);
    assert.equal(removed.revision, 2);
    assert.notEqual(removed.mutationHash, write.mutationHash);
    assert.equal(replay.revision, 2);
    assert.equal(replay.result, 'duplicate');
});
