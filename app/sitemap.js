import { getPublicCatalog, getPublicCatalogFallback } from '../src/lib/server/products';
import { publicEnv } from '../src/lib/server/env';
import { getProductUrl } from '../src/utils/slug';

export default async function sitemap() {
  let products = await getPublicCatalog('scope=cards&limit=120');
  if (!products.length) {
    products = await getPublicCatalogFallback({ limitCount: 120 });
  }
  const baseUrl = publicEnv.siteUrl.replace(/\/$/, '');

  return [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/a-propos`, lastModified: new Date() },
    ...products.map((product) => ({
      url: getProductUrl(product, baseUrl),
      lastModified: product.updatedAt || product.createdAt || new Date()
    }))
  ];
}
