#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const PROJECT = 'secondevienextjsssr';
const REGION = 'europe-west1';
const APPLY_TOKEN = 'APPLY_EVENT_RECOVERY_SCHEDULES_SANDBOX';
const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');

if (apply && process.env.APPROVAL !== APPLY_TOKEN) {
  throw new Error(`APPROVAL=${APPLY_TOKEN} requis avec --apply`);
}

const jobs = [
  'firebase-schedule-commerceOutboxDispatcherGen2-europe-west1',
  'firebase-schedule-commerceReservationExpiryDispatcherGen2-europe-west1',
  'firebase-schedule-catalogReconciler-europe-west1'
];

function gcloud(command, { json = false } = {}) {
  const result = spawnSync('gcloud', [...command, `--project=${PROJECT}`], {
    encoding: 'utf8',
    stdio: json ? ['ignore', 'pipe', 'pipe'] : 'inherit'
  });
  if (result.error || result.status !== 0) {
    throw result.error || new Error(result.stderr || `gcloud exit ${result.status}`);
  }
  return json ? JSON.parse(result.stdout) : null;
}

const before = jobs.map((job) => gcloud([
  'scheduler', 'jobs', 'describe', job,
  `--location=${REGION}`,
  '--format=json'
], { json: true }));

for (const job of before) {
  if (job.state !== 'ENABLED' || job.httpTarget?.httpMethod !== 'POST') {
    throw new Error(`Scheduler inattendu: ${job.name}`);
  }
}

if (apply) {
  for (const job of jobs) {
    gcloud([
      'scheduler', 'jobs', 'update', 'http', job,
      `--location=${REGION}`,
      '--schedule=every 60 minutes',
      '--quiet'
    ]);
  }
}

const after = apply ? jobs.map((job) => gcloud([
  'scheduler', 'jobs', 'describe', job,
  `--location=${REGION}`,
  '--format=json'
], { json: true })) : before;

if (apply && after.some((job) => job.schedule !== 'every 60 minutes')) {
  throw new Error('La cadence horaire n est pas appliquee partout');
}

process.stdout.write(`${JSON.stringify({
  mode: apply ? 'apply' : 'dry-run',
  project: PROJECT,
  changes: after.map((job, index) => ({
    job: jobs[index],
    before: before[index].schedule,
    after: apply ? job.schedule : 'every 60 minutes',
    uriPreserved: before[index].httpTarget?.uri === job.httpTarget?.uri,
    audiencePreserved: before[index].httpTarget?.oidcToken?.audience === job.httpTarget?.oidcToken?.audience
  }))
}, null, 2)}\n`);
