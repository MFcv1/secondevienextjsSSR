// Explicit sandbox qualification: at most three overwritten operational cache
// documents. No orders, users, stock, logs or function configuration is changed.
import { applicationDefault, cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { readCachedFunctionMetrics } from '../src/lib/server/functionMetricsCache.mjs';

if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'secondevienextjsssr') throw new Error('Sandbox requis');
let credential = applicationDefault();
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) credential = cert({ projectId: 'secondevienextjsssr', clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') });
const db = getFirestore(initializeApp({ projectId: 'secondevienextjsssr', credential }));
let collections = 0;
const options = { db, getToken: async () => { collections++; return (await applicationDefault().getAccessToken()).access_token; } };
const results = [];
await mkdir('logs/function-metrics', { recursive: true });
for (const period of ['24h', '7d', '30d']) {
  const first = await readCachedFunctionMetrics(period, options);
  const before = collections;
  const second = await readCachedFunctionMetrics(period, options);
  assert.equal(collections, before);
  assert.deepEqual(first.rows, second.rows);
  assert.equal(second.cached, true);
  await writeFile(`logs/function-metrics/cache-${period}.json`, JSON.stringify(first, null, 2));
  results.push({ period, inventory: first.rows.length, calls: first.rows.reduce((sum, row) => sum + (row.calls || 0), 0), fetchedAt: first.fetchedAt, cachedRepeat: true, additionalMonitoringCallsOnRepeat: 0 });
}
await writeFile('logs/function-metrics/cache-verification.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
