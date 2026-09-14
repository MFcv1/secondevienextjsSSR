'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getDb, loadFirestoreModule } from '../config/firebaseLazy';
import { abortableDelay, catalogVersionChannel, fetchCatalogWithRetry, isVersionAtLeast } from './catalogLiveSync';

const isProductReturnSettling = () => {
  if (document.documentElement.hasAttribute('data-product-return-pending')) return true;
  try {
    const href = window.location.pathname + window.location.search + window.location.hash;
    if (window.sessionStorage.getItem('secondevie:product-return-pending:v1') !== href) return false;
    const saved = JSON.parse(window.sessionStorage.getItem('secondevie:product-return:v1') || 'null');
    const committedAt = Number(saved?.committedAt || 0);
    return committedAt <= 0 || Date.now() - committedAt <= 5000;
  } catch { return false; }
};

export default function CatalogVersionSyncIsland({ revision, aggregateSha256 }) {
  const router = useRouter();
  const pathname = usePathname();
  const rendered = useRef({ revision, aggregateSha256 });
  useEffect(() => { rendered.current = { revision, aggregateSha256 }; }, [revision, aggregateSha256]);

  useEffect(() => {
    let disposed = false;
    let unsubscribe = null;
    let connection = 0;
    let retryTimer;
    let failures = 0;
    let job;
    let lastRefresh = '';
    let observedRevision = Number(rendered.current.revision) || 0;
    const visible = () => !disposed && document.visibilityState === 'visible';

    const reconcile = async (expected) => {
      job?.abort();
      const controller = new AbortController();
      job = controller;
      const payload = await fetchCatalogWithRetry('/api/catalog/version', {
        signal: controller.signal,
        accept: (value) => Number(value?.revision) > 0 && Boolean(value.aggregateSha256)
          && Number(value.revision) >= Math.max(observedRevision, Number(rendered.current.revision) || 0)
          && (!expected || isVersionAtLeast(value, expected)),
      });
      if (!payload || controller.signal.aborted || !visible()) return;
      observedRevision = Number(payload.revision);
      // Defer delivery while the product return restores scroll, instead of losing it.
      for (let attempt = 0; isProductReturnSettling() && attempt < 30; attempt += 1) {
        try { await abortableDelay(1000, controller.signal); } catch { return; }
      }
      if (controller.signal.aborted || !visible() || isProductReturnSettling()) return;
      catalogVersionChannel.publish(payload);
      if (payload.aggregateSha256 !== rendered.current.aggregateSha256
          && Number(payload.revision) >= Number(rendered.current.revision)
          && lastRefresh !== payload.aggregateSha256) {
        lastRefresh = payload.aggregateSha256;
        window.dispatchEvent(new CustomEvent('sv:catalog-version-changed', { detail: payload }));
        router.refresh();
      }
    };

    const stopSignal = () => {
      connection += 1;
      unsubscribe?.();
      unsubscribe = null;
      clearTimeout(retryTimer);
    };

    const startSignal = async () => {
      if (!visible()) return;
      stopSignal();
      const requestId = connection;
      const failed = () => {
        if (disposed || requestId !== connection) return;
        stopSignal();
        // Retry an actual listener failure, with a finite budget.
        if (visible() && failures < 6) {
          retryTimer = setTimeout(() => {
            void reconcile();
            void startSignal();
          }, Math.min(1000 * (2 ** failures++), 30000));
        }
      };
      try {
        const [db, { doc, onSnapshot }] = await Promise.all([getDb(), loadFirestoreModule()]);
        if (!visible() || requestId !== connection) return;
        unsubscribe = onSnapshot(doc(db, 'sys_catalog_live', 'current'), (snapshot) => {
          if (!visible() || requestId !== connection || !snapshot.exists()) return;
          // On reconnect the last impact can hide intervening route changes.
          void reconcile(snapshot.data());
        }, failed);
      } catch { failed(); }
    };

    const resume = () => {
      if (!visible()) { stopSignal(); job?.abort(); return; }
      failures = 0;
      lastRefresh = '';
      void reconcile();
      void startSignal();
    };
    resume();
    window.addEventListener('pageshow', resume);
    window.addEventListener('online', resume);
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      disposed = true;
      stopSignal();
      job?.abort();
      window.removeEventListener('pageshow', resume);
      window.removeEventListener('online', resume);
      window.removeEventListener('focus', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [pathname, router]);

  return null;
}
