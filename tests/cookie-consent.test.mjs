import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { CONSENT_KEY, parseConsent, saveConsent, hasConsent, getConsentSnapshot, subscribeConsent } from '../src/kit/shared/cookieConsent.js';

test('invalid, future, expired and incompatible choices default to refusal', () => {
  const now = Date.now();
  const record = { version: 1, savedAt: now - 1000, expiresAt: now + 1000, analytics: true, external: false };
  assert.equal(parseConsent(JSON.stringify(record), now).analytics, true);
  for (const raw of ['', 'null', '{', JSON.stringify({ ...record, version: 2 }), JSON.stringify({ ...record, analytics: 'true' }), JSON.stringify({ ...record, savedAt: now + 1 }), JSON.stringify({ ...record, expiresAt: now }), JSON.stringify({ ...record, expiresAt: now + 366 * 86400000 })]) {
    assert.equal(parseConsent(raw, now), null, raw);
  }
});

test('choices are separate, synchronized, cleared on withdrawal and usable without storage', () => {
  const previous = globalThis.window;
  const target = new EventTarget();
  const storage = new Map();
  const localStorage = { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) };
  target.localStorage = localStorage;
  target.sessionStorage = localStorage;
  globalThis.window = target;
  let unsubscribe = () => {};
  try {
    assert.equal(hasConsent('analytics'), false);
    let updates = 0;
    unsubscribe = subscribeConsent(() => updates++);
    assert.equal(saveConsent({ external: true }), true);
    assert.equal(hasConsent('analytics'), false);
    assert.equal(hasConsent('external'), true);
    const record = parseConsent(getConsentSnapshot());
    const expiry = new Date(record.savedAt);
    expiry.setMonth(expiry.getMonth() + 6);
    assert.equal(record.expiresAt, expiry.getTime());
    saveConsent({ analytics: true });
    storage.set('analytics_session_id', 'fixture');
    storage.set('analytics_session_token', 'fixture');
    storage.set('guest_cart', 'keep');
    target.__svAnalyticsEventRuntimeV1 = { queue: ['pending'] };
    // Another tab removes its choice; the current tab must stop too.
    storage.delete(CONSENT_KEY);
    const event = new Event('storage');
    event.key = CONSENT_KEY;
    target.dispatchEvent(event);
    assert.equal(hasConsent('analytics'), false);
    assert.equal(storage.has('analytics_session_id'), false);
    assert.equal(storage.has('analytics_session_token'), false);
    assert.equal(storage.get('guest_cart'), 'keep');
    assert.deepEqual(target.__svAnalyticsEventRuntimeV1.queue, []);
    assert.ok(updates >= 4);
    // Reads can succeed while writes fail (quota / browser restrictions).
    localStorage.setItem = () => { throw new Error('blocked'); };
    assert.equal(saveConsent({ external: true }), false);
    assert.equal(hasConsent('external'), true);
    assert.equal(hasConsent('analytics'), false);
  } finally {
    unsubscribe();
    // Restore persistent mode for any subsequent tests in this process.
    localStorage.setItem = (key, value) => storage.set(key, value);
    saveConsent({});
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});

test('runtime boundaries require consent, including late initialization and beacons', () => {
  const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const collector = read('app/AnalyticsCollectorIsland.jsx');
  assert.match(collector, /shouldLoadAnalytics = Boolean\(trackedPage\) && consent\?\.analytics === true/);
  assert.match(collector, /if \(!shouldLoadAnalytics \|\| !AnalyticsRuntime\) return null/);
  const provider = read('src/kit/shared/AnalyticsProvider.jsx');
  assert.match(provider, /initRes.data.success && isMounted && hasConsent\('analytics'\)/);
  assert.match(provider, /const sendSessionUpdate = [\s\S]*?if \(!hasConsent\('analytics'\)/);
  assert.match(provider, /flushSessionRef.current = async [\s\S]*?if \(!hasConsent\('analytics'\)/);
  assert.match(read('src/kit/marketplace/FooterMapFrameIsland.jsx'), /allowed && shouldLoadMap \? \(\s*<iframe/);
  assert.match(read('app/PerformanceMonitoringIsland.jsx'), /hasConsent\('analytics'\) \? getPerformance\(app\) : null/);
});
