'use strict';

const crypto = require('node:crypto');
const { validateOrderV2 } = require('./orderState');

const REFUND_ATTEMPT_STATUSES = Object.freeze([
    'pending',
    'inflight',
    'unknown',
    'provider_pending',
    'succeeded',
    'failed'
]);

function refundError(code, detail = null) {
    const error = new Error(detail ? `${code}:${detail}` : code);
    error.code = code;
    if (detail) error.detail = detail;
    return error;
}

function refundIdempotencyKey(orderId, refundRequestId) {
    const digest = crypto.createHash('sha256')
        .update(`v1|refund.create|${orderId}|${refundRequestId}`)
        .digest('hex');
    return `sv_refund_v1_${digest}`;
}

function validateRefundAttempt(attempt) {
    if (
        !attempt ||
        attempt.schemaVersion !== 2 ||
        !REFUND_ATTEMPT_STATUSES.includes(attempt.status) ||
        !Number.isSafeInteger(attempt.stateVersion) ||
        attempt.stateVersion < 0 ||
        !Number.isSafeInteger(attempt.amountCents) ||
        attempt.amountCents <= 0 ||
        typeof attempt.stripeIdempotencyKey !== 'string' ||
        typeof attempt.connectedAccountId !== 'string'
    ) {
        throw refundError('COMMERCE_REFUND_ATTEMPT_INVALID');
    }
    return true;
}

function createRefundAttempt({
    order,
    refundRequestId,
    amountCents,
    actorUid,
    reason,
    clock
}) {
    validateOrderV2(order);
    const available = order.amounts.capturedCents -
        order.refundAggregate.succeededCents -
        order.refundAggregate.pendingCents;
    if (
        order.payment.status !== 'succeeded' ||
        typeof refundRequestId !== 'string' ||
        refundRequestId.length < 8 ||
        !Number.isSafeInteger(amountCents) ||
        amountCents <= 0 ||
        amountCents > available ||
        typeof actorUid !== 'string' ||
        actorUid.length < 3 ||
        typeof reason !== 'string' ||
        reason.length < 3 ||
        typeof clock?.now !== 'function'
    ) {
        throw refundError('COMMERCE_REFUND_REQUEST_INVALID');
    }
    const now = clock.now();
    const attempt = {
        schemaVersion: 2,
        stateVersion: 0,
        refundRequestId,
        orderId: order.id,
        amountCents,
        currency: order.currency,
        paymentIntentId: order.payment.paymentIntentId,
        connectedAccountId: order.payment.connectedAccountId,
        stripeIdempotencyKey: refundIdempotencyKey(order.id, refundRequestId),
        refundId: null,
        providerStatus: null,
        status: 'pending',
        actorUid,
        reason,
        createdAt: now,
        updatedAt: now
    };
    validateRefundAttempt(attempt);
    return attempt;
}

function transitionRefundAttempt(attempt, event, { clock }) {
    validateRefundAttempt(attempt);
    if (typeof clock?.now !== 'function') throw refundError('COMMERCE_CLOCK_REQUIRED');
    if (['succeeded', 'failed'].includes(attempt.status)) return attempt;
    const next = { ...attempt };
    switch (event?.type) {
        case 'create_started':
            if (!['pending', 'inflight', 'unknown', 'provider_pending'].includes(next.status)) {
                throw refundError('COMMERCE_REFUND_TRANSITION_DENIED');
            }
            next.status = 'inflight';
            break;
        case 'create_unknown':
            if (next.status !== 'inflight') throw refundError('COMMERCE_REFUND_TRANSITION_DENIED');
            next.status = 'unknown';
            break;
        case 'provider_observed':
            if (typeof event.refundId !== 'string' || !event.refundId.startsWith('re_')) {
                throw refundError('COMMERCE_REFUND_PROVIDER_INVALID');
            }
            if (next.refundId && next.refundId !== event.refundId) {
                throw refundError('COMMERCE_REFUND_PROVIDER_MISMATCH');
            }
            next.refundId = event.refundId;
            next.providerStatus = event.providerStatus;
            if (event.providerStatus === 'succeeded') next.status = 'succeeded';
            else if (['failed', 'canceled'].includes(event.providerStatus)) next.status = 'failed';
            else next.status = 'provider_pending';
            break;
        default:
            throw refundError('COMMERCE_REFUND_TRANSITION_DENIED');
    }
    next.stateVersion += 1;
    next.updatedAt = clock.now();
    validateRefundAttempt(next);
    return next;
}

function validateProviderRefund(refund, order, attempt) {
    const errors = [];
    const paymentIntentId = typeof refund?.payment_intent === 'string'
        ? refund.payment_intent
        : refund?.payment_intent?.id;
    if (!refund?.id?.startsWith('re_')) errors.push('refund_id');
    if (paymentIntentId !== attempt.paymentIntentId) errors.push('payment_intent');
    if (refund.amount !== attempt.amountCents) errors.push('amount');
    if (String(refund.currency || '').toUpperCase() !== order.currency) errors.push('currency');
    if (refund.metadata?.orderId !== order.id) errors.push('order_id');
    if (refund.metadata?.refundRequestId !== attempt.refundRequestId) errors.push('request_id');
    if ((refund.connectedAccountId || null) !== (attempt.connectedAccountId || null)) {
        errors.push('connected_account');
    }
    if (errors.length > 0) throw refundError('COMMERCE_REFUND_PROVIDER_MISMATCH', errors.join(','));
    return true;
}

module.exports = {
    REFUND_ATTEMPT_STATUSES,
    createRefundAttempt,
    refundIdempotencyKey,
    transitionRefundAttempt,
    validateProviderRefund,
    validateRefundAttempt
};
