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
  const checkAbortRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const signalRequestIdRef = useRef(0);
  const activeRef = useRef(true);

  useEffect(() => {
    renderedVersionRef.current = aggregateSha256;
    refreshedVersionsRef.current.delete(aggregateSha256);
  }, [aggregateSha256, revision]);

  const refreshForVersion = useCallback((nextVersion) => {
    if (!activeRef.current) return;
    if (!nextVersion || nextVersion === renderedVersionRef.current) return;
    if (refreshedVersionsRef.current.has(nextVersion)) return;
    refreshedVersionsRef.current.add(nextVersion);
    window.dispatchEvent(new CustomEvent('sv:catalog-version-changed', {
      detail: { aggregateSha256: nextVersion },
    }));
    router.refresh();
  }, [router]);

  const checkVersion = useCallback(() => {
    if (!activeRef.current) return Promise.resolve(null);
    if (checkingRef.current) return checkingRef.current;
    const controller = new AbortController();
    checkAbortRef.current = controller;
    let request = null;
    request = fetch('/api/catalog/version', {
      cache: 'no-store',
      headers: { 'if-none-match': `"${renderedVersionRef.current}"` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!activeRef.current || controller.signal.aborted) return;
        if (response.status === 304 || !response.ok) return;
        const payload = await response.json();
        if (!activeRef.current || controller.signal.aborted) return;
        refreshForVersion(payload.aggregateSha256);
      })
      .catch(() => null)
      .finally(() => {
        if (checkingRef.current === request) checkingRef.current = null;
        if (checkAbortRef.current === controller) checkAbortRef.current = null;
      });
    checkingRef.current = request;
    return request;
  }, [refreshForVersion]);

  const stopSignal = useCallback(() => {
    signalRequestIdRef.current += 1;
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
  }, []);

  const startSignal = useCallback(async () => {
    if (!activeRef.current || document.visibilityState !== 'visible' || unsubscribeRef.current) return;
    const requestId = signalRequestIdRef.current + 1;
    signalRequestIdRef.current = requestId;
    try {
      const [db, { doc, onSnapshot }] = await Promise.all([getDb(), loadFirestoreModule()]);
      if (
        !activeRef.current
        || requestId !== signalRequestIdRef.current
        || document.visibilityState !== 'visible'
        || unsubscribeRef.current
      ) return;
      unsubscribeRef.current = onSnapshot(doc(db, 'sys_catalog_live', 'current'), (snapshot) => {
        if (!activeRef.current) return;
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
    activeRef.current = true;
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
      activeRef.current = false;
      checkAbortRef.current?.abort();
      checkAbortRef.current = null;
      checkingRef.current = null;
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
