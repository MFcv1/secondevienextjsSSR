'use strict';
const { createHash } = require('node:crypto');
const admin = require('firebase-admin');
const { logger } = require('firebase-functions');
const { getFunctions } = require('firebase-admin/functions');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { onTaskDispatched } = require('firebase-functions/v2/tasks');
const { gcGroup, markGcGroup, createGcWork } = require('./gcGroups.cjs');
const { CATALOG_BUILDER_SERVICE_ACCOUNT, CATALOG_SNAPSHOT_BUCKET } = require('./catalogConfig');
const { releasePrefixFromObjectName, RELEASE_GRACE_MS } = require('./releaseGarbageCollection');
const { readCurrentPointer, readPreviousPointer, readLastKnownGoodPointer } = require('./snapshotStorage');
const { runMediaGarbageCollection } = require('./mediaGarbageCollection');
const digest = value => createHash('sha256').update(value).digest('hex');
const collectionFor = category => category === 'media' ? 'sys_catalog_media_gc' : 'sys_catalog_release_gc';

async function registerReleaseObject(db, object) {
    const prefix = releasePrefixFromObjectName(object.name);
    if (!prefix || object.bucket !== CATALOG_SNAPSHOT_BUCKET) return { outcome: 'ignored' };
    const createdAt = Date.parse(object.timeCreated);
    if (!Number.isFinite(createdAt) || !object.generation) throw Error('GC_RELEASE_METADATA_INVALID');
    const ref = db.doc(`sys_catalog_release_gc/${digest(prefix)}`);
    return db.runTransaction(async tx => {
        const prior = (await tx.get(ref)).data();
        if (prior && prior.newestObjectAt >= createdAt) return { outcome: 'duplicate' };
        const group = gcGroup('release', createdAt + RELEASE_GRACE_MS);
        const changedGroup = !prior || prior.gcGroupId !== group.id;
        const recent = changedGroup ? await tx.get(db.collection('sys_catalog_release_gc').orderBy('newestObjectAt', 'desc').limit(11)) : { docs: [] };
        tx.set(ref, { schemaVersion: 1, prefix, newestObjectAt: createdAt,
            representativeObject: object.name, generation: String(object.generation),
            gcGroupId: group.id, notBefore: new Date(createdAt + RELEASE_GRACE_MS), state: 'candidate' });
        if (changedGroup) markGcGroup(tx, db, group);
        const leavingRecent = recent.docs.filter(doc => doc.id !== ref.id)[9]?.data();
        if (leavingRecent && createdAt > leavingRecent.newestObjectAt) {
            markGcGroup(tx, db, gcGroup('release', leavingRecent.newestObjectAt + RELEASE_GRACE_MS));
        }
        return { outcome: 'registered', groupId: group.id };
    });
}
async function inspectGroup(db, snapshotBucket, group) {
    let query = db.collection(collectionFor(group.category)).where('gcGroupId', '==', group.id)
        .orderBy(admin.firestore.FieldPath.documentId()).limit(26);
    if (group.cursor) query = query.startAfter(group.cursor);
    const snapshot = await query.get(), docs = snapshot.docs.slice(0, 25);
    const cursor = snapshot.size > 25 ? docs.at(-1).id : null;
    if (!docs.length) return { cursor: null, report: { result: 'empty', deleted: 0 } };
    if (group.category === 'media') {
        const report = await runMediaGarbageCollection({ db, mediaBucket: admin.storage().bucket('secondevienextjsssr.firebasestorage.app'), snapshotBucket },
            { commit: false, candidates: { docs, empty: false } });
        return { cursor, report };
    }
    const [current, previous, lkg, latest] = await Promise.all([
        readCurrentPointer(snapshotBucket), readPreviousPointer(snapshotBucket), readLastKnownGoodPointer(snapshotBucket),
        db.collection('sys_catalog_release_gc').orderBy('newestObjectAt', 'desc').limit(10).get()
    ]);
    if (!current?.value?.manifestPath) throw Error('GC_CURRENT_POINTER_MISSING');
    const protectedPrefixes = new Set([
        ...[current, previous, lkg].map(p => p?.value?.manifestPath?.replace(/\/manifest\.json$/, '')).filter(Boolean),
        ...latest.docs.map(doc => doc.data().prefix)
    ]);
    let retained = 0, candidates = 0;
    for (const doc of docs) {
        const release = doc.data();
        if (protectedPrefixes.has(release.prefix) || release.notBefore.toMillis() > Date.now()) retained++;
        else candidates++;
    }
    // No automatic destructive path. A report cannot authorize a later delete;
    // source references, pointer fences and generations must be checked anew.
    return { cursor, report: { result: 'dry_run', inspected: docs.length, retained, candidates, deleted: 0 } };
}
function runtime() {
    const db = admin.firestore(), bucket = admin.storage().bucket(CATALOG_SNAPSHOT_BUCKET);
    return createGcWork({ db, inspect: group => inspectGroup(db, bucket, group),
        hasCandidates: async group => !(await db.collection(collectionFor(group.category)).where('gcGroupId', '==', group.id).limit(1).get()).empty,
        enqueue: (_kind, data, options) => getFunctions().taskQueue('locations/europe-west1/functions/dispatchCatalogGcGroupGen2').enqueue(data, options),
        observe: (state, fields) => logger[['needs_attention', 'dispatch_failed'].includes(state) ? 'error' : 'info']('maintenance_lifecycle', { event: `maintenance_${state}`, correlationId: fields.operationId, state, ...fields }) });
}
const options = { region: 'europe-west1', serviceAccount: CATALOG_BUILDER_SERVICE_ACCOUNT, cpu: 1, concurrency: 1,
    minInstances: 0, maxInstances: 1, memory: '512MiB', timeoutSeconds: 540 };
const registerCatalogReleaseGcGen2 = onObjectFinalized({ ...options, region: 'europe-west4', bucket: CATALOG_SNAPSHOT_BUCKET, retry: true }, event => {
    if (process.env.CATALOG_GC_MODE !== 'grouped_dry_run') return null;
    return registerReleaseObject(admin.firestore(), event.data);
});
const scheduleCatalogGcGroupGen2 = onDocumentWritten({ ...options, document: 'sys_catalog_gc_groups/{groupId}', retry: true }, event => {
    const before = event.data?.before?.data(), after = event.data?.after?.data();
    if (!after || (before?.dirtyToken === after.dirtyToken && !(after.maintenanceWork?.state === 'pending' && before?.maintenanceWork?.generation !== after.maintenanceWork.generation))) return null;
    return runtime().scheduleGroup(event.params.groupId);
});
const onCatalogGcPointersWrittenGen2 = onDocumentWritten({ ...options, document: 'sys_catalog_publication/{catalogId}', retry: true }, async event => {
    if (process.env.CATALOG_GC_MODE !== 'grouped_dry_run') return null;
    const before = event.data?.before?.data(), after = event.data?.after?.data();
    if (!before || !after) return null;
    const paths = ['currentManifestPath', 'previousManifestPath', 'lastKnownGoodManifestPath'];
    const released = [...new Set(paths.filter(key => before[key] && before[key] !== after[key]).map(key => before[key].replace(/\/manifest\.json$/, '')))];
    if (!released.length) return null;
    const db = admin.firestore();
    return db.runTransaction(async tx => {
        const records = await Promise.all(released.map(prefix => tx.get(db.doc(`sys_catalog_release_gc/${digest(prefix)}`))));
        for (const record of records) if (record.exists) {
            markGcGroup(tx, db, gcGroup('release', record.data().newestObjectAt + RELEASE_GRACE_MS));
        }
    });
});
const dispatchCatalogGcGroupGen2 = onTaskDispatched({ ...options, invoker: [CATALOG_BUILDER_SERVICE_ACCOUNT],
    retryConfig: { maxAttempts: 20, minBackoffSeconds: 10, maxBackoffSeconds: 120, maxDoublings: 3 },
    rateLimits: { maxConcurrentDispatches: 1, maxDispatchesPerSecond: 1 } }, request => {
    if (request.data?.kind !== 'gc') throw Error('GC_GROUP_TASK_INVALID');
    return runtime().dispatch(request);
});
module.exports = { registerCatalogReleaseGcGen2, scheduleCatalogGcGroupGen2, onCatalogGcPointersWrittenGen2, dispatchCatalogGcGroupGen2, registerReleaseObject, inspectGroup };
