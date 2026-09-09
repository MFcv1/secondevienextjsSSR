'use strict';
const { normalizeCommerceControl } = require('./domain/policy');

function createPublicPaymentLinkHandlers({ db, HttpsError, normalizeFirestoreId, runtime }) {
const functions = { https: { HttpsError } };
function snapshotExists(snapshot) {
    return typeof snapshot?.exists === 'function' ? snapshot.exists() : snapshot?.exists === true;
}

async function loadControl() {
    const snapshot = await db.doc('sys_commerce_control/current').get();
    return normalizeCommerceControl(snapshotExists(snapshot) ? snapshot.data() : null);
}

async function requirePublicPaymentLinkCheckoutEnabled() {
    const control = await loadControl();
    if (control.newCheckoutMode !== 'v2_all' || !control.activePolicyVersion) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'Ce paiement est temporairement indisponible.',
            { reason: 'COMMERCE_ADMIN_PAYMENT_LINKS_OFF' }
        );
    }
    return control;
}

function normalizeToken(value) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{40,64}$/.test(value)) {
        throw new functions.https.HttpsError('not-found', 'Lien de paiement introuvable.');
    }
    return value;
}

function normalizeOrderId(value) {
    return normalizeFirestoreId(value, 'Lien de paiement');
}

function normalizeOptionalEmail(value) {
    const email = String(value || '').trim().toLowerCase();
    if (!email) return null;
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new functions.https.HttpsError('invalid-argument', 'Adresse e-mail invalide.');
    }
    return email;
}

function normalizeShippingAddress(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new functions.https.HttpsError('invalid-argument', 'Adresse de livraison invalide.');
    }
    const allowed = new Set(['fullName', 'phone', 'line1', 'line2', 'postalCode', 'city', 'country']);
    if (Object.keys(value).some((key) => !allowed.has(key))) {
        throw new functions.https.HttpsError('invalid-argument', 'Adresse de livraison invalide.');
    }
    return value;
}

function mapError(error, { publicRequest = false } = {}) {
    if (error instanceof functions.https.HttpsError) return error;
    const reason = String(error?.code || '');
    if (reason === 'COMMERCE_PROVIDER_RECONCILIATION_REQUIRED') {
        return new functions.https.HttpsError(
            'failed-precondition',
            'Un rapprochement du paiement par l atelier est requis avant de poursuivre.',
            { reason }
        );
    }
    if (reason.includes('ACCESS_DENIED') || reason.includes('NOT_FOUND')) {
        return new functions.https.HttpsError('not-found', 'Lien de paiement introuvable.');
    }
    if (reason.includes('_PAID')) {
        return new functions.https.HttpsError('already-exists', 'Ce paiement est deja confirme.', { reason });
    }
    if (reason.includes('_EXPIRED')) {
        return new functions.https.HttpsError('failed-precondition', 'Ce lien de paiement a expire.', { reason });
    }
    if (reason.includes('_CANCELED')) {
        return new functions.https.HttpsError('failed-precondition', 'Ce lien de paiement a ete annule.', { reason });
    }
    if (
        reason.includes('EMAIL_MISMATCH') ||
        reason.includes('DELIVERY_OUT_OF_ZONE') ||
        reason.includes('ADDRESS_INVALID')
    ) {
        return new functions.https.HttpsError(
            'invalid-argument',
            reason.includes('EMAIL_MISMATCH')
                ? 'Utilisez l adresse e-mail indiquee par l atelier.'
                : 'Les coordonnees de livraison ne sont pas admissibles.',
            { reason }
        );
    }
    if (
        reason.includes('STRIPE_RESULT_UNKNOWN') ||
        reason.includes('CANCEL_UNKNOWN') ||
        reason.includes('CREATE_UNKNOWN')
    ) {
        return new functions.https.HttpsError(
            'unavailable',
            'Stripe est en cours de rapprochement. Reessayez le meme lien sans recreer de commande.',
            { reason }
        );
    }
    if (publicRequest) {
        return new functions.https.HttpsError(
            'failed-precondition',
            'Ce paiement ne peut pas etre initialise pour le moment.',
            { reason }
        );
    }
    if (reason.startsWith('COMMERCE_')) {
        return new functions.https.HttpsError(
            'invalid-argument',
            'La demande de lien de paiement est invalide.',
            { reason }
        );
    }
    return new functions.https.HttpsError(
        'internal',
        'Le lien de paiement n a pas pu etre traite.'
    );
}

async function getAdminPaymentLinkPublicHandler(data) {
    try {
        return await runtime().getPublic({
            orderId: normalizeOrderId(data?.orderId),
            token: normalizeToken(data?.token)
        });
    } catch (error) {
        throw mapError(error, { publicRequest: true });
    }
}

async function prepareAdminPaymentLinkPaymentHandler(data) {
    try {
        await requirePublicPaymentLinkCheckoutEnabled();
        return await runtime().bindCustomerDetails({
            orderId: normalizeOrderId(data?.orderId),
            token: normalizeToken(data?.token),
            email: normalizeOptionalEmail(data?.email),
            shippingAddress: normalizeShippingAddress(data?.shippingAddress)
        });
    } catch (error) {
        throw mapError(error, { publicRequest: true });
    }
}

async function resumeAdminPaymentLinkPaymentHandler(data) {
    try {
        await requirePublicPaymentLinkCheckoutEnabled();
        return await runtime().resumePayment({
            orderId: normalizeOrderId(data?.orderId),
            token: normalizeToken(data?.token)
        });
    } catch (error) {
        throw mapError(error, { publicRequest: true });
    }
}

return { snapshotExists, loadControl, requirePublicPaymentLinkCheckoutEnabled, normalizeToken, normalizeOrderId, normalizeOptionalEmail, normalizeShippingAddress, mapError, getAdminPaymentLinkPublicHandler, prepareAdminPaymentLinkPaymentHandler, resumeAdminPaymentLinkPaymentHandler };
}
module.exports = { createPublicPaymentLinkHandlers };
