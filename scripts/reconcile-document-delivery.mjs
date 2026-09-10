#!/usr/bin/env node
// Operator-only sandbox reconciliation. No sender, queue or payment API.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const PROJECT = 'secondevienextjsssr';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const canonical = value => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const fail = code => { throw Error(`DOCUMENT_RECONCILIATION_${code}`); };
const version = snapshot => `${snapshot.updateTime.seconds}:${snapshot.updateTime.nanoseconds}`;

export function candidate(data) {
  if (data?.status !== 'delivery_unknown' || data.template !== 'commerce-document-copy'
    || data.aggregateType !== 'commerce_document' || data.recipientRole !== 'customer'
    || !/^ord_[A-Za-z0-9_-]+$/.test(data.aggregateId || '')
    || data.payloadSnapshot?.orderId !== data.aggregateId
    || !/^[A-Za-z0-9_-]{1,180}$/.test(data.payloadSnapshot?.documentId || '')
    || !/^[a-f0-9]{64}$/.test(data.recipientHash || '')
    || !Number.isSafeInteger(data.attemptCount) || data.attemptCount < 1
    || data.leaseToken != null || data.processingUntil != null || data.nextAttemptAt != null
    || data.providerMessageId || !Number.isFinite(Date.parse(data.createdAt || ''))) fail('CANDIDATE');
  if (data.maintenanceWork && (data.maintenanceWork.kind !== 'outbox'
    || data.maintenanceWork.state !== 'needs_attention' || data.maintenanceWork.lease)) fail('WORK_ACTIVE');
  return data;
}

export function makePlan(snapshot, { outboxId, commit, operatorHash, now = Date.now() }) {
  if (!snapshot.exists || !/^[a-f0-9]{64}$/.test(outboxId) || !/^[a-f0-9]{40}$/.test(commit)
    || !/^[a-f0-9]{64}$/.test(operatorHash)) fail('PLAN_INPUT');
  const data = candidate(snapshot.data());
  return { schemaVersion: 1, project: PROJECT, environment: 'sandbox', outboxId,
    orderId: data.aggregateId, documentId: data.payloadSnapshot.documentId,
    recipientHash: data.recipientHash, attemptCount: data.attemptCount,
    expectedUpdateTime: version(snapshot), fingerprint: sha(canonical(data)),
    createdAt: data.createdAt, plannedAt: new Date(now).toISOString(), commit, operatorHash,
    previous: { status: data.status, lastError: data.lastError || null, deliveryUnknownAt: data.deliveryUnknownAt || null,
      maintenanceWork: data.maintenanceWork || null }, resend: false };
}

export function validateEvidence(plan, evidence, proof, now = Date.now()) {
  if (plan?.schemaVersion !== 1 || plan.project !== PROJECT || plan.environment !== 'sandbox'
    || !/^[a-f0-9]{64}$/.test(plan.outboxId || '') || !/^[a-f0-9]{40}$/.test(plan.commit || '')
    || !Number.isFinite(Date.parse(plan.createdAt || '')) || plan.resend !== false) fail('PLAN_TARGET');
  if (!Buffer.isBuffer(proof) || !proof.length || proof.length > 10 * 1024 * 1024) fail('PROOF_SIZE');
  if (evidence?.schemaVersion !== 1 || !['provider_acceptance', 'recipient_received'].includes(evidence.observation)
    || evidence.proofSha256 !== sha(proof)) fail('EVIDENCE_REQUIRED');
  for (const field of ['outboxId', 'orderId', 'documentId', 'recipientHash', 'attemptCount']) {
    if (evidence[field] !== plan[field]) fail('EVIDENCE_TARGET');
  }
  const observed = Date.parse(evidence.observedAt), sent = Date.parse(evidence.sentAt);
  if (!Number.isFinite(observed) || !Number.isFinite(sent) || sent > observed || observed > now + 300000
    || observed < Date.parse(plan.createdAt) || sent < Date.parse(plan.createdAt) - 60000) fail('EVIDENCE_TIME');
  // A digest binds the operator's attestation to a reviewed local proof. It does
  // not authenticate a provider receipt by itself; the runbook requires review.
  return evidence;
}

export async function applyResolution({ db, plan, evidence, proof, confirm, operatorHash, now = Date.now() }) {
  validateEvidence(plan, evidence, proof, now);
  if (confirm !== `CONFIRM_DELIVERED_NO_RESEND_${plan.outboxId}_${evidence.proofSha256}`
    || !/^[a-f0-9]{64}$/.test(operatorHash || '')) fail('CONFIRMATION');
  const ref = db.doc(`commerce_outbox/${plan.outboxId}`);
  return db.runTransaction(async tx => {
    const current = await tx.get(ref);
    if (!current.exists) fail('MISSING');
    const data = current.data();
    if (data.aggregateId !== plan.orderId || data.payloadSnapshot?.documentId !== plan.documentId
      || data.recipientHash !== plan.recipientHash || data.attemptCount !== plan.attemptCount
      || data.createdAt !== plan.createdAt) fail('PLAN_BINDING');
    if (data.status === 'sent' && data.deliveryReconciliation?.schemaVersion === 2
      && data.deliveryReconciliation.planFingerprint === plan.fingerprint
      && data.deliveryReconciliation.proofSha256 === evidence.proofSha256) return { result: 'already_resolved', resend: false };
    candidate(data);
    if (version(current) !== plan.expectedUpdateTime || sha(canonical(data)) !== plan.fingerprint) fail('SOURCE_CHANGED');
    const patch = { status: 'sent', sentAt: evidence.sentAt, lastError: null,
      deliveryReconciledAt: new Date(now).toISOString(),
      deliveryReconciliation: { schemaVersion: 2, observation: evidence.observation,
        proofSha256: evidence.proofSha256, observedAt: evidence.observedAt,
        planFingerprint: plan.fingerprint, commit: plan.commit, operatorHash,
        previous: { status: data.status, lastError: data.lastError || null,
          deliveryUnknownAt: data.deliveryUnknownAt || null, maintenanceWork: data.maintenanceWork || null }, noResend: true } };
    if (data.maintenanceWork) patch.maintenanceWork = { ...data.maintenanceWork,
      state: 'succeeded', result: 'delivery_confirmed_by_operator', lease: null, leaseUntil: null, completedAt: now };
    tx.update(ref, patch);
    return { result: 'resolved', resend: false };
  });
}

export async function abandonResolution({ db, plan, confirm, operatorHash, now = Date.now() }) {
  if (plan?.schemaVersion !== 1 || plan.project !== PROJECT || plan.environment !== 'sandbox'
    || !/^[a-f0-9]{64}$/.test(plan.outboxId || '') || !/^[a-f0-9]{64}$/.test(plan.fingerprint || '')
    || plan.resend !== false || !/^[a-f0-9]{64}$/.test(operatorHash || '')
    || confirm !== `ABANDON_UNCERTAIN_COPY_NO_RESEND_${plan.outboxId}_${plan.fingerprint}`) fail('ABANDON_CONFIRMATION');
  return db.runTransaction(async tx => {
    const ref = db.doc(`commerce_outbox/${plan.outboxId}`);
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) fail('MISSING');
    const data = snapshot.data();
    if (data.aggregateId !== plan.orderId || data.payloadSnapshot?.documentId !== plan.documentId
      || data.recipientHash !== plan.recipientHash || data.attemptCount !== plan.attemptCount
      || data.createdAt !== plan.createdAt) fail('PLAN_BINDING');
    if (data.status === 'suppressed_stale' && data.deliveryAbandonment?.planFingerprint === plan.fingerprint)
      return { result: 'already_abandoned', resend: false, deliveryConfirmed: false };
    candidate(data);
    if (version(snapshot) !== plan.expectedUpdateTime || sha(canonical(data)) !== plan.fingerprint) fail('SOURCE_CHANGED');
    const patch = { status: 'suppressed_stale', suppressedAt: new Date(now).toISOString(),
      suppressionReason: 'operator_abandoned_obsolete_document_copy',
      deliveryAbandonment: { schemaVersion: 1, planFingerprint: plan.fingerprint, operatorHash,
        decidedAt: new Date(now).toISOString(), noResend: true, deliveryConfirmed: false,
        reason: 'owner_authorized_abandonment_of_old_recipe_copy',
        previous: { status: data.status, lastError: data.lastError || null,
          deliveryUnknownAt: data.deliveryUnknownAt || null, maintenanceWork: data.maintenanceWork || null } } };
    if (data.maintenanceWork) patch.maintenanceWork = { ...data.maintenanceWork,
      state: 'cancelled', result: 'operator_abandoned_document_copy', lease: null, leaseUntil: null, completedAt: now };
    tx.update(ref, patch);
    return { result: 'abandoned', resend: false, deliveryConfirmed: false };
  });
}

export async function main(argv = process.argv.slice(2)) {
  const [mode, ...flags] = argv;
  const args = Object.fromEntries(flags.map(arg => {
    const match = /^--([a-z-]+)=(.+)$/.exec(arg); if (!match) fail('ARGUMENT'); return [match[1], match[2]];
  }));
  if (!['plan', 'apply', 'abandon'].includes(mode) || args.project !== PROJECT || args.env !== 'sandbox') fail('TARGET');
  const require = createRequire(new URL('../functions/package.json', import.meta.url));
  const { Firestore } = require('@google-cloud/firestore');
  const { OAuth2Client } = require('google-auth-library');
  const run = (command, parameters) => execFileSync(command, parameters, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const operatorHash = sha(run('gcloud', ['config', 'get-value', 'account']));
  const authClient = new OAuth2Client();
  authClient.setCredentials({ access_token: run('gcloud', ['auth', 'print-access-token']), expiry_date: Date.now() + 3000000 });
  const db = new Firestore({ projectId: PROJECT, authClient });
  try {
    if (mode === 'plan') {
      if (!/^[a-f0-9]{64}$/.test(args['outbox-id'] || '') || !args.output) fail('PLAN_ARGUMENTS');
      const snapshot = await db.doc(`commerce_outbox/${args['outbox-id']}`).get();
      const plan = makePlan(snapshot, { outboxId: args['outbox-id'], commit: run('git', ['rev-parse', 'HEAD']), operatorHash });
      fs.writeFileSync(args.output, JSON.stringify(plan, null, 2), { flag: 'wx', mode: 0o600 });
      console.log(JSON.stringify({ result: 'plan_only', resend: false, proofRequired: true }));
    } else if (mode === 'abandon') {
      if (!args.plan) fail('ABANDON_ARGUMENTS');
      const plan = JSON.parse(fs.readFileSync(args.plan, 'utf8'));
      console.log(JSON.stringify(await abandonResolution({ db, plan, confirm: args.confirm, operatorHash })));
    } else {
      if (!args.plan || !args.evidence || !args.proof) fail('APPLY_ARGUMENTS');
      const plan = JSON.parse(fs.readFileSync(args.plan, 'utf8'));
      const evidence = JSON.parse(fs.readFileSync(args.evidence, 'utf8'));
      if (fs.statSync(args.proof).size > 10 * 1024 * 1024) fail('PROOF_SIZE');
      console.log(JSON.stringify(await applyResolution({ db, plan, evidence, proof: fs.readFileSync(args.proof), confirm: args.confirm, operatorHash })));
    }
  } finally { await db.terminate(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(/^DOCUMENT_RECONCILIATION_/.test(error.message) ? error.message : 'DOCUMENT_RECONCILIATION_FAILED'); process.exitCode = 1; });
}
