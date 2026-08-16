/**
 * ANALYTICS: Gestion des IPs Admin (Exclusion des stats)
 * 
 * - trackAdminIP: Met à jour les IPs des admins lorsqu'ils se connectent
 * - isAdminIP: Vérifie si une IP appartient à un admin (helper interne)
 */
const functions = require('firebase-functions/v1');
const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { checkActiveStrongAdmin } = require('../../helpers/security');
const { regionalFunctions } = require('../../helpers/runtime');
const { getClientIpInfo } = require('./ip');

const db = admin.firestore();
const ADMIN_IP_CACHE_MS = 5 * 60 * 1000;
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
let adminIpCache = { expiresAt: 0, ips: null };

// Mettre à jour les IPs des admins lorsqu'ils se connectent
const trackAdminIPHandler = async (_data, context) => {
    await checkActiveStrongAdmin(context);

    const email = String(context.auth.token.email || '').trim().toLowerCase();
    const ip = getClientIpInfo(context.rawRequest).ip;

    if (!ip || ip === 'Unknown') {
        return { success: false, message: 'IP non détectée' };
    }

    try {
        const adminIpsRef = db.doc('sys_metadata/admin_ips');
        await db.runTransaction(async (transaction) => {
            const docSnap = await transaction.get(adminIpsRef);
            const currentIps = { ...(docSnap.exists ? docSnap.data()?.ips || {} : {}) };
            const nowDate = new Date();

            currentIps[ip] = {
                adminEmail: email,
                lastSeen: nowDate,
                firstSeen: currentIps[ip]?.firstSeen || nowDate
            };

            const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            Object.keys(currentIps).forEach((key) => {
                const lastSeen = currentIps[key]?.lastSeen;
                const lastSeenDate = lastSeen?.toDate ? lastSeen.toDate() : new Date(lastSeen);
                if (!Number.isFinite(lastSeenDate.getTime()) || lastSeenDate < ninetyDaysAgo) {
                    delete currentIps[key];
                }
            });

            transaction.set(adminIpsRef, { ips: currentIps }, { merge: true });
        });
        adminIpCache = { expiresAt: 0, ips: null };
        return { success: true };
    } catch (error) {
        console.error("Track Admin IP Error:", error);
        throw new functions.https.HttpsError('internal', 'Erreur lors du suivi IP');
    }
};

exports.trackAdminIP = regionalFunctions()
    .runWith({ enforceAppCheck: true })
    .https.onCall(trackAdminIPHandler);

exports.trackAdminIPGen2 = onCall(
    TRACK_ADMIN_IP_GEN2_RUNTIME,
    async (request) => trackAdminIPHandler(request.data, request)
);

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
exports.trackAdminIPHandler = trackAdminIPHandler;
exports.TRACK_ADMIN_IP_GEN2_RUNTIME = TRACK_ADMIN_IP_GEN2_RUNTIME;
