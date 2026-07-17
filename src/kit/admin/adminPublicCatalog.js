import { firebaseProjectId } from '../config/firebaseEnv';
import { PUBLIC_ITEMS_FULL_CACHE_KEY } from '../shared/publicCatalogCache';

export const ADMIN_PUBLIC_CATALOG_INVALIDATED_EVENT = 'secondevie:admin-public-catalog-invalidated';

const PUBLIC_CATALOG_PROJECT_ID = firebaseProjectId || 'secondevienextjsssr';
const PUBLIC_CATALOG_URL = `https://us-central1-${PUBLIC_CATALOG_PROJECT_ID}.cloudfunctions.net/publicCatalog?scope=cards&limit=120`;
const CACHE_SCHEMA_VERSION = 1;

let memoryItems = null;
let inflightRequest = null;
let cacheGeneration = 0;

const readSessionItems = () => {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;

  try {
    const cached = JSON.parse(window.sessionStorage.getItem(PUBLIC_ITEMS_FULL_CACHE_KEY) || 'null');
    if (cached?.schemaVersion !== CACHE_SCHEMA_VERSION || !Array.isArray(cached.items)) return null;
    return cached.items;
  } catch {
    return null;
  }
};

const writeSessionItems = (items, catalogVersion = '') => {
  if (typeof window === 'undefined' || !window.sessionStorage) return;

  try {
    window.sessionStorage.setItem(PUBLIC_ITEMS_FULL_CACHE_KEY, JSON.stringify({
      schemaVersion: CACHE_SCHEMA_VERSION,
      catalogVersion,
      items,
    }));
  } catch {
    // Le cache est une optimisation: le catalogue reste utilisable sans sessionStorage.
  }
};

const fetchPublicCatalog = async () => {
  const response = await fetch(PUBLIC_CATALOG_URL, {
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Catalogue public indisponible (${response.status})`);
  }

  const payload = await response.json();
  const items = payload?.collections?.furniture;
  if (!Array.isArray(items)) {
    throw new Error('Format du catalogue public invalide');
  }

  return {
    items,
    catalogVersion: String(payload?.catalogVersion || ''),
  };
};

export const loadAdminPublicCatalog = async () => {
  if (memoryItems) return memoryItems;

  const sessionItems = readSessionItems();
  if (sessionItems) {
    memoryItems = sessionItems;
    return memoryItems;
  }

  if (inflightRequest) return inflightRequest;

  const requestGeneration = cacheGeneration;
  const request = fetchPublicCatalog()
    .then(async ({ items, catalogVersion }) => {
      if (requestGeneration !== cacheGeneration) {
        return loadAdminPublicCatalog();
      }
      memoryItems = items;
      writeSessionItems(items, catalogVersion);
      return items;
    })
    .finally(() => {
      if (inflightRequest === request) inflightRequest = null;
    });

  inflightRequest = request;
  return request;
};

export const clearAdminPublicCatalogCache = ({ notify = true } = {}) => {
  cacheGeneration += 1;
  memoryItems = null;
  inflightRequest = null;

  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage?.removeItem(PUBLIC_ITEMS_FULL_CACHE_KEY);
  } catch {
    // Le cache est optionnel.
  }

  if (notify) {
    window.dispatchEvent(new Event(ADMIN_PUBLIC_CATALOG_INVALIDATED_EVENT));
  }
};
