'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  fetchPublicCatalogProduct,
  mergeCatalogProducts,
} from '../../src/kit/marketplace/publicCatalogWishlist';

function WishlistPageContent({ initialItems = [] }) {
  const router = useRouter();
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [catalogItems, setCatalogItems] = useState(initialItems);
  const [darkMode, setDarkMode] = useState(false);
  const [operationPending, setOperationPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const operationRef = useRef(false);
  const attemptedProductsRef = useRef(new Set());
  const initialProductIdsRef = useRef(new Set(initialItems.map(getWishlistProductId)));
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
      () => setErrorMessage('Votre liste de souhaits n’a pas pu être actualisée. Rechargez la page pour réessayer.')
    );
  }, [user]);

  useEffect(() => {
    if (!wishlistIds.length) return undefined;

    const knownIds = initialProductIdsRef.current;
    const missingIds = wishlistIds.filter((id) => !knownIds.has(id) && !attemptedProductsRef.current.has(id));
    if (!missingIds.length) return undefined;

    let cancelled = false;
    let cursor = 0;
    const products = [];
    const requestedIds = [];
    Promise.all(Array.from({ length: Math.min(8, missingIds.length) }, async () => {
      while (!cancelled && cursor < missingIds.length) {
        const id = missingIds[cursor++];
        requestedIds.push(id);
        attemptedProductsRef.current.add(id);
        const product = await fetchPublicCatalogProduct(id);
        if (cancelled) {
          return;
        }
        products.push(product);
      }
    }))
      .then(() => {
        if (cancelled) return;
        const nextProducts = products.filter(Boolean);
        if (!nextProducts.length) return;
        nextProducts.forEach(product => knownIds.add(getWishlistProductId(product)));
        setCatalogItems((currentItems) => mergeCatalogProducts(currentItems, nextProducts));
      });

    return () => {
      cancelled = true;
      requestedIds.forEach(id => attemptedProductsRef.current.delete(id));
    };
  }, [wishlistIds]);

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
    if (operationRef.current) return;
    const originalId = getWishlistProductId(item);
    const exists = wishlistItems.some((entry) => getWishlistProductId(entry) === originalId);
    operationRef.current = true;
    setOperationPending(true);
    setErrorMessage('');
    try {
      await setWishlistItem(item, !exists, user);
    } catch (error) {
      setErrorMessage('La modification n’a pas abouti. Votre liste reste disponible, réessayez.');
      console.error('Liste de souhaits update error:', error);
    } finally {
      operationRef.current = false;
      setOperationPending(false);
    }
  };

  const handleClearWishlist = async () => {
    if (operationRef.current) return;
    const previousItems = wishlistItems;
    operationRef.current = true;
    setOperationPending(true);
    setErrorMessage('');
    try {
      await clearWishlist(previousItems, user);
    } catch (error) {
      setErrorMessage('La suppression n’a pas été entièrement confirmée. Réessayez pour les pièces restantes.');
      console.error('Liste de souhaits clear error:', error);
    } finally {
      operationRef.current = false;
      setOperationPending(false);
    }
  };

  const openLogin = () => {
    window.dispatchEvent(new CustomEvent('sv:open-login'));
  };

  return (
    <WishlistView
      wishlistItems={wishlistItems}
      operationPending={operationPending}
      errorMessage={errorMessage}
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
  const { user } = useAuth();
  return <WishlistPageContent key={user?.uid || 'guest'} {...props} />;
}
