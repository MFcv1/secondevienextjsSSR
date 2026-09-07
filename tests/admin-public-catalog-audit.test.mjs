import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAdminPublicCatalog, clearAdminPublicCatalogCache } from '../src/kit/admin/adminPublicCatalog.js';

const page = (ids, nextCursor = null, version = '1') => ({ ok: true, json: async () => ({ collections: { furniture: ids.map(id => ({ id })) }, nextCursor, catalogVersion: version, aggregateSha256: `hash-${version}` }) });

test('inventory follows cursors and shares one in-flight complete result', async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  try {
    clearAdminPublicCatalogCache({ notify: false });
    globalThis.fetch = async url => { urls.push(url); return urls.length === 1 ? page(['first'], 'next/+') : page(['last']); };
    const [a, b] = await Promise.all([loadAdminPublicCatalog(), loadAdminPublicCatalog()]);
    assert.deepEqual(a.map(item => item.id), ['first', 'last']);
    assert.equal(a, b);
    assert.equal(urls.length, 2);
    assert.ok(urls[1].endsWith('&cursor=next%2F%2B'));
  } finally { globalThis.fetch = originalFetch; }
});

test('a release change discards the old partial inventory and repeated cursors fail closed', async () => {
  const originalFetch = globalThis.fetch;
  try {
    clearAdminPublicCatalogCache({ notify: false });
    const pages = [page(['old'], 'cursor'), page(['new-tail'], null, '2'), page(['new-head'], 'new-cursor', '2'), page(['new-tail'], null, '2')];
    globalThis.fetch = async () => pages.shift();
    assert.deepEqual((await loadAdminPublicCatalog()).map(item => item.id), ['new-head', 'new-tail']);
    clearAdminPublicCatalogCache({ notify: false });
    globalThis.fetch = async () => page(['loop'], 'same');
    await assert.rejects(loadAdminPublicCatalog(), /Pagination/);
  } finally { globalThis.fetch = originalFetch; }
});
