export const CONSENT_KEY = 'secondevie:cookie-consent:v1';
export const CONSENT_VERSION = 1;
export const OPEN_COOKIE_PREFERENCES = 'secondevie:open-cookie-preferences';
const listeners = new Set();
let memoryValue = '';
let memoryOnly = false;
let expiryTimer;

export function parseConsent(raw, now = Date.now()) {
  try {
    const value = JSON.parse(raw);
    if (value.version !== CONSENT_VERSION || typeof value.analytics !== 'boolean'
      || typeof value.external !== 'boolean' || !Number.isFinite(value.savedAt)
      || !Number.isFinite(value.expiresAt) || value.savedAt > now
      || value.expiresAt <= now || value.expiresAt <= value.savedAt) return null;
    const maximum = new Date(value.savedAt);
    maximum.setMonth(maximum.getMonth() + 6);
    if (value.expiresAt > maximum.getTime()) return null;
    return value;
  } catch { return null; }
}

export function getConsentSnapshot() {
  if (typeof window === 'undefined') return '';
  let raw = memoryValue;
  try { if (!memoryOnly) raw = window.localStorage.getItem(CONSENT_KEY) || ''; } catch { /* Memory for restricted storage. */ }
  return parseConsent(raw) ? raw : '';
}

export function hasConsent(category) {
  return parseConsent(getConsentSnapshot())?.[category] === true;
}

function clearAnalyticsStorage() {
  for (const storageName of ['localStorage', 'sessionStorage']) {
    for (const key of ['analytics_session_id', 'analytics_session_token', 'analytics_session_closed_at']) {
      try { window[storageName].removeItem(key); } catch { /* Storage may be blocked. */ }
    }
  }
  const runtime = window.__svAnalyticsEventRuntimeV1;
  if (runtime) runtime.queue.length = 0;
}

function notify() {
  clearTimeout(expiryTimer);
  if (!hasConsent('analytics')) clearAnalyticsStorage();
  listeners.forEach((listener) => listener());
  const consent = parseConsent(getConsentSnapshot());
  // A browser timer is limited to a signed 32-bit delay.
  if (consent && listeners.size) expiryTimer = setTimeout(notify, Math.min(consent.expiresAt - Date.now() + 1, 2147483647));
}

function onStorage(event) {
  if (event.key === CONSENT_KEY || event.key === null) notify();
}

export function subscribeConsent(listener) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', notify);
    window.addEventListener('pageshow', notify);
  }
  notify();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      clearTimeout(expiryTimer);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', notify);
      window.removeEventListener('pageshow', notify);
    }
  };
}

export function saveConsent({ analytics = false, external = false }) {
  const savedAt = Date.now();
  const expiry = new Date(savedAt);
  expiry.setMonth(expiry.getMonth() + 6);
  memoryValue = JSON.stringify({ version: CONSENT_VERSION, savedAt, expiresAt: expiry.getTime(), analytics: analytics === true, external: external === true });
  let persisted = true;
  try { window.localStorage.setItem(CONSENT_KEY, memoryValue); } catch { persisted = false; }
  memoryOnly = !persisted;
  notify();
  return persisted;
}

export function openCookiePreferences() {
  window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES));
}
