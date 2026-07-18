const {
    SNAPSHOT_ROOT,
    readCurrentPointer,
    readLastKnownGoodPointer,
    readPreviousPointer
} = require('./snapshotStorage');

const RELEASE_ROOT = `${SNAPSHOT_ROOT}/releases/`;
const RELEASE_GRACE_MS = 48 * 60 * 60 * 1000;
const MIN_RECENT_RELEASES = 10;
const DELETE_BATCH_SIZE = 25;

function releasePrefixFromObjectName(name) {
    if (typeof name !== 'string' || !name.startsWith(RELEASE_ROOT)) return null;
    const releaseId = name.slice(RELEASE_ROOT.length).split('/')[0];
    return releaseId ? `${RELEASE_ROOT}${releaseId}` : null;
}

function pointerReleasePrefix(pointerObject) {
    const manifestPath = pointerObject?.value?.manifestPath;
    if (typeof manifestPath !== 'string' || !manifestPath.startsWith(RELEASE_ROOT)) return null;
    return manifestPath.replace(/\/manifest\.json$/, '');
}

async function mapWithConcurrency(items, concurrency, callback) {
    const results = [];
    for (let index = 0; index < items.length; index += concurrency) {
        results.push(...await Promise.all(items.slice(index, index + concurrency).map(callback)));
    }
    return results;
}

async function planReleaseGarbageCollection(bucket, options = {}) {
    const now = options.now instanceof Date ? options.now : new Date();
    const graceMs = Number.isFinite(options.graceMs) ? options.graceMs : RELEASE_GRACE_MS;
    const minimumRecent = Number.isInteger(options.minimumRecent) ? options.minimumRecent : MIN_RECENT_RELEASES;
    const [current, previous, lastKnownGood] = await Promise.all([
        readCurrentPointer(bucket),
        readPreviousPointer(bucket),
        readLastKnownGoodPointer(bucket)
    ]);
    if (!current?.value?.manifestPath) throw new Error('CATALOG_RELEASE_GC_CURRENT_POINTER_MISSING');

    const protectedPrefixes = new Set(
        [current, previous, lastKnownGood].map(pointerReleasePrefix).filter(Boolean)
    );
    const [files] = await bucket.getFiles({ prefix: RELEASE_ROOT });
    const releases = new Map();
    for (const file of files) {
        const prefix = releasePrefixFromObjectName(file.name);
        if (!prefix) continue;
        const release = releases.get(prefix) || { prefix, files: [], representative: file };
        release.files.push(file);
        if (file.name.endsWith('/manifest.json')) release.representative = file;
        releases.set(prefix, release);
    }

    const described = await mapWithConcurrency([...releases.values()], DELETE_BATCH_SIZE, async (release) => {
        const [metadata] = await release.representative.getMetadata();
        const timestamp = Date.parse(metadata.timeCreated || metadata.updated || 0);
        if (!Number.isFinite(timestamp)) throw new Error('CATALOG_RELEASE_GC_TIMESTAMP_INVALID');
        return { ...release, timestamp };
    });
    described.sort((left, right) => right.timestamp - left.timestamp);

    const retained = [];
    const candidates = [];
    described.forEach((release, index) => {
        const isProtected = protectedPrefixes.has(release.prefix)
            || index < minimumRecent
            || release.timestamp >= now.getTime() - graceMs;
        (isProtected ? retained : candidates).push(release);
    });
    return {
        candidates,
        retained,
        totalReleases: described.length,
        protectedPointerCount: protectedPrefixes.size
    };
}

async function runReleaseGarbageCollection(bucket, options = {}) {
    const plan = await planReleaseGarbageCollection(bucket, options);
    if (options.commit !== true) {
        return {
            result: 'dry_run',
            totalReleases: plan.totalReleases,
            retainedReleases: plan.retained.length,
            candidateReleases: plan.candidates.length,
            deletedReleases: 0,
            deletedObjects: 0
        };
    }

    let deletedObjects = 0;
    for (const release of plan.candidates) {
        await mapWithConcurrency(release.files, DELETE_BATCH_SIZE, async (file) => {
            const [metadata] = await file.getMetadata();
            await file.delete({ ifGenerationMatch: String(metadata.generation) });
            deletedObjects += 1;
        });
    }
    return {
        result: 'completed',
        totalReleases: plan.totalReleases,
        retainedReleases: plan.retained.length,
        candidateReleases: plan.candidates.length,
        deletedReleases: plan.candidates.length,
        deletedObjects
    };
}

module.exports = {
    MIN_RECENT_RELEASES,
    RELEASE_GRACE_MS,
    RELEASE_ROOT,
    planReleaseGarbageCollection,
    releasePrefixFromObjectName,
    runReleaseGarbageCollection
};
