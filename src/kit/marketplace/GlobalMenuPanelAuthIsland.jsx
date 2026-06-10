'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ToastProvider } from '../ui/Toast';

const GlobalMenu = dynamic(() => import('../layout/GlobalMenu'), {
  ssr: false,
  loading: () => null,
});

const LegacyLoginModalContent = dynamic(
  () => import('./LegacyLoginModalFullIsland').then((module) => module.LegacyLoginModalContent),
  { ssr: false, loading: () => null },
);

function GlobalMenuPanelAuthContent({ darkMode = false, panelOpen = false, setPanelOpen }) {
  const { user, isAdmin, logout } = useAuth();
  const [authUser, setAuthUser] = useState(() => (
    typeof window === 'undefined' ? null : window.__svAuthUser || null
  ));
  const [loginOpen, setLoginOpen] = useState(false);

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
    window.location.assign(path);
  };

  const openLogin = () => {
    setPanelOpen(false);
    setLoginOpen(true);
  };

  const openCart = () => {
    setPanelOpen(false);
    window.dispatchEvent(new CustomEvent('sv:open-cart'));
  };

  return (
    <>
      {panelOpen ? (
        <GlobalMenu
          isMenuOpen={panelOpen}
          setIsMenuOpen={setPanelOpen}
          currentView="gallery"
          user={user || authUser}
          isAdmin={isAdmin}
          darkMode={darkMode}
          onShowLogin={openLogin}
          onOpenWishlist={() => navigateClient('/wishlist')}
          onOpenCart={openCart}
          cartCount={0}
          wishlistCount={0}
          onLogout={logout}
        />
      ) : null}
      {loginOpen ? <LegacyLoginModalContent open={loginOpen} onOpenChange={setLoginOpen} /> : null}
    </>
  );
}

export default function GlobalMenuPanelAuthIsland(props) {
  return (
    <AuthProvider>
      <ToastProvider>
        <GlobalMenuPanelAuthContent {...props} />
      </ToastProvider>
    </AuthProvider>
  );
}
