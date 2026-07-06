'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCurrentWishlistUser,
  readWishlistIds,
  setWishlistItem,
} from './wishlistState';

const PRODUCT_DETAIL_IMAGE_SIZES = '(max-width: 1023px) min(94vw, 430px), calc(100vw - 610px)';
const VISIBLE_WARMUP_ROOT_MARGIN = '650px 0px';
const warmedImages = new Set();
const prefetchedRoutes = new Set();
const warmupQueue = [];
let activeWarmups = 0;
const MAX_ACTIVE_WARMUPS = 2;
const SCROLL_HOVER_WARMUP_COOLDOWN_MS = 420;

const getUniqueSources = (sources) => {
  const unique = [];
  sources.forEach((src) => {
    if (src && !unique.includes(src)) unique.push(src);
  });
  return unique;
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
  button.setAttribute('aria-label', liked ? 'Retirer de la liste de souhaits' : 'Ajouter a la liste de souhaits');
  button.setAttribute('title', liked ? 'Retirer de la liste de souhaits' : 'Ajouter a la liste de souhaits');
  const icon = button.querySelector('[data-gallery-wishlist-heart]');
  if (icon) icon.setAttribute('fill', liked ? 'currentColor' : 'none');
};

export default function GalleryGridActionsIsland({ observeVisibleWarmup = false, observeSeoIntro = false } = {}) {
  const router = useRouter();
  const lastScrollIntentAtRef = useRef(0);
  const authUserRef = useRef(null);

  const syncWishlistButtons = useCallback(() => {
    const wishlist = new Set(readWishlistIds());
    document.querySelectorAll('[data-gallery-wishlist-button][data-product-id]').forEach((button) => {
      setWishlistButtonState(button, wishlist.has(button.dataset.productId));
    });
  }, []);

  const warmupProduct = useCallback((card, intent = 'hover') => {
    if (!card || (intent !== 'press' && shouldSkipSoftWarmup())) return;
    const productUrl = card.dataset.productUrl || '';
    const sources = getUniqueSources([
      card.dataset.warmupSrc || '',
      card.dataset.warmupBackdropSrc || '',
    ]);

    if (productUrl && !prefetchedRoutes.has(productUrl)) {
      prefetchedRoutes.add(productUrl);
      try {
        router.prefetch(productUrl);
      } catch {
        // Links remain normal navigation if prefetch is unavailable.
      }
    }

    sources.forEach((src) => {
      if (warmedImages.has(src)) return;
      warmedImages.add(src);
      enqueueWarmup(() => preloadWarmupImage(src, {
        priority: intent === 'press' ? 'high' : 'auto',
      }));
    });
  }, [router]);

  useEffect(() => {
    syncWishlistButtons();

    const markScrollIntent = () => {
      lastScrollIntentAtRef.current = Date.now();
    };

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
      const current = readWishlistIds();
      const liked = !current.includes(productId);
      const item = parseJsonAttribute(wishlistButton, 'data-wishlist-item') || { id: productId, originalId: productId };

      setWishlistButtonState(wishlistButton, liked);
      setWishlistItem(item, liked, authUserRef.current || getCurrentWishlistUser())
        .catch((error) => {
          console.error('Gallery wishlist sync error:', error);
          syncWishlistButtons();
        });
    };

    const onPointerOver = (event) => {
      if (event.pointerType === 'touch') return;
      if (Date.now() - lastScrollIntentAtRef.current < SCROLL_HOVER_WARMUP_COOLDOWN_MS) return;
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

    const onWishlistStateChanged = () => syncWishlistButtons();
    const onStorage = () => syncWishlistButtons();
    const onAuthUserChanged = (event) => {
      authUserRef.current = event.detail?.user || null;
      syncWishlistButtons();
    };

    authUserRef.current = getCurrentWishlistUser();

    document.addEventListener('click', onClick);
    document.addEventListener('pointerover', onPointerOver, { passive: true });
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    document.addEventListener('focusin', onFocusIn);
    window.addEventListener('wheel', markScrollIntent, { passive: true });
    window.addEventListener('scroll', markScrollIntent, { passive: true });
    window.addEventListener('touchmove', markScrollIntent, { passive: true });
    window.addEventListener('storage', onStorage);
    window.addEventListener('sv:wishlist-state-changed', onWishlistStateChanged);
    window.addEventListener('sv:auth-user-changed', onAuthUserChanged);

    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('wheel', markScrollIntent);
      window.removeEventListener('scroll', markScrollIntent);
      window.removeEventListener('touchmove', markScrollIntent);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('sv:wishlist-state-changed', onWishlistStateChanged);
      window.removeEventListener('sv:auth-user-changed', onAuthUserChanged);
    };
  }, [syncWishlistButtons, warmupProduct]);

  useEffect(() => {
    if (!observeVisibleWarmup || typeof window === 'undefined') return undefined;
    if (!('IntersectionObserver' in window)) return undefined;
    if (shouldSkipSoftWarmup()) return undefined;

    let cancelled = false;
    let idleId = 0;
    let timeoutId = 0;
    let observer = null;

    const setupObserver = () => {
      if (cancelled) return;
      const cards = Array.from(document.querySelectorAll('[data-category-native-view] [data-gallery-product-card]'))
        .filter((card) => card.dataset.warmupSrc || card.dataset.warmupBackdropSrc);

      if (!cards.length) return;

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const card = entry.target;
          observer?.unobserve(card);
          warmupProduct(card, 'visible');
        });
      }, {
        root: null,
        rootMargin: VISIBLE_WARMUP_ROOT_MARGIN,
        threshold: 0.01,
      });

      cards.forEach((card) => observer.observe(card));
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(setupObserver, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(setupObserver, 240);
    }

    return () => {
      cancelled = true;
      if (idleId && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
      observer?.disconnect();
    };
  }, [observeVisibleWarmup, warmupProduct]);

  useEffect(() => {
    if (!observeSeoIntro || typeof window === 'undefined') return undefined;

    const section = document.querySelector('[data-gallery-seo-intro]');
    if (!section) return undefined;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      section.dataset.gallerySeoMotion = 'visible';
      return undefined;
    }

    section.dataset.gallerySeoMotion = 'pending';

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        section.dataset.gallerySeoMotion = 'visible';
        observer.disconnect();
      });
    }, {
      root: document.getElementById('marketplaceGalleryScroll') || null,
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.16,
    });

    observer.observe(section);

    return () => observer.disconnect();
  }, [observeSeoIntro]);

  return null;
}
