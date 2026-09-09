import assert from 'node:assert/strict';
import test from 'node:test';
import { singleFlightPreparation } from '../src/kit/auth/passkeyPreparation.js';
import { measureClientPerf } from '../src/kit/shared/clientPerf.js';

test('duplicate preparations share only the pending request; completed challenges are never reused', async () => {
  let calls = 0;
  const prepare = singleFlightPreparation(async () => ++calls);
  const first = prepare('a');
  assert.equal(prepare('a'), first);
  assert.equal(await first, 1);
  assert.equal(await prepare('a'), 2);
});

test('an old response cannot clear another email preparation; failures remain retryable', async () => {
  const resolves = new Map();
  const prepare = singleFlightPreparation(email => new Promise((resolve, reject) => resolves.set(email, { resolve, reject })));
  const first = prepare('a');
  const second = prepare('b');
  await Promise.resolve();
  resolves.get('a').resolve('a');
  await first;
  assert.equal(prepare('b'), second);
  const failure = new Error('test failure');
  resolves.get('b').reject(failure);
  await assert.rejects(second, error => error === failure);
  const retry = prepare('b');
  assert.notEqual(retry, second);
  await Promise.resolve();
  resolves.get('b').resolve('b');
  assert.equal(await retry, 'b');
});

test('client measurement preserves the exact result and rejection', async () => {
  const result = {};
  assert.equal(await measureClientPerf('test', () => result), result);
  const error = new Error('not logged');
  await assert.rejects(measureClientPerf('test', () => { throw error; }), actual => actual === error);
});
