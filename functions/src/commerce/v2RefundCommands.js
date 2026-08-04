'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { APP_ID } = require('../../helpers/config');
const {
    checkActiveStrongAdmin,
    normalizeFirestoreId
} = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const { STRIPE_SECRET_KEY } = require('../../helpers/secrets');
const {
    withCommerceMutationsEnabled
} = require('./v2ControlGuard');
const {
    createRefundRuntime
} = require('./domain/v2Runtime');

function normalizeReason(value) {
    if (typeof value !== 'string') {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Motif de remboursement invalide.'
        );
    }
    const reason = value.trim();
    if (reason.length < 3 || reason.length > 500) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Motif de remboursement invalide.'
        );
    }
    return reason;
}

function normalizeAmountCents(value) {
    if (
        typeof value !== 'number' ||
        !Number.isSafeInteger(value) ||
        value <= 0
    ) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Montant de remboursement invalide.'
        );
    }
    return value;
}

function refundRuntime() {
    const Stripe = require('stripe');
    return createRefundRuntime({
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
        code.includes('ACTOR_INVALID') ||
        code.includes('ACCESS_DENIED')
    ) {
        return new functions.https.HttpsError(
            'permission-denied',
            'Remboursement administrateur non autorise.',
            { reason: code }
        );
    }
    if (
        code.includes('RESULT_UNKNOWN') ||
        code.includes('PROVIDER_PENDING')
    ) {
        return new functions.https.HttpsError(
            'unavailable',
            'Remboursement en cours de rapprochement. Reessayez avec la meme demande.',
            { reason: code }
        );
    }
    if (
        code.includes('ACTION_NOT_ALLOWED') ||
        code.includes('IDEMPOTENCY') ||
        code.includes('VERSION_CONFLICT') ||
        code.includes('AUDIT_APPEND_ONLY')
    ) {
        return new functions.https.HttpsError(
            'aborted',
            'Remboursement obsolete, conflictuel ou non admissible.',
            { reason: code }
        );
    }
    if (code.startsWith('COMMERCE_')) {
        return new functions.https.HttpsError(
            'invalid-argument',
            'Demande de remboursement invalide.',
            { reason: code }
        );
    }
    return new functions.https.HttpsError(
        'internal',
        'La demande de remboursement n a pas pu etre appliquee.'
    );
}

function createAdminRefundHandler({
    authorize = checkActiveStrongAdmin,
    runtimeFactory = refundRuntime
} = {}) {
    return async (data, context) => {
        try {
            await authorize(context);
            const request = {
                orderId: normalizeFirestoreId(
                    data?.orderId,
                    'Identifiant commande'
                ),
                refundRequestId: normalizeFirestoreId(
                    data?.refundRequestId,
                    'Identifiant remboursement'
                ),
                amountCents: normalizeAmountCents(data?.amountCents),
                actor: {
                    uid: context.auth.uid,
                    role: 'admin',
                    aal2: true
                },
                reason: normalizeReason(data?.reason)
            };
            return await runtimeFactory().refunds.requestRefund(request);
        } catch (error) {
            throw mapDomainError(error);
        }
    };
}

const requestRefundAdmin = regionalFunctions()
    .runWith({
        enforceAppCheck: true,
        secrets: [STRIPE_SECRET_KEY]
    })
    .https.onCall(withCommerceMutationsEnabled(createAdminRefundHandler()));

module.exports = {
    createAdminRefundHandler,
    requestRefundAdmin
};
