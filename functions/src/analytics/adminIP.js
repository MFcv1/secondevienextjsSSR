/**
 * Compatibilite temporaire de l'ancien tracker IP admin.
 * Aucun nouvel e-mail ou IP n'est lu ni ecrit.
 */
const functions = require('firebase-functions/v1');
const { onCall } = require('firebase-functions/v2/https');
const { checkActiveStrongAdmin } = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');

const ANALYTICS_RUNTIME_SERVICE_ACCOUNT = 'analytics-runtime@secondevienextjsssr.iam.gserviceaccount.com';
const TRACK_ADMIN_IP_GEN2_RUNTIME = Object.freeze({
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
const trackAdminIPHandler = async (_data, context) => {
    await checkActiveStrongAdmin(context);
    return { success: true, disabled: true };
};

exports.trackAdminIP = regionalFunctions()
    .runWith({ enforceAppCheck: true })
    .https.onCall(trackAdminIPHandler);

exports.trackAdminIPGen2 = onCall(
    TRACK_ADMIN_IP_GEN2_RUNTIME,
    async (request) => trackAdminIPHandler(request.data, request)
);

const isAdminIP = async () => false;

exports.isAdminIP = isAdminIP;
exports.trackAdminIPHandler = trackAdminIPHandler;
exports.TRACK_ADMIN_IP_GEN2_RUNTIME = TRACK_ADMIN_IP_GEN2_RUNTIME;
