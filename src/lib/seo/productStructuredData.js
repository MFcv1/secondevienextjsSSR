import { getProductUrl } from '../../utils/slug';
import { getPrimaryProductImage } from '../../utils/imageUtils';

const compact = (value) => (
  Array.isArray(value)
    ? value.filter(Boolean)
    : Object.fromEntries(Object.entries(value).filter(([, nested]) => nested !== undefined && nested !== null && nested !== ''))
);

export const getProductPrice = (product) => (
  product?.currentPrice ?? product?.startingPrice ?? product?.price ?? null
);

export const buildProductJsonLd = (product, siteUrl) => {
  const price = getProductPrice(product);
  const availability = product?.sold || product?.stock === 0
    ? 'https://schema.org/OutOfStock'
    : 'https://schema.org/InStock';

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product?.name || product?.title,
    description: product?.description,
    image: getPrimaryProductImage(product),
    sku: product?.id,
    category: product?.category,
    material: product?.material,
    url: getProductUrl(product, siteUrl),
    offers: price || product?.priceOnRequest ? compact({
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: product?.priceOnRequest ? undefined : price,
      availability,
      url: getProductUrl(product, siteUrl)
    }) : undefined
  });
};

export const buildBreadcrumbJsonLd = (product, siteUrl) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Galerie',
      item: `${siteUrl.replace(/\/$/, '')}/`
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: product?.name || product?.title || 'Produit',
      item: getProductUrl(product, siteUrl)
    }
  ]
});
