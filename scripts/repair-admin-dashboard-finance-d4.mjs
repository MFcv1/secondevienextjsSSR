#!/usr/bin/env node

import { createRequire } from 'node:module';
import process from 'node:process';

const requireFromFunctions = createRequire(new URL('../functions/package.json', import.meta.url));
const admin = requireFromFunctions('firebase-admin');
const { buildFinanceProjection } = requireFromFunctions('./src/admin/dashboardProjection');
const PROJECT = 'secondevienextjsssr';
const APPROVAL = 'D4_REPAIR_FINANCE_COUNTERS_SANDBOX';
const args = new Map(process.argv.slice(2).map((token) => {
  const [key, ...value] = token.replace(/^--/, '').split('=');
  return [key, value.join('=')];
}));

function invariant(value, code) {
  if (!value) throw new Error(code);
}

async function main() {
  invariant(args.get('project') === PROJECT && args.get('env') === 'sandbox', 'D4_FINANCE_TARGET_INVALID');
  invariant(args.get('approval') === APPROVAL, 'D4_FINANCE_APPROVAL_REQUIRED');
  const credential = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || 'null');
  invariant(credential?.project_id === PROJECT, 'D4_FINANCE_CREDENTIAL_INVALID');
  admin.initializeApp({ credential: admin.credential.cert(credential), projectId: PROJECT });
  const db = admin.firestore();
  const facts = await db.collection('commerce_financial_facts').get();
  const counters = { captureCount: 0, refundCount: 0, refundReversalCount: 0 };
  const amounts = { capturedCents: 0, refundedCents: 0, netCents: 0, factCount: 0 };
  const capturedOrders = new Set();
  const captureFactIds = [];
  for (const document of facts.docs) {
    const fact = document.data();
    invariant(['capture', 'refund', 'refund_reversal'].includes(fact.type), 'D4_FINANCE_FACT_TYPE_INVALID');
    if (fact.type === 'capture') {
      counters.captureCount += 1;
      captureFactIds.push(document.id);
      amounts.capturedCents += fact.amountCents;
      capturedOrders.add(String(fact.orderId || document.id));
    } else if (fact.type === 'refund') {
      counters.refundCount += 1;
      amounts.refundedCents += fact.amountCents;
    } else {
      counters.refundReversalCount += 1;
      amounts.refundedCents -= fact.amountCents;
    }
    amounts.factCount += 1;
  }
  amounts.netCents = amounts.capturedCents - amounts.refundedCents;
  const capturedOrderCount = capturedOrders.size;
  const totalRef = db.doc('commerce_financial_totals/EUR');
  const projectionRef = db.doc('admin_dashboard/finance');
  await db.runTransaction(async (transaction) => {
    const [total, projection] = await Promise.all([
      transaction.get(totalRef), transaction.get(projectionRef)
    ]);
    invariant(total.exists && projection.exists, 'D4_FINANCE_BASELINE_MISSING');
    for (const key of Object.keys(amounts)) {
      invariant(Number(total.data()?.[key] || 0) === amounts[key], `D4_FINANCE_SOURCE_DRIFT:${key}`);
    }
    const sourceUpdateTime = admin.firestore.Timestamp.now();
    transaction.set(totalRef, {
      schemaVersion: 2,
      ...counters,
      capturedOrderCount,
      updatedAt: sourceUpdateTime
    }, { merge: true });
    transaction.set(projectionRef, buildFinanceProjection({
      ...total.data(), ...amounts, ...counters, capturedOrderCount, currency: 'EUR'
    }, {
      sourceUpdateTime,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      revision: Number(projection.data()?.revision || 0) + 1
    }));
  });
  for (let index = 0; index < captureFactIds.length; index += 400) {
    const batch = db.batch();
    for (const factId of captureFactIds.slice(index, index + 400)) {
      batch.set(db.doc(`admin_finance_capture_projections/${factId}`), {
        schemaVersion: 1,
        factId,
        sourceUpdateTime: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        bootstrap: true
      }, { merge: true });
    }
    await batch.commit();
  }
  process.stdout.write(`${JSON.stringify({
    ok: true,
    project: PROJECT,
    factCount: amounts.factCount,
    capturedOrderCount,
    ...counters,
    amounts
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.message || 'D4_FINANCE_REPAIR_FAILED'}\n`);
  process.exitCode = 1;
});
