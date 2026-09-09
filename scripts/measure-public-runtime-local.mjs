import { execFileSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const base = new URL(process.argv[2] || 'http://127.0.0.1:3187');
if (base.protocol !== 'http:' || !['127.0.0.1', '[::1]'].includes(base.hostname) || base.username || base.password) {
  throw new Error('LOCAL_LOOPBACK_ONLY');
}
const pid = process.argv[3];
if (pid && !/^[1-9]\d*$/.test(pid)) throw new Error('INVALID_PID');
const paths = ['/', '/api/catalog', '/api/catalog/version'];
const samples = [];
const resources = [];
const percentile = (values, p) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * p) - 1];
let errors = 0;
let stopped = null;
const campaignStarted = Date.now();
for (const concurrency of [1, 4, 8, 16]) {
  if (stopped) break;
  const start = Date.now();
  let issued = 0;
  let windowStart = start;
  let windowSamples = [];
  let slowWindows = 0;
  while (issued < 120 && Date.now() - start < 60000 && !stopped) {
    const count = Math.min(concurrency, 120 - issued);
    const batch = await Promise.all(Array.from({ length: count }, async () => {
      const path = paths[issued++ % paths.length];
      const started = performance.now();
      try {
        const response = await fetch(new URL(path, base), { redirect: 'error', signal: AbortSignal.timeout(10000) });
        const bytes = (await response.arrayBuffer()).byteLength;
        if (!response.ok) errors++;
        return { concurrency, path, status: response.status, ms: performance.now() - started, bytes };
      } catch {
        errors++;
        return { concurrency, path, status: 0, ms: performance.now() - started, bytes: 0 };
      }
    }));
    samples.push(...batch);
    windowSamples.push(...batch.map(sample => sample.ms));
    if (pid) {
      const [cpuPercent, rssKiB] = execFileSync('ps', ['-p', pid, '-o', '%cpu=', '-o', 'rss='], { encoding: 'utf8' })
        .trim().split(/\s+/).map(Number);
      resources.push({ elapsedMs: Date.now() - campaignStarted, cpuPercent, rssMiB: rssKiB / 1024 });
      if (rssKiB / 1024 >= 384) stopped = 'RSS_75_PERCENT_OF_512_MIB';
    }
    if (errors >= 3) stopped = 'THREE_ERRORS';
    if (Date.now() - windowStart >= 10000) {
      slowWindows = windowSamples.length >= 30 && percentile(windowSamples, 0.95) > 2000 ? slowWindows + 1 : 0;
      if (slowWindows >= 2) stopped = 'TWO_SLOW_WINDOWS';
      windowStart = Date.now(); windowSamples = [];
    }
  }
}
const groups = [1, 4, 8, 16].flatMap(concurrency => paths.map(path => {
  const selected = samples.filter(sample => sample.concurrency === concurrency && sample.path === path);
  const times = selected.map(sample => sample.ms);
  return { concurrency, path, n: times.length, p50Ms: times.length ? percentile(times, 0.5) : null,
    p95Ms: times.length >= 30 ? percentile(times, 0.95) : null, maxMs: times.length ? Math.max(...times) : null,
    errors: selected.filter(sample => sample.status !== 200).length };
}));
console.log(JSON.stringify({
  date: new Date().toISOString(), node: process.version, platform: process.platform, arch: process.arch,
  kind: 'local-production-build-fixture', cloudQualified: false, constrainedCpuMemory: false,
  durationMs: Date.now() - campaignStarted, requests: samples.length, errors, stopped,
  peakSampledRssMiB: resources.length ? Math.max(...resources.map(sample => sample.rssMiB)) : null,
  firstRequest: samples[0], groups, resources, samples,
}, null, 2));
if (stopped) process.exitCode = 1;
