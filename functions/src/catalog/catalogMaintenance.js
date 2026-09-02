const crypto = require('crypto');
const admin = require('firebase-admin');
const { getFunctions } = require('firebase-admin/functions');
const functions = require('firebase-functions/v1');
const { onCall } = require('firebase-functions/v2/https');
const { regionalFunctions } = require('../../helpers/runtime');
const {
    assertConfirmText,
    checkActiveStrongAdmin,
    writeSecurityAudit
} = require('../../helpers/security');
const {
    buildRollbackControlUpdate,
    buildRollbackPreparationUpdate,
    catalogRevalidationTaskId,
    cleanError,
    clearLease,
    CONTROL_DOCUMENT,
    isLeaseActive,
    isRollbackActive,
    nextStateVersion
} = require('./publicationState');
const { createFullImpactPlan } = require('./impactPlan');
const {
    POINTER_PATHS,
    isCatalogIntegrityError,
    readPointerState,
    verifyStoredRelease,
    writePointer
} = require('./snapshotStorage');
const {
    CATALOG_BUILDER_SERVICE_ACCOUNT,
    CATALOG_SNAPSHOT_BUCKET
} = require('./catalogConfig');

const REGION = 'europe-west1';
const BUILD_TASK = `locations/${REGION}/functions/dispatchCatalogBuild`;
const REVALIDATION_TASK = `locations/${REGION}/functions/dispatchCatalogRevalidation`;
const CATALOG_MAINTENANCE_GEN2_RUNTIME = Object.freeze({
    region: REGION,
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
    memory: '512MiB',
    timeoutSeconds: 120,
    serviceAccount: CATALOG_BUILDER_SERVICE_ACCOUNT,
    enforceAppCheck: true
});
const CATALOG_STATUS_GEN2_RUNTIME = Object.freeze({
    ...CATALOG_MAINTENANCE_GEN2_RUNTIME,
    maxInstances: 2,
    timeoutSeconds: 60
});

const bucket = () => admin.storage().bucket(CATALOG_SNAPSHOT_BUCKET);

const publicPointer = (object) => object?.value ? {
    revision: Number(object.value.revision),
    manifestPath: object.value.manifestPath,
    manifestSha256: object.value.manifestSha256,
    publishedAt: object.value.publishedAt || null
} : null;

const pointerErrorCode = (error, fallback = 'CATALOG_POINTER_UNAVAILABLE') => (
    String(error?.code || error?.message || fallback).slice(0, 120)
);

const samePointerIdentity = (left, right) => Boolean(left && right
    && Number(left.revision) === Number(right.revision)
    && String(left.manifestPath || '') === String(right.manifestPath || '')
    && String(left.manifestSha256 || '') === String(right.manifestSha256 || ''));

async function waitForBuildFence(controlRef, rollbackToken, timeoutMs = 45000) {
    const deadline = Date.now() + timeoutMs;
    let lastHeartbeatAt = 0;
    while (Date.now() < deadline) {
        const snap = await controlRef.get();
        const state = snap.exists ? snap.data() : {};
        if (state.rollbackToken !== rollbackToken || state.mode !== 'paused') {
            throw new Error('ROLLBACK_INTENT_LOST');
        }
        if (Date.now() - lastHeartbeatAt >= 10000) {
            await controlRef.firestore.runTransaction(async (transaction) => {
                const freshSnap = await transaction.get(controlRef);
                const freshState = freshSnap.exists ? freshSnap.data() : {};
                if (freshState.rollbackOperationId !== rollbackToken || freshState.rollbackState !== 'preparing') {
                    throw new Error('ROLLBACK_INTENT_LOST');
                }
                const heartbeatAt = new Date();
                transaction.set(controlRef, {
                    stateVersion: nextStateVersion(freshState),
                    rollbackHeartbeatAt: heartbeatAt,
                    rollbackExpiresAt: new Date(heartbeatAt.getTime() + 120000),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });
            lastHeartbeatAt = Date.now();
        }
        if (!state.leaseToken) return state;
        if (!isLeaseActive(state, Date.now())) {
            const released = await controlRef.firestore.runTransaction(async (transaction) => {
                const freshSnap = await transaction.get(controlRef);
                const freshState = freshSnap.exists ? freshSnap.data() : {};
                if (freshState.rollbackToken !== rollbackToken || freshState.mode !== 'paused') {
                    throw new Error('ROLLBACK_INTENT_LOST');
                }
                if (!freshState.leaseToken || isLeaseActive(freshState, Date.now())) return !freshState.leaseToken;
                transaction.set(controlRef, {
                    ...clearLease(new Date()),
                    stateVersion: nextStateVersion(freshState),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                return true;
            });
            if (released) continue;
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error('ROLLBACK_BUILD_FENCE_TIMEOUT');
}

async function checkedPublicPointer(storageBucket, object, { required = false } = {}) {
    const pointer = publicPointer(object);
    if (object?.error) {
        return { ...pointer, healthy: false, error: pointerErrorCode(object.error) };
    }
    if (!pointer) {
        return required ? { revision: null, manifestPath: null, manifestSha256: null, publishedAt: null, healthy: false, error: 'CATALOG_POINTER_MISSING' } : null;
    }
    try {
        await verifyStoredRelease(storageBucket, object.value);
        return { ...pointer, healthy: true, error: null };
    } catch (error) {
        return {
            ...pointer,
            healthy: false,
            error: String(error?.code || error?.message || 'CATALOG_RELEASE_INVALID').slice(0, 120)
        };
    }
}

async function readCatalogPointers() {
    const storageBucket = bucket();
    const read = async (path) => {
        try {
            return await readPointerState(storageBucket, path);
        } catch (error) {
            return { path, value: null, generation: null, missing: false, error };
        }
    };
    const [current, previous, lastKnownGood] = await Promise.all([
        read(POINTER_PATHS.current),
        read(POINTER_PATHS.previous),
        read(POINTER_PATHS.lastKnownGood)
    ]);
    return { storageBucket, current, previous, lastKnownGood };
}

const getCatalogPublicationStatus = regionalFunctions()
    .runWith({
        enforceAppCheck: true,
        serviceAccount: CATALOG_BUILDER_SERVICE_ACCOUNT
    })
    .https.onCall(async (_data, context) => {
        await checkActiveStrongAdmin(context);
        const { storageBucket, current, previous, lastKnownGood } = await readCatalogPointers();
        const control = await admin.firestore().doc(CONTROL_DOCUMENT).get();
        const [checkedCurrent, checkedPrevious, checkedLastKnownGood] = await Promise.all([
            checkedPublicPointer(storageBucket, current, { required: true }),
            checkedPublicPointer(storageBucket, previous),
            checkedPublicPointer(storageBucket, lastKnownGood)
        ]);
        const state = control.exists ? control.data() : {};
        return {
            mode: state.mode || 'active',
            buildState: state.buildState || 'unknown',
            stateVersion: Number(state.stateVersion || 0),
            desiredRevision: Number(state.desiredRevision || 0),
            revalidatedRevision: Number(state.revalidatedRevision || 0),
            lastError: state.lastError?.code || null,
            rollbackState: state.rollbackState || null,
            integrityState: state.integrityState || 'unknown',
            sourceLagState: state.sourceLagState || 'unknown',
            invalidationState: state.invalidationState || 'pending',
            servedState: state.servedState || 'pending',
            servedRevision: Number(state.servedRevision || 0) || null,
            current: checkedCurrent,
            previous: checkedPrevious,
            lastKnownGood: checkedLastKnownGood
        };
    });

const rollbackCatalogSnapshot = regionalFunctions()
    .runWith({
        enforceAppCheck: true,
        timeoutSeconds: 120,
        memory: '512MB',
        serviceAccount: CATALOG_BUILDER_SERVICE_ACCOUNT
    })
    .https.onCall(async (data, context) => {
        await checkActiveStrongAdmin(context);
        const targetName = String(data?.target || '').trim();
        if (!['previous', 'last-known-good'].includes(targetName)) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'La cible doit être previous ou last-known-good.'
            );
        }
        const initialPointers = await readCatalogPointers();
        const targetObject = targetName === 'last-known-good' ? initialPointers.lastKnownGood : initialPointers.previous;
        const controlRef = admin.firestore().doc(CONTROL_DOCUMENT);
        const initialControl = await controlRef.get();
        const initialState = initialControl.exists ? initialControl.data() : {};
        if (!targetObject?.value) {
            throw new functions.https.HttpsError('failed-precondition', 'Aucun snapshot de rollback disponible.');
        }
        const fromRevision = Number(initialPointers.current?.value?.revision || initialState.publishedRevision || 0);
        if (fromRevision === Number(targetObject.value.revision)) {
            throw new functions.https.HttpsError('failed-precondition', 'Le snapshot cible est deja actif.');
        }
        const confirmation = `ROLLBACK CATALOGUE ${fromRevision} VERS ${targetObject.value.revision}`;
        assertConfirmText(data, confirmation, 'rollback catalogue');
        let rollbackToken = null;
        let pointerPublished = false;
        try {
            await verifyStoredRelease(initialPointers.storageBucket, targetObject.value);
            rollbackToken = crypto.randomUUID();
            await admin.firestore().runTransaction(async (transaction) => {
                const controlSnap = await transaction.get(controlRef);
                const state = controlSnap.exists ? controlSnap.data() : {};
                if (isRollbackActive(state, Date.now())) throw new Error('ROLLBACK_ALREADY_RUNNING');
                transaction.set(controlRef, buildRollbackPreparationUpdate(state, {
                    token: rollbackToken,
                    owner: context.auth?.uid || 'catalog-maintenance',
                    targetName,
                    target: targetObject.value,
                    updatedAt: new Date()
                }), { merge: true });
            });
            await waitForBuildFence(controlRef, rollbackToken);

            const freshPointers = await readCatalogPointers();
            const freshTarget = targetName === 'last-known-good' ? freshPointers.lastKnownGood : freshPointers.previous;
            if (!freshTarget?.value || !samePointerIdentity(freshTarget.value, targetObject.value)) {
                throw new Error('ROLLBACK_TARGET_CHANGED');
            }
            const verifiedTarget = await verifyStoredRelease(freshPointers.storageBucket, freshTarget.value);
            const targetWithIdentity = {
                ...freshTarget.value,
                aggregateSha256: verifiedTarget.manifest.aggregateSha256,
                impactPlanPath: freshTarget.value.impactPlanPath
                    || `${freshTarget.value.manifestPath.replace(/\/manifest\.json$/, '')}/impact-plan.json`,
                impactPlanSha256: verifiedTarget.manifest.impactPlanSha256 || freshTarget.value.impactPlanSha256 || null
            };
            const rollbackImpactPlan = createFullImpactPlan({
                revision: Number(freshTarget.value.revision),
                aggregateSha256: verifiedTarget.manifest.aggregateSha256,
                reason: 'rollback'
            });
            if (freshPointers.current?.error && !freshPointers.current.generation) {
                throw freshPointers.current.error;
            }
            if (samePointerIdentity(freshPointers.current?.value, freshTarget.value)) {
                throw new Error('ROLLBACK_TARGET_ALREADY_CURRENT');
            }

            let healthyCurrent = null;
            if (freshPointers.current?.value) {
                try {
                    healthyCurrent = (await verifyStoredRelease(
                        freshPointers.storageBucket,
                        freshPointers.current.value
                    )).pointer;
                } catch (error) {
                    if (!isCatalogIntegrityError(error)) throw error;
                }
            }
            const published = await writePointer(
                freshPointers.storageBucket,
                POINTER_PATHS.current,
                { ...targetWithIdentity, publishedAt: new Date().toISOString() },
                freshPointers.current?.generation || 0
            );
            pointerPublished = true;
            if (healthyCurrent && !samePointerIdentity(healthyCurrent, freshTarget.value)) {
                await writePointer(freshPointers.storageBucket, POINTER_PATHS.previous, healthyCurrent);
            }
            await admin.firestore().runTransaction(async (transaction) => {
                const controlSnap = await transaction.get(controlRef);
                const state = controlSnap.exists ? controlSnap.data() : {};
                if (state.rollbackToken !== rollbackToken || state.rollbackState !== 'preparing') {
                    throw new Error('ROLLBACK_INTENT_LOST');
                }
                transaction.set(controlRef, buildRollbackControlUpdate(
                    state,
                    {
                        current: healthyCurrent,
                        target: targetWithIdentity,
                        currentPointerGeneration: published.generation,
                        revalidationPlan: rollbackImpactPlan,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    }
                ), { merge: true });
            });
            let revalidationQueued = true;
            try {
                await getFunctions().taskQueue(REVALIDATION_TASK).enqueue({
                    schemaVersion: 1,
                    revision: Number(freshTarget.value.revision),
                    manifestSha256: freshTarget.value.manifestSha256,
                    aggregateSha256: verifiedTarget.manifest.aggregateSha256,
                    impactPlanPath: null,
                    impactPlanSha256: null,
                    planHash: rollbackImpactPlan.planHash,
                    impactPlan: rollbackImpactPlan
                }, {
                    id: catalogRevalidationTaskId({
                        revision: freshTarget.value.revision,
                        manifestSha256: freshTarget.value.manifestSha256
                    }, 0),
                    dispatchDeadlineSeconds: 300
                });
            } catch (enqueueError) {
                revalidationQueued = false;
                console.error('Catalog rollback revalidation enqueue failed:', enqueueError);
                await admin.firestore().runTransaction(async (transaction) => {
                    const snap = await transaction.get(controlRef);
                    const state = snap.data() || {};
                    if (Number(state.publishedRevision || 0) !== Number(freshTarget.value.revision)
                        || String(state.currentManifestSha256 || '') !== String(freshTarget.value.manifestSha256 || '')) return;
                    transaction.set(controlRef, {
                        buildState: 'degraded',
                        invalidationState: 'failed',
                        stateVersion: nextStateVersion(state),
                        lastError: { code: 'ROLLBACK_REVALIDATION_QUEUE_FAILED' },
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                });
            }
            await writeSecurityAudit('catalog.rollback', context, {
                target: targetName,
                fromRevision: Number(healthyCurrent?.revision || fromRevision),
                toRevision: Number(freshTarget.value.revision)
            });
            return {
                success: true,
                mode: 'paused',
                revalidationQueued,
                current: publicPointer({ value: freshTarget.value }),
                previous: healthyCurrent ? publicPointer({ value: healthyCurrent }) : null
            };
        } catch (error) {
            if (rollbackToken) {
                if (pointerPublished) {
                    await admin.firestore().runTransaction(async (transaction) => {
                        const snap = await transaction.get(controlRef);
                        const state = snap.exists ? snap.data() : {};
                        if (state.rollbackToken !== rollbackToken) return;
                        transaction.set(controlRef, {
                            ...clearLease(admin.firestore.FieldValue.serverTimestamp()),
                            mode: 'paused',
                            stateVersion: nextStateVersion(state),
                            rollbackState: 'incomplete',
                            buildState: 'degraded',
                            lastError: cleanError(error),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                    }).catch(() => null);
                } else {
                    await admin.firestore().runTransaction(async (transaction) => {
                        const snap = await transaction.get(controlRef);
                        const state = snap.exists ? snap.data() : {};
                        if (state.rollbackToken !== rollbackToken) return;
                        const dirty = Boolean(state.dirty || state.rollbackPreviousDirty);
                        transaction.set(controlRef, {
                            ...(!isLeaseActive(state, Date.now()) ? clearLease(admin.firestore.FieldValue.serverTimestamp()) : {}),
                            mode: state.rollbackPreviousMode || 'active',
                            stateVersion: nextStateVersion(state),
                            dirty,
                            buildState: dirty ? 'queued' : (state.rollbackPreviousBuildState || 'healthy'),
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
                            lastError: cleanError(error),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                    }).catch(() => null);
                }
            }
            if (error instanceof functions.https.HttpsError) throw error;
            console.error('Catalog rollback failed:', error);
            throw new functions.https.HttpsError('internal', 'Le rollback catalogue a echoue.', {
                reason: error?.message || 'unknown'
            });
        }
    });

const rebuildCatalogSnapshot = regionalFunctions()
    .runWith({
        enforceAppCheck: true,
        serviceAccount: CATALOG_BUILDER_SERVICE_ACCOUNT
    })
    .https.onCall(async (data, context) => {
        await checkActiveStrongAdmin(context);
        assertConfirmText(data, 'RECONSTRUIRE CATALOGUE', 'reconstruction catalogue');
        const controlRef = admin.firestore().doc(CONTROL_DOCUMENT);
        const revision = await admin.firestore().runTransaction(async (transaction) => {
            const snap = await transaction.get(controlRef);
            const state = snap.exists ? snap.data() : {};
            const nextRevision = Math.max(
                Number(state.desiredRevision || 0),
                Number(state.publishedRevision || 0)
            ) + 1;
            transaction.set(controlRef, {
                mode: 'active',
                stateVersion: nextStateVersion(state),
                dirty: true,
                desiredRevision: nextRevision,
                buildState: 'queued',
                rejectedRevision: Number(state.rollbackSourceRevision || state.rejectedRevision || 0) || null,
                rejectedManifestPath: state.rollbackSourceManifestPath || state.rejectedManifestPath || null,
                rejectedManifestSha256: state.rollbackSourceManifestSha256 || state.rejectedManifestSha256 || null,
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
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            return nextRevision;
        });
        await getFunctions().taskQueue(BUILD_TASK).enqueue(
            { schemaVersion: 1, targetRevision: revision },
            {
                id: `catalog-admin-rebuild-r${revision}-${Date.now()}`,
                dispatchDeadlineSeconds: 300
            }
        );
        await writeSecurityAudit('catalog.rebuild', context, { revision });
        return { success: true, mode: 'active', revision };
    });

module.exports = {
    checkedPublicPointer,
    getCatalogPublicationStatus,
    getCatalogPublicationStatusGen2: onCall(
        CATALOG_STATUS_GEN2_RUNTIME,
        async (request) => getCatalogPublicationStatus.run(request.data, request)
    ),
    rebuildCatalogSnapshot,
    rebuildCatalogSnapshotGen2: onCall(
        { ...CATALOG_MAINTENANCE_GEN2_RUNTIME, timeoutSeconds: 60 },
        async (request) => rebuildCatalogSnapshot.run(request.data, request)
    ),
    rollbackCatalogSnapshot,
    rollbackCatalogSnapshotGen2: onCall(
        CATALOG_MAINTENANCE_GEN2_RUNTIME,
        async (request) => rollbackCatalogSnapshot.run(request.data, request)
    )
};
