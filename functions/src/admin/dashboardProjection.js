'use strict';

const ADMIN_DASHBOARD_SCHEMA_VERSION = 1;
const ORDER_SUMMARY_KEYS = Object.freeze([
    'totalOrders',
    'paidOrders',
    'shippedOrders',
    'pendingOrders',
    'cancelledOrders'
]);
const ZERO_ORDER_SUMMARY = Object.freeze(Object.fromEntries(
    ORDER_SUMMARY_KEYS.map((key) => [key, 0])
));
const CANCELLED_ORDER_STATUSES = new Set(['cancelled', 'cancelled_by_client', 'canceled']);
const PAID_ORDER_STATUSES = new Set(['paid', 'completed', 'refunded', 'refund_pending', 'refund_failed']);
const SHIPPED_ORDER_STATUSES = new Set(['shipped']);
const PENDING_ORDER_STATUSES = new Set([
    'pending', 'pending_payment', 'awaiting_method', 'requires_action', 'processing',
    'needs_review', 'draft', 'active', 'ready', 'preparing', 'ready_for_pickup',
    'payment_failed'
]);

function projectionError(code, field = null) {
    const error = new Error(field ? `${code}:${field}` : code);
    error.code = code;
    if (field) error.field = field;
    return error;
}

function nonNegativeSafeInteger(value, field) {
    if (!Number.isSafeInteger(value) || value < 0) {
        throw projectionError('ADMIN_DASHBOARD_INTEGER_INVALID', field);
    }
    return value;
}

function timestampParts(value) {
    if (!value) return null;
    if (Number.isSafeInteger(value.seconds) && Number.isSafeInteger(value.nanoseconds)) {
        return { seconds: value.seconds, nanoseconds: value.nanoseconds };
    }
    if (Number.isSafeInteger(value._seconds) && Number.isSafeInteger(value._nanoseconds)) {
        return { seconds: value._seconds, nanoseconds: value._nanoseconds };
    }
    if (typeof value.toMillis === 'function') {
        const millis = value.toMillis();
        if (Number.isFinite(millis)) {
            return {
                seconds: Math.floor(millis / 1000),
                nanoseconds: Math.floor((millis % 1000) * 1e6)
            };
        }
    }
    if (Number.isFinite(value)) {
        return {
            seconds: Math.floor(value / 1000),
            nanoseconds: Math.floor((value % 1000) * 1e6)
        };
    }
    return null;
}

function compareTimestamps(left, right) {
    const a = timestampParts(left);
    const b = timestampParts(right);
    if (!a && !b) return 0;
    if (!a) return -1;
    if (!b) return 1;
    if (a.seconds !== b.seconds) return a.seconds < b.seconds ? -1 : 1;
    if (a.nanoseconds !== b.nanoseconds) return a.nanoseconds < b.nanoseconds ? -1 : 1;
    return 0;
}

function normalizeOrderSummary(summary) {
    return Object.fromEntries(ORDER_SUMMARY_KEYS.map((key) => [
        key,
        nonNegativeSafeInteger(Number(summary?.[key] || 0), key)
    ]));
}

function diffOrderSummaries(after, before) {
    const next = normalizeOrderSummary(after);
    const previous = normalizeOrderSummary(before);
    return Object.fromEntries(ORDER_SUMMARY_KEYS
        .map((key) => [key, next[key] - previous[key]])
        .filter(([, value]) => value !== 0));
}

function summarizeAdminOrder(order) {
    if (!order) return { ...ZERO_ORDER_SUMMARY };
    const rawStatus = String(order.status || '').trim();
    const status = !rawStatus && Number(order.schemaVersion || 0) < 2 ? 'pending' : rawStatus;
    if (!status) throw projectionError('ADMIN_ORDER_STATUS_MISSING');
    if (CANCELLED_ORDER_STATUSES.has(status)) {
        return { ...ZERO_ORDER_SUMMARY, cancelledOrders: 1 };
    }
    if (PAID_ORDER_STATUSES.has(status)) {
        return { ...ZERO_ORDER_SUMMARY, totalOrders: 1, paidOrders: 1 };
    }
    if (SHIPPED_ORDER_STATUSES.has(status)) {
        return { ...ZERO_ORDER_SUMMARY, totalOrders: 1, shippedOrders: 1 };
    }
    if (PENDING_ORDER_STATUSES.has(status)) {
        return { ...ZERO_ORDER_SUMMARY, totalOrders: 1, pendingOrders: 1 };
    }
    throw projectionError('ADMIN_ORDER_STATUS_UNKNOWN', status);
}

function validateOrderPartition(summary) {
    const normalized = normalizeOrderSummary(summary);
    if (normalized.totalOrders !== (
        normalized.paidOrders + normalized.shippedOrders + normalized.pendingOrders
    )) {
        throw projectionError('ADMIN_ORDER_PARTITION_INVALID');
    }
    return normalized;
}

function buildFinanceProjection(total, { sourceUpdateTime, updatedAt, revision }) {
    if (!total) throw projectionError('ADMIN_FINANCE_SOURCE_MISSING');
    const currency = String(total.currency || '').trim().toUpperCase();
    if (currency !== 'EUR') throw projectionError('ADMIN_FINANCE_CURRENCY_INVALID');
    const capturedCents = nonNegativeSafeInteger(Number(total.capturedCents), 'capturedCents');
    const refundedCents = nonNegativeSafeInteger(Number(total.refundedCents), 'refundedCents');
    const netCents = Number(total.netCents);
    if (!Number.isSafeInteger(netCents) || netCents !== capturedCents - refundedCents) {
        throw projectionError('ADMIN_FINANCE_NET_INVALID');
    }
    const capturedOrderCount = nonNegativeSafeInteger(
        Number(total.capturedOrderCount || total.captureCount || 0),
        'capturedOrderCount'
    );
    const sourceFactCount = nonNegativeSafeInteger(Number(total.factCount || 0), 'sourceFactCount');
    if (!timestampParts(sourceUpdateTime)) throw projectionError('ADMIN_FINANCE_TIMESTAMP_INVALID');
    return {
        schemaVersion: ADMIN_DASHBOARD_SCHEMA_VERSION,
        currency,
        capturedCents,
        refundedCents,
        netCents,
        capturedOrderCount,
        sourceFactCount,
        source: 'commerce_financial_totals_projection',
        sourceUpdateTime,
        updatedAt,
        revision: nonNegativeSafeInteger(Number(revision), 'revision')
    };
}

function mergeActivityProjection(current, patch, { updatedAt, revision }) {
    const next = {
        schemaVersion: ADMIN_DASHBOARD_SCHEMA_VERSION,
        users: current?.users || null,
        catalog: current?.catalog || null,
        ...patch,
        updatedAt,
        revision: nonNegativeSafeInteger(Number(revision), 'revision')
    };
    if (next.users) {
        next.users = {
            registeredUsers: nonNegativeSafeInteger(Number(next.users.registeredUsers), 'registeredUsers'),
            sourceRevision: nonNegativeSafeInteger(Number(next.users.sourceRevision), 'users.sourceRevision'),
            sourceUpdatedAt: next.users.sourceUpdatedAt
        };
    }
    if (next.catalog) {
        next.catalog = {
            stockValueCents: nonNegativeSafeInteger(Number(next.catalog.stockValueCents), 'stockValueCents'),
            sourceRevision: nonNegativeSafeInteger(Number(next.catalog.sourceRevision), 'catalog.sourceRevision'),
            sourceUpdatedAt: next.catalog.sourceUpdatedAt
        };
    }
    return next;
}

function planUserStatsEvent({ currentCount, ledger, present, sourceEventTime, eventId }) {
    if (ledger?.eventId === eventId || compareTimestamps(sourceEventTime, ledger?.sourceEventTime) <= 0) {
        return Object.freeze({ outcome: 'noop', registeredUsers: currentCount, delta: 0 });
    }
    const delta = Number(present === true) - Number(ledger?.present === true);
    const registeredUsers = Number(currentCount) + delta;
    if (!Number.isSafeInteger(registeredUsers) || registeredUsers < 0) {
        throw projectionError('ADMIN_USER_STATS_UNDERFLOW');
    }
    return Object.freeze({ outcome: 'apply', registeredUsers, delta });
}

module.exports = {
    ADMIN_DASHBOARD_SCHEMA_VERSION,
    ORDER_SUMMARY_KEYS,
    ZERO_ORDER_SUMMARY,
    buildFinanceProjection,
    compareTimestamps,
    diffOrderSummaries,
    mergeActivityProjection,
    normalizeOrderSummary,
    planUserStatsEvent,
    projectionError,
    summarizeAdminOrder,
    timestampParts,
    validateOrderPartition
};
