import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { candidate, makePlan, applyResolution, abandonResolution } from '../../scripts/reconcile-document-delivery.mjs';

const now = Date.parse('2026-09-10T18:00:00Z');
test('abandon autorisé : aucune livraison prétendue, trace conservée et répétition sans effet', async () => {
  const f = fixture();
  const input = { ...f.input, confirm: `ABANDON_UNCERTAIN_COPY_NO_RESEND_${f.input.plan.outboxId}_${f.input.plan.fingerprint}` };
  assert.equal((await abandonResolution(input)).result, 'abandoned');
  assert.equal(f.data.status, 'suppressed_stale');
  assert.equal(f.data.sentAt, undefined);
  assert.equal(f.data.lastError, 'GMAIL_DELIVERY_UNKNOWN');
  assert.equal(f.data.deliveryAbandonment.deliveryConfirmed, false);
  assert.equal((await abandonResolution(input)).result, 'already_abandoned');
  assert.equal(f.writes, 1);
});
test('abandon refuse confirmation générique et changement concurrent', async () => {
  const f = fixture();
  await assert.rejects(abandonResolution(f.input), /ABANDON_CONFIRMATION/);
  f.input.confirm = `ABANDON_UNCERTAIN_COPY_NO_RESEND_${f.input.plan.outboxId}_${f.input.plan.fingerprint}`;
  f.change({ changed: true });
  await assert.rejects(abandonResolution(f.input), /SOURCE_CHANGED/);
  assert.equal(f.writes, 0);
});
function fixture(extra = {}) {
  let data = { status: 'delivery_unknown', template: 'commerce-document-copy', aggregateType: 'commerce_document',
    aggregateId: 'ord_example', recipientRole: 'customer', recipientHash: 'c'.repeat(64),
    payloadSnapshot: { orderId: 'ord_example', documentId: 'doc_example' }, attemptCount: 1,
    createdAt: '2026-09-08T14:07:07Z', lastError: 'GMAIL_DELIVERY_UNKNOWN',
    deliveryUnknownAt: '2026-09-08T14:07:30Z', nextAttemptAt: null, processingUntil: null, leaseToken: null, ...extra };
  let nanos = 123, writes = 0;
  const snapshot = () => ({ exists: true, data: () => structuredClone(data), updateTime: { seconds: 1, nanoseconds: nanos } });
  const outboxId = 'a'.repeat(64), operatorHash = 'b'.repeat(64);
  const plan = makePlan(snapshot(), { outboxId, commit: 'd'.repeat(40), operatorHash, now });
  const proof = Buffer.from('reviewed delivery evidence fixture');
  const evidence = { schemaVersion: 1, outboxId, orderId: plan.orderId, documentId: plan.documentId,
    recipientHash: plan.recipientHash, attemptCount: 1, observation: 'recipient_received',
    proofSha256: crypto.createHash('sha256').update(proof).digest('hex'),
    observedAt: '2026-09-10T17:00:00Z', sentAt: '2026-09-08T14:07:20Z' };
  const db = { doc: path => { assert.equal(path, `commerce_outbox/${outboxId}`); return path; },
    runTransaction: async fn => {
      let patch;
      const result = await fn({ get: async () => snapshot(), update: (_ref, value) => { patch = value; } });
      if (patch) { data = { ...data, ...patch }; nanos++; writes++; }
      return result;
    } };
  const input = { db, plan, evidence, proof, operatorHash, now,
    confirm: `CONFIRM_DELIVERED_NO_RESEND_${outboxId}_${evidence.proofSha256}` };
  return { input, get data() { return data; }, get writes() { return writes; }, change: patch => { data = { ...data, ...patch }; nanos++; } };
}

test('livraison document confirmée : une écriture, preuve conservée et répétition sans effet', async () => {
  const f = fixture();
  assert.deepEqual(await applyResolution(f.input), { result: 'resolved', resend: false });
  assert.equal(f.data.status, 'sent');
  assert.equal(f.data.sentAt, f.input.evidence.sentAt);
  assert.equal(f.data.deliveryReconciliation.previous.lastError, 'GMAIL_DELIVERY_UNKNOWN');
  assert.equal(f.data.providerMessageId, undefined);
  assert.deepEqual(await applyResolution(f.input), { result: 'already_resolved', resend: false });
  assert.equal(f.writes, 1);
});

test('preuve absente, timeout seul, mauvais destinataire, mauvaise date ou confirmation refusés', async () => {
  for (const modify of [
    input => { input.proof = Buffer.alloc(0); },
    input => { input.evidence.observation = 'smtp_timeout'; },
    input => { input.evidence.recipientHash = 'e'.repeat(64); },
    input => { input.evidence.sentAt = '2026-09-01T00:00:00Z'; },
    input => { input.evidence.proofSha256 = 'e'.repeat(64); },
    input => { input.confirm = 'yes'; },
    input => { input.plan.project = 'production'; },
    input => { input.plan.orderId = input.evidence.orderId = 'ord_other'; }
  ]) {
    const f = fixture(); modify(f.input);
    await assert.rejects(applyResolution(f.input), /DOCUMENT_RECONCILIATION_/);
    assert.equal(f.writes, 0);
  }
});

test('un changement concurrent même de métadonnées invalide le plan', async () => {
  const f = fixture(); f.change({ newMetadata: true });
  await assert.rejects(applyResolution(f.input), /SOURCE_CHANGED/);
  assert.equal(f.writes, 0);
});

test('une preuve ne peut pas résoudre un autre template ou un travail actif', () => {
  for (const patch of [{ template: 'order-refunded-admin' }, { status: 'processing' },
    { nextAttemptAt: now }, { recipientRole: 'admin' }, { providerMessageId: 'already-known' },
    { maintenanceWork: { kind: 'outbox', state: 'running' } }]) {
    assert.throws(() => fixture(patch), /DOCUMENT_RECONCILIATION_/);
  }
  assert.throws(() => candidate(null), /CANDIDATE/);
});

test('un suivi durable en attention est clôturé dans la même transaction', async () => {
  const f = fixture({ maintenanceWork: { kind: 'outbox', state: 'needs_attention', lease: null, generation: 4 } });
  await applyResolution(f.input);
  assert.equal(f.data.maintenanceWork.state, 'succeeded');
  assert.equal(f.data.maintenanceWork.generation, 4);
  assert.equal(f.data.maintenanceWork.completedAt, now);
});
