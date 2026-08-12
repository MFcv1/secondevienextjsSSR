/**
 * AUTH: Ajouter/Révoquer un admin + Log connexion + Stats utilisateurs
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const crypto = require('node:crypto');
const {
    assertConfirmText,
    checkStrongAdmin,
    checkActiveStrongAdmin,
    checkActiveStrongSuperAdmin,
    checkConfiguredSuperAdminBootstrap,
    getSuperAdminEmail,
    normalizeEmail,
    writeSecurityAudit
} = require('../../helpers/security');
const { SUPER_ADMIN_EMAIL: SUPER_ADMIN_EMAIL_SECRET } = require('../../helpers/secrets');
const { regionalFunctions } = require('../../helpers/runtime');
const { timestampFromNow, SYSTEM_DOC_RETENTION_DAYS } = require('../analytics/constants');

const db = admin.firestore();
const ADMIN_ACCESS_COLLECTION = 'sys_admin_access';

function hashAdminEmail(email) {
    return crypto.createHash('sha256').update(normalizeEmail(email)).digest('hex');
}

function buildActiveAccessRecord({ uid, email, role, activatedByUid }) {
    return {
        uid,
        active: true,
        role: role === 'owner' ? 'owner' : 'admin',
        emailHash: hashAdminEmail(email),
        activatedByUid: activatedByUid || 'system',
        activatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        revokedAt: admin.firestore.FieldValue.delete(),
        revokedByUid: admin.firestore.FieldValue.delete(),
        revocationState: admin.firestore.FieldValue.delete(),
        version: 1
    };
}

async function activateAdminAccess({ uid, email, role, activatedByUid }) {
    if (!uid || uid.startsWith('pending_')) return;
    await db.collection(ADMIN_ACCESS_COLLECTION).doc(uid).set(
        buildActiveAccessRecord({ uid, email, role, activatedByUid }),
        { merge: true }
    );
}

async function migrateLegacyAdminAccess(legacyUsers, activatedByUid) {
    const candidates = Object.values(legacyUsers || {})
        .filter((entry) => entry?.uid && !entry.uid.startsWith('pending_') && entry.status === 'active')
        .map(async (entry) => {
            const accessRef = db.collection(ADMIN_ACCESS_COLLECTION).doc(entry.uid);
            const accessSnap = await accessRef.get();
            // Une entree inactive represente une revocation explicite et ne doit jamais
            // etre reactivee par une migration ou une ancienne whitelist.
            if (accessSnap.exists) return false;
            await activateAdminAccess({
                uid: entry.uid,
                email: entry.email,
                role: entry.role,
                activatedByUid
            });
            return true;
        });
    const results = await Promise.all(candidates);
    return results.filter(Boolean).length;
}

exports.ensureAdminAccessRegistry = regionalFunctions().runWith({
    enforceAppCheck: true,
    secrets: [SUPER_ADMIN_EMAIL_SECRET]
}).https.onCall(async (_data, context) => {
    checkStrongAdmin(context);
    const accessRef = db.collection(ADMIN_ACCESS_COLLECTION).doc(context.auth.uid);
    const accessSnap = await accessRef.get();
    if (accessSnap.exists) {
        if (accessSnap.data().active !== true) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Acces administrateur retire.',
                { reason: 'admin-access-inactive' }
            );
        }
        return { success: true, migrated: false, role: accessSnap.data().role };
    }

    const legacySnap = await db.doc('sys_metadata/admin_users').get();
    const legacyRecord = legacySnap.exists
        ? legacySnap.data().users?.[context.auth.uid]
        : null;
    const callerEmail = normalizeEmail(context.auth.token.email);
    if (
        !legacyRecord
        || legacyRecord.status !== 'active'
        || normalizeEmail(legacyRecord.email) !== callerEmail
        || context.auth.token.email_verified !== true
    ) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Migration administrateur refusee.',
            { reason: 'legacy-admin-not-active' }
        );
    }

    await activateAdminAccess({
        uid: context.auth.uid,
        email: callerEmail,
        role: legacyRecord.role,
        activatedByUid: context.auth.uid
    });
    await writeSecurityAudit('admin.registry_self_migrated', context, {
        uid: context.auth.uid,
        role: legacyRecord.role === 'owner' ? 'owner' : 'admin'
    });
    return {
        success: true,
        migrated: true,
        role: legacyRecord.role === 'owner' ? 'owner' : 'admin'
    };
});

exports.syncSuperAdminClaim = regionalFunctions().runWith({ enforceAppCheck: true, secrets: [SUPER_ADMIN_EMAIL_SECRET] }).https.onCall(async (data, context) => {
    checkConfiguredSuperAdminBootstrap(context);
    const configuredSuperAdminEmail = getSuperAdminEmail();
    const callerEmail = normalizeEmail(context.auth?.token?.email);
    if (!configuredSuperAdminEmail || callerEmail !== configuredSuperAdminEmail) {
        throw new functions.https.HttpsError('permission-denied', 'Bootstrap super-admin reserve au compte proprietaire configure.');
    }

    try {
        const userRecord = await admin.auth().getUser(context.auth.uid);
        if (userRecord.emailVerified !== true) {
            throw new functions.https.HttpsError('failed-precondition', 'Email verifie requis avant bootstrap super-admin.');
        }
        const email = (userRecord.email || context.auth.token.email || '').trim().toLowerCase();
        const name = userRecord.displayName || 'Admin';
        await activateAdminAccess({
            uid: context.auth.uid,
            email,
            role: 'owner',
            activatedByUid: context.auth.uid
        });
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

        const legacySnap = await db.doc('sys_metadata/admin_users').get();
        const migratedAdmins = await migrateLegacyAdminAccess(
            legacySnap.exists ? legacySnap.data().users : {},
            context.auth.uid
        );

        await writeSecurityAudit('admin.sync_super_admin_claim', context, {
            uid: context.auth.uid,
            emailHash: hashAdminEmail(email),
            migratedAdmins
        });

        return { success: true };
    } catch (error) {
        if (error instanceof functions.https.HttpsError) throw error;
        console.error("Erreur Sync Super Admin:", error);
        throw new functions.https.HttpsError('internal', 'Synchronisation super-administrateur impossible.');
    }
});

// --- AJOUTER UN ADMIN ---
exports.addAdminUser = regionalFunctions().runWith({ enforceAppCheck: true, secrets: [SUPER_ADMIN_EMAIL_SECRET] }).https.onCall(async (data, context) => {
    await checkActiveStrongSuperAdmin(context);
    assertConfirmText(data, 'AJOUTER ADMIN', 'ajout admin');
    const normalizedEmail = normalizeEmail(data?.email);
    const name = data?.name;
    if (!normalizedEmail) throw new functions.https.HttpsError('invalid-argument', 'Email requis.');

    let targetUid = null;
    let userExists = false;
    let targetEmailVerified = false;

    try {
        const configuredSuperAdminEmail = getSuperAdminEmail();
        const isTargetSuperAdmin = Boolean(configuredSuperAdminEmail) && normalizedEmail === configuredSuperAdminEmail;
        try {
            const userRecord = await admin.auth().getUserByEmail(normalizedEmail);
            targetUid = userRecord.uid;
            userExists = true;
            targetEmailVerified = userRecord.emailVerified === true;
            if (targetEmailVerified) {
                await activateAdminAccess({
                    uid: userRecord.uid,
                    email: normalizedEmail,
                    role: isTargetSuperAdmin ? 'owner' : 'admin',
                    activatedByUid: context.auth.uid
                });
                await admin.auth().setCustomUserClaims(userRecord.uid, {
                    ...(userRecord.customClaims || {}),
                    admin: true,
                    superAdmin: isTargetSuperAdmin || userRecord.customClaims?.superAdmin === true
                });
            }
        } catch (error) {
            if (error?.code !== 'auth/user-not-found') throw error;
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
                    status: userExists ? (targetEmailVerified ? 'active' : 'pending_email_verification') : 'pending',
                    role: isTargetSuperAdmin ? 'owner' : 'admin',
                    superAdmin: isTargetSuperAdmin
                }
            }
        }, { merge: true });

        if (userExists && targetUid) {
            if (!targetEmailVerified) {
                await writeSecurityAudit('admin.add_admin_user', context, {
                    targetUid,
                    targetEmailHash: hashAdminEmail(normalizedEmail),
                    userExists,
                    targetEmailVerified,
                    isTargetSuperAdmin
                });
                return { success: true, userExists, uid: targetUid, pendingEmailVerification: true };
            }
            await db.collection('users').doc(targetUid).set({
                role: isTargetSuperAdmin ? 'owner' : 'admin',
                superAdmin: isTargetSuperAdmin,
                email: normalizedEmail,
                name: name || 'Admin',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        await writeSecurityAudit('admin.add_admin_user', context, {
            targetUid,
            targetEmailHash: hashAdminEmail(normalizedEmail),
            userExists,
            targetEmailVerified,
            isTargetSuperAdmin
        });
        return { success: true, userExists, uid: targetUid };
    } catch (error) {
        if (error instanceof functions.https.HttpsError) throw error;
        console.error("Erreur Add Admin:", error);
        throw new functions.https.HttpsError('internal', 'Ajout administrateur impossible.');
    }
});

// --- RÉVOQUER UN ADMIN ---
exports.removeAdminUser = regionalFunctions().runWith({ enforceAppCheck: true, secrets: [SUPER_ADMIN_EMAIL_SECRET] }).https.onCall(async (data, context) => {
    await checkActiveStrongSuperAdmin(context);
    assertConfirmText(data, 'RETIRER ADMIN', 'retrait admin');
    const { uid } = data;
    const email = normalizeEmail(data?.email);
    const configuredSuperAdminEmail = getSuperAdminEmail();

    if (configuredSuperAdminEmail && email === configuredSuperAdminEmail) {
        throw new functions.https.HttpsError('failed-precondition', 'Impossible de révoquer le super-administrateur.');
    }

    const progress = {
        registryInactive: false,
        claimsRemoved: false,
        refreshTokensRevoked: false,
        profileUpdated: false,
        whitelistArchived: false
    };

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
            } catch (error) {
                if (error?.code !== 'auth/user-not-found') throw error;
                // Une invitation en attente peut ne pas encore correspondre a un compte Auth.
            }
        }

        const targetAccessRef = targetUid && !targetUid.startsWith('pending_')
            ? db.collection(ADMIN_ACCESS_COLLECTION).doc(targetUid)
            : null;
        const targetAccessSnap = targetAccessRef ? await targetAccessRef.get() : null;
        if (targetAccessSnap?.exists && targetAccessSnap.data().role === 'owner') {
            throw new functions.https.HttpsError('failed-precondition', 'Impossible de revoquer le super-administrateur.');
        }

        await writeSecurityAudit('admin.revoke_started', context, {
            targetUid: targetUid || uid || null,
            targetEmailHash: email ? hashAdminEmail(email) : null
        });

        if (targetAccessRef) {
            await targetAccessRef.set({
                uid: targetUid,
                active: false,
                revokedAt: admin.firestore.FieldValue.serverTimestamp(),
                revokedByUid: context.auth.uid,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                revocationState: 'registry_inactive',
                version: 1
            }, { merge: true });
            progress.registryInactive = true;

            const userRecord = await admin.auth().getUser(targetUid).catch(() => null);
            await admin.auth().setCustomUserClaims(targetUid, {
                ...(userRecord?.customClaims || {}),
                admin: false,
                superAdmin: false
            });
            progress.claimsRemoved = true;

            await admin.auth().revokeRefreshTokens(targetUid);
            progress.refreshTokensRevoked = true;

            await db.collection('users').doc(targetUid).set({
                role: 'user',
                superAdmin: false,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            progress.profileUpdated = true;

            await targetAccessRef.set({
                revocationState: 'completed',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        await db.doc('sys_metadata/admin_users').set({
            users: {
                [uid || targetUid]: admin.firestore.FieldValue.delete()
            }
        }, { merge: true });
        progress.whitelistArchived = true;

        await writeSecurityAudit('admin.revoke_completed', context, {
            targetUid: targetUid || uid || null,
            targetEmailHash: email ? hashAdminEmail(email) : null,
            progress
        });

        return { success: true };
    } catch (error) {
        await writeSecurityAudit('admin.revoke_failed', context, {
            targetUid: uid || null,
            targetEmailHash: email ? hashAdminEmail(email) : null,
            progress,
            errorCode: error?.code || 'internal'
        });
        if (error instanceof functions.https.HttpsError) throw error;
        console.error("Erreur Remove Admin:", error);
        throw new functions.https.HttpsError('internal', 'Retrait administrateur impossible.');
    }
});

// --- LOG CONNEXION (IP + Device) ---
exports.logUserConnection = regionalFunctions().runWith({ enforceAppCheck: true }).https.onCall(async (data, context) => {
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

        return { success: true };
    } catch (error) {
        console.error("❌ Erreur LogConnection:", error);
        return { success: false, error: 'connection_log_failed' };
    }
});

// --- STATS UTILISATEURS (Admin) ---
exports.getUserStats = regionalFunctions().runWith({ enforceAppCheck: true, timeoutSeconds: 300, memory: '512MB' }).https.onCall(async (data, context) => {
    await checkActiveStrongAdmin(context);

    try {
        const includeUsers = data?.includeUsers === true;
        const statsRef = db.doc('sys_user_stats/current');
        if (!includeUsers) {
            const cachedStats = await statsRef.get();
            if (cachedStats.exists && Number.isSafeInteger(cachedStats.data()?.registeredUsers)) {
                return {
                    success: true,
                    count: Math.max(0, cachedStats.data().registeredUsers),
                    users: []
                };
            }
        }
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
                if (!userRecord.email) return;
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

        if (!includeUsers) {
            await db.runTransaction(async (transaction) => {
                const current = await transaction.get(statsRef);
                if (!current.exists) {
                    transaction.set(statsRef, {
                        registeredUsers: allUsers.length,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        version: 1
                    });
                }
            });
        }

        if (includeUsers) {
            allUsers.sort((a, b) => new Date(b.creationTime) - new Date(a.creationTime));
        }
        return { success: true, count: allUsers.length, users: includeUsers ? allUsers : [] };
    } catch (error) {
        console.error("❌ Erreur getUserStats:", error);
        throw new functions.https.HttpsError('internal', 'Statistiques utilisateurs indisponibles.');
    }
});
