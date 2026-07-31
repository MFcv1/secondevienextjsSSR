import crypto from 'node:crypto';
import process from 'node:process';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldPath, FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const FALLBACK_CHECKOUT_MODE = 'v2_fixture';
const MAX_WINDOW_MINUTES = 60;
const V2_ALL_POLICY_VERSION = 'sandbox_v2all_policy_20260729';
const PRODUCT_DISCOVERY_LIMIT = 250;
const PRODUCT_DISCOVERY_MAX_PAGES = 10;

function buildV2AllPolicy(sourcePolicy) {
  return {
    schemaVersion: 2,
    version: V2_ALL_POLICY_VERSION,
    currency: 'EUR',
    offlinePaymentEnabled: false,
    stripeConnectedAccountId: sourcePolicy.stripeConnectedAccountId,
    holdDurationSeconds: sourcePolicy.holdDurationSeconds,
    deliveryModes: [
      {
        id: 'delivery-pickup',
        active: true,
        shippingCents: 0,
        countries: ['FR']
      },
      {
        id: 'delivery-local',
        active: true,
        shippingCents: 4900,
        countries: ['FR'],
        postalPrefixes: ['13']
      },
      {
        id: 'delivery-carrier',
        active: true,
        shippingCents: 9000,
        countries: ['FR']
      }
    ],
    active: true
  };
}

function policyMatches(actual, expected) {
  return [
    'schemaVersion',
    'version',
    'currency',
    'offlinePaymentEnabled',
    'stripeConnectedAccountId',
    'holdDurationSeconds',
    'active'
  ].every((field) => actual?.[field] === expected[field]) &&
    JSON.stringify(actual?.deliveryModes) === JSON.stringify(expected.deliveryModes);
}

function parseArgs(argv) {
  return new Map(argv.map((argument) => {
    if (!argument.startsWith('--')) throw new Error(`Argument inconnu: ${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    return [key, parts.length ? parts.join('=') : 'true'];
  }));
}

function invariant(condition, code) {
  if (!condition) throw new Error(code);
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function safeRunId(value) {
  invariant(
    /^run_v2all_[A-Za-z0-9_-]{8,100}$/.test(String(value || '')),
    'V2_ALL_RUN_ID_INVALID'
  );
  return value;
}

function parseProductIds(value) {
  const productIds = String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  invariant(productIds.length === 5, 'V2_ALL_EXACTLY_FIVE_PRODUCTS_REQUIRED');
  invariant(new Set(productIds).size === productIds.length, 'V2_ALL_PRODUCTS_MUST_BE_UNIQUE');
  invariant(
    productIds.every((productId) => /^[A-Za-z0-9_-]{8,80}$/.test(productId)),
    'V2_ALL_PRODUCT_ID_INVALID'
  );
  return productIds;
}

function healthCountersAreZero(counters = {}) {
  return [
    'dueInbox',
    'expiredInboxLeases',
    'deadLetterOutbox',
    'deliveryUnknown',
    'expiredHolds',
    'orphanPayments',
    'refundStockDivergences',
    'connectDrift',
    'projectionDivergences'
  ].every((key) => counters[key] === 0);
}

function productPrice(product) {
  return product.currentPrice ?? product.startingPrice ?? product.price;
}

function availableProduct(snapshot) {
  const product = snapshot.data();
  const price = productPrice(product);
  const inventoryVersion = product.inventoryVersion ?? 0;
  return snapshot.exists &&
    product.status === 'published' &&
    product.sold !== true &&
    product.e2eOnly !== true &&
    product.priceOnRequest !== true &&
    !String(product.name || product.title || '').toUpperCase().startsWith('[RECETTE') &&
    Number.isSafeInteger(product.stock) &&
    product.stock >= 1 &&
    Number.isSafeInteger(inventoryVersion) &&
    inventoryVersion >= 0 &&
    typeof price === 'number' &&
    Number.isFinite(price) &&
    price > 0;
}

function serializeProduct(snapshot) {
  const product = snapshot.data();
  return {
    productId: snapshot.id,
    name: String(product.name || product.title || snapshot.id).slice(0, 120),
    price: productPrice(product),
    stock: product.stock,
    inventoryVersion: product.inventoryVersion ?? 0
  };
}

async function discoverProducts(db) {
  const candidates = [];
  let cursor = null;
  for (let page = 0; page < PRODUCT_DISCOVERY_MAX_PAGES; page += 1) {
    let query = db
      .collection('artifacts/secondevie/public/data/furniture')
      .orderBy(FieldPath.documentId())
      .limit(PRODUCT_DISCOVERY_LIMIT);
    if (cursor) query = query.startAfter(cursor);
    const snapshots = await query.get();
    candidates.push(...snapshots.docs.filter(availableProduct).map(serializeProduct));
    if (candidates.length >= 5 || snapshots.size < PRODUCT_DISCOVERY_LIMIT) break;
    cursor = snapshots.docs.at(-1);
  }
  return candidates
    .sort((left, right) =>
      left.price - right.price || left.productId.localeCompare(right.productId)
    )
    .slice(0, 5);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectId = args.get('project');
  const environment = args.get('env') || ENVIRONMENT;
  const action = args.get('action') || 'preflight';
  const runId = action === 'status' ? null : safeRunId(args.get('run-id'));
  const buyerRequired = ['discover', 'preflight', 'open'].includes(action);
  const productsRequired = ['preflight', 'open'].includes(action);
  const buyerEmail = buyerRequired
    ? String(args.get('buyer-email') || '').trim().toLowerCase()
    : null;
  const productIds = productsRequired ? parseProductIds(args.get('products')) : [];
  const durationMinutes = Number(args.get('duration-minutes') || 45);

  invariant(projectId === PROJECT_ID && environment === ENVIRONMENT, 'V2_ALL_TARGET_INVALID');
  invariant(
    ['status', 'discover', 'preflight', 'open', 'close'].includes(action),
    'V2_ALL_ACTION_INVALID'
  );
  invariant(
    !buyerRequired || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(buyerEmail),
    'V2_ALL_BUYER_EMAIL_INVALID'
  );
  invariant(
    Number.isSafeInteger(durationMinutes) &&
      durationMinutes >= 5 &&
      durationMinutes <= MAX_WINDOW_MINUTES,
    'V2_ALL_DURATION_INVALID'
  );
  const app = getApps().find((entry) => entry.name === 'commerce-v2-all-window') || initializeApp({
    credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
      : applicationDefault(),
    projectId
  }, 'commerce-v2-all-window');
  const db = getFirestore(app);
  const auth = getAuth(app);
  const buyer = buyerRequired ? await auth.getUserByEmail(buyerEmail) : null;
  invariant(
    !buyerRequired || (buyer.disabled !== true && buyer.emailVerified === true),
    'V2_ALL_BUYER_NOT_READY'
  );

  const refs = {
    control: db.doc('sys_commerce_control/current'),
    operations: db.doc('sys_commerce_operations/current'),
    run: runId ? db.doc(`commerce_gate_runs/${runId}`) : null,
    sourcePolicy: null,
    v2AllPolicy: db.doc(`commerce_policy_versions/${V2_ALL_POLICY_VERSION}`),
    products: productIds.map((productId) => db.doc(
      `artifacts/secondevie/public/data/furniture/${productId}`
    ))
  };
  const [controlSnap, operationsSnap, runSnap] = await Promise.all([
    refs.control.get(),
    refs.operations.get(),
    refs.run ? refs.run.get() : Promise.resolve(null)
  ]);
  invariant(controlSnap.exists && operationsSnap.exists, 'V2_ALL_PREFLIGHT_EVIDENCE_MISSING');
  const control = controlSnap.data();
  const operations = operationsSnap.data();

  if (action === 'status') {
    console.log(JSON.stringify({
      ok: true,
      status: control.newCheckoutMode === 'v2_all' ? 'OPEN' : 'CLOSED',
      projectId,
      environment,
      controlRevision: control.controlRevision,
      checkoutMode: control.newCheckoutMode,
      adminMutationMode: control.adminMutationMode,
      offlinePaymentMode: control.offlinePaymentMode,
      activePolicyVersion: control.activePolicyVersion,
      activeRunId: control.v2AllRunId || null,
      expiresAt: control.v2AllExpiresAt?.toDate?.().toISOString?.() || null,
      operationsStatus: operations.status,
      counters: operations.counters || {}
    }));
    return;
  }

  if (action === 'close') {
    invariant(
      args.get('confirm') === `CLOSE_V2_ALL_${runId}_${PROJECT_ID}`,
      'V2_ALL_CONFIRMATION_INVALID'
    );
    invariant(
      control.newCheckoutMode === 'v2_all' &&
        control.adminMutationMode === 'v2' &&
        control.v2AllRunId === runId &&
        runSnap.exists &&
        runSnap.data()?.status === 'open',
      'V2_ALL_WINDOW_NOT_OPEN'
    );
    const closedAt = Timestamp.now();
    await db.runTransaction(async (transaction) => {
      const [freshControl, freshRun] = await Promise.all([
        transaction.get(refs.control),
        transaction.get(refs.run)
      ]);
      invariant(
        freshControl.data()?.controlRevision === control.controlRevision &&
          freshControl.data()?.newCheckoutMode === 'v2_all' &&
          freshControl.data()?.adminMutationMode === 'v2' &&
          freshControl.data()?.activePolicyVersion === V2_ALL_POLICY_VERSION &&
          freshControl.data()?.v2AllRunId === runId &&
          freshRun.data()?.status === 'open' &&
          typeof freshRun.data()?.previousActivePolicyVersion === 'string',
        'V2_ALL_CLOSE_PRECONDITION_CHANGED'
      );
      transaction.update(refs.control, {
        newCheckoutMode: FALLBACK_CHECKOUT_MODE,
        adminMutationMode: 'read_only',
        activePolicyVersion: freshRun.data().previousActivePolicyVersion,
        controlRevision: control.controlRevision + 1,
        v2AllRunId: FieldValue.delete(),
        v2AllExpiresAt: FieldValue.delete(),
        updatedAt: closedAt,
        updatedBy: 'commerce-v2-all-window-close'
      });
      transaction.update(refs.run, {
        status: 'closed',
        controlRevisionClosed: control.controlRevision + 1,
        closedAt
      });
    });
    console.log(JSON.stringify({
      ok: true,
      status: 'CLOSED',
      runId,
      controlRevision: control.controlRevision + 1,
      checkoutMode: FALLBACK_CHECKOUT_MODE,
      adminMutationMode: 'read_only'
    }));
    return;
  }

  if (action === 'discover') {
    invariant(
      control.newCheckoutMode === FALLBACK_CHECKOUT_MODE &&
        control.adminMutationMode === 'read_only' &&
        control.offlinePaymentMode === 'off' &&
        operations.status === 'healthy' &&
        healthCountersAreZero(operations.counters) &&
        !runSnap.exists,
      'V2_ALL_DISCOVERY_CONTROL_NOT_CLOSED'
    );
    const products = await discoverProducts(db);
    invariant(products.length === 5, 'V2_ALL_DISCOVERY_NOT_ENOUGH_PRODUCTS');
    console.log(JSON.stringify({
      ok: true,
      status: 'DISCOVERED',
      projectId,
      environment,
      runId,
      controlRevision: control.controlRevision,
      operationsStatus: operations.status,
      buyerUidHash: hash(buyer.uid),
      productIds: products.map((product) => product.productId),
      products
    }));
    return;
  }

  refs.sourcePolicy = db.doc(`commerce_policy_versions/${control.activePolicyVersion}`);
  const [sourcePolicySnap, v2AllPolicySnap, ...productSnaps] = await Promise.all([
    refs.sourcePolicy.get(),
    refs.v2AllPolicy.get(),
    ...refs.products.map((reference) => reference.get())
  ]);
  invariant(sourcePolicySnap.exists, 'V2_ALL_SOURCE_POLICY_MISSING');
  const sourcePolicy = sourcePolicySnap.data();
  const v2AllPolicy = buildV2AllPolicy(sourcePolicy);
  invariant(
    typeof v2AllPolicy.stripeConnectedAccountId === 'string' &&
      /^acct_[A-Za-z0-9]{8,}$/.test(v2AllPolicy.stripeConnectedAccountId) &&
      Number.isSafeInteger(v2AllPolicy.holdDurationSeconds) &&
      v2AllPolicy.holdDurationSeconds > 0 &&
      (!v2AllPolicySnap.exists || policyMatches(v2AllPolicySnap.data(), v2AllPolicy)),
    'V2_ALL_POLICY_INVALID'
  );
  invariant(
    control.offlinePaymentMode === 'off' &&
      typeof control.activePolicyVersion === 'string' &&
      typeof control.releaseManifestId === 'string' &&
      operations.status === 'healthy' &&
      healthCountersAreZero(operations.counters),
    'V2_ALL_PREFLIGHT_INVARIANT_FAILED'
  );

  const products = productSnaps.map((snapshot, index) => {
    const productId = productIds[index];
    invariant(snapshot.exists, `V2_ALL_PRODUCT_MISSING:${productId}`);
    invariant(availableProduct(snapshot), `V2_ALL_PRODUCT_UNAVAILABLE:${productId}`);
    return serializeProduct(snapshot);
  });

  if (action === 'preflight') {
    invariant(
      control.newCheckoutMode === FALLBACK_CHECKOUT_MODE &&
        control.adminMutationMode === 'read_only' &&
        !runSnap.exists,
      'V2_ALL_PREFLIGHT_CONTROL_NOT_CLOSED'
    );
    console.log(JSON.stringify({
      ok: true,
      status: 'READY',
      projectId,
      environment,
      runId,
      controlRevision: control.controlRevision,
      operationsStatus: operations.status,
      sourcePolicyVersion: control.activePolicyVersion,
      v2AllPolicyVersion: V2_ALL_POLICY_VERSION,
      buyerUidHash: hash(buyer.uid),
      products
    }));
    return;
  }

  const confirmation = args.get('confirm');
  invariant(
    confirmation === `${action.toUpperCase()}_V2_ALL_${runId}_${PROJECT_ID}`,
    'V2_ALL_CONFIRMATION_INVALID'
  );

  if (action === 'open') {
    invariant(
      control.newCheckoutMode === FALLBACK_CHECKOUT_MODE &&
        control.adminMutationMode === 'read_only' &&
        !runSnap.exists,
      'V2_ALL_WINDOW_ALREADY_OPEN'
    );
    const openedAt = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(
      openedAt.toMillis() + durationMinutes * 60 * 1000
    );
    await db.runTransaction(async (transaction) => {
      const [
        freshControl,
        freshOperations,
        freshRun,
        freshSourcePolicy,
        freshV2AllPolicy,
        ...freshProducts
      ] = await Promise.all([
        transaction.get(refs.control),
        transaction.get(refs.operations),
        transaction.get(refs.run),
        transaction.get(refs.sourcePolicy),
        transaction.get(refs.v2AllPolicy),
        ...refs.products.map((reference) => transaction.get(reference))
      ]);
      invariant(
        freshControl.data()?.controlRevision === control.controlRevision &&
          freshControl.data()?.newCheckoutMode === FALLBACK_CHECKOUT_MODE &&
          freshControl.data()?.adminMutationMode === 'read_only' &&
          freshOperations.data()?.status === 'healthy' &&
          healthCountersAreZero(freshOperations.data()?.counters) &&
          !freshRun.exists &&
          freshSourcePolicy.exists &&
          freshSourcePolicy.data()?.version === control.activePolicyVersion &&
          (!freshV2AllPolicy.exists || policyMatches(freshV2AllPolicy.data(), v2AllPolicy)),
        'V2_ALL_OPEN_PRECONDITION_CHANGED'
      );
      freshProducts.forEach((snapshot, index) => {
        const product = snapshot.data();
        invariant(
          snapshot.exists &&
            product.status === 'published' &&
            product.sold !== true &&
            product.e2eOnly !== true &&
            product.priceOnRequest !== true &&
            product.stock === products[index].stock &&
            (product.inventoryVersion ?? 0) === products[index].inventoryVersion &&
            productPrice(product) === products[index].price,
          `V2_ALL_PRODUCT_CHANGED:${productIds[index]}`
        );
      });
      if (!freshV2AllPolicy.exists) {
        transaction.create(refs.v2AllPolicy, {
          ...v2AllPolicy,
          createdAt: openedAt,
          updatedAt: openedAt
        });
      }
      transaction.update(refs.control, {
        newCheckoutMode: 'v2_all',
        adminMutationMode: 'v2',
        activePolicyVersion: V2_ALL_POLICY_VERSION,
        controlRevision: control.controlRevision + 1,
        v2AllRunId: runId,
        v2AllExpiresAt: expiresAt,
        updatedAt: openedAt,
        updatedBy: 'commerce-v2-all-window-open'
      });
      transaction.create(refs.run, {
        schemaVersion: 1,
        runId,
        status: 'open',
        environment,
        projectId,
        releaseManifestId: control.releaseManifestId,
        previousActivePolicyVersion: control.activePolicyVersion,
        activePolicyVersion: V2_ALL_POLICY_VERSION,
        buyerUidHash: hash(buyer.uid),
        buyerEmailHash: hash(buyerEmail),
        products,
        controlRevisionOpened: control.controlRevision + 1,
        openedAt,
        expiresAt
      });
    });
    console.log(JSON.stringify({
      ok: true,
      status: 'OPEN',
      runId,
      controlRevision: control.controlRevision + 1,
      activePolicyVersion: V2_ALL_POLICY_VERSION,
      expiresAt: expiresAt.toDate().toISOString(),
      products
    }));
    return;
  }

}

try {
  await main();
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: String(error?.message || error)
  }));
  process.exitCode = 1;
}
