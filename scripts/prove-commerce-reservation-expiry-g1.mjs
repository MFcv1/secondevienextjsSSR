import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import admin from 'firebase-admin';

const requireFromFunctions = createRequire(
  new URL('../functions/package.json', import.meta.url)
);
const Stripe = requireFromFunctions('stripe');
const {
  createCheckoutRuntime
} = requireFromFunctions('./src/commerce/domain/v2Runtime');
const {
  effectIdFor
} = requireFromFunctions('./src/commerce/domain/reservationRepository');

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const APP_ID = 'secondevie';
const SCOPE_ID = 'fixture_gate6_20260728';
const FUNCTION_NAME = 'commerceReservationExpiryDispatcher';
const SCHEDULER_JOB =
  'firebase-schedule-commerceReservationExpiryDispatcher-europe-west1';
const SCHEDULER_LOCATION = 'us-central1';
const CONFIRMATION =
  'G1_RESERVATION_EXPIRY_STRIPE_TEST_ONLY_NO_REFUND_NO_RESTOCK';

const args = new Map(process.argv.slice(2).map((value) => {
  if (!value.startsWith('--')) throw new Error(`G1_EXPIRY_ARGUMENT_INVALID:${value}`);
  const [key, ...rest] = value.slice(2).split('=');
  return [key, rest.length ? rest.join('=') : 'true'];
}));

function invariant(condition, code) {
  if (!condition) throw new Error(code);
}

function run(command, commandArgs) {
  return execFileSync(command, commandArgs, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}

function currentCommit() {
  return run('git', ['rev-parse', 'HEAD']);
}

function resolvedProject() {
  return run('gcloud', [
    'projects',
    'describe',
    PROJECT_ID,
    `--project=${PROJECT_ID}`,
    '--format=value(projectId)'
  ]);
}

function runScheduler() {
  run('gcloud', [
    'scheduler',
    'jobs',
    'run',
    SCHEDULER_JOB,
    `--location=${SCHEDULER_LOCATION}`,
    `--project=${PROJECT_ID}`
  ]);
}

async function waitFor(getter, predicate, code, timeoutMs = 60_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = await getter();
    if (predicate(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(code);
}

function sanitizedOrder(order) {
  return {
    checkoutStatus: order.checkout?.status || null,
    closeReason: order.checkout?.closeReason || null,
    paymentStatus: order.payment?.status || null,
    inventoryStatus: order.inventorySummary?.status || null,
    heldQty: order.inventorySummary?.heldQty ?? null,
    releasedQty: order.inventorySummary?.releasedQty ?? null
  };
}

async function main() {
  invariant(args.get('project') === PROJECT_ID, 'G1_EXPIRY_PROJECT_REQUIRED');
  invariant(args.get('env') === ENVIRONMENT, 'G1_EXPIRY_ENV_REQUIRED');
  invariant(args.get('commit') === currentCommit(), 'G1_EXPIRY_COMMIT_MISMATCH');
  invariant(resolvedProject() === PROJECT_ID, 'G1_EXPIRY_EFFECTIVE_PROJECT_MISMATCH');

  for (const name of ['FIREBASE_SERVICE_ACCOUNT_JSON', 'STRIPE_SECRET_KEY']) {
    invariant(Boolean(process.env[name]), `G1_EXPIRY_ENV_MISSING:${name}`);
  }

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  invariant(serviceAccount.project_id === PROJECT_ID, 'G1_EXPIRY_CREDENTIAL_PROJECT_MISMATCH');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: PROJECT_ID
    });
  }
  const db = admin.firestore();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const [controlSnap, healthSnap, scopeSnap, openIncidentsSnap, functionJson] =
    await Promise.all([
      db.doc('sys_commerce_control/current').get(),
      db.doc('sys_commerce_operations/current').get(),
      db.doc(`commerce_fixture_scopes/${SCOPE_ID}`).get(),
      db.collection('commerce_incidents').where('status', '==', 'open').limit(1).get(),
      Promise.resolve(JSON.parse(run('gcloud', [
        'functions',
        'describe',
        FUNCTION_NAME,
        '--region=europe-west1',
        `--project=${PROJECT_ID}`,
        '--format=json'
      ])))
    ]);
  invariant(controlSnap.exists && healthSnap.exists && scopeSnap.exists,
    'G1_EXPIRY_PREFLIGHT_EVIDENCE_MISSING');
  const control = controlSnap.data();
  const health = healthSnap.data();
  const scope = scopeSnap.data();
  invariant(
    control.newCheckoutMode === 'v2_all' &&
      control.offlinePaymentMode === 'off' &&
      health.status === 'healthy' &&
      health.truncated === false &&
      openIncidentsSnap.empty,
    'G1_EXPIRY_COMMERCE_NOT_HEALTHY'
  );
  invariant(
    functionJson.status === 'ACTIVE' &&
      functionJson.versionId === '3' &&
      functionJson.serviceAccountEmail ===
        `${'commerce-reservation-expiry'}@${PROJECT_ID}.iam.gserviceaccount.com` &&
      Number(functionJson.maxInstances) === 1,
    'G1_EXPIRY_FUNCTION_DRIFT'
  );

  invariant(
    Array.isArray(scope.fixtureProducts) &&
      scope.fixtureProducts.length > 0 &&
      scope.uids?.length === 1,
    'G1_EXPIRY_FIXTURE_SCOPE_INVALID'
  );
  const fixture = scope.fixtureProducts.find((candidate) =>
    candidate.productId === 'fixture_gate6_stock10_03');
  invariant(fixture, 'G1_EXPIRY_FIXTURE_PRODUCT_IDENTITY_MISSING');
  const productRef = db.doc(
    `artifacts/${APP_ID}/public/data/${fixture.collectionName}/${fixture.productId}`
  );
  let beforeProductSnap = await productRef.get();
  const expectedFixtureProduct = {
    id: fixture.productId,
    schemaVersion: 2,
    name: 'Fixture G1 reservation expiry stock 10',
    description: 'Produit technique isole reserve a la preuve G1 sandbox.',
    status: 'published',
    e2eOnly: true,
    e2ePurpose: 'g1_reservation_expiry_proof',
    fixtureScopeVersion: SCOPE_ID,
    currentPrice: 12,
    stock: 10,
    inventoryVersion: 1,
    commerceVersion: 1,
    priceOnRequest: false,
    seoIndexable: false
  };
  let beforeProduct = beforeProductSnap.exists
    ? beforeProductSnap.data()
    : expectedFixtureProduct;
  invariant(
    !beforeProductSnap.exists || (
      beforeProduct.e2eOnly === true &&
      beforeProduct.e2ePurpose === 'g1_reservation_expiry_proof' &&
      beforeProduct.fixtureScopeVersion === SCOPE_ID
    ),
    'G1_EXPIRY_FIXTURE_PRODUCT_CONFLICT'
  );
  invariant(
    beforeProduct.e2eOnly === true &&
      beforeProduct.status === 'published' &&
      Number.isSafeInteger(beforeProduct.stock) &&
      beforeProduct.stock >= 2 &&
      Number.isSafeInteger(beforeProduct.inventoryVersion),
    'G1_EXPIRY_FIXTURE_PRODUCT_UNSAFE'
  );

  const activePolicySnap = await db.doc(
    `commerce_policy_versions/${control.activePolicyVersion}`
  ).get();
  invariant(activePolicySnap.exists, 'G1_EXPIRY_ACTIVE_POLICY_MISSING');
  const activePolicy = activePolicySnap.data();
  const deliveryMode = activePolicy.deliveryModes?.find((candidate) =>
    candidate.active === true && candidate.countries?.includes('FR'));
  invariant(deliveryMode, 'G1_EXPIRY_DELIVERY_MODE_MISSING');
  const connectedAccountId = activePolicy.stripeConnectedAccountId;
  invariant(/^acct_[A-Za-z0-9]+$/.test(String(connectedAccountId || '')),
    'G1_EXPIRY_CONNECT_ACCOUNT_MISSING');
  const [account, accountStateSnap] = await Promise.all([
    stripe.accounts.retrieve(connectedAccountId),
    db.doc(`commerce_connect_accounts/${connectedAccountId}`).get()
  ]);
  const accountState = accountStateSnap.data();
  invariant(
    process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') &&
      account.livemode !== true &&
      accountStateSnap.exists &&
      accountState?.livemode === false &&
      accountState?.chargesEnabled === true,
    'G1_EXPIRY_STRIPE_LIVE_FORBIDDEN'
  );

  const preflight = {
    schemaVersion: 1,
    verdict: 'G1_RESERVATION_EXPIRY_PREFLIGHT_READY',
    project: PROJECT_ID,
    environment: ENVIRONMENT,
    commit: currentCommit(),
    function: {
      name: FUNCTION_NAME,
      version: functionJson.versionId,
      status: functionJson.status,
      runtimeServiceAccount: functionJson.serviceAccountEmail,
      maxInstances: Number(functionJson.maxInstances)
    },
    fixture: {
      scopeId: SCOPE_ID,
      productIdHash: crypto.createHash('sha256')
        .update(fixture.productId).digest('hex'),
      e2eOnly: true,
      existsBefore: beforeProductSnap.exists,
      willCreateOnApply: !beforeProductSnap.exists,
      stockBefore: beforeProduct.stock,
      inventoryVersionBefore: beforeProduct.inventoryVersion
    },
    stripe: { livemode: false },
    finance: { replay: false, refund: false, restock: false }
  };
  if (args.get('apply') !== 'true') {
    process.stdout.write(`${JSON.stringify(preflight, null, 2)}\n`);
    return;
  }
  invariant(args.get('confirm') === CONFIRMATION, 'G1_EXPIRY_CONFIRMATION_REQUIRED');

  let fixtureCreated = false;
  if (!beforeProductSnap.exists) {
    const now = admin.firestore.Timestamp.now();
    await productRef.create({
      ...expectedFixtureProduct,
      createdAt: now,
      updatedAt: now
    });
    fixtureCreated = true;
    beforeProductSnap = await productRef.get();
    beforeProduct = beforeProductSnap.data();
    invariant(beforeProductSnap.exists, 'G1_EXPIRY_FIXTURE_CREATE_FAILED');
  }

  const runId = `g1_expiry_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const expiresAt = new Date(Date.now() - 60_000).toISOString();
  const checkoutRuntime = createCheckoutRuntime({ db, stripe, appId: APP_ID });
  const checkout = await checkoutRuntime.checkout.createCheckout({
    ownerUid: scope.uids[0],
    ownerEmail: null,
    input: {
      clientOrderId: `client_${runId}`,
      items: [{
        cartLineId: `line_${runId}`,
        cartRevision: 1,
        productId: fixture.productId,
        collectionName: fixture.collectionName,
        variantId: fixture.variantId,
        quantity: 1
      }],
      deliveryModeId: deliveryMode.id,
      shippingAddress: {
        fullName: 'G1 Reservation Expiry',
        line1: '1 rue du Test',
        line2: '',
        postalCode: '75001',
        city: 'Paris',
        country: 'FR'
      }
    },
    checkoutExpiresAt: expiresAt,
    checkoutChannel: 'g1_reservation_expiry_proof',
    checkoutMetadata: { g1RunId: runId }
  });

  const reservationRef = db.doc(
    `inventory_reservations/${checkout.orderId}_${fixture.inventoryKey}`
  );
  const releaseMovementId = effectIdFor(
    'release',
    checkout.orderId,
    fixture.inventoryKey
  );
  const releaseMovementRef = db.doc(`inventory_movements/${releaseMovementId}`);
  const [heldProductSnap, heldReservationSnap, createdIntent] = await Promise.all([
    productRef.get(),
    reservationRef.get(),
    stripe.paymentIntents.retrieve(
      checkout.paymentIntentId,
      {},
      { stripeAccount: checkout.connectedAccountId }
    )
  ]);
  invariant(
    heldProductSnap.data()?.stock === beforeProduct.stock - 1 &&
      heldReservationSnap.data()?.status === 'held' &&
      createdIntent.livemode === false &&
      createdIntent.status !== 'succeeded',
    'G1_EXPIRY_HOLD_NOT_PROVED'
  );

  runScheduler();
  const settled = await waitFor(async () => {
    const [orderSnap, reservationSnap, movementSnap, productSnap] = await Promise.all([
      db.doc(`orders/${checkout.orderId}`).get(),
      reservationRef.get(),
      releaseMovementRef.get(),
      productRef.get()
    ]);
    return {
      order: orderSnap.data(),
      reservation: reservationSnap.data(),
      movement: movementSnap.data(),
      product: productSnap.data()
    };
  }, (value) => (
    value.order?.payment?.status === 'canceled' &&
    value.reservation?.status === 'released' &&
    value.movement?.type === 'release' &&
    value.product?.stock === beforeProduct.stock
  ), 'G1_EXPIRY_FIRST_RUN_TIMEOUT');
  const canceledIntent = await stripe.paymentIntents.retrieve(
    checkout.paymentIntentId,
    {},
    { stripeAccount: checkout.connectedAccountId }
  );
  invariant(canceledIntent.status === 'canceled', 'G1_EXPIRY_PROVIDER_NOT_CANCELED');
  invariant(
    settled.movement.availableDelta === 1 &&
      settled.movement.quantity === 1 &&
      settled.reservation.releasedQty === 1 &&
      settled.reservation.restockedQty === 0,
    'G1_EXPIRY_RELEASE_EFFECT_INVALID'
  );
  const firstMovementUpdateTime = (await releaseMovementRef.get()).updateTime.toMillis();

  runScheduler();
  await new Promise((resolve) => setTimeout(resolve, 5_000));
  const [secondOrderSnap, secondReservationSnap, secondMovementSnap, secondProductSnap] =
    await Promise.all([
      db.doc(`orders/${checkout.orderId}`).get(),
      reservationRef.get(),
      releaseMovementRef.get(),
      productRef.get()
    ]);
  invariant(
    secondMovementSnap.updateTime.toMillis() === firstMovementUpdateTime &&
      secondProductSnap.data()?.stock === beforeProduct.stock &&
      secondReservationSnap.data()?.releasedQty === 1 &&
      secondReservationSnap.data()?.restockedQty === 0 &&
      secondOrderSnap.data()?.payment?.status === 'canceled',
    'G1_EXPIRY_IDEMPOTENCE_FAILED'
  );

  process.stdout.write(`${JSON.stringify({
    ...preflight,
    verdict: 'G1_RESERVATION_EXPIRY_STRIPE_TEST_IDEMPOTENT_PROVED',
    run: {
      runId,
      fixtureCreated,
      orderIdHash: crypto.createHash('sha256')
        .update(checkout.orderId).digest('hex'),
      paymentIntentIdHash: crypto.createHash('sha256')
        .update(checkout.paymentIntentId).digest('hex'),
      expiresAt,
      providerCanceledBeforeReleaseObserved: true,
      firstRun: {
        order: sanitizedOrder(settled.order),
        reservationStatus: settled.reservation.status,
        movementType: settled.movement.type,
        availableDelta: settled.movement.availableDelta
      },
      secondRun: {
        movementUnchanged: true,
        stockUnchanged: true,
        releasedQty: secondReservationSnap.data().releasedQty
      }
    }
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error?.code || error?.message || 'G1_EXPIRY_UNKNOWN_ERROR'}\n`);
  process.exitCode = 1;
});
