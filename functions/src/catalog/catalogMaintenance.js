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
const { CONTROL_DOCUMENT } = require('./publicationState');
const {
    POINTER_PATHS,
    readCurrentPointer,
    readLastKnownGoodPointer,
    readPreviousPointer,
    verifyStoredRelease,
    writePointer
} = require('./snapshotStorage');
const { CATALOG_SNAPSHOT_BUCKET } = require('./catalogConfig');

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

async function readCatalogPointers() {
    const storageBucket = bucket();
    const [current, previous, lastKnownGood] = await Promise.all([
        readCurrentPointer(storageBucket),
        readPreviousPointer(storageBucket),
        readLastKnownGoodPointer(storageBucket)
    ]);
    return { storageBucket, current, previous, lastKnownGood };
}

const getCatalogPublicationStatus = regionalFunctions()
    .runWith({ enforceAppCheck: true })
    .https.onCall(async (_data, context) => {
        await checkActiveStrongAdmin(context);
        const { current, previous, lastKnownGood } = await readCatalogPointers();
        const control = await admin.firestore().doc(CONTROL_DOCUMENT).get();
        return {
            mode: control.exists ? control.data().mode : 'active',
            current: publicPointer(current),
            previous: publicPointer(previous),
            lastKnownGood: publicPointer(lastKnownGood)
        };
    });

const rollbackCatalogSnapshot = regionalFunctions()
    .runWith({ enforceAppCheck: true, timeoutSeconds: 120, memory: '512MB' })
    .https.onCall(async (data, context) => {
        await checkRecentActiveStrongAdmin(context);
        const targetName = String(data?.target || '').trim();
        if (!['previous', 'last-known-good'].includes(targetName)) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'La cible doit être previous ou last-known-good.'
            );
        }
        const { storageBucket, current, previous, lastKnownGood } = await readCatalogPointers();
        const targetObject = targetName === 'last-known-good' ? lastKnownGood : previous;
        if (!current?.value || !targetObject?.value) {
            throw new functions.https.HttpsError('failed-precondition', 'Aucun snapshot de rollback disponible.');
        }
        if (Number(current.value.revision) === Number(targetObject.value.revision)) {
            throw new functions.https.HttpsError('failed-precondition', 'Le snapshot cible est deja actif.');
        }
        const confirmation = `ROLLBACK CATALOGUE ${current.value.revision} VERS ${targetObject.value.revision}`;
        assertConfirmText(data, confirmation, 'rollback catalogue');
        try {
            await Promise.all([
                verifyStoredRelease(storageBucket, current.value),
                verifyStoredRelease(storageBucket, targetObject.value)
            ]);
            await writePointer(storageBucket, POINTER_PATHS.previous, current.value);
            const published = await writePointer(
                storageBucket,
                POINTER_PATHS.current,
                { ...targetObject.value, publishedAt: new Date().toISOString() },
                current.generation
            );
            await admin.firestore().doc(CONTROL_DOCUMENT).set({
                mode: 'paused',
                dirty: false,
                desiredRevision: Number(targetObject.value.revision),
                publishedRevision: Number(targetObject.value.revision),
                currentManifestPath: targetObject.value.manifestPath,
                currentManifestSha256: targetObject.value.manifestSha256,
                currentPointerGeneration: published.generation,
                previousRevision: Number(current.value.revision),
                previousManifestPath: current.value.manifestPath,
                previousManifestSha256: current.value.manifestSha256,
                buildState: 'revalidating',
                lastError: null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            let revalidationQueued = true;
            try {
                await getFunctions().taskQueue(REVALIDATION_TASK).enqueue({
                    schemaVersion: 1,
                    revision: Number(targetObject.value.revision),
                    manifestSha256: targetObject.value.manifestSha256,
                    productIds: [],
                    previousCategories: [],
                    nextCategories: [],
                    sitemapChanged: true
                }, { id: `catalog-rollback-revalidate-r${targetObject.value.revision}-${Date.now()}` });
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
                fromRevision: Number(current.value.revision),
                toRevision: Number(targetObject.value.revision)
            });
            return {
                success: true,
                mode: 'paused',
                revalidationQueued,
                current: publicPointer({ value: targetObject.value }),
                previous: publicPointer(current)
            };
        } catch (error) {
            if (error instanceof functions.https.HttpsError) throw error;
            console.error('Catalog rollback failed:', error);
            throw new functions.https.HttpsError('internal', 'Le rollback catalogue a echoue.', {
                reason: error?.message || 'unknown'
            });
        }
    });

const rebuildCatalogSnapshot = regionalFunctions()
    .runWith({ enforceAppCheck: true })
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
    getCatalogPublicationStatus,
    rebuildCatalogSnapshot,
    rollbackCatalogSnapshot
};
