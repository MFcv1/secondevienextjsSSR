import KIT_CONFIG from '../config/constants';
import { getProductPriceAmount, getProductStockAmount, isPurchasable, shouldRequestQuote } from '../commerce/purchasability';
import { getProductCardImage } from '../../utils/imageUtils';
import { getCategoryUrl, getProductUrl } from '../../utils/slug';

export const SEARCH_MIN_QUERY_LENGTH = 2;

const QUICK_SEARCH_TERMS = [
  'Buffet ancien',
  'Commode bois',
  'Miroir dore',
  'Armoire patinee',
  'Table ancienne',
  'Petit prix',
  'Meuble disponible',
];

const CATEGORY_ALIASES = {
  buffets: ['buffet', 'enfilade', 'bahut'],
  armoires: ['armoire', 'penderie', 'rangement'],
  commodes: ['commode', 'chevet'],
  tables: ['table', 'bureau'],
  chaises: ['chaise', 'assise'],
  fauteuils: ['fauteuil', 'assise'],
  bancs: ['banc', 'banquette'],
  eclairage: ['lampe', 'luminaire', 'eclairage'],
  miroirs: ['miroir', 'glace'],
  deco: ['decoration', 'deco', 'objet'],
  meubles: ['meuble', 'mobilier', 'bois'],
  assises: ['chaise', 'fauteuil', 'banc', 'assise'],
  decorations: ['miroir', 'decoration', 'deco'],
};

export const normalizeSearchText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
  .replace(/-/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLocaleLowerCase('fr-FR');

const getCategoryEntries = () => [
  ...(KIT_CONFIG.categoryGroups || []).map((category) => ({ ...category, type: 'group' })),
  ...(KIT_CONFIG.productCategories || []).map((category) => ({ ...category, type: 'category' })),
];

const cleanCategoryLabel = (label) => String(label || '')
  .replace(/^LES\s+/i, '')
  .replace(/^LA\s+/i, '')
  .replace(/\s*&\s*/g, ' et ')
  .trim();

const getCategoryLabelMap = () => Object.fromEntries(
  getCategoryEntries().map((category) => [category.id, cleanCategoryLabel(category.label || category.id)])
);

const getProductCategoryLabel = (product) => {
  const labels = getCategoryLabelMap();
  const category = String(product?.category || '');
  const group = KIT_CONFIG.productCategories?.find((entry) => entry.id === category)?.group;
  return [labels[category], labels[group]].filter(Boolean).join(' ');
};

const getCreatedTime = (item) => {
  const value = item?.createdAt;
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Date.parse(value) || 0;
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  return 0;
};

const getAvailabilityLabel = (product) => {
  if (isPurchasable(product)) return 'Disponible';
  if (shouldRequestQuote(product)) return 'Sur demande';
  if (product?.sold) return 'Vendu';
  return 'Reserve';
};

const getPriceLabel = (product) => {
  const price = getProductPriceAmount(product);
  if (isPurchasable(product)) return `${price} EUR`;
  if (shouldRequestQuote(product)) return 'Sur demande';
  if (product?.sold) return 'Vendu';
  return 'Reserve';
};

export const getProductSearchText = (product) => [
  product?.name,
  product?.title,
  product?.description,
  product?.material,
  product?.style,
  product?.origin,
  product?.dimensions,
  getProductCategoryLabel(product),
].filter(Boolean).join(' ');

const getProductScore = (product, query) => {
  const normalizedQuery = normalizeSearchText(query);
  const title = normalizeSearchText(product?.name || product?.title);
  const material = normalizeSearchText(product?.material);
  const style = normalizeSearchText(product?.style);
  const category = normalizeSearchText(getProductCategoryLabel(product));
  const description = normalizeSearchText(product?.description);
  const haystack = normalizeSearchText(getProductSearchText(product));
  const terms = normalizedQuery.split(' ').filter(Boolean);
  const isSmallPriceQuery = normalizedQuery.includes('petit prix') || normalizedQuery.includes('prix bas');
  const isAvailabilityQuery = normalizedQuery.includes('disponible') || normalizedQuery.includes('stock');

  let score = 0;
  if (!normalizedQuery) {
    score += getCreatedTime(product) / 100000000000;
  } else {
    const matchedTerms = terms.filter((term) => haystack.includes(term));
    if (terms.length && matchedTerms.length !== terms.length && !isSmallPriceQuery && !isAvailabilityQuery) return 0;

    if (title === normalizedQuery) score += 180;
    if (title.startsWith(normalizedQuery)) score += 130;
    if (title.includes(normalizedQuery)) score += 90;
    if (category.includes(normalizedQuery)) score += 68;
    if (material.includes(normalizedQuery)) score += 54;
    if (style.includes(normalizedQuery)) score += 42;
    if (description.includes(normalizedQuery)) score += 18;

    terms.forEach((term) => {
      if (title.includes(term)) score += 18;
      if (category.includes(term)) score += 14;
      if (material.includes(term)) score += 12;
      if (style.includes(term)) score += 8;
    });
  }

  const price = getProductPriceAmount(product);
  if (isSmallPriceQuery) {
    score += price > 0 && price <= 350 ? 100 : 0;
  }
  if (isAvailabilityQuery) {
    score += isPurchasable(product) ? 80 : 0;
  }

  if (isPurchasable(product)) score += 10;
  if (getProductCardImage(product).src) score += 8;
  if (product?.material) score += 4;
  return score;
};

export const serializeSearchProduct = (product) => {
  const image = getProductCardImage(product);
  const title = product?.name || product?.title || 'Piece restauree';
  const price = getProductPriceAmount(product);

  return {
    id: product?.id,
    title,
    material: product?.material || '',
    style: product?.style || '',
    category: product?.category || '',
    categoryLabel: getProductCategoryLabel(product),
    price,
    priceLabel: getPriceLabel(product),
    stock: getProductStockAmount(product),
    sold: Boolean(product?.sold),
    availabilityLabel: getAvailabilityLabel(product),
    image: image.src,
    imageSrcSet: image.srcSet,
    url: getProductUrl(product),
    searchText: getProductSearchText(product),
  };
};

const countProductsForCategory = (products, category) => {
  const childIds = category.subCategories || [];
  return products.filter((product) => (
    product?.category === category.id
    || childIds.includes(product?.category)
    || KIT_CONFIG.productCategories?.find((entry) => entry.id === product?.category)?.group === category.id
  )).length;
};

export const buildCategorySearchSuggestions = (products = [], query = '', limit = 4) => {
  const normalizedQuery = normalizeSearchText(query);
  return getCategoryEntries()
    .map((category) => {
      const label = cleanCategoryLabel(category.label || category.id);
      const aliases = CATEGORY_ALIASES[category.id] || [];
      const categoryText = normalizeSearchText([label, category.id, ...aliases].join(' '));
      const count = countProductsForCategory(products, category);
      let score = count > 0 ? Math.min(count, 20) : 0;

      if (normalizedQuery) {
        if (categoryText.includes(normalizedQuery)) score += 80;
        normalizedQuery.split(' ').filter(Boolean).forEach((term) => {
          if (categoryText.includes(term)) score += 22;
        });
      } else if (category.type === 'group') {
        score += 40;
      }

      return {
        id: category.id,
        label,
        scope: category.type === 'group' ? 'Collection' : 'Categorie',
        count,
        href: getCategoryUrl(category.id),
        scopedHref: normalizedQuery ? `${getCategoryUrl(category.id)}?q=${encodeURIComponent(query)}` : getCategoryUrl(category.id),
        score,
      };
    })
    .filter((entry) => entry.count > 0 && entry.score > 0)
    .sort((a, b) => b.score - a.score || b.count - a.count)
    .slice(0, limit);
};

export const buildQuerySearchSuggestions = (query = '', limit = 5) => {
  const normalizedQuery = normalizeSearchText(query);
  const terms = QUICK_SEARCH_TERMS
    .filter((term) => {
      const normalizedTerm = normalizeSearchText(term);
      return !normalizedQuery || normalizedTerm.includes(normalizedQuery) || normalizedQuery.includes(normalizedTerm);
    })
    .slice(0, limit);

  if (normalizedQuery.length >= SEARCH_MIN_QUERY_LENGTH && !terms.some((term) => normalizeSearchText(term) === normalizedQuery)) {
    terms.unshift(query.trim());
  }

  return terms.slice(0, limit).map((label) => ({
    label,
    href: `/recherche?q=${encodeURIComponent(label)}`,
  }));
};

export const searchProducts = (products = [], query = '', limit = 24) => (
  products
    .map((product) => ({ product, score: getProductScore(product, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || getCreatedTime(b.product) - getCreatedTime(a.product))
    .slice(0, limit)
    .map(({ product }) => serializeSearchProduct(product))
);

export const buildSearchResponse = (products = [], query = '', options = {}) => {
  const limit = Math.max(1, Math.min(Number(options.limit) || 24, 60));
  const productLimit = options.mode === 'suggest' ? Math.min(limit, 5) : limit;
  const productResults = searchProducts(products, query, productLimit);
  const categorySuggestions = buildCategorySearchSuggestions(products, query, options.mode === 'suggest' ? 4 : 8);
  const querySuggestions = buildQuerySearchSuggestions(query, options.mode === 'suggest' ? 5 : 8);

  return {
    query: String(query || '').trim(),
    total: searchProducts(products, query, 60).length,
    products: productResults,
    productSuggestions: productResults.slice(0, 4),
    categorySuggestions,
    querySuggestions,
    emptyActions: [
      { label: 'Voir toutes les pieces', href: '/#gallery-pieces' },
      { label: 'Parcourir les petits prix', href: '/#gallery-small-prices' },
      { label: 'Demander un devis', href: '/devis' },
    ],
  };
};
