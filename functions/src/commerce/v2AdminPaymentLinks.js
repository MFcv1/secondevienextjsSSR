'use strict';

const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { APP_ID, PRODUCT_COLLECTIONS, getSiteUrl } = require('../../helpers/config');
const {
    checkActiveStrongAdmin,
    normalizeFirestoreId
} = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const {
    PAYMENT_LINK_HMAC_SECRET,
    STRIPE_SECRET_KEY
} = require('../../helpers/secrets');
const {
    ADMIN_PAYMENT_LINK_CHANNEL,
    normalizeExpiryMinutes
} = require('./domain/adminPaymentLink');
const {
    createAdminPaymentLinkRuntime
} = require('./domain/v2Runtime');
const { normalizeCommerceControl } = require('./domain/policy');

const db = admin.firestore();
const ADMIN_SECRETS = [STRIPE_SECRET_KEY, PAYMENT_LINK_HMAC_SECRET];

function snapshotExists(snapshot) {
    return typeof snapshot?.exists === 'function' ? snapshot.exists() : snapshot?.exists === true;
}

function runtime() {
    const Stripe = require('stripe');
    return createAdminPaymentLinkRuntime({
        db,
        stripe: Stripe(STRIPE_SECRET_KEY.value()),
        appId: APP_ID,
        tokenSecret: PAYMENT_LINK_HMAC_SECRET.value(),
        siteUrl: getSiteUrl()
    }).paymentLinks;
}

async function loadControl() {
    const snapshot = await db.doc('sys_commerce_control/current').get();
    return normalizeCommerceControl(snapshotExists(snapshot) ? snapshot.data() : null);
}

async function requireAdminPaymentLinksEnabled() {
    const control = await loadControl();
    if (
        control.newCheckoutMode !== 'v2_all' ||
        control.adminMutationMode !== 'v2' ||
        !control.activePolicyVersion
    ) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'Les liens de paiement de secours sont desactives.',
            { reason: 'COMMERCE_ADMIN_PAYMENT_LINKS_OFF' }
        );
    }
    return control;
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

function normalizeDeliveryModeId(value) {
    return normalizeFirestoreId(value, 'Mode de livraison');
}

function normalizeOptionalEmail(value) {
    const email = String(value || '').trim().toLowerCase();
    if (!email) return null;
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new functions.https.HttpsError('invalid-argument', 'Adresse e-mail invalide.');
    }
    return email;
}

function normalizeItems(value) {
    if (!Array.isArray(value) || value.length < 1 || value.length > 20) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Selection de meubles invalide.'
        );
    }
    let totalQuantity = 0;
    const normalized = value.map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            throw new functions.https.HttpsError('invalid-argument', 'Selection de meubles invalide.');
        }
        const productId = normalizeFirestoreId(item.productId, 'Meuble');
        const collectionName = normalizeFirestoreId(
            item.collectionName || 'furniture',
            'Collection'
        );
        if (!PRODUCT_COLLECTIONS.includes(collectionName)) {
            throw new functions.https.HttpsError('invalid-argument', 'Collection non autorisee.');
        }
        const quantity = item.quantity == null ? 1 : item.quantity;
        if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20) {
            throw new functions.https.HttpsError('invalid-argument', 'Quantite invalide.');
        }
        totalQuantity += quantity;
        return {
            productId,
            collectionName,
            variantId: item.variantId == null
                ? null
                : normalizeFirestoreId(item.variantId, 'Variante'),
            quantity
        };
    });
    if (totalQuantity > 20) {
        throw new functions.https.HttpsError('invalid-argument', 'Quantite totale invalide.');
    }
    const identities = normalized.map((item) => (
        `${item.collectionName}:${item.productId}:${item.variantId || ''}`
    ));
    if (new Set(identities).size !== identities.length) {
        throw new functions.https.HttpsError('invalid-argument', 'Un meuble est selectionne plusieurs fois.');
    }
    return normalized;
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

async function createAdminPaymentLinkHandler(data, context) {
    try {
        await checkActiveStrongAdmin(context);
        await requireAdminPaymentLinksEnabled();
        return await runtime().create({
            actorUid: context.auth.uid,
            email: normalizeOptionalEmail(data?.email),
            items: normalizeItems(data?.items),
            deliveryModeId: normalizeDeliveryModeId(data?.deliveryModeId),
            expiryMinutes: normalizeExpiryMinutes(data?.expiryMinutes)
        });
    } catch (error) {
        throw mapError(error);
    }
}

async function listAdminPaymentLinksHandler(data, context) {
    try {
        await checkActiveStrongAdmin(context);
        const pageSize = data?.pageSize == null ? 50 : data.pageSize;
        if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 50) {
            throw new functions.https.HttpsError('invalid-argument', 'Taille de page invalide.');
        }
        const [links, setup] = await Promise.all([
            runtime().list({ pageSize }),
            runtime().getSetup()
        ]);
        return { links, setup };
    } catch (error) {
        throw mapError(error);
    }
}

async function extendAdminPaymentLinkHandler(data, context) {
    try {
        await checkActiveStrongAdmin(context);
        await requireAdminPaymentLinksEnabled();
        return await runtime().extend({
            orderId: normalizeOrderId(data?.orderId),
            actorUid: context.auth.uid,
            expiryMinutes: normalizeExpiryMinutes(data?.expiryMinutes)
        });
    } catch (error) {
        throw mapError(error);
    }
}

async function regenerateAdminPaymentLinkHandler(data, context) {
    try {
        await checkActiveStrongAdmin(context);
        await requireAdminPaymentLinksEnabled();
        return await runtime().regenerate({
            orderId: normalizeOrderId(data?.orderId),
            actorUid: context.auth.uid
        });
    } catch (error) {
        throw mapError(error);
    }
}

async function recreateAdminPaymentLinkHandler(data, context) {
    try {
        await checkActiveStrongAdmin(context);
        await requireAdminPaymentLinksEnabled();
        return await runtime().recreate({
            orderId: normalizeOrderId(data?.orderId),
            actorUid: context.auth.uid,
            expiryMinutes: normalizeExpiryMinutes(data?.expiryMinutes)
        });
    } catch (error) {
        throw mapError(error);
    }
}

async function cancelAdminPaymentLinkHandler(data, context) {
    try {
        await checkActiveStrongAdmin(context);
        await requireAdminPaymentLinksEnabled();
        return await runtime().cancel({
            orderId: normalizeOrderId(data?.orderId),
            actorUid: context.auth.uid
        });
    } catch (error) {
        throw mapError(error);
    }
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

async function expireAdminPaymentLinksHandler() {
    const now = new Date().toISOString();
    const snapshot = await db.collection('orders')
        .where('checkout.channel', '==', ADMIN_PAYMENT_LINK_CHANNEL)
        .where('checkout.status', '==', 'active')
        .where('checkout.expiresAt', '<=', now)
        .orderBy('checkout.expiresAt', 'asc')
        .limit(25)
        .get();
    const outcomes = [];
    for (const document of snapshot.docs) {
        try {
            outcomes.push(await runtime().expire(document.id));
        } catch (error) {
            console.error('Admin payment link expiry failed', {
                orderId: document.id,
                code: String(error?.code || error?.message || 'unknown')
            });
            outcomes.push({ orderId: document.id, outcome: 'error' });
        }
    }
    return { processed: outcomes.length, outcomes };
}

const adminCallable = (handler) => regionalFunctions()
    .runWith({ enforceAppCheck: true, secrets: ADMIN_SECRETS })
    .https.onCall(handler);

const publicCallable = (handler) => regionalFunctions()
    .runWith({ enforceAppCheck: true, secrets: ADMIN_SECRETS })
    .https.onCall(handler);

const createAdminPaymentLink = adminCallable(createAdminPaymentLinkHandler);
const listAdminPaymentLinks = adminCallable(listAdminPaymentLinksHandler);
const extendAdminPaymentLink = adminCallable(extendAdminPaymentLinkHandler);
const regenerateAdminPaymentLink = adminCallable(regenerateAdminPaymentLinkHandler);
const cancelAdminPaymentLink = adminCallable(cancelAdminPaymentLinkHandler);
const getAdminPaymentLinkPublic = publicCallable(getAdminPaymentLinkPublicHandler);
const prepareAdminPaymentLinkPayment = publicCallable(prepareAdminPaymentLinkPaymentHandler);
const recreateAdminPaymentLink = adminCallable(recreateAdminPaymentLinkHandler);
const resumeAdminPaymentLinkPayment = publicCallable(resumeAdminPaymentLinkPaymentHandler);
const expireAdminPaymentLinks = regionalFunctions()
    .runWith({ timeoutSeconds: 300, memory: '512MB', secrets: ADMIN_SECRETS })
    .pubsub.schedule('every 5 minutes')
    .onRun(expireAdminPaymentLinksHandler);

module.exports = {
    cancelAdminPaymentLink,
    cancelAdminPaymentLinkHandler,
    createAdminPaymentLink,
    createAdminPaymentLinkHandler,
    expireAdminPaymentLinks,
    expireAdminPaymentLinksHandler,
    extendAdminPaymentLink,
    extendAdminPaymentLinkHandler,
    getAdminPaymentLinkPublic,
    getAdminPaymentLinkPublicHandler,
    listAdminPaymentLinks,
    listAdminPaymentLinksHandler,
    prepareAdminPaymentLinkPayment,
    prepareAdminPaymentLinkPaymentHandler,
    recreateAdminPaymentLink,
    recreateAdminPaymentLinkHandler,
    regenerateAdminPaymentLink,
    regenerateAdminPaymentLinkHandler,
    resumeAdminPaymentLinkPayment,
    resumeAdminPaymentLinkPaymentHandler
};
