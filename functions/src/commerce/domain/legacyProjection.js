'use strict';

const LEGACY_PROJECTION_VERSION = 1;

function projectionError(code, field) {
    const error = new Error(field ? `${code}:${field}` : code);
    error.code = code;
    if (field) error.field = field;
    return error;
}

function projectLegacyOrder(order) {
    const payment = order.payment || {};
    const checkout = order.checkout || {};
    const fulfillment = order.fulfillmentSummary || {};
    const refund = order.refundAggregate || {};
    const inventory = order.inventorySummary || {};
    const ambiguous = checkout.status === 'needs_review' ||
        payment.status === 'needs_review' ||
        refund.status === 'needs_review' ||
        inventory.status === 'conflict';

    let status = 'pending_payment';
    if (ambiguous) {
        status = 'needs_review';
    } else if (refund.status === 'full') {
        status = 'refunded';
    } else if (refund.status === 'pending') {
        status = 'refund_pending';
    } else if (refund.status === 'partial') {
        status = 'paid';
    } else if (payment.status === 'succeeded' && fulfillment.status === 'delivered') {
        status = 'completed';
    } else if (payment.status === 'succeeded' && fulfillment.status === 'shipped') {
        status = 'shipped';
    } else if (payment.status === 'succeeded') {
        status = 'paid';
    } else if (
        checkout.status === 'closed' &&
        payment.status === 'canceled' &&
        inventory.heldQty === 0 &&
        inventory.releasedQty === inventory.reservedQty
    ) {
        status = 'canceled';
    }

    return {
        legacyProjectionVersion: LEGACY_PROJECTION_VERSION,
        status,
        paymentStatus: payment.status || null,
        total: Number.isSafeInteger(order.amounts?.totalCents)
            ? order.amounts.totalCents / 100
            : null,
        refundStatus: refund.status || null,
        refundAmount: Number.isSafeInteger(order.amounts?.refundedCents)
            ? order.amounts.refundedCents
            : null
    };
}

function applyLegacyProjection(order) {
    return {
        ...order,
        ...projectLegacyOrder(order)
    };
}

function validateLegacyProjection(order) {
    const expected = projectLegacyOrder(order);
    for (const field of [
        'legacyProjectionVersion',
        'status',
        'paymentStatus',
        'total',
        'refundStatus',
        'refundAmount'
    ]) {
        if (order[field] !== expected[field]) {
            throw projectionError('COMMERCE_LEGACY_PROJECTION_MISMATCH', field);
        }
    }
    return true;
}

module.exports = {
    LEGACY_PROJECTION_VERSION,
    applyLegacyProjection,
    projectLegacyOrder,
    validateLegacyProjection
};
