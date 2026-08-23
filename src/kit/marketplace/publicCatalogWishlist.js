const getWishlistProductId = (item) => String(item?.originalId || item?.id || '').trim();

export const getPublicCatalogProductUrl = (id) => (
  `/api/catalog?id=${encodeURIComponent(id)}`
);

export const normalizePublicCatalogProduct = (product, fallbackId) => {
  if (!product) return null;
  const id = String(product.id || fallbackId || '').trim();
  if (!id) return null;
  return {
    ...product,
    id,
    originalId: id,
    collectionName: product.collectionName || 'furniture',
  };
};

export const fetchPublicCatalogProduct = async (id, fetchImpl = fetch) => {
  const productId = String(id || '').trim();
  if (!productId) return null;
  return fetchImpl(getPublicCatalogProductUrl(productId), {
    cache: 'no-store',
    headers: { accept: 'application/json' },
  })
    .then((response) => (response.ok ? response.json() : null))
    .then((payload) => {
      const product = payload?.product
        || (payload?.collections?.furniture || []).find((item) => item.id === productId);
      return normalizePublicCatalogProduct(product, productId);
    })
    .catch(() => null);
};

export const mergeCatalogProducts = (currentItems, products) => {
  const byId = new Map(currentItems.map((item) => [getWishlistProductId(item), item]));
  products.filter(Boolean).forEach((product) => {
    byId.set(getWishlistProductId(product), product);
  });
  return Array.from(byId.values());
};
