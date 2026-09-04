#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const PROJECT = 'secondevienextjsssr';
const REGION = 'europe-west1';
const APPLY_TOKEN = 'APPLY_DASHBOARD_EVENT_INVOKERS_SANDBOX';
const SERVICES = Object.freeze([
  { service: 'projectnewslettersubscribergen2', account: 'functions-eventarc-invoker' },
  { service: 'oncommerceoutboxwrittengen2', account: 'functions-eventarc-invoker' },
  { service: 'oncommercereservationwrittengen2', account: 'functions-eventarc-invoker' },
  { service: 'journalinventorymovementgen2', account: 'commerce-operations-reconciler' },
  { service: 'journalordereventgen2', account: 'commerce-operations-reconciler' },
  { service: 'projectcommercefinancialhistorygen2', account: 'order-stats-projector' },
  { service: 'projectadminactionsummarygen2', account: 'functions-eventarc-invoker' }
]);
const apply = process.argv.includes('--apply');

if (apply && process.env.APPROVAL !== APPLY_TOKEN) {
  throw new Error(`APPROVAL=${APPLY_TOKEN} requis avec --apply`);
}

function command(args) {
  const result = spawnSync('gcloud', [...args, `--project=${PROJECT}`, '--format=json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (result.error || result.status !== 0) {
    throw result.error || new Error(result.stderr || `gcloud exit ${result.status}`);
  }
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}

function hasBinding(policy, role, member) {
  return (policy?.bindings || []).some((binding) =>
    binding.role === role && (binding.members || []).includes(member) && !binding.condition);
}

const memberFor = (account) => `serviceAccount:${account}@${PROJECT}.iam.gserviceaccount.com`;
const before = Object.fromEntries(SERVICES.map(({ service }) => [service,
  command(['run', 'services', 'get-iam-policy', service, `--region=${REGION}`])
]));
const changes = {};
for (const { service, account } of SERVICES) {
  const member = memberFor(account);
  if (hasBinding(before[service], 'roles/run.invoker', member)) {
    changes[service] = 'EXISTING';
  } else if (!apply) {
    changes[service] = 'PLANNED';
  } else {
    command([
      'run', 'services', 'add-iam-policy-binding', service,
      `--region=${REGION}`,
      `--member=${member}`,
      '--role=roles/run.invoker',
      '--condition=None',
      '--quiet'
    ]);
    changes[service] = 'CREATED';
  }
}

const after = Object.fromEntries(SERVICES.map(({ service }) => [service,
  command(['run', 'services', 'get-iam-policy', service, `--region=${REGION}`])
]));
const verified = SERVICES.every(({ service, account }) =>
  hasBinding(after[service], 'roles/run.invoker', memberFor(account)) &&
  !hasBinding(after[service], 'roles/run.invoker', 'allUsers') &&
  !hasBinding(after[service], 'roles/run.invoker', 'allAuthenticatedUsers'));

process.stdout.write(`${JSON.stringify({
  schemaVersion: 1,
  mode: apply ? 'apply' : 'dry-run',
  project: PROJECT,
  region: REGION,
  triggerServiceAccounts: Object.fromEntries(SERVICES.map(({ service, account }) => [
    service,
    `${account}@${PROJECT}.iam.gserviceaccount.com`
  ])),
  changes,
  verified,
  publicInvoker: false
}, null, 2)}\n`);

if (apply && !verified) process.exitCode = 2;
