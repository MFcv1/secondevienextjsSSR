// Only reviewed public operations belong here. Never infer membership from a prefix.
export const PUBLIC_OPERATIONS = Object.freeze({
  sendCustomerLoginOtp: Object.freeze({ handler: 'sendCustomerLoginOtpHandler', group: 'otp', ip: true }),
  verifyCustomerLoginOtp: Object.freeze({ handler: 'verifyCustomerLoginOtpHandler', group: 'otp', ip: true }),
  sendGuestCheckoutOtp: Object.freeze({ handler: 'sendGuestCheckoutOtpHandler', group: 'otp', ip: true }),
  verifyGuestCheckoutOtp: Object.freeze({ handler: 'verifyGuestCheckoutOtpHandler', group: 'otp', ip: true }),
  updateUserSessions: Object.freeze({ handler: 'updateUserSessionsHandler', group: 'sessions', auth: true }),
  createCheckoutV2: Object.freeze({ handler: 'createCheckoutV2', group: 'checkout', auth: true }),
  resumeCheckoutV2: Object.freeze({ handler: 'resumeCheckoutV2', group: 'checkout', auth: true }),
  listMyOrdersV2: Object.freeze({ handler: 'listMyOrdersV2', group: 'orders', auth: true }),
  getOrderStatusClient: Object.freeze({ handler: 'getOrderStatusClientHandler', group: 'order-status' }),
  previewPromotionCodeV2: Object.freeze({ handler: 'previewPromotionCodeV2', group: 'promotions', auth: true }),
  getAdminPaymentLinkPublic: Object.freeze({ handler: 'getAdminPaymentLinkPublicHandler', group: 'payment-links' }),
  prepareAdminPaymentLinkPayment: Object.freeze({ handler: 'prepareAdminPaymentLinkPaymentHandler', group: 'payment-links' }),
  resumeAdminPaymentLinkPayment: Object.freeze({ handler: 'resumeAdminPaymentLinkPaymentHandler', group: 'payment-links' }),
  drawNewsletterReward: Object.freeze({ handler: 'drawNewsletterRewardHandler', group: 'newsletter', ip: true }),
  claimNewsletterReward: Object.freeze({ handler: 'claimNewsletterRewardHandler', group: 'newsletter', ip: true }),
  listMyNewsletterRewards: Object.freeze({ handler: 'listMyNewsletterRewardsHandler', group: 'newsletter', auth: true }),
  createQuoteRequest: Object.freeze({ handler: 'createQuoteRequestHandler', group: 'quotes', ip: true }),
  finalizeQuoteRequest: Object.freeze({ handler: 'finalizeQuoteRequestHandler', group: 'quotes' }),
});

export const getPublicOperation = (name) => Object.hasOwn(PUBLIC_OPERATIONS, name) ? PUBLIC_OPERATIONS[name] : null;
export const getPublicOperationEndpoint = (name, groups) => {
  const operation = getPublicOperation(name);
  return operation && String(groups || '').split(',').map(value => value.trim()).includes(operation.group)
    ? `/api/public/${name}` : null;
};
