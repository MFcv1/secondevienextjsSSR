'use strict';

// A targeted observer. It never replays a provider payment or changes stock.
async function inspectInbox(db, id, now = Date.now()) {
    if (!/^[a-f0-9]{64}$/.test(id)) throw Error('INBOX_CHECK_INVALID_ID');
    return db.runTransaction(async tx => {
        const ref = db.doc(`commerce_webhook_inbox/${id}`);
        const incidentRef = db.doc(`commerce_incidents/maintenance_inbox_${id}`);
        const [snapshot, incident] = await Promise.all([tx.get(ref), tx.get(incidentRef)]);
        const entry = snapshot.data();
        if (!entry || entry.status === 'processed') {
            if (incident.exists && incident.data().status !== 'closed') tx.set(incidentRef, { ...incident.data(), status: 'closed', updatedAt: new Date(now) });
            return { outcome: 'stale' };
        }
        const due = entry.status === 'processing' ? entry.processingUntil + 1000 : entry.nextAttemptAt + 60000;
        if (entry.status !== 'dead_letter' && Number.isFinite(due) && due > now) return { outcome: 'deferred', due };
        const code = entry.status === 'dead_letter' ? 'operations_inboxDeadLetter' : entry.status === 'processing' ? 'operations_expiredInboxLeases' : 'operations_dueInbox';
        if (!incident.exists || incident.data().status !== 'open' || incident.data().code !== code) tx.set(incidentRef, {
            schemaVersion: 2, code, severity: 'critical', category: 'webhook', status: 'open', count: 1,
            source: 'inbox_deadline', inboxId: id, updatedAt: new Date(now)
        });
        return { outcome: 'attention' };
    });
}
module.exports = { inspectInbox };
