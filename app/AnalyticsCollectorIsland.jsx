'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '../src/kit/contexts/AuthContext';
import AnalyticsProvider from '../src/kit/shared/AnalyticsProvider';

const resolveTrackedPage = (pathname) => {
  if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) return null;
  if (pathname === '/' || pathname === '/galerie') return { view: 'gallery' };
  if (pathname.startsWith('/categorie/')) return { view: 'category', itemId: decodeURIComponent(pathname.slice('/categorie/'.length)) };
  if (pathname.startsWith('/produit/')) return { view: 'detail', itemId: decodeURIComponent(pathname.slice('/produit/'.length)) };
  if (pathname === '/a-propos') return { view: 'about' };
  if (pathname === '/devis') return { view: 'quote' };
  if (pathname === '/recherche') return { view: 'search' };
  if (pathname === '/wishlist') return { view: 'wishlist' };
  if (pathname === '/checkout') return { view: 'checkout' };
  if (pathname === '/mes-commandes') return { view: 'my-orders' };
  return null;
};

export default function AnalyticsCollectorIsland() {
  const pathname = usePathname();
  const trackedPage = useMemo(() => resolveTrackedPage(pathname), [pathname]);

  if (!trackedPage) return null;

  return (
    <AuthProvider forceInitialize ensureAnonymous deferUntilReady={false}>
      <AnalyticsProvider view={trackedPage.view} selectedItemId={trackedPage.itemId} />
    </AuthProvider>
  );
}
