/**
 * ============================================================
 * SECONDE VIE — Cloud Functions Entry Point
 * ============================================================
 */
const admin = require('firebase-admin');
admin.initializeApp();

// ── COMMERCE ──────────────────────────────────────────────

// ── COMMERCE V2 (controle serveur fail-closed) ───────────

// ── COMMERCE G8 — PARALLELES GEN2 REVERSIBLES ──────────
const {
    adjustInventoryAdminGen2,
    archiveOrderAdminGen2,
    cancelReturnAdminGen2,
    createOrderGen2,
    createProductAdminGen2,
    createPromotionCodeAdminGen2,
    createPublishedProductAdminGen2,
    decideCustomerReturnRequestAdminGen2,
    deleteProductAdminGen2,
    getDeliveryPolicyAdminGen2,
    getOrderStatusClientGen2,
    getOrderTimelineAdminV2Gen2,
    listCustomerReturnRequestsAdminV2Gen2,
    listMyOrdersV2Gen2,
    listOrdersAdminV2Gen2,
    listPromotionCodesAdminGen2,
    listReturnsAdminV2Gen2,
    markOrderDeliveredAdminGen2,
    markOrderPickedUpAdminGen2,
    markOrderPreparingAdminGen2,
    markOrderReadyForPickupAdminGen2,
    markOrderShippedAdminGen2,
    markReturnReceivedAdminGen2,
    openReturnAdminGen2,
    preflightProductMutationAdminGen2,
    prepareCommerceDocumentDeliveryGen2,
    previewPromotionCodeV2Gen2,
    publishProductAdminGen2,
    requestCustomerReturnGen2,
    requestOrderCancellationGen2,
    resolveReturnAdminGen2,
    restockReturnLinesAdminGen2,
    saveDeliveryPolicyAdminGen2,
    setPromotionCodeStatusAdminGen2,
    updateOrderTrackingAdminGen2,
    updateProductOfferAdminGen2,
    writeOffReturnLinesAdminGen2
} = require('./src/commerce/gen2G8');
exports.adjustInventoryAdminGen2 = adjustInventoryAdminGen2;
exports.archiveOrderAdminGen2 = archiveOrderAdminGen2;
exports.cancelReturnAdminGen2 = cancelReturnAdminGen2;
exports.createOrderGen2 = createOrderGen2;
exports.createProductAdminGen2 = createProductAdminGen2;
exports.createPromotionCodeAdminGen2 = createPromotionCodeAdminGen2;
exports.createPublishedProductAdminGen2 = createPublishedProductAdminGen2;
exports.decideCustomerReturnRequestAdminGen2 = decideCustomerReturnRequestAdminGen2;
exports.deleteProductAdminGen2 = deleteProductAdminGen2;
exports.getDeliveryPolicyAdminGen2 = getDeliveryPolicyAdminGen2;
exports.getOrderStatusClientGen2 = getOrderStatusClientGen2;
exports.getOrderTimelineAdminV2Gen2 = getOrderTimelineAdminV2Gen2;
exports.listCustomerReturnRequestsAdminV2Gen2 = listCustomerReturnRequestsAdminV2Gen2;
exports.listMyOrdersV2Gen2 = listMyOrdersV2Gen2;
exports.listOrdersAdminV2Gen2 = listOrdersAdminV2Gen2;
exports.listPromotionCodesAdminGen2 = listPromotionCodesAdminGen2;
exports.listReturnsAdminV2Gen2 = listReturnsAdminV2Gen2;
exports.markOrderDeliveredAdminGen2 = markOrderDeliveredAdminGen2;
exports.markOrderPickedUpAdminGen2 = markOrderPickedUpAdminGen2;
exports.markOrderPreparingAdminGen2 = markOrderPreparingAdminGen2;
exports.markOrderReadyForPickupAdminGen2 = markOrderReadyForPickupAdminGen2;
exports.markOrderShippedAdminGen2 = markOrderShippedAdminGen2;
exports.markReturnReceivedAdminGen2 = markReturnReceivedAdminGen2;
exports.openReturnAdminGen2 = openReturnAdminGen2;
exports.preflightProductMutationAdminGen2 = preflightProductMutationAdminGen2;
exports.prepareCommerceDocumentDeliveryGen2 = prepareCommerceDocumentDeliveryGen2;
exports.previewPromotionCodeV2Gen2 = previewPromotionCodeV2Gen2;
exports.publishProductAdminGen2 = publishProductAdminGen2;
exports.requestCustomerReturnGen2 = requestCustomerReturnGen2;
exports.requestOrderCancellationGen2 = requestOrderCancellationGen2;
exports.resolveReturnAdminGen2 = resolveReturnAdminGen2;
exports.restockReturnLinesAdminGen2 = restockReturnLinesAdminGen2;
exports.saveDeliveryPolicyAdminGen2 = saveDeliveryPolicyAdminGen2;
exports.setPromotionCodeStatusAdminGen2 = setPromotionCodeStatusAdminGen2;
exports.updateOrderTrackingAdminGen2 = updateOrderTrackingAdminGen2;
exports.updateProductOfferAdminGen2 = updateProductOfferAdminGen2;
exports.writeOffReturnLinesAdminGen2 = writeOffReturnLinesAdminGen2;

// ── COMMERCE G9 — FINANCE, CHECKOUT ET SCHEDULERS GEN2 ─
const {
    cancelAdminPaymentLinkGen2,
    cleanupFixtureRunAdminGen2,
    commerceOperationsReconcilerGen2,
    commerceOutboxDispatcherGen2,
    commerceReservationExpiryDispatcherGen2,
    commerceWebhookCoverageWatchdogGen2,
    confirmStripeConnectReconnectGen2,
    createAdminPaymentLinkGen2,
    createCheckoutV2Gen2,
    expireAdminPaymentLinksGen2,
    extendAdminPaymentLinkGen2,
    getAdminPaymentLinkPublicGen2,
    getCommerceOperationsStatusAdminGen2,
    getStripeConnectStatusGen2,
    listAdminPaymentLinksGen2,
    prepareAdminPaymentLinkPaymentGen2,
    rebuildCommerceOperationsAdminGen2,
    recreateAdminPaymentLinkGen2,
    regenerateAdminPaymentLinkGen2,
    requestRefundAdminGen2,
    requestStripeConnectReconnectGen2,
    resumeAdminPaymentLinkPaymentGen2,
    resumeCheckoutV2Gen2,
    startStripeConnectOnboardingGen2,
    syncStripeConnectAccountGen2
} = require('./src/commerce/gen2G9');
exports.cancelAdminPaymentLinkGen2 = cancelAdminPaymentLinkGen2;
exports.cleanupFixtureRunAdminGen2 = cleanupFixtureRunAdminGen2;
exports.commerceOperationsReconcilerGen2 = commerceOperationsReconcilerGen2;
exports.commerceOutboxDispatcherGen2 = commerceOutboxDispatcherGen2;
exports.commerceReservationExpiryDispatcherGen2 = commerceReservationExpiryDispatcherGen2;
exports.commerceWebhookCoverageWatchdogGen2 = commerceWebhookCoverageWatchdogGen2;
exports.confirmStripeConnectReconnectGen2 = confirmStripeConnectReconnectGen2;
exports.createAdminPaymentLinkGen2 = createAdminPaymentLinkGen2;
exports.createCheckoutV2Gen2 = createCheckoutV2Gen2;
exports.expireAdminPaymentLinksGen2 = expireAdminPaymentLinksGen2;
exports.extendAdminPaymentLinkGen2 = extendAdminPaymentLinkGen2;
exports.getAdminPaymentLinkPublicGen2 = getAdminPaymentLinkPublicGen2;
exports.getCommerceOperationsStatusAdminGen2 = getCommerceOperationsStatusAdminGen2;
exports.getStripeConnectStatusGen2 = getStripeConnectStatusGen2;
exports.listAdminPaymentLinksGen2 = listAdminPaymentLinksGen2;
exports.prepareAdminPaymentLinkPaymentGen2 = prepareAdminPaymentLinkPaymentGen2;
exports.rebuildCommerceOperationsAdminGen2 = rebuildCommerceOperationsAdminGen2;
exports.recreateAdminPaymentLinkGen2 = recreateAdminPaymentLinkGen2;
exports.regenerateAdminPaymentLinkGen2 = regenerateAdminPaymentLinkGen2;
exports.requestRefundAdminGen2 = requestRefundAdminGen2;
exports.requestStripeConnectReconnectGen2 = requestStripeConnectReconnectGen2;
exports.resumeAdminPaymentLinkPaymentGen2 = resumeAdminPaymentLinkPaymentGen2;
exports.resumeCheckoutV2Gen2 = resumeCheckoutV2Gen2;
exports.startStripeConnectOnboardingGen2 = startStripeConnectOnboardingGen2;
exports.syncStripeConnectAccountGen2 = syncStripeConnectAccountGen2;

const {
    dispatchCommerceOutboxTaskGen2,
    dispatchCommerceReservationExpiryTaskGen2,
    onCommerceOutboxWrittenGen2,
    onCommerceReservationWrittenGen2
} = require('./src/commerce/commerceEventDispatch');
exports.dispatchCommerceOutboxTaskGen2 = dispatchCommerceOutboxTaskGen2;
exports.dispatchCommerceReservationExpiryTaskGen2 = dispatchCommerceReservationExpiryTaskGen2;
exports.onCommerceOutboxWrittenGen2 = onCommerceOutboxWrittenGen2;
exports.onCommerceReservationWrittenGen2 = onCommerceReservationWrittenGen2;

// ── OBSERVABILITE METIER ET TIMELINE ADMIN ──────────────
const {
    journalCommerceIncidentGen2,
    journalFinancialFactGen2,
    journalInventoryMovementGen2,
    journalOrderEventGen2,
    journalOutboxStatusGen2,
    journalWebhookStatusGen2
} = require('./src/observability/businessEvents');
const {
    getDiagnosticTimelineAdminGen2
} = require('./src/observability/diagnosticTimeline');
const {
    getSystemIncidentsAdminGen2
} = require('./src/observability/systemIncidents');
const {
    projectSystemIncidentGen2
} = require('./src/observability/systemIncidentProjection');
exports.journalCommerceIncidentGen2 = journalCommerceIncidentGen2;
exports.journalFinancialFactGen2 = journalFinancialFactGen2;
exports.journalInventoryMovementGen2 = journalInventoryMovementGen2;
exports.journalOrderEventGen2 = journalOrderEventGen2;
exports.journalOutboxStatusGen2 = journalOutboxStatusGen2;
exports.journalWebhookStatusGen2 = journalWebhookStatusGen2;
exports.getDiagnosticTimelineAdminGen2 = getDiagnosticTimelineAdminGen2;
exports.getSystemIncidentsAdminGen2 = getSystemIncidentsAdminGen2;
exports.projectSystemIncidentGen2 = projectSystemIncidentGen2;

// ── PUBLICATION PRODUIT DURABLE ──────────────────────────
const {
    cleanupProductPublicationSessions,
    processProductPublicationImage,
    reconcileProductPublicationSessions
} = require('./src/publication/productPublication');

exports.cleanupProductPublicationSessions = cleanupProductPublicationSessions;
exports.processProductPublicationImage = processProductPublicationImage;
exports.reconcileProductPublicationSessions = reconcileProductPublicationSessions;

// ── PUBLICATION META (OAuth + Instagram/Facebook) ───────
const {
    disconnectInstagramConnectionAdmin,
    disconnectInstagramConnectionAdminGen2,
    disconnectMetaConnectionAdminGen2,
    getInstagramConnectionStatusAdmin,
    getInstagramConnectionStatusAdminGen2,
    getMetaConnectionStatusAdminGen2,
    getSocialPublicationStatusAdminGen2,
    instagramOAuthCallback,
    instagramOAuthCallbackGen2,
    metaOAuthCallbackGen2,
    prepareSocialPublicationAdminGen2,
    runSocialPublicationAdminGen2,
    selectMetaAssetAdminGen2,
    startInstagramOAuthAdmin,
    startInstagramOAuthAdminGen2,
    startMetaOAuthAdminGen2,
    verifyInstagramConnectionAdmin,
    verifyInstagramConnectionAdminGen2,
    verifyMetaConnectionAdminGen2
} = require('./src/integrations/meta');

exports.disconnectInstagramConnectionAdmin = disconnectInstagramConnectionAdmin;
exports.disconnectInstagramConnectionAdminGen2 = disconnectInstagramConnectionAdminGen2;
exports.disconnectMetaConnectionAdminGen2 = disconnectMetaConnectionAdminGen2;
exports.getInstagramConnectionStatusAdmin = getInstagramConnectionStatusAdmin;
exports.getInstagramConnectionStatusAdminGen2 = getInstagramConnectionStatusAdminGen2;
exports.getMetaConnectionStatusAdminGen2 = getMetaConnectionStatusAdminGen2;
exports.getSocialPublicationStatusAdminGen2 = getSocialPublicationStatusAdminGen2;
exports.instagramOAuthCallback = instagramOAuthCallback;
exports.instagramOAuthCallbackGen2 = instagramOAuthCallbackGen2;
exports.metaOAuthCallbackGen2 = metaOAuthCallbackGen2;
exports.prepareSocialPublicationAdminGen2 = prepareSocialPublicationAdminGen2;
exports.runSocialPublicationAdminGen2 = runSocialPublicationAdminGen2;
exports.selectMetaAssetAdminGen2 = selectMetaAssetAdminGen2;
exports.startInstagramOAuthAdmin = startInstagramOAuthAdmin;
exports.startInstagramOAuthAdminGen2 = startInstagramOAuthAdminGen2;
exports.startMetaOAuthAdminGen2 = startMetaOAuthAdminGen2;
exports.verifyInstagramConnectionAdmin = verifyInstagramConnectionAdmin;
exports.verifyInstagramConnectionAdminGen2 = verifyInstagramConnectionAdminGen2;
exports.verifyMetaConnectionAdminGen2 = verifyMetaConnectionAdminGen2;

// ── AUTH ──────────────────────────────────────────────────
const { grantAdminOnAuth } = require('./src/auth/grantAdmin');
const { onRegisteredUserCreated, onRegisteredUserDeleted } = require('./src/auth/userStats');
const { addAdminUserGen2, removeAdminUserGen2, logUserConnectionGen2, getUserStatsGen2, syncSuperAdminClaimGen2, ensureAdminAccessRegistryGen2 } = require('./src/auth/adminManagement');
const {
    sendGuestCheckoutOtpGen2,
    verifyGuestCheckoutOtpGen2
} = require('./src/auth/guestCheckoutOtp');
const { sendCustomerLoginOtpGen2, verifyCustomerLoginOtpGen2 } = require('./src/auth/customerLoginOtp');
const {
    generatePasskeyRegistrationOptionsGen2,
    verifyPasskeyRegistrationGen2,
    generatePasskeyAuthenticationOptionsGen2,
    verifyPasskeyAuthenticationGen2
} = require('./src/auth/passkeys');

exports.grantAdminOnAuth = grantAdminOnAuth;
exports.onRegisteredUserCreated = onRegisteredUserCreated;
exports.onRegisteredUserDeleted = onRegisteredUserDeleted;
exports.addAdminUserGen2 = addAdminUserGen2;
exports.removeAdminUserGen2 = removeAdminUserGen2;
exports.logUserConnectionGen2 = logUserConnectionGen2;
exports.getUserStatsGen2 = getUserStatsGen2;
exports.syncSuperAdminClaimGen2 = syncSuperAdminClaimGen2;
exports.ensureAdminAccessRegistryGen2 = ensureAdminAccessRegistryGen2;
exports.sendGuestCheckoutOtpGen2 = sendGuestCheckoutOtpGen2;
exports.verifyGuestCheckoutOtpGen2 = verifyGuestCheckoutOtpGen2;
exports.sendCustomerLoginOtpGen2 = sendCustomerLoginOtpGen2;
exports.verifyCustomerLoginOtpGen2 = verifyCustomerLoginOtpGen2;
exports.generatePasskeyRegistrationOptionsGen2 = generatePasskeyRegistrationOptionsGen2;
exports.verifyPasskeyRegistrationGen2 = verifyPasskeyRegistrationGen2;
exports.generatePasskeyAuthenticationOptionsGen2 = generatePasskeyAuthenticationOptionsGen2;
exports.verifyPasskeyAuthenticationGen2 = verifyPasskeyAuthenticationGen2;

// â”€â”€ ONBOARDING FACTURATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const {
    getBillingGuideStatusGen2,
    saveBillingGuideProgressGen2,
    getBillingGuideOperatorStatusGen2,
    completeBillingGuideAdminGen2,
    resetBillingGuideTestGen2
} = require('./src/onboarding/billingGuide');

exports.getBillingGuideStatusGen2 = getBillingGuideStatusGen2;
exports.saveBillingGuideProgressGen2 = saveBillingGuideProgressGen2;
exports.getBillingGuideOperatorStatusGen2 = getBillingGuideOperatorStatusGen2;
exports.completeBillingGuideAdminGen2 = completeBillingGuideAdminGen2;
exports.resetBillingGuideTestGen2 = resetBillingGuideTestGen2;

// ── FACTURES MANUELLES ADMIN ─────────────────────────────
const {
    getManualInvoiceWorkspaceAdminGen2,
    prepareManualInvoicePdfAdminGen2,
    saveManualInvoiceDraftAdminGen2,
    sendManualInvoiceAdminGen2
} = require('./src/invoicing/manualInvoices');

exports.getManualInvoiceWorkspaceAdminGen2 = getManualInvoiceWorkspaceAdminGen2;
exports.prepareManualInvoicePdfAdminGen2 = prepareManualInvoicePdfAdminGen2;
exports.saveManualInvoiceDraftAdminGen2 = saveManualInvoiceDraftAdminGen2;
exports.sendManualInvoiceAdminGen2 = sendManualInvoiceAdminGen2;

// ── DEMANDES DE DEVIS ───────────────────────────────────
const {
    createQuoteRequestGen2,
    uploadQuoteRequestPhotoGen2,
    finalizeQuoteRequestGen2,
    listQuoteRequestsAdminGen2,
    getQuoteRequestAdminGen2,
    updateQuoteRequestAdminGen2,
    onQuoteRequestSubmittedGen2
} = require('./src/quotes/quoteRequests');

exports.createQuoteRequestGen2 = createQuoteRequestGen2;
exports.uploadQuoteRequestPhotoGen2 = uploadQuoteRequestPhotoGen2;
exports.finalizeQuoteRequestGen2 = finalizeQuoteRequestGen2;
exports.listQuoteRequestsAdminGen2 = listQuoteRequestsAdminGen2;
exports.getQuoteRequestAdminGen2 = getQuoteRequestAdminGen2;
exports.updateQuoteRequestAdminGen2 = updateQuoteRequestAdminGen2;
exports.onQuoteRequestSubmittedGen2 = onQuoteRequestSubmittedGen2;

// ── NEWSLETTER ET AVANTAGES CLIENT ─────────────────────
const {
    claimNewsletterRewardGen2,
    drawNewsletterRewardGen2,
    listMyNewsletterRewardsGen2
} = require('./src/newsletter/newsletterRewards');
const {
    projectNewsletterSubscriberGen2
} = require('./src/newsletter/newsletterProjection');

exports.claimNewsletterRewardGen2 = claimNewsletterRewardGen2;
exports.drawNewsletterRewardGen2 = drawNewsletterRewardGen2;
exports.listMyNewsletterRewardsGen2 = listMyNewsletterRewardsGen2;
exports.projectNewsletterSubscriberGen2 = projectNewsletterSubscriberGen2;

// ── CODES PROMOTIONNELS SERVEUR ─────────────────────────

// ── EMAIL (Triggers) ─────────────────────────────────────
const {
    onOrderCreated,
    onOrderUpdated,
    sendTestEmailGen2,
    sendRefundStatusEmailAdminGen2
} = require('./src/email/orderEmails');

exports.onOrderCreated = onOrderCreated;
exports.onOrderUpdated = onOrderUpdated;
exports.sendTestEmailGen2 = sendTestEmailGen2;
exports.sendRefundStatusEmailAdminGen2 = sendRefundStatusEmailAdminGen2;

// ── ANALYTICS ────────────────────────────────────────────
const {
    initLiveSessionGen2,
    syncSessionGen2,
    syncSessionBeaconGen2,
    deleteSessionGen2
} = require('./src/analytics/sessions');
const { trackAdminIPGen2 } = require('./src/analytics/adminIP');
const { updateUserSessionsGen2 } = require('./src/analytics/updateUserSessions');
const { onOrderStatsWrite } = require('./src/commerce/orderStats');
const {
    projectCommerceFinancialHistoryGen2,
    projectLegacyFinancialHistoryGen2
} = require('./src/admin/financialHistoryProjection');

exports.initLiveSessionGen2 = initLiveSessionGen2;
exports.syncSessionGen2 = syncSessionGen2;
exports.syncSessionBeaconGen2 = syncSessionBeaconGen2;
exports.deleteSessionGen2 = deleteSessionGen2;
exports.trackAdminIPGen2 = trackAdminIPGen2;
exports.updateUserSessionsGen2 = updateUserSessionsGen2;
exports.onOrderStatsWrite = onOrderStatsWrite;
exports.projectCommerceFinancialHistoryGen2 = projectCommerceFinancialHistoryGen2;
exports.projectLegacyFinancialHistoryGen2 = projectLegacyFinancialHistoryGen2;

const {
    projectAdminActionSummaryGen2
} = require('./src/admin/actionSummaryProjection');
exports.projectAdminActionSummaryGen2 = projectAdminActionSummaryGen2;

const {
    aggregateAnalyticsSessionGen2,
    getAnalyticsAdminGen2,
    maintainAnalyticsGen2
} = require('./src/analytics/rollups');
exports.aggregateAnalyticsSessionGen2 = aggregateAnalyticsSessionGen2;
exports.getAnalyticsAdminGen2 = getAnalyticsAdminGen2;
exports.maintainAnalyticsGen2 = maintainAnalyticsGen2;

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
    getCatalogPublicationStatusGen2,
    rebuildCatalogSnapshotGen2,
    rollbackCatalogSnapshotGen2
} = require('./src/catalog/catalogMaintenance');

exports.onCatalogSourceWrite = onCatalogSourceWrite;
exports.dispatchCatalogBuild = dispatchCatalogBuild;
exports.dispatchCatalogRevalidation = dispatchCatalogRevalidation;
exports.catalogReconciler = catalogReconciler;
exports.catalogMediaGarbageCollector = catalogMediaGarbageCollector;
exports.getCatalogPublicationStatusGen2 = getCatalogPublicationStatusGen2;
exports.rebuildCatalogSnapshotGen2 = rebuildCatalogSnapshotGen2;
exports.rollbackCatalogSnapshotGen2 = rollbackCatalogSnapshotGen2;
