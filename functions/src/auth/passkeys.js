const admin = require('firebase-admin');
const { onCall } = require('firebase-functions/v2/https');
const { functions, regionalFunctions, logFunctionPerf } = require('../../helpers/runtime');
const { getRateLimitClientIp } = require('../../helpers/clientIp');
const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const { getSiteUrl } = require('../../helpers/config');
const { authorizePasskeyRegistration } = require('./passkeyRegistration');
const { createPasskeyTimer } = require('./passkeyPerformance');

const { createPasskeyHandlers } = require('./passkeyHandlers.cjs');

const PASSKEY_AUTH_GEN2_RUNTIME = Object.freeze({
    region: 'europe-west1',
    cpu: 1,
    concurrency: 8,
    minInstances: 0,
    maxInstances: 2,
    memory: '256MiB',
    timeoutSeconds: 60,
    serviceAccount: 'auth-login-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    enforceAppCheck: true
});
const PASSKEY_REGISTRATION_GEN2_RUNTIME = Object.freeze({
    region: 'europe-west1',
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '256MiB',
    timeoutSeconds: 60,
    serviceAccount: 'auth-passkey-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    enforceAppCheck: true
});


const {
    generatePasskeyRegistrationOptionsHandler,
    verifyPasskeyRegistrationHandler,
    generatePasskeyAuthenticationOptionsHandler,
    verifyPasskeyAuthenticationHandler
} = createPasskeyHandlers({
    admin, HttpsError: functions.https.HttpsError,
    webauthn: { generateRegistrationOptions, verifyRegistrationResponse,
        generateAuthenticationOptions, verifyAuthenticationResponse },
    getSiteUrl, getRateLimitClientIp, authorizePasskeyRegistration,
    createPasskeyTimer: (ceremony) => createPasskeyTimer(ceremony, {
        log: require('firebase-functions/logger').info
    }), logFunctionPerf
});

exports.generatePasskeyRegistrationOptions = regionalFunctions().runWith({ enforceAppCheck: true }).https.onCall(generatePasskeyRegistrationOptionsHandler);
exports.generatePasskeyRegistrationOptionsGen2 = onCall(
    PASSKEY_REGISTRATION_GEN2_RUNTIME,
    async (request) => generatePasskeyRegistrationOptionsHandler(request.data, request)
);

exports.verifyPasskeyRegistration = regionalFunctions().runWith({ enforceAppCheck: true }).https.onCall(verifyPasskeyRegistrationHandler);
exports.verifyPasskeyRegistrationGen2 = onCall(
    PASSKEY_REGISTRATION_GEN2_RUNTIME,
    async (request) => verifyPasskeyRegistrationHandler(request.data, request)
);

exports.generatePasskeyAuthenticationOptions = regionalFunctions().runWith({ enforceAppCheck: true }).https.onCall(generatePasskeyAuthenticationOptionsHandler);
exports.generatePasskeyAuthenticationOptionsGen2 = onCall(
    PASSKEY_AUTH_GEN2_RUNTIME,
    async (request) => generatePasskeyAuthenticationOptionsHandler(request.data, request)
);

exports.verifyPasskeyAuthentication = regionalFunctions().runWith({ enforceAppCheck: true }).https.onCall(verifyPasskeyAuthenticationHandler);
exports.verifyPasskeyAuthenticationGen2 = onCall(
    PASSKEY_AUTH_GEN2_RUNTIME,
    async (request) => verifyPasskeyAuthenticationHandler(request.data, request)
);

module.exports.generatePasskeyAuthenticationOptionsHandler = generatePasskeyAuthenticationOptionsHandler;
module.exports.verifyPasskeyAuthenticationHandler = verifyPasskeyAuthenticationHandler;
module.exports.generatePasskeyRegistrationOptionsHandler = generatePasskeyRegistrationOptionsHandler;
module.exports.verifyPasskeyRegistrationHandler = verifyPasskeyRegistrationHandler;
module.exports.PASSKEY_AUTH_GEN2_RUNTIME = PASSKEY_AUTH_GEN2_RUNTIME;
module.exports.PASSKEY_REGISTRATION_GEN2_RUNTIME = PASSKEY_REGISTRATION_GEN2_RUNTIME;
