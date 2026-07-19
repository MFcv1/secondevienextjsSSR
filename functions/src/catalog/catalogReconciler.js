const admin = require('firebase-admin');
const { getFunctions } = require('firebase-admin/functions');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const {
    CONTROL_DOCUMENT,
    clearLease,
    initialPublicationState,
    isLeaseActive,
    needsCatalogRevalidation,
    normalizePublicationMode
} = require('./publicationState');
const {
    POINTER_PATHS,
    createPointer,
    isCatalogIntegrityError,
    readPointerState,
    verifyStoredRelease
} = require('./snapshotStorage');
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

async function inspectCatalogPointer(bucket, path) {
    const state = await readPointerState(bucket, path);
    if (state.missing) return { ...state, healthy: false, failureKind: 'missing', errorCode: 'CATALOG_POINTER_MISSING' };
    if (state.error) return { ...state, healthy: false, failureKind: 'pointer', errorCode: String(state.error.code || 'CATALOG_POINTER_INVALID') };
    try {
        const verified = await verifyStoredRelease(bucket, state.value);
        return { ...state, value: verified.pointer, healthy: true, failureKind: null, errorCode: null };
    } catch (error) {
        if (!isCatalogIntegrityError(error)) throw error;
        return {
            ...state,
            healthy: false,
            failureKind: 'release',
            errorCode: String(error.code || error.message || 'CATALOG_RELEASE_INVALID').slice(0, 120)
        };
    }
}

function samePointerIdentity(left, right) {
    return Boolean(left && right
        && Number(left.revision) === Number(right.revision)
        && String(left.manifestPath || '') === String(right.manifestPath || '')
        && String(left.manifestSha256 || '') === String(right.manifestSha256 || ''));
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

async function inspectControlRelease(bucket, state) {
    const pointer = pointerFromControlState(state, 'current');
    if (!pointer) return { healthy: false, failureKind: 'release', errorCode: 'CATALOG_CONTROL_RELEASE_MISSING' };
    try {
        await verifyStoredRelease(bucket, pointer);
        return { healthy: true, pointer };
    } catch (error) {
        if (!isCatalogIntegrityError(error)) throw error;
        return {
            healthy: false,
            failureKind: 'release',
            errorCode: String(error.code || error.message || 'CATALOG_CONTROL_RELEASE_INVALID').slice(0, 120)
        };
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
    const repairs = [];
    let mode = normalizePublicationMode(state.mode);
    let workingState = { ...state, mode };
    if (state.mode !== mode) {
        await controlRef.set({ mode, updatedAt: serverTimestamp() }, { merge: true });
        repairs.push('mode_normalized');
    }
    if (state.leaseToken && !isLeaseActive(state, now().getTime())) {
        const leaseRepair = { ...clearLease(now()), dirty: true, buildState: 'queued' };
        await controlRef.set(leaseRepair, { merge: true });
        workingState = { ...workingState, ...leaseRepair };
        repairs.push('expired_lease');
    }

    const [currentInspection, previousInspection, lastKnownGoodInspection] = await Promise.all([
        inspectCatalogPointer(bucket, POINTER_PATHS.current),
        inspectCatalogPointer(bucket, POINTER_PATHS.previous),
        inspectCatalogPointer(bucket, POINTER_PATHS.lastKnownGood)
    ]);
    const pointer = currentInspection.healthy
        ? { value: currentInspection.value, generation: currentInspection.generation }
        : null;
    const previousPointer = previousInspection.healthy
        ? { value: previousInspection.value, generation: previousInspection.generation }
        : null;
    const lastKnownGoodPointer = lastKnownGoodInspection.healthy
        ? { value: lastKnownGoodInspection.value, generation: lastKnownGoodInspection.generation }
        : null;

    if (['preparing', 'incomplete'].includes(workingState.rollbackState)) {
        if (workingState.leaseToken) {
            logger('info', {
                phase: 'reconcile',
                targetRevision: Number(workingState.rollbackTargetRevision || 0),
                result: 'rollback_waiting_for_build_fence'
            });
            return { result: 'rollback_waiting_for_build_fence', repairs };
        }
        const targetMatchesCurrent = pointer?.value
            && Number(pointer.value.revision) === Number(workingState.rollbackTargetRevision || 0)
            && String(pointer.value.manifestSha256 || '') === String(workingState.rollbackTargetManifestSha256 || '');
        if (targetMatchesCurrent) {
            const rollbackSource = workingState.rollbackSourceRevision
                && workingState.rollbackSourceManifestPath
                && workingState.rollbackSourceManifestSha256
                ? createPointer({
                    revision: workingState.rollbackSourceRevision,
                    manifestPath: workingState.rollbackSourceManifestPath,
                    manifestSha256: workingState.rollbackSourceManifestSha256,
                    publishedAt: null
                })
                : null;
            const previousMatchesSource = !rollbackSource
                || samePointerIdentity(previousPointer?.value, rollbackSource);
            const rollbackRecovery = {
                ...clearLease(now()),
                mode: 'paused',
                publishedRevision: Number(pointer.value.revision),
                currentManifestPath: pointer.value.manifestPath,
                currentManifestSha256: pointer.value.manifestSha256,
                currentPointerGeneration: pointer.generation,
                revalidatedRevision: null,
                revalidatedManifestSha256: null,
                rejectedRevision: Number(workingState.rollbackSourceRevision || 0) || null,
                rejectedManifestPath: workingState.rollbackSourceManifestPath || null,
                rejectedManifestSha256: workingState.rollbackSourceManifestSha256 || null,
                ...(rollbackSource && previousMatchesSource ? {
                    previousRevision: Number(previousPointer.value.revision),
                    previousManifestPath: previousPointer.value.manifestPath,
                    previousManifestSha256: previousPointer.value.manifestSha256
                } : {}),
                ...(previousMatchesSource ? {
                    rollbackState: null,
                    rollbackToken: null,
                    rollbackTarget: null,
                    rollbackTargetRevision: null,
                    rollbackTargetManifestSha256: null,
                    rollbackSourceRevision: null,
                    rollbackSourceManifestPath: null,
                    rollbackSourceManifestSha256: null,
                    rollbackPreviousMode: null,
                    rollbackPreviousDirty: null,
                    rollbackPreviousBuildState: null,
                    buildState: 'revalidating',
                    lastError: null
                } : {
                    rollbackState: 'incomplete',
                    buildState: 'degraded',
                    lastError: { code: 'ROLLBACK_PREVIOUS_REPAIR_REQUIRED' }
                }),
                updatedAt: serverTimestamp()
            };
            await controlRef.set(rollbackRecovery, { merge: true });
            workingState = { ...workingState, ...rollbackRecovery };
            repairs.push(previousMatchesSource ? 'rollback_finalized' : 'rollback_previous_repair_required');
        } else if (workingState.rollbackState === 'preparing' && currentInspection.healthy) {
            const dirty = Boolean(workingState.dirty || workingState.rollbackPreviousDirty);
            mode = normalizePublicationMode(workingState.rollbackPreviousMode);
            const rollbackAbort = {
                ...clearLease(now()),
                mode,
                dirty,
                rollbackState: null,
                rollbackToken: null,
                rollbackTarget: null,
                rollbackTargetRevision: null,
                rollbackTargetManifestSha256: null,
                rollbackSourceRevision: null,
                rollbackSourceManifestPath: null,
                rollbackSourceManifestSha256: null,
                rollbackPreviousMode: null,
                rollbackPreviousDirty: null,
                rollbackPreviousBuildState: null,
                buildState: dirty ? 'queued' : (workingState.rollbackPreviousBuildState || 'healthy'),
                lastError: { code: 'ROLLBACK_ABORTED_BEFORE_CAS' },
                updatedAt: serverTimestamp()
            };
            await controlRef.set(rollbackAbort, { merge: true });
            workingState = { ...workingState, ...rollbackAbort };
            repairs.push('rollback_aborted');
        } else {
            const rollbackDegraded = {
                mode: 'paused',
                buildState: 'degraded',
                lastError: { code: 'ROLLBACK_RECOVERY_POINTER_UNAVAILABLE' },
                updatedAt: serverTimestamp()
            };
            await controlRef.set(rollbackDegraded, { merge: true });
            workingState = { ...workingState, ...rollbackDegraded };
            repairs.push('rollback_recovery_degraded');
        }
    }
    const pointerDiffersFromControl = pointer?.value && (
        Number(pointer.value.revision) !== Number(workingState.publishedRevision || 0)
        || String(pointer.value.manifestPath || '') !== String(workingState.currentManifestPath || '')
        || String(pointer.value.manifestSha256 || '') !== String(workingState.currentManifestSha256 || '')
        || String(pointer.generation || '') !== String(workingState.currentPointerGeneration || '')
    );
    const previousDiffersFromControl = previousPointer?.value
        && !samePointerIdentity(previousPointer.value, pointerFromControlState(workingState, 'previous'));
    const lastKnownGoodDiffersFromControl = lastKnownGoodPointer?.value
        && !samePointerIdentity(lastKnownGoodPointer.value, pointerFromControlState(workingState, 'last-known-good'));
    const pointerControlUpdate = {};
    if (pointerDiffersFromControl) {
        Object.assign(pointerControlUpdate, {
            publishedRevision: Number(pointer.value.revision),
            currentManifestPath: pointer.value.manifestPath,
            currentManifestSha256: pointer.value.manifestSha256,
            currentPointerGeneration: pointer.generation
        });
    }
    if (mode === 'active' && previousPointer?.value && previousDiffersFromControl) {
        Object.assign(pointerControlUpdate, {
            previousRevision: previousPointer?.value?.revision || null,
            previousManifestPath: previousPointer?.value?.manifestPath || null,
            previousManifestSha256: previousPointer?.value?.manifestSha256 || null
        });
    }
    if (mode === 'active' && lastKnownGoodPointer?.value && lastKnownGoodDiffersFromControl) {
        Object.assign(pointerControlUpdate, {
            lastKnownGoodRevision: lastKnownGoodPointer?.value?.revision || null,
            lastKnownGoodManifestPath: lastKnownGoodPointer?.value?.manifestPath || null,
            lastKnownGoodManifestSha256: lastKnownGoodPointer?.value?.manifestSha256 || null
        });
    }
    if (Object.keys(pointerControlUpdate).length) {
        pointerControlUpdate.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        await controlRef.set(pointerControlUpdate, { merge: true });
        workingState = { ...workingState, ...pointerControlUpdate };
        repairs.push('firestore_from_pointer');
    }

    const expectedPreviousMissing = Boolean(workingState.previousManifestPath) && !previousInspection.healthy;
    const expectedLastKnownGoodMissing = Boolean(workingState.lastKnownGoodManifestPath) && !lastKnownGoodInspection.healthy;
    let currentFailure = currentInspection;
    if (!currentInspection.healthy && currentInspection.failureKind !== 'release') {
        const controlRelease = await inspectControlRelease(bucket, workingState);
        if (!controlRelease.healthy) currentFailure = { ...currentInspection, ...controlRelease };
    }
    const pausedPreviousMismatch = mode === 'paused'
        && Boolean(workingState.previousManifestPath)
        && previousDiffersFromControl;
    const pausedLastKnownGoodMismatch = mode === 'paused'
        && Boolean(workingState.lastKnownGoodManifestPath)
        && lastKnownGoodDiffersFromControl;
    const brokenInspection = !currentInspection.healthy
        ? currentFailure
        : expectedPreviousMissing
            ? previousInspection
            : expectedLastKnownGoodMissing
                ? lastKnownGoodInspection
                : pausedPreviousMismatch
                    ? { failureKind: 'pointer', errorCode: 'CATALOG_PREVIOUS_POINTER_DIVERGED' }
                    : pausedLastKnownGoodMismatch
                        ? { failureKind: 'pointer', errorCode: 'CATALOG_LKG_POINTER_DIVERGED' }
                        : null;
    if (brokenInspection) {
        const desiredRevision = Number(workingState.desiredRevision || 0);
        const publishedRevision = Number(workingState.publishedRevision || 0);
        const highWater = Math.max(desiredRevision, publishedRevision, Number(pointer?.value?.revision || 0));
        const alreadyHasNewerDirtyRevision = Boolean(workingState.dirty && desiredRevision > publishedRevision);
        const repairRevision = alreadyHasNewerDirtyRevision
            ? desiredRevision
            : brokenInspection.failureKind === 'release'
                ? Math.max(1, highWater + 1)
                : Math.max(1, highWater);
        const repairUpdate = {
            dirty: true,
            desiredRevision: repairRevision,
            buildState: 'degraded',
            lastError: { code: brokenInspection.errorCode },
            updatedAt: serverTimestamp()
        };
        await controlRef.set(repairUpdate, { merge: true });
        workingState = { ...workingState, ...repairUpdate };
        repairs.push('snapshot_repair_requested');
    }

    const effectiveState = workingState;
    const published = Number(pointer?.value?.revision || effectiveState.publishedRevision || 0);
    if (pointer?.value && needsCatalogRevalidation(effectiveState, pointer.value)) {
        const identity = String(pointer.value.manifestSha256).slice(0, 12);
        const timeBucket = Math.floor(now().getTime() / (5 * 60 * 1000));
        await enqueue('dispatchCatalogRevalidation', {
            schemaVersion: 1,
            revision: published,
            manifestSha256: pointer.value.manifestSha256
        }, `catalog-reconcile-revalidate-r${published}-${identity}-g${pointer.generation}-t${timeBucket}`);
        repairs.push('revalidation_enqueued');
    }

    if (mode === 'paused') {
        logger('info', { phase: 'reconcile', targetRevision: Number(effectiveState.desiredRevision || 0), result: repairs.join(',') || 'paused' });
        return { result: repairs.length ? 'repaired_paused' : 'paused', repairs };
    }

    const desired = Number(effectiveState.desiredRevision || 0);
    const satisfied = published >= desired;
    if ((effectiveState.dirty || !satisfied) && !isLeaseActive(effectiveState, now().getTime())) {
        const timeBucket = Math.floor(now().getTime() / (5 * 60 * 1000));
        const taskId = `catalog-reconcile-build-r${desired}-t${timeBucket}`;
        await enqueue('dispatchCatalogBuild', { schemaVersion: 1, targetRevision: desired }, taskId);
        await controlRef.set({ queuedTaskName: taskId, buildState: 'queued', updatedAt: serverTimestamp() }, { merge: true });
        repairs.push('build_enqueued');
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
    inspectCatalogPointer,
    reconcileCatalog
};
