const { isValidSyncToken } = require('./sessionSecurity');

function createUpdateUserSessionsHandler({ admin, HttpsError, structuredLog }) {
const functions = { https: { HttpsError } };
const db = admin.firestore();
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
    const accessRef = db.collection('sys_admin_access').doc(userId);

    try {
        const sessionRef = db.collection('analytics_sessions').doc(sessionId);
        return await db.runTransaction(async (transaction) => {
            const current = await transaction.get(sessionRef);
            if (!current.exists || !isValidSyncToken(current.data(), syncToken, { allowLegacy: false })) {
                return { success: true, skipped: true };
            }
            const accessSnap = await transaction.get(accessRef);
            const isAdmin = accessSnap.exists && accessSnap.data().active === true;
            if (isAdmin) {
                const exclusionRef = db.collection('analytics_session_exclusions').doc(sessionId);
                transaction.set(exclusionRef, {
                    schemaVersion: 1,
                    reason: 'admin_identity_resolved',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    expireAt: admin.firestore.Timestamp.fromMillis(Date.now() + (7 * 24 * 60 * 60 * 1000))
                });
                transaction.delete(sessionRef);
                return { success: true, deletedCount: 1, isAdmin: true };
            }
            transaction.update(sessionRef, {
                userId,
                type: 'client',
                sessionConverted: true,
                convertedAt: admin.firestore.FieldValue.serverTimestamp(),
                originalType: current.data()?.type || 'anonymous'
            });
            return { success: true, updatedCount: 1, isAdmin: false };
        });
    } catch (error) {
        structuredLog('error', 'analytics_session_owner_update_failed', {
            errorClass: String(error?.code || error?.name || 'unknown').slice(0, 120)
        });
        throw new functions.https.HttpsError('internal', 'Erreur lors de la mise à jour des sessions');
    }
};

return updateUserSessionsHandler;
}
module.exports = { createUpdateUserSessionsHandler };
