const LEGACY_PENDING = 'pending_payment';

function projectV2Status(order) {
    const ambiguous = order.status === 'needs_review' ||
        order.refundStatus === 'needs_review' ||
        order.checkout?.status === 'needs_review' ||
        order.payment?.status === 'needs_review' ||
        order.refundAggregate?.status === 'needs_review' ||
        order.inventorySummary?.status === 'conflict';
    if (ambiguous) return 'needs_review';
    if (order.refundAggregate?.status === 'full') return 'refunded';
    if (order.refundAggregate?.status === 'pending') return 'refund_pending';
    if (order.refundAggregate?.status === 'partial') return 'paid';
    if (order.payment?.status === 'succeeded' && order.fulfillmentSummary?.status === 'delivered') return 'completed';
    if (order.payment?.status === 'succeeded' && order.fulfillmentSummary?.status === 'shipped') return 'shipped';
    if (order.payment?.status === 'succeeded') return 'paid';
    if (
        order.checkout?.status === 'closed' &&
        order.payment?.status === 'canceled' &&
        order.inventorySummary?.heldQty === 0 &&
        order.inventorySummary?.releasedQty === order.inventorySummary?.reservedQty
    ) {
        return 'canceled';
    }
    return LEGACY_PENDING;
}

export function adaptCommerceOrder(order, id = null) {
    if (order?.schemaVersion === 2) {
        const status = projectV2Status(order);
        return Object.freeze({
            id,
            schemaVersion: 2,
            stateVersion: order.stateVersion,
            status,
            paymentStatus: order.payment?.status || 'needs_review',
            fulfillmentStatus: order.fulfillmentSummary?.status || 'unfulfilled',
            refundStatus: order.refundAggregate?.status || 'none',
            totalCents: Number.isSafeInteger(order.amounts?.totalCents) ? order.amounts.totalCents : null,
            currency: order.currency === 'EUR' ? 'EUR' : null,
            needsReview: status === 'needs_review'
        });
    }

    return Object.freeze({
        id,
        schemaVersion: 1,
        stateVersion: null,
        status: order?.status || LEGACY_PENDING,
        paymentStatus: order?.paymentStatus || null,
        fulfillmentStatus: null,
        refundStatus: order?.refundStatus || null,
        totalCents: Number.isFinite(Number(order?.total)) ? Math.round(Number(order.total) * 100) : null,
        currency: String(order?.currency || 'EUR').toUpperCase(),
        needsReview: order?.status === 'needs_review'
    });
}
