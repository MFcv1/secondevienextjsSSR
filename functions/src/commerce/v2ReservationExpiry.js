'use strict';

const crypto = require('node:crypto');
const admin = require('firebase-admin');
const { APP_ID } = require('../../helpers/config');
const { regionalFunctions } = require('../../helpers/runtime');
const { STRIPE_SECRET_KEY } = require('../../helpers/secrets');
const {
    createReservationExpiryRuntime
} = require('./domain/v2Runtime');
const {
    assertWorkerRunComplete,
    buildWorkerRunSummary
} = require('./domain/workerRunHealth');

function reservationExpiryRuntime() {
    const Stripe = require('stripe');
    return createReservationExpiryRuntime({
        db: admin.firestore(),
        stripe: Stripe(STRIPE_SECRET_KEY.value()),
        appId: APP_ID
    });
}

function createReservationExpiryHandler({
    runtimeFactory = reservationExpiryRuntime,
    logger = console,
    nowMillis = () => Date.now(),
    runId = () => crypto.randomUUID()
} = {}) {
    return async () => {
        const startedAtMillis = nowMillis();
        const result = await runtimeFactory().sweepers.expiredReservations.run();
        const summary = buildWorkerRunSummary({
            worker: 'reservation_expiry',
            runId: runId(),
            startedAtMillis,
            finishedAtMillis: nowMillis(),
            results: [{ name: 'expired_reservations', result }]
        });
        if (summary.status === 'incomplete') {
            logger.error('commerce_worker_incomplete', summary);
        } else {
            logger.info('commerce_worker_completed', summary);
        }
        assertWorkerRunComplete(summary);
        return result;
    };
}

const runReservationExpiryDispatcher = createReservationExpiryHandler();

const commerceReservationExpiryDispatcher = regionalFunctions()
    .runWith({
        timeoutSeconds: 300,
        memory: '512MB',
        maxInstances: 1,
        secrets: [STRIPE_SECRET_KEY]
    })
    .pubsub.schedule('every 2 minutes')
    .onRun(runReservationExpiryDispatcher);

module.exports = {
    commerceReservationExpiryDispatcher,
    createReservationExpiryHandler,
    runReservationExpiryDispatcher
};
