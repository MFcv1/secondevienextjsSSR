'use strict';
const admin = require('firebase-admin');
const { isDeepStrictEqual } = require('node:util');
const { hashOpaque } = require('../../helpers/observability');
const PAGES = new Set(['home', 'gallery', 'category', 'detail', 'search', 'about', 'quote', 'wishlist', 'cart', 'checkout', 'orders', 'shop', 'shop-detail', 'comptoir', 'delivery', 'unknown']);
const millis = value => typeof value?.toMillis === 'function' ? value.toMillis() : typeof value === 'number' && Number.isFinite(value) ? value : 0;
const integer = (value, max = 86400) => Math.max(0, Math.min(max, Math.round(Number(value) || 0)));
const safeId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(value) ? value : null;
const choice = (value, values, fallback) => values.includes(value) ? value : fallback;

function projectData(id, source) {
    const startedAt = millis(source.startedAt);
    const lastActivityAt = millis(source.lastActivityAt) || startedAt;
    if (!startedAt || !lastActivityAt) throw new Error('LIVE_SESSION_TIMESTAMP');
    const journey = (Array.isArray(source.journey) ? source.journey : []).slice(-25).map(step => ({
        page: PAGES.has(step?.page) ? step.page : 'unknown',
        ...(safeId(step?.itemId) ? { itemId: step.itemId } : {}),
        ...(typeof step?.time === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(step.time) ? { time: step.time } : {}),
        timestampMs: millis(step?.timestampMs),
        duration: integer(step?.duration)
    }));
    const summary = {
        schemaVersion: 1, id, visitorKey: hashOpaque(source.userId || id),
        identitySource: source.userId ? 'auth_uid' : 'session',
        type: choice(source.type, ['anonymous', 'visitor', 'client'], 'anonymous'),
        startedAt, lastActivityAt, sessionActive: source.sessionActive === true,
        duration: integer(source.duration), journeyCount: Math.max(journey.length, integer(source.journeyCount, 100000)),
        device: choice(source.device, ['Desktop', 'Mobile', 'Tablet'], 'Unknown'),
        browser: choice(source.browser, ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'Samsung'], 'Unknown'),
        os: choice(source.os, ['MacOS', 'Windows', 'Linux', 'iOS', 'Android', 'ChromeOS'], 'Unknown')
    };
    return { summary, detail: { schemaVersion: 1, id, journey, journeyCount: summary.journeyCount } };
}

// Event payload is never authoritative. Transaction conflicts retry against current
// source/exclusion: replays cannot restore a deleted or newly excluded session.
async function projectLiveSession(id, db = admin.firestore()) {
    if (!safeId(id)) throw new Error('LIVE_SESSION_ID');
    const summaryRef = db.doc(`admin_analytics_sessions/${id}`);
    const detailRef = db.doc(`admin_analytics_session_details/${id}`);
    return db.runTransaction(async tx => {
        const [source, exclusion, summary, detail] = await tx.getAll(
            db.doc(`analytics_sessions/${id}`), db.doc(`analytics_session_exclusions/${id}`), summaryRef, detailRef);
        if (!source.exists || source.data().type === 'admin' || exclusion.exists) {
            if (summary.exists) tx.delete(summaryRef);
            if (detail.exists) tx.delete(detailRef);
            return 'removed';
        }
        const next = projectData(id, source.data());
        let writes = 0;
        for (const [ref, snapshot, value] of [[summaryRef, summary, next.summary], [detailRef, detail, next.detail]]) {
            if (!isDeepStrictEqual(snapshot.data(), value)) { tx.set(ref, value); writes++; }
        }
        return writes;
    });
}
module.exports = { projectData, projectLiveSession };
