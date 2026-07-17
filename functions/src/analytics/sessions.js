/**
 * ANALYTICS: Sessions en direct
 *
 * - initLiveSession: Crée une session avec geo-IP + détection admin IP
 * - syncSession: Met à jour le parcours
 * - syncSessionBeacon: Endpoint fiable pour fermeture de page
 * - deleteSession / clearAllSessions: Admin cleanup
 */
const { functions, regionalFunctions } = require('../../helpers/runtime');
const admin = require('firebase-admin');
const crypto = require('crypto');
const { isAdminIP } = require('./adminIP');
const { getClientIpInfo, isPrivateOrLocalIp } = require('./ip');
const { checkRecentActiveStrongAdmin } = require('../../helpers/security');
const {
    canResumeSession,
    hashSyncToken,
    isValidSyncToken,
    toMillis
} = require('./sessionSecurity');
const { createSessionAuthorizationCache } = require('./sessionAuthorizationCache');

const db = admin.firestore();
const MAX_SESSION_DURATION_SECONDS = 24 * 60 * 60;
const MAX_JOURNEY_CHUNK = 25;
const SYNC_REASONS = new Set([
    'init',
    'route',
    'affiliate',
    'heartbeat',
    'visible',
    'visibility_hidden',
    'beforeunload',
    'pagehide',
    'manual'
]);
const sessionAuthorizationCache = createSessionAuthorizationCache();

const createSyncToken = () => crypto.randomBytes(32).toString('base64url');

const clampDuration = (value) => {
    const duration = Number(value);
    if (!Number.isFinite(duration)) return 0;
    return Math.max(0, Math.min(MAX_SESSION_DURATION_SECONDS, Math.round(duration)));
};

const clampJourneyTimestampMs = (value) => {
    const ms = Number(value);
    if (!Number.isFinite(ms) || ms <= 0) return null;

    const now = Date.now();
    const min = now - (366 * 24 * 60 * 60 * 1000);
    const max = now + (5 * 60 * 1000);
    if (ms < min || ms > max) return null;

    return Math.round(ms);
};

const sanitizeString = (value, maxLength = 160) => {
    if (value === null || value === undefined) return null;
    return String(value).slice(0, maxLength);
};

const sanitizeSyncReason = (value) => {
    const reason = sanitizeString(value, 40) || 'manual';
    return SYNC_REASONS.has(reason) ? reason : 'manual';
};

const verifySessionSyncToken = async (sessionRef, syncToken) => {
    const cachedHash = sessionAuthorizationCache.get(sessionRef.id);
    if (cachedHash) {
        return {
            exists: true,
            valid: isValidSyncToken({ syncTokenHash: cachedHash }, syncToken),
            cacheHit: true
        };
    }

    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) return { exists: false, valid: false, cacheHit: false };

    const sessionData = sessionSnap.data();
    if (sessionData?.syncTokenHash) {
        // Cache the authoritative hash even for a rejected token so repeated
        // invalid attempts cannot force one Firestore read per request.
        sessionAuthorizationCache.set(sessionRef.id, sessionData.syncTokenHash);
    }

    return {
        exists: true,
        valid: isValidSyncToken(sessionData, syncToken),
        cacheHit: false
    };
};

const tryResumeSession = async ({ sessionId, syncToken, authUid, device, browser, os }) => {
    const cleanSessionId = sanitizeString(sessionId, 160);
    if (!cleanSessionId || !syncToken) return null;

    const sessionRef = db.collection('analytics_sessions').doc(cleanSessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) return null;

    const sessionData = sessionSnap.data();
    const now = Date.now();
    if (!canResumeSession(sessionData, { authUid, syncToken, now })) return null;

    await sessionRef.update({
        lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
        sessionActive: true,
        device: device || sessionData.device || 'Unknown',
        browser: browser || sessionData.browser || 'Unknown',
        os: os || sessionData.os || 'Unknown',
        resumedAt: admin.firestore.FieldValue.serverTimestamp(),
        analyticsVersion: 3
    });
    if (sessionData.syncTokenHash) {
        sessionAuthorizationCache.set(sessionSnap.id, sessionData.syncTokenHash);
    }

    return {
        success: true,
        resumed: true,
        sessionId: sessionSnap.id,
        syncToken,
        ipDetected: Boolean(sessionData.ipMeta?.detected || sessionData.ip),
        startedAtMs: toMillis(sessionData.startedAt) || now
    };
};

const sanitizeJourney = (journey) => {
    if (!Array.isArray(journey)) return [];

    return journey
        .slice(0, MAX_JOURNEY_CHUNK)
        .map((step) => {
            const timestampMs = clampJourneyTimestampMs(step?.timestampMs);
            return {
                page: sanitizeString(step?.page, 80) || 'unknown',
                itemId: sanitizeString(step?.itemId, 255),
                time: sanitizeString(step?.time, 40),
                timeZone: sanitizeString(step?.timeZone, 80),
                duration: clampDuration(step?.duration),
                ...(timestampMs ? { timestampMs } : {})
            };
        })
        .filter(step => step.page);
};

// Géolocalisation simple via IP (ip-api.com — gratuit, pas de clé API requise)
const getGeoFromIp = async (ip) => {
    if (!ip || isPrivateOrLocalIp(ip)) return null;
    try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city,status`);
        const data = await response.json();
        if (data.status === 'success') {
            return {
                country: data.country || 'Unknown',
                region: data.regionName || 'Unknown',
                city: data.city || 'Unknown'
            };
        }
        return null;
    } catch (e) {
        console.error("GeoLoc Error:", e);
        return null;
    }
};

exports.initLiveSession = regionalFunctions().https.onCall(async (data = {}, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Auth required');
    }

    const ipInfo = getClientIpInfo(context.rawRequest);
    const ip = ipInfo.ip;
    const userAgent = context.rawRequest.headers['user-agent'] || 'Unknown';
    const { userId, email, type, device, browser, os, resumeSessionId, resumeSyncToken } = data;
    const authUid = context.auth.uid || userId || 'unknown';
    const authEmail = context.auth.token.email || email || null;
    const authProvider = context.auth.token.firebase?.sign_in_provider || 'unknown';

    const resumedSession = await tryResumeSession({
        sessionId: resumeSessionId,
        syncToken: resumeSyncToken,
        authUid,
        device,
        browser,
        os
    });
    if (resumedSession) return resumedSession;

    const syncToken = createSyncToken();

    let geo = await getGeoFromIp(ip);

    // Vérifier si l'IP appartient à un admin
    const isFromAdminIP = await isAdminIP(ip);

    // Marquer la session comme admin si type admin ou IP admin
    const sessionType = (type === 'admin' || isFromAdminIP) ? 'admin' : (type || 'anonymous');

    const sessionData = {
        userId: authUid,
        email: authEmail,
        type: sessionType,
        ip: ip,
        ipMeta: {
            source: ipInfo.source,
            version: ipInfo.version,
            detected: ipInfo.detected,
            usable: ipInfo.usable,
            public: ipInfo.public
        },
        authProvider,
        visitorIdentity: {
            source: authUid && authUid !== 'unknown'
                ? (authProvider === 'anonymous' ? 'anonymous_uid' : 'auth_uid')
                : (ipInfo.usable ? 'ip' : 'session'),
            hasAuthUid: Boolean(authUid && authUid !== 'unknown'),
            hasServerIp: ipInfo.usable
        },
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
        duration: 0,
        device: device || 'Unknown',
        browser: browser || 'Unknown',
        os: os || 'Unknown',
        userAgent: userAgent,
        geo: geo || { country: 'Unknown', city: 'Unknown', region: 'Unknown' },
        journey: [],
        sessionActive: true,
        adminIPDetected: isFromAdminIP && type !== 'admin',
        analyticsVersion: 3,
        syncTokenHash: hashSyncToken(syncToken),
        syncReasonCounts: {}
    };

    try {
        const sessionRef = await db.collection('analytics_sessions').add(sessionData);
        sessionAuthorizationCache.set(sessionRef.id, sessionData.syncTokenHash);
        return {
            success: true,
            resumed: false,
            sessionId: sessionRef.id,
            syncToken,
            ipDetected: ipInfo.detected,
            startedAtMs: Date.now()
        };
    } catch (error) {
        console.error("Init Error:", error);
        throw new functions.https.HttpsError('internal', 'Init failed');
    }
});

exports.syncSession = regionalFunctions().https.onCall(async (data = {}, context) => {
    if (!context.auth) return { success: false, unauthenticated: true };

    const { sessionId, journey, duration, sessionActive, syncToken, reason } = data;
    if (!sessionId) return { success: false };

    try {
        const sessionRef = db.collection('analytics_sessions').doc(sessionId);
        const authorization = await verifySessionSyncToken(sessionRef, syncToken);

        if (!authorization.exists) {
            console.warn("Sync skipped: session not found", { sessionId });
            return { success: true, missing: true };
        }

        if (!authorization.valid) {
            console.warn("Sync rejected: invalid token", { sessionId });
            return { success: false, invalidToken: true };
        }

        const syncReason = sanitizeSyncReason(reason);
        const updates = {
            lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
            duration: clampDuration(duration),
            sessionActive: sessionActive !== undefined ? sessionActive : true,
            lastSyncReason: syncReason,
            [`syncReasonCounts.${syncReason}`]: admin.firestore.FieldValue.increment(1)
        };

        const cleanJourney = sanitizeJourney(journey);
        if (cleanJourney.length > 0) {
            updates.journey = admin.firestore.FieldValue.arrayUnion(...cleanJourney);
        }

        await sessionRef.update(updates);
        return { success: true };
    } catch (error) {
        console.error("Sync Error:", error);
        return { success: false };
    }
});

exports.syncSessionBeacon = regionalFunctions().https.onRequest(async (req, res) => {
    const allowedOrigins = [
        'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app',
        'http://localhost:3000'
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
    } else {
        res.set('Access-Control-Allow-Origin', allowedOrigins[0]);
    }
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

    try {
        let payload;
        if (typeof req.body === 'string') {
            payload = JSON.parse(req.body);
        } else if (req.rawBody) {
            payload = JSON.parse(req.rawBody.toString());
        } else {
            payload = req.body;
        }

        payload = payload || {};
        const { sessionId, journey, duration, sessionActive, syncToken, reason } = payload;

        if (!sessionId) {
            res.status(400).send('Missing session ID');
            return;
        }

        const sessionRef = db.collection('analytics_sessions').doc(sessionId);
        const authorization = await verifySessionSyncToken(sessionRef, syncToken);

        if (!authorization.exists) {
            console.warn("Beacon sync skipped: session not found", { sessionId });
            res.status(204).send('');
            return;
        }

        if (!authorization.valid) {
            console.warn("Beacon sync rejected: invalid token", { sessionId });
            res.status(403).send('Invalid session token');
            return;
        }

        const syncReason = sanitizeSyncReason(reason);
        const updates = {
            lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
            duration: clampDuration(duration),
            sessionActive: sessionActive !== undefined ? sessionActive : false,
            lastSyncReason: syncReason,
            [`syncReasonCounts.${syncReason}`]: admin.firestore.FieldValue.increment(1)
        };

        const cleanJourney = sanitizeJourney(journey);
        if (cleanJourney.length > 0) {
            updates.journey = admin.firestore.FieldValue.arrayUnion(...cleanJourney);
        }

        await sessionRef.update(updates);
        res.status(200).send('Session synced via beacon');
    } catch (error) {
        console.error("Beacon Sync Error:", error);
        res.status(500).send('Beacon sync failed');
    }
});

exports.deleteSession = regionalFunctions().https.onCall(async (data, context) => {
    await checkRecentActiveStrongAdmin(context);
    const { sessionId } = data;
    if (!sessionId) throw new functions.https.HttpsError('invalid-argument', 'Missing sessionId');
    await db.collection('analytics_sessions').doc(sessionId).delete();
    sessionAuthorizationCache.remove(sessionId);
    return { success: true };
});

exports.clearAllSessions = regionalFunctions().https.onCall(async (data, context) => {
    await checkRecentActiveStrongAdmin(context);
    try {
        const sessionsRef = db.collection('analytics_sessions');
        let totalDeleted = 0;

        while (true) {
            const snapshot = await sessionsRef.limit(500).get();
            if (snapshot.empty) break;

            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            totalDeleted += snapshot.size;

            if (snapshot.size < 500) break;
        }

        sessionAuthorizationCache.clear();

        return { success: true, count: totalDeleted };
    } catch (error) {
        console.error("Clear All Error:", error);
        throw new functions.https.HttpsError('internal', 'Clear failed');
    }
});

exports.clearAllAffiliateClicks = regionalFunctions().https.onCall(async (data, context) => {
    await checkRecentActiveStrongAdmin(context);
    try {
        const ref = db.collection('affiliate_clicks');
        let totalDeleted = 0;

        while (true) {
            const snapshot = await ref.limit(500).get();
            if (snapshot.empty) break;

            const batch = db.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            totalDeleted += snapshot.size;

            if (snapshot.size < 500) break;
        }

        return { success: true, count: totalDeleted };
    } catch (error) {
        console.error("Clear All Affiliate Clicks Error:", error);
        throw new functions.https.HttpsError('internal', 'Clear failed');
    }
});
