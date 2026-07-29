import process from 'node:process';
import { createRequire } from 'node:module';
import admin from 'firebase-admin';

const requireFromFunctions = createRequire(
  new URL('../functions/package.json', import.meta.url)
);
const Stripe = requireFromFunctions('stripe');

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';

function invariant(condition, code) {
  if (!condition) throw new Error(code);
}

function failClosed(error) {
  console.error(JSON.stringify({
    ok: false,
    error: String(error?.code || error?.type || 'CONFIRM_V2_FAILED')
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
const buyerEmail = String(args.get('buyer-email') || '').trim().toLowerCase();
const amountCents = Number(args.get('amount-cents'));
const confirmation = args.get('confirm');

invariant(projectId === PROJECT_ID && environment === ENVIRONMENT, 'CONFIRM_V2_TARGET_INVALID');
invariant(/^ord_[A-Za-z0-9_-]{16,160}$/.test(orderId), 'CONFIRM_V2_ORDER_ID_INVALID');
invariant(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(buyerEmail), 'CONFIRM_V2_BUYER_EMAIL_INVALID');
invariant(Number.isSafeInteger(amountCents) && amountCents > 0, 'CONFIRM_V2_AMOUNT_INVALID');
invariant(
  confirmation === `CONFIRM_V2_${orderId}_${amountCents}_${PROJECT_ID}`,
  'CONFIRM_V2_CONFIRMATION_INVALID'
);
invariant(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'CONFIRM_V2_SERVICE_ACCOUNT_MISSING');
invariant(process.env.STRIPE_SECRET_KEY, 'CONFIRM_V2_STRIPE_SECRET_MISSING');

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
const buyer = await auth.getUserByEmail(buyerEmail);
const [controlSnap, orderSnap] = await Promise.all([
  db.doc('sys_commerce_control/current').get(),
  db.doc(`orders/${orderId}`).get()
]);
const control = controlSnap.data();
const order = orderSnap.data();
const serializedOrder = JSON.stringify(order || {}).toLowerCase();

invariant(
  controlSnap.exists &&
    control.newCheckoutMode === 'v2_all',
  'CONFIRM_V2_CONTROL_NOT_OPEN'
);
invariant(
  orderSnap.exists &&
    order.schemaVersion === 2 &&
    order.status === 'pending_payment' &&
    order.payment?.status === 'awaiting_method' &&
    order.amounts?.totalCents === amountCents &&
    order.amounts?.capturedCents === 0 &&
    serializedOrder.includes(buyer.uid.toLowerCase()) &&
    serializedOrder.includes(buyerEmail),
  'CONFIRM_V2_ORDER_NOT_EXACTLY_PAYABLE'
);

const paymentIntent = await stripe.paymentIntents.retrieve(
  order.payment.paymentIntentId,
  {},
  { stripeAccount: order.payment.connectedAccountId }
);
invariant(
  paymentIntent.livemode === false &&
    paymentIntent.status === 'requires_payment_method' &&
    paymentIntent.amount === amountCents,
  'CONFIRM_V2_STRIPE_EVIDENCE_INVALID'
);

const confirmed = await stripe.paymentIntents.confirm(
  paymentIntent.id,
  {
    payment_method: 'pm_card_visa',
    return_url:
      'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app/checkout'
  },
  {
    stripeAccount: order.payment.connectedAccountId,
    idempotencyKey: `sandbox_confirm_return_url_${orderId}`
  }
);

invariant(
  confirmed.livemode === false &&
    confirmed.status === 'succeeded' &&
    confirmed.amount_received === amountCents,
  'CONFIRM_V2_STRIPE_CONFIRMATION_FAILED'
);

console.log(JSON.stringify({
  ok: true,
  projectId,
  environment,
  orderId,
  paymentIntentId: confirmed.id,
  status: confirmed.status,
  amountReceived: confirmed.amount_received,
  livemode: confirmed.livemode
}, null, 2));
