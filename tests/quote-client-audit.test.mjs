import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

async function uploadHarness(handler) {
  const prep = readFileSync(new URL('../src/kit/marketplace/quotePhotoPrep.js', import.meta.url), 'utf8');
  const prepUrl = 'data:text/javascript;base64,' + Buffer.from(prep).toString('base64');
  const source = readFileSync(new URL('../src/kit/marketplace/quoteRequestClient.js', import.meta.url), 'utf8');
  const key = `__quoteClientTest${Math.random().toString(16).slice(2)}`;
  globalThis[key] = handler;
  const injected = source
    .replace("import { getCallableFunction } from '../config/firebaseLazy';", `const getCallableFunction = async name => globalThis[${JSON.stringify(key)}](name);`)
    .replace("import('./quotePhotoPrep')", `import(${JSON.stringify(prepUrl)})`)
    .replace('setTimeout(resolve, ms);', 'queueMicrotask(resolve);');
  const client = await import('data:text/javascript;base64,' + Buffer.from(injected).toString('base64'));
  return { client, dispose: () => { delete globalThis[key]; } };
}

test('un upload transitoire est rejoué avec les mêmes octets et le même identifiant', async t => {
  const uploads = [];
  const h = await uploadHarness(name => async data => {
    if (name === 'createQuoteRequest') return { data: { quoteId: 'quote-local', photoCount: 0 } };
    if (name === 'finalizeQuoteRequest') return { data: { photoCount: 1 } };
    uploads.push(data);
    if (uploads.length < 3) throw Object.assign(new Error('network'), { code: 'functions/unavailable' });
    return { data: { photoCount: 1 } };
  });
  t.after(h.dispose);
  const result = await h.client.submitQuoteRequest({ identity: {}, payload: {}, files: [
    { photoId: 'a'.repeat(32), blob: new Blob(['jpeg-test']), contentType: 'image/jpeg', fileName: 'meuble.jpg' },
  ] });
  assert.equal(uploads.length, 3);
  assert.deepEqual(uploads[0], uploads[2]);
  assert.equal(uploads[0].photoId, 'a'.repeat(32));
  assert.equal(uploads[0].base64, Buffer.from('jpeg-test').toString('base64'));
  assert.equal(result.failedPhotoCount, 0);
});

test('une erreur définitive reste signalée après finalisation sans répéter l’upload', async t => {
  let uploads = 0;
  const h = await uploadHarness(name => async () => {
    if (name === 'createQuoteRequest') return { data: { quoteId: 'quote-local', photoCount: 0 } };
    if (name === 'finalizeQuoteRequest') return { data: { photoCount: 0 } };
    uploads++;
    throw Object.assign(new Error('format'), { code: 'functions/invalid-argument' });
  });
  t.after(h.dispose);
  const result = await h.client.submitQuoteRequest({ identity: {}, payload: {}, files: [
    { photoId: 'b'.repeat(32), blob: new Blob(['jpeg-test']), contentType: 'image/jpeg', fileName: 'meuble.jpg' },
  ] });
  assert.equal(uploads, 1);
  assert.equal(result.failedPhotoCount, 1);
});

test('retrying a submitted quote keeps durable missing-photo and email statuses', async () => {
  const source = readFileSync(new URL('../src/kit/marketplace/quoteRequestClient.js', import.meta.url), 'utf8');
  const injected = source.replace("import { getCallableFunction } from '../config/firebaseLazy';", `
    const getCallableFunction = async name => async () => {
      if (name !== 'createQuoteRequest') throw new Error('A submitted quote must not send again');
      return { data: { quoteId: 'quote-existing', intakeStatus: 'submitted', photoCount: 3, confirmationEmailStatus: 'delivery_unknown' } };
    };
  `);
  const client = await import('data:text/javascript;base64,' + Buffer.from(injected).toString('base64'));
  const result = await client.submitQuoteRequest({ identity: { clientRequestId: 'test-request', uploadToken: 'test-only' }, payload: {}, files: Array(5).fill({}) });
  assert.equal(result.failedPhotoCount, 2);
  assert.equal(result.confirmationEmailStatus, 'delivery_unknown');
});
