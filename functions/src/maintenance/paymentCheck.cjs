'use strict';
async function inspectPayment(db, id, now = Date.now()) {
    if (!/^[A-Za-z0-9_-]{1,160}$/.test(id)) throw Error('PAYMENT_CHECK_INVALID_ID');
    return db.runTransaction(async tx => {
        const orderRef = db.doc(`orders/${id}`);
        const order = (await tx.get(orderRef)).data();
        const incidentRef = db.doc(`commerce_incidents/maintenance_payment_${id}`);
        const incident = await tx.get(incidentRef);
        if (!order || order.checkout?.status === 'closed' || order.payment?.status === 'succeeded') {
            if (incident.exists && incident.data().status !== 'closed') tx.set(incidentRef, { ...incident.data(), status: 'closed', updatedAt: new Date(now) });
            const work = order?.paymentWatchWork;
            if (work && !['succeeded', 'superseded'].includes(work.state)) tx.update(orderRef, { paymentWatchWork: {
                ...work, state: order.payment?.status === 'succeeded' ? 'succeeded' : 'superseded',
                result: 'checkout_terminal', lease: null, leaseUntil: null, completedAt: now
            } });
            return { outcome: 'stale' };
        }
        const attemptId = order.payment?.currentAttemptId;
        if (!/^[A-Za-z0-9_-]{1,200}$/.test(attemptId || '')) throw Error('PAYMENT_CHECK_ATTEMPT_MISSING');
        const attempt = (await tx.get(db.doc(`orders/${id}/payment_attempts/${attemptId}`))).data();
        const due = Date.parse(order.checkout?.expiresAt) + 60000;
        if (!Number.isSafeInteger(due)) throw Error('PAYMENT_CHECK_EXPIRY_MISSING');
        if (attempt?.status === 'attached' && due > now) return { outcome: 'deferred', due };
        const code = ['create_pending', 'create_inflight', 'create_unknown', 'needs_review'].includes(attempt?.status)
            ? 'operations_paymentCreationStalled' : 'operations_paymentOutcomePending';
        if (!incident.exists || incident.data().status !== 'open' || incident.data().code !== code) tx.set(incidentRef, {
            schemaVersion: 2, code, orderId: id, severity: 'critical', category: 'payment', status: 'open', count: 1,
            source: 'checkout_deadline', updatedAt: new Date(now)
        });
        // An absent webhook is not proof of payment failure. No financial replay here.
        return { outcome: 'attention' };
    });
}
async function finishLinkWork(db, id, now = Date.now()) {
    return db.runTransaction(async tx => {
        const ref = db.doc(`orders/${id}`), order = (await tx.get(ref)).data(), work = order?.maintenanceWork;
        if (work?.kind !== 'link' || (order.checkout?.status !== 'closed' && order.payment?.status !== 'succeeded')
            || ['succeeded', 'superseded'].includes(work.state)) return;
        const expired = order.checkout?.closeReason === 'expired';
        tx.update(ref, { maintenanceWork: { ...work, state: expired ? 'succeeded' : 'superseded', result: expired ? 'expired' : 'checkout_terminal',
            lease: null, leaseUntil: null, completedAt: now } });
    });
}
module.exports = { inspectPayment, finishLinkWork };
