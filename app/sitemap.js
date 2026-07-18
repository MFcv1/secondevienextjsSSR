import { isSeoIndexableProduct } from '../src/lib/server/products';
import { publicEnv } from '../src/lib/server/env';
import { queryMaterializedCatalog } from '../src/lib/server/materializedCatalog';
import { categoryEntries, getMatchingCategoryIds, isSeoIndexableCategory } from '../src/lib/seo/categories';
import { getCategoryUrl, getProductUrl } from '../src/utils/slug';

const SITEMAP_PAGE_LIMIT = 120;
const SITEMAP_MAX_PRODUCTS = 1000;

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (Number.isFinite(value?.seconds)) {
    return new Date((value.seconds * 1000) + Math.round((value.nanoseconds || 0) / 1000000));
  }
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

const getProductUpdatedDate = (product) => (
  toDate(product.updatedAt) || toDate(product.createdAt)
);

const withLastModified = (entry, date) => (
  date ? { ...entry, lastModified: date } : entry
);

const maxDate = (dates) => {
  const timestamps = dates
    .filter(Boolean)
    .map((date) => date.getTime())
    .filter(Number.isFinite);
  return timestamps.length ? new Date(Math.max(...timestamps)) : null;
};

const getCategoryLastModified = (products, categoryId) => {
  const matchingIds = new Set(getMatchingCategoryIds(categoryId));
  return maxDate(products
    .filter((product) => matchingIds.has(product.category))
    .map(getProductUpdatedDate));
};

const getPublicCatalogPage = async (cursor = '') => {
  const result = await queryMaterializedCatalog({
    scope: 'cards',
    limit: SITEMAP_PAGE_LIMIT,
    cursor
  });
  return {
    products: result.products.filter(isSeoIndexableProduct),
    nextCursor: result.nextCursor
  };
};

const getSitemapProducts = async () => {
  const products = [];
  let cursor = '';

  for (let page = 0; page < Math.ceil(SITEMAP_MAX_PRODUCTS / SITEMAP_PAGE_LIMIT); page += 1) {
    const result = await getPublicCatalogPage(cursor);
    products.push(...result.products);
    if (!result.nextCursor || products.length >= SITEMAP_MAX_PRODUCTS) break;
    cursor = result.nextCursor;
  }

  return products.slice(0, SITEMAP_MAX_PRODUCTS);
};

export default async function sitemap() {
  const products = await getSitemapProducts();
  const baseUrl = publicEnv.siteUrl.replace(/\/$/, '');
  const catalogLastModified = maxDate(products.map(getProductUpdatedDate));

  return [
    withLastModified({ url: `${baseUrl}/` }, catalogLastModified),
    { url: `${baseUrl}/a-propos` },
    { url: `${baseUrl}/devis` },
    ...categoryEntries.filter((category) => isSeoIndexableCategory(category.id, products)).map((category) => ({
      url: getCategoryUrl(category.id, baseUrl),
      ...withLastModified({}, getCategoryLastModified(products, category.id))
    })),
    ...products.map((product) => withLastModified({
      url: getProductUrl(product, baseUrl)
    }, getProductUpdatedDate(product)))
  ];
}
