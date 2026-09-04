'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import GalleryProductCardServer from './GalleryProductCardServer';
import { ProductGridMoreButtonIsland } from './GalleryFixedSectionsInteractions';
import { isSoldOut } from '../commerce/purchasability';

const PRODUCT_GRID_INITIAL_COUNT = 10;
const RELEASE_CONFIRMATION_DELAYS_MS = [0, 300, 900, 1800];
const releaseRequests = new Map();

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

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

const loadExactCatalogRelease = (aggregateSha256) => {
  if (!aggregateSha256) return Promise.resolve(null);
  if (releaseRequests.has(aggregateSha256)) return releaseRequests.get(aggregateSha256);
  const request = (async () => {
    for (const delayMs of RELEASE_CONFIRMATION_DELAYS_MS) {
      if (delayMs) await wait(delayMs);
      try {
        const response = await fetch('/api/catalog?scope=cards&limit=48', {
          cache: 'no-store',
          headers: { accept: 'application/json' },
        });
        if (!response.ok) continue;
        const payload = await response.json();
        if (payload?.aggregateSha256 === aggregateSha256
            && Array.isArray(payload?.collections?.furniture)) {
          return payload;
        }
      } catch {
        // La tentative bornee suivante couvre une instance API en retard.
      }
    }
    return null;
  })().finally(() => {
    if (releaseRequests.get(aggregateSha256) === request) releaseRequests.delete(aggregateSha256);
  });
  releaseRequests.set(aggregateSha256, request);
  return request;
};

export default function GalleryLiveProductGridIsland({
  sectionId,
  initialItems = [],
  initialCatalogVersion = '',
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
    const frame = window.requestAnimationFrame(() => {
      const grid = document.getElementById(`${sectionId}-grid`);
      const card = [...(grid?.querySelectorAll('[data-gallery-product-card][data-product-id]') || [])]
        .find((candidate) => candidate.dataset.productId === focusedProductId);
      if (!card) return;
      const gridItem = card.closest('[data-product-grid-item]');
      if (gridItem) gridItem.hidden = false;
      focusRevealedRef.current = true;
      card.setAttribute('data-publication-focus', 'true');
      card.scrollIntoView({
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center',
      });
      window.setTimeout(() => card.removeAttribute('data-publication-focus'), 5000);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusedProductId, items, sectionId]);

  useEffect(() => {
    const section = document.getElementById(sectionId);
    if (section && hideWhenEmpty) section.hidden = items.length === 0;
  }, [hideWhenEmpty, items.length, sectionId]);

  useEffect(() => {
    let active = true;
    const onCatalogVersionChanged = async (event) => {
      const aggregateSha256 = String(event.detail?.aggregateSha256 || '');
      if (!aggregateSha256 || aggregateSha256 === release.aggregateSha256) return;
      const payload = await loadExactCatalogRelease(aggregateSha256);
      if (!active || !payload) return;
      setRelease({
        aggregateSha256: payload.aggregateSha256,
        items: payload.collections.furniture,
      });
    };
    window.addEventListener('sv:catalog-version-changed', onCatalogVersionChanged);
    return () => {
      active = false;
      window.removeEventListener('sv:catalog-version-changed', onCatalogVersionChanged);
    };
  }, [release.aggregateSha256]);

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
            darkMode={darkMode}
          />
        </div>
      ) : null}
    </>
  );
}
