'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { getDb, loadFirestoreModule } from '../config/firebaseLazy';
import {
  CART_STATE_CHANGED_EVENT,
  GUEST_CART_CHANGED_EVENT,
  readGuestCart,
} from '../commerce/guestCart';
import { subscribeWishlistItems } from './wishlistState';

const GlobalMenu = dynamic(() => import('../layout/GlobalMenu'), {
  ssr: false,
  loading: () => null,
});

const HOLD_MENU_UNTIL_ROUTE_PATHS = new Set(['/admin']);

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

export function preloadGlobalMenu() {
  GlobalMenu.preload?.();
  return import('../layout/GlobalMenu')
    .then((module) => {
      module.preloadCurrentGlobalMenuView?.();
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
  const pathname = usePathname();
  const [authUser, setAuthUser] = useState(() => (
    typeof window === 'undefined' ? null : window.__svAuthUser || null
  ));
  const [authIsAdmin, setAuthIsAdmin] = useState(() => (
    typeof window === 'undefined' ? false : window.__svAuthIsAdmin === true
  ));
  const [heldNavigationPath, setHeldNavigationPath] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [canHydrateRemoteCounts, setCanHydrateRemoteCounts] = useState(false);
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
      MENU_PREFETCH_PATHS.forEach((path) => {
        router.prefetch(path);
      });
    };

    let idleId = null;
    let fallbackId = null;
    const afterOpenId = window.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(prefetchMenuPaths, { timeout: 1800 });
        return;
      }
      fallbackId = window.setTimeout(prefetchMenuPaths, 700);
    }, 900);

    return () => {
      window.clearTimeout(afterOpenId);
      if (idleId !== null) window.cancelIdleCallback?.(idleId);
      if (fallbackId !== null) window.clearTimeout(fallbackId);
    };
  }, [panelOpen, router]);

  useEffect(() => {
    if (!panelOpen) {
      setCanHydrateRemoteCounts(false);
      return undefined;
    }

    let idleId = null;
    const afterOpenId = window.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(() => setCanHydrateRemoteCounts(true), { timeout: 1800 });
        return;
      }

      setCanHydrateRemoteCounts(true);
    }, 1000);

    return () => {
      window.clearTimeout(afterOpenId);
      if (idleId !== null) window.cancelIdleCallback?.(idleId);
    };
  }, [panelOpen]);

  const effectiveUser = authUser;
  const effectiveIsAdmin = authIsAdmin;
  const signedUser = effectiveUser && !effectiveUser.isAnonymous ? effectiveUser : null;

  useEffect(() => {
    if (!heldNavigationPath) return;
    if (pathname === heldNavigationPath || pathname?.startsWith(`${heldNavigationPath}/`)) {
      closeForAction();
      setHeldNavigationPath(null);
    }
  }, [closeForAction, heldNavigationPath, pathname]);

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
    if (!signedUser?.uid || !canHydrateRemoteCounts) return undefined;

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
  }, [canHydrateRemoteCounts, signedUser?.uid]);

  useEffect(() => (
    subscribeWishlistItems(
      signedUser,
      (_items, ids) => setWishlistCount(ids.length),
      (error) => {
        console.error('Global menu liste de souhaits sync error:', error);
        setWishlistCount(0);
      }
    )
  ), [signedUser]);

  const navigateClient = useCallback((path) => {
    if (!path) return;
    const targetPath = path.split(/[?#]/)[0] || '/';
    if (HOLD_MENU_UNTIL_ROUTE_PATHS.has(targetPath) && pathname !== targetPath) {
      setHeldNavigationPath(targetPath);
      router.push(path);
      return;
    }
    closeForAction();
    window.requestAnimationFrame(() => {
      router.push(path);
    });
  }, [closeForAction, pathname, router]);

  const openLogin = async () => {
    const { preloadLoginModal } = await import('./HeaderAccountIsland');
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
