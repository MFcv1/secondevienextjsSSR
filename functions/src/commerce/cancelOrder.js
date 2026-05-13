/**
 * COMMERCE: Annulation commande par le client
 * 
 * INPUT: { orderId: string }
 * Règle: Annulation possible dans les 7 jours suivant la commande.
 * Restaure le stock des produits si applicable.
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { APP_ID } = require('../../helpers/config');
const { normalizeFirestoreId, normalizeProductCollection } = require('../../helpers/security');

const db = admin.firestore();

exports.cancelOrderClient = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');

    const orderId = normalizeFirestoreId(data?.orderId, 'ID commande');

    const userId = context.auth.uid;
    const orderRef = db.collection('orders').doc(orderId);

    return db.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'Commande introuvable.');
        }

        const orderData = orderSnap.data();

        // Vérifier que c'est bien SA commande
        if (orderData.userId !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'Cette commande ne vous appartient pas.');
        }

        // Vérifier que la commande n'est pas déjà annulée/expédiée
        if (['cancelled_by_client', 'shipped', 'completed'].includes(orderData.status)) {
            throw new functions.https.HttpsError('failed-precondition', 'Cette commande ne peut plus être annulée.');
        }

        // Vérifier le délai de 7 jours
        const createdAt = orderData.createdAt?.toDate ? orderData.createdAt.toDate() : new Date(orderData.createdAt);
        const diffDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 7) {
            throw new functions.https.HttpsError('failed-precondition', 'Le délai d\'annulation de 7 jours est dépassé.');
        }

        // Restaurer le stock
        if (orderData.items && Array.isArray(orderData.items)) {
            for (const item of orderData.items) {
                const itemId = item.originalId || item.id;
                const col = normalizeProductCollection(item.collection || item.collectionName || 'furniture');

                if (itemId) {
                    const safeItemId = normalizeFirestoreId(itemId, 'ID produit');
                    const itemRef = db.doc(`artifacts/${APP_ID}/public/data/${col}/${safeItemId}`);
                    const itemSnap = await transaction.get(itemRef);

                    if (itemSnap.exists) {
                        const itemData = itemSnap.data();
                        // Restaurer le stock réservé (qu'il soit sold=true ou juste décrémenté)
                        if (itemData.sold || orderData.stockReserved) {
                            const currentStock = itemData.stock !== undefined ? Number(itemData.stock) : 0;
                            const qtyToRestore = item.quantity || 1;
                            transaction.update(itemRef, {
                                stock: currentStock + qtyToRestore,
                                sold: false,
                                soldAt: admin.firestore.FieldValue.delete(),
                                buyerId: admin.firestore.FieldValue.delete()
                            });
                        }
                    }
                }
            }
        }

        // Annuler la commande
        transaction.update(orderRef, {
            status: 'cancelled_by_client',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
            clientNote: "Annulée par l'acheteur"
        });

        return { success: true };
    });
});
