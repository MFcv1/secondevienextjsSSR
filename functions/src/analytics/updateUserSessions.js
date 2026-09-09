/**
 * ANALYTICS: Gestion des sessions utilisateur lors de la connexion
 * 
 * - cible uniquement la session prouvee par sessionId + syncToken
 * - ne lit ni e-mail ni IP
 */
const functions = require('firebase-functions/v1');
const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { regionalFunctions } = require('../../helpers/runtime');
const { structuredLog } = require('../../helpers/observability');

const ANALYTICS_RUNTIME_SERVICE_ACCOUNT = 'analytics-runtime@secondevienextjsssr.iam.gserviceaccount.com';
const UPDATE_USER_SESSIONS_GEN2_RUNTIME = Object.freeze({
    region: 'europe-west1',
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '256MiB',
    timeoutSeconds: 60,
    serviceAccount: ANALYTICS_RUNTIME_SERVICE_ACCOUNT,
    enforceAppCheck: true
});

const { createUpdateUserSessionsHandler } = require('./updateUserSessionsHandler.cjs');
const updateUserSessionsHandler = createUpdateUserSessionsHandler({
    admin, HttpsError: functions.https.HttpsError, structuredLog
});

exports.updateUserSessions = regionalFunctions()
    .runWith({ enforceAppCheck: true })
    .https.onCall(updateUserSessionsHandler);

exports.updateUserSessionsGen2 = onCall(
    UPDATE_USER_SESSIONS_GEN2_RUNTIME,
    async (request) => updateUserSessionsHandler(request.data, request)
);

exports.updateUserSessionsHandler = updateUserSessionsHandler;
exports.UPDATE_USER_SESSIONS_GEN2_RUNTIME = UPDATE_USER_SESSIONS_GEN2_RUNTIME;
