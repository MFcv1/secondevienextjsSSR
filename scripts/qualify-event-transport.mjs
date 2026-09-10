// Bounded sandbox transport drill. The deliberately obsolete deadline prevents
// any provider call; this is NOT a financial checkout qualification.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const require = createRequire(import.meta.url);
const { makeOrder } = require('../tests/commerce/fixtures/order-v2.cjs');
const { intent } = require('../functions/src/maintenance/durableWork.cjs');
const flags = new Set(process.argv.slice(2));
if (!flags.has('--project=secondevienextjsssr') || !flags.has('--env=sandbox')
    || !flags.has('--execute') || !flags.has('--confirm=QUALIFY_OBSOLETE_LINK_TRANSPORT')) throw Error('EXPLICIT_SANDBOX_DRILL_REQUIRED');
initializeApp({ projectId: 'secondevienextjsssr', credential: applicationDefault() });
const db = getFirestore(), now = Date.now(), id = `qualification_event_${now}`;
const ref = db.doc(`orders/${id}`), order = makeOrder();
const record = { ...order, id, userId: 'qualification_no_customer',
    createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
    checkout: { ...order.checkout, channel: 'admin_payment_link', expiresAt: new Date(now + 3600000).toISOString() },
    maintenanceWork: intent('link', id, now - 1000),
    qualification: { kind: 'obsolete_deadline_transport', financialEffectsAllowed: false, createdAt: new Date(now) } };
const result = { id, startedAt: new Date(now).toISOString(), financialEffectsAllowed: false, observations: [] };
try {
    await ref.create(record);
    for (let i = 0; i < 24; i++) {
        const data = (await ref.get()).data();
        result.observations.push({ at: new Date().toISOString(), state: data.maintenanceWork.state, result: data.maintenanceWork.result });
        if (data.maintenanceWork.state === 'superseded') { result.passed = true; break; }
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
} finally {
    // Close the unpaid fixture even if delivery fails. Do not erase its evidence.
    await db.runTransaction(async tx => {
        const snap = await tx.get(ref); if (!snap.exists) return;
        if (snap.data().payment?.status === 'succeeded') throw Error('UNEXPECTED_PAID_FIXTURE');
        tx.update(ref, { 'checkout.status': 'closed', 'checkout.closeReason': 'canceled' });
    });
    fs.writeFileSync(`/tmp/${id}.json`, JSON.stringify(result, null, 2), { mode: 0o600 });
}
console.log(JSON.stringify(result));
if (!result.passed) process.exitCode = 1;
