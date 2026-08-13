'use strict';

function coordinatorError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function summarizeCheckoutResumeItems(order) {
    if (!Array.isArray(order?.items) || order.items.length === 0) {
        throw coordinatorError('COMMERCE_CHECKOUT_RESUME_ITEMS_INVALID');
    }
    return order.items.map((line) => ({
        cartLineId: line.cartLineId || line.lineId,
        cartRevision: line.cartRevision,
        productId: line.productId,
        name: line.titleSnapshot,
        quantity: line.quantity,
        unitAmountCents: line.unitAmountCents
    }));
}

function resolveCheckoutResumeTerminalCode(order, attempt, nowMillis) {
    if (
        order?.payment?.status === 'succeeded' ||
        order?.checkout?.closeReason === 'paid'
    ) {
        return 'COMMERCE_CHECKOUT_TERMINAL_PAID';
    }
    const expiresAtMillis = Date.parse(order?.checkout?.expiresAt);
    if (order?.checkout?.closeReason === 'expired') {
        return 'COMMERCE_CHECKOUT_TERMINAL_EXPIRED';
    }
    const cancellationIsDurable = (
        order?.checkout?.closeReason === 'canceled' ||
        order?.payment?.status === 'canceled' ||
        attempt?.status === 'canceled'
    );
    if (cancellationIsDurable) {
        return Number.isSafeInteger(expiresAtMillis) && expiresAtMillis <= nowMillis
            ? 'COMMERCE_CHECKOUT_TERMINAL_EXPIRED'
            : 'COMMERCE_CHECKOUT_TERMINAL_CANCELED';
    }
    return null;
}

function createCheckoutCoordinator({ checkoutRepository, sagaService, clock }) {
    if (
        !checkoutRepository ||
        typeof checkoutRepository.prepareCheckout !== 'function' ||
        typeof checkoutRepository.loadOwnedCheckout !== 'function' ||
        !sagaService ||
        typeof sagaService.ensurePaymentIntent !== 'function' ||
        typeof sagaService.hitAfterHold !== 'function' ||
        typeof clock?.nowMillis !== 'function'
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
        const terminalCode = resolveCheckoutResumeTerminalCode(
            checkout.order,
            checkout.attempt,
            clock.nowMillis()
        );
        if (terminalCode) throw coordinatorError(terminalCode);
        const payment = await sagaService.ensurePaymentIntent(checkout);
        return {
            ...payment,
            items: summarizeCheckoutResumeItems(checkout.order)
        };
    }

    return Object.freeze({
        createCheckout,
        resumeCheckout
    });
}

module.exports = {
    createCheckoutCoordinator,
    resolveCheckoutResumeTerminalCode,
    summarizeCheckoutResumeItems
};
