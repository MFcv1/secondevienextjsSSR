'use strict';

const CUSTOMER_RETURN_REQUEST_STATUSES = Object.freeze([
    'pending_review',
    'return_authorized',
    'refund_initiated',
    'refund_failed',
    'completed',
    'rejected'
]);

const CUSTOMER_RETURN_RESOLUTION_MODES = Object.freeze([
    null,
    'direct_refund',
    'return_then_refund',
    'rejected'
]);

function requestError(code, detail = null) {
    const error = new Error(detail ? `${code}:${detail}` : code);
    error.code = code;
    if (detail) error.detail = detail;
    return error;
}

function validateCustomerReturnRequest(request) {
    if (!request || request.schemaVersion !== 2) {
        throw requestError('COMMERCE_CUSTOMER_RETURN_REQUEST_SCHEMA_INVALID');
    }
    for (const field of ['requestId', 'orderId', 'userId', 'reason']) {
        if (typeof request[field] !== 'string' || request[field].length < 1) {
            throw requestError('COMMERCE_CUSTOMER_RETURN_REQUEST_INVALID', field);
        }
    }
    if (
        !CUSTOMER_RETURN_REQUEST_STATUSES.includes(request.status) ||
        !CUSTOMER_RETURN_RESOLUTION_MODES.includes(request.resolutionMode) ||
        !Number.isSafeInteger(request.stateVersion) ||
        request.stateVersion < 0 ||
        !Array.isArray(request.lines) ||
        request.lines.length < 1 ||
        request.lines.length > 50
    ) {
        throw requestError('COMMERCE_CUSTOMER_RETURN_REQUEST_INVALID');
    }
    const seen = new Set();
    for (const line of request.lines) {
        if (
            !line ||
            typeof line.lineId !== 'string' ||
            line.lineId.length < 1 ||
            seen.has(line.lineId) ||
            !Number.isSafeInteger(line.quantity) ||
            line.quantity <= 0
        ) {
            throw requestError('COMMERCE_CUSTOMER_RETURN_REQUEST_LINES_INVALID');
        }
        seen.add(line.lineId);
    }
    if (
        typeof request.note !== 'string' ||
        request.note.length > 1000 ||
        !request.createdAt ||
        !request.updatedAt
    ) {
        throw requestError('COMMERCE_CUSTOMER_RETURN_REQUEST_INVALID');
    }
    return true;
}

function createCustomerReturnRequest({
    requestId,
    order,
    lines,
    reason,
    note,
    requestHash,
    clock
}) {
    const now = clock.now();
    const request = {
        schemaVersion: 2,
        requestId,
        orderId: order.id,
        userId: order.userId,
        status: 'pending_review',
        resolutionMode: null,
        stateVersion: 0,
        lines: lines.map((line) => ({ ...line })),
        reason,
        note,
        requestHash,
        returnId: null,
        refundRequestId: null,
        decidedBy: null,
        decisionReason: null,
        createdAt: now,
        updatedAt: now,
        decidedAt: null
    };
    validateCustomerReturnRequest(request);
    return request;
}

function transitionCustomerReturnRequest(request, event, { clock }) {
    validateCustomerReturnRequest(request);
    const next = { ...request, lines: request.lines.map((line) => ({ ...line })) };
    const now = clock.now();
    if (event?.type === 'reject') {
        if (request.status !== 'pending_review') {
            throw requestError('COMMERCE_CUSTOMER_RETURN_REQUEST_TRANSITION_DENIED');
        }
        next.status = 'rejected';
        next.resolutionMode = 'rejected';
    } else if (event?.type === 'authorize_return') {
        if (request.status !== 'pending_review' && request.status !== 'return_authorized') {
            throw requestError('COMMERCE_CUSTOMER_RETURN_REQUEST_TRANSITION_DENIED');
        }
        next.status = 'return_authorized';
        next.resolutionMode = 'return_then_refund';
        next.returnId = event.returnId;
    } else if (event?.type === 'refund_started') {
        if (!['pending_review', 'return_authorized', 'refund_failed'].includes(request.status)) {
            throw requestError('COMMERCE_CUSTOMER_RETURN_REQUEST_TRANSITION_DENIED');
        }
        next.status = event.outcome === 'succeeded'
            ? 'completed'
            : (event.outcome === 'failed' ? 'refund_failed' : 'refund_initiated');
        next.resolutionMode = event.mode;
        next.refundRequestId = event.refundRequestId;
    } else {
        throw requestError('COMMERCE_CUSTOMER_RETURN_REQUEST_TRANSITION_DENIED');
    }
    next.stateVersion += 1;
    next.decidedBy = event.actorUid;
    next.decisionReason = event.reason;
    next.decidedAt = next.decidedAt || now;
    next.updatedAt = now;
    validateCustomerReturnRequest(next);
    return next;
}

module.exports = {
    CUSTOMER_RETURN_REQUEST_STATUSES,
    createCustomerReturnRequest,
    transitionCustomerReturnRequest,
    validateCustomerReturnRequest
};
