'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

async function readPhotos({ path = 'quote-requests/v1/quote-local/photo.webp', authorized = true } = {}) {
  let downloads = 0;
  const source = fs.readFileSync('functions/src/quotes/quoteRequests.js', 'utf8');
  const scope = vm.createContext({
    console: { warn() {} }, Date,
    QUOTES_COLLECTION: 'quotes', QUOTE_STORAGE_ROOT: 'quote-requests/v1', MAX_PHOTO_BYTES: 1536 * 1024,
    checkActiveStrongAdmin: async () => { if (!authorized) throw new Error('DENIED'); },
    normalizeFirestoreId: value => value,
    serializeQuote: () => ({}),
    db: { collection: () => ({ doc: () => ({ get: async () => ({ exists: true, id: 'quote-local', data: () => ({ photos: [{ photoId: 'photo', storagePath: path }] }) }) }) }) },
    admin: { storage: () => ({ bucket: () => ({ file: () => ({
      getSignedUrl: async () => { throw new Error('IAM_SIGN_BLOB_DENIED'); },
      getMetadata: async () => [{ size: '20' }],
      download: async () => { downloads++; return [Buffer.from('private')]; }
    }) }) }) },
    sharp: () => { const pipeline = { resize: () => pipeline, webp: () => pipeline, toBuffer: async () => Buffer.from('preview') }; return pipeline; }
  });
  vm.runInContext(source.slice(source.indexOf('async function getQuoteRequestAdminHandler('), source.indexOf('async function updateQuoteRequestAdminHandler(')), scope);
  const result = await scope.getQuoteRequestAdminHandler({ quoteId: 'quote-local' }, {});
  return { result, downloads };
}

test('photo signing failure falls back to a private authenticated bounded preview', async () => {
  const { result, downloads } = await readPhotos();
  assert.equal(downloads, 1);
  assert.match(result.quote.photos[0].url, /^data:image\/webp;base64,/);
});
test('photo fallback cannot read another quote or bypass admin authorization', async () => {
  const { result, downloads } = await readPhotos({ path: 'quote-requests/v1/another/photo.webp' });
  assert.equal(downloads, 0);
  assert.equal(result.quote.photos[0].url, null);
  await assert.rejects(readPhotos({ authorized: false }), /DENIED/);
});
