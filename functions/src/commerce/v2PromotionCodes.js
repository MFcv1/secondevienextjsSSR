'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { APP_ID } = require('../../helpers/config');
const { checkActiveStrongAdmin, writeSecurityAudit } = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const {
    createPromotionDefinition,
    promotionCodeHash
} = require('./domain/promotionCode');
const { createPublicPromotionHandlers } = require('./publicPromotionHandlers.cjs');
const { snapshotExists, serializeDate, mapPromotionError, createPreviewPromotionHandler } = createPublicPromotionHandlers({ HttpsError: functions.https.HttpsError, APP_ID });




function generatedCode() {
    return `SV-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
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

    const preview = createPreviewPromotionHandler({ dbFactory: () => db || admin.firestore(), now });

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
