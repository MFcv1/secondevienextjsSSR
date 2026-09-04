'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  clearProductImageWarmups,
  clearQueuedProductImageWarmups,
  scheduleProductImageWarmup,
} from '../../utils/imageUtils';
import {
  getCurrentWishlistUser,
  readWishlistIds,
  setWishlistItem,
} from './wishlistState';

const prefetchedRoutes = new Set();
const SCROLL_HOVER_WARMUP_COOLDOWN_MS = 420;
const HOVER_WARMUP_INTENT_MS = 160;
const PRODUCT_CARD_IMAGE_SELECTOR = 'img[data-product-image-state]';

const getProductMediaSurface = (image) => image.closest?.('[data-product-media-state]');

const setProductImageState = (image, state) => {
  if (!image?.isConnected) return;
  image.dataset.productImageState = state;
  const surface = getProductMediaSurface(image);
  if (surface) surface.dataset.productMediaState = state;
};

const revealDecodedProductImage = (image) => {
  if (!image || image.dataset.productImageState === 'ready' || image.dataset.productImageState === 'decoding') return;
  if (!image.complete || image.naturalWidth <= 0) return;

  image.dataset.productImageState = 'decoding';
  const decode = typeof image.decode === 'function' ? image.decode() : Promise.resolve();
  Promise.resolve(decode)
    .catch(() => undefined)
    .then(() => {
      if (image.complete && image.naturalWidth > 0) setProductImageState(image, 'ready');
      else setProductImageState(image, 'loading');
    });
};

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
  const hoverWarmupTimerRef = useRef(0);
  const hoverWarmupCardRef = useRef(null);

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

    const onProductImageLoad = (event) => {
      if (event.target?.matches?.(PRODUCT_CARD_IMAGE_SELECTOR)) revealDecodedProductImage(event.target);
    };
    const onProductImageError = (event) => {
      if (event.target?.matches?.(PRODUCT_CARD_IMAGE_SELECTOR)) setProductImageState(event.target, 'error');
    };

    document.querySelectorAll(PRODUCT_CARD_IMAGE_SELECTOR).forEach(revealDecodedProductImage);

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

    // Balayer vite la grille survolait une dizaine de cartes en une seconde et
    // lancait autant de prefetch de route + de decodages d'image pleine taille.
    // Le travail retombait dans les frames d'animation et faisait vibrer les
    // cartes traversees. On n'amorce donc que si le pointeur se pose vraiment.
    const cancelPendingHoverWarmup = () => {
      if (hoverWarmupTimerRef.current) {
        window.clearTimeout(hoverWarmupTimerRef.current);
        hoverWarmupTimerRef.current = 0;
      }
      hoverWarmupCardRef.current = null;
    };

    const onPointerOver = (event) => {
      if (event.pointerType === 'touch') return;
      if (Date.now() - lastScrollIntentAtRef.current < SCROLL_HOVER_WARMUP_COOLDOWN_MS) return;
      const link = event.target.closest?.('[data-gallery-product-link]');
      const card = link?.closest('[data-gallery-product-card]') || null;
      if (card === hoverWarmupCardRef.current) return;

      cancelPendingHoverWarmup();
      if (!card) return;

      hoverWarmupCardRef.current = card;
      hoverWarmupTimerRef.current = window.setTimeout(() => {
        hoverWarmupTimerRef.current = 0;
        if (card.isConnected) warmupProduct(card, 'hover');
      }, HOVER_WARMUP_INTENT_MS);
    };

    const onPointerDown = (event) => {
      const link = event.target.closest?.('[data-gallery-product-link]');
      if (link) {
        cancelPendingHoverWarmup();
        clearQueuedProductImageWarmups();
        warmupProduct(link.closest('[data-gallery-product-card]'), 'press');
      }
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
    document.addEventListener('load', onProductImageLoad, true);
    document.addEventListener('error', onProductImageError, true);
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
      cancelPendingHoverWarmup();
      document.removeEventListener('click', onClick);
      document.removeEventListener('load', onProductImageLoad, true);
      document.removeEventListener('error', onProductImageError, true);
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
      clearQueuedProductImageWarmups();
    };
  }, [observeVisibleWarmup, surface, warmupProduct]);

  return null;
}
