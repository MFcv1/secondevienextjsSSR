'use strict';

const INCIDENT_SCHEMA_VERSION = 1;
const INCIDENT_CATEGORIES = new Set([
    'payment', 'refund', 'inventory', 'email', 'webhook', 'worker', 'projection', 'unknown'
]);
const WARNING_CODES = new Set(['payment_requires_action', 'refund_provider_pending']);
const CODE_CONTRACT = Object.freeze({
    REFUND_EXCEEDS_CAPTURE: ['critical', 'projection'],
    inventory_conflict: ['critical', 'inventory'],
    refund_stock_divergence: ['critical', 'inventory'],
    operations_expiredHolds: ['critical', 'inventory'],
    operations_refundStockDivergences: ['critical', 'inventory'],
    operations_dueInbox: ['critical', 'webhook'],
    operations_expiredInboxLeases: ['critical', 'webhook'],
    operations_failedOutbox: ['critical', 'email'],
    operations_deadLetterOutbox: ['critical', 'email'],
    operations_deliveryUnknown: ['critical', 'email'],
    operations_projectionDivergences: ['critical', 'projection'],
    operations_connectDrift: ['critical', 'payment'],
    operations_orphanPayments: ['critical', 'payment']
});

function normalizeIncidentCode(value) {
    const code = String(value || '').trim();
    return /^[A-Za-z][A-Za-z0-9_]{2,100}$/.test(code) ? code : 'unknown';
}

function classifyIncidentCode(value) {
    const code = normalizeIncidentCode(value);
    const exact = CODE_CONTRACT[code];
    if (exact) return Object.freeze({ code, severity: exact[0], category: exact[1], known: true });
    if (WARNING_CODES.has(code)) {
        const category = code.startsWith('refund_') ? 'refund' : 'payment';
        return Object.freeze({ code, severity: 'warning', category, known: true });
    }
    const patterns = [
        [/^(paid_payment_|payment_|requires_capture_|unknown_payment_)/, 'payment'],
        [/^(refund_|terminal_refund_)/, 'refund'],
        [/^(inventory_|operations_expiredHolds|operations_refundStockDivergences)/, 'inventory'],
        [/^operations_(dueInbox|expiredInboxLeases)/, 'webhook'],
        [/^operations_(failedOutbox|deadLetterOutbox|deliveryUnknown)/, 'email'],
        [/^operations_projectionDivergences/, 'projection'],
        [/^worker_/, 'worker']
    ];
    const match = patterns.find(([pattern]) => pattern.test(code));
    if (match) return Object.freeze({ code, severity: 'critical', category: match[1], known: true });
    return Object.freeze({ code, severity: 'critical', category: 'unknown', known: false });
}

function isIncidentActive(incident) {
    return Boolean(incident) && !['closed', 'resolved', 'inactive'].includes(String(incident.status || 'open'));
}

function normalizeIncidentState(incident) {
    if (!incident) return Object.freeze({ active: false, severity: null, category: null, code: null });
    const classification = classifyIncidentCode(incident.code);
    const severity = ['critical', 'warning'].includes(incident.severity)
        ? incident.severity
        : classification.severity;
    const category = INCIDENT_CATEGORIES.has(incident.category)
        ? incident.category
        : classification.category;
    return Object.freeze({
        active: isIncidentActive(incident),
        severity,
        category,
        code: classification.code,
        known: classification.known
    });
}

function incidentStateAffectsSummary(before, after) {
    const left = normalizeIncidentState(before);
    const right = normalizeIncidentState(after);
    if (!left.active && !right.active) return false;
    return left.active !== right.active || left.severity !== right.severity ||
        left.category !== right.category || left.code !== right.code;
}

function buildIncidentSummaryDelta(before, after) {
    const left = normalizeIncidentState(before);
    const right = normalizeIncidentState(after);
    const contribution = (state) => ({
        activeCritical: state.active && state.severity === 'critical' ? 1 : 0,
        activeWarnings: state.active && state.severity === 'warning' ? 1 : 0,
        activeTotal: state.active ? 1 : 0
    });
    const previous = contribution(left);
    const next = contribution(right);
    return Object.freeze({
        activeCritical: next.activeCritical - previous.activeCritical,
        activeWarnings: next.activeWarnings - previous.activeWarnings,
        activeTotal: next.activeTotal - previous.activeTotal,
        latestCategory: right.active ? right.category : null,
        opened: !left.active && right.active,
        resolved: left.active && !right.active,
        state: right
    });
}

function applyIncidentSummaryDelta(summary, delta) {
    const next = {
        activeCritical: Number(summary?.activeCritical || 0) + Number(delta?.activeCritical || 0),
        activeWarnings: Number(summary?.activeWarnings || 0) + Number(delta?.activeWarnings || 0),
        activeTotal: Number(summary?.activeTotal || 0) + Number(delta?.activeTotal || 0)
    };
    if (!Object.values(next).every((value) => Number.isSafeInteger(value) && value >= 0) ||
        next.activeTotal !== next.activeCritical + next.activeWarnings) {
        const error = new Error('ADMIN_INCIDENT_SUMMARY_INVALID');
        error.code = 'ADMIN_INCIDENT_SUMMARY_INVALID';
        throw error;
    }
    return Object.freeze(next);
}

module.exports = {
    CODE_CONTRACT,
    INCIDENT_SCHEMA_VERSION,
    applyIncidentSummaryDelta,
    buildIncidentSummaryDelta,
    classifyIncidentCode,
    incidentStateAffectsSummary,
    isIncidentActive,
    normalizeIncidentCode,
    normalizeIncidentState
};
