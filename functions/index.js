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

exports.createOrder = createOrder;
exports.stripeWebhook = stripeWebhook;
exports.cancelOrderClient = cancelOrderClient;

// ── AUTH ──────────────────────────────────────────────────
const { grantAdminOnAuth } = require('./src/auth/grantAdmin');
const { addAdminUser, removeAdminUser, logUserConnection, getUserStats } = require('./src/auth/adminManagement');

exports.grantAdminOnAuth = grantAdminOnAuth;
exports.addAdminUser = addAdminUser;
exports.removeAdminUser = removeAdminUser;
exports.logUserConnection = logUserConnection;
exports.getUserStats = getUserStats;

// ── EMAIL (Triggers) ─────────────────────────────────────
const { onOrderCreated, onOrderUpdated } = require('./src/email/orderEmails');

exports.onOrderCreated = onOrderCreated;
exports.onOrderUpdated = onOrderUpdated;

// ── ANALYTICS ────────────────────────────────────────────
const { initLiveSession, syncSession, syncSessionBeacon, deleteSession, clearAllSessions, clearAllAnalytics, cleanupExpiredAnalytics } = require('./src/analytics/sessions');
const { trackAdminIP } = require('./src/analytics/adminIP');
const { updateUserSessions } = require('./src/analytics/updateUserSessions');
const { onJourneyStepCreated, onCustomEventCreated } = require('./src/analytics/rollups');
const { onOrderStatsWrite } = require('./src/commerce/orderStats');
const { publicCatalog } = require('./src/public/catalog');

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
exports.publicCatalog = publicCatalog;

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
