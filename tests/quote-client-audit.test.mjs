import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

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
