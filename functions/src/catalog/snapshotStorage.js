const { sha256, stableStringify } = require('./publicProjection');
const { createFullImpactPlan, validateImpactPlan } = require('./impactPlan');

const SNAPSHOT_ROOT = 'catalog-projection/v1';
const RELEASE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const POINTER_CACHE_CONTROL = 'public, max-age=5, s-maxage=15, stale-while-revalidate=30';
const POINTER_PATHS = Object.freeze({
    current: `${SNAPSHOT_ROOT}/pointers/current.json`,
    previous: `${SNAPSHOT_ROOT}/pointers/previous.json`,
    lastKnownGood: `${SNAPSHOT_ROOT}/pointers/last-known-good.json`
});

function jsonBuffer(value) {
    return Buffer.from(`${stableStringify(value)}\n`, 'utf8');
}

function buildSearchIndex(products) {
    return products.map((product) => ({
        id: product.id,
        category: product.category || '',
        name: product.name || product.title || '',
        text: [
            product.name,
            product.title,
            product.description,
            product.category,
            product.material,
            product.style,
            product.origin
        ].filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    }));
}

function collectMediaUrls(product) {
    const urls = new Set();
    const add = (value) => {
        if (typeof value === 'string' && value.trim()) urls.add(value.trim());
    };
    [product.imageUrl, product.thumbnailUrl].forEach(add);
    [product.images, product.thumbnails].forEach((items) => {
        if (Array.isArray(items)) items.forEach(add);
    });
    if (Array.isArray(product.imageVariants)) {
        product.imageVariants.forEach((variants) => {
            if (variants && typeof variants === 'object') Object.values(variants).forEach(add);
        });
    }
    return [...urls].sort();
}

function buildSnapshotFiles({ projection, inventory, revision, generatedAt = new Date().toISOString(), impactPlan = null }) {
    const baseMetadata = {
        schemaVersion: 1,
        projectionContractVersion: projection.projectionContractVersion,
        revision,
        generatedAt,
        aggregateSha256: projection.aggregateSha256
    };
    const resolvedImpactPlan = impactPlan || createFullImpactPlan({
        revision,
        aggregateSha256: projection.aggregateSha256,
        reason: 'source_release_unavailable',
        generatedAt
    });
    validateImpactPlan(resolvedImpactPlan, { revision, aggregateSha256: projection.aggregateSha256 });
    const payloads = {
        'catalog-full.json': { ...baseMetadata, products: projection.full },
        'catalog-cards.json': { ...baseMetadata, products: projection.cards },
        'impact-plan.json': resolvedImpactPlan,
        'search-index.json': { ...baseMetadata, products: buildSearchIndex(projection.full) },
        'media-index.json': {
            ...baseMetadata,
            products: projection.full.map((product) => ({ id: product.id, urls: collectMediaUrls(product) }))
        },
        'inventory-overview.json': { ...baseMetadata, overview: inventory }
    };
    const buffers = Object.fromEntries(Object.entries(payloads).map(([name, value]) => [name, jsonBuffer(value)]));
    const checksums = Object.fromEntries(Object.entries(buffers).map(([name, buffer]) => [name, {
        sha256: sha256(buffer.toString('utf8')),
        bytes: buffer.length
    }]));
    buffers['checksums.json'] = jsonBuffer({ ...baseMetadata, files: checksums });
    const manifest = {
        ...baseMetadata,
        impactPlanSha256: checksums['impact-plan.json'].sha256,
        productCount: projection.full.length,
        files: {
            ...checksums,
            'checksums.json': {
                sha256: sha256(buffers['checksums.json'].toString('utf8')),
                bytes: buffers['checksums.json'].length
            }
        }
    };
    buffers['manifest.json'] = jsonBuffer(manifest);
    return { buffers, manifest };
}

function isPreconditionError(error) {
    return Number(error?.code) === 412 || String(error?.code) === '412';
}

async function saveImmutable(file, buffer, metadata = {}) {
    try {
        await file.save(buffer, {
            resumable: false,
            validation: 'crc32c',
            contentType: 'application/json; charset=utf-8',
            metadata: {
                cacheControl: RELEASE_CACHE_CONTROL,
                ...metadata
            },
            preconditionOpts: { ifGenerationMatch: 0 }
        });
        return { created: true };
    } catch (error) {
        if (!isPreconditionError(error)) throw error;
        const [existing] = await file.download();
        if (sha256(existing.toString('utf8')) !== sha256(buffer.toString('utf8'))) {
            const collision = new Error(`REVISION_COLLISION:${file.name}`);
            collision.code = 'REVISION_COLLISION';
            throw collision;
        }
        return { created: false };
    }
}

async function verifyImmutableFile(file, expectedBuffer) {
    const [metadata] = await file.getMetadata();
    const size = Number(metadata.size);
    if (size !== expectedBuffer.length) throw new Error(`SNAPSHOT_SIZE_MISMATCH:${file.name}`);
    const [downloaded] = await file.download();
    if (sha256(downloaded.toString('utf8')) !== sha256(expectedBuffer.toString('utf8'))) {
        throw new Error(`SNAPSHOT_HASH_MISMATCH:${file.name}`);
    }
    return { generation: String(metadata.generation), size };
}

async function writeImmutableRelease(bucket, { buffers, manifest }, revision) {
    const releaseId = `r${revision}-${manifest.aggregateSha256.slice(0, 12)}`;
    const releasePrefix = `${SNAPSHOT_ROOT}/releases/${releaseId}`;
    const orderedNames = Object.keys(buffers)
        .filter((name) => name !== 'manifest.json')
        .sort((left, right) => (left === 'checksums.json' ? 1 : 0) - (right === 'checksums.json' ? 1 : 0));
    orderedNames.push('manifest.json');

    const generations = {};
    for (const name of orderedNames) {
        const file = bucket.file(`${releasePrefix}/${name}`);
        await saveImmutable(file, buffers[name], {
            metadata: {
                schemaVersion: '1',
                revision: String(revision),
                sha256: sha256(buffers[name].toString('utf8'))
            }
        });
        generations[name] = await verifyImmutableFile(file, buffers[name]);
    }

    return {
        releaseId,
        releasePrefix,
        manifestPath: `${releasePrefix}/manifest.json`,
        manifestSha256: sha256(buffers['manifest.json'].toString('utf8')),
        aggregateSha256: manifest.aggregateSha256,
        impactPlanPath: `${releasePrefix}/impact-plan.json`,
        impactPlanSha256: manifest.impactPlanSha256,
        generations
    };
}

async function readJsonObjectState(bucket, path, { maxAttempts = 3 } = {}) {
    const file = bucket.file(path);
    const [exists] = await file.exists();
    if (!exists) return { path, value: null, generation: null, metadata: null, missing: true, error: null };
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const [metadataBefore] = await file.getMetadata();
        const generation = String(metadataBefore.generation);
        const generationFile = bucket.file(path, { generation });
        let buffer;
        let metadataAfter;
        try {
            [buffer] = await generationFile.download();
            [metadataAfter] = await generationFile.getMetadata();
        } catch (error) {
            if (attempt < maxAttempts && [404, 412].includes(Number(error?.code))) continue;
            throw error;
        }
        if (String(metadataAfter.generation) !== generation) {
            if (attempt < maxAttempts) continue;
            const changed = new Error(`CATALOG_OBJECT_GENERATION_CHANGED:${path}`);
            changed.code = 'CATALOG_OBJECT_GENERATION_CHANGED';
            throw changed;
        }
        try {
            return {
                path,
                value: JSON.parse(buffer.toString('utf8')),
                buffer,
                generation,
                etag: metadataAfter.etag || metadataBefore.etag || null,
                metadata: metadataAfter,
                missing: false,
                error: null
            };
        } catch (cause) {
            const error = new Error(`CATALOG_JSON_INVALID:${path}`);
            error.code = 'CATALOG_JSON_INVALID';
            error.cause = cause;
            return {
                path,
                value: null,
                buffer,
                generation,
                etag: metadataAfter.etag || metadataBefore.etag || null,
                metadata: metadataAfter,
                missing: false,
                error
            };
        }
    }
    throw new Error(`CATALOG_OBJECT_READ_RETRY_EXHAUSTED:${path}`);
}

async function readJsonObject(bucket, path) {
    const state = await readJsonObjectState(bucket, path);
    if (state.missing) return null;
    if (state.error) throw state.error;
    return {
        value: state.value,
        buffer: state.buffer,
        generation: state.generation,
        etag: state.etag,
        metadata: state.metadata
    };
}

async function readPointerState(bucket, path) {
    if (!Object.values(POINTER_PATHS).includes(path)) throw new Error('CATALOG_POINTER_PATH_INVALID');
    return readJsonObjectState(bucket, path);
}

async function readCurrentPointer(bucket) {
    return readJsonObject(bucket, POINTER_PATHS.current);
}

async function readPreviousPointer(bucket) {
    return readJsonObject(bucket, POINTER_PATHS.previous);
}

async function readLastKnownGoodPointer(bucket) {
    return readJsonObject(bucket, POINTER_PATHS.lastKnownGood);
}

async function verifyStoredRelease(bucket, pointer) {
    const normalizedPointer = createPointer(pointer);
    if (Number(pointer.schemaVersion) !== 1 || Number(pointer.projectionContractVersion) !== 1) {
        throw new Error('CATALOG_POINTER_SCHEMA_UNSUPPORTED');
    }
    const manifestObject = await readJsonObject(bucket, normalizedPointer.manifestPath);
    if (!manifestObject) throw new Error('CATALOG_MANIFEST_MISSING');
    if (sha256(manifestObject.buffer.toString('utf8')) !== normalizedPointer.manifestSha256) {
        throw new Error('CATALOG_MANIFEST_HASH_MISMATCH');
    }
    const manifest = manifestObject.value;
    if (Number(manifest.schemaVersion) !== 1 || Number(manifest.projectionContractVersion) !== 1) {
        throw new Error('CATALOG_MANIFEST_SCHEMA_UNSUPPORTED');
    }
    if (Number(manifest.revision) !== normalizedPointer.revision) throw new Error('CATALOG_REVISION_MISMATCH');
    if (normalizedPointer.aggregateSha256
        && normalizedPointer.aggregateSha256 !== manifest.aggregateSha256) {
        throw new Error('CATALOG_AGGREGATE_IDENTITY_MISMATCH');
    }
    if (manifest.impactPlanSha256
        && manifest.impactPlanSha256 !== manifest.files?.['impact-plan.json']?.sha256) {
        throw new Error('CATALOG_IMPACT_MANIFEST_IDENTITY_MISMATCH');
    }
    if (normalizedPointer.impactPlanSha256
        && normalizedPointer.impactPlanSha256 !== manifest.files?.['impact-plan.json']?.sha256) {
        throw new Error('CATALOG_IMPACT_POINTER_IDENTITY_MISMATCH');
    }
    const prefix = normalizedPointer.manifestPath.replace(/\/manifest\.json$/, '');
    const bundles = {};
    for (const name of ['catalog-full.json', 'catalog-cards.json']) {
        const object = await readJsonObject(bucket, `${prefix}/${name}`);
        if (!object) throw new Error(`CATALOG_BUNDLE_MISSING:${name}`);
        if (sha256(object.buffer.toString('utf8')) !== manifest.files?.[name]?.sha256) {
            throw new Error(`CATALOG_BUNDLE_HASH_MISMATCH:${name}`);
        }
        if (Number(object.value?.revision) !== normalizedPointer.revision) {
            throw new Error(`CATALOG_BUNDLE_REVISION_MISMATCH:${name}`);
        }
        bundles[name] = object.value;
    }
    const full = bundles['catalog-full.json']?.products;
    const cards = bundles['catalog-cards.json']?.products;
    if (!Array.isArray(full) || !Array.isArray(cards) || full.length !== cards.length) {
        throw new Error('CATALOG_PRODUCTS_INVALID');
    }
    if (full.length !== Number(manifest.productCount)) throw new Error('CATALOG_PRODUCT_COUNT_MISMATCH');
    if (full.some((product, index) => product.id !== cards[index]?.id)) throw new Error('CATALOG_CARD_ORDER_MISMATCH');
    let impactPlan = null;
    const impactPlanPath = normalizedPointer.impactPlanPath || `${prefix}/impact-plan.json`;
    if (manifest.files?.['impact-plan.json']) {
        const impactObject = await readJsonObject(bucket, impactPlanPath);
        if (!impactObject) throw new Error('CATALOG_IMPACT_PLAN_MISSING');
        if (sha256(impactObject.buffer.toString('utf8')) !== manifest.files['impact-plan.json'].sha256) {
            throw new Error('CATALOG_IMPACT_PLAN_HASH_MISMATCH');
        }
        impactPlan = validateImpactPlan(impactObject.value, {
            revision: normalizedPointer.revision,
            aggregateSha256: manifest.aggregateSha256
        });
    }
    return { pointer: normalizedPointer, manifest, productCount: full.length, impactPlan };
}

function createPointer({
    revision,
    manifestPath,
    manifestSha256,
    aggregateSha256 = null,
    impactPlanPath = null,
    impactPlanSha256 = null,
    publishedAt = new Date().toISOString()
}) {
    const normalizedRevision = Number(revision);
    if (!Number.isInteger(normalizedRevision) || normalizedRevision < 1) throw new Error('CATALOG_POINTER_REVISION_INVALID');
    if (!manifestPath || !manifestSha256) throw new Error('CATALOG_POINTER_RELEASE_INVALID');
    if (!/^[a-f0-9]{64}$/i.test(String(manifestSha256))) throw new Error('CATALOG_POINTER_MANIFEST_HASH_INVALID');
    if (aggregateSha256 && !/^[a-f0-9]{64}$/i.test(String(aggregateSha256))) throw new Error('CATALOG_POINTER_AGGREGATE_HASH_INVALID');
    if (impactPlanSha256 && !/^[a-f0-9]{64}$/i.test(String(impactPlanSha256))) throw new Error('CATALOG_POINTER_IMPACT_HASH_INVALID');
    return {
        schemaVersion: 1,
        projectionContractVersion: 1,
        revision: normalizedRevision,
        manifestPath: String(manifestPath),
        manifestSha256: String(manifestSha256),
        ...(aggregateSha256 ? { aggregateSha256: String(aggregateSha256) } : {}),
        ...(impactPlanPath ? { impactPlanPath: String(impactPlanPath) } : {}),
        ...(impactPlanSha256 ? { impactPlanSha256: String(impactPlanSha256) } : {}),
        publishedAt: publishedAt || null
    };
}

async function readReleaseProducts(bucket, pointer) {
    const verified = await verifyStoredRelease(bucket, pointer);
    const prefix = verified.pointer.manifestPath.replace(/\/manifest\.json$/, '');
    const fullObject = await readJsonObject(bucket, `${prefix}/catalog-full.json`);
    return { pointer: verified.pointer, manifest: verified.manifest, products: fullObject.value.products };
}

async function readImpactPlan(bucket, pointer) {
    const verified = await verifyStoredRelease(bucket, pointer);
    if (!verified.impactPlan) throw new Error('CATALOG_IMPACT_PLAN_MISSING');
    return verified.impactPlan;
}

async function writePointer(bucket, path, pointer, expectedGeneration = null) {
    const normalizedPointer = createPointer(pointer);
    const buffer = jsonBuffer(normalizedPointer);
    const file = bucket.file(path);
    const options = {
        resumable: false,
        validation: 'crc32c',
        contentType: 'application/json; charset=utf-8',
        metadata: { cacheControl: POINTER_CACHE_CONTROL }
    };
    if (expectedGeneration !== null) {
        options.preconditionOpts = { ifGenerationMatch: expectedGeneration || 0 };
    }
    await file.save(buffer, {
        ...options
    });
    const [metadata] = await file.getMetadata();
    return {
        pointer: normalizedPointer,
        generation: String(metadata.generation),
        sha256: sha256(buffer.toString('utf8'))
    };
}

function sameRelease(left, right) {
    return Boolean(left && right
        && Number(left.revision) === Number(right.revision)
        && String(left.manifestPath || '') === String(right.manifestPath || '')
        && String(left.manifestSha256 || '') === String(right.manifestSha256 || ''));
}

function isCatalogIntegrityError(error) {
    return String(error?.code || '').startsWith('CATALOG_')
        || String(error?.message || '').startsWith('CATALOG_')
        || String(error?.code || '') === 'REVISION_COLLISION';
}

async function verifiedPointerOrNull(bucket, pointer) {
    if (!pointer?.manifestPath) return null;
    try {
        const verified = await verifyStoredRelease(bucket, pointer);
        return verified.pointer;
    } catch (error) {
        if (isCatalogIntegrityError(error)) return null;
        throw error;
    }
}

async function readVerifiedPointerOrNull(bucket, path) {
    try {
        const object = await readJsonObject(bucket, path);
        return verifiedPointerOrNull(bucket, object?.value);
    } catch (error) {
        if (isCatalogIntegrityError(error)) return null;
        throw error;
    }
}

async function writeFallbackPointers(bucket, { previous, lastKnownGood }) {
    const previousPointer = await verifiedPointerOrNull(bucket, previous);
    const lastKnownGoodPointer = await verifiedPointerOrNull(bucket, lastKnownGood);
    if (lastKnownGoodPointer && !sameRelease(lastKnownGoodPointer, previousPointer)) {
        await writePointer(bucket, POINTER_PATHS.lastKnownGood, lastKnownGoodPointer);
    }
    if (previousPointer) {
        await writePointer(bucket, POINTER_PATHS.previous, previousPointer);
    }
    return { previousPointer, lastKnownGoodPointer };
}

async function publishCurrentPointer(bucket, {
    revision,
    release,
    previous,
    lastKnownGood,
    excludedManifestSha256 = null,
    expectedGeneration,
    onCurrentCommitted = null
}) {
    const nextPointer = createPointer({
        revision,
        manifestPath: release.manifestPath,
        manifestSha256: release.manifestSha256,
        aggregateSha256: release.aggregateSha256,
        impactPlanPath: release.impactPlanPath,
        impactPlanSha256: release.impactPlanSha256,
        publishedAt: new Date().toISOString()
    });
    const previousPointer = await verifiedPointerOrNull(bucket, previous);
    const [storedPreviousPointer, suppliedLastKnownGoodPointer, storedLastKnownGoodPointer] = await Promise.all([
        readVerifiedPointerOrNull(bucket, POINTER_PATHS.previous),
        verifiedPointerOrNull(bucket, lastKnownGood),
        readVerifiedPointerOrNull(bucket, POINTER_PATHS.lastKnownGood)
    ]);
    const isAllowedFallback = (candidate) => candidate
        && !sameRelease(candidate, previousPointer)
        && (!excludedManifestSha256 || candidate.manifestSha256 !== excludedManifestSha256);
    const lastKnownGoodPointer = [storedPreviousPointer, suppliedLastKnownGoodPointer, storedLastKnownGoodPointer]
        .find(isAllowedFallback) || null;

    const published = await writePointer(bucket, POINTER_PATHS.current, nextPointer, expectedGeneration || 0);
    if (typeof onCurrentCommitted === 'function') {
        await onCurrentCommitted({ ...published, previousPointer, lastKnownGoodPointer });
    }
    const fallbacks = await writeFallbackPointers(bucket, { previous: previousPointer, lastKnownGood: lastKnownGoodPointer });
    return {
        ...published,
        ...fallbacks
    };
}

module.exports = {
    POINTER_CACHE_CONTROL,
    POINTER_PATHS,
    RELEASE_CACHE_CONTROL,
    SNAPSHOT_ROOT,
    buildSnapshotFiles,
    collectMediaUrls,
    createPointer,
    isPreconditionError,
    isCatalogIntegrityError,
    jsonBuffer,
    publishCurrentPointer,
    readJsonObjectState,
    readImpactPlan,
    readReleaseProducts,
    readPointerState,
    readCurrentPointer,
    readLastKnownGoodPointer,
    readPreviousPointer,
    readJsonObject,
    saveImmutable,
    verifyImmutableFile,
    verifyStoredRelease,
    writeImmutableRelease,
    writeFallbackPointers,
    writePointer
};
