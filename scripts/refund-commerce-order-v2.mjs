import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import process from 'node:process';
import admin from 'firebase-admin';

const requireFromFunctions = createRequire(
  new URL('../functions/package.json', import.meta.url)
);
const Stripe = requireFromFunctions('stripe');
const { createRefundRuntime } = requireFromFunctions(
  './src/commerce/domain/v2Runtime'
);

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const APP_ID = 'secondevie';

function invariant(condition, code) {
  if (!condition) throw new Error(code);
}

function failClosed(error) {
  console.error(JSON.stringify({
    ok: false,
    error: String(error?.code || error?.type || 'REFUND_V2_FAILED')
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

const args = parseArgs(process.argv.slice(2));
const projectId = args.get('project');
const environment = args.get('env');
const orderId = String(args.get('order-id') || '');
const adminEmail = String(args.get('admin-email') || '').trim().toLowerCase();
const amountCents = Number(args.get('amount-cents'));
const confirmation = args.get('confirm');

invariant(projectId === PROJECT_ID && environment === ENVIRONMENT, 'REFUND_V2_TARGET_INVALID');
invariant(/^ord_[A-Za-z0-9_-]{16,160}$/.test(orderId), 'REFUND_V2_ORDER_ID_INVALID');
invariant(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adminEmail), 'REFUND_V2_ADMIN_EMAIL_INVALID');
invariant(Number.isSafeInteger(amountCents) && amountCents > 0, 'REFUND_V2_AMOUNT_INVALID');
invariant(
  confirmation === `REFUND_V2_${orderId}_${amountCents}_${PROJECT_ID}`,
  'REFUND_V2_CONFIRMATION_INVALID'
);
invariant(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'REFUND_V2_SERVICE_ACCOUNT_MISSING');
invariant(process.env.STRIPE_SECRET_KEY, 'REFUND_V2_STRIPE_SECRET_MISSING');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    ),
    projectId
  });
}

const db = admin.firestore();
const auth = admin.auth();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const adminUser = await auth.getUserByEmail(adminEmail);
const [accessSnap, controlSnap, orderSnap] = await Promise.all([
  db.doc(`sys_admin_access/${adminUser.uid}`).get(),
  db.doc('sys_commerce_control/current').get(),
  db.doc(`orders/${orderId}`).get()
]);
const access = accessSnap.data();
const control = controlSnap.data();
const order = orderSnap.data();

invariant(
  accessSnap.exists &&
    access.active === true &&
    (adminUser.customClaims?.admin === true || adminUser.customClaims?.superAdmin === true),
  'REFUND_V2_ADMIN_NOT_ACTIVE'
);
invariant(
  controlSnap.exists &&
    control.adminMutationMode === 'v2' &&
    control.newCheckoutMode === 'v2_all',
  'REFUND_V2_CONTROL_NOT_OPEN'
);
invariant(
  orderSnap.exists &&
    order.schemaVersion === 2 &&
    order.status === 'paid' &&
    order.payment?.status === 'succeeded' &&
    order.amounts?.capturedCents === amountCents &&
    order.amounts?.refundedCents === 0,
  'REFUND_V2_ORDER_NOT_EXACTLY_REFUNDABLE'
);

const paymentIntent = await stripe.paymentIntents.retrieve(
  order.payment.paymentIntentId,
  {},
  { stripeAccount: order.payment.connectedAccountId }
);
invariant(
  paymentIntent.livemode === false &&
    paymentIntent.status === 'succeeded' &&
    paymentIntent.amount_received === amountCents,
  'REFUND_V2_STRIPE_EVIDENCE_INVALID'
);

const refundRequestId = `refund_${crypto.randomUUID()}`;
const runtime = createRefundRuntime({ db, stripe, appId: APP_ID });
const result = await runtime.refunds.requestRefund({
  orderId,
  refundRequestId,
  amountCents,
  actor: {
    uid: adminUser.uid,
    role: 'admin',
    aal2: true
  },
  reason: 'Recette sandbox demandee par la proprietaire'
});
const updated = (await db.doc(`orders/${orderId}`).get()).data();

console.log(JSON.stringify({
  ok: true,
  projectId,
  environment,
  orderId,
  refundRequestId,
  outcome: result.outcome,
  refundId: result.refundId,
  status: updated.status,
  refundStatus: updated.refundAggregate?.status,
  refundedCents: updated.refundAggregate?.succeededCents,
  inventoryStatus: updated.inventorySummary?.status,
  restockedQty: updated.inventorySummary?.restockedQty
}, null, 2));
