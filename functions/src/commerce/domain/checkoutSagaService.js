'use strict';

const {
    resumeCreateAction,
    transitionAttempt,
    validatePaymentIntentForOrder
} = require('./checkoutSaga');

function serviceError(code, cause = null) {
    const error = new Error(code);
    error.code = code;
    if (cause) error.cause = cause;
    return error;
}

function createCheckoutSagaService({ stripe, repository, clock, failpoints = null }) {
    if (
        !stripe ||
        typeof stripe.createPaymentIntent !== 'function' ||
        typeof stripe.retrievePaymentIntent !== 'function' ||
        typeof stripe.cancelPaymentIntent !== 'function' ||
        !repository ||
        typeof repository.saveAttempt !== 'function' ||
        typeof repository.releaseHeldInventory !== 'function' ||
        typeof repository.commitHeldInventory !== 'function' ||
        !clock ||
        typeof clock.now !== 'function'
    ) {
        throw serviceError('COMMERCE_CHECKOUT_SAGA_DEPENDENCY_INVALID');
    }

    async function ensurePaymentIntent({ order, attempt }) {
        const action = resumeCreateAction(attempt);
        if (action === 'return_attached_payment_intent') {
            const existing = await stripe.retrievePaymentIntent(
                attempt.paymentIntentId,
                attempt.connectedAccountId
            );
            validatePaymentIntentForOrder(existing, order, attempt);
            return {
                orderId: order.id,
                orderNumber: order.orderNumber,
                paymentIntentId: existing.id,
                clientSecret: existing.client_secret,
                shippingCents: order.amounts.shippingCents,
                discountCents: order.amounts.discountCents,
                promotion: order.promotionSnapshot || null,
                totalCents: order.amounts.totalCents,
                connectedAccountId: attempt.connectedAccountId,
                reused: true
            };
        }
        if (action !== 'create_with_same_idempotency_key') {
            throw serviceError('COMMERCE_CHECKOUT_SAGA_NOT_CREATABLE');
        }

        let current = transitionAttempt(attempt, { type: 'create_started' }, { clock });
        await repository.saveAttempt(current);
        let paymentIntent;
        try {
            paymentIntent = await stripe.createPaymentIntent({
                amount: order.amounts.totalCents,
                currency: order.currency.toLowerCase(),
                automatic_payment_methods: { enabled: true },
                metadata: {
                    orderId: order.id,
                    requestHash: order.checkout.requestHash
                }
            }, {
                idempotencyKey: current.stripeIdempotencyKey,
                connectedAccountId: current.connectedAccountId
            });
        } catch (cause) {
            current = transitionAttempt(current, { type: 'create_unknown' }, { clock });
            await repository.saveAttempt(current);
            throw serviceError('COMMERCE_STRIPE_RESULT_UNKNOWN', cause);
        }

        failpoints?.hit('create.after_stripe_response_before_attach');
        validatePaymentIntentForOrder(paymentIntent, order, current);
        current = transitionAttempt(current, {
            type: 'payment_intent_attached',
            paymentIntentId: paymentIntent.id,
            providerStatus: paymentIntent.status
        }, { clock });
        await repository.saveAttempt(current);
        failpoints?.hit('create.after_attach_before_response');
        return {
            orderId: order.id,
            orderNumber: order.orderNumber,
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            shippingCents: order.amounts.shippingCents,
            discountCents: order.amounts.discountCents,
            promotion: order.promotionSnapshot || null,
            totalCents: order.amounts.totalCents,
            connectedAccountId: current.connectedAccountId,
            reused: false
        };
    }

    async function cancelProviderFirst({ order, attempt }) {
        let current = transitionAttempt(attempt, { type: 'cancel_requested' }, { clock });
        await repository.saveAttempt(current);
        failpoints?.hit('cancel.after_request');

        let paymentIntent = current.paymentIntentId
            ? await stripe.retrievePaymentIntent(current.paymentIntentId, current.connectedAccountId)
            : null;
        if (!paymentIntent) {
            try {
                paymentIntent = await stripe.createPaymentIntent({
                    amount: order.amounts.totalCents,
                    currency: order.currency.toLowerCase(),
                    automatic_payment_methods: { enabled: true },
                    metadata: {
                        orderId: order.id,
                        requestHash: order.checkout.requestHash
                    }
                }, {
                    idempotencyKey: current.stripeIdempotencyKey,
                    connectedAccountId: current.connectedAccountId
                });
            } catch (cause) {
                throw serviceError('COMMERCE_PAYMENT_INTENT_CANCEL_UNKNOWN', cause);
            }
            validatePaymentIntentForOrder(paymentIntent, order, current);
            current = transitionAttempt(current, {
                type: 'cancel_payment_intent_attached',
                paymentIntentId: paymentIntent.id,
                providerStatus: paymentIntent.status
            }, { clock });
            await repository.saveAttempt(current);
        }
        validatePaymentIntentForOrder(paymentIntent, order, current);
        if (paymentIntent.status === 'succeeded') {
            await repository.commitHeldInventory(order, paymentIntent);
            return { outcome: 'paid', paymentIntentId: paymentIntent.id };
        }
        if (paymentIntent.status !== 'canceled') {
            try {
                paymentIntent = await stripe.cancelPaymentIntent(
                    paymentIntent.id,
                    current.connectedAccountId
                );
            } catch (cause) {
                throw serviceError('COMMERCE_PAYMENT_INTENT_CANCEL_UNKNOWN', cause);
            }
            validatePaymentIntentForOrder(paymentIntent, order, current);
        }
        if (paymentIntent.status !== 'canceled') {
            throw serviceError('COMMERCE_PAYMENT_INTENT_CANCEL_UNKNOWN');
        }
        failpoints?.hit('cancel.after_stripe_cancel_before_release');
        current = transitionAttempt(current, { type: 'provider_canceled' }, { clock });
        await repository.saveAttempt(current);
        await repository.releaseHeldInventory(order, paymentIntent);
        return { outcome: 'canceled', paymentIntentId: paymentIntent.id };
    }

    return Object.freeze({
        cancelProviderFirst,
        ensurePaymentIntent,
        hitAfterHold() {
            failpoints?.hit('create.after_hold');
        }
    });
}

module.exports = { createCheckoutSagaService };
