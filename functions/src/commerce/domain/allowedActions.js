'use strict';

const { validateOrderV2 } = require('./orderState');

function actionError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function computeAllowedActions(order, actor) {
    validateOrderV2(order);
    if (!actor || typeof actor.uid !== 'string') {
        throw actionError('COMMERCE_ACTOR_INVALID');
    }
    const actions = new Set();
    const owner = actor.uid === order.userId;
    const strongAdmin = actor.role === 'admin' && actor.aal2 === true;

    if (
        owner &&
        order.checkout.status === 'active' &&
        !['succeeded', 'canceled', 'needs_review'].includes(order.payment.status)
    ) {
        actions.add('request_cancellation');
    }
    if (!strongAdmin) return [...actions].sort();

    if (order.payment.status === 'succeeded') {
        if (order.fulfillmentSummary.status === 'unfulfilled') {
            actions.add('fulfillment_prepare');
            actions.add('fulfillment_ship');
        }
        if (order.fulfillmentSummary.status === 'preparing') {
            actions.add('fulfillment_ready');
            actions.add('fulfillment_ship');
        }
        if (order.fulfillmentSummary.status === 'ready_for_pickup') {
            actions.add('fulfillment_pickup');
        }
        if (order.fulfillmentSummary.status === 'shipped') {
            actions.add('fulfillment_deliver');
            actions.add('fulfillment_update_tracking');
        }
        const refundableCents = order.amounts.capturedCents -
            order.refundAggregate.succeededCents -
            order.refundAggregate.pendingCents;
        if (refundableCents > 0) actions.add('request_refund');
        if (['customer', 'carrier'].includes(order.fulfillmentSummary.custody)) {
            actions.add('open_return');
        }
    }
    if (
        order.checkout.status === 'closed' &&
        ['delivered', 'picked_up', 'canceled'].includes(order.fulfillmentSummary.status) &&
        !['pending', 'needs_review'].includes(order.refundAggregate.status)
    ) {
        actions.add('archive_order');
    }
    return [...actions].sort();
}

function assertActionAllowed(order, actor, action) {
    if (!computeAllowedActions(order, actor).includes(action)) {
        throw actionError('COMMERCE_ACTION_NOT_ALLOWED');
    }
    return true;
}

module.exports = {
    assertActionAllowed,
    computeAllowedActions
};
