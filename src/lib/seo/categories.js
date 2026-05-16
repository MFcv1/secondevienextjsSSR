import KIT_CONFIG from '../../kit/config/constants';
import { getCategoryUrl, getProductUrl } from '../../utils/slug';
import { getProductCardImage } from '../../utils/imageUtils';

export const LEGACY_CATEGORY_IDS = {
  mobilier: ['armoires', 'buffets', 'commodes', 'tables'],
  assises: ['chaises', 'fauteuils', 'bancs']
};

export const categoryEntries = Array.from(
  new Map([
    ...(KIT_CONFIG.categoryGroups || []),
    ...(KIT_CONFIG.productCategories || [])
  ].map((category) => [category.id, category])).values()
);

export const cleanCategoryLabel = (label = '') => (
  String(label)
    .replace(/^LES\s+/i, '')
    .replace(/^LA\s+/i, '')
    .trim()
);

export const getCategoryMeta = (categoryId) => (
  categoryEntries.find((category) => category.id === categoryId) || null
);

export const getCategoryLabel = (categoryId) => {
  const meta = getCategoryMeta(categoryId);
  return cleanCategoryLabel(meta?.label || categoryId || 'Categorie');
};

export const getMatchingCategoryIds = (categoryId) => {
  const group = KIT_CONFIG.categoryGroups?.find((item) => item.id === categoryId);
  if (group) {
    const ids = new Set(group.subCategories || []);
    Object.entries(LEGACY_CATEGORY_IDS).forEach(([legacyId, children]) => {
      if (children.some((child) => ids.has(child))) ids.add(legacyId);
    });
    return [...ids];
  }

  const ids = new Set([categoryId].filter(Boolean));
  Object.entries(LEGACY_CATEGORY_IDS).forEach(([legacyId, children]) => {
    if (children.includes(categoryId)) ids.add(legacyId);
  });
  return [...ids];
};

export const buildCategoryBreadcrumbJsonLd = ({ categoryId, categoryLabel, siteUrl }) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  '@id': `${getCategoryUrl(categoryId, siteUrl)}#breadcrumb`,
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
      name: categoryLabel,
      item: getCategoryUrl(categoryId, siteUrl)
    }
  ]
});

export const buildCategoryCollectionJsonLd = ({ categoryId, categoryLabel, products = [], description, siteUrl }) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${getCategoryUrl(categoryId, siteUrl)}#collection`,
  name: `${categoryLabel} restaures`,
  description,
  url: getCategoryUrl(categoryId, siteUrl),
  breadcrumb: {
    '@id': `${getCategoryUrl(categoryId, siteUrl)}#breadcrumb`
  },
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: products.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: products.slice(0, 24).map((product, index) => {
      const cardImage = getProductCardImage(product);
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name || product.title,
          url: getProductUrl(product, siteUrl),
          image: cardImage.src || undefined
        }
      };
    })
  }
});
