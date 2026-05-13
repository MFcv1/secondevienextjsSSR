export const PUBLIC_ITEMS_CACHE_KEY = 'secondevie:published-items:initial:v3';
export const PUBLIC_ITEMS_FULL_CACHE_KEY = 'secondevie:published-items:full:v3';
export const PUBLIC_CATEGORY_CACHE_PREFIX = 'secondevie:published-items:category:v1:';
export const PUBLIC_ITEMS_CACHE_TTL_MS = 5 * 60 * 1000;

const PUBLIC_CATALOG_CACHE_PREFIXES = [
  PUBLIC_ITEMS_CACHE_KEY,
  PUBLIC_ITEMS_FULL_CACHE_KEY,
  PUBLIC_CATEGORY_CACHE_PREFIX,
];

export const clearPublicCatalogSessionCache = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) return;

  try {
    Object.keys(window.sessionStorage).forEach((key) => {
      if (PUBLIC_CATALOG_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        window.sessionStorage.removeItem(key);
      }
    });
  } catch {
    // Public catalog cache is optional.
  }
};
