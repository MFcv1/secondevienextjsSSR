'use client';

const runtime = globalThis.__svAdminDataCacheRuntime || {
  entries: new Map(),
};

globalThis.__svAdminDataCacheRuntime = runtime;

export const getAdminCachedData = (key) => {
  const entry = runtime.entries.get(key);
  return entry?.data ?? null;
};

export const loadAdminCachedData = async (
  key,
  loader,
  { maxAgeMs = 120_000, force = false } = {}
) => {
  const now = Date.now();
  const current = runtime.entries.get(key);

  if (!force && current?.data != null && now - current.updatedAt < maxAgeMs) {
    return current.data;
  }
  if (current?.promise) return current.promise;

  const promise = Promise.resolve()
    .then(loader)
    .then((data) => {
      runtime.entries.set(key, {
        data,
        updatedAt: Date.now(),
        promise: null,
      });
      return data;
    })
    .catch((error) => {
      runtime.entries.set(key, {
        data: current?.data ?? null,
        updatedAt: current?.updatedAt ?? 0,
        promise: null,
      });
      throw error;
    });

  runtime.entries.set(key, {
    data: current?.data ?? null,
    updatedAt: current?.updatedAt ?? 0,
    promise,
  });

  return promise;
};

export const invalidateAdminCachedData = (key) => {
  runtime.entries.delete(key);
};

export const clearAdminDataCache = () => {
  runtime.entries.clear();
};
