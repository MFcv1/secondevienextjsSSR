'use strict';
const admin = require('firebase-admin');
const { logger } = require('firebase-functions');
const { getFunctions } = require('firebase-admin/functions');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onTaskDispatched } = require('firebase-functions/v2/tasks');
const { CATALOG_BUILDER_SERVICE_ACCOUNT, CATALOG_SNAPSHOT_BUCKET } = require('./catalogConfig');
const { createCatalogCycleRuntime } = require('./catalogCycle.cjs');
const { reconcileCatalogWithStateRetry } = require('./catalogReconciler');

function runtime() {
    return createCatalogCycleRuntime({ db: admin.firestore(),
        enqueue: (_kind, data, options) => getFunctions().taskQueue('locations/europe-west1/functions/dispatchCatalogCycleGen2').enqueue(data, options),
        reconcile: () => reconcileCatalogWithStateRetry({ db: admin.firestore(), bucket: admin.storage().bucket(CATALOG_SNAPSHOT_BUCKET) }),
        observe: (state, fields) => logger[['needs_attention', 'dispatch_failed'].includes(state) ? 'error' : 'info']('maintenance_lifecycle', { event: `maintenance_${state}`, correlationId: fields.operationId, state, ...fields }) });
}
const options = { region: 'europe-west1', serviceAccount: CATALOG_BUILDER_SERVICE_ACCOUNT,
    cpu: 1, concurrency: 1, minInstances: 0, maxInstances: 1, memory: '512MiB', timeoutSeconds: 540 };
const scheduleCatalogCycleGen2 = onDocumentWritten({ ...options, document: 'sys_catalog_publication/{catalogId}', retry: true }, async event => {
    const before = event.data?.before?.data()?.maintenanceWork;
    const work = event.data?.after?.data()?.maintenanceWork;
    if (work?.kind !== 'catalog' || work.state !== 'pending'
        || (before?.version === work.version && before?.generation === work.generation)) return null;
    return runtime().schedule(work);
});
const dispatchCatalogCycleGen2 = onTaskDispatched({ ...options, invoker: [CATALOG_BUILDER_SERVICE_ACCOUNT],
    retryConfig: { maxAttempts: 20, minBackoffSeconds: 10, maxBackoffSeconds: 120, maxDoublings: 3 },
    rateLimits: { maxConcurrentDispatches: 1, maxDispatchesPerSecond: 1 } }, request => {
    if (request.data?.kind !== 'catalog') throw Error('CATALOG_CYCLE_TASK_INVALID');
    return runtime().dispatch(request);
});
module.exports = { scheduleCatalogCycleGen2, dispatchCatalogCycleGen2 };
