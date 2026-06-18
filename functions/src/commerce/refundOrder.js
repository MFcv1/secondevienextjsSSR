const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const Stripe = require('stripe');
const { APP_ID } = require('../../helpers/config');
const { STRIPE_SECRET_KEY } = require('../../helpers/secrets');
const {
    checkIsAdmin,
    normalizeFirestoreId,
    normalizeProductCollection
} = require('../../helpers/security');

const db = admin.firestore();

const REFUND_TERMINAL_STATUSES = new Set(['refunded']);

function isRefundableStripeOrder(order) {
    return Boolean(order?.stripePaymentIntentId) && (
        order.status === 'paid' ||
        order.status === 'completed' ||
        order.status === 'shipped' ||
        Boolean(order.paidAt)
    );
}

async function restoreOrderStock(transaction, order, orderId) {
    const items = Array.isArray(order.items) ? order.items : [];
    const reads = [];

    for (const item of items) {
        const itemId = normalizeFirestoreId(item.originalId || item.id, 'ID produit');
        const collectionName = normalizeProductCollection(item.collectionName || item.collection || 'furniture');
        const itemRef = db.doc(`artifacts/${APP_ID}/public/data/${collectionName}/${itemId}`);
        reads.push({
            item,
            itemRef,
            itemSnap: await transaction.get(itemRef)
        });
    }

    for (const { item, itemRef, itemSnap } of reads) {
        if (!itemSnap.exists) continue;
        const quantity = Number(item.quantity || 1);
        const currentStock = Number(itemSnap.data()?.stock ?? 0);
        transaction.update(itemRef, {
            stock: currentStock + quantity,
            sold: false,
            refundedFromOrderId: orderId,
            refundedAt: admin.firestore.FieldValue.serverTimestamp(),
            soldAt: admin.firestore.FieldValue.delete(),
            buyerId: admin.firestore.FieldValue.delete()
        });
    }
}

exports.refundOrderAdmin = functions
    .runWith({ secrets: [STRIPE_SECRET_KEY] })
    .https.onCall(async (data, context) => {
        const adminInfo = checkIsAdmin(context);
        const orderId = normalizeFirestoreId(data?.orderId, 'ID commande');
        const refundReason = typeof data?.reason === 'string' && data.reason.trim()
            ? data.reason.trim().slice(0, 500)
            : 'Remboursement admin avec remise en vente';
        const orderRef = db.collection('orders').doc(orderId);
        const stripe = Stripe(STRIPE_SECRET_KEY.value());

        let orderForRefund = null;
        let idempotencyKey = null;

        await db.runTransaction(async (transaction) => {
            const snap = await transaction.get(orderRef);
            if (!snap.exists) {
                throw new functions.https.HttpsError('not-found', 'Commande introuvable.');
            }

            const order = snap.data();
            if (REFUND_TERMINAL_STATUSES.has(order.status) || order.stripeRefundId) {
                orderForRefund = order;
                return;
            }

            if (!isRefundableStripeOrder(order)) {
                throw new functions.https.HttpsError('failed-precondition', 'Commande Stripe payee requise pour rembourser.');
            }

            orderForRefund = order;
            idempotencyKey = `order_refund_${orderId}_${order.stripePaymentIntentId}`;
            transaction.update(orderRef, {
                status: 'refund_pending',
                refundRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
                refundRequestedBy: context.auth.uid,
                refundRequestedByEmail: context.auth.token.email || null,
                refundRestoreStockRequested: true,
                refundReason,
                refundIsSuperAdmin: adminInfo.isSuper === true
            });
        });

        if (!orderForRefund) {
            throw new functions.https.HttpsError('not-found', 'Commande introuvable.');
        }

        if (orderForRefund.stripeRefundId) {
            return {
                success: true,
                alreadyRefunded: true,
                refundId: orderForRefund.stripeRefundId,
                status: orderForRefund.refundStatus || 'succeeded'
            };
        }

        let refund;
        try {
            refund = await stripe.refunds.create({
                payment_intent: orderForRefund.stripePaymentIntentId,
                reason: 'requested_by_customer',
                metadata: {
                    orderId,
                    adminUid: context.auth.uid,
                    restoreStock: 'true',
                    note: refundReason
                }
            }, { idempotencyKey });
        } catch (error) {
            await orderRef.set({
                status: 'refund_failed',
                refundFailedAt: admin.firestore.FieldValue.serverTimestamp(),
                refundError: String(error?.message || error).slice(0, 500)
            }, { merge: true });
            throw new functions.https.HttpsError('internal', `Remboursement Stripe impossible: ${error?.message || error}`);
        }

        const finalStatus = refund.status === 'succeeded' ? 'refunded' : 'refund_pending';
        await db.runTransaction(async (transaction) => {
            const snap = await transaction.get(orderRef);
            if (!snap.exists) {
                throw new functions.https.HttpsError('not-found', 'Commande introuvable apres remboursement.');
            }

            const freshOrder = snap.data();
            if (finalStatus === 'refunded' && freshOrder.stockRestoredAfterRefund !== true) {
                await restoreOrderStock(transaction, freshOrder, orderId);
            }

            transaction.update(orderRef, {
                status: finalStatus,
                refundStatus: refund.status || null,
                stripeRefundId: refund.id,
                refundedAt: finalStatus === 'refunded'
                    ? admin.firestore.FieldValue.serverTimestamp()
                    : admin.firestore.FieldValue.delete(),
                stockRestoredAfterRefund: finalStatus === 'refunded',
                refundAmount: refund.amount || null,
                refundCurrency: refund.currency || null,
                refundUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        return {
            success: true,
            refundId: refund.id,
            status: refund.status,
            orderStatus: finalStatus,
            stockRestored: finalStatus === 'refunded'
        };
    });
