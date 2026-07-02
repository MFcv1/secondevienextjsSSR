import admin from 'firebase-admin';

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

  const customToken = await auth.createCustomToken(user.uid);
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

  let query = db.collection('orders')
    .where('paymentMethod', '==', 'stripe')
    .where('status', '==', 'paid')
    .orderBy('createdAt', 'desc')
    .limit(20);

  const snap = await query.get();
  const match = snap.docs
    .map((doc) => ({ id: doc.id, data: doc.data() }))
    .find((order) => {
      if (!targetEmail) return true;
      return String(order.data.userEmail || '').trim().toLowerCase() === targetEmail;
    });

  if (!match) throw new Error('No paid Stripe order found to refund.');
  return match;
};

const callRefund = async (idToken, orderId) => {
  const response = await fetch(`https://us-central1-${projectId}.cloudfunctions.net/refundOrderAdmin`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${idToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        orderId,
        reason: 'E2E Stripe Connect refund sandbox',
      },
    }),
  });
  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(`refundOrderAdmin failed: ${response.status} ${JSON.stringify(payload.error || payload).slice(0, 500)}`);
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
const order = await findOrder();
const result = await callRefund(idToken, order.id);
const refreshedSnap = await db.collection('orders').doc(order.id).get();
const refreshed = refreshedSnap.data() || {};
const refund = refreshed.stripeRefundId
  ? await retrieveRefund(refreshed.stripeRefundId, refreshed.stripeConnectedAccountId || null).catch((error) => ({
      retrievalError: error.message || String(error),
    }))
  : null;

const proof = {
  orderId: order.id,
  orderStatusBefore: order.data.status || null,
  orderStatusAfter: refreshed.status || null,
  paymentIntentId: refreshed.stripePaymentIntentId || null,
  connectedAccountId: refreshed.stripeConnectedAccountId || null,
  stripeConnectMode: refreshed.stripeConnectMode || null,
  refundId: refreshed.stripeRefundId || result.refundId || null,
  refundStatus: refund?.status || refreshed.refundStatus || null,
  refundRetrievalError: refund?.retrievalError || null,
  refundPaymentIntentId: typeof refund?.payment_intent === 'string' ? refund.payment_intent : refund?.payment_intent?.id || null,
  stockRestoredAfterRefund: refreshed.stockRestoredAfterRefund === true,
  assertions: {
    refundSucceeded: (refund?.status || refreshed.refundStatus) === 'succeeded',
    orderRefunded: refreshed.status === 'refunded',
    samePaymentIntent: refund?.payment_intent
      ? (typeof refund.payment_intent === 'string' ? refund.payment_intent : refund.payment_intent?.id) === refreshed.stripePaymentIntentId
      : null,
    connectAccountUsed: Boolean(refreshed.stripeConnectedAccountId),
    stockRestored: refreshed.stockRestoredAfterRefund === true,
  },
};

console.log(JSON.stringify(proof, null, 2));
