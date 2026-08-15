#!/usr/bin/env node

import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const OUTPUT = 'apphostingaudit/manifests/functions-gen2-g1-worker-iam.json';
const PROJECT_ROLES = [
  'roles/datastore.user',
  'roles/logging.logWriter',
  'roles/serviceusage.serviceUsageConsumer'
].sort();
const ACCOUNTS = Object.freeze({
  'commerce-reservation-expiry@secondevienextjsssr.iam.gserviceaccount.com': [
    'STRIPE_SECRET_KEY'
  ],
  'commerce-outbox-dispatcher@secondevienextjsssr.iam.gserviceaccount.com': [
    'GMAIL_EMAIL',
    'GMAIL_PASSWORD',
    'RESEND_API_KEY'
  ],
  'admin-payment-link-expiry@secondevienextjsssr.iam.gserviceaccount.com': [
    'PAYMENT_LINK_HMAC_SECRET',
    'STRIPE_SECRET_KEY'
  ]
});

function fail(code) {
  throw new Error(code);
}

function parseArgs(argv) {
  return new Map(argv.map((argument) => {
    if (!argument.startsWith('--')) fail(`G1_WORKER_IAM_ARGUMENT_INVALID:${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    return [key, parts.length ? parts.join('=') : 'true'];
  }));
}

function gcloud(args) {
  return JSON.parse(execFileSync('gcloud', [...args, `--project=${PROJECT_ID}`, '--format=json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }) || 'null');
}

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function shortSecretName(name) {
  return String(name || '').split('/').pop();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.get('project') !== PROJECT_ID || (args.get('env') || ENVIRONMENT) !== ENVIRONMENT) {
    fail('G1_WORKER_IAM_TARGET_INVALID');
  }
  if (args.has('apply') || args.has('write') || args.has('delete')) fail('G1_WORKER_IAM_READ_ONLY');

  const [project, projectPolicy, secrets] = [
    gcloud(['projects', 'describe', PROJECT_ID]),
    gcloud(['projects', 'get-iam-policy', PROJECT_ID]),
    gcloud(['secrets', 'list'])
  ];
  if (project.projectId !== PROJECT_ID) fail('G1_WORKER_IAM_EFFECTIVE_PROJECT_INVALID');
  const secretPolicies = new Map();
  for (const secret of secrets) {
    const name = shortSecretName(secret.name);
    secretPolicies.set(name, gcloud(['secrets', 'get-iam-policy', name]));
  }

  const accounts = [];
  for (const [serviceAccount, expectedSecretsRaw] of Object.entries(ACCOUNTS)) {
    const member = `serviceAccount:${serviceAccount}`;
    const [account, accountPolicy, keys] = [
      gcloud(['iam', 'service-accounts', 'describe', serviceAccount]),
      gcloud(['iam', 'service-accounts', 'get-iam-policy', serviceAccount]),
      gcloud(['iam', 'service-accounts', 'keys', 'list', `--iam-account=${serviceAccount}`])
    ];
    if (account.projectId !== PROJECT_ID) fail('G1_WORKER_IAM_ACCOUNT_PROJECT_INVALID');
    const roles = (projectPolicy.bindings || [])
      .filter((binding) => (binding.members || []).includes(member))
      .map((binding) => binding.role)
      .sort();
    const grantedSecrets = [...secretPolicies.entries()]
      .filter(([, policy]) => (policy.bindings || []).some((binding) => (
        binding.role === 'roles/secretmanager.secretAccessor' &&
        (binding.members || []).includes(member)
      )))
      .map(([name]) => name)
      .sort();
    const expectedSecrets = [...expectedSecretsRaw].sort();
    const publicImpersonation = (accountPolicy.bindings || []).filter((binding) => (
      (binding.members || []).some((candidate) => ['allUsers', 'allAuthenticatedUsers'].includes(candidate))
    )).map((binding) => binding.role).sort();
    const userManagedKeys = keys.filter((key) => key.keyType === 'USER_MANAGED').length;
    const rolesExact = JSON.stringify(roles) === JSON.stringify(PROJECT_ROLES);
    const secretsExact = JSON.stringify(grantedSecrets) === JSON.stringify(expectedSecrets);
    accounts.push({
      serviceAccount,
      roles,
      expectedRoles: PROJECT_ROLES,
      rolesExact,
      secretAccess: grantedSecrets,
      expectedSecretAccess: expectedSecrets,
      secretsExact,
      userManagedKeys,
      publicImpersonation,
      forbiddenCapabilities: {
        authAdmin: roles.includes('roles/firebaseauth.admin'),
        storage: roles.some((role) => role.startsWith('roles/storage.')),
        tasksEnqueuer: roles.includes('roles/cloudtasks.enqueuer'),
        editor: roles.includes('roles/editor'),
        owner: roles.includes('roles/owner')
      }
    });
  }

  const verified = accounts.every((account) => (
    account.rolesExact && account.secretsExact && account.userManagedKeys === 0 &&
    account.publicImpersonation.length === 0 &&
    Object.values(account.forbiddenCapabilities).every((value) => value === false)
  ));
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: PROJECT_ID,
    environment: ENVIRONMENT,
    secretNamesInspected: [...secretPolicies.keys()].sort(),
    secretValuesRead: false,
    accounts,
    verdict: verified ? 'G1_WORKER_RUNTIME_IAM_MINIMAL_VERIFIED' : 'HOLD_G1_WORKER_RUNTIME_IAM'
  };
  manifest.manifestDigest = digest(manifest);
  const output = path.resolve(args.get('output') || OUTPUT);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({
    status: 'OK',
    verdict: manifest.verdict,
    accounts: accounts.map((account) => ({
      serviceAccount: account.serviceAccount,
      rolesExact: account.rolesExact,
      secretsExact: account.secretsExact,
      userManagedKeys: account.userManagedKeys,
      publicImpersonation: account.publicImpersonation
    })),
    secretValuesRead: false,
    output: path.relative(process.cwd(), output)
  }, null, 2)}\n`);
  if (!verified) process.exitCode = 2;
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${JSON.stringify({ status: 'ERROR', code: String(error?.message || error) })}\n`);
  process.exitCode = 1;
}
