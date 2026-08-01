'use client';

export const AUTH_REDIRECT_KEYS = [
  'kit_auth_redirect_pending',
  'kit_google_redirect_pending',
];

const REDIRECT_STATE_TTL_MS = 10 * 60 * 1000;

const getBrowserStorages = () => {
  if (typeof window === 'undefined') return [];
  const storages = [];
  for (const storageName of ['sessionStorage', 'localStorage']) {
    try {
      const storage = window[storageName];
      if (storage) storages.push(storage);
    } catch {
      // Some hardened browsers throw while accessing the storage property itself.
    }
  }
  return storages;
};

const readPendingValue = (storage, key) => {
  try {
    const raw = storage.getItem(key);
    if (raw === 'true') return true;
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.pending === true
      && Number.isFinite(Number(parsed?.createdAt))
      && Date.now() - Number(parsed.createdAt) <= REDIRECT_STATE_TTL_MS;
  } catch {
    return false;
  }
};

export const markAuthRedirectPending = () => {
  if (typeof window === 'undefined') return false;
  const payload = JSON.stringify({ pending: true, createdAt: Date.now() });
  for (const storage of getBrowserStorages()) {
    try {
      storage.setItem(AUTH_REDIRECT_KEYS[0], payload);
      return true;
    } catch {
      // Try the next browser storage. Firebase may still use in-memory persistence.
    }
  }
  return false;
};

export const hasAuthRedirectPending = () => (
  getBrowserStorages().some((storage) => (
    AUTH_REDIRECT_KEYS.some((key) => readPendingValue(storage, key))
  ))
);

export const clearAuthRedirectPending = () => {
  for (const storage of getBrowserStorages()) {
    for (const key of AUTH_REDIRECT_KEYS) {
      try {
        storage.removeItem(key);
      } catch {
        // A restricted storage must not mask the Firebase redirect result.
      }
    }
  }
};
