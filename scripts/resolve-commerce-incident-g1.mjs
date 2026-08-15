#!/usr/bin/env node

import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import process from 'node:process';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const APPROVAL = 'G1_RESOLVE_BALANCED_REVERSAL_NO_REPLAY';
const require = createRequire(import.meta.url);
const Stripe = require('../functions/node_modules/stripe');

function fail(code) {
  throw new Error(code);
}

function parseArgs(argv) {
  return new Map(argv.map((argument) => {
    if (!argument.startsWith('--')) fail(`G1_RESOLUTION_ARGUMENT_INVALID:${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    return [key, parts.length ? parts.join('=') : 'true'];
  }));
}

function stableDigest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function factSummary(documents) {
  const summary = {};
  for (const document of documents) {
    const fact = document.data();
    const type = String(fact?.type || 'unknown');
    if (!summary[type]) summary[type] = { count: 0, amountCents: 0 };
    summary[type].count += 1;
    summary[type].amountCents += Number(fact?.amountCents || 0);
  }
  return summary;
}

function evidenceFrom({ incident, order, attempt, provider, facts, health }) {
  return {
    incident: {
      code: incident.code,
      status: incident.status,
      schemaVersion: incident.schemaVersion || null,
      providerObjectMatches: incident.providerObjectId === provider.id
    },
    order: {
      schemaVersion: order.schemaVersion || null,
      stateVersion: order.stateVersion || null,
      status: order.status || null,
      paymentStatus: order.payment?.status || null,
      lastProviderStatus: order.payment?.lastProviderStatus || null
    },
    attempt: {
      status: attempt.status || null,
      providerStatus: attempt.providerStatus || null,
      amountCents: Number(attempt.amountCents || 0),
      refundReferenceMatches: attempt.refundId === provider.id
    },
    provider: {
      livemode: provider.livemode === true,
      status: provider.status || null,
      amountCents: Number(provider.amount || 0)
    },
    facts,
    health: {
      status: health.status || null,
      schemaVersion: health.schemaVersion || null,
      primaryOpenIncidentCount: Number(health.primaryOpenIncidentCount || 0),
      truncated: health.truncated === true
    }
  };
}

function validateEvidence(evidence) {
  const refund = evidence.facts.refund || { count: 0, amountCents: 0 };
  const reversal = evidence.facts.refund_reversal || { count: 0, amountCents: 0 };
  if (evidence.incident.code !== 'terminal_refund_conflict' || evidence.incident.status !== 'open') {
    fail('G1_RESOLUTION_INCIDENT_PRECONDITION');
  }
  if (!evidence.incident.providerObjectMatches || !evidence.attempt.refundReferenceMatches) {
    fail('G1_RESOLUTION_PROVIDER_REFERENCE_DRIFT');
  }
  if (evidence.provider.livemode || !['failed', 'canceled'].includes(evidence.provider.status)) {
    fail('G1_RESOLUTION_STRIPE_TEST_TERMINAL_REQUIRED');
  }
  if (evidence.attempt.status !== 'failed' || evidence.attempt.providerStatus !== evidence.provider.status) {
    fail('G1_RESOLUTION_ATTEMPT_DRIFT');
  }
  if (evidence.attempt.amountCents !== evidence.provider.amountCents) fail('G1_RESOLUTION_AMOUNT_DRIFT');
  if (refund.count !== 1 || reversal.count !== 1 || refund.amountCents <= 0 || refund.amountCents !== reversal.amountCents) {
    fail('G1_RESOLUTION_REVERSAL_NOT_BALANCED');
  }
  if (
    evidence.order.status !== 'needs_review' ||
    evidence.order.paymentStatus !== 'succeeded' ||
    evidence.order.lastProviderStatus !== 'succeeded'
  ) fail('G1_RESOLUTION_ORDER_PRECONDITION');
  if (
    evidence.health.status !== 'stop' ||
    evidence.health.primaryOpenIncidentCount !== 1 ||
    evidence.health.truncated
  ) fail('G1_RESOLUTION_HEALTH_PRECONDITION');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.get('project') !== PROJECT_ID || (args.get('env') || ENVIRONMENT) !== ENVIRONMENT) {
    fail('G1_RESOLUTION_TARGET_INVALID');
  }
  if (!String(process.env.STRIPE_SECRET_KEY || '').startsWith('sk_test_')) {
    fail('G1_RESOLUTION_STRIPE_TEST_KEY_REQUIRED');
  }
  const commit = args.get('commit');
  const currentCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (!commit || commit !== currentCommit || !/^[0-9a-f]{40}$/.test(commit)) fail('G1_RESOLUTION_COMMIT_INVALID');
  const actor = String(args.get('actor') || '');
  if (!/^[A-Za-z0-9._+@-]{3,160}$/.test(actor)) fail('G1_RESOLUTION_ACTOR_INVALID');
  const apply = args.get('apply') === 'true';
  if (apply && args.get('approval') !== APPROVAL) fail('G1_RESOLUTION_APPROVAL_REQUIRED');

  const credential = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
    : applicationDefault();
  const app = getApps().find((entry) => entry.name === 'g1-commerce-incident-resolution') || initializeApp({
    credential,
    projectId: PROJECT_ID
  }, 'g1-commerce-incident-resolution');
  const db = getFirestore(app);
  const incidents = await db.collection('commerce_incidents')
    .where('status', '==', 'open')
    .where('code', '==', 'terminal_refund_conflict')
    .limit(2)
    .get();
  if (incidents.size !== 1) fail(`G1_RESOLUTION_EXPECTED_ONE:${incidents.size}`);
  const incidentDocument = incidents.docs[0];
  const incident = incidentDocument.data();
  if (!incident.orderId || !incident.providerObjectId) fail('G1_RESOLUTION_LINKS_MISSING');

  const orderRef = db.doc(`orders/${incident.orderId}`);
  const [orderSnapshot, attemptsSnapshot, factsSnapshot, healthSnapshot] = await Promise.all([
    orderRef.get(),
    orderRef.collection('refunds').orderBy('updatedAt', 'desc').limit(2).get(),
    db.collection('commerce_financial_facts').where('orderId', '==', incident.orderId).limit(100).get(),
    db.doc('sys_commerce_operations/current').get()
  ]);
  if (!orderSnapshot.exists || attemptsSnapshot.empty || !healthSnapshot.exists) {
    fail('G1_RESOLUTION_REQUIRED_DOCUMENT_MISSING');
  }
  const order = orderSnapshot.data();
  const attemptDocument = attemptsSnapshot.docs.find((document) => (
    document.data()?.refundId === incident.providerObjectId
  ));
  if (!attemptDocument) fail('G1_RESOLUTION_ATTEMPT_MISSING');
  const attempt = attemptDocument.data();
  const connectedAccountId = attempt.connectedAccountId || order.payment?.connectedAccountId || null;
  if (!connectedAccountId) fail('G1_RESOLUTION_CONNECT_ACCOUNT_MISSING');

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const provider = await stripe.refunds.retrieve(incident.providerObjectId, {}, {
    stripeAccount: connectedAccountId
  });
  const facts = factSummary(factsSnapshot.docs);
  const evidence = evidenceFrom({
    incident,
    order,
    attempt,
    provider,
    facts,
    health: healthSnapshot.data()
  });
  validateEvidence(evidence);
  const evidenceDigest = stableDigest(evidence);

  if (!apply) {
    process.stdout.write(`${JSON.stringify({
      ok: true,
      mode: 'DRY_READ_ONLY',
      project: PROJECT_ID,
      environment: ENVIRONMENT,
      actor,
      commit,
      approvalRequired: APPROVAL,
      evidence,
      evidenceDigest,
      plannedWrites: ['commerce_incidents/<incident>', 'orders/<order>/events/<append-only>'],
      forbiddenWrites: ['orders/<order>', 'orders/<order>/refunds/<attempt>', 'commerce_financial_facts/*', 'inventory_*']
    }, null, 2)}\n`);
    return;
  }

  const eventId = `incident-resolution-${stableDigest(incidentDocument.id).slice(0, 24)}`;
  const auditRef = orderRef.collection('events').doc(eventId);
  const resolvedAt = Timestamp.now();
  await db.runTransaction(async (transaction) => {
    const [currentIncidentSnapshot, currentOrderSnapshot, currentAttemptSnapshot,
      currentHealthSnapshot, currentAuditSnapshot, ...currentFactSnapshots] = await Promise.all([
      transaction.get(incidentDocument.ref),
      transaction.get(orderRef),
      transaction.get(attemptDocument.ref),
      transaction.get(db.doc('sys_commerce_operations/current')),
      transaction.get(auditRef),
      ...factsSnapshot.docs.map((document) => transaction.get(document.ref))
    ]);
    if (
      !currentIncidentSnapshot.exists || !currentOrderSnapshot.exists ||
      !currentAttemptSnapshot.exists || !currentHealthSnapshot.exists || currentAuditSnapshot.exists
    ) fail('G1_RESOLUTION_TRANSACTION_PRECONDITION');
    const currentEvidence = evidenceFrom({
      incident: currentIncidentSnapshot.data(),
      order: currentOrderSnapshot.data(),
      attempt: currentAttemptSnapshot.data(),
      provider,
      facts: factSummary(currentFactSnapshots),
      health: currentHealthSnapshot.data()
    });
    validateEvidence(currentEvidence);
    if (stableDigest(currentEvidence) !== evidenceDigest) fail('G1_RESOLUTION_EVIDENCE_DRIFT');

    transaction.update(incidentDocument.ref, {
      status: 'resolved',
      resolvedAt,
      updatedAt: resolvedAt,
      resolution: {
        schemaVersion: 1,
        code: 'refund_reversal_balanced_provider_terminal',
        actor,
        commit,
        evidenceDigest,
        providerStatus: provider.status,
        amountCents: Number(provider.amount || 0),
        noReplay: true,
        noRefund: true,
        noRestock: true
      }
    });
    transaction.set(auditRef, {
      schemaVersion: 2,
      eventId,
      orderId: incident.orderId,
      type: 'commerce_incident_resolved',
      actor: { uid: actor, role: 'g1_operator', aal2: false },
      reason: 'refund_reversal_balanced_provider_terminal',
      payloadHash: evidenceDigest,
      incidentCode: incident.code,
      stateVersionBefore: order.stateVersion || null,
      stateVersionAfter: order.stateVersion || null,
      noReplay: true,
      noRefund: true,
      noRestock: true,
      createdAt: resolvedAt
    });
  });

  process.stdout.write(`${JSON.stringify({
    ok: true,
    mode: 'APPLIED_INCIDENT_ONLY_WITH_APPEND_ONLY_AUDIT',
    project: PROJECT_ID,
    environment: ENVIRONMENT,
    actor,
    commit,
    evidenceDigest,
    writes: 2,
    orderMutated: false,
    refundMutated: false,
    financialFactsMutated: false,
    stockMutated: false
  }, null, 2)}\n`);
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: String(error?.message || error) })}\n`);
  process.exitCode = 1;
}
