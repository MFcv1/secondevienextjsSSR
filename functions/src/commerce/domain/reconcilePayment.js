'use strict';

const { reduceOrder } = require('./orderState');

const NON_TERMINAL_PROVIDER_STATUSES = Object.freeze([
    'requires_payment_method',
    'requires_confirmation',
    'requires_action',
    'processing'
]);

function reconcileError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function buildCommerceIncident({
    code,
    orderId = null,
    providerObjectId = null,
    details = null,
    clock
}) {
    if (!clock || typeof clock.now !== 'function' || typeof code !== 'string') {
        throw reconcileError('COMMERCE_INCIDENT_INVALID');
    }
    return {
        schemaVersion: 2,
        status: 'open',
        code,
        orderId,
        providerObjectId,
        details,
        createdAt: clock.now(),
        resolvedAt: null
    };
}

function reconcilePaymentIntent({ order, paymentIntent, clock }) {
    if (!paymentIntent || typeof paymentIntent.status !== 'string') {
        throw reconcileError('COMMERCE_PAYMENT_RECONCILIATION_INVALID');
    }
    if (!order) {
        return {
            action: 'incident',
            order: null,
            incident: buildCommerceIncident({
                code: paymentIntent.status === 'succeeded'
                    ? 'paid_payment_intent_orphan'
                    : 'payment_intent_orphan',
                providerObjectId: paymentIntent.id || null,
                clock
            })
        };
    }
    if (paymentIntent.status === 'succeeded') {
        const nextOrder = reduceOrder(order, {
            type: 'payment_succeeded',
            amountCents: paymentIntent.amount,
            currency: String(paymentIntent.currency || '').toUpperCase(),
            paymentIntentId: paymentIntent.id
        }, { clock });
        if (nextOrder.payment.status !== 'succeeded') {
            return {
                action: 'incident',
                order: nextOrder,
                incident: buildCommerceIncident({
                    code: 'payment_succeeded_conflict',
                    orderId: order.id || null,
                    providerObjectId: paymentIntent.id || null,
                    clock
                })
            };
        }
        return {
            action: 'commit',
            order: nextOrder,
            incident: null
        };
    }
    if (paymentIntent.status === 'canceled') {
        const nextOrder = reduceOrder(order, {
            type: 'payment_canceled',
            closeReason: 'canceled'
        }, { clock });
        if (nextOrder.payment.status !== 'canceled') {
            return {
                action: 'incident',
                order: nextOrder,
                incident: buildCommerceIncident({
                    code: 'payment_canceled_conflict',
                    orderId: order.id || null,
                    providerObjectId: paymentIntent.id || null,
                    clock
                })
            };
        }
        return {
            action: 'release',
            order: nextOrder,
            incident: null
        };
    }
    if (paymentIntent.status === 'requires_capture') {
        return {
            action: 'incident',
            order: reduceOrder(order, {
                type: 'mark_needs_review',
                reason: 'requires_capture_not_supported'
            }, { clock }),
            incident: buildCommerceIncident({
                code: 'requires_capture_not_supported',
                orderId: order.id || null,
                providerObjectId: paymentIntent.id || null,
                clock
            })
        };
    }
    if (NON_TERMINAL_PROVIDER_STATUSES.includes(paymentIntent.status)) {
        const eventType = {
            requires_payment_method: 'payment_method_refused',
            requires_confirmation: 'payment_requires_confirmation',
            requires_action: 'payment_requires_action',
            processing: 'payment_processing'
        }[paymentIntent.status];
        return {
            action: 'keep_hold',
            order: reduceOrder(order, {
                type: eventType,
                providerStatus: paymentIntent.status
            }, { clock }),
            incident: null
        };
    }
    return {
        action: 'incident',
        order: reduceOrder(order, {
            type: 'mark_needs_review',
            reason: `unknown_provider_status:${paymentIntent.status}`
        }, { clock }),
        incident: buildCommerceIncident({
            code: 'unknown_payment_intent_status',
            orderId: order.id || null,
            providerObjectId: paymentIntent.id || null,
            details: { status: paymentIntent.status },
            clock
        })
    };
}

module.exports = {
    NON_TERMINAL_PROVIDER_STATUSES,
    buildCommerceIncident,
    reconcilePaymentIntent
};
