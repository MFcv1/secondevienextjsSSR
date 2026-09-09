import assert from 'node:assert/strict';
import test from 'node:test';
import { CONSENT_KEY, saveConsent } from '../src/kit/shared/cookieConsent.js';

import {
  ANALYTICS_EVENT_NAME,
  drainBufferedAnalyticsEvents,
  emitAnalyticsEvent,
  registerAnalyticsEventConsumer,
} from '../src/kit/shared/analyticsEvents.js';

test('analytics events emitted before the deferred runtime are buffered once', () => {
  const previousWindow = globalThis.window;
  const previousCustomEvent = globalThis.CustomEvent;
  const eventTarget = new EventTarget();

  class AnalyticsCustomEvent extends Event {
    constructor(type, options = {}) {
      super(type);
      this.detail = options.detail;
    }
  }

  globalThis.window = eventTarget;
  const storage = new Map();
  eventTarget.localStorage = { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) };
  eventTarget.sessionStorage = eventTarget.localStorage;
  globalThis.CustomEvent = AnalyticsCustomEvent;

  try {
    emitAnalyticsEvent('before_consent');
    assert.deepEqual(drainBufferedAnalyticsEvents(), []);
    saveConsent({ analytics: true });
    emitAnalyticsEvent('quote_start', null, null, { form: 'restoration' });
    const buffered = drainBufferedAnalyticsEvents();
    assert.equal(buffered.length, 1);
    assert.equal(buffered[0].action, 'quote_start');
    assert.equal(buffered[0].form, 'restoration');

    const received = [];
    const listener = (event) => received.push(event.detail);
    eventTarget.addEventListener(ANALYTICS_EVENT_NAME, listener);
    const unregister = registerAnalyticsEventConsumer();

    emitAnalyticsEvent('quote_email_opened');
    assert.deepEqual(received.map((event) => event.action), ['quote_email_opened']);
    assert.deepEqual(drainBufferedAnalyticsEvents(), []);

    unregister();
    eventTarget.removeEventListener(ANALYTICS_EVENT_NAME, listener);
    for (let index = 0; index < 35; index += 1) {
      emitAnalyticsEvent(`buffered_${index}`);
    }
    const boundedBuffer = drainBufferedAnalyticsEvents();
    assert.equal(boundedBuffer.length, 32);
    assert.equal(boundedBuffer[0].action, 'buffered_3');
    assert.equal(boundedBuffer.at(-1).action, 'buffered_34');
    emitAnalyticsEvent('pending_before_withdrawal');
    saveConsent({});
    emitAnalyticsEvent('after_withdrawal');
    assert.deepEqual(drainBufferedAnalyticsEvents(), []);
    assert.equal(JSON.parse(storage.get(CONSENT_KEY)).analytics, false);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousCustomEvent === undefined) delete globalThis.CustomEvent;
    else globalThis.CustomEvent = previousCustomEvent;
  }
});
