/**
 * ANALYTICS: Gestion des sessions utilisateur lors de la connexion
 * 
 * - Pour les admins: supprime les sessions anonymes de leur IP
 * - Pour les clients: convertit les sessions anonymes en sessions "client"
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { SUPER_ADMIN_EMAIL } = require('../../helpers/security');

const db = admin.firestore();

exports.updateUserSessions = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');

    const rawIp = context.rawRequest.headers['x-forwarded-for'] || context.rawRequest.connection.remoteAddress;
    const ip = rawIp ? rawIp.split(',')[0].trim() : 'Unknown';
    const userId = context.auth.uid;
    const email = context.auth.token.email;

    // Vérifier si c'est un admin (custom claim OU super admin OU dans la whitelist)
    let isAdmin = context.auth.token.admin === true || email === SUPER_ADMIN_EMAIL;

    // Si pas encore détecté comme admin, vérifier dans Firestore
    if (!isAdmin) {
        try {
            const userDoc = await db.doc(`users/${userId}`).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                isAdmin = userData.role === 'admin' || userData.role === 'super_admin';
            }
        } catch (err) {
            console.error("Error checking user role:", err);
        }
    }

    console.log(`updateUserSessions called for ${email}, isAdmin: ${isAdmin}, IP: ${ip}`);

    try {
        // Si c'est un admin, on supprime TOUTES ses sessions (anonymes ou non)
        if (isAdmin) {
            const sessionsRef = db.collection('analytics_sessions');
            const snapshot = await sessionsRef
                .where('ip', '==', ip)
                .where('sessionActive', '==', true)
                .get();

            console.log(`Found ${snapshot.size} active sessions for admin IP ${ip}`);

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
                console.log(`Deleted ${deletedCount} sessions for admin ${email}`);
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
                console.log(`Updated ${updatedCount} sessions for client ${email}`);
            }

            return { success: true, updatedCount, isAdmin: false };
        }
    } catch (error) {
        console.error("Update User Sessions Error:", error);
        throw new functions.https.HttpsError('internal', 'Erreur lors de la mise à jour des sessions');
    }
});
