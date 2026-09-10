'use strict';
const { linkIntent, paymentIntent, inboxIntent, intent, fieldFor } = require('./durableWork.cjs');
const { millis, INACTIVITY_MS } = require('./activityMaintenanceCore.cjs');
function bootstrapPatch(kind, id, data, now) {
    if (!data) return null;
    if (kind === 'session' && data.inactivityGroup?.mode === 'grouped') return null;
    const existing = data[fieldFor(kind)];
    if (existing) return existing.state === 'pending' && existing.kind === kind
        ? { ...existing, generation: existing.generation + 1 } : null;
    if (kind === 'outbox') return ['pending', 'failed', 'processing'].includes(data.status)
        ? require('../commerce/domain/outboxMaintenance').withOutboxMaintenance(data, id).maintenanceWork : null;
    if (kind === 'reservation') return require('../commerce/domain/reservationMaintenance').withReservationMaintenance(data, id).reservationExpiryWork || null;
    if (kind === 'catalog') {
        const { cycleIntent, cycleStatus } = require('../catalog/catalogCycle.cjs');
        return cycleStatus(data, now).outcome === 'completed' ? null : cycleIntent(data, now).maintenanceWork;
    }
    if (kind === 'link') return linkIntent(data, id).maintenanceWork || null;
    if (kind === 'session') {
        if (!data.sessionActive || data.type === 'admin' || !Number.isFinite(millis(data.lastActivityAt))) return null;
        return intent('session', id, Math.ceil(millis(data.lastActivityAt)) + INACTIVITY_MS);
    }
    if (kind === 'payment') {
        if (data.checkout?.status !== 'active' || data.payment?.status === 'succeeded'
            || (data.checkout?.channel === 'admin_payment_link' && !data.payment?.paymentIntentId)) return null;
        return paymentIntent(data, id, now).paymentWatchWork;
    }
    if (kind === 'inbox') return ['received', 'processing', 'failed'].includes(data.status) ? inboxIntent(data).maintenanceWork : null;
    throw Error('BOOTSTRAP_KIND_INVALID');
}
module.exports = { bootstrapPatch };
