'use client';

const runtime = globalThis.__svAdminDataCacheRuntime || {
  entries: new Map(),
  ownerUid: null,
  generation: 0,
  listeners: new Set(),
};

globalThis.__svAdminDataCacheRuntime = runtime;
runtime.preferences ||= new Map();

export const getAdminPreference = (key, fallback) => runtime.ownerUid
  ? (runtime.preferences.get(key) ?? fallback) : fallback;
export const setAdminPreference = (key, value) => {
  if (runtime.ownerUid) runtime.preferences.set(key, value);
};

export const getAdminCachedData = (key) => {
  if (!runtime.ownerUid) return null;
  const entry = runtime.entries.get(key);
  if (entry && Date.now() - entry.updatedAt >= entry.maxAgeMs) return null;
  return entry?.data ?? null;
};

export const loadAdminCachedData = async (
  key,
  loader,
  { maxAgeMs = 120_000, force = false } = {}
) => {
  if (!runtime.ownerUid) throw Object.assign(new Error('ADMIN_AUTHORIZATION_REQUIRED'), { code: 'admin/authorization-changed' });
  const now = Date.now();
  const generation = runtime.generation;
  const current = runtime.entries.get(key);

  if (!force && current?.data != null && now - current.updatedAt < maxAgeMs) {
    return current.data;
  }
  if (current?.promise) return current.promise;

  let promise;
  promise = Promise.resolve()
    .then(loader)
    .then((data) => {
      if (runtime.generation !== generation) throw Object.assign(new Error('ADMIN_AUTHORIZATION_CHANGED'), { code: 'admin/authorization-changed' });
      if (runtime.entries.get(key)?.promise !== promise) throw Object.assign(new Error('ADMIN_READ_INVALIDATED'), { code: 'admin/read-invalidated' });
      runtime.entries.set(key, {
        data,
        updatedAt: Date.now(),
        promise: null,
        maxAgeMs,
      });
      return data;
    })
    .catch((error) => {
      if (runtime.generation === generation && ['permission-denied', 'functions/permission-denied', 'unauthenticated', 'functions/unauthenticated'].includes(error?.code)) setAdminCacheAuthorization(null);
      if (runtime.entries.get(key)?.promise !== promise) throw error;
      runtime.entries.set(key, {
        data: current?.data ?? null,
        updatedAt: current?.updatedAt ?? 0,
        promise: null,
        maxAgeMs,
      });
      throw error;
    });

  if (runtime.entries.size >= 100 && !runtime.entries.has(key)) runtime.entries.delete(runtime.entries.keys().next().value);
  runtime.entries.set(key, {
    data: current?.data ?? null,
    updatedAt: current?.updatedAt ?? 0,
    promise,
    maxAgeMs,
  });

  return promise;
};

export const invalidateAdminCachedData = (key) => {
  runtime.entries.delete(key);
};

export const invalidateAdminCachedPrefix = (prefix) => {
  for (const key of runtime.entries.keys()) if (key.startsWith(prefix)) runtime.entries.delete(key);
};

export const clearAdminDataCache = () => {
  runtime.generation += 1;
  runtime.entries.clear();
  runtime.preferences.clear();
  runtime.listeners.forEach((listener) => listener());
};

export const subscribeAdminCacheGeneration = (listener) => { runtime.listeners.add(listener); return () => runtime.listeners.delete(listener); };
export const getAdminCacheGeneration = () => runtime.generation;

export const setAdminCacheAuthorization = (ownerUid) => {
  if (runtime.ownerUid === ownerUid) return;
  runtime.ownerUid = ownerUid;
  clearAdminDataCache();
};
