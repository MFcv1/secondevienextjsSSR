'use strict';

const PRODUCT_ACTIONS = Object.freeze([
    'create_product',
    'update_product_content',
    'update_product_offer',
    'publish_product',
    'adjust_inventory',
    'delete_product'
]);

const EDITORIAL_FIELDS = new Set([
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
    'weight'
]);

const MEDIA_FIELDS = new Set([
    'images',
    'imageUrl',
    'thumbnails',
    'thumbnailUrl',
    'imageVariants',
    'imageMetadata'
]);

const MAX_PRODUCT_IMAGES = 23;

function productError(code, field) {
    const error = new Error(field ? `${code}:${field}` : code);
    error.code = code;
    if (field) error.field = field;
    return error;
}

function isPlainObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function assertOnlyFields(value, allowed, prefix) {
    if (!isPlainObject(value)) throw productError('COMMERCE_PRODUCT_PAYLOAD_INVALID', prefix);
    for (const field of Object.keys(value)) {
        if (!allowed.has(field)) {
            throw productError('COMMERCE_PRODUCT_FIELD_FORBIDDEN', `${prefix}.${field}`);
        }
    }
}

function normalizeText(value, field, maxLength, { required = false } = {}) {
    if (typeof value !== 'string') throw productError('COMMERCE_PRODUCT_FIELD_INVALID', field);
    const normalized = value.normalize('NFC').trim();
    if ((required && !normalized) || normalized.length > maxLength) {
        throw productError('COMMERCE_PRODUCT_FIELD_INVALID', field);
    }
    return normalized;
}

function normalizeStructuredValue(value, field, depth = 0) {
    if (depth > 5) throw productError('COMMERCE_PRODUCT_FIELD_INVALID', field);
    if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'boolean'
    ) {
        return value;
    }
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) throw productError('COMMERCE_PRODUCT_FIELD_INVALID', field);
        return value;
    }
    if (Array.isArray(value)) {
        if (value.length > 24) throw productError('COMMERCE_PRODUCT_FIELD_INVALID', field);
        return value.map((item, index) => normalizeStructuredValue(
            item,
            `${field}[${index}]`,
            depth + 1
        ));
    }
    if (!isPlainObject(value) || Object.keys(value).length > 32) {
        throw productError('COMMERCE_PRODUCT_FIELD_INVALID', field);
    }
    return Object.fromEntries(Object.entries(value).map(([key, item]) => {
        if (!/^[A-Za-z0-9_-]{1,80}$/.test(key)) {
            throw productError('COMMERCE_PRODUCT_FIELD_INVALID', field);
        }
        return [key, normalizeStructuredValue(item, `${field}.${key}`, depth + 1)];
    }));
}

function normalizeEditorial(value) {
    assertOnlyFields(value, EDITORIAL_FIELDS, 'editorial');
    const normalized = {};
    for (const [field, item] of Object.entries(value)) {
        if (field === 'seoIndexable') {
            if (typeof item !== 'boolean') {
                throw productError('COMMERCE_PRODUCT_FIELD_INVALID', `editorial.${field}`);
            }
            normalized[field] = item;
            continue;
        }
        const maxLength = field === 'description' ? 10000 : 300;
        normalized[field] = normalizeText(
            item,
            `editorial.${field}`,
            maxLength,
            { required: ['name', 'category'].includes(field) }
        );
    }
    if (!normalized.name || !normalized.category) {
        throw productError('COMMERCE_PRODUCT_REQUIRED_FIELD_MISSING');
    }
    return normalized;
}

function normalizeMedia(value) {
    assertOnlyFields(value, MEDIA_FIELDS, 'media');
    const normalized = {};
    for (const [field, item] of Object.entries(value)) {
        normalized[field] = normalizeStructuredValue(item, `media.${field}`);
    }
    const serialized = JSON.stringify(normalized);
    if (serialized.length > 300000) throw productError('COMMERCE_PRODUCT_MEDIA_TOO_LARGE');
    for (const field of ['images', 'thumbnails', 'imageVariants', 'imageMetadata']) {
        if (normalized[field] !== undefined && !Array.isArray(normalized[field])) {
            throw productError('COMMERCE_PRODUCT_FIELD_INVALID', `media.${field}`);
        }
        if (normalized[field]?.length > MAX_PRODUCT_IMAGES) {
            throw productError('COMMERCE_PRODUCT_FIELD_INVALID', `media.${field}`);
        }
    }
    for (const field of ['imageUrl', 'thumbnailUrl']) {
        if (normalized[field] !== undefined && typeof normalized[field] !== 'string') {
            throw productError('COMMERCE_PRODUCT_FIELD_INVALID', `media.${field}`);
        }
    }
    return normalized;
}

function normalizeEuroAmount(value, field) {
    if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 10000000 ||
        Math.abs((value * 100) - Math.round(value * 100)) > 1e-7
    ) {
        throw productError('COMMERCE_PRODUCT_PRICE_INVALID', field);
    }
    return value;
}

function normalizeOffer(value) {
    const allowed = new Set(['currentPrice', 'startingPrice', 'priceOnRequest']);
    assertOnlyFields(value, allowed, 'offer');
    if (
        value.currentPrice === undefined ||
        value.startingPrice === undefined ||
        typeof value.priceOnRequest !== 'boolean'
    ) {
        throw productError('COMMERCE_PRODUCT_OFFER_INVALID');
    }
    const currentPrice = normalizeEuroAmount(value.currentPrice, 'offer.currentPrice');
    const startingPrice = normalizeEuroAmount(value.startingPrice, 'offer.startingPrice');
    if (!value.priceOnRequest && currentPrice <= 0) {
        throw productError('COMMERCE_PRODUCT_OFFER_INVALID');
    }
    return {
        currentPrice,
        startingPrice,
        priceOnRequest: value.priceOnRequest
    };
}

function assertStrongAdmin(actor) {
    if (
        !actor ||
        typeof actor.uid !== 'string' ||
        actor.uid.length < 3 ||
        actor.role !== 'admin' ||
        actor.aal2 !== true
    ) {
        throw productError('COMMERCE_PRODUCT_ADMIN_AAL2_REQUIRED');
    }
}

function assertProductIdentity(collectionName, productId) {
    if (collectionName !== 'furniture') {
        throw productError('COMMERCE_PRODUCT_COLLECTION_FORBIDDEN');
    }
    if (
        typeof productId !== 'string' ||
        !/^[A-Za-z0-9_-]{8,160}$/.test(productId)
    ) {
        throw productError('COMMERCE_PRODUCT_ID_INVALID');
    }
}

function assertPublishable(product) {
    if (
        typeof product.name !== 'string' ||
        !product.name ||
        typeof product.category !== 'string' ||
        !product.category ||
        typeof product.description !== 'string'
    ) {
        throw productError('COMMERCE_PRODUCT_NOT_PUBLISHABLE');
    }
    if (
        product.priceOnRequest !== true &&
        (!(typeof product.currentPrice === 'number') || product.currentPrice <= 0)
    ) {
        throw productError('COMMERCE_PRODUCT_NOT_PUBLISHABLE');
    }
    if (product.seoIndexable === true) {
        const seoDescription = String(product.seoDescription || product.description).trim();
        if (seoDescription.length < 48 || !Array.isArray(product.images) || product.images.length === 0) {
            throw productError('COMMERCE_PRODUCT_NOT_INDEXABLE');
        }
    }
}

function validateExistingProduct(product) {
    if (!isPlainObject(product)) throw productError('COMMERCE_PRODUCT_INVALID');
    const commerceVersion = product.commerceVersion ?? 0;
    const inventoryVersion = product.inventoryVersion ?? 0;
    if (
        !Number.isSafeInteger(commerceVersion) ||
        commerceVersion < 0 ||
        !Number.isSafeInteger(inventoryVersion) ||
        inventoryVersion < 0 ||
        !Number.isSafeInteger(product.stock) ||
        product.stock < 0
    ) {
        throw productError('COMMERCE_PRODUCT_INVALID');
    }
    return { commerceVersion, inventoryVersion };
}

function applyProductAction({
    action,
    product,
    payload,
    actor,
    reason,
    now
}) {
    if (!PRODUCT_ACTIONS.includes(action)) {
        throw productError('COMMERCE_PRODUCT_ACTION_UNSUPPORTED');
    }
    assertStrongAdmin(actor);
    if (typeof reason !== 'string' || reason.length < 3 || reason.length > 500) {
        throw productError('COMMERCE_PRODUCT_REASON_INVALID');
    }
    if (typeof now !== 'string' || !now) throw productError('COMMERCE_PRODUCT_CLOCK_INVALID');

    if (action === 'create_product') {
        if (product) throw productError('COMMERCE_PRODUCT_ALREADY_EXISTS');
        const allowed = new Set(['editorial', 'media']);
        assertOnlyFields(payload, allowed, 'payload');
        const editorial = normalizeEditorial(payload.editorial);
        const media = normalizeMedia(payload.media || {});
        return {
            ...editorial,
            ...media,
            status: 'draft',
            currentPrice: 0,
            startingPrice: 0,
            priceOnRequest: false,
            stock: 0,
            sold: false,
            soldAt: null,
            // Les creations entrent en tete des Nouveautes. La Vue Globale
            // renumerote ensuite toute la selection lors d'un tri manuel.
            nouveautesOrder: -1,
            inventoryVersion: 0,
            commerceVersion: 0,
            createdAt: now,
            updatedAt: now
        };
    }

    const versions = validateExistingProduct(product);
    const next = {
        ...product,
        commerceVersion: versions.commerceVersion + 1,
        updatedAt: now
    };

    if (action === 'update_product_offer') {
        const allowed = new Set(['offer']);
        assertOnlyFields(payload, allowed, 'payload');
        return { ...next, ...normalizeOffer(payload.offer) };
    }
    if (action === 'update_product_content') {
        const allowed = new Set(['editorial', 'media']);
        assertOnlyFields(payload, allowed, 'payload');
        if (payload.editorial === undefined && payload.media === undefined) {
            throw productError('COMMERCE_PRODUCT_PAYLOAD_INVALID', 'payload');
        }
        return {
            ...next,
            ...(payload.editorial === undefined ? {} : normalizeEditorial(payload.editorial)),
            ...(payload.media === undefined ? {} : normalizeMedia(payload.media))
        };
    }
    if (action === 'publish_product') {
        const allowed = new Set(['published']);
        assertOnlyFields(payload, allowed, 'payload');
        if (typeof payload.published !== 'boolean') {
            throw productError('COMMERCE_PRODUCT_PUBLICATION_INVALID');
        }
        if (payload.published) assertPublishable(next);
        return {
            ...next,
            status: payload.published ? 'published' : 'draft',
            publishedAt: payload.published ? (product.publishedAt || now) : null
        };
    }
    if (action === 'adjust_inventory') {
        const allowed = new Set(['delta', 'expectedInventoryVersion']);
        assertOnlyFields(payload, allowed, 'payload');
        if (
            !Number.isSafeInteger(payload.delta) ||
            payload.delta === 0 ||
            Math.abs(payload.delta) > 1000 ||
            payload.expectedInventoryVersion !== versions.inventoryVersion
        ) {
            throw productError('COMMERCE_PRODUCT_INVENTORY_ADJUSTMENT_INVALID');
        }
        const stock = product.stock + payload.delta;
        if (!Number.isSafeInteger(stock) || stock < 0) {
            throw productError('COMMERCE_PRODUCT_INVENTORY_NEGATIVE');
        }
        return {
            ...next,
            stock,
            sold: stock === 0,
            soldAt: stock === 0 ? (product.soldAt || now) : null,
            inventoryVersion: versions.inventoryVersion + 1
        };
    }
    return null;
}

module.exports = {
    PRODUCT_ACTIONS,
    applyProductAction,
    assertProductIdentity,
    assertStrongAdmin,
    normalizeOffer,
    validateExistingProduct
};
