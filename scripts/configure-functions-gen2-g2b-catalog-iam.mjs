#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const PROJECT_ID = 'secondevienextjsssr';
const PROJECT_NUMBER = '231220287936';
const ENVIRONMENT = 'sandbox';
const REGION = 'europe-west1';
const APPROVAL = 'G2B_CONFIGURE_CATALOG_IAM';
const RUNTIME_SA = `catalog-enqueuer@${PROJECT_ID}.iam.gserviceaccount.com`;
const BUILD_SA = `functions-gen2-builder@${PROJECT_ID}.iam.gserviceaccount.com`;
const TRIGGER_SA = `functions-eventarc-invoker@${PROJECT_ID}.iam.gserviceaccount.com`;
const EXPECTED_RUNTIME_ROLES = Object.freeze([
  'roles/cloudtasks.enqueuer',
  'roles/datastore.user',
  'roles/eventarc.eventReceiver',
  'roles/logging.logWriter',
  'roles/serviceusage.serviceUsageConsumer'
]);
const SOURCE_BUCKETS = Object.freeze([
  `gcf-v2-sources-${PROJECT_NUMBER}-${REGION}`,
  `gcf-v2-uploads-${PROJECT_NUMBER}.${REGION}.cloudfunctions.appspot.com`
]);

function fail(code) {
  throw new Error(code);
}

function parseArgs(argv) {
  const args = new Map();
  for (const argument of argv) {
    if (!argument.startsWith('--') || !argument.includes('=')) fail(`G2B_CATALOG_IAM_ARGUMENT_INVALID:${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    if (!key || !parts.length || args.has(key)) fail(`G2B_CATALOG_IAM_ARGUMENT_INVALID:${argument}`);
    args.set(key, parts.join('='));
  }
  return args;
}

function gcloud(args) {
  const result = spawnSync('gcloud', [...args, `--project=${PROJECT_ID}`, '--format=json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (result.status !== 0) fail(`G2B_CATALOG_IAM_GCLOUD_FAILED:${args.slice(0, 4).join('_')}`);
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}

function gitHead() {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
  if (result.status !== 0) fail('G2B_CATALOG_IAM_GIT_HEAD_UNAVAILABLE');
  return result.stdout.trim();
}

function hasBinding(policy, role, member) {
  return (policy?.bindings || []).some((binding) =>
    binding.role === role && (binding.members || []).includes(member) && !binding.condition);
}

function rolesFor(policy, member) {
  return (policy?.bindings || []).filter((binding) =>
    (binding.members || []).includes(member) && !binding.condition)
    .map((binding) => binding.role).sort();
}

function addBinding({ read, add, role, member, apply }) {
  if (hasBinding(gcloud(read), role, member)) return 'EXISTING';
  if (!apply) return 'PLANNED';
  gcloud([...add, `--member=${member}`, `--role=${role}`, '--quiet']);
  return 'CREATED';
}

function keySummary(email) {
  const keys = gcloud(['iam', 'service-accounts', 'keys', 'list', `--iam-account=${email}`]) || [];
  return {
    userManaged: keys.filter((key) => key.keyType === 'USER_MANAGED').length,
    systemManaged: keys.filter((key) => key.keyType === 'SYSTEM_MANAGED').length
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apply = args.get('apply') === 'true';
  if (args.get('project') !== PROJECT_ID || args.get('env') !== ENVIRONMENT) fail('G2B_CATALOG_IAM_TARGET_INVALID');
  if (args.get('commit') !== gitHead()) fail('G2B_CATALOG_IAM_COMMIT_MISMATCH');
  if (apply && args.get('approval') !== APPROVAL) fail('G2B_CATALOG_IAM_APPROVAL_REQUIRED');
  if (!apply && args.has('approval')) fail('G2B_CATALOG_IAM_APPROVAL_WITHOUT_APPLY');
  if (args.has('remove') || args.has('delete')) fail('G2B_CATALOG_IAM_DESTRUCTIVE_FORBIDDEN');
  const active = gcloud(['auth', 'list', '--filter=status:ACTIVE']) || [];
  if (active.length !== 1 || active[0].account !== args.get('actor')) fail('G2B_CATALOG_IAM_OPERATOR_MISMATCH');
  const project = gcloud(['projects', 'describe', PROJECT_ID]);
  if (project.projectId !== PROJECT_ID || String(project.projectNumber) !== PROJECT_NUMBER || project.lifecycleState !== 'ACTIVE') {
    fail('G2B_CATALOG_IAM_PROJECT_MISMATCH');
  }
  for (const email of [RUNTIME_SA, BUILD_SA, TRIGGER_SA]) {
    const serviceAccount = gcloud(['iam', 'service-accounts', 'describe', email]);
    if (serviceAccount.projectId !== PROJECT_ID || serviceAccount.disabled) fail(`G2B_CATALOG_IAM_SA_INVALID:${email}`);
  }

  const runtimeMember = `serviceAccount:${RUNTIME_SA}`;
  const buildMember = `serviceAccount:${BUILD_SA}`;
  const triggerMember = `serviceAccount:${TRIGGER_SA}`;
  const actorMember = `user:${args.get('actor')}`;
  const changes = {
    runtimeServiceUsage: addBinding({
      read: ['projects', 'get-iam-policy', PROJECT_ID],
      add: ['projects', 'add-iam-policy-binding', PROJECT_ID, '--condition=None'],
      role: 'roles/serviceusage.serviceUsageConsumer', member: runtimeMember, apply
    }),
    runtimeActAs: addBinding({
      read: ['iam', 'service-accounts', 'get-iam-policy', RUNTIME_SA],
      add: ['iam', 'service-accounts', 'add-iam-policy-binding', RUNTIME_SA],
      role: 'roles/iam.serviceAccountUser', member: actorMember, apply
    }),
    triggerRunInvoker: addBinding({
      read: ['run', 'services', 'get-iam-policy', 'oncatalogsourcewrite', `--region=${REGION}`],
      add: ['run', 'services', 'add-iam-policy-binding', 'oncatalogsourcewrite', `--region=${REGION}`],
      role: 'roles/run.invoker', member: triggerMember, apply
    })
  };
  const projectPolicy = gcloud(['projects', 'get-iam-policy', PROJECT_ID]);
  const runtimeRoles = rolesFor(projectPolicy, runtimeMember);
  const buildRoles = rolesFor(projectPolicy, buildMember);
  const triggerRoles = rolesFor(projectPolicy, triggerMember);
  const runtimePolicy = gcloud(['iam', 'service-accounts', 'get-iam-policy', RUNTIME_SA]);
  const buildPolicy = gcloud(['iam', 'service-accounts', 'get-iam-policy', BUILD_SA]);
  const triggerPolicy = gcloud(['iam', 'service-accounts', 'get-iam-policy', TRIGGER_SA]);
  const runPolicy = gcloud(['run', 'services', 'get-iam-policy', 'oncatalogsourcewrite', `--region=${REGION}`]);
  const artifactPolicy = gcloud(['artifacts', 'repositories', 'get-iam-policy', 'gcf-artifacts', `--location=${REGION}`]);
  const sourceViewers = Object.fromEntries(SOURCE_BUCKETS.map((bucket) => [bucket, hasBinding(
    gcloud(['storage', 'buckets', 'get-iam-policy', `gs://${bucket}`]),
    'roles/storage.objectViewer', buildMember
  )]));
  const keys = {
    runtime: keySummary(RUNTIME_SA),
    build: keySummary(BUILD_SA),
    trigger: keySummary(TRIGGER_SA)
  };
  const publicInvoker = (runPolicy.bindings || []).some((binding) =>
    (binding.members || []).some((member) => ['allUsers', 'allAuthenticatedUsers'].includes(member)));
  const checks = {
    runtimeRolesExact: JSON.stringify(runtimeRoles) === JSON.stringify([...EXPECTED_RUNTIME_ROLES].sort()),
    buildProjectRolesExact: JSON.stringify(buildRoles) === JSON.stringify(['roles/logging.logWriter']),
    triggerProjectRolesExact: JSON.stringify(triggerRoles) === JSON.stringify(['roles/eventarc.eventReceiver']),
    runtimeActAs: hasBinding(runtimePolicy, 'roles/iam.serviceAccountUser', actorMember),
    buildActAs: hasBinding(buildPolicy, 'roles/iam.serviceAccountUser', actorMember),
    triggerActAs: hasBinding(triggerPolicy, 'roles/iam.serviceAccountUser', actorMember),
    buildArtifactWriter: hasBinding(artifactPolicy, 'roles/artifactregistry.writer', buildMember),
    buildSourceViewers: Object.values(sourceViewers).every(Boolean),
    triggerRunInvoker: hasBinding(runPolicy, 'roles/run.invoker', triggerMember),
    rollbackRuntimeInvokerRetained: hasBinding(runPolicy, 'roles/run.invoker', runtimeMember),
    publicInvoker: false,
    noUserManagedKeys: Object.values(keys).every((value) => value.userManaged === 0)
  };
  checks.publicInvoker = publicInvoker;
  const verified = Object.entries(checks).every(([key, value]) =>
    key === 'publicInvoker' ? value === false : value === true);
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: PROJECT_ID,
    environment: ENVIRONMENT,
    target: 'onCatalogSourceWrite',
    mode: apply ? 'apply' : 'dry-run',
    actor: args.get('actor'),
    commit: args.get('commit'),
    changes,
    roles: { runtime: runtimeRoles, build: buildRoles, trigger: triggerRoles },
    sourceViewers,
    keys,
    checks,
    verdict: verified ? 'G2B_CATALOG_IAM_VERIFIED' : (apply ? 'HOLD_G2B_CATALOG_IAM' : 'G2B_CATALOG_IAM_PLANNED'),
    rollback: 'Retain catalog-enqueuer Eventarc Receiver and Run Invoker plus all new IAM until G12-B; no IAM removal in G2-B.'
  };
  if (args.get('output')) {
    const output = path.resolve(args.get('output'));
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (apply && !verified) process.exitCode = 2;
}

main().catch((error) => {
  process.stderr.write(`${error?.message || 'G2B_CATALOG_IAM_UNKNOWN_ERROR'}\n`);
  process.exitCode = 1;
});

