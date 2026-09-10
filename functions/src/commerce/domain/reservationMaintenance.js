'use strict';
const { intent, createDurableWork } = require('../../maintenance/durableWork.cjs');

function withReservationMaintenance(order, id) {
    if (process.env.COMMERCE_EVENT_MAINTENANCE_MODE !== 'durable' && order.reservationExpiryWork?.kind !== 'reservation') return order;
    if (order.checkout?.channel === 'admin_payment_link') return order;
    if (order.checkout?.status !== 'active' || order.payment?.status === 'succeeded') return order;
    const due = Date.parse(order.checkout.expiresAt);
    const next = intent('reservation', id, due);
    if (order.reservationExpiryWork?.version === next.version) return order;
    return { ...order, reservationExpiryWork: next };
}

function createReservationMaintenanceRuntime({ db, enqueue, worker, now = Date.now, observe }) {
    return createDurableWork({ db, enqueue, now, observe, async execute(request) {
        const orderId = request.data.id;
        const read = async () => (await db.doc(`orders/${orderId}`).get()).data();
        const terminal = order => !order || order.checkout?.channel === 'admin_payment_link'
            || order.payment?.status === 'succeeded' || order.checkout?.status === 'closed';
        const order = await read();
        if (terminal(order)) return { outcome: 'stale' };
        const due = Date.parse(order.checkout?.expiresAt);
        if (!Number.isSafeInteger(due)) return { outcome: 'attention' };
        if (due > now()) return { due };
        await worker.process({ orderId });
        // Never acknowledge a provider response as durable stock release.
        const fresh = await read();
        if (terminal(fresh)) return { outcome: 'completed' };
        const changedDue = Date.parse(fresh.checkout?.expiresAt);
        if (changedDue > now()) return { due: changedDue };
        throw Error('COMMERCE_RESERVATION_EXPIRY_INCOMPLETE');
    } });
}

module.exports = { withReservationMaintenance, createReservationMaintenanceRuntime };
