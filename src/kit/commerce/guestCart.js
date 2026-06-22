export const GUEST_CART_STORAGE_KEY = 'secondevie:guest-cart:v1';
export const GUEST_CART_CHANGED_EVENT = 'sv:guest-cart-changed';
export const CART_STATE_CHANGED_EVENT = 'sv:cart-state-changed';

const encodeCartKeyPart = (value) => encodeURIComponent(String(value || '').trim()).replace(/\./g, '%2E');

export const getCartDocumentId = (item = {}) => {
  const productId = item.originalId || item.productId || item.id;
  if (!productId) return '';
  const collectionName = item.collectionName || 'furniture';
  return `cart_${encodeCartKeyPart(collectionName)}_${encodeCartKeyPart(productId)}`;
};

const normalizeGuestCartItem = (item = {}) => {
  const productId = item.originalId || item.productId || item.id;
  if (!productId) return null;

  return {
    id: getCartDocumentId(item),
    originalId: productId,
    collectionName: item.collectionName || 'furniture',
    name: item.name || item.title || 'Piece Seconde Vie',
    price: Number(item.price || item.currentPrice || item.startingPrice || 0),
    image: item.image || item.imageUrl || '',
    material: item.material || 'Bois',
    quantity: Number(item.quantity || 1),
  };
};

export const readGuestCart = () => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(GUEST_CART_STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeGuestCartItem).filter(Boolean);
  } catch {
    return [];
  }
};

export const writeGuestCart = (items) => {
  if (typeof window === 'undefined') return;
  const normalizedItems = (Array.isArray(items) ? items : [])
    .map(normalizeGuestCartItem)
    .filter(Boolean);
  window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(normalizedItems));
  window.dispatchEvent(new CustomEvent(GUEST_CART_CHANGED_EVENT, { detail: { items: normalizedItems } }));
  window.dispatchEvent(new CustomEvent(CART_STATE_CHANGED_EVENT, { detail: { items: normalizedItems } }));
};

export const addGuestCartItem = (item) => {
  const normalizedItem = normalizeGuestCartItem(item);
  if (!normalizedItem) return [];

  const existingItems = readGuestCart();
  const index = existingItems.findIndex((entry) => (
    entry.originalId === normalizedItem.originalId
    && entry.collectionName === normalizedItem.collectionName
  ));

  const nextItems = [...existingItems];
  if (index < 0) {
    nextItems.push(normalizedItem);
  }

  writeGuestCart(nextItems);
  return nextItems;
};

export const removeGuestCartItem = (cartItemId) => {
  const nextItems = readGuestCart().filter((item) => item.id !== cartItemId);
  writeGuestCart(nextItems);
  return nextItems;
};

export const clearGuestCart = () => writeGuestCart([]);
