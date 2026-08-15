'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');
const { logger } = require('firebase-functions');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const {
    ANALYTICS_ROLLUP_RETENTION_DAYS,
    timestampFromNow,
    getDateKeyFromTimestamp
} = require('../analytics/constants');

const db = admin.firestore();
const V2_STATS_PROJECTION_REQUIRED = 2;
const ORDER_STATS_RUNTIME_SERVICE_ACCOUNT =
    'order-stats-projector@secondevienextjsssr.iam.gserviceaccount.com';
const METRIC_KEYS = Object.freeze([
    'totalRevenue',
    'totalOrders',
    'paidOrders',
    'shippedOrders',
    'pendingOrders',
    'cancelledOrders'
]);
const ZERO_SUMMARY = Object.freeze(Object.fromEntries(
    METRIC_KEYS.map((key) => [key, 0])
));

function isCancelledStatus(status) {
    return status === 'cancelled' || status === 'cancelled_by_client';
}

function summarizeOrder(order) {
    if (!order || Number(order.schemaVersion || 0) >= V2_STATS_PROJECTION_REQUIRED) {
        return { ...ZERO_SUMMARY };
    }

    const status = order.status || 'pending';
    const cancelled = isCancelledStatus(status);
    const active = !cancelled;
    const paid = status === 'paid' || status === 'completed';
    const shipped = status === 'shipped';
    const pending = active && !paid && !shipped;

    return {
        totalRevenue: active ? Number(order.total || 0) : 0,
        totalOrders: active ? 1 : 0,
        paidOrders: paid ? 1 : 0,
        shippedOrders: shipped ? 1 : 0,
        pendingOrders: pending ? 1 : 0,
        cancelledOrders: cancelled ? 1 : 0
    };
}

function normalizeSummary(summary) {
    return Object.fromEntries(METRIC_KEYS.map((key) => {
        const value = Number(summary?.[key] || 0);
        if (!Number.isFinite(value)) throw new Error(`ORDER_STATS_SUMMARY_INVALID:${key}`);
        return [key, value];
    }));
}

function diffMetrics(after, before) {
    const normalizedAfter = normalizeSummary(after);
    const normalizedBefore = normalizeSummary(before);
    return Object.fromEntries(METRIC_KEYS
        .map((key) => [key, normalizedAfter[key] - normalizedBefore[key]])
        .filter(([, value]) => value !== 0));
}

function negateMetrics(summary) {
    return Object.fromEntries(METRIC_KEYS
        .map((key) => [key, -Number(summary?.[key] || 0)])
        .filter(([, value]) => value !== 0));
}

function buildProjectionPlan({ currentOrder, previousProjection }) {
    const previousSummary = normalizeSummary(previousProjection?.summary || ZERO_SUMMARY);
    const previousDateKey = previousProjection?.dateKey || null;
    const eligibleOrder = currentOrder &&
        Number(currentOrder.schemaVersion || 0) < V2_STATS_PROJECTION_REQUIRED
        ? currentOrder
        : null;
    if (!eligibleOrder) {
        return {
            dashboardDelta: negateMetrics(previousSummary),
            dailyDeltas: previousDateKey
                ? [{ dateKey: previousDateKey, delta: negateMetrics(previousSummary) }]
                : [],
            nextProjection: null
        };
    }

    const nextSummary = summarizeOrder(eligibleOrder);
    const nextDateKey = getDateKeyFromTimestamp(eligibleOrder.createdAt);
    const dailyDeltas = previousDateKey && previousDateKey !== nextDateKey
        ? [
            { dateKey: previousDateKey, delta: negateMetrics(previousSummary) },
            { dateKey: nextDateKey, delta: diffMetrics(nextSummary, ZERO_SUMMARY) }
        ]
        : [{ dateKey: nextDateKey, delta: diffMetrics(nextSummary, previousSummary) }];

    return {
        dashboardDelta: diffMetrics(nextSummary, previousSummary),
        dailyDeltas: dailyDeltas.filter(({ delta }) => Object.keys(delta).length > 0),
        nextProjection: { dateKey: nextDateKey, summary: nextSummary }
    };
}

function buildIncrementPayload(delta, { includeExpiry = false } = {}) {
    const payload = {
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    if (includeExpiry) {
        payload.expireAt = timestampFromNow(ANALYTICS_ROLLUP_RETENTION_DAYS);
    }
    for (const [key, value] of Object.entries(delta)) {
        payload[key] = admin.firestore.FieldValue.increment(value);
    }
    return payload;
}

function correlationId(eventId) {
    return crypto.createHash('sha256').update(String(eventId || 'missing'))
        .digest('hex').slice(0, 16);
}

function requiresProjectionBaseline({ currentOrder, eventBefore, previousProjection }) {
    if (previousProjection) return false;
    const currentIsLegacy = currentOrder &&
        Number(currentOrder.schemaVersion || 0) < V2_STATS_PROJECTION_REQUIRED;
    const beforeIsLegacy = eventBefore &&
        Number(eventBefore.schemaVersion || 0) < V2_STATS_PROJECTION_REQUIRED;
    return Boolean((currentIsLegacy && eventBefore) || (!currentOrder && beforeIsLegacy));
}

async function projectOrderStats(event) {
    const orderId = event.params.orderId;
    const orderRef = db.doc(`orders/${orderId}`);
    const projectionRef = db.doc(`order_stats_projections/${orderId}`);
    const result = await db.runTransaction(async (transaction) => {
        const [orderSnapshot, projectionSnapshot] = await Promise.all([
            transaction.get(orderRef),
            transaction.get(projectionRef)
        ]);
        const currentOrder = orderSnapshot.exists ? orderSnapshot.data() : null;
        const previousProjection = projectionSnapshot.exists
            ? projectionSnapshot.data()
            : null;
        const eventBefore = event.data?.before?.exists
            ? event.data.before.data()
            : null;
        if (requiresProjectionBaseline({
            currentOrder,
            eventBefore,
            previousProjection
        })) {
            throw new Error('ORDER_STATS_PROJECTION_BASELINE_MISSING');
        }
        const sourceUpdateTime = orderSnapshot.exists
            ? orderSnapshot.updateTime.toMillis()
            : null;
        if (
            previousProjection?.sourceUpdateTime === sourceUpdateTime &&
            currentOrder !== null
        ) {
            return { outcome: 'already_current', dailyWrites: 0 };
        }

        const plan = buildProjectionPlan({ currentOrder, previousProjection });
        if (Object.keys(plan.dashboardDelta).length > 0) {
            transaction.set(
                db.doc('dashboard_stats/commerce'),
                buildIncrementPayload(plan.dashboardDelta),
                { merge: true }
            );
        }
        for (const daily of plan.dailyDeltas) {
            transaction.set(db.doc(`sales_stats_daily/${daily.dateKey}`), {
                ...buildIncrementPayload(daily.delta, { includeExpiry: true }),
                dateKey: daily.dateKey
            }, { merge: true });
        }
        if (plan.nextProjection) {
            transaction.set(projectionRef, {
                schemaVersion: 1,
                orderId,
                sourceUpdateTime,
                ...plan.nextProjection,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } else if (projectionSnapshot.exists) {
            transaction.delete(projectionRef);
        }
        return {
            outcome: Object.keys(plan.dashboardDelta).length > 0 ||
                plan.dailyDeltas.length > 0 ? 'projected' : 'no_change',
            dailyWrites: plan.dailyDeltas.length
        };
    });

    logger.info('order_stats_projection_completed', {
        schemaVersion: 1,
        generation: 'gen2',
        revision: process.env.K_REVISION || null,
        correlationId: correlationId(event.id),
        outcome: result.outcome,
        dailyWrites: result.dailyWrites
    });
    return null;
}

const onOrderStatsWrite = onDocumentWritten(
    {
        document: 'orders/{orderId}',
        region: 'europe-west1',
        cpu: 1,
        concurrency: 1,
        minInstances: 0,
        maxInstances: 1,
        memory: '256MiB',
        timeoutSeconds: 60,
        retry: true,
        serviceAccount: ORDER_STATS_RUNTIME_SERVICE_ACCOUNT
    },
    projectOrderStats
);

module.exports = {
    METRIC_KEYS,
    ORDER_STATS_RUNTIME_SERVICE_ACCOUNT,
    V2_STATS_PROJECTION_REQUIRED,
    buildProjectionPlan,
    correlationId,
    diffMetrics,
    normalizeSummary,
    onOrderStatsWrite,
    projectOrderStats,
    requiresProjectionBaseline,
    summarizeOrder
};
