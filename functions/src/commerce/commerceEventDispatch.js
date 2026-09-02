'use strict';

const admin = require('firebase-admin');
const { getFunctions } = require('firebase-admin/functions');
const { logger } = require('firebase-functions');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onTaskDispatched } = require('firebase-functions/v2/tasks');
const {
    GMAIL_EMAIL,
    GMAIL_PASSWORD,
    RESEND_API_KEY,
    STRIPE_SECRET_KEY
} = require('../../helpers/secrets');
const { createOutboxRuntime } = require('./v2Operations');
const { reservationExpiryRuntime } = require('./v2ReservationExpiry');
const {
    outboxSchedule,
    reservationSchedule,
    sameSchedule,
    taskId
} = require('./domain/eventDispatch');

const REGION = 'europe-west1';
const OUTBOX_TASK = `locations/${REGION}/functions/dispatchCommerceOutboxTaskGen2`;
const RESERVATION_TASK = `locations/${REGION}/functions/dispatchCommerceReservationExpiryTaskGen2`;
const OUTBOX_SERVICE_ACCOUNT =
    'commerce-outbox-dispatcher@secondevienextjsssr.iam.gserviceaccount.com';
const RESERVATION_SERVICE_ACCOUNT =
    'commerce-reservation-expiry@secondevienextjsssr.iam.gserviceaccount.com';
const OUTBOX_SECRETS = [GMAIL_EMAIL, GMAIL_PASSWORD, RESEND_API_KEY];

function alreadyExists(error) {
    const code = String(error?.code || '').toLowerCase();
    return code.includes('already-exists') || code.includes('already_exists') || Number(error?.code) === 6;
}

async function enqueueOnce(queueName, data, options) {
    try {
        await getFunctions().taskQueue(queueName).enqueue(data, options);
        return 'enqueued';
    } catch (error) {
        if (!alreadyExists(error)) throw error;
        return 'already_enqueued';
    }
}

async function enqueueOutboxWrite(event) {
    const before = event.data?.before?.exists ? outboxSchedule(event.data.before.data()) : null;
    const after = event.data?.after?.exists ? outboxSchedule(event.data.after.data()) : null;
    if (!after || sameSchedule(before, after)) return null;
    const outboxId = String(event.params.outboxId || '');
    if (!outboxId) throw new Error('COMMERCE_OUTBOX_EVENT_INVALID');
    const identity = { outboxId, ...after };
    const result = await enqueueOnce(OUTBOX_TASK, {
        schemaVersion: 1,
        ...identity
    }, {
        id: taskId('outbox', identity),
        scheduleTime: new Date(Math.max(Date.now(), after.nextAttemptAt)),
        dispatchDeadlineSeconds: 300
    });
    logger.info('commerce_outbox_task_scheduled', { outboxId, result, ...after });
    return null;
}

async function enqueueReservationWrite(event) {
    const before = event.data?.before?.exists ? reservationSchedule(event.data.before.data()) : null;
    const after = event.data?.after?.exists ? reservationSchedule(event.data.after.data()) : null;
    if (!after || sameSchedule(before, after)) return null;
    const reservationId = String(event.params.reservationId || '');
    if (!reservationId || after.orderId.length < 8) {
        throw new Error('COMMERCE_RESERVATION_EVENT_INVALID');
    }
    const identity = {
        reservationId,
        orderId: after.orderId,
        stateVersion: after.stateVersion,
        expiresAt: after.expiresAt
    };
    const result = await enqueueOnce(RESERVATION_TASK, {
        schemaVersion: 1,
        ...identity
    }, {
        id: taskId('reservation', identity),
        scheduleTime: new Date(Math.max(Date.now(), after.expiresAtMillis)),
        dispatchDeadlineSeconds: 300
    });
    logger.info('commerce_reservation_task_scheduled', { reservationId, result, ...after });
    return null;
}

async function dispatchOutboxTask(request) {
    const outboxId = String(request.data?.outboxId || '');
    if (!outboxId) throw new Error('COMMERCE_OUTBOX_TASK_INVALID');
    try {
        return await createOutboxRuntime().worker.process(outboxId);
    } catch (error) {
        if (['COMMERCE_OUTBOX_NOT_CLAIMABLE', 'COMMERCE_OUTBOX_MISSING'].includes(error?.code)) {
            return { outcome: 'stale', outboxId };
        }
        throw error;
    }
}

async function dispatchReservationTask(request) {
    const input = request.data || {};
    const reservationId = String(input.reservationId || '');
    const orderId = String(input.orderId || '');
    if (!reservationId || orderId.length < 8) throw new Error('COMMERCE_RESERVATION_TASK_INVALID');
    const snapshot = await admin.firestore().doc(`inventory_reservations/${reservationId}`).get();
    if (!snapshot.exists) return { outcome: 'stale', reservationId };
    const reservation = snapshot.data();
    if (
        reservation.status !== 'held' ||
        reservation.orderId !== orderId ||
        Number(reservation.stateVersion || 0) !== Number(input.stateVersion || 0) ||
        reservation.expiresAt !== input.expiresAt
    ) {
        return { outcome: 'stale', reservationId };
    }
    if (Date.parse(reservation.expiresAt) > Date.now()) {
        throw new Error('COMMERCE_RESERVATION_TASK_EARLY');
    }
    return reservationExpiryRuntime().expiryWorker.process({
        id: reservationId,
        data: reservation
    });
}

const eventOptions = (document, serviceAccount) => ({
    document,
    region: REGION,
    retry: true,
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '256MiB',
    timeoutSeconds: 60,
    serviceAccount
});

const onCommerceOutboxWrittenGen2 = onDocumentWritten(
    eventOptions('commerce_outbox/{outboxId}', OUTBOX_SERVICE_ACCOUNT),
    enqueueOutboxWrite
);

const onCommerceReservationWrittenGen2 = onDocumentWritten(
    eventOptions('inventory_reservations/{reservationId}', RESERVATION_SERVICE_ACCOUNT),
    enqueueReservationWrite
);

const dispatchCommerceOutboxTaskGen2 = onTaskDispatched({
    region: REGION,
    serviceAccount: OUTBOX_SERVICE_ACCOUNT,
    invoker: [OUTBOX_SERVICE_ACCOUNT],
    secrets: OUTBOX_SECRETS,
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '512MiB',
    timeoutSeconds: 300,
    retryConfig: { maxAttempts: 1, minBackoffSeconds: 10, maxBackoffSeconds: 60, maxDoublings: 2 },
    rateLimits: { maxConcurrentDispatches: 1, maxDispatchesPerSecond: 2 }
}, dispatchOutboxTask);

const dispatchCommerceReservationExpiryTaskGen2 = onTaskDispatched({
    region: REGION,
    serviceAccount: RESERVATION_SERVICE_ACCOUNT,
    invoker: [RESERVATION_SERVICE_ACCOUNT],
    secrets: [STRIPE_SECRET_KEY],
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '512MiB',
    timeoutSeconds: 300,
    retryConfig: { maxAttempts: 3, minBackoffSeconds: 10, maxBackoffSeconds: 120, maxDoublings: 3 },
    rateLimits: { maxConcurrentDispatches: 1, maxDispatchesPerSecond: 2 }
}, dispatchReservationTask);

module.exports = {
    dispatchCommerceOutboxTaskGen2,
    dispatchCommerceReservationExpiryTaskGen2,
    dispatchOutboxTask,
    dispatchReservationTask,
    enqueueOutboxWrite,
    enqueueReservationWrite,
    onCommerceOutboxWrittenGen2,
    onCommerceReservationWrittenGen2,
    outboxSchedule,
    reservationSchedule,
    taskId
};
