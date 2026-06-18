/**
 * ============================================================
 * TOUS À TABLE — Cloud Functions Entry Point
 * ============================================================
 */
const admin = require('firebase-admin');
admin.initializeApp();

// ── COMMERCE ──────────────────────────────────────────────
const { createOrder } = require('./src/commerce/createOrder');
const { stripeWebhook } = require('./src/commerce/stripeWebhook');
const { cancelOrderClient } = require('./src/commerce/cancelOrder');
const { cleanupPendingPayments } = require('./src/commerce/cleanupPendingPayments');
const { e2eCheckoutProof } = require('./src/commerce/e2eCheckoutProof');
const { e2eStripeHardeningProof } = require('./src/commerce/e2eStripeHardeningProof');
const { getOrderStatusClient } = require('./src/commerce/orderStatus');
const { refundOrderAdmin } = require('./src/commerce/refundOrder');

exports.createOrder = createOrder;
exports.stripeWebhook = stripeWebhook;
exports.cancelOrderClient = cancelOrderClient;
exports.cleanupPendingPayments = cleanupPendingPayments;
exports.e2eCheckoutProof = e2eCheckoutProof;
exports.e2eStripeHardeningProof = e2eStripeHardeningProof;
exports.getOrderStatusClient = getOrderStatusClient;
exports.refundOrderAdmin = refundOrderAdmin;

// ── AUTH ──────────────────────────────────────────────────
const { grantAdminOnAuth } = require('./src/auth/grantAdmin');
const { addAdminUser, removeAdminUser, logUserConnection, getUserStats, syncSuperAdminClaim } = require('./src/auth/adminManagement');
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
exports.sendGuestCheckoutOtp = sendGuestCheckoutOtp;
exports.verifyGuestCheckoutOtp = verifyGuestCheckoutOtp;
exports.sendCustomerLoginOtp = sendCustomerLoginOtp;
exports.verifyCustomerLoginOtp = verifyCustomerLoginOtp;
exports.generatePasskeyRegistrationOptions = generatePasskeyRegistrationOptions;
exports.verifyPasskeyRegistration = verifyPasskeyRegistration;
exports.generatePasskeyAuthenticationOptions = generatePasskeyAuthenticationOptions;
exports.verifyPasskeyAuthentication = verifyPasskeyAuthentication;

// ── EMAIL (Triggers) ─────────────────────────────────────
const { onOrderCreated, onOrderUpdated, sendTestEmail } = require('./src/email/orderEmails');

exports.onOrderCreated = onOrderCreated;
exports.onOrderUpdated = onOrderUpdated;
exports.sendTestEmail = sendTestEmail;

// ── ANALYTICS ────────────────────────────────────────────
const { initLiveSession, syncSession, syncSessionBeacon, deleteSession, clearAllSessions, clearAllAnalytics, cleanupExpiredAnalytics } = require('./src/analytics/sessions');
const { trackAdminIP } = require('./src/analytics/adminIP');
const { updateUserSessions } = require('./src/analytics/updateUserSessions');
const { onJourneyStepCreated, onCustomEventCreated } = require('./src/analytics/rollups');
const { onOrderStatsWrite } = require('./src/commerce/orderStats');

exports.initLiveSession = initLiveSession;
exports.syncSession = syncSession;
exports.syncSessionBeacon = syncSessionBeacon;
exports.deleteSession = deleteSession;
exports.clearAllSessions = clearAllSessions;
exports.clearAllAnalytics = clearAllAnalytics; // alias — matche l'appel client
exports.cleanupExpiredAnalytics = cleanupExpiredAnalytics;
exports.trackAdminIP = trackAdminIP;
exports.updateUserSessions = updateUserSessions;
exports.onJourneyStepCreated = onJourneyStepCreated;
exports.onCustomEventCreated = onCustomEventCreated;
exports.onOrderStatsWrite = onOrderStatsWrite;

// ── MAINTENANCE ──────────────────────────────────────────
const { resetAllStats, runGarbageCollector, resetAllUsers, purgeAnonymousUsers, resetAllOrders, purgeAllProducts, getUploadUrl } = require('./src/maintenance/tools');
const { onInventorySourceWrite } = require('./src/maintenance/inventoryStats');

exports.resetAllStats = resetAllStats;
exports.runGarbageCollector = runGarbageCollector;
exports.resetAllUsers = resetAllUsers;
exports.purgeAnonymousUsers = purgeAnonymousUsers;
exports.resetAllOrders = resetAllOrders;
exports.purgeAllProducts = purgeAllProducts;
exports.getUploadUrl = getUploadUrl;
exports.onInventorySourceWrite = onInventorySourceWrite;

// ── SEO ──────────────────────────────────────────────────
const { sitemap, shareMeta, homeMeta, aboutMeta, productMeta, categoryMeta } = require('./src/seo/seoTools');

exports.sitemap = sitemap;
exports.shareMeta = shareMeta;
exports.homeMeta = homeMeta;
exports.aboutMeta = aboutMeta;
exports.productMeta = productMeta;
exports.categoryMeta = categoryMeta;

// ── TRIGGERS ─────────────────────────────────────────────
const { onArtifactDeleted } = require('./src/triggers/onArtifactDeleted');
const { onArtifactUpdated } = require('./src/triggers/onArtifactUpdated');

exports.onArtifactDeleted = onArtifactDeleted;
exports.onArtifactUpdated = onArtifactUpdated;
