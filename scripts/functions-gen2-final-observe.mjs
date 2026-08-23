#!/usr/bin/env node

import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import process from 'node:process';

export const FINAL_OBSERVATION = Object.freeze({
  project: 'secondevienextjsssr',
  region: 'europe-west1',
  functionName: 'getCatalogPublicationStatusGen2',
  serviceName: 'getcatalogpublicationstatusgen2',
  revision: 'getcatalogpublicationstatusgen2-00004-hiv',
  start: '2026-08-23T01:46:24.611705732Z',
  minimumEnd: '2026-08-30T01:46:24.611705732Z',
  requiredSeconds: 604800,
  config: Object.freeze({
    runtime: 'nodejs22',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    runtimeServiceAccount: 'catalog-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '512Mi',
    cpu: '167m',
    timeoutSeconds: 60,
    minInstances: 0,
    maxInstances: 2,
    concurrency: 1,
    trafficPercent: 100
  }),
  sources: Object.freeze([
    Object.freeze({
      role: 'rollback-max-1',
      uri: 'gs://gcf-v2-sources-231220287936-europe-west1/g13-rollback/dacf4c1eb1257fdd18c94a03889822dfa042642d0835b0dd68b3be8f9b8f46da/function-source.zip#1787449114510784',
      generation: '1787449114510784',
      size: 381285
    }),
    Object.freeze({
      role: 'reactivation-max-2',
      uri: 'gs://gcf-v2-sources-231220287936-europe-west1/g13/3ba9c8d5890e7fc678d12117099653f00f33ea48982f20b27097434f1df2dd81/function-source.zip#1787442998284455',
      generation: '1787442998284455',
      size: 370918
    })
  ])
});

const GEN1_AUTH = Object.freeze([
  'grantAdminOnAuth',
  'onRegisteredUserCreated',
  'onRegisteredUserDeleted'
]);
const LOG_LIMIT = 10000;

function fail(message) {
  throw new Error(message);
}

function gcloudJson(args) {
  return JSON.parse(execFileSync('gcloud', [...args, '--format=json'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    env: process.env
  }));
}

export function validateFinalFunction(row, expected = FINAL_OBSERVATION) {
  const config = expected.config;
  const actual = {
    state: row.state,
    revision: row.serviceConfig?.revision,
    runtime: row.buildConfig?.runtime,
    buildServiceAccount: row.buildConfig?.serviceAccount,
    runtimeServiceAccount: row.serviceConfig?.serviceAccountEmail,
    memory: row.serviceConfig?.availableMemory,
    cpu: row.serviceConfig?.availableCpu,
    timeoutSeconds: Number(row.serviceConfig?.timeoutSeconds),
    minInstances: Number(row.serviceConfig?.minInstanceCount || 0),
    maxInstances: Number(row.serviceConfig?.maxInstanceCount),
    concurrency: Number(row.serviceConfig?.maxInstanceRequestConcurrency)
  };
  const wanted = {
    state: 'ACTIVE',
    revision: expected.revision,
    runtime: config.runtime,
    buildServiceAccount: config.buildServiceAccount,
    runtimeServiceAccount: config.runtimeServiceAccount,
    memory: config.memory,
    cpu: config.cpu,
    timeoutSeconds: config.timeoutSeconds,
    minInstances: config.minInstances,
    maxInstances: config.maxInstances,
    concurrency: config.concurrency
  };
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) fail(`Derive Function finale: ${JSON.stringify(actual)}`);
  return actual;
}

export function validateInventory(rows, expected = FINAL_OBSERVATION) {
  const names = rows.map((row) => row.name.split('/').at(-1));
  const gen2 = rows.filter((row) => row.environment === 'GEN_2');
  const gen1 = rows.filter((row) => row.environment !== 'GEN_2');
  const gen1Names = gen1.map((row) => row.name.split('/').at(-1)).sort();
  const updatedSinceStart = rows
    .filter((row) => row.updateTime && Date.parse(row.updateTime) >= Date.parse(expected.start))
    .map((row) => row.name.split('/').at(-1))
    .sort();
  if (
    rows.length !== 137 || new Set(names).size !== 137 || gen2.length !== 134 ||
    gen2.some((row) => row.state !== 'ACTIVE') ||
    gen1Names.join(',') !== [...GEN1_AUTH].sort().join(',') ||
    gen1.some((row) => row.status !== 'ACTIVE') ||
    updatedSinceStart.join(',') !== expected.functionName
  ) fail(`Derive inventaire final: ${rows.length}/${gen1.length}/${gen2.length}/${updatedSinceStart.join(',')}`);
  return {
    cloudFunctions: rows.length,
    gen2Active: gen2.length,
    gen1AuthActive: gen1.length,
    exactGen1Auth: gen1Names,
    updatedSinceStart
  };
}

export function classifyLogMessage(message) {
  const text = String(message || '');
  if (!text) return 'REQUEST_STATUS_ONLY';
  if (/no available instance/i.test(text)) return 'NO_AVAILABLE_INSTANCE';
  if (/CATALOG_SERVED_VERSION_STALE/.test(text)) return 'CATALOG_SERVED_VERSION_STALE';
  if (/ORDER_STATS_PROJECTION_BASELINE_MISSING/.test(text)) return 'ORDER_STATS_PROJECTION_BASELINE_MISSING';
  if (/datacontenttype|Cannot parse event payload|Resource name .* is not valid/.test(text)) return 'INVALID_CLOUD_EVENT_PROBE';
  if (/storage\/invalid-argument/.test(text)) return 'STORAGE_INVALID_ARGUMENT';
  if (/Cannot read properties of undefined.*before/s.test(text)) return 'QUOTE_EVENT_BEFORE_UNDEFINED';
  return `REDACTED_${crypto.createHash('sha256').update(text).digest('hex').slice(0, 16)}`;
}

export function summarizeFailureLogs(rows) {
  if (rows.length >= LOG_LIMIT) fail(`Lecture logs potentiellement tronquee a ${LOG_LIMIT} entrees`);
  const grouped = new Map();
  let request429 = 0;
  let request5xx = 0;
  let errorSeverityEntries = 0;
  for (const row of rows) {
    const status = Number(row.httpRequest?.status || 0) || null;
    if (status === 429) request429 += 1;
    if (status >= 500) request5xx += 1;
    if (['ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY'].includes(row.severity)) errorSeverityEntries += 1;
    const message = row.textPayload || row.jsonPayload?.message || row.jsonPayload?.error || '';
    const item = {
      service: row.resource?.labels?.service_name || row.resource?.labels?.function_name || 'unknown',
      revision: row.resource?.labels?.revision_name || 'unknown',
      status,
      severity: row.severity || null,
      messageClass: classifyLogMessage(message)
    };
    const key = JSON.stringify(item);
    const group = grouped.get(key) || { ...item, count: 0, first: row.timestamp, last: row.timestamp };
    group.count += 1;
    if (row.timestamp < group.first) group.first = row.timestamp;
    if (row.timestamp > group.last) group.last = row.timestamp;
    grouped.set(key, group);
  }
  return {
    entriesRead: rows.length,
    request429,
    request5xx,
    errorSeverityEntries,
    groups: [...grouped.values()].sort((left, right) => `${left.service}${left.status}${left.messageClass}`.localeCompare(`${right.service}${right.status}${right.messageClass}`))
  };
}

export function validateTraffic(service, expected = FINAL_OBSERVATION) {
  const traffic = service.status?.traffic || [];
  if (
    service.status?.latestCreatedRevisionName !== expected.revision ||
    service.status?.latestReadyRevisionName !== expected.revision ||
    traffic.length !== 1 || traffic[0].revisionName !== expected.revision ||
    Number(traffic[0].percent) !== expected.config.trafficPercent
  ) fail(`Derive trafic final: ${JSON.stringify(traffic)}`);
  return { latestReadyRevision: expected.revision, trafficPercent: Number(traffic[0].percent) };
}

export function validateSources(rows, expected = FINAL_OBSERVATION) {
  return rows.map((row, index) => {
    const source = expected.sources[index];
    if (
      String(row.generation || '') !== source.generation ||
      Number(row.size) !== source.size || row.temporary_hold !== true
    ) fail(`Derive archive ${source.role}`);
    return { role: source.role, generation: source.generation, size: source.size, temporaryHold: true };
  });
}

export function buildCheckpoint({ now, functionRow, inventoryRows, service, sourceRows, logRows }) {
  const checkedAt = now.toISOString();
  const observedSeconds = Math.max(0, Math.floor((now.getTime() - Date.parse(FINAL_OBSERVATION.start)) / 1000));
  const failures = summarizeFailureLogs(logRows);
  return {
    checkedAt,
    observedSeconds,
    requiredSeconds: FINAL_OBSERVATION.requiredSeconds,
    fullDurationReached: observedSeconds >= FINAL_OBSERVATION.requiredSeconds,
    function: validateFinalFunction(functionRow),
    inventory: validateInventory(inventoryRows),
    traffic: validateTraffic(service),
    protectedSources: validateSources(sourceRows),
    failures,
    runtimeQuiet: failures.request429 === 0 && failures.request5xx === 0 && failures.errorSeverityEntries === 0
  };
}

export function main(now = new Date()) {
  if (!Number.isFinite(now.getTime()) || now.getTime() < Date.parse(FINAL_OBSERVATION.start)) fail('Horodatage observation invalide');
  const end = now.toISOString();
  const functionRow = gcloudJson([
    'functions', 'describe', FINAL_OBSERVATION.functionName, '--gen2',
    `--region=${FINAL_OBSERVATION.region}`, `--project=${FINAL_OBSERVATION.project}`
  ]);
  const inventoryRows = gcloudJson(['functions', 'list', `--project=${FINAL_OBSERVATION.project}`]);
  const service = gcloudJson([
    'run', 'services', 'describe', FINAL_OBSERVATION.serviceName,
    `--region=${FINAL_OBSERVATION.region}`, `--project=${FINAL_OBSERVATION.project}`
  ]);
  const sourceRows = FINAL_OBSERVATION.sources.map((source) => gcloudJson([
    'storage', 'objects', 'describe', source.uri, `--project=${FINAL_OBSERVATION.project}`
  ]));
  const filter = [
    '(resource.type="cloud_run_revision" OR resource.type="cloud_function")',
    `timestamp>="${FINAL_OBSERVATION.start}"`,
    `timestamp<="${end}"`,
    '(httpRequest.status=429 OR httpRequest.status>=500 OR severity>=ERROR)'
  ].join(' AND ');
  const logRows = gcloudJson([
    'logging', 'read', filter, `--project=${FINAL_OBSERVATION.project}`,
    `--limit=${LOG_LIMIT}`
  ]);
  const result = {
    schemaVersion: 1,
    project: FINAL_OBSERVATION.project,
    environment: 'sandbox',
    gate: 'FINALISATION:F6_CHECKPOINT',
    window: {
      start: FINAL_OBSERVATION.start,
      minimumEnd: FINAL_OBSERVATION.minimumEnd,
      requiredSeconds: FINAL_OBSERVATION.requiredSeconds
    },
    checkpoint: buildCheckpoint({ now, functionRow, inventoryRows, service, sourceRows, logRows }),
    cloudWrites: 0
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`functions-gen2-final-observe: ${error.message}\n`);
    process.exitCode = 1;
  }
}
