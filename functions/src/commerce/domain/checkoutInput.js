'use strict';

const { canonicalize, hashPayload } = require('./idempotency');
const { createInventoryKey } = require('./inventoryKey');
const { normalizePromotionCode } = require('./promotionCode');

const ROOT_FIELDS = new Set(['clientOrderId', 'items', 'deliveryModeId', 'shippingAddress', 'promotionCode']);
const LINE_FIELDS = new Set([
    'cartLineId',
    'cartRevision',
    'productId',
    'collectionName',
    'variantId',
    'quantity'
]);
const ADDRESS_FIELDS = new Set(['fullName', 'phone', 'line1', 'line2', 'postalCode', 'city', 'country']);

function inputError(code, field) {
    const error = new Error(field ? `${code}:${field}` : code);
    error.code = code;
    if (field) error.field = field;
    return error;
}

function assertAllowedFields(value, fields, prefix) {
    for (const field of Object.keys(value || {})) {
        if (!fields.has(field)) throw inputError('COMMERCE_CHECKOUT_FIELD_FORBIDDEN', `${prefix}.${field}`);
    }
}

function identifier(value, field) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{8,160}$/.test(value)) {
        throw inputError('COMMERCE_CHECKOUT_IDENTIFIER_INVALID', field);
    }
    return value;
}

function validateCheckoutInput(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw inputError('COMMERCE_CHECKOUT_INPUT_INVALID');
    }
    assertAllowedFields(input, ROOT_FIELDS, 'checkout');
    identifier(input.clientOrderId, 'clientOrderId');
    identifier(input.deliveryModeId, 'deliveryModeId');
    if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 50) {
        throw inputError('COMMERCE_CHECKOUT_ITEMS_INVALID');
    }

    let totalQuantity = 0;
    const items = input.items.map((line, index) => {
        if (!line || typeof line !== 'object' || Array.isArray(line)) {
            throw inputError('COMMERCE_CHECKOUT_LINE_INVALID', `items[${index}]`);
        }
        assertAllowedFields(line, LINE_FIELDS, `items[${index}]`);
        const normalized = {
            cartLineId: identifier(line.cartLineId, `items[${index}].cartLineId`),
            cartRevision: line.cartRevision,
            productId: identifier(line.productId, `items[${index}].productId`),
            collectionName: line.collectionName,
            variantId: line.variantId === null ? null : identifier(line.variantId, `items[${index}].variantId`),
            quantity: line.quantity
        };
        if (!Number.isSafeInteger(normalized.cartRevision) || normalized.cartRevision < 0) {
            throw inputError('COMMERCE_CHECKOUT_REVISION_INVALID', `items[${index}].cartRevision`);
        }
        if (!Number.isSafeInteger(normalized.quantity) || normalized.quantity <= 0 || normalized.quantity > 20) {
            throw inputError('COMMERCE_CHECKOUT_QUANTITY_INVALID', `items[${index}].quantity`);
        }
        totalQuantity += normalized.quantity;
        normalized.inventoryKey = createInventoryKey(normalized);
        return normalized;
    });
    if (totalQuantity > 100) throw inputError('COMMERCE_CHECKOUT_QUANTITY_INVALID', 'items');

    const shippingAddress = validateShippingAddressShape(input.shippingAddress);
    const normalized = {
        clientOrderId: input.clientOrderId,
        items,
        deliveryModeId: input.deliveryModeId,
        shippingAddress,
        promotionCode: input.promotionCode ? normalizePromotionCode(input.promotionCode) : null
    };
    return {
        value: normalized,
        requestHash: hashPayload(normalized)
    };
}

function validateShippingAddressShape(address) {
    if (!address || typeof address !== 'object' || Array.isArray(address)) {
        throw inputError('COMMERCE_ADDRESS_INVALID');
    }
    assertAllowedFields(address, ADDRESS_FIELDS, 'shippingAddress');
    const normalized = {};
    for (const field of ['fullName', 'line1', 'postalCode', 'city', 'country']) {
        if (typeof address[field] !== 'string' || !address[field].trim()) {
            throw inputError('COMMERCE_ADDRESS_INVALID', field);
        }
        normalized[field] = address[field].normalize('NFC').trim();
    }
    normalized.line2 = typeof address.line2 === 'string' ? address.line2.normalize('NFC').trim() : '';
    normalized.phone = typeof address.phone === 'string'
        ? address.phone.normalize('NFC').trim()
        : '';
    if (normalized.fullName.length > 120 || normalized.line1.length > 160 ||
        normalized.line2.length > 160 || normalized.city.length > 120 ||
        normalized.phone.length > 40) {
        throw inputError('COMMERCE_ADDRESS_INVALID', 'length');
    }
    normalized.country = normalized.country.toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalized.country) || !/^[A-Za-z0-9 -]{3,12}$/.test(normalized.postalCode)) {
        throw inputError('COMMERCE_ADDRESS_INVALID', 'zone');
    }
    return normalized;
}

function aggregateCheckoutLines(lines) {
    const groups = new Map();
    for (const line of lines) {
        const current = groups.get(line.inventoryKey) || {
            inventoryKey: line.inventoryKey,
            productId: line.productId,
            collectionName: line.collectionName,
            variantId: line.variantId,
            quantity: 0,
            lineAllocations: []
        };
        current.quantity += line.quantity;
        current.lineAllocations.push({
            cartLineId: line.cartLineId,
            cartRevision: line.cartRevision,
            quantity: line.quantity
        });
        groups.set(line.inventoryKey, current);
    }
    return [...groups.values()].sort((left, right) => left.inventoryKey.localeCompare(right.inventoryKey));
}

module.exports = {
    aggregateCheckoutLines,
    canonicalize,
    validateCheckoutInput,
    validateShippingAddressShape
};
