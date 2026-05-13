/**
 * Nettoyage media a la modification d'un produit.
 *
 * Quand l'admin remplace ou retire une image, les anciens fichiers Storage
 * qui ne sont plus references par le document sont supprimes automatiquement.
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { collectStoragePaths, deleteStoragePaths } = require('./mediaCleanup');

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
    await deleteStoragePaths(bucket, removedPaths, 'artifact-update');

    return null;
}

exports.onArtifactUpdated = functions.runWith({ timeoutSeconds: 300 }).firestore
    .document('artifacts/{appId}/public/data/{collection}/{docId}')
    .onUpdate(cleanupRemovedMedia);
