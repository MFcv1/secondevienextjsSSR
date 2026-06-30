'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { getDb, loadFirestoreModule } from '../config/firebaseLazy';
import {
  CART_STATE_CHANGED_EVENT,
  GUEST_CART_CHANGED_EVENT,
  readGuestCart,
} from '../commerce/guestCart';
import { preloadLoginModal } from './HeaderAccountIsland';

const GlobalMenu = dynamic(() => import('../layout/GlobalMenu'), {
  ssr: false,
  loading: () => null,
});

const WISHLIST_STORAGE_KEY = 'sv_public_product_wishlist';
const WISHLIST_CHANGED_EVENT = 'sv:wishlist-state-changed';

const MENU_PREFETCH_PATHS = [
  '/',
  '/galerie',
  '/#gallery-pieces',
  '/#gallery-small-prices',
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
  GlobalMenu.preload?.();
  return import('../layout/GlobalMenu')
    .then((module) => {
      module.preloadGlobalMenuImages?.();
      return module;
    });
}

function GlobalMenuPanelAuthContent({
  darkMode = false,
  panelOpen = false,
  isMenuClosing = false,
  keepMounted = false,
  setPanelOpen,
  closePanelInstantly,
}) {
  const router = useRouter();
  const [authUser, setAuthUser] = useState(() => (
    typeof window === 'undefined' ? null : window.__svAuthUser || null
  ));
  const [authIsAdmin, setAuthIsAdmin] = useState(() => (
    typeof window === 'undefined' ? false : window.__svAuthIsAdmin === true
  ));
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const closeForAction = useCallback(() => {
    if (closePanelInstantly) {
      closePanelInstantly();
      return;
    }
    setPanelOpen(false);
  }, [closePanelInstantly, setPanelOpen]);

  useEffect(() => {
    const handleAuthChange = (event) => {
      setAuthUser(event.detail?.user || null);
    };
    const handleAdminChange = (event) => {
      setAuthIsAdmin(event.detail?.isAdmin === true);
    };

    window.addEventListener('sv:auth-user-changed', handleAuthChange);
    window.addEventListener('sv:auth-admin-changed', handleAdminChange);
    return () => {
      window.removeEventListener('sv:auth-user-changed', handleAuthChange);
      window.removeEventListener('sv:auth-admin-changed', handleAdminChange);
    };
  }, []);

  useEffect(() => {
    if (!panelOpen) return;

    const prefetchMenuPaths = () => {
      preloadLoginModal();
      MENU_PREFETCH_PATHS.forEach((path) => {
        router.prefetch(path);
      });
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(prefetchMenuPaths, { timeout: 1200 });
      return () => window.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(prefetchMenuPaths, 650);
    return () => window.clearTimeout(timeoutId);
  }, [panelOpen, router]);

  const effectiveUser = authUser;
  const effectiveIsAdmin = authIsAdmin;
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
    closeForAction();
    router.push(path);
  }, [closeForAction, router]);

  const openLogin = async () => {
    await preloadLoginModal();
    closeForAction();
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('sv:open-login'));
    });
  };

  const openCart = () => {
    closeForAction();
    window.dispatchEvent(new CustomEvent('sv:open-cart'));
  };

  const logout = async () => {
    window.__svAuthUser = null;
    window.__svAuthIsAdmin = false;
    setAuthUser(null);
    setAuthIsAdmin(false);
    window.dispatchEvent(new CustomEvent('sv:auth-user-changed', { detail: { user: null } }));
    window.dispatchEvent(new CustomEvent('sv:auth-admin-changed', { detail: { isAdmin: false } }));
    const { getFirebaseAuth, loadAuthModule } = await import('../config/firebaseLazy');
    const auth = await getFirebaseAuth();
    const { signOut } = await loadAuthModule();
    await signOut(auth);
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
    <GlobalMenuPanelAuthContent {...props} />
  );
}
