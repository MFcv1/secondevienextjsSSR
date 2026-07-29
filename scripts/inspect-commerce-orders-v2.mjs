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
    error: String(error?.code || error?.type || 'INSPECT_V2_FAILED')
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

const args = parseArgs(process.argv.slice(2));
const projectId = args.get('project');
const environment = args.get('env');
const buyerEmail = String(args.get('buyer-email') || '').trim().toLowerCase();
const orderIds = String(args.get('order-ids') || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

invariant(projectId === PROJECT_ID && environment === ENVIRONMENT, 'INSPECT_V2_TARGET_INVALID');
invariant(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(buyerEmail), 'INSPECT_V2_BUYER_EMAIL_INVALID');
invariant(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'INSPECT_V2_SERVICE_ACCOUNT_MISSING');

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
const snapshots = orderIds.length
  ? {
      docs: (await Promise.all(orderIds.map((orderId) =>
        db.doc(`orders/${orderId}`).get()
      ))).filter((snapshot) => snapshot.exists)
    }
  : await db.collection('orders').get();

const orders = snapshots.docs
  .filter((snapshot) => {
    const serialized = JSON.stringify(snapshot.data()).toLowerCase();
    return serialized.includes(buyer.uid.toLowerCase()) || serialized.includes(buyerEmail);
  })
  .map((snapshot) => {
    const order = snapshot.data();
    return {
      orderId: snapshot.id,
      createdAt: timestamp(order.createdAt),
      updatedAt: timestamp(order.updatedAt),
      status: order.status || null,
      schemaVersion: order.schemaVersion || null,
      itemCount: Array.isArray(order.items) ? order.items.length : 0,
      productIds: Array.isArray(order.items)
        ? order.items.map((item) => item.productId)
        : [],
      totalCents: order.amounts?.totalCents ?? null,
      capturedCents: order.amounts?.capturedCents ?? null,
      refundedCents: order.amounts?.refundedCents ?? null,
      paymentStatus: order.payment?.status || null,
      paymentIntentId: order.payment?.paymentIntentId || null,
      connectedAccountId: order.payment?.connectedAccountId || null,
      inventoryStatus: order.inventorySummary?.status || null,
      committedQty: order.inventorySummary?.committedQty ?? null,
      restockedQty: order.inventorySummary?.restockedQty ?? null
    };
  })
  .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));

console.log(JSON.stringify({
  ok: true,
  projectId,
  environment,
  buyerUid: buyer.uid,
  orderCount: orders.length,
  orders
}, null, 2));
