'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import WishlistView from '../../src/kit/marketplace/WishlistView';
import { useAuth } from '../../src/kit/contexts/AuthContext';
import { getCartDocumentId } from '../../src/kit/commerce/guestCart';
import { getProductStockAmount, isPurchasable } from '../../src/kit/commerce/purchasability';
import {
  clearWishlist,
  getWishlistProductId,
  setWishlistItem,
  subscribeWishlistItems,
} from '../../src/kit/marketplace/wishlistState';

const getPublicCatalogProductUrl = (id) => (
  `/api/catalog?id=${encodeURIComponent(id)}`
);

const normalizePublicCatalogProduct = (product, fallbackId) => {
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

const fetchPublicCatalogProduct = async (id) => {
  const productId = String(id || '').trim();
  if (!productId) return null;
  return fetch(getPublicCatalogProductUrl(productId), {
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

function WishlistPageContent({ initialItems = [] }) {
  const router = useRouter();
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [catalogItems, setCatalogItems] = useState(initialItems);
  const [darkMode, setDarkMode] = useState(false);
  const wishlistIds = useMemo(() => (
    Array.from(new Set(wishlistItems.map(getWishlistProductId).filter(Boolean)))
  ), [wishlistItems]);

  useEffect(() => {
    try {
      setDarkMode(window.localStorage.getItem('darkMode') === 'true');
    } catch {
      setDarkMode(false);
    }
  }, []);

  useEffect(() => {
    router.prefetch('/');
    router.prefetch('/checkout');
  }, [router]);

  useEffect(() => {
    return subscribeWishlistItems(
      user,
      (items) => setWishlistItems(items),
      (error) => console.error('Liste de souhaits sync error:', error)
    );
  }, [user]);

  useEffect(() => {
    if (!wishlistIds.length) return undefined;

    const knownIds = new Set(catalogItems.map((item) => getWishlistProductId(item)));
    const missingIds = wishlistIds.filter((id) => !knownIds.has(id));
    if (!missingIds.length) return undefined;

    let cancelled = false;
    Promise.all(missingIds.map(fetchPublicCatalogProduct))
      .then((products) => {
        if (cancelled) return;
        const nextProducts = products.filter(Boolean);
        if (!nextProducts.length) return;
        setCatalogItems((currentItems) => {
          const byId = new Map(currentItems.map((item) => [getWishlistProductId(item), item]));
          nextProducts.forEach((product) => {
            byId.set(getWishlistProductId(product), product);
          });
          return Array.from(byId.values());
        });
      });

    return () => {
      cancelled = true;
    };
  }, [catalogItems, wishlistIds]);

  const addToCart = async (item) => {
    if (!isPurchasable(item)) return;
    const cartItem = {
      originalId: item.originalId || item.id,
      collectionName: item.collectionName || 'furniture',
      name: item.name,
      price: item.currentPrice || item.startingPrice || item.price || 0,
      stock: getProductStockAmount(item),
      sold: Boolean(item.sold),
      priceOnRequest: Boolean(item.priceOnRequest),
      image: item.images?.[0] || item.imageUrl || item.image || '',
      material: item.material || 'Bois',
      quantity: 1,
    };
    const cartDocId = getCartDocumentId(cartItem);
    if (!cartDocId) return;
    window.dispatchEvent(new CustomEvent('sv:product-added', { detail: cartItem }));
  };

  const toggleWishlist = async (item) => {
    const originalId = getWishlistProductId(item);
    const exists = wishlistItems.some((entry) => getWishlistProductId(entry) === originalId);
    const previousItems = wishlistItems;
    setWishlistItems((currentItems) => (
      exists
        ? currentItems.filter((entry) => getWishlistProductId(entry) !== originalId)
        : [...currentItems, item]
    ));
    try {
      await setWishlistItem(item, !exists, user);
    } catch (error) {
      setWishlistItems(previousItems);
      console.error('Liste de souhaits update error:', error);
    }
  };

  const handleClearWishlist = async () => {
    const previousItems = wishlistItems;
    setWishlistItems([]);
    try {
      await clearWishlist(previousItems, user);
    } catch (error) {
      setWishlistItems(previousItems);
      console.error('Liste de souhaits clear error:', error);
    }
  };

  const openLogin = () => {
    window.dispatchEvent(new CustomEvent('sv:open-login'));
  };

  return (
    <WishlistView
      wishlistItems={wishlistItems}
      items={catalogItems}
      onAddToCart={addToCart}
      onToggleWishlist={toggleWishlist}
      onClearWishlist={handleClearWishlist}
      onOpenAbout={() => { router.push('/a-propos'); }}
      onBack={() => { router.push('/'); }}
      darkMode={darkMode}
      user={user}
      onShowLogin={openLogin}
    />
  );
}

export default function WishlistPageIsland(props) {
  return <WishlistPageContent {...props} />;
}
