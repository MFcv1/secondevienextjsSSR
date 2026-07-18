const crypto = require('crypto');

const PROJECTION_CONTRACT_VERSION = 1;
const PUBLIC_COLLECTION = 'furniture';

const PUBLIC_PRODUCT_FIELDS = Object.freeze([
    'status',
    'name',
    'title',
    'description',
    'seoTitle',
    'seoDescription',
    'seoIndexable',
    'category',
    'material',
    'woodType',
    'color',
    'customColor',
    'style',
    'origin',
    'dimensions',
    'width',
    'depth',
    'height',
    'weight',
    'sold',
    'stock',
    'currentPrice',
    'startingPrice',
    'price',
    'priceOnRequest',
    'nouveautesOrder',
    'petitsPrixOrder',
    'images',
    'imageUrl',
    'thumbnails',
    'thumbnailUrl',
    'imageVariants',
    'imageMetadata',
    'createdAt',
    'updatedAt'
]);

const CARD_PRODUCT_FIELDS = Object.freeze([
    'id',
    'collectionName',
    'status',
    'name',
    'title',
    'description',
    'seoTitle',
    'seoDescription',
    'seoIndexable',
    'category',
    'material',
    'sold',
    'stock',
    'currentPrice',
    'startingPrice',
    'price',
    'priceOnRequest',
    'nouveautesOrder',
    'petitsPrixOrder',
    'createdAt',
    'updatedAt'
]);

const isPlainObject = (value) => {
    if (!value || typeof value !== 'object') return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
};

function normalizeTimestamp(value) {
    if (value instanceof Date) {
        if (!Number.isFinite(value.getTime())) throw new TypeError('Invalid Date in public projection');
        return value.toISOString();
    }

    if (value && typeof value.toDate === 'function') {
        const date = value.toDate();
        if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
            throw new TypeError('Invalid Firestore timestamp in public projection');
        }
        return {
            seconds: Number(value.seconds),
            nanoseconds: Number(value.nanoseconds || 0)
        };
    }

    if (value && Number.isFinite(value.seconds)) {
        return {
            seconds: Number(value.seconds),
            nanoseconds: Number(value.nanoseconds || 0)
        };
    }

    return null;
}

function normalizePublicValue(value, seen = new WeakSet()) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) throw new TypeError('Non-finite number in public projection');
        return value;
    }
    if (value === undefined) return undefined;
    if (typeof value === 'bigint' || typeof value === 'symbol' || typeof value === 'function') {
        throw new TypeError(`Unsupported ${typeof value} in public projection`);
    }

    const timestamp = normalizeTimestamp(value);
    if (timestamp) return timestamp;

    if (seen.has(value)) throw new TypeError('Circular value in public projection');
    seen.add(value);

    if (Array.isArray(value)) {
        const normalized = value.map((item) => {
            const result = normalizePublicValue(item, seen);
            if (result === undefined) throw new TypeError('Undefined array item in public projection');
            return result;
        });
        seen.delete(value);
        return normalized;
    }

    if (!isPlainObject(value)) throw new TypeError('Unsupported object in public projection');
    const normalized = {};
    Object.keys(value).sort().forEach((key) => {
        const result = normalizePublicValue(value[key], seen);
        if (result !== undefined) normalized[key] = result;
    });
    seen.delete(value);
    return normalized;
}

function canonicalize(value) {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (!isPlainObject(value)) return value;
    return Object.fromEntries(
        Object.keys(value)
            .sort()
            .map((key) => [key, canonicalize(value[key])])
    );
}

function stableStringify(value) {
    return JSON.stringify(canonicalize(normalizePublicValue(value)));
}

function sha256(value) {
    const input = typeof value === 'string' ? value : stableStringify(value);
    return crypto.createHash('sha256').update(input).digest('hex');
}

function isPublicProduct(product) {
    return product?.status === 'published'
        && product.e2eOnly !== true
        && !String(product.e2ePurpose || '').trim();
}

function toPublicProduct(id, sourceProduct = {}) {
    const product = {
        id: String(id || sourceProduct.id || ''),
        collectionName: PUBLIC_COLLECTION
    };
    if (!product.id) throw new TypeError('Public product id is required');

    PUBLIC_PRODUCT_FIELDS.forEach((field) => {
        if (sourceProduct[field] === undefined) return;
        product[field] = normalizePublicValue(sourceProduct[field]);
    });
    return canonicalize(product);
}

function firstCardVariants(imageVariants) {
    const first = Array.isArray(imageVariants) ? imageVariants[0] : null;
    if (!first || typeof first !== 'object') return [];
    const projected = {};
    ['thumb320', 'thumb384', 'thumb', 'card', 'detailFast', 'medium'].forEach((field) => {
        if (first[field]) projected[field] = first[field];
    });
    return Object.keys(projected).length ? [projected] : [];
}

function firstCardMetadata(imageMetadata) {
    const first = Array.isArray(imageMetadata) ? imageMetadata[0] : null;
    if (!first || typeof first !== 'object') return [];
    const projected = {};
    ['width', 'height', 'ratio', 'dominantColor', 'blurDataUrl'].forEach((field) => {
        if (first[field] !== undefined && first[field] !== null && first[field] !== '') {
            projected[field] = first[field];
        }
    });
    return Object.keys(projected).length ? [projected] : [];
}

function toPublicCard(product) {
    const card = {};
    CARD_PRODUCT_FIELDS.forEach((field) => {
        if (product[field] !== undefined) card[field] = product[field];
    });
    const firstThumbnail = Array.isArray(product.thumbnails) ? product.thumbnails[0] : '';
    const firstImage = Array.isArray(product.images) ? product.images[0] : '';
    const variants = firstCardVariants(product.imageVariants);
    const metadata = firstCardMetadata(product.imageMetadata);
    card.thumbnailUrl = product.thumbnailUrl || firstThumbnail || variants[0]?.thumb384 || variants[0]?.thumb || '';
    card.imageUrl = product.imageUrl || variants[0]?.card || variants[0]?.medium || firstImage || '';
    card.thumbnails = firstThumbnail ? [firstThumbnail] : [];
    card.imageVariants = variants;
    card.imageMetadata = metadata;
    return canonicalize(card);
}

function compareCreatedAtDescending(left, right) {
    const leftTimestamp = left?.createdAt;
    const rightTimestamp = right?.createdAt;
    const toSeconds = (value) => {
        if (Number.isFinite(Number(value?.seconds))) return Number(value.seconds);
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed / 1000 : 0;
    };
    const leftSeconds = toSeconds(leftTimestamp);
    const rightSeconds = toSeconds(rightTimestamp);
    if (rightSeconds !== leftSeconds) return rightSeconds - leftSeconds;
    const leftNanos = Number(leftTimestamp?.nanoseconds || 0);
    const rightNanos = Number(rightTimestamp?.nanoseconds || 0);
    if (rightNanos !== leftNanos) return rightNanos - leftNanos;
    return String(left.id).localeCompare(String(right.id));
}

function buildPublicProjection(sourceDocuments = []) {
    const full = sourceDocuments
        .map(({ id, data }) => ({ id, data: data || {} }))
        .filter(({ data }) => isPublicProduct(data))
        .map(({ id, data }) => toPublicProduct(id, data))
        .sort(compareCreatedAtDescending);
    const cards = full.map(toPublicCard);
    const byIdForHash = [...full].sort((left, right) => left.id.localeCompare(right.id));
    const productHashes = Object.fromEntries(byIdForHash.map((product) => [product.id, sha256(product)]));

    return {
        schemaVersion: 1,
        projectionContractVersion: PROJECTION_CONTRACT_VERSION,
        full,
        cards,
        productHashes,
        aggregateSha256: sha256(byIdForHash)
    };
}

module.exports = {
    CARD_PRODUCT_FIELDS,
    PROJECTION_CONTRACT_VERSION,
    PUBLIC_COLLECTION,
    PUBLIC_PRODUCT_FIELDS,
    buildPublicProjection,
    canonicalize,
    compareCreatedAtDescending,
    isPublicProduct,
    normalizePublicValue,
    sha256,
    stableStringify,
    toPublicCard,
    toPublicProduct
};
