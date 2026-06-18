import KIT_CONFIG from '../config/constants';
import { getProductPriceAmount, isPurchasable } from '../commerce/purchasability';

export const CATEGORY_SORT_OPTIONS = [
  { id: 'newest', label: 'Plus r\u00e9cent' },
  { id: 'price-asc', label: 'Prix croissant' },
  { id: 'price-desc', label: 'Prix d\u00e9croissant' },
  { id: 'name-asc', label: 'A \u2192 Z' },
];

const LEGACY_CATEGORY_IDS = {
  mobilier: ['armoires', 'buffets', 'commodes', 'tables'],
  assises: ['chaises', 'fauteuils', 'bancs'],
};

export const getCategoryProductCreatedTime = (item) => {
  const value = item?.createdAt;
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Date.parse(value) || 0;
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  return 0;
};

export const getCategoryProductPrice = (item) => (
  getProductPriceAmount(item)
);

const asArray = (value) => {
  if (Array.isArray(value)) return value.flatMap(asArray).filter(Boolean);
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const getSearchParamValue = (searchParams, key) => {
  if (!searchParams) return undefined;
  if (typeof searchParams.get === 'function') return searchParams.get(key) || undefined;
  const value = searchParams[key];
  if (Array.isArray(value)) return value[0];
  return value;
};

const getSearchParamArray = (searchParams, key) => {
  if (!searchParams) return [];
  if (typeof searchParams.getAll === 'function') return asArray(searchParams.getAll(key));
  return asArray(searchParams[key]);
};

const clampView = (value, allowed, fallback) => (
  allowed.includes(value) ? value : fallback
);

export const getCategoryTitle = (categoryLabel, categoryId) => (
  String(categoryLabel || categoryId || '')
    .replace(/^LES\s+/i, '')
    .replace(/^LA\s+/i, '')
);

export const getCategorySubCategories = (categoryId) => {
  const groupMeta = KIT_CONFIG.categoryGroups?.find((group) => group.id === categoryId);
  if (!groupMeta) return [];

  return (groupMeta.subCategories || []).map((subId) => {
    const meta = KIT_CONFIG.productCategories.find((category) => category.id === subId);
    return { id: subId, label: meta?.label || subId };
  });
};

export const getCategoryRelatedCategories = (copy) => (
  (copy?.related || [])
    .map((id) => {
      const meta = KIT_CONFIG.categoryGroups?.find((category) => category.id === id)
        || KIT_CONFIG.productCategories?.find((category) => category.id === id);
      return meta ? { id, label: meta.label } : null;
    })
    .filter(Boolean)
);

export const getPublishedCategoryItems = (products = []) => (
  (products || []).filter((item) => !item.status || item.status === 'published')
);

export const getCategoryFilterOptions = (products = [], categoryId) => {
  const categoryItems = getPublishedCategoryItems(products);
  const subCategories = getCategorySubCategories(categoryId);

  return {
    subCategories,
    materials: [...new Set(categoryItems.map((item) => item.material).filter(Boolean))].sort(),
    styles: [...new Set(categoryItems.map((item) => item.style).filter(Boolean))].sort(),
    maxPrice: Math.max(100, ...categoryItems.map(getCategoryProductPrice)),
    counts: {
      collections: Object.fromEntries(
        subCategories.map((sub) => [
          sub.id,
          categoryItems.filter((item) => item.category === sub.id).length,
        ])
      ),
      materials: Object.fromEntries(
        [...new Set(categoryItems.map((item) => item.material).filter(Boolean))]
          .map((material) => [
            material,
            categoryItems.filter((item) => item.material === material).length,
          ])
      ),
      styles: Object.fromEntries(
        [...new Set(categoryItems.map((item) => item.style).filter(Boolean))]
          .map((style) => [
            style,
            categoryItems.filter((item) => item.style === style).length,
          ])
      ),
    },
  };
};

export const getCategoryQueryState = (searchParams = {}, filterOptions = {}) => {
  const maxPrice = filterOptions.maxPrice || 100;
  const roundedMax = Math.ceil(maxPrice / 100) * 100;
  const priceMax = Number(getSearchParamValue(searchParams, 'maxPrice')) || roundedMax;
  const sortBy = getSearchParamValue(searchParams, 'sort') || 'newest';

  return {
    sortBy: CATEGORY_SORT_OPTIONS.some((option) => option.id === sortBy) ? sortBy : 'newest',
    viewMode: clampView(getSearchParamValue(searchParams, 'view'), ['grid', 'list'], 'grid'),
    mobileViewMode: clampView(getSearchParamValue(searchParams, 'mobileView'), ['grid', 'list'], 'list'),
    selectedMaterials: getSearchParamArray(searchParams, 'material'),
    selectedStyles: getSearchParamArray(searchParams, 'style'),
    selectedCollections: getSearchParamArray(searchParams, 'collection'),
    availabilityFilter: clampView(getSearchParamValue(searchParams, 'availability'), ['all', 'in-stock', 'sold'], 'all'),
    searchQuery: String(getSearchParamValue(searchParams, 'q') || '').trim(),
    priceRange: [0, Math.min(Math.max(0, priceMax), roundedMax)],
    roundedMaxPrice: roundedMax,
  };
};

export const hasActiveCategoryFilters = (state, maxPrice) => (
  state.selectedMaterials.length > 0
    || state.selectedStyles.length > 0
    || state.selectedCollections.length > 0
    || state.availabilityFilter !== 'all'
    || state.priceRange[0] > 0
    || (state.priceRange[1] || maxPrice) < maxPrice
    || state.searchQuery.length > 0
);

export const filterAndSortCategoryItems = (products = [], state, maxPrice) => {
  let result = [...getPublishedCategoryItems(products)];
  const max = state.priceRange[1] || maxPrice;

  result = result.filter((item) => {
    const price = getCategoryProductPrice(item);
    return price >= state.priceRange[0] && price <= max;
  });

  if (state.selectedMaterials.length) {
    result = result.filter((item) => state.selectedMaterials.includes(item.material));
  }

  if (state.selectedStyles.length) {
    result = result.filter((item) => state.selectedStyles.includes(item.style));
  }

  if (state.selectedCollections.length) {
    const expandedIds = new Set(state.selectedCollections);
    Object.entries(LEGACY_CATEGORY_IDS).forEach(([legacyId, children]) => {
      if (children.some((child) => expandedIds.has(child))) expandedIds.add(legacyId);
    });
    result = result.filter((item) => expandedIds.has(item.category));
  }

  if (state.availabilityFilter === 'in-stock') {
    result = result.filter(isPurchasable);
  } else if (state.availabilityFilter === 'sold') {
    result = result.filter((item) => item.sold);
  }

  if (state.searchQuery) {
    const query = state.searchQuery.toLocaleLowerCase('fr-FR');
    result = result.filter((item) => (
      item.title?.toLocaleLowerCase('fr-FR').includes(query)
      || item.name?.toLocaleLowerCase('fr-FR').includes(query)
      || item.description?.toLocaleLowerCase('fr-FR').includes(query)
      || item.material?.toLocaleLowerCase('fr-FR').includes(query)
    ));
  }

  switch (state.sortBy) {
    case 'price-asc':
      result.sort((a, b) => getCategoryProductPrice(a) - getCategoryProductPrice(b));
      break;
    case 'price-desc':
      result.sort((a, b) => getCategoryProductPrice(b) - getCategoryProductPrice(a));
      break;
    case 'name-asc':
      result.sort((a, b) => String(a.name || a.title || '').localeCompare(String(b.name || b.title || ''), 'fr'));
      break;
    case 'newest':
    default:
      result.sort((a, b) => getCategoryProductCreatedTime(b) - getCategoryProductCreatedTime(a));
      break;
  }

  return result;
};

export const buildCategoryHref = (categoryId, currentState, patch = {}) => {
  const params = new URLSearchParams();
  const next = { ...currentState, ...patch };

  if (next.sortBy && next.sortBy !== 'newest') params.set('sort', next.sortBy);
  if (next.viewMode && next.viewMode !== 'grid') params.set('view', next.viewMode);
  if (next.mobileViewMode && next.mobileViewMode !== 'list') params.set('mobileView', next.mobileViewMode);
  if (next.availabilityFilter && next.availabilityFilter !== 'all') params.set('availability', next.availabilityFilter);
  if (next.priceRange?.[1] && next.priceRange[1] < next.roundedMaxPrice) params.set('maxPrice', String(next.priceRange[1]));
  if (next.searchQuery) params.set('q', next.searchQuery);
  (next.selectedMaterials || []).forEach((value) => params.append('material', value));
  (next.selectedStyles || []).forEach((value) => params.append('style', value));
  (next.selectedCollections || []).forEach((value) => params.append('collection', value));

  const query = params.toString();
  return `/categorie/${encodeURIComponent(categoryId)}${query ? `?${query}` : ''}`;
};
