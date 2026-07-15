const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { PRIMARY_FUNCTIONS_REGION } = require('../../helpers/runtime');
const {
    addHll, buildContribution, contributionHash, diffContribution,
    estimateHll, mergeHll, shardFor
} = require('./v3Core');

const db = admin.firestore();
const ALLOWED_SHARD_COUNTS = new Set([4, 8, 16]);
const configuredShardCount = () => {
    const value = Number(process.env.ANALYTICS_V3_SHARD_COUNT || 8);
    return ALLOWED_SHARD_COUNTS.has(value) ? value : 8;
};
const SESSION_RETENTION_DAYS = 90;
const ROLLUP_RETENTION_DAYS = 396;

const timestampAfterDays = (days) => admin.firestore.Timestamp.fromMillis(Date.now() + days * 86400000);
const dayKey = (value) => new Date(value).toISOString().slice(0, 10);
const increment = (value) => admin.firestore.FieldValue.increment(value);

function applyDelta(payload, prefix, values = {}) {
    for (const [key, value] of Object.entries(values)) {
        if (value) payload[`${prefix}.${key}`] = increment(value);
    }
}

async function reconcileSession(sessionSnap) {
    const root = sessionSnap.data();
    if (root.synthetic === true) {
        await sessionSnap.ref.set({ status: 'final', aggregatedVersion: root.eventVersion, finalizedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        return 'synthetic';
    }
    const chunks = await sessionSnap.ref.collection('chunks').orderBy('firstSeq', 'asc').get();
    const events = chunks.docs.flatMap((doc) => Array.isArray(doc.data().events) ? doc.data().events : []);
    const capturedVersion = Number(root.eventVersion) || 0;
    const contribution = buildContribution(events, root);
    const hash = contributionHash(contribution);
    const factRef = db.collection('analytics_session_facts_v3').doc(sessionSnap.id);
    const date = dayKey(root.firstReceivedAt?.toMillis?.() || Date.now());
    const dayRef = db.collection('analytics_rollup_days_v3').doc(date);
    const daySnap = await dayRef.get();
    const storedShardCount = Number(daySnap.data()?.config?.shardCount);
    const shardCount = ALLOWED_SHARD_COUNTS.has(storedShardCount) ? storedShardCount : configuredShardCount();
    const shardId = String(shardFor(sessionSnap.id, shardCount)).padStart(2, '0');
    const shardRef = dayRef.collection('summary_shards').doc(shardId);

    return db.runTransaction(async (tx) => {
        const [freshRootSnap, previousFactSnap, shardSnap] = await Promise.all([tx.get(sessionSnap.ref), tx.get(factRef), tx.get(shardRef)]);
        const freshRoot = freshRootSnap.data();
        if ((Number(freshRoot.eventVersion) || 0) !== capturedVersion) return 'retry';
        if (previousFactSnap.exists && previousFactSnap.data().contributionHash === hash && Number(freshRoot.aggregatedVersion) === capturedVersion) return 'noop';
        const previous = previousFactSnap.exists ? previousFactSnap.data().contribution : {};
        const delta = diffContribution(contribution, previous);
        const shard = shardSnap.exists ? shardSnap.data() : {};
        const subjectId = freshRoot.identitySource === 'fallback_session'
            ? null
            : (freshRoot.browserSubjectId || freshRoot.audienceSubjectId || null);
        const uniqueHll = subjectId ? addHll(shard.uniqueHll, subjectId) : (shard.uniqueHll || null);
        const shardPayload = {
            schemaVersion: 3,
            dateKey: date,
            shardId,
            shardCount,
            sessions: increment(delta.sessions),
            pageViews: increment(delta.pageViews),
            events: increment(delta.events),
            activeDurationMs: increment(delta.activeDurationMs),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            expireAt: timestampAfterDays(ROLLUP_RETENTION_DAYS)
        };
        if (uniqueHll) shardPayload.uniqueHll = uniqueHll;
        applyDelta(shardPayload, 'pages', delta.pages);
        applyDelta(shardPayload, 'actions', delta.actions);
        applyDelta(shardPayload, 'transitions', delta.transitions);
        applyDelta(shardPayload, 'outcomes', delta.outcomes);
        applyDelta(shardPayload, 'identity', delta.identity);
        applyDelta(shardPayload, 'completeness', delta.completeness);
        applyDelta(shardPayload, 'integrity', delta.integrity);
        shardPayload[`modes.${contribution.mode}`] = increment(delta.sessions);

        tx.set(dayRef, {
            config: { shardCount, shardSchemaVersion: 1, timezone: 'Europe/Paris', provisional: true },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            expireAt: timestampAfterDays(ROLLUP_RETENTION_DAYS)
        }, { merge: true });
        tx.set(shardRef, shardPayload, { merge: true });
        tx.set(factRef, {
            factVersion: capturedVersion,
            dayKey: date,
            measurementMode: contribution.mode,
            contribution,
            contributionHash: hash,
            uniqueSubjectId: subjectId,
            shardCount,
            shardId,
            synthetic: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            expireAt: timestampAfterDays(SESSION_RETENTION_DAYS)
        });
        tx.update(sessionSnap.ref, {
            aggregatedVersion: capturedVersion,
            previousContributionHash: hash,
            status: 'final',
            outcome: contribution.outcome,
            finalizedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return previousFactSnap.exists ? 'reconciled' : 'finalized';
    });
}

async function finalizeInactiveSessions() {
    const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - 35 * 60 * 1000);
    const snap = await db.collection('analytics_sessions_v3')
        .where('status', 'in', ['open', 'dirty', 'provisional'])
        .where('lastReceivedAt', '<=', cutoff)
        .orderBy('lastReceivedAt', 'asc')
        .limit(100)
        .get();
    const candidates = snap.docs.filter((doc) => {
        const data = doc.data();
        return data.status !== 'final' || Number(data.aggregatedVersion || 0) !== Number(data.eventVersion || 0);
    });
    const results = { scanned: snap.size, finalized: 0, reconciled: 0, noop: 0, retry: 0, synthetic: 0 };
    for (const candidate of candidates) {
        const result = await reconcileSession(candidate);
        results[result] = (results[result] || 0) + 1;
    }
    console.log('analytics_v3_finalize', results);
}

function mergeNumberMaps(target, source) {
    for (const [key, value] of Object.entries(source || {})) target[key] = (target[key] || 0) + (Number(value) || 0);
}

async function compactDay(date) {
    const dayRef = db.collection('analytics_rollup_days_v3').doc(date);
    const shards = await dayRef.collection('summary_shards').get();
    const overview = { sessions: 0, pageViews: 0, events: 0, activeDurationMs: 0, pages: {}, actions: {}, outcomes: {}, modes: {}, identity: {}, completeness: {}, integrity: {} };
    const paths = { transitions: {} };
    const sketches = [];
    for (const doc of shards.docs) {
        const shard = doc.data();
        for (const key of ['sessions', 'pageViews', 'events', 'activeDurationMs']) overview[key] += Number(shard[key]) || 0;
        for (const key of ['pages', 'actions', 'outcomes', 'modes', 'identity', 'completeness', 'integrity']) mergeNumberMaps(overview[key], shard[key]);
        mergeNumberMaps(paths.transitions, shard.transitions);
        if (shard.uniqueHll) sketches.push(shard.uniqueHll);
    }
    const uniqueHll = mergeHll(sketches);
    overview.uniqueVisitorsApprox = sketches.length ? estimateHll(uniqueHll) : null;
    overview.uniqueVisitorsEstimated = true;
    overview.measurementQuality = {
        identity_resolution: overview.uniqueVisitorsApprox === null ? 'partielle' : 'bonne',
        data_completeness: Number(overview.completeness.sequence_gap || 0) > 0 ? 'partielle' : 'bonne',
        ingestion_integrity: Number(overview.integrity.app_check_observed || 0) >= Number(overview.sessions || 0) * 0.95 ? 'forte' : 'partielle',
        formulaVersion: 1
    };
    const ageDays = Math.floor((Date.now() - new Date(`${date}T12:00:00Z`).getTime()) / 86400000);
    const provisional = ageDays < 2;
    const batch = db.batch();
    batch.set(dayRef.collection('compact').doc('overview'), {
        ...overview, dateKey: date, schemaVersion: 3, provisional, uniqueHll,
        compactedAt: admin.firestore.FieldValue.serverTimestamp(), expireAt: timestampAfterDays(ROLLUP_RETENTION_DAYS)
    }, { merge: true });
    batch.set(dayRef.collection('compact').doc('paths'), {
        ...paths, dateKey: date, schemaVersion: 3, provisional,
        compactedAt: admin.firestore.FieldValue.serverTimestamp(), expireAt: timestampAfterDays(ROLLUP_RETENTION_DAYS)
    });
    batch.set(dayRef, { 'config.provisional': provisional, compactedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    await batch.commit();
}

async function compactRecentDays() {
    for (let offset = 0; offset <= 2; offset += 1) await compactDay(dayKey(Date.now() - offset * 86400000));
}

async function compactMonth(month) {
    const start = new Date(`${month}-01T00:00:00Z`);
    const next = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    const refs = [];
    const pathRefs = [];
    for (let cursor = new Date(start); cursor < next; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
        refs.push(db.doc(`analytics_rollup_days_v3/${dayKey(cursor.getTime())}/compact/overview`));
        pathRefs.push(db.doc(`analytics_rollup_days_v3/${dayKey(cursor.getTime())}/compact/paths`));
    }
    const [docs, pathDocs] = await Promise.all([
        refs.length ? db.getAll(...refs) : [],
        pathRefs.length ? db.getAll(...pathRefs) : []
    ]);
    const overview = { sessions: 0, pageViews: 0, events: 0, activeDurationMs: 0, pages: {}, actions: {}, outcomes: {}, modes: {}, business: {}, identity: {}, completeness: {}, integrity: {} };
    const sketches = [];
    const paths = { transitions: {} };
    for (const snap of docs) {
        if (!snap.exists) continue;
        const day = snap.data();
        for (const key of ['sessions', 'pageViews', 'events', 'activeDurationMs']) overview[key] += Number(day[key]) || 0;
        for (const key of ['pages', 'actions', 'outcomes', 'modes', 'business', 'identity', 'completeness', 'integrity']) mergeNumberMaps(overview[key], day[key]);
        if (day.uniqueHll) sketches.push(day.uniqueHll);
    }
    for (const snap of pathDocs) if (snap.exists) mergeNumberMaps(paths.transitions, snap.data().transitions);
    const uniqueHll = mergeHll(sketches);
    const batch = db.batch();
    batch.set(db.doc(`analytics_rollup_months_v3/${month}/compact/overview`), {
        ...overview,
        monthKey: month,
        schemaVersion: 3,
        uniqueHll,
        uniqueVisitorsApprox: sketches.length ? estimateHll(uniqueHll) : null,
        uniqueVisitorsEstimated: true,
        provisional: month === dayKey(Date.now()).slice(0, 7),
        compactedAt: admin.firestore.FieldValue.serverTimestamp(),
        expireAt: timestampAfterDays(ROLLUP_RETENTION_DAYS)
    });
    batch.set(db.doc(`analytics_rollup_months_v3/${month}/compact/paths`), {
        ...paths,
        monthKey: month,
        schemaVersion: 3,
        provisional: month === dayKey(Date.now()).slice(0, 7),
        compactedAt: admin.firestore.FieldValue.serverTimestamp(),
        expireAt: timestampAfterDays(ROLLUP_RETENTION_DAYS)
    });
    await batch.commit();
}

async function compactRecentMonths() {
    const current = new Date();
    const previous = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 1, 1));
    await compactMonth(dayKey(current.getTime()).slice(0, 7));
    await compactMonth(dayKey(previous.getTime()).slice(0, 7));
}

exports.finalizeAnalyticsSessionsV3 = functions.region(PRIMARY_FUNCTIONS_REGION)
    .pubsub.schedule('every 10 minutes').timeZone('Europe/Paris').onRun(finalizeInactiveSessions);

exports.compactAnalyticsDaysV3 = functions.region(PRIMARY_FUNCTIONS_REGION)
    .pubsub.schedule('every 60 minutes').timeZone('Europe/Paris').onRun(compactRecentDays);

exports.compactAnalyticsMonthsV3 = functions.region(PRIMARY_FUNCTIONS_REGION)
    .pubsub.schedule('every day 03:20').timeZone('Europe/Paris').onRun(compactRecentMonths);

exports.reconcileSession = reconcileSession;
exports.compactDay = compactDay;
exports.compactMonth = compactMonth;
