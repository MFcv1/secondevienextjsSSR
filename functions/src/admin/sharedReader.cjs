'use strict';

// First pages and exact details used by the back-office. No exports, rebuilds or mutations.
const loaders = Object.freeze({
    listOrdersAdminV2: () => require('../commerce/v2OrderQueries').createListOrdersAdminHandler(),
    listReturnsAdminV2: () => require('../commerce/v2OrderQueries').createListReturnsAdminHandler(),
    listCustomerReturnRequestsAdminV2: () => require('../commerce/v2OrderQueries').createListCustomerReturnRequestsAdminHandler(),
    getOrderTimelineAdminV2: () => require('../commerce/v2OrderQueries').createGetOrderTimelineAdminHandler(),
    listQuoteRequestsAdmin: () => require('../quotes/quoteRequests').listQuoteRequestsAdminHandler,
    getQuoteRequestAdmin: () => require('../quotes/quoteRequests').getQuoteRequestAdminHandler,
    getManualInvoiceWorkspaceAdmin: () => require('../invoicing/manualInvoices').getManualInvoiceWorkspaceAdmin.run,
    listAdminPaymentLinks: () => require('../commerce/v2AdminPaymentLinks').listAdminPaymentLinksHandler,
    listPromotionCodesAdmin: () => require('../commerce/v2PromotionCodes').listPromotionCodesAdmin.run,
    getDeliveryPolicyAdmin: () => require('../commerce/v2DeliveryPolicyAdmin').getDeliveryPolicyAdmin.run,
});

function createSharedAdminReader({ authorize, HttpsError, operations = loaders }) {
    const handlers = new Map();
    return async (payload, context) => {
        await authorize(context);
        const operation = payload?.operation;
        if (typeof operation !== 'string' || !Object.hasOwn(operations, operation)) {
            throw new HttpsError('invalid-argument', 'Lecture administrateur inconnue.');
        }
        if (!payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) {
            throw new HttpsError('invalid-argument', 'Requete invalide.');
        }
        // Retain code only, never user results. Every request rechecks the live registry.
        if (!handlers.has(operation)) handlers.set(operation, operations[operation]());
        return handlers.get(operation)(payload.data, context);
    };
}

function loadSharedAdminReader() {
    const { onCall, HttpsError } = require('firebase-functions/v2/https');
    const { checkActiveStrongAdmin } = require('../../helpers/security');
    const handler = createSharedAdminReader({ authorize: checkActiveStrongAdmin, HttpsError });
    return onCall({
        region: 'europe-west1', cpu: 1, memory: '512MiB', concurrency: 4,
        minInstances: 0, maxInstances: 1, timeoutSeconds: 60, enforceAppCheck: true,
        serviceAccount: 'admin-reader-runtime@secondevienextjsssr.iam.gserviceaccount.com',
        secrets: ['PAYMENT_LINK_HMAC_SECRET'],
    }, request => handler(request.data, request));
}
module.exports = { createSharedAdminReader, loadSharedAdminReader, operations: Object.keys(loaders) };
