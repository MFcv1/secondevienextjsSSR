#!/usr/bin/env node

import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const requireFromFunctions = createRequire(
  new URL('../functions/package.json', import.meta.url)
);
const admin = requireFromFunctions('firebase-admin');

export const PROJECT_ID = 'secondevienextjsssr';
export const ENVIRONMENT = 'sandbox';
export const EXPECTED_LEGACY_ORDERS = 26;
export const APPLY_APPROVAL = 'G2B_SEED_26_ORDER_STATS_LEDGERS';
const DEFAULT_REPORT = 'logs/functions-gen2/g2b-stats-bootstrap.json';

function invariant(condition, code) {
  if (!condition) throw new Error(code);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function parseArgs(argv) {
  const parsed = new Map();
  for (const token of argv) {
    invariant(token.startsWith('--') && token.includes('='), `G2B_STATS_ARGUMENT_INVALID:${token}`);
    const [key, ...rest] = token.slice(2).split('=');
    invariant(key && rest.length && !parsed.has(key), `G2B_STATS_ARGUMENT_INVALID:${token}`);
    parsed.set(key, rest.join('='));
  }
  return parsed;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function currentCommit(rootDir) {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  invariant(result.status === 0, 'G2B_STATS_GIT_HEAD_UNAVAILABLE');
  return result.stdout.trim();
}

function statsManifestIsSafe(manifest) {
  return manifest?.project === PROJECT_ID &&
    manifest?.environment === ENVIRONMENT &&
    manifest?.mode === 'read-only' &&
    manifest?.verdict === 'G2_A_STATS_BOOTSTRAP_REQUIRED' &&
    manifest?.deploymentAllowed === false &&
    manifest?.legacyOrders === EXPECTED_LEGACY_ORDERS &&
    manifest?.ledger?.existing === 0 &&
    manifest?.ledger?.missing === EXPECTED_LEGACY_ORDERS &&
    Array.isArray(manifest?.lines) &&
    manifest.lines.length === EXPECTED_LEGACY_ORDERS &&
    manifest.lines.every((line) => line.projectionExists === false) &&
    Object.keys(manifest?.reconciliation?.dashboard?.deltaActualMinusExpected || {}).length === 0 &&
    manifest?.reconciliation?.dailyDriftCount === 0 &&
    (manifest?.reconciliation?.daily || []).every((line) =>
      Object.keys(line?.deltaActualMinusExpected || {}).length === 0);
}

function lineForOrder(document, summarizeOrder, getDateKeyFromTimestamp) {
  const value = document.data();
  return {
    orderIdHash: sha256(document.id),
    sourceUpdateTime: document.updateTime.toDate().toISOString(),
    sourceHash: sha256(JSON.stringify(value)),
    dateKey: getDateKeyFromTimestamp(value.createdAt),
    summary: summarizeOrder(value),
    projectionExists: false,
    projectionUpdateTime: null
  };
}

function compareLines(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function initializeAdmin() {
  invariant(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'G2B_STATS_CREDENTIAL_MISSING');
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  invariant(serviceAccount.project_id === PROJECT_ID, 'G2B_STATS_CREDENTIAL_PROJECT_MISMATCH');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: PROJECT_ID
    });
  }
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const apply = args.get('apply') === 'true';
  invariant(args.get('project') === PROJECT_ID, 'G2B_STATS_PROJECT_REQUIRED');
  invariant(args.get('env') === ENVIRONMENT, 'G2B_STATS_ENV_REQUIRED');
  invariant(args.get('commit') === currentCommit(rootDir), 'G2B_STATS_COMMIT_MISMATCH');
  invariant(/^[0-9a-f]{64}$/.test(args.get('manifest-sha256') || ''), 'G2B_STATS_MANIFEST_DIGEST_REQUIRED');
  invariant(args.get('actor') && args.get('actor').length <= 160, 'G2B_STATS_ACTOR_REQUIRED');
  if (apply) invariant(args.get('approval') === APPLY_APPROVAL, 'G2B_STATS_APPLY_APPROVAL_REQUIRED');
  else invariant(!args.has('approval'), 'G2B_STATS_APPROVAL_WITHOUT_APPLY');

  const manifestPath = path.resolve(rootDir, args.get('manifest') || '');
  invariant(manifestPath.startsWith(`${rootDir}${path.sep}`), 'G2B_STATS_MANIFEST_OUTSIDE_REPOSITORY');
  invariant(fs.existsSync(manifestPath), 'G2B_STATS_MANIFEST_MISSING');
  const manifestBytes = fs.readFileSync(manifestPath);
  invariant(sha256(manifestBytes) === args.get('manifest-sha256'), 'G2B_STATS_MANIFEST_DIGEST_MISMATCH');
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  invariant(statsManifestIsSafe(manifest), 'G2B_STATS_MANIFEST_NOT_SAFE');

  initializeAdmin();
  const { summarizeOrder } = requireFromFunctions('./src/commerce/orderStats');
  const { getDateKeyFromTimestamp } = requireFromFunctions('./src/analytics/constants');
  const db = admin.firestore();
  const expectedLines = [...manifest.lines].sort((left, right) =>
    left.orderIdHash.localeCompare(right.orderIdHash));

  const execute = async (transaction) => {
    const ordersSnapshot = await transaction.get(db.collection('orders'));
    const legacyOrders = ordersSnapshot.docs.filter((document) =>
      Number(document.data()?.schemaVersion || 0) < 2);
    invariant(ordersSnapshot.size === manifest.sourceOrders, 'G2B_STATS_SOURCE_ORDER_COUNT_DRIFT');
    invariant(legacyOrders.length === EXPECTED_LEGACY_ORDERS, 'G2B_STATS_LEGACY_ORDER_COUNT_DRIFT');

    const projectionRefs = legacyOrders.map((document) =>
      db.doc(`order_stats_projections/${document.id}`));
    const projectionSnapshots = await transaction.getAll(...projectionRefs);
    invariant(projectionSnapshots.every((snapshot) => !snapshot.exists), 'G2B_STATS_LEDGER_ALREADY_EXISTS');

    const currentLines = legacyOrders.map((document) =>
      lineForOrder(document, summarizeOrder, getDateKeyFromTimestamp))
      .sort((left, right) => left.orderIdHash.localeCompare(right.orderIdHash));
    invariant(compareLines(currentLines, expectedLines), 'G2B_STATS_SOURCE_PRECONDITION_DRIFT');

    if (apply) {
      for (let index = 0; index < legacyOrders.length; index += 1) {
        const document = legacyOrders[index];
        const line = lineForOrder(document, summarizeOrder, getDateKeyFromTimestamp);
        transaction.create(db.doc(`order_stats_projections/${document.id}`), {
          schemaVersion: 1,
          orderId: document.id,
          sourceUpdateTime: document.updateTime.toMillis(),
          dateKey: line.dateKey,
          summary: line.summary,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          bootstrap: {
            schemaVersion: 1,
            actor: args.get('actor'),
            commit: args.get('commit'),
            manifestDigest: args.get('manifest-sha256')
          }
        });
      }
    }
    return {
      lines: currentLines,
      orderIds: legacyOrders.map((document) => document.id)
    };
  };

  const transactionResult = apply
    ? await db.runTransaction(execute, { maxAttempts: 1 })
    : await db.runTransaction(execute, { readOnly: true });
  const projectionSnapshots = apply
    ? await db.getAll(...transactionResult.orderIds.map((orderId) =>
      db.doc(`order_stats_projections/${orderId}`)))
    : [];
  invariant(!apply || projectionSnapshots.every((snapshot) => snapshot.exists),
    'G2B_STATS_POST_APPLY_LEDGER_MISSING');
  const projections = projectionSnapshots.map((snapshot) => ({
    orderIdHash: sha256(snapshot.id),
    updateTime: {
      seconds: String(snapshot.updateTime.seconds),
      nanoseconds: snapshot.updateTime.nanoseconds
    },
    sourceUpdateTime: snapshot.data().sourceUpdateTime,
    manifestDigest: snapshot.data()?.bootstrap?.manifestDigest || null
  })).sort((left, right) => left.orderIdHash.localeCompare(right.orderIdHash));
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: PROJECT_ID,
    environment: ENVIRONMENT,
    mode: apply ? 'apply' : 'dry-run',
    verdict: apply ? 'G2B_STATS_BOOTSTRAP_APPLIED' : 'G2B_STATS_BOOTSTRAP_READY',
    actor: args.get('actor'),
    commit: args.get('commit'),
    manifest: path.relative(rootDir, manifestPath),
    manifestDigest: args.get('manifest-sha256'),
    writes: apply ? EXPECTED_LEGACY_ORDERS : 0,
    collectionsWritten: apply ? ['order_stats_projections'] : [],
    orderIdHashes: transactionResult.lines.map((line) => line.orderIdHash),
    projections,
    rollback: {
      action: 'delete only the 26 order_stats_projections matched by these hashes',
      preconditions: 'separate destructive approval, backup READY, source hash match, projection bootstrap manifestDigest match, exact projection updateTime manifest, dry-run',
      automatic: false
    }
  };
  const reportPath = path.resolve(rootDir, args.get('report') || DEFAULT_REPORT);
  invariant(reportPath.startsWith(`${rootDir}${path.sep}`), 'G2B_STATS_REPORT_OUTSIDE_REPOSITORY');
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`${error?.message || 'G2B_STATS_UNKNOWN_ERROR'}\n`);
    process.exitCode = 1;
  });
}
