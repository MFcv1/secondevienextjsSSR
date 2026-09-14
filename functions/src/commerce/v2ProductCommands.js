'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const {
    checkActiveStrongAdmin
} = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const {
    createProductCommandRepository
} = require('./domain/productCommandRepository');
const { createSandboxInventoryRepository } = require('./domain/sandboxInventoryRepository');

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
    if (code.startsWith('COMMERCE_SANDBOX_RESTOCK_')) {
        return new functions.https.HttpsError('failed-precondition',
            'La remise en stock sandbox a été refusée.', { reason: code });
    }
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
    .https.onCall(handler);

const preflightProductMutationAdmin = callable(async (_data, context) => {
    try {
        await checkActiveStrongAdmin(context);
        return {
            ok: true,
            authorization: 'active-strong-admin'
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

const createPublishedProductAdmin = callable(createHandler(
    'create_published_product',
    (data) => ({
        editorial: data.editorial,
        media: data.media || {},
        offer: data.offer,
        initialStock: data.initialStock
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

const adjustInventoryHandler = createHandler(
    'adjust_inventory',
    (data) => ({
        delta: data.delta,
        expectedInventoryVersion: data.expectedInventoryVersion
    })
);

const adjustInventoryAdmin = callable(async (data, context) => {
    if (data?.mode !== 'sandbox_restore') return adjustInventoryHandler(data, context);
    try {
        await checkActiveStrongAdmin(context);
        return await createSandboxInventoryRepository({
            db, appId: logicalAppId(),
            projectId: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT,
            clock: { now: () => new Date().toISOString() }
        }).restore({
            productId: data.productId, collectionName: data.collectionName || 'furniture',
            command: normalizeCommand(data), expectedInventoryVersion: data.expectedInventoryVersion,
            actor: { uid: context.auth.uid, role: 'admin', aal2: true }
        });
    } catch (error) {
        throw mapDomainError(error);
    }
});

const deleteProductAdmin = callable(createHandler(
    'delete_product',
    () => ({})
));

module.exports = {
    adjustInventoryAdmin,
    commandRepository,
    deleteProductAdmin,
    createProductAdmin,
    createPublishedProductAdmin,
    mapDomainError,
    preflightProductMutationAdmin,
    publishProductAdmin,
    updateProductOfferAdmin
};
