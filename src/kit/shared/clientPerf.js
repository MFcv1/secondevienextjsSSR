const shouldLogClientPerf = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname || '';
  return host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.hosted.app') ||
    process.env.NODE_ENV !== 'production';
};

export const startClientPerf = () => (
  typeof performance !== 'undefined' ? performance.now() : Date.now()
);

export const logClientPerf = (name, startedAt, extra = {}) => {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const elapsedMs = Math.max(0, Math.round(now - startedAt));

  if (typeof performance !== 'undefined' && typeof performance.measure === 'function') {
    const markName = `${name}:${now}`;
    try {
      performance.mark(markName);
      performance.measure(name, { start: startedAt, end: now });
      performance.clearMarks(markName);
    } catch {
      // Some browsers do not support numeric measure options; console timing remains enough.
    }
  }

  if (shouldLogClientPerf()) {
    console.info('[client_perf]', { name, elapsedMs, ...extra });
  }

  return elapsedMs;
};
