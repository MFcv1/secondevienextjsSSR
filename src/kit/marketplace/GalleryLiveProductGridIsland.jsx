'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import GalleryProductCardServer from './GalleryProductCardServer';
import { ProductGridMoreButtonIsland } from './GalleryFixedSectionsInteractions';
import { isSoldOut } from '../commerce/purchasability';
import { catalogVersionChannel, fetchCatalogWithRetry, isVersionAtLeast } from './catalogLiveSync';

const PRODUCT_GRID_INITIAL_COUNT = 10;

const getFocusedProductId = () => new URLSearchParams(window.location.search).get('focusProduct') || '';

const getPublishedItems = (items) => (
  Array.isArray(items) ? items.filter((item) => item?.status === 'published') : []
);

const getItemPrice = (item) => Number(item?.currentPrice || item?.price || item?.startingPrice || 0);

const getItemCreatedTime = (item) => {
  const value = item?.createdAt;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (Number.isFinite(Number(value?.seconds))) {
    return (Number(value.seconds) * 1000) + (Number(value.nanoseconds || 0) / 1e6);
  }
  const parsed = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const selectItems = (items, mode) => {
  const published = getPublishedItems(items);
  if (mode === 'small-prices') {
    return published
      .filter((item) => getItemPrice(item) > 0 && getItemPrice(item) <= 250)
      .sort((a, b) => {
        const orderA = a?.petitsPrixOrder !== undefined ? a.petitsPrixOrder : 999999;
        const orderB = b?.petitsPrixOrder !== undefined ? b.petitsPrixOrder : 999999;
        if (orderA !== orderB) return orderA - orderB;
        return getItemPrice(a) - getItemPrice(b);
      });
  }
  return published.sort((a, b) => {
    const orderA = a?.nouveautesOrder !== undefined ? a.nouveautesOrder : 999999;
    const orderB = b?.nouveautesOrder !== undefined ? b.nouveautesOrder : 999999;
    if (orderA !== orderB) return orderA - orderB;
    return getItemCreatedTime(b) - getItemCreatedTime(a)
      || String(a?.id || '').localeCompare(String(b?.id || ''));
  });
};

export default function GalleryLiveProductGridIsland({
  sectionId,
  initialItems = [],
  initialCatalogVersion = '',
  initialCatalogRevision = 0,
  mode = 'newest',
  badgeLabel = '',
  darkMode = false,
  hideWhenEmpty = false,
} = {}) {
  const [release, setRelease] = useState({
    aggregateSha256: initialCatalogVersion,
    items: initialItems,
  });
  const [focusedProductId, setFocusedProductId] = useState('');
  const [focusedProduct, setFocusedProduct] = useState(null);
  const focusRevealedRef = useRef(false);
  const appliedVersionRef = useRef({ aggregateSha256: initialCatalogVersion, revision: initialCatalogRevision });

  useEffect(() => {
    if (Number(initialCatalogRevision) < Number(appliedVersionRef.current.revision)) return;
    appliedVersionRef.current = { aggregateSha256: initialCatalogVersion, revision: initialCatalogRevision };
    setRelease({ aggregateSha256: initialCatalogVersion, items: initialItems });
  }, [initialCatalogVersion, initialCatalogRevision, initialItems]);
  const releaseItems = useMemo(() => {
    if (!focusedProduct?.id || release.items.some((item) => item?.id === focusedProduct.id)) {
      return release.items;
    }
    return [focusedProduct, ...release.items];
  }, [focusedProduct, release.items]);
  const items = useMemo(() => selectItems(releaseItems, mode), [mode, releaseItems]);

  useEffect(() => {
    if (mode !== 'newest') return undefined;
    const productId = getFocusedProductId();
    setFocusedProductId(productId);
    if (!productId
        || focusedProduct?.id === productId
        || release.items.some((item) => item?.id === productId)) return undefined;

    const controller = new AbortController();
    fetch(`/api/catalog?id=${encodeURIComponent(productId)}`, {
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (payload?.product?.id === productId) setFocusedProduct(payload.product);
      })
      .catch(() => null);
    return () => controller.abort();
  }, [focusedProduct?.id, mode, release.items]);

  useEffect(() => {
    if (!focusedProductId || focusRevealedRef.current) return undefined;
    let timer;
    let focusedCard;
    const frame = window.requestAnimationFrame(() => {
      const grid = document.getElementById(`${sectionId}-grid`);
      const card = [...(grid?.querySelectorAll('[data-gallery-product-card][data-product-id]') || [])]
        .find((candidate) => candidate.dataset.productId === focusedProductId);
      if (!card) return;
      const gridItem = card.closest('[data-product-grid-item]');
      if (gridItem) gridItem.hidden = false;
      focusRevealedRef.current = true;
      focusedCard = card;
      const url = new URL(window.location.href);
      url.searchParams.delete('focusProduct');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
      card.setAttribute('data-publication-focus', 'true');
      card.scrollIntoView({
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center',
      });
      timer = window.setTimeout(() => card.removeAttribute('data-publication-focus'), 5000);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      focusedCard?.removeAttribute('data-publication-focus');
    };
  }, [focusedProductId, items, sectionId]);

  useEffect(() => {
    const section = document.getElementById(sectionId);
    if (section && hideWhenEmpty) section.hidden = items.length === 0;
  }, [hideWhenEmpty, items.length, sectionId]);

  useEffect(() => {
    let job;
    const onCatalogVersionChanged = async (expected) => {
      if (!expected?.aggregateSha256) return;
      if (expected.aggregateSha256 === appliedVersionRef.current.aggregateSha256
          || Number(expected.revision) < Number(appliedVersionRef.current.revision)) return;
      job?.abort();
      const controller = new AbortController();
      job = controller;
      const payload = await fetchCatalogWithRetry('/api/catalog?scope=cards&limit=48', {
        signal: controller.signal,
        accept: (value) => isVersionAtLeast(value, expected)
          && Array.isArray(value?.collections?.furniture),
      });
      if (controller.signal.aborted || !payload) return;
      if (Number(payload.revision) < Number(appliedVersionRef.current.revision)) return;
      appliedVersionRef.current = { aggregateSha256: payload.aggregateSha256, revision: payload.revision };
      setRelease({
        aggregateSha256: payload.aggregateSha256,
        items: payload.collections.furniture,
      });
    };
    // Replay covers a signal arriving before this island hydrates.
    const unsubscribe = catalogVersionChannel.subscribe(onCatalogVersionChanged);
    return () => {
      job?.abort();
      unsubscribe();
    };
  }, [initialCatalogVersion, initialCatalogRevision]);

  return (
    <>
      <div
        id={`${sectionId}-grid`}
        className="anim-grid grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6"
        data-live-catalog-version={release.aggregateSha256}
      >
        {items.map((item, index) => (
          <div
            key={item.id || index}
            className="product-card-wrap relative"
            data-product-grid-item
            hidden={index >= PRODUCT_GRID_INITIAL_COUNT}
          >
            {badgeLabel && !isSoldOut(item) ? (
              <div className="product-card-badge z-10 bg-[#d4e1d9] text-[#2d4033] dark:bg-[#203126]/92 dark:text-[#c8ddca]">
                {badgeLabel}
              </div>
            ) : null}
            <GalleryProductCardServer item={item} layoutMode="grid" compact priority={false} darkMode={darkMode} />
          </div>
        ))}
      </div>

      {items.length > PRODUCT_GRID_INITIAL_COUNT ? (
        <div className="product-grid-more-wrap mt-10 flex justify-center">
          <ProductGridMoreButtonIsland
            key={release.aggregateSha256}
            sectionId={sectionId}
            initialCount={PRODUCT_GRID_INITIAL_COUNT}
            darkMode={darkMode}
          />
        </div>
      ) : null}
    </>
  );
}
