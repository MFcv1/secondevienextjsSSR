'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  assertLegacyOrderCreationBlocked,
  mayReleaseLegacyReservation,
  readLegacyContainmentControl,
} = require('../../../functions/src/commerce/legacyContainment');
const { EFFECT_COUNTER_KEYS, assertZeroEffects } = require('../runner/effect-ledger.cjs');

const repositoryRoot = path.resolve(__dirname, '..', '..', '..');
const MUTATION_EFFECT_KEYS = EFFECT_COUNTER_KEYS.filter((key) => key !== 'firestoreReads');

class HttpsError extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

const fakeFunctions = { https: { HttpsError } };

function fakeControlDb(context, { exists = false, data = {}, reject = false } = {}) {
  return {
    doc(documentPath) {
      context.equal(documentPath, 'sys_commerce_control/current');
      return {
        async get() {
          context.effects.record('firestoreReads');
          if (reject) throw new Error('control unavailable');
          return {
            exists,
            data: () => data,
          };
        },
      };
    },
  };
}

function assertNoMutationEffects(context, label) {
  const snapshot = context.effects.snapshot();
  process.stdout.write(`ZERO_MUTATION_EFFECT_COUNTERS ${label} ${JSON.stringify(snapshot)}\n`);
  for (const key of MUTATION_EFFECT_KEYS) {
    context.equal(snapshot[key], 0, `${label}: ${key} must remain zero`);
  }
}

async function expectContainment(context, promise, action) {
  await context.rejects(
    () => promise,
    (error) => {
      context.equal(error.code, 'failed-precondition');
      context.equal(error.details?.reason, 'COMMERCE_READ_ONLY');
      context.equal(error.details?.action, action);
      return true;
    },
  );
}

function readSource(relativePath) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

const scenarios = {
  'effect-ledger-zero-is-explicit': async (context) => {
    const snapshot = assertZeroEffects(context, context.effects, 'gate-0a-empty-ledger');
    context.deepEqual(Object.keys(snapshot), EFFECT_COUNTER_KEYS);
  },

  'effect-ledger-counts-all-required-effects': async (context) => {
    for (const key of EFFECT_COUNTER_KEYS) context.effects.record(key);
    context.deepEqual(
      context.effects.snapshot(),
      Object.fromEntries(EFFECT_COUNTER_KEYS.map((key) => [key, 1])),
      'every required commerce effect must be countable',
    );
  },

  'runner-blocks-hosted-network': async (context) => {
    context.equal(process.env.COMMERCE_TEST_NETWORK_DISABLED, '1');
    await context.rejects(
      () => fetch('https://example.invalid/commerce-sentinel'),
      /Hosted network access is forbidden/,
    );
    assertZeroEffects(context, context.effects, 'gate-0a-network-guard');
  },

  'control-absent-fails-closed-before-effects': async (context) => {
    const db = fakeControlDb(context);
    await expectContainment(
      context,
      assertLegacyOrderCreationBlocked({ db, functions: fakeFunctions, paymentMethod: 'stripe' }),
      'legacy-order-creation',
    );
    context.equal(context.effects.snapshot().firestoreReads, 1);
    assertNoMutationEffects(context, 'gate-0b-control-absent');
  },

  'control-off-or-unknown-cannot-reenable-commerce': async (context) => {
    for (const legacyMode of ['off', 'enabled', 'unexpected-value']) {
      const db = fakeControlDb(context, { exists: true, data: { legacyMode } });
      const control = await readLegacyContainmentControl(db);
      context.equal(control.newLegacyOrders, false);
      context.equal(control.newLegacyPaymentIntents, false);
      context.equal(control.offlinePayments, false);
      context.equal(control.adminMutations, false);
    }
    const unreadable = await readLegacyContainmentControl(fakeControlDb(context, { reject: true }));
    context.equal(unreadable.source, 'unreadable');
    context.equal(unreadable.newLegacyOrders, false);
    context.equal(context.effects.snapshot().firestoreReads, 4);
    assertNoMutationEffects(context, 'gate-0b-control-unknown');
  },

  'manual-and-deferred-orders-are-blocked': async (context) => {
    for (const paymentMethod of ['manual', 'deferred']) {
      await expectContainment(
        context,
        assertLegacyOrderCreationBlocked({
          db: fakeControlDb(context, { exists: true, data: { legacyMode: 'enabled' } }),
          functions: fakeFunctions,
          paymentMethod,
        }),
        'offline-payment',
      );
    }
    context.equal(context.effects.snapshot().firestoreReads, 2);
    assertNoMutationEffects(context, 'gate-0b-offline-payments');
  },

  'ambiguous-payment-outcomes-never-release-stock': async (context) => {
    for (const status of [
      undefined,
      'processing',
      'requires_action',
      'requires_payment_method',
      'succeeded',
      'unknown',
    ]) {
      context.equal(mayReleaseLegacyReservation(status), false, `${status || 'missing'} must retain stock`);
    }
    context.equal(mayReleaseLegacyReservation('canceled'), true, 'only Stripe canceled is terminal proof');
    assertZeroEffects(context, context.effects, 'gate-0b-ambiguous-payment');
  },

  'commerce-ui-is-active-with-server-side-guards': async (context) => {
    const checkout = readSource('src/kit/commerce/CheckoutView.jsx');
    const consumers = readSource('src/kit/commerce/commerceV2Client.js');
    const commands = readSource('src/kit/commerce/commerceCommandClient.js');
    const uiFlags = readSource('src/kit/commerce/commerceUiFlags.js');
    const orders = readSource('src/kit/commerce/MyOrdersView.jsx');
    const adminIsland = readSource('app/admin/AdminAppIsland.jsx');
    const dashboard = readSource('src/kit/admin/AdminDashboard.jsx');

    context.ok(!checkout.includes('const COMMERCE_READ_ONLY'));
    context.ok(consumers.includes("import { COMMERCE_V2_UI_ENABLED } from './commerceUiFlags.js'"));
    context.ok(consumers.includes('COMMERCE_V2_ORDER_READERS_ENABLED = true'));
    context.ok(consumers.includes('COMMERCE_V2_ADMIN_READERS_ENABLED = true'));
    context.ok(commands.includes('COMMERCE_V2_CLIENT_COMMANDS_ENABLED = COMMERCE_V2_UI_ENABLED'));
    context.ok(uiFlags.includes('COMMERCE_V2_UI_ENABLED = true'));
    context.ok(!uiFlags.includes('commerceEnv.'));
    context.ok(!checkout.includes('Paiement temporairement indisponible'));
    context.ok(checkout.includes("Quitter l'ecran Stripe ne compense jamais"));
    context.ok(!checkout.includes("httpsCallable(functions, 'cancelOrderClient')"));
    context.ok(orders.includes('sandbox. Ils ne constituent ni une facture ni un avoir fiscal'));
    context.ok(!orders.includes('generateCommerceDocument'));
    context.ok(orders.includes('COMMERCE_V2_CLIENT_COMMANDS_ENABLED && canCancel(order)'));
    context.ok(!orders.includes('FAC-{'));
    context.ok(!adminIsland.includes('COMMERCE_READ_ONLY_TABS'));
    context.ok(!adminIsland.includes('inert=""'));
    context.ok(dashboard.includes('commerceStatus.data?.operations?.projection'));
    context.ok(!dashboard.includes('Actions critiques'));
    assertZeroEffects(context, context.effects, 'gate-0b-active-ui-contract');
  },
};

module.exports = { scenarios };
