'use strict';

const EFFECT_COUNTER_KEYS = Object.freeze([
  'firestoreReads',
  'firestoreWrites',
  'firestoreDeletes',
  'stripeCalls',
  'paymentIntentCreations',
  'stripeCancellations',
  'emailCalls',
  'outboxCreations',
  'stockMovements',
]);

function createEffectLedger() {
  const counters = Object.fromEntries(EFFECT_COUNTER_KEYS.map((key) => [key, 0]));

  return {
    counters,
    record(key, amount = 1) {
      if (!EFFECT_COUNTER_KEYS.includes(key)) {
        throw new Error(`Unknown commerce effect counter: ${key}`);
      }
      if (!Number.isInteger(amount) || amount < 0) {
        throw new Error(`Invalid commerce effect amount for ${key}: ${amount}`);
      }
      counters[key] += amount;
    },
    snapshot() {
      return { ...counters };
    },
  };
}

function assertZeroEffects(context, ledger, label) {
  const snapshot = ledger.snapshot();
  process.stdout.write(`ZERO_EFFECT_COUNTERS ${label} ${JSON.stringify(snapshot)}\n`);
  for (const key of EFFECT_COUNTER_KEYS) {
    context.equal(snapshot[key], 0, `${label}: ${key} must remain zero`);
  }
  return snapshot;
}

module.exports = {
  EFFECT_COUNTER_KEYS,
  assertZeroEffects,
  createEffectLedger,
};
