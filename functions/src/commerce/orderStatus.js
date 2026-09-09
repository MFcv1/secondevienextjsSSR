const { functions, regionalFunctions, logFunctionPerf } = require('../../helpers/runtime');
const admin = require('firebase-admin');
const { normalizeFirestoreId } = require('../../helpers/security');
const { assertGuestCheckoutOtpVerified, normalizeGuestCheckoutEmail } = require('../auth/guestCheckoutOtp');
const { createOrderStatusHandler } = require('./orderStatusHandler.cjs');
const getOrderStatusClientHandler = createOrderStatusHandler({
    admin, HttpsError: functions.https.HttpsError, normalizeFirestoreId, assertGuestCheckoutOtpVerified, normalizeGuestCheckoutEmail, logFunctionPerf
});
exports.getOrderStatusClient = regionalFunctions().runWith({ enforceAppCheck: true }).https.onCall(getOrderStatusClientHandler);
