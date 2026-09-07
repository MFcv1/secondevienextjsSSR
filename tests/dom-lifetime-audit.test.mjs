import assert from 'node:assert/strict';
import test from 'node:test';
import { createDomLifetime } from '../src/kit/ui/domLifetime.js';

test('leaving an interaction cancels timers, frames, observers and listeners', () => {
  let id = 0;
  let called = 0;
  const timers = new Map();
  const frames = new Map();
  const lifetime = createDomLifetime({
    setTimeout: fn => { timers.set(++id, fn); return id; },
    clearTimeout: key => timers.delete(key),
    requestAnimationFrame: fn => { frames.set(++id, fn); return id; },
    cancelAnimationFrame: key => frames.delete(key),
  });
  const target = new EventTarget();
  target.addEventListener('action', () => called++, { signal: lifetime.signal });
  const observer = { observe() {}, disconnect() { called++; } };
  lifetime.observe(observer, target);
  lifetime.later(() => called++, 10);
  lifetime.frame(() => called++);
  const lateCallbacks = [...timers.values(), ...frames.values()];
  lifetime.dispose();
  target.dispatchEvent(new Event('action'));
  lateCallbacks.forEach(fn => fn());
  assert.equal(called, 1);
  assert.equal(timers.size, 0);
  assert.equal(frames.size, 0);
  lifetime.later(() => called++, 0);
  lifetime.frame(() => called++);
  assert.equal(timers.size, 0);
  assert.equal(frames.size, 0);
});
