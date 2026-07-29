import process from 'node:process';
import admin from 'firebase-admin';

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';

function invariant(condition, code) {
  if (!condition) throw new Error(code);
}

function failClosed(error) {
  console.error(JSON.stringify({
    ok: false,
    error: String(error?.code || error?.type || 'CART_CLEANUP_V2_FAILED')
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
const confirmation = args.get('confirm');

invariant(projectId === PROJECT_ID && environment === ENVIRONMENT, 'CART_CLEANUP_V2_TARGET_INVALID');
invariant(/^ord_[A-Za-z0-9_-]{16,160}$/.test(orderId), 'CART_CLEANUP_V2_ORDER_ID_INVALID');
invariant(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(buyerEmail), 'CART_CLEANUP_V2_BUYER_EMAIL_INVALID');
invariant(
  confirmation === `CLEANUP_CART_V2_${orderId}_${PROJECT_ID}`,
  'CART_CLEANUP_V2_CONFIRMATION_INVALID'
);
invariant(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'CART_CLEANUP_V2_SERVICE_ACCOUNT_MISSING');

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
const buyer = await auth.getUserByEmail(buyerEmail);
const orderRef = db.doc(`orders/${orderId}`);
const [orderSnap, cartSnap] = await Promise.all([
  orderRef.get(),
  db.collection(`users/${buyer.uid}/cart`).get()
]);
const order = orderSnap.data();
const serializedOrder = JSON.stringify(order || {}).toLowerCase();

invariant(
  orderSnap.exists &&
    order.schemaVersion === 2 &&
    order.status === 'paid' &&
    order.payment?.status === 'succeeded' &&
    order.inventorySummary?.status === 'committed' &&
    serializedOrder.includes(buyer.uid.toLowerCase()) &&
    serializedOrder.includes(buyerEmail),
  'CART_CLEANUP_V2_ORDER_NOT_DURABLY_PAID'
);

const purchasedLines = new Map(order.items.map((item) => [
  item.cartLineId,
  {
    productId: item.productId,
    cartRevision: item.cartRevision
  }
]));
const matchingCartDocs = cartSnap.docs.filter((snapshot) => {
  const item = snapshot.data();
  const purchased = purchasedLines.get(item.cartLineId);
  return purchased &&
    purchased.productId === item.originalId &&
    purchased.cartRevision === item.cartRevision;
});

invariant(
  matchingCartDocs.length === order.items.length &&
    matchingCartDocs.length === cartSnap.size,
  'CART_CLEANUP_V2_CART_DOES_NOT_EXACTLY_MATCH_ORDER'
);

const batch = db.batch();
matchingCartDocs.forEach((snapshot) => batch.delete(snapshot.ref));
await batch.commit();

console.log(JSON.stringify({
  ok: true,
  projectId,
  environment,
  orderId,
  deletedLines: matchingCartDocs.length
}, null, 2));
