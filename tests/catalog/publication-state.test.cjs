const assert = require('node:assert/strict');
const test = require('node:test');
const {
  acquireLease,
  assertLease,
  computeQuietUntil,
  initialPublicationState,
  isLeaseActive,
} = require('../../functions/src/catalog/publicationState');

test('lease is exclusive, expires and binds a monotone target revision', () => {
  const now = new Date('2026-07-17T00:00:00.000Z');
  const state = { ...initialPublicationState(now), mode: 'shadow', dirty: true, desiredRevision: 5 };
  const lease = acquireLease(state, { targetRevision: 5, token: 'lease-a', now, durationMs: 1000 });
  const leased = { ...state, ...lease };
  assert.equal(isLeaseActive(leased, now.getTime()), true);
  assert.equal(acquireLease(leased, { targetRevision: 5, token: 'lease-b', now }), null);
  assert.equal(assertLease(leased, 'lease-a', 5, now.getTime()), true);
  assert.throws(() => assertLease(leased, 'lease-a', 5, now.getTime() + 1001), /LEASE_EXPIRED/);
  assert.throws(() => assertLease({ ...leased, desiredRevision: 6 }, 'lease-a', 5, now.getTime()), /BUILD_OBSOLETE/);
});

test('debounce uses a one-second stock window and caps the batch age', () => {
  const start = new Date('2026-07-17T00:00:00.000Z');
  assert.equal(computeQuietUntil({ dirtySince: start, nowMs: start.getTime(), publicFields: ['stock'] }).getTime(), start.getTime() + 1000);
  assert.equal(computeQuietUntil({ dirtySince: start, nowMs: start.getTime() + 4900, publicFields: ['stock'] }).getTime(), start.getTime() + 5000);
  assert.equal(computeQuietUntil({ dirtySince: start, nowMs: start.getTime(), publicFields: ['name'] }).getTime(), start.getTime() + 5000);
});
