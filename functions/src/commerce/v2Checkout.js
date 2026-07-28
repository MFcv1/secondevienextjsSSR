'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { APP_ID } = require('../../helpers/config');
const { normalizeFirestoreId } = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const { STRIPE_SECRET_KEY } = require('../../helpers/secrets');
const { createCheckoutRuntime } = require('./domain/v2Runtime');

function requireOwner(context) {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentification Firebase requise avant le checkout.'
        );
    }
    return {
        uid: context.auth.uid,
        email: typeof context.auth.token?.email === 'string'
            ? context.auth.token.email
            : null
    };
}

function checkoutRuntime() {
    const Stripe = require('stripe');
    return createCheckoutRuntime({
        db: admin.firestore(),
        stripe: Stripe(STRIPE_SECRET_KEY.value()),
        appId: APP_ID
    });
}

function mapDomainError(error) {
    if (error instanceof functions.https.HttpsError) return error;
    const code = String(error?.code || '');
    if (code.includes('MODE_OFF') || code.includes('FIXTURE_SCOPE')) {
        return new functions.https.HttpsError(
            'failed-precondition',
            'Le checkout v2 est desactive.',
            { reason: code }
        );
    }
    if (code.endsWith('_NOT_FOUND')) {
        return new functions.https.HttpsError(
            'not-found',
            'Commande introuvable.'
        );
    }
    if (
        code.includes('OWNER_INVALID') ||
        code.includes('ACCESS_DENIED')
    ) {
        return new functions.https.HttpsError(
            'permission-denied',
            'Acces a la commande refuse.',
            { reason: code }
        );
    }
    if (
        code.includes('IDEMPOTENCY') ||
        code.includes('RESULT_UNKNOWN') ||
        code.includes('CREATE_UNKNOWN')
    ) {
        return new functions.https.HttpsError(
            'aborted',
            'Checkout en cours de rapprochement. Reprenez la meme commande.',
            { reason: code }
        );
    }
    if (code.startsWith('COMMERCE_')) {
        return new functions.https.HttpsError(
            'invalid-argument',
            'Demande de checkout invalide.',
            { reason: code }
        );
    }
    return new functions.https.HttpsError(
        'internal',
        'Le checkout n a pas pu etre initialise.'
    );
}

function createCheckoutHandler({
    authorize = requireOwner,
    runtimeFactory = checkoutRuntime
} = {}) {
    return async (data, context) => {
        try {
            const owner = authorize(context);
            if (!data?.input || typeof data.input !== 'object' || Array.isArray(data.input)) {
                throw new functions.https.HttpsError(
                    'invalid-argument',
                    'Contrat checkout invalide.'
                );
            }
            return await runtimeFactory().checkout.createCheckout({
                ownerUid: owner.uid,
                ownerEmail: owner.email,
                input: data.input
            });
        } catch (error) {
            throw mapDomainError(error);
        }
    };
}

function createResumeCheckoutHandler({
    authorize = requireOwner,
    runtimeFactory = checkoutRuntime
} = {}) {
    return async (data, context) => {
        try {
            const owner = authorize(context);
            const orderId = normalizeFirestoreId(
                data?.orderId,
                'Identifiant commande'
            );
            return await runtimeFactory().checkout.resumeCheckout({
                orderId,
                ownerUid: owner.uid
            });
        } catch (error) {
            throw mapDomainError(error);
        }
    };
}

const callable = (handler) => regionalFunctions()
    .runWith({
        enforceAppCheck: true,
        secrets: [STRIPE_SECRET_KEY]
    })
    .https.onCall(handler);

const createCheckoutV2 = callable(createCheckoutHandler());
const resumeCheckoutV2 = callable(createResumeCheckoutHandler());

module.exports = {
    createCheckoutHandler,
    createCheckoutV2,
    createResumeCheckoutHandler,
    resumeCheckoutV2
};
