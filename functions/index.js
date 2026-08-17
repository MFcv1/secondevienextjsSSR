/**
 * ============================================================
 * SECONDE VIE — Cloud Functions Entry Point
 * ============================================================
 */
const admin = require('firebase-admin');
admin.initializeApp();

// ── COMMERCE ──────────────────────────────────────────────
const { createOrder } = require('./src/commerce/createOrder');
const { stripeWebhook, stripeConnectWebhook } = require('./src/commerce/stripeWebhook');
const { cancelOrderClient } = require('./src/commerce/cancelOrder');
const { e2eCheckoutProof } = require('./src/commerce/e2eCheckoutProof');
const { e2eStripeHardeningProof } = require('./src/commerce/e2eStripeHardeningProof');
const { getOrderStatusClient } = require('./src/commerce/orderStatus');
const { refundOrderAdmin, syncRefundStatusAdmin } = require('./src/commerce/refundOrder');
const {
    getStripeConnectStatus,
    startStripeConnectOnboarding,
    syncStripeConnectAccount,
    requestStripeConnectReconnect,
    confirmStripeConnectReconnect
} = require('./src/commerce/stripeConnect');

exports.createOrder = createOrder;
exports.stripeWebhook = stripeWebhook;
exports.stripeConnectWebhook = stripeConnectWebhook;
exports.cancelOrderClient = cancelOrderClient;
exports.e2eCheckoutProof = e2eCheckoutProof;
exports.e2eStripeHardeningProof = e2eStripeHardeningProof;
exports.getOrderStatusClient = getOrderStatusClient;
exports.refundOrderAdmin = refundOrderAdmin;
exports.syncRefundStatusAdmin = syncRefundStatusAdmin;
exports.getStripeConnectStatus = getStripeConnectStatus;
exports.startStripeConnectOnboarding = startStripeConnectOnboarding;
exports.syncStripeConnectAccount = syncStripeConnectAccount;
exports.requestStripeConnectReconnect = requestStripeConnectReconnect;
exports.confirmStripeConnectReconnect = confirmStripeConnectReconnect;

// ── COMMERCE V2 (controle serveur fail-closed) ───────────
const {
    adjustInventoryAdmin,
    deleteProductAdmin,
    createProductAdmin,
    createPublishedProductAdmin,
    preflightProductMutationAdmin,
    publishProductAdmin,
    updateProductOfferAdmin
} = require('./src/commerce/v2ProductCommands');
const {
    archiveOrderAdmin,
    markOrderDeliveredAdmin,
    markOrderPickedUpAdmin,
    markOrderPreparingAdmin,
    markOrderReadyForPickupAdmin,
    markOrderShippedAdmin,
    updateOrderTrackingAdmin
} = require('./src/commerce/v2OrderCommands');
const {
    requestOrderCancellation
} = require('./src/commerce/v2Cancellation');
const {
    prepareCommerceDocumentDelivery
} = require('./src/commerce/v2DocumentDelivery');
const {
    requestRefundAdmin
} = require('./src/commerce/v2RefundCommands');
const {
    decideCustomerReturnRequestAdmin,
    requestCustomerReturn
} = require('./src/commerce/v2CustomerReturnRequests');
const {
    cancelReturnAdmin,
    markReturnReceivedAdmin,
    openReturnAdmin,
    resolveReturnAdmin,
    restockReturnLinesAdmin,
    writeOffReturnLinesAdmin
} = require('./src/commerce/v2ReturnCommands');
const {
    createCheckoutV2,
    resumeCheckoutV2
} = require('./src/commerce/v2Checkout');
const {
    getOrderTimelineAdminV2,
    listMyOrdersV2,
    listOrdersAdminV2,
    listCustomerReturnRequestsAdminV2,
    listReturnsAdminV2
} = require('./src/commerce/v2OrderQueries');
const {
    cleanupFixtureRunAdmin,
    commerceOperationsReconciler,
    commerceOutboxDispatcher,
    getCommerceOperationsStatusAdmin,
    rebuildCommerceOperationsAdmin
} = require('./src/commerce/v2Operations');
const {
    commerceReservationExpiryDispatcher
} = require('./src/commerce/v2ReservationExpiry');
const {
    stripeConnectWebhookV2,
    stripeWebhookV2
} = require('./src/commerce/v2Webhooks');
const {
    cancelAdminPaymentLink,
    createAdminPaymentLink,
    expireAdminPaymentLinks,
    extendAdminPaymentLink,
    getAdminPaymentLinkPublic,
    listAdminPaymentLinks,
    prepareAdminPaymentLinkPayment,
    recreateAdminPaymentLink,
    regenerateAdminPaymentLink,
    resumeAdminPaymentLinkPayment
} = require('./src/commerce/v2AdminPaymentLinks');
const {
    getDeliveryPolicyAdmin,
    saveDeliveryPolicyAdmin
} = require('./src/commerce/v2DeliveryPolicyAdmin');

exports.adjustInventoryAdmin = adjustInventoryAdmin;
exports.deleteProductAdmin = deleteProductAdmin;
exports.createProductAdmin = createProductAdmin;
exports.createPublishedProductAdmin = createPublishedProductAdmin;
exports.preflightProductMutationAdmin = preflightProductMutationAdmin;
exports.publishProductAdmin = publishProductAdmin;
exports.updateProductOfferAdmin = updateProductOfferAdmin;
exports.archiveOrderAdmin = archiveOrderAdmin;
exports.markOrderDeliveredAdmin = markOrderDeliveredAdmin;
exports.markOrderPickedUpAdmin = markOrderPickedUpAdmin;
exports.markOrderPreparingAdmin = markOrderPreparingAdmin;
exports.markOrderReadyForPickupAdmin = markOrderReadyForPickupAdmin;
exports.markOrderShippedAdmin = markOrderShippedAdmin;
exports.updateOrderTrackingAdmin = updateOrderTrackingAdmin;
exports.requestOrderCancellation = requestOrderCancellation;
exports.prepareCommerceDocumentDelivery = prepareCommerceDocumentDelivery;
exports.requestRefundAdmin = requestRefundAdmin;
exports.decideCustomerReturnRequestAdmin = decideCustomerReturnRequestAdmin;
exports.requestCustomerReturn = requestCustomerReturn;
exports.cancelReturnAdmin = cancelReturnAdmin;
exports.markReturnReceivedAdmin = markReturnReceivedAdmin;
exports.openReturnAdmin = openReturnAdmin;
exports.resolveReturnAdmin = resolveReturnAdmin;
exports.restockReturnLinesAdmin = restockReturnLinesAdmin;
exports.writeOffReturnLinesAdmin = writeOffReturnLinesAdmin;
exports.createCheckoutV2 = createCheckoutV2;
exports.resumeCheckoutV2 = resumeCheckoutV2;
exports.getOrderTimelineAdminV2 = getOrderTimelineAdminV2;
exports.listMyOrdersV2 = listMyOrdersV2;
exports.listOrdersAdminV2 = listOrdersAdminV2;
exports.listCustomerReturnRequestsAdminV2 = listCustomerReturnRequestsAdminV2;
exports.listReturnsAdminV2 = listReturnsAdminV2;
exports.cleanupFixtureRunAdmin = cleanupFixtureRunAdmin;
exports.commerceOperationsReconciler = commerceOperationsReconciler;
exports.commerceOutboxDispatcher = commerceOutboxDispatcher;
exports.commerceReservationExpiryDispatcher = commerceReservationExpiryDispatcher;
exports.getCommerceOperationsStatusAdmin = getCommerceOperationsStatusAdmin;
exports.rebuildCommerceOperationsAdmin = rebuildCommerceOperationsAdmin;
exports.stripeWebhookV2 = stripeWebhookV2;
exports.stripeConnectWebhookV2 = stripeConnectWebhookV2;
exports.cancelAdminPaymentLink = cancelAdminPaymentLink;
exports.createAdminPaymentLink = createAdminPaymentLink;
exports.expireAdminPaymentLinks = expireAdminPaymentLinks;
exports.extendAdminPaymentLink = extendAdminPaymentLink;
exports.getAdminPaymentLinkPublic = getAdminPaymentLinkPublic;
exports.listAdminPaymentLinks = listAdminPaymentLinks;
exports.prepareAdminPaymentLinkPayment = prepareAdminPaymentLinkPayment;
exports.recreateAdminPaymentLink = recreateAdminPaymentLink;
exports.regenerateAdminPaymentLink = regenerateAdminPaymentLink;
exports.resumeAdminPaymentLinkPayment = resumeAdminPaymentLinkPayment;
exports.getDeliveryPolicyAdmin = getDeliveryPolicyAdmin;
exports.saveDeliveryPolicyAdmin = saveDeliveryPolicyAdmin;

// ── PUBLICATION PRODUIT DURABLE ──────────────────────────
const {
    cleanupProductPublicationSessions,
    getProductPublicationSessionAdmin,
    processProductPublicationImage,
    reconcileProductPublicationSessions,
    reportProductPublicationClientErrorAdmin,
    retryProductPublicationFinalizationAdmin,
    startProductPublicationAdmin
} = require('./src/publication/productPublication');

exports.cleanupProductPublicationSessions = cleanupProductPublicationSessions;
exports.getProductPublicationSessionAdmin = getProductPublicationSessionAdmin;
exports.processProductPublicationImage = processProductPublicationImage;
exports.reconcileProductPublicationSessions = reconcileProductPublicationSessions;
exports.reportProductPublicationClientErrorAdmin = reportProductPublicationClientErrorAdmin;
exports.retryProductPublicationFinalizationAdmin = retryProductPublicationFinalizationAdmin;
exports.startProductPublicationAdmin = startProductPublicationAdmin;

// ── PUBLICATION META (OAuth + Instagram/Facebook) ───────
const {
    disconnectInstagramConnectionAdmin,
    disconnectMetaConnectionAdmin,
    getInstagramConnectionStatusAdmin,
    getMetaConnectionStatusAdmin,
    getSocialPublicationStatusAdmin,
    instagramOAuthCallback,
    metaOAuthCallback,
    prepareSocialPublicationAdmin,
    runSocialPublicationAdmin,
    selectMetaAssetAdmin,
    startInstagramOAuthAdmin,
    startMetaOAuthAdmin,
    verifyInstagramConnectionAdmin,
    verifyMetaConnectionAdmin
} = require('./src/integrations/meta');

exports.disconnectInstagramConnectionAdmin = disconnectInstagramConnectionAdmin;
exports.disconnectMetaConnectionAdmin = disconnectMetaConnectionAdmin;
exports.getInstagramConnectionStatusAdmin = getInstagramConnectionStatusAdmin;
exports.getMetaConnectionStatusAdmin = getMetaConnectionStatusAdmin;
exports.getSocialPublicationStatusAdmin = getSocialPublicationStatusAdmin;
exports.instagramOAuthCallback = instagramOAuthCallback;
exports.metaOAuthCallback = metaOAuthCallback;
exports.prepareSocialPublicationAdmin = prepareSocialPublicationAdmin;
exports.runSocialPublicationAdmin = runSocialPublicationAdmin;
exports.selectMetaAssetAdmin = selectMetaAssetAdmin;
exports.startInstagramOAuthAdmin = startInstagramOAuthAdmin;
exports.startMetaOAuthAdmin = startMetaOAuthAdmin;
exports.verifyInstagramConnectionAdmin = verifyInstagramConnectionAdmin;
exports.verifyMetaConnectionAdmin = verifyMetaConnectionAdmin;

// ── AUTH ──────────────────────────────────────────────────
const { grantAdminOnAuth } = require('./src/auth/grantAdmin');
const { onRegisteredUserCreated, onRegisteredUserDeleted } = require('./src/auth/userStats');
const { addAdminUser, removeAdminUser, logUserConnection, getUserStats, syncSuperAdminClaim, ensureAdminAccessRegistry } = require('./src/auth/adminManagement');
const { sendGuestCheckoutOtp, verifyGuestCheckoutOtp } = require('./src/auth/guestCheckoutOtp');
const { sendCustomerLoginOtp, verifyCustomerLoginOtp } = require('./src/auth/customerLoginOtp');
const {
    generatePasskeyRegistrationOptions,
    verifyPasskeyRegistration,
    generatePasskeyAuthenticationOptions,
    verifyPasskeyAuthentication
} = require('./src/auth/passkeys');

exports.grantAdminOnAuth = grantAdminOnAuth;
exports.onRegisteredUserCreated = onRegisteredUserCreated;
exports.onRegisteredUserDeleted = onRegisteredUserDeleted;
exports.addAdminUser = addAdminUser;
exports.removeAdminUser = removeAdminUser;
exports.logUserConnection = logUserConnection;
exports.getUserStats = getUserStats;
exports.syncSuperAdminClaim = syncSuperAdminClaim;
exports.ensureAdminAccessRegistry = ensureAdminAccessRegistry;
exports.sendGuestCheckoutOtp = sendGuestCheckoutOtp;
exports.verifyGuestCheckoutOtp = verifyGuestCheckoutOtp;
exports.sendCustomerLoginOtp = sendCustomerLoginOtp;
exports.verifyCustomerLoginOtp = verifyCustomerLoginOtp;
exports.generatePasskeyRegistrationOptions = generatePasskeyRegistrationOptions;
exports.verifyPasskeyRegistration = verifyPasskeyRegistration;
exports.generatePasskeyAuthenticationOptions = generatePasskeyAuthenticationOptions;
exports.verifyPasskeyAuthentication = verifyPasskeyAuthentication;

// â”€â”€ ONBOARDING FACTURATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const {
    getBillingGuideStatus,
    saveBillingGuideProgress,
    getBillingGuideOperatorStatus,
    completeBillingGuideAdmin,
    resetBillingGuideTest
} = require('./src/onboarding/billingGuide');

exports.getBillingGuideStatus = getBillingGuideStatus;
exports.saveBillingGuideProgress = saveBillingGuideProgress;
exports.getBillingGuideOperatorStatus = getBillingGuideOperatorStatus;
exports.completeBillingGuideAdmin = completeBillingGuideAdmin;
exports.resetBillingGuideTest = resetBillingGuideTest;

// ── FACTURES MANUELLES ADMIN ─────────────────────────────
const {
    getManualInvoiceWorkspaceAdmin,
    prepareManualInvoicePdfAdmin,
    saveManualInvoiceDraftAdmin,
    sendManualInvoiceAdmin
} = require('./src/invoicing/manualInvoices');

exports.getManualInvoiceWorkspaceAdmin = getManualInvoiceWorkspaceAdmin;
exports.prepareManualInvoicePdfAdmin = prepareManualInvoicePdfAdmin;
exports.saveManualInvoiceDraftAdmin = saveManualInvoiceDraftAdmin;
exports.sendManualInvoiceAdmin = sendManualInvoiceAdmin;

// ── DEMANDES DE DEVIS ───────────────────────────────────
const {
    createQuoteRequest,
    uploadQuoteRequestPhoto,
    finalizeQuoteRequest,
    listQuoteRequestsAdmin,
    getQuoteRequestAdmin,
    updateQuoteRequestAdmin,
    onQuoteRequestSubmitted
} = require('./src/quotes/quoteRequests');

exports.createQuoteRequest = createQuoteRequest;
exports.uploadQuoteRequestPhoto = uploadQuoteRequestPhoto;
exports.finalizeQuoteRequest = finalizeQuoteRequest;
exports.listQuoteRequestsAdmin = listQuoteRequestsAdmin;
exports.getQuoteRequestAdmin = getQuoteRequestAdmin;
exports.updateQuoteRequestAdmin = updateQuoteRequestAdmin;
exports.onQuoteRequestSubmitted = onQuoteRequestSubmitted;

// ── NEWSLETTER ET AVANTAGES CLIENT ─────────────────────
const {
    claimNewsletterReward,
    drawNewsletterReward,
    listMyNewsletterRewards
} = require('./src/newsletter/newsletterRewards');

exports.claimNewsletterReward = claimNewsletterReward;
exports.drawNewsletterReward = drawNewsletterReward;
exports.listMyNewsletterRewards = listMyNewsletterRewards;

// ── CODES PROMOTIONNELS SERVEUR ─────────────────────────
const {
    createPromotionCodeAdmin,
    listPromotionCodesAdmin,
    previewPromotionCodeV2,
    setPromotionCodeStatusAdmin
} = require('./src/commerce/v2PromotionCodes');

exports.createPromotionCodeAdmin = createPromotionCodeAdmin;
exports.listPromotionCodesAdmin = listPromotionCodesAdmin;
exports.previewPromotionCodeV2 = previewPromotionCodeV2;
exports.setPromotionCodeStatusAdmin = setPromotionCodeStatusAdmin;

// ── EMAIL (Triggers) ─────────────────────────────────────
const { onOrderCreated, onOrderUpdated, sendTestEmail, sendRefundStatusEmailAdmin } = require('./src/email/orderEmails');

exports.onOrderCreated = onOrderCreated;
exports.onOrderUpdated = onOrderUpdated;
exports.sendTestEmail = sendTestEmail;
exports.sendRefundStatusEmailAdmin = sendRefundStatusEmailAdmin;

// ── ANALYTICS ────────────────────────────────────────────
const {
    initLiveSession,
    initLiveSessionGen2,
    syncSession,
    syncSessionGen2,
    syncSessionBeacon,
    deleteSession,
    clearAllSessions,
    clearAllAffiliateClicks
} = require('./src/analytics/sessions');
const { trackAdminIP, trackAdminIPGen2 } = require('./src/analytics/adminIP');
const { updateUserSessions, updateUserSessionsGen2 } = require('./src/analytics/updateUserSessions');
const { onOrderStatsWrite } = require('./src/commerce/orderStats');

exports.initLiveSession = initLiveSession;
exports.initLiveSessionGen2 = initLiveSessionGen2;
exports.syncSession = syncSession;
exports.syncSessionGen2 = syncSessionGen2;
exports.syncSessionBeacon = syncSessionBeacon;
exports.deleteSession = deleteSession;
exports.clearAllSessions = clearAllSessions;
exports.clearAllAffiliateClicks = clearAllAffiliateClicks;
exports.trackAdminIP = trackAdminIP;
exports.trackAdminIPGen2 = trackAdminIPGen2;
exports.updateUserSessions = updateUserSessions;
exports.updateUserSessionsGen2 = updateUserSessionsGen2;
exports.onOrderStatsWrite = onOrderStatsWrite;

// ── MAINTENANCE ──────────────────────────────────────────
const { resetAllStats, runGarbageCollector, resetAllUsers, purgeAnonymousUsers, resetAllOrders, purgeAllProducts, getUploadUrl } = require('./src/maintenance/tools');

exports.resetAllStats = resetAllStats;
exports.runGarbageCollector = runGarbageCollector;
exports.resetAllUsers = resetAllUsers;
exports.purgeAnonymousUsers = purgeAnonymousUsers;
exports.resetAllOrders = resetAllOrders;
exports.purgeAllProducts = purgeAllProducts;
exports.getUploadUrl = getUploadUrl;

// ── TRIGGERS ─────────────────────────────────────────────
const { onArtifactDeleted } = require('./src/triggers/onArtifactDeleted');
const { onArtifactUpdated } = require('./src/triggers/onArtifactUpdated');

exports.onArtifactDeleted = onArtifactDeleted;
exports.onArtifactUpdated = onArtifactUpdated;

// ── CATALOGUE PUBLIC MATERIALISE ───────────────────────────
const { onCatalogSourceWrite } = require('./src/catalog/onCatalogSourceWrite');
const { dispatchCatalogBuild } = require('./src/catalog/buildCatalogSnapshot');
const { dispatchCatalogRevalidation } = require('./src/catalog/catalogRevalidation');
const { catalogReconciler } = require('./src/catalog/catalogReconciler');
const { catalogMediaGarbageCollector } = require('./src/catalog/mediaGarbageCollection');
const {
    getCatalogPublicationStatus,
    rebuildCatalogSnapshot,
    rollbackCatalogSnapshot
} = require('./src/catalog/catalogMaintenance');

exports.onCatalogSourceWrite = onCatalogSourceWrite;
exports.dispatchCatalogBuild = dispatchCatalogBuild;
exports.dispatchCatalogRevalidation = dispatchCatalogRevalidation;
exports.catalogReconciler = catalogReconciler;
exports.catalogMediaGarbageCollector = catalogMediaGarbageCollector;
exports.getCatalogPublicationStatus = getCatalogPublicationStatus;
exports.rebuildCatalogSnapshot = rebuildCatalogSnapshot;
exports.rollbackCatalogSnapshot = rollbackCatalogSnapshot;
