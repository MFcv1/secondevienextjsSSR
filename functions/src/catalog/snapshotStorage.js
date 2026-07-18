const { sha256, stableStringify } = require('./publicProjection');

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

function buildSnapshotFiles({ projection, inventory, revision, generatedAt = new Date().toISOString() }) {
    const baseMetadata = {
        schemaVersion: 1,
        projectionContractVersion: projection.projectionContractVersion,
        revision,
        generatedAt,
        aggregateSha256: projection.aggregateSha256
    };
    const payloads = {
        'catalog-full.json': { ...baseMetadata, products: projection.full },
        'catalog-cards.json': { ...baseMetadata, products: projection.cards },
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
        generations
    };
}

async function readJsonObject(bucket, path) {
    const file = bucket.file(path);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [metadata] = await file.getMetadata();
    const [buffer] = await file.download();
    return {
        value: JSON.parse(buffer.toString('utf8')),
        buffer,
        generation: String(metadata.generation),
        metadata
    };
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
    return { pointer: normalizedPointer, manifest, productCount: full.length };
}

function createPointer({ revision, manifestPath, manifestSha256, publishedAt = new Date().toISOString() }) {
    const normalizedRevision = Number(revision);
    if (!Number.isInteger(normalizedRevision) || normalizedRevision < 1) throw new Error('CATALOG_POINTER_REVISION_INVALID');
    if (!manifestPath || !manifestSha256) throw new Error('CATALOG_POINTER_RELEASE_INVALID');
    return {
        schemaVersion: 1,
        projectionContractVersion: 1,
        revision: normalizedRevision,
        manifestPath: String(manifestPath),
        manifestSha256: String(manifestSha256),
        publishedAt: publishedAt || null
    };
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

async function publishCurrentPointer(bucket, { revision, release, previous, expectedGeneration }) {
    const nextPointer = createPointer({
        revision,
        manifestPath: release.manifestPath,
        manifestSha256: release.manifestSha256,
        publishedAt: new Date().toISOString()
    });
    const previousPointer = previous?.manifestPath ? createPointer(previous) : null;
    const [priorPreviousObject, storedLastKnownGoodObject] = previousPointer
        ? await Promise.all([readPreviousPointer(bucket), readLastKnownGoodPointer(bucket)])
        : [null, await readLastKnownGoodPointer(bucket)];
    const priorPreviousPointer = priorPreviousObject?.value?.manifestPath
        ? createPointer(priorPreviousObject.value)
        : null;
    let lastKnownGoodPointer = storedLastKnownGoodObject?.value?.manifestPath
        ? createPointer(storedLastKnownGoodObject.value)
        : null;

    if (priorPreviousPointer && Number(priorPreviousPointer.revision) !== Number(previousPointer.revision)) {
        await writePointer(bucket, POINTER_PATHS.lastKnownGood, priorPreviousPointer);
        lastKnownGoodPointer = priorPreviousPointer;
    }
    if (previousPointer) {
        await writePointer(bucket, POINTER_PATHS.previous, previousPointer);
    }
    const published = await writePointer(bucket, POINTER_PATHS.current, nextPointer, expectedGeneration || 0);
    return {
        ...published,
        previousPointer,
        lastKnownGoodPointer
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
    jsonBuffer,
    publishCurrentPointer,
    readCurrentPointer,
    readLastKnownGoodPointer,
    readPreviousPointer,
    readJsonObject,
    saveImmutable,
    verifyImmutableFile,
    verifyStoredRelease,
    writeImmutableRelease,
    writePointer
};
