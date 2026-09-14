'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import CartSurface from '../commerce/CartSurface';
import styles from '../commerce/CartPage.module.css';
import { createCartEventHandoff } from './cartEventHandoff';

const GUEST_CART_STORAGE_KEY = 'secondevie:guest-cart:v1';
const GUEST_CART_CHANGED_EVENT = 'sv:guest-cart-changed';
const CART_STATE_CHANGED_EVENT = 'sv:cart-state-changed';
const CART_SHELL_HANDOFF_MS = 360;

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
    return Array.isArray(parsed) ? parsed.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0) : 0;
  } catch {
    return 0;
  }
};

function CartHeaderIcon({ darkMode = false } = {}) {
  return <ShoppingBag size={18} strokeWidth={1.5} className={darkMode ? 'text-stone-200' : 'text-stone-900 dark:text-stone-200'} />;
}

function InstantCartShell({ open, closing, darkMode, onClose }) {
  return (
    <CartSurface isOpen={open && !closing} darkMode={darkMode} onClose={onClose} loading>
      <div className={styles.content}>
        <section className={styles.empty} role="status">
          <ShoppingBag size={36} strokeWidth={1} aria-hidden="true" />
          <h1>Votre panier se prépare.</h1>
          <p>Vos pièces arrivent dans un instant.</p>
        </section>
      </div>
    </CartSurface>
  );
}

export default function LazyCartPanelIsland({ className = '', darkMode = false } = {}) {
  const [CartPanel, setCartPanel] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [instantShellOpen, setInstantShellOpen] = useState(false);
  const [instantShellClosing, setInstantShellClosing] = useState(false);
  const shellTimerRef = useRef(null);
  const handoffRef = useRef(null);
  if (!handoffRef.current) {
    handoffRef.current = createCartEventHandoff(({ type, detail }) => {
      window.dispatchEvent(new CustomEvent(type, { detail }));
    });
  }
  const handleCartReady = useCallback(() => handoffRef.current.ready(), []);

  const ensureCartPanel = useCallback((eventType = 'sv:open-cart', detail = {}) => {
    if (!handoffRef.current.capture({ type: eventType, detail })) return;
    if (shellTimerRef.current) {
      window.clearTimeout(shellTimerRef.current);
      shellTimerRef.current = null;
    }
    if (eventType === 'sv:open-cart') {
      setInstantShellClosing(false);
      setInstantShellOpen(true);
    }
    loadCartPanel()
      .then((Component) => {
        setCartPanel(() => Component);
        shellTimerRef.current = window.setTimeout(() => {
          setInstantShellOpen(false);
          setInstantShellClosing(false);
          shellTimerRef.current = null;
        }, CART_SHELL_HANDOFF_MS);
      })
      .catch((error) => console.error('Cart panel lazy load error:', error));
  }, []);

  const closeInstantShell = useCallback(() => {
    if (shellTimerRef.current) {
      window.clearTimeout(shellTimerRef.current);
      shellTimerRef.current = null;
    }
    setInstantShellClosing(true);
    window.setTimeout(() => {
      setInstantShellOpen(false);
      setInstantShellClosing(false);
    }, 260);
  }, []);

  useEffect(() => () => {
    if (shellTimerRef.current) {
      window.clearTimeout(shellTimerRef.current);
      shellTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const refreshGuestCount = (event) => {
      const items = Array.isArray(event?.detail?.items) ? event.detail.items : null;
      setCartCount(items ? items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0) : readGuestCartCount());
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

  // Start the real cart subscription even when the header has not been touched.
  // Keep the immediate shell interactive while its runtime loads in the background.
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      loadCartPanel().then((Component) => {
        if (!cancelled) setCartPanel(() => Component);
      }).catch(() => {});
    }, 800);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, []);

  useEffect(() => {
    const openCart = (event) => {
      if (!CartPanel) ensureCartPanel('sv:open-cart', event?.detail || {});
    };
    const productAdded = (event) => {
      if (!CartPanel) ensureCartPanel('sv:product-added', event?.detail || {});
    };

    window.addEventListener('sv:open-cart', openCart);
    window.addEventListener('sv:product-added', productAdded);
    return () => {
      window.removeEventListener('sv:open-cart', openCart);
      window.removeEventListener('sv:product-added', productAdded);
    };
  }, [CartPanel, ensureCartPanel]);

  return (
    <>
      {CartPanel ? (
        <CartPanel className={className} darkMode={darkMode} onReady={handleCartReady} />
      ) : (
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
      )}
      <InstantCartShell
        open={instantShellOpen}
        closing={instantShellClosing}
        darkMode={darkMode}
        onClose={closeInstantShell}
      />
    </>
  );
}
