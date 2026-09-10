'use strict';

const { createDurableWork } = require('../../maintenance/durableWork.cjs');

function createOutboxMaintenanceRuntime({ db, enqueue, worker, now = Date.now, observe }) {
    return createDurableWork({ db, enqueue, now, observe,
        async execute(request) {
            const id = request.data.id;
            const snapshot = await db.doc(`commerce_outbox/${id}`).get();
            if (!snapshot.exists) return { outcome: 'stale' };
            const entry = snapshot.data();
            if (['delivery_unknown', 'dead_letter'].includes(entry.status)) return { outcome: 'attention' };
            if (!['pending', 'failed', 'processing'].includes(entry.status)) return { outcome: 'stale' };
            const due = entry.status === 'processing' ? entry.processingUntil + 1000 : entry.nextAttemptAt;
            if (due > now()) return { due };
            // The repository decides whether an expired delivery can be retried.
            // In particular, deliveryStartedAt forbids a second blind send.
            await worker.process(id);
            return { outcome: 'completed' };
        }
    });
}

module.exports = { createOutboxMaintenanceRuntime };
