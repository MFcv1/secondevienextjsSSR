#!/usr/bin/env node

import process from 'node:process';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const INCIDENT_LIMIT = 101;

function fail(code) {
  throw new Error(code);
}

function parseArgs(argv) {
  return new Map(argv.map((argument) => {
    if (!argument.startsWith('--')) fail(`G1_AUDIT_ARGUMENT_INVALID:${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    return [key, parts.length ? parts.join('=') : 'true'];
  }));
}

function isoValue(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  return null;
}

function ageMinutes(value, now = Date.now()) {
  const timestamp = Date.parse(isoValue(value) || '');
  return Number.isFinite(timestamp) ? Math.max(0, Math.floor((now - timestamp) / 60000)) : null;
}

function histogram(values) {
  return Object.fromEntries([...values.reduce((counts, value) => {
    const key = typeof value === 'string' && value ? value : 'unknown';
    counts.set(key, (counts.get(key) || 0) + 1);
    return counts;
  }, new Map())].sort(([left], [right]) => left.localeCompare(right)));
}

async function count(query) {
  const snapshot = await query.count().get();
  return snapshot.data().count;
}

async function firestoreStorageMetric(credential, projectId) {
  try {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
    const url = new URL(`https://monitoring.googleapis.com/v3/projects/${projectId}/timeSeries`);
    url.searchParams.set('filter', 'metric.type="firestore.googleapis.com/storage/data_and_index_storage_bytes"');
    url.searchParams.set('interval.startTime', startTime.toISOString());
    url.searchParams.set('interval.endTime', endTime.toISOString());
    url.searchParams.set('view', 'FULL');
    const accessToken = await credential.getAccessToken();
    const response = await fetch(url, {
      headers: { authorization: `Bearer ${accessToken.access_token}` }
    });
    if (!response.ok) return { available: false, status: `HTTP_${response.status}`, bytes: null };
    const payload = await response.json();
    const values = (payload.timeSeries || []).flatMap((series) => (
      (series.points || []).map((point) => Number(point.value?.int64Value || point.value?.doubleValue || 0))
    )).filter((value) => Number.isFinite(value) && value >= 0);
    return {
      available: values.length > 0,
      status: values.length ? 'READY' : 'NO_POINTS',
      bytes: values.length ? Math.max(...values) : null
    };
  } catch {
    return { available: false, status: 'AUTH_OR_NETWORK_UNAVAILABLE', bytes: null };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectId = args.get('project');
  const environment = args.get('env') || ENVIRONMENT;
  if (projectId !== PROJECT_ID || environment !== ENVIRONMENT) fail('G1_AUDIT_TARGET_INVALID');

  const credential = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
      : applicationDefault();
  const app = getApps().find((entry) => entry.name === 'functions-gen2-g1-audit') || initializeApp({
    credential,
    projectId
  }, 'functions-gen2-g1-audit');
  const db = getFirestore(app);

  const [controlSnapshot, healthSnapshot, incidentsSnapshot, furnitureSnapshot, ordersSnapshot,
    reservationCount, outboxCount, inboxCount] = await Promise.all([
    db.doc('sys_commerce_control/current').get(),
    db.doc('sys_commerce_operations/current').get(),
    db.collection('commerce_incidents').where('status', '==', 'open').limit(INCIDENT_LIMIT).get(),
    db.collection('artifacts/secondevie/public/data/furniture').select('inventoryVersion').get(),
    db.collection('orders').select('schemaVersion', 'status').get(),
    count(db.collection('inventory_reservations')),
    count(db.collection('commerce_outbox')),
    count(db.collection('commerce_webhook_inbox'))
  ]);
  if (!controlSnapshot.exists || !healthSnapshot.exists) fail('G1_AUDIT_CONTROL_OR_HEALTH_MISSING');

  const control = controlSnapshot.data();
  const health = healthSnapshot.data();
  const incidents = incidentsSnapshot.docs.map((document) => document.data());
  const primaryIncidents = incidents.filter((incident) => (
    incident?.source !== 'commerce_operations_reconciler' &&
    !String(incident?.code || '').startsWith('operations_')
  ));
  const derivedIncidents = incidents.filter((incident) => !primaryIncidents.includes(incident));
  const furniture = furnitureSnapshot.docs.map((document) => document.data());
  const orders = ordersSnapshot.docs.map((document) => document.data());
  const v2Orders = orders.filter((order) => Number(order?.schemaVersion) === 2);
  const storageMetric = await firestoreStorageMetric(credential, projectId);

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: projectId,
    environment,
    control: {
      checkoutMode: control.newCheckoutMode || null,
      adminMutationMode: control.adminMutationMode || null,
      offlinePaymentMode: control.offlinePaymentMode || null,
      controlRevision: Number.isSafeInteger(control.controlRevision) ? control.controlRevision : null
    },
    health: {
      status: health.status || null,
      evaluatedAt: isoValue(health.evaluatedAt),
      ageMinutes: ageMinutes(health.evaluatedAt),
      schemaVersion: health.schemaVersion || null,
      counters: health.counters || {},
      primaryOpenIncidentCount: health.primaryOpenIncidentCount ?? null,
      truncated: health.truncated ?? null
    },
    incidents: {
      queryLimit: INCIDENT_LIMIT,
      truncated: incidentsSnapshot.size === INCIDENT_LIMIT,
      openObserved: incidentsSnapshot.size,
      primaryOpenObserved: primaryIncidents.length,
      derivedOpenObserved: derivedIncidents.length,
      primaryCodes: histogram(primaryIncidents.map((incident) => incident?.code))
    },
    dataShape: {
      furniture: furniture.length,
      furnitureWithoutInventoryVersion: furniture.filter((item) => !Number.isSafeInteger(item?.inventoryVersion)).length,
      orders: orders.length,
      v2Orders: v2Orders.length,
      legacyOrders: orders.length - v2Orders.length,
      orderStatuses: histogram(orders.map((order) => order?.status)),
      inventoryReservations: reservationCount,
      commerceOutbox: outboxCount,
      commerceWebhookInbox: inboxCount
    },
    costBasis: {
      firestoreStorageMetric: storageMetric
    }
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: String(error?.message || error) })}\n`);
  process.exitCode = 1;
}
