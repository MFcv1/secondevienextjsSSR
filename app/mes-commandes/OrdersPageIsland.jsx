'use client';

import { useEffect, useState } from 'react';
import MyOrdersView from '../../src/kit/commerce/MyOrdersView';
import { useAuth } from '../../src/kit/contexts/AuthContext';

const ACCOUNT_HERO_IMAGE = '/images/newsletter/discount-sideboard.webp';

function AccountAccessPreview() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-5 text-[#181716] sm:px-6 md:px-10 lg:px-12">
      <section className="mx-auto grid max-w-[1440px] items-center gap-7 lg:min-h-[calc(100vh-40px)] lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div className="order-2 space-y-7 lg:order-1">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#9A714C]">Espace client</p>
          <div>
            <h1 className="font-serif text-[clamp(3.1rem,10vw,7rem)] leading-[0.96] tracking-normal">
              Mon espace<span className="text-[#d8552f]">.</span>
            </h1>
            <p className="mt-6 max-w-[520px] text-[17px] leading-8 text-[#5f5a55]">
              Retrouvez vos informations, vos commandes et vos coups de coeur dans votre espace personnel.
            </p>
          </div>
          <a
            href="/galerie"
            className="inline-flex min-h-[58px] items-center justify-center rounded-[4px] bg-[#181716] px-8 text-[12px] font-black uppercase tracking-[0.2em] text-white shadow-[0_16px_34px_rgba(24,23,22,0.16)] transition-colors hover:bg-[#2a2825]"
          >
            Retour galerie
          </a>
        </div>

        <div className="order-1 overflow-hidden rounded-[10px] bg-[#eee6dc] shadow-[0_18px_52px_rgba(72,55,39,0.08)] lg:order-2">
          <img
            src={ACCOUNT_HERO_IMAGE}
            alt=""
            className="h-[38vh] min-h-[300px] w-full object-cover object-center md:h-[52vh] lg:h-[calc(100vh-40px)]"
          />
        </div>
      </section>
    </main>
  );
}

function OrdersPageContent({ initialItems = [] }) {
  const { user, loading, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    try {
      setDarkMode(window.localStorage.getItem('darkMode') === 'true');
    } catch {
      setDarkMode(false);
    }
  }, []);

  if (loading) return <div className="min-h-screen bg-[#FAFAF9]" />;
  if (!user || user.isAnonymous) {
    return <AccountAccessPreview />;
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
