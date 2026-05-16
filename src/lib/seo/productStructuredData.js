import { getCategoryUrl, getProductUrl } from '../../utils/slug';
import { getProductImageItems } from '../../utils/imageUtils';
import { getCategoryLabel } from './categories';

const compact = (value) => (
  Array.isArray(value)
    ? value.filter(Boolean)
    : Object.fromEntries(Object.entries(value).filter(([, nested]) => nested !== undefined && nested !== null && nested !== ''))
);

export const getProductPrice = (product) => (
  product?.currentPrice ?? product?.startingPrice ?? product?.price ?? null
);

const absoluteUrl = (url, siteUrl) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${siteUrl.replace(/\/$/, '')}/${String(url).replace(/^\//, '')}`;
};

const getProductImages = (product, siteUrl) => {
  const images = getProductImageItems(product)
    .flatMap((image) => [image.full, image.large, image.medium, image.src])
    .map((url) => absoluteUrl(url, siteUrl))
    .filter(Boolean);
  return [...new Set(images)];
};

const getNumericPrice = (product) => {
  const value = Number(getProductPrice(product));
  return Number.isFinite(value) ? value : null;
};

const getAvailability = (product) => {
  const stock = product?.stock === undefined || product?.stock === null || product?.stock === ''
    ? null
    : Number(product.stock);
  return product?.sold || stock === 0
    ? 'https://schema.org/OutOfStock'
    : 'https://schema.org/InStock';
};

const getAdditionalProperties = (product) => {
  const properties = compact([
    product?.style ? { '@type': 'PropertyValue', name: 'Style', value: product.style } : null,
    product?.origin ? { '@type': 'PropertyValue', name: 'Origine', value: product.origin } : null,
    product?.dimensions ? { '@type': 'PropertyValue', name: 'Dimensions', value: product.dimensions } : null
  ]);
  return properties.length ? properties : undefined;
};

export const buildProductJsonLd = (product, siteUrl) => {
  const price = getNumericPrice(product);
  const url = getProductUrl(product, siteUrl);
  const images = getProductImages(product, siteUrl);
  const hasOffer = price !== null && !product?.priceOnRequest;

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product?.name || product?.title,
    description: product?.description,
    image: images.length ? images : undefined,
    sku: product?.id,
    category: product?.category,
    material: product?.material,
    itemCondition: 'https://schema.org/UsedCondition',
    additionalProperty: getAdditionalProperties(product),
    brand: {
      '@type': 'Brand',
      name: 'Seconde Vie'
    },
    url,
    offers: hasOffer ? compact({
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: price.toFixed(2),
      availability: getAvailability(product),
      itemCondition: 'https://schema.org/UsedCondition',
      url,
      seller: {
        '@type': 'Organization',
        name: 'Seconde Vie'
      }
    }) : undefined
  });
};

export const buildBreadcrumbJsonLd = (product, siteUrl) => {
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Galerie',
      item: `${siteUrl.replace(/\/$/, '')}/`
    }
  ];

  if (product?.category) {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: getCategoryLabel(product.category),
      item: getCategoryUrl(product.category, siteUrl)
    });
  }

  items.push(
    {
      '@type': 'ListItem',
      position: items.length + 1,
      name: product?.name || product?.title || 'Produit',
      item: getProductUrl(product, siteUrl)
    }
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${getProductUrl(product, siteUrl)}#breadcrumb`,
    itemListElement: items
  };
};
