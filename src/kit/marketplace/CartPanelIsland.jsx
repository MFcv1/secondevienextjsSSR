'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { getDb, getFirebaseAuth, loadAuthModule, loadFirestoreModule } from '../config/firebaseLazy';
import {
  addGuestCartItem,
  CART_STATE_CHANGED_EVENT,
  getCartDocumentId,
  GUEST_CART_CHANGED_EVENT,
  readGuestCart,
  removeGuestCartItem,
  writeCheckoutCartHandoff,
} from '../commerce/guestCart';
import { isPurchasable } from '../commerce/purchasability';

const CartSidebar = dynamic(() => import('../commerce/CartSidebar'), {
  ssr: false,
  loading: () => null,
});

const CLOSE_NAVIGATION_OVERLAYS_EVENT = 'sv:close-navigation-overlays';

const LegacyLoginModalIsland = dynamic(() => import('./LegacyLoginModalFullIsland'), {
  ssr: false,
  loading: () => null,
});

const hasPersistedFirebaseUser = () => {
  if (typeof window === 'undefined') return false;
  try {
    return Object.keys(window.localStorage).some((key) => key.startsWith('firebase:authUser:'));
  } catch {
    return false;
  }
};

const getCartTotal = (items) => (
  items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0)
);

const isDesktopViewport = () => (
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(min-width: 768px)').matches
);

const resolvePersistedAuthUser = async () => {
  if (typeof window === 'undefined' || !hasPersistedFirebaseUser()) return null;
  if (window.__svAuthUser) return window.__svAuthUser;

  const [auth, { onAuthStateChanged }] = await Promise.all([getFirebaseAuth(), loadAuthModule()]);
  if (auth.currentUser) return auth.currentUser;

  return new Promise((resolve) => {
    let settled = false;
    let unsubscribe = null;
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      unsubscribe?.();
      resolve(auth.currentUser || window.__svAuthUser || null);
    }, 1200);

    unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      unsubscribe?.();
      resolve(currentUser || null);
    });
  });
};

export default function CartPanelIsland({ className = '', darkMode = false, initialEvent = null, onReady } = {}) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [isCartPrimed, setIsCartPrimed] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState(null);
  const consumedInitialEventRef = useRef(null);

  const primeCart = useCallback(() => {
    setIsCartPrimed(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeAuth = null;

    const applyUser = (nextUser) => {
      if (cancelled) return;
      setUser(nextUser || null);
    };

    const handleAuthChange = (event) => {
      applyUser(event.detail?.user || null);
    };

    window.addEventListener('sv:auth-user-changed', handleAuthChange);
    applyUser(window.__svAuthUser || null);

    if (hasPersistedFirebaseUser()) {
      Promise.all([getFirebaseAuth(), loadAuthModule()])
        .then(([auth, { onAuthStateChanged }]) => {
          if (cancelled) return;
          unsubscribeAuth = onAuthStateChanged(auth, applyUser);
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      unsubscribeAuth?.();
      window.removeEventListener('sv:auth-user-changed', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setCartItems(readGuestCart());
      return undefined;
    }

    let cancelled = false;
    let unsubscribe = null;

    Promise.all([getDb(), loadFirestoreModule()])
      .then(([db, { collection, onSnapshot, query }]) => {
        if (cancelled) return;
        unsubscribe = onSnapshot(
          query(collection(db, 'users', user.uid, 'cart')),
          (snap) => setCartItems(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))),
          (error) => console.error('Cart sync error:', error)
        );
      })
      .catch((error) => {
        if (!cancelled) console.error('Cart sync error:', error);
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [user]);

  useEffect(() => {
    if (user) return undefined;

    const handleGuestCartChanged = (event) => {
      setCartItems(Array.isArray(event.detail?.items) ? event.detail.items : readGuestCart());
    };

    window.addEventListener(GUEST_CART_CHANGED_EVENT, handleGuestCartChanged);
    return () => window.removeEventListener(GUEST_CART_CHANGED_EVENT, handleGuestCartChanged);
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

    let cartUser = user || (typeof window !== 'undefined' ? window.__svAuthUser : null);
    if (!cartUser) {
      cartUser = await resolvePersistedAuthUser();
      if (cartUser) setUser(cartUser);
    }

    if (!cartUser) {
      setCartItems(addGuestCartItem(item));
      openCart();
      return true;
    }

    const cartDocId = getCartDocumentId(item);
    if (!cartDocId) return false;

    const [db, { doc, serverTimestamp, setDoc }] = await Promise.all([getDb(), loadFirestoreModule()]);
    await setDoc(doc(db, 'users', cartUser.uid, 'cart', cartDocId), {
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
      addedAt: serverTimestamp(),
    }, { merge: true });
    openCart();
    return true;
  }, [openCart, user]);

  useEffect(() => {
    const handleProductAdded = (event) => {
      addCartItem(event.detail || {}).catch((error) => console.error('Add to cart error:', error));
    };

    window.addEventListener('sv:open-cart', openCart);
    window.addEventListener('sv:product-added', handleProductAdded);
    return () => {
      window.removeEventListener('sv:open-cart', openCart);
      window.removeEventListener('sv:product-added', handleProductAdded);
    };
  }, [addCartItem, openCart]);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    if (!initialEvent?.id || consumedInitialEventRef.current === initialEvent.id) return;

    consumedInitialEventRef.current = initialEvent.id;

    if (initialEvent.type === 'sv:open-cart') {
      openCart();
      return;
    }

    if (initialEvent.type === 'sv:product-added') {
      addCartItem(initialEvent.detail || {}).catch((error) => console.error('Add to cart error:', error));
    }
  }, [addCartItem, initialEvent, openCart]);

  useEffect(() => {
    if (!pendingCartItem || !user) return;
    addCartItem(pendingCartItem)
      .then((added) => {
        if (added) setPendingCartItem(null);
      })
      .catch((error) => console.error('Pending cart add error:', error));
  }, [addCartItem, pendingCartItem, user]);

  const removeFromCart = useCallback(async (cartDocId) => {
    if (!user) {
      setCartItems(removeGuestCartItem(cartDocId));
      return;
    }
    const [db, { deleteDoc, doc }] = await Promise.all([getDb(), loadFirestoreModule()]);
    await deleteDoc(doc(db, 'users', user.uid, 'cart', cartDocId));
  }, [user]);

  const totalPrice = useMemo(() => getCartTotal(cartItems), [cartItems]);

  const goToCheckout = () => {
    writeCheckoutCartHandoff(cartItems);
    setIsOpen(false);
    router.push('/checkout');
  };

  return (
    <>
      <button type="button" className={className} title="Panier" aria-label="Panier" onPointerEnter={primeCart} onFocus={primeCart} onClick={openCart}>
        <ShoppingBag size={18} strokeWidth={1.5} className={`transition-colors duration-300 ${darkMode ? 'text-stone-200 group-hover:text-[#D9B58D]' : 'text-stone-900 group-hover:text-amber-600 dark:text-stone-200 dark:group-hover:text-[#D9B58D]'}`} />
        {cartItems.length > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-stone-950 px-1 text-[9px] font-black leading-none text-white ring-2 ring-white dark:bg-[#D9B58D] dark:text-stone-950 dark:ring-[#080807]">
            {cartItems.length}
          </span>
        ) : null}
      </button>

      {(isCartPrimed || interacted || isOpen) ? (
        <CartSidebar
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          cartItems={cartItems}
          onRemoveItem={removeFromCart}
          totalPrice={totalPrice}
          onCheckout={goToCheckout}
          interacted={interacted}
          darkMode={darkMode}
          activeDesignId="architectural"
        />
      ) : null}
      {loginOpen ? (
        <LegacyLoginModalIsland
          open={loginOpen}
          onOpenChange={setLoginOpen}
          renderTrigger={false}
        />
      ) : null}
    </>
  );
}
