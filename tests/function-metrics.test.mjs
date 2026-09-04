import test from 'node:test';
import assert from 'node:assert/strict';
import { googlePages, summarizeMetrics, metricUrl, collectFunctionMetrics } from '../src/lib/server/functionMetricsCore.mjs';
import { readCachedFunctionMetrics } from '../src/lib/server/functionMetricsCache.mjs';

const inventory = [{ name: 'projects/p/locations/europe-west1/functions/a', environment: 'GEN_2', serviceConfig: { service: 'projects/p/locations/europe-west1/services/a' } }];
const series = (value, labels = {}) => ({ resource: { labels: { location: 'europe-west1', service_name: 'a' } }, metric: { labels }, points: [{ value }] });
test('aggregates revisions, separates 4xx, weights latency by samples and preserves missing data', () => {
  const counts = [series({ int64Value: '20' }, { response_code: '200' }), series({ int64Value: '3' }, { response_code: '403' }), series({ int64Value: '2' }, { response_code: '503' })];
  const latencies = [series({ distributionValue: { count: '20', mean: 100 } }), series({ distributionValue: { count: '10', mean: 400 } })];
  const [row] = summarizeMetrics(inventory, counts, latencies, [series({ doubleValue: 500 })]);
  assert.equal(row.calls, 25); assert.equal(row.errors, 2); assert.equal(row.rejected, 3);
  assert.equal(row.meanMs, 200); assert.equal(row.p95Ms, 500);
  assert.equal(summarizeMetrics(inventory, [], [], [])[0].calls, null);
  assert.equal(summarizeMetrics(inventory, counts, latencies.slice(0, 1), [series({ doubleValue: 500 })])[0].p95Ms, null);
});

test('shared cache and lease prevent repeated Monitoring reads; stale data stays explicit', async () => {
  let stored = {};
  let reads = 0;
  const db = { collection: () => ({ doc: () => ({}) }), runTransaction: async fn => fn({ get: async () => ({ data: () => stored }), set: (_ref, data, options) => { stored = options?.merge ? { ...stored, ...data } : data; } }) };
  const args = { db, getToken: async () => 'test', now: 1000000, collect: async ({ now }) => { reads++; return { schemaVersion: 1, fetchedAt: new Date(now).toISOString(), rows: [] }; } };
  await readCachedFunctionMetrics('24h', args);
  const cached = await readCachedFunctionMetrics('24h', args);
  assert.equal(reads, 1); assert.equal(cached.cached, true);
  stored.leaseUntil = 9999999;
  const stale = await readCachedFunctionMetrics('24h', { ...args, now: 2000000 });
  assert.equal(stale.stale, true); assert.equal(reads, 1);
  stored = { leaseUntil: 9999999 };
  await assert.rejects(readCachedFunctionMetrics('24h', args), /refresh_in_progress/);
});
test('Google computes percentile after merging distributions, never mean of daily percentiles', () => {
  const url = metricUrl('run.googleapis.com/request_latencies', '2026-09-01T00:00:00Z', '2026-09-02T00:00:00Z', 86400, { reducer: 'REDUCE_PERCENTILE_95' });
  assert.equal(url.searchParams.get('aggregation.perSeriesAligner'), 'ALIGN_SUM');
  assert.equal(url.searchParams.get('aggregation.crossSeriesReducer'), 'REDUCE_PERCENTILE_95');
  assert.deepEqual(url.searchParams.getAll('aggregation.groupByFields'), ['resource.labels.service_name', 'resource.labels.location']);
});
test('pagination never silently presents a partial inventory', async () => {
  let calls = 0;
  const data = await googlePages('https://example.test', 'unused', 'functions', async () => ({ ok: true, json: async () => ++calls === 1 ? { functions: [1], nextPageToken: 'next' } : { functions: [2] } }));
  assert.deepEqual(data, [1, 2]);
  await assert.rejects(googlePages('https://example.test', 'unused', 'functions', async () => ({ ok: true, json: async () => ({ unreachable: ['region'] }) })), /incomplete/);
  await assert.rejects(collectFunctionMetrics({ token: '', period: 'unbounded' }), /invalid_period/);
});
