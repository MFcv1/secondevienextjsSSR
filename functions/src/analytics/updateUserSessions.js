/**
 * ANALYTICS: Gestion des sessions utilisateur lors de la connexion
 * 
 * - Pour les admins: supprime les sessions anonymes de leur IP
 * - Pour les clients: convertit les sessions anonymes en sessions "client"
 */
const functions = require('firebase-functions/v1');
const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { regionalFunctions } = require('../../helpers/runtime');

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

const updateUserSessionsHandler = async (_data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');

    const rawIp = context.rawRequest.headers['x-forwarded-for'] || context.rawRequest.connection.remoteAddress;
    const ip = rawIp ? rawIp.split(',')[0].trim() : 'Unknown';
    const userId = context.auth.uid;
    const email = String(context.auth.token.email || '').trim().toLowerCase();

    // Le registre UID est l'autorité finale. Les anciennes vérifications du profil
    // étaient toujours écrasées ici et consommaient une lecture sans changer le résultat.
    const accessSnap = await db.collection('sys_admin_access').doc(userId).get();
    const isAdmin = accessSnap.exists && accessSnap.data().active === true;

    try {
        // Si c'est un admin, on supprime TOUTES ses sessions (anonymes ou non)
        if (isAdmin) {
            const sessionsRef = db.collection('analytics_sessions');
            const snapshot = await sessionsRef
                .where('ip', '==', ip)
                .where('sessionActive', '==', true)
                .get();

            const batch = db.batch();
            let deletedCount = 0;

            snapshot.forEach(doc => {
                const sessionData = doc.data();
                // Vérifier si la session est récente (moins de 2 heures)
                const sessionTime = sessionData.startedAt?.toMillis() || 0;
                const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

                if (sessionTime > twoHoursAgo) {
                    batch.delete(doc.ref);
                    deletedCount++;
                }
            });

            if (deletedCount > 0) {
                await batch.commit();
                console.info('Recent admin analytics sessions removed', { deletedCount });
            }

            return { success: true, deletedCount, isAdmin: true };
        } else {
            // Pour les clients non-admins, on convertit les sessions anonymes
            const sessionsRef = db.collection('analytics_sessions');
            const snapshot = await sessionsRef
                .where('ip', '==', ip)
                .where('sessionActive', '==', true)
                .where('type', '==', 'anonymous')
                .get();

            const batch = db.batch();
            let updatedCount = 0;

            snapshot.forEach(doc => {
                const sessionData = doc.data();
                const sessionTime = sessionData.startedAt?.toMillis() || 0;
                const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

                if (sessionTime > twoHoursAgo) {
                    batch.update(doc.ref, {
                        userId: userId,
                        email: email,
                        type: 'client',
                        sessionConverted: true,
                        convertedAt: admin.firestore.FieldValue.serverTimestamp(),
                        originalType: sessionData.type
                    });
                    updatedCount++;
                }
            });

            if (updatedCount > 0) {
                await batch.commit();
                console.info('Recent client analytics sessions converted', { updatedCount });
            }

            return { success: true, updatedCount, isAdmin: false };
        }
    } catch (error) {
        console.error("Update User Sessions Error:", error);
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
