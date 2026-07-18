const { isPublicProduct, sha256, toPublicProduct } = require('./publicProjection');

const INVENTORY_FIELDS = Object.freeze([
    'status',
    'sold',
    'stock',
    'currentPrice',
    'startingPrice'
]);

function safePublicProjection(productId, value) {
    if (!value || !isPublicProduct(value)) return null;
    return toPublicProduct(productId, value);
}

function pickInventoryFields(value = {}) {
    return Object.fromEntries(
        INVENTORY_FIELDS
            .filter((field) => value[field] !== undefined)
            .map((field) => [field, value[field]])
    );
}

function changedFields(before = {}, after = {}) {
    const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
    return [...keys]
        .filter((key) => sha256(before?.[key] ?? null) !== sha256(after?.[key] ?? null))
        .sort();
}

function classifyCatalogMutation({ productId, before = null, after = null }) {
    const beforeProjection = safePublicProjection(productId, before);
    const afterProjection = safePublicProjection(productId, after);
    const beforeFingerprint = sha256(beforeProjection);
    const afterFingerprint = sha256(afterProjection);
    const beforeInventory = pickInventoryFields(before || {});
    const afterInventory = pickInventoryFields(after || {});
    const publicImpact = beforeFingerprint !== afterFingerprint;
    const inventoryImpact = sha256(beforeInventory) !== sha256(afterInventory);

    return {
        changeKind: !before ? 'create' : (!after ? 'delete' : 'update'),
        publicImpact,
        inventoryImpact,
        changedPublicFields: publicImpact
            ? changedFields(beforeProjection || {}, afterProjection || {}).filter((field) => field !== 'id')
            : [],
        beforeFingerprint,
        afterFingerprint,
        beforeCategories: beforeProjection?.category ? [beforeProjection.category] : [],
        afterCategories: afterProjection?.category ? [afterProjection.category] : []
    };
}

module.exports = {
    INVENTORY_FIELDS,
    classifyCatalogMutation,
    pickInventoryFields
};
