'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ToastProvider } from '../ui/Toast';

const GlobalMenu = dynamic(() => import('../layout/GlobalMenu'), {
  ssr: false,
  loading: () => null,
});

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

  const effectiveUser = user || authUser;
  const effectiveIsAdmin = isAdmin;

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
          cartCount={0}
          wishlistCount={0}
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
