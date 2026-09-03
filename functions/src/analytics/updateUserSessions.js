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
const { isValidSyncToken } = require('./sessionSecurity');
const { structuredLog } = require('../../helpers/observability');

const db = admin.firestore();
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

const updateUserSessionsHandler = async (data = {}, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');

    const userId = context.auth.uid;
    const sessionId = String(data.sessionId || '').trim();
    const syncToken = String(data.syncToken || '');
    if (!/^[A-Za-z0-9_-]{8,160}$/.test(sessionId) || !syncToken) {
        return { success: true, skipped: true };
    }

    // Le registre UID est l'autorité finale. Les anciennes vérifications du profil
    // étaient toujours écrasées ici et consommaient une lecture sans changer le résultat.
    const accessSnap = await db.collection('sys_admin_access').doc(userId).get();
    const isAdmin = accessSnap.exists && accessSnap.data().active === true;

    try {
        const sessionRef = db.collection('analytics_sessions').doc(sessionId);
        const sessionSnapshot = await sessionRef.get();
        if (!sessionSnapshot.exists || !isValidSyncToken(sessionSnapshot.data(), syncToken)) {
            return { success: true, skipped: true };
        }

        if (isAdmin) {
            const exclusionRef = db.collection('analytics_session_exclusions').doc(sessionId);
            await db.runTransaction(async (transaction) => {
                const current = await transaction.get(sessionRef);
                if (!current.exists || !isValidSyncToken(current.data(), syncToken)) return;
                transaction.set(exclusionRef, {
                    schemaVersion: 1,
                    reason: 'admin_identity_resolved',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    expireAt: admin.firestore.Timestamp.fromMillis(Date.now() + (7 * 24 * 60 * 60 * 1000))
                });
                transaction.delete(sessionRef);
            });
            return { success: true, deletedCount: 1, isAdmin: true };
        } else {
            await sessionRef.update({
                userId,
                type: 'client',
                sessionConverted: true,
                convertedAt: admin.firestore.FieldValue.serverTimestamp(),
                originalType: sessionSnapshot.data()?.type || 'anonymous'
            });
            return { success: true, updatedCount: 1, isAdmin: false };
        }
    } catch (error) {
        structuredLog('error', 'analytics_session_owner_update_failed', {
            errorClass: String(error?.code || error?.name || 'unknown').slice(0, 120)
        });
        throw new functions.https.HttpsError('internal', 'Erreur lors de la mise à jour des sessions');
    }
};

exports.updateUserSessions = regionalFunctions()
    .runWith({ enforceAppCheck: true })
    .https.onCall(updateUserSessionsHandler);

exports.updateUserSessionsGen2 = onCall(
    UPDATE_USER_SESSIONS_GEN2_RUNTIME,
    async (request) => updateUserSessionsHandler(request.data, request)
);

exports.updateUserSessionsHandler = updateUserSessionsHandler;
exports.UPDATE_USER_SESSIONS_GEN2_RUNTIME = UPDATE_USER_SESSIONS_GEN2_RUNTIME;
