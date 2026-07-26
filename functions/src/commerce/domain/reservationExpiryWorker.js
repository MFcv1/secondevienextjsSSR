'use strict';

function expiryError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function createReservationExpiryWorker({ checkoutRepository, sagaService, clock }) {
    if (
        typeof checkoutRepository?.loadCheckout !== 'function' ||
        typeof sagaService?.cancelProviderFirst !== 'function' ||
        typeof clock?.nowMillis !== 'function'
    ) {
        throw expiryError('COMMERCE_EXPIRY_WORKER_DEPENDENCY_INVALID');
    }

    async function process(item) {
        const orderId = item?.data?.orderId || item?.orderId;
        if (typeof orderId !== 'string' || orderId.length < 8) {
            throw expiryError('COMMERCE_EXPIRY_ITEM_INVALID');
        }
        const checkout = await checkoutRepository.loadCheckout({ orderId });
        const expiresAtMillis = Date.parse(checkout.order.checkout.expiresAt);
        if (!Number.isSafeInteger(expiresAtMillis) || expiresAtMillis > clock.nowMillis()) {
            return { outcome: 'not_due', orderId };
        }
        if (checkout.order.payment.status === 'succeeded') {
            return { outcome: 'paid', orderId };
        }
        if (checkout.order.checkout.status === 'closed') {
            return {
                outcome: checkout.order.checkout.closeReason || 'closed',
                orderId
            };
        }
        return sagaService.cancelProviderFirst(checkout);
    }

    return Object.freeze({ process });
}

module.exports = { createReservationExpiryWorker };
