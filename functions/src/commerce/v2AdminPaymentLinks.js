'use strict';

const crypto = require('node:crypto');
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
    assertWorkerRunComplete,
    buildWorkerRunSummary
} = require('./domain/workerRunHealth');
const {
    createAdminPaymentLinkRuntime
} = require('./domain/v2Runtime');
const { createPublicPaymentLinkHandlers } = require('./publicPaymentLinkHandlers.cjs');

const db = admin.firestore();
const ADMIN_SECRETS = [STRIPE_SECRET_KEY, PAYMENT_LINK_HMAC_SECRET];
const PAYMENT_LINK_EXPIRY_RUNTIME_SERVICE_ACCOUNT =
    'admin-payment-link-expiry@secondevienextjsssr.iam.gserviceaccount.com';


let stripeClient;
const callStripe = (method, ...args) => {
    stripeClient ||= require('stripe')(STRIPE_SECRET_KEY.value());
    return stripeClient.paymentIntents[method](...args);
};
function runtime() {
    return createAdminPaymentLinkRuntime({
        db,
        stripe: { paymentIntents: {
            create: (...args) => callStripe('create', ...args),
            retrieve: (...args) => callStripe('retrieve', ...args),
            cancel: (...args) => callStripe('cancel', ...args),
            update: (...args) => callStripe('update', ...args),
        } },
        appId: APP_ID,
        tokenSecret: PAYMENT_LINK_HMAC_SECRET.value(),
        siteUrl: getSiteUrl()
    }).paymentLinks;
}


const { loadControl, normalizeOrderId, normalizeOptionalEmail, mapError, getAdminPaymentLinkPublicHandler, prepareAdminPaymentLinkPaymentHandler, resumeAdminPaymentLinkPaymentHandler } = createPublicPaymentLinkHandlers({
    db, HttpsError: functions.https.HttpsError, normalizeFirestoreId, runtime
});

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




function normalizeDeliveryModeId(value) {
    return normalizeFirestoreId(value, 'Mode de livraison');
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
        const paymentLinks = runtime();
        const [page, setup] = await Promise.all([
            paymentLinks.list({ pageSize, cursor: data?.cursor, reference: data?.reference, paginated: true }),
            paymentLinks.getSetup()
        ]);
        return { ...page, setup };
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




async function expireAdminPaymentLinksHandler({
    logger = console,
    nowMillis = () => Date.now(),
    runId = () => crypto.randomUUID()
} = {}) {
    const startedAtMillis = nowMillis();
    const now = new Date().toISOString();
    const snapshot = await db.collection('orders')
        .where('checkout.channel', '==', ADMIN_PAYMENT_LINK_CHANNEL)
        .where('checkout.status', '==', 'active')
        .where('checkout.expiresAt', '<=', now)
        .orderBy('checkout.expiresAt', 'asc')
        .limit(26)
        .get();
    const outcomes = [];
    for (const document of snapshot.docs.slice(0, 25)) {
        try {
            outcomes.push(await runtime().expire(document.id));
        } catch (error) {
            outcomes.push({ outcome: 'error', code: String(error?.code || 'unknown').slice(0, 80) });
        }
    }
    const failureCount = outcomes.filter((outcome) => outcome?.outcome === 'error').length;
    const outcomeCounts = outcomes.reduce((counts, outcome) => {
        const key = String(outcome?.outcome || 'unknown').slice(0, 40);
        counts[key] = (counts[key] || 0) + 1;
        return counts;
    }, {});
    const summary = buildWorkerRunSummary({
        worker: 'admin_payment_link_expiry',
        runId: runId(),
        startedAtMillis,
        finishedAtMillis: nowMillis(),
        results: [{
            name: 'expired_links',
            result: {
                pages: 1,
                processed: outcomes.length,
                failureCount,
                exhausted: snapshot.size > 25
            }
        }]
    });
    if (summary.status === 'incomplete') logger.error('commerce_worker_incomplete', summary);
    else logger.info('commerce_worker_completed', summary);
    assertWorkerRunComplete(summary);
    return { processed: outcomes.length, outcomeCounts, summary };
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
    .runWith({
        serviceAccount: PAYMENT_LINK_EXPIRY_RUNTIME_SERVICE_ACCOUNT,
        timeoutSeconds: 300,
        memory: '512MB',
        maxInstances: 1,
        secrets: ADMIN_SECRETS
    })
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
