const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const helpers = import('../../src/kit/marketplace/catalogLiveSync.js');
const version = (revision) => ({ revision, aggregateSha256: String(revision).padStart(64, '0') });
const response = (payload) => ({ ok: true, json: async () => payload });

test('missing revisions and older revisions cannot validate a public release', async () => {
  const { isVersionAtLeast } = await helpers;
  assert.equal(isVersionAtLeast({ aggregateSha256: version(4).aggregateSha256 }, version(4)), false);
  assert.equal(isVersionAtLeast({ ...version(4), revision: 3 }, version(4)), false);
  assert.equal(isVersionAtLeast(version(5), version(4)), true);
});

test('late subscribers receive the last version; older responses cannot replace it', async () => {
  const { createCatalogVersionChannel } = await helpers;
  const channel = createCatalogVersionChannel();
  channel.publish(version(4));
  const seen = [];
  const stop = channel.subscribe((value) => seen.push(value.revision));
  channel.publish(version(3));
  channel.publish(version(5));
  stop();
  channel.publish(version(6));
  assert.deepEqual(seen, [4, 5]);
});

test('transient failures and outdated releases retry, then accept an overtaking publication', async () => {
  const { fetchCatalogWithRetry, isVersionAtLeast } = await helpers;
  const waits = [];
  let calls = 0;
  const result = await fetchCatalogWithRetry('/api/catalog/version', {
    signal: new AbortController().signal,
    delay: async (ms) => waits.push(ms),
    accept: (value) => isVersionAtLeast(value, version(4)),
    fetcher: async () => {
      calls += 1;
      if (calls === 1) throw Error('offline');
      if (calls === 2) return { ok: false };
      return response(version(calls === 3 ? 3 : 5));
    },
  });
  assert.equal(result.revision, 5);
  assert.equal(calls, 4);
  assert.deepEqual(waits, [500, 1500, 4000]);
});

test('a superseded in-flight response is discarded even if transport ignores abort', async () => {
  const { fetchCatalogWithRetry } = await helpers;
  const controller = new AbortController();
  let resolve;
  const request = fetchCatalogWithRetry('/api/catalog/version', {
    signal: controller.signal,
    fetcher: () => new Promise((done) => { resolve = done; }),
  });
  controller.abort();
  resolve(response(version(2)));
  assert.equal(await request, null);
});

test('failure budget is finite; abort cancels a scheduled retry', async () => {
  const { fetchCatalogWithRetry, abortableDelay, CATALOG_RETRY_DELAYS } = await helpers;
  let calls = 0;
  assert.equal(await fetchCatalogWithRetry('/api/catalog/version', {
    signal: new AbortController().signal,
    delay: async () => {},
    fetcher: async () => { calls += 1; throw Error('unavailable'); },
  }), null);
  assert.equal(calls, CATALOG_RETRY_DELAYS.length);
  const controller = new AbortController();
  const waiting = abortableDelay(60000, controller.signal);
  controller.abort();
  await assert.rejects(waiting);
});

// Execute the actual effect with injected React/browser/Firebase boundaries.
// No renderer, network, emulator or duplicated lifecycle implementation.
async function mountSync() {
  const effects = [];
  const events = new Map();
  const timers = new Map();
  const signals = [];
  const delivered = [];
  let timerId = 0;
  let refreshes = 0;
  let stops = 0;
  let current = version(2);
  let settling = false;
  const shared = await helpers;
  const channel = shared.createCatalogVersionChannel();
  channel.subscribe((value) => delivered.push(value.revision));
  const target = {
    addEventListener: (name, fn) => events.set(name, fn),
    removeEventListener: (name) => events.delete(name),
  };
  const document = {
    ...target, visibilityState: 'visible',
    documentElement: { hasAttribute: () => settling },
  };
  const context = vm.createContext({
    ...shared, AbortController, CustomEvent, Number, Boolean, JSON, Date,
    catalogVersionChannel: channel,
    useEffect: (effect) => effects.push(effect),
    useRef: (value) => ({ current: value }),
    usePathname: () => '/', useRouter: () => ({ refresh: () => refreshes++ }),
    document,
    window: { ...target, dispatchEvent: () => {}, location: { pathname: '/', search: '', hash: '' }, sessionStorage: { getItem: () => null } },
    setTimeout: (fn) => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: (id) => timers.delete(id),
    getDb: async () => ({}),
    loadFirestoreModule: async () => ({
      doc: () => ({}),
      onSnapshot: (ref, next, error) => {
        signals.push({ next, error });
        return () => stops++;
      },
    }),
    fetchCatalogWithRetry: (url, options) => shared.fetchCatalogWithRetry(url, {
      ...options, delay: async () => {}, fetcher: async () => response(current),
    }),
    abortableDelay: async () => { settling = false; },
  });
  const source = fs.readFileSync('src/kit/marketplace/CatalogVersionSyncIsland.jsx', 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export default function', 'function');
  vm.runInContext(`${source}\nCatalogVersionSyncIsland(${JSON.stringify(version(1))});`, context);
  const cleanup = effects.map((effect) => effect()).filter(Boolean);
  const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
  await flush();
  return {
    signals, delivered, events, document, timers, flush,
    setCurrent: (value) => { current = value; },
    settle: () => { settling = true; },
    refreshes: () => refreshes, stops: () => stops,
    dispose: () => cleanup.forEach((fn) => fn()),
  };
}

test('listener error reconnects automatically; hidden tabs stop; online/pageshow resume', async () => {
  const app = await mountSync();
  assert.equal(app.signals.length, 1);
  assert.deepEqual(app.delivered, [2]);
  app.signals[0].error(Error('connection lost'));
  assert.equal(app.timers.size, 1);
  const retry = [...app.timers.values()][0];
  app.timers.clear();
  retry();
  await app.flush();
  assert.equal(app.signals.length, 2);
  app.document.visibilityState = 'hidden';
  app.events.get('visibilitychange')();
  assert.equal(app.stops(), 2);
  app.document.visibilityState = 'visible';
  app.setCurrent(version(3));
  app.events.get('online')();
  await app.flush();
  assert.equal(app.delivered.at(-1), 3);
  app.events.get('pageshow')();
  await app.flush();
  assert.equal(app.signals.length, 4);
  app.dispose();
  assert.equal(app.events.size, 0);
  assert.equal(app.timers.size, 0);
});

test('signal during product return is delivered after settling; repeated signal avoids duplicate refresh', async () => {
  const app = await mountSync();
  app.setCurrent(version(4));
  app.settle();
  app.signals[0].next({ exists: () => true, data: () => version(3) });
  await app.flush();
  assert.equal(app.delivered.at(-1), 4);
  assert.equal(app.refreshes(), 2);
  app.signals[0].next({ exists: () => true, data: () => version(4) });
  await app.flush();
  assert.equal(app.refreshes(), 2);
  app.dispose();
});

test('grid replays missed signals, applies server props, and rejects stale in-flight data', async () => {
  const shared = await helpers;
  const channel = shared.createCatalogVersionChannel();
  channel.publish(version(2));
  const requests = [];
  const slots = [];
  let index = 0;
  let pending = [];
  const context = vm.createContext({
    ...shared, Number, String, Date, Array,
    AbortController, catalogVersionChannel: channel,
    document: { getElementById: () => null },
    useState: (initial) => {
      const slot = index++;
      if (!slots[slot]) slots[slot] = { value: initial };
      return [slots[slot].value, (value) => { slots[slot].value = value; }];
    },
    useRef: (initial) => {
      const slot = index++;
      if (!slots[slot]) slots[slot] = { current: initial };
      return slots[slot];
    },
    useMemo: (fn) => fn(),
    useEffect: (fn, deps) => {
      const slot = index++;
      const previous = slots[slot];
      if (previous && deps.every((value, i) => Object.is(value, previous.deps[i]))) return;
      pending.push(() => {
        previous?.cleanup?.();
        slots[slot] = { deps, cleanup: fn() };
      });
    },
    fetchCatalogWithRetry: (url, options) => new Promise((resolve) => requests.push({ options, resolve })),
  });
  const source = fs.readFileSync('src/kit/marketplace/GalleryLiveProductGridIsland.jsx', 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export default function', 'function')
    .split('  return (\n    <>')[0] + '\n return null;\n}';
  vm.runInContext(source, context);
  const render = (revision, stock) => {
    index = 0;
    pending = [];
    const props = { mode: 'small-prices', initialCatalogVersion: version(revision).aggregateSha256,
      initialCatalogRevision: revision, initialItems: [{ id: 'buffet', stock }] };
    vm.runInContext(`GalleryLiveProductGridIsland(${JSON.stringify(props)});`, context);
    pending.forEach((fn) => fn());
  };
  const payload = (revision, stock) => ({ ...version(revision), collections: { furniture: [{ id: 'buffet', stock }] } });
  render(1, 0);
  assert.equal(requests.length, 1, 'signal published before mount is replayed');
  channel.publish(version(3));
  assert.equal(requests[0].options.signal.aborted, true);
  requests[1].resolve(payload(3, 1));
  for (let i = 0; i < 10; i++) await Promise.resolve();
  assert.equal(slots[0].value.items[0].stock, 1);
  requests[0].resolve(payload(2, 0));
  for (let i = 0; i < 10; i++) await Promise.resolve();
  assert.equal(slots[0].value.items[0].stock, 1, 'late response cannot regress stock');
  render(2, 0);
  assert.equal(slots[0].value.items[0].stock, 1, 'old ISR props cannot regress stock');
  render(4, 2);
  assert.equal(slots[0].value.items[0].stock, 2, 'new server props are applied');
  slots.forEach((slot) => slot.cleanup?.());
});
