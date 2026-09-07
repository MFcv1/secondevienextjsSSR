'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const crypto = require('node:crypto');

function harness({ loseCommitResponse = false } = {}) {
    let quote = { photos: [], photoCount: 0 };
    const objects = new Map();
    let resolveBoth;
    const bothSaved = new Promise((resolve) => { resolveBoth = resolve; });
    let saves = 0;
    const snapshot = () => ({ exists: true, data: () => quote });
    const ref = { get: async () => snapshot() };
    const db = {
        collection: () => ({ doc: () => ref }),
        runTransaction: async (run) => {
            // Serialize final transaction callbacks, as Firestore retries
            // concurrent writers against the latest committed document.
            let next;
            const tx = { get: async () => snapshot(), update: (_ref, value) => { next = value; } };
            let result = await run(tx);
            if (next && quote.photoCount) {
                next = null;
                result = await run(tx);
            }
            if (next) quote = { ...quote, ...next };
            if (loseCommitResponse) throw new Error('lost commit response');
            return result;
        }
    };
    const scope = vm.createContext({
        db, crypto, MAX_PHOTOS: 10, MAX_PHOTO_BYTES: 10000, QUOTES_COLLECTION: 'quotes', QUOTE_STORAGE_ROOT: 'quote-requests/v1',
        normalizePhotoInput: (value) => value, assertSubmissionAccess: () => {}, callableError: (error) => error,
        admin: {
            firestore: { Timestamp: { now: () => 1 } },
            storage: () => ({ bucket: () => ({ file: (path) => ({
                save: async (buffer) => {
                    objects.set(path, buffer);
                    if (++saves === (loseCommitResponse ? 1 : 2)) resolveBoth();
                    await bothSaved;
                },
                delete: async () => { objects.delete(path); }
            }) }) })
        },
        sharp: (buffer) => {
            const pipeline = { rotate: () => pipeline, resize: () => pipeline, webp: () => pipeline,
                toBuffer: async () => ({ data: buffer, info: { width: 10, height: 10 } }) };
            return pipeline;
        }
    });
    const source = fs.readFileSync('functions/src/quotes/quoteRequests.js', 'utf8');
    vm.runInContext(source.slice(source.indexOf('async function uploadQuoteRequestPhotoHandler('), source.indexOf('async function finalizeQuoteRequestHandler(')), scope);
    return {
        invoke: (content) => scope.uploadQuoteRequestPhotoHandler({ quoteId: 'quote-test', photoId: 'photo-test', buffer: Buffer.from(content) }),
        quote: () => quote, objects
    };
}

test('concurrent photo IDs retain exactly the winning bytes and only delete the unreferenced attempt', async () => {
    const h = harness();
    const results = await Promise.all([h.invoke('first'), h.invoke('second')]);
    assert.equal(h.quote().photos.length, 1);
    assert.equal(h.objects.size, 1);
    assert.equal(h.objects.has(h.quote().photos[0].storagePath), true);
    assert.ok(results.every((result) => result.photoCount === 1));
});

test('a lost transaction response cannot delete a committed quote photo', async () => {
    const h = harness({ loseCommitResponse: true });
    await assert.rejects(h.invoke('retained'), /lost commit response/);
    assert.equal(h.quote().photos.length, 1);
    assert.equal(h.objects.get(h.quote().photos[0].storagePath).toString(), 'retained');
});
