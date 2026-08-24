'use strict';

const { hashPayload } = require('./idempotency');

const HEALTH_FRESHNESS_WINDOW_MS = 90 * 60 * 1000;
const DERIVED_INCIDENT_SOURCE = 'commerce_operations_reconciler';
const WARNING_INCIDENT_CODES = new Set([
    'payment_requires_action',
    'refund_provider_pending'
]);
const STOP_INCIDENT_CODES = new Set([
    'inventory_conflict',
    'paid_payment_intent_orphan',
    'payment_canceled_conflict',
    'payment_intent_mismatch',
    'payment_intent_orphan',
    'payment_orphan',
    'payment_succeeded_conflict',
    'refund_attempt_or_order_missing',
    'refund_mismatch',
    'refund_orphan',
    'refund_stock_divergence',
    'requires_capture_not_supported',
    'terminal_refund_conflict',
    'unknown_payment_intent_status'
]);

function healthError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function nonNegativeInteger(value, field) {
    if (!Number.isSafeInteger(value) || value < 0) throw healthError(`COMMERCE_HEALTH_INVALID:${field}`);
    return value;
}

function incidentCode(value) {
    const normalized = String(value || '').trim();
    return /^[a-z][a-z0-9_]{2,80}$/.test(normalized) ? normalized : 'unknown';
}

function isDerivedIncident(incident) {
    return incident?.source === DERIVED_INCIDENT_SOURCE ||
        incidentCode(incident?.code).startsWith('operations_');
}

function primaryIncidentSeverity(code) {
    if (WARNING_INCIDENT_CODES.has(code)) return 'warning';
    if (STOP_INCIDENT_CODES.has(code)) return 'stop';
    return 'stop';
}

function summarizePrimaryIncidents(incidents = [], { truncated = false } = {}) {
    if (!Array.isArray(incidents)) throw healthError('COMMERCE_HEALTH_INCIDENTS_INVALID');
    const histogram = {};
    const severityHistogram = { warning: 0, stop: 0 };
    for (const incident of incidents) {
        if (isDerivedIncident(incident)) continue;
        const code = incidentCode(incident?.code);
        const severity = primaryIncidentSeverity(code);
        histogram[code] = (histogram[code] || 0) + 1;
        severityHistogram[severity] += 1;
    }
    const codes = Object.keys(histogram).sort();
    return Object.freeze({
        count: Object.values(histogram).reduce((sum, value) => sum + value, 0),
        histogram: Object.freeze(histogram),
        severityHistogram: Object.freeze(severityHistogram),
        sampleCodes: Object.freeze(codes.slice(0, 10)),
        truncated: truncated === true
    });
}

function evaluateCommerceHealth(input, { evaluatedAt = null } = {}) {
    const counters = {
        dueInbox: nonNegativeInteger(input?.dueInbox ?? 0, 'dueInbox'),
        expiredInboxLeases: nonNegativeInteger(input?.expiredInboxLeases ?? 0, 'expiredInboxLeases'),
        failedOutbox: nonNegativeInteger(input?.failedOutbox ?? 0, 'failedOutbox'),
        deadLetterOutbox: nonNegativeInteger(input?.deadLetterOutbox ?? 0, 'deadLetterOutbox'),
        deliveryUnknown: nonNegativeInteger(input?.deliveryUnknown ?? 0, 'deliveryUnknown'),
        expiredHolds: nonNegativeInteger(input?.expiredHolds ?? 0, 'expiredHolds'),
        orphanPayments: nonNegativeInteger(input?.orphanPayments ?? 0, 'orphanPayments'),
        refundStockDivergences: nonNegativeInteger(
            input?.refundStockDivergences ?? 0,
            'refundStockDivergences'
        ),
        connectDrift: nonNegativeInteger(input?.connectDrift ?? 0, 'connectDrift'),
        projectionDivergences: nonNegativeInteger(
            input?.projectionDivergences ?? 0,
            'projectionDivergences'
        )
    };
    const operationalIncidents = Object.entries(counters)
        .filter(([, count]) => count > 0)
        .map(([code, count]) => ({ code, count, severity: 'stop' }));
    const primary = summarizePrimaryIncidents(input?.primaryIncidents || [], {
        truncated: input?.primaryIncidentsTruncated === true
    });
    const primaryIncidents = Object.entries(primary.histogram).map(([code, count]) => ({
        code,
        count,
        severity: primaryIncidentSeverity(code),
        source: 'primary'
    }));
    const incidents = [...operationalIncidents, ...primaryIncidents];
    if (primary.truncated) {
        incidents.push({ code: 'primaryIncidentsTruncated', count: 1, severity: 'stop' });
    }
    const hasStop = incidents.some((incident) => incident.severity === 'stop');
    const hasWarning = incidents.some((incident) => incident.severity === 'warning');
    const evaluatedAtMillis = Date.parse(evaluatedAt || '');
    const validUntil = Number.isFinite(evaluatedAtMillis)
        ? new Date(evaluatedAtMillis + HEALTH_FRESHNESS_WINDOW_MS).toISOString()
        : null;
    const content = {
        schemaVersion: 4,
        source: 'commerce_operations_reconciler',
        status: hasStop ? 'stop' : (hasWarning ? 'warning' : 'healthy'),
        counters,
        incidents,
        primaryOpenIncidentCount: primary.count,
        incidentHistogram: primary.histogram,
        severityHistogram: primary.severityHistogram,
        incidentSampleCodes: primary.sampleCodes,
        truncated: primary.truncated,
        validUntil
    };
    return Object.freeze({
        ...content,
        evaluatedAt,
        healthHash: hashPayload(content)
    });
}

function effectiveCommerceHealth(health, { nowMillis = Date.now() } = {}) {
    const evaluatedAtMillis = Date.parse(health?.evaluatedAt || '');
    const validUntilMillis = Date.parse(health?.validUntil || '');
    const stale = !Number.isFinite(evaluatedAtMillis) ||
        !Number.isFinite(validUntilMillis) ||
        nowMillis > validUntilMillis;
    return Object.freeze({
        storedStatus: health?.status || 'unknown',
        effectiveStatus: stale ? 'stop' : (health?.status || 'stop'),
        stale,
        ageSeconds: Number.isFinite(evaluatedAtMillis)
            ? Math.max(0, Math.floor((nowMillis - evaluatedAtMillis) / 1000))
            : null
    });
}

module.exports = {
    HEALTH_FRESHNESS_WINDOW_MS,
    effectiveCommerceHealth,
    evaluateCommerceHealth,
    summarizePrimaryIncidents
};
