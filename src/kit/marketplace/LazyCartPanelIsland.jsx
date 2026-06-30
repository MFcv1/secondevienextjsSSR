'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const GUEST_CART_STORAGE_KEY = 'secondevie:guest-cart:v1';
const GUEST_CART_CHANGED_EVENT = 'sv:guest-cart-changed';
const CART_STATE_CHANGED_EVENT = 'sv:cart-state-changed';

let cartPanelPromise = null;

const loadCartPanel = () => {
  if (!cartPanelPromise) {
    cartPanelPromise = import('./CartPanelIsland')
      .then((module) => module.default)
      .catch((error) => {
        cartPanelPromise = null;
        throw error;
      });
  }
  return cartPanelPromise;
};

const readGuestCartCount = () => {
  if (typeof window === 'undefined') return 0;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(GUEST_CART_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
};

function ShoppingBagIcon({ darkMode = false } = {}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-[18px] w-[18px] transition-colors duration-300 ${darkMode ? 'text-stone-200 group-hover:text-[#D9B58D]' : 'text-stone-900 group-hover:text-amber-600 dark:text-stone-200 dark:group-hover:text-[#D9B58D]'}`}
    >
      <path d="M6.5 8.5h11l1 11h-13l1-11Z" />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    </svg>
  );
}

export default function LazyCartPanelIsland({ className = '', darkMode = false } = {}) {
  const [CartPanel, setCartPanel] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [initialEvent, setInitialEvent] = useState(null);
  const eventCounterRef = useRef(0);

  const ensureCartPanel = useCallback((eventType = 'sv:open-cart', detail = {}) => {
    const id = `${Date.now()}-${eventCounterRef.current += 1}`;
    setInitialEvent({ id, type: eventType, detail });
    loadCartPanel()
      .then((Component) => setCartPanel(() => Component))
      .catch((error) => console.error('Cart panel lazy load error:', error));
  }, []);

  useEffect(() => {
    const refreshGuestCount = (event) => {
      const items = Array.isArray(event?.detail?.items) ? event.detail.items : null;
      setCartCount(items ? items.length : readGuestCartCount());
    };

    refreshGuestCount();
    window.addEventListener(GUEST_CART_CHANGED_EVENT, refreshGuestCount);
    window.addEventListener(CART_STATE_CHANGED_EVENT, refreshGuestCount);
    window.addEventListener('storage', refreshGuestCount);
    return () => {
      window.removeEventListener(GUEST_CART_CHANGED_EVENT, refreshGuestCount);
      window.removeEventListener(CART_STATE_CHANGED_EVENT, refreshGuestCount);
      window.removeEventListener('storage', refreshGuestCount);
    };
  }, []);

  useEffect(() => {
    const openCart = (event) => ensureCartPanel('sv:open-cart', event?.detail || {});
    const productAdded = (event) => ensureCartPanel('sv:product-added', event?.detail || {});

    window.addEventListener('sv:open-cart', openCart);
    window.addEventListener('sv:product-added', productAdded);
    return () => {
      window.removeEventListener('sv:open-cart', openCart);
      window.removeEventListener('sv:product-added', productAdded);
    };
  }, [ensureCartPanel]);

  if (CartPanel) {
    return <CartPanel className={className} darkMode={darkMode} initialEvent={initialEvent} />;
  }

  return (
    <button
      type="button"
      className={className}
      title="Panier"
      aria-label="Panier"
      onPointerEnter={() => loadCartPanel().then((Component) => setCartPanel(() => Component)).catch(() => {})}
      onFocus={() => loadCartPanel().then((Component) => setCartPanel(() => Component)).catch(() => {})}
      onClick={() => ensureCartPanel('sv:open-cart')}
    >
      <ShoppingBagIcon darkMode={darkMode} />
      {cartCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-stone-950 px-1 text-[9px] font-black leading-none text-white ring-2 ring-white dark:bg-[#D9B58D] dark:text-stone-950 dark:ring-[#080807]">
          {cartCount}
        </span>
      ) : null}
    </button>
  );
}
