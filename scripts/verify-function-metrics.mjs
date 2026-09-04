// Read-only: compare the dashboard collector against independent minute-level
// Cloud Monitoring count series on exactly the same interval and service.
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { collectFunctionMetrics, googlePages, metricUrl } from '../src/lib/server/functionMetricsCore.mjs';

const token = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const snapshot = await collectFunctionMetrics({ token });
const comparisons = [];
for (const row of snapshot.rows.filter(row => row.generation === 2 && row.calls).slice(0, 3)) {
  const url = metricUrl('run.googleapis.com/request_count', snapshot.start, snapshot.end, 60, { extra: ` AND resource.labels.service_name="${row.service}" AND resource.labels.location="${row.region}"`, group: ['metric.labels.response_code'] });
  const raw = await googlePages(url, token, 'timeSeries');
  const total = raw.reduce((sum, series) => sum + series.points.reduce((n, point) => n + Number(point.value.int64Value || point.value.doubleValue || 0), 0), 0);
  assert.equal(total, row.calls, `Count mismatch for ${row.name}`);
  const latencyUrl = metricUrl('run.googleapis.com/request_latencies', snapshot.start, snapshot.end, 60, { extra: ` AND resource.labels.service_name="${row.service}" AND resource.labels.location="${row.region}"` });
  const latencySeries = await googlePages(latencyUrl, token, 'timeSeries');
  let samples = 0;
  let sum = 0;
  for (const series of latencySeries) for (const point of series.points) {
    const distribution = point.value.distributionValue;
    samples += Number(distribution.count || 0);
    sum += Number(distribution.count || 0) * Number(distribution.mean || 0);
  }
  const meanMs = samples ? sum / samples : null;
  assert.equal(samples, row.samples);
  assert.ok(Math.abs(meanMs - row.meanMs) < 0.00001, `Mean mismatch for ${row.name}`);
  comparisons.push({ name: row.name, dashboardCalls: row.calls, minuteSeriesCalls: total, dashboardMeanMs: row.meanMs, minuteSeriesMeanMs: meanMs, exact: true });
}
await mkdir('logs/function-metrics', { recursive: true });
await writeFile('logs/function-metrics/first-load.json', JSON.stringify(snapshot, null, 2));
await writeFile('logs/function-metrics/verification.json', JSON.stringify({ start: snapshot.start, end: snapshot.end, inventory: snapshot.rows.length, seriesRead: snapshot.seriesRead, comparisons }, null, 2));
console.log(JSON.stringify({ inventory: snapshot.rows.length, seriesRead: snapshot.seriesRead, comparisons }, null, 2));
