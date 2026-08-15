const crypto = require('crypto');
const admin = require('firebase-admin');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { APP_ID } = require('../../helpers/config');
const { collectStoragePaths } = require('../triggers/mediaCleanup');
const {
    SNAPSHOT_ROOT,
    readCurrentPointer,
    readLastKnownGoodPointer,
    readPreviousPointer,
    readJsonObject
} = require('./snapshotStorage');
const { runReleaseGarbageCollection } = require('./releaseGarbageCollection');
const { catalogLog } = require('./structuredLog');
const { CATALOG_BUILDER_SERVICE_ACCOUNT, CATALOG_MEDIA_GC_COMMIT, CATALOG_SNAPSHOT_BUCKET } = require('./catalogConfig');

const MEDIA_GRACE_MS = 90 * 24 * 60 * 60 * 1000;
const MEDIA_GC_REGION = 'europe-west1';
const MEDIA_GC_BATCH_SIZE = 25;

function mediaCandidateId(path) {
    return crypto.createHash('sha256').update(path).digest('hex');
}

async function enqueueMediaCandidates(dependencies, input) {
    const { db, bucket, now = () => new Date() } = dependencies;
    const paths = [...new Set(input.paths || [])].filter((path) => typeof path === 'string' && path.startsWith('furniture/'));
    if (!paths.length) return { queued: 0 };
    const candidates = [];
    for (const path of paths) {
        const file = bucket.file(path);
        let generation = null;
        try {
            const [metadata] = await file.getMetadata();
            generation = String(metadata.generation);
        } catch (error) {
            if (Number(error?.code) !== 404) throw error;
        }
        const createdAt = now();
        candidates.push({
            reference: db.doc(`sys_catalog_media_gc/${mediaCandidateId(path)}`),
            value: {
                schemaVersion: 1,
                path,
                generation,
                reason: input.reason || 'product_update',
                productId: input.productId || null,
                createdAt,
                notBefore: new Date(createdAt.getTime() + MEDIA_GRACE_MS),
                attempts: 0,
                lastError: null,
                state: 'pending'
            }
        });
    }
    return db.runTransaction(async (transaction) => {
        const snapshots = await Promise.all(candidates.map(({ reference }) => transaction.get(reference)));
        let queued = 0;
        candidates.forEach(({ reference, value }, index) => {
            const existing = snapshots[index].exists ? snapshots[index].data() : null;
            if (existing && String(existing.generation || '') === String(value.generation || '')) return;
            transaction.set(reference, value);
            queued += 1;
        });
        return { queued };
    });
}

function storagePathFromMediaUrl(url) {
    const paths = collectStoragePaths({ images: [url] });
    return [...paths][0] || null;
}

async function collectRetainedSnapshotPaths(bucket, now = new Date()) {
    const retained = new Set();
    const pointers = await Promise.all([
        readCurrentPointer(bucket),
        readPreviousPointer(bucket),
        readLastKnownGoodPointer(bucket)
    ]);
    if (!pointers[0]?.value?.manifestPath) throw new Error('CATALOG_MEDIA_GC_CURRENT_POINTER_MISSING');
    const retainedPrefixes = new Set();
    pointers.forEach((pointer) => {
        if (pointer?.value?.manifestPath) {
            retainedPrefixes.add(pointer.value.manifestPath.replace(/\/manifest\.json$/, ''));
        }
    });

    const [files] = await bucket.getFiles({ prefix: `${SNAPSHOT_ROOT}/releases/` });
    const mediaFiles = files.filter((file) => file.name.endsWith('/media-index.json'));
    const recent = [];
    for (const file of mediaFiles) {
        const [metadata] = await file.getMetadata();
        recent.push({ file, updated: Date.parse(metadata.timeCreated || metadata.updated || 0) });
    }
    recent.sort((left, right) => right.updated - left.updated);
    recent.forEach(({ file, updated }, index) => {
        if (index < 10 || updated >= now.getTime() - (30 * 24 * 60 * 60 * 1000)) {
            retainedPrefixes.add(file.name.replace(/\/media-index\.json$/, ''));
        }
    });

    for (const prefix of retainedPrefixes) {
        const media = await readJsonObject(bucket, `${prefix}/media-index.json`);
        if (!Array.isArray(media?.value?.products)) {
            throw new Error(`CATALOG_MEDIA_GC_INDEX_INVALID:${prefix}`);
        }
        media.value.products.forEach((product) => {
            (product.urls || []).forEach((url) => {
                const path = storagePathFromMediaUrl(url);
                if (path) retained.add(path);
            });
        });
    }
    return retained;
}

async function runMediaGarbageCollection(dependencies, input = {}) {
    const {
        db,
        mediaBucket,
        snapshotBucket = mediaBucket,
        now = () => new Date(),
        logger = catalogLog
    } = dependencies;
    const dryRun = input.commit !== true || CATALOG_MEDIA_GC_COMMIT !== 'true';
    const candidates = await db.collection('sys_catalog_media_gc')
        .where('state', '==', 'pending')
        .where('notBefore', '<=', now())
        .limit(MEDIA_GC_BATCH_SIZE)
        .get();
    if (candidates.empty) return { result: 'noop', dryRun, inspected: 0 };

    const source = await db.collection(`artifacts/${APP_ID}/public/data/furniture`).get();
    const sourcePaths = new Set();
    source.forEach((docSnap) => collectStoragePaths(docSnap.data()).forEach((path) => sourcePaths.add(path)));
    const retainedPaths = await collectRetainedSnapshotPaths(snapshotBucket, now());
    const summary = { inspected: 0, retained: 0, deleted: 0, missing: 0, generationChanged: 0, dryRun };

    for (const candidateSnap of candidates.docs) {
        summary.inspected += 1;
        const candidate = candidateSnap.data();
        if (sourcePaths.has(candidate.path) || retainedPaths.has(candidate.path)) {
            summary.retained += 1;
            continue;
        }
        const file = mediaBucket.file(candidate.path);
        let metadata;
        try {
            [metadata] = await file.getMetadata();
        } catch (error) {
            if (Number(error?.code) === 404) {
                summary.missing += 1;
                await candidateSnap.ref.set({ state: 'missing', processedAt: serverTimestamp() }, { merge: true });
                continue;
            }
            throw error;
        }
        if (candidate.generation && String(metadata.generation) !== String(candidate.generation)) {
            summary.generationChanged += 1;
            await candidateSnap.ref.set({ state: 'generation_changed', processedAt: serverTimestamp() }, { merge: true });
            continue;
        }
        if (dryRun) continue;
        await file.delete({ ifGenerationMatch: String(metadata.generation) });
        await candidateSnap.ref.set({ state: 'deleted', processedAt: serverTimestamp() }, { merge: true });
        summary.deleted += 1;
    }
    logger('info', { phase: 'media_gc', result: dryRun ? 'dry_run' : 'commit', sourceDocuments: source.size });
    return { result: dryRun ? 'dry_run' : 'completed', ...summary };
}

function serverTimestamp() {
    return admin.firestore.FieldValue.serverTimestamp();
}

const catalogMediaGarbageCollector = onSchedule(
    {
        schedule: 'every 24 hours',
        region: MEDIA_GC_REGION,
        serviceAccount: CATALOG_BUILDER_SERVICE_ACCOUNT,
        cpu: 1,
        concurrency: 1,
        minInstances: 0,
        maxInstances: 1,
        timeoutSeconds: 540,
        memory: '512MiB',
        retryCount: 0
    },
    async () => {
        const snapshotBucket = admin.storage().bucket(CATALOG_SNAPSHOT_BUCKET);
        const media = await runMediaGarbageCollection({
            db: admin.firestore(),
            mediaBucket: admin.storage().bucket(),
            snapshotBucket
        }, { commit: true });
        const releases = await runReleaseGarbageCollection(snapshotBucket, { commit: true });
        catalogLog('info', {
            phase: 'scheduled_gc',
            result: 'completed',
            mediaResult: media.result,
            releaseResult: releases.result,
            deletedReleases: releases.deletedReleases,
            deletedObjects: releases.deletedObjects
        });
        return { media, releases };
    }
);

module.exports = {
    MEDIA_GC_BATCH_SIZE,
    MEDIA_GC_REGION,
    MEDIA_GRACE_MS,
    catalogMediaGarbageCollector,
    collectRetainedSnapshotPaths,
    enqueueMediaCandidates,
    mediaCandidateId,
    runMediaGarbageCollection,
    storagePathFromMediaUrl
};
