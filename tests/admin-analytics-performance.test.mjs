import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDataPerformanceRecorder, summarizeDataResources, startDataPerformance, dataPerformance } from '../src/kit/admin/adminAnalyticsPerformance.js';
import { buildRuntimeAudit, parseRuntimeAuditArgs, readRuntimeCloud } from '../scripts/audit-interactive-runtime.mjs';

test('le chronometre distingue preparation et requete sans alterer la reponse', async () => {
  let now = 0;
  const recorder = createDataPerformanceRecorder({ now: () => now, wallTime: () => 100 });
  const trace = recorder.start('open');
  now = 20;
  await recorder.span('callable.prepare', async () => { now += 30; });
  const result = await recorder.span('overview.request', async () => { now += 6000; return 42; });
  recorder.mark('kpi.frame', { trace, source: 'server' });
  assert.equal(result, 42);
  assert.deepEqual(recorder.snapshot()[0].events.map((event) => event.durationMs), [30, 6000, undefined]);
  assert.equal(recorder.snapshot()[0].events.at(-1).atMs, 6050);
});

test('une reponse ancienne conserve sa trace meme si un autre onglet est selectionne', async () => {
  let resolve;
  const recorder = createDataPerformanceRecorder({ now: () => 0, wallTime: () => 0 });
  const first = recorder.start();
  const pending = recorder.span('overview.request', () => new Promise((done) => { resolve = done; }), { trace: first });
  recorder.start('period');
  resolve();
  await pending;
  assert.equal(recorder.snapshot()[0].events.length, 1);
  assert.equal(recorder.snapshot()[1].events.length, 0);
});

test('le diagnostic est borne, expurge et ses erreurs restent celles de la fonction', async () => {
  const recorder = createDataPerformanceRecorder({ now: () => 0, wallTime: () => 0 });
  for (let i = 0; i < 50; i += 1) recorder.start('secret@invalid.test');
  for (let i = 0; i < 100; i += 1) recorder.mark('component.commit', { source: 'token-secret' });
  recorder.mark('secret-payload');
  assert.equal(recorder.snapshot().length, 20);
  assert.equal(recorder.snapshot().at(-1).events.length, 40);
  assert.doesNotMatch(JSON.stringify(recorder.snapshot()), /secret/);
  recorder.clear();
  recorder.start();
  const error = new Error('confidential');
  await assert.rejects(recorder.span('overview.request', () => Promise.reject(error)), (caught) => caught === error);
  assert.doesNotMatch(JSON.stringify(recorder.snapshot()), /confidential/);
  assert.equal(recorder.snapshot()[0].events[0].outcome, 'error');
});

test('les ressources conservent uniquement famille et duree, jamais URL ou token', () => {
  const resources = summarizeDataResources([
    { name: 'https://securetoken.googleapis.com/v1/token?key=secret', startTime: 12, duration: 50, transferSize: 0 },
    { name: 'https://europe-west1-example.cloudfunctions.net/getAnalyticsAdminGen2', startTime: 20, duration: 6200, transferSize: 12 },
    { name: 'https://personal.example/private', startTime: 20, duration: 10 },
    { name: 'https://securetoken.googleapis.com/v1/token', startTime: 1, duration: 5 },
  ], 10);
  assert.equal(resources.length, 2);
  assert.equal(resources[0].transferBytes, null);
  assert.equal(resources[1].durationMs, 6200);
  assert.doesNotMatch(JSON.stringify(resources), /secret|https|private/);
});

test('effacer le diagnostic interdit a une reponse tardive de le repeupler', async () => {
  const recorder = createDataPerformanceRecorder();
  recorder.start();
  let resolve;
  const pending = recorder.span('overview.request', () => new Promise((done) => { resolve = done; }));
  recorder.clear();
  resolve('ok');
  assert.equal(await pending, 'ok');
  assert.deepEqual(recorder.snapshot(), []);
  assert.equal(recorder.current(), null);
});

test('la console expose seulement une copie bornee et peut tout effacer', () => {
  const previousWindow = globalThis.window;
  globalThis.window = {};
  try {
    dataPerformance.clear();
    startDataPerformance();
    dataPerformance.mark('component.commit');
    const snapshot = window.__svDataPerformance.snapshot();
    snapshot[0].events[0].phase = 'changed';
    assert.equal(window.__svDataPerformance.snapshot()[0].events[0].phase, 'component.commit');
    window.__svDataPerformance.clear();
    assert.deepEqual(window.__svDataPerformance.snapshot(), []);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    dataPerformance.clear();
  }
});

test('instrumentation sans reseau ni stockage, lecture HTTP explicite et UI sans fausse confiance', () => {
  const recorder = readFileSync(new URL('../src/kit/admin/adminAnalyticsPerformance.js', import.meta.url), 'utf8');
  assert.doesNotMatch(recorder, /fetch\(|sendBeacon|httpsCallable|setDoc\(|addDoc\(|localStorage|indexedDB/);
  const ui = readFileSync(new URL('../src/kit/admin/AdminAnalytics.jsx', import.meta.url), 'utf8');
  assert.match(ui, /Visiteurs estimés/);
  assert.match(ui, /En attente des données/);
});

const entry = (method, latency, status = 200) => ({
  timestamp: '2026-09-03T21:12:32Z',
  resource: { labels: { service_name: 'getanalyticsadmingen2' } },
  httpRequest: { requestMethod: method, latency, status, requestUrl: 'private' },
});

test('le rapport ne masque pas OPTIONS derriere un POST rapide', () => {
  const report = buildRuntimeAudit({ logs: [entry('OPTIONS', '5.788s', 204), entry('POST', '0.417s'), entry('POST', '0.220s')] });
  assert.equal(report.services[0].methods.OPTIONS.maxMs, 5788);
  assert.equal(report.services[0].methods.POST.p95Ms, 417);
  assert.equal(report.services[0].methods.POST.sufficientForP95, false);
  assert.equal(report.billingMeasured, false);
  assert.doesNotMatch(JSON.stringify(report), /private/);
});

test('fenetre, limite, erreurs et inventaire incomplet restent explicites', () => {
  const report = buildRuntimeAudit({
    functions: [null], logs: [entry('POST', '1s', 403), entry('POST', '2s', 429), entry('POST', '3s', 503)],
    from: '2026-09-03T21:00:00Z', to: '2026-09-03T22:00:00Z', limit: 3,
  });
  assert.equal(report.truncated, true);
  assert.equal(report.services[0].runtime, null);
  assert.equal(report.services[0].methods.POST.rejected403, 1);
  assert.equal(report.services[0].methods.POST.throttled429, 1);
  assert.equal(report.services[0].methods.POST.serverErrors, 1);
  assert.equal(buildRuntimeAudit({ logs: [entry('POST', '1s')], from: '2026-09-04', to: '2026-09-05' }).services[0].methods.POST.requests, 0);
});

test('aucun acces cloud implicite, aucune mutation, fenetre 24 h maximum', () => {
  assert.throws(() => parseRuntimeAuditArgs([]));
  assert.throws(() => parseRuntimeAuditArgs(['--cloud', '--from', '2026-09-01', '--to', '2026-09-04', '--services', 'test']));
  assert.throws(() => parseRuntimeAuditArgs(['--cloud', '--from', '2026-09-03', '--to', '2026-09-04', '--services', 'bad" OR true']));
  assert.throws(() => parseRuntimeAuditArgs(['--apply']));
  const options = parseRuntimeAuditArgs(['--cloud', '--from', '2026-09-03', '--to', '2026-09-04', '--services', 'getanalyticsadmingen2']);
  const calls = [];
  readRuntimeCloud(options, (args) => { calls.push(args); return []; });
  assert.deepEqual(calls.map((args) => args.slice(0, 2)), [['functions', 'list'], ['logging', 'read']]);
  assert.ok(calls.every((args) => args.includes('--project=secondevienextjsssr')));
  assert.match(calls[1][2], /run.googleapis.com%2Frequests/);
  assert.doesNotMatch(calls[1][2], /requestMethod="POST"/);
});
