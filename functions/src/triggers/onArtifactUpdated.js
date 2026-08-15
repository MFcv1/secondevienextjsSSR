/**
 * Nettoyage media a la modification d'un produit.
 *
 * Quand l'admin remplace ou retire une image, les anciens fichiers Storage
 * entrent dans une file de suppression differee. Le GC verifie ensuite les
 * documents source, les snapshots retenus et la generation Storage.
 */
const admin = require('firebase-admin');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { collectStoragePaths } = require('./mediaCleanup');
const { enqueueMediaCandidates } = require('../catalog/mediaGarbageCollection');

const CATALOG_MEDIA_ENQUEUER_SERVICE_ACCOUNT =
    'catalog-media-enqueuer@secondevienextjsssr.iam.gserviceaccount.com';

async function cleanupRemovedMedia(change, context) {
    const beforeData = change.before.data() || {};
    const afterData = change.after.data() || {};

    const beforePaths = collectStoragePaths(beforeData);
    const afterPaths = collectStoragePaths(afterData);
    const removedPaths = Array.from(beforePaths).filter((filePath) => !afterPaths.has(filePath));

    if (!removedPaths.length) return null;

    const { docId } = context.params || {};
    console.log('catalog_media_quarantine_enqueued', {
        reason: 'product_update',
        candidateCount: removedPaths.length
    });

    const bucket = admin.storage().bucket();
    await enqueueMediaCandidates({ db: admin.firestore(), bucket }, {
        paths: removedPaths,
        reason: 'product_update',
        productId: docId
    });

    return null;
}

exports.onArtifactUpdated = onDocumentUpdated(
    {
        document: 'artifacts/{appId}/public/data/{collection}/{docId}',
        region: 'europe-west1',
        serviceAccount: CATALOG_MEDIA_ENQUEUER_SERVICE_ACCOUNT,
        cpu: 1,
        concurrency: 1,
        minInstances: 0,
        maxInstances: 1,
        memory: '256MiB',
        timeoutSeconds: 300,
        retry: true
    },
    async (event) => {
        if (event.params.collection !== 'furniture' || event.params.appId !== 'secondevie') return null;
        return cleanupRemovedMedia(event.data, { params: event.params });
    }
);

exports.CATALOG_MEDIA_ENQUEUER_SERVICE_ACCOUNT = CATALOG_MEDIA_ENQUEUER_SERVICE_ACCOUNT;
exports.cleanupRemovedMedia = cleanupRemovedMedia;
