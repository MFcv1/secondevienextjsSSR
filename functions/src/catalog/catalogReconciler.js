const admin = require('firebase-admin');
const { getFunctions } = require('firebase-admin/functions');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const {
    CONTROL_DOCUMENT,
    catalogRevalidationTaskId,
    clearLease,
    initialPublicationState,
    isLeaseActive,
    isRollbackActive,
    needsCatalogRevalidation,
    nextStateVersion,
    normalizePublicationMode,
    toMillis
} = require('./publicationState');
const {
    POINTER_PATHS,
    createPointer,
    isCatalogIntegrityError,
    readPointerState,
    readImpactPlan,
    verifyStoredRelease,
    writePointer
} = require('./snapshotStorage');
const { createFullImpactPlan, validateImpactPlan } = require('./impactPlan');
const { catalogLog } = require('./structuredLog');
const { CATALOG_BUILDER_SERVICE_ACCOUNT, CATALOG_SNAPSHOT_BUCKET } = require('./catalogConfig');

const RECONCILER_REGION = 'europe-west1';
const MAX_STATE_ADVANCE_ATTEMPTS = 3;

async function enqueueNamed(queueName, data, id) {
    const queue = getFunctions().taskQueue(`locations/${RECONCILER_REGION}/functions/${queueName}`);
    try {
        await queue.enqueue(data, { id, scheduleDelaySeconds: 0, dispatchDeadlineSeconds: 300 });
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
        return {
            ...state,
            value: verified.pointer,
            manifest: verified.manifest,
            impactPlan: verified.impactPlan,
            healthy: true,
            failureKind: null,
            errorCode: null
        };
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
    const applyRepair = async (patch, guard = () => true) => {
        const result = await db.runTransaction(async (transaction) => {
            const snap = await transaction.get(controlRef);
            const fresh = snap.exists ? snap.data() : {};
            if (Number(fresh.stateVersion || 0) !== Number(workingState.stateVersion || 0)) return null;
            if (!guard(fresh)) return null;
            const update = {
                ...patch,
                stateVersion: nextStateVersion(fresh),
                updatedAt: serverTimestamp()
            };
            transaction.set(controlRef, update, { merge: true });
            return { ...fresh, ...update };
        });
        if (!result) {
            const stale = new Error('RECONCILE_STATE_ADVANCED');
            stale.code = 'RECONCILE_STATE_ADVANCED';
            throw stale;
        }
        workingState = result;
        return result;
    };
    if (state.mode !== mode) {
        await applyRepair({ mode });
        repairs.push('mode_normalized');
    }
    if (state.leaseToken && !isLeaseActive(state, now().getTime())) {
        const leaseRepair = { ...clearLease(now()), dirty: true, buildState: 'queued' };
        await applyRepair(leaseRepair, (fresh) => fresh.leaseToken === state.leaseToken && !isLeaseActive(fresh, now().getTime()));
        repairs.push('expired_lease');
    }

    const [currentInspection, initialPreviousInspection, lastKnownGoodInspection] = await Promise.all([
        inspectCatalogPointer(bucket, POINTER_PATHS.current),
        inspectCatalogPointer(bucket, POINTER_PATHS.previous),
        inspectCatalogPointer(bucket, POINTER_PATHS.lastKnownGood)
    ]);
    let previousInspection = initialPreviousInspection;
    const pointer = currentInspection.healthy
        ? { value: currentInspection.value, generation: currentInspection.generation }
        : null;
    let previousPointer = previousInspection.healthy
        ? { value: previousInspection.value, generation: previousInspection.generation }
        : null;
    const lastKnownGoodPointer = lastKnownGoodInspection.healthy
        ? { value: lastKnownGoodInspection.value, generation: lastKnownGoodInspection.generation }
        : null;

    if (['preparing', 'incomplete'].includes(workingState.rollbackState)) {
        if (isRollbackActive(workingState, now().getTime()) && workingState.rollbackOwner !== 'catalog-reconciler') {
            logger('info', {
                phase: 'reconcile',
                targetRevision: Number(workingState.rollbackTargetRevision || 0),
                result: 'rollback_operation_active'
            });
            return { result: 'rollback_operation_active', repairs };
        }
        if (!isRollbackActive(workingState, now().getTime())) {
            const recoveryNow = now();
            await applyRepair({
                rollbackOwner: 'catalog-reconciler',
                rollbackHeartbeatAt: recoveryNow,
                rollbackExpiresAt: new Date(recoveryNow.getTime() + 120000)
            }, (fresh) => fresh.rollbackOperationId === workingState.rollbackOperationId
                && !isRollbackActive(fresh, recoveryNow.getTime()));
            repairs.push('rollback_recovery_claimed');
        }
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
            const rollbackImpactPlan = createFullImpactPlan({
                revision: Number(pointer.value.revision),
                aggregateSha256: currentInspection.manifest.aggregateSha256,
                reason: 'rollback'
            });
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
            let previousMatchesSource = !rollbackSource
                || samePointerIdentity(previousPointer?.value, rollbackSource);
            if (rollbackSource && !previousMatchesSource) {
                try {
                    const verifiedSource = await verifyStoredRelease(bucket, rollbackSource);
                    const repaired = await writePointer(bucket, POINTER_PATHS.previous, verifiedSource.pointer);
                    previousPointer = { value: repaired.pointer, generation: repaired.generation };
                    previousInspection = {
                        healthy: true,
                        value: repaired.pointer,
                        generation: repaired.generation
                    };
                    previousMatchesSource = true;
                    repairs.push('rollback_previous_pointer_repaired');
                } catch (error) {
                    if (!isCatalogIntegrityError(error)) throw error;
                }
            }
            const rollbackRecovery = {
                ...clearLease(now()),
                mode: 'paused',
                publishedRevision: Number(pointer.value.revision),
                currentManifestPath: pointer.value.manifestPath,
                currentManifestSha256: pointer.value.manifestSha256,
                currentAggregateSha256: currentInspection.manifest.aggregateSha256,
                currentImpactPlanPath: pointer.value.impactPlanPath || null,
                currentImpactPlanSha256: currentInspection.manifest.impactPlanSha256 || null,
                pendingRevalidationPlan: rollbackImpactPlan,
                pendingRevalidationPlanHash: rollbackImpactPlan.planHash,
                pendingRevalidationRevision: Number(pointer.value.revision),
                pendingRevalidationManifestSha256: pointer.value.manifestSha256,
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
                    rollbackOperationId: null,
                    rollbackOwner: null,
                    rollbackStartedAt: null,
                    rollbackHeartbeatAt: null,
                    rollbackExpiresAt: null,
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
            await applyRepair(rollbackRecovery, (fresh) => fresh.rollbackOperationId === workingState.rollbackOperationId);
            repairs.push(previousMatchesSource ? 'rollback_finalized' : 'rollback_previous_repair_required');
        } else if (workingState.rollbackState === 'preparing' && currentInspection.healthy) {
            const dirty = Boolean(workingState.dirty || workingState.rollbackPreviousDirty);
            mode = normalizePublicationMode(workingState.rollbackPreviousMode);
            const rollbackAbort = {
                ...clearLease(now()),
                mode,
                dirty,
                rollbackState: null,
                rollbackOperationId: null,
                rollbackOwner: null,
                rollbackStartedAt: null,
                rollbackHeartbeatAt: null,
                rollbackExpiresAt: null,
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
            await applyRepair(rollbackAbort, (fresh) => fresh.rollbackOperationId === workingState.rollbackOperationId);
            repairs.push('rollback_aborted');
        } else {
            const rollbackDegraded = {
                mode: 'paused',
                buildState: 'degraded',
                lastError: { code: 'ROLLBACK_RECOVERY_POINTER_UNAVAILABLE' },
                updatedAt: serverTimestamp()
            };
            await applyRepair(rollbackDegraded, (fresh) => fresh.rollbackOperationId === workingState.rollbackOperationId);
            repairs.push('rollback_recovery_degraded');
        }
    }
    if (workingState.buildState === 'pointer_committed_control_pending' && pointer?.value) {
        const preparedMatches = Number(pointer.value.revision) === Number(workingState.preparedRevision || workingState.publishedRevision || 0)
            && String(pointer.value.manifestSha256 || '') === String(workingState.preparedManifestSha256 || workingState.currentManifestSha256 || '');
        if (preparedMatches) {
            await applyRepair({
                ...clearLease(now()),
                publishedRevision: Number(pointer.value.revision),
                currentManifestPath: pointer.value.manifestPath,
                currentManifestSha256: pointer.value.manifestSha256,
                currentAggregateSha256: currentInspection.manifest?.aggregateSha256 || workingState.preparedAggregateSha256 || null,
                currentImpactPlanPath: pointer.value.impactPlanPath || workingState.preparedImpactPlanPath || null,
                currentImpactPlanSha256: currentInspection.manifest?.impactPlanSha256 || workingState.preparedImpactPlanSha256 || null,
                pendingRevalidationPlan: null,
                pendingRevalidationPlanHash: null,
                pendingRevalidationRevision: null,
                pendingRevalidationManifestSha256: null,
                currentPointerGeneration: pointer.generation,
                buildState: 'revalidating',
                integrityState: 'valid',
                sourceLagState: Number(workingState.desiredRevision || 0) > Number(pointer.value.revision) ? 'behind' : 'current',
                invalidationState: 'pending',
                servedState: 'pending',
                revalidationFailureCount: 0,
                revalidationRetryNotBefore: null,
                revalidationLastFailureAt: null,
                lastError: null
            }, (fresh) => fresh.buildState === 'pointer_committed_control_pending');
            repairs.push('pointer_commit_finalized');
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
        const pendingMatchesPointer = Number(workingState.pendingRevalidationRevision || 0) === Number(pointer.value.revision)
            && String(workingState.pendingRevalidationManifestSha256 || '') === String(pointer.value.manifestSha256 || '');
        if (!pendingMatchesPointer) {
            Object.assign(pointerControlUpdate, {
                pendingRevalidationPlan: null,
                pendingRevalidationPlanHash: null,
                pendingRevalidationRevision: null,
                pendingRevalidationManifestSha256: null
            });
        }
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
        Object.assign(pointerControlUpdate, {
            currentAggregateSha256: currentInspection.manifest?.aggregateSha256 || workingState.currentAggregateSha256 || null,
            currentImpactPlanPath: pointer?.value?.impactPlanPath || workingState.currentImpactPlanPath || null,
            currentImpactPlanSha256: currentInspection.manifest?.impactPlanSha256 || workingState.currentImpactPlanSha256 || null,
            integrityState: 'valid',
            revalidationFailureCount: 0,
            revalidationRetryNotBefore: null,
            revalidationLastFailureAt: null
        });
        await applyRepair(pointerControlUpdate);
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
        repairUpdate.integrityState = 'invalid';
        repairUpdate.sourceLagState = 'unknown';
        await applyRepair(repairUpdate);
        repairs.push('snapshot_repair_requested');
    }

    const effectiveState = workingState;
    const published = Number(pointer?.value?.revision || effectiveState.publishedRevision || 0);
    let revalidationStatus = null;
    if (pointer?.value && needsCatalogRevalidation(effectiveState, pointer.value)) {
        let impactPlan = null;
        const pendingPlanDeclared = Number(effectiveState.pendingRevalidationRevision || 0) === published
            && String(effectiveState.pendingRevalidationManifestSha256 || '') === String(pointer.value.manifestSha256 || '');
        if (pendingPlanDeclared && effectiveState.pendingRevalidationPlan) {
            try {
                impactPlan = validateImpactPlan(effectiveState.pendingRevalidationPlan, {
                    revision: published,
                    aggregateSha256: currentInspection.manifest?.aggregateSha256
                });
                if (impactPlan.planHash !== effectiveState.pendingRevalidationPlanHash) impactPlan = null;
            } catch {
                impactPlan = null;
            }
        }
        if (!pendingPlanDeclared) impactPlan = currentInspection.impactPlan;
        if (!impactPlan && !pendingPlanDeclared) {
            try { impactPlan = await readImpactPlan(bucket, pointer.value); } catch { impactPlan = null; }
        }
        if (!impactPlan) {
            const missingPlan = {
                buildState: 'degraded',
                invalidationState: 'failed',
                lastError: { code: 'CATALOG_IMPACT_PLAN_MISSING' }
            };
            await applyRepair(missingPlan);
            repairs.push('impact_plan_missing');
        } else {
            const failureCount = Math.max(0, Number(effectiveState.revalidationFailureCount || 0));
            const retryNotBeforeMs = toMillis(effectiveState.revalidationRetryNotBefore);
            if (retryNotBeforeMs > now().getTime()) {
                revalidationStatus = 'backoff';
            } else {
                const taskId = catalogRevalidationTaskId(pointer.value, failureCount);
                const enqueued = await enqueue('dispatchCatalogRevalidation', {
                    schemaVersion: 1,
                    revision: published,
                    manifestSha256: pointer.value.manifestSha256,
                    aggregateSha256: currentInspection.manifest?.aggregateSha256 || impactPlan.aggregateSha256,
                    impactPlanPath: pendingPlanDeclared
                        ? null
                        : pointer.value.impactPlanPath || `${pointer.value.manifestPath.replace(/\/manifest\.json$/, '')}/impact-plan.json`,
                    impactPlanSha256: pendingPlanDeclared
                        ? null
                        : currentInspection.manifest?.impactPlanSha256 || pointer.value.impactPlanSha256,
                    planHash: impactPlan.planHash,
                    impactPlan
                }, taskId);
                if (enqueued) repairs.push('revalidation_enqueued');
                else revalidationStatus = 'already_queued';
            }
        }
    }

    if (mode === 'paused') {
        logger('info', {
            phase: 'reconcile', targetRevision: Number(effectiveState.desiredRevision || 0),
            result: repairs.join(',') || (revalidationStatus ? `revalidation_${revalidationStatus}` : 'paused')
        });
        return { result: repairs.length ? 'repaired_paused' : 'paused', repairs };
    }

    const desired = Number(effectiveState.desiredRevision || 0);
    const satisfied = published >= desired;
    if ((effectiveState.dirty || !satisfied) && !isLeaseActive(effectiveState, now().getTime())) {
        const timeBucket = Math.floor(now().getTime() / (5 * 60 * 1000));
        const taskId = `catalog-reconcile-build-r${desired}-t${timeBucket}`;
        await enqueue('dispatchCatalogBuild', { schemaVersion: 1, targetRevision: desired }, taskId);
        await applyRepair({ queuedTaskName: taskId, buildState: 'queued' }, (fresh) => (
            Number(fresh.desiredRevision || 0) >= desired && !isLeaseActive(fresh, now().getTime())
        ));
        repairs.push('build_enqueued');
    }

    const result = repairs.length ? 'repaired' : revalidationStatus ? `revalidation_${revalidationStatus}` : 'healthy';
    logger('info', { phase: 'reconcile', targetRevision: desired, result: repairs.join(',') || result });
    return { result, repairs };
}

async function reconcileCatalogWithStateRetry(dependencies, options = {}) {
    const reconcile = options.reconcile || reconcileCatalog;
    const maxAttempts = Number(options.maxAttempts || MAX_STATE_ADVANCE_ATTEMPTS);
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            return await reconcile(dependencies);
        } catch (error) {
            if (error?.code !== 'RECONCILE_STATE_ADVANCED' || attempt === maxAttempts) throw error;
            (dependencies.logger || catalogLog)('warn', {
                phase: 'reconcile',
                result: 'state_advanced_retry',
                attempt,
                maxAttempts
            });
        }
    }
    throw new Error('RECONCILE_STATE_RETRY_EXHAUSTED');
}

function serverTimestamp() {
    return admin.firestore.FieldValue.serverTimestamp();
}

const catalogReconciler = onSchedule(
    {
        schedule: 'every 60 minutes',
        region: RECONCILER_REGION,
        serviceAccount: CATALOG_BUILDER_SERVICE_ACCOUNT,
        cpu: 1,
        concurrency: 1,
        minInstances: 0,
        maxInstances: 1,
        timeoutSeconds: 540,
        memory: '512MiB',
        retryCount: 0
    },
    async () => reconcileCatalogWithStateRetry({
        db: admin.firestore(),
        bucket: admin.storage().bucket(CATALOG_SNAPSHOT_BUCKET)
    })
);

module.exports = {
    RECONCILER_REGION,
    catalogReconciler,
    enqueueNamed,
    inspectCatalogPointer,
    reconcileCatalog,
    reconcileCatalogWithStateRetry
};
