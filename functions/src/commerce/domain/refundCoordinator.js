'use strict';

function coordinatorError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function createRefundCoordinator({ repository, sagaService }) {
    if (
        typeof repository?.prepareRefund !== 'function' ||
        typeof sagaService?.ensureRefund !== 'function'
    ) {
        throw coordinatorError('COMMERCE_REFUND_COORDINATOR_DEPENDENCY_INVALID');
    }

    return Object.freeze({
        async requestRefund(request) {
            const prepared = await repository.prepareRefund(request);
            return sagaService.ensureRefund({
                order: prepared.order,
                attempt: prepared.attempt
            });
        }
    });
}

module.exports = { createRefundCoordinator };
