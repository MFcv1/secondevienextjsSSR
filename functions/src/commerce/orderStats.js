const admin = require('firebase-admin');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const {
    ANALYTICS_ROLLUP_RETENTION_DAYS,
    timestampFromNow,
    getDateKeyFromTimestamp
} = require('../analytics/constants');

const db = admin.firestore();

function isCancelledStatus(status) {
    return status === 'cancelled' || status === 'cancelled_by_client';
}

function summarizeOrder(order) {
    if (!order) {
        return {
            totalRevenue: 0,
            totalOrders: 0,
            paidOrders: 0,
            shippedOrders: 0,
            pendingOrders: 0,
            cancelledOrders: 0
        };
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

function diffMetrics(after, before) {
    const delta = {};
    const keys = new Set([...Object.keys(after || {}), ...Object.keys(before || {})]);
    keys.forEach((key) => {
        const value = Number((after && after[key]) || 0) - Number((before && before[key]) || 0);
        if (value !== 0) delta[key] = value;
    });
    return delta;
}

function buildIncrementPayload(delta) {
    const payload = {
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    Object.entries(delta).forEach(([key, value]) => {
        payload[key] = admin.firestore.FieldValue.increment(value);
    });

    return payload;
}

exports.onOrderStatsWrite = onDocumentWritten(
    { document: 'orders/{orderId}', region: 'europe-west1' },
    async (event) => {
        const before = event.data?.before?.exists ? event.data.before.data() : null;
        const after = event.data?.after?.exists ? event.data.after.data() : null;

        const delta = diffMetrics(summarizeOrder(after), summarizeOrder(before));
        if (Object.keys(delta).length === 0) return null;

        const dashboardRef = db.doc('dashboard_stats/commerce');
        const dateKey = getDateKeyFromTimestamp(after?.createdAt || before?.createdAt);
        const dailyRef = db.doc(`sales_stats_daily/${dateKey}`);

        const incrementPayload = buildIncrementPayload(delta);

        const batch = db.batch();
        batch.set(dashboardRef, incrementPayload, { merge: true });
        batch.set(dailyRef, {
            ...incrementPayload,
            dateKey,
            expireAt: timestampFromNow(ANALYTICS_ROLLUP_RETENTION_DAYS)
        }, { merge: true });
        await batch.commit();

        return null;
    }
);
