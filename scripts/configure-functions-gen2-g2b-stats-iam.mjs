#!/usr/bin/env node

import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const PROJECT_ID = 'secondevienextjsssr';
const PROJECT_NUMBER = '231220287936';
const ENVIRONMENT = 'sandbox';
const REGION = 'europe-west1';
const APPLY_APPROVAL = 'G2B_CONFIGURE_STATS_IAM';
const RUNTIME_SA = `order-stats-projector@${PROJECT_ID}.iam.gserviceaccount.com`;
const BUILD_SA = `functions-gen2-builder@${PROJECT_ID}.iam.gserviceaccount.com`;
const TRIGGER_SA = `functions-eventarc-invoker@${PROJECT_ID}.iam.gserviceaccount.com`;
const FUNCTION_SERVICE = 'onorderstatswrite';
const ARTIFACT_REPOSITORY = 'gcf-artifacts';
const SOURCE_BUCKETS = Object.freeze([
  `gcf-v2-sources-${PROJECT_NUMBER}-${REGION}`,
  `gcf-v2-uploads-${PROJECT_NUMBER}.${REGION}.cloudfunctions.appspot.com`
]);
const PROJECT_ROLES = Object.freeze({
  [RUNTIME_SA]: Object.freeze([
    'roles/datastore.user',
    'roles/logging.logWriter',
    'roles/serviceusage.serviceUsageConsumer'
  ]),
  [BUILD_SA]: Object.freeze(['roles/logging.logWriter']),
  [TRIGGER_SA]: Object.freeze(['roles/eventarc.eventReceiver'])
});

function fail(code) {
  throw new Error(code);
}

function parseArgs(argv) {
  const args = new Map();
  for (const argument of argv) {
    if (!argument.startsWith('--') || !argument.includes('=')) fail(`G2B_IAM_ARGUMENT_INVALID:${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    if (!key || !parts.length || args.has(key)) fail(`G2B_IAM_ARGUMENT_INVALID:${argument}`);
    args.set(key, parts.join('='));
  }
  return args;
}

function command(args, { allowNotFound = false } = {}) {
  const result = spawnSync('gcloud', [...args, `--project=${PROJECT_ID}`, '--format=json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (allowNotFound && result.status !== 0 && /NOT_FOUND|does not exist|was not found/i.test(result.stderr || '')) {
    return null;
  }
  if (result.status !== 0) fail(`G2B_IAM_GCLOUD_FAILED:${args.slice(0, 4).join('_')}`);
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}

function currentCommit() {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
  if (result.status !== 0) fail('G2B_IAM_GIT_HEAD_UNAVAILABLE');
  return result.stdout.trim();
}

function hasBinding(policy, role, member) {
  return (policy?.bindings || []).some((binding) =>
    binding.role === role && (binding.members || []).includes(member) && !binding.condition);
}

function directRoles(policy, member) {
  return (policy?.bindings || []).filter((binding) =>
    (binding.members || []).includes(member) && !binding.condition)
    .map((binding) => binding.role).sort();
}

function ensureServiceAccount(email, displayName, apply) {
  const current = command(['iam', 'service-accounts', 'describe', email], { allowNotFound: true });
  if (current) {
    if (current.projectId !== PROJECT_ID || current.disabled) fail(`G2B_IAM_SERVICE_ACCOUNT_INVALID:${email}`);
    return 'EXISTING';
  }
  if (!apply) return 'PLANNED';
  command([
    'iam', 'service-accounts', 'create', email.split('@')[0],
    `--display-name=${displayName}`,
    '--description=Sandbox Functions Gen2 G2-B; no user-managed keys',
    '--quiet'
  ]);
  return 'CREATED';
}

function addProjectRole(email, role, policy, apply) {
  const member = `serviceAccount:${email}`;
  if (hasBinding(policy, role, member)) return 'EXISTING';
  if (!apply) return 'PLANNED';
  command([
    'projects', 'add-iam-policy-binding', PROJECT_ID,
    `--member=${member}`,
    `--role=${role}`,
    '--condition=None',
    '--quiet'
  ]);
  return 'CREATED';
}

function addResourceRole({ read, add, role, member, apply, allowMissing = false }) {
  const policy = command(read, { allowNotFound: allowMissing }) || { bindings: [] };
  if (hasBinding(policy, role, member)) return 'EXISTING';
  if (!apply) return 'PLANNED';
  command([...add, `--member=${member}`, `--role=${role}`, '--quiet']);
  return 'CREATED';
}

function serviceAccountKeySummary(email) {
  const keys = command(['iam', 'service-accounts', 'keys', 'list', `--iam-account=${email}`]) || [];
  return {
    userManaged: keys.filter((key) => key.keyType === 'USER_MANAGED').length,
    systemManaged: keys.filter((key) => key.keyType === 'SYSTEM_MANAGED').length
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apply = args.get('apply') === 'true';
  if (args.get('project') !== PROJECT_ID || args.get('env') !== ENVIRONMENT) fail('G2B_IAM_TARGET_INVALID');
  if (args.get('commit') !== currentCommit()) fail('G2B_IAM_COMMIT_MISMATCH');
  if (!args.get('actor')) fail('G2B_IAM_ACTOR_REQUIRED');
  if (apply && args.get('approval') !== APPLY_APPROVAL) fail('G2B_IAM_APPLY_APPROVAL_REQUIRED');
  if (!apply && args.has('approval')) fail('G2B_IAM_APPROVAL_WITHOUT_APPLY');
  if (args.has('delete') || args.has('remove')) fail('G2B_IAM_DESTRUCTIVE_ACTION_FORBIDDEN');

  const activeAccounts = command(['auth', 'list', '--filter=status:ACTIVE']) || [];
  const activeAccount = activeAccounts.length === 1 ? activeAccounts[0].account : null;
  if (activeAccount !== args.get('actor')) fail('G2B_IAM_OPERATOR_MISMATCH');
  const project = command(['projects', 'describe', PROJECT_ID]);
  if (project.projectId !== PROJECT_ID || String(project.projectNumber) !== PROJECT_NUMBER || project.lifecycleState !== 'ACTIVE') {
    fail('G2B_IAM_EFFECTIVE_PROJECT_INVALID');
  }

  const serviceAccounts = {
    runtime: ensureServiceAccount(RUNTIME_SA, 'Functions Gen2 order stats runtime', apply),
    build: ensureServiceAccount(BUILD_SA, 'Functions Gen2 build', apply),
    trigger: ensureServiceAccount(TRIGGER_SA, 'Functions Gen2 Eventarc invoker', apply)
  };
  let projectPolicy = command(['projects', 'get-iam-policy', PROJECT_ID]);
  const projectBindings = [];
  for (const [email, roles] of Object.entries(PROJECT_ROLES)) {
    for (const role of roles) {
      projectBindings.push({ email, role, state: addProjectRole(email, role, projectPolicy, apply) });
      if (apply) projectPolicy = command(['projects', 'get-iam-policy', PROJECT_ID]);
    }
  }

  const actorMember = `user:${args.get('actor')}`;
  const actAs = {};
  for (const email of [RUNTIME_SA, BUILD_SA, TRIGGER_SA]) {
    actAs[email] = addResourceRole({
      read: ['iam', 'service-accounts', 'get-iam-policy', email],
      add: ['iam', 'service-accounts', 'add-iam-policy-binding', email],
      role: 'roles/iam.serviceAccountUser',
      member: actorMember,
      apply,
      allowMissing: !apply
    });
  }
  const buildMember = `serviceAccount:${BUILD_SA}`;
  const artifactWriter = addResourceRole({
    read: ['artifacts', 'repositories', 'get-iam-policy', ARTIFACT_REPOSITORY, `--location=${REGION}`],
    add: ['artifacts', 'repositories', 'add-iam-policy-binding', ARTIFACT_REPOSITORY, `--location=${REGION}`],
    role: 'roles/artifactregistry.writer',
    member: buildMember,
    apply
  });
  const sourceViewers = Object.fromEntries(SOURCE_BUCKETS.map((bucket) => [bucket, addResourceRole({
    read: ['storage', 'buckets', 'get-iam-policy', `gs://${bucket}`],
    add: ['storage', 'buckets', 'add-iam-policy-binding', `gs://${bucket}`],
    role: 'roles/storage.objectViewer',
    member: buildMember,
    apply
  })]));
  const runInvoker = addResourceRole({
    read: ['run', 'services', 'get-iam-policy', FUNCTION_SERVICE, `--region=${REGION}`],
    add: ['run', 'services', 'add-iam-policy-binding', FUNCTION_SERVICE, `--region=${REGION}`],
    role: 'roles/run.invoker',
    member: `serviceAccount:${TRIGGER_SA}`,
    apply
  });

  const finalProjectPolicy = command(['projects', 'get-iam-policy', PROJECT_ID]);
  const identities = {};
  for (const email of [RUNTIME_SA, BUILD_SA, TRIGGER_SA]) {
    const expectedRoles = [...PROJECT_ROLES[email]].sort();
    const roles = directRoles(finalProjectPolicy, `serviceAccount:${email}`);
    const servicePolicy = command(['iam', 'service-accounts', 'get-iam-policy', email], {
      allowNotFound: !apply
    }) || { bindings: [] };
    identities[email] = {
      expectedProjectRoles: expectedRoles,
      projectRoles: roles,
      projectRolesExact: JSON.stringify(roles) === JSON.stringify(expectedRoles),
      actorCanActAs: hasBinding(servicePolicy, 'roles/iam.serviceAccountUser', actorMember),
      keys: apply ? serviceAccountKeySummary(email) : { userManaged: 0, systemManaged: 0 }
    };
  }
  const resourceChecks = {
    artifactWriter: hasBinding(
      command(['artifacts', 'repositories', 'get-iam-policy', ARTIFACT_REPOSITORY, `--location=${REGION}`]),
      'roles/artifactregistry.writer', buildMember),
    sourceViewers: Object.fromEntries(SOURCE_BUCKETS.map((bucket) => [bucket, hasBinding(
      command(['storage', 'buckets', 'get-iam-policy', `gs://${bucket}`]),
      'roles/storage.objectViewer', buildMember
    )])),
    runInvoker: hasBinding(
      command(['run', 'services', 'get-iam-policy', FUNCTION_SERVICE, `--region=${REGION}`]),
      'roles/run.invoker', `serviceAccount:${TRIGGER_SA}`)
  };
  const verified = Object.values(identities).every((identity) =>
    identity.projectRolesExact && identity.actorCanActAs && identity.keys.userManaged === 0) &&
    resourceChecks.artifactWriter && Object.values(resourceChecks.sourceViewers).every(Boolean) &&
    resourceChecks.runInvoker;
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: PROJECT_ID,
    projectNumber: PROJECT_NUMBER,
    environment: ENVIRONMENT,
    mode: apply ? 'apply' : 'dry-run',
    actor: args.get('actor'),
    commit: args.get('commit'),
    serviceAccounts,
    changes: { projectBindings, actAs, artifactWriter, sourceViewers, runInvoker },
    identities,
    resourceChecks,
    forbidden: {
      defaultRuntimeServiceAccount: false,
      defaultBuildServiceAccount: false,
      projectWideRunInvoker: false,
      publicInvoker: false,
      userManagedKeys: false
    },
    verdict: verified ? 'G2B_STATS_IAM_VERIFIED' : (apply ? 'HOLD_G2B_STATS_IAM' : 'G2B_STATS_IAM_PLANNED'),
    rollback: 'Retain hardened IAM during the Function rollback window; removal is a distinct G12-B cleanup only.'
  };
  report.manifestDigest = crypto.createHash('sha256').update(JSON.stringify(report)).digest('hex');
  if (args.get('output')) {
    const output = path.resolve(args.get('output'));
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (apply && !verified) process.exitCode = 2;
}

main().catch((error) => {
  process.stderr.write(`${error?.message || 'G2B_IAM_UNKNOWN_ERROR'}\n`);
  process.exitCode = 1;
});
