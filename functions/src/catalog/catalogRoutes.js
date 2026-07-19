const CATEGORY_PARENTS = Object.freeze({
    armoires: ['meubles'],
    buffets: ['meubles'],
    commodes: ['meubles'],
    tables: ['meubles'],
    mobilier: ['meubles'],
    chaises: ['assises'],
    fauteuils: ['assises'],
    bancs: ['assises'],
    eclairage: ['eclairage'],
    miroirs: ['decorations'],
    deco: ['decorations'],
    decorations: ['decorations']
});

const CATEGORY_ALIASES = Object.freeze({ deco: 'decorations' });

function slugifyCatalogValue(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-') || 'produit';
}

function getCatalogProductPath(product) {
    if (!product?.id) return null;
    return `/produit/${slugifyCatalogValue(product.title || product.name)}-${encodeURIComponent(String(product.id))}`;
}

function getCatalogCategoryPath(categoryId) {
    const value = String(categoryId || '').trim();
    return value ? `/categorie/${encodeURIComponent(value)}` : null;
}

function getCatalogCategoryImpactIds(categoryId) {
    const value = String(categoryId || '').trim();
    if (!value) return [];
    const ids = new Set([value]);
    const alias = CATEGORY_ALIASES[value];
    if (alias) ids.add(alias);
    (CATEGORY_PARENTS[value] || []).forEach((parent) => ids.add(parent));
    return [...ids].sort();
}

module.exports = {
    CATEGORY_ALIASES,
    CATEGORY_PARENTS,
    getCatalogCategoryImpactIds,
    getCatalogCategoryPath,
    getCatalogProductPath,
    slugifyCatalogValue
};
