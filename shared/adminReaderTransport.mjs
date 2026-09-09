const operations = new Set([
  'listOrdersAdminV2', 'listReturnsAdminV2', 'listCustomerReturnRequestsAdminV2',
  'getOrderTimelineAdminV2', 'listQuoteRequestsAdmin', 'getQuoteRequestAdmin',
  'getManualInvoiceWorkspaceAdmin', 'listAdminPaymentLinks', 'listPromotionCodesAdmin',
  'getDeliveryPolicyAdmin',
]);
export const usesSharedAdminReader = (name, enabled) => enabled === 'true' && operations.has(name);
