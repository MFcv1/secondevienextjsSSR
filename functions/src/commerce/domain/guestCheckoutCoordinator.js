'use strict';

function coordinatorError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function createGuestCheckoutCoordinator({ accessTokenRepository, checkoutCoordinator }) {
    if (
        typeof accessTokenRepository?.issue !== 'function' ||
        typeof accessTokenRepository?.consumeAndRotate !== 'function' ||
        typeof checkoutCoordinator?.resumeCheckout !== 'function'
    ) {
        throw coordinatorError('COMMERCE_GUEST_CHECKOUT_COORDINATOR_DEPENDENCY_INVALID');
    }

    return Object.freeze({
        issueResumeToken: ({ orderId, ownerUid }) => accessTokenRepository.issue({
            orderId,
            ownerUid
        }),

        async resumeCheckout({ rawToken, ownerUid }) {
            const access = await accessTokenRepository.consumeAndRotate({
                rawToken,
                ownerUid
            });
            const checkout = await checkoutCoordinator.resumeCheckout({
                orderId: access.orderId,
                ownerUid: access.ownerUid
            });
            return {
                ...checkout,
                resumeToken: access.nextRawToken,
                resumeTokenExpiresAt: access.expiresAt
            };
        }
    });
}

module.exports = { createGuestCheckoutCoordinator };
