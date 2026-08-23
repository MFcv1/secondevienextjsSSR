import assert from 'node:assert/strict';
import test from 'node:test';

import {
  validateOutboxCandidate,
  validateReconciliationInput
} from '../../scripts/reconcile-commerce-outbox-delivery.mjs';

const outboxId = 'a'.repeat(64);
const orderId = 'ord_fixture_1';
const baseInput = {
  project: 'secondevienextjsssr',
  environment: 'sandbox',
  outboxId,
  orderId,
  commit: 'b'.repeat(40),
  evidence: 'gmail_admin_m11_observed',
  apply: false
};

test('la reconciliation Gmail est bornee au sandbox et ne requiert pas de renvoi', () => {
  assert.deepEqual(validateReconciliationInput(baseInput), baseInput);
  assert.throws(() => validateReconciliationInput({ ...baseInput, project: 'production' }));
  assert.throws(() => validateReconciliationInput({
    ...baseInput,
    apply: true,
    confirm: 'wrong'
  }));
});

test('seule une confirmation admin refund ambigue et correlee peut devenir sent', () => {
  const candidate = {
    status: 'delivery_unknown',
    template: 'order-refunded-admin',
    aggregateType: 'order',
    aggregateId: orderId,
    recipientRole: 'admin',
    attemptCount: 1
  };
  assert.equal(validateOutboxCandidate(candidate, baseInput), true);
  assert.throws(() => validateOutboxCandidate({ ...candidate, status: 'failed' }, baseInput));
  assert.throws(() => validateOutboxCandidate({ ...candidate, aggregateId: 'ord_other' }, baseInput));
});
