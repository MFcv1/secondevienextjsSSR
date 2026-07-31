'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const {
    checkActiveStrongAdmin
} = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const {
    withCommerceMutationsEnabled
} = require('./v2ControlGuard');
const {
    createProductCommandRepository
} = require('./domain/productCommandRepository');

const db = admin.firestore();

function refsFor(appId) {
    return Object.freeze({
        product: ({ collectionName, productId }) => db.doc(
            `artifacts/${appId}/public/data/${collectionName}/${productId}`
        ),
        commandResult: (commandId) => db.doc(
            `commerce_command_results/${commandId}`
        ),
        productAuditEvent: (collectionName, productId, eventId) => db.doc(
            `commerce_product_audits/${collectionName}_${productId}/events/${eventId}`
        )
    });
}

function logicalAppId() {
    const value = String(
        process.env.NEXT_PUBLIC_APP_LOGICAL_NAME ||
        process.env.APP_LOGICAL_NAME ||
        'secondevie'
    ).trim();
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(value)) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'Identite logique application invalide.'
        );
    }
    return value;
}

function commandRepository() {
    return createProductCommandRepository({
        db: {
            runTransaction: (run) => db.runTransaction(run)
        },
        refs: refsFor(logicalAppId()),
        clock: { now: () => new Date().toISOString() }
    });
}

function mapDomainError(error) {
    if (error instanceof functions.https.HttpsError) return error;
    const code = String(error?.code || '');
    if (code.endsWith('_NOT_FOUND')) {
        return new functions.https.HttpsError('not-found', 'Produit introuvable.');
    }
    if (
        code.includes('STALE_VERSION') ||
        code.includes('ALREADY_EXISTS') ||
        code.includes('IDEMPOTENCY') ||
        code.includes('ARCHIVED')
    ) {
        return new functions.https.HttpsError(
            'aborted',
            'La commande produit est obsolete ou deja appliquee.',
            { reason: code }
        );
    }
    if (
        code.includes('AAL2') ||
        code.includes('ACTION_NOT_ALLOWED') ||
        code.includes('COLLECTION_FORBIDDEN')
    ) {
        return new functions.https.HttpsError(
            'permission-denied',
            'Action produit non autorisee.',
            { reason: code }
        );
    }
    if (code.startsWith('COMMERCE_')) {
        return new functions.https.HttpsError(
            'invalid-argument',
            'Commande produit invalide.',
            { reason: code }
        );
    }
    return new functions.https.HttpsError(
        'internal',
        'La commande produit n a pas pu etre appliquee.'
    );
}

function normalizeCommand(data) {
    return {
        commandId: data?.commandId,
        expectedVersion: data?.expectedVersion
    };
}

function createHandler(action, payloadFromData) {
    return async (data, context) => {
        try {
            await checkActiveStrongAdmin(context);
            return await commandRepository().execute({
                collectionName: data?.collectionName || 'furniture',
                productId: data?.productId,
                action,
                command: normalizeCommand(data),
                actor: {
                    uid: context.auth.uid,
                    role: 'admin',
                    aal2: true
                },
                reason: data?.reason,
                payload: payloadFromData(data || {})
            });
        } catch (error) {
            throw mapDomainError(error);
        }
    };
}

const callable = (handler) => regionalFunctions()
    .runWith({ enforceAppCheck: true })
    .https.onCall(withCommerceMutationsEnabled(handler));

const preflightProductMutationAdmin = callable(async (_data, context) => {
    try {
        await checkActiveStrongAdmin(context);
        return {
            ok: true,
            authorization: 'recent-strong-admin'
        };
    } catch (error) {
        throw mapDomainError(error);
    }
});

const createProductAdmin = callable(createHandler(
    'create_product',
    (data) => ({
        editorial: data.editorial,
        media: data.media || {}
    })
));

const updateProductOfferAdmin = callable(createHandler(
    'update_product_offer',
    (data) => ({ offer: data.offer })
));

const publishProductAdmin = callable(createHandler(
    'publish_product',
    (data) => ({ published: data.published })
));

const adjustInventoryAdmin = callable(createHandler(
    'adjust_inventory',
    (data) => ({
        delta: data.delta,
        expectedInventoryVersion: data.expectedInventoryVersion
    })
));

const archiveProductAdmin = callable(createHandler(
    'archive_product',
    () => ({})
));

module.exports = {
    adjustInventoryAdmin,
    archiveProductAdmin,
    createProductAdmin,
    preflightProductMutationAdmin,
    publishProductAdmin,
    updateProductOfferAdmin
};
