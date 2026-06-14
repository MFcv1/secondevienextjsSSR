'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ToastProvider } from '../ui/Toast';

const GlobalMenu = dynamic(() => import('../layout/GlobalMenu'), {
  ssr: false,
  loading: () => null,
});

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

  const navigateClient = (path) => {
    setPanelOpen(false);
    router.push(path);
  };

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
