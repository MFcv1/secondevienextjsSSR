import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const requireFromFunctions = createRequire(
  new URL('../functions/package.json', import.meta.url)
);
const admin = requireFromFunctions('firebase-admin');

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const args = new Map(process.argv.slice(2).map((value) => {
  if (!value.startsWith('--')) throw new Error(`G2A_STATS_ARGUMENT_INVALID:${value}`);
  const [key, ...rest] = value.slice(2).split('=');
  return [key, rest.length ? rest.join('=') : 'true'];
}));

function invariant(condition, code) {
  if (!condition) throw new Error(code);
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function addSummary(target, source) {
  for (const [key, value] of Object.entries(source)) {
    target[key] = Number(target[key] || 0) + Number(value || 0);
  }
  return target;
}

function diff(actual, expected) {
  const keys = new Set([...Object.keys(actual || {}), ...Object.keys(expected || {})]);
  return Object.fromEntries([...keys].sort().map((key) => [
    key,
    Number(actual?.[key] || 0) - Number(expected?.[key] || 0)
  ]).filter(([, value]) => value !== 0));
}

function statsOnly(value, metricKeys) {
  return Object.fromEntries(metricKeys.map((key) => [key, Number(value?.[key] || 0)]));
}

async function main() {
  invariant(args.get('project') === PROJECT_ID, 'G2A_STATS_PROJECT_REQUIRED');
  invariant(args.get('env') === ENVIRONMENT, 'G2A_STATS_ENV_REQUIRED');
  invariant(args.get('apply') !== 'true', 'G2A_STATS_READ_ONLY_ONLY');
  invariant(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'G2A_STATS_CREDENTIAL_MISSING');
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  invariant(serviceAccount.project_id === PROJECT_ID, 'G2A_STATS_CREDENTIAL_PROJECT_MISMATCH');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID
  });
  const {
    METRIC_KEYS,
    ORDER_STATS_RUNTIME_SERVICE_ACCOUNT,
    summarizeOrder
  } = requireFromFunctions('./src/commerce/orderStats');
  const {
    getDateKeyFromTimestamp
  } = requireFromFunctions('./src/analytics/constants');
  const db = admin.firestore();

  const [ordersSnapshot, dashboardSnapshot] = await Promise.all([
    db.collection('orders').get(),
    db.doc('dashboard_stats/commerce').get()
  ]);
  const legacyOrders = ordersSnapshot.docs.filter((document) =>
    Number(document.data()?.schemaVersion || 0) < 2);
  const projectionRefs = legacyOrders.map((document) =>
    db.doc(`order_stats_projections/${document.id}`));
  const projectionSnapshots = projectionRefs.length
    ? await db.getAll(...projectionRefs)
    : [];
  const expectedDashboard = {};
  const expectedDaily = new Map();
  const lines = legacyOrders.map((document, index) => {
    const value = document.data();
    const summary = summarizeOrder(value);
    const dateKey = getDateKeyFromTimestamp(value.createdAt);
    addSummary(expectedDashboard, summary);
    addSummary(expectedDaily.get(dateKey) || expectedDaily.set(dateKey, {}).get(dateKey), summary);
    return {
      orderIdHash: hash(document.id),
      sourceUpdateTime: document.updateTime.toDate().toISOString(),
      sourceHash: hash(JSON.stringify(value)),
      dateKey,
      summary,
      projectionExists: projectionSnapshots[index]?.exists === true,
      projectionUpdateTime: projectionSnapshots[index]?.exists
        ? projectionSnapshots[index].updateTime.toDate().toISOString()
        : null
    };
  }).sort((left, right) => left.orderIdHash.localeCompare(right.orderIdHash));
  const dailySnapshots = expectedDaily.size
    ? await db.getAll(...[...expectedDaily.keys()].sort().map((dateKey) =>
      db.doc(`sales_stats_daily/${dateKey}`)))
    : [];
  const dailyReconciliation = [...expectedDaily.keys()].sort().map((dateKey, index) => {
    const expected = statsOnly(expectedDaily.get(dateKey), METRIC_KEYS);
    const actual = statsOnly(dailySnapshots[index]?.data(), METRIC_KEYS);
    return {
      dateKey,
      exists: dailySnapshots[index]?.exists === true,
      expected,
      actual,
      deltaActualMinusExpected: diff(actual, expected)
    };
  });
  const actualDashboard = statsOnly(dashboardSnapshot.data(), METRIC_KEYS);
  const normalizedExpectedDashboard = statsOnly(expectedDashboard, METRIC_KEYS);
  const missingProjectionCount = lines.filter((line) => !line.projectionExists).length;
  const dashboardDrift = diff(actualDashboard, normalizedExpectedDashboard);
  const dailyDriftCount = dailyReconciliation.filter((entry) =>
    Object.keys(entry.deltaActualMinusExpected).length > 0).length;

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: PROJECT_ID,
    environment: ENVIRONMENT,
    mode: 'read-only',
    verdict: missingProjectionCount > 0 || Object.keys(dashboardDrift).length > 0 ||
      dailyDriftCount > 0
      ? 'G2_A_STATS_BOOTSTRAP_REQUIRED'
      : 'G2_A_STATS_BASELINE_READY',
    deploymentAllowed: false,
    sourceOrders: ordersSnapshot.size,
    legacyOrders: legacyOrders.length,
    ledger: {
      collection: 'order_stats_projections',
      existing: lines.length - missingProjectionCount,
      missing: missingProjectionCount,
      retention: 'same-as-order',
      clientAccess: false
    },
    runtimeTarget: {
      generation: 2,
      region: 'europe-west1',
      cpu: 1,
      concurrency: 1,
      minInstances: 0,
      maxInstances: 1,
      memoryMiB: 256,
      timeoutSeconds: 60,
      retry: true,
      runtimeServiceAccount: ORDER_STATS_RUNTIME_SERVICE_ACCOUNT
    },
    reconciliation: {
      dashboard: {
        exists: dashboardSnapshot.exists,
        expected: normalizedExpectedDashboard,
        actual: actualDashboard,
        deltaActualMinusExpected: dashboardDrift
      },
      dailyDriftCount,
      daily: dailyReconciliation
    },
    lines,
    nextGate: 'Create the dedicated no-key runtime SA and seed every missing ledger in one bounded preconditioned G2-B bootstrap only after approval; reconcile aggregates before deploying onOrderStatsWrite.',
    rollback: 'Before Function deploy, restore aggregate snapshots and remove only ledger documents created by the approved bootstrap with exact updateTime preconditions; requires destructive approval. After deploy, targeted redeploy of the previous onOrderStatsWrite source while preserving IAM and trigger.'
  };
  if (args.get('report')) {
    const reportPath = path.resolve(args.get('report'));
    await mkdir(path.dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.message || 'G2A_STATS_UNKNOWN_ERROR'}\n`);
  process.exitCode = 1;
});
