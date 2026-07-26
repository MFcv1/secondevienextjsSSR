'use strict';

const { assertActionAllowed } = require('./allowedActions');
const { hashPayload } = require('./idempotency');

function coordinatorError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function createCancellationCoordinator({
    checkoutRepository,
    sagaService,
    auditRepository
}) {
    if (
        typeof checkoutRepository?.loadOwnedCheckout !== 'function' ||
        typeof sagaService?.cancelProviderFirst !== 'function' ||
        typeof auditRepository?.lookup !== 'function' ||
        typeof auditRepository?.record !== 'function'
    ) {
        throw coordinatorError('COMMERCE_CANCELLATION_COORDINATOR_DEPENDENCY_INVALID');
    }

    return Object.freeze({
        async requestCancellation({
            orderId,
            commandId,
            ownerUid,
            reason
        }) {
            if (
                typeof commandId !== 'string' ||
                commandId.length < 8 ||
                typeof reason !== 'string' ||
                reason.length < 3
            ) {
                throw coordinatorError('COMMERCE_CANCELLATION_COMMAND_INVALID');
            }
            const existing = await auditRepository.lookup(
                commandId,
                ownerUid,
                hashPayload({ orderId, actorUid: ownerUid, reason })
            );
            if (existing) return existing;
            const checkout = await checkoutRepository.loadOwnedCheckout({
                orderId,
                ownerUid
            });
            const terminal = checkout.order.checkout.status === 'closed';
            if (!terminal) {
                assertActionAllowed(checkout.order, {
                    uid: ownerUid,
                    role: 'customer',
                    aal2: false
                }, 'request_cancellation');
            }
            const cancellation = await sagaService.cancelProviderFirst(checkout);
            return auditRepository.record({
                orderId,
                commandId,
                actor: {
                    uid: ownerUid,
                    role: 'customer',
                    aal2: false
                },
                reason,
                outcome: cancellation.outcome,
                paymentIntentId: cancellation.paymentIntentId
            });
        }
    });
}

module.exports = { createCancellationCoordinator };
