const admin = require('firebase-admin');
const { getFunctions } = require('firebase-admin/functions');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { hashEventId, recordCatalogMutation, taskIdForRevision } = require('./catalogMutationRecorder');
const { CATALOG_ENQUEUER_SERVICE_ACCOUNT } = require('./catalogConfig');

const TRIGGER_REGION = 'europe-west1';
const SOURCE_PATTERN = 'artifacts/{appId}/public/data/furniture/{productId}';
const BUILD_TASK = `locations/${TRIGGER_REGION}/functions/dispatchCatalogBuild`;

async function enqueueCatalogBuild({ revision, quietUntil, taskId }) {
    const queue = getFunctions().taskQueue(BUILD_TASK);
    try {
        await queue.enqueue(
            { schemaVersion: 1, targetRevision: revision },
            { id: taskId, scheduleTime: quietUntil, dispatchDeadlineSeconds: 1800 }
        );
        return { scheduled: true, alreadyExists: false };
    } catch (error) {
        const code = String(error?.code || '').toLowerCase();
        if (code.includes('already-exists') || code.includes('already_exists') || Number(error?.code) === 6) {
            return { scheduled: true, alreadyExists: true };
        }
        throw error;
    }
}

const onCatalogSourceWrite = onDocumentWritten(
    {
        document: SOURCE_PATTERN,
        region: TRIGGER_REGION,
        retry: true,
        serviceAccount: CATALOG_ENQUEUER_SERVICE_ACCOUNT,
        cpu: 1,
        concurrency: 1,
        minInstances: 0,
        maxInstances: 1,
        timeoutSeconds: 60,
        memory: '256MiB'
    },
    async (event) => recordCatalogMutation({ db: admin.firestore(), enqueue: enqueueCatalogBuild }, {
        eventId: event.id,
        appId: event.params.appId,
        productId: event.params.productId,
        before: event.data?.before?.exists ? event.data.before.data() : null,
        after: event.data?.after?.exists ? event.data.after.data() : null
    })
);

module.exports = {
    SOURCE_PATTERN,
    TRIGGER_REGION,
    enqueueCatalogBuild,
    hashEventId,
    onCatalogSourceWrite,
    recordCatalogMutation,
    taskIdForRevision
};
