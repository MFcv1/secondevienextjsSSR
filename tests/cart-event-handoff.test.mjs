import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createCartEventHandoff } from '../src/kit/marketplace/cartEventHandoff.js';

test('two additions during cart loading are delivered once and do not recapture replayed events', () => {
  const delivered = [];
  const queue = createCartEventHandoff(event => {
    delivered.push(event);
    assert.equal(queue.capture(event), false);
  });
  const first = { type: 'sv:product-added', detail: { id: 'first' } };
  const second = { type: 'sv:product-added', detail: { id: 'second' } };
  assert.equal(queue.capture(first), true);
  assert.equal(queue.capture(second), true);
  assert.deepEqual(delivered, []);
  queue.ready();
  queue.ready();
  assert.deepEqual(delivered, [first, second]);
  assert.equal(queue.capture({ type: 'sv:open-cart' }), false);
});

test('product detail transfers its queued additions to the installed cart listener', () => {
  const source = readFileSync(new URL('../src/kit/marketplace/ProductDetailShellIsland.jsx', import.meta.url), 'utf8');
  assert.match(source, /cartHandoffRef\.current\.capture/);
  assert.match(source, /cartHandoffRef\.current\.ready\(\)/);
  assert.doesNotMatch(source, /initialEvent=\{cartPanelEvent\}/);
});
