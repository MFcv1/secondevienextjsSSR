import { getPublicCatalog } from '../src/lib/server/products';
import { publicEnv } from '../src/lib/server/env';
import { getProductUrl } from '../src/utils/slug';

export default async function sitemap() {
  const products = await getPublicCatalog('scope=cards&limit=120');
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
