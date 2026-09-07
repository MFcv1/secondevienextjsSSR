import assert from 'node:assert/strict';
import test from 'node:test';
import { planInventoryReorder } from '../src/kit/admin/inventoryOrdering.js';

test('moving a ranked product writes one rank instead of the complete inventory', () => {
  const items = [{ id: 'a', nouveautesOrder: 0 }, { id: 'moved', nouveautesOrder: 50 }, { id: 'b', nouveautesOrder: 1 }];
  assert.deepEqual(planInventoryReorder(items, 'moved', 'nouveautesOrder'), [{ item: items[1], value: 0.5 }]);
});

test('legacy equal ranks normalize atomically and refuse oversized normalization', () => {
  const items = [{ id: 'a' }, { id: 'moved' }, { id: 'b' }];
  assert.deepEqual(planInventoryReorder(items, 'moved', 'petitsPrixOrder').map(change => change.value), [0, 1, 2]);
  const large = Array.from({ length: 405 }, (_, index) => ({ id: String(index) }));
  assert.throws(() => planInventoryReorder(large, '200', 'nouveautesOrder'), /400 pièces/);
  assert.equal(planInventoryReorder(large, '0', 'nouveautesOrder').length, 1);
});
