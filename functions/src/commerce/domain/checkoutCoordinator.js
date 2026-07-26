'use strict';

function coordinatorError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function createCheckoutCoordinator({ checkoutRepository, sagaService }) {
    if (
        !checkoutRepository ||
        typeof checkoutRepository.prepareCheckout !== 'function' ||
        typeof checkoutRepository.loadOwnedCheckout !== 'function' ||
        !sagaService ||
        typeof sagaService.ensurePaymentIntent !== 'function' ||
        typeof sagaService.hitAfterHold !== 'function'
    ) {
        throw coordinatorError('COMMERCE_CHECKOUT_COORDINATOR_DEPENDENCY_INVALID');
    }

    async function createCheckout(request) {
        const prepared = await checkoutRepository.prepareCheckout(request);
        if (!prepared.reused) sagaService.hitAfterHold();
        return sagaService.ensurePaymentIntent({
            order: prepared.order,
            attempt: prepared.attempt
        });
    }

    async function resumeCheckout({ orderId, ownerUid }) {
        const checkout = await checkoutRepository.loadOwnedCheckout({ orderId, ownerUid });
        return sagaService.ensurePaymentIntent(checkout);
    }

    return Object.freeze({
        createCheckout,
        resumeCheckout
    });
}

module.exports = { createCheckoutCoordinator };
