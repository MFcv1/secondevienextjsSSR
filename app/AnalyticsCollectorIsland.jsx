'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

const ANALYTICS_RUNTIME_IDLE_TIMEOUT_MS = 1000;
let analyticsRuntimeRequest = null;

const loadAnalyticsRuntime = () => {
  if (!analyticsRuntimeRequest) {
    analyticsRuntimeRequest = import('../src/kit/shared/AnalyticsRuntimeIsland')
      .then((module) => module.default)
      .catch((error) => {
        analyticsRuntimeRequest = null;
        throw error;
      });
  }
  return analyticsRuntimeRequest;
};

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
  const shouldLoadAnalytics = Boolean(trackedPage);
  const [AnalyticsRuntime, setAnalyticsRuntime] = useState(null);

  useEffect(() => {
    if (!shouldLoadAnalytics || AnalyticsRuntime) return undefined;

    let active = true;
    let idleId = null;
    let timeoutId = null;
    const start = () => {
      loadAnalyticsRuntime()
        .then((Runtime) => {
          if (active) setAnalyticsRuntime(() => Runtime);
        })
        .catch((error) => console.error('Analytics runtime load error:', error));
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(start, { timeout: ANALYTICS_RUNTIME_IDLE_TIMEOUT_MS });
    } else {
      timeoutId = window.setTimeout(start, 0);
    }

    return () => {
      active = false;
      if (idleId !== null) window.cancelIdleCallback?.(idleId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [AnalyticsRuntime, shouldLoadAnalytics]);

  if (!trackedPage || !AnalyticsRuntime) return null;

  return <AnalyticsRuntime trackedPage={trackedPage} />;
}
