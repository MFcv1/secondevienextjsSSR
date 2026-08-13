'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { APP_ID } = require('../../helpers/config');
const { checkActiveStrongAdmin, writeSecurityAudit } = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const { eurosToCents } = require('./domain/money');
const {
    calculatePromotionDiscount,
    createPromotionDefinition,
    promotionCodeHash
} = require('./domain/promotionCode');
const { ensurePromotionMaterialized } = require('./promotionMaterialization');

function snapshotExists(snapshot) {
    return typeof snapshot?.exists === 'function' ? snapshot.exists() : snapshot?.exists === true;
}

function sha256(value) {
    return crypto.createHash('sha256').update(String(value || '').trim().toLowerCase()).digest('hex');
}

function sha256Exact(value) {
    return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function generatedCode() {
    return `SV-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

function serializeDate(value) {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    const millis = Date.parse(value);
    return Number.isSafeInteger(millis) ? new Date(millis).toISOString() : null;
}

function serializePromotion(snapshot) {
    const promotion = snapshot.data();
    return {
        id: snapshot.id,
        code: promotion.code,
        name: promotion.name,
        source: promotion.source,
        status: promotion.status,
        percentage: promotion.discount?.percentage,
        scopeType: promotion.scope?.type,
        productIds: promotion.scope?.productIds || [],
        maxRedemptions: promotion.limits?.maxRedemptions,
        maxPerCustomer: promotion.limits?.maxPerCustomer,
        reserved: Number(promotion.usage?.reserved || 0),
        committed: Number(promotion.usage?.committed || 0),
        minSubtotalCents: Number(promotion.constraints?.minSubtotalCents || 0),
        maxDiscountCents: promotion.constraints?.maxDiscountCents ?? null,
        startsAt: serializeDate(promotion.startsAt),
        expiresAt: serializeDate(promotion.expiresAt),
        createdAt: serializeDate(promotion.createdAt),
        updatedAt: serializeDate(promotion.updatedAt)
    };
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

async function assertPromotionMutationsEnabled(transaction, db) {
    const control = await transaction.get(db.doc('sys_commerce_control/current'));
    const value = snapshotExists(control) ? control.data() : {};
    if (value.newCheckoutMode !== 'v2_all' || value.adminMutationMode !== 'v2') {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'La gestion des codes n’est pas active sur cet environnement.',
            { reason: 'COMMERCE_ADMIN_MUTATIONS_OFF' }
        );
    }
}

function createPromotionHandlers({
    db = null,
    authorizeAdmin = checkActiveStrongAdmin,
    audit = writeSecurityAudit,
    now = () => new Date().toISOString(),
    codeFactory = generatedCode
} = {}) {
    const listAdmin = async (_data, context) => {
        try {
            await authorizeAdmin(context);
            const firestore = db || admin.firestore();
            const snapshot = await firestore.collection('commerce_promotion_codes')
                .orderBy('createdAt', 'desc')
                .limit(100)
                .get();
            return { promotions: snapshot.docs.map(serializePromotion) };
        } catch (error) {
            throw mapPromotionError(error);
        }
    };

    const createAdmin = async (data, context) => {
        try {
            await authorizeAdmin(context);
            const firestore = db || admin.firestore();
            const currentTime = now();
            const definition = createPromotionDefinition(data, {
                actorUid: context.auth.uid,
                now: currentTime,
                codeFactory
            });
            const ref = firestore.doc(`commerce_promotion_codes/${definition.codeHash}`);
            await firestore.runTransaction(async (transaction) => {
                await assertPromotionMutationsEnabled(transaction, firestore);
                const existing = await transaction.get(ref);
                if (snapshotExists(existing)) {
                    const error = new Error('Ce code existe déjà.');
                    error.code = 'COMMERCE_PROMOTION_CODE_CONFLICT';
                    throw error;
                }
                transaction.create(ref, definition);
            });
            await audit('commerce.promotion_created', context, {
                promotionId: definition.codeHash,
                percentage: definition.discount.percentage,
                scopeType: definition.scope.type
            });
            return { promotion: serializePromotion({ id: definition.codeHash, data: () => definition }) };
        } catch (error) {
            throw mapPromotionError(error);
        }
    };

    const setStatusAdmin = async (data, context) => {
        try {
            await authorizeAdmin(context);
            const firestore = db || admin.firestore();
            const codeHash = promotionCodeHash(data?.code);
            const active = data?.active;
            if (typeof active !== 'boolean') {
                const error = new Error('Statut invalide.');
                error.code = 'COMMERCE_PROMOTION_STATUS_INVALID';
                throw error;
            }
            const ref = firestore.doc(`commerce_promotion_codes/${codeHash}`);
            let updated;
            await firestore.runTransaction(async (transaction) => {
                await assertPromotionMutationsEnabled(transaction, firestore);
                const snapshot = await transaction.get(ref);
                if (!snapshotExists(snapshot)) {
                    const error = new Error('Code introuvable.');
                    error.code = 'COMMERCE_PROMOTION_NOT_FOUND';
                    throw error;
                }
                updated = {
                    ...snapshot.data(),
                    status: active ? 'active' : 'inactive',
                    updatedAt: now(),
                    updatedBy: context.auth.uid
                };
                transaction.set(ref, updated);
            });
            await audit('commerce.promotion_status_updated', context, {
                promotionId: codeHash,
                active
            });
            return { promotion: serializePromotion({ id: codeHash, data: () => updated }) };
        } catch (error) {
            throw mapPromotionError(error);
        }
    };

    const preview = async (data, context) => {
        try {
            if (!context.auth?.uid) {
                throw new functions.https.HttpsError('unauthenticated', 'Connectez-vous pour appliquer ce code.');
            }
            const firestore = db || admin.firestore();
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

    return { createAdmin, listAdmin, preview, setStatusAdmin };
}

const handlers = createPromotionHandlers();
const adminCallable = (handler) => regionalFunctions()
    .runWith({ enforceAppCheck: true })
    .https.onCall(handler);
const previewPromotionCodeV2 = adminCallable(handlers.preview);
const listPromotionCodesAdmin = adminCallable(handlers.listAdmin);
const createPromotionCodeAdmin = adminCallable(handlers.createAdmin);
const setPromotionCodeStatusAdmin = adminCallable(handlers.setStatusAdmin);

module.exports = {
    createPromotionCodeAdmin,
    createPromotionHandlers,
    listPromotionCodesAdmin,
    previewPromotionCodeV2,
    serializePromotion,
    setPromotionCodeStatusAdmin
};
