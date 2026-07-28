'use strict';

const { hashPayload } = require('./idempotency');
const { createInventoryKey } = require('./inventoryKey');

function fixtureError(code, detail) {
    const error = new Error(detail ? `${code}:${detail}` : code);
    error.code = code;
    if (detail) error.detail = detail;
    return error;
}

function uniqueStrings(values, pattern, field, maximum = 20) {
    if (!Array.isArray(values) || values.length === 0 || values.length > maximum) {
        throw fixtureError('COMMERCE_FIXTURE_SCOPE_INVALID', field);
    }
    const result = values.map((value) => {
        if (typeof value !== 'string' || !pattern.test(value)) {
            throw fixtureError('COMMERCE_FIXTURE_SCOPE_INVALID', field);
        }
        return value;
    });
    if (new Set(result).size !== result.length) {
        throw fixtureError('COMMERCE_FIXTURE_SCOPE_INVALID', `${field}_duplicate`);
    }
    return result.sort();
}

function validateFixtureScope(scope, { now = new Date() } = {}) {
    if (!scope || typeof scope !== 'object' || Array.isArray(scope)) {
        throw fixtureError('COMMERCE_FIXTURE_SCOPE_INVALID');
    }
    if (
        scope.schemaVersion !== 2 ||
        typeof scope.fixtureScopeVersion !== 'string' ||
        !/^fixture_[A-Za-z0-9_-]{8,72}$/.test(scope.fixtureScopeVersion) ||
        scope.environment !== 'sandbox' ||
        scope.projectId !== 'secondevienextjsssr' ||
        typeof scope.policyVersion !== 'string' ||
        !/^fixture_[A-Za-z0-9_-]{8,72}$/.test(scope.policyVersion) ||
        scope.active !== true
    ) {
        throw fixtureError('COMMERCE_FIXTURE_SCOPE_INVALID');
    }
    const uids = uniqueStrings(scope.uids, /^[A-Za-z0-9_-]{8,128}$/, 'uids', 10);
    const inventoryKeys = uniqueStrings(scope.inventoryKeys, /^[a-f0-9]{64}$/, 'inventoryKeys', 20);
    if (!Array.isArray(scope.fixtureProducts) || scope.fixtureProducts.length !== inventoryKeys.length) {
        throw fixtureError('COMMERCE_FIXTURE_SCOPE_INVALID', 'fixtureProducts');
    }
    const fixtureProducts = scope.fixtureProducts.map((product) => {
        if (
            !product ||
            product.collectionName !== 'furniture' ||
            typeof product.productId !== 'string' ||
            !/^fixture_[A-Za-z0-9_-]{8,120}$/.test(product.productId) ||
            (product.variantId !== null && (
                typeof product.variantId !== 'string' ||
                !/^fixture_[A-Za-z0-9_-]{4,120}$/.test(product.variantId)
            ))
        ) {
            throw fixtureError('COMMERCE_FIXTURE_SCOPE_INVALID', 'fixtureProducts');
        }
        const inventoryKey = createInventoryKey(product);
        if (!inventoryKeys.includes(inventoryKey)) {
            throw fixtureError('COMMERCE_FIXTURE_SCOPE_INVALID', 'inventoryKeyBinding');
        }
        return {
            collectionName: product.collectionName,
            productId: product.productId,
            variantId: product.variantId,
            inventoryKey
        };
    }).sort((left, right) => left.inventoryKey.localeCompare(right.inventoryKey));
    const expiresAtValue = typeof scope.expiresAt?.toDate === 'function'
        ? scope.expiresAt.toDate()
        : scope.expiresAt;
    const expiresAt = new Date(expiresAtValue);
    if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= now) {
        throw fixtureError('COMMERCE_FIXTURE_SCOPE_EXPIRED');
    }
    const normalized = {
        schemaVersion: 2,
        fixtureScopeVersion: scope.fixtureScopeVersion,
        environment: scope.environment,
        projectId: scope.projectId,
        policyVersion: scope.policyVersion,
        active: true,
        uids,
        inventoryKeys,
        fixtureProducts,
        expiresAt: expiresAt.toISOString()
    };
    return Object.freeze({
        ...normalized,
        scopeHash: hashPayload(normalized)
    });
}

function authorizeFixtureRequest(scope, {
    uid,
    inventoryKeys,
    fixtureScopeVersion,
    runId,
    now = new Date()
}) {
    const normalized = validateFixtureScope(scope, { now });
    if (fixtureScopeVersion !== normalized.fixtureScopeVersion) {
        throw fixtureError('COMMERCE_FIXTURE_SCOPE_MISMATCH');
    }
    if (!normalized.uids.includes(uid)) throw fixtureError('COMMERCE_FIXTURE_UID_DENIED');
    if (
        !Array.isArray(inventoryKeys) ||
        inventoryKeys.some((inventoryKey) => !normalized.inventoryKeys.includes(inventoryKey))
    ) {
        throw fixtureError('COMMERCE_FIXTURE_INVENTORY_DENIED');
    }
    if (typeof runId !== 'string' || !/^run_[A-Za-z0-9_-]{8,80}$/.test(runId)) {
        throw fixtureError('COMMERCE_FIXTURE_RUN_INVALID');
    }
    return Object.freeze({
        runId,
        fixtureScopeVersion: normalized.fixtureScopeVersion,
        policyVersion: normalized.policyVersion,
        expiresAt: normalized.expiresAt
    });
}

module.exports = {
    authorizeFixtureRequest,
    validateFixtureScope
};
