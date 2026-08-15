#!/usr/bin/env node

import { createRequire } from 'node:module';
import process from 'node:process';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const require = createRequire(import.meta.url);
const Stripe = require('../functions/node_modules/stripe');

function fail(code) {
  throw new Error(code);
}

function parseArgs(argv) {
  return new Map(argv.map((argument) => {
    if (!argument.startsWith('--')) fail(`G1_INCIDENT_ARGUMENT_INVALID:${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    return [key, parts.length ? parts.join('=') : 'true'];
  }));
}

function factSummary(facts) {
  const byType = {};
  for (const fact of facts) {
    const type = String(fact?.type || 'unknown');
    if (!byType[type]) byType[type] = { count: 0, amountCents: 0 };
    byType[type].count += 1;
    byType[type].amountCents += Number(fact?.amountCents || 0);
  }
  return byType;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.get('project') !== PROJECT_ID || (args.get('env') || ENVIRONMENT) !== ENVIRONMENT) {
    fail('G1_INCIDENT_TARGET_INVALID');
  }
  if (!String(process.env.STRIPE_SECRET_KEY || '').startsWith('sk_test_')) {
    fail('G1_INCIDENT_STRIPE_TEST_KEY_REQUIRED');
  }

  const app = getApps().find((entry) => entry.name === 'g1-commerce-incident-triage') || initializeApp({
    credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
      : applicationDefault(),
    projectId: PROJECT_ID
  }, 'g1-commerce-incident-triage');
  const db = getFirestore(app);
  const incidents = await db.collection('commerce_incidents')
    .where('status', '==', 'open')
    .where('code', '==', 'terminal_refund_conflict')
    .limit(2)
    .get();
  if (incidents.size !== 1) fail(`G1_INCIDENT_EXPECTED_ONE:${incidents.size}`);
  const incident = incidents.docs[0].data();
  if (!incident.orderId || !incident.providerObjectId) fail('G1_INCIDENT_LINKS_MISSING');

  const orderRef = db.doc(`orders/${incident.orderId}`);
  const [orderSnapshot, attemptsSnapshot, factsSnapshot] = await Promise.all([
    orderRef.get(),
    orderRef.collection('refunds').orderBy('updatedAt', 'desc').limit(2).get(),
    db.collection('commerce_financial_facts').where('orderId', '==', incident.orderId).limit(100).get()
  ]);
  if (!orderSnapshot.exists || attemptsSnapshot.empty) fail('G1_INCIDENT_ORDER_OR_ATTEMPT_MISSING');
  const order = orderSnapshot.data();
  const attempts = attemptsSnapshot.docs.map((document) => document.data());
  const matchingAttempt = attempts.find((attempt) => attempt.refundId === incident.providerObjectId) || attempts[0];
  const connectedAccountId = matchingAttempt.connectedAccountId || order.payment?.connectedAccountId || null;
  if (!connectedAccountId) fail('G1_INCIDENT_CONNECT_ACCOUNT_MISSING');

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const refund = await stripe.refunds.retrieve(incident.providerObjectId, {}, {
    stripeAccount: connectedAccountId
  });
  if (refund.livemode === true) fail('G1_INCIDENT_LIVE_OBJECT_FORBIDDEN');

  const facts = factsSnapshot.docs.map((document) => document.data());
  const summarizedFacts = factSummary(facts);
  const refundAmount = Number(refund.amount || 0);
  const refundFacts = Number(summarizedFacts.refund?.amountCents || 0);
  const reversalFacts = Number(summarizedFacts.refund_reversal?.amountCents || 0);
  const providerTerminalWithoutRefund = ['failed', 'canceled'].includes(refund.status);
  const reversalBalanced = refundFacts > 0 && refundFacts === reversalFacts;

  process.stdout.write(`${JSON.stringify({
    ok: true,
    project: PROJECT_ID,
    environment: ENVIRONMENT,
    mode: 'READ_ONLY_NO_REPLAY',
    incident: {
      code: incident.code,
      status: incident.status,
      schemaVersion: incident.schemaVersion || null
    },
    order: {
      schemaVersion: order.schemaVersion || null,
      status: order.status || null,
      paymentStatus: order.payment?.status || null,
      lastProviderStatus: order.payment?.lastProviderStatus || null
    },
    attempt: {
      status: matchingAttempt.status || null,
      providerStatus: matchingAttempt.providerStatus || null,
      amountMatchesProvider: Number(matchingAttempt.amountCents || 0) === refundAmount,
      refundReferenceMatches: matchingAttempt.refundId === incident.providerObjectId
    },
    provider: {
      livemode: refund.livemode === true,
      status: refund.status || null,
      amountCents: refundAmount
    },
    financialFacts: summarizedFacts,
    conclusion: providerTerminalWithoutRefund && reversalBalanced
      ? 'CANDIDATE_RESOLUTION_REVERSAL_BALANCED'
      : 'KEEP_OPEN_RECONCILIATION_REQUIRED'
  }, null, 2)}\n`);
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: String(error?.message || error) })}\n`);
  process.exitCode = 1;
}
