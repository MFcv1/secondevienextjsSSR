const { sha256, stableStringify } = require('./publicProjection');

const SNAPSHOT_ROOT = 'catalog-projection/v1';
const RELEASE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const POINTER_CACHE_CONTROL = 'public, max-age=5, s-maxage=15, stale-while-revalidate=30';

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
    return readJsonObject(bucket, `${SNAPSHOT_ROOT}/pointers/current.json`);
}

async function publishCurrentPointer(bucket, { revision, release, previous, expectedGeneration }) {
    const path = `${SNAPSHOT_ROOT}/pointers/current.json`;
    const pointer = {
        schemaVersion: 1,
        projectionContractVersion: 1,
        revision,
        manifestPath: release.manifestPath,
        manifestSha256: release.manifestSha256,
        publishedAt: new Date().toISOString(),
        previous: previous ? {
            revision: previous.revision,
            manifestPath: previous.manifestPath,
            manifestSha256: previous.manifestSha256
        } : null
    };
    const buffer = jsonBuffer(pointer);
    if (previous?.manifestPath && previous?.manifestSha256) {
        const previousPointer = {
            schemaVersion: 1,
            projectionContractVersion: Number(previous.projectionContractVersion || 1),
            revision: Number(previous.revision),
            manifestPath: previous.manifestPath,
            manifestSha256: previous.manifestSha256,
            publishedAt: previous.publishedAt || null
        };
        await bucket.file(`${SNAPSHOT_ROOT}/pointers/previous.json`).save(jsonBuffer(previousPointer), {
            resumable: false,
            validation: 'crc32c',
            contentType: 'application/json; charset=utf-8',
            metadata: { cacheControl: POINTER_CACHE_CONTROL }
        });
    }
    const file = bucket.file(path);
    await file.save(buffer, {
        resumable: false,
        validation: 'crc32c',
        contentType: 'application/json; charset=utf-8',
        metadata: { cacheControl: POINTER_CACHE_CONTROL },
        preconditionOpts: { ifGenerationMatch: expectedGeneration || 0 }
    });
    const [metadata] = await file.getMetadata();
    return { pointer, generation: String(metadata.generation), sha256: sha256(buffer.toString('utf8')) };
}

module.exports = {
    POINTER_CACHE_CONTROL,
    RELEASE_CACHE_CONTROL,
    SNAPSHOT_ROOT,
    buildSnapshotFiles,
    collectMediaUrls,
    isPreconditionError,
    jsonBuffer,
    publishCurrentPointer,
    readCurrentPointer,
    readJsonObject,
    saveImmutable,
    verifyImmutableFile,
    writeImmutableRelease
};
