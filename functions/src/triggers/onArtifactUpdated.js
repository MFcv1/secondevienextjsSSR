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

async function cleanupRemovedMedia(change, context) {
    const beforeData = change.before.data() || {};
    const afterData = change.after.data() || {};

    const beforePaths = collectStoragePaths(beforeData);
    const afterPaths = collectStoragePaths(afterData);
    const removedPaths = Array.from(beforePaths).filter((filePath) => !afterPaths.has(filePath));

    if (!removedPaths.length) return null;

    const { appId, collection, docId } = context.params || {};
    console.log(
        `Artifact update cleanup: ${removedPaths.length} removed media file(s) for ` +
        `${appId}/${collection}/${docId}`
    );

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
        timeoutSeconds: 300
    },
    async (event) => {
        if (event.params.collection !== 'furniture' || event.params.appId !== 'secondevie') return null;
        return cleanupRemovedMedia(event.data, { params: event.params });
    }
);
