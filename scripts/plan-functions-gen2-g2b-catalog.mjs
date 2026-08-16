#!/usr/bin/env node

import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const requireFromFunctions = createRequire(new URL('../functions/package.json', import.meta.url));
const admin = requireFromFunctions('firebase-admin');
const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';

function fail(code) {
  throw new Error(code);
}

function parseArgs(argv) {
  return new Map(argv.map((argument) => {
    if (!argument.startsWith('--') || !argument.includes('=')) fail(`G2B_CATALOG_ARGUMENT_INVALID:${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    return [key, parts.join('=')];
  }));
}

function iso(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return null;
}

function counts(rows, field) {
  return Object.fromEntries([...rows.reduce((result, row) => {
    const value = String(row[field] || 'missing');
    result.set(value, (result.get(value) || 0) + 1);
    return result;
  }, new Map())].sort());
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.get('project') !== PROJECT_ID || args.get('env') !== ENVIRONMENT) fail('G2B_CATALOG_TARGET_INVALID');
  if (args.has('apply') || args.has('write') || args.has('delete')) fail('G2B_CATALOG_READ_ONLY_ONLY');
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) fail('G2B_CATALOG_CREDENTIAL_MISSING');
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (serviceAccount.project_id !== PROJECT_ID) fail('G2B_CATALOG_CREDENTIAL_PROJECT_MISMATCH');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: PROJECT_ID });
  const db = admin.firestore();
  const [controlSnapshot, eventsSnapshot, buildsSnapshot] = await Promise.all([
    db.doc('sys_catalog_publication/secondevie').get(),
    db.collection('sys_catalog_publication_events').get(),
    db.collection('sys_catalog_publication_builds').get()
  ]);
  if (!controlSnapshot.exists) fail('G2B_CATALOG_CONTROL_MISSING');
  const control = controlSnapshot.data();
  const events = eventsSnapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
  const builds = buildsSnapshot.docs.map((document) => document.data());
  const now = Date.now();
  const activeLease = Boolean(control.leaseToken && Number(control.leaseExpiresAt?.toMillis?.() || 0) > now);
  const pendingEventCount = events.filter((event) => !['scheduled', 'ignored'].includes(event.dispatchState)).length;
  const publishedRevision = Number(control.publishedRevision || 0);
  const failedRevisions = builds.filter((build) => build.state === 'failed').map((build) => Number(build.revision || 0));
  const preparedRevisions = builds.filter((build) => build.state === 'prepared').map((build) => Number(build.revision || 0));
  const unresolvedFailed = failedRevisions.filter((revision) => revision > publishedRevision);
  const unresolvedPrepared = preparedRevisions.filter((revision) => revision > publishedRevision);
  const stableBuildState = ['idle', 'published'].includes(control.buildState);
  const blockers = [
    ![1, 2].includes(Number(control.schemaVersion || 0)) ? 'CATALOG_CONTROL_SCHEMA_UNKNOWN' : null,
    control.mode !== 'active' ? 'CATALOG_MODE_NOT_ACTIVE' : null,
    control.dirty === true ? 'CATALOG_CONTROL_DIRTY' : null,
    activeLease ? 'CATALOG_LEASE_ACTIVE' : null,
    !stableBuildState ? `CATALOG_BUILD_STATE_${String(control.buildState || 'MISSING').toUpperCase()}` : null,
    pendingEventCount > 0 ? `CATALOG_EVENT_PENDING_${pendingEventCount}` : null,
    unresolvedFailed.length > 0 ? `CATALOG_FAILED_REVISION_AHEAD_${Math.max(...unresolvedFailed)}` : null,
    unresolvedPrepared.length > 0 ? `CATALOG_PREPARED_REVISION_AHEAD_${Math.max(...unresolvedPrepared)}` : null,
    control.lastError ? 'CATALOG_LAST_ERROR_PRESENT' : null
  ].filter(Boolean);
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: PROJECT_ID,
    environment: ENVIRONMENT,
    mode: 'read-only',
    target: 'onCatalogSourceWrite',
    verdict: blockers.length ? 'HOLD_G2B_CATALOG_PREFLIGHT' : 'G2B_CATALOG_PREFLIGHT_READY',
    deploymentAllowed: false,
    blockers,
    control: {
      schemaVersion: control.schemaVersion || null,
      schemaCompatibility: [1, 2].includes(Number(control.schemaVersion || 0))
        ? 'LEGACY_V1_OR_CURRENT_V2_COMPATIBLE'
        : 'UNKNOWN_SCHEMA',
      stateVersion: control.stateVersion || null,
      mode: control.mode || null,
      dirty: control.dirty === true,
      buildState: control.buildState || null,
      desiredRevision: control.desiredRevision || null,
      publishedRevision: control.publishedRevision || null,
      revalidatedRevision: control.revalidatedRevision || null,
      activeLease,
      leaseExpiresAt: iso(control.leaseExpiresAt),
      consecutiveFailures: Number(control.consecutiveFailures || 0),
      lastErrorPresent: Boolean(control.lastError),
      updatedAt: iso(control.updatedAt)
    },
    eventLedger: {
      count: events.length,
      dispatchStates: counts(events, 'dispatchState'),
      pending: pendingEventCount,
      legacyEventIdKeys: events.filter((event) => event.eventHash && event.id === event.eventHash).length,
      semanticMutationKeys: events.filter((event) => event.mutationHash && event.id === event.mutationHash).length,
      expired: events.filter((event) => Number(event.expireAt?.toMillis?.() || Infinity) <= now).length
    },
    builds: {
      count: builds.length,
      states: counts(builds, 'state'),
      maxFailedRevision: failedRevisions.length ? Math.max(...failedRevisions) : null,
      maxPreparedRevision: preparedRevisions.length ? Math.max(...preparedRevisions) : null,
      unresolvedFailedAheadOfPublished: unresolvedFailed.length,
      unresolvedPreparedAheadOfPublished: unresolvedPrepared.length
    },
    plannedRuntime: {
      generation: 2,
      region: 'europe-west1',
      cpu: 1,
      concurrency: 1,
      minInstances: 0,
      maxInstances: 1,
      memoryMiB: 256,
      timeoutSeconds: 60,
      retry: true,
      runtimeServiceAccount: 'catalog-enqueuer@secondevienextjsssr.iam.gserviceaccount.com',
      buildServiceAccount: 'functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
      triggerServiceAccount: 'functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com'
    },
    nextGate: 'Resolve every blocker, verify queue/IAM/rollback archive, then commit and deploy only onCatalogSourceWrite.'
  };
  if (args.get('report')) {
    const output = path.resolve(args.get('report'));
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.message || 'G2B_CATALOG_UNKNOWN_ERROR'}\n`);
  process.exitCode = 1;
});
