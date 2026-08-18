#!/usr/bin/env node

import process from 'node:process';
import { spawnSync } from 'node:child_process';

const PROJECT = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const APPROVAL = 'G5_CREATE_AUTH_OTP_EMAIL_RUNTIME';
const SERVICE_ACCOUNT_ID = 'auth-otp-email-runtime';
const SERVICE_ACCOUNT = `${SERVICE_ACCOUNT_ID}@${PROJECT}.iam.gserviceaccount.com`;
const SECRET_BINDINGS = Object.freeze([
  { secret: 'GMAIL_EMAIL', version: '2' },
  { secret: 'GMAIL_PASSWORD', version: '5' },
  { secret: 'OTP_HMAC_SECRET', version: '1' },
  { secret: 'RESEND_API_KEY', version: '1' },
]);
const REQUIRED_ROLES = Object.freeze([
  'roles/datastore.user',
  'roles/logging.logWriter',
  'roles/serviceusage.serviceUsageConsumer',
]);

const fail = (message) => { throw new Error(message); };

function parseArgs(argv) {
  const args = { execute: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--execute') {
      args.execute = true;
      continue;
    }
    if (!token.startsWith('--')) fail(`G5_OTP_IAM_ARGUMENT_INVALID:${token}`);
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) fail(`G5_OTP_IAM_VALUE_MISSING:${key}`);
    args[key] = value;
    index += 1;
  }
  return args;
}

function run(command, args, { allowFailure = false } = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) fail(`G5_OTP_IAM_COMMAND_ERROR:${command}`);
  if (result.status !== 0 && !allowFailure) fail(`G5_OTP_IAM_COMMAND_FAILED:${command}:${args[0] || ''}`);
  return result;
}

const json = (command, args) => JSON.parse(run(command, [...args, '--format=json']).stdout || 'null');

function rolesForMember(policy) {
  const member = `serviceAccount:${SERVICE_ACCOUNT}`;
  return (policy.bindings || [])
    .filter((binding) => (binding.members || []).includes(member))
    .map((binding) => binding.role)
    .sort();
}

function serviceAccountExists() {
  const result = run('gcloud', [
    'iam', 'service-accounts', 'describe', SERVICE_ACCOUNT,
    `--project=${PROJECT}`, '--format=json',
  ], { allowFailure: true });
  if (result.status === 0) return true;
  if (/NOT_FOUND|Unknown service account/i.test(`${result.stderr || ''}${result.stdout || ''}`)) return false;
  fail('G5_OTP_IAM_SERVICE_ACCOUNT_STATE_UNKNOWN');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.project !== PROJECT || args.env !== ENVIRONMENT) fail('G5_OTP_IAM_TARGET_INVALID');
  const head = run('git', ['rev-parse', 'HEAD']).stdout.trim();
  if (!/^[0-9a-f]{40}$/.test(args.commit || '') || args.commit !== head) fail('G5_OTP_IAM_COMMIT_MISMATCH');
  if (args.execute && args.approval !== APPROVAL) fail('G5_OTP_IAM_APPROVAL_INVALID');

  const actualProject = run('gcloud', [
    'projects', 'describe', PROJECT, `--project=${PROJECT}`, '--format=value(projectId)',
  ]).stdout.trim();
  if (actualProject !== PROJECT) fail('G5_OTP_IAM_EFFECTIVE_PROJECT_MISMATCH');

  const existedBefore = serviceAccountExists();
  if (!existedBefore && args.execute) {
    run('gcloud', [
      'iam', 'service-accounts', 'create', SERVICE_ACCOUNT_ID,
      `--project=${PROJECT}`,
      '--display-name=Functions Gen2 auth OTP email runtime',
      '--description=Least privilege runtime for sandbox guest checkout OTP email',
      '--quiet',
    ]);
  }

  if (args.execute) {
    for (const role of REQUIRED_ROLES) {
      run('gcloud', [
        'projects', 'add-iam-policy-binding', PROJECT,
        `--project=${PROJECT}`,
        `--member=serviceAccount:${SERVICE_ACCOUNT}`,
        `--role=${role}`,
        '--condition=None',
        '--quiet',
      ]);
    }
    for (const { secret } of SECRET_BINDINGS) {
      run('gcloud', [
        'secrets', 'add-iam-policy-binding', secret,
        `--project=${PROJECT}`,
        `--member=serviceAccount:${SERVICE_ACCOUNT}`,
        '--role=roles/secretmanager.secretAccessor',
        '--condition=None',
        '--quiet',
      ]);
    }
  }

  const existsAfter = serviceAccountExists();
  const projectPolicy = json('gcloud', ['projects', 'get-iam-policy', PROJECT, `--project=${PROJECT}`]);
  const projectRoles = rolesForMember(projectPolicy);
  const secretBindings = SECRET_BINDINGS.map(({ secret, version }) => {
    const policy = json('gcloud', ['secrets', 'get-iam-policy', secret, `--project=${PROJECT}`]);
    return { secret, version, secretAccessor: rolesForMember(policy).includes('roles/secretmanager.secretAccessor') };
  });
  const keys = existsAfter
    ? json('gcloud', ['iam', 'service-accounts', 'keys', 'list', `--iam-account=${SERVICE_ACCOUNT}`, `--project=${PROJECT}`])
    : [];
  const userManagedKeys = (keys || []).filter((key) => key.keyType === 'USER_MANAGED');
  const forbiddenRoles = projectRoles.filter((role) => !REQUIRED_ROLES.includes(role));
  const ready = existsAfter
    && REQUIRED_ROLES.every((role) => projectRoles.includes(role))
    && forbiddenRoles.length === 0
    && userManagedKeys.length === 0
    && secretBindings.every(({ secretAccessor }) => secretAccessor);
  if (args.execute && !ready) fail('G5_OTP_IAM_POSTCONDITION_FAILED');

  process.stdout.write(`${JSON.stringify({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: PROJECT,
    environment: ENVIRONMENT,
    commit: head,
    operator: run('gcloud', ['config', 'get-value', 'account']).stdout.trim(),
    serviceAccount: SERVICE_ACCOUNT,
    execute: args.execute,
    existedBefore,
    existsAfter,
    requiredRoles: REQUIRED_ROLES,
    observedRoles: projectRoles,
    forbiddenRoles,
    userManagedKeyCount: userManagedKeys.length,
    secretBindings,
    ready,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ ok: false, error: String(error?.message || error) })}\n`);
  process.exitCode = 1;
});
