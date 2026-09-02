#!/usr/bin/env node

import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const requireFromFunctions = createRequire(new URL('../functions/package.json', import.meta.url));
const admin = requireFromFunctions('firebase-admin');
const { summarizeAdminOrder, validateOrderPartition } =
  requireFromFunctions('./src/admin/dashboardProjection');
const { normalizeIncidentState } = requireFromFunctions('./src/observability/incidentProjection');

const PROJECT = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const APPROVAL = 'D3_BOOTSTRAP_ADMIN_DASHBOARD_SANDBOX';
const REPORT = 'logs/admin-dashboard/d3-bootstrap.json';
const DAY_MS = 86_400_000;

const args = new Map(process.argv.slice(2).map((token) => {
  if (!token.startsWith('--') || !token.includes('=')) throw new Error(`D3_ARGUMENT_INVALID:${token}`);
  const [key, ...value] = token.slice(2).split('=');
  return [key, value.join('=')];
}));

function invariant(value, code) {
  if (!value) throw new Error(code);
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function stable(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(stable);
  if (typeof value?.toMillis === 'function') {
    return { seconds: String(value.seconds), nanoseconds: value.nanoseconds };
  }
  if (typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function digest(value) {
  return hash(JSON.stringify(stable(value)));
}

function dateKey(millis) {
  return new Date(millis).toISOString().slice(0, 10);
}

async function listRegisteredUsers() {
  const users = [];
  let pageToken;
  do {
    const page = await admin.auth().listUsers(1000, pageToken);
    for (const user of page.users) {
      if (!String(user.email || '').trim()) continue;
      users.push({
        uid: user.uid,
        createdAt: admin.firestore.Timestamp.fromDate(
          new Date(user.metadata.creationTime || '1970-01-01T00:00:00.000Z')
        )
      });
    }
    pageToken = page.pageToken;
  } while (pageToken);
  return users.sort((left, right) => left.uid.localeCompare(right.uid));
}

async function readSources(db) {
  const now = Date.now();
  const insightKeys = Array.from({ length: 30 }, (_, index) => dateKey(now - ((29 - index) * DAY_MS)));
  const [orders, facts, incidents, finance, usersStats, inventory, ...rollups] = await Promise.all([
    db.collection('orders').get(),
    db.collection('commerce_financial_facts').get(),
    db.collection('commerce_incidents').get(),
    db.doc('commerce_financial_totals/EUR').get(),
    db.doc('sys_user_stats/current').get(),
    db.doc('inventory_stats/overview').get(),
    ...insightKeys.map((key) => db.doc(`analytics_rollup_days/${key}`).get())
  ]);
  const authUsers = await listRegisteredUsers();
  invariant(finance.exists, 'D3_FINANCE_SOURCE_MISSING');
  invariant(inventory.exists, 'D3_INVENTORY_SOURCE_MISSING');
  return { now, insightKeys, orders, facts, incidents, finance, usersStats, inventory, rollups, authUsers };
}

function buildPlan(source) {
  const orderSummary = {
    totalOrders: 0,
    paidOrders: 0,
    shippedOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0
  };
  const orderLedgers = source.orders.docs.map((document) => {
    const summary = summarizeAdminOrder(document.data());
    for (const key of Object.keys(orderSummary)) orderSummary[key] += summary[key];
    return { id: document.id, sourceUpdateTime: document.updateTime, summary };
  });
  validateOrderPartition(orderSummary);

  const factTotals = {
    capturedCents: 0,
    refundedCents: 0,
    netCents: 0,
    factCount: 0,
    capturedOrderCount: 0
  };
  const capturedOrders = new Set();
  for (const document of source.facts.docs) {
    const fact = document.data();
    invariant(['capture', 'refund', 'refund_reversal'].includes(fact.type), 'D3_FINANCE_FACT_TYPE_INVALID');
    invariant(Number.isSafeInteger(fact.amountCents) && fact.amountCents > 0, 'D3_FINANCE_FACT_AMOUNT_INVALID');
    if (fact.type === 'capture') {
      factTotals.capturedCents += fact.amountCents;
      capturedOrders.add(String(fact.orderId || document.id));
    } else if (fact.type === 'refund') {
      factTotals.refundedCents += fact.amountCents;
    } else {
      factTotals.refundedCents -= fact.amountCents;
    }
    factTotals.factCount += 1;
  }
  factTotals.netCents = factTotals.capturedCents - factTotals.refundedCents;
  factTotals.capturedOrderCount = capturedOrders.size;
  const storedFinance = source.finance.data();
  for (const key of ['capturedCents', 'refundedCents', 'netCents', 'factCount']) {
    invariant(Number(storedFinance[key] || 0) === factTotals[key], `D3_FINANCE_SOURCE_DIVERGENCE:${key}`);
  }

  const quote = { visits: 0, starts: 0, submitted: 0 };
  const insightSource = [];
  source.rollups.forEach((snapshot, index) => {
    if (!snapshot.exists) return;
    const value = snapshot.data();
    for (const key of Object.keys(quote)) quote[key] += Math.max(0, Number(value.quoteSessions?.[key] || 0));
    insightSource.push({ dateKey: source.insightKeys[index], quoteSessions: value.quoteSessions || {} });
  });

  const incidentLedgers = [];
  const incidentSummary = { activeCritical: 0, activeWarnings: 0, activeTotal: 0 };
  for (const document of source.incidents.docs) {
    const state = normalizeIncidentState(document.data());
    incidentLedgers.push({ id: document.id, sourceUpdateTime: document.updateTime, state });
    if (!state.active) continue;
    incidentSummary.activeTotal += 1;
    incidentSummary[state.severity === 'warning' ? 'activeWarnings' : 'activeCritical'] += 1;
  }
  invariant(incidentSummary.activeTotal === incidentSummary.activeCritical + incidentSummary.activeWarnings,
    'D3_INCIDENT_PARTITION_INVALID');

  const inventory = source.inventory.data();
  const stockValueCents = Math.round(Number(inventory.totalStockValue) * 100);
  invariant(Number.isSafeInteger(stockValueCents) && stockValueCents >= 0, 'D3_STOCK_VALUE_INVALID');
  const sourceRevision = Number(inventory.catalogRevision);
  invariant(Number.isSafeInteger(sourceRevision) && sourceRevision >= 0, 'D3_CATALOG_REVISION_INVALID');

  const publicPlan = {
    sourceCounts: {
      orders: source.orders.size,
      financialFacts: source.facts.size,
      authUsers: source.authUsers.length,
      incidents: source.incidents.size,
      insightDays: insightSource.length
    },
    orderSummary,
    finance: factTotals,
    activity: { registeredUsers: source.authUsers.length, stockValueCents, sourceRevision },
    incidentSummary,
    quote,
    sourceDigests: {
      orders: digest(orderLedgers.map((entry) => ({ idHash: hash(entry.id), sourceUpdateTime: entry.sourceUpdateTime, summary: entry.summary }))),
      financialFacts: digest(source.facts.docs.map((doc) => ({ idHash: hash(doc.id), updateTime: doc.updateTime, value: doc.data() }))),
      authUsers: digest(source.authUsers.map((entry) => ({ uidHash: hash(entry.uid), createdAt: entry.createdAt }))),
      incidents: digest(incidentLedgers.map((entry) => ({ idHash: hash(entry.id), sourceUpdateTime: entry.sourceUpdateTime, state: entry.state }))),
      insights: digest(insightSource)
    }
  };
  return { publicPlan, orderLedgers, incidentLedgers, insightSource, stockValueCents, sourceRevision };
}

async function applyPlan(db, source, plan, planDigest) {
  const batch = db.batch();
  const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
  batch.set(db.doc('admin_dashboard/finance'), {
    schemaVersion: 1,
    currency: 'EUR',
    ...plan.publicPlan.finance,
    sourceFactCount: plan.publicPlan.finance.factCount,
    source: 'commerce_financial_totals_projection',
    sourceUpdateTime: source.finance.updateTime,
    updatedAt: serverTimestamp,
    revision: 1,
    bootstrapDigest: planDigest
  });
  batch.set(db.doc('admin_dashboard/orders'), {
    schemaVersion: 1,
    ...plan.publicPlan.orderSummary,
    source: 'orders_all_schemas_projector',
    latestObservedSourceUpdateTime: plan.orderLedgers.reduce((latest, entry) =>
      !latest || entry.sourceUpdateTime.toMillis() > latest.toMillis() ? entry.sourceUpdateTime : latest, null),
    updatedAt: serverTimestamp,
    revision: 1,
    bootstrapDigest: planDigest
  });
  batch.set(db.doc('admin_dashboard/activity'), {
    schemaVersion: 1,
    users: {
      registeredUsers: source.authUsers.length,
      sourceRevision: Math.max(1, Number(source.usersStats.data()?.revision || 0)),
      sourceUpdatedAt: source.usersStats.exists ? source.usersStats.updateTime : admin.firestore.Timestamp.now()
    },
    catalog: {
      stockValueCents: plan.stockValueCents,
      sourceRevision: plan.sourceRevision,
      sourceUpdatedAt: source.inventory.data().lastUpdatedAt || source.inventory.updateTime
    },
    updatedAt: serverTimestamp,
    revision: 1,
    bootstrapDigest: planDigest
  });
  batch.set(db.doc('admin_dashboard/insights'), {
    schemaVersion: 1,
    windowDays: 30,
    quote: plan.publicPlan.quote,
    productsState: 'not_materialized',
    products: [],
    coverageThrough: admin.firestore.Timestamp.fromMillis(source.now),
    source: 'analytics_rollups',
    sourceDigest: digest(plan.insightSource),
    updatedAt: serverTimestamp,
    revision: 1,
    bootstrapDigest: planDigest
  });
  batch.set(db.doc('admin_incident_summary/current'), {
    schemaVersion: 1,
    ...plan.publicPlan.incidentSummary,
    latestOpenedAt: null,
    latestResolvedAt: null,
    latestCategory: null,
    updatedAt: serverTimestamp,
    revision: 1,
    bootstrapDigest: planDigest
  });
  for (const entry of plan.orderLedgers) {
    batch.set(db.doc(`order_stats_projections/${entry.id}`), {
      schemaVersion: 2,
      orderId: entry.id,
      sourceUpdateTime: entry.sourceUpdateTime,
      deleted: false,
      adminSummary: entry.summary,
      updatedAt: serverTimestamp,
      bootstrapDigest: planDigest
    }, { merge: true });
  }
  for (const user of source.authUsers) {
    batch.set(db.doc(`admin_user_stats_projections/${user.uid}`), {
      schemaVersion: 1,
      present: true,
      sourceEventTime: user.createdAt,
      eventId: `bootstrap:${planDigest}`,
      updatedAt: serverTimestamp,
      bootstrapDigest: planDigest
    });
  }
  for (const entry of plan.incidentLedgers) {
    batch.set(db.doc(`admin_incident_projections/${entry.id}`), {
      schemaVersion: 1,
      incidentId: entry.id,
      sourceUpdateTime: entry.sourceUpdateTime,
      deleted: false,
      active: entry.state.active,
      severity: entry.state.severity,
      category: entry.state.category,
      code: entry.state.code,
      updatedAt: serverTimestamp,
      bootstrapDigest: planDigest
    });
  }
  await batch.commit();
}

async function verify(db, source, plan) {
  const [finance, orders, activity, insights, incidents] = await db.getAll(
    db.doc('admin_dashboard/finance'),
    db.doc('admin_dashboard/orders'),
    db.doc('admin_dashboard/activity'),
    db.doc('admin_dashboard/insights'),
    db.doc('admin_incident_summary/current')
  );
  const [orderLedgers, userLedgers, incidentLedgers] = await Promise.all([
    db.collection('order_stats_projections').get(),
    db.collection('admin_user_stats_projections').get(),
    db.collection('admin_incident_projections').get()
  ]);
  return {
    documentsPresent: [finance, orders, activity, insights, incidents].every((snapshot) => snapshot.exists),
    orderLedgerCount: orderLedgers.docs.filter((doc) => doc.data()?.deleted !== true).length,
    userLedgerCount: userLedgers.docs.filter((doc) => doc.data()?.present !== false).length,
    incidentLedgerCount: incidentLedgers.docs.filter((doc) => doc.data()?.deleted !== true).length,
    expected: {
      orderLedgerCount: source.orders.size,
      userLedgerCount: source.authUsers.length,
      incidentLedgerCount: source.incidents.size
    },
    summariesMatch: JSON.stringify(Object.fromEntries(Object.keys(plan.publicPlan.orderSummary)
      .map((key) => [key, orders.data()?.[key]]))) === JSON.stringify(plan.publicPlan.orderSummary) &&
      finance.data()?.netCents === plan.publicPlan.finance.netCents &&
      activity.data()?.users?.registeredUsers === source.authUsers.length &&
      incidents.data()?.activeTotal === plan.publicPlan.incidentSummary.activeTotal
  };
}

async function main() {
  invariant(args.get('project') === PROJECT, 'D3_PROJECT_REQUIRED');
  invariant(args.get('env') === ENVIRONMENT, 'D3_ENV_REQUIRED');
  const apply = args.get('apply') === 'true';
  const verifyOnly = args.get('verify') === 'true';
  if (apply) {
    invariant(args.get('approval') === APPROVAL, 'D3_APPROVAL_REQUIRED');
    invariant(args.get('backup')?.startsWith('projects/secondevienextjsssr/locations/eur3/backups/'),
      'D3_READY_BACKUP_REQUIRED');
    invariant(/^[0-9a-f]{64}$/.test(args.get('digest') || ''), 'D3_DIGEST_REQUIRED');
  }
  const credential = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || 'null');
  invariant(credential?.project_id === PROJECT, 'D3_CREDENTIAL_PROJECT_MISMATCH');
  admin.initializeApp({ credential: admin.credential.cert(credential), projectId: PROJECT });
  const db = admin.firestore();
  const source = await readSources(db);
  const plan = buildPlan(source);
  const planDigest = digest(plan.publicPlan);
  if (apply) {
    invariant(planDigest === args.get('digest'), 'D3_SOURCE_DIGEST_DRIFT');
    const existing = await db.collection('admin_dashboard').limit(1).get();
    invariant(existing.empty, 'D3_PROJECTION_ALREADY_INITIALIZED');
    await applyPlan(db, source, plan, planDigest);
  }
  const verification = (apply || verifyOnly) ? await verify(db, source, plan) : null;
  const verificationMatches = !(apply || verifyOnly) || (
    verification.documentsPresent && verification.summariesMatch &&
    verification.orderLedgerCount === verification.expected.orderLedgerCount &&
    verification.userLedgerCount === verification.expected.userLedgerCount &&
    verification.incidentLedgerCount === verification.expected.incidentLedgerCount
  );
  invariant(verificationMatches,
    `D3_POST_APPLY_MISMATCH:${JSON.stringify(verification)}`);
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: PROJECT,
    environment: ENVIRONMENT,
    mode: apply ? 'apply' : 'dry-run',
    verdict: apply ? 'D3_BOOTSTRAP_APPLIED_AND_VERIFIED' :
      (verifyOnly ? 'D4_SHADOW_SOURCES_MATCH' : 'D3_BOOTSTRAP_READY'),
    digest: planDigest,
    backup: apply ? args.get('backup') : null,
    ...plan.publicPlan,
    writes: apply ? 5 + source.orders.size + source.authUsers.length + source.incidents.size : 0,
    verification,
    rollback: 'Restore the named READY backup or ignore additive projections; do not delete sources.'
  };
  const reportPath = path.resolve(args.get('report') || REPORT);
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.message || 'D3_UNKNOWN_ERROR'}\n`);
  process.exitCode = 1;
});
