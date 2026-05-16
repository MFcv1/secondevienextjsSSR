import { getPublicCatalog, getPublicCatalogFallback } from '../src/lib/server/products';
import { publicCatalogUrl, publicEnv } from '../src/lib/server/env';
import { categoryEntries, getMatchingCategoryIds } from '../src/lib/seo/categories';
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
  const params = new URLSearchParams({
    scope: 'cards',
    limit: String(SITEMAP_PAGE_LIMIT)
  });
  if (cursor) params.set('cursor', cursor);

  const url = publicCatalogUrl(params.toString());
  if (!url) return { products: [], nextCursor: null };

  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    next: {
      revalidate: 300,
      tags: ['catalog', 'products', 'sitemap']
    }
  });
  if (!response.ok) return { products: [], nextCursor: null };

  const payload = await response.json();
  return {
    products: (payload?.collections?.furniture || []).filter((product) => product.status === 'published'),
    nextCursor: payload?.nextCursor || null
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

  if (products.length) return products.slice(0, SITEMAP_MAX_PRODUCTS);

  let fallbackProducts = await getPublicCatalog(`scope=cards&limit=${SITEMAP_PAGE_LIMIT}`);
  if (!fallbackProducts.length) {
    fallbackProducts = await getPublicCatalogFallback({ limitCount: 500 });
  }
  return fallbackProducts.slice(0, SITEMAP_MAX_PRODUCTS);
};

export default async function sitemap() {
  const products = await getSitemapProducts();
  const baseUrl = publicEnv.siteUrl.replace(/\/$/, '');
  const catalogLastModified = maxDate(products.map(getProductUpdatedDate));

  return [
    withLastModified({ url: `${baseUrl}/` }, catalogLastModified),
    { url: `${baseUrl}/a-propos` },
    { url: `${baseUrl}/devis` },
    ...categoryEntries.map((category) => ({
      url: getCategoryUrl(category.id, baseUrl),
      ...withLastModified({}, getCategoryLastModified(products, category.id))
    })),
    ...products.map((product) => withLastModified({
      url: getProductUrl(product, baseUrl)
    }, getProductUpdatedDate(product)))
  ];
}
