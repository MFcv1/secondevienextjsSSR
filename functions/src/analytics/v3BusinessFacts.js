const admin = require('firebase-admin');
const crypto = require('crypto');
const { ANALYTICS_ROLLUP_RETENTION_DAYS, timestampFromNow, getDateKeyFromTimestamp } = require('./constants');

const getDb = () => admin.firestore();

const hasPaid = (order) => Boolean(order)
    && order.paymentMethod === 'stripe_elements'
    && Boolean(order.stripePaymentIntentId)
    && Boolean(order.paidAt)
    && ['paid', 'shipped', 'completed', 'refund_pending', 'refunded', 'refund_failed'].includes(order.status);
const hasRefund = (order) => Boolean(order)
    && order.status === 'refunded'
    && Boolean(order.stripeRefundId)
    && Boolean(order.refundedAt);

function durableTransitions(before, after) {
    const transitions = [];
    if (!before && after) transitions.push({ type: 'order_created_server', at: after.createdAt });
    if (!hasPaid(before) && hasPaid(after)) transitions.push({ type: 'payment_paid_server', at: after.paidAt || after.updatedAt || after.createdAt });
    if (!hasRefund(before) && hasRefund(after)) transitions.push({ type: 'refund_server', at: after.refundedAt || after.updatedAt || after.createdAt });
    return transitions;
}

async function recordBusinessFacts(orderId, before, after) {
    const db = getDb();
    for (const transition of durableTransitions(before, after)) {
        const factId = crypto.createHash('sha256').update(`${transition.type}:${orderId}`).digest('hex');
        const factRef = db.collection('analytics_business_facts_v3').doc(factId);
        const dateKey = getDateKeyFromTimestamp(transition.at);
        const compactRef = db.doc(`analytics_rollup_days_v3/${dateKey}/compact/overview`);
        await db.runTransaction(async (tx) => {
            const snap = await tx.get(factRef);
            if (snap.exists) return;
            tx.create(factRef, {
                schemaVersion: 3,
                eventName: transition.type,
                source: transition.type === 'payment_paid_server' || transition.type === 'refund_server' ? 'stripe_order_state' : 'order_server',
                orderIdHash: crypto.createHash('sha256').update(orderId).digest('base64url'),
                dateKey,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                expireAt: timestampFromNow(ANALYTICS_ROLLUP_RETENTION_DAYS)
            });
            tx.set(compactRef, {
                schemaVersion: 3,
                dateKey,
                [`business.${transition.type}`]: admin.firestore.FieldValue.increment(1),
                businessUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
                expireAt: timestampFromNow(ANALYTICS_ROLLUP_RETENTION_DAYS)
            }, { merge: true });
        });
    }
}

module.exports = { durableTransitions, recordBusinessFacts };
