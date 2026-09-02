'use strict';

const crypto = require('node:crypto');
const zlib = require('node:zlib');
const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { onCall } = require('firebase-functions/v2/https');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const {
    checkActiveStrongAdmin,
    writeSecurityAudit
} = require('../../helpers/security');
const { hashOpaque, runObserved, structuredLog } = require('../../helpers/observability');

const REGION = 'europe-west1';
const ANALYTICS_RUNTIME_SERVICE_ACCOUNT = 'analytics-runtime@secondevienextjsssr.iam.gserviceaccount.com';
const RUNTIME = Object.freeze({
    region: REGION,
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '512MiB',
    timeoutSeconds: 120,
    serviceAccount: ANALYTICS_RUNTIME_SERVICE_ACCOUNT
});
const SCHEDULE_RUNTIME = Object.freeze({
    region: REGION,
    schedule: 'every 15 minutes',
    timeZone: 'Europe/Paris',
    retryCount: 0,
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    memory: '512MiB',
    timeoutSeconds: 540,
    maxInstances: 1,
    serviceAccount: ANALYTICS_RUNTIME_SERVICE_ACCOUNT
});
const SHARD_COUNT = 8;
const HLL_PRECISION = 10;
const HLL_SIZE = 1 << HLL_PRECISION;
const FACT_RETENTION_DAYS = 120;
const SHARD_RETENTION_DAYS = 400;
const ARCHIVE_AFTER_DAYS = 75;
const ARCHIVE_PAGE_SIZE = 500;
const MAX_ARCHIVE_PARTS = 100;
const MAX_ADMIN_PAGE_SIZE = 250;
const MAX_ADMIN_HISTORY_YEARS = 50;
const DAY_MS = 24 * 60 * 60 * 1000;
const ALLOWED_PAGES = new Set([
    'home', 'gallery', 'category', 'detail', 'search', 'about', 'quote',
    'wishlist', 'cart', 'checkout', 'orders', 'shop', 'shop-detail',
    'comptoir', 'delivery', 'unknown'
]);
const ALLOWED_ACTIONS = new Set([
    'favorite_add', 'favorite_remove', 'cart_add', 'cart_remove', 'cart_open',
    'quote_start', 'quote_submitted', 'quote_email_opened', 'checkout_start',
    'affiliate_click', 'unknown'
]);

function requestError(code, message) {
    return new functions.https.HttpsError(code, message);
}

function toMillis(value) {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number') return value;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function timestampAfterDays(days, now = Date.now()) {
    return admin.firestore.Timestamp.fromMillis(now + (days * DAY_MS));
}

function dateKey(value) {
    return new Date(value).toISOString().slice(0, 10);
}

function monthKey(value) {
    return dateKey(value).slice(0, 7);
}

function yearKey(value) {
    return dateKey(value).slice(0, 4);
}

function utcDayBounds(key) {
    const start = Date.parse(`${key}T00:00:00.000Z`);
    if (!Number.isFinite(start) || dateKey(start) !== key) throw new Error('ANALYTICS_DATE_KEY_INVALID');
    return { start, end: start + DAY_MS };
}

function normalizeCounterKey(value, allowed, fallback = 'unknown') {
    const raw = String(value || '').trim().toLowerCase();
    if (raw.startsWith('affiliate_')) return 'affiliate_click';
    const safe = raw.replace(/[^a-z0-9_-]/g, '_').slice(0, 48);
    return allowed.has(safe) ? safe : fallback;
}

function normalizeCountMap(value, allowed) {
    const result = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
    for (const [rawKey, rawCount] of Object.entries(value).slice(0, 64)) {
        const key = normalizeCounterKey(rawKey, allowed);
        const count = Math.max(0, Math.min(100000, Math.round(Number(rawCount) || 0)));
        if (count) result[key] = (result[key] || 0) + count;
    }
    return result;
}

function emptyHll() {
    return Buffer.alloc(HLL_SIZE);
}

function decodeHll(value) {
    if (typeof value !== 'string' || !value) return emptyHll();
    try {
        const decoded = Buffer.from(value, 'base64');
        return decoded.length === HLL_SIZE ? Buffer.from(decoded) : emptyHll();
    } catch {
        return emptyHll();
    }
}

function encodeHll(registers) {
    return Buffer.from(registers).toString('base64');
}

function hllRank(digest) {
    let rank = 1;
    for (let index = 2; index < digest.length; index += 1) {
        const byte = digest[index];
        if (byte === 0) {
            rank += 8;
            continue;
        }
        rank += Math.clz32(byte) - 24;
        break;
    }
    return Math.min(63, rank);
}

function addHll(value, subject) {
    const registers = decodeHll(value);
    if (!subject) return encodeHll(registers);
    const digest = crypto.createHash('sha256').update(String(subject)).digest();
    const index = digest.readUInt16BE(0) & (HLL_SIZE - 1);
    registers[index] = Math.max(registers[index], hllRank(digest));
    return encodeHll(registers);
}

function mergeHll(values) {
    const result = emptyHll();
    for (const value of values || []) {
        const registers = decodeHll(value);
        for (let index = 0; index < HLL_SIZE; index += 1) {
            if (registers[index] > result[index]) result[index] = registers[index];
        }
    }
    return encodeHll(result);
}

function estimateHll(value) {
    const registers = decodeHll(value);
    const m = registers.length;
    const alpha = 0.7213 / (1 + (1.079 / m));
    let inverseSum = 0;
    let zeroes = 0;
    for (const register of registers) {
        inverseSum += 2 ** (-register);
        if (register === 0) zeroes += 1;
    }
    let estimate = alpha * m * m / inverseSum;
    if (estimate <= (2.5 * m) && zeroes > 0) estimate = m * Math.log(m / zeroes);
    return Math.max(0, Math.round(estimate));
}

function mergeNumberMaps(target, source) {
    for (const [key, value] of Object.entries(source || {})) {
        const number = Number(value) || 0;
        if (number) target[key] = (target[key] || 0) + number;
    }
    return target;
}

function diffNumberMaps(next = {}, previous = {}) {
    const result = {};
    for (const key of new Set([...Object.keys(next), ...Object.keys(previous)])) {
        const delta = (Number(next[key]) || 0) - (Number(previous[key]) || 0);
        if (delta) result[key] = delta;
    }
    return result;
}

function applyNumberMapDelta(current = {}, delta = {}) {
    const result = { ...current };
    for (const [key, value] of Object.entries(delta)) {
        const next = Math.max(0, (Number(result[key]) || 0) + (Number(value) || 0));
        if (next) result[key] = next;
        else delete result[key];
    }
    return result;
}

function normalizeProductId(value) {
    const id = String(value || '').trim();
    return id && id.length <= 160 && /^[A-Za-z0-9_-]+$/.test(id) ? id : null;
}

function contributionFor(sessionId, session) {
    const startedAt = toMillis(session.startedAt) || toMillis(session.lastActivityAt) || Date.now();
    const duration = Math.max(0, Math.min(86400, Math.round(Number(session.duration) || 0)));
    const journey = Array.isArray(session.journey) ? session.journey : [];
    const journeyCount = Math.max(journey.length, Math.round(Number(session.journeyCount) || 0));
    const pageCounts = normalizeCountMap(session.pageCounts, ALLOWED_PAGES);
    if (Object.keys(pageCounts).length === 0) {
        for (const step of journey) {
            const key = normalizeCounterKey(step?.page, ALLOWED_PAGES);
            pageCounts[key] = (pageCounts[key] || 0) + 1;
        }
    }
    const actionCounts = normalizeCountMap(session.actionCounts, ALLOWED_ACTIONS);
    if (Object.keys(actionCounts).length === 0) {
        for (const event of Array.isArray(session.lastEventPreview) ? session.lastEventPreview : []) {
            const key = normalizeCounterKey(event?.action, ALLOWED_ACTIONS);
            actionCounts[key] = (actionCounts[key] || 0) + 1;
        }
    }
    const quoteSessions = {
        visits: Number((pageCounts.quote || 0) > 0),
        starts: Number((actionCounts.quote_start || 0) > 0),
        submitted: Number((actionCounts.quote_submitted || 0) > 0)
    };
    const productViews = {};
    for (const step of journey) {
        if (step?.page !== 'detail') continue;
        const productId = normalizeProductId(step.itemId);
        if (!productId) continue;
        productViews[productId] = (productViews[productId] || 0) + 1;
    }
    const productViewSessions = Object.fromEntries(
        Object.keys(productViews).map((productId) => [productId, 1])
    );
    const identitySource = String(session.visitorIdentity?.source || (session.userId ? 'auth_uid' : 'session')).slice(0, 40);
    const subject = hashOpaque(session.userId || sessionId);
    return {
        dateKey: dateKey(startedAt),
        hourKey: new Date(startedAt).toISOString().slice(11, 13),
        subject,
        sessions: 1,
        duration,
        bounces: journeyCount <= 1 || duration < 10 ? 1 : 0,
        mobile: session.device === 'Mobile' ? 1 : 0,
        journeySteps: journeyCount,
        pageCounts,
        actionCounts,
        quoteSessions,
        productViews,
        productViewSessions,
        identitySources: { [identitySource]: 1 }
    };
}

function contributionHash(value) {
    return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function numericDelta(next, previous) {
    return {
        sessions: next.sessions - (previous?.sessions || 0),
        duration: next.duration - (previous?.duration || 0),
        bounces: next.bounces - (previous?.bounces || 0),
        mobile: next.mobile - (previous?.mobile || 0),
        journeySteps: next.journeySteps - (previous?.journeySteps || 0)
    };
}

function applyContributionDelta(shard, next, previous) {
    const delta = numericDelta(next, previous);
    const result = {
        schemaVersion: 1,
        dateKey: next.dateKey,
        shardId: shard.shardId,
        sessions: Math.max(0, (Number(shard.sessions) || 0) + delta.sessions),
        duration: Math.max(0, (Number(shard.duration) || 0) + delta.duration),
        bounces: Math.max(0, (Number(shard.bounces) || 0) + delta.bounces),
        mobile: Math.max(0, (Number(shard.mobile) || 0) + delta.mobile),
        journeySteps: Math.max(0, (Number(shard.journeySteps) || 0) + delta.journeySteps),
        pageCounts: applyNumberMapDelta(shard.pageCounts, diffNumberMaps(next.pageCounts, previous?.pageCounts)),
        actionCounts: applyNumberMapDelta(shard.actionCounts, diffNumberMaps(next.actionCounts, previous?.actionCounts)),
        quoteSessions: applyNumberMapDelta(shard.quoteSessions, diffNumberMaps(next.quoteSessions, previous?.quoteSessions)),
        productViews: applyNumberMapDelta(shard.productViews, diffNumberMaps(next.productViews, previous?.productViews)),
        productViewSessions: applyNumberMapDelta(shard.productViewSessions, diffNumberMaps(next.productViewSessions, previous?.productViewSessions)),
        identitySources: applyNumberMapDelta(shard.identitySources, diffNumberMaps(next.identitySources, previous?.identitySources)),
        uniqueHll: addHll(shard.uniqueHll, next.subject),
        hours: { ...(shard.hours || {}) }
    };
    if (previous?.hourKey && previous.hourKey !== next.hourKey) {
        const oldHour = result.hours[previous.hourKey] || {};
        result.hours[previous.hourKey] = {
            sessions: Math.max(0, (Number(oldHour.sessions) || 0) - (previous.sessions || 0)),
            duration: Math.max(0, (Number(oldHour.duration) || 0) - (previous.duration || 0)),
            bounces: Math.max(0, (Number(oldHour.bounces) || 0) - (previous.bounces || 0)),
            mobile: Math.max(0, (Number(oldHour.mobile) || 0) - (previous.mobile || 0)),
            uniqueHll: oldHour.uniqueHll || encodeHll(emptyHll())
        };
    }
    const hour = result.hours[next.hourKey] || {};
    const previousSameHour = previous?.hourKey === next.hourKey ? previous : null;
    const hourDelta = numericDelta(next, previousSameHour);
    result.hours[next.hourKey] = {
        sessions: Math.max(0, (Number(hour.sessions) || 0) + hourDelta.sessions),
        duration: Math.max(0, (Number(hour.duration) || 0) + hourDelta.duration),
        bounces: Math.max(0, (Number(hour.bounces) || 0) + hourDelta.bounces),
        mobile: Math.max(0, (Number(hour.mobile) || 0) + hourDelta.mobile),
        uniqueHll: addHll(hour.uniqueHll, next.subject)
    };
    return result;
}

async function materializeSessionFact(sessionId, session, db = admin.firestore()) {
    if (!session || session.type === 'admin') return 'ignored';
    const contribution = contributionFor(sessionId, session);
    const hash = contributionHash(contribution);
    const shardId = String(parseInt(hashOpaque(sessionId).slice(0, 8), 16) % SHARD_COUNT).padStart(2, '0');
    const factRef = db.doc(`analytics_session_facts/${sessionId}`);
    const shardRef = db.doc(`analytics_rollup_days/${contribution.dateKey}/summary_shards/${shardId}`);
    return db.runTransaction(async (transaction) => {
        const [factSnap, shardSnap] = await Promise.all([
            transaction.get(factRef),
            transaction.get(shardRef)
        ]);
        const previousFact = factSnap.exists ? factSnap.data() : null;
        if (previousFact?.contributionHash === hash) return 'noop';
        if (previousFact?.contribution?.dateKey && previousFact.contribution.dateKey !== contribution.dateKey) {
            throw new Error('ANALYTICS_SESSION_DATE_CHANGED');
        }
        const nextShard = applyContributionDelta(
            { shardId, ...(shardSnap.exists ? shardSnap.data() : {}) },
            contribution,
            previousFact?.contribution || null
        );
        transaction.set(shardRef, {
            ...nextShard,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            expireAt: timestampAfterDays(SHARD_RETENTION_DAYS)
        });
        transaction.set(factRef, {
            schemaVersion: 1,
            sessionIdHash: hashOpaque(sessionId),
            contribution,
            contributionHash: hash,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            expireAt: timestampAfterDays(FACT_RETENTION_DAYS)
        });
        return previousFact ? 'updated' : 'created';
    });
}

function emptyAggregate() {
    return {
        sessions: 0,
        duration: 0,
        bounces: 0,
        mobile: 0,
        journeySteps: 0,
        pageCounts: {},
        actionCounts: {},
        quoteSessions: {},
        productViews: {},
        productViewSessions: {},
        identitySources: {},
        hours: {},
        uniqueHllValues: []
    };
}

function mergeAggregate(target, source) {
    for (const key of ['sessions', 'duration', 'bounces', 'mobile', 'journeySteps']) {
        target[key] += Number(source?.[key]) || 0;
    }
    mergeNumberMaps(target.pageCounts, source?.pageCounts);
    mergeNumberMaps(target.actionCounts, source?.actionCounts);
    mergeNumberMaps(target.quoteSessions, source?.quoteSessions);
    mergeNumberMaps(target.productViews, source?.productViews);
    mergeNumberMaps(target.productViewSessions, source?.productViewSessions);
    mergeNumberMaps(target.identitySources, source?.identitySources);
    if (source?.uniqueHll) target.uniqueHllValues.push(source.uniqueHll);
    for (const [hourKey, hour] of Object.entries(source?.hours || {})) {
        const current = target.hours[hourKey] || { sessions: 0, duration: 0, bounces: 0, mobile: 0, uniqueHllValues: [] };
        for (const key of ['sessions', 'duration', 'bounces', 'mobile']) current[key] += Number(hour?.[key]) || 0;
        if (hour?.uniqueHll) current.uniqueHllValues.push(hour.uniqueHll);
        target.hours[hourKey] = current;
    }
    return target;
}

function finalizeAggregate(value) {
    const uniqueHll = mergeHll(value.uniqueHllValues);
    const hours = {};
    for (const [key, hour] of Object.entries(value.hours || {})) {
        const hourHll = mergeHll(hour.uniqueHllValues);
        hours[key] = {
            sessions: hour.sessions,
            duration: hour.duration,
            bounces: hour.bounces,
            mobile: hour.mobile,
            uniqueHll: hourHll,
            uniqueVisitorsApprox: estimateHll(hourHll)
        };
    }
    return {
        sessions: value.sessions,
        duration: value.duration,
        bounces: value.bounces,
        mobile: value.mobile,
        journeySteps: value.journeySteps,
        pageCounts: value.pageCounts,
        actionCounts: value.actionCounts,
        quoteSessions: value.quoteSessions,
        productViews: value.productViews,
        productViewSessions: value.productViewSessions,
        identitySources: value.identitySources,
        hours,
        uniqueHll,
        uniqueVisitorsApprox: estimateHll(uniqueHll),
        uniqueVisitorsEstimated: true
    };
}

async function compactDay(key, db = admin.firestore()) {
    const shards = await db.collection(`analytics_rollup_days/${key}/summary_shards`).limit(SHARD_COUNT).get();
    const aggregate = emptyAggregate();
    for (const shard of shards.docs) mergeAggregate(aggregate, shard.data());
    const compact = finalizeAggregate(aggregate);
    const ref = db.doc(`analytics_rollup_days/${key}`);
    const current = await ref.get();
    const stableContent = {
        schemaVersion: 1,
        dateKey: key,
        ...compact,
        sourceShards: shards.size,
        provisional: key >= dateKey(Date.now() - DAY_MS)
    };
    const currentContent = current.exists ? current.data() : null;
    const unchanged = currentContent && contributionHash(stableContent) === contributionHash({
        ...stableContent,
        ...Object.fromEntries(Object.keys(stableContent).map((field) => [field, currentContent[field]]))
    });
    if (!unchanged) await ref.set({
        ...stableContent,
        compactedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { ...compact, changed: !unchanged };
}

const INSIGHT_QUOTE_PERIODS = Object.freeze({
    '30d': { months: 0, label: '30 jours' },
    '3m': { months: 3, label: '3 mois' },
    '6m': { months: 6, label: '6 mois' },
    '1y': { months: 12, label: '1 an' }
});

function emptyQuote() {
    return { visits: 0, starts: 0, submitted: 0 };
}

function sumQuote(rollups) {
    const quote = emptyQuote();
    for (const data of rollups) {
        for (const key of Object.keys(quote)) {
            quote[key] += Math.max(0, Number(data?.quoteSessions?.[key] || 0));
        }
    }
    return quote;
}

function buildDashboardInsightsContent(dailyRollups, monthlyRollups) {
    const days = dailyRollups.filter(Boolean).sort((a, b) => String(a.dateKey).localeCompare(String(b.dateKey)));
    const months = monthlyRollups.filter(Boolean).sort((a, b) => String(b.monthKey).localeCompare(String(a.monthKey)));
    const quoteWindows = {
        '30d': sumQuote(days),
        '3m': sumQuote(months.slice(0, 3)),
        '6m': sumQuote(months.slice(0, 6)),
        '1y': sumQuote(months.slice(0, 12))
    };
    const productIds = new Set(days.flatMap((day) => Object.keys(day.productViews || {})));
    const products = Array.from(productIds, (id) => {
        const dailyViews = days.map((day) => Math.max(0, Number(day.productViews?.[id] || 0)));
        return {
            id,
            name: id,
            views: dailyViews.reduce((sum, value) => sum + value, 0),
            viewers: days.reduce((sum, day) => sum + Math.max(0, Number(day.productViewSessions?.[id] || 0)), 0),
            dailyViews
        };
    }).filter((product) => product.views > 0)
        .sort((a, b) => b.views - a.views || b.viewers - a.viewers || a.id.localeCompare(b.id))
        .slice(0, 5);
    return {
        quoteWindows,
        products,
        productViewCount: products.reduce((sum, product) => sum + product.views, 0),
        productViewingSessions: products.reduce((sum, product) => sum + product.viewers, 0)
    };
}

async function materializeDashboardInsights(db = admin.firestore(), nowMillis = Date.now()) {
    const dayKeys = Array.from({ length: 30 }, (_, index) => dateKey(nowMillis - ((29 - index) * DAY_MS)));
    const monthKeys = Array.from({ length: 12 }, (_, offset) => {
        const value = new Date(Date.UTC(new Date(nowMillis).getUTCFullYear(), new Date(nowMillis).getUTCMonth() - offset, 1));
        return monthKey(value.getTime());
    });
    const [daySnapshots, monthSnapshots] = await Promise.all([
        getAllRefs(db, dayKeys.map((key) => db.doc(`analytics_rollup_days/${key}`))),
        getAllRefs(db, monthKeys.map((key) => db.doc(`analytics_rollup_months/${key}`)))
    ]);
    const dailyRollups = daySnapshots.filter((snapshot) => snapshot.exists).map((snapshot) => snapshot.data());
    const monthlyRollups = monthSnapshots.filter((snapshot) => snapshot.exists).map((snapshot) => snapshot.data());
    const content = buildDashboardInsightsContent(dailyRollups, monthlyRollups);
    const source = {
        days: dailyRollups.map((data) => ({
            dateKey: data.dateKey,
            quoteSessions: data.quoteSessions || {},
            productViews: data.productViews || {},
            productViewSessions: data.productViewSessions || {}
        })),
        months: monthlyRollups.map((data) => ({ monthKey: data.monthKey, quoteSessions: data.quoteSessions || {} }))
    };
    const sourceDigest = contributionHash(source);
    const ref = db.doc('admin_dashboard/insights');
    const current = await ref.get();
    if (current.exists && current.data()?.sourceDigest === sourceDigest) {
        return { changed: false, sourceDays: dailyRollups.length, sourceMonths: monthlyRollups.length };
    }
    await ref.set({
        schemaVersion: 2,
        windowDays: 30,
        quote: content.quoteWindows['30d'],
        quoteWindows: content.quoteWindows,
        quotePeriods: INSIGHT_QUOTE_PERIODS,
        productsState: 'ready',
        products: content.products,
        productViewCount: content.productViewCount,
        productViewingSessions: content.productViewingSessions,
        coverageThrough: admin.firestore.Timestamp.fromMillis(nowMillis),
        source: 'analytics_rollups',
        sourceDigest,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        revision: Math.max(0, Number(current.data()?.revision || 0)) + 1
    });
    return { changed: true, sourceDays: dailyRollups.length, sourceMonths: monthlyRollups.length };
}

function keysInMonth(key) {
    const start = Date.parse(`${key}-01T00:00:00.000Z`);
    const next = new Date(start);
    next.setUTCMonth(next.getUTCMonth() + 1);
    const result = [];
    for (let cursor = start; cursor < next.getTime(); cursor += DAY_MS) result.push(dateKey(cursor));
    return result;
}

async function getAllRefs(db, refs) {
    return refs.length ? db.getAll(...refs) : [];
}

async function compactMonth(key, db = admin.firestore()) {
    const refs = keysInMonth(key).map((day) => db.doc(`analytics_rollup_days/${day}`));
    const snapshots = await getAllRefs(db, refs);
    const aggregate = emptyAggregate();
    for (const snapshot of snapshots) if (snapshot.exists) mergeAggregate(aggregate, snapshot.data());
    const compact = finalizeAggregate(aggregate);
    await db.doc(`analytics_rollup_months/${key}`).set({
        schemaVersion: 1,
        monthKey: key,
        ...compact,
        hours: {},
        sourceDays: snapshots.filter((snapshot) => snapshot.exists).length,
        provisional: key === monthKey(Date.now()),
        compactedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return compact;
}

async function compactYear(key, db = admin.firestore()) {
    const refs = Array.from({ length: 12 }, (_, month) => (
        db.doc(`analytics_rollup_months/${key}-${String(month + 1).padStart(2, '0')}`)
    ));
    const snapshots = await getAllRefs(db, refs);
    const aggregate = emptyAggregate();
    for (const snapshot of snapshots) if (snapshot.exists) mergeAggregate(aggregate, snapshot.data());
    const compact = finalizeAggregate(aggregate);
    await db.doc(`analytics_rollup_years/${key}`).set({
        schemaVersion: 1,
        yearKey: key,
        ...compact,
        hours: {},
        sourceMonths: snapshots.filter((snapshot) => snapshot.exists).length,
        provisional: key === yearKey(Date.now()),
        compactedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return compact;
}

async function finalizeInactiveSessions(db = admin.firestore()) {
    const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - (35 * 60 * 1000));
    const snapshot = await db.collection('analytics_sessions')
        .where('sessionActive', '==', true)
        .where('lastActivityAt', '<=', cutoff)
        .orderBy('lastActivityAt', 'asc')
        .limit(100)
        .get();
    if (snapshot.empty) return 0;
    const batch = db.batch();
    for (const document of snapshot.docs) {
        batch.update(document.ref, {
            sessionActive: false,
            finalizedBy: 'inactivity_scheduler',
            finalizedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    await batch.commit();
    return snapshot.size;
}

function archiveProjection(document) {
    const value = document.data() || {};
    return {
        schemaVersion: 1,
        sessionIdHash: hashOpaque(document.id),
        subjectHash: hashOpaque(value.userId || document.id),
        identitySource: value.visitorIdentity?.source || null,
        type: value.type || null,
        startedAt: toMillis(value.startedAt) ? new Date(toMillis(value.startedAt)).toISOString() : null,
        lastActivityAt: toMillis(value.lastActivityAt) ? new Date(toMillis(value.lastActivityAt)).toISOString() : null,
        duration: Math.max(0, Math.round(Number(value.duration) || 0)),
        device: String(value.device || 'Unknown').slice(0, 40),
        browser: String(value.browser || 'Unknown').slice(0, 40),
        os: String(value.os || 'Unknown').slice(0, 40),
        journeyCount: Math.max(Array.isArray(value.journey) ? value.journey.length : 0, Math.round(Number(value.journeyCount) || 0)),
        pageCounts: normalizeCountMap(value.pageCounts, ALLOWED_PAGES),
        actionCounts: normalizeCountMap(value.actionCounts, ALLOWED_ACTIONS),
        journey: (Array.isArray(value.journey) ? value.journey : []).slice(-25).map((step) => ({
            page: String(step?.page || 'unknown').slice(0, 80),
            itemId: step?.itemId ? String(step.itemId).slice(0, 255) : null,
            timestampMs: Number(step?.timestampMs) || null,
            duration: Math.max(0, Math.round(Number(step?.duration) || 0))
        })),
        lastEventPreview: (Array.isArray(value.lastEventPreview) ? value.lastEventPreview : []).slice(-16).map((event) => ({
            action: String(event?.action || 'unknown').slice(0, 80),
            itemId: event?.itemId ? String(event.itemId).slice(0, 160) : null,
            timestamp: Number(event?.timestamp) || null,
            form: event?.form ? String(event.form).slice(0, 80) : null
        }))
    };
}

function archiveBucketName() {
    const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
    return process.env.ANALYTICS_ARCHIVE_BUCKET || (projectId ? `${projectId}-analytics-archive-eu` : null);
}

async function archiveDay(key, db = admin.firestore(), storage = admin.storage()) {
    const manifestRef = db.doc(`analytics_archive_manifests/${key}`);
    const existing = await manifestRef.get();
    if (existing.exists && existing.data()?.status === 'complete') return { key, skipped: true };
    const bucketName = archiveBucketName();
    if (!bucketName) throw new Error('ANALYTICS_ARCHIVE_BUCKET_MISSING');
    const bucket = storage.bucket(bucketName);
    const { start, end } = utcDayBounds(key);
    let cursor = null;
    let total = 0;
    const parts = [];
    for (let part = 0; part < MAX_ARCHIVE_PARTS; part += 1) {
        let query = db.collection('analytics_sessions')
            .where('startedAt', '>=', admin.firestore.Timestamp.fromMillis(start))
            .where('startedAt', '<', admin.firestore.Timestamp.fromMillis(end))
            .orderBy('startedAt', 'asc')
            .limit(ARCHIVE_PAGE_SIZE);
        if (cursor) query = query.startAfter(cursor);
        const snapshot = await query.get();
        if (snapshot.empty) break;
        const records = snapshot.docs
            .filter((document) => document.data()?.type !== 'admin')
            .map(archiveProjection);
        const payload = Buffer.from(records.map((record) => JSON.stringify(record)).join('\n') + (records.length ? '\n' : ''));
        const compressed = zlib.gzipSync(payload, { level: 9 });
        const sha256 = crypto.createHash('sha256').update(compressed).digest('hex');
        const objectPath = `private/analytics-archives/v1/${key.slice(0, 4)}/${key.slice(5, 7)}/${key.slice(8, 10)}/part-${String(part + 1).padStart(4, '0')}.jsonl.gz`;
        await bucket.file(objectPath).save(compressed, {
            resumable: false,
            validation: 'crc32c',
            metadata: {
                contentType: 'application/x-ndjson',
                contentEncoding: 'gzip',
                cacheControl: 'private, no-store',
                metadata: { schemaVersion: '1', dateKey: key, sha256, recordCount: String(records.length) }
            }
        });
        parts.push({ objectPath, sha256, recordCount: records.length, compressedBytes: compressed.length });
        total += records.length;
        cursor = snapshot.docs.at(-1);
        if (snapshot.size < ARCHIVE_PAGE_SIZE) break;
        if (part === MAX_ARCHIVE_PARTS - 1) throw new Error('ANALYTICS_ARCHIVE_PART_LIMIT');
    }
    const manifestHash = crypto.createHash('sha256').update(JSON.stringify(parts)).digest('hex');
    await manifestRef.set({
        schemaVersion: 1,
        dateKey: key,
        status: 'complete',
        bucket: bucketName,
        prefix: `private/analytics-archives/v1/${key.slice(0, 4)}/${key.slice(5, 7)}/${key.slice(8, 10)}/`,
        parts,
        recordCount: total,
        manifestHash,
        containsDirectIdentifiers: false,
        completedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    structuredLog('info', 'analytics_archive_completed', { dateKey: key, recordCount: total, parts: parts.length });
    return { key, skipped: false, recordCount: total, parts: parts.length };
}

async function archiveNextEligibleDay(db = admin.firestore(), storage = admin.storage()) {
    const stateRef = db.doc('sys_analytics_maintenance/archive');
    const state = await stateRef.get();
    let key = state.exists ? String(state.data()?.nextDateKey || '') : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
        const oldest = await db.collection('analytics_sessions').orderBy('startedAt', 'asc').limit(1).get();
        if (oldest.empty) return null;
        key = dateKey(toMillis(oldest.docs[0].data().startedAt));
    }
    const cutoff = dateKey(Date.now() - (ARCHIVE_AFTER_DAYS * DAY_MS));
    if (key > cutoff) return null;
    const result = await archiveDay(key, db, storage);
    const next = dateKey(utcDayBounds(key).end);
    await stateRef.set({ nextDateKey: next, lastArchivedDateKey: key, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return result;
}

async function maintainAnalytics() {
    const db = admin.firestore();
    const today = dateKey(Date.now());
    const yesterday = dateKey(Date.now() - DAY_MS);
    const finalized = await finalizeInactiveSessions(db);
    const [todayCompaction, yesterdayCompaction] = await Promise.all([
        compactDay(today, db),
        compactDay(yesterday, db)
    ]);
    const stateRef = db.doc('sys_analytics_maintenance/compaction');
    const state = await stateRef.get();
    const dayChanged = state.data()?.lastDailyKey !== today;
    if (dayChanged) {
        const currentMonth = monthKey(Date.now());
        const previousMonth = monthKey(Date.UTC(
            new Date().getUTCFullYear(),
            new Date().getUTCMonth() - 1,
            1
        ));
        await compactMonth(currentMonth, db);
        await compactMonth(previousMonth, db);
        await compactYear(yearKey(Date.now()), db);
        if (yearKey(Date.now()) !== yearKey(Date.now() - (366 * DAY_MS))) {
            await compactYear(String(Number(yearKey(Date.now())) - 1), db);
        }
        await stateRef.set({ lastDailyKey: today, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
    const insights = (dayChanged || todayCompaction.changed || yesterdayCompaction.changed)
        ? await materializeDashboardInsights(db)
        : { changed: false, skipped: true };
    const archive = await archiveNextEligibleDay(db);
    structuredLog('info', 'analytics_maintenance_completed', {
        finalized,
        archiveDateKey: archive?.key || null,
        insightsChanged: insights.changed === true
    });
    return { finalized, archive, insights };
}

function projectionForAdmin(document) {
    const value = document.data() || {};
    const startedAt = toMillis(value.startedAt);
    const lastActivityAt = toMillis(value.lastActivityAt) || startedAt;
    return {
        id: document.id,
        visitorKey: hashOpaque(value.userId || document.id),
        identitySource: value.visitorIdentity?.source || (value.userId ? 'auth_uid' : 'session'),
        type: value.type || 'client',
        authProvider: value.authProvider || 'unknown',
        startedAt,
        lastActivityAt,
        duration: Math.max(0, Math.round(Number(value.duration) || 0)),
        device: value.device || 'Unknown',
        browser: value.browser || 'Unknown',
        os: value.os || 'Unknown',
        geo: { country: 'Unknown', city: 'Unknown', region: 'Unknown' },
        journeyCount: Math.max(Array.isArray(value.journey) ? value.journey.length : 0, Math.round(Number(value.journeyCount) || 0)),
        sessionActive: value.sessionActive === true
    };
}

function periodRefs(db, period, now = Date.now()) {
    if (period === '1ans') {
        return Array.from({ length: 12 }, (_, offset) => {
            const value = new Date(Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth() - offset, 1));
            return db.doc(`analytics_rollup_months/${monthKey(value.getTime())}`);
        });
    }
    const days = period === '7j' ? 7 : period === '1mois' ? 30 : 2;
    return Array.from({ length: days }, (_, offset) => db.doc(`analytics_rollup_days/${dateKey(now - (offset * DAY_MS))}`));
}

function chartName(key, period) {
    if (period === '1h' || period === '1j') return key.slice(11) + 'h';
    if (period === 'tout') return key.slice(0, 4);
    if (period === '1ans') return key.slice(5, 7) + '/' + key.slice(0, 4);
    return key.slice(8, 10) + '/' + key.slice(5, 7);
}

async function analyticsOverview(period, db = admin.firestore(), now = Date.now()) {
    const accepted = new Set(['1h', '1j', '7j', '1mois', '1ans', 'tout']);
    const selected = accepted.has(period) ? period : '1j';
    let snapshots;
    if (selected === 'tout') {
        snapshots = (await db.collection('analytics_rollup_years').orderBy('yearKey', 'asc').limit(MAX_ADMIN_HISTORY_YEARS).get()).docs;
    } else {
        snapshots = (await getAllRefs(db, periodRefs(db, selected, now))).filter((snapshot) => snapshot.exists);
    }
    const aggregate = emptyAggregate();
    const chart = [];
    const cutoff = selected === '1h' ? now - (60 * 60 * 1000) : selected === '1j' ? now - DAY_MS : null;
    if (selected === '1h' || selected === '1j') {
        for (const snapshot of snapshots) {
            const value = snapshot.data();
            for (const [hour, metrics] of Object.entries(value.hours || {})) {
                const timestamp = Date.parse(`${value.dateKey}T${hour}:00:00.000Z`);
                if (timestamp < cutoff || timestamp > now) continue;
                const source = {
                    sessions: metrics.sessions,
                    duration: metrics.duration,
                    bounces: metrics.bounces,
                    mobile: metrics.mobile,
                    journeySteps: 0,
                    uniqueHll: metrics.uniqueHll,
                    pageCounts: {}, actionCounts: {}, identitySources: {}, hours: {}
                };
                mergeAggregate(aggregate, source);
                chart.push({ timestamp, name: chartName(`${value.dateKey}T${hour}`, selected), sessions: Number(metrics.sessions) || 0, visites: Number(metrics.uniqueVisitorsApprox) || 0, ips: 0 });
            }
        }
    } else {
        for (const snapshot of snapshots) {
            const value = snapshot.data();
            mergeAggregate(aggregate, value);
            const key = value.dateKey || value.monthKey || value.yearKey || snapshot.id;
            const timestamp = Date.parse(key.length === 4 ? `${key}-01-01T00:00:00.000Z` : key.length === 7 ? `${key}-01T00:00:00.000Z` : `${key}T00:00:00.000Z`);
            chart.push({ timestamp, name: chartName(key.length === 4 ? `${key}-01-01` : key.length === 7 ? `${key}-01` : key, selected), sessions: Number(value.sessions) || 0, visites: Number(value.uniqueVisitorsApprox) || 0, ips: 0 });
        }
    }
    const final = finalizeAggregate(aggregate);
    const totalSessions = final.sessions;
    return {
        period: selected,
        chartData: chart.sort((left, right) => left.timestamp - right.timestamp),
        kpis: {
            totalSessions,
            uniqueVisitors: final.uniqueVisitorsApprox,
            uniqueIps: 0,
            visitorIpRatio: null,
            visitorIpRatioLabel: 'sans IP',
            visitorConfidenceScore: final.uniqueVisitorsApprox === 0 ? 100 : 90,
            visitorConfidenceLabel: 'estimation pseudonymisée',
            avgDuration: totalSessions ? Math.round(final.duration / totalSessions) : 0,
            bounceRate: totalSessions ? Math.round((final.bounces / totalSessions) * 100) : 0,
            mobilePercentage: totalSessions ? Math.round((final.mobile / totalSessions) * 100) : 0,
            ipCoverage: 0
        },
        dataQuality: {
            confidence: snapshots.length ? 'haute' : 'partielle',
            isWindowComplete: true,
            isFetchCapped: false,
            fetchedCount: snapshots.length,
            maxFetched: snapshots.length,
            coverageStartMs: chart[0]?.timestamp || null,
            missingIpSessions: totalSessions,
            identitySourceCounts: final.identitySources,
            method: 'Rollups serveur permanents et visiteurs uniques estimés par identifiants pseudonymisés.'
        },
        aggregate: {
            pageCounts: final.pageCounts,
            actionCounts: final.actionCounts,
            journeySteps: final.journeySteps,
            sourceDocuments: snapshots.length,
            uniqueVisitorsEstimated: true
        }
    };
}

async function listSessions(data, db = admin.firestore()) {
    const pageSize = Math.min(MAX_ADMIN_PAGE_SIZE, Math.max(1, Math.round(Number(data.pageSize) || MAX_ADMIN_PAGE_SIZE)));
    let query = db.collection('analytics_sessions').orderBy('lastActivityAt', 'desc').limit(pageSize);
    if (Number.isFinite(Number(data.beforeMillis))) {
        query = query.startAfter(admin.firestore.Timestamp.fromMillis(Number(data.beforeMillis)));
    } else if (Number.isFinite(Number(data.updatedAfterMillis))) {
        query = db.collection('analytics_sessions')
            .where('lastActivityAt', '>', admin.firestore.Timestamp.fromMillis(Number(data.updatedAfterMillis)))
            .orderBy('lastActivityAt', 'desc')
            .limit(pageSize);
    }
    const snapshot = await query.get();
    const sessions = snapshot.docs
        .filter((document) => document.data()?.type !== 'admin')
        .map(projectionForAdmin);
    return {
        sessions,
        nextBeforeMillis: snapshot.size === pageSize ? toMillis(snapshot.docs.at(-1)?.data()?.lastActivityAt) : null,
        newestActivityMillis: sessions.reduce((max, session) => Math.max(max, session.lastActivityAt || 0), 0),
        pageSize,
        truncated: snapshot.size === pageSize
    };
}

async function sessionDetail(data, db = admin.firestore()) {
    const sessionId = String(data.sessionId || '');
    if (!/^[A-Za-z0-9_-]{8,160}$/.test(sessionId)) throw requestError('invalid-argument', 'Session invalide.');
    const snapshot = await db.doc(`analytics_sessions/${sessionId}`).get();
    if (!snapshot.exists || snapshot.data()?.type === 'admin') throw requestError('not-found', 'Session introuvable.');
    const value = snapshot.data();
    return {
        sessionId,
        journey: (Array.isArray(value.journey) ? value.journey : []).slice(-25),
        lastEventPreview: (Array.isArray(value.lastEventPreview) ? value.lastEventPreview : []).slice(-16),
        journeyCount: Math.max(Array.isArray(value.journey) ? value.journey.length : 0, Math.round(Number(value.journeyCount) || 0))
    };
}

async function adminHandler(data, context) {
    await checkActiveStrongAdmin(context);
    const action = String(data.action || 'overview');
    let result;
    if (action === 'overview') result = await analyticsOverview(data.period);
    else if (action === 'list') result = await listSessions(data);
    else if (action === 'detail') result = await sessionDetail(data);
    else throw requestError('invalid-argument', 'Action analytics invalide.');
    await writeSecurityAudit('analytics.admin_read', context, {
        action,
        sessionIdHash: action === 'detail' ? hashOpaque(data.sessionId) : null,
        resultCount: Array.isArray(result.sessions) ? result.sessions.length : null,
        period: result.period || null
    });
    return { success: true, ...result };
}

const aggregateAnalyticsSessionGen2 = onDocumentWritten(
    { ...RUNTIME, document: 'analytics_sessions/{sessionId}', retry: true },
    async (event) => {
        const before = event.data?.before?.exists ? event.data.before.data() : null;
        const after = event.data?.after?.exists ? event.data.after.data() : null;
        if (!after || after.type === 'admin' || after.sessionActive !== false) return;
        const becameClosed = after.sessionActive === false && before?.sessionActive !== false;
        const closedChanged = after.sessionActive === false && contributionHash(contributionFor(event.params.sessionId, after)) !== contributionHash(contributionFor(event.params.sessionId, before || {}));
        if (!becameClosed && !closedChanged) return;
        await materializeSessionFact(event.params.sessionId, after);
    }
);

const maintainAnalyticsGen2 = onSchedule(SCHEDULE_RUNTIME, async () => {
    try {
        return await maintainAnalytics();
    } catch (error) {
        structuredLog('critical', 'analytics_maintenance_failed', {
            errorClass: String(error?.code || error?.name || 'unknown').slice(0, 120)
        });
        throw error;
    }
});

const getAnalyticsAdminGen2 = onCall(
    { ...RUNTIME, enforceAppCheck: true },
    (request) => runObserved('getAnalyticsAdminGen2', request, (data) => adminHandler(data, request))
);

module.exports = {
    addHll,
    aggregateAnalyticsSessionGen2,
    analyticsOverview,
    archiveDay,
    archiveNextEligibleDay,
    buildDashboardInsightsContent,
    compactDay,
    compactMonth,
    compactYear,
    contributionFor,
    estimateHll,
    finalizeInactiveSessions,
    getAnalyticsAdminGen2,
    listSessions,
    maintainAnalytics,
    maintainAnalyticsGen2,
    materializeSessionFact,
    materializeDashboardInsights,
    mergeHll,
    sessionDetail
};
