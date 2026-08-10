'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MyOrdersView from '../../src/kit/commerce/MyOrdersView';
import { useAuth } from '../../src/kit/contexts/AuthContext';
import { readWishlistIds, subscribeWishlistItems } from '../../src/kit/marketplace/wishlistState';

const readCachedAuthUser = () => (
  typeof window === 'undefined' ? null : window.__svAuthUser || null
);

function AccountDashboardFallback({ darkMode = false, isSignedOut = false }) {
  const openLogin = () => {
    window.dispatchEvent(new CustomEvent('sv:open-login'));
  };

  const canvas = darkMode
    ? 'bg-[#0d0c0b] text-[#f3f1ee]'
    : 'bg-[#f1efec] text-[#1a1918]';
  const wash = darkMode
    ? 'bg-[radial-gradient(1100px_620px_at_8%_-12%,rgba(217,181,141,0.13),transparent_66%),radial-gradient(880px_520px_at_96%_2%,rgba(102,126,150,0.12),transparent_70%)]'
    : 'bg-[radial-gradient(1100px_620px_at_8%_-12%,rgba(196,150,112,0.28),transparent_68%),radial-gradient(880px_520px_at_96%_2%,rgba(122,142,158,0.18),transparent_70%)]';
  const panel = darkMode
    ? 'bg-[#191817] shadow-[0_0_0_0.5px_rgba(255,255,255,0.09),0_1px_1px_rgba(0,0,0,0.34),0_14px_30px_-20px_rgba(0,0,0,0.8)]'
    : 'bg-white shadow-[0_0_0_0.5px_rgba(28,25,23,0.09),0_1px_1px_rgba(28,25,23,0.03),0_10px_26px_-18px_rgba(28,25,23,0.24)]';
  // Ecrin de verre du retour Galerie: reprend --acc-glass de l'espace client.
  const shell = darkMode
    ? 'bg-[rgba(24,23,22,0.74)] backdrop-blur-xl shadow-[0_0_0_0.5px_rgba(255,255,255,0.09),0_1px_1px_rgba(0,0,0,0.34),0_14px_30px_-20px_rgba(0,0,0,0.8)]'
    : 'bg-[rgba(255,255,255,0.76)] backdrop-blur-xl shadow-[0_0_0_0.5px_rgba(28,25,23,0.09),0_1px_1px_rgba(28,25,23,0.03),0_10px_26px_-18px_rgba(28,25,23,0.24)]';
  const skeleton = darkMode ? 'bg-white/[0.07]' : 'bg-[#f0edea]';
  const muted = darkMode ? 'text-[#a6a09a]' : 'text-[#6a635c]';

  return (
    <main className={`relative isolate min-h-screen transition-colors duration-300 ${canvas}`}>
      <div className={`pointer-events-none fixed inset-0 ${wash}`} aria-hidden="true" />

      <div className="relative mx-auto max-w-[1240px] px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-28 lg:pt-7">
        <span className={`inline-flex items-center rounded-full p-1.5 ${shell}`}>
          <Link
            href="/"
            className={`inline-flex h-[34px] items-center gap-2 rounded-full px-[13px] text-[12.5px] font-semibold transition-colors ${panel} ${darkMode ? 'text-[#f3f1ee]' : 'text-[#1a1918]'}`}
          >
            <span aria-hidden="true">←</span>
            Galerie
          </Link>
        </span>

        <section className="grid gap-6 pb-2.5 pt-0.5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,352px)] lg:items-center lg:gap-10 lg:pb-3.5">
          <div className="flex items-center gap-4">
            <span
              className="h-[54px] w-[54px] flex-none rounded-[17px] bg-[linear-gradient(158deg,#a5714d_0%,#7c4a30_58%,#5e3823_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_20px_-10px_rgba(94,56,35,0.72)]"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h1 className="text-[clamp(27px,3.5vw,37px)] font-semibold leading-[1.04] tracking-[-0.03em]">
                {isSignedOut ? 'Votre espace personnel' : 'Ouverture de votre espace'}
              </h1>
              <p className={`mt-2.5 text-[13px] ${muted}`}>
                Commandes, documents, avantages et liste de souhaits au même endroit.
              </p>
            </div>
          </div>

          <div className={`rounded-[18px] p-4 ${panel}`}>
            <p className={`text-[10.5px] font-bold uppercase tracking-[0.13em] ${darkMode ? 'text-[#7b756e]' : 'text-[#9d968e]'}`}>
              {isSignedOut ? 'Connexion requise' : 'Chargement'}
            </p>
            <p className="mt-2.5 text-[17px] font-semibold tracking-[-0.02em]">
              {isSignedOut ? 'Connectez-vous pour continuer' : 'Préparation de votre espace…'}
            </p>
            {isSignedOut ? (
              <button
                type="button"
                onClick={openLogin}
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,#38332f_0%,#1c1a18_100%)] text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_2px_rgba(28,25,23,0.28)] transition-transform duration-200 active:scale-[0.98]"
              >
                Se connecter
              </button>
            ) : (
              <div className={`mt-4 h-11 w-full animate-pulse rounded-full ${skeleton}`} />
            )}
          </div>
        </section>

        <div className={`grid grid-cols-2 gap-px overflow-hidden rounded-[18px] md:grid-cols-4 ${darkMode ? 'bg-white/[0.09]' : 'bg-[rgba(28,25,23,0.09)]'} ${panel}`}>
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className={`min-h-[122px] p-[18px] ${darkMode ? 'bg-[#191817]' : 'bg-white'}`}>
              <div className={`h-[30px] w-[30px] animate-pulse rounded-[9px] ${skeleton}`} />
              <div className={`mt-[38px] h-6 w-16 animate-pulse rounded ${skeleton}`} />
              <div className={`mt-2 h-3 w-20 animate-pulse rounded ${skeleton}`} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function OrdersPageContent({ initialItems = [] }) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);
  const [cachedUser, setCachedUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [wishlistItems, setWishlistItems] = useState(() => (
    readWishlistIds().map((id) => ({ id, originalId: id }))
  ));
  const effectiveUser = user || cachedUser;

  useLayoutEffect(() => {
    setHasMounted(true);
    setCachedUser(readCachedAuthUser());
    try {
      setDarkMode(window.localStorage.getItem('darkMode') === 'true');
    } catch {
      setDarkMode(false);
    }
  }, []);

  useEffect(() => {
    const handleAuthChange = (event) => {
      setCachedUser(event.detail?.user || null);
    };

    window.addEventListener('sv:auth-user-changed', handleAuthChange);
    return () => window.removeEventListener('sv:auth-user-changed', handleAuthChange);
  }, []);

  // Le bascule clair/sombre du header doit repeindre l'espace client sans rechargement.
  useEffect(() => {
    const handleThemeChange = (event) => {
      setDarkMode(Boolean(event.detail?.darkMode));
    };

    window.addEventListener('sv:theme-change', handleThemeChange);
    return () => window.removeEventListener('sv:theme-change', handleThemeChange);
  }, []);

  useEffect(() => {
    return subscribeWishlistItems(
      effectiveUser,
      (items) => setWishlistItems(items),
      (error) => console.error('Account liste de souhaits sync error:', error)
    );
  }, [effectiveUser]);

  if (!hasMounted || (loading && !effectiveUser)) return <AccountDashboardFallback darkMode={darkMode} />;
  if (!effectiveUser || effectiveUser.isAnonymous) {
    return <AccountDashboardFallback darkMode={darkMode} isSignedOut />;
  }

  return (
    <MyOrdersView
      user={effectiveUser}
      onBack={() => { router.push('/'); }}
      darkMode={darkMode}
      activeDesignId="architectural"
      wishlistItems={wishlistItems}
      items={initialItems}
      onOpenWishlist={() => { router.push('/wishlist'); }}
      onLogout={logout}
    />
  );
}

export default function OrdersPageIsland(props) {
  return <OrdersPageContent {...props} />;
}
