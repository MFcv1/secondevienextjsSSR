import admin from 'firebase-admin';
import crypto from 'node:crypto';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'secondevienextjsssr';
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  : null;
const adminEmail = String(process.env.E2E_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL || 'loa.gto15@gmail.com').trim().toLowerCase();
const targetEmail = String(process.env.E2E_REFUND_ORDER_EMAIL || '').trim().toLowerCase();
const targetOrderId = String(process.env.E2E_REFUND_ORDER_ID || '').trim();

if (!apiKey) throw new Error('Missing Firebase API key.');
if (!serviceAccountJson) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON.');
if (!process.env.VITE_FIREBASE_APP_ID) throw new Error('Missing VITE_FIREBASE_APP_ID.');
if (!process.env.STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY.');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountJson),
    projectId,
  });
}

const db = admin.firestore();
const auth = admin.auth();

const ensureAdminToken = async () => {
  const user = await auth.getUserByEmail(adminEmail);
  const claims = user.customClaims || {};
  if (claims.admin !== true && claims.superAdmin !== true && adminEmail === String(process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase()) {
    await auth.setCustomUserClaims(user.uid, {
      ...claims,
      admin: true,
      superAdmin: true,
    });
  }

  const customToken = await auth.createCustomToken(user.uid, {
    authMethod: 'passkey',
    authAssurance: 'aal2',
    userVerified: true,
  });
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.idToken) {
    throw new Error(`Admin token exchange failed: ${response.status}`);
  }
  return payload.idToken;
};

const findOrder = async () => {
  if (targetOrderId) {
    const snap = await db.collection('orders').doc(targetOrderId).get();
    if (!snap.exists) throw new Error(`Order not found: ${targetOrderId}`);
    return { id: snap.id, data: snap.data() };
  }

  const query = db.collection('orders')
    .orderBy('createdAt', 'desc')
    .limit(100);

  const snap = await query.get();
  const match = snap.docs
    .map((doc) => ({ id: doc.id, data: doc.data() }))
    .find((order) => {
      const paymentIntentId = order.data.payment?.paymentIntentId
        || order.data.stripePaymentIntentId;
      const capturedCents = Number(order.data.amounts?.capturedCents || 0);
      const refundedCents = Number(order.data.amounts?.refundedCents || 0);
      const pendingCents = Number(order.data.refundAggregate?.pendingCents || 0);
      if (!paymentIntentId || capturedCents - refundedCents - pendingCents <= 0) return false;
      if (!targetEmail) return true;
      const email = order.data.customerSnapshot?.email
        || order.data.shippingSnapshot?.email
        || order.data.userEmail;
      return String(email || '').trim().toLowerCase() === targetEmail;
    });

  if (!match) throw new Error('No paid Stripe order found to refund.');
  return match;
};

const callRefund = async (idToken, appCheckToken, order) => {
  const capturedCents = Number(order.data.amounts?.capturedCents || 0);
  const refundedCents = Number(order.data.amounts?.refundedCents || 0);
  const pendingCents = Number(order.data.refundAggregate?.pendingCents || 0);
  const amountCents = capturedCents - refundedCents - pendingCents;
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error(`Order has no refundable amount: ${order.id}`);
  }
  const refundRequestId = `e2e_${crypto
    .createHash('sha256')
    .update(`sandbox-refund:${order.id}`)
    .digest('hex')
    .slice(0, 24)}`;
  const response = await fetch(`https://europe-west1-${projectId}.cloudfunctions.net/requestRefundAdmin`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${idToken}`,
      'X-Firebase-AppCheck': appCheckToken,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        orderId: order.id,
        refundRequestId,
        amountCents,
        reason: 'Remboursement E2E Stripe Connect sandbox',
      },
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) {
    throw new Error(`requestRefundAdmin failed: ${response.status} ${JSON.stringify(payload.error || payload).slice(0, 500)}`);
  }
  return payload.result || payload.data || payload;
};

const retrieveRefund = async (refundId, connectedAccountId) => {
  if (!refundId) return null;
  const headers = {
    authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
  };
  if (connectedAccountId) headers['stripe-account'] = connectedAccountId;
  const response = await fetch(`https://api.stripe.com/v1/refunds/${encodeURIComponent(refundId)}`, {
    headers,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Stripe refund retrieve failed: ${response.status} ${payload?.error?.message || ''}`.trim());
  }
  return payload;
};

const idToken = await ensureAdminToken();
const appCheck = await admin.appCheck().createToken(
  process.env.VITE_FIREBASE_APP_ID,
  { ttlMillis: 30 * 60 * 1000 },
);
const order = await findOrder();
const result = await callRefund(idToken, appCheck.token, order);
const refreshedSnap = await db.collection('orders').doc(order.id).get();
const refreshed = refreshedSnap.data() || {};
const refundId = result.refundId || refreshed.stripeRefundId || null;
const paymentIntentId = refreshed.payment?.paymentIntentId
  || refreshed.stripePaymentIntentId
  || null;
const connectedAccountId = refreshed.payment?.connectedAccountId
  || refreshed.stripeConnectedAccountId
  || null;
const refund = refundId
  ? await retrieveRefund(refundId, connectedAccountId).catch((error) => ({
      retrievalError: error.message || String(error),
    }))
  : null;
const capturedCents = Number(refreshed.amounts?.capturedCents || 0);
const refundedCents = Number(refreshed.amounts?.refundedCents || 0);
const refundAggregateStatus = refreshed.refundAggregate?.status || null;
const restockedQty = Number(refreshed.inventory?.restockedQty || 0);

const proof = {
  orderId: order.id,
  orderStatusBefore: order.data.status || null,
  orderStatusAfter: refreshed.status || null,
  paymentIntentId,
  connectedAccountId,
  refundId,
  refundStatus: refund?.status || result.status || null,
  refundAggregateStatus,
  capturedCents,
  refundedCents,
  refundRetrievalError: refund?.retrievalError || null,
  refundPaymentIntentId: typeof refund?.payment_intent === 'string' ? refund.payment_intent : refund?.payment_intent?.id || null,
  restockedQty,
  assertions: {
    refundSucceeded: (refund?.status || result.status) === 'succeeded',
    orderRefunded: refundAggregateStatus === 'full' && refundedCents === capturedCents,
    samePaymentIntent: refund?.payment_intent
      ? (typeof refund.payment_intent === 'string' ? refund.payment_intent : refund.payment_intent?.id) === paymentIntentId
      : null,
    connectAccountUsed: Boolean(connectedAccountId),
    stockNotRestoredByRefund: restockedQty === 0,
  },
};

console.log(JSON.stringify(proof, null, 2));
