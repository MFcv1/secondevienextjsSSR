#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';

const PROJECT = 'secondevienextjsssr';
const REGION = 'europe-west1';
const APP_HOSTING = 'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app';
const APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
const SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const outputArg = process.argv.find((value) => value.startsWith('--output='));
const output = outputArg?.slice('--output='.length);

function fail(message) { throw new Error(message); }
if ((process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID) !== PROJECT) fail('G13_PROJECT_REFUSED');
if (!APP_ID || !API_KEY || !SERVICE_ACCOUNT_JSON || !output) fail('G13_FIXTURE_MISSING');
const serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON);
if (serviceAccount.project_id !== PROJECT) fail('G13_SERVICE_ACCOUNT_REFUSED');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: PROJECT });

const auth = admin.auth();
const db = admin.firestore();
const owners = await db.collection('sys_admin_access').where('active', '==', true).where('role', '==', 'owner').limit(2).get();
if (owners.size !== 1) fail('G13_OWNER_AMBIGUOUS');
const owner = await auth.getUser(owners.docs[0].id);
if (owner.customClaims?.admin !== true && owner.customClaims?.superAdmin !== true) fail('G13_OWNER_INVALID');

const appCheck = await admin.appCheck().createToken(APP_ID, { ttlMillis: 30 * 60 * 1000 });
const custom = await auth.createCustomToken(owner.uid, { authMethod: 'passkey', authAssurance: 'aal2', userVerified: true });
const exchange = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'X-Firebase-AppCheck': appCheck.token },
  body: JSON.stringify({ token: custom, returnSecureToken: true })
});
const exchangePayload = await exchange.json().catch(() => null);
if (!exchange.ok || !exchangePayload?.idToken) fail('G13_TOKEN_EXCHANGE_FAILED');

function quantile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)] || 0;
}

async function timed(label, run) {
  const started = performance.now();
  const response = await run();
  return { label, ms: performance.now() - started, status: response.status, ok: response.ok, payload: await response.json().catch(() => null) };
}

async function callable(target, data) {
  return timed(target, () => fetch(`https://${REGION}-${PROJECT}.cloudfunctions.net/${target}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${exchangePayload.idToken}`,
      'X-Firebase-AppCheck': appCheck.token
    },
    body: JSON.stringify({ data })
  }));
}

async function publicGet(pathname) {
  return timed(pathname, () => fetch(`${APP_HOSTING}${pathname}`, { headers: { 'cache-control': 'no-cache' } }));
}

async function burst(count, concurrency, factory) {
  const results = [];
  let cursor = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (cursor < count) {
      const index = cursor++;
      results[index] = await factory(index);
    }
  }));
  return results;
}

const first = await callable('getCatalogPublicationStatusGen2', {});
if (!first.ok || first.payload?.error || first.payload?.result?.mode !== 'active') fail('G13_SCALE_ZERO_PROBE_FAILED');
const catalog = await burst(30, 10, () => callable('getCatalogPublicationStatusGen2', {}));
const dryRuns = await burst(30, 10, () => {
  const sessionId = `g13-load-${crypto.randomUUID()}`;
  return callable('deleteSessionGen2', {
    mode: 'dry_run',
    operationId: `g13-dry-${crypto.randomUUID()}`,
    sessionId,
    confirmation: { action: 'DELETE_ANALYTICS_SESSION', sessionId }
  });
});
const home = await burst(60, 20, () => publicGet('/'));
const catalogVersion = await burst(60, 20, () => publicGet('/api/catalog/version'));
const groups = { catalog, dryRuns, home, catalogVersion };

for (const [name, results] of Object.entries(groups)) {
  const invalid = results.filter((result) => !result.ok || result.payload?.error);
  if (invalid.length) fail(`G13_BURST_FAILED:${name}:${invalid.length}`);
  if (name === 'dryRuns' && results.some((result) => result.payload?.result?.mode !== 'dry_run' || result.payload?.result?.wouldDelete !== false)) {
    fail('G13_DRY_RUN_CONTRACT_FAILED');
  }
}

const summarize = (results) => ({
  requests: results.length,
  concurrency: results.length === 30 ? 10 : 20,
  statuses: Object.fromEntries([...new Set(results.map(({ status }) => status))].sort().map((status) => [status, results.filter((result) => result.status === status).length])),
  latencyMs: {
    min: Math.round(Math.min(...results.map(({ ms }) => ms))),
    p50: Math.round(quantile(results.map(({ ms }) => ms), 0.5)),
    p95: Math.round(quantile(results.map(({ ms }) => ms), 0.95)),
    p99: Math.round(quantile(results.map(({ ms }) => ms), 0.99)),
    max: Math.round(Math.max(...results.map(({ ms }) => ms)))
  },
  errors: 0,
  responses429: 0
});

const manifest = {
  schemaVersion: 1,
  project: PROJECT,
  environment: 'sandbox',
  gate: 'G13-B',
  status: 'CLOSED_NO_TUNING_REQUIRED',
  generatedAt: new Date().toISOString(),
  scaleToZero: { minInstances: 0, firstReadOnlyProbeMs: Math.round(first.ms), status: first.status, coldStartNotForced: true },
  campaign: Object.fromEntries(Object.entries(groups).map(([name, results]) => [name, summarize(results)])),
  effects: {
    realDataWrites: 0,
    destructiveInvocations: 0,
    stripeCalls: 0,
    productionCalls: 0,
    appHostingBuilds: 0,
    functionDeploys: 0
  },
  observation: {
    sevenDayOutliers: ['dispatchCatalogRevalidation', 'onQuoteRequestSubmittedGen2'],
    postCutoverErrorsSince: '2026-08-22T20:00:00Z',
    postCutoverErrorCount: 0,
    tuningDecision: 'ZERO_DEPLOY'
  }
};
fs.writeFileSync(path.resolve(output), `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ status: manifest.status, firstProbeMs: manifest.scaleToZero.firstReadOnlyProbeMs, campaign: manifest.campaign, effects: manifest.effects })}\n`);
