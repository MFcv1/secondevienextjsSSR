'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import {
  ANALYTICS_SCHEMA_VERSION,
  classifyAnalyticsRoute,
  MEASUREMENT_MODES,
  normalizeClientAction,
} from '../src/lib/analytics/v3Contract';
import { ANALYTICS_EVENT_NAME } from '../src/kit/contexts/AnalyticsContext';

const DB_NAME = 'secondevie-analytics-v3';
const STORE_NAME = 'pending_batches';
const TAB_KEY = 'sv.analytics.v3.tab';
const SESSION_KEY = 'sv.analytics.v3.session';
const SEQ_KEY = 'sv.analytics.v3.seq';
const PRODUCT_IUD_KEY = 'sv.analytics.v3.product_iud';
const MAX_PENDING_BATCHES = 20;
const FLUSH_MS = 8000;
let appCheckTokenPromise = null;
let appCheckTokenValue = null;

const randomId = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const stableBatchId = async (sessionId, events) => {
  const source = `${sessionId}|${events.map((event) => event.eventId).join('|')}`;
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  return btoa(String.fromCharCode(...new Uint8Array(hash))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '').slice(0, 32);
};

const getLazyAppCheckToken = () => {
  if (!appCheckTokenPromise) {
    appCheckTokenPromise = import('../src/kit/config/firebaseLazy')
      .then(({ getAppCheckToken }) => getAppCheckToken())
      .then((token) => {
        appCheckTokenValue = token;
        return token;
      })
      .catch(() => null);
  }
  return appCheckTokenPromise;
};

const readConsent = () => {
  const match = document.cookie.match(/(?:^|; )sv_analytics_consent=([^;]+)/);
  const value = match ? decodeURIComponent(match[1]) : '';
  if (!value.startsWith('product:')) return { measurementMode: MEASUREMENT_MODES.AUDIENCE, consentVersion: null };
  return { measurementMode: MEASUREMENT_MODES.CONSENTED, consentVersion: value.slice(8, 48) || 'v1' };
};

const getDevice = () => {
  const ua = navigator.userAgent || '';
  return {
    deviceClass: /Mobi|Android/i.test(ua) ? 'Mobile' : 'Desktop',
    osFamily: /Android/i.test(ua) ? 'Android' : (/iPhone|iPad/i.test(ua) ? 'iOS' : (/Windows/i.test(ua) ? 'Windows' : (/Mac/i.test(ua) ? 'macOS' : 'Other'))),
    browserFamily: /Firefox/i.test(ua) ? 'Firefox' : (/Edg/i.test(ua) ? 'Edge' : (/Chrome|CriOS/i.test(ua) ? 'Chrome' : (/Safari/i.test(ua) ? 'Safari' : 'Other'))),
  };
};

const openQueue = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: 'batchId' });
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const withStore = async (mode, operation) => {
  const db = await openQueue();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const request = operation(tx.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
};

const listBatches = () => withStore('readonly', (store) => store.getAll());
const putBatch = (batch) => withStore('readwrite', (store) => store.put(batch));
const deleteBatch = (batchId) => withStore('readwrite', (store) => store.delete(batchId));

const postJson = async (path, body, keepalive = false) => {
  const appCheckToken = appCheckTokenValue;
  const response = await fetch(path, {
    method: 'POST', credentials: 'same-origin', keepalive,
    headers: { 'content-type': 'application/json', ...(appCheckToken ? { 'x-firebase-appcheck': appCheckToken } : {}) }, body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`analytics_http_${response.status}`);
  return response.json();
};

const getTabId = () => {
  let value = sessionStorage.getItem(TAB_KEY);
  if (!value) { value = randomId(); sessionStorage.setItem(TAB_KEY, value); }
  return value;
};

const nextSeq = () => {
  const next = Math.max(0, Number(sessionStorage.getItem(SEQ_KEY)) || 0) + 1;
  sessionStorage.setItem(SEQ_KEY, String(next));
  return next;
};

export default function AnalyticsCollectorIsland() {
  const pathname = usePathname();
  const sessionRef = useRef(null);
  const bufferRef = useRef([]);
  const flushingRef = useRef(false);
  const visibleSinceRef = useRef(typeof performance === 'undefined' ? 0 : performance.now());
  const lastRouteRef = useRef(null);

  useEffect(() => {
    if (!('indexedDB' in window) || classifyAnalyticsRoute(pathname) === null) return;
    let cancelled = false;
    const initialize = async () => {
      const tabSessionId = getTabId();
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.sessionId && parsed?.tabSessionId === tabSessionId) sessionRef.current = parsed;
        } catch { sessionStorage.removeItem(SESSION_KEY); }
      }
      if (!sessionRef.current) {
        const consent = readConsent();
        let subjectIud = null;
        if (consent.measurementMode === MEASUREMENT_MODES.CONSENTED) {
          subjectIud = localStorage.getItem(PRODUCT_IUD_KEY) || randomId();
          localStorage.setItem(PRODUCT_IUD_KEY, subjectIud);
        }
        const result = await postJson('/api/analytics/v3/session', {
          schemaVersion: ANALYTICS_SCHEMA_VERSION, tabSessionId, subjectIud, ...consent, device: getDevice(),
        });
        if (cancelled || !result?.sessionId) return;
        sessionRef.current = { sessionId: result.sessionId, tabSessionId, measurementMode: result.measurementMode, consentVersion: result.consentVersion };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionRef.current));
      }
      const route = classifyAnalyticsRoute(window.location.pathname);
      if (route && lastRouteRef.current !== window.location.pathname) {
        lastRouteRef.current = window.location.pathname;
        enqueue(route.eventName, route);
      }
      await flushPending();
      const requestIdle = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 1200));
      requestIdle(() => getLazyAppCheckToken());
    };
    initialize().catch(() => {});
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- une session technique par onglet

  const persistBuffer = async () => {
    const session = sessionRef.current;
    const events = bufferRef.current.splice(0, 25);
    if (!session || events.length === 0) return;
    const batch = { ...session, batchId: await stableBatchId(session.sessionId, events), events, queuedAt: Date.now() };
    await putBatch(batch);
    const all = (await listBatches()).sort((a, b) => a.queuedAt - b.queuedAt);
    for (const stale of all.slice(0, Math.max(0, all.length - MAX_PENDING_BATCHES))) await deleteBatch(stale.batchId);
  };

  const flushPending = async () => {
    if (flushingRef.current || !sessionRef.current || !navigator.onLine) return;
    flushingRef.current = true;
    try {
      await persistBuffer();
      const batches = (await listBatches()).sort((a, b) => a.queuedAt - b.queuedAt);
      for (const batch of batches) {
        if (batch.sessionId !== sessionRef.current.sessionId) continue;
        await postJson('/api/analytics/v3/batch', batch);
        await deleteBatch(batch.batchId);
      }
    } catch {
      // La file IndexedDB conserve le meme batchId pour la reprise.
    } finally {
      flushingRef.current = false;
    }
  };

  const enqueue = (eventName, route, context = {}) => {
    const session = sessionRef.current;
    if (!session || !route) return;
    const now = performance.now();
    const activeDeltaMs = document.visibilityState === 'visible' ? Math.max(0, Math.round(now - visibleSinceRef.current)) : 0;
    visibleSinceRef.current = now;
    bufferRef.current.push({
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      eventId: randomId(),
      tabSessionId: session.tabSessionId,
      seq: nextSeq(),
      eventName,
      routeKey: route.routeKey,
      occurredAt: Date.now(),
      activeDeltaMs,
      context: { ...(route.entityId ? { entityId: route.entityId } : {}), ...context },
      measurementMode: session.measurementMode,
      consentVersion: session.consentVersion,
      synthetic: false,
      testRunId: null,
    });
    if (bufferRef.current.length >= 8) flushPending();
  };

  useEffect(() => {
    const route = classifyAnalyticsRoute(pathname);
    if (!route || lastRouteRef.current === pathname) return;
    lastRouteRef.current = pathname;
    enqueue(route.eventName, route);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps -- enqueue lit les refs courantes

  useEffect(() => {
    const onEvent = (event) => {
      const eventName = normalizeClientAction(event?.detail?.action);
      const route = classifyAnalyticsRoute(window.location.pathname);
      if (!eventName || !route) return;
      const detail = event.detail || {};
      enqueue(eventName, route, {
        ...(detail.itemId ? { productId: String(detail.itemId).slice(0, 160) } : {}),
        ...(detail.form ? { form: String(detail.form).slice(0, 80) } : {}),
      });
    };
    const onVisible = () => { visibleSinceRef.current = performance.now(); if (document.visibilityState === 'visible') flushPending(); };
    const onOnline = () => flushPending();
    const interval = window.setInterval(() => flushPending(), FLUSH_MS);
    window.addEventListener(ANALYTICS_EVENT_NAME, onEvent);
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener(ANALYTICS_EVENT_NAME, onEvent);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- listeners montes une seule fois

  useEffect(() => {
    const rotateSession = () => {
      if (sessionRef.current) postJson('/api/analytics/v3/close', sessionRef.current, true).catch(() => {});
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SEQ_KEY);
      window.location.reload();
    };
    window.addEventListener('secondevie:analytics-consent-changed', rotateSession);
    return () => window.removeEventListener('secondevie:analytics-consent-changed', rotateSession);
  }, []);

  useEffect(() => {
    const close = () => {
      persistBuffer().catch(() => {});
      if (sessionRef.current) postJson('/api/analytics/v3/close', sessionRef.current, true).catch(() => {});
    };
    window.addEventListener('pagehide', close);
    return () => window.removeEventListener('pagehide', close);
  }, []);

  return null;
}
