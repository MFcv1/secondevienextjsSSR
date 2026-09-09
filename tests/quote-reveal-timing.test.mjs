import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/kit/marketplace/QuoteRevealIsland.jsx', import.meta.url), 'utf8')
  .replace("import { useLayoutEffect } from 'react';", '')
  .replace('export default function QuoteRevealIsland()', 'function QuoteRevealIsland()');

function harness({ progressVisible = true } = {}) {
  let now = 0;
  let nextTimer = 0;
  let cleanup;
  const timers = new Map();
  const observers = [];
  const events = [];
  const element = (key) => ({
    dataset: { quoteReveal: key, quoteRevealMode: 'eager' },
    classList: { values: new Set(), add(...names) { names.forEach(name => this.values.add(name)); } },
    style: { setProperty() {} },
  });
  const hero = element('hero');
  const progress = element('progress');
  const window = {
    matchMedia: () => ({ matches: false }),
    setTimeout(callback, delay) {
      const id = ++nextTimer;
      timers.set(id, { callback, at: now + delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: (event) => events.push({ type: event.type, at: now }),
  };
  class IntersectionObserver {
    constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this); }
    observe(target) {
      this.targets.add(target);
      window.setTimeout(() => {
        if (this.targets.has(target)) this.callback([{ target, isIntersecting: target === hero || progressVisible }], this);
      }, 0);
    }
    unobserve(target) { this.targets.delete(target); }
    disconnect() { this.targets.clear(); }
  }
  const root = { dataset: { quoteMotion: 'pending' } };
  vm.runInNewContext(`${source}; QuoteRevealIsland();`, {
    window,
    document: { documentElement: root, querySelector: () => ({ querySelectorAll: () => [hero, progress] }) },
    IntersectionObserver,
    Event,
    useLayoutEffect: (effect) => { cleanup = effect(); },
  });
  const advance = (time) => {
    while (true) {
      const next = [...timers].filter(([, timer]) => timer.at <= time).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      timers.delete(next[0]);
      now = next[1].at;
      next[1].callback();
    }
    now = time;
  };
  return { hero, progress, advance, events, timers, cleanup: () => cleanup(), showProgress() {
    progressVisible = true;
    observers.forEach(observer => {
      if (observer.targets.has(progress)) observer.callback([{ target: progress, isIntersecting: true }], observer);
    });
  } };
}

test('le rail suit le debut du CTA sans interrompre le hero ni monter le formulaire trop tot', () => {
  const h = harness();
  h.advance(939);
  assert.equal(h.progress.classList.values.has('is-in'), false);
  h.advance(940);
  assert.equal(h.progress.classList.values.has('is-in'), true);
  assert.equal(h.hero.classList.values.has('is-settled'), false);
  h.advance(1549);
  assert.equal(h.hero.classList.values.has('is-settled'), false);
  assert.equal(h.events.length, 0);
  h.advance(1550);
  assert.equal(h.hero.classList.values.has('is-settled'), true);
  h.advance(1561);
  assert.deepEqual(h.events, [{ type: 'quote:form-mount-ready', at: 1561 }]);
});

test('un rail hors ecran attend le scroll et le depart de la route annule les timers', () => {
  const h = harness({ progressVisible: false });
  h.advance(2000);
  assert.equal(h.progress.classList.values.has('is-in'), false);
  assert.equal(h.events.length, 0);
  h.showProgress();
  assert.equal(h.progress.classList.values.has('is-in'), true);
  h.cleanup();
  h.advance(3000);
  assert.equal(h.events.length, 0);
  assert.equal(h.timers.size, 0);
});
