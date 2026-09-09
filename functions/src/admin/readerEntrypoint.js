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

function loadReaderTarget(target) {
    if (MODULE_READERS[target]) return require(MODULE_READERS[target])[target];
    if (!ORDER_READERS[target]) return null;
    const { onCall } = require('firebase-functions/v2/https');
    const { runObserved } = require('../../helpers/observability');
    const handler = require('../commerce/v2OrderQueries')[ORDER_READERS[target]]();
    return onCall({
        region: 'europe-west1', enforceAppCheck: true, cpu: 'gcf_gen1',
        concurrency: 1, minInstances: 0, maxInstances: 1, memory: '256MiB', timeoutSeconds: 60
    }, (request) => runObserved(target, request, (data) => handler(data, request)));
}

const targets = [...Object.keys(ORDER_READERS), ...Object.keys(MODULE_READERS)];
function resolveReaderTarget(environment) {
    return environment.FUNCTION_TARGET || environment.GOOGLE_FUNCTION_TARGET
        || targets.find(name => name.toLowerCase() === environment.K_SERVICE);
}
module.exports = { loadReaderTarget, resolveReaderTarget, targets };
