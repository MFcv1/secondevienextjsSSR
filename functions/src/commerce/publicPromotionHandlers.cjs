'use strict';
const crypto = require('node:crypto');
const { eurosToCents } = require('./domain/money');
const { calculatePromotionDiscount } = require('./domain/promotionCode');
const { ensurePromotionMaterialized } = require('./promotionMaterialization');
function createPublicPromotionHandlers({ HttpsError, APP_ID }) {
const functions = { https: { HttpsError } };
function snapshotExists(snapshot) {
    return typeof snapshot?.exists === 'function' ? snapshot.exists() : snapshot?.exists === true;
}

function sha256(value) {
    return crypto.createHash('sha256').update(String(value || '').trim().toLowerCase()).digest('hex');
}

function sha256Exact(value) {
    return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function serializeDate(value) {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    const millis = Date.parse(value);
    return Number.isSafeInteger(millis) ? new Date(millis).toISOString() : null;
}

function mapPromotionError(error) {
    if (error instanceof functions.https.HttpsError) return error;
    const reason = String(error?.code || 'COMMERCE_PROMOTION_INTERNAL');
    const publicMessages = {
        COMMERCE_PROMOTION_INACTIVE: 'Ce code n’est pas actif.',
        COMMERCE_PROMOTION_NOT_STARTED: 'Ce code n’est pas encore actif.',
        COMMERCE_PROMOTION_EXPIRED: 'Ce code a expiré.',
        COMMERCE_PROMOTION_AUDIENCE_DENIED: 'Ce code est associé à une autre adresse e-mail.',
        COMMERCE_PROMOTION_NOT_APPLICABLE: 'Ce code ne s’applique à aucun article du panier.',
        COMMERCE_PROMOTION_MINIMUM_NOT_REACHED: 'Le montant minimum de ce code n’est pas atteint.',
        COMMERCE_PROMOTION_LIMIT_REACHED: 'Ce code a atteint sa limite d’utilisation.',
        COMMERCE_PROMOTION_CUSTOMER_LIMIT_REACHED: 'Ce code a déjà été utilisé par ce compte.'
    };
    if (reason.startsWith('COMMERCE_PROMOTION_')) {
        return new functions.https.HttpsError(
            reason.includes('NOT_FOUND') ? 'not-found' : 'failed-precondition',
            publicMessages[reason] || error.message || 'Code promotionnel invalide.',
            { reason }
        );
    }
    console.error('Promotion operation failed', { reason: reason.slice(0, 120) });
    return new functions.https.HttpsError('internal', 'Le code promotionnel n’a pas pu être vérifié.');
}

function createPreviewPromotionHandler({ db, dbFactory = () => db, now = () => new Date().toISOString() }) {
    const preview = async (data, context) => {
        try {
            if (!context.auth?.uid) {
                throw new functions.https.HttpsError('unauthenticated', 'Connectez-vous pour appliquer ce code.');
            }
            const firestore = dbFactory();
            const { code, codeHash } = await ensurePromotionMaterialized(firestore, data?.code, now());
            const promotionSnapshot = await firestore.doc(`commerce_promotion_codes/${codeHash}`).get();
            if (!snapshotExists(promotionSnapshot)) {
                const error = new Error('Code introuvable.');
                error.code = 'COMMERCE_PROMOTION_NOT_FOUND';
                throw error;
            }
            if (!Array.isArray(data?.items) || data.items.length < 1 || data.items.length > 50) {
                const error = new Error('Panier invalide.');
                error.code = 'COMMERCE_PROMOTION_INPUT_INVALID';
                throw error;
            }
            const normalizedItems = data.items.map((item) => ({
                productId: String(item?.productId || ''),
                collectionName: item?.collectionName === 'furniture' ? 'furniture' : 'furniture',
                quantity: Number(item?.quantity)
            }));
            if (normalizedItems.some((item) => (
                !/^[A-Za-z0-9_-]{8,160}$/.test(item.productId) ||
                !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20
            ))) {
                const error = new Error('Panier invalide.');
                error.code = 'COMMERCE_PROMOTION_INPUT_INVALID';
                throw error;
            }
            const snapshots = await Promise.all(normalizedItems.map((item) => firestore.doc(
                `artifacts/${APP_ID}/public/data/furniture/${item.productId}`
            ).get()));
            const lines = snapshots.map((snapshot, index) => {
                if (!snapshotExists(snapshot)) {
                    const error = new Error('Article introuvable.');
                    error.code = 'COMMERCE_PROMOTION_NOT_APPLICABLE';
                    throw error;
                }
                const product = snapshot.data();
                return {
                    productId: normalizedItems[index].productId,
                    quantity: normalizedItems[index].quantity,
                    unitAmountCents: eurosToCents(
                        product.currentPrice ?? product.startingPrice ?? product.price,
                        `product.${normalizedItems[index].productId}.price`
                    )
                };
            });
            const usage = promotionSnapshot.data().usage || {};
            const limits = promotionSnapshot.data().limits || {};
            if (Number(usage.reserved || 0) + Number(usage.committed || 0) >= Number(limits.maxRedemptions || 0)) {
                const error = new Error('Limite atteinte.');
                error.code = 'COMMERCE_PROMOTION_LIMIT_REACHED';
                throw error;
            }
            const customerKey = sha256Exact(context.auth.uid);
            const customerSnapshot = await firestore.doc(
                `commerce_promotion_codes/${codeHash}/customers/${customerKey}`
            ).get();
            const customer = snapshotExists(customerSnapshot)
                ? customerSnapshot.data()
                : { reserved: 0, committed: 0 };
            if (Number(customer.reserved || 0) + Number(customer.committed || 0) >= Number(limits.maxPerCustomer || 0)) {
                const error = new Error('Limite client atteinte.');
                error.code = 'COMMERCE_PROMOTION_CUSTOMER_LIMIT_REACHED';
                throw error;
            }
            const result = calculatePromotionDiscount(promotionSnapshot.data(), {
                lines,
                ownerEmailHash: sha256(context.auth.token?.email),
                now: now()
            });
            return {
                code,
                percentage: promotionSnapshot.data().discount.percentage,
                discountCents: result.discountCents,
                eligibleCents: result.eligibleCents,
                expiresAt: serializeDate(promotionSnapshot.data().expiresAt)
            };
        } catch (error) {
            throw mapPromotionError(error);
        }
    };

return preview;
}
return { snapshotExists, sha256, sha256Exact, serializeDate, mapPromotionError, createPreviewPromotionHandler };
}
module.exports = { createPublicPromotionHandlers };
