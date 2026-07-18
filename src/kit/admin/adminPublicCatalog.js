export const ADMIN_PUBLIC_CATALOG_INVALIDATED_EVENT = 'secondevie:admin-public-catalog-invalidated';

const PUBLIC_CATALOG_URL = '/api/catalog?scope=cards&limit=120';
let inflightRequest = null;
let cacheGeneration = 0;

const fetchPublicCatalog = async () => {
  const response = await fetch(PUBLIC_CATALOG_URL, {
    cache: 'no-store',
    headers: { accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Catalogue public indisponible (${response.status})`);

  const payload = await response.json();
  const items = payload?.collections?.furniture;
  if (!Array.isArray(items)) throw new Error('Format du catalogue public invalide');
  return items;
};

export const loadAdminPublicCatalog = async () => {
  if (inflightRequest) return inflightRequest;
  const requestGeneration = cacheGeneration;
  const request = fetchPublicCatalog()
    .then((items) => (
      requestGeneration === cacheGeneration ? items : loadAdminPublicCatalog()
    ))
    .finally(() => {
      if (inflightRequest === request) inflightRequest = null;
    });
  inflightRequest = request;
  return request;
};

export const clearAdminPublicCatalogCache = ({ notify = true } = {}) => {
  cacheGeneration += 1;
  inflightRequest = null;
  if (notify && typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ADMIN_PUBLIC_CATALOG_INVALIDATED_EVENT));
  }
};
