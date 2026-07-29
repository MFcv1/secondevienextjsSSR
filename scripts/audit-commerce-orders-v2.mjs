import process from 'node:process';
import { createRequire } from 'node:module';
import admin from 'firebase-admin';

const requireFromFunctions = createRequire(
  new URL('../functions/package.json', import.meta.url)
);
const Stripe = requireFromFunctions('stripe');

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const MAX_GLOBAL_DOCUMENTS = 500;

function invariant(condition, code) {
  if (!condition) throw new Error(code);
}

function failClosed(error) {
  console.error(JSON.stringify({
    ok: false,
    error: String(error?.code || error?.type || 'AUDIT_V2_FAILED')
  }));
  process.exitCode = 1;
}

process.on('uncaughtException', failClosed);
process.on('unhandledRejection', failClosed);

function parseArgs(argv) {
  return new Map(argv.map((argument) => {
    if (!argument.startsWith('--')) throw new Error(`Argument inconnu: ${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    return [key, parts.length ? parts.join('=') : 'true'];
  }));
}

function timestamp(value) {
  return typeof value?.toDate === 'function' ? value.toDate().toISOString() : value || null;
}

function compactDocument(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    status: data.status || data.state || data.outcome || null,
    type: data.type || data.eventType || data.kind || data.template || null,
    orderId: data.orderId || data.payload?.orderId || null,
    amountCents: data.amountCents ?? data.payload?.amountCents ?? null,
    attempts: data.attempts ?? data.attemptCount ?? null,
    createdAt: timestamp(data.createdAt),
    updatedAt: timestamp(data.updatedAt)
  };
}

const args = parseArgs(process.argv.slice(2));
const projectId = args.get('project');
const environment = args.get('env');
const buyerEmail = String(args.get('buyer-email') || '').trim().toLowerCase();
const orderIds = String(args.get('order-ids') || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const productIds = String(args.get('product-ids') || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

invariant(projectId === PROJECT_ID && environment === ENVIRONMENT, 'AUDIT_V2_TARGET_INVALID');
invariant(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(buyerEmail), 'AUDIT_V2_BUYER_EMAIL_INVALID');
invariant(orderIds.length === 3 && orderIds.every((id) => /^ord_[A-Za-z0-9_-]+$/.test(id)), 'AUDIT_V2_ORDER_IDS_INVALID');
invariant(productIds.length === 5, 'AUDIT_V2_PRODUCT_IDS_INVALID');
invariant(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'AUDIT_V2_SERVICE_ACCOUNT_MISSING');
invariant(process.env.STRIPE_SECRET_KEY, 'AUDIT_V2_STRIPE_SECRET_MISSING');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    ),
    projectId
  });
}

const auth = admin.auth();
const db = admin.firestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const buyer = await auth.getUserByEmail(buyerEmail);
const controlRef = db.doc('sys_commerce_control/current');
const operationsRef = db.doc('sys_commerce_operations/current');
const projectionRef = db.doc('commerce_financial_projections/current');

const [
  controlSnap,
  operationsSnap,
  projectionSnap,
  cartSnap,
  orderSnaps,
  productSnaps
] = await Promise.all([
  controlRef.get(),
  operationsRef.get(),
  projectionRef.get(),
  db.collection(`users/${buyer.uid}/cart`).get(),
  Promise.all(orderIds.map((orderId) => db.doc(`orders/${orderId}`).get())),
  Promise.all(productIds.map((productId) =>
    db.doc(`artifacts/secondevie/public/data/furniture/${productId}`).get()
  ))
]);

invariant(orderSnaps.every((snapshot) => snapshot.exists), 'AUDIT_V2_ORDER_MISSING');
invariant(productSnaps.every((snapshot) => snapshot.exists), 'AUDIT_V2_PRODUCT_MISSING');

const orders = await Promise.all(orderSnaps.map(async (snapshot) => {
  const order = snapshot.data();
  const [attempts, refunds, events, documents, stripeIntent] = await Promise.all([
    snapshot.ref.collection('payment_attempts').get(),
    snapshot.ref.collection('refunds').get(),
    snapshot.ref.collection('events').get(),
    snapshot.ref.collection('documents').get(),
    stripe.paymentIntents.retrieve(
      order.payment.paymentIntentId,
      { expand: ['latest_charge'] },
      { stripeAccount: order.payment.connectedAccountId }
    )
  ]);
  const stripeRefunds = await stripe.refunds.list(
    { payment_intent: stripeIntent.id, limit: 20 },
    { stripeAccount: order.payment.connectedAccountId }
  );
  return {
    orderId: snapshot.id,
    status: order.status,
    totalCents: order.amounts?.totalCents,
    capturedCents: order.amounts?.capturedCents,
    refundedCents: order.amounts?.refundedCents,
    paymentStatus: order.payment?.status,
    inventoryStatus: order.inventorySummary?.status,
    committedQty: order.inventorySummary?.committedQty,
    restockedQty: order.inventorySummary?.restockedQty,
    itemCount: order.items?.length || 0,
    addressPresent: Boolean(
      order.shippingSnapshot?.line1 &&
      order.shippingSnapshot?.postalCode &&
      order.shippingSnapshot?.city
    ),
    phonePresent: Boolean(order.shippingSnapshot?.phone),
    createdAt: timestamp(order.createdAt),
    updatedAt: timestamp(order.updatedAt),
    attempts: attempts.docs.map(compactDocument),
    refunds: refunds.docs.map(compactDocument),
    events: events.docs.map(compactDocument),
    documents: documents.docs.map(compactDocument),
    stripe: {
      livemode: stripeIntent.livemode,
      status: stripeIntent.status,
      amount: stripeIntent.amount,
      amountReceived: stripeIntent.amount_received,
      chargeStatus: stripeIntent.latest_charge?.status || null,
      refunds: stripeRefunds.data.map((refund) => ({
        id: refund.id,
        status: refund.status,
        amount: refund.amount
      }))
    }
  };
}));

const globalCollections = [
  'inventory_reservations',
  'inventory_movements',
  'commerce_webhook_inbox',
  'commerce_outbox',
  'commerce_financial_facts',
  'commerce_incidents'
];
const globalEvidence = {};
for (const collectionName of globalCollections) {
  const snapshot = await db.collection(collectionName).limit(MAX_GLOBAL_DOCUMENTS).get();
  globalEvidence[collectionName] = snapshot.docs
    .filter((document) => {
      const serialized = JSON.stringify(document.data());
      return orderIds.some((orderId) => serialized.includes(orderId));
    })
    .map(compactDocument);
}

const control = controlSnap.data();
const operations = operationsSnap.data();
const projection = projectionSnap.data();

console.log(JSON.stringify({
  ok: true,
  projectId,
  environment,
  buyerUid: buyer.uid,
  control: {
    newCheckoutMode: control?.newCheckoutMode || null,
    adminMutationMode: control?.adminMutationMode || null,
    activePolicyVersion: control?.activePolicyVersion || null,
    controlRevision: control?.controlRevision ?? null,
    v2AllRunIdPresent: Boolean(control?.v2AllRunId)
  },
  operations: {
    status: operations?.status || null,
    counters: operations?.counters || null,
    updatedAt: timestamp(operations?.updatedAt)
  },
  projection: {
    status: projection?.status || null,
    factCount: projection?.factCount ?? null,
    updatedAt: timestamp(projection?.updatedAt)
  },
  cart: {
    lineCount: cartSnap.size,
    productIds: cartSnap.docs.map((snapshot) => snapshot.data().originalId || snapshot.id)
  },
  products: productSnaps.map((snapshot) => {
    const product = snapshot.data();
    return {
      productId: snapshot.id,
      name: product.name || product.title || null,
      status: product.status || null,
      sold: product.sold === true,
      stock: product.stock,
      inventoryVersion: product.inventoryVersion ?? null
    };
  }),
  orders,
  globalEvidence
}, null, 2));
