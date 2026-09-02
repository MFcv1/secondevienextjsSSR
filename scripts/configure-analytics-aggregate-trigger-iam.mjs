#!/usr/bin/env node

import process from 'node:process';
import { spawnSync } from 'node:child_process';

const PROJECT = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const REGION = 'europe-west1';
const FUNCTION_SERVICE = 'aggregateanalyticssessiongen2';
const TRIGGER_SERVICE_ACCOUNT = `functions-eventarc-invoker@${PROJECT}.iam.gserviceaccount.com`;
const APPLY_APPROVAL = 'FIX_ANALYTICS_AGGREGATE_TRIGGER_IAM';

function fail(code) {
  throw new Error(code);
}

function parseArgs(argv) {
  const args = new Map();
  for (const argument of argv) {
    if (!argument.startsWith('--') || !argument.includes('=')) fail(`ANALYTICS_TRIGGER_IAM_ARGUMENT_INVALID:${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    if (!key || !parts.length || args.has(key)) fail(`ANALYTICS_TRIGGER_IAM_ARGUMENT_INVALID:${argument}`);
    args.set(key, parts.join('='));
  }
  return args;
}

function command(args, { allowNotFound = false } = {}) {
  const result = spawnSync('gcloud', [...args, `--project=${PROJECT}`, '--format=json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (allowNotFound && result.status !== 0 && /NOT_FOUND|does not exist|was not found/i.test(result.stderr || '')) return null;
  if (result.status !== 0) fail(`ANALYTICS_TRIGGER_IAM_GCLOUD_FAILED:${args.slice(0, 5).join('_')}`);
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}

function currentCommit() {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
  if (result.status !== 0) fail('ANALYTICS_TRIGGER_IAM_GIT_HEAD_UNAVAILABLE');
  return result.stdout.trim();
}

function hasBinding(policy, role, member) {
  return (policy?.bindings || []).some((binding) =>
    binding.role === role && (binding.members || []).includes(member) && !binding.condition);
}

function addProjectBinding(role, member) {
  command([
    'projects', 'add-iam-policy-binding', PROJECT,
    `--member=${member}`,
    `--role=${role}`,
    '--condition=None',
    '--quiet'
  ]);
}

function addRunBinding(role, member) {
  command([
    'run', 'services', 'add-iam-policy-binding', FUNCTION_SERVICE,
    `--region=${REGION}`,
    `--member=${member}`,
    `--role=${role}`,
    '--condition=None',
    '--quiet'
  ]);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apply = args.get('apply') === 'true';
  if (args.get('project') !== PROJECT || args.get('env') !== ENVIRONMENT) fail('ANALYTICS_TRIGGER_IAM_TARGET_INVALID');
  if (args.get('commit') !== currentCommit()) fail('ANALYTICS_TRIGGER_IAM_COMMIT_MISMATCH');
  if (apply && args.get('approval') !== APPLY_APPROVAL) fail('ANALYTICS_TRIGGER_IAM_APPROVAL_REQUIRED');
  if (!apply && args.has('approval')) fail('ANALYTICS_TRIGGER_IAM_APPROVAL_WITHOUT_APPLY');
  if (args.has('delete') || args.has('remove')) fail('ANALYTICS_TRIGGER_IAM_DESTRUCTIVE_ACTION_FORBIDDEN');

  const project = command(['projects', 'describe', PROJECT]);
  if (project.projectId !== PROJECT || project.lifecycleState !== 'ACTIVE') fail('ANALYTICS_TRIGGER_IAM_PROJECT_INVALID');
  const triggerAccount = command([
    'iam', 'service-accounts', 'describe', TRIGGER_SERVICE_ACCOUNT
  ], { allowNotFound: true });
  if (!triggerAccount || triggerAccount.disabled) fail('ANALYTICS_TRIGGER_IAM_SERVICE_ACCOUNT_INVALID');
  const cloudFunction = command([
    'functions', 'describe', 'aggregateAnalyticsSessionGen2',
    '--gen2', `--region=${REGION}`
  ], { allowNotFound: true });
  if (!cloudFunction || cloudFunction.state !== 'ACTIVE') fail('ANALYTICS_TRIGGER_IAM_FUNCTION_NOT_ACTIVE');

  const member = `serviceAccount:${TRIGGER_SERVICE_ACCOUNT}`;
  let projectPolicy = command(['projects', 'get-iam-policy', PROJECT]);
  let runPolicy = command(['run', 'services', 'get-iam-policy', FUNCTION_SERVICE, `--region=${REGION}`]);
  const changes = {
    eventReceiver: hasBinding(projectPolicy, 'roles/eventarc.eventReceiver', member) ? 'EXISTING' : 'PLANNED',
    runInvoker: hasBinding(runPolicy, 'roles/run.invoker', member) ? 'EXISTING' : 'PLANNED'
  };

  if (apply && changes.eventReceiver === 'PLANNED') addProjectBinding('roles/eventarc.eventReceiver', member);
  if (apply && changes.runInvoker === 'PLANNED') addRunBinding('roles/run.invoker', member);

  projectPolicy = command(['projects', 'get-iam-policy', PROJECT]);
  runPolicy = command(['run', 'services', 'get-iam-policy', FUNCTION_SERVICE, `--region=${REGION}`]);
  const keys = command([
    'iam', 'service-accounts', 'keys', 'list', `--iam-account=${TRIGGER_SERVICE_ACCOUNT}`
  ]) || [];
  const userManagedKeyCount = keys.filter((key) => key.keyType === 'USER_MANAGED').length;
  const ready = hasBinding(projectPolicy, 'roles/eventarc.eventReceiver', member)
    && hasBinding(runPolicy, 'roles/run.invoker', member)
    && userManagedKeyCount === 0;
  if (apply && !ready) fail('ANALYTICS_TRIGGER_IAM_POSTCONDITION_FAILED');

  process.stdout.write(`${JSON.stringify({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: PROJECT,
    environment: ENVIRONMENT,
    mode: apply ? 'apply' : 'dry-run',
    commit: currentCommit(),
    functionService: FUNCTION_SERVICE,
    triggerServiceAccount: TRIGGER_SERVICE_ACCOUNT,
    changes,
    userManagedKeyCount,
    ready
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ ok: false, error: String(error?.message || error) })}\n`);
  process.exitCode = 1;
});
