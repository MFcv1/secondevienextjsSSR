import crypto from 'node:crypto';
import process from 'node:process';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const FALLBACK_CHECKOUT_MODE = 'v2_fixture';
const MAX_WINDOW_MINUTES = 60;

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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectId = args.get('project');
  const environment = args.get('env') || ENVIRONMENT;
  const action = args.get('action') || 'preflight';
  const runId = safeRunId(args.get('run-id'));
  const buyerEmail = String(args.get('buyer-email') || '').trim().toLowerCase();
  const productIds = parseProductIds(args.get('products'));
  const durationMinutes = Number(args.get('duration-minutes') || 45);

  invariant(projectId === PROJECT_ID && environment === ENVIRONMENT, 'V2_ALL_TARGET_INVALID');
  invariant(['preflight', 'open', 'close'].includes(action), 'V2_ALL_ACTION_INVALID');
  invariant(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(buyerEmail), 'V2_ALL_BUYER_EMAIL_INVALID');
  invariant(
    Number.isSafeInteger(durationMinutes) &&
      durationMinutes >= 5 &&
      durationMinutes <= MAX_WINDOW_MINUTES,
    'V2_ALL_DURATION_INVALID'
  );
  invariant(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'V2_ALL_SERVICE_ACCOUNT_MISSING');

  const app = getApps().find((entry) => entry.name === 'commerce-v2-all-window') || initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
    projectId
  }, 'commerce-v2-all-window');
  const db = getFirestore(app);
  const auth = getAuth(app);
  const buyer = await auth.getUserByEmail(buyerEmail);
  invariant(buyer.disabled !== true && buyer.emailVerified === true, 'V2_ALL_BUYER_NOT_READY');

  const refs = {
    control: db.doc('sys_commerce_control/current'),
    operations: db.doc('sys_commerce_operations/current'),
    run: db.doc(`commerce_gate_runs/${runId}`),
    products: productIds.map((productId) => db.doc(
      `artifacts/secondevie/public/data/furniture/${productId}`
    ))
  };
  const [controlSnap, operationsSnap, runSnap, ...productSnaps] = await Promise.all([
    refs.control.get(),
    refs.operations.get(),
    refs.run.get(),
    ...refs.products.map((reference) => reference.get())
  ]);
  invariant(controlSnap.exists && operationsSnap.exists, 'V2_ALL_PREFLIGHT_EVIDENCE_MISSING');
  const control = controlSnap.data();
  const operations = operationsSnap.data();
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
    const product = snapshot.data();
    const price = productPrice(product);
    const inventoryVersion = product.inventoryVersion ?? 0;
    invariant(
      product.status === 'published' &&
        product.sold !== true &&
        product.e2eOnly !== true &&
        product.priceOnRequest !== true &&
        Number.isSafeInteger(product.stock) &&
        product.stock >= 1 &&
        Number.isSafeInteger(inventoryVersion) &&
        inventoryVersion >= 0 &&
        typeof price === 'number' &&
        Number.isFinite(price) &&
        price > 0,
      `V2_ALL_PRODUCT_UNAVAILABLE:${productId}`
    );
    return {
      productId,
      name: String(product.name || product.title || productId).slice(0, 120),
      price,
      stock: product.stock,
      inventoryVersion
    };
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
      const [freshControl, freshOperations, freshRun, ...freshProducts] = await Promise.all([
        transaction.get(refs.control),
        transaction.get(refs.operations),
        transaction.get(refs.run),
        ...refs.products.map((reference) => transaction.get(reference))
      ]);
      invariant(
        freshControl.data()?.controlRevision === control.controlRevision &&
          freshControl.data()?.newCheckoutMode === FALLBACK_CHECKOUT_MODE &&
          freshControl.data()?.adminMutationMode === 'read_only' &&
          freshOperations.data()?.status === 'healthy' &&
          healthCountersAreZero(freshOperations.data()?.counters) &&
          !freshRun.exists,
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
      transaction.update(refs.control, {
        newCheckoutMode: 'v2_all',
        adminMutationMode: 'v2',
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
      expiresAt: expiresAt.toDate().toISOString(),
      products
    }));
    return;
  }

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
        freshControl.data()?.v2AllRunId === runId &&
        freshRun.data()?.status === 'open',
      'V2_ALL_CLOSE_PRECONDITION_CHANGED'
    );
    transaction.update(refs.control, {
      newCheckoutMode: FALLBACK_CHECKOUT_MODE,
      adminMutationMode: 'read_only',
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
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: String(error?.message || error)
  }));
  process.exitCode = 1;
});
