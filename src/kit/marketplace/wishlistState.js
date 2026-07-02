'use client';

import { getDb, loadFirestoreModule } from '../config/firebaseLazy';

export const WISHLIST_STORAGE_KEY = 'sv_public_product_wishlist';
export const WISHLIST_CHANGED_EVENT = 'sv:wishlist-state-changed';

const asArray = (value) => (Array.isArray(value) ? value : []);

export const getWishlistProductId = (item) => String(item?.originalId || item?.id || '').trim();

const uniqueIds = (ids) => Array.from(new Set(asArray(ids).map((id) => String(id || '').trim()).filter(Boolean)));

export const isSignedWishlistUser = (user) => Boolean(user?.uid && !user.isAnonymous);

export const getCurrentWishlistUser = () => (
  typeof window === 'undefined' ? null : window.__svAuthUser || null
);

export const readWishlistIds = () => {
  if (typeof window === 'undefined') return [];
  try {
    return uniqueIds(JSON.parse(window.localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]'));
  } catch {
    return [];
  }
};

export const toWishlistItem = (item = {}) => {
  const originalId = getWishlistProductId(item);
  return {
    originalId,
    id: originalId,
    collectionName: item.collectionName || 'furniture',
    name: item.name || item.title || 'Piece restauree',
    title: item.title || item.name || 'Piece restauree',
    price: item.currentPrice || item.startingPrice || item.price || 0,
    currentPrice: item.currentPrice,
    startingPrice: item.startingPrice,
    image: item.images?.[0] || item.imageUrl || item.image || item.thumbnailUrl || '',
    imageUrl: item.imageUrl || item.images?.[0] || item.image || item.thumbnailUrl || '',
    material: item.material || 'Bois',
  };
};

const emitWishlistChange = (ids) => {
  if (typeof window === 'undefined') return;
  const nextIds = uniqueIds(ids);
  window.dispatchEvent(new CustomEvent(WISHLIST_CHANGED_EVENT, {
    detail: { ids: nextIds, items: nextIds },
  }));
};

export const writeWishlistIds = (ids) => {
  if (typeof window === 'undefined') return [];
  const nextIds = uniqueIds(ids);
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(nextIds));
  emitWishlistChange(nextIds);
  return nextIds;
};

export const setLocalWishlistItem = (item, liked) => {
  const originalId = getWishlistProductId(item);
  if (!originalId) return readWishlistIds();
  const current = readWishlistIds();
  const next = liked ? uniqueIds([...current, originalId]) : current.filter((id) => id !== originalId);
  return writeWishlistIds(next);
};

const wishlistDocPayload = (item, serverTimestamp) => {
  const payload = toWishlistItem(item);
  return {
    ...payload,
    addedAt: serverTimestamp(),
  };
};

const setRemoteWishlistItem = async (user, item, liked) => {
  if (!isSignedWishlistUser(user)) return;
  const originalId = getWishlistProductId(item);
  if (!originalId) return;

  const [db, { deleteDoc, doc, serverTimestamp, setDoc }] = await Promise.all([getDb(), loadFirestoreModule()]);
  const docRef = doc(db, 'users', user.uid, 'wishlist', originalId);
  if (!liked) {
    await deleteDoc(docRef);
    return;
  }
  await setDoc(docRef, wishlistDocPayload(item, serverTimestamp), { merge: true });
};

export const setWishlistItem = async (item, liked, user = getCurrentWishlistUser()) => {
  const nextIds = setLocalWishlistItem(item, liked);
  if (isSignedWishlistUser(user)) {
    await setRemoteWishlistItem(user, item, liked);
  }
  return nextIds;
};

export const toggleWishlistItem = async (item, user = getCurrentWishlistUser()) => {
  const originalId = getWishlistProductId(item);
  if (!originalId) return readWishlistIds();
  const liked = !readWishlistIds().includes(originalId);
  return setWishlistItem(item, liked, user);
};

export const clearWishlist = async (items = [], user = getCurrentWishlistUser()) => {
  const currentItems = asArray(items);
  writeWishlistIds([]);
  if (!isSignedWishlistUser(user)) return;

  const [db, { doc, writeBatch }] = await Promise.all([getDb(), loadFirestoreModule()]);
  const batch = writeBatch(db);
  currentItems.forEach((item) => {
    const originalId = getWishlistProductId(item);
    if (originalId) batch.delete(doc(db, 'users', user.uid, 'wishlist', originalId));
  });
  await batch.commit();
};

const mergeLocalWishlistToRemote = async (user) => {
  if (!isSignedWishlistUser(user)) return;
  const localIds = readWishlistIds();
  if (!localIds.length) return;

  const [db, { doc, serverTimestamp, setDoc }] = await Promise.all([getDb(), loadFirestoreModule()]);
  await Promise.all(localIds.map((originalId) => (
    setDoc(doc(db, 'users', user.uid, 'wishlist', originalId), {
      originalId,
      addedAt: serverTimestamp(),
    }, { merge: true })
  )));
};

const subscribeLocalWishlist = (onChange) => {
  if (typeof window === 'undefined') return () => {};

  const notify = () => {
    const ids = readWishlistIds();
    onChange(ids.map((id) => ({ id, originalId: id })), ids);
  };

  notify();
  const handleWishlistChange = () => notify();
  const handleStorage = (event) => {
    if (event.key === WISHLIST_STORAGE_KEY) notify();
  };

  window.addEventListener(WISHLIST_CHANGED_EVENT, handleWishlistChange);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(WISHLIST_CHANGED_EVENT, handleWishlistChange);
    window.removeEventListener('storage', handleStorage);
  };
};

export const subscribeWishlistItems = (user, onChange, onError = console.error) => {
  if (!isSignedWishlistUser(user)) return subscribeLocalWishlist(onChange);

  let cancelled = false;
  let unsubscribe = null;

  mergeLocalWishlistToRemote(user)
    .then(() => Promise.all([getDb(), loadFirestoreModule()]))
    .then(([db, { collection, onSnapshot, query }]) => {
      if (cancelled) return;
      unsubscribe = onSnapshot(
        query(collection(db, 'users', user.uid, 'wishlist')),
        (snap) => {
          const items = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
          const ids = uniqueIds(items.map(getWishlistProductId));
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
            emitWishlistChange(ids);
          }
          onChange(items, ids);
        },
        onError
      );
    })
    .catch((error) => {
      if (!cancelled) onError(error);
    });

  return () => {
    cancelled = true;
    unsubscribe?.();
  };
};
