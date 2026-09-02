#!/usr/bin/env node

import { createRequire } from 'node:module';
import process from 'node:process';

const requireFromFunctions = createRequire(new URL('../functions/package.json', import.meta.url));
const admin = requireFromFunctions('firebase-admin');
const { diffOrderSummaries, validateOrderPartition, ZERO_ORDER_SUMMARY } =
  requireFromFunctions('./src/admin/dashboardProjection');
const PROJECT = 'secondevienextjsssr';
const APPROVAL = 'D4_PROBE_ADMIN_DASHBOARD_SANDBOX';
const args = new Map(process.argv.slice(2).map((token) => {
  const [key, ...value] = token.replace(/^--/, '').split('=');
  return [key, value.join('=')];
}));

function invariant(value, code) {
  if (!value) throw new Error(code);
}

async function waitFor(read, accept, code, attempts = 40) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const value = await read();
    if (accept(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(code);
}

async function repairInterruptedProbes(db) {
  const ledgers = await db.collection('order_stats_projections').get();
  const candidates = ledgers.docs.filter((doc) =>
    doc.id.startsWith('fixture_dashboard_d4_') && doc.data()?.deleted !== true);
  for (const ledger of candidates) {
    const orderRef = db.doc(`orders/${ledger.id}`);
    const order = await orderRef.get();
    invariant(!order.exists, 'D4_STALE_PROBE_SOURCE_STILL_EXISTS');
    await db.runTransaction(async (transaction) => {
      const [currentLedger, summarySnapshot] = await Promise.all([
        transaction.get(ledger.ref),
        transaction.get(db.doc('admin_dashboard/orders'))
      ]);
      if (!currentLedger.exists || currentLedger.data()?.deleted === true) return;
      const delta = diffOrderSummaries(ZERO_ORDER_SUMMARY, currentLedger.data()?.adminSummary);
      const current = summarySnapshot.data();
      const absolute = validateOrderPartition(Object.fromEntries(
        ['totalOrders', 'paidOrders', 'shippedOrders', 'pendingOrders', 'cancelledOrders']
          .map((key) => [key, Number(current[key] || 0) + Number(delta[key] || 0)])
      ));
      transaction.set(summarySnapshot.ref, {
        ...current,
        ...absolute,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        revision: Number(current.revision || 0) + 1
      });
      transaction.set(currentLedger.ref, {
        deleted: true,
        adminSummary: ZERO_ORDER_SUMMARY,
        sourceUpdateTime: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        repair: 'd4_interrupted_probe'
      }, { merge: true });
    });
  }
  const incidentLedgers = await db.collection('admin_incident_projections').get();
  const incidentCandidates = incidentLedgers.docs.filter((doc) =>
    doc.id.startsWith('fixture-dashboard-d4-') && doc.data()?.deleted !== true);
  for (const ledger of incidentCandidates) {
    const incident = await db.doc(`commerce_incidents/${ledger.id}`).get();
    invariant(!incident.exists, 'D4_STALE_INCIDENT_PROBE_SOURCE_STILL_EXISTS');
    invariant(ledger.data()?.active !== true, 'D4_STALE_INCIDENT_PROBE_STILL_ACTIVE');
    await ledger.ref.set({
      deleted: true,
      sourceUpdateTime: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      repair: 'd4_interrupted_probe'
    }, { merge: true });
  }
  return candidates.length + incidentCandidates.length;
}

async function main() {
  invariant(args.get('project') === PROJECT && args.get('env') === 'sandbox', 'D4_TARGET_INVALID');
  invariant(args.get('approval') === APPROVAL, 'D4_APPROVAL_REQUIRED');
  const credential = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || 'null');
  invariant(credential?.project_id === PROJECT, 'D4_CREDENTIAL_INVALID');
  admin.initializeApp({ credential: admin.credential.cert(credential), projectId: PROJECT });
  const db = admin.firestore();
  const repairedInterruptedProbes = await repairInterruptedProbes(db);
  const suffix = Date.now();
  const orderRef = db.doc(`orders/fixture_dashboard_d4_${suffix}`);
  const orderLedgerRef = db.doc(`order_stats_projections/${orderRef.id}`);
  const incidentRef = db.doc(`commerce_incidents/fixture-dashboard-d4-${suffix}`);
  const incidentLedgerRef = db.doc(`admin_incident_projections/${incidentRef.id}`);
  const ordersRef = db.doc('admin_dashboard/orders');
  const incidentsRef = db.doc('admin_incident_summary/current');
  const [ordersBaselineSnapshot, incidentsBaselineSnapshot] = await db.getAll(ordersRef, incidentsRef);
  const ordersBaseline = ordersBaselineSnapshot.data();
  const incidentsBaseline = incidentsBaselineSnapshot.data();
  const report = { repairedInterruptedProbes, order: [], incident: [] };
  try {
    await orderRef.create({
      schemaVersion: 2,
      status: 'pending',
      e2eOnly: true,
      fixtureScopeVersion: 'admin_dashboard_d4',
      total: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    let orders = await waitFor(() => ordersRef.get(), (snapshot) =>
      snapshot.data()?.pendingOrders === ordersBaseline.pendingOrders + 1, 'D4_ORDER_CREATE_TIMEOUT');
    report.order.push({ transition: 'create_pending', revision: orders.data().revision });

    await orderRef.update({ status: 'paid', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    orders = await waitFor(() => ordersRef.get(), (snapshot) =>
      snapshot.data()?.paidOrders === ordersBaseline.paidOrders + 1 &&
      snapshot.data()?.pendingOrders === ordersBaseline.pendingOrders, 'D4_ORDER_PAID_TIMEOUT');
    const paidRevision = orders.data().revision;
    report.order.push({ transition: 'pending_paid', revision: paidRevision });

    await orderRef.update({ probeNoEffect: true });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    orders = await ordersRef.get();
    invariant(orders.data().revision === paidRevision, 'D4_ORDER_NOOP_CHANGED_REVISION');
    report.order.push({ transition: 'no_effect_replay', revision: orders.data().revision });

    await orderRef.update({ status: 'shipped', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    orders = await waitFor(() => ordersRef.get(), (snapshot) =>
      snapshot.data()?.shippedOrders === ordersBaseline.shippedOrders + 1 &&
      snapshot.data()?.paidOrders === ordersBaseline.paidOrders, 'D4_ORDER_SHIPPED_TIMEOUT');
    report.order.push({ transition: 'paid_shipped', revision: orders.data().revision });

    await orderRef.delete();
    orders = await waitFor(() => ordersRef.get(), (snapshot) =>
      ['totalOrders', 'paidOrders', 'shippedOrders', 'pendingOrders', 'cancelledOrders']
        .every((key) => snapshot.data()?.[key] === ordersBaseline[key]), 'D4_ORDER_DELETE_TIMEOUT');
    const tombstone = await orderLedgerRef.get();
    invariant(tombstone.data()?.deleted === true, 'D4_ORDER_TOMBSTONE_MISSING');
    report.order.push({ transition: 'delete_tombstone', revision: orders.data().revision });

    await incidentRef.create({
      schemaVersion: 2,
      code: 'payment_requires_action',
      severity: 'warning',
      category: 'payment',
      status: 'open',
      fixtureScopeVersion: 'admin_dashboard_d4',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    let incidents = await waitFor(() => incidentsRef.get(), (snapshot) =>
      snapshot.data()?.activeWarnings === incidentsBaseline.activeWarnings + 1, 'D4_INCIDENT_OPEN_TIMEOUT');
    report.incident.push({ transition: 'open', revision: incidents.data().revision });

    const openRevision = incidents.data().revision;
    await incidentRef.update({ lastSeenAt: admin.firestore.FieldValue.serverTimestamp() });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    incidents = await incidentsRef.get();
    invariant(incidents.data().revision === openRevision, 'D4_INCIDENT_NOOP_CHANGED_REVISION');
    report.incident.push({ transition: 'last_seen_no_effect', revision: incidents.data().revision });

    await incidentRef.update({ status: 'closed', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    incidents = await waitFor(() => incidentsRef.get(), (snapshot) =>
      snapshot.data()?.activeWarnings === incidentsBaseline.activeWarnings &&
      snapshot.data()?.activeTotal === incidentsBaseline.activeTotal, 'D4_INCIDENT_CLOSE_TIMEOUT');
    report.incident.push({ transition: 'close', revision: incidents.data().revision });
    await incidentRef.delete();
    const ledger = await waitFor(() => incidentLedgerRef.get(), (snapshot) =>
      snapshot.exists && snapshot.data()?.active === false && snapshot.data()?.deleted === true,
    'D4_INCIDENT_LEDGER_MISSING');
    invariant(ledger.exists, 'D4_INCIDENT_TOMBSTONE_MISSING');
  } finally {
    await Promise.allSettled([orderRef.delete(), incidentRef.delete()]);
  }
  process.stdout.write(`${JSON.stringify({ ok: true, project: PROJECT, report }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.message || 'D4_PROBE_FAILED'}\n`);
  process.exitCode = 1;
});
