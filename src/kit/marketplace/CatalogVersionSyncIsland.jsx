'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getDb, loadFirestoreModule } from '../config/firebaseLazy';

const isSignalRelevant = (signal, routeKind, routeId) => {
  if (!signal || signal.full === true) return Boolean(signal);
  if (routeKind === 'gallery') return signal.affectsGallery === true;
  if (routeKind === 'search') return signal.affectsSearch === true;
  if (routeKind === 'product') return (signal.changedProductIds || []).includes(routeId);
  if (routeKind === 'category') return (signal.affectedCategoryIds || []).includes(routeId);
  return false;
};

export default function CatalogVersionSyncIsland({
  revision,
  aggregateSha256,
  routeKind,
  routeId = '',
}) {
  const router = useRouter();
  const pathname = usePathname();
  const renderedVersionRef = useRef(aggregateSha256);
  const refreshedVersionsRef = useRef(new Set());
  const checkingRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    renderedVersionRef.current = aggregateSha256;
    refreshedVersionsRef.current.delete(aggregateSha256);
  }, [aggregateSha256, revision]);

  const refreshForVersion = useCallback((nextVersion) => {
    if (!nextVersion || nextVersion === renderedVersionRef.current) return;
    if (refreshedVersionsRef.current.has(nextVersion)) return;
    refreshedVersionsRef.current.add(nextVersion);
    window.dispatchEvent(new CustomEvent('sv:catalog-version-changed', {
      detail: { aggregateSha256: nextVersion },
    }));
    router.refresh();
  }, [router]);

  const checkVersion = useCallback(() => {
    if (checkingRef.current) return checkingRef.current;
    checkingRef.current = fetch('/api/catalog/version', {
      cache: 'no-store',
      headers: { 'if-none-match': `"${renderedVersionRef.current}"` },
    })
      .then(async (response) => {
        if (response.status === 304 || !response.ok) return;
        const payload = await response.json();
        refreshForVersion(payload.aggregateSha256);
      })
      .catch(() => null)
      .finally(() => {
        checkingRef.current = null;
      });
    return checkingRef.current;
  }, [refreshForVersion]);

  const stopSignal = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
  }, []);

  const startSignal = useCallback(async () => {
    if (document.visibilityState !== 'visible' || unsubscribeRef.current) return;
    try {
      const [db, { doc, onSnapshot }] = await Promise.all([getDb(), loadFirestoreModule()]);
      if (document.visibilityState !== 'visible' || unsubscribeRef.current) return;
      unsubscribeRef.current = onSnapshot(doc(db, 'sys_catalog_live', 'current'), (snapshot) => {
        const signal = snapshot.exists() ? snapshot.data() : null;
        if (!isSignalRelevant(signal, routeKind, routeId)) return;
        refreshForVersion(signal.aggregateSha256);
      }, () => {
        stopSignal();
      });
    } catch {
      stopSignal();
    }
  }, [refreshForVersion, routeId, routeKind, stopSignal]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
        startSignal();
      } else {
        stopSignal();
      }
    };
    const onPageShow = () => checkVersion();
    onVisibility();
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopSignal();
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [checkVersion, startSignal, stopSignal]);

  useEffect(() => {
    checkVersion();
  }, [checkVersion, pathname]);

  return null;
}
