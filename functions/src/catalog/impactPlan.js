const { sha256, stableStringify } = require('./publicProjection');
const {
    getCatalogCategoryImpactIds,
    getCatalogCategoryPath,
    getCatalogProductPath
} = require('./catalogRoutes');

const IMPACT_PLAN_SCHEMA_VERSION = 1;
const MAX_IMPACT_PRODUCTS = 120;
const MAX_IMPACT_CATEGORIES = 30;
const MAX_IMPACT_PATHS = 360;
const FULL_REASONS = new Set([
    'rollback',
    'taxonomy_migration',
    'impact_limit_exceeded',
    'source_release_unavailable',
    'legacy_release_without_plan',
    'impact_plan_invalid',
    'manual_rebuild'
]);

const uniqueSorted = (values) => [...new Set(values.filter(Boolean).map(String))].sort();
const valuesDiffer = (left, right) => sha256(left ?? null) !== sha256(right ?? null);

function changedProductFields(before = null, after = null) {
    const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
    return [...keys]
        .filter((key) => key !== 'id' && valuesDiffer(before?.[key], after?.[key]))
        .sort();
}

function productImpact(before, after) {
    const changedFields = changedProductFields(before, after);
    const changeType = !before ? 'created' : (!after ? 'deleted' : 'updated');
    const beforeCategories = getCatalogCategoryImpactIds(before?.category);
    const afterCategories = getCatalogCategoryImpactIds(after?.category);
    const orderOnly = changedFields.length > 0
        && changedFields.every((field) => ['nouveautesOrder', 'petitsPrixOrder'].includes(field));
    const sitemapChanged = changeType !== 'updated'
        || changedFields.some((field) => [
            'name', 'title', 'category', 'seoIndexable', 'seoTitle', 'seoDescription',
            'description', 'images', 'imageUrl', 'thumbnails', 'thumbnailUrl',
            'imageVariants', 'imageMetadata', 'status'
        ].includes(field));

    return {
        id: String(after?.id || before?.id || ''),
        changeType,
        changedFields,
        beforePath: getCatalogProductPath(before),
        afterPath: getCatalogProductPath(after),
        beforeCategories,
        afterCategories,
        purchasabilityChanged: ['sold', 'stock', 'currentPrice', 'startingPrice', 'price', 'priceOnRequest', 'status']
            .some((field) => changedFields.includes(field)),
        searchChanged: !orderOnly,
        sitemapChanged
    };
}

function planHashPayload(plan) {
    const { planHash: _planHash, generatedAt: _generatedAt, ...payload } = plan;
    return payload;
}

function finalizePlan(plan) {
    const canonical = {
        ...plan,
        products: [...(plan.products || [])].sort((left, right) => left.id.localeCompare(right.id)),
        paths: uniqueSorted(plan.paths || []),
        affectedCategoryIds: uniqueSorted(plan.affectedCategoryIds || []),
        changedProductIds: uniqueSorted(plan.changedProductIds || [])
    };
    return { ...canonical, planHash: sha256(stableStringify(planHashPayload(canonical))) };
}

function createFullImpactPlan({ revision, aggregateSha256, reason, generatedAt = new Date().toISOString() }) {
    if (!FULL_REASONS.has(reason)) throw new Error('CATALOG_IMPACT_FULL_REASON_INVALID');
    return finalizePlan({
        schemaVersion: IMPACT_PLAN_SCHEMA_VERSION,
        mode: 'full',
        fullReason: reason,
        revision: Number(revision),
        aggregateSha256: String(aggregateSha256 || ''),
        products: [],
        paths: ['/', '/galerie', '/api/catalog', '/api/search', '/sitemap.xml'],
        changedProductIds: [],
        affectedCategoryIds: [],
        affectsGallery: true,
        affectsSearch: true,
        affectsSitemap: true,
        generatedAt
    });
}

function buildImpactPlan({ beforeProducts = [], afterProducts = [], revision, aggregateSha256, generatedAt = new Date().toISOString(), fullReason = null }) {
    if (fullReason) return createFullImpactPlan({ revision, aggregateSha256, reason: fullReason, generatedAt });
    const beforeById = new Map(beforeProducts.map((product) => [String(product.id), product]));
    const afterById = new Map(afterProducts.map((product) => [String(product.id), product]));
    const ids = uniqueSorted([...beforeById.keys(), ...afterById.keys()]);
    const products = ids
        .filter((id) => valuesDiffer(beforeById.get(id), afterById.get(id)))
        .map((id) => productImpact(beforeById.get(id), afterById.get(id)));

    if (products.length > MAX_IMPACT_PRODUCTS) {
        return createFullImpactPlan({ revision, aggregateSha256, reason: 'impact_limit_exceeded', generatedAt });
    }

    const affectedCategoryIds = uniqueSorted(products.flatMap((product) => [
        ...product.beforeCategories,
        ...product.afterCategories
    ]));
    if (affectedCategoryIds.length > MAX_IMPACT_CATEGORIES) {
        return createFullImpactPlan({ revision, aggregateSha256, reason: 'impact_limit_exceeded', generatedAt });
    }
    const orderOnly = products.length > 0 && products.every((product) => (
        product.changedFields.length > 0
        && product.changedFields.every((field) => ['nouveautesOrder', 'petitsPrixOrder'].includes(field))
    ));
    const affectsGallery = products.length > 0;
    const affectsSearch = products.some((product) => product.searchChanged);
    const affectsSitemap = products.some((product) => product.sitemapChanged);
    const paths = uniqueSorted([
        ...(affectsGallery ? ['/', '/galerie', '/api/catalog'] : []),
        ...(affectsSearch ? ['/api/search'] : []),
        ...(affectsSitemap ? ['/sitemap.xml'] : []),
        ...products.flatMap((product) => [product.beforePath, product.afterPath]),
        ...affectedCategoryIds.map(getCatalogCategoryPath)
    ]);

    if (paths.length > MAX_IMPACT_PATHS) {
        return createFullImpactPlan({ revision, aggregateSha256, reason: 'impact_limit_exceeded', generatedAt });
    }

    return finalizePlan({
        schemaVersion: IMPACT_PLAN_SCHEMA_VERSION,
        mode: 'targeted',
        fullReason: null,
        revision: Number(revision),
        aggregateSha256: String(aggregateSha256 || ''),
        products,
        paths,
        changedProductIds: products.map((product) => product.id),
        affectedCategoryIds,
        affectsGallery,
        affectsSearch: orderOnly ? false : affectsSearch,
        affectsSitemap,
        generatedAt
    });
}

function validateImpactPlan(plan, identity = {}) {
    if (!plan || Number(plan.schemaVersion) !== IMPACT_PLAN_SCHEMA_VERSION) throw new Error('CATALOG_IMPACT_SCHEMA_INVALID');
    if (!['targeted', 'full'].includes(plan.mode)) throw new Error('CATALOG_IMPACT_MODE_INVALID');
    if (!Number.isInteger(Number(plan.revision)) || Number(plan.revision) < 1) throw new Error('CATALOG_IMPACT_REVISION_INVALID');
    if (!/^[a-f0-9]{64}$/i.test(String(plan.aggregateSha256 || ''))) throw new Error('CATALOG_IMPACT_AGGREGATE_INVALID');
    if (!/^[a-f0-9]{64}$/i.test(String(plan.planHash || ''))) throw new Error('CATALOG_IMPACT_HASH_INVALID');
    if (!Array.isArray(plan.products) || plan.products.length > MAX_IMPACT_PRODUCTS) throw new Error('CATALOG_IMPACT_PRODUCTS_INVALID');
    if (!Array.isArray(plan.affectedCategoryIds) || plan.affectedCategoryIds.length > MAX_IMPACT_CATEGORIES) throw new Error('CATALOG_IMPACT_CATEGORIES_INVALID');
    if (!Array.isArray(plan.paths) || plan.paths.length > MAX_IMPACT_PATHS) throw new Error('CATALOG_IMPACT_PATHS_INVALID');
    if (plan.mode === 'full' && !FULL_REASONS.has(plan.fullReason)) throw new Error('CATALOG_IMPACT_FULL_REASON_INVALID');
    if (identity.revision && Number(identity.revision) !== Number(plan.revision)) throw new Error('CATALOG_IMPACT_REVISION_MISMATCH');
    if (identity.aggregateSha256 && String(identity.aggregateSha256) !== String(plan.aggregateSha256)) throw new Error('CATALOG_IMPACT_AGGREGATE_MISMATCH');
    const expected = finalizePlan({ ...plan, planHash: undefined }).planHash;
    if (expected !== plan.planHash) throw new Error('CATALOG_IMPACT_HASH_MISMATCH');
    return plan;
}

module.exports = {
    FULL_REASONS,
    IMPACT_PLAN_SCHEMA_VERSION,
    MAX_IMPACT_CATEGORIES,
    MAX_IMPACT_PATHS,
    MAX_IMPACT_PRODUCTS,
    buildImpactPlan,
    changedProductFields,
    createFullImpactPlan,
    planHashPayload,
    productImpact,
    validateImpactPlan
};
