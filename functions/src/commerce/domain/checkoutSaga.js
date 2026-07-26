'use strict';

const crypto = require('node:crypto');

const ATTEMPT_STATUSES = Object.freeze([
    'create_pending',
    'create_inflight',
    'create_unknown',
    'attached',
    'cancel_requested',
    'canceled',
    'needs_review'
]);

function sagaError(code, detail) {
    const error = new Error(detail ? `${code}:${detail}` : code);
    error.code = code;
    if (detail) error.detail = detail;
    return error;
}

function stripeIdempotencyKey(orderId, attemptId) {
    const digest = crypto.createHash('sha256')
        .update(`v1|payment_intent.create|${orderId}|${attemptId}`)
        .digest('hex');
    return `sv_checkout_v1_${digest}`;
}

function createPaymentAttempt({
    orderId,
    attemptId,
    requestHash,
    connectedAccountId,
    clock
}) {
    if (!clock || typeof clock.now !== 'function') throw sagaError('COMMERCE_CLOCK_REQUIRED');
    for (const [field, value] of Object.entries({ orderId, attemptId, requestHash, connectedAccountId })) {
        if (typeof value !== 'string' || value.length < 8 || value.length > 200) {
            throw sagaError('COMMERCE_PAYMENT_ATTEMPT_INVALID', field);
        }
    }
    const now = clock.now();
    return {
        schemaVersion: 2,
        stateVersion: 0,
        status: 'create_pending',
        orderId,
        attemptId,
        stripeIdempotencyKey: stripeIdempotencyKey(orderId, attemptId),
        requestHash,
        paymentIntentId: null,
        connectedAccountId,
        providerStatus: null,
        leaseToken: null,
        processingUntil: null,
        createdAt: now,
        updatedAt: now
    };
}

function validatePaymentAttempt(attempt) {
    if (
        !attempt ||
        attempt.schemaVersion !== 2 ||
        !Number.isSafeInteger(attempt.stateVersion) ||
        attempt.stateVersion < 0 ||
        !ATTEMPT_STATUSES.includes(attempt.status) ||
        typeof attempt.stripeIdempotencyKey !== 'string' ||
        typeof attempt.connectedAccountId !== 'string'
    ) {
        throw sagaError('COMMERCE_PAYMENT_ATTEMPT_INVALID');
    }
    if (attempt.status === 'attached' && !attempt.paymentIntentId) {
        throw sagaError('COMMERCE_PAYMENT_ATTEMPT_INVALID', 'paymentIntentId');
    }
    return true;
}

function transitionAttempt(attempt, event, { clock }) {
    validatePaymentAttempt(attempt);
    if (!clock || typeof clock.now !== 'function') throw sagaError('COMMERCE_CLOCK_REQUIRED');
    const next = { ...attempt };
    switch (event.type) {
        case 'create_started':
            if (!['create_pending', 'create_unknown', 'create_inflight'].includes(next.status)) {
                throw sagaError('COMMERCE_PAYMENT_ATTEMPT_TRANSITION_DENIED', event.type);
            }
            next.status = 'create_inflight';
            break;
        case 'create_unknown':
            if (next.status !== 'create_inflight') {
                throw sagaError('COMMERCE_PAYMENT_ATTEMPT_TRANSITION_DENIED', event.type);
            }
            next.status = 'create_unknown';
            break;
        case 'payment_intent_attached':
            if (!['create_pending', 'create_inflight', 'create_unknown'].includes(next.status)) {
                if (next.status === 'attached' && next.paymentIntentId === event.paymentIntentId) return attempt;
                throw sagaError('COMMERCE_PAYMENT_ATTEMPT_TRANSITION_DENIED', event.type);
            }
            if (typeof event.paymentIntentId !== 'string' || !event.paymentIntentId.startsWith('pi_')) {
                throw sagaError('COMMERCE_PAYMENT_INTENT_INVALID');
            }
            next.status = 'attached';
            next.paymentIntentId = event.paymentIntentId;
            next.providerStatus = event.providerStatus;
            break;
        case 'cancel_requested':
            if (next.status === 'canceled') return attempt;
            if (next.status === 'cancel_requested') return attempt;
            if (next.status === 'needs_review') {
                throw sagaError('COMMERCE_PAYMENT_ATTEMPT_TRANSITION_DENIED', event.type);
            }
            next.status = 'cancel_requested';
            break;
        case 'cancel_payment_intent_attached':
            if (next.status !== 'cancel_requested') {
                throw sagaError('COMMERCE_PAYMENT_ATTEMPT_TRANSITION_DENIED', event.type);
            }
            if (typeof event.paymentIntentId !== 'string' || !event.paymentIntentId.startsWith('pi_')) {
                throw sagaError('COMMERCE_PAYMENT_INTENT_INVALID');
            }
            if (next.paymentIntentId && next.paymentIntentId !== event.paymentIntentId) {
                throw sagaError('COMMERCE_PAYMENT_INTENT_MISMATCH', 'payment_intent_id');
            }
            next.paymentIntentId = event.paymentIntentId;
            next.providerStatus = event.providerStatus;
            break;
        case 'provider_canceled':
            if (next.status === 'canceled') return attempt;
            if (next.status !== 'cancel_requested') {
                throw sagaError('COMMERCE_PAYMENT_ATTEMPT_TRANSITION_DENIED', event.type);
            }
            next.status = 'canceled';
            next.providerStatus = 'canceled';
            break;
        case 'needs_review':
            next.status = 'needs_review';
            next.providerStatus = event.reason || next.providerStatus;
            break;
        default:
            throw sagaError('COMMERCE_PAYMENT_ATTEMPT_TRANSITION_DENIED', event.type);
    }
    next.stateVersion += 1;
    next.updatedAt = clock.now();
    validatePaymentAttempt(next);
    return next;
}

function validatePaymentIntentForOrder(paymentIntent, order, attempt) {
    const errors = [];
    if (!paymentIntent || typeof paymentIntent.id !== 'string' || !paymentIntent.id.startsWith('pi_')) {
        errors.push('payment_intent_id');
    }
    if (paymentIntent.amount !== order.amounts?.totalCents) errors.push('amount');
    if (String(paymentIntent.currency || '').toUpperCase() !== order.currency) errors.push('currency');
    if (paymentIntent.metadata?.orderId !== order.id) errors.push('order_id');
    if (paymentIntent.metadata?.requestHash !== order.checkout?.requestHash) errors.push('request_hash');
    if ((paymentIntent.connectedAccountId || null) !== (attempt.connectedAccountId || null)) {
        errors.push('connected_account');
    }
    if (errors.length > 0) throw sagaError('COMMERCE_PAYMENT_INTENT_MISMATCH', errors.join(','));
    return true;
}

function resumeCreateAction(attempt) {
    validatePaymentAttempt(attempt);
    if (['create_pending', 'create_inflight', 'create_unknown'].includes(attempt.status)) {
        return 'create_with_same_idempotency_key';
    }
    if (attempt.status === 'attached') return 'return_attached_payment_intent';
    if (attempt.status === 'cancel_requested') return 'reconcile_then_cancel';
    if (attempt.status === 'canceled') return 'closed';
    return 'needs_review';
}

module.exports = {
    ATTEMPT_STATUSES,
    createPaymentAttempt,
    resumeCreateAction,
    stripeIdempotencyKey,
    transitionAttempt,
    validatePaymentAttempt,
    validatePaymentIntentForOrder
};
