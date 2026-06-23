'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { getDb, loadFirestoreModule } from '../config/firebaseLazy';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import {
  CART_STATE_CHANGED_EVENT,
  GUEST_CART_CHANGED_EVENT,
  readGuestCart,
} from '../commerce/guestCart';
import { ToastProvider } from '../ui/Toast';

const GlobalMenu = dynamic(() => import('../layout/GlobalMenu'), {
  ssr: false,
  loading: () => null,
});

const WISHLIST_STORAGE_KEY = 'sv_public_product_wishlist';
const WISHLIST_CHANGED_EVENT = 'sv:wishlist-state-changed';

const MENU_PREFETCH_PATHS = [
  '/galerie',
  '/galerie#gallery-pieces',
  '/galerie#gallery-small-prices',
  '/categorie/meubles',
  '/categorie/buffets',
  '/categorie/armoires',
  '/categorie/commodes',
  '/categorie/tables',
  '/categorie/assises',
  '/categorie/chaises',
  '/categorie/fauteuils',
  '/categorie/bancs',
  '/categorie/eclairage',
  '/categorie/decorations',
  '/categorie/deco',
  '/categorie/miroirs',
  '/a-propos',
  '/devis',
  '/mes-commandes',
  '/wishlist',
];

const readPublicWishlist = () => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

export function preloadGlobalMenu() {
  return GlobalMenu.preload?.();
}

function GlobalMenuPanelAuthContent({
  darkMode = false,
  panelOpen = false,
  isMenuClosing = false,
  keepMounted = false,
  setPanelOpen,
}) {
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const [authUser, setAuthUser] = useState(() => (
    typeof window === 'undefined' ? null : window.__svAuthUser || null
  ));
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    if (user) {
      setAuthUser(user);
    }
  }, [user]);

  useEffect(() => {
    const handleAuthChange = (event) => {
      setAuthUser(event.detail?.user || null);
    };

    window.addEventListener('sv:auth-user-changed', handleAuthChange);
    return () => window.removeEventListener('sv:auth-user-changed', handleAuthChange);
  }, []);

  useEffect(() => {
    if (!panelOpen) return;
    MENU_PREFETCH_PATHS.forEach((path) => {
      router.prefetch(path);
    });
  }, [panelOpen, router]);

  const effectiveUser = user || authUser;
  const effectiveIsAdmin = isAdmin;
  const signedUser = effectiveUser && !effectiveUser.isAnonymous ? effectiveUser : null;

  useEffect(() => {
    if (signedUser?.uid) return undefined;

    const refreshGuestCartCount = (event) => {
      const items = Array.isArray(event?.detail?.items) ? event.detail.items : readGuestCart();
      setCartCount(items.length);
    };

    refreshGuestCartCount();
    window.addEventListener(GUEST_CART_CHANGED_EVENT, refreshGuestCartCount);
    window.addEventListener(CART_STATE_CHANGED_EVENT, refreshGuestCartCount);

    return () => {
      window.removeEventListener(GUEST_CART_CHANGED_EVENT, refreshGuestCartCount);
      window.removeEventListener(CART_STATE_CHANGED_EVENT, refreshGuestCartCount);
    };
  }, [signedUser?.uid]);

  useEffect(() => {
    if (!signedUser?.uid) return undefined;

    let cancelled = false;
    let unsubscribe = null;

    Promise.all([getDb(), loadFirestoreModule()])
      .then(([db, { collection, onSnapshot, query }]) => {
        if (cancelled) return;
        unsubscribe = onSnapshot(
          query(collection(db, 'users', signedUser.uid, 'cart')),
          (snap) => setCartCount(snap.size),
          (error) => {
            console.error('Global menu cart count sync error:', error);
            setCartCount(0);
          }
        );
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Global menu cart count sync error:', error);
          setCartCount(0);
        }
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [signedUser?.uid]);

  useEffect(() => {
    if (signedUser?.uid) return undefined;

    const refreshPublicWishlistCount = (event) => {
      const items = Array.isArray(event?.detail?.items) ? event.detail.items : readPublicWishlist();
      setWishlistCount(items.length);
    };

    refreshPublicWishlistCount();
    window.addEventListener(WISHLIST_CHANGED_EVENT, refreshPublicWishlistCount);
    window.addEventListener('storage', refreshPublicWishlistCount);

    return () => {
      window.removeEventListener(WISHLIST_CHANGED_EVENT, refreshPublicWishlistCount);
      window.removeEventListener('storage', refreshPublicWishlistCount);
    };
  }, [signedUser?.uid]);

  useEffect(() => {
    if (!signedUser?.uid) return undefined;

    let cancelled = false;
    let unsubscribe = null;

    Promise.all([getDb(), loadFirestoreModule()])
      .then(([db, { collection, onSnapshot, query }]) => {
        if (cancelled) return;
        unsubscribe = onSnapshot(
          query(collection(db, 'users', signedUser.uid, 'wishlist')),
          (snap) => setWishlistCount(snap.size),
          (error) => {
            console.error('Global menu wishlist count sync error:', error);
            setWishlistCount(0);
          }
        );
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Global menu wishlist count sync error:', error);
          setWishlistCount(0);
        }
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [signedUser?.uid]);

  const navigateClient = useCallback((path) => {
    if (!path) return;
    setPanelOpen(false);
    router.push(path);
  }, [router, setPanelOpen]);

  const openLogin = () => {
    window.dispatchEvent(new CustomEvent('sv:open-login'));
    setPanelOpen(false);
  };

  const openCart = () => {
    setPanelOpen(false);
    window.dispatchEvent(new CustomEvent('sv:open-cart'));
  };

  return (
    <>
      {panelOpen || isMenuClosing || keepMounted ? (
        <GlobalMenu
          isMenuOpen={panelOpen}
          isMenuClosing={isMenuClosing}
          keepMounted={keepMounted}
          setIsMenuOpen={setPanelOpen}
          currentView="gallery"
          user={effectiveUser}
          isAdmin={effectiveIsAdmin}
          darkMode={darkMode}
          onNavigate={navigateClient}
          onShowLogin={openLogin}
          onOpenWishlist={() => navigateClient('/wishlist')}
          onOpenCart={openCart}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={logout}
        />
      ) : null}
    </>
  );
}

export default function GlobalMenuPanelAuthIsland(props) {
  return (
    <AuthProvider forceInitialize deferUntilReady={false}>
      <ToastProvider>
        <GlobalMenuPanelAuthContent {...props} />
      </ToastProvider>
    </AuthProvider>
  );
}
