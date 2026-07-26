'use strict';

const crypto = require('node:crypto');

const INVENTORY_KEY_VERSION = 1;
const ALLOWED_PRODUCT_COLLECTIONS = Object.freeze(['furniture']);
const NULL_VARIANT_SENTINEL = '\u0000NO_VARIANT';

function keyError(code, field) {
    const error = new Error(field ? `${code}:${field}` : code);
    error.code = code;
    if (field) error.field = field;
    return error;
}

function normalizeSegment(value, field) {
    if (typeof value !== 'string') throw keyError('COMMERCE_INVENTORY_KEY_INVALID', field);
    const normalized = value.normalize('NFC').trim();
    const containsControl = [...normalized].some((character) => character.codePointAt(0) <= 31);
    if (!normalized || normalized.length > 256 || normalized.includes('/') || containsControl) {
        throw keyError('COMMERCE_INVENTORY_KEY_INVALID', field);
    }
    return normalized;
}

function lengthPrefix(value) {
    return `${Buffer.byteLength(value, 'utf8')}:${value}`;
}

function canonicalInventoryIdentity({ collectionName, productId, variantId = null }) {
    const collection = normalizeSegment(collectionName, 'collectionName');
    if (!ALLOWED_PRODUCT_COLLECTIONS.includes(collection)) {
        throw keyError('COMMERCE_INVENTORY_COLLECTION_FORBIDDEN', 'collectionName');
    }
    const product = normalizeSegment(productId, 'productId');
    const variant = variantId === null
        ? NULL_VARIANT_SENTINEL
        : normalizeSegment(variantId, 'variantId');
    return [
        `v${INVENTORY_KEY_VERSION}`,
        lengthPrefix(collection),
        lengthPrefix(product),
        lengthPrefix(variant)
    ].join('|');
}

function createInventoryKey(identity) {
    return crypto.createHash('sha256')
        .update(canonicalInventoryIdentity(identity))
        .digest('hex');
}

module.exports = {
    ALLOWED_PRODUCT_COLLECTIONS,
    INVENTORY_KEY_VERSION,
    NULL_VARIANT_SENTINEL,
    canonicalInventoryIdentity,
    createInventoryKey
};
