'use strict';

const ORDER_READERS = {
    listMyOrdersV2Gen2: 'createListMyOrdersHandler',
    listOrdersAdminV2Gen2: 'createListOrdersAdminHandler',
    listReturnsAdminV2Gen2: 'createListReturnsAdminHandler',
    listCustomerReturnRequestsAdminV2Gen2: 'createListCustomerReturnRequestsAdminHandler',
    getOrderTimelineAdminV2Gen2: 'createGetOrderTimelineAdminHandler'
};
const MODULE_READERS = {
    generatePasskeyAuthenticationOptionsGen2: '../auth/passkeys',
    verifyPasskeyAuthenticationGen2: '../auth/passkeys',
    getBillingGuideStatusGen2: '../onboarding/billingGuide',
    getManualInvoiceWorkspaceAdminGen2: '../invoicing/manualInvoices',
    listQuoteRequestsAdminGen2: '../quotes/quoteRequests',
    getQuoteRequestAdminGen2: '../quotes/quoteRequests'
};
// Keep the deployed callable contract while avoiding the global export graph
// (checkout, mail, analytics and schedulers) in these read-only instances.
const LEGACY_READERS = {
    listPromotionCodesAdminGen2: { module: '../commerce/v2PromotionCodes', exportName: 'listPromotionCodesAdmin' },
    getDeliveryPolicyAdminGen2: { module: '../commerce/v2DeliveryPolicyAdmin', exportName: 'getDeliveryPolicyAdmin' },
    listAdminPaymentLinksGen2: {
        module: '../commerce/v2AdminPaymentLinks', exportName: 'listAdminPaymentLinks',
        secrets: ['STRIPE_SECRET_KEY', 'PAYMENT_LINK_HMAC_SECRET']
    }
};

function loadReaderTarget(target) {
    if (target === 'readAdminSharedGen2') return require('./sharedReader.cjs').loadSharedAdminReader();
    if (MODULE_READERS[target]) return require(MODULE_READERS[target])[target];
    const legacyReader = LEGACY_READERS[target];
    if (!ORDER_READERS[target] && !legacyReader) return null;
    const { onCall } = require('firebase-functions/v2/https');
    const { runObserved } = require('../../helpers/observability');
    const handler = legacyReader
        ? require(legacyReader.module)[legacyReader.exportName].run
        : require('../commerce/v2OrderQueries')[ORDER_READERS[target]]();
    return onCall({
        region: 'europe-west1', enforceAppCheck: true, cpu: 'gcf_gen1',
        concurrency: 1, minInstances: 0, maxInstances: 1, memory: '256MiB', timeoutSeconds: 60,
        ...(legacyReader?.secrets ? { secrets: legacyReader.secrets } : {})
    }, (request) => runObserved(target, request, (data) => handler(data, request)));
}

const targets = ['readAdminSharedGen2', ...Object.keys(ORDER_READERS), ...Object.keys(MODULE_READERS), ...Object.keys(LEGACY_READERS)];
function resolveReaderTarget(environment) {
    return environment.FUNCTION_TARGET || environment.GOOGLE_FUNCTION_TARGET
        || targets.find(name => name.toLowerCase() === environment.K_SERVICE);
}
module.exports = { loadReaderTarget, resolveReaderTarget, targets };
