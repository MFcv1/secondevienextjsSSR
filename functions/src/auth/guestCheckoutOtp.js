const admin = require('firebase-admin');
const { onCall } = require('firebase-functions/v2/https');
const { functions, regionalFunctions, logFunctionPerf } = require('../../helpers/runtime');
const { getRateLimitClientIp } = require('../../helpers/clientIp');
const { OTP_HMAC_SECRET } = require('../../helpers/secrets');
const { getSiteUrl } = require('../../helpers/config');
const { timestampFromNow, SYSTEM_DOC_RETENTION_DAYS } = require('../analytics/constants');
const {
    TRANSACTIONAL_EMAIL_SECRETS,
    getTransactionalEmailRuntime
} = require('../email/transactionalEmailRuntime');

const GUEST_OTP_SEND_GEN2_RUNTIME = Object.freeze({
    region: 'europe-west1',
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '256MiB',
    timeoutSeconds: 60,
    serviceAccount: 'auth-otp-email-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    enforceAppCheck: true,
    secrets: [...TRANSACTIONAL_EMAIL_SECRETS, OTP_HMAC_SECRET]
});
const GUEST_OTP_VERIFY_GEN2_RUNTIME = Object.freeze({
    region: 'europe-west1',
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '256MiB',
    timeoutSeconds: 60,
    serviceAccount: 'auth-otp-verify-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    enforceAppCheck: true,
    secrets: [OTP_HMAC_SECRET]
});

const { createGuestCheckoutOtpHandlers } = require('./guestCheckoutOtpHandlers.cjs');
const { sendGuestCheckoutOtpHandler, verifyGuestCheckoutOtpHandler, assertGuestCheckoutOtpVerified, normalizeGuestCheckoutEmail } = createGuestCheckoutOtpHandlers({
    admin, HttpsError: functions.https.HttpsError, getRateLimitClientIp, OTP_HMAC_SECRET,
    getSiteUrl, timestampFromNow, SYSTEM_DOC_RETENTION_DAYS, getTransactionalEmailRuntime, logFunctionPerf
});
exports.sendGuestCheckoutOtp = regionalFunctions()
    .runWith({ enforceAppCheck: true, secrets: [...TRANSACTIONAL_EMAIL_SECRETS, OTP_HMAC_SECRET] })
    .https.onCall(sendGuestCheckoutOtpHandler);
exports.sendGuestCheckoutOtpGen2 = onCall(
    GUEST_OTP_SEND_GEN2_RUNTIME,
    async (request) => sendGuestCheckoutOtpHandler(request.data, request)
);

exports.verifyGuestCheckoutOtp = regionalFunctions()
    .runWith({ enforceAppCheck: true, secrets: [OTP_HMAC_SECRET] })
    .https.onCall(verifyGuestCheckoutOtpHandler);
exports.verifyGuestCheckoutOtpGen2 = onCall(
    GUEST_OTP_VERIFY_GEN2_RUNTIME,
    async (request) => verifyGuestCheckoutOtpHandler(request.data, request)
);
module.exports.assertGuestCheckoutOtpVerified = assertGuestCheckoutOtpVerified;
module.exports.normalizeGuestCheckoutEmail = normalizeGuestCheckoutEmail;
module.exports.sendGuestCheckoutOtpHandler = sendGuestCheckoutOtpHandler;
module.exports.GUEST_OTP_SEND_GEN2_RUNTIME = GUEST_OTP_SEND_GEN2_RUNTIME;
module.exports.verifyGuestCheckoutOtpHandler = verifyGuestCheckoutOtpHandler;
module.exports.GUEST_OTP_VERIFY_GEN2_RUNTIME = GUEST_OTP_VERIFY_GEN2_RUNTIME;
