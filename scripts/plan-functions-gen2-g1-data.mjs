#!/usr/bin/env node

import crypto from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const DEFAULT_OUTPUT = 'apphostingaudit/manifests/functions-gen2-g1-data-plan.json';
const FURNITURE_COLLECTION = 'artifacts/secondevie/public/data/furniture';
const ANALYTICS_COLLECTIONS = [
  ['analytics_sessions', 'ACTIVE_CURRENT_ENGINE'],
  ['analytics_admin_audit_v3', 'HISTORICAL_RESIDUAL'],
  ['analytics_business_facts_v3', 'HISTORICAL'],
  ['analytics_session_facts_v3', 'HISTORICAL'],
  ['analytics_sessions_v3', 'HISTORICAL_RESIDUAL'],
  ['analytics_rollup_days_v3', 'HISTORICAL'],
  ['analytics_rollup_months_v3', 'HISTORICAL_EMPTY_EXPECTED'],
  ['analytics_page_daily', 'HISTORICAL'],
  ['analytics_transition_daily', 'HISTORICAL'],
  ['analytics_unique_markers', 'HISTORICAL'],
  ['analytics_item_daily', 'LEGACY_ROLLUP_PRODUCER_UNPROVEN']
];

function fail(code) {
  throw new Error(code);
}

function parseArgs(argv) {
  return new Map(argv.map((argument) => {
    if (!argument.startsWith('--')) fail(`G1_DATA_ARGUMENT_INVALID:${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    return [key, parts.length ? parts.join('=') : 'true'];
  }));
}

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function iso(value) {
  return value?.toDate ? value.toDate().toISOString() : null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const project = args.get('project');
  const environment = args.get('env') || ENVIRONMENT;
  if (project !== PROJECT_ID || environment !== ENVIRONMENT) fail('G1_DATA_TARGET_INVALID');
  if (args.has('commit') || args.has('apply') || args.has('write')) fail('G1_DATA_READ_ONLY');

  const credential = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
    : applicationDefault();
  const app = getApps().find((entry) => entry.name === 'functions-gen2-g1-data-plan') || initializeApp({
    credential,
    projectId: project
  }, 'functions-gen2-g1-data-plan');
  const db = getFirestore(app);

  const [furnitureSnapshot, ...analyticsSnapshots] = await Promise.all([
    db.collection(FURNITURE_COLLECTION)
      .select('inventoryVersion', 'stock', 'status', 'sold')
      .get(),
    ...ANALYTICS_COLLECTIONS.map(([collection]) => db.collection(collection).get())
  ]);

  const inventoryCandidates = furnitureSnapshot.docs
    .filter((document) => !Number.isSafeInteger(document.data().inventoryVersion))
    .map((document) => {
      const data = document.data();
      const evidence = {
        id: document.id,
        updateTime: iso(document.updateTime),
        stock: data.stock ?? null,
        status: data.status ?? null,
        sold: data.sold === true
      };
      const stockValid = Number.isSafeInteger(data.stock) && data.stock >= 0;
      return {
        ...evidence,
        evidenceHash: digest(evidence),
        proposedInventoryVersion: stockValid ? 0 : null,
        classification: stockValid ? 'READY_AFTER_BACKUP_AND_APPROVAL' : 'REFUSE_INVALID_OR_AMBIGUOUS_STOCK',
        writePrecondition: {
          lastUpdateTime: evidence.updateTime,
          inventoryVersionStillMissing: true
        },
        rollbackPrecondition: {
          lastUpdateTimeMustEqualBackfillResult: true,
          inventoryVersionMustEqual: 0
        }
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));

  const analytics = analyticsSnapshots.map((snapshot, index) => {
    const [collection, classification] = ANALYTICS_COLLECTIONS[index];
    const documentEvidence = snapshot.docs.map((document) => ({
      id: document.id,
      updateTime: iso(document.updateTime)
    })).sort((left, right) => left.id.localeCompare(right.id));
    return {
      collection,
      classification,
      count: snapshot.size,
      identityDigest: digest(documentEvidence),
      exportState: 'MANIFEST_ONLY_NO_DOCUMENT_PAYLOAD',
      purgeState: 'FORBIDDEN_BEFORE_POST_CUTOVER_APPROVAL'
    };
  });

  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project,
    environment,
    mode: 'READ_ONLY_PLAN',
    inventoryVersion: {
      collection: FURNITURE_COLLECTION,
      totalFurniture: furnitureSnapshot.size,
      missingCount: inventoryCandidates.length,
      readyCount: inventoryCandidates.filter((candidate) => candidate.proposedInventoryVersion === 0).length,
      refusedCount: inventoryCandidates.filter((candidate) => candidate.proposedInventoryVersion === null).length,
      proposedValue: 0,
      executionState: 'NOT_EXECUTED',
      requiredBeforeWrite: [
        'BACKUP_READY',
        'RESTORE_DRILL_PASSED',
        'EXPLICIT_G8_APPROVAL',
        'BOUNDED_ADMIN_WINDOW',
        'LAST_UPDATE_TIME_PRECONDITION'
      ],
      candidates: inventoryCandidates
    },
    analytics: {
      documentPayloadExported: false,
      rationale: 'G1 classifies and hashes identities only; no purge is planned and document payload may contain personal data.',
      requiredBeforeAnyPurge: [
        'MANAGED_EXPORT_READY',
        'DATA_ACCESS_ANALYSIS',
        'PRODUCERS_CLOSED',
        'QUARANTINE_WINDOW',
        'EXACT_LIST_APPROVED',
        'IMPORT_ROLLBACK_PROVED'
      ],
      collections: analytics
    }
  };
  manifest.manifestDigest = digest({
    project: manifest.project,
    environment: manifest.environment,
    inventoryVersion: manifest.inventoryVersion,
    analytics: manifest.analytics
  });

  const output = path.resolve(args.get('output') || DEFAULT_OUTPUT);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({
    status: 'OK',
    project,
    environment,
    inventoryMissing: inventoryCandidates.length,
    inventoryReady: manifest.inventoryVersion.readyCount,
    inventoryRefused: manifest.inventoryVersion.refusedCount,
    analyticsCounts: Object.fromEntries(analytics.map((entry) => [entry.collection, entry.count])),
    manifestDigest: manifest.manifestDigest,
    output: path.relative(process.cwd(), output)
  }, null, 2)}\n`);
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${JSON.stringify({ status: 'ERROR', code: String(error?.message || error) })}\n`);
  process.exitCode = 1;
}
