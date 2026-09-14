'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import CartPageView from '../commerce/CartPageView';
import useCartFavorites from '../commerce/useCartFavorites';
import { getDb, getFirebaseAuth, loadFirestoreModule } from '../config/firebaseLazy';
import { useAuthState } from '../contexts/AuthContext';
import {
  addGuestCartItem,
  CART_ITEM_ADD_RESULT_EVENT,
  CART_STATE_CHANGED_EVENT,
  getCartDocumentId,
  GUEST_CART_CHANGED_EVENT,
  GUEST_CART_STORAGE_KEY,
  readGuestCart,
  removeGuestCartItem,
  writeCheckoutCartHandoff,
} from '../commerce/guestCart';
import { isPurchasable } from '../commerce/purchasability';
import { migrateGuestCartToUserCart } from '../commerce/cartMigration';

function CartHeaderIcon({ darkMode = false } = {}) {
  const iconTone = darkMode
    ? 'text-stone-200'
    : 'text-stone-900 dark:text-stone-200';

  return <ShoppingBag size={18} strokeWidth={1.5} className={iconTone} />;
}

const CLOSE_NAVIGATION_OVERLAYS_EVENT = 'sv:close-navigation-overlays';

const getCartTotal = (items) => (
  items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0)
);

const isDesktopViewport = () => (
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(min-width: 768px)').matches
);

const resolvePersistedAuthUser = async () => {
  if (typeof window === 'undefined') return null;
  const auth = await getFirebaseAuth();
  await auth.authStateReady?.();
  return auth.currentUser || null;
};

export default function CartPanelIsland({ className = '', darkMode = false, onReady } = {}) {
  const router = useRouter();
  const authState = useAuthState();
  const user = authState.user;
  const [cartItems, setCartItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const favorites = useCartFavorites(user, isOpen);
  const [interacted, setInteracted] = useState(false);
  const [isCartPrimed, setIsCartPrimed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartLoadError, setCartLoadError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const primeCart = useCallback(() => {
    setIsCartPrimed(true);
  }, []);

  useEffect(() => {
    setCartLoadError('');
    if (!user) {
      setCartLoading(false);
      setCartItems(readGuestCart());
      return undefined;
    }

    let cancelled = false;
    let unsubscribe = null;
    setCartItems([]);
    setCartLoading(true);

    Promise.all([getDb(), loadFirestoreModule()])
      .then(async ([db, firestore]) => {
        if (cancelled) return;
        await migrateGuestCartToUserCart(db, firestore, user, () => !cancelled);
        if (cancelled) return;
        const { collection, onSnapshot, query } = firestore;
        unsubscribe = onSnapshot(
          query(collection(db, 'users', user.uid, 'cart')),
          (snap) => {
            if (!cancelled) {
              setCartItems(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
              setCartLoading(false);
              setCartLoadError('');
            }
          },
          (error) => {
            if (cancelled) return;
            setCartItems([]);
            setCartLoading(false);
            setCartLoadError('Votre panier n’a pas pu être chargé. Fermez-le puis actualisez la page pour réessayer.');
            console.error('Cart sync error:', error);
          }
        );
      })
      .catch((error) => {
        if (!cancelled) {
          setCartLoading(false);
          setCartLoadError('Votre panier n’a pas pu être chargé. Fermez-le puis actualisez la page pour réessayer.');
          console.error('Cart sync error:', error);
        }
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [user]);

  useEffect(() => {
    if (user) return undefined;

    const handleGuestCartChanged = (event) => {
      if (event.type === 'storage' && event.key !== null && event.key !== GUEST_CART_STORAGE_KEY) return;
      setCartItems(Array.isArray(event.detail?.items) ? event.detail.items : readGuestCart());
    };

    window.addEventListener(GUEST_CART_CHANGED_EVENT, handleGuestCartChanged);
    window.addEventListener('storage', handleGuestCartChanged);
    return () => {
      window.removeEventListener(GUEST_CART_CHANGED_EVENT, handleGuestCartChanged);
      window.removeEventListener('storage', handleGuestCartChanged);
    };
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(CART_STATE_CHANGED_EVENT, { detail: { items: cartItems } }));
  }, [cartItems]);

  useEffect(() => {
    if (!isDesktopViewport()) return undefined;

    let cancelled = false;
    const requestIdle = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 800));
    const cancelIdle = window.cancelIdleCallback || window.clearTimeout;
    const idleId = requestIdle(() => {
      if (!cancelled) primeCart();
    });

    return () => {
      cancelled = true;
      cancelIdle(idleId);
    };
  }, [primeCart]);

  const openCart = useCallback((event) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CLOSE_NAVIGATION_OVERLAYS_EVENT));
    }
    if (Array.isArray(event?.detail?.items) && event.detail.items.length > 0) {
      setCartItems(event.detail.items);
    }
    primeCart();
    setInteracted(true);
    setIsOpen(true);
  }, [primeCart]);

  const addCartItem = useCallback(async (item) => {
    if (!item?.originalId && !item?.id) return false;
    if (!isPurchasable(item)) return false;

    let cartUser = user;
    if (!cartUser) {
      cartUser = await resolvePersistedAuthUser();
    }

    if (!cartUser) {
      setCartItems(addGuestCartItem(item));
      return true;
    }

    const cartDocId = getCartDocumentId(item);
    if (!cartDocId) return false;

    const [db, { doc, runTransaction, serverTimestamp }] = await Promise.all([getDb(), loadFirestoreModule()]);
    const cartRef = doc(db, 'users', cartUser.uid, 'cart', cartDocId);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(cartRef);
      const current = snapshot.exists() ? snapshot.data() : null;
      const suffix = globalThis.crypto?.randomUUID?.()
        || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      transaction.set(cartRef, {
        originalId: item.originalId || item.id,
        collectionName: item.collectionName || 'furniture',
        name: item.name || item.title || 'Piece Seconde Vie',
        price: Number(item.price || item.currentPrice || item.startingPrice || 0),
        stock: Number(item.stock || 0),
        sold: Boolean(item.sold),
        priceOnRequest: Boolean(item.priceOnRequest),
        image: item.image || item.imageUrl || '',
        material: item.material || 'Bois',
        quantity: Number(item.quantity || 1),
        cartLineId: current?.cartLineId || `cart-line-${suffix}`,
        cartRevision: Number.isSafeInteger(current?.cartRevision)
          ? current.cartRevision + 1
          : 1,
        addedAt: current?.addedAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
    return true;
  }, [user]);

  const processProductAdded = useCallback(async (item) => {
    const requestId = typeof item?.cartRequestId === 'string' ? item.cartRequestId : '';
    const productId = item?.originalId || item?.id || '';

    try {
      const added = await addCartItem(item);
      window.dispatchEvent(new CustomEvent(CART_ITEM_ADD_RESULT_EVENT, {
        detail: { requestId, productId, success: added },
      }));
      return added;
    } catch (error) {
      console.error('Add to cart error:', error);
      window.dispatchEvent(new CustomEvent(CART_ITEM_ADD_RESULT_EVENT, {
        detail: { requestId, productId, success: false },
      }));
      return false;
    }
  }, [addCartItem]);

  useEffect(() => {
    const handleProductAdded = (event) => {
      void processProductAdded(event.detail || {});
    };

    window.addEventListener('sv:open-cart', openCart);
    window.addEventListener('sv:product-added', handleProductAdded);
    return () => {
      window.removeEventListener('sv:open-cart', openCart);
      window.removeEventListener('sv:product-added', handleProductAdded);
    };
  }, [openCart, processProductAdded]);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const removeFromCart = useCallback(async (cartDocId) => {
    if (!user) {
      setCartItems(removeGuestCartItem(cartDocId));
      return;
    }
    const [db, { deleteDoc, doc }] = await Promise.all([getDb(), loadFirestoreModule()]);
    await deleteDoc(doc(db, 'users', user.uid, 'cart', cartDocId));
  }, [user]);

  const totalPrice = useMemo(() => getCartTotal(cartItems), [cartItems]);
  const cartCount = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  const goToCheckout = () => {
    writeCheckoutCartHandoff(cartItems);
    setIsOpen(false);
    router.push('/checkout');
  };

  return (
    <>
      <button type="button" className={className} title="Panier" aria-label="Panier" onPointerDown={primeCart} onPointerEnter={primeCart} onFocus={primeCart} onClick={() => isOpen ? setIsOpen(false) : openCart()}>
        <CartHeaderIcon darkMode={darkMode} />
        {cartCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-stone-950 px-1 text-[9px] font-black leading-none text-white ring-2 ring-white dark:bg-[#D9B58D] dark:text-stone-950 dark:ring-[#080807]">
            {cartCount}
          </span>
        ) : null}
      </button>

      {mounted && typeof document !== 'undefined' && (isCartPrimed || interacted || isOpen) ? createPortal(
        <CartPageView
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          cartItems={cartItems}
          favorites={favorites}
          onAddFavorite={addCartItem}
          onRemoveItem={removeFromCart}
          totalPrice={totalPrice}
          onCheckout={goToCheckout}
          darkMode={darkMode}
          loading={cartLoading}
          loadError={cartLoadError}
        />,
        document.body
      ) : null}
    </>
  );
}
