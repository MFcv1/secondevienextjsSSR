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
const { cleanupPendingPayments } = require('./src/commerce/cleanupPendingPayments');
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
exports.cleanupPendingPayments = cleanupPendingPayments;
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
    archiveProductAdmin,
    createProductAdmin,
    publishProductAdmin,
    updateProductOfferAdmin
} = require('./src/commerce/v2ProductCommands');
const {
    archiveOrderAdmin,
    markOrderDeliveredAdmin,
    markOrderPickedUpAdmin,
    markOrderPreparingAdmin,
    markOrderReadyForPickupAdmin,
    markOrderShippedAdmin
} = require('./src/commerce/v2OrderCommands');
const {
    requestOrderCancellation
} = require('./src/commerce/v2Cancellation');
const {
    requestRefundAdmin
} = require('./src/commerce/v2RefundCommands');
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
    stripeConnectWebhookV2,
    stripeWebhookV2
} = require('./src/commerce/v2Webhooks');

exports.adjustInventoryAdmin = adjustInventoryAdmin;
exports.archiveProductAdmin = archiveProductAdmin;
exports.createProductAdmin = createProductAdmin;
exports.publishProductAdmin = publishProductAdmin;
exports.updateProductOfferAdmin = updateProductOfferAdmin;
exports.archiveOrderAdmin = archiveOrderAdmin;
exports.markOrderDeliveredAdmin = markOrderDeliveredAdmin;
exports.markOrderPickedUpAdmin = markOrderPickedUpAdmin;
exports.markOrderPreparingAdmin = markOrderPreparingAdmin;
exports.markOrderReadyForPickupAdmin = markOrderReadyForPickupAdmin;
exports.markOrderShippedAdmin = markOrderShippedAdmin;
exports.requestOrderCancellation = requestOrderCancellation;
exports.requestRefundAdmin = requestRefundAdmin;
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
exports.listReturnsAdminV2 = listReturnsAdminV2;
exports.cleanupFixtureRunAdmin = cleanupFixtureRunAdmin;
exports.commerceOperationsReconciler = commerceOperationsReconciler;
exports.commerceOutboxDispatcher = commerceOutboxDispatcher;
exports.getCommerceOperationsStatusAdmin = getCommerceOperationsStatusAdmin;
exports.rebuildCommerceOperationsAdmin = rebuildCommerceOperationsAdmin;
exports.stripeWebhookV2 = stripeWebhookV2;
exports.stripeConnectWebhookV2 = stripeConnectWebhookV2;

// ── AUTH ──────────────────────────────────────────────────
const { grantAdminOnAuth } = require('./src/auth/grantAdmin');
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

// ── EMAIL (Triggers) ─────────────────────────────────────
const { onOrderCreated, onOrderUpdated, sendTestEmail, sendRefundStatusEmailAdmin } = require('./src/email/orderEmails');

exports.onOrderCreated = onOrderCreated;
exports.onOrderUpdated = onOrderUpdated;
exports.sendTestEmail = sendTestEmail;
exports.sendRefundStatusEmailAdmin = sendRefundStatusEmailAdmin;

// ── ANALYTICS ────────────────────────────────────────────
const {
    initLiveSession,
    syncSession,
    syncSessionBeacon,
    deleteSession,
    clearAllSessions,
    clearAllAffiliateClicks
} = require('./src/analytics/sessions');
const { trackAdminIP } = require('./src/analytics/adminIP');
const { updateUserSessions } = require('./src/analytics/updateUserSessions');
const { onOrderStatsWrite } = require('./src/commerce/orderStats');

exports.initLiveSession = initLiveSession;
exports.syncSession = syncSession;
exports.syncSessionBeacon = syncSessionBeacon;
exports.deleteSession = deleteSession;
exports.clearAllSessions = clearAllSessions;
exports.clearAllAffiliateClicks = clearAllAffiliateClicks;
exports.trackAdminIP = trackAdminIP;
exports.updateUserSessions = updateUserSessions;
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
