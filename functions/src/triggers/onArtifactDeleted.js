/**
 * Nettoyage automatique a la suppression d'un produit.
 *
 * Supprime les images Storage + sous-collections sociales.
 * quand un produit est efface de Firestore.
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { collectStoragePaths, deleteStoragePaths } = require('./mediaCleanup');

const db = admin.firestore();
const SUBCOLLECTION_BATCH_LIMIT = 450;

async function deleteSubCollection(ref, logPrefix) {
    let totalDeleted = 0;

    while (true) {
        const snap = await ref.limit(SUBCOLLECTION_BATCH_LIMIT).get();
        if (snap.empty) break;

        const batch = db.batch();
        snap.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        totalDeleted += snap.size;

        if (snap.size < SUBCOLLECTION_BATCH_LIMIT) break;
    }

    if (totalDeleted > 0) {
        console.log(`${logPrefix}: deleted ${totalDeleted} docs`);
    }

    return totalDeleted;
}

async function cleanupDocumentAssets(snap) {
    const data = snap.data();
    const docPath = snap.ref.path;
    console.log(`Artifact delete cleanup triggered for: ${docPath}`);

    const bucket = admin.storage().bucket();
    await deleteStoragePaths(bucket, collectStoragePaths(data), 'artifact-delete');

    const subCollections = ['likes', 'comments'];
    for (const subCol of subCollections) {
        try {
            await deleteSubCollection(snap.ref.collection(subCol), `artifact-delete:${subCol}`);
        } catch (error) {
            console.error(`artifact-delete: failed to clean ${subCol}`, error.message);
        }
    }

    console.log(`Artifact delete cleanup finished for: ${docPath}`);
}

exports.onArtifactDeleted = functions.runWith({ timeoutSeconds: 300 }).firestore
    .document('artifacts/{appId}/public/data/{collection}/{docId}')
    .onDelete(cleanupDocumentAssets);
