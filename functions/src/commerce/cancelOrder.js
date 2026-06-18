/**
 * COMMERCE: Annulation commande par le client
 *
 * INPUT: { orderId: string }
 * Regle: annulation possible dans les 7 jours suivant la commande.
 * Restaure uniquement le stock encore reserve par cette commande.
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { APP_ID } = require('../../helpers/config');
const { normalizeFirestoreId, normalizeProductCollection } = require('../../helpers/security');
const { assertGuestCheckoutOtpVerified } = require('../auth/guestCheckoutOtp');

const db = admin.firestore();
const CLIENT_CANCELLABLE_STATUSES = new Set(['pending_payment', 'payment_failed', 'canceled']);

exports.cancelOrderClient = functions.https.onCall(async (data, context) => {
    const orderId = normalizeFirestoreId(data?.orderId, 'ID commande');

    const userId = context.auth?.uid || null;
    const verifiedGuestEmail = userId
        ? null
        : await assertGuestCheckoutOtpVerified(null, data?.email, data?.checkoutOtpToken);
    const orderRef = db.collection('orders').doc(orderId);

    return db.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'Commande introuvable.');
        }

        const orderData = orderSnap.data();

        if (userId && orderData.userId !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'Cette commande ne vous appartient pas.');
        }
        if (!userId && (
            orderData.checkoutAuthMethod !== 'guest_email_otp' ||
            orderData.userEmail !== verifiedGuestEmail ||
            !CLIENT_CANCELLABLE_STATUSES.has(orderData.status)
        )) {
            throw new functions.https.HttpsError('permission-denied', 'Cette commande ne peut pas etre annulee en invite.');
        }

        if (
            ['paid', 'confirmed', 'payment_received'].includes(orderData.status) ||
            orderData.paidAt
        ) {
            throw new functions.https.HttpsError('failed-precondition', 'Commande deja payee: remboursement Stripe requis avant annulation.');
        }

        if (orderData.status === 'cancelled_by_client') {
            return { success: true, alreadyCancelled: true };
        }

        if (!CLIENT_CANCELLABLE_STATUSES.has(orderData.status)) {
            throw new functions.https.HttpsError('failed-precondition', 'Cette commande ne peut plus etre annulee.');
        }

        const createdAt = orderData.createdAt?.toDate ? orderData.createdAt.toDate() : new Date(orderData.createdAt);
        const diffDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 7) {
            throw new functions.https.HttpsError('failed-precondition', 'Le delai d\'annulation de 7 jours est depasse.');
        }

        if (orderData.stockReserved === true && Array.isArray(orderData.items)) {
            for (const item of orderData.items) {
                const itemId = item.originalId || item.id;
                if (!itemId) continue;

                const col = normalizeProductCollection(item.collection || item.collectionName || 'furniture');
                const safeItemId = normalizeFirestoreId(itemId, 'ID produit');
                const itemRef = db.doc(`artifacts/${APP_ID}/public/data/${col}/${safeItemId}`);
                const itemSnap = await transaction.get(itemRef);
                if (!itemSnap.exists) continue;

                const itemData = itemSnap.data();
                const currentBuyerId = itemData.buyerId || null;
                if (currentBuyerId && currentBuyerId !== orderData.userId) {
                    throw new functions.https.HttpsError('failed-precondition', 'Reservation stock incoherente: annulation bloquee.');
                }

                const currentStock = itemData.stock !== undefined ? Number(itemData.stock) : 0;
                const qtyToRestore = Number(item.quantity) || 1;
                transaction.update(itemRef, {
                    stock: currentStock + qtyToRestore,
                    sold: false,
                    soldAt: admin.firestore.FieldValue.delete(),
                    buyerId: admin.firestore.FieldValue.delete()
                });
            }
        }

        transaction.update(orderRef, {
            status: 'cancelled_by_client',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
            stockReserved: false,
            clientNote: "Annulee par l'acheteur"
        });

        return { success: true };
    });
});
