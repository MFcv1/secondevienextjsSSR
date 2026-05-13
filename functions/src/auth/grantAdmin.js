/**
 * AUTH: Attribution automatique du rôle Admin
 * 
 * Trigger: auth.user().onCreate
 * Vérifie si le nouvel utilisateur est dans la whitelist admin.
 * Si oui, attribue le Custom Claim + met à jour Firestore.
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

const db = admin.firestore();

exports.grantAdminOnAuth = functions.auth.user().onCreate(async (user) => {
    const adminDocRef = db.doc('sys_metadata/admin_users');
    const docSnap = await adminDocRef.get();

    if (!docSnap.exists) return;

    const whitelist = docSnap.data().users || {};
    const [pendingKey, pendingData] = Object.entries(whitelist).find(([key, val]) => val.email === user.email) || [];

    if (pendingData) {
        console.log(`🎯 Nouvel utilisateur Admin détecté: ${user.email}. Attribution des droits...`);

        // 1. Grant Custom Claims
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });

        // 2. Update Whitelist (pending → active with real UID)
        const callerEmail = pendingData.addedBy || 'system';
        const updates = {};
        if (pendingKey !== user.uid) {
            updates[`users.${pendingKey}`] = admin.firestore.FieldValue.delete();
        }
        updates[`users.${user.uid}`] = {
            uid: user.uid,
            email: user.email,
            name: pendingData.name || user.displayName || 'Admin',
            addedBy: callerEmail,
            status: 'active'
        };
        await adminDocRef.update(updates);

        // 3. Create/Update User Document
        await db.collection('users').doc(user.uid).set({
            role: 'admin',
            email: user.email,
            name: user.displayName || pendingData.name || 'Admin',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ Admin ${user.email} activé avec succès (UID: ${user.uid}).`);
    } else {
        console.log(`User ${user.email} not in admin whitelist.`);
    }
});
