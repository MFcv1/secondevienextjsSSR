#!/usr/bin/env node

import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const PROJECT_ID = 'secondevienextjsssr';
const SOURCE_DATABASE = '(default)';
const RESTORE_DATABASE = 'restore-drill-20260815-a';
const OUTPUT = 'apphostingaudit/manifests/functions-gen2-g1-restore.json';
const CRITICAL_COLLECTIONS = [
  'artifacts/secondevie/public/data/furniture',
  'orders',
  'inventory_reservations',
  'commerce_outbox',
  'commerce_webhook_inbox',
  'commerce_incidents',
  'analytics_sessions',
  'analytics_admin_audit_v3',
  'analytics_business_facts_v3',
  'analytics_session_facts_v3',
  'analytics_sessions_v3',
  'analytics_rollup_days_v3',
  'analytics_rollup_months_v3',
  'analytics_page_daily',
  'analytics_transition_daily',
  'analytics_unique_markers',
  'analytics_item_daily'
];

function fail(code) {
  throw new Error(code);
}

function parseArgs(argv) {
  return new Map(argv.map((argument) => {
    if (!argument.startsWith('--')) fail(`G1_RESTORE_ARGUMENT_INVALID:${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    return [key, parts.length ? parts.join('=') : 'true'];
  }));
}

function normalize(value) {
  if (value === null || value === undefined || typeof value !== 'object') return value;
  if (Buffer.isBuffer(value)) return { bytes: value.toString('base64') };
  if (typeof value.toDate === 'function' && Number.isInteger(value.seconds)) {
    return { timestamp: `${value.seconds}:${value.nanoseconds || 0}` };
  }
  if (typeof value.path === 'string' && value.firestore) return { reference: value.path };
  if (typeof value.latitude === 'number' && typeof value.longitude === 'number') {
    return { geopoint: [value.latitude, value.longitude] };
  }
  if (Array.isArray(value)) return value.map(normalize);
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
}

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(normalize(value))).digest('hex');
}

function firestoreTimestamp(value) {
  const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?Z$/);
  if (!match) return null;
  const seconds = Math.floor(Date.parse(`${match[1]}Z`) / 1000);
  const nanoseconds = Number((match[2] || '').padEnd(9, '0'));
  return Number.isFinite(seconds) && Number.isSafeInteger(nanoseconds)
    ? new Timestamp(seconds, nanoseconds)
    : null;
}

function gcloud(args) {
  return JSON.parse(execFileSync('gcloud', [...args, `--project=${PROJECT_ID}`, '--format=json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }) || 'null');
}

async function collectionEvidence(db, collectionPath, readTime = null) {
  const query = db.collection(collectionPath);
  const snapshot = readTime
    ? await db.runTransaction((transaction) => transaction.get(query), { readOnly: true, readTime })
    : await query.get();
  const lines = snapshot.docs.map((document) => ({
    path: document.ref.path,
    data: normalize(document.data())
  })).sort((left, right) => left.path.localeCompare(right.path));
  return { count: lines.length, digest: digest(lines) };
}

async function rootCollectionNames(db) {
  return (await db.listCollections()).map((collection) => collection.id).sort();
}

async function rootEvidence(db, names, readTime = null) {
  const evidence = {};
  for (const name of names) {
    evidence[name] = await collectionEvidence(db, name, readTime);
  }
  return evidence;
}

function compareMaps(source, restored) {
  const names = [...new Set([...Object.keys(source), ...Object.keys(restored)])].sort();
  return names.map((name) => ({
    name,
    source: source[name] || null,
    restored: restored[name] || null,
    countEqual: source[name]?.count === restored[name]?.count,
    digestEqual: source[name]?.digest === restored[name]?.digest
  }));
}

function normalizedIndexes(indexes) {
  return indexes.map((index) => ({
    collectionGroup: index.name?.match(/\/collectionGroups\/([^/]+)\/indexes\//)?.[1] || null,
    density: index.density || null,
    queryScope: index.queryScope || null,
    apiScope: index.apiScope || null,
    fields: index.fields || []
  })).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

function ttlFields(ttls) {
  return ttls.map((ttl) => {
    const match = ttl.name?.match(/\/collectionGroups\/([^/]+)\/fields\/([^/]+)$/);
    return match ? `${match[1]}/${match[2]}` : 'unknown';
  }).sort();
}

async function anonymousProbe(database, documentPath) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) return { state: 'NOT_PROVED', reason: 'FIREBASE_WEB_API_KEY_MISSING' };
  const encodedPath = documentPath.split('/').map(encodeURIComponent).join('/');
  const url = new URL(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${database}/documents/${encodedPath}`);
  url.searchParams.set('key', apiKey);
  const response = await fetch(url);
  return {
    state: [401, 403].includes(response.status) ? 'DENIED' : 'UNEXPECTED',
    status: response.status
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.get('project') !== PROJECT_ID) fail('G1_RESTORE_PROJECT_INVALID');
  if ((args.get('source') || SOURCE_DATABASE) !== SOURCE_DATABASE) fail('G1_RESTORE_SOURCE_INVALID');
  if (args.get('restore') !== RESTORE_DATABASE) fail('G1_RESTORE_DESTINATION_INVALID');
  if (args.has('apply') || args.has('write') || args.has('delete')) fail('G1_RESTORE_VERIFY_READ_ONLY');
  const snapshotTimeValue = args.get('snapshot-time');
  const snapshotTimeMs = Date.parse(snapshotTimeValue || '');
  if (!Number.isFinite(snapshotTimeMs) || snapshotTimeMs > Date.now() || snapshotTimeMs < Date.now() - 7 * 86400000) {
    fail('G1_RESTORE_SNAPSHOT_TIME_INVALID');
  }
  const snapshotTime = firestoreTimestamp(snapshotTimeValue);
  if (!snapshotTime) fail('G1_RESTORE_SNAPSHOT_TIME_INVALID');

  const credential = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
    : applicationDefault();
  const app = getApps().find((entry) => entry.name === 'functions-gen2-g1-restore') || initializeApp({
    credential,
    projectId: PROJECT_ID
  }, 'functions-gen2-g1-restore');
  const sourceDb = getFirestore(app, SOURCE_DATABASE);
  const restoredDb = getFirestore(app, RESTORE_DATABASE);

  const [sourceRootNames, restoredRootNames] = await Promise.all([
    rootCollectionNames(sourceDb),
    rootCollectionNames(restoredDb)
  ]);
  const rootNames = [...new Set([...sourceRootNames, ...restoredRootNames])].sort();
  const anonymousTarget = await restoredDb.collection('artifacts/secondevie/public/data/furniture').limit(1).get();
  if (anonymousTarget.empty) fail('G1_RESTORE_ANONYMOUS_PROBE_TARGET_MISSING');
  const [sourceRoots, restoredRoots, sourceCritical, restoredCritical, anonymousAccess] = await Promise.all([
    rootEvidence(sourceDb, rootNames, snapshotTime),
    rootEvidence(restoredDb, rootNames),
    Promise.all(CRITICAL_COLLECTIONS.map((collection) => collectionEvidence(sourceDb, collection, snapshotTime))),
    Promise.all(CRITICAL_COLLECTIONS.map((collection) => collectionEvidence(restoredDb, collection))),
    anonymousProbe(RESTORE_DATABASE, anonymousTarget.docs[0].ref.path)
  ]);
  const rootComparison = compareMaps(sourceRoots, restoredRoots);
  const criticalComparison = CRITICAL_COLLECTIONS.map((name, index) => ({
    name,
    source: sourceCritical[index],
    restored: restoredCritical[index],
    countEqual: sourceCritical[index].count === restoredCritical[index].count,
    digestEqual: sourceCritical[index].digest === restoredCritical[index].digest
  }));

  const [sourceDatabase, restoredDatabase, sourceIndexes, restoredIndexes, sourceTtls, restoredTtls, iam] = [
    gcloud(['firestore', 'databases', 'describe', `--database=${SOURCE_DATABASE}`]),
    gcloud(['firestore', 'databases', 'describe', `--database=${RESTORE_DATABASE}`]),
    gcloud(['firestore', 'indexes', 'composite', 'list', `--database=${SOURCE_DATABASE}`]),
    gcloud(['firestore', 'indexes', 'composite', 'list', `--database=${RESTORE_DATABASE}`]),
    gcloud(['firestore', 'fields', 'ttls', 'list', `--database=${SOURCE_DATABASE}`]),
    gcloud(['firestore', 'fields', 'ttls', 'list', `--database=${RESTORE_DATABASE}`]),
    gcloud(['projects', 'get-iam-policy', PROJECT_ID])
  ];
  const publicIam = (iam.bindings || []).filter((binding) => (
    (binding.members || []).some((member) => member === 'allUsers' || member === 'allAuthenticatedUsers')
  )).map((binding) => binding.role);
  const sourceIndexDefinitions = normalizedIndexes(sourceIndexes);
  const restoredIndexDefinitions = normalizedIndexes(restoredIndexes);
  const sourceTtlFields = ttlFields(sourceTtls);
  const restoredTtlFields = ttlFields(restoredTtls);
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: PROJECT_ID,
    sourceDatabase: SOURCE_DATABASE,
    restoreDatabase: RESTORE_DATABASE,
    sourceInfo: restoredDatabase.sourceInfo || null,
    sourceReadTime: snapshotTimeValue,
    database: {
      sourceLocation: sourceDatabase.locationId,
      restoreLocation: restoredDatabase.locationId,
      restoreType: restoredDatabase.type,
      restoreDeleteProtection: restoredDatabase.deleteProtectionState,
      restorePitr: restoredDatabase.pointInTimeRecoveryEnablement
    },
    roots: rootComparison,
    criticalCollections: criticalComparison,
    indexes: {
      sourceCount: sourceIndexes.length,
      restoreCount: restoredIndexes.length,
      sourceDigest: digest(sourceIndexDefinitions),
      restoreDigest: digest(restoredIndexDefinitions)
    },
    ttl: {
      sourceCount: sourceTtls.length,
      restoreCount: restoredTtls.length,
      sourceFields: sourceTtlFields,
      restoreFields: restoredTtlFields,
      expectedRestoreOmission: sourceTtlFields.length === 2 && restoredTtlFields.length === 0
    },
    iam: { publicBindings: publicIam },
    anonymousAccess,
    trafficBinding: 'NONE_BY_DESIGN_SOURCE_AND_CONFIG_REVIEW_REQUIRED',
    verdict: 'PENDING'
  };
  const comparisons = [...rootComparison, ...criticalComparison];
  const allDataEqual = comparisons.every((entry) => entry.countEqual && entry.digestEqual);
  const indexesEqual = manifest.indexes.sourceCount === manifest.indexes.restoreCount &&
    manifest.indexes.sourceDigest === manifest.indexes.restoreDigest;
  manifest.verdict = allDataEqual && indexesEqual && manifest.ttl.expectedRestoreOmission && publicIam.length === 0 &&
    anonymousAccess.state === 'DENIED' && sourceDatabase.locationId === restoredDatabase.locationId
    ? 'RESTORE_DATA_PLANE_VERIFIED'
    : 'HOLD_RESTORE_RECONCILIATION';
  manifest.manifestDigest = digest(manifest);

  const output = path.resolve(args.get('output') || OUTPUT);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({
    status: 'OK',
    verdict: manifest.verdict,
    rootCollections: rootComparison.length,
    rootDrifts: rootComparison.filter((entry) => !entry.countEqual || !entry.digestEqual).map((entry) => entry.name),
    criticalDrifts: criticalComparison.filter((entry) => !entry.countEqual || !entry.digestEqual).map((entry) => entry.name),
    indexes: [manifest.indexes.sourceCount, manifest.indexes.restoreCount],
    ttl: [manifest.ttl.sourceCount, manifest.ttl.restoreCount],
    publicIamBindings: publicIam.length,
    anonymousAccess,
    output: path.relative(process.cwd(), output)
  }, null, 2)}\n`);
  if (manifest.verdict !== 'RESTORE_DATA_PLANE_VERIFIED') process.exitCode = 2;
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${JSON.stringify({ status: 'ERROR', code: String(error?.message || error) })}\n`);
  process.exitCode = 1;
}
