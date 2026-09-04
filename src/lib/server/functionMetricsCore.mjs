// Shared by the server reader and the read-only Cloud Monitoring qualification.
export const METRICS_PROJECT = 'secondevienextjsssr';
export const PERIODS = { '24h': 86400, '7d': 604800, '30d': 2592000 };

export async function googlePages(url, token, key, fetcher = fetch) {
  const rows = [];
  for (let page = 0; page < 12; page++) {
    const response = await fetcher(url, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(25000), cache: 'no-store' });
    if (!response.ok) throw new Error(`google_${response.status}`);
    const data = await response.json();
    if (data.unreachable?.length) throw new Error('inventory_incomplete');
    rows.push(...(data[key] || []));
    if (rows.length > 10000) throw new Error('metrics_limit');
    if (!data.nextPageToken) return rows;
    url = new URL(url);
    url.searchParams.set('pageToken', data.nextPageToken);
  }
  throw new Error('metrics_truncated');
}

export function metricUrl(metric, start, end, seconds, { reducer = 'REDUCE_SUM', extra = '', group = [] } = {}) {
  const url = new URL(`https://monitoring.googleapis.com/v3/projects/${METRICS_PROJECT}/timeSeries`);
  const gen1 = metric.startsWith('cloudfunctions');
  const resource = gen1 ? 'cloud_function' : 'cloud_run_revision';
  const service = gen1 ? 'resource.labels.function_name' : 'resource.labels.service_name';
  const region = gen1 ? 'resource.labels.region' : 'resource.labels.location';
  Object.entries({ filter: `metric.type="${metric}" AND resource.type="${resource}"${extra}`, 'interval.startTime': start, 'interval.endTime': end, 'aggregation.alignmentPeriod': `${seconds}s`, 'aggregation.perSeriesAligner': 'ALIGN_SUM', 'aggregation.crossSeriesReducer': reducer, pageSize: '1000' }).forEach(([key, value]) => url.searchParams.set(key, value));
  [service, region, ...group].forEach(value => url.searchParams.append('aggregation.groupByFields', value));
  return url;
}

const keyOf = series => `${series.resource.labels.location || series.resource.labels.region}/${series.resource.labels.service_name || series.resource.labels.function_name}`;
const numeric = point => Number(point.value?.int64Value ?? point.value?.doubleValue ?? 0);

export function summarizeMetrics(inventory, counts, latencies, percentiles) {
  const countMap = new Map();
  for (const series of counts) {
    const key = keyOf(series);
    const state = countMap.get(key) || { calls: 0, errors: 0, rejected: 0 };
    const n = series.points.reduce((sum, point) => sum + numeric(point), 0);
    const code = Number(series.metric?.labels?.response_code || 0);
    const status = series.metric?.labels?.status;
    state.calls += n;
    if (code >= 500 || (status && status !== 'ok')) state.errors += n;
    if (code >= 400 && code < 500) state.rejected += n;
    countMap.set(key, state);
  }
  const latencyMap = new Map();
  for (const series of latencies) {
    const state = latencyMap.get(keyOf(series)) || { count: 0, sum: 0 };
    const factor = series.metric?.type?.startsWith('cloudfunctions') ? 0.000001 : 1;
    for (const point of series.points) {
      const dist = point.value?.distributionValue;
      if (dist) { const count = Number(dist.count || 0); state.count += count; state.sum += count * Number(dist.mean || 0) * factor; }
    }
    latencyMap.set(keyOf(series), state);
  }
  const p95Map = new Map(percentiles.map(series => [keyOf(series), numeric(series.points[0]) * (series.metric?.type?.startsWith('cloudfunctions') ? 0.000001 : 1)]));
  return inventory.map(fn => {
    const parts = fn.name.split('/');
    const name = parts.at(-1);
    const region = parts[3];
    const service = fn.serviceConfig?.service?.split('/').at(-1) || name;
    const key = `${region}/${service}`;
    const count = countMap.get(key);
    const latency = latencyMap.get(key);
    return { name, service, region, generation: fn.environment === 'GEN_2' ? 2 : 1, state: fn.state || fn.status, ...count,
      calls: count?.calls ?? null, errors: count?.errors ?? null, rejected: count?.rejected ?? null,
      samples: latency?.count || 0, meanMs: latency?.count ? latency.sum / latency.count : null,
      p95Ms: latency?.count >= 30 ? p95Map.get(key) ?? null : null,
      cpu: fn.serviceConfig?.availableCpu ?? null, memory: fn.serviceConfig?.availableMemory ?? null,
      concurrency: fn.serviceConfig?.maxInstanceRequestConcurrency ?? (fn.environment === 'GEN_1' ? 1 : null),
      minInstances: fn.serviceConfig?.minInstanceCount ?? 0, maxInstances: fn.serviceConfig?.maxInstanceCount ?? null };
  }).sort((a, b) => (b.calls || 0) - (a.calls || 0));
}

export async function collectFunctionMetrics({ token, period = '24h', now = Date.now(), fetcher = fetch }) {
  const seconds = PERIODS[period];
  if (!Object.hasOwn(PERIODS, period)) throw new Error('invalid_period');
  // A stable minute boundary, five minutes behind now, avoids promising instant data.
  const end = new Date(Math.floor((now - 300000) / 60000) * 60000).toISOString();
  const start = new Date(Date.parse(end) - seconds * 1000).toISOString();
  const inventory = await googlePages(`https://cloudfunctions.googleapis.com/v2/projects/${METRICS_PROJECT}/locations/-/functions?pageSize=1000`, token, 'functions', fetcher);
  const requests = [];
  for (const gen of ['run', 'cloudfunctions']) {
    const base = gen === 'run' ? 'run.googleapis.com' : 'cloudfunctions.googleapis.com';
    const count = `${base}/${gen === 'run' ? 'request_count' : 'function/execution_count'}`;
    const latency = `${base}/${gen === 'run' ? 'request_latencies' : 'function/execution_times'}`;
    requests.push(
      googlePages(metricUrl(count, start, end, seconds, { group: [`metric.labels.${gen === 'run' ? 'response_code' : 'status'}`] }), token, 'timeSeries', fetcher),
      googlePages(metricUrl(latency, start, end, seconds), token, 'timeSeries', fetcher),
      googlePages(metricUrl(latency, start, end, seconds, { reducer: 'REDUCE_PERCENTILE_95' }), token, 'timeSeries', fetcher)
    );
  }
  const results = await Promise.all(requests);
  const rows = summarizeMetrics(inventory, [...results[0], ...results[3]], [...results[1], ...results[4]], [...results[2], ...results[5]]);
  return { schemaVersion: 1, project: METRICS_PROJECT, period, start, end, fetchedAt: new Date(now).toISOString(), rows,
    seriesRead: results.reduce((sum, list) => sum + list.length, 0), billingMeasured: false };
}
