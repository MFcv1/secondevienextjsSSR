'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, ShoppingBag, X } from 'lucide-react';

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
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
};

const readGuestCartItems = () => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(GUEST_CART_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

function CartHeaderIcon({ darkMode = false } = {}) {
  const iconTone = darkMode
    ? 'text-stone-200'
    : 'text-stone-900 dark:text-stone-200';

  return <ShoppingBag size={18} strokeWidth={1.5} className={iconTone} />;
}

function InstantCartShell({
  open = false,
  closing = false,
  darkMode = false,
  count = 0,
  detail = {},
  onClose,
} = {}) {
  const interactive = open && !closing;
  const guestItems = readGuestCartItems();
  const previewItems = Array.isArray(detail?.items) && detail.items.length
    ? detail.items
    : detail?.originalId || detail?.id
      ? [detail]
      : guestItems.slice(0, 2);
  const visibleCount = Math.max(count, previewItems.length);
  const panelTone = darkMode
    ? 'border-stone-800 bg-[#0A0A0A] text-stone-100'
    : 'border-stone-200 bg-[#FAFAF9] text-stone-900 dark:border-stone-800 dark:bg-[#0A0A0A] dark:text-stone-100';
  const mutedText = darkMode ? 'text-stone-400' : 'text-stone-500 dark:text-stone-400';

  return (
    <div
      className={`${interactive ? 'pointer-events-auto' : 'pointer-events-none'} fixed inset-0 z-[2400] overflow-hidden`}
      aria-hidden={!interactive}
      inert={!interactive ? '' : undefined}
    >
      <button
        type="button"
        aria-label="Fermer le panier"
        onClick={onClose}
        className={`absolute inset-0 h-full w-full bg-stone-950/24 backdrop-blur-sm transition-opacity duration-200 ${interactive ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        className={`absolute inset-y-0 right-0 flex h-full w-full max-w-none flex-col border-l shadow-2xl transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:w-[500px] ${panelTone} ${interactive ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
        style={{
          contain: 'layout paint',
          transformOrigin: 'right center',
          willChange: 'transform, opacity',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
        }}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-4 pb-4 pt-[max(0.85rem,env(safe-area-inset-top,0px))] dark:border-stone-800 md:px-8 md:pt-6">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-full ${darkMode ? 'bg-white/5' : 'bg-stone-100 dark:bg-white/5'}`}>
              <ShoppingBag size={18} strokeWidth={1.5} />
            </span>
            <div>
              <p className="font-serif text-[22px] leading-none">Votre panier</p>
              <p className={`mt-1 text-[11px] font-bold uppercase tracking-[0.14em] ${mutedText}`}>
                {visibleCount > 0 ? `${visibleCount} piece${visibleCount > 1 ? 's' : ''}` : 'Pret a remplir'}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Fermer le panier"
            onClick={onClose}
            className={`flex h-10 w-10 touch-manipulation items-center justify-center rounded-full transition-transform active:scale-95 ${darkMode ? 'bg-white/5 text-stone-300' : 'bg-stone-100 text-stone-600 dark:bg-white/5 dark:text-stone-300'}`}
          >
            <X size={22} strokeWidth={1.2} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-5 md:px-8">
          {previewItems.length > 0 ? (
            previewItems.map((item, index) => (
              <div
                key={item.originalId || item.id || index}
                className={`flex gap-3 rounded-2xl p-2 ${darkMode ? 'bg-white/[0.04]' : 'bg-white shadow-sm shadow-stone-900/5 dark:bg-white/[0.04]'}`}
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-900">
                  {item.image || item.imageUrl || item.images?.[0] ? (
                    <img
                      src={item.image || item.imageUrl || item.images?.[0]}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <p className="truncate font-serif text-[16px] font-semibold leading-tight">
                    {item.name || item.title || 'Piece Seconde Vie'}
                  </p>
                  <p className={`mt-1 truncate text-xs ${mutedText}`}>{item.material || 'Bois'}</p>
                  <p className="mt-1 text-sm font-black">
                    {Number(item.price || item.currentPrice || item.startingPrice || 0)} EUR
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <ShoppingBag size={42} strokeWidth={1.1} className={mutedText} />
              <p className={`mt-4 font-serif text-xl ${mutedText}`}>Votre panier est vide.</p>
            </div>
          )}
        </div>

        <div className="border-t border-stone-200 px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4 dark:border-stone-800 md:px-8 md:pb-8">
          <div className={`flex items-center justify-between rounded-2xl px-4 py-3 ${darkMode ? 'bg-white/[0.04]' : 'bg-stone-100 dark:bg-white/[0.04]'}`}>
            <span className={`text-xs font-bold uppercase tracking-[0.14em] ${mutedText}`}>Preparation</span>
            <span className="flex items-center gap-2 text-sm font-black">
              Chargement <ChevronRight size={15} strokeWidth={1.5} />
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function LazyCartPanelIsland({ className = '', darkMode = false } = {}) {
  const [CartPanel, setCartPanel] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [initialEvent, setInitialEvent] = useState(null);
  const [instantShellOpen, setInstantShellOpen] = useState(false);
  const [instantShellClosing, setInstantShellClosing] = useState(false);
  const eventCounterRef = useRef(0);
  const shellTimerRef = useRef(null);

  const ensureCartPanel = useCallback((eventType = 'sv:open-cart', detail = {}) => {
    const id = `${Date.now()}-${eventCounterRef.current += 1}`;
    if (shellTimerRef.current) {
      window.clearTimeout(shellTimerRef.current);
      shellTimerRef.current = null;
    }
    setInstantShellClosing(false);
    setInstantShellOpen(true);
    setInitialEvent({ id, type: eventType, detail });
    if (eventType === 'sv:product-added') {
      setCartCount((currentCount) => Math.max(currentCount + 1, readGuestCartCount() + 1));
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
    setInitialEvent(null);
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

  return (
    <>
      {CartPanel ? (
        <CartPanel className={className} darkMode={darkMode} initialEvent={initialEvent} />
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
        count={cartCount}
        detail={initialEvent?.detail || {}}
        onClose={closeInstantShell}
      />
    </>
  );
}
