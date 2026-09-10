'use strict';

const { intent, FIELD } = require('../../maintenance/durableWork.cjs');

// Called in the same transaction as the business transition. The delivery
// lease stays independent of the transport lease in maintenanceWork.
function withOutboxMaintenance(entry, id = entry.outboxId) {
    const previous = entry[FIELD];
    if (process.env.COMMERCE_EVENT_MAINTENANCE_MODE !== 'durable' && previous?.kind !== 'outbox') return entry;
    if (['sent', 'suppressed_test', 'suppressed_stale', 'dead_letter', 'delivery_unknown'].includes(entry.status)) {
        if (!previous) return entry;
        return { ...entry, [FIELD]: { ...previous,
            state: ['dead_letter', 'delivery_unknown'].includes(entry.status) ? 'needs_attention' : 'succeeded',
            lease: null, leaseUntil: null, result: entry.status } };
    }
    const due = entry.status === 'processing' ? entry.processingUntil + 1000 : entry.nextAttemptAt;
    if (!['pending', 'failed', 'processing'].includes(entry.status) || !Number.isSafeInteger(due)) {
        throw Error('COMMERCE_OUTBOX_MAINTENANCE_INVALID');
    }
    const next = intent('outbox', id, due, [entry.status, entry.attemptCount, due, entry.leaseToken || null]);
    if (previous?.version === next.version) return entry;
    return { ...entry, [FIELD]: next };
}

module.exports = { withOutboxMaintenance };
