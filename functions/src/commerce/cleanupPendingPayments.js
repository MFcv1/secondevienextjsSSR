const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const Stripe = require('stripe');
const { APP_ID } = require('../../helpers/config');
const { STRIPE_SECRET_KEY } = require('../../helpers/secrets');
const { normalizeFirestoreId, normalizeProductCollection } = require('../../helpers/security');

const db = admin.firestore();
const PENDING_PAYMENT_TTL_MINUTES = 45;
const CLEANUP_LIMIT = 50;

const terminalFailureStatuses = new Set([
    'canceled',
    'requires_payment_method'
]);

async function restoreReservedStock(transaction, orderRef, order) {
    for (const item of (order.items || [])) {
        const itemId = item.originalId || item.id;
        if (!itemId) continue;

        const safeItemId = normalizeFirestoreId(itemId, 'ID produit');
        const collectionName = normalizeProductCollection(item.collectionName || item.collection || 'furniture');
        const itemRef = db.doc(`artifacts/${APP_ID}/public/data/${collectionName}/${safeItemId}`);
        transaction.update(itemRef, {
            stock: admin.firestore.FieldValue.increment(Number(item.quantity) || 1),
            sold: false,
            soldAt: admin.firestore.FieldValue.delete(),
            buyerId: admin.firestore.FieldValue.delete()
        });
    }

    transaction.update(orderRef, {
        status: 'canceled',
        stockReserved: false,
        canceledAt: admin.firestore.FieldValue.serverTimestamp(),
        cleanupReason: 'pending_payment_expired'
    });
}

async function cancelPaymentIntentIfNeeded(stripe, paymentIntentId, stripeConnectedAccountId = null) {
    if (!paymentIntentId) return { status: 'missing_payment_intent' };

    const stripeOptions = stripeConnectedAccountId ? { stripeAccount: stripeConnectedAccountId } : undefined;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, stripeOptions);

    if (paymentIntent.status === 'succeeded') {
        return { status: 'succeeded', paymentIntent };
    }

    if (terminalFailureStatuses.has(paymentIntent.status)) {
        return { status: paymentIntent.status, paymentIntent };
    }

    if (paymentIntent.status !== 'processing') {
        const canceled = stripeOptions
            ? await stripe.paymentIntents.cancel(paymentIntentId, {}, stripeOptions)
            : await stripe.paymentIntents.cancel(paymentIntentId);
        return { status: canceled.status, paymentIntent: canceled };
    }

    return { status: 'processing', paymentIntent };
}

exports.cleanupPendingPayments = functions
    .runWith({ secrets: [STRIPE_SECRET_KEY], timeoutSeconds: 300, memory: '512MB' })
    .pubsub.schedule('every 15 minutes')
    .onRun(async () => {
        const stripe = Stripe(STRIPE_SECRET_KEY.value());
        const cutoffMillis = Date.now() - PENDING_PAYMENT_TTL_MINUTES * 60 * 1000;
        const snap = await db.collection('orders')
            .where('status', '==', 'pending_payment')
            .limit(CLEANUP_LIMIT)
            .get();

        let cleaned = 0;
        let confirmed = 0;
        let skipped = 0;

        for (const orderSnap of snap.docs) {
            const order = orderSnap.data();
            const orderRef = orderSnap.ref;
            const createdAtMillis = order.createdAt?.toMillis ? order.createdAt.toMillis() : 0;

            if (order.paymentMethod !== 'stripe_elements' || !createdAtMillis || createdAtMillis > cutoffMillis) {
                skipped += 1;
                continue;
            }

            try {
                const paymentState = await cancelPaymentIntentIfNeeded(
                    stripe,
                    order.stripePaymentIntentId,
                    order.stripeConnectedAccountId || null
                );

                if (paymentState.status === 'succeeded') {
                    await orderRef.update({
                        status: 'paid',
                        paidAt: admin.firestore.FieldValue.serverTimestamp(),
                        stripePaymentIntentId: paymentState.paymentIntent.id,
                        paymentMethod: 'stripe_elements',
                        cleanupNote: 'late_payment_confirmed'
                    });
                    confirmed += 1;
                    continue;
                }

                if (paymentState.status === 'processing') {
                    await orderRef.update({
                        cleanupLastCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
                        cleanupNote: 'payment_intent_processing'
                    });
                    skipped += 1;
                    continue;
                }

                await db.runTransaction(async (transaction) => {
                    const freshOrderSnap = await transaction.get(orderRef);
                    if (!freshOrderSnap.exists) return;
                    const freshOrder = freshOrderSnap.data();
                    if (freshOrder.status !== 'pending_payment' || freshOrder.stockReserved !== true) return;
                    await restoreReservedStock(transaction, orderRef, freshOrder);
                });
                cleaned += 1;
            } catch (error) {
                console.error(`Pending payment cleanup failed for order ${orderSnap.id}:`, error);
                await orderRef.set({
                    cleanupLastError: String(error?.message || error).slice(0, 500),
                    cleanupLastCheckedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true }).catch(() => {});
                skipped += 1;
            }
        }

        console.log(`Pending payment cleanup done. cleaned=${cleaned}, confirmed=${confirmed}, skipped=${skipped}`);
        return { cleaned, confirmed, skipped };
    });
