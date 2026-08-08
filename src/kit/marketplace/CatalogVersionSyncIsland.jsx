'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getDb, loadFirestoreModule } from '../config/firebaseLazy';

const PRODUCT_RETURN_PENDING_KEY = 'secondevie:product-return-pending:v1';
const PRODUCT_RETURN_KEY = 'secondevie:product-return:v1';
const PRODUCT_RETURN_PENDING_ATTRIBUTE = 'data-product-return-pending';
const PRODUCT_RETURN_COMMIT_SURVIVAL_MS = 5000;
const SIGNAL_CONFIRMATION_DELAYS_MS = [0, 400, 1200, 2500];

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

const currentHref = () => (
  window.location.pathname + (window.location.search || '') + (window.location.hash || '')
);

const isProductReturnSettling = () => {
  if (document.documentElement.hasAttribute(PRODUCT_RETURN_PENDING_ATTRIBUTE)) return true;

  try {
    if (window.sessionStorage.getItem(PRODUCT_RETURN_PENDING_KEY) !== currentHref()) return false;
    const raw = window.sessionStorage.getItem(PRODUCT_RETURN_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    const committedAt = Number(saved?.committedAt || 0);
    return committedAt <= 0 || Date.now() - committedAt <= PRODUCT_RETURN_COMMIT_SURVIVAL_MS;
  } catch {
    return false;
  }
};

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
    if (isProductReturnSettling()) return;
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

  const confirmSignaledVersion = useCallback(async (expectedAggregateSha256, requestId) => {
    for (const delayMs of SIGNAL_CONFIRMATION_DELAYS_MS) {
      if (!activeRef.current || requestId !== signalRequestIdRef.current) return false;
      if (delayMs) await wait(delayMs);
      if (!activeRef.current || requestId !== signalRequestIdRef.current) return false;
      try {
        const response = await fetch('/api/catalog/version', {
          cache: 'no-store',
          headers: { accept: 'application/json' },
        });
        if (!response.ok) continue;
        const payload = await response.json();
        if (payload.aggregateSha256 !== expectedAggregateSha256) continue;
        refreshForVersion(expectedAggregateSha256);
        return true;
      } catch {
        // Une confirmation bornee suivante couvre une instance API momentanement en retard.
      }
    }
    return false;
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
        void confirmSignaledVersion(signal.aggregateSha256, requestId);
      }, () => {
        stopSignal();
      });
    } catch {
      stopSignal();
    }
  }, [confirmSignaledVersion, routeId, routeKind, stopSignal]);

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
