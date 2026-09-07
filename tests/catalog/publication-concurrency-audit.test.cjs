'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const test = require('node:test');
const sharp = require('../../functions/node_modules/sharp');
const source = fs.readFileSync('functions/src/publication/productPublication.js', 'utf8');

test('concurrent renderings of the same slot never overwrite immutable variant URLs', async () => {
    const scope = vm.createContext({ crypto, sharp, Buffer });
    vm.runInContext(source.slice(source.indexOf('const VARIANT_SPECS ='), source.indexOf('function publicationError(')), scope);
    vm.runInContext(source.slice(source.indexOf('function downloadUrl('), source.indexOf('function buildMedia(')), scope);
    const paths = new Set();
    const bucket = { name: 'local', file: (path) => ({ save: async () => {
        assert.equal(paths.has(path), false, `overwritten object: ${path}`);
        paths.add(path);
    } }) };
    const buffer = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#eeeeee' } }).png().toBuffer();
    const input = { buffer, sessionId: 'session-local', productId: 'product-local', slotKey: 'slot-00' };
    const [first, second] = await Promise.all([scope.processImage(bucket, input), scope.processImage(bucket, input)]);
    assert.equal(paths.size, 16);
    assert.notEqual(first.variants.full, second.variants.full);
});

function handlerHarness({ initialGeneration = '10', finishPublished = false, processingError = false } = {}) {
    let session = { status: 'processing', productId: 'local', expectedMediaCount: 1,
        slots: { 'slot-00': { status: 'processing', originalGeneration: initialGeneration } } };
    const ref = { get: async () => ({ exists: true, data: () => session }) };
    let processed = 0;
    const db = {
        collection: () => ({ doc: () => ref }),
        runTransaction: async (run) => run({
            get: async () => ({ exists: true, data: () => session }),
            set: (_ref, patch) => { session = { ...session, ...patch }; }
        })
    };
    const firestore = Object.assign(() => db, { FieldValue: { serverTimestamp: () => 1 } });
    const scope = vm.createContext({
        admin: { firestore, storage: () => ({ bucket: () => ({ file: (_path, options) => ({
            download: async () => { assert.equal(options.generation, '10'); return [Buffer.from('local')]; }
        }) }) }) },
        onObjectFinalized: (_options, handler) => handler,
        MEDIA_BUCKET: 'local', MEDIA_TRIGGER_REGION: 'local', PRODUCT_PUBLICATION_RUNTIME_SERVICE_ACCOUNT: 'local', SESSION_COLLECTION: 'sessions',
        ORIGINAL_PATH_PATTERN: /^furniture\/publication-sessions\/([^/]+)\/originals\/(slot-(\d{2}))\/[^/]+$/,
        logger: { error() {} },
        processImage: async () => {
            processed++;
            if (finishPublished) session = { ...session, status: 'published', slots: { 'slot-00': { status: 'ready', originalGeneration: '10' } } };
            if (processingError) throw new Error('late worker failure');
            return { variants: { full: 'local' }, metadata: {} };
        },
        finalizePublicationSession: async () => { throw new Error('Unexpected second finalization'); }
    });
    vm.runInContext(source.slice(source.indexOf('function mayProcessImageEvent('), source.indexOf('async function acquireFinalization(')), scope);
    vm.runInContext(source.slice(source.indexOf('const processProductPublicationImage ='), source.indexOf('const cleanupProductPublicationSessions =')) + '\nglobalThis.handler = processProductPublicationImage;', scope);
    return {
        run: () => scope.handler({ data: { name: 'furniture/publication-sessions/session-local/originals/slot-00/source.png', generation: '10', size: 5, contentType: 'image/png' } }),
        session: () => session, processed: () => processed
    };
}

test('late successful or failed workers preserve already-published slots', async () => {
    for (const processingError of [false, true]) {
        const h = handlerHarness({ finishPublished: true, processingError });
        if (processingError) await assert.rejects(h.run(), /late worker failure/);
        else await h.run();
        assert.equal(h.session().status, 'published');
        assert.equal(h.session().slots['slot-00'].status, 'ready');
    }
});

test('an older Storage generation cannot replace a more recent upload', async () => {
    const h = handlerHarness({ initialGeneration: '11' });
    await h.run();
    assert.equal(h.processed(), 0);
    assert.equal(h.session().slots['slot-00'].originalGeneration, '11');
});
