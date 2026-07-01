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
const REFUND_FAILURE_STATUSES = new Set(['failed', 'canceled']);
const EXPECTED_REFUND_CURRENCY = 'eur';

function toCents(value) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return null;
    return Math.round(numberValue * 100);
}

function isRefundableStripeOrder(order) {
    return Boolean(order?.stripePaymentIntentId) && (
        order.status === 'paid' ||
        order.status === 'completed' ||
        order.status === 'shipped' ||
        Boolean(order.paidAt)
    );
}

function getOrderStatusFromRefund(refund) {
    if (refund?.status === 'succeeded') return 'refunded';
    if (REFUND_FAILURE_STATUSES.has(refund?.status)) return 'refund_failed';
    return 'refund_pending';
}

function getRefundPaymentIntentId(refund) {
    return typeof refund?.payment_intent === 'string'
        ? refund.payment_intent
        : refund?.payment_intent?.id || null;
}

function validateRefundForOrder(refund, order, orderId) {
    const errors = [];
    const expectedAmount = toCents(order.total);
    const paymentIntentId = getRefundPaymentIntentId(refund);

    if (!refund?.id) errors.push('missing_refund_id');
    if (paymentIntentId !== order.stripePaymentIntentId) errors.push('payment_intent_mismatch');
    if (refund?.metadata?.orderId && refund.metadata.orderId !== orderId) errors.push('metadata_order_id_mismatch');
    if (String(refund?.currency || '').toLowerCase() !== EXPECTED_REFUND_CURRENCY) errors.push('currency_mismatch');
    if (expectedAmount === null || Number(refund?.amount || 0) < expectedAmount) errors.push('partial_refund_requires_manual_review');

    return errors;
}

async function restoreOrderStock(transaction, order, orderId) {
    const items = Array.isArray(order.items) ? order.items : [];
    const reads = [];
    const conflicts = [];

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
        const itemId = item.originalId || item.id || null;
        if (!itemSnap.exists) {
            conflicts.push({ itemId, reason: 'missing_product' });
            continue;
        }
        const currentBuyerId = itemSnap.data()?.buyerId || null;
        if (currentBuyerId && currentBuyerId !== order.userId) {
            conflicts.push({ itemId, reason: 'reserved_by_other_buyer' });
            continue;
        }
        const quantity = Number(item.quantity || 1);
        const currentStock = Number(itemSnap.data()?.stock ?? 0);
        const stockBefore = Number(item.stockBefore);
        const targetStock = Number.isFinite(stockBefore) && stockBefore >= quantity
            ? Math.max(currentStock, stockBefore)
            : currentStock + quantity;
        const alreadyAvailable = !currentBuyerId && itemSnap.data()?.sold !== true && currentStock >= quantity;
        if (!Number.isFinite(stockBefore) && alreadyAvailable) {
            transaction.update(itemRef, {
                sold: false,
                refundedFromOrderId: orderId,
                refundedAt: admin.firestore.FieldValue.serverTimestamp(),
                soldAt: admin.firestore.FieldValue.delete(),
                buyerId: admin.firestore.FieldValue.delete()
            });
            continue;
        }
        transaction.update(itemRef, {
            stock: targetStock,
            sold: false,
            refundedFromOrderId: orderId,
            refundedAt: admin.firestore.FieldValue.serverTimestamp(),
            soldAt: admin.firestore.FieldValue.delete(),
            buyerId: admin.firestore.FieldValue.delete()
        });
    }

    return conflicts;
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
        const stripeOptions = orderForRefund.stripeConnectedAccountId
            ? { stripeAccount: orderForRefund.stripeConnectedAccountId }
            : undefined;
        try {
            refund = await stripe.refunds.create({
                payment_intent: orderForRefund.stripePaymentIntentId,
                reason: 'requested_by_customer',
                metadata: {
                    orderId,
                    adminUid: context.auth.uid,
                    stripeConnectedAccountId: orderForRefund.stripeConnectedAccountId || '',
                    restoreStock: 'true',
                    note: refundReason
                }
            }, { idempotencyKey, ...(stripeOptions || {}) });
        } catch (error) {
            await orderRef.set({
                status: 'refund_failed',
                refundFailedAt: admin.firestore.FieldValue.serverTimestamp(),
                refundError: String(error?.message || error).slice(0, 500)
            }, { merge: true });
            throw new functions.https.HttpsError('internal', `Remboursement Stripe impossible: ${error?.message || error}`);
        }

        const refundValidationErrors = validateRefundForOrder(refund, orderForRefund, orderId);
        const finalStatus = refund.status === 'succeeded' && refundValidationErrors.length === 0
            ? 'refunded'
            : (refund.status === 'succeeded' ? 'refund_failed' : 'refund_pending');
        await db.runTransaction(async (transaction) => {
            const snap = await transaction.get(orderRef);
            if (!snap.exists) {
                throw new functions.https.HttpsError('not-found', 'Commande introuvable apres remboursement.');
            }

            const freshOrder = snap.data();
            let stockRestoreConflicts = [];
            if (finalStatus === 'refunded' && freshOrder.stockRestoredAfterRefund !== true) {
                stockRestoreConflicts = await restoreOrderStock(transaction, freshOrder, orderId);
            }
            const stockRestored = finalStatus === 'refunded' && stockRestoreConflicts.length === 0;

            transaction.update(orderRef, {
                status: finalStatus,
                refundStatus: refund.status || null,
                stripeRefundId: refund.id,
                refundedAt: finalStatus === 'refunded'
                    ? admin.firestore.FieldValue.serverTimestamp()
                    : admin.firestore.FieldValue.delete(),
                stockRestoredAfterRefund: stockRestored,
                stockRestoreConflict: stockRestoreConflicts.length > 0,
                stockRestoreConflictDetails: stockRestoreConflicts.length > 0 ? stockRestoreConflicts : admin.firestore.FieldValue.delete(),
                refundValidationError: refundValidationErrors.length > 0 ? refundValidationErrors.join(',') : admin.firestore.FieldValue.delete(),
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
            stockRestored: finalStatus === 'refunded' && refundValidationErrors.length === 0
        };
    });

exports.syncRefundStatusAdmin = functions
    .runWith({ secrets: [STRIPE_SECRET_KEY] })
    .https.onCall(async (data, context) => {
        checkIsAdmin(context);
        const orderId = normalizeFirestoreId(data?.orderId, 'ID commande');
        const orderRef = db.collection('orders').doc(orderId);
        const stripe = Stripe(STRIPE_SECRET_KEY.value());

        const snap = await orderRef.get();
        if (!snap.exists) {
            throw new functions.https.HttpsError('not-found', 'Commande introuvable.');
        }

        const order = snap.data();
        const refundId = order.stripeRefundId;
        if (!refundId || typeof refundId !== 'string') {
            throw new functions.https.HttpsError('failed-precondition', 'Aucun remboursement Stripe lie a cette commande.');
        }

        let refund;
        try {
            refund = await stripe.refunds.retrieve(
                refundId,
                order.stripeConnectedAccountId ? { stripeAccount: order.stripeConnectedAccountId } : undefined
            );
        } catch (error) {
            throw new functions.https.HttpsError('internal', `Lecture Stripe impossible: ${error?.message || error}`);
        }

        const finalStatus = getOrderStatusFromRefund(refund);
        const refundValidationErrors = validateRefundForOrder(refund, order, orderId);
        const safeFinalStatus = finalStatus === 'refunded' && refundValidationErrors.length > 0 ? 'refund_failed' : finalStatus;
        let stockRestored = false;

        await db.runTransaction(async (transaction) => {
            const freshSnap = await transaction.get(orderRef);
            if (!freshSnap.exists) {
                throw new functions.https.HttpsError('not-found', 'Commande introuvable apres lecture Stripe.');
            }

            const freshOrder = freshSnap.data();
            let stockRestoreConflicts = [];
            if (safeFinalStatus === 'refunded' && freshOrder.stockRestoredAfterRefund !== true) {
                stockRestoreConflicts = await restoreOrderStock(transaction, freshOrder, orderId);
                stockRestored = stockRestoreConflicts.length === 0;
            }

            transaction.update(orderRef, {
                status: safeFinalStatus,
                refundStatus: refund.status || null,
                stripeRefundId: refund.id,
                refundAmount: refund.amount || freshOrder.refundAmount || null,
                refundCurrency: refund.currency || freshOrder.refundCurrency || null,
                refundFailureReason: refund.failure_reason || (refundValidationErrors.length > 0 ? refundValidationErrors.join(',') : null),
                refundValidationError: refundValidationErrors.length > 0 ? refundValidationErrors.join(',') : admin.firestore.FieldValue.delete(),
                refundUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
                refundedAt: safeFinalStatus === 'refunded'
                    ? (freshOrder.refundedAt || admin.firestore.FieldValue.serverTimestamp())
                    : admin.firestore.FieldValue.delete(),
                stockRestoredAfterRefund: stockRestored || freshOrder.stockRestoredAfterRefund === true,
                stockRestoreConflict: stockRestoreConflicts.length > 0,
                stockRestoreConflictDetails: stockRestoreConflicts.length > 0 ? stockRestoreConflicts : admin.firestore.FieldValue.delete()
            });
        });

        return {
            success: true,
            refundId: refund.id,
            refundStatus: refund.status,
            orderStatus: safeFinalStatus,
            stockRestored
        };
    });
