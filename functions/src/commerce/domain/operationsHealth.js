'use strict';

const { hashPayload } = require('./idempotency');

function healthError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function nonNegativeInteger(value, field) {
    if (!Number.isSafeInteger(value) || value < 0) throw healthError(`COMMERCE_HEALTH_INVALID:${field}`);
    return value;
}

function evaluateCommerceHealth(input, { evaluatedAt = null } = {}) {
    const counters = {
        dueInbox: nonNegativeInteger(input?.dueInbox ?? 0, 'dueInbox'),
        expiredInboxLeases: nonNegativeInteger(input?.expiredInboxLeases ?? 0, 'expiredInboxLeases'),
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
    const incidents = Object.entries(counters)
        .filter(([, count]) => count > 0)
        .map(([code, count]) => ({ code, count, severity: 'stop' }));
    const content = {
        schemaVersion: 2,
        source: 'commerce_operations_reconciler',
        status: incidents.length ? 'stop' : 'healthy',
        counters,
        incidents
    };
    return Object.freeze({
        ...content,
        evaluatedAt,
        healthHash: hashPayload(content)
    });
}

module.exports = { evaluateCommerceHealth };
