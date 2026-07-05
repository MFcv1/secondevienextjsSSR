'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ShoppingBag } from 'lucide-react';

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

const warmCartPanel = () => {
  loadCartPanel().catch(() => {});
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

function CartHeaderIcon({ darkMode = false } = {}) {
  const iconTone = darkMode
    ? 'text-stone-200'
    : 'text-stone-900 dark:text-stone-200';

  return <ShoppingBag size={18} strokeWidth={1.5} className={iconTone} />;
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
    if (typeof window === 'undefined') return undefined;

    const preload = () => {
      loadCartPanel()
        .then((Component) => setCartPanel(() => Component))
        .catch(() => {});
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(preload, { timeout: 1800 });
      return () => window.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(preload, 900);
    return () => window.clearTimeout(timeoutId);
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
      onPointerDown={warmCartPanel}
      onPointerEnter={() => loadCartPanel().then((Component) => setCartPanel(() => Component)).catch(() => {})}
      onFocus={() => loadCartPanel().then((Component) => setCartPanel(() => Component)).catch(() => {})}
      onClick={() => ensureCartPanel('sv:open-cart')}
    >
      <CartHeaderIcon darkMode={darkMode} />
      {cartCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-stone-950 px-1 text-[9px] font-black leading-none text-white ring-2 ring-white dark:bg-[#D9B58D] dark:text-stone-950 dark:ring-[#080807]">
          {cartCount}
        </span>
      ) : null}
    </button>
  );
}
