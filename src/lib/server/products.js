import 'server-only';

import { cache } from 'react';
import { getMaterializedProduct, queryMaterializedCatalog } from './materializedCatalog';
import { getProductSeoDecision, isProductPublicVisible, isProductSeoIndexable } from '../seo/indexability';

const isPublicProductData = isProductPublicVisible;

export const isSeoIndexableProduct = (product) => (
  isPublicProductData(product) && isProductSeoIndexable(product)
);

export const extractProductId = (slugOrId = '') => {
  const decoded = decodeURIComponent(String(slugOrId));
  const separatorIndex = decoded.lastIndexOf('-');
  return separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : decoded;
};

const parseCatalogParams = (params = '') => {
  const searchParams = new URLSearchParams(params);
  const categories = [...searchParams.getAll('category'), ...searchParams.getAll('categories')]
    .flatMap((value) => String(value || '').split(','))
    .map((value) => value.trim())
    .filter(Boolean);
  const requestedLimit = searchParams.has('limit') ? Number(searchParams.get('limit')) : null;
  return {
    scope: searchParams.get('scope') === 'cards' ? 'cards' : 'full',
    limit: Number.isInteger(requestedLimit) && requestedLimit > 0 ? requestedLimit : null,
    categories,
    cursor: searchParams.get('cursor') || '',
  };
};

export const getPublicProduct = cache(async (slugOrId) => {
  const product = await getMaterializedProduct(extractProductId(slugOrId));
  return product && isPublicProductData(product) ? product : null;
});

export const getPublicCatalog = cache(async (params = '') => {
  const result = await queryMaterializedCatalog(parseCatalogParams(params));
  return result.products.filter(isPublicProductData);
});

export const getPublishedProductStaticParams = cache(async (limitCount = 120) => {
  const limit = Math.max(1, Math.min(limitCount, 500));
  const products = await getPublicCatalog(`scope=cards&limit=${limit}`);
  return products
    .filter(isSeoIndexableProduct)
    .map((product) => ({ slugOrId: getProductSeoDecision(product).canonicalSlug }));
});
