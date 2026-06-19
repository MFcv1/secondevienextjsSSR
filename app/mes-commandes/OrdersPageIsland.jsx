'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MyOrdersView from '../../src/kit/commerce/MyOrdersView';
import { useAuth } from '../../src/kit/contexts/AuthContext';

function AccountDashboardFallback({ darkMode = false, isSignedOut = false }) {
  const openLogin = () => {
    window.dispatchEvent(new CustomEvent('sv:open-login'));
  };

  return (
    <main className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#101010] text-[#f5f5f7]' : 'bg-[#f5f5f7] text-[#1d1d1f]'}`}>
      <div className="mx-auto max-w-[1120px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-24">
        <header className="border-b border-[#d2d2d7] pb-5">
          <a
            href="/galerie"
            className="inline-flex min-h-10 items-center rounded-full border border-[#d2d2d7] bg-white px-4 text-[13px] font-medium text-[#1d1d1f] transition-colors hover:border-[#a1a1a6]"
          >
            Retour galerie
          </a>
        </header>

        <section className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-end">
          <div>
            <p className="text-[13px] font-medium text-[#6e6e73]">Espace client</p>
            <h1 className="mt-3 max-w-3xl text-[clamp(2.7rem,7vw,5.4rem)] font-semibold leading-[0.96] tracking-normal text-[#1d1d1f]">
              Vos commandes, simplement.
            </h1>
          </div>
          <div className="rounded-[8px] border border-[#e8e8ed] bg-white p-5">
            <p className="text-[13px] font-medium text-[#6e6e73]">
              {isSignedOut ? 'Connexion requise' : 'Chargement'}
            </p>
            <p className="mt-2 text-[22px] font-semibold text-[#1d1d1f]">
              {isSignedOut ? 'Connectez-vous pour continuer.' : 'Preparation de votre espace...'}
            </p>
            {isSignedOut && (
              <button
                type="button"
                onClick={openLogin}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#1d1d1f] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-black"
              >
                Se connecter
              </button>
            )}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="min-h-[116px] rounded-[8px] border border-[#e8e8ed] bg-white" />
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
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    try {
      setDarkMode(window.localStorage.getItem('darkMode') === 'true');
    } catch {
      setDarkMode(false);
    }
  }, []);

  if (!hasMounted || loading) return <AccountDashboardFallback darkMode={darkMode} />;
  if (!user || user.isAnonymous) {
    return <AccountDashboardFallback darkMode={darkMode} isSignedOut />;
  }

  return (
    <MyOrdersView
      user={user}
      onBack={() => { router.push('/galerie'); }}
      darkMode={darkMode}
      activeDesignId="architectural"
      wishlistItems={[]}
      items={initialItems}
      onOpenWishlist={() => { router.push('/wishlist'); }}
      onLogout={logout}
    />
  );
}

export default function OrdersPageIsland(props) {
  return <OrdersPageContent {...props} />;
}
