import { useEffect, useState } from 'react';
import { subscribeWishlistItems } from '../marketplace/wishlistState';
import { fetchPublicCatalogProduct } from '../marketplace/publicCatalogWishlist';

// Only resolve the first visible page, when the cart is actually open.
export default function useCartFavorites(user, enabled) {
  const owner = user?.uid && !user.isAnonymous ? user.uid : 'guest';
  const [state, setState] = useState({ owner, items: [], count: 0, loading: false, error: '' });
  useEffect(() => {
    let cancelled = false;
    let revision = 0;
    setState({ owner, items: [], count: 0, loading: true, error: '' });
    const stop = subscribeWishlistItems(user, (items) => {
      if (cancelled) return;
      const currentRevision = ++revision;
      const ids = [...new Set(items.map(item => String(item.originalId || item.id || '')).filter(Boolean))];
      const visible = ids.slice(0, 12);
      setState({ owner, ids, items: [], count: ids.length, loading: enabled && visible.length > 0, error: '' });
      if (!enabled) return;
      let cursor = 0;
      const resolved = new Array(visible.length);
      void Promise.all(Array.from({ length: Math.min(4, visible.length) }, async () => {
        while (!cancelled && currentRevision === revision && cursor < visible.length) {
          const index = cursor++;
          const id = visible[index];
          const product = await fetchPublicCatalogProduct(id);
          resolved[index] = product || { id, name: 'Pièce indisponible', catalogUnavailable: true };
        }
      })).then(() => {
        if (!cancelled && currentRevision === revision) {
          setState({ owner, ids, items: resolved, count: ids.length, loading: false, error: '' });
        }
      });
    }, () => {
      revision++;
      if (!cancelled) setState({ owner, items: [], count: 0, loading: false, error: 'Vos favoris n’ont pas pu être chargés. Fermez puis rouvrez le panier pour réessayer.' });
    });
    return () => { cancelled = true; stop(); };
  }, [enabled, owner, user]);
  return state.owner === owner ? state : { items: [], count: 0, loading: enabled, error: '' };
}
