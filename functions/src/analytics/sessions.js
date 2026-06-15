/**
 * ANALYTICS: Sessions en direct
 *
 * Structure v2:
 * - analytics_sessions/{sessionId}        => doc résumé léger
 * - analytics_sessions/{sessionId}/journey_steps/{stepId}
 * - analytics_sessions/{sessionId}/custom_events/{eventId}
 *
 * Compatibilité:
 * - les anciens docs avec journey/events en tableau restent lisibles
 * - les nouveaux writes n'alourdissent plus le doc racine
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const crypto = require('crypto');
const { isAdminIP } = require('./adminIP');
const {
    ANALYTICS_DETAIL_RETENTION_DAYS,
    ANALYTICS_SESSION_RETENTION_DAYS,
    timestampFromNow,
    getDateKeyFromMillis
} = require('./constants');

const db = admin.firestore();
const GEO_CACHE_MS = 24 * 60 * 60 * 1000;
const GEO_CACHE_MAX = 1000;
const MAX_JOURNEY_CHUNK = 24;
const MAX_EVENT_CHUNK = 24;
const geoCache = new Map();

function computeVisitorKey(ip, userAgent) {
    if (!ip) return null;
    const raw = `${ip}|${userAgent || ''}`;
    return crypto.createHash('sha1').update(raw).digest('hex').slice(0, 16);
}

function computeChunkDocId(kind, payload) {
    const raw = JSON.stringify([
        kind,
        payload.sessionId,
        payload.timestamp || 0,
        payload.pageKey || payload.page || '',
        payload.itemId || payload.context?.itemId || '',
        payload.action || ''
    ]);

    return crypto.createHash('sha1').update(raw).digest('hex');
}

function parseLegacyItemId(value) {
    if (!value || typeof value !== 'string') return null;
    return value.split(' | ')[0].trim();
}

function normalizeJourneyStep(step, sessionMeta) {
    const timestamp = Number(step?.timestamp) || Date.now();
    const itemId = step?.context?.itemId || parseLegacyItemId(step?.itemId);

    return {
        ...step,
        sessionId: sessionMeta.sessionId,
        userId: sessionMeta.userId,
        visitorKey: sessionMeta.visitorKey,
        timestamp,
        pageKey: step?.pageKey || step?.page || 'unknown',
        itemId,
        dateKey: getDateKeyFromMillis(timestamp),
        expireAt: timestampFromNow(ANALYTICS_DETAIL_RETENTION_DAYS)
    };
}

function normalizeCustomEvent(event, sessionMeta) {
    const timestamp = Number(event?.timestamp) || Date.now();

    return {
        ...event,
        sessionId: sessionMeta.sessionId,
        userId: sessionMeta.userId,
        visitorKey: sessionMeta.visitorKey,
        timestamp,
        dateKey: getDateKeyFromMillis(timestamp),
        expireAt: timestampFromNow(ANALYTICS_DETAIL_RETENTION_DAYS)
    };
}

async function getGeoFromIp(ip) {
    if (!ip || ip === 'Unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) return null;
    const cached = geoCache.get(ip);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city,status`);
        const data = await response.json();
        if (data.status === 'success') {
            const value = {
                country: data.country || 'Unknown',
                region: data.regionName || 'Unknown',
                city: data.city || 'Unknown'
            };
            geoCache.set(ip, { value, expiresAt: Date.now() + GEO_CACHE_MS });
            if (geoCache.size > GEO_CACHE_MAX) {
                geoCache.delete(geoCache.keys().next().value);
            }
            return value;
        }
        return null;
    } catch (e) {
        console.error('GeoLoc Error:', e);
        return null;
    }
}

function getChunks(journey = [], events = []) {
    return {
        journeyChunk: Array.isArray(journey) ? journey.slice(-MAX_JOURNEY_CHUNK) : [],
        eventChunk: Array.isArray(events) ? events.slice(-MAX_EVENT_CHUNK) : []
    };
}

function fallbackSessionMeta(sessionId, fallbackMeta = {}) {
    return {
        sessionId,
        userId: fallbackMeta.userId || null,
        visitorKey: fallbackMeta.visitorKey || null,
        lastJourneyPreview: Array.isArray(fallbackMeta.lastJourneyPreview) ? fallbackMeta.lastJourneyPreview.slice(-16) : [],
        lastEventPreview: Array.isArray(fallbackMeta.lastEventPreview) ? fallbackMeta.lastEventPreview.slice(-16) : [],
        clientManagedPreview: Boolean(fallbackMeta.clientManagedPreview)
    };
}

async function getSessionMetaForPayload(sessionId, fallbackMeta, journeyChunk, eventChunk) {
    if (journeyChunk.length === 0 && eventChunk.length === 0) {
        return fallbackSessionMeta(sessionId, fallbackMeta);
    }

    const hasClientPreview = Array.isArray(fallbackMeta.lastJourneyPreview) || Array.isArray(fallbackMeta.lastEventPreview);
    if (fallbackMeta.visitorKey && hasClientPreview) {
        return fallbackSessionMeta(sessionId, {
            ...fallbackMeta,
            clientManagedPreview: true
        });
    }

    return getSessionMeta(sessionId, fallbackMeta);
}

async function persistSessionChunks({ sessionId, sessionMeta, journey = [], events = [], duration, pageViews, sessionActive, presenceOnly = false }) {
    const sessionRef = db.collection('analytics_sessions').doc(sessionId);
    const batch = db.batch();

    const { journeyChunk, eventChunk } = getChunks(journey, events);

    for (const step of journeyChunk) {
        const normalized = normalizeJourneyStep(step, sessionMeta);
        const docId = computeChunkDocId('journey', normalized);
        batch.set(sessionRef.collection('journey_steps').doc(docId), normalized, { merge: true });
    }

    for (const event of eventChunk) {
        const normalized = normalizeCustomEvent(event, sessionMeta);
        const docId = computeChunkDocId('event', normalized);
        batch.set(sessionRef.collection('custom_events').doc(docId), normalized, { merge: true });
    }

    const rootUpdates = {
        lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
        duration: Number(duration) || 0,
        sessionActive: sessionActive !== undefined ? sessionActive : true,
        expireAt: timestampFromNow(ANALYTICS_SESSION_RETENTION_DAYS)
    };

    if (presenceOnly) {
        rootUpdates.lastPresenceHeartbeatAt = admin.firestore.FieldValue.serverTimestamp();
    }

    if (typeof pageViews === 'number') {
        rootUpdates.pageViews = pageViews;
    }

    if (journeyChunk.length > 0) {
        const lastStep = normalizeJourneyStep(journeyChunk[journeyChunk.length - 1], sessionMeta);
        const previousPreview = Array.isArray(sessionMeta.lastJourneyPreview) ? sessionMeta.lastJourneyPreview : [];
        const nextPreview = sessionMeta.clientManagedPreview
            ? previousPreview.slice(-16)
            : [...previousPreview, ...journeyChunk].slice(-16);
        rootUpdates.lastStep = {
            pageKey: lastStep.pageKey,
            pageLabel: lastStep.pageLabel || lastStep.pageKey || 'unknown',
            itemId: lastStep.itemId || null,
            timestamp: lastStep.timestamp,
            context: lastStep.context || {}
        };
        rootUpdates.lastJourneyPreview = nextPreview;
    }

    if (eventChunk.length > 0) {
        const previousEventPreview = Array.isArray(sessionMeta.lastEventPreview) ? sessionMeta.lastEventPreview : [];
        const nextEventPreview = sessionMeta.clientManagedPreview
            ? previousEventPreview.slice(-16)
            : [...previousEventPreview, ...eventChunk].slice(-16);
        const lastEvent = normalizeCustomEvent(eventChunk[eventChunk.length - 1], sessionMeta);
        rootUpdates.lastEvent = {
            action: lastEvent.action || 'unknown',
            itemId: lastEvent.itemId || null,
            itemName: lastEvent.itemName || null,
            timestamp: lastEvent.timestamp
        };
        rootUpdates.lastEventPreview = nextEventPreview;
        rootUpdates.lastEventAt = admin.firestore.FieldValue.serverTimestamp();
    }

    batch.set(sessionRef, rootUpdates, { merge: true });
    await batch.commit();
}

async function getSessionMeta(sessionId, fallbackMeta = {}) {
    const sessionSnap = await db.collection('analytics_sessions').doc(sessionId).get();
    const sessionData = sessionSnap.exists ? sessionSnap.data() : {};

    return {
        sessionId,
        userId: fallbackMeta.userId || sessionData.userId || null,
        visitorKey: fallbackMeta.visitorKey || sessionData.visitorKey || null,
        lastJourneyPreview: sessionData.lastJourneyPreview || [],
        lastEventPreview: sessionData.lastEventPreview || []
    };
}

async function deleteSessionRecursively(sessionId) {
    const sessionRef = db.collection('analytics_sessions').doc(sessionId);
    await db.recursiveDelete(sessionRef);
}

exports.initLiveSession = functions.https.onCall(async (data, context) => {
    const rawIp = context.rawRequest.headers['x-forwarded-for'] || context.rawRequest.connection.remoteAddress;
    const ip = rawIp ? rawIp.split(',')[0].trim() : 'Unknown';
    const userAgent = context.rawRequest.headers['user-agent'] || 'Unknown';
    const { userId, email, type, device, browser, os, entryPageKey } = data;

    const geo = await getGeoFromIp(ip);
    const isFromAdminIP = await isAdminIP(ip);
    const sessionType = (type === 'admin' || isFromAdminIP) ? 'admin' : (type || 'anonymous');
    const visitorKey = computeVisitorKey(ip, userAgent);

    const sessionData = {
        schemaVersion: 2,
        userId: userId || 'unknown',
        email: email || null,
        type: sessionType,
        ip,
        visitorKey,
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
        duration: 0,
        pageViews: 0,
        entryPageKey: entryPageKey || 'unknown',
        device: device || 'Unknown',
        browser: browser || 'Unknown',
        os: os || 'Unknown',
        userAgent,
        geo: geo || { country: 'Unknown', city: 'Unknown', region: 'Unknown' },
        journey: [],
        events: [],
        lastJourneyPreview: [],
        lastEventPreview: [],
        sessionActive: true,
        adminIPDetected: isFromAdminIP && type !== 'admin',
        expireAt: timestampFromNow(ANALYTICS_SESSION_RETENTION_DAYS)
    };

    try {
        const sessionRef = await db.collection('analytics_sessions').add(sessionData);
        return { success: true, sessionId: sessionRef.id, visitorKey };
    } catch (error) {
        console.error('Init Error:', error);
        throw new functions.https.HttpsError('internal', 'Init failed');
    }
});

exports.syncSession = functions.https.onCall(async (data) => {
    const {
        sessionId,
        journey,
        events,
        duration,
        pageViews,
        sessionActive,
        userId,
        visitorKey,
        presenceOnly,
        lastJourneyPreview,
        lastEventPreview
    } = data;
    if (!sessionId) return { success: false };

    try {
        const { journeyChunk, eventChunk } = getChunks(journey, events);
        const hasData = journeyChunk.length > 0 || eventChunk.length > 0;

        if (!hasData && sessionActive !== false && !presenceOnly) {
            return { success: true, skipped: true };
        }

        const sessionMeta = await getSessionMetaForPayload(
            sessionId,
            { userId, visitorKey, lastJourneyPreview, lastEventPreview },
            journeyChunk,
            eventChunk
        );
        await persistSessionChunks({
            sessionId,
            sessionMeta,
            journey: journeyChunk,
            events: eventChunk,
            duration,
            pageViews,
            sessionActive,
            presenceOnly: Boolean(presenceOnly)
        });
        return { success: true };
    } catch (error) {
        console.error('Sync Error:', error);
        return { success: false };
    }
});

exports.syncSessionBeacon = functions.https.onRequest(async (req, res) => {
    const allowedOrigins = [
        ...String(process.env.PUBLIC_ALLOWED_ORIGINS || '')
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean),
        'http://localhost:5173',
        'http://localhost:3000'
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
    } else if (origin) {
        res.status(403).send('Forbidden origin');
        return;
    } else {
        res.set('Access-Control-Allow-Origin', allowedOrigins[0]);
    }
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        let payload;
        if (typeof req.body === 'string') {
            payload = JSON.parse(req.body);
        } else if (req.rawBody) {
            payload = JSON.parse(req.rawBody.toString());
        } else {
            payload = req.body;
        }

        const rawIp = req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
        const ip = rawIp ? rawIp.split(',')[0].trim() : 'Unknown';
        const userAgent = req.headers['user-agent'] || 'Unknown';

        const {
            sessionId,
            journey,
            events,
            duration,
            pageViews,
            sessionActive,
            presenceOnly
        } = payload;

        if (!sessionId) {
            res.status(400).send('Missing session ID');
            return;
        }

        const { journeyChunk, eventChunk } = getChunks(journey, events);
        const sessionMeta = await getSessionMetaForPayload(
            sessionId,
            {
                userId: payload.userId || null,
                visitorKey: payload.visitorKey || computeVisitorKey(ip, userAgent),
                lastJourneyPreview: payload.lastJourneyPreview,
                lastEventPreview: payload.lastEventPreview
            },
            journeyChunk,
            eventChunk
        );

        await persistSessionChunks({
            sessionId,
            sessionMeta,
            journey: journeyChunk,
            events: eventChunk,
            duration,
            pageViews,
            sessionActive,
            presenceOnly: Boolean(presenceOnly)
        });

        res.status(200).send('Session synced via beacon');
    } catch (error) {
        console.error('Beacon Sync Error:', error);
        res.status(500).send('Beacon sync failed');
    }
});

exports.deleteSession = functions.https.onCall(async (data, context) => {
    if (!context.auth || (!context.auth.token.admin && !context.auth.token.superAdmin && context.auth.token.email !== require('../../helpers/security').SUPER_ADMIN_EMAIL)) {
        throw new functions.https.HttpsError('permission-denied', 'Admin only');
    }
    const { sessionId } = data;
    if (!sessionId) throw new functions.https.HttpsError('invalid-argument', 'Missing sessionId');
    await deleteSessionRecursively(sessionId);
    return { success: true };
});

exports.clearAllSessions = functions.https.onCall(async (data, context) => {
    if (!context.auth || (!context.auth.token.admin && !context.auth.token.superAdmin && context.auth.token.email !== require('../../helpers/security').SUPER_ADMIN_EMAIL)) {
        throw new functions.https.HttpsError('permission-denied', 'Admin only');
    }

    try {
        const sessionsRef = db.collection('analytics_sessions');
        let totalDeleted = 0;

        while (true) {
            const snapshot = await sessionsRef.limit(50).get();
            if (snapshot.empty) break;

            for (const sessionDoc of snapshot.docs) {
                await deleteSessionRecursively(sessionDoc.id);
                totalDeleted += 1;
            }

            if (snapshot.size < 50) break;
        }

        return { success: true, count: totalDeleted };
    } catch (error) {
        console.error('Clear All Error:', error);
        throw new functions.https.HttpsError('internal', 'Clear failed');
    }
});

exports.clearAllAnalytics = exports.clearAllSessions;

exports.cleanupExpiredAnalytics = functions.pubsub.schedule('every 24 hours').onRun(async () => {
    const now = admin.firestore.Timestamp.now();

    async function purgeFlatCollection(path, batchSize = 200) {
        while (true) {
            const snapshot = await db.collection(path)
                .where('expireAt', '<=', now)
                .limit(batchSize)
                .get();

            if (snapshot.empty) break;

            const batch = db.batch();
            snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
            await batch.commit();

            if (snapshot.size < batchSize) break;
        }
    }

    async function purgeCollectionGroup(collectionId, batchSize = 200) {
        while (true) {
            const snapshot = await db.collectionGroup(collectionId)
                .where('expireAt', '<=', now)
                .limit(batchSize)
                .get();

            if (snapshot.empty) break;

            const batch = db.batch();
            snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
            await batch.commit();

            if (snapshot.size < batchSize) break;
        }
    }

    while (true) {
        const expiredSessions = await db.collection('analytics_sessions')
            .where('expireAt', '<=', now)
            .limit(25)
            .get();

        if (expiredSessions.empty) break;

        for (const sessionDoc of expiredSessions.docs) {
            await deleteSessionRecursively(sessionDoc.id);
        }

        if (expiredSessions.size < 25) break;
    }

    await purgeFlatCollection('analytics_item_daily');
    await purgeFlatCollection('analytics_page_daily');
    await purgeFlatCollection('analytics_transition_daily');
    await purgeFlatCollection('analytics_unique_markers');
    await purgeFlatCollection('sales_stats_daily');
    await purgeFlatCollection('sys_ratelimit');
    await purgeFlatCollection('sys_idempotency');
    await purgeCollectionGroup('journey_steps');
    await purgeCollectionGroup('custom_events');

    return null;
});
