'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { APP_ID } = require('../../helpers/config');
const {
    normalizeFirestoreId
} = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const { STRIPE_SECRET_KEY } = require('../../helpers/secrets');
const {
    withCommerceMutationsEnabled
} = require('./v2ControlGuard');
const {
    createCancellationRuntime
} = require('./domain/v2Runtime');

function requireAuthenticatedOwner(context) {
    const uid = context.auth?.uid;
    if (typeof uid !== 'string' || uid.length < 1) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentification requise.'
        );
    }
    return uid;
}

function normalizeReason(value) {
    if (typeof value !== 'string') {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Motif d annulation invalide.'
        );
    }
    const reason = value.trim();
    if (reason.length < 3 || reason.length > 500) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Motif d annulation invalide.'
        );
    }
    return reason;
}

function cancellationRuntime() {
    const Stripe = require('stripe');
    return createCancellationRuntime({
        db: admin.firestore(),
        stripe: Stripe(STRIPE_SECRET_KEY.value()),
        appId: APP_ID
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
        code.includes('ACCESS_DENIED') ||
        code.includes('OWNER_INVALID')
    ) {
        return new functions.https.HttpsError(
            'permission-denied',
            'Cette commande ne vous appartient pas.',
            { reason: code }
        );
    }
    if (
        code.includes('CANCEL_UNKNOWN') ||
        code.includes('STRIPE_RESULT_UNKNOWN')
    ) {
        return new functions.https.HttpsError(
            'unavailable',
            'Annulation en cours de rapprochement. Reessayez sans changer la commande.',
            { reason: code }
        );
    }
    if (
        code.includes('ACTION_NOT_ALLOWED') ||
        code.includes('IDEMPOTENCY') ||
        code.includes('AUDIT_CONFLICT') ||
        code.includes('ATTEMPT_VERSION_CONFLICT')
    ) {
        return new functions.https.HttpsError(
            'aborted',
            'Annulation obsolete, conflictuelle ou non admissible.',
            { reason: code }
        );
    }
    if (code.startsWith('COMMERCE_')) {
        return new functions.https.HttpsError(
            'invalid-argument',
            'Demande d annulation invalide.',
            { reason: code }
        );
    }
    return new functions.https.HttpsError(
        'internal',
        'La demande d annulation n a pas pu etre appliquee.'
    );
}

function createClientCancellationHandler({
    authorize = requireAuthenticatedOwner,
    runtimeFactory = cancellationRuntime
} = {}) {
    return async (data, context) => {
        try {
            const ownerUid = authorize(context);
            const request = {
                orderId: normalizeFirestoreId(
                    data?.orderId,
                    'Identifiant commande'
                ),
                commandId: normalizeFirestoreId(
                    data?.commandId,
                    'Identifiant commande metier'
                ),
                ownerUid,
                reason: normalizeReason(data?.reason)
            };
            return await runtimeFactory().cancellations.requestCancellation(
                request
            );
        } catch (error) {
            throw mapDomainError(error);
        }
    };
}

const requestOrderCancellation = regionalFunctions()
    .runWith({
        enforceAppCheck: true,
        secrets: [STRIPE_SECRET_KEY]
    })
    .https.onCall(withCommerceMutationsEnabled(
        createClientCancellationHandler()
    ));

module.exports = {
    createClientCancellationHandler,
    requestOrderCancellation
};
