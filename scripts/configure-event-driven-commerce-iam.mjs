#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const PROJECT = 'secondevienextjsssr';
const PROJECT_NUMBER = '231220287936';
const REGION = 'europe-west1';
const APPLY_TOKEN = 'APPLY_EVENT_DRIVEN_COMMERCE_IAM_SANDBOX';
const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');

if (apply && process.env.APPROVAL !== APPLY_TOKEN) {
  throw new Error(`APPROVAL=${APPLY_TOKEN} requis avec --apply`);
}

const identities = Object.freeze([
  'commerce-outbox-dispatcher@secondevienextjsssr.iam.gserviceaccount.com',
  'commerce-reservation-expiry@secondevienextjsssr.iam.gserviceaccount.com'
]);
const taskServiceAgent = `service-${PROJECT_NUMBER}@gcp-sa-cloudtasks.iam.gserviceaccount.com`;
const taskServices = Object.freeze([
  {
    service: 'dispatchcommerceoutboxtaskgen2',
    invoker: identities[0]
  },
  {
    service: 'dispatchcommercereservationexpirytaskgen2',
    invoker: identities[1]
  }
]);

function command(commandArgs, { allowMissing = false } = {}) {
  const result = spawnSync('gcloud', [...commandArgs, `--project=${PROJECT}`, '--format=json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (allowMissing && result.status !== 0 && /NOT_FOUND|does not exist|was not found/i.test(result.stderr || '')) {
    return null;
  }
  if (result.error || result.status !== 0) {
    throw result.error || new Error(result.stderr || `gcloud exit ${result.status}`);
  }
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}

function hasBinding(policy, role, member) {
  return (policy?.bindings || []).some((binding) =>
    binding.role === role && (binding.members || []).includes(member) && !binding.condition);
}

function ensureProjectRole(email, role) {
  const member = `serviceAccount:${email}`;
  const policy = command(['projects', 'get-iam-policy', PROJECT]);
  if (hasBinding(policy, role, member)) return 'EXISTING';
  if (!apply) return 'PLANNED';
  command([
    'projects', 'add-iam-policy-binding', PROJECT,
    `--member=${member}`,
    `--role=${role}`,
    '--condition=None',
    '--quiet'
  ]);
  return 'CREATED';
}

function ensureServiceAccountRole(email, role, member) {
  const policy = command(['iam', 'service-accounts', 'get-iam-policy', email]);
  if (hasBinding(policy, role, member)) return 'EXISTING';
  if (!apply) return 'PLANNED';
  command([
    'iam', 'service-accounts', 'add-iam-policy-binding', email,
    `--member=${member}`,
    `--role=${role}`,
    '--quiet'
  ]);
  return 'CREATED';
}

function ensureRunInvoker({ service, invoker }) {
  const read = ['run', 'services', 'get-iam-policy', service, `--region=${REGION}`];
  const member = `serviceAccount:${invoker}`;
  const policy = command(read, { allowMissing: !apply });
  if (!policy) return 'WAITING_FOR_DEPLOYMENT';
  if (hasBinding(policy, 'roles/run.invoker', member)) return 'EXISTING';
  if (!apply) return 'PLANNED';
  command([
    'run', 'services', 'add-iam-policy-binding', service,
    `--region=${REGION}`,
    `--member=${member}`,
    '--role=roles/run.invoker',
    '--quiet'
  ]);
  return 'CREATED';
}

function userManagedKeys(email) {
  return (command(['iam', 'service-accounts', 'keys', 'list', `--iam-account=${email}`]) || [])
    .filter((key) => key.keyType === 'USER_MANAGED').length;
}

const taskAgentMember = `serviceAccount:${taskServiceAgent}`;
const changes = {
  enqueuer: Object.fromEntries(identities.map((email) => [email,
    ensureProjectRole(email, 'roles/cloudtasks.enqueuer')
  ])),
  runtimeCanUseOwnIdentity: Object.fromEntries(identities.map((email) => [email,
    ensureServiceAccountRole(email, 'roles/iam.serviceAccountUser', `serviceAccount:${email}`)
  ])),
  taskAgentCanMintTokens: Object.fromEntries(identities.map((email) => [email,
    ensureServiceAccountRole(email, 'roles/iam.serviceAccountTokenCreator', taskAgentMember)
  ])),
  invokers: Object.fromEntries(taskServices.map((target) => [target.service, ensureRunInvoker(target)]))
};

const finalProjectPolicy = command(['projects', 'get-iam-policy', PROJECT]);
const checks = {
  enqueuer: Object.fromEntries(identities.map((email) => [email, hasBinding(
    finalProjectPolicy,
    'roles/cloudtasks.enqueuer',
    `serviceAccount:${email}`
  )])),
  userManagedKeys: Object.fromEntries(identities.map((email) => [email, userManagedKeys(email)])),
  publicInvoker: taskServices.some(({ service }) => {
    const policy = command([
      'run', 'services', 'get-iam-policy', service, `--region=${REGION}`
    ], { allowMissing: true });
    return hasBinding(policy, 'roles/run.invoker', 'allUsers') ||
      hasBinding(policy, 'roles/run.invoker', 'allAuthenticatedUsers');
  })
};

const verified = Object.values(checks.enqueuer).every(Boolean) &&
  Object.values(checks.userManagedKeys).every((count) => count === 0) &&
  checks.publicInvoker === false &&
  !Object.values(changes.invokers).includes('WAITING_FOR_DEPLOYMENT');

process.stdout.write(`${JSON.stringify({
  schemaVersion: 1,
  mode: apply ? 'apply' : 'dry-run',
  project: PROJECT,
  region: REGION,
  changes,
  checks,
  verdict: verified ? 'EVENT_DRIVEN_COMMERCE_IAM_VERIFIED' :
    (apply ? 'HOLD_EVENT_DRIVEN_COMMERCE_IAM' : 'EVENT_DRIVEN_COMMERCE_IAM_PLANNED'),
  forbidden: {
    publicInvoker: false,
    projectWideInvoker: false,
    userManagedKeyCreation: false
  }
}, null, 2)}\n`);

if (apply && !verified) process.exitCode = 2;
