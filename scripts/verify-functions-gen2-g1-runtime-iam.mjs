#!/usr/bin/env node

import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const SERVICE_ACCOUNT =
  'commerce-operations-reconciler@secondevienextjsssr.iam.gserviceaccount.com';
const EXPECTED_ROLES = [
  'roles/datastore.user',
  'roles/logging.logWriter',
  'roles/serviceusage.serviceUsageConsumer'
];
const OUTPUT = 'apphostingaudit/manifests/functions-gen2-g1-runtime-iam.json';

function fail(code) {
  throw new Error(code);
}

function parseArgs(argv) {
  return new Map(argv.map((argument) => {
    if (!argument.startsWith('--')) fail(`G1_RUNTIME_IAM_ARGUMENT_INVALID:${argument}`);
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.get('project') !== PROJECT_ID || (args.get('env') || ENVIRONMENT) !== ENVIRONMENT) {
    fail('G1_RUNTIME_IAM_TARGET_INVALID');
  }
  if (args.has('apply') || args.has('write') || args.has('delete')) fail('G1_RUNTIME_IAM_READ_ONLY');

  const [project, serviceAccount, projectPolicy, serviceAccountPolicy, keys] = [
    gcloud(['projects', 'describe', PROJECT_ID]),
    gcloud(['iam', 'service-accounts', 'describe', SERVICE_ACCOUNT]),
    gcloud(['projects', 'get-iam-policy', PROJECT_ID]),
    gcloud(['iam', 'service-accounts', 'get-iam-policy', SERVICE_ACCOUNT]),
    gcloud(['iam', 'service-accounts', 'keys', 'list', `--iam-account=${SERVICE_ACCOUNT}`])
  ];
  if (project.projectId !== PROJECT_ID || serviceAccount.projectId !== PROJECT_ID) {
    fail('G1_RUNTIME_IAM_EFFECTIVE_PROJECT_INVALID');
  }
  const member = `serviceAccount:${SERVICE_ACCOUNT}`;
  const roles = (projectPolicy.bindings || [])
    .filter((binding) => (binding.members || []).includes(member))
    .map((binding) => binding.role)
    .sort();
  const expected = [...EXPECTED_ROLES].sort();
  const publicImpersonation = (serviceAccountPolicy.bindings || []).filter((binding) => (
    (binding.members || []).some((candidate) => ['allUsers', 'allAuthenticatedUsers'].includes(candidate))
  )).map((binding) => binding.role).sort();
  const keyTypes = Object.fromEntries([...keys.reduce((counts, key) => {
    const type = key.keyType || 'UNKNOWN';
    counts.set(type, (counts.get(type) || 0) + 1);
    return counts;
  }, new Map())].sort());
  const rolesExact = JSON.stringify(roles) === JSON.stringify(expected);
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: PROJECT_ID,
    environment: ENVIRONMENT,
    serviceAccount: SERVICE_ACCOUNT,
    roles,
    expectedRoles: expected,
    rolesExact,
    forbiddenCapabilities: {
      authAdmin: roles.includes('roles/firebaseauth.admin'),
      storageAdmin: roles.some((role) => role.startsWith('roles/storage.')),
      tasksEnqueuer: roles.includes('roles/cloudtasks.enqueuer'),
      editor: roles.includes('roles/editor'),
      owner: roles.includes('roles/owner')
    },
    keys: {
      types: keyTypes,
      userManaged: keyTypes.USER_MANAGED || 0
    },
    publicImpersonation,
    verdict: rolesExact && (keyTypes.USER_MANAGED || 0) === 0 && publicImpersonation.length === 0
      ? 'RUNTIME_IAM_MINIMAL_VERIFIED'
      : 'HOLD_RUNTIME_IAM'
  };
  manifest.manifestDigest = digest(manifest);
  const output = path.resolve(args.get('output') || OUTPUT);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({
    status: 'OK',
    verdict: manifest.verdict,
    roles,
    userManagedKeys: manifest.keys.userManaged,
    publicImpersonation,
    output: path.relative(process.cwd(), output)
  }, null, 2)}\n`);
  if (manifest.verdict !== 'RUNTIME_IAM_MINIMAL_VERIFIED') process.exitCode = 2;
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${JSON.stringify({ status: 'ERROR', code: String(error?.message || error) })}\n`);
  process.exitCode = 1;
}
