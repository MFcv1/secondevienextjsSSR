import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { quoteServices } from '../src/kit/shared/quoteServices.js';

const require = createRequire(import.meta.url);
const { SERVICES } = require('../functions/src/quotes/quoteRequestDomain.js');

test('public form and admin catalogue match the authoritative service labels and price ranges', () => {
  assert.equal(quoteServices.length, SERVICES.size);
  assert.equal(new Set(quoteServices.map(service => service.id)).size, SERVICES.size);
  for (const service of quoteServices) {
    const expected = SERVICES.get(service.id);
    assert.equal(service.label, expected.label);
    assert.equal(service.min * 100, expected.minCents);
    assert.equal(service.max * 100, expected.maxCents);
  }
});
