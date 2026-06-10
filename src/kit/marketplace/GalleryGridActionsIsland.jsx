'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const WISHLIST_STORAGE_KEY = 'sv_public_product_wishlist';
const PRODUCT_DETAIL_IMAGE_SIZES = '(max-width: 1023px) min(94vw, 430px), calc(100vw - 610px)';
const warmedImages = new Set();
const prefetchedRoutes = new Set();
const warmupQueue = [];
let activeWarmups = 0;
const MAX_ACTIVE_WARMUPS = 2;

const readWishlist = () => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const writeWishlist = (items) => {
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
};

const shouldSkipSoftWarmup = () => {
  if (typeof navigator === 'undefined') return false;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return Boolean(connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || ''));
};

const preloadWarmupImage = (src, options = {}) => {
  if (!src || typeof window === 'undefined') return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const image = new Image();
    if (options.priority && 'fetchPriority' in image) image.fetchPriority = options.priority;
    image.decoding = 'async';
    image.sizes = PRODUCT_DETAIL_IMAGE_SIZES;
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
};

const runQueuedWarmups = () => {
  if (activeWarmups >= MAX_ACTIVE_WARMUPS) return;
  const next = warmupQueue.shift();
  if (!next) return;

  activeWarmups += 1;
  next()
    .catch(() => null)
    .finally(() => {
      activeWarmups = Math.max(0, activeWarmups - 1);
      runQueuedWarmups();
    });
};

const enqueueWarmup = (callback) => {
  warmupQueue.push(callback);
  runQueuedWarmups();
};

const parseJsonAttribute = (element, name) => {
  try {
    return JSON.parse(element.getAttribute(name) || 'null');
  } catch {
    return null;
  }
};

const setWishlistButtonState = (button, liked) => {
  button.dataset.liked = liked ? 'true' : 'false';
  button.setAttribute('aria-pressed', liked ? 'true' : 'false');
  button.setAttribute('aria-label', liked ? 'Retirer des favoris' : 'Ajouter aux favoris');
  button.setAttribute('title', liked ? 'Retirer des favoris' : 'Ajouter aux favoris');
  const icon = button.querySelector('[data-gallery-wishlist-heart]');
  if (icon) icon.setAttribute('fill', liked ? 'currentColor' : 'none');
};

export default function GalleryGridActionsIsland() {
  const router = useRouter();

  const syncWishlistButtons = useCallback(() => {
    const wishlist = new Set(readWishlist());
    document.querySelectorAll('[data-gallery-wishlist-button][data-product-id]').forEach((button) => {
      setWishlistButtonState(button, wishlist.has(button.dataset.productId));
    });
  }, []);

  const warmupProduct = useCallback((card, intent = 'hover') => {
    if (!card || (intent === 'hover' && shouldSkipSoftWarmup())) return;
    const productUrl = card.dataset.productUrl || '';
    const src = card.dataset.warmupSrc || '';

    if (productUrl && !prefetchedRoutes.has(productUrl)) {
      prefetchedRoutes.add(productUrl);
      try {
        router.prefetch(productUrl);
      } catch {
        // Links remain normal navigation if prefetch is unavailable.
      }
    }

    if (!src || warmedImages.has(src)) return;
    warmedImages.add(src);
    enqueueWarmup(() => preloadWarmupImage(src, {
      priority: intent === 'press' ? 'high' : 'auto',
    }));
  }, [router]);

  useEffect(() => {
    syncWishlistButtons();

    const onClick = (event) => {
      const cartButton = event.target.closest?.('[data-gallery-cart-button]');
      if (cartButton) {
        event.preventDefault();
        event.stopPropagation();
        const item = parseJsonAttribute(cartButton, 'data-cart-item');
        if (item) window.dispatchEvent(new CustomEvent('sv:product-added', { detail: item }));
        return;
      }

      const wishlistButton = event.target.closest?.('[data-gallery-wishlist-button][data-product-id]');
      if (!wishlistButton) return;

      event.preventDefault();
      event.stopPropagation();
      const productId = wishlistButton.dataset.productId;
      const current = readWishlist();
      const next = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];
      writeWishlist(next);
      setWishlistButtonState(wishlistButton, next.includes(productId));
    };

    const onPointerOver = (event) => {
      if (event.pointerType === 'touch') return;
      const link = event.target.closest?.('[data-gallery-product-link]');
      if (link) warmupProduct(link.closest('[data-gallery-product-card]'), 'hover');
    };

    const onPointerDown = (event) => {
      const link = event.target.closest?.('[data-gallery-product-link]');
      if (link) warmupProduct(link.closest('[data-gallery-product-card]'), 'press');
    };

    const onFocusIn = (event) => {
      const link = event.target.closest?.('[data-gallery-product-link]');
      if (link) warmupProduct(link.closest('[data-gallery-product-card]'), 'hover');
    };

    const onStorage = (event) => {
      if (event.key === WISHLIST_STORAGE_KEY) syncWishlistButtons();
    };

    document.addEventListener('click', onClick);
    document.addEventListener('pointerover', onPointerOver, { passive: true });
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    document.addEventListener('focusin', onFocusIn);
    window.addEventListener('storage', onStorage);

    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('storage', onStorage);
    };
  }, [syncWishlistButtons, warmupProduct]);

  return null;
}
