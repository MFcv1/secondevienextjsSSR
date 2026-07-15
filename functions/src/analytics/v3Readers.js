const admin = require('firebase-admin');
const { regionalFunctions } = require('../../helpers/runtime');
const { checkActiveStrongAdmin, checkRecentActiveStrongAdmin } = require('../../helpers/security');
const { estimateHll, mergeHll } = require('./v3Core');

const db = admin.firestore();

function dateKey(date) { return date.toISOString().slice(0, 10); }
function monthKey(date) { return date.toISOString().slice(0, 7); }
function mergeMap(target, source) { for (const [key, value] of Object.entries(source || {})) target[key] = (target[key] || 0) + (Number(value) || 0); }

function buildRefs(period, compactName = 'overview') {
    const now = new Date();
    if (period === '12m') {
        return Array.from({ length: 12 }, (_, offset) => {
            const value = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
            return db.doc(`analytics_rollup_months_v3/${monthKey(value)}/compact/${compactName}`);
        });
    }
    const days = period === '7d' ? 7 : 30;
    return Array.from({ length: days }, (_, offset) => {
        const value = new Date(now.getTime() - offset * 86400000);
        return db.doc(`analytics_rollup_days_v3/${dateKey(value)}/compact/${compactName}`);
    });
}

function assertSessionViewer(access) {
    const capabilities = access?.capabilities;
    const allowed = access?.role === 'owner'
        || (Array.isArray(capabilities) && capabilities.includes('analytics_session_viewer'))
        || capabilities?.analytics_session_viewer === true;
    if (!allowed) throw new (require('firebase-functions/v1')).https.HttpsError('permission-denied', 'Capacite analytics_session_viewer requise.');
}

exports.getAnalyticsOverviewV3 = regionalFunctions().runWith({ enforceAppCheck: true }).https.onCall(async (data, context) => {
    await checkActiveStrongAdmin(context);
    const period = ['7d', '30d', '12m'].includes(data?.period) ? data.period : '30d';
    const refs = buildRefs(period, 'overview');
    const pathRefs = buildRefs(period, 'paths');
    const [docs, pathDocs] = await Promise.all([
        refs.length ? db.getAll(...refs) : [],
        pathRefs.length ? db.getAll(...pathRefs) : []
    ]);
    const result = { sessions: 0, pageViews: 0, events: 0, activeDurationMs: 0, pages: {}, actions: {}, outcomes: {}, modes: {}, business: {}, identity: {}, completeness: {}, integrity: {}, transitions: {}, provisional: false, sourceDocuments: 0 };
    const sketches = [];
    const timeline = [];
    for (const snap of docs) {
        if (!snap.exists) continue;
        const value = snap.data();
        result.sourceDocuments += 1;
        result.provisional ||= value.provisional === true;
        for (const key of ['sessions', 'pageViews', 'events', 'activeDurationMs']) result[key] += Number(value[key]) || 0;
        for (const key of ['pages', 'actions', 'outcomes', 'modes', 'business', 'identity', 'completeness', 'integrity']) mergeMap(result[key], value[key]);
        if (value.uniqueHll) sketches.push(value.uniqueHll);
        timeline.push({ key: value.dateKey || value.monthKey || snap.ref.parent.parent?.id, sessions: Number(value.sessions) || 0, quoteViews: Number(value.pages?.quote) || 0 });
    }
    for (const snap of pathDocs) {
        if (!snap.exists) continue;
        mergeMap(result.transitions, snap.data().transitions);
        result.provisional ||= snap.data().provisional === true;
    }
    const hll = mergeHll(sketches);
    result.uniqueVisitorsApprox = sketches.length ? estimateHll(hll) : null;
    result.uniqueVisitorsEstimated = true;
    result.detailedCoverage = result.sessions ? Number(result.modes.product_analytics_consented || 0) / result.sessions : 0;
    result.timeline = timeline.sort((a, b) => String(a.key).localeCompare(String(b.key)));
    result.quality = {
        identity_resolution: result.uniqueVisitorsApprox === null ? 'partielle' : 'bonne',
        data_completeness: result.sourceDocuments === refs.length && Number(result.completeness.sequence_gap || 0) === 0 ? 'bonne' : 'partielle',
        ingestion_integrity: Number(result.integrity.app_check_observed || 0) >= Number(result.sessions || 0) * 0.95 ? 'forte' : 'partielle',
        formulaVersion: 1
    };
    return { period, ...result };
});

exports.listAnalyticsSessionsV3 = regionalFunctions().runWith({ enforceAppCheck: true }).https.onCall(async (data, context) => {
    const { access } = await checkRecentActiveStrongAdmin(context);
    assertSessionViewer(access);
    const pageSize = Math.min(25, Math.max(1, Number(data?.pageSize) || 25));
    let query = db.collection('analytics_sessions_v3')
        .where('measurementMode', '==', 'product_analytics_consented')
        .orderBy('firstReceivedAt', 'desc')
        .limit(pageSize);
    if (Number.isFinite(Number(data?.cursorMillis))) query = query.startAfter(admin.firestore.Timestamp.fromMillis(Number(data.cursorMillis)));
    const snap = await query.get();
    const sessions = snap.docs.map((doc) => {
        const value = doc.data();
        const identity = value.authSubjectId || value.browserSubjectId || '';
        return {
            id: doc.id,
            startedAt: value.firstReceivedAt?.toMillis?.() || null,
            lastReceivedAt: value.lastReceivedAt?.toMillis?.() || null,
            durationMs: Number(value.activeDurationMs) || 0,
            pageViewCount: Number(value.pageViewCount) || 0,
            eventCount: Number(value.eventCount) || 0,
            status: value.status,
            outcome: value.outcome || null,
            visitorLabel: identity ? `Visiteur ${identity.slice(-6).toUpperCase()}` : 'Visiteur ephemere',
            identitySource: value.identitySource,
            geo: { city: value.geo?.city || 'Unknown', country: value.geo?.country || 'Unknown', accuracy: value.geo?.accuracy || 'unavailable' },
            device: value.device || {},
            dataQuality: value.dataQuality || {}
        };
    });
    const last = snap.docs.at(-1)?.data()?.firstReceivedAt?.toMillis?.() || null;
    await db.collection('analytics_admin_audit_v3').add({ action: 'list_sessions', adminUid: context.auth.uid, count: sessions.length, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    return { sessions, nextCursorMillis: snap.size === pageSize ? last : null };
});

exports.getAnalyticsSessionDetailV3 = regionalFunctions().runWith({ enforceAppCheck: true }).https.onCall(async (data, context) => {
    const { access } = await checkRecentActiveStrongAdmin(context);
    assertSessionViewer(access);
    const sessionId = String(data?.sessionId || '');
    if (!/^[A-Za-z0-9_-]{16,160}$/.test(sessionId)) throw new (require('firebase-functions/v1')).https.HttpsError('invalid-argument', 'Session invalide.');
    const rootRef = db.collection('analytics_sessions_v3').doc(sessionId);
    const rootSnap = await rootRef.get();
    if (!rootSnap.exists || rootSnap.data().measurementMode !== 'product_analytics_consented') throw new (require('firebase-functions/v1')).https.HttpsError('not-found', 'Session introuvable.');
    let query = rootRef.collection('chunks').orderBy('firstSeq', 'asc').limit(5);
    if (Number.isFinite(Number(data?.afterSeq))) query = query.startAfter(Number(data.afterSeq));
    const chunks = await query.get();
    const events = chunks.docs.flatMap((doc) => doc.data().events || []).map((event) => ({
        seq: event.seq, eventName: event.eventName, routeKey: event.routeKey, occurredAt: event.occurredAt,
        activeDeltaMs: event.activeDeltaMs, context: event.context || {}
    }));
    await db.collection('analytics_admin_audit_v3').add({ action: 'view_session_detail', adminUid: context.auth.uid, sessionIdHash: require('crypto').createHash('sha256').update(sessionId).digest('base64url'), createdAt: admin.firestore.FieldValue.serverTimestamp() });
    return { events, nextAfterSeq: chunks.size === 5 ? chunks.docs.at(-1).data().firstSeq : null };
});
