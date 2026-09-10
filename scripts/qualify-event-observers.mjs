// Synthetic state transitions only: no provider signature is asserted, no
// provider event is ingested, and no payment or inventory effect is invoked.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const require = createRequire(import.meta.url);
const { makeOrder } = require('../tests/commerce/fixtures/order-v2.cjs');
const { intent, inboxIntent } = require('../functions/src/maintenance/durableWork.cjs');
const flags = new Set(process.argv.slice(2));
if (!flags.has('--project=secondevienextjsssr') || !flags.has('--env=sandbox')
    || !flags.has('--execute') || !flags.has('--confirm=QUALIFY_SYNTHETIC_OBSERVERS')) throw Error('EXPLICIT_SANDBOX_DRILL_REQUIRED');
initializeApp({ projectId: 'secondevienextjsssr', credential: applicationDefault() });
const db = getFirestore(), now = Date.now(), id = `qualification_observers_${now}`;
const inboxId = crypto.createHash('sha256').update(id).digest('hex');
const inboxRef = db.doc(`commerce_webhook_inbox/${inboxId}`), orderRef = db.doc(`orders/${id}`);
const inboxIncident = db.doc(`commerce_incidents/maintenance_inbox_${inboxId}`);
const paymentIncident = db.doc(`commerce_incidents/maintenance_payment_${id}`);
const result = { id, inboxId, startedAt: new Date(now).toISOString(), financialEffectsAllowed: false };
async function waitFor(ref, predicate) {
    for (let n = 0; n < 24; n++) {
        const data = (await ref.get()).data(); if (predicate(data)) return data;
        await new Promise(resolve => setTimeout(resolve, 2500));
    }
    throw Error(`OBSERVER_TIMEOUT:${ref.path}`);
}
let created = false;
try {
    const order = makeOrder();
    const batch = db.batch();
    batch.create(orderRef, { ...order, id, userId: 'qualification_no_customer',
        checkout: { ...order.checkout, expiresAt: new Date(now + 3600000).toISOString() },
        payment: { ...order.payment, currentAttemptId: 'qualification_attempt' },
        paymentWatchWork: intent('payment', id, now - 1000), qualification: true });
    batch.create(orderRef.collection('payment_attempts').doc('qualification_attempt'), { status: 'create_pending', qualification: true });
    batch.create(inboxRef, { schemaVersion: 2, inboxId, status: 'processing', processingUntil: now + 300000,
        nextAttemptAt: null, attemptCount: 1, qualification: true,
        maintenanceWork: intent('inbox', inboxId, now - 1000) });
    await batch.commit(); created = true;
    const deferred = await waitFor(inboxRef, d => d?.maintenanceWork?.generation === 1 && d.maintenanceWork.state === 'scheduled');
    result.inboxDeferred = deferred.maintenanceWork.result === 'deferred';
    const payment = await waitFor(paymentIncident, d => d?.status === 'open');
    result.paymentCode = payment.code;
    await db.runTransaction(async tx => {
        const data = (await tx.get(inboxRef)).data();
        tx.set(inboxRef, inboxIntent({ ...data, status: 'dead_letter' }));
    });
    result.inboxCode = (await waitFor(inboxIncident, d => d?.status === 'open')).code;
} finally {
    if (created) {
        await db.runTransaction(async tx => {
            const [inbox, order] = await Promise.all([tx.get(inboxRef), tx.get(orderRef)]);
            if (!inbox.data()?.qualification || !order.data()?.qualification || order.data()?.payment?.status === 'succeeded') throw Error('FIXTURE_GUARD');
            tx.set(inboxRef, inboxIntent({ ...inbox.data(), status: 'processed', purgeAt: new Date(now + 86400000) }));
            tx.update(orderRef, { 'checkout.status': 'closed', 'checkout.closeReason': 'canceled' });
        });
        await waitFor(inboxIncident, d => !d || d.status === 'closed');
        await waitFor(paymentIncident, d => !d || d.status === 'closed');
        result.incidentsClosed = true;
    }
    fs.writeFileSync(`/tmp/${id}.json`, JSON.stringify(result, null, 2), { mode: 0o600 });
}
result.passed = result.inboxDeferred && result.paymentCode === 'operations_paymentCreationStalled'
    && result.inboxCode === 'operations_inboxDeadLetter' && result.incidentsClosed;
console.log(JSON.stringify(result));
if (!result.passed) process.exitCode = 1;
