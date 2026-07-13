/**
 * AUTH: Attribution automatique du rôle Admin
 * 
 * Trigger: auth.user().onCreate
 * Vérifie si le nouvel utilisateur est dans la whitelist admin.
 * Si oui, attribue le Custom Claim + met à jour Firestore.
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const crypto = require('node:crypto');
const { SUPER_ADMIN_EMAIL: SUPER_ADMIN_EMAIL_SECRET } = require('../../helpers/secrets');
const { getSuperAdminEmail } = require('../../helpers/security');

const db = admin.firestore();

exports.grantAdminOnAuth = functions.runWith({ secrets: [SUPER_ADMIN_EMAIL_SECRET] }).auth.user().onCreate(async (user) => {
    const adminDocRef = db.doc('sys_metadata/admin_users');
    const docSnap = await adminDocRef.get();
    const normalizedUserEmail = (user.email || '').trim().toLowerCase();

    const superAdminEmail = getSuperAdminEmail();
    const isConfiguredSuperAdmin = Boolean(superAdminEmail) && normalizedUserEmail === superAdminEmail;

    if (!docSnap.exists && !isConfiguredSuperAdmin) return;

    const whitelist = docSnap.exists ? (docSnap.data().users || {}) : {};
    const [pendingKey, pendingData] = Object.entries(whitelist).find(([, val]) => (
        (val.email || '').trim().toLowerCase() === normalizedUserEmail
    )) || [];

    if ((pendingData || isConfiguredSuperAdmin) && user.emailVerified !== true) {
        console.warn(`Admin claim refused for unverified email: ${user.email}`);
        return;
    }

    if (pendingData || isConfiguredSuperAdmin) {
        console.log(`🎯 Nouvel utilisateur Admin détecté: ${user.email}. Attribution des droits...`);

        const role = isConfiguredSuperAdmin ? 'owner' : 'admin';

        // Le registre serveur coupe les droits Rules avant l'expiration d'un ID token.
        await db.collection('sys_admin_access').doc(user.uid).set({
            uid: user.uid,
            active: true,
            role,
            emailHash: crypto.createHash('sha256').update(normalizedUserEmail).digest('hex'),
            activatedByUid: pendingData?.addedByUid || 'system',
            activatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            revokedAt: admin.firestore.FieldValue.delete(),
            revokedByUid: admin.firestore.FieldValue.delete(),
            revocationState: admin.firestore.FieldValue.delete(),
            version: 1
        }, { merge: true });

        // 1. Grant Custom Claims
        await admin.auth().setCustomUserClaims(user.uid, {
            ...(user.customClaims || {}),
            admin: true,
            superAdmin: isConfiguredSuperAdmin
        });

        // 2. Update Whitelist (pending → active with real UID)
        const callerEmail = pendingData?.addedBy || 'system';
        const adminUserRecord = {
            uid: user.uid,
            email: normalizedUserEmail,
            name: pendingData?.name || user.displayName || 'Admin',
            addedBy: callerEmail,
            status: 'active',
            role,
            superAdmin: isConfiguredSuperAdmin
        };
        const updates = {};
        if (pendingKey && pendingKey !== user.uid) {
            updates[`users.${pendingKey}`] = admin.firestore.FieldValue.delete();
        }
        updates[`users.${user.uid}`] = adminUserRecord;
        if (docSnap.exists) {
            await adminDocRef.update(updates);
        } else {
            await adminDocRef.set({ users: { [user.uid]: adminUserRecord } }, { merge: true });
        }

        // 3. Create/Update User Document
        await db.collection('users').doc(user.uid).set({
            role,
            superAdmin: isConfiguredSuperAdmin,
            email: normalizedUserEmail,
            name: user.displayName || pendingData?.name || 'Admin',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ Admin ${user.email} activé avec succès (UID: ${user.uid}).`);
    } else {
        console.log(`User ${user.email} not in admin whitelist.`);
    }
});
