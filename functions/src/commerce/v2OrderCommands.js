'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const {
    checkRecentActiveStrongAdmin,
    normalizeFirestoreId
} = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const {
    withCommerceMutationsEnabled
} = require('./v2ControlGuard');
const {
    createOrderCommandRepository
} = require('./domain/orderCommandRepository');

function refs(db) {
    return Object.freeze({
        order: (orderId) => db.doc(`orders/${orderId}`),
        commandResult: (commandId) => db.doc(
            `commerce_command_results/${commandId}`
        ),
        auditEvent: (orderId, eventId) => db.doc(
            `orders/${orderId}/events/${eventId}`
        )
    });
}

function commandRepository() {
    const db = admin.firestore();
    return createOrderCommandRepository({
        db: {
            runTransaction: (run) => db.runTransaction(run)
        },
        refs: refs(db),
        clock: { now: () => new Date().toISOString() }
    });
}

function mapDomainError(error) {
    if (error instanceof functions.https.HttpsError) return error;
    const code = String(error?.code || '');
    if (code.endsWith('_NOT_FOUND')) {
        return new functions.https.HttpsError(
            'not-found',
            'Commande introuvable.'
        );
    }
    if (
        code.includes('RESULT_ACCESS_DENIED') ||
        code.includes('ACTOR_INVALID')
    ) {
        return new functions.https.HttpsError(
            'permission-denied',
            'Commande administrateur non autorisee.',
            { reason: code }
        );
    }
    if (
        code.includes('ACTION_NOT_ALLOWED') ||
        code.includes('STALE_VERSION') ||
        code.includes('IDEMPOTENCY') ||
        code.includes('AUDIT_APPEND_ONLY')
    ) {
        return new functions.https.HttpsError(
            'aborted',
            'La commande est obsolete, conflictuelle ou non admissible.',
            { reason: code }
        );
    }
    if (code.startsWith('COMMERCE_')) {
        return new functions.https.HttpsError(
            'invalid-argument',
            'Commande fulfillment invalide.',
            { reason: code }
        );
    }
    return new functions.https.HttpsError(
        'internal',
        'La commande fulfillment n a pas pu etre appliquee.'
    );
}

function normalizeCommand(data) {
    return {
        commandId: normalizeFirestoreId(data?.commandId, 'Identifiant commande metier'),
        expectedVersion: data?.expectedVersion
    };
}

function noPayload() {
    return {};
}

function normalizeShipmentPayload(data) {
    if (
        data?.trackingNumber != null &&
        typeof data.trackingNumber !== 'string'
    ) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Numero de suivi invalide.'
        );
    }
    const trackingNumber = data?.trackingNumber?.trim() || null;
    if (trackingNumber !== null && trackingNumber.length > 120) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Numero de suivi invalide.'
        );
    }
    return { trackingNumber: trackingNumber || null };
}

function createAdminOrderCommandHandler(
    action,
    payloadFromData,
    {
        authorize = checkRecentActiveStrongAdmin,
        repositoryFactory = commandRepository
    } = {}
) {
    return async (data, context) => {
        try {
            await authorize(context);
            const request = {
                orderId: normalizeFirestoreId(
                    data?.orderId,
                    'Identifiant commande'
                ),
                action,
                command: normalizeCommand(data),
                actor: {
                    uid: context.auth.uid,
                    role: 'admin',
                    aal2: true
                },
                reason: data?.reason,
                payload: payloadFromData(data || {})
            };
            return await repositoryFactory().execute(request);
        } catch (error) {
            throw mapDomainError(error);
        }
    };
}

const callable = (handler) => regionalFunctions()
    .runWith({ enforceAppCheck: true })
    .https.onCall(withCommerceMutationsEnabled(handler));

const markOrderPreparingAdmin = callable(createAdminOrderCommandHandler(
    'fulfillment_prepare',
    noPayload
));

const markOrderReadyForPickupAdmin = callable(createAdminOrderCommandHandler(
    'fulfillment_ready',
    noPayload
));

const markOrderShippedAdmin = callable(createAdminOrderCommandHandler(
    'fulfillment_ship',
    normalizeShipmentPayload
));

const markOrderPickedUpAdmin = callable(createAdminOrderCommandHandler(
    'fulfillment_pickup',
    noPayload
));

const markOrderDeliveredAdmin = callable(createAdminOrderCommandHandler(
    'fulfillment_deliver',
    noPayload
));

const archiveOrderAdmin = callable(createAdminOrderCommandHandler(
    'archive_order',
    noPayload
));

module.exports = {
    archiveOrderAdmin,
    createAdminOrderCommandHandler,
    markOrderDeliveredAdmin,
    markOrderPickedUpAdmin,
    markOrderPreparingAdmin,
    markOrderReadyForPickupAdmin,
    markOrderShippedAdmin,
    normalizeShipmentPayload
};
