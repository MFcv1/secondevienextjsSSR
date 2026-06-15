/**
 * AUTH: Ajouter/Révoquer un admin + Log connexion + Stats utilisateurs
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { checkIsAdmin, checkIsSuperAdmin, SUPER_ADMIN_EMAIL } = require('../../helpers/security');
const { timestampFromNow, SYSTEM_DOC_RETENTION_DAYS } = require('../analytics/constants');

const db = admin.firestore();

exports.syncSuperAdminClaim = functions.https.onCall(async (data, context) => {
    checkIsSuperAdmin(context);

    try {
        const userRecord = await admin.auth().getUser(context.auth.uid);
        const email = (userRecord.email || context.auth.token.email || '').trim().toLowerCase();
        const name = userRecord.displayName || 'Admin';
        await admin.auth().setCustomUserClaims(context.auth.uid, {
            ...(userRecord.customClaims || {}),
            admin: true,
            superAdmin: true
        });

        await db.doc('sys_metadata/admin_users').set({
            users: {
                [context.auth.uid]: {
                    uid: context.auth.uid,
                    email,
                    name,
                    addedBy: 'system',
                    status: 'active',
                    role: 'owner',
                    superAdmin: true
                }
            }
        }, { merge: true });

        await db.collection('users').doc(context.auth.uid).set({
            role: 'owner',
            superAdmin: true,
            email,
            name,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return { success: true };
    } catch (error) {
        if (error instanceof functions.https.HttpsError) throw error;
        console.error("Erreur Sync Super Admin:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// --- AJOUTER UN ADMIN ---
exports.addAdminUser = functions.https.onCall(async (data, context) => {
    checkIsSuperAdmin(context);
    const normalizedEmail = (data?.email || '').trim().toLowerCase();
    const name = data?.name;
    if (!normalizedEmail) throw new functions.https.HttpsError('invalid-argument', 'Email requis.');

    let targetUid = null;
    let userExists = false;

    try {
        const isTargetSuperAdmin = Boolean(SUPER_ADMIN_EMAIL) && normalizedEmail === SUPER_ADMIN_EMAIL.trim().toLowerCase();
        try {
            const userRecord = await admin.auth().getUserByEmail(normalizedEmail);
            targetUid = userRecord.uid;
            userExists = true;
            await admin.auth().setCustomUserClaims(userRecord.uid, {
                ...(userRecord.customClaims || {}),
                admin: true,
                superAdmin: isTargetSuperAdmin || userRecord.customClaims?.superAdmin === true
            });
        } catch (e) {
            targetUid = `pending_${Date.now()}`;
        }

        const callerEmail = context.auth.token.email;
        await db.doc('sys_metadata/admin_users').set({
            users: {
                [targetUid]: {
                    uid: targetUid,
                    email: normalizedEmail,
                    name: name || 'Admin',
                    addedBy: callerEmail,
                    status: userExists ? 'active' : 'pending',
                    role: isTargetSuperAdmin ? 'owner' : 'admin',
                    superAdmin: isTargetSuperAdmin
                }
            }
        }, { merge: true });

        if (userExists && targetUid) {
            await db.collection('users').doc(targetUid).set({
                role: isTargetSuperAdmin ? 'owner' : 'admin',
                superAdmin: isTargetSuperAdmin,
                email: normalizedEmail,
                name: name || 'Admin',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        return { success: true, userExists, uid: targetUid };
    } catch (error) {
        console.error("Erreur Add Admin:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// --- RÉVOQUER UN ADMIN ---
exports.removeAdminUser = functions.https.onCall(async (data, context) => {
    checkIsSuperAdmin(context);
    const { uid } = data;
    const email = (data?.email || '').trim().toLowerCase();

    if (email === SUPER_ADMIN_EMAIL.trim().toLowerCase()) {
        throw new functions.https.HttpsError('failed-precondition', 'Impossible de révoquer le super-administrateur.');
    }

    try {
        const adminUsersSnap = await db.doc('sys_metadata/admin_users').get();
        const adminUsers = adminUsersSnap.exists ? (adminUsersSnap.data().users || {}) : {};
        const currentRecord = adminUsers[uid] || Object.values(adminUsers).find((entry) => (
            (entry.email || '').trim().toLowerCase() === email
        ));
        if (currentRecord?.superAdmin === true || currentRecord?.role === 'owner') {
            throw new functions.https.HttpsError('failed-precondition', 'Impossible de rÃ©voquer le super-administrateur.');
        }

        let targetUid = uid;
        if (email && (!targetUid || targetUid.startsWith('pending_'))) {
            try {
                const userRecord = await admin.auth().getUserByEmail(email);
                targetUid = userRecord.uid;
            } catch (e) { /* User might not exist yet */ }
        }

        if (targetUid && !targetUid.startsWith('pending_')) {
            const userRecord = await admin.auth().getUser(targetUid).catch(() => null);
            await admin.auth().setCustomUserClaims(targetUid, {
                ...(userRecord?.customClaims || {}),
                admin: false,
                superAdmin: userRecord?.customClaims?.superAdmin === true
            });
            await db.collection('users').doc(targetUid).update({ role: 'user' }).catch(() => { });
        }

        await db.doc('sys_metadata/admin_users').update({
            [`users.${uid || targetUid}`]: admin.firestore.FieldValue.delete()
        });

        return { success: true };
    } catch (error) {
        if (error instanceof functions.https.HttpsError) throw error;
        console.error("Erreur Remove Admin:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// --- LOG CONNEXION (IP + Device) ---
exports.logUserConnection = functions.https.onCall(async (data, context) => {
    if (!context.auth) return { success: false, message: "Unauthenticated" };

    const userId = context.auth.uid;
    const rateLimitRef = db.doc(`sys_ratelimit/log_${userId}`);
    const rlSnap = await rateLimitRef.get();
    const rlData = rlSnap.exists ? rlSnap.data() : { count: 0, resetAt: 0 };

    if (Date.now() < rlData.resetAt && rlData.count >= 3) {
        return { success: true, rateLimited: true };
    }
    rateLimitRef.set({
        count: 1,
        resetAt: Date.now() + 600000,
        expireAt: timestampFromNow(SYSTEM_DOC_RETENTION_DAYS)
    }).catch(() => { });

    try {
        const rawIp = context.rawRequest.headers['x-forwarded-for'] || context.rawRequest.connection.remoteAddress;
        const ip = rawIp ? rawIp.split(',')[0].trim() : 'Unknown';
        const userAgent = context.rawRequest.headers['user-agent'] || 'Unknown';

        await db.collection('users').doc(userId).set({
            email: context.auth.token.email || null,
            lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
            securityData: {
                ip: ip,
                ua: userAgent,
                detectedAt: admin.firestore.FieldValue.serverTimestamp()
            }
        }, { merge: true });

        return { success: true, ip: ip };
    } catch (error) {
        console.error("❌ Erreur LogConnection:", error);
        return { success: false, error: error.message };
    }
});

// --- STATS UTILISATEURS (Admin) ---
exports.getUserStats = functions.runWith({ timeoutSeconds: 300, memory: '512MB' }).https.onCall(async (data, context) => {
    checkIsAdmin(context);

    try {
        const includeUsers = data?.includeUsers === true;
        let nextPageToken;
        const allUsers = [];
        const userMetadataMap = {};

        if (includeUsers) {
            const userDocsSnapshot = await db.collection('users').get();
            userDocsSnapshot.forEach(doc => { userMetadataMap[doc.id] = doc.data(); });
        }

        do {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            listUsersResult.users.forEach((userRecord) => {
                if (!userRecord.email || userRecord.providerData.length === 0) return;
                if (!includeUsers) {
                    allUsers.push({ uid: userRecord.uid });
                    return;
                }
                const meta = userMetadataMap[userRecord.uid] || {};
                allUsers.push({
                    uid: userRecord.uid,
                    email: userRecord.email,
                    displayName: userRecord.displayName || '',
                    emailVerified: userRecord.emailVerified,
                    creationTime: userRecord.metadata.creationTime,
                    lastSignInTime: userRecord.metadata.lastSignInTime,
                    ip: meta.securityData?.ip || 'N/A',
                    device: meta.securityData?.ua || 'N/A'
                });
            });
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);

        if (includeUsers) {
            allUsers.sort((a, b) => new Date(b.creationTime) - new Date(a.creationTime));
        }
        return { success: true, count: allUsers.length, users: includeUsers ? allUsers : [] };
    } catch (error) {
        console.error("❌ Erreur getUserStats:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
