'use strict';

function queryError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function validatePageInput({ limit, cursor }) {
    if (
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > 50 ||
        (cursor !== null && cursor !== undefined && typeof cursor !== 'object')
    ) {
        throw queryError('COMMERCE_WORKER_QUERY_INVALID');
    }
}

function pageResult(snapshot) {
    const documents = snapshot.docs || [];
    return {
        items: documents.map((document) => ({
            id: document.id,
            data: document.data()
        })),
        nextCursor: documents.length > 0
            ? documents[documents.length - 1]
            : null
    };
}

function createFirestoreWorkerQueries({ db }) {
    if (!db || typeof db.collection !== 'function') {
        throw queryError('COMMERCE_WORKER_QUERY_DEPENDENCY_INVALID');
    }

    async function execute(baseQuery, input) {
        validatePageInput(input);
        let query = baseQuery.limit(input.limit);
        if (input.cursor) query = query.startAfter(input.cursor);
        return pageResult(await query.get());
    }

    return Object.freeze({
        listDueInbox(input) {
            return execute(
                db.collection('commerce_webhook_inbox')
                    .where('status', 'in', ['received', 'failed'])
                    .where('nextAttemptAt', '<=', input.nowMillis)
                    .orderBy('nextAttemptAt', 'asc'),
                input
            );
        },

        listExpiredInboxLeases(input) {
            return execute(
                db.collection('commerce_webhook_inbox')
                    .where('status', '==', 'processing')
                    .where('processingUntil', '<=', input.nowMillis)
                    .orderBy('processingUntil', 'asc'),
                input
            );
        },

        listDueOutbox(input) {
            return execute(
                db.collection('commerce_outbox')
                    .where('status', 'in', ['pending', 'failed'])
                    .where('nextAttemptAt', '<=', input.nowMillis)
                    .orderBy('nextAttemptAt', 'asc'),
                input
            );
        },

        listExpiredOutboxLeases(input) {
            return execute(
                db.collection('commerce_outbox')
                    .where('status', '==', 'processing')
                    .where('processingUntil', '<=', input.nowMillis)
                    .orderBy('processingUntil', 'asc'),
                input
            );
        },

        listExpiredReservations(input) {
            return execute(
                db.collection('inventory_reservations')
                    .where('status', '==', 'held')
                    .where('expiresAt', '<=', input.now)
                    .orderBy('expiresAt', 'asc'),
                input
            );
        }
    });
}

module.exports = { createFirestoreWorkerQueries };
