#!/usr/bin/env node

import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE_PATH = path.join(ROOT, 'apphostingaudit/manifests/functions-g0.json');
const OUTPUT_PATH = path.join(ROOT, 'apphostingaudit/manifests/functions-gen2-g2a-plan.json');
const BUILD_SA = `functions-gen2-builder@${PROJECT_ID}.iam.gserviceaccount.com`;
const EVENTARC_SA = `functions-eventarc-invoker@${PROJECT_ID}.iam.gserviceaccount.com`;

const args = new Map(process.argv.slice(2).map((argument) => {
  if (!argument.startsWith('--')) throw new Error(`G2A_PLAN_ARGUMENT_INVALID:${argument}`);
  const [key, ...parts] = argument.slice(2).split('=');
  return [key, parts.length ? parts.join('=') : 'true'];
}));

function invariant(condition, code) {
  if (!condition) throw new Error(code);
}

function runtime(runtimeServiceAccount, overrides = {}) {
  return {
    generation: 2,
    region: overrides.region || 'europe-west1',
    cpu: overrides.cpu ?? 1,
    concurrency: overrides.concurrency ?? 1,
    minInstances: 0,
    maxInstances: overrides.maxInstances ?? 1,
    memoryMiB: overrides.memoryMiB ?? 256,
    timeoutSeconds: overrides.timeoutSeconds ?? 60,
    retry: overrides.retry,
    retryConfig: overrides.retryConfig || null,
    runtimeServiceAccount,
    buildServiceAccount: BUILD_SA
  };
}

const catalogBuilder = `catalog-builder@${PROJECT_ID}.iam.gserviceaccount.com`;
const catalogEnqueuer = `catalog-enqueuer@${PROJECT_ID}.iam.gserviceaccount.com`;
const publicationWorker = `product-publication-worker@${PROJECT_ID}.iam.gserviceaccount.com`;
const emailWorker = `legacy-order-email-worker@${PROJECT_ID}.iam.gserviceaccount.com`;
const mediaEnqueuer = `catalog-media-enqueuer@${PROJECT_ID}.iam.gserviceaccount.com`;
const statsProjector = `order-stats-projector@${PROJECT_ID}.iam.gserviceaccount.com`;

const plans = [
  {
    name: 'onOrderStatsWrite', source: 'functions/src/commerce/orderStats.js', owner: 'legacy-stats-projection',
    runtime: runtime(statsProjector, { retry: true }),
    iam: { projectRoles: ['roles/datastore.user', 'roles/logging.logWriter', 'roles/serviceusage.serviceUsageConsumer'], secrets: [] },
    data: { reads: ['orders', 'order_stats_projections'], writes: ['order_stats_projections', 'dashboard_stats', 'sales_stats_daily'] },
    idempotence: 'authoritative-order-plus-transactional-ledger', overlap: 'at-least-once/event-order-irrelevant-after-ledger',
    blockers: ['seed 26 missing order_stats_projections with source updateTime preconditions', 'reconcile dashboard and 8 daily rollups']
  },
  {
    name: 'onCatalogSourceWrite', source: 'functions/src/catalog/onCatalogSourceWrite.js', owner: 'catalog-mutation-recorder',
    runtime: runtime(catalogEnqueuer, { retry: true }),
    iam: { projectRoles: ['roles/datastore.user', 'roles/cloudtasks.enqueuer', 'roles/logging.logWriter', 'roles/serviceusage.serviceUsageConsumer'], secrets: [] },
    data: { reads: ['sys_catalog_publication_events'], writes: ['sys_catalog_publication_events', 'sys_catalog_publication'] },
    idempotence: 'document-updateTime semantic ledger plus event-hash correlation and deterministic task id', overlap: 'at-least-once/ledger-owner', blockers: []
  },
  {
    name: 'catalogReconciler', source: 'functions/src/catalog/catalogReconciler.js', owner: 'catalog-reconciler-scheduler',
    runtime: runtime(catalogBuilder, { timeoutSeconds: 540, memoryMiB: 512, retry: false }),
    iam: { projectRoles: ['roles/datastore.user', 'roles/cloudtasks.enqueuer', 'roles/logging.logWriter', 'roles/serviceusage.serviceUsageConsumer'], secrets: [], bucketRoles: ['roles/storage.objectAdmin:catalog-snapshot-bucket'] },
    data: { reads: ['sys_catalog_publication', 'catalog snapshot pointers'], writes: ['sys_catalog_publication', 'Cloud Tasks'] },
    idempotence: 'lease-state-version-and-deterministic-task-id', overlap: 'scheduler-singleton/max1', blockers: []
  },
  {
    name: 'catalogMediaGarbageCollector', source: 'functions/src/catalog/mediaGarbageCollection.js', owner: 'catalog-media-gc-scheduler',
    runtime: runtime(catalogBuilder, { timeoutSeconds: 540, memoryMiB: 512, retry: false }),
    iam: { projectRoles: ['roles/datastore.user', 'roles/logging.logWriter', 'roles/serviceusage.serviceUsageConsumer'], secrets: [], bucketRoles: ['roles/storage.objectAdmin:media-and-catalog-buckets'] },
    data: { reads: ['furniture', 'sys_catalog_media_gc', 'retained releases'], writes: ['sys_catalog_media_gc', 'eligible Storage objects only'] },
    idempotence: 'generation-precondition-plus-retained-release-fence', overlap: 'scheduler-singleton/max1', blockers: []
  },
  {
    name: 'processProductPublicationImage', source: 'functions/src/publication/productPublication.js', owner: 'publication-image-worker',
    runtime: runtime(publicationWorker, { region: 'us-central1', concurrency: 4, maxInstances: 4, memoryMiB: 1024, timeoutSeconds: 540, retry: true }),
    iam: { projectRoles: ['roles/datastore.user', 'roles/logging.logWriter', 'roles/serviceusage.serviceUsageConsumer'], secrets: [], bucketRoles: ['roles/storage.objectAdmin:product-media-bucket'] },
    data: { reads: ['publication sessions', 'source image generation'], writes: ['image variants', 'publication sessions', 'media quarantine'] },
    idempotence: 'session-generation-state-fence', overlap: 'at-least-once/generation-owner', blockers: []
  },
  ...['cleanupProductPublicationSessions', 'reconcileProductPublicationSessions'].map((name) => ({
    name, source: 'functions/src/publication/productPublication.js', owner: `${name}-scheduler`,
    runtime: runtime(publicationWorker, { timeoutSeconds: 540, memoryMiB: 512, retry: false }),
    iam: { projectRoles: ['roles/datastore.user', 'roles/logging.logWriter', 'roles/serviceusage.serviceUsageConsumer'], secrets: [], bucketRoles: ['roles/storage.objectAdmin:product-media-bucket'] },
    data: { reads: ['product_publication_sessions'], writes: ['product_publication_sessions', 'media quarantine'] },
    idempotence: 'session-state-and-expiry-preconditions', overlap: 'scheduler-singleton/max1', blockers: []
  })),
  ...['onOrderCreated', 'onOrderUpdated'].map((name) => ({
    name, source: 'functions/src/email/orderEmails.js', owner: 'legacy-order-email-ledger',
    runtime: runtime(emailWorker, { retry: true }),
    iam: { projectRoles: ['roles/datastore.user', 'roles/logging.logWriter', 'roles/serviceusage.serviceUsageConsumer'], secrets: ['GMAIL_EMAIL', 'GMAIL_PASSWORD', 'RESEND_API_KEY'] },
    data: { reads: ['orders', 'legacy_order_email_deliveries'], writes: ['legacy_order_email_deliveries', 'orders.emailProof'] },
    idempotence: 'deterministic-delivery-id-plus-claim-lease-provider-key', overlap: 'at-least-once/shared-ledger/provider-cap-two-across-targets',
    blockers: ['create purgeAt TTL policy before first delivery', 'prove no duplicate email with old event replay']
  })),
  {
    name: 'dispatchCatalogBuild', source: 'functions/src/catalog/buildCatalogSnapshot.js', owner: 'catalog-build-queue',
    runtime: runtime(catalogBuilder, { timeoutSeconds: 300, memoryMiB: 512, retryConfig: { maxAttempts: 10, minBackoffSeconds: 5, maxBackoffSeconds: 300, maxConcurrentDispatches: 1 } }),
    iam: { projectRoles: ['roles/datastore.user', 'roles/cloudtasks.enqueuer', 'roles/logging.logWriter', 'roles/serviceusage.serviceUsageConsumer'], secrets: [], bucketRoles: ['roles/storage.objectAdmin:catalog-snapshot-bucket'] },
    data: { reads: ['furniture', 'catalog control', 'snapshot pointers'], writes: ['immutable releases', 'catalog control', 'Cloud Tasks'] },
    idempotence: 'lease-cas-immutable-release', overlap: 'queue-max-concurrent-one', blockers: []
  },
  {
    name: 'dispatchCatalogRevalidation', source: 'functions/src/catalog/catalogRevalidation.js', owner: 'catalog-revalidation-queue',
    runtime: runtime(catalogBuilder, { timeoutSeconds: 300, retryConfig: { maxAttempts: 10, minBackoffSeconds: 5, maxBackoffSeconds: 300, maxConcurrentDispatches: 1 } }),
    iam: { projectRoles: ['roles/datastore.user', 'roles/logging.logWriter', 'roles/serviceusage.serviceUsageConsumer'], secrets: ['CATALOG_REVALIDATION_HMAC_SECRET'] },
    data: { reads: ['catalog control', 'impact plan', 'served catalog'], writes: ['catalog control'] },
    idempotence: 'catalog-identity-and-state-version-transaction', overlap: 'queue-max-concurrent-one', blockers: []
  },
  ...['onArtifactUpdated', 'onArtifactDeleted'].map((name) => ({
    name, source: `functions/src/triggers/${name}.js`, owner: 'catalog-media-quarantine',
    runtime: runtime(mediaEnqueuer, { timeoutSeconds: 300, retry: true }),
    iam: { projectRoles: ['roles/datastore.user', 'roles/logging.logWriter', 'roles/serviceusage.serviceUsageConsumer'], secrets: [], bucketRoles: ['roles/storage.objectViewer:product-media-bucket'] },
    data: { reads: ['artifact before/after', 'Storage generation', 'sys_catalog_media_gc'], writes: ['sys_catalog_media_gc'], forbiddenWrites: ['unrelated product subcollections', 'Storage delete'] },
    idempotence: 'media-path-hash-plus-generation-transaction', overlap: 'at-least-once/generation-owner', blockers: []
  }))
];

function main() {
  invariant(args.get('project') === PROJECT_ID, 'G2A_PLAN_PROJECT_REQUIRED');
  invariant(args.get('env') === ENVIRONMENT, 'G2A_PLAN_ENV_REQUIRED');
  invariant(args.get('apply') !== 'true', 'G2A_PLAN_READ_ONLY_LOCAL_ONLY');
  invariant(plans.length === 13 && new Set(plans.map(({ name }) => name)).size === 13, 'G2A_PLAN_TARGET_COUNT_INVALID');
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  invariant(baseline.metadata?.project === PROJECT_ID, 'G2A_PLAN_BASELINE_PROJECT_MISMATCH');
  const byName = new Map(baseline.functions.map((entry) => [entry.name, entry]));
  const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  const targets = plans.map((plan) => {
    const cloud = byName.get(plan.name);
    invariant(cloud?.cloud?.present && cloud.cloud.generation === 2, `G2A_PLAN_CLOUD_BASELINE_MISSING:${plan.name}`);
    return {
      ...plan,
      cloudBaseline: {
        revision: cloud.cloud.revision,
        runtime: cloud.cloud.runtime,
        region: cloud.cloud.region,
        runtimeServiceAccount: cloud.identities.runtimeServiceAccount,
        buildServiceAccount: cloud.identities.buildServiceAccount,
        transportServiceAccount: cloud.trigger?.transportServiceAccount || null,
        runtimeOptions: cloud.runtime,
        secrets: cloud.secrets
      },
      transport: cloud.trigger?.type === 'event'
        ? { serviceAccount: EVENTARC_SA, invoker: `serviceAccount:${EVENTARC_SA}`, filter: cloud.trigger.filter, retry: plan.runtime.retry }
        : cloud.trigger?.type === 'cloud-task'
          ? { serviceAccount: plan.name === 'dispatchCatalogBuild' ? catalogEnqueuer : catalogBuilder, invoker: 'target-only roles/run.invoker', deadlineSeconds: 300 }
          : { serviceAccount: null, invoker: 'scheduler-managed OIDC', retry: false },
      decision: 'KEEP_GEN2_STABILIZE_IN_PLACE',
      wave: 'G2-B_ONE_TARGET_AT_A_TIME',
      rollback: `Redeploy ${plan.name} only from source commit ${sourceCommit} predecessor while preserving trigger/queue/job, secrets versions, IAM and endpoint; observe one old tab and one quiet window.`
    };
  });
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: PROJECT_ID,
    environment: ENVIRONMENT,
    sourceCommit,
    mode: 'LOCAL_PLAN_FROM_READ_ONLY_G0_BASELINE',
    verdict: 'G2_A_LOCAL_COMPLETE_G2_B_BLOCKED_ON_DATA_IAM_TTL',
    deploymentAllowed: false,
    targetCount: targets.length,
    taskMeasurements30d: {
      dispatchCatalogBuild: { httpSamples: 22, p99Ms: 16180.178008, maxMs: 16180.178008 },
      dispatchCatalogRevalidation: { httpSamples: 446, p99Ms: 5666.990373, maxMs: 9359.425117 }
    },
    globalPreconditions: [
      'create and verify no-key dedicated runtime/build/transport identities with exact roles',
      'seed 26 stats ledgers and reconcile aggregates with source updateTime preconditions',
      'activate purgeAt TTL for legacy_order_email_deliveries and keep client access denied',
      'regenerate source/cloud inventory immediately before each targeted deploy',
      'deploy and observe exactly one target; scheduler/webhook/finance remain one target'
    ],
    forbidden: ['production', 'Stripe live', 'global functions deploy', 'Auth Gen1 migration', 'Instagram hold deploy', 'refund', 'financial replay', 'restock', 'data deletion'],
    targets
  };
  report.manifestDigest = crypto.createHash('sha256').update(JSON.stringify(report)).digest('hex');
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({ verdict: report.verdict, targetCount: report.targetCount, deploymentAllowed: false, output: path.relative(ROOT, OUTPUT_PATH), manifestDigest: report.manifestDigest })}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error?.message || 'G2A_PLAN_UNKNOWN_ERROR'}\n`);
  process.exitCode = 1;
}
