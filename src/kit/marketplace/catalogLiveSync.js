// Retries follow a real signal or a page/connectivity event; no idle polling.
export const CATALOG_RETRY_DELAYS = [0, 500, 1500, 4000, 10000, 20000, 30000];

export function isVersionAtLeast(candidate, expected) {
  if (!Number.isInteger(Number(candidate?.revision)) || Number(candidate.revision) < 1) return false;
  if (Number(expected?.revision) > Number(candidate.revision)) return false;
  return Boolean(candidate?.aggregateSha256) && (
    candidate.aggregateSha256 === expected?.aggregateSha256
    || (Number(expected?.revision) > 0 && Number(candidate.revision) >= Number(expected.revision))
  );
}

export function createCatalogVersionChannel() {
  let latest = null;
  const listeners = new Set();
  return {
    publish(version) {
      if (!version?.aggregateSha256) return;
      if (latest && Number(version.revision) < Number(latest.revision)) return;
      latest = version;
      for (const listener of listeners) listener(version);
    },
    subscribe(listener) {
      listeners.add(listener);
      if (latest) listener(latest);
      return () => listeners.delete(listener);
    },
  };
}

export const catalogVersionChannel = createCatalogVersionChannel();

export function abortableDelay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(signal.reason); return; }
    const onAbort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export async function fetchCatalogWithRetry(url, {
  signal,
  accept = () => true,
  fetcher = fetch,
  delay = abortableDelay,
  delays = CATALOG_RETRY_DELAYS,
} = {}) {
  for (const duration of delays) {
    if (signal.aborted) return null;
    try {
      if (duration) await delay(duration, signal);
      if (signal.aborted) return null;
      const response = await fetcher(url, {
        cache: 'no-store',
        headers: { accept: 'application/json' },
        signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
      });
      if (!response.ok) continue;
      const payload = await response.json();
      if (signal.aborted) return null;
      if (accept(payload)) return payload;
    } catch {
      // A cancelled job stops; transient failures consume a bounded retry.
    }
  }
  return null;
}
