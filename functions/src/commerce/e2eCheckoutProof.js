const crypto = require('crypto');
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const Stripe = require('stripe');
const { APP_ID } = require('../../helpers/config');
const { STRIPE_SECRET_KEY, E2E_PROOF_TOKEN } = require('../../helpers/secrets');

const db = admin.firestore();

const safeString = (value) => String(value || '').trim();

const normalizeEmail = (value) => safeString(value).toLowerCase();

const hasMatchingToken = (provided, expected) => {
    const left = Buffer.from(safeString(provided));
    const right = Buffer.from(safeString(expected));
    if (!left.length || left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
};

const serialize = (value) => {
    if (!value || typeof value !== 'object') return value;
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    if (Array.isArray(value)) return value.map(serialize);
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialize(item)]));
};

const findOrder = async ({ orderId, paymentIntentId, email }) => {
    if (orderId) {
        const snap = await db.collection('orders').doc(orderId).get();
        return snap.exists ? { id: snap.id, data: snap.data() } : null;
    }

    if (paymentIntentId) {
        const snap = await db.collection('orders')
            .where('stripePaymentIntentId', '==', paymentIntentId)
            .limit(1)
            .get();
        if (!snap.empty) {
            const doc = snap.docs[0];
            return { id: doc.id, data: doc.data() };
        }
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return null;

    const snap = await db.collection('orders')
        .where('userEmail', '==', normalizedEmail)
        .limit(10)
        .get();
    if (snap.empty) return null;
    const doc = snap.docs
        .sort((left, right) => (
            (right.data()?.createdAt?.toMillis?.() || 0) - (left.data()?.createdAt?.toMillis?.() || 0)
        ))[0];
    return { id: doc.id, data: doc.data() };
};

const findStripeSucceededEvent = async (stripe, paymentIntentId) => {
    if (!paymentIntentId) return null;
    const events = await stripe.events.list({
        type: 'payment_intent.succeeded',
        limit: 25
    });
    return events.data.find((event) => event?.data?.object?.id === paymentIntentId) || null;
};

const readStockProof = async (items = []) => {
    const rows = [];
    for (const item of items) {
        const itemId = item.id || item.originalId;
        const collectionName = item.collectionName || item.collection || 'furniture';
        if (!itemId) continue;
        const snap = await db.doc(`artifacts/${APP_ID}/public/data/${collectionName}/${itemId}`).get();
        rows.push({
            id: itemId,
            collectionName,
            exists: snap.exists,
            name: item.name || snap.data()?.name || null,
            orderedQuantity: Number(item.quantity || 1),
            stock: snap.exists ? Number(snap.data()?.stock ?? 0) : null,
            sold: snap.exists ? snap.data()?.sold === true : null,
            buyerId: snap.exists ? snap.data()?.buyerId || null : null
        });
    }
    return rows;
};

exports.e2eCheckoutProof = functions
    .runWith({ secrets: [STRIPE_SECRET_KEY, E2E_PROOF_TOKEN] })
    .https.onRequest(async (req, res) => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'method_not_allowed' });
        }

        let expectedToken = '';
        try {
            expectedToken = E2E_PROOF_TOKEN.value();
        } catch {
            expectedToken = '';
        }

        if (!hasMatchingToken(req.get('x-e2e-proof-token'), expectedToken)) {
            return res.status(403).json({ error: 'forbidden' });
        }

        const payload = req.body || {};
        const stockBefore = Number(payload.stockBefore);
        const order = await findOrder({
            orderId: safeString(payload.orderId),
            paymentIntentId: safeString(payload.paymentIntentId),
            email: payload.email
        });

        if (!order) {
            return res.status(404).json({ error: 'order_not_found' });
        }

        const stripe = Stripe(STRIPE_SECRET_KEY.value());
        const orderData = order.data || {};
        const paymentIntentId = orderData.stripePaymentIntentId || safeString(payload.paymentIntentId);
        const paymentIntent = paymentIntentId
            ? await stripe.paymentIntents.retrieve(paymentIntentId).catch((error) => ({ error: error.message }))
            : null;
        const succeededEvent = await findStripeSucceededEvent(stripe, paymentIntentId).catch((error) => ({ error: error.message }));
        const idempotencySnap = succeededEvent?.id
            ? await db.doc(`sys_idempotency/stripe_${succeededEvent.id}`).get()
            : null;
        const stockProof = await readStockProof(orderData.items || []);

        const proof = {
            orderId: order.id,
            order: serialize({
                status: orderData.status || null,
                userEmail: orderData.userEmail || null,
                checkoutAuthMethod: orderData.checkoutAuthMethod || null,
                total: orderData.total || null,
                paymentMethod: orderData.paymentMethod || null,
                stockReserved: orderData.stockReserved === true,
                createdAt: orderData.createdAt || null,
                paidAt: orderData.paidAt || null,
                stripePaymentIntentId: paymentIntentId || null,
                emailProof: orderData.emailProof || null
            }),
            stripe: paymentIntent?.error ? {
                error: paymentIntent.error
            } : {
                paymentIntentId,
                status: paymentIntent?.status || null,
                amount: paymentIntent?.amount || null,
                currency: paymentIntent?.currency || null,
                metadataOrderId: paymentIntent?.metadata?.orderId || null
            },
            webhook: {
                succeededEventId: succeededEvent?.id || null,
                eventLookupError: succeededEvent?.error || null,
                idempotencyStatus: idempotencySnap?.exists ? idempotencySnap.data()?.status || null : null,
                idempotencyProcessedAt: serialize(idempotencySnap?.exists ? idempotencySnap.data()?.processedAt || null : null)
            },
            selectedProduct: safeString(payload.selectedProduct) || null,
            stockBefore: Number.isFinite(stockBefore) ? stockBefore : null,
            stock: stockProof
        };

        proof.assertions = {
            orderPaid: proof.order.status === 'paid',
            paymentIntentSucceeded: proof.stripe.status === 'succeeded',
            metadataMatchesOrder: proof.stripe.metadataOrderId === order.id,
            webhookProcessed: proof.webhook.idempotencyStatus === 'processed',
            emailAttempted: Boolean(proof.order.emailProof?.attemptedAt),
            clientEmailSent: proof.order.emailProof?.client?.sent === true,
            stockDecrementedFromBefore: Number.isFinite(stockBefore)
                ? stockProof.some((item) => item.exists && item.stock === Math.max(0, stockBefore - item.orderedQuantity))
                : null,
            stockStillReservedForOrder: stockProof.every((item) => item.exists && (
                item.sold === true || Number.isFinite(item.stock)
            ))
        };

        return res.json(proof);
    });
