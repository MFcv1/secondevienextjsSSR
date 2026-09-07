'use client';

import { getDb, loadFirestoreModule } from '../config/firebaseLazy';

// The old unscoped cache may contain another account's remote wishlist. Leave
// it untouched, but never import it into an account or the new guest cache.
export const WISHLIST_STORAGE_KEY = 'sv_public_product_wishlist:v2:guest';
export const WISHLIST_CHANGED_EVENT = 'sv:wishlist-state-changed';
const migrations = new Map();
const channels = new Map();
let guestMigration = Promise.resolve();

const asArray = (value) => (Array.isArray(value) ? value : []);

export const getWishlistProductId = (item) => String(item?.originalId || item?.id || '').trim();

const uniqueIds = (ids) => Array.from(new Set(asArray(ids)
  .filter((id) => typeof id === 'string')
  .map((id) => id.trim())
  .filter((id) => id.length > 0 && id.length <= 160 && !id.includes('/'))));

export const isSignedWishlistUser = (user) => Boolean(user?.uid && !user.isAnonymous);

export const getCurrentWishlistUser = () => (
  typeof window === 'undefined' ? null : window.__svAuthUser || null
);

const storageKey = (user) => isSignedWishlistUser(user)
  ? `sv_public_product_wishlist:v2:uid:${encodeURIComponent(user.uid)}`
  : WISHLIST_STORAGE_KEY;

export const readWishlistIds = (user = getCurrentWishlistUser()) => {
  if (typeof window === 'undefined') return [];
  try {
    return uniqueIds(JSON.parse(window.localStorage.getItem(storageKey(user)) || '[]'));
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
    ...(Number.isFinite(item.currentPrice) ? { currentPrice: item.currentPrice } : {}),
    ...(Number.isFinite(item.startingPrice) ? { startingPrice: item.startingPrice } : {}),
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

export const writeWishlistIds = (ids, user = getCurrentWishlistUser()) => {
  if (typeof window === 'undefined') return [];
  const nextIds = uniqueIds(ids);
  window.localStorage.setItem(storageKey(user), JSON.stringify(nextIds));
  emitWishlistChange(nextIds);
  return nextIds;
};

export const setLocalWishlistItem = (item, liked, user = getCurrentWishlistUser()) => {
  const originalId = getWishlistProductId(item);
  if (!originalId) return readWishlistIds(user);
  const current = readWishlistIds(user);
  const next = liked ? uniqueIds([...current, originalId]) : current.filter((id) => id !== originalId);
  return writeWishlistIds(next, user);
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
  if (isSignedWishlistUser(user)) {
    await setRemoteWishlistItem(user, item, liked);
  }
  // Do not persist an optimistic operation that the server rejected.
  return setLocalWishlistItem(item, liked, user);
};

export const toggleWishlistItem = async (item, user = getCurrentWishlistUser()) => {
  const originalId = getWishlistProductId(item);
  if (!originalId) return readWishlistIds(user);
  const liked = !readWishlistIds(user).includes(originalId);
  return setWishlistItem(item, liked, user);
};

export const clearWishlist = async (items = [], user = getCurrentWishlistUser()) => {
  const currentItems = asArray(items);
  const ids = uniqueIds(currentItems.map(getWishlistProductId));
  const removeConfirmed = (removed) => {
    const selected = new Set(removed);
    return writeWishlistIds(readWishlistIds(user).filter(id => !selected.has(id)), user);
  };
  if (!isSignedWishlistUser(user)) return removeConfirmed(ids);

  const [db, { doc, writeBatch }] = await Promise.all([getDb(), loadFirestoreModule()]);
  for (let offset = 0; offset < ids.length; offset += 400) {
    const chunk = ids.slice(offset, offset + 400);
    const batch = writeBatch(db);
    chunk.forEach(id => batch.delete(doc(db, 'users', user.uid, 'wishlist', id)));
    await batch.commit();
    removeConfirmed(chunk);
  }
  return readWishlistIds(user);
};

const mergeLocalWishlistToRemote = async (user) => {
  if (!isSignedWishlistUser(user)) return;
  const localIds = readWishlistIds(null);
  if (!localIds.length) return;

  const [db, { doc, serverTimestamp, setDoc }] = await Promise.all([getDb(), loadFirestoreModule()]);
  // Bound concurrent writes and remove only successfully imported guest IDs.
  for (const originalId of localIds) {
    await setDoc(doc(db, 'users', user.uid, 'wishlist', originalId), {
      originalId,
      addedAt: serverTimestamp(),
    }, { merge: true });
    writeWishlistIds(readWishlistIds(null).filter((id) => id !== originalId), null);
  }
};

const subscribeLocalWishlist = (user, onChange) => {
  if (typeof window === 'undefined') return () => {};

  const notify = () => {
    const ids = readWishlistIds(user);
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
  if (!isSignedWishlistUser(user)) return subscribeLocalWishlist(user, onChange);

  let channel = channels.get(user.uid);
  const subscriber = { onChange, onError };
  if (channel) {
    channel.subscribers.add(subscriber);
    onChange(channel.items, channel.ids);
  } else {
    channel = { subscribers: new Set([subscriber]), items: [], ids: [], stop: null };
    channels.set(user.uid, channel);
    onChange([], []);
    channel.stop = subscribeRemoteWishlist(user, (items, ids) => {
      channel.items = items;
      channel.ids = ids;
      channel.subscribers.forEach((entry) => entry.onChange(items, ids));
    }, (error) => channel.subscribers.forEach((entry) => entry.onError(error)));
  }
  return () => {
    channel.subscribers.delete(subscriber);
    if (channel.subscribers.size === 0) {
      channel.stop?.();
      channels.delete(user.uid);
    }
  };
};

const subscribeRemoteWishlist = (user, onChange, onError) => {

  let cancelled = false;
  let unsubscribe = null;

  if (!migrations.has(user.uid)) {
    const migration = guestMigration.then(() => mergeLocalWishlistToRemote(user))
      .finally(() => migrations.delete(user.uid));
    guestMigration = migration.catch(() => {});
    migrations.set(user.uid, migration);
  }
  migrations.get(user.uid)
    .catch((error) => {
      // A failed guest import must not hide the account's existing favorites.
      if (!cancelled) onError(error);
    })
    .then(() => Promise.all([getDb(), loadFirestoreModule()]))
    .then(([db, { collection, onSnapshot, query }]) => {
      if (cancelled) return;
      unsubscribe = onSnapshot(
        query(collection(db, 'users', user.uid, 'wishlist')),
        (snap) => {
          if (cancelled) return;
          const items = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
          const ids = uniqueIds(items.map(getWishlistProductId));
          if (typeof window !== 'undefined') {
            try { writeWishlistIds(ids, user); } catch { /* Remote state survives unavailable storage. */ }
          }
          onChange(items, ids);
        },
        (error) => { if (!cancelled) onError(error); }
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
