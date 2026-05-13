/**
 * COMMERCE: Création de commande (Stripe Checkout + Manuel)
 * 
 * INPUT: { items: [{ id, collectionName, quantity }], paymentMethod: 'stripe'|'manual', shipping: {...} }
 * OUTPUT: { success: true, url: string } (Stripe) ou { success: true, orderId: string } (Manuel)
 * 
 * SÉCURITÉ:
 * - Auth requise + email_verified
 * - Prix recalculé côté serveur (jamais confiance au front)
 * - Stock vérifié en transaction atomique
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { normalizeProductCollection, normalizeFirestoreId, normalizeQuantity } = require('../../helpers/security');
const { STRIPE_SECRET_KEY, GMAIL_EMAIL, GMAIL_PASSWORD } = require('../../helpers/secrets');
const { APP_ID } = require('../../helpers/config');
const { timestampFromNow, SYSTEM_DOC_RETENTION_DAYS } = require('../analytics/constants');

const db = admin.firestore();
const Stripe = require('stripe');

exports.createOrder = functions.runWith({ secrets: [STRIPE_SECRET_KEY, GMAIL_EMAIL, GMAIL_PASSWORD] }).https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth requise.');

    // Sécurité: Email vérifié obligatoire
    if (!context.auth.token.email_verified) {
        throw new functions.https.HttpsError('failed-precondition',
            'Veuillez vérifier votre email avant de passer commande. Consultez votre boîte de réception (ou spams).'
        );
    }

    const stripe = Stripe(STRIPE_SECRET_KEY.value());

    const userId = context.auth.uid;
    const rawOrderData = data?.orderData;

    if (!rawOrderData || !rawOrderData.items || !Array.isArray(rawOrderData.items) || rawOrderData.items.length === 0 || rawOrderData.items.length > 20) {
        throw new functions.https.HttpsError('invalid-argument', 'Format de commande invalide.');
    }

    const allowedPaymentMethods = new Set(['stripe_elements', 'deferred', 'manual']);
    if (!allowedPaymentMethods.has(rawOrderData.paymentMethod)) {
        throw new functions.https.HttpsError('invalid-argument', 'Methode de paiement non supportee.');
    }

    const orderData = {
        ...rawOrderData,
        items: rawOrderData.items.map((item) => {
            const realItemId = normalizeFirestoreId(item.originalId || item.id, 'ID produit');
            return {
                ...item,
                id: realItemId,
                originalId: realItemId,
                collectionName: normalizeProductCollection(item.collectionName || 'furniture'),
                quantity: normalizeQuantity(item.quantity, 20)
            };
        })
    };

    // --- RATE LIMITING ATOMIQUE (3 commandes/minute/utilisateur) ---
    // Protège contre les floods / tests automatiques en production.
    const rateLimitRef = db.doc(`sys_ratelimit/order_${userId}`);
    try {
        await db.runTransaction(async (tx) => {
            const rlSnap = await tx.get(rateLimitRef);
            const rl = rlSnap.exists ? rlSnap.data() : { count: 0, resetAt: 0 };
            const now = Date.now();

            if (now < rl.resetAt && rl.count >= 3) {
                throw new functions.https.HttpsError('resource-exhausted',
                    'Trop de commandes consécutives. Patientez une minute avant de réessayer.');
            }
            if (now > rl.resetAt) {
                tx.set(rateLimitRef, {
                    count: 1,
                    resetAt: now + 60000,
                    expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
                });
            } else {
                tx.update(rateLimitRef, {
                    count: admin.firestore.FieldValue.increment(1),
                    expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
                });
            }
        });
    } catch (e) {
        if (e.code === 'resource-exhausted') throw e;
        console.error("RateLimit check error (continuing):", e);
    }

    // 2. Paiement Différé (Manuel: Virement/Chèque)
    if (orderData.paymentMethod === 'manual' || orderData.paymentMethod === 'deferred') {
        const orderRef = db.collection('orders').doc();
        try {
            await db.runTransaction(async (transaction) => {
                // PHASE 1 — READS
                const itemReads = [];
                for (const item of orderData.items) {
                    const colName = item.collectionName;
                    const realItemId = item.originalId;
                    const itemRef = db.doc(`artifacts/${APP_ID}/public/data/${colName}/${realItemId}`);
                    const itemDoc = await transaction.get(itemRef);
                    itemReads.push({ item, itemRef, itemDoc, realItemId });
                }

                // PHASE 2 — VALIDATION
                const stockTrackerManual = {};
                const writeOps = [];
                const serverItems = [];
                let txTotalManual = 0;
                for (const { item, itemRef, itemDoc, realItemId } of itemReads) {
                    if (!itemDoc.exists) throw new Error("Item not found");

                    const itemDb = itemDoc.data();
                    const quantity = item.quantity;
                    const currentStock = itemDb.stock !== undefined ? Number(itemDb.stock) : 1;
                    const alreadyTaken = stockTrackerManual[realItemId] || 0;
                    if (currentStock - alreadyTaken < quantity || itemDb.sold) {
                        throw new functions.https.HttpsError('failed-precondition', `Article indisponible: ${itemDb.name}`);
                    }

                    const newStock = Math.max(0, currentStock - quantity - alreadyTaken);

                    const updates = { stock: newStock, buyerId: userId };
                    if (newStock === 0) {
                        updates.sold = true;
                        updates.soldAt = admin.firestore.FieldValue.serverTimestamp();
                    }

                    writeOps.push({ ref: itemRef, updates });
                    stockTrackerManual[realItemId] = alreadyTaken + quantity;
                    const realPrice = itemDb.currentPrice || itemDb.startingPrice || 0;
                    txTotalManual += realPrice * quantity;
                    serverItems.push({
                        id: realItemId,
                        collectionName: item.collectionName,
                        name: itemDb.name,
                        price: realPrice,
                        quantity,
                        image: item.image || (itemDb.images && itemDb.images.length > 0 ? itemDb.images[0] : (itemDb.imageUrl || null))
                    });
                }

                // PHASE 3 — WRITES
                for (const { ref, updates } of writeOps) {
                    transaction.update(ref, updates);
                }
                transaction.set(orderRef, {
                    userId: userId,
                    userEmail: context.auth.token.email || orderData.shipping?.email,
                    items: serverItems,
                    shipping: orderData.shipping || {},
                    paymentMethod: 'deferred',
                    total: txTotalManual,
                    status: 'pending_payment',
                    stockReserved: true,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    stripeSessionId: null
                });
            });

            return { success: true, orderId: orderRef.id };
        } catch (e) {
            console.error("Manual Order Error", e);
            if (e instanceof functions.https.HttpsError) throw e;
            throw new functions.https.HttpsError('internal', "Erreur enregistrement commande.");
        }
    }

    // 3. Stripe Checkout Session — SUPPRIMÉ (Mars 2026)
    // Mode externe supprimé au profit du PaymentElement inline (stripe_elements)

    // 4. Stripe Elements (PaymentElement intégré — PaymentIntent)
    // Architecture anti-survente (fix Mars 2026):
    // 1. Transaction atomique unique: valide stock + calcule prix serveur + réserve stock + crée commande
    // 2. Crée le PaymentIntent Stripe avec l'orderId en metadata
    // 3. En cas d'échec Stripe: restaure le stock + supprime la commande en transaction
    // 4. Le webhook payment_intent.succeeded confirme la commande (sans re-décrémenter le stock)
    // 5. Le webhook payment_intent.payment_failed restaure le stock
    if (orderData.paymentMethod === 'stripe_elements') {
        const orderRef = db.collection('orders').doc();

        // Transaction unique : valider stock + calculer prix serveur + réserver stock + créer commande
        // Remplace l'ancienne double-transaction (validation puis réservation) par une seule opération atomique
        let serverTotalAmount = 0;
        try {
            await db.runTransaction(async (transaction) => {
                // ====================================================================
                // PHASE 1 — TOUS LES READS EN PREMIER (obligation Firestore transaction)
                // ====================================================================
                const itemReads = [];
                for (const item of orderData.items) {
                    const colName = item.collectionName;
                    const realItemId = item.originalId;
                    const itemRef = db.doc(`artifacts/${APP_ID}/public/data/${colName}/${realItemId}`);
                    const itemDoc = await transaction.get(itemRef);
                    itemReads.push({ item, itemRef, itemDoc, colName, realItemId });
                }

                // Read delivery settings (frais de port dynamiques)
                let deliveryData = null;
                if (orderData.shipping && orderData.shipping.deliveryMode) {
                    const deliveryDoc = await transaction.get(db.doc('sys_metadata/delivery'));
                    if (deliveryDoc.exists) {
                        deliveryData = deliveryDoc.data();
                    }
                }

                // ====================================================================
                // PHASE 2 — VALIDATION + CALCULS (aucun read, aucun write)
                // ====================================================================
                const stockTracker = {};
                let txTotal = 0;
                const serverItems = [];
                const writeOps = []; // Accumuler les writes pour la phase 3

                for (const { item, itemRef, itemDoc, colName, realItemId } of itemReads) {
                    if (!itemDoc.exists) throw new functions.https.HttpsError('not-found', `Produit "${realItemId}" introuvable.`);

                    const itemDb = itemDoc.data();
                    const alreadyTaken = stockTracker[realItemId] || 0;
                    const currentStock = itemDb.stock !== undefined ? Number(itemDb.stock) : 1;

                    const quantity = item.quantity;

                    if (currentStock - alreadyTaken < quantity || itemDb.sold) {
                        throw new functions.https.HttpsError('failed-precondition', `Article indisponible (Stock épuisé): ${itemDb.name}`);
                    }

                    // Prix recalculé côté serveur (jamais confiance au client)
                    const realPrice = itemDb.currentPrice || itemDb.startingPrice || 0;
                    txTotal += realPrice * quantity;

                    serverItems.push({
                        id: realItemId,
                        collectionName: colName,
                        name: itemDb.name,
                        price: realPrice,
                        quantity,
                        image: item.image || (itemDb.images && itemDb.images.length > 0 ? itemDb.images[0] : (itemDb.imageUrl || null))
                    });

                    const newStock = Math.max(0, currentStock - quantity - alreadyTaken);
                    const updates = { stock: newStock };
                    if (newStock === 0) {
                        updates.sold = true;
                        updates.soldAt = admin.firestore.FieldValue.serverTimestamp();
                        updates.buyerId = userId;
                    }

                    writeOps.push({ ref: itemRef, updates });
                    stockTracker[realItemId] = alreadyTaken + quantity;
                }

                // --- CALCUL DES FRAIS DE PORT ---
                let shippingCost = 0;
                if (orderData.shipping && orderData.shipping.deliveryMode) {
                    const mode = orderData.shipping.deliveryMode;
                    if (deliveryData && deliveryData[mode]) {
                        shippingCost = Number(deliveryData[mode].price) || 0;
                    } else {
                        // Fallback (sans colissimo — retiré du catalogue)
                        if (mode === 'transporteur') shippingCost = 89;
                        if (mode === 'idf') shippingCost = 49;
                        if (mode === 'retrait') shippingCost = 0;
                    }
                }
                
                txTotal += shippingCost;
                serverTotalAmount = txTotal;

                // ====================================================================
                // PHASE 3 — TOUS LES WRITES À LA FIN
                // ====================================================================
                for (const { ref, updates } of writeOps) {
                    transaction.update(ref, updates);
                }

                transaction.set(orderRef, {
                    userId: userId,
                    userEmail: context.auth.token.email || orderData.shipping?.email,
                    items: serverItems,
                    shipping: orderData.shipping || {},
                    total: txTotal,
                    paymentMethod: 'stripe_elements',
                    status: 'pending_payment',
                    stockReserved: true,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    stripePaymentIntentId: null
                });
            });
        } catch (e) {
            console.error("Stock Reservation Error:", e);
            throw e;
        }

        // Créer le PaymentIntent (après la réservation du stock)
        const shippingData = orderData.shipping || {};
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(serverTotalAmount * 100),
                currency: 'eur',
                automatic_payment_methods: { enabled: true },
                receipt_email: context.auth.token.email,
                shipping: {
                    name: shippingData.fullName || '',
                    address: {
                        line1: shippingData.address || '',
                        city: shippingData.city || '',
                        postal_code: shippingData.zip || '',
                        country: 'FR',
                    },
                    phone: shippingData.phone || '',
                },
                metadata: {
                    userId: userId,
                    userEmail: context.auth.token.email || '',
                    orderId: orderRef.id,
                    shippingMeta: JSON.stringify(shippingData).substring(0, 500),
                    itemsMeta: JSON.stringify(orderData.items.map(i => ({ id: i.originalId || i.id, col: i.collectionName || 'furniture', qty: i.quantity || 1 }))).substring(0, 500)
                }
            });

            await orderRef.update({ stripePaymentIntentId: paymentIntent.id });

            return {
                success: true,
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                orderId: orderRef.id
            };
        } catch (error) {
            // Échec Stripe : restaurer le stock + supprimer la commande en transaction
            console.error("PaymentIntent Error, restoring stock:", error);
            try {
                // Utiliser un batch + FieldValue.increment pour restauration atomique
                // (pas besoin de transaction read puisqu'on incrémente directement)
                const batch = db.batch();
                for (const item of orderData.items) {
                    const colName = item.collectionName;
                    const realItemId = item.originalId;
                    const itemRef = db.doc(`artifacts/${APP_ID}/public/data/${colName}/${realItemId}`);
                    const qtyToRestore = item.quantity;
                    batch.update(itemRef, {
                        stock: admin.firestore.FieldValue.increment(qtyToRestore),
                        sold: false,
                        soldAt: admin.firestore.FieldValue.delete(),
                        buyerId: admin.firestore.FieldValue.delete()
                    });
                }
                batch.delete(orderRef);
                await batch.commit();
            } catch (restoreError) {
                console.error("CRITICAL: Stock restore failed after PI error:", restoreError);
            }
            throw new functions.https.HttpsError('internal', "Erreur initialisation paiement sécurisé.");
        }
    }

    // Fallback: méthode de paiement non reconnue
    throw new functions.https.HttpsError('invalid-argument', 'Méthode de paiement non supportée.');
});
