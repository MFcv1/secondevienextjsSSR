'use strict';

function repositoryError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function createCheckoutSagaRepository({
    db,
    checkoutRepository,
    paymentEffectApplier
}) {
    if (
        typeof db?.runTransaction !== 'function' ||
        typeof checkoutRepository?.saveAttempt !== 'function' ||
        typeof paymentEffectApplier?.apply !== 'function'
    ) {
        throw repositoryError('COMMERCE_CHECKOUT_SAGA_REPOSITORY_DEPENDENCY_INVALID');
    }

    async function settle(order, paymentIntent) {
        if (!order?.id || !paymentIntent?.id) {
            throw repositoryError('COMMERCE_CHECKOUT_SETTLEMENT_INVALID');
        }
        const accountId = order.payment?.connectedAccountId || null;
        return db.runTransaction((transaction) => paymentEffectApplier.apply(transaction, {
            entry: {
                scope: accountId ? 'connect' : 'platform',
                accountId
            },
            paymentIntent
        }));
    }

    return Object.freeze({
        saveAttempt: (attempt) => checkoutRepository.saveAttempt(attempt),
        commitHeldInventory: settle,
        releaseHeldInventory: settle
    });
}

module.exports = { createCheckoutSagaRepository };
