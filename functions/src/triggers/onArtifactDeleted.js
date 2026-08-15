/**
 * Nettoyage automatique a la suppression d'un produit.
 *
 * Met les images Storage en quarantaine quand un produit est efface de
 * Firestore. Les sous-collections sociales restent conservees: leur retrait
 * exige une procedure destructive distincte et auditee.
 */
const admin = require('firebase-admin');
const { onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { collectStoragePaths } = require('./mediaCleanup');
const { enqueueMediaCandidates } = require('../catalog/mediaGarbageCollection');

const db = admin.firestore();
const CATALOG_MEDIA_ENQUEUER_SERVICE_ACCOUNT =
    'catalog-media-enqueuer@secondevienextjsssr.iam.gserviceaccount.com';

async function cleanupDocumentAssets(snap) {
    const data = snap.data();
    const paths = [...collectStoragePaths(data)];
    console.log('catalog_media_quarantine_enqueued', {
        reason: 'product_delete',
        candidateCount: paths.length
    });

    const bucket = admin.storage().bucket();
    await enqueueMediaCandidates({ db, bucket }, {
        paths,
        reason: 'product_delete',
        productId: snap.id
    });
}

exports.onArtifactDeleted = onDocumentDeleted(
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
        if (!event.data || event.params.collection !== 'furniture' || event.params.appId !== 'secondevie') return null;
        await cleanupDocumentAssets(event.data);
        return null;
    }
);

exports.CATALOG_MEDIA_ENQUEUER_SERVICE_ACCOUNT = CATALOG_MEDIA_ENQUEUER_SERVICE_ACCOUNT;
exports.cleanupDocumentAssets = cleanupDocumentAssets;
