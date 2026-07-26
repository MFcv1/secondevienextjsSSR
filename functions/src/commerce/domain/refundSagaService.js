'use strict';

const {
    transitionRefundAttempt,
    validateProviderRefund
} = require('./refundSaga');

function serviceError(code, cause = null) {
    const error = new Error(code);
    error.code = code;
    if (cause) error.cause = cause;
    return error;
}

function createRefundSagaService({ stripe, repository, clock, failpoints = null }) {
    if (
        typeof stripe?.createRefund !== 'function' ||
        typeof stripe?.retrieveRefund !== 'function' ||
        typeof repository?.saveAttempt !== 'function' ||
        typeof repository?.confirmRefund !== 'function' ||
        typeof repository?.failRefund !== 'function' ||
        typeof clock?.now !== 'function'
    ) {
        throw serviceError('COMMERCE_REFUND_SAGA_DEPENDENCY_INVALID');
    }

    async function ensureRefund({ order, attempt }) {
        if (attempt.status === 'succeeded') {
            return { outcome: 'succeeded', refundId: attempt.refundId, reused: true };
        }
        if (attempt.status === 'failed') {
            return { outcome: 'failed', refundId: attempt.refundId, reused: true };
        }
        let current = transitionRefundAttempt(attempt, { type: 'create_started' }, { clock });
        await repository.saveAttempt(current);
        let refund = current.refundId
            ? await stripe.retrieveRefund(current.refundId, current.connectedAccountId)
            : null;
        if (!refund) {
            try {
                refund = await stripe.createRefund({
                    payment_intent: current.paymentIntentId,
                    amount: current.amountCents,
                    metadata: {
                        orderId: order.id,
                        refundRequestId: current.refundRequestId
                    }
                }, {
                    idempotencyKey: current.stripeIdempotencyKey,
                    connectedAccountId: current.connectedAccountId
                });
            } catch (cause) {
                current = transitionRefundAttempt(current, {
                    type: 'create_unknown'
                }, { clock });
                await repository.saveAttempt(current);
                throw serviceError('COMMERCE_REFUND_RESULT_UNKNOWN', cause);
            }
        }
        failpoints?.hit('refund.after_provider_response_before_persist');
        validateProviderRefund(refund, order, current);
        current = transitionRefundAttempt(current, {
            type: 'provider_observed',
            refundId: refund.id,
            providerStatus: refund.status
        }, { clock });
        if (current.status === 'succeeded') {
            await repository.confirmRefund(order, current, refund);
            return { outcome: 'succeeded', refundId: refund.id, reused: false };
        }
        if (current.status === 'failed') {
            await repository.failRefund(order, current, refund);
            return { outcome: 'failed', refundId: refund.id, reused: false };
        }
        await repository.saveAttempt(current);
        return { outcome: 'pending', refundId: refund.id, reused: false };
    }

    return Object.freeze({ ensureRefund });
}

module.exports = { createRefundSagaService };
