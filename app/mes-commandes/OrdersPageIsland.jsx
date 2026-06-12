'use client';

import { useEffect, useState } from 'react';
import MyOrdersView from '../../src/kit/commerce/MyOrdersView';
import { useAuth } from '../../src/kit/contexts/AuthContext';

function AccountDashboardFallback({ darkMode = false, isSignedOut = false }) {
  return (
    <main className={`min-h-screen transition-colors duration-700 ${darkMode ? 'bg-[#151515] text-[#f8f1e8]' : 'bg-[#fbfaf7] text-[#181716]'}`}>
      <div className="mx-auto max-w-[1560px] px-4 pb-16 pt-6 sm:px-6 md:px-10 lg:px-12 lg:pb-24 lg:pt-7">
        <header className="relative mb-6">
          <div className="relative z-10">
            <h1 className="font-serif text-[clamp(2.55rem,6.2vw,4.05rem)] leading-[1.02] tracking-normal">
              Mon espace<span className="text-[#d8552f]">.</span>
            </h1>
            <p className="mt-4 font-serif text-[22px] leading-tight">
              {isSignedOut ? 'Connectez-vous pour continuer.' : 'Chargement de votre espace...'}
            </p>
            <p className={`mt-2 max-w-[440px] text-[15px] leading-[1.65] ${darkMode ? 'text-stone-300' : 'text-[#5f5a55]'}`}>
              Retrouvez ici toutes vos informations, commandes et coups de coeur.
            </p>
            {isSignedOut && (
              <a
                href="/galerie"
                className="mt-7 inline-flex min-h-[52px] items-center justify-center rounded-[4px] bg-[#181716] px-7 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-[0_16px_34px_rgba(24,23,22,0.16)] transition-colors hover:bg-[#2a2825]"
              >
                Retour galerie
              </a>
            )}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="hidden min-w-0 lg:block">
            <div className="rounded-[6px] border border-[#e7ded5] bg-white/58 p-5 shadow-[0_16px_46px_rgba(72,55,39,0.035)]">
              <div className="h-[54px] rounded-[5px] bg-[#f2ede8]" />
              <div className="mt-3 h-[54px] rounded-[5px] bg-[#f8f5f1]" />
              <div className="mt-3 h-[54px] rounded-[5px] bg-[#f8f5f1]" />
            </div>
          </aside>
          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="min-h-[142px] rounded-[6px] border border-[#e7ded5] bg-white/62 shadow-[0_16px_44px_rgba(72,55,39,0.035)] md:min-h-[176px]" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function OrdersPageContent({ initialItems = [] }) {
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

  if (!hasMounted || loading) return null;
  if (!user || user.isAnonymous) {
    return <AccountDashboardFallback darkMode={darkMode} isSignedOut />;
  }

  return (
    <MyOrdersView
      user={user}
      onBack={() => { window.location.href = '/galerie'; }}
      darkMode={darkMode}
      activeDesignId="architectural"
      wishlistItems={[]}
      items={initialItems}
      onOpenWishlist={() => { window.location.href = '/wishlist'; }}
      onLogout={logout}
    />
  );
}

export default function OrdersPageIsland(props) {
  return <OrdersPageContent {...props} />;
}
