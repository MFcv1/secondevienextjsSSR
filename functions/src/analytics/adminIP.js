/**
 * ANALYTICS: Gestion des IPs Admin (Exclusion des stats)
 * 
 * - trackAdminIP: Met à jour les IPs des admins lorsqu'ils se connectent
 * - isAdminIP: Vérifie si une IP appartient à un admin (helper interne)
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { SUPER_ADMIN_EMAIL } = require('../../helpers/security');

const db = admin.firestore();
const ADMIN_IP_CACHE_MS = 5 * 60 * 1000;
let adminIpCache = { expiresAt: 0, ips: null };

// Mettre à jour les IPs des admins lorsqu'ils se connectent
exports.trackAdminIP = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth requise.');

    const email = context.auth.token.email;
    let isAdmin = context.auth.token.admin === true || email === SUPER_ADMIN_EMAIL;

    // Vérifier aussi dans Firestore si le custom claim n'est pas encore défini
    if (!isAdmin) {
        try {
            const userDoc = await db.doc(`users/${context.auth.uid}`).get();
            if (!userDoc.exists || (userDoc.data().role !== 'admin' && userDoc.data().role !== 'super_admin')) {
                return { success: false, message: 'Non admin' };
            }
        } catch (err) {
            return { success: false, message: 'Erreur vérification admin' };
        }
    }

    const rawIp = context.rawRequest.headers['x-forwarded-for'] || context.rawRequest.connection.remoteAddress;
    const ip = rawIp ? rawIp.split(',')[0].trim() : 'Unknown';

    if (!ip || ip === 'Unknown') {
        return { success: false, message: 'IP non détectée' };
    }

    try {
        const adminIpsRef = db.doc('sys_metadata/admin_ips');
        const docSnap = await adminIpsRef.get();

        const currentData = docSnap.exists ? docSnap.data() : { ips: {} };
        if (!currentData.ips) currentData.ips = {};

        const nowDate = new Date();

        // Ajouter ou mettre à jour l'IP
        currentData.ips[ip] = {
            adminEmail: email,
            lastSeen: nowDate,
            firstSeen: currentData.ips[ip]?.firstSeen || nowDate
        };

        // Nettoyer les anciennes IPs (plus de 90 jours)
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        Object.keys(currentData.ips).forEach(key => {
            const lastSeen = currentData.ips[key].lastSeen;
            const lastSeenDate = lastSeen?.toDate ? lastSeen.toDate() : new Date(lastSeen);
            if (lastSeenDate < ninetyDaysAgo) {
                delete currentData.ips[key];
            }
        });

        await adminIpsRef.set(currentData);
        adminIpCache = { expiresAt: 0, ips: null };
        return { success: true, ip: ip };
    } catch (error) {
        console.error("Track Admin IP Error:", error);
        throw new functions.https.HttpsError('internal', 'Erreur lors du suivi IP');
    }
});

// Vérifier si une IP appartient à un admin (helper interne)
const isAdminIP = async (ip) => {
    if (!ip || ip === 'Unknown') return false;

    try {
        if (adminIpCache.ips && adminIpCache.expiresAt > Date.now()) {
            return Object.prototype.hasOwnProperty.call(adminIpCache.ips, ip);
        }

        const adminIpsRef = db.doc('sys_metadata/admin_ips');
        const docSnap = await adminIpsRef.get();

        if (!docSnap.exists) {
            adminIpCache = { expiresAt: Date.now() + ADMIN_IP_CACHE_MS, ips: {} };
            return false;
        }

        const ips = docSnap.data().ips || {};
        adminIpCache = { expiresAt: Date.now() + ADMIN_IP_CACHE_MS, ips };
        return Object.prototype.hasOwnProperty.call(ips, ip);
    } catch (error) {
        console.error("Check Admin IP Error:", error);
        return false;
    }
};

exports.isAdminIP = isAdminIP;
