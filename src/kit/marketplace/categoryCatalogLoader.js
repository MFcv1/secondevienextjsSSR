import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import KIT_CONFIG from '../config/constants';
import { getMillis } from '../../utils/time';
import { PUBLIC_CATEGORY_CACHE_PREFIX, PUBLIC_ITEMS_CACHE_TTL_MS } from '../shared/publicCatalogCache';

const PUBLIC_CATEGORY_PAGE_LIMIT = 120;
const LEGACY_CATEGORY_IDS = {
  mobilier: ['armoires', 'buffets', 'commodes', 'tables'],
  assises: ['chaises', 'fauteuils', 'bancs'],
};

const categoryCatalogFetches = new Map();
const completedCategoryCatalogs = new Set();

const readJsonStorage = (storage, key, fallback = null) => {
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJsonStorage = (storage, key, value) => {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Category cache is optional.
  }
};

const getMatchingCategoryIds = (categoryId) => {
  const group = KIT_CONFIG.categoryGroups?.find(g => g.id === categoryId);
  if (group) {
    const ids = new Set(group.subCategories);
    Object.entries(LEGACY_CATEGORY_IDS).forEach(([legacyId, children]) => {
      if (children.some(child => ids.has(child))) ids.add(legacyId);
    });
    return [...ids];
  }

  const ids = new Set([categoryId].filter(Boolean));
  Object.entries(LEGACY_CATEGORY_IDS).forEach(([legacyId, children]) => {
    if (children.includes(categoryId)) ids.add(legacyId);
  });
  return [...ids];
};

const shouldUsePublicCatalogEndpoint = () => {
  if (typeof window === 'undefined') return true;
  return !['127.0.0.1', 'localhost'].includes(window.location.hostname);
};

const getCategoryCacheKey = (categoryIds) => (
  `${PUBLIC_CATEGORY_CACHE_PREFIX}${categoryIds.slice().sort().join(',')}`
);

const readCachedCategory = (cacheKey) => {
  if (typeof window === 'undefined') return null;
  const cached = readJsonStorage(window.sessionStorage, cacheKey, null);
  if (!cached?.savedAt || !Array.isArray(cached.items)) return null;
  if ((Date.now() - cached.savedAt) > PUBLIC_ITEMS_CACHE_TTL_MS) return null;
  return cached.items;
};

const writeCachedCategory = (cacheKey, nextItems, catalogVersion = null) => {
  if (typeof window === 'undefined') return;
  writeJsonStorage(window.sessionStorage, cacheKey, {
    savedAt: Date.now(),
    catalogVersion,
    items: nextItems,
  });
};

const fetchCategoryViaEndpoint = async ({ categoryIds, projectId }) => {
  let cursor = '';
  const allItems = [];
  let catalogVersion = null;

  for (let page = 0; page < 10; page += 1) {
    const params = new URLSearchParams({
      limit: String(PUBLIC_CATEGORY_PAGE_LIMIT),
      scope: 'cards',
      categories: categoryIds.join(','),
    });
    if (cursor) params.set('cursor', cursor);

    const url = `https://us-central1-${projectId}.cloudfunctions.net/publicCatalog?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`publicCatalog category ${response.status}`);

    const payload = await response.json();
    if (!catalogVersion && payload?.catalogVersion) catalogVersion = payload.catalogVersion;
    const furniture = payload?.collections?.furniture || [];
    allItems.push(...furniture.map((item) => ({
      collectionName: 'furniture',
      ...item,
      __catalogScope: payload?.scope === 'cards' ? 'cards' : 'full',
    })));

    cursor = payload?.nextCursor || payload?.cursors?.furniture || '';
    if (!cursor) break;
  }

  return {
    catalogVersion,
    items: allItems,
  };
};

const fetchCategoryFromFirestore = async ({ categoryIds, db, appId }) => {
  const chunks = [];
  for (let index = 0; index < categoryIds.length; index += 10) {
    chunks.push(categoryIds.slice(index, index + 10));
  }

  const snapshots = await Promise.all(chunks.map((chunk) => {
    const categoryConstraint = chunk.length === 1
      ? where('category', '==', chunk[0])
      : where('category', 'in', chunk);
    return getDocs(query(
      collection(db, 'artifacts', appId, 'public', 'data', 'furniture'),
      where('status', '==', 'published'),
      categoryConstraint,
      orderBy('createdAt', 'desc')
    ));
  }));

  return {
    catalogVersion: null,
    items: snapshots
      .flatMap((snap) => snap.docs.map((itemDoc) => ({
        id: itemDoc.id,
        collectionName: 'furniture',
        ...itemDoc.data(),
        __catalogScope: 'full',
      })))
      .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt))
  };
};

export const loadCategoryCatalog = ({ categoryId, db, appId, projectId, isCatalogComplete = false }) => {
  if (!categoryId || isCatalogComplete) return Promise.resolve([]);

  const categoryIds = getMatchingCategoryIds(categoryId);
  if (!categoryIds.length) return Promise.resolve([]);

  const cacheKey = getCategoryCacheKey(categoryIds);
  if (completedCategoryCatalogs.has(cacheKey)) return Promise.resolve([]);

  const inflight = categoryCatalogFetches.get(cacheKey);
  if (inflight) return inflight;

  const request = Promise.resolve()
    .then(async () => {
      const cachedItems = readCachedCategory(cacheKey);
      if (cachedItems) return cachedItems;

      let categoryItems;
      let catalogVersion = null;
      if (shouldUsePublicCatalogEndpoint()) {
        try {
          const catalogResult = await fetchCategoryViaEndpoint({ categoryIds, projectId });
          categoryItems = catalogResult.items;
          catalogVersion = catalogResult.catalogVersion;
        } catch (catalogError) {
          console.warn('Catalogue categorie public indisponible, fallback Firestore:', catalogError);
        }
      }

      if (!categoryItems) {
        const firestoreResult = await fetchCategoryFromFirestore({ categoryIds, db, appId });
        categoryItems = firestoreResult.items;
        catalogVersion = firestoreResult.catalogVersion;
      }
      writeCachedCategory(cacheKey, categoryItems, catalogVersion);
      return categoryItems;
    })
    .then((categoryItems) => {
      completedCategoryCatalogs.add(cacheKey);
      return categoryItems;
    })
    .finally(() => {
      categoryCatalogFetches.delete(cacheKey);
    });

  categoryCatalogFetches.set(cacheKey, request);
  return request;
};
