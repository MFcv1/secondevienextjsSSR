const admin = require('firebase-admin');
const { getFunctions } = require('firebase-admin/functions');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { CONTROL_DOCUMENT, clearLease, initialPublicationState, isLeaseActive } = require('./publicationState');
const { readCurrentPointer } = require('./snapshotStorage');
const { catalogLog } = require('./structuredLog');
const { CATALOG_ENQUEUER_SERVICE_ACCOUNT, CATALOG_SNAPSHOT_BUCKET } = require('./catalogConfig');

const RECONCILER_REGION = 'europe-west1';

async function enqueueNamed(queueName, data, id) {
    const queue = getFunctions().taskQueue(`locations/${RECONCILER_REGION}/functions/${queueName}`);
    try {
        await queue.enqueue(data, { id, scheduleDelaySeconds: 0, dispatchDeadlineSeconds: 1800 });
        return true;
    } catch (error) {
        const code = String(error?.code || '').toLowerCase();
        if (code.includes('already-exists') || code.includes('already_exists') || Number(error?.code) === 6) return false;
        throw error;
    }
}

async function reconcileCatalog(dependencies) {
    const {
        db,
        bucket,
        now = () => new Date(),
        enqueue = enqueueNamed,
        logger = catalogLog
    } = dependencies;
    const controlRef = db.doc(CONTROL_DOCUMENT);
    const controlSnap = await controlRef.get();
    if (!controlSnap.exists) {
        await controlRef.set(initialPublicationState(now()));
        return { result: 'initialized' };
    }
    const state = controlSnap.data();
    if (state.mode === 'paused') return { result: 'paused' };
    const repairs = [];
    if (state.leaseToken && !isLeaseActive(state, now().getTime())) {
        await controlRef.set({ ...clearLease(now()), dirty: true, buildState: 'queued' }, { merge: true });
        repairs.push('expired_lease');
    }

    const pointer = await readCurrentPointer(bucket).catch(() => null);
    if (pointer?.value?.revision > Number(state.publishedRevision || 0)) {
        await controlRef.set({
            publishedRevision: Number(pointer.value.revision),
            currentManifestPath: pointer.value.manifestPath,
            currentManifestSha256: pointer.value.manifestSha256,
            currentPointerGeneration: pointer.generation,
            previousRevision: pointer.value.previous?.revision || null,
            previousManifestPath: pointer.value.previous?.manifestPath || null,
            previousManifestSha256: pointer.value.previous?.manifestSha256 || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        repairs.push('firestore_from_pointer');
    }

    const desired = Number(state.desiredRevision || 0);
    const satisfied = ['legacy', 'shadow'].includes(state.mode)
        ? Number(state.preparedRevision || 0) >= desired
        : Number(pointer?.value?.revision || state.publishedRevision || 0) >= desired;
    if ((state.dirty || !satisfied) && !isLeaseActive(state, now().getTime())) {
        const taskId = `catalog-reconcile-build-r${desired}`;
        await enqueue('dispatchCatalogBuild', { schemaVersion: 1, targetRevision: desired }, taskId);
        await controlRef.set({ queuedTaskName: taskId, buildState: 'queued', updatedAt: serverTimestamp() }, { merge: true });
        repairs.push('build_enqueued');
    }

    const published = Number(pointer?.value?.revision || state.publishedRevision || 0);
    if (published > Number(state.revalidatedRevision || 0) && pointer?.value?.manifestSha256) {
        await enqueue('dispatchCatalogRevalidation', {
            schemaVersion: 1,
            revision: published,
            manifestSha256: pointer.value.manifestSha256
        }, `catalog-reconcile-revalidate-r${published}`);
        repairs.push('revalidation_enqueued');
    }
    logger('info', { phase: 'reconcile', targetRevision: desired, result: repairs.join(',') || 'healthy' });
    return { result: repairs.length ? 'repaired' : 'healthy', repairs };
}

function serverTimestamp() {
    return admin.firestore.FieldValue.serverTimestamp();
}

const catalogReconciler = onSchedule(
    {
        schedule: 'every 5 minutes',
        region: RECONCILER_REGION,
        serviceAccount: CATALOG_ENQUEUER_SERVICE_ACCOUNT,
        timeoutSeconds: 120,
        memory: '256MiB'
    },
    async () => reconcileCatalog({
        db: admin.firestore(),
        bucket: admin.storage().bucket(CATALOG_SNAPSHOT_BUCKET)
    })
);

module.exports = {
    RECONCILER_REGION,
    catalogReconciler,
    enqueueNamed,
    reconcileCatalog
};
