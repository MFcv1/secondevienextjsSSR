#!/usr/bin/env node

import process from 'node:process';
import { spawnSync } from 'node:child_process';

const PROJECT = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const APPROVAL = 'G6_CONFIGURE_RUNTIME_IAM';
const PROJECT_ROLES = Object.freeze([
  'roles/datastore.user',
  'roles/logging.logWriter',
  'roles/serviceusage.serviceUsageConsumer'
]);
const DEFAULT_BUCKET = 'gs://secondevienextjsssr.firebasestorage.app';
const FAMILIES = Object.freeze([
  { id: 'email-manual-runtime', secrets: ['GMAIL_EMAIL', 'GMAIL_PASSWORD', 'RESEND_API_KEY'] },
  { id: 'billing-guide-runtime', secrets: ['SUPER_ADMIN_EMAIL'] },
  { id: 'manual-invoice-runtime', secrets: ['GMAIL_EMAIL', 'GMAIL_PASSWORD', 'RESEND_API_KEY'], storage: true },
  { id: 'quote-request-runtime', secrets: ['GMAIL_EMAIL', 'GMAIL_PASSWORD', 'RESEND_API_KEY'], storage: true },
  { id: 'newsletter-runtime', secrets: ['GMAIL_EMAIL', 'GMAIL_PASSWORD', 'RESEND_API_KEY'] }
]);

const fail = (message) => { throw new Error(message); };

function parseArgs(argv) {
  const args = { execute: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--execute') { args.execute = true; continue; }
    if (!token.startsWith('--')) fail(`G6_IAM_ARGUMENT_INVALID:${token}`);
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) fail(`G6_IAM_VALUE_MISSING:${key}`);
    args[key] = value;
    i += 1;
  }
  return args;
}

function run(command, args, { allowFailure = false } = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.error) fail(`G6_IAM_COMMAND_ERROR:${command}`);
  if (result.status !== 0 && !allowFailure) fail(`G6_IAM_COMMAND_FAILED:${command}:${args[0] || ''}`);
  return result;
}

const json = (command, args) => JSON.parse(run(command, [...args, '--format=json']).stdout || 'null');
const memberFor = (family) => `serviceAccount:${family.id}@${PROJECT}.iam.gserviceaccount.com`;
const hasBinding = (policy, role, member) => (policy.bindings || []).some(
  (binding) => binding.role === role && (binding.members || []).includes(member)
);

function accountExists(family) {
  const result = run('gcloud', [
    'iam', 'service-accounts', 'describe', `${family.id}@${PROJECT}.iam.gserviceaccount.com`,
    `--project=${PROJECT}`, '--format=json'
  ], { allowFailure: true });
  if (result.status === 0) return true;
  if (/NOT_FOUND|Unknown service account/i.test(`${result.stderr || ''}${result.stdout || ''}`)) return false;
  fail(`G6_IAM_ACCOUNT_STATE_UNKNOWN:${family.id}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.project !== PROJECT || args.env !== ENVIRONMENT) fail('G6_IAM_TARGET_INVALID');
  const requestedIds = String(args.families || FAMILIES.map((family) => family.id).join(','))
    .split(',').filter(Boolean);
  const selectedFamilies = FAMILIES.filter((family) => requestedIds.includes(family.id));
  if (!selectedFamilies.length || selectedFamilies.length !== requestedIds.length) fail('G6_IAM_FAMILIES_INVALID');
  const head = run('git', ['rev-parse', 'HEAD']).stdout.trim();
  if (args.commit !== head) fail('G6_IAM_COMMIT_MISMATCH');
  if (args.execute && args.approval !== APPROVAL) fail('G6_IAM_APPROVAL_INVALID');
  const actualProject = run('gcloud', ['config', 'get-value', 'project']).stdout.trim();
  if (actualProject !== PROJECT) fail('G6_IAM_EFFECTIVE_PROJECT_MISMATCH');

  const existedBefore = Object.fromEntries(selectedFamilies.map((family) => [family.id, accountExists(family)]));
  if (args.execute) {
    for (const family of selectedFamilies) {
      if (!existedBefore[family.id]) {
        run('gcloud', [
          'iam', 'service-accounts', 'create', family.id, `--project=${PROJECT}`,
          `--display-name=Functions Gen2 G6 ${family.id}`,
          '--description=Least privilege sandbox runtime for Functions Gen2 G6', '--quiet'
        ]);
      }
      for (const role of PROJECT_ROLES) {
        run('gcloud', [
          'projects', 'add-iam-policy-binding', PROJECT, `--project=${PROJECT}`,
          `--member=${memberFor(family)}`, `--role=${role}`, '--condition=None', '--quiet'
        ]);
      }
      for (const secret of family.secrets) {
        run('gcloud', [
          'secrets', 'add-iam-policy-binding', secret, `--project=${PROJECT}`,
          `--member=${memberFor(family)}`, '--role=roles/secretmanager.secretAccessor', '--condition=None', '--quiet'
        ]);
      }
      if (family.storage) {
        run('gcloud', [
          'storage', 'buckets', 'add-iam-policy-binding', DEFAULT_BUCKET,
          `--member=${memberFor(family)}`, '--role=roles/storage.objectAdmin', `--project=${PROJECT}`, '--quiet'
        ]);
      }
    }
  }

  const projectPolicy = json('gcloud', ['projects', 'get-iam-policy', PROJECT, `--project=${PROJECT}`]);
  const bucketPolicy = json('gcloud', ['storage', 'buckets', 'get-iam-policy', DEFAULT_BUCKET, `--project=${PROJECT}`]);
  const secretPolicies = Object.fromEntries([...new Set(selectedFamilies.flatMap((family) => family.secrets))].map(
    (secret) => [secret, json('gcloud', ['secrets', 'get-iam-policy', secret, `--project=${PROJECT}`])]
  ));
  const families = selectedFamilies.map((family) => {
    const member = memberFor(family);
    const account = `${family.id}@${PROJECT}.iam.gserviceaccount.com`;
    const keys = accountExists(family)
      ? json('gcloud', ['iam', 'service-accounts', 'keys', 'list', `--iam-account=${account}`, `--project=${PROJECT}`])
      : [];
    const ready = accountExists(family)
      && PROJECT_ROLES.every((role) => hasBinding(projectPolicy, role, member))
      && family.secrets.every((secret) => hasBinding(secretPolicies[secret], 'roles/secretmanager.secretAccessor', member))
      && (!family.storage || hasBinding(bucketPolicy, 'roles/storage.objectAdmin', member))
      && (keys || []).every((key) => key.keyType !== 'USER_MANAGED');
    return { id: family.id, account, storageObjectAdmin: family.storage === true, secretNames: family.secrets, ready };
  });
  if (args.execute && !families.every((family) => family.ready)) fail('G6_IAM_POSTCONDITION_FAILED');
  process.stdout.write(`${JSON.stringify({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: PROJECT,
    environment: ENVIRONMENT,
    commit: head,
    operator: run('gcloud', ['config', 'get-value', 'account']).stdout.trim(),
    catalogRuntimeReused: `catalog-builder@${PROJECT}.iam.gserviceaccount.com`,
    projectRoles: PROJECT_ROLES,
    families,
    ready: families.every((family) => family.ready)
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ ok: false, error: String(error?.message || error) })}\n`);
  process.exitCode = 1;
});
