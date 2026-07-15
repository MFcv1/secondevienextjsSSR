const admin = require('firebase-admin');
const functions = require('firebase-functions/v1');
const { PRIMARY_FUNCTIONS_REGION } = require('../../helpers/runtime');
const { addHll, shardFor } = require('./v3Core');
const { compactDay } = require('./v3Jobs');

const db = admin.firestore();
const ALLOWED_SHARD_COUNTS = new Set([4, 8, 16]);

function mergeMap(target, source) { for (const [key, value] of Object.entries(source || {})) target[key] = (target[key] || 0) + (Number(value) || 0); }

async function rebuildDay(dateKey) {
    const facts = await db.collection('analytics_session_facts_v3').where('dayKey', '==', dateKey).limit(50000).get();
    if (facts.size === 50000) throw new Error(`analytics_privacy_rebuild_limit:${dateKey}`);
    const dayRef = db.collection('analytics_rollup_days_v3').doc(dateKey);
    const daySnap = await dayRef.get();
    const storedShardCount = Number(daySnap.data()?.config?.shardCount);
    const shardCount = ALLOWED_SHARD_COUNTS.has(storedShardCount) ? storedShardCount : 8;
    const shards = Array.from({ length: shardCount }, (_, index) => ({
        shardId: String(index).padStart(2, '0'), sessions: 0, pageViews: 0, events: 0, activeDurationMs: 0,
        pages: {}, actions: {}, transitions: {}, outcomes: {}, modes: {}, identity: {}, completeness: {}, integrity: {}, uniqueHll: null
    }));
    for (const factSnap of facts.docs) {
        const fact = factSnap.data();
        const contribution = fact.contribution || {};
        const shard = shards[shardFor(factSnap.id, shardCount)];
        for (const key of ['sessions', 'pageViews', 'events', 'activeDurationMs']) shard[key] += Number(contribution[key]) || 0;
        for (const key of ['pages', 'actions', 'transitions', 'outcomes', 'identity', 'completeness', 'integrity']) mergeMap(shard[key], contribution[key]);
        if (contribution.mode) shard.modes[contribution.mode] = (shard.modes[contribution.mode] || 0) + 1;
        if (fact.uniqueSubjectId) shard.uniqueHll = addHll(shard.uniqueHll, fact.uniqueSubjectId);
    }
    const existing = await dayRef.collection('summary_shards').get();
    const batch = db.batch();
    existing.docs.forEach((doc) => batch.delete(doc.ref));
    for (const shard of shards) {
        if (!shard.sessions) continue;
        batch.set(dayRef.collection('summary_shards').doc(shard.shardId), {
            ...shard, schemaVersion: 3, dateKey, shardCount,
            rebuiltAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    batch.set(dayRef, { privacyRebuiltAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    await batch.commit();
    await compactDay(dateKey);
}

async function processRequest(requestSnap) {
    const request = requestSnap.data();
    await requestSnap.ref.update({ status: 'processing', processingAt: admin.firestore.FieldValue.serverTimestamp() });
    const affectedDays = new Set();
    let deletedSessions = 0;
    for (let page = 0; page < 10; page += 1) {
        const sessions = await db.collection('analytics_sessions_v3').where('browserSubjectId', '==', request.browserSubjectId).limit(100).get();
        if (sessions.empty) break;
        for (const session of sessions.docs) {
            const factRef = db.collection('analytics_session_facts_v3').doc(session.id);
            const fact = await factRef.get();
            if (fact.exists) affectedDays.add(fact.data().dayKey);
            await db.recursiveDelete(session.ref);
            await factRef.delete();
            deletedSessions += 1;
        }
    }
    for (const date of affectedDays) await rebuildDay(date);
    await requestSnap.ref.update({
        status: 'completed', deletedSessions, rebuiltDays: [...affectedDays],
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        browserSubjectId: admin.firestore.FieldValue.delete()
    });
}

async function processPrivacyRequests() {
    const pending = await db.collection('analytics_privacy_requests_v3').where('status', '==', 'pending').limit(10).get();
    for (const request of pending.docs) {
        try { await processRequest(request); }
        catch (error) {
            console.error('analytics_v3_privacy_failed', { requestId: request.id, message: error?.message || String(error) });
            await request.ref.update({ status: 'failed', failureCode: String(error?.message || error).split(':')[0], failedAt: admin.firestore.FieldValue.serverTimestamp() });
        }
    }
}

exports.processAnalyticsPrivacyRequestsV3 = functions.region(PRIMARY_FUNCTIONS_REGION)
    .pubsub.schedule('every 30 minutes').timeZone('Europe/Paris').onRun(processPrivacyRequests);

exports.rebuildDay = rebuildDay;
