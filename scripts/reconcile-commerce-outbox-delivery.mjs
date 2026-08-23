#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';

function fail(code) {
  throw new Error(code);
}

function parseArgs(argv) {
  return new Map(argv.map((argument) => {
    if (!argument.startsWith('--')) fail('OUTBOX_RECONCILIATION_ARGUMENT_INVALID');
    const [key, ...parts] = argument.slice(2).split('=');
    return [key, parts.length ? parts.join('=') : 'true'];
  }));
}

export function validateReconciliationInput(input) {
  if (input.project !== PROJECT_ID || input.environment !== ENVIRONMENT) {
    fail('OUTBOX_RECONCILIATION_TARGET_INVALID');
  }
  if (!/^[a-f0-9]{64}$/.test(input.outboxId || '')) fail('OUTBOX_RECONCILIATION_ID_INVALID');
  if (!/^ord_[A-Za-z0-9_-]+$/.test(input.orderId || '')) fail('OUTBOX_RECONCILIATION_ORDER_INVALID');
  if (!/^[a-f0-9]{40}$/.test(input.commit || '')) fail('OUTBOX_RECONCILIATION_COMMIT_INVALID');
  if (input.evidence !== 'gmail_admin_m11_observed') fail('OUTBOX_RECONCILIATION_EVIDENCE_INVALID');
  if (input.apply && input.confirm !== `RECONCILE_DELIVERY_${input.outboxId}`) {
    fail('OUTBOX_RECONCILIATION_CONFIRMATION_INVALID');
  }
  return input;
}

export function validateOutboxCandidate(data, input) {
  if (
    data?.status !== 'delivery_unknown' ||
    data?.template !== 'order-refunded-admin' ||
    data?.aggregateType !== 'order' ||
    data?.aggregateId !== input.orderId ||
    data?.recipientRole !== 'admin' ||
    Number(data?.attemptCount) !== 1
  ) fail('OUTBOX_RECONCILIATION_CANDIDATE_DRIFT');
  return true;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const input = validateReconciliationInput({
    project: args.get('project'),
    environment: args.get('env'),
    outboxId: args.get('outbox-id'),
    orderId: args.get('order-id'),
    commit: args.get('commit'),
    evidence: args.get('evidence'),
    apply: args.get('apply') === 'true',
    confirm: args.get('confirm')
  });
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) fail('OUTBOX_RECONCILIATION_CREDENTIAL_MISSING');
  const adminModule = await import('firebase-admin');
  const admin = adminModule.default;
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
      projectId: PROJECT_ID
    });
  }
  const db = admin.firestore();
  const reference = db.doc(`commerce_outbox/${input.outboxId}`);
  const snapshot = await reference.get();
  if (!snapshot.exists) fail('OUTBOX_RECONCILIATION_MISSING');
  validateOutboxCandidate(snapshot.data(), input);
  if (!input.apply) {
    process.stdout.write(`${JSON.stringify({
      ok: true,
      mode: 'DRY_RUN',
      outboxId: input.outboxId,
      orderId: input.orderId,
      plannedStatus: 'sent',
      resend: false
    })}\n`);
    return;
  }
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(reference);
    if (!current.exists) fail('OUTBOX_RECONCILIATION_MISSING');
    validateOutboxCandidate(current.data(), input);
    const reconciledAt = admin.firestore.Timestamp.now();
    transaction.update(reference, {
      status: 'sent',
      sentAt: current.data()?.sentAt || reconciledAt,
      lastError: null,
      deliveryReconciledAt: reconciledAt,
      deliveryReconciliation: {
        schemaVersion: 1,
        evidence: input.evidence,
        commit: input.commit,
        noResend: true
      }
    });
  });
  process.stdout.write(`${JSON.stringify({
    ok: true,
    mode: 'APPLIED',
    outboxId: input.outboxId,
    orderId: input.orderId,
    status: 'sent',
    resend: false
  })}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`reconcile-commerce-outbox-delivery: ${error.message}\n`);
    process.exitCode = 1;
  });
}
