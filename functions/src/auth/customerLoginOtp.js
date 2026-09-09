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

const CUSTOMER_OTP_SEND_GEN2_RUNTIME = Object.freeze({
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
const CUSTOMER_OTP_VERIFY_GEN2_RUNTIME = Object.freeze({
    region: 'europe-west1',
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '256MiB',
    timeoutSeconds: 60,
    serviceAccount: 'auth-login-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    enforceAppCheck: true,
    secrets: [OTP_HMAC_SECRET]
});

const { createCustomerLoginOtpHandlers } = require('./customerLoginOtpHandlers.cjs');
const { sendCustomerLoginOtpHandler, verifyCustomerLoginOtpHandler } = createCustomerLoginOtpHandlers({
    admin, HttpsError: functions.https.HttpsError, getRateLimitClientIp, OTP_HMAC_SECRET,
    getSiteUrl, timestampFromNow, SYSTEM_DOC_RETENTION_DAYS, getTransactionalEmailRuntime, logFunctionPerf
});
exports.sendCustomerLoginOtp = regionalFunctions()
    .runWith({ enforceAppCheck: true, secrets: [...TRANSACTIONAL_EMAIL_SECRETS, OTP_HMAC_SECRET] })
    .https.onCall(sendCustomerLoginOtpHandler);
exports.sendCustomerLoginOtpGen2 = onCall(
    CUSTOMER_OTP_SEND_GEN2_RUNTIME,
    async (request) => sendCustomerLoginOtpHandler(request.data, request)
);

exports.verifyCustomerLoginOtp = regionalFunctions()
    .runWith({ enforceAppCheck: true, secrets: [OTP_HMAC_SECRET] })
    .https.onCall(verifyCustomerLoginOtpHandler);
exports.verifyCustomerLoginOtpGen2 = onCall(
    CUSTOMER_OTP_VERIFY_GEN2_RUNTIME,
    async (request) => verifyCustomerLoginOtpHandler(request.data, request)
);
module.exports.sendCustomerLoginOtpHandler = sendCustomerLoginOtpHandler;
module.exports.CUSTOMER_OTP_SEND_GEN2_RUNTIME = CUSTOMER_OTP_SEND_GEN2_RUNTIME;
module.exports.verifyCustomerLoginOtpHandler = verifyCustomerLoginOtpHandler;
module.exports.CUSTOMER_OTP_VERIFY_GEN2_RUNTIME = CUSTOMER_OTP_VERIFY_GEN2_RUNTIME;
