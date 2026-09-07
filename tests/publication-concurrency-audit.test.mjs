import assert from 'node:assert/strict';
import test from 'node:test';
import { runWithConcurrency } from '../src/kit/admin/publicationConcurrency.js';

test('failed publication stops queued work and waits for sibling writes before permitting retry', async () => {
  const started = [];
  let release;
  const pendingWrite = new Promise(resolve => { release = resolve; });
  let settled = false;
  const failure = new Error('upload failed');
  const operation = runWithConcurrency([0, 1, 2, 3], 2, async item => {
    started.push(item);
    if (item === 0) throw failure;
    await pendingWrite;
  });
  operation.catch(() => { settled = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(settled, false);
  assert.deepEqual(started, [0, 1]);
  release();
  await assert.rejects(operation, error => error === failure);
  assert.deepEqual(started, [0, 1]);
});

test('photo preparation remains bounded and returns original order', async () => {
  let active = 0, peak = 0;
  const results = await runWithConcurrency([0, 1, 2, 3, 4], 2, async item => {
    peak = Math.max(peak, ++active);
    await new Promise(resolve => setImmediate(resolve));
    active--;
    return item * 2;
  });
  assert.equal(peak, 2);
  assert.deepEqual(results, [0, 2, 4, 6, 8]);
});
