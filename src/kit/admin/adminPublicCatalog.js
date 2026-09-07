export const ADMIN_PUBLIC_CATALOG_INVALIDATED_EVENT = 'secondevie:admin-public-catalog-invalidated';

const PUBLIC_CATALOG_URL = '/api/catalog?scope=cards&limit=120';
let inflightRequest = null;
let cacheGeneration = 0;

const fetchPublicCatalog = async () => {
  // Retry a changing release once; never expose a partial or mixed inventory.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const items = new Map();
    const cursors = new Set();
    let cursor = '';
    let version = null;
    for (let page = 0; page < 50; page += 1) {
      const response = await fetch(`${PUBLIC_CATALOG_URL}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, {
        cache: 'no-store',
        headers: { accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Catalogue public indisponible (${response.status})`);
      const payload = await response.json();
      const products = payload?.collections?.furniture;
      if (!Array.isArray(products) || !payload.catalogVersion || !payload.aggregateSha256) {
        throw new Error('Format du catalogue public invalide');
      }
      const pageVersion = `${payload.catalogVersion}:${payload.aggregateSha256}`;
      if (version && version !== pageVersion) break;
      version = pageVersion;
      products.forEach(item => items.set(item.id, item));
      if (!payload.nextCursor) return [...items.values()];
      if (typeof payload.nextCursor !== 'string' || cursors.has(payload.nextCursor)) {
        throw new Error('Pagination du catalogue invalide');
      }
      cursor = payload.nextCursor;
      cursors.add(cursor);
      if (page === 49) throw new Error('Catalogue trop volumineux pour cette vue. Aucun inventaire partiel n’a été chargé.');
    }
  }
  throw new Error('Le catalogue a changé pendant la lecture. Réessayez.');
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
