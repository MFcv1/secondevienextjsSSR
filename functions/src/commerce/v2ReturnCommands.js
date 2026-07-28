'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { APP_ID } = require('../../helpers/config');
const {
    checkRecentActiveStrongAdmin,
    normalizeFirestoreId
} = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const {
    withCommerceMutationsEnabled
} = require('./v2ControlGuard');
const { createReturnRuntime } = require('./domain/v2Runtime');

function normalizeReason(value) {
    if (typeof value !== 'string') {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Motif de retour invalide.'
        );
    }
    const reason = value.trim();
    if (reason.length < 3 || reason.length > 500) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Motif de retour invalide.'
        );
    }
    return reason;
}

function normalizeRequestId(value, label) {
    const id = normalizeFirestoreId(value, label);
    if (id.length < 8) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            `${label} invalide.`
        );
    }
    return id;
}

function normalizeExpectedVersion(value) {
    if (!Number.isSafeInteger(value) || value < 0) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Version de retour invalide.'
        );
    }
    return value;
}

function normalizeLines(value, label) {
    if (!Array.isArray(value) || value.length < 1 || value.length > 50) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            `${label} invalides.`
        );
    }
    const seen = new Set();
    return value.map((line) => {
        const lineId = normalizeFirestoreId(
            line?.lineId,
            'Identifiant ligne'
        );
        if (
            seen.has(lineId) ||
            !Number.isSafeInteger(line?.quantity) ||
            line.quantity <= 0
        ) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                `${label} invalides.`
            );
        }
        seen.add(lineId);
        return { lineId, quantity: line.quantity };
    });
}

function returnRuntime() {
    return createReturnRuntime({
        db: admin.firestore(),
        appId: APP_ID
    });
}

function mapDomainError(error) {
    if (error instanceof functions.https.HttpsError) return error;
    const code = String(error?.code || '');
    if (code.endsWith('_NOT_FOUND')) {
        return new functions.https.HttpsError(
            'not-found',
            'Commande ou retour introuvable.'
        );
    }
    if (
        code.includes('ACTOR_INVALID') ||
        code.includes('ACCESS_DENIED')
    ) {
        return new functions.https.HttpsError(
            'permission-denied',
            'Commande de retour administrateur non autorisee.',
            { reason: code }
        );
    }
    if (
        code.includes('ACTION_NOT_ALLOWED') ||
        code.includes('STALE_VERSION') ||
        code.includes('IDEMPOTENCY') ||
        code.includes('AUDIT_APPEND_ONLY') ||
        code.includes('ALREADY_EXISTS')
    ) {
        return new functions.https.HttpsError(
            'aborted',
            'La commande de retour est obsolete, conflictuelle ou non admissible.',
            { reason: code }
        );
    }
    if (code.startsWith('COMMERCE_')) {
        return new functions.https.HttpsError(
            'invalid-argument',
            'Commande de retour invalide.',
            { reason: code }
        );
    }
    return new functions.https.HttpsError(
        'internal',
        'La commande de retour n a pas pu etre appliquee.'
    );
}

function actorFromContext(context) {
    return {
        uid: context.auth.uid,
        role: 'admin',
        aal2: true
    };
}

function createAdminOpenReturnHandler({
    authorize = checkRecentActiveStrongAdmin,
    runtimeFactory = returnRuntime
} = {}) {
    return async (data, context) => {
        try {
            await authorize(context);
            const request = {
                orderId: normalizeFirestoreId(
                    data?.orderId,
                    'Identifiant commande'
                ),
                returnRequestId: normalizeRequestId(
                    data?.returnRequestId,
                    'Identifiant demande retour'
                ),
                requestedLines: normalizeLines(
                    data?.requestedLines,
                    'Lignes de retour'
                ),
                actor: actorFromContext(context),
                reason: normalizeReason(data?.reason)
            };
            return await runtimeFactory().returns.create(request);
        } catch (error) {
            throw mapDomainError(error);
        }
    };
}

function createAdminReturnCommandHandler(
    eventType,
    { withLines = false } = {},
    {
        authorize = checkRecentActiveStrongAdmin,
        runtimeFactory = returnRuntime
    } = {}
) {
    return async (data, context) => {
        try {
            await authorize(context);
            const event = { type: eventType };
            if (withLines) {
                event.lines = normalizeLines(
                    data?.lines,
                    'Quantites de retour'
                );
            }
            const request = {
                orderId: normalizeFirestoreId(
                    data?.orderId,
                    'Identifiant commande'
                ),
                returnId: normalizeFirestoreId(
                    data?.returnId,
                    'Identifiant retour'
                ),
                commandId: normalizeRequestId(
                    data?.commandId,
                    'Identifiant commande metier'
                ),
                expectedVersion: normalizeExpectedVersion(
                    data?.expectedVersion
                ),
                event,
                actor: actorFromContext(context),
                reason: normalizeReason(data?.reason)
            };
            return await runtimeFactory().returns.apply(request);
        } catch (error) {
            throw mapDomainError(error);
        }
    };
}

const callable = (handler) => regionalFunctions()
    .runWith({ enforceAppCheck: true })
    .https.onCall(withCommerceMutationsEnabled(handler));

const openReturnAdmin = callable(createAdminOpenReturnHandler());
const cancelReturnAdmin = callable(createAdminReturnCommandHandler('cancel'));
const markReturnReceivedAdmin = callable(createAdminReturnCommandHandler(
    'receive',
    { withLines: true }
));
const restockReturnLinesAdmin = callable(createAdminReturnCommandHandler(
    'restock',
    { withLines: true }
));
const writeOffReturnLinesAdmin = callable(createAdminReturnCommandHandler(
    'write_off',
    { withLines: true }
));
const resolveReturnAdmin = callable(createAdminReturnCommandHandler('resolve'));

module.exports = {
    cancelReturnAdmin,
    createAdminOpenReturnHandler,
    createAdminReturnCommandHandler,
    markReturnReceivedAdmin,
    openReturnAdmin,
    resolveReturnAdmin,
    restockReturnLinesAdmin,
    writeOffReturnLinesAdmin
};
