export function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'produit';
}

export function getProductUrl(item, siteUrl = '') {
  if (!item?.id) return '/produit';
  const slug = slugify(item.title || item.name);
  const path = `/produit/${slug}-${encodeURIComponent(item.id)}`;
  return siteUrl ? `${siteUrl.replace(/\/$/, '')}${path}` : path;
}

export function getCategoryUrl(categoryId, siteUrl = '') {
  const cleanId = encodeURIComponent(String(categoryId || '').trim());
  const path = `/categorie/${cleanId}`;
  return siteUrl ? `${siteUrl.replace(/\/$/, '')}${path}` : path;
}

export function extractCategoryIdFromPath(pathname) {
  const match = String(pathname || '').match(/^\/categorie\/([^/?#]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}
