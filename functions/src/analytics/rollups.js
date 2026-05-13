const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const crypto = require('crypto');
const {
    ANALYTICS_ROLLUP_RETENTION_DAYS,
    timestampFromNow,
    getDateKeyFromMillis
} = require('./constants');

const db = admin.firestore();
const ROLLUP_SHARD_COUNT = 32;

function getRollupDocId(dateKey, itemId) {
    return `${dateKey}__${itemId}`;
}

function hashString(value) {
    return crypto.createHash('sha1').update(String(value || '')).digest('hex');
}

function getShardId(payload = {}) {
    const seed = payload.visitorKey || payload.sessionId || payload.userId || payload.timestamp || Date.now();
    const hash = parseInt(hashString(seed).slice(0, 8), 16);
    return `s${String(hash % ROLLUP_SHARD_COUNT).padStart(2, '0')}`;
}

function getShardedDocId(baseDocId, payload = {}) {
    return `${baseDocId}__${getShardId(payload)}`;
}

function getUniqueMarkerRef(scope, dateKey, entityKey, visitorKey) {
    const markerId = `${scope}__${dateKey}__${hashString(`${entityKey}|${visitorKey}`)}`;
    return db.collection('analytics_unique_markers').doc(markerId);
}

async function incrementUniqueRollup({ scope, dateKey, entityKey, visitorKey, rollupRef, field = 'uniqueViewCount' }) {
    if (!visitorKey || !entityKey || !rollupRef) return;

    try {
        await getUniqueMarkerRef(scope, dateKey, entityKey, visitorKey).create({
            scope,
            dateKey,
            entityHash: hashString(entityKey),
            visitorHash: hashString(visitorKey),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expireAt: timestampFromNow(ANALYTICS_ROLLUP_RETENTION_DAYS)
        });
        await rollupRef.set({
            [field]: admin.firestore.FieldValue.increment(1),
            lastTouchedAt: admin.firestore.FieldValue.serverTimestamp(),
            expireAt: timestampFromNow(ANALYTICS_ROLLUP_RETENTION_DAYS)
        }, { merge: true });
    } catch (error) {
        if (error?.code !== 6 && error?.code !== 'already-exists') {
            console.warn('Unique rollup marker failed', { scope, dateKey, entityKey, code: error?.code });
        }
    }
}

function extractItemId(payload = {}) {
    if (payload.context && payload.context.itemId) return payload.context.itemId;
    if (payload.itemId && typeof payload.itemId === 'string') {
        return payload.itemId.split(' | ')[0].trim();
    }
    return null;
}

function normalizePageKey(pageKey) {
    if (!pageKey) return 'unknown';
    if (pageKey === 'detail') return 'product_detail';
    if (pageKey === 'devis') return 'quote_request';
    if (pageKey === 'my-orders') return 'my_orders';
    return pageKey;
}

function resolveNodeId(payload = {}) {
    const pageKey = normalizePageKey(payload.pageKey || payload.page);
    const categoryId = payload.context?.categoryId;

    if (pageKey === 'category_group') return categoryId ? `category_group:${categoryId}` : 'category_group:unknown';
    if (pageKey === 'category_leaf') return categoryId ? `category_leaf:${categoryId}` : 'category_leaf:unknown';
    return pageKey;
}

function resolveEventNodeId(event = {}) {
    if (event.action === 'cart_add' || event.action === 'cart_remove' || event.action === 'cart_open') return 'cart_actions';
    if (event.action === 'favorite_add' || event.action === 'favorite_remove') return 'wishlist';
    return null;
}

function getPageRollupDocId(dateKey, nodeId) {
    return `${dateKey}__${nodeId}`;
}

function getTransitionRollupDocId(dateKey, sourceNodeId, targetNodeId) {
    return `${dateKey}__${sourceNodeId}__${targetNodeId}`;
}

async function updatePageDailyRollup(payload = {}, nodeId, mode = 'view') {
    if (!nodeId || nodeId === 'unknown') return;

    const timestamp = Number(payload.timestamp) || Date.now();
    const dateKey = payload.dateKey || getDateKeyFromMillis(timestamp);
    const baseDocId = getPageRollupDocId(dateKey, nodeId);
    const shardId = getShardId(payload);
    const rollupRef = db.collection('analytics_page_daily').doc(getShardedDocId(baseDocId, payload));
    const updates = {
        nodeId,
        pageKey: normalizePageKey(payload.pageKey || payload.page || payload.action || 'event'),
        dateKey,
        baseDocId,
        shardId,
        lastSeenAt: admin.firestore.Timestamp.fromMillis(timestamp),
        lastTouchedAt: admin.firestore.FieldValue.serverTimestamp(),
        expireAt: timestampFromNow(ANALYTICS_ROLLUP_RETENTION_DAYS)
    };

    if (mode === 'action') {
        updates.actionCount = admin.firestore.FieldValue.increment(1);
    } else {
        updates.viewCount = admin.firestore.FieldValue.increment(1);
        updates.totalTimeSpent = admin.firestore.FieldValue.increment(Number(payload.duration) || 0);
    }

    if (payload.context?.categoryId) updates.categoryId = payload.context.categoryId;

    await rollupRef.set(updates, { merge: true });
}

async function updateTransitionDailyRollup(payload = {}, sourceNodeId, targetNodeId) {
    if (!sourceNodeId || !targetNodeId || sourceNodeId === targetNodeId) return;

    const timestamp = Number(payload.timestamp) || Date.now();
    const dateKey = payload.dateKey || getDateKeyFromMillis(timestamp);
    const baseDocId = getTransitionRollupDocId(dateKey, sourceNodeId, targetNodeId);
    const shardId = getShardId(payload);
    const rollupRef = db.collection('analytics_transition_daily').doc(getShardedDocId(baseDocId, payload));
    const updates = {
        sourceNodeId,
        targetNodeId,
        dateKey,
        baseDocId,
        shardId,
        count: admin.firestore.FieldValue.increment(1),
        lastSeenAt: admin.firestore.Timestamp.fromMillis(timestamp),
        lastTouchedAt: admin.firestore.FieldValue.serverTimestamp(),
        expireAt: timestampFromNow(ANALYTICS_ROLLUP_RETENTION_DAYS)
    };

    if (payload.action) updates.lastAction = payload.action;

    await rollupRef.set(updates, { merge: true });
}

async function findPreviousJourneyStep(sessionId, timestamp) {
    if (!sessionId || !timestamp) return null;

    const snap = await db.collection('analytics_sessions')
        .doc(sessionId)
        .collection('journey_steps')
        .where('timestamp', '<', timestamp)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

    return snap.empty ? null : snap.docs[0].data();
}

async function resolvePreviousJourneyStep(sessionId, timestamp, payload = {}) {
    const previous = payload.previousStep || payload.previous;
    if (previous && (previous.pageKey || previous.page)) return previous;
    return findPreviousJourneyStep(sessionId, timestamp);
}

async function updateDailyRollup(payload, updater) {
    const itemId = extractItemId(payload);
    if (!itemId) return;

    const timestamp = Number(payload.timestamp) || Date.now();
    const dateKey = payload.dateKey || getDateKeyFromMillis(timestamp);
    const baseDocId = getRollupDocId(dateKey, itemId);
    const shardId = getShardId(payload);
    const rollupRef = db.collection('analytics_item_daily').doc(getShardedDocId(baseDocId, payload));

    const updates = {
        itemId,
        dateKey,
        baseDocId,
        shardId,
        lastTouchedAt: admin.firestore.FieldValue.serverTimestamp(),
        expireAt: timestampFromNow(ANALYTICS_ROLLUP_RETENTION_DAYS)
    };

    updater(updates, payload, timestamp);

    await rollupRef.set(updates, { merge: true });
    if (updates.viewCount && payload.visitorKey) {
        await incrementUniqueRollup({
            scope: 'item',
            dateKey,
            entityKey: itemId,
            visitorKey: payload.visitorKey,
            rollupRef
        });
    }
}

exports.onJourneyStepCreated = functions.firestore
    .document('analytics_sessions/{sessionId}/journey_steps/{stepId}')
    .onCreate(async (snap, context) => {
        const step = snap.data() || {};
        const pageKey = step.pageKey || step.page;
        const nodeId = resolveNodeId(step);

        await updatePageDailyRollup(step, nodeId, 'view');

        const previousStep = await resolvePreviousJourneyStep(context.params.sessionId, Number(step.timestamp) || Date.now(), step);
        const previousNodeId = previousStep ? resolveNodeId(previousStep) : null;
        await updateTransitionDailyRollup(step, previousNodeId, nodeId);

        if (pageKey !== 'product_detail' && pageKey !== 'detail') return null;

        await updateDailyRollup(step, (updates, payload, timestamp) => {
            updates.nameHint = payload.context?.itemName || payload.itemName || null;
            updates.priceHint = payload.context?.itemPrice || null;
            updates.categoryHint = payload.context?.categoryId || null;
            updates.viewCount = admin.firestore.FieldValue.increment(1);
            updates.totalTimeSpent = admin.firestore.FieldValue.increment(Number(payload.duration) || 0);
            updates.lastViewedAt = admin.firestore.Timestamp.fromMillis(timestamp);
        });

        return null;
    });

exports.onCustomEventCreated = functions.firestore
    .document('analytics_sessions/{sessionId}/custom_events/{eventId}')
    .onCreate(async (snap, context) => {
        const event = snap.data() || {};
        const eventNodeId = resolveEventNodeId(event);

        if (eventNodeId) {
            await updatePageDailyRollup(event, eventNodeId, 'action');

            const previousStep = await resolvePreviousJourneyStep(context.params.sessionId, Number(event.timestamp) || Date.now(), event);
            const previousNodeId = previousStep ? resolveNodeId(previousStep) : null;
            await updateTransitionDailyRollup(event, previousNodeId, eventNodeId);
        }

        if (!event.itemId) return null;

        await updateDailyRollup(event, (updates, payload, timestamp) => {
            updates.nameHint = payload.itemName || null;
            updates.lastInteractedAt = admin.firestore.Timestamp.fromMillis(timestamp);

            if (payload.action === 'favorite_add') {
                updates.favoriteCount = admin.firestore.FieldValue.increment(1);
            }
            if (payload.action === 'cart_add') {
                updates.cartAddCount = admin.firestore.FieldValue.increment(1);
            }
        });

        return null;
    });
