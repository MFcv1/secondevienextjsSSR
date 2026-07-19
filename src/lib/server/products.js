import 'server-only';

import { cache } from 'react';
import { getMaterializedCatalogSnapshot, queryMaterializedCatalog } from './materializedCatalog';
import { extractProductId } from './productRoute';
import { getProductSeoDecision, isProductPublicVisible, isProductSeoIndexable } from '../seo/indexability';

export { extractProductId } from './productRoute';

const isPublicProductData = isProductPublicVisible;

export const isSeoIndexableProduct = (product) => (
  isPublicProductData(product) && isProductSeoIndexable(product)
);

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
  const { product } = await getPublicProductResult(slugOrId);
  return product;
});

export const getPublicProductResult = cache(async (slugOrId) => {
  const snapshot = await getMaterializedCatalogSnapshot();
  const productId = extractProductId(slugOrId, snapshot.full);
  const product = snapshot.full.find((candidate) => String(candidate.id) === productId) || null;
  return {
    snapshot,
    product: product && isPublicProductData(product) ? product : null,
  };
});

export const getPublicCatalog = cache(async (params = '') => {
  return (await getPublicCatalogResult(params)).products;
});

export const getPublicCatalogResult = cache(async (params = '') => {
  const result = await queryMaterializedCatalog(parseCatalogParams(params));
  return { ...result, products: result.products.filter(isPublicProductData) };
});

export const getPublishedProductStaticParams = cache(async (limitCount = 120) => {
  const limit = Math.max(1, Math.min(limitCount, 500));
  const products = await getPublicCatalog(`scope=cards&limit=${limit}`);
  return products
    .filter(isSeoIndexableProduct)
    .map((product) => ({ slugOrId: getProductSeoDecision(product).canonicalSlug }));
});
