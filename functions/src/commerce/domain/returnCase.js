'use strict';

const { deterministicEffectId } = require('./commerceEffects');
const { validateOrderV2 } = require('./orderState');

const RETURN_STATUSES = Object.freeze([
    'pending',
    'partially_received',
    'received',
    'resolved',
    'canceled'
]);

function returnError(code, detail = null) {
    const error = new Error(detail ? `${code}:${detail}` : code);
    error.code = code;
    if (detail) error.detail = detail;
    return error;
}

function validateQuantity(value, field) {
    if (!Number.isSafeInteger(value) || value < 0) {
        throw returnError('COMMERCE_RETURN_QUANTITY_INVALID', field);
    }
}

function validateReturnCase(returnCase) {
    if (
        !returnCase ||
        returnCase.schemaVersion !== 2 ||
        !RETURN_STATUSES.includes(returnCase.status) ||
        !Number.isSafeInteger(returnCase.stateVersion) ||
        returnCase.stateVersion < 0 ||
        !Array.isArray(returnCase.lines) ||
        returnCase.lines.length === 0
    ) {
        throw returnError('COMMERCE_RETURN_INVALID');
    }
    for (const line of returnCase.lines) {
        for (const field of [
            'requestedQty',
            'receivedQty',
            'restockedQty',
            'writtenOffQty'
        ]) {
            validateQuantity(line[field], `${line.lineId}.${field}`);
        }
        if (
            line.requestedQty <= 0 ||
            line.receivedQty > line.requestedQty ||
            line.restockedQty + line.writtenOffQty > line.receivedQty
        ) {
            throw returnError('COMMERCE_RETURN_QUANTITY_CONFLICT', line.lineId);
        }
    }
    if (
        returnCase.status === 'canceled' &&
        returnCase.lines.some((line) => line.receivedQty > 0)
    ) {
        throw returnError('COMMERCE_RETURN_CANCELLATION_CONFLICT');
    }
    if (
        returnCase.status === 'resolved' &&
        returnCase.lines.some(
            (line) => line.restockedQty + line.writtenOffQty !== line.receivedQty
        )
    ) {
        throw returnError('COMMERCE_RETURN_RESOLUTION_INCOMPLETE');
    }
    return true;
}

function createReturnCase({
    order,
    returnRequestId,
    requestedLines,
    reason,
    actor,
    clock
}) {
    validateOrderV2(order);
    if (
        order.payment.status !== 'succeeded' ||
        !['customer', 'carrier'].includes(order.fulfillmentSummary.custody) ||
        typeof returnRequestId !== 'string' ||
        returnRequestId.length < 8 ||
        typeof reason !== 'string' ||
        reason.length < 3 ||
        typeof actor !== 'string' ||
        actor.length < 3 ||
        typeof clock?.now !== 'function' ||
        !Array.isArray(requestedLines) ||
        requestedLines.length === 0
    ) {
        throw returnError('COMMERCE_RETURN_CREATE_DENIED');
    }
    const orderLines = new Map(order.items.map((line) => [line.lineId, line]));
    const seen = new Set();
    const lines = requestedLines.map((requested) => {
        const orderLine = orderLines.get(requested.lineId);
        if (
            !orderLine ||
            seen.has(requested.lineId) ||
            !Number.isSafeInteger(requested.quantity) ||
            requested.quantity <= 0 ||
            requested.quantity > orderLine.quantity
        ) {
            throw returnError('COMMERCE_RETURN_QUANTITY_INVALID', requested.lineId);
        }
        seen.add(requested.lineId);
        return {
            lineId: requested.lineId,
            inventoryKey: orderLine.inventoryKey,
            requestedQty: requested.quantity,
            receivedQty: 0,
            restockedQty: 0,
            writtenOffQty: 0
        };
    });
    const now = clock.now();
    const value = {
        schemaVersion: 2,
        returnId: deterministicEffectId(['return', order.id, returnRequestId]),
        returnRequestId,
        orderId: order.id,
        status: 'pending',
        stateVersion: 0,
        reason,
        actor,
        lines,
        createdAt: now,
        updatedAt: now,
        resolvedAt: null,
        canceledAt: null
    };
    validateReturnCase(value);
    return value;
}

function updateLines(returnCase, quantities, field) {
    if (!Array.isArray(quantities) || quantities.length === 0) {
        throw returnError('COMMERCE_RETURN_QUANTITY_INVALID');
    }
    const requested = new Map();
    for (const value of quantities) {
        if (
            requested.has(value.lineId) ||
            !Number.isSafeInteger(value.quantity) ||
            value.quantity <= 0
        ) {
            throw returnError('COMMERCE_RETURN_QUANTITY_INVALID', value.lineId);
        }
        requested.set(value.lineId, value.quantity);
    }
    return returnCase.lines.map((line) => {
        const quantity = requested.get(line.lineId) || 0;
        if (quantity === 0) return { ...line };
        const next = { ...line };
        if (field === 'receivedQty') {
            if (next.receivedQty + quantity > next.requestedQty) {
                throw returnError('COMMERCE_RETURN_QUANTITY_CONFLICT', line.lineId);
            }
        } else if (
            next.restockedQty +
            next.writtenOffQty +
            quantity >
            next.receivedQty
        ) {
            throw returnError('COMMERCE_RETURN_DISPOSITION_EXCEEDED', line.lineId);
        }
        next[field] += quantity;
        return next;
    });
}

function reduceReturnCase(returnCase, event, { clock }) {
    validateReturnCase(returnCase);
    if (typeof clock?.now !== 'function') throw returnError('COMMERCE_CLOCK_REQUIRED');
    if (['resolved', 'canceled'].includes(returnCase.status)) {
        throw returnError('COMMERCE_RETURN_TERMINAL');
    }
    const next = {
        ...returnCase,
        lines: returnCase.lines.map((line) => ({ ...line }))
    };
    switch (event?.type) {
        case 'cancel':
            if (next.lines.some((line) => line.receivedQty > 0)) {
                throw returnError('COMMERCE_RETURN_CANCELLATION_CONFLICT');
            }
            next.status = 'canceled';
            next.canceledAt = clock.now();
            break;
        case 'receive':
            next.lines = updateLines(next, event.lines, 'receivedQty');
            next.status = next.lines.every((line) => line.receivedQty === line.requestedQty)
                ? 'received'
                : 'partially_received';
            break;
        case 'restock':
            next.lines = updateLines(next, event.lines, 'restockedQty');
            break;
        case 'write_off':
            next.lines = updateLines(next, event.lines, 'writtenOffQty');
            break;
        case 'resolve':
            if (next.lines.some(
                (line) => line.restockedQty + line.writtenOffQty !== line.receivedQty
            )) {
                throw returnError('COMMERCE_RETURN_RESOLUTION_INCOMPLETE');
            }
            next.status = 'resolved';
            next.resolvedAt = clock.now();
            break;
        default:
            throw returnError('COMMERCE_RETURN_TRANSITION_DENIED');
    }
    next.stateVersion += 1;
    next.updatedAt = clock.now();
    validateReturnCase(next);
    return next;
}

module.exports = {
    RETURN_STATUSES,
    createReturnCase,
    reduceReturnCase,
    validateReturnCase
};
