import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const PROJECT = 'secondevienextjsssr';
const LIMIT = 5000;

export function parseRuntimeAuditArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    if (!['--input', '--cloud', '--from', '--to', '--services'].includes(key)) throw new Error('Option inconnue');
    if (key === '--cloud') options.cloud = true;
    else {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Valeur manquante');
      options[key.slice(2)] = args[++i];
    }
  }
  if (Boolean(options.input) === Boolean(options.cloud)) throw new Error('Choisir --input ou --cloud explicite');
  if (options.input) return options;
  const from = Date.parse(options.from);
  const to = Date.parse(options.to);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from || to - from > 86400000) {
    throw new Error('Fenetre UTC explicite requise, maximum 24 heures');
  }
  const services = [...new Set(String(options.services || '').split(','))];
  if (!services.length || services.length > 10 || services.some((name) => !/^[a-z][a-z0-9-]{1,62}$/.test(name))) {
    throw new Error('Une a dix cibles Cloud Run exactes requises');
  }
  return { ...options, from: new Date(from).toISOString(), to: new Date(to).toISOString(), services };
}

export function percentile(values, quantile) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(quantile * sorted.length) - 1)];
}

function summarizeRequests(rows) {
  const durations = rows.map((row) => Number.parseFloat(row.httpRequest?.latency))
    .filter((duration) => Number.isFinite(duration) && duration >= 0).map((duration) => duration * 1000);
  return {
    requests: rows.length,
    measuredLatencies: durations.length,
    p50Ms: percentile(durations, 0.5),
    p95Ms: percentile(durations, 0.95),
    maxMs: durations.length ? Math.max(...durations) : null,
    rejected403: rows.filter((row) => Number(row.httpRequest?.status) === 403).length,
    throttled429: rows.filter((row) => Number(row.httpRequest?.status) === 429).length,
    serverErrors: rows.filter((row) => Number(row.httpRequest?.status) >= 500).length,
    sufficientForP95: durations.length >= 30,
  };
}

export function buildRuntimeAudit({ functions = [], logs = [], services, from = null, to = null, limit = LIMIT }) {
  const inventory = functions.filter(Boolean);
  const names = services || [...new Set(logs.map((row) => row.resource?.labels?.service_name).filter(Boolean))];
  const lower = from ? Date.parse(from) : -Infinity;
  const upper = to ? Date.parse(to) : Infinity;
  const inWindow = logs.filter((row) => {
    const timestamp = Date.parse(row.timestamp);
    return Number.isFinite(timestamp) && timestamp >= lower && timestamp < upper;
  });
  return {
    schemaVersion: 1,
    project: PROJECT,
    from, to,
    truncated: logs.length >= limit,
    billingMeasured: false,
    notes: [
      'OPTIONS inclus: un POST rapide ne prouve pas un demarrage rapide.',
      'Latences Cloud Run, pas clic->KPI ni frais Firestore.',
      'p95 avec moins de 30 observations = indicatif, pas une gate fermee.',
      'Les demandes simultanees ne doivent pas etre additionnees comme un parcours sequentiel.',
      'La configuration runtime est celle observee lors de la lecture, pas necessairement celle de la revision historique.',
    ],
    services: names.filter((name) => /^[a-z][a-z0-9-]{1,62}$/.test(name)).map((service) => {
      const selected = inWindow.filter((row) => row.resource?.labels?.service_name === service);
      const requests = selected.filter((row) => row.httpRequest?.requestMethod);
      const fn = inventory.find((item) => item.name?.split('/').at(-1)?.toLowerCase() === service);
      const config = fn?.serviceConfig;
      return {
        service,
        runtime: config ? {
          cpu: config.availableCpu ?? null,
          memory: config.availableMemory ?? null,
          minInstances: config.minInstanceCount ?? 0,
          maxInstances: config.maxInstanceCount ?? null,
          concurrency: config.maxInstanceRequestConcurrency ?? null,
        } : null,
        instanceStarts: selected.filter((row) => String(row.textPayload || '').startsWith('Starting new instance.')).length,
        methods: Object.fromEntries(['OPTIONS', 'POST', 'GET'].map((method) => [
          method, summarizeRequests(requests.filter((row) => row.httpRequest.requestMethod === method)),
        ])),
      };
    }),
  };
}

export function readRuntimeCloud(options, run = (args) => JSON.parse(execFileSync('gcloud', args, {
  encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 60000,
}))) {
  const functions = run(['functions', 'list', `--project=${PROJECT}`,
    '--format=json(name,environment,serviceConfig.availableCpu,serviceConfig.availableMemory,serviceConfig.maxInstanceCount,serviceConfig.minInstanceCount,serviceConfig.maxInstanceRequestConcurrency)']);
  const filter = [
    'resource.type="cloud_run_revision"',
    `timestamp>="${options.from}"`, `timestamp<"${options.to}"`,
    `(${options.services.map((name) => `resource.labels.service_name="${name}"`).join(' OR ')})`,
    '(logName:"run.googleapis.com%2Frequests" OR logName:"run.googleapis.com%2Fvarlog%2Fsystem")',
  ].join(' AND ');
  const logs = run(['logging', 'read', filter, `--project=${PROJECT}`, `--limit=${LIMIT}`,
    '--format=json(timestamp,resource.labels.service_name,httpRequest.requestMethod,httpRequest.status,httpRequest.latency,textPayload)']);
  return buildRuntimeAudit({ ...options, functions, logs });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const options = parseRuntimeAuditArgs(process.argv.slice(2));
    const report = options.input
      ? buildRuntimeAudit(JSON.parse(readFileSync(options.input, 'utf8')))
      : readRuntimeCloud(options);
    console.log(JSON.stringify(report, null, 2));
  } catch {
    // Ne jamais imprimer stderr de gcloud, un payload ou un chemin de credentials.
    console.error('Audit indisponible: verifier les arguments, le JSON local ou les droits de lecture cloud. Aucun changement effectue.');
    process.exitCode = 1;
  }
}
