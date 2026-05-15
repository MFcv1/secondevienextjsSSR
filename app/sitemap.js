import { getPublicCatalog, getPublicCatalogFallback } from '../src/lib/server/products';
import { publicEnv } from '../src/lib/server/env';
import KIT_CONFIG from '../src/kit/config/constants';
import { getCategoryUrl, getProductUrl } from '../src/utils/slug';

const categoryEntries = Array.from(
  new Map([
    ...(KIT_CONFIG.categoryGroups || []),
    ...(KIT_CONFIG.productCategories || [])
  ].map((category) => [category.id, category])).values()
);

const getProductUpdatedAt = (product) => product.updatedAt || product.createdAt || null;

const getCategoryLastModified = (products, categoryId) => {
  const group = KIT_CONFIG.categoryGroups?.find((category) => category.id === categoryId);
  const categoryIds = group?.subCategories || [categoryId];
  const legacyIds = categoryIds.some((id) => ['armoires', 'buffets', 'commodes', 'tables'].includes(id))
    ? ['mobilier']
    : [];
  const matchingIds = new Set([...categoryIds, ...legacyIds]);
  const timestamps = products
    .filter((product) => matchingIds.has(product.category))
    .map(getProductUpdatedAt)
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);

  if (!timestamps.length) return new Date();
  return new Date(Math.max(...timestamps));
};

export default async function sitemap() {
  let products = await getPublicCatalog('scope=cards&limit=120');
  if (!products.length) {
    products = await getPublicCatalogFallback({ limitCount: 120 });
  }
  const baseUrl = publicEnv.siteUrl.replace(/\/$/, '');

  return [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/a-propos`, lastModified: new Date() },
    ...categoryEntries.map((category) => ({
      url: getCategoryUrl(category.id, baseUrl),
      lastModified: getCategoryLastModified(products, category.id)
    })),
    ...products.map((product) => ({
      url: getProductUrl(product, baseUrl),
      lastModified: product.updatedAt || product.createdAt || new Date()
    }))
  ];
}
