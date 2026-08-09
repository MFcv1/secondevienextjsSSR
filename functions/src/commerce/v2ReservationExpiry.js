'use strict';

const admin = require('firebase-admin');
const { APP_ID } = require('../../helpers/config');
const { regionalFunctions } = require('../../helpers/runtime');
const { STRIPE_SECRET_KEY } = require('../../helpers/secrets');
const {
    createReservationExpiryRuntime
} = require('./domain/v2Runtime');

function reservationExpiryRuntime() {
    const Stripe = require('stripe');
    return createReservationExpiryRuntime({
        db: admin.firestore(),
        stripe: Stripe(STRIPE_SECRET_KEY.value()),
        appId: APP_ID
    });
}

function createReservationExpiryHandler({
    runtimeFactory = reservationExpiryRuntime
} = {}) {
    return async () => {
        const result = await runtimeFactory().sweepers.expiredReservations.run();
        if (result.failures.length > 0 || result.exhausted) {
            console.error('commerce_reservation_expiry_incomplete', {
                processed: result.processed,
                failureCount: result.failures.length,
                exhausted: result.exhausted
            });
        }
        return result;
    };
}

const runReservationExpiryDispatcher = createReservationExpiryHandler();

const commerceReservationExpiryDispatcher = regionalFunctions()
    .runWith({
        timeoutSeconds: 300,
        memory: '512MB',
        secrets: [STRIPE_SECRET_KEY]
    })
    .pubsub.schedule('every 2 minutes')
    .onRun(runReservationExpiryDispatcher);

module.exports = {
    commerceReservationExpiryDispatcher,
    createReservationExpiryHandler,
    runReservationExpiryDispatcher
};
