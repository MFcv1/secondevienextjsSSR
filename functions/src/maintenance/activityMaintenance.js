'use strict';
const admin = require('firebase-admin');
const { getFunctions } = require('firebase-admin/functions');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onTaskDispatched } = require('firebase-functions/v2/tasks');
const logger = require('firebase-functions/logger');
const { createActivityMaintenance, planWrite, millis } = require('./activityMaintenanceCore.cjs');
const { taskNames } = require('./scheduleActivity.cjs');
const { createDurableWork, fieldFor } = require('./durableWork.cjs');
const REGION = 'europe-west1';
const accounts = { link: 'admin-payment-link-expiry', publication: 'product-publication-worker', session: 'analytics-runtime', compaction: 'analytics-runtime', archive: 'analytics-runtime', inbox: 'commerce-operations-reconciler', payment: 'commerce-operations-reconciler' };
const enabled = () => process.env.ACTIVITY_MAINTENANCE_ENABLED === 'true';
const account = kind => `${accounts[kind]}@secondevienextjsssr.iam.gserviceaccount.com`;
const options = kind => ({ region: REGION, serviceAccount: account(kind), cpu: 1, concurrency: 1, minInstances: 0, maxInstances: 1, memory: '512MiB', timeoutSeconds: 540 });
function runtime() {
    const enqueue = (kind, data, config) => getFunctions().taskQueue(`locations/${REGION}/functions/${taskNames[kind]}`).enqueue(data, config);
    const engine = createActivityMaintenance({
        db: admin.firestore(), serverTimestamp: () => admin.firestore.FieldValue.serverTimestamp(),
        enqueue,
        inspectInbox: id => require('./inboxCheck.cjs').inspectInbox(admin.firestore(), id),
        inspectPayment: id => require('./paymentCheck.cjs').inspectPayment(admin.firestore(), id),
        archivePeriod: key => require('../analytics/rollups').archiveDay(key),
        expireLink: id => require('../commerce/v2AdminPaymentLinks').expirePaymentLinkById(id),
        finalizePublication: id => require('../publication/productPublication').finalizePublicationSession(id),
        compactPeriod: async key => {
            const rollups = require('../analytics/rollups');
            await rollups.compactDay(key);
            await rollups.compactMonth(key.slice(0, 7));
            await rollups.compactYear(key.slice(0, 4));
            await rollups.materializeDashboardInsights();
        }
    });
    const durable = createDurableWork({ db: admin.firestore(), enqueue, execute: engine.dispatch,
        observe: (state, data) => {
            const method = ['needs_attention', 'dispatch_failed'].includes(state) ? 'error' : 'info';
            logger[method]('maintenance_lifecycle', { event: `maintenance_${state}`, correlationId: data.operationId, kind: data.kind, attempt: data.attempt || 0 });
        } });
    return { ...engine, durable };
}
const exported = {};
for (const [kind, document, name, param] of [
    ['link', 'orders/{orderId}', 'schedulePaymentLinkExpiryGen2', 'orderId'],
    ['publication', 'product_publication_sessions/{sessionId}', 'schedulePublicationCheckGen2', 'sessionId'],
    ['session', null, null, null],
    ['archive', null, null, null],
    ['inbox', 'commerce_webhook_inbox/{inboxId}', 'scheduleInboxCheckGen2', 'inboxId'],
    ['payment', 'orders/{orderId}', 'schedulePaymentCheckGen2', 'orderId'],
    ['compaction', 'sys_analytics_maintenance/{day}', 'scheduleAnalyticsCompactionGen2', 'day']
]) {
    if (name) exported[name] = onDocumentWritten({ ...options(kind), document, retry: true }, async event => {
        if (!enabled()) return;
        const before = event.data.before.exists ? event.data.before.data() : null;
        const after = event.data.after.exists ? event.data.after.data() : null;
        const field = fieldFor(kind);
        if (kind === 'link' && (after?.checkout?.status === 'closed' || after?.payment?.status === 'succeeded')
            && (before?.checkout?.status !== after?.checkout?.status || before?.payment?.status !== after?.payment?.status)) {
            return require('./paymentCheck.cjs').finishLinkWork(admin.firestore(), event.params[param]);
        }
        if (kind === 'payment' && (after?.checkout?.status === 'closed' || after?.payment?.status === 'succeeded')
            && (before?.checkout?.status !== after?.checkout?.status || before?.payment?.status !== after?.payment?.status)) {
            return require('./paymentCheck.cjs').inspectPayment(admin.firestore(), event.params[param]);
        }
        if (kind === 'inbox' && ['processed', 'dead_letter'].includes(after?.status)) {
            return require('./inboxCheck.cjs').inspectInbox(admin.firestore(), event.params[param]);
        }
        if (after?.[field]) {
            const a = after[field], b = before?.[field];
            if (a.state !== 'pending' || (a.version === b?.version && a.generation === b?.generation && b?.state === 'pending')) return;
            return runtime().durable.schedule(a);
        }
        if (['inbox', 'compaction', 'payment'].includes(kind)) return; // Only persisted intents; no bookkeeping self-loop.
        const plan = planWrite(kind, event.params[param], before, after, millis(event.data.after.updateTime || event.time));
        const result = await runtime().schedule(plan);
        if (plan) logger.info('activity_maintenance_scheduled', { kind, outcome: result.outcome });
    });
    exported[taskNames[kind]] = onTaskDispatched({
        ...options(kind), invoker: [account(kind)],
        ...(kind === 'link' ? { secrets: ['STRIPE_SECRET_KEY', 'PAYMENT_LINK_HMAC_SECRET'] } : {}),
        retryConfig: { maxAttempts: 10, minBackoffSeconds: 30, maxBackoffSeconds: 600, maxDoublings: 4 },
        rateLimits: { maxConcurrentDispatches: 1, maxDispatchesPerSecond: 1 }
    }, async request => {
        if (!enabled()) throw new Error('MAINTENANCE_DISABLED');
        if (request.data?.kind !== kind) throw new Error('MAINTENANCE_TASK_KIND_MISMATCH');
        const started = Date.now();
        try {
            const engine = runtime();
            const result = await (request.data.schemaVersion === 2 ? engine.durable.dispatch(request) : engine.dispatch(request));
            logger.info('activity_maintenance_completed', { kind, outcome: result?.outcome || 'completed', durationMs: Date.now() - started });
            return result;
        } catch (error) {
            logger.error('activity_maintenance_failed', { kind, retryCount: request.retryCount || 0 });
            throw error;
        }
    });
}
module.exports = exported;
