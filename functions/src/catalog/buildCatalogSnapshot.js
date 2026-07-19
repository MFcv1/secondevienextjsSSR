const admin = require('firebase-admin');
const { onTaskDispatched } = require('firebase-functions/v2/tasks');
const { getFunctions } = require('firebase-admin/functions');
const { APP_ID } = require('../../helpers/config');
const { buildPublicProjection } = require('./publicProjection');
const { buildInventoryOverview } = require('./inventoryProjection');
const {
    CONTROL_DOCUMENT,
    acquireLease,
    assertLease,
    cleanError,
    clearLease,
    initialPublicationState
} = require('./publicationState');
const {
    POINTER_PATHS,
    buildSnapshotFiles,
    createPointer,
    isPreconditionError,
    publishCurrentPointer,
    readCurrentPointer,
    readPointerState,
    writeImmutableRelease
} = require('./snapshotStorage');
const { runReleaseGarbageCollection } = require('./releaseGarbageCollection');
const { catalogLog } = require('./structuredLog');
const { CATALOG_BUILDER_SERVICE_ACCOUNT, CATALOG_SNAPSHOT_BUCKET } = require('./catalogConfig');

const BUILD_REGION = 'europe-west1';
const SOURCE_PATH = `artifacts/${APP_ID}/public/data/furniture`;
const BUILD_TASK = `locations/${BUILD_REGION}/functions/dispatchCatalogBuild`;
const REVALIDATION_TASK = `locations/${BUILD_REGION}/functions/dispatchCatalogRevalidation`;

function serverTimestamp() {
    return admin.firestore.FieldValue.serverTimestamp();
}

async function acquireBuildLease(db, { targetRevision, owner, token, now = new Date() }) {
    const controlRef = db.doc(CONTROL_DOCUMENT);
    return db.runTransaction(async (transaction) => {
        const snap = await transaction.get(controlRef);
        const state = snap.exists ? snap.data() : initialPublicationState(now);
        if (state.mode === 'paused') return null;
        if (Number(state.publishedRevision || 0) >= Number(targetRevision) && !state.dirty) return null;
        const lease = acquireLease(state, { owner, targetRevision, token, now });
        if (!lease) return null;
        transaction.set(controlRef, lease, { merge: true });
        return { state: { ...state, ...lease }, lease };
    });
}

async function assertBuildStillCurrent(db, leaseToken, targetRevision) {
    const snap = await db.doc(CONTROL_DOCUMENT).get();
    if (!snap.exists) throw new Error('CONTROL_STATE_MISSING');
    assertLease(snap.data(), leaseToken, targetRevision);
    return snap.data();
}

async function finalizeControlState(db, { leaseToken, targetRevision, updates, now = new Date(), allowNewerRevision = false }) {
    const controlRef = db.doc(CONTROL_DOCUMENT);
    return db.runTransaction(async (transaction) => {
        const snap = await transaction.get(controlRef);
        if (!snap.exists) throw new Error('CONTROL_STATE_MISSING');
        const state = snap.data();
        if (state.leaseToken !== leaseToken) throw new Error('LEASE_LOST');
        const hasNewerRevision = Number(state.desiredRevision || 0) !== Number(targetRevision);
        if (hasNewerRevision && !allowNewerRevision) throw new Error('BUILD_OBSOLETE');
        transaction.set(controlRef, {
            ...clearLease(now),
            ...(!hasNewerRevision ? {
                dirtySince: null,
                quietUntil: null,
                queuedTaskName: null,
                queuedFor: null
            } : {}),
            ...updates,
            dirty: hasNewerRevision ? true : Boolean(updates.dirty),
            buildState: hasNewerRevision ? 'queued' : updates.buildState,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return { hasNewerRevision, state };
    });
}

async function releaseBuildLease(db, { leaseToken, updates = {}, now = new Date() }) {
    const controlRef = db.doc(CONTROL_DOCUMENT);
    return db.runTransaction(async (transaction) => {
        const snap = await transaction.get(controlRef);
        if (!snap.exists) return false;
        const state = snap.data();
        if (!leaseToken || state.leaseToken !== leaseToken) return false;
        transaction.set(controlRef, {
            ...clearLease(now),
            ...(state.mode === 'paused' ? {} : updates),
            updatedAt: serverTimestamp()
        }, { merge: true });
        return true;
    });
}

function buildRecordId(revision, leaseToken) {
    return `r${revision}-${String(leaseToken).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`;
}

function pointerFromControlState(state, slot) {
    const fields = slot === 'current'
        ? ['publishedRevision', 'currentManifestPath', 'currentManifestSha256']
        : slot === 'previous'
            ? ['previousRevision', 'previousManifestPath', 'previousManifestSha256']
            : ['lastKnownGoodRevision', 'lastKnownGoodManifestPath', 'lastKnownGoodManifestSha256'];
    const [revisionField, pathField, hashField] = fields;
    if (!state?.[revisionField] || !state?.[pathField] || !state?.[hashField]) return null;
    try {
        return createPointer({
            revision: state[revisionField],
            manifestPath: state[pathField],
            manifestSha256: state[hashField],
            publishedAt: null
        });
    } catch {
        return null;
    }
}

async function enqueueRevalidation(revision, manifestSha256) {
    const queue = getFunctions().taskQueue(REVALIDATION_TASK);
    await queue.enqueue(
        { schemaVersion: 1, revision, manifestSha256 },
        { scheduleDelaySeconds: 0, dispatchDeadlineSeconds: 300 }
    );
}

async function enqueueSuccessorBuild(revision, quietUntil) {
    const queue = getFunctions().taskQueue(BUILD_TASK);
    const scheduleTime = quietUntil instanceof Date ? quietUntil : quietUntil.toDate();
    const taskId = `catalog-build-r${revision}-q${scheduleTime.getTime()}`;
    try {
        await queue.enqueue(
            { schemaVersion: 1, targetRevision: revision },
            { id: taskId, scheduleTime, dispatchDeadlineSeconds: 1800 }
        );
    } catch (error) {
        const code = String(error?.code || '').toLowerCase();
        if (!code.includes('already-exists') && !code.includes('already_exists') && Number(error?.code) !== 6) throw error;
    }
    return taskId;
}

async function dispatchBuildRequest(dependencies, input = {}) {
    const { db, now = () => new Date(), enqueueSuccessor = enqueueSuccessorBuild, build = buildCatalog } = dependencies;
    const controlRef = db.doc(CONTROL_DOCUMENT);
    const controlSnap = await controlRef.get();
    if (!controlSnap.exists) return { result: 'noop', reason: 'control_missing' };
    const state = controlSnap.data();
    const desiredRevision = Number(state.desiredRevision || 0);
    const publishedRevision = Number(state.publishedRevision || 0);
    if (!state.dirty && publishedRevision >= desiredRevision) return { result: 'noop', reason: 'already_satisfied' };
    if (state.mode === 'paused') return { result: 'noop', reason: 'paused' };

    const quietUntil = state.quietUntil?.toDate?.() || (state.quietUntil instanceof Date ? state.quietUntil : null);
    if (quietUntil && quietUntil.getTime() > now().getTime()) {
        const taskId = await enqueueSuccessor(desiredRevision, quietUntil);
        await controlRef.set({
            queuedTaskName: taskId,
            queuedFor: quietUntil,
            buildState: 'queued',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return { result: 'rescheduled_for_debounce', revision: desiredRevision, taskId };
    }

    return build(dependencies, { ...input, targetRevision: desiredRevision });
}

async function buildCatalog(dependencies, input = {}) {
    const {
        db,
        bucket,
        now = () => new Date(),
        owner = process.env.K_REVISION || process.env.FUNCTION_TARGET || 'catalog-worker',
        leaseToken,
        enqueueRevalidationTask = enqueueRevalidation,
        logger = catalogLog
    } = dependencies;
    const startedAt = Date.now();
    const controlSnap = await db.doc(CONTROL_DOCUMENT).get();
    const requestedRevision = Number(input.targetRevision || controlSnap.data()?.desiredRevision || 0);
    if (!requestedRevision) return { result: 'noop', reason: 'no_revision' };

    const acquired = await acquireBuildLease(db, {
        targetRevision: requestedRevision,
        owner,
        token: leaseToken,
        now: now()
    });
    if (!acquired) return { result: 'noop', reason: 'lease_or_revision_satisfied' };

    const token = acquired.lease.leaseToken;
    const buildId = buildRecordId(requestedRevision, token);
    const buildRef = db.doc(`sys_catalog_publication_builds/${buildId}`);
    let sourceDocuments = [];
    let release = null;
    try {
        await buildRef.set({
            schemaVersion: 1,
            buildId,
            revision: requestedRevision,
            attempt: Number(input.attempt || 1),
            state: 'building',
            startedAt: serverTimestamp(),
            expireAt: new Date(now().getTime() + (90 * 24 * 60 * 60 * 1000))
        });

        const sourceSnapshot = await db.collection(SOURCE_PATH).get();
        sourceDocuments = sourceSnapshot.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }));
        const projection = buildPublicProjection(sourceDocuments);
        const inventory = buildInventoryOverview(sourceDocuments);
        const mutationTime = acquired.state.lastMutationAt?.toDate?.()
            || (acquired.state.lastMutationAt instanceof Date ? acquired.state.lastMutationAt : null);
        const generatedAt = (mutationTime || now()).toISOString();
        const snapshot = buildSnapshotFiles({ projection, inventory, revision: requestedRevision, generatedAt });

        await assertBuildStillCurrent(db, token, requestedRevision);
        await db.doc(CONTROL_DOCUMENT).set({ buildState: 'validating', updatedAt: serverTimestamp() }, { merge: true });
        release = await writeImmutableRelease(bucket, snapshot, requestedRevision);
        await assertBuildStillCurrent(db, token, requestedRevision);

        await buildRef.set({
            state: 'prepared',
            sourceDocuments: sourceDocuments.length,
            publicProducts: projection.full.length,
            aggregateSha256: projection.aggregateSha256,
            manifestPath: release.manifestPath,
            manifestSha256: release.manifestSha256,
            storageGenerations: release.generations,
            inventoryOverview: inventory,
            preparedAt: serverTimestamp()
        }, { merge: true });

        const currentState = await readPointerState(bucket, POINTER_PATHS.current);
        const currentPointer = currentState.error || currentState.missing
            ? null
            : { value: currentState.value, generation: currentState.generation };
        if (currentPointer?.value?.revision > requestedRevision) {
            throw Object.assign(new Error('POINTER_REVISION_AHEAD'), { code: 'POINTER_REVISION_AHEAD' });
        }
        if (Number(currentPointer?.value?.revision || 0) === requestedRevision
            && currentPointer.value.manifestSha256 !== release.manifestSha256) {
            throw Object.assign(new Error('REVISION_COLLISION'), { code: 'REVISION_COLLISION' });
        }
        if ((currentState.error || currentState.missing)
            && Number(acquired.state.publishedRevision || 0) === requestedRevision
            && String(acquired.state.currentManifestSha256 || '') !== release.manifestSha256) {
            throw Object.assign(new Error('REVISION_COLLISION'), { code: 'REVISION_COLLISION' });
        }
        const controlCurrent = pointerFromControlState(acquired.state, 'current');
        const controlPrevious = pointerFromControlState(acquired.state, 'previous');
        const controlLastKnownGood = pointerFromControlState(acquired.state, 'last-known-good');
        const currentRevision = Number(currentPointer?.value?.revision || 0);
        const controlPublishedRevision = Number(acquired.state.publishedRevision || 0);
        const previousCandidate = controlPublishedRevision >= requestedRevision
            ? controlPrevious
            : currentRevision > 0 && currentRevision < requestedRevision
                ? currentPointer.value
                : controlCurrent;
        const lastKnownGoodCandidate = previousCandidate === controlPrevious
            ? controlLastKnownGood
            : controlPrevious || controlLastKnownGood;
        const published = await publishCurrentPointer(bucket, {
            revision: requestedRevision,
            release,
            previous: previousCandidate,
            lastKnownGood: lastKnownGoodCandidate,
            excludedManifestSha256: acquired.state.rejectedManifestSha256 || null,
            expectedGeneration: currentState.generation || 0
        });
        const previousPointer = published.previousPointer;
        const lastKnownGoodPointer = published.lastKnownGoodPointer;

        await db.doc('inventory_stats/overview').set({
            ...inventory,
            lastUpdatedAt: serverTimestamp(),
            expireAt: new Date(now().getTime() + (90 * 24 * 60 * 60 * 1000)),
            catalogRevision: requestedRevision,
            source: 'materialized_catalog'
        }, { merge: true });

        await finalizeControlState(db, {
            leaseToken: token,
            targetRevision: requestedRevision,
            now: now(),
            allowNewerRevision: true,
            updates: {
            dirty: false,
            publishedRevision: requestedRevision,
            preparedRevision: requestedRevision,
            preparedManifestPath: release.manifestPath,
            preparedManifestSha256: release.manifestSha256,
            currentManifestPath: release.manifestPath,
            currentManifestSha256: release.manifestSha256,
            currentPointerGeneration: published.generation,
            previousRevision: previousPointer?.revision || null,
            previousManifestPath: previousPointer?.manifestPath || null,
            previousManifestSha256: previousPointer?.manifestSha256 || null,
            lastKnownGoodRevision: lastKnownGoodPointer?.revision || null,
            lastKnownGoodManifestPath: lastKnownGoodPointer?.manifestPath || null,
            lastKnownGoodManifestSha256: lastKnownGoodPointer?.manifestSha256 || null,
            buildState: 'revalidating',
            lastBuildCompletedAt: serverTimestamp(),
            lastPublishedAt: serverTimestamp(),
            consecutiveFailures: 0,
            rejectedRevision: null,
            rejectedManifestPath: null,
            rejectedManifestSha256: null,
            lastError: null
            }
        });
        await buildRef.set({ state: 'published', pointerGeneration: published.generation, publishedAt: serverTimestamp() }, { merge: true });

        try {
            await enqueueRevalidationTask(requestedRevision, release.manifestSha256);
        } catch (error) {
            await db.doc(CONTROL_DOCUMENT).set({
                buildState: 'degraded',
                lastError: cleanError(error),
                updatedAt: serverTimestamp()
            }, { merge: true });
            await buildRef.set({ state: 'revalidate_pending', revalidationError: cleanError(error) }, { merge: true });
            logger('error', {
                phase: 'revalidate', buildId, targetRevision: requestedRevision,
                result: 'enqueue_failed', code: String(error.code || error.name || 'UNKNOWN')
            });
            return { result: 'published_revalidation_pending', buildId, release, revision: requestedRevision };
        }

        try {
            const garbageCollection = await runReleaseGarbageCollection(bucket, { commit: true, now: now() });
            logger('info', {
                phase: 'release_gc',
                buildId,
                targetRevision: requestedRevision,
                result: garbageCollection.result,
                totalReleases: garbageCollection.totalReleases,
                retainedReleases: garbageCollection.retainedReleases,
                deletedReleases: garbageCollection.deletedReleases,
                deletedObjects: garbageCollection.deletedObjects
            });
        } catch (garbageCollectionError) {
            logger('error', {
                phase: 'release_gc',
                buildId,
                targetRevision: requestedRevision,
                result: 'failed',
                code: String(garbageCollectionError.code || garbageCollectionError.name || 'UNKNOWN')
            });
        }

        logger('info', {
            phase: 'publish', buildId, targetRevision: requestedRevision,
            sourceDocuments: sourceDocuments.length, publicProducts: projection.full.length,
            filesWritten: Object.keys(release.generations).length,
            durationMs: Date.now() - startedAt, result: 'success', mode: 'active'
        });
        return { result: 'published', buildId, release, revision: requestedRevision };
    } catch (error) {
        if (isPreconditionError(error)) {
            const latest = await readCurrentPointer(bucket).catch(() => null);
            if (Number(latest?.value?.revision || 0) >= requestedRevision) {
                await releaseBuildLease(db, {
                    leaseToken: token,
                    now: now(),
                    updates: { buildState: 'healthy' }
                });
                return { result: 'cas_noop', revision: latest.value.revision };
            }
        }
        await Promise.all([
            buildRef.set({ state: 'failed', error: cleanError(error), failedAt: serverTimestamp() }, { merge: true }),
            releaseBuildLease(db, {
                leaseToken: token,
                now: now(),
                updates: {
                    dirty: true,
                    buildState: 'degraded',
                    lastError: cleanError(error),
                    consecutiveFailures: admin.firestore.FieldValue.increment(1)
                }
            })
        ]).catch(() => null);
        logger('error', {
            phase: 'build', buildId, targetRevision: requestedRevision,
            sourceDocuments: sourceDocuments.length, durationMs: Date.now() - startedAt,
            result: 'failed', code: String(error.code || error.name || 'UNKNOWN')
        });
        throw error;
    }
}

const dispatchCatalogBuild = onTaskDispatched(
    {
        region: BUILD_REGION,
        serviceAccount: CATALOG_BUILDER_SERVICE_ACCOUNT,
        retryConfig: { maxAttempts: 10, minBackoffSeconds: 5, maxBackoffSeconds: 300, maxDoublings: 5 },
        rateLimits: { maxConcurrentDispatches: 1, maxDispatchesPerSecond: 1 }
    },
    async (request) => dispatchBuildRequest({
        db: admin.firestore(),
        bucket: admin.storage().bucket(CATALOG_SNAPSHOT_BUCKET)
    }, request.data || {})
);

module.exports = {
    BUILD_REGION,
    SOURCE_PATH,
    acquireBuildLease,
    assertBuildStillCurrent,
    buildCatalog,
    buildRecordId,
    dispatchBuildRequest,
    dispatchCatalogBuild,
    finalizeControlState,
    releaseBuildLease
};
