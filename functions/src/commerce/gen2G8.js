'use strict';

const { onCall } = require('firebase-functions/v2/https');
const { createOrder } = require('./createOrder');
const { getOrderStatusClient } = require('./orderStatus');
const product = require('./v2ProductCommands');
const fulfillment = require('./v2OrderCommands');
const cancellation = require('./v2Cancellation');
const documents = require('./v2DocumentDelivery');
const customerReturns = require('./v2CustomerReturnRequests');
const returns = require('./v2ReturnCommands');
const orders = require('./v2OrderQueries');
const delivery = require('./v2DeliveryPolicyAdmin');
const promotions = require('./v2PromotionCodes');
const { runObserved } = require('../../helpers/observability');

const REGION = 'europe-west1';

const callable = (functionName, legacyFunction, options = {}) => onCall({
    region: REGION,
    enforceAppCheck: true,
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '256MiB',
    timeoutSeconds: 60,
    ...options
}, (request) => runObserved(
    `${functionName}Gen2`,
    request,
    (data) => legacyFunction.run(data, request)
));

const fixed = {
    adjustInventoryAdmin: product.adjustInventoryAdmin,
    archiveOrderAdmin: fulfillment.archiveOrderAdmin,
    cancelReturnAdmin: returns.cancelReturnAdmin,
    createProductAdmin: product.createProductAdmin,
    createPromotionCodeAdmin: promotions.createPromotionCodeAdmin,
    createPublishedProductAdmin: product.createPublishedProductAdmin,
    decideCustomerReturnRequestAdmin: customerReturns.decideCustomerReturnRequestAdmin,
    deleteProductAdmin: product.deleteProductAdmin,
    getDeliveryPolicyAdmin: delivery.getDeliveryPolicyAdmin,
    getOrderTimelineAdminV2: orders.getOrderTimelineAdminV2,
    listCustomerReturnRequestsAdminV2: orders.listCustomerReturnRequestsAdminV2,
    listMyOrdersV2: orders.listMyOrdersV2,
    listOrdersAdminV2: orders.listOrdersAdminV2,
    listPromotionCodesAdmin: promotions.listPromotionCodesAdmin,
    listReturnsAdminV2: orders.listReturnsAdminV2,
    markOrderDeliveredAdmin: fulfillment.markOrderDeliveredAdmin,
    markOrderPickedUpAdmin: fulfillment.markOrderPickedUpAdmin,
    markOrderPreparingAdmin: fulfillment.markOrderPreparingAdmin,
    markOrderReadyForPickupAdmin: fulfillment.markOrderReadyForPickupAdmin,
    markOrderShippedAdmin: fulfillment.markOrderShippedAdmin,
    markReturnReceivedAdmin: returns.markReturnReceivedAdmin,
    openReturnAdmin: returns.openReturnAdmin,
    preflightProductMutationAdmin: product.preflightProductMutationAdmin,
    prepareCommerceDocumentDelivery: documents.prepareCommerceDocumentDelivery,
    previewPromotionCodeV2: promotions.previewPromotionCodeV2,
    publishProductAdmin: product.publishProductAdmin,
    requestCustomerReturn: customerReturns.requestCustomerReturn,
    requestOrderCancellation: cancellation.requestOrderCancellation,
    resolveReturnAdmin: returns.resolveReturnAdmin,
    restockReturnLinesAdmin: returns.restockReturnLinesAdmin,
    saveDeliveryPolicyAdmin: delivery.saveDeliveryPolicyAdmin,
    setPromotionCodeStatusAdmin: promotions.setPromotionCodeStatusAdmin,
    updateOrderTrackingAdmin: fulfillment.updateOrderTrackingAdmin,
    updateProductOfferAdmin: product.updateProductOfferAdmin,
    writeOffReturnLinesAdmin: returns.writeOffReturnLinesAdmin
};

const secretOptions = Object.freeze({
    createOrder: { secrets: ['GMAIL_EMAIL', 'GMAIL_PASSWORD', 'STRIPE_SECRET_KEY'] },
    decideCustomerReturnRequestAdmin: { secrets: ['STRIPE_SECRET_KEY'] },
    requestOrderCancellation: { secrets: ['STRIPE_SECRET_KEY'] }
});

const exported = Object.fromEntries(Object.entries(fixed).map(([name, legacyFunction]) => [
    `${name}Gen2`,
    callable(name, legacyFunction, {
        ...(name === 'prepareCommerceDocumentDelivery' ? { memory: '512MiB' } : {}),
        ...(secretOptions[name] || {})
    })
]));

exported.createOrderGen2 = callable('createOrder', createOrder, secretOptions.createOrder);
exported.getOrderStatusClientGen2 = callable('getOrderStatusClient', getOrderStatusClient);

module.exports = exported;
