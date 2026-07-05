'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WishlistView from '../../src/kit/marketplace/WishlistView';
import { useAuth } from '../../src/kit/contexts/AuthContext';
import { getCartDocumentId } from '../../src/kit/commerce/guestCart';
import { getProductStockAmount, isPurchasable } from '../../src/kit/commerce/purchasability';
import {
  clearWishlist,
  getWishlistProductId,
  readWishlistIds,
  setWishlistItem,
  subscribeWishlistItems,
} from '../../src/kit/marketplace/wishlistState';

function WishlistPageContent({ initialItems = [] }) {
  const router = useRouter();
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState(() => (
    readWishlistIds().map((id) => ({ id, originalId: id }))
  ));
  const [darkMode, setDarkMode] = useState(false);

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

  return (
    <WishlistView
      wishlistItems={wishlistItems}
      items={initialItems}
      onAddToCart={addToCart}
      onToggleWishlist={toggleWishlist}
      onClearWishlist={handleClearWishlist}
      onOpenAbout={() => { router.push('/a-propos'); }}
      onBack={() => { router.push('/'); }}
      darkMode={darkMode}
      user={user}
      onShowLogin={() => { router.push('/admin'); }}
    />
  );
}

export default function WishlistPageIsland(props) {
  return <WishlistPageContent {...props} />;
}
