#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const requireFromFunctions = createRequire(new URL('../functions/package.json', import.meta.url));
const admin = requireFromFunctions('firebase-admin');
const { POINTER_PATHS, readPointerState, verifyStoredRelease } = requireFromFunctions('./src/catalog/snapshotStorage');
const PROJECT_ID = 'secondevienextjsssr';
const REGION = 'europe-west1';
const FUNCTION_URL = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/catalogReconciler`;
const JOB_NAME = `firebase-schedule-catalogReconciler-${REGION}`;

function fail(code) { throw new Error(code); }

function parseArgs(argv) {
  return new Map(argv.map((argument) => {
    if (!argument.startsWith('--') || !argument.includes('=')) fail(`G2B_CATALOG_RECONCILER_ARGUMENT_INVALID:${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    return [key, parts.join('=')];
  }));
}

function gcloud(args) {
  const result = spawnSync('gcloud', [...args, `--project=${PROJECT_ID}`, '--format=json'], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
  });
  if (result.status !== 0) fail(`G2B_CATALOG_RECONCILER_GCLOUD_FAILED:${args.slice(0, 4).join('_')}`);
  return JSON.parse(result.stdout);
}

function iso(value) {
  return typeof value?.toDate === 'function' ? value.toDate().toISOString() : null;
}

async function inspectPointer(bucket, pointerPath) {
  const state = await readPointerState(bucket, pointerPath);
  if (state.missing || state.error) return { path: pointerPath, healthy: false, generation: state.generation || null };
  try {
    const verified = await verifyStoredRelease(bucket, state.value);
    return {
      path: pointerPath,
      healthy: true,
      generation: state.generation,
      revision: Number(verified.pointer.revision),
      manifestPath: verified.pointer.manifestPath,
      manifestSha256: verified.pointer.manifestSha256
    };
  } catch (error) {
    return { path: pointerPath, healthy: false, generation: state.generation || null, errorCode: String(error?.code || error?.message || 'UNKNOWN') };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.get('project') !== PROJECT_ID || args.get('env') !== 'sandbox') fail('G2B_CATALOG_RECONCILER_TARGET_INVALID');
  if (args.has('apply') || args.has('write') || args.has('delete')) fail('G2B_CATALOG_RECONCILER_READ_ONLY_ONLY');
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) fail('G2B_CATALOG_RECONCILER_CREDENTIAL_MISSING');
  const credential = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (credential.project_id !== PROJECT_ID) fail('G2B_CATALOG_RECONCILER_CREDENTIAL_PROJECT_MISMATCH');
  admin.initializeApp({ credential: admin.credential.cert(credential), projectId: PROJECT_ID });

  const db = admin.firestore();
  const bucket = admin.storage().bucket('secondevienextjsssr-catalog-europe-west4');
  const [controlSnapshot, cloudFunction, schedulerJob, ...pointers] = await Promise.all([
    db.doc('sys_catalog_publication/secondevie').get(),
    Promise.resolve(gcloud(['functions', 'describe', 'catalogReconciler', '--gen2', `--region=${REGION}`])),
    Promise.resolve(gcloud(['scheduler', 'jobs', 'describe', JOB_NAME, `--location=${REGION}`])),
    inspectPointer(bucket, POINTER_PATHS.current),
    inspectPointer(bucket, POINTER_PATHS.previous),
    inspectPointer(bucket, POINTER_PATHS.lastKnownGood)
  ]);
  if (!controlSnapshot.exists) fail('G2B_CATALOG_RECONCILER_CONTROL_MISSING');
  const control = controlSnapshot.data();
  const now = Date.now();
  const activeLease = Boolean(control.leaseToken && Number(control.leaseExpiresAt?.toMillis?.() || 0) > now);
  const publishedRevision = Number(control.publishedRevision || 0);
  const blockers = [
    control.mode !== 'active' ? 'CATALOG_MODE_NOT_ACTIVE' : null,
    control.dirty === true ? 'CATALOG_CONTROL_DIRTY' : null,
    activeLease ? 'CATALOG_LEASE_ACTIVE' : null,
    !['idle', 'published'].includes(control.buildState) ? 'CATALOG_BUILD_NOT_STABLE' : null,
    control.lastError ? 'CATALOG_LAST_ERROR_PRESENT' : null,
    Number(control.desiredRevision || 0) !== publishedRevision ? 'CATALOG_DESIRED_PUBLISHED_DRIFT' : null,
    Number(control.revalidatedRevision || 0) !== publishedRevision ? 'CATALOG_REVALIDATED_PUBLISHED_DRIFT' : null,
    pointers.some((pointer) => !pointer.healthy) ? 'CATALOG_POINTER_UNHEALTHY' : null,
    Number(pointers[0]?.revision || 0) !== publishedRevision ? 'CATALOG_CURRENT_POINTER_DRIFT' : null,
    cloudFunction.state !== 'ACTIVE' || cloudFunction.serviceConfig?.revision !== 'catalogreconciler-00009-luf' ? 'FUNCTION_BASELINE_DRIFT' : null,
    cloudFunction.buildConfig?.runtime !== 'nodejs22' ? 'FUNCTION_RUNTIME_DRIFT' : null,
    cloudFunction.buildConfig?.serviceAccount !== `projects/${PROJECT_ID}/serviceAccounts/231220287936-compute@developer.gserviceaccount.com` ? 'FUNCTION_BUILD_SA_DRIFT' : null,
    cloudFunction.serviceConfig?.serviceAccountEmail !== `catalog-enqueuer@${PROJECT_ID}.iam.gserviceaccount.com` ? 'FUNCTION_RUNTIME_SA_DRIFT' : null,
    cloudFunction.eventTrigger ? 'FUNCTION_TRANSPORT_NOT_HTTP' : null,
    cloudFunction.url !== FUNCTION_URL ? 'FUNCTION_URL_DRIFT' : null,
    schedulerJob.state !== 'ENABLED' ? 'SCHEDULER_DISABLED' : null,
    !['every 5 minutes', 'every 60 minutes'].includes(schedulerJob.schedule) || schedulerJob.timeZone !== 'UTC' ? 'SCHEDULER_CADENCE_DRIFT' : null,
    schedulerJob.httpTarget?.uri !== FUNCTION_URL || schedulerJob.httpTarget?.oidcToken?.audience !== FUNCTION_URL ? 'SCHEDULER_ENDPOINT_DRIFT' : null,
    schedulerJob.httpTarget?.oidcToken?.serviceAccountEmail !== `catalog-enqueuer@${PROJECT_ID}.iam.gserviceaccount.com` ? 'SCHEDULER_OIDC_DRIFT' : null,
    schedulerJob.attemptDeadline !== '180s' ? 'SCHEDULER_DEADLINE_BASELINE_DRIFT' : null
  ].filter(Boolean);

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: PROJECT_ID,
    environment: 'sandbox',
    mode: 'read-only',
    target: 'catalogReconciler',
    verdict: blockers.length ? 'HOLD_G2B_CATALOG_RECONCILER_PREFLIGHT' : 'G2B_CATALOG_RECONCILER_PREFLIGHT_READY',
    deploymentAllowed: false,
    blockers,
    control: {
      schemaVersion: control.schemaVersion || null,
      stateVersion: control.stateVersion || null,
      mode: control.mode || null,
      dirty: control.dirty === true,
      buildState: control.buildState || null,
      desiredRevision: control.desiredRevision || null,
      publishedRevision: control.publishedRevision || null,
      revalidatedRevision: control.revalidatedRevision || null,
      activeLease,
      leaseExpiresAt: iso(control.leaseExpiresAt),
      lastErrorPresent: Boolean(control.lastError),
      updatedAt: iso(control.updatedAt)
    },
    pointers,
    cloudBaseline: {
      revision: cloudFunction.serviceConfig?.revision,
      runtime: cloudFunction.buildConfig?.runtime,
      runtimeServiceAccount: cloudFunction.serviceConfig?.serviceAccountEmail,
      buildServiceAccount: cloudFunction.buildConfig?.serviceAccount,
      cpu: cloudFunction.serviceConfig?.availableCpu,
      memory: cloudFunction.serviceConfig?.availableMemory,
      timeoutSeconds: cloudFunction.serviceConfig?.timeoutSeconds,
      concurrency: cloudFunction.serviceConfig?.maxInstanceRequestConcurrency,
      minInstances: cloudFunction.serviceConfig?.minInstanceCount || 0,
      maxInstances: cloudFunction.serviceConfig?.maxInstanceCount,
      url: cloudFunction.url
    },
    schedulerBaseline: {
      name: JOB_NAME,
      state: schedulerJob.state,
      schedule: schedulerJob.schedule,
      timeZone: schedulerJob.timeZone,
      uri: schedulerJob.httpTarget?.uri,
      method: schedulerJob.httpTarget?.httpMethod,
      oidcServiceAccount: schedulerJob.httpTarget?.oidcToken?.serviceAccountEmail,
      oidcAudience: schedulerJob.httpTarget?.oidcToken?.audience,
      attemptDeadline: schedulerJob.attemptDeadline,
      retryMaxAttemptsEffective: Number(schedulerJob.retryConfig?.retryCount || 0),
      lastAttemptTime: schedulerJob.lastAttemptTime || null,
      status: schedulerJob.status || {}
    },
    desired: {
      runtimeServiceAccount: `catalog-builder@${PROJECT_ID}.iam.gserviceaccount.com`,
      buildServiceAccount: `functions-gen2-builder@${PROJECT_ID}.iam.gserviceaccount.com`,
      schedulerServiceAccount: `catalog-enqueuer@${PROJECT_ID}.iam.gserviceaccount.com`,
      cpu: 1,
      memoryMiB: 512,
      timeoutSeconds: 540,
      concurrency: 1,
      minInstances: 0,
      maxInstances: 1,
      retryCount: 0,
      attemptDeadlineSeconds: 540
    },
    driftResolution: {
      runtimeIdentity: 'Use catalog-builder because rollback recovery can rewrite previous pointer with Storage generation preconditions.',
      resources: 'Align source, function and scheduler deadline to the G2-A manifest: 512 MiB and 540 seconds.',
      conflictHandling: 'Retry RECONCILE_STATE_ADVANCED internally at most three attempts; Scheduler retry remains zero.'
    },
    nextGate: 'Verify exact IAM and rollback archive, commit the deployment inputs, then deploy only catalogReconciler and update only its existing Scheduler job.'
  };
  if (args.get('report')) {
    const output = path.resolve(args.get('report'));
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.message || 'G2B_CATALOG_RECONCILER_UNKNOWN_ERROR'}\n`);
  process.exitCode = 1;
});
