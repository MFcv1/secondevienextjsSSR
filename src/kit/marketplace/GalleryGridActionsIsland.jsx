'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clearProductImageWarmups, scheduleProductImageWarmup } from '../../utils/imageUtils';
import {
  getCurrentWishlistUser,
  readWishlistIds,
  setWishlistItem,
} from './wishlistState';

const prefetchedRoutes = new Set();
const SCROLL_HOVER_WARMUP_COOLDOWN_MS = 420;

const shouldSkipSoftWarmup = () => {
  if (typeof navigator === 'undefined') return false;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return Boolean(connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || ''));
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

export default function GalleryGridActionsIsland({ observeVisibleWarmup = false, surface = 'gallery' } = {}) {
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
    const shouldPrefetchRoute = intent === 'hover' || intent === 'press';
    const warmupSrc = card.querySelector('[data-product-media-warmup]')?.dataset.productMediaWarmup || '';

    if (shouldPrefetchRoute && productUrl && !prefetchedRoutes.has(productUrl)) {
      prefetchedRoutes.add(productUrl);
      try {
        router.prefetch(productUrl);
      } catch {
        // Links remain normal navigation if prefetch is unavailable.
      }
    }

    scheduleProductImageWarmup(warmupSrc, { intent }).catch(() => null);
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
    const onCatalogVersionChanged = () => {
      prefetchedRoutes.clear();
      clearProductImageWarmups();
    };
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
    window.addEventListener('sv:catalog-version-changed', onCatalogVersionChanged);
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
      window.removeEventListener('sv:catalog-version-changed', onCatalogVersionChanged);
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
      const selector = surface === 'category'
        ? '[data-category-native-view] [data-gallery-product-card]'
        : '[data-ssr-gallery] [data-gallery-product-card]';
      const cards = Array.from(document.querySelectorAll(selector))
        .filter((card) => card.querySelector('[data-product-media-warmup]')?.dataset.productMediaWarmup);

      if (!cards.length) return;

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const card = entry.target;
          observer?.unobserve(card);
          warmupProduct(card, 'visible');
        });
      }, {
        root: surface === 'gallery' ? document.getElementById('marketplaceGalleryScroll') : null,
        rootMargin: '100% 0px',
        threshold: 0.01,
      });

      cards.forEach((card) => observer.observe(card));
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(setupObserver, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(setupObserver, 120);
    }

    return () => {
      cancelled = true;
      if (idleId && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
      observer?.disconnect();
    };
  }, [observeVisibleWarmup, surface, warmupProduct]);

  return null;
}
