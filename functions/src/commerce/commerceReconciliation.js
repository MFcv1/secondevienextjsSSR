'use strict';
const admin = require('firebase-admin');
const { logger } = require('firebase-functions');
const { getFunctions } = require('firebase-admin/functions');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onTaskDispatched } = require('firebase-functions/v2/tasks');
const { buildFinancialRollupDelta } = require('./domain/financialRollup');
const { createReconciliationWork } = require('./domain/reconciliationWork.cjs');
const { runOperationsRebuild } = require('./v2Operations');
const ACCOUNT = 'commerce-operations-reconciler@secondevienextjsssr.iam.gserviceaccount.com';

async function inspectFinancialDay(db, day) {
    const start = `${day}T00:00:00.000Z`, end = new Date(Date.parse(start) + 86400000).toISOString();
    const facts = await db.collection('commerce_financial_facts').where('effectiveAt', '>=', start).where('effectiveAt', '<', end).limit(2001).get();
    if (facts.size > 2000) throw Error('RECONCILIATION_DAY_REQUIRES_PAGINATION');
    const totals = {};
    for (const doc of facts.docs) {
        const delta = buildFinancialRollupDelta(doc.data());
        const total = totals[delta.currency] ||= { capturedCents: 0, refundedCents: 0, netCents: 0, factCount: 0 };
        for (const key of Object.keys(total)) total[key] += delta[key];
    }
    const rollups = await db.collection('commerce_financial_daily').where('dateKey', '==', day).limit(101).get();
    if (rollups.size > 100) throw Error('RECONCILIATION_CURRENCIES_LIMIT');
    const actual = Object.fromEntries(rollups.docs.map(doc => [doc.data().currency, doc.data()]));
    const divergences = [];
    for (const currency of new Set([...Object.keys(totals), ...Object.keys(actual)])) {
        for (const field of ['capturedCents', 'refundedCents', 'netCents', 'factCount']) {
            if (Number(totals[currency]?.[field] || 0) !== Number(actual[currency]?.[field] || 0)) divergences.push({ domain: 'financial_day', currency, field });
        }
    }
    const operations = await runOperationsRebuild({ includeHealth: false });
    return { dateKey: day, factCount: facts.size, divergences: [...divergences, ...operations.projection.divergences] };
}
function runtime() {
    const db = admin.firestore();
    return createReconciliationWork({ db, inspect: day => inspectFinancialDay(db, day),
        enqueue: (_kind, data, options) => getFunctions().taskQueue('locations/europe-west1/functions/dispatchCommerceReconciliationGen2').enqueue(data, options),
        observe: (state, fields) => logger[['needs_attention', 'dispatch_failed'].includes(state) ? 'error' : 'info']('maintenance_lifecycle', { event: `maintenance_${state}`, correlationId: fields.operationId, state, ...fields }) });
}
const options = { region: 'europe-west1', serviceAccount: ACCOUNT, cpu: 1, concurrency: 1, minInstances: 0, maxInstances: 1, memory: '512MiB', timeoutSeconds: 540 };
const scheduleCommerceReconciliationGen2 = onDocumentWritten({ ...options, document: 'sys_commerce_reconciliation/{day}', retry: true }, event => {
    const before = event.data?.before?.data(), after = event.data?.after?.data();
    if (!after || (before?.dirtyToken === after.dirtyToken && !(after.maintenanceWork?.state === 'pending' && before?.maintenanceWork?.generation !== after.maintenanceWork.generation))) return null;
    return runtime().scheduleDay(event.params.day);
});
const dispatchCommerceReconciliationGen2 = onTaskDispatched({ ...options, invoker: [ACCOUNT],
    retryConfig: { maxAttempts: 20, minBackoffSeconds: 10, maxBackoffSeconds: 120, maxDoublings: 3 },
    rateLimits: { maxConcurrentDispatches: 1, maxDispatchesPerSecond: 1 } }, request => {
    if (request.data?.kind !== 'finance') throw Error('RECONCILIATION_TASK_INVALID');
    return runtime().dispatch(request);
});
module.exports = { scheduleCommerceReconciliationGen2, dispatchCommerceReconciliationGen2, inspectFinancialDay };
