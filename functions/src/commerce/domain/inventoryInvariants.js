'use strict';

const INVENTORY_STATUSES = Object.freeze([
    'held',
    'committed',
    'released',
    'restocked',
    'written_off',
    'disposed',
    'mixed',
    'conflict'
]);

const QUANTITY_FIELDS = Object.freeze([
    'reservedQty',
    'heldQty',
    'committedQty',
    'releasedQty',
    'dispositionPendingQty',
    'restockedQty',
    'writtenOffQty'
]);

function inventoryError(code, field) {
    const error = new Error(field ? `${code}:${field}` : code);
    error.code = code;
    if (field) error.field = field;
    return error;
}

function assertQuantity(value, field, { positive = false } = {}) {
    if (!Number.isSafeInteger(value) || value < (positive ? 1 : 0)) {
        throw inventoryError('COMMERCE_INVENTORY_INVALID_QUANTITY', field);
    }
    return value;
}

function deriveInventoryStatus(summary) {
    if (summary.status === 'conflict') return 'conflict';
    const active = [
        ['heldQty', 'held'],
        ['committedQty', 'committed'],
        ['releasedQty', 'released'],
        ['restockedQty', 'restocked'],
        ['writtenOffQty', 'written_off']
    ].filter(([field]) => summary[field] > 0);
    if (active.length > 1) return 'mixed';
    if (active.length === 1) return active[0][1];
    return summary.reservedQty === 0 ? 'released' : 'conflict';
}

function validateInventorySummary(summary) {
    if (!summary || typeof summary !== 'object' || Array.isArray(summary)) {
        throw inventoryError('COMMERCE_INVENTORY_INVALID_SHAPE');
    }
    if (!INVENTORY_STATUSES.includes(summary.status)) {
        throw inventoryError('COMMERCE_INVENTORY_INVALID_STATUS', 'status');
    }
    for (const field of QUANTITY_FIELDS) assertQuantity(summary[field], field);

    const accounted = summary.heldQty +
        summary.committedQty +
        summary.releasedQty +
        summary.restockedQty +
        summary.writtenOffQty;
    if (accounted !== summary.reservedQty) {
        throw inventoryError('COMMERCE_INVENTORY_ACCOUNTING_MISMATCH');
    }
    if (summary.dispositionPendingQty > summary.committedQty) {
        throw inventoryError('COMMERCE_INVENTORY_DISPOSITION_EXCEEDS_COMMITTED');
    }
    const derived = deriveInventoryStatus(summary);
    if (summary.status !== derived && summary.status !== 'disposed') {
        throw inventoryError('COMMERCE_INVENTORY_STATUS_MISMATCH', 'status');
    }
    return true;
}

function createHeldInventorySummary(quantity) {
    assertQuantity(quantity, 'reservedQty', { positive: true });
    return {
        status: 'held',
        reservedQty: quantity,
        heldQty: quantity,
        committedQty: 0,
        releasedQty: 0,
        dispositionPendingQty: 0,
        restockedQty: 0,
        writtenOffQty: 0
    };
}

module.exports = {
    INVENTORY_STATUSES,
    QUANTITY_FIELDS,
    assertQuantity,
    createHeldInventorySummary,
    deriveInventoryStatus,
    validateInventorySummary
};
