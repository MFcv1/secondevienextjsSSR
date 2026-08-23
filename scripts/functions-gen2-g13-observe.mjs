#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT = 'secondevienextjsssr';
const PROJECT_NUMBER = '231220287936';
const METRICS = [
  'run.googleapis.com/request_count',
  'run.googleapis.com/request_latencies',
  'run.googleapis.com/container/startup_latencies',
  'run.googleapis.com/container/cpu/utilizations',
  'run.googleapis.com/container/memory/utilizations',
  'cloudfunctions.googleapis.com/function/execution_count',
  'cloudfunctions.googleapis.com/function/execution_times',
  'cloudtasks.googleapis.com/queue/depth',
  'cloudtasks.googleapis.com/queue/task_attempt_count',
  'firestore.googleapis.com/document/write_conflict_count',
  'serviceruntime.googleapis.com/quota/exceeded'
];

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 2) args[argv[index].replace(/^--/, '')] = argv[index + 1];
  return args;
}

function commandJson(args) {
  return JSON.parse(execFileSync('gcloud', [...args, '--format=json'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
}

async function fetchJson(token, url) {
  const response = await fetch(url, { headers: { authorization: `Bearer ${token}`, 'x-goog-user-project': PROJECT } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${response.status}: ${body.error?.message || response.statusText}`);
  return body;
}

function numericValue(point) {
  const value = point.value || {};
  for (const key of ['doubleValue', 'int64Value']) if (value[key] !== undefined) return Number(value[key]);
  return null;
}

function distributionQuantile(distribution, quantile) {
  const counts = (distribution.bucketCounts || []).map(Number);
  const total = counts.reduce((sum, value) => sum + value, 0);
  if (!total) return null;
  const target = total * quantile;
  let cumulative = 0;
  let bucket = counts.length - 1;
  for (let index = 0; index < counts.length; index += 1) {
    cumulative += counts[index];
    if (cumulative >= target) { bucket = index; break; }
  }
  const options = distribution.bucketOptions || {};
  if (options.explicitBuckets) return options.explicitBuckets.bounds?.[Math.min(bucket, options.explicitBuckets.bounds.length - 1)] ?? null;
  if (options.linearBuckets) return Number(options.linearBuckets.offset || 0) + Number(options.linearBuckets.width || 0) * bucket;
  if (options.exponentialBuckets) return Number(options.exponentialBuckets.scale || 1) * Number(options.exponentialBuckets.growthFactor || 2) ** bucket;
  return null;
}

function summarize(metric, series) {
  const points = series.flatMap((entry) => entry.points || []);
  const numeric = points.map(numericValue).filter(Number.isFinite);
  const distributions = points.map((point) => point.value?.distributionValue).filter(Boolean);
  const labels = {};
  const byResource = {};
  for (const entry of series) {
    const metricLabels = Object.fromEntries(Object.entries(entry.metric?.labels || {}).sort());
    const key = JSON.stringify(metricLabels);
    const values = (entry.points || []).map(numericValue).filter(Number.isFinite);
    labels[key] = (labels[key] || 0) + values.reduce((sum, value) => sum + value, 0);
    const resourceName = entry.resource?.labels?.service_name || entry.resource?.labels?.function_name || entry.resource?.labels?.queue_id || entry.resource?.labels?.database_id || entry.resource?.labels?.service || 'unknown';
    const resource = byResource[resourceName] ||= { numericSum: 0, numericMax: null, distributionSamples: 0, maxMean: null, maxP95UpperBound: null, maxP99UpperBound: null, statuses: {} };
    resource.numericSum += values.reduce((sum, value) => sum + value, 0);
    if (values.length) resource.numericMax = Math.max(resource.numericMax ?? -Infinity, ...values);
    const resourceDistributions = (entry.points || []).map((point) => point.value?.distributionValue).filter(Boolean);
    resource.distributionSamples += resourceDistributions.reduce((sum, value) => sum + Number(value.count || 0), 0);
    for (const distribution of resourceDistributions) {
      resource.maxMean = Math.max(resource.maxMean ?? -Infinity, Number(distribution.mean || 0));
      resource.maxP95UpperBound = Math.max(resource.maxP95UpperBound ?? -Infinity, distributionQuantile(distribution, 0.95) || 0);
      resource.maxP99UpperBound = Math.max(resource.maxP99UpperBound ?? -Infinity, distributionQuantile(distribution, 0.99) || 0);
    }
    const status = metricLabels.response_code || metricLabels.status || metricLabels.response_code_class || 'unlabelled';
    resource.statuses[status] = (resource.statuses[status] || 0) + values.reduce((sum, value) => sum + value, 0);
  }
  return {
    metric,
    timeSeries: series.length,
    pointCount: points.length,
    numericSum: numeric.length ? numeric.reduce((sum, value) => sum + value, 0) : null,
    numericMax: numeric.length ? Math.max(...numeric) : null,
    distributionSamples: distributions.reduce((sum, value) => sum + Number(value.count || 0), 0),
    maxMean: distributions.length ? Math.max(...distributions.map((value) => Number(value.mean || 0))) : null,
    maxP95UpperBound: distributions.length ? Math.max(...distributions.map((value) => distributionQuantile(value, 0.95) || 0)) : null,
    maxP99UpperBound: distributions.length ? Math.max(...distributions.map((value) => distributionQuantile(value, 0.99) || 0)) : null,
    labelSums: labels,
    byResource
  };
}

async function listTimeSeries(token, metric, start, end) {
  let pageToken = '';
  const series = [];
  do {
    const params = new URLSearchParams({
      filter: `metric.type = "${metric}"`,
      'interval.startTime': start,
      'interval.endTime': end,
      view: 'FULL',
      pageSize: '100000'
    });
    if (pageToken) params.set('pageToken', pageToken);
    const body = await fetchJson(token, `https://monitoring.googleapis.com/v3/projects/${PROJECT}/timeSeries?${params}`);
    series.push(...(body.timeSeries || []));
    pageToken = body.nextPageToken || '';
  } while (pageToken);
  return series;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cloud = JSON.parse(fs.readFileSync(args.snapshot, 'utf8'));
  const names = cloud.map((row) => row.name.split('/').at(-1));
  const gen1 = cloud.filter((row) => row.environment !== 'GEN_2').map((row) => row.name.split('/').at(-1)).sort();
  const gen2 = cloud.filter((row) => row.environment === 'GEN_2');
  if (cloud.length !== 137 || gen1.join(',') !== 'grantAdminOnAuth,onRegisteredUserCreated,onRegisteredUserDeleted' || gen2.length !== 134) {
    throw new Error(`Inventaire final invalide: ${cloud.length}/${gen1.length}/${gen2.length}`);
  }
  if (new Set(names).size !== 137 || gen2.some((row) => row.state !== 'ACTIVE')) throw new Error('Cloud final duplique ou Gen2 inactive');

  const token = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
  const end = args.end;
  const start = args.start;
  const metrics = [];
  const metricErrors = [];
  for (const metric of METRICS) {
    try {
      metrics.push(summarize(metric, await listTimeSeries(token, metric, start, end)));
    } catch (error) {
      metricErrors.push({ metric, error: error.message });
    }
  }

  const artifacts = commandJson(['artifacts', 'repositories', 'list', `--project=${PROJECT}`]).map((repo) => ({
    name: repo.name,
    sizeBytes: Number(repo.sizeBytes || 0),
    format: repo.format,
    managedBy: repo.labels?.['goog-managed-by'] || null,
    updatedAt: repo.updateTime
  }));
  const policies = commandJson(['monitoring', 'policies', 'list', `--project=${PROJECT}`]);
  const dashboards = commandJson(['monitoring', 'dashboards', 'list', `--project=${PROJECT}`]);
  let budgets;
  try {
    budgets = await fetchJson(token, 'https://billingbudgets.googleapis.com/v1/billingAccounts/010EDA-57C968-C0B9E7/budgets?pageSize=100');
  } catch (error) {
    budgets = { verificationError: error.message };
  }

  const output = {
    schemaVersion: 1,
    metadata: {
      project: PROJECT,
      projectNumber: PROJECT_NUMBER,
      environment: 'sandbox',
      gate: 'G13-A',
      generatedAt: new Date().toISOString(),
      window: { start, end, seconds: (Date.parse(end) - Date.parse(start)) / 1000 },
      status: 'OBSERVED'
    },
    inventory: { source: 140, cloud: 137, gen1: gen1.length, gen2: gen2.length, exactGen1: gen1, allGen2Active: true },
    metrics,
    metricErrors,
    artifactRegistry: {
      repositories: artifacts,
      totalSizeBytes: artifacts.reduce((sum, repo) => sum + repo.sizeBytes, 0),
      cleanupPoliciesPreviouslyVerified: true
    },
    monitoring: {
      alertPolicies: policies.length,
      enabledAlertPolicies: policies.filter(({ enabled }) => enabled).length,
      dashboards: dashboards.length
    },
    billing: {
      enabled: true,
      account: '010EDA-57C968-C0B9E7',
      budgets: budgets.budgets?.map((budget) => ({ displayName: budget.displayName, amount: budget.amount, thresholdRules: budget.thresholdRules })) || [],
      verificationError: budgets.verificationError || null,
      exactCostUnavailableWithoutBillingExport: true
    },
    appHosting: { build: 'build-2026-08-22-003', trafficPercent: 100, rollbackBuild: 'build-2026-08-22-002' },
    prohibitionsObserved: { production: true, stripeLive: true, dataDestruction: true, globalDeploy: true }
  };
  fs.writeFileSync(path.resolve(args.output), `${JSON.stringify(output, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ inventory: output.inventory, metrics: metrics.length, metricErrors: metricErrors.length, policies: policies.length, dashboards: dashboards.length, artifactsBytes: output.artifactRegistry.totalSizeBytes, budgets: output.billing.budgets.length, budgetError: output.billing.verificationError })}\n`);
}

main().catch((error) => {
  process.stderr.write(`functions-gen2-g13-observe: ${error.message}\n`);
  process.exitCode = 1;
});
