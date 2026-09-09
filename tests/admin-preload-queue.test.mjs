import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminPreloadQueue, preloadAdminChannels } from '../src/kit/admin/adminPreloadQueue.js';

function clock() {
  let id = 0;
  const timers = new Map();
  return {
    schedule(fn) { timers.set(++id, fn); return id; },
    cancel(key) { timers.delete(key); },
    tick() {
      const first = timers.entries().next().value;
      assert.ok(first, 'A background job should be scheduled');
      timers.delete(first[0]);
      return first[1]();
    },
    get count() { return timers.size; },
  };
}

test('one pass, sequential jobs, no automatic retry or repeated warm-up', async () => {
  const time = clock(), calls = [];
  let resolve;
  const queue = createAdminPreloadQueue({ ...time, jobs: [
    { id: 'orders', run: () => { calls.push('orders'); return new Promise(done => { resolve = done; }); } },
    { id: 'returns', run: () => { calls.push('returns'); throw new Error('offline'); } },
    { id: 'quotes', run: () => calls.push('quotes') },
  ] });
  assert.equal(time.count, 0);
  queue.resume();
  const first = time.tick();
  assert.equal(time.count, 0, 'No next job while the first is running');
  queue.resume();
  assert.equal(time.count, 0);
  resolve(); await first;
  await time.tick(); await time.tick();
  queue.resume();
  assert.equal(time.count, 0);
  assert.deepEqual(calls, ['orders', 'returns', 'quotes']);
});

test('navigation promotes the selected job without restarting attempted reads', async () => {
  const time = clock(), calls = [];
  const queue = createAdminPreloadQueue({ ...time, jobs: ['data', 'orders', 'returns', 'quotes'].map(id => ({ id, run: () => calls.push(id) })) });
  queue.resume();
  queue.prioritize('quotes');
  assert.equal(time.count, 1);
  await time.tick();
  queue.prioritize('quotes');
  await time.tick(); await time.tick(); await time.tick();
  assert.deepEqual(calls, ['quotes', 'data', 'orders', 'returns']);
});

test('hidden/offline pauses pending work; disposal aborts a lease and prevents continuation', async () => {
  const time = clock();
  let resolve, signal, second = 0;
  const queue = createAdminPreloadQueue({ ...time, jobs: [
    { id: 'first', run: passed => { signal = passed; return new Promise(done => { resolve = done; }); } },
    { id: 'second', run: () => { second++; } },
  ] });
  queue.resume(); queue.pause();
  assert.equal(time.count, 0);
  queue.resume();
  const work = time.tick();
  queue.pause();
  assert.equal(signal.aborted, true);
  queue.resume();
  assert.equal(time.count, 0, 'Uncancellable callable must still finish before next background job');
  queue.dispose(); resolve(); await work;
  queue.resume();
  assert.equal(time.count, 0);
  assert.equal(second, 0);
});

function channel() {
  let state = { status: 'idle' };
  const listeners = new Set();
  return {
    pauses: 0,
    getSnapshot: () => state,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    start() { state = { status: 'loading' }; },
    finish() { state = { status: 'ready' }; listeners.forEach(fn => fn()); },
    pause() { this.pauses++; },
    get subscribers() { return listeners.size; },
  };
}

test('Data preparation releases hidden listeners after ready, preserving foreground ownership', async () => {
  for (const active of [false, true]) {
    const a = channel(), b = channel();
    const work = preloadAdminChannels([a, b], { signal: new AbortController().signal, keepActive: () => active });
    a.finish(); b.finish(); await work;
    assert.equal(a.subscribers + b.subscribers, 0);
    assert.equal(a.pauses, active ? 0 : 1);
    assert.equal(b.pauses, active ? 0 : 1);
  }
});

test('Data preparation terminates on hiding or bounded timeout even without a server result', async () => {
  const a = channel(), controller = new AbortController();
  const work = preloadAdminChannels([a], { signal: controller.signal, keepActive: () => false });
  controller.abort(); await work;
  assert.equal(a.subscribers, 0);
  assert.equal(a.pauses, 1);
  const b = channel();
  await preloadAdminChannels([b], { signal: new AbortController().signal, keepActive: () => false, timeoutMs: 1 });
  assert.equal(b.subscribers, 0);
  assert.equal(b.pauses, 1);
});
