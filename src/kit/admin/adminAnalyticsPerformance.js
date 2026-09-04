// Diagnostic local borne: aucun envoi reseau, identifiant utilisateur ou payload.
const KINDS = new Set(['open', 'refresh', 'period']);
const PHASES = new Set([
  'component.commit', 'cache.overview', 'cache.sessions', 'chunk',
  'callable.prepare', 'overview.request', 'sessions.request',
  'overview.ready', 'overview.error', 'kpi.frame',
  'server.access', 'server.read', 'server.audit',
]);
const SOURCES = new Set(['memory', 'disk', 'server', 'none']);

export function createDataPerformanceRecorder({
  now = () => performance.now(),
  wallTime = () => Date.now(),
  limit = 20,
} = {}) {
  const traces = [];
  let sequence = 0;
  let active = null;
  const validLimit = Math.max(1, Math.min(20, Number.isSafeInteger(limit) ? limit : 20));
  const mark = (phase, { trace = active, source, durationMs, outcome = 'ok' } = {}) => {
    if (!trace || !traces.includes(trace) || !PHASES.has(phase) || trace.events.length >= 40) return;
    trace.events.push({
      phase,
      atMs: Math.max(0, now() - trace.startedAt),
      ...(SOURCES.has(source) ? { source } : {}),
      ...(Number.isFinite(durationMs) ? { durationMs: Math.max(0, durationMs) } : {}),
      outcome: outcome === 'error' ? 'error' : 'ok',
    });
  };
  return {
    start(kind = 'open') {
      active = {
        sequence: ++sequence,
        kind: KINDS.has(kind) ? kind : 'open',
        startedAt: now(),
        startedAtUnixMs: wallTime(),
        events: [],
      };
      traces.push(active);
      if (traces.length > validLimit) traces.shift();
      return active;
    },
    current: () => active,
    mark,
    async span(phase, work, options = {}) {
      const trace = options.trace ?? active;
      const started = now();
      try {
        const result = await work();
        mark(phase, { ...options, trace, durationMs: now() - started });
        return result;
      } catch (error) {
        mark(phase, { ...options, trace, durationMs: now() - started, outcome: 'error' });
        throw error;
      }
    },
    snapshot: () => traces.map((trace) => ({
      ...trace,
      events: trace.events.map((event) => ({ ...event })),
    })),
    clear() { traces.length = 0; active = null; },
  };
}

export function summarizeDataResources(entries, startedAt) {
  return entries.filter((entry) => entry.startTime >= startedAt).flatMap((entry) => {
    let url;
    try { url = new URL(entry.name); } catch { return []; }
    let family = null;
    if (url.hostname.endsWith('.cloudfunctions.net') && /\/getAnalyticsAdminGen2$/.test(url.pathname)) family = 'analytics-http';
    else if (['securetoken.googleapis.com', 'identitytoolkit.googleapis.com'].includes(url.hostname)) family = 'auth-http';
    else if (url.hostname === 'content-firebaseappcheck.googleapis.com') family = 'appcheck-http';
    else if (['www.google.com', 'www.gstatic.com', 'www.recaptcha.net', 'recaptchaenterprise.googleapis.com'].includes(url.hostname)
      && /recaptcha/.test(url.pathname)) family = 'recaptcha-resource';
    if (!family) return [];
    return [{
      family,
      atMs: Math.max(0, entry.startTime - startedAt),
      durationMs: Math.max(0, entry.duration),
      // Une valeur zero cross-origin peut signifier "non expose", pas zero cout.
      transferBytes: entry.transferSize > 0 ? entry.transferSize : null,
    }];
  }).slice(-80);
}

const recorder = createDataPerformanceRecorder();
export const dataPerformance = recorder;

export function recordDataServerTimings(timings, trace) {
  for (const [field, phase] of [['accessMs', 'server.access'], ['readMs', 'server.read'], ['auditMs', 'server.audit']]) {
    if (Number.isFinite(timings?.[field]) && timings[field] >= 0 && timings[field] <= 120000) {
      recorder.mark(phase, { trace, durationMs: timings[field] });
    }
  }
}

export function startDataPerformance(kind = 'open') {
  const trace = recorder.start(kind);
  if (typeof window !== 'undefined') {
    // Lecture manuelle par l'operateur; pas d'upload automatique, pas de storage.
    window.__svDataPerformance = Object.freeze({
      snapshot: () => {
        const traces = recorder.snapshot();
        const resources = performance.getEntriesByType('resource');
        const now = performance.now();
        return traces.map((item, index) => ({
          ...item,
          resources: summarizeDataResources(resources.filter((entry) => (
            entry.startTime < (traces[index + 1]?.startedAt ?? now)
          )), item.startedAt),
        }));
      },
      clear: () => recorder.clear(),
    });
  }
  return trace;
}
