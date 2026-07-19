const crypto = require('crypto');
const admin = require('firebase-admin');
const { getFunctions } = require('firebase-admin/functions');
const functions = require('firebase-functions/v1');
const { regionalFunctions } = require('../../helpers/runtime');
const {
    assertConfirmText,
    checkRecentActiveStrongAdmin,
    checkActiveStrongAdmin,
    writeSecurityAudit
} = require('../../helpers/security');
const {
    buildRollbackControlUpdate,
    buildRollbackPreparationUpdate,
    cleanError,
    clearLease,
    CONTROL_DOCUMENT,
    isLeaseActive
} = require('./publicationState');
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
    while (Date.now() < deadline) {
        const snap = await controlRef.get();
        const state = snap.exists ? snap.data() : {};
        if (state.rollbackToken !== rollbackToken || state.mode !== 'paused') {
            throw new Error('ROLLBACK_INTENT_LOST');
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
            desiredRevision: Number(state.desiredRevision || 0),
            revalidatedRevision: Number(state.revalidatedRevision || 0),
            lastError: state.lastError?.code || null,
            rollbackState: state.rollbackState || null,
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
        await checkRecentActiveStrongAdmin(context);
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
                if (state.rollbackState === 'preparing') throw new Error('ROLLBACK_ALREADY_RUNNING');
                transaction.set(controlRef, buildRollbackPreparationUpdate(state, {
                    token: rollbackToken,
                    targetName,
                    target: targetObject.value,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }), { merge: true });
            });
            await waitForBuildFence(controlRef, rollbackToken);

            const freshPointers = await readCatalogPointers();
            const freshTarget = targetName === 'last-known-good' ? freshPointers.lastKnownGood : freshPointers.previous;
            if (!freshTarget?.value || !samePointerIdentity(freshTarget.value, targetObject.value)) {
                throw new Error('ROLLBACK_TARGET_CHANGED');
            }
            await verifyStoredRelease(freshPointers.storageBucket, freshTarget.value);
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
                { ...freshTarget.value, publishedAt: new Date().toISOString() },
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
                        target: freshTarget.value,
                        currentPointerGeneration: published.generation,
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
                    productIds: [],
                    previousCategories: [],
                    nextCategories: [],
                    sitemapChanged: true
                }, { id: `catalog-rollback-revalidate-r${freshTarget.value.revision}-${Date.now()}` });
            } catch (enqueueError) {
                revalidationQueued = false;
                console.error('Catalog rollback revalidation enqueue failed:', enqueueError);
                await admin.firestore().doc(CONTROL_DOCUMENT).set({
                    buildState: 'degraded',
                    lastError: { code: 'ROLLBACK_REVALIDATION_QUEUE_FAILED' },
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
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
                            dirty,
                            buildState: dirty ? 'queued' : (state.rollbackPreviousBuildState || 'healthy'),
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
        await checkRecentActiveStrongAdmin(context);
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
                dirty: true,
                desiredRevision: nextRevision,
                buildState: 'queued',
                rejectedRevision: Number(state.rollbackSourceRevision || state.rejectedRevision || 0) || null,
                rejectedManifestPath: state.rollbackSourceManifestPath || state.rejectedManifestPath || null,
                rejectedManifestSha256: state.rollbackSourceManifestSha256 || state.rejectedManifestSha256 || null,
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
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            return nextRevision;
        });
        await getFunctions().taskQueue(BUILD_TASK).enqueue(
            { schemaVersion: 1, targetRevision: revision },
            { id: `catalog-admin-rebuild-r${revision}-${Date.now()}` }
        );
        await writeSecurityAudit('catalog.rebuild', context, { revision });
        return { success: true, mode: 'active', revision };
    });

module.exports = {
    checkedPublicPointer,
    getCatalogPublicationStatus,
    rebuildCatalogSnapshot,
    rollbackCatalogSnapshot
};
