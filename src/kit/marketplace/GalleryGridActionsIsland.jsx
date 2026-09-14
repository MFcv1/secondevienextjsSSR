'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  clearProductImageWarmups,
  clearProductThumbWarmups,
  clearQueuedProductImageWarmups,
  clearQueuedProductThumbWarmups,
  scheduleProductImageWarmup,
  scheduleProductThumbWarmups,
  pauseSpeculativeProductImages,
  decodeProductThumbWarmups,
  preloadImage,
  clearQueuedImageLoads,
  syncImageLoadPlan,
} from '../../utils/imageUtils';
import {
  getCurrentWishlistUser,
  readWishlistIds,
  setWishlistItem,
} from './wishlistState';

const prefetchedRoutes = new Map();
const SCROLL_HOVER_WARMUP_COOLDOWN_MS = 420;
const HOVER_WARMUP_INTENT_MS = 160;
const PRODUCT_CARD_IMAGE_SELECTOR = 'img[data-product-image-state]';
const GALLERY_INTERNAL_SCROLL_QUERY = '(max-width: 1023px)';
const DWELL_WARMUP_DELAY_MS = 240;

const readThumbWarmups = (card) => decodeProductThumbWarmups(
  card.querySelector('[data-product-thumbs-warmup]')?.dataset.productThumbsWarmup || ''
);

// La galerie ne defile dans #marketplaceGalleryScroll que sous 1024px. Au-dela,
// ce conteneur est en `display: contents` : sans boite, un IntersectionObserver
// qui l'utilise comme racine ne voit aucune carte et rien n'est precharge. On
// observe alors le viewport, exactement comme sur les categories.
const getVisibleWarmupRoot = (surface) => {
  if (surface !== 'gallery') return null;
  const scrollRegion = document.getElementById('marketplaceGalleryScroll');
  if (!scrollRegion) return null;
  const { display, overflowY } = window.getComputedStyle(scrollRegion);
  return display !== 'contents' && /auto|scroll/.test(overflowY) ? scrollRegion : null;
};

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
  const visibleRouteUrlsRef = useRef(new Set());
  const stopGalleryWarmupRef = useRef(null);

  const syncWishlistButtons = useCallback(() => {
    const wishlist = new Set(readWishlistIds());
    document.querySelectorAll('[data-gallery-wishlist-button][data-product-id]').forEach((button) => {
      setWishlistButtonState(button, wishlist.has(button.dataset.productId));
    });
  }, []);

  const prefetchProductRoute = useCallback((productUrl) => {
    if (productUrl && Date.now() - (prefetchedRoutes.get(productUrl) || 0) > 60000) {
      const requestedAt = Date.now();
      prefetchedRoutes.set(productUrl, requestedAt);
      if (prefetchedRoutes.size > 64) prefetchedRoutes.delete(prefetchedRoutes.keys().next().value);
      try {
        router.prefetch(productUrl, { onInvalidate: () => {
          if (prefetchedRoutes.get(productUrl) !== requestedAt) return;
          prefetchedRoutes.delete(productUrl);
          window.dispatchEvent(new CustomEvent('sv:product-route-invalidated', { detail: { productUrl } }));
        } });
      } catch {
        prefetchedRoutes.delete(productUrl);
        // Links remain normal navigation if prefetch is unavailable.
      }
    }
  }, [router]);

  const warmupProduct = useCallback((card, intent = 'hover') => {
    if (!card || (intent !== 'press' && (document.hidden || shouldSkipSoftWarmup()))) return;
    if (intent === 'press') stopGalleryWarmupRef.current?.();
    prefetchProductRoute(card.dataset.productUrl || '');
    const warmupSrc = card.querySelector('[data-product-media-warmup]')?.dataset.productMediaWarmup || '';
    scheduleProductImageWarmup(warmupSrc, { intent }).catch(() => null);
    const thumbs = readThumbWarmups(card);
    scheduleProductThumbWarmups(thumbs.slice(0, 1), { intent });
    scheduleProductThumbWarmups(thumbs.slice(1), { intent: 'hover' });
  }, [prefetchProductRoute]);

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
      cancelPendingHoverWarmup();
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

    let touchIntent = null;
    let activatedTouchLink = null;
    const consumeTouchClick = (event) => {
      if (!event.isTrusted || !event.detail || !activatedTouchLink) return;
      if (event.target.closest?.('[data-gallery-product-link]') !== activatedTouchLink.link) return;
      if (performance.now() - activatedTouchLink.at > 700) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      activatedTouchLink = null;
    };
    const onPointerDown = (event) => {
      activatedTouchLink = null;
      if (event.isPrimary === false) { touchIntent = null; return; }
      const link = event.target.closest?.('[data-gallery-product-link]');
      if (event.pointerType === 'touch' || event.pointerType === 'pen') {
        cancelPendingHoverWarmup();
        touchIntent = link ? { link, x: event.clientX, y: event.clientY, id: event.pointerId, at: performance.now() } : null;
        return;
      }
      if (link) {
        cancelPendingHoverWarmup();
        clearQueuedProductThumbWarmups();
        clearQueuedProductImageWarmups();
        warmupProduct(link.closest('[data-gallery-product-card]'), 'press');
      }
    };

    const onPointerMove = (event) => {
      if (touchIntent && (event.pointerId !== touchIntent.id
          || Math.hypot(event.clientX - touchIntent.x, event.clientY - touchIntent.y) > 12)) touchIntent = null;
    };
    const onPointerCancel = () => { touchIntent = null; };
    const onPointerUp = (event) => {
      const intent = touchIntent;
      touchIntent = null;
      if (!intent || intent.id !== event.pointerId || !intent.link.contains(event.target)) return;
      if (performance.now() - intent.at > 450
          || Math.hypot(event.clientX - intent.x, event.clientY - intent.y) > 12) return;
      clearQueuedProductThumbWarmups();
      clearQueuedProductImageWarmups();
      warmupProduct(intent.link.closest('[data-gallery-product-card]'), 'press');
      // Use the existing Link click path as soon as a short, stationary touch
      // ends. Ignore its subsequent browser click so navigation happens once.
      activatedTouchLink = { link: intent.link, at: performance.now() };
      intent.link.click();
    };

    const onFocusIn = (event) => {
      const link = event.target.closest?.('[data-gallery-product-link]');
      if (link) warmupProduct(link.closest('[data-gallery-product-card]'), 'hover');
    };

    const onWishlistStateChanged = () => syncWishlistButtons();
    const onCatalogVersionChanged = () => {
      prefetchedRoutes.clear();
      clearProductImageWarmups();
      clearProductThumbWarmups();
    };
    const onStorage = () => syncWishlistButtons();
    const onAuthUserChanged = (event) => {
      authUserRef.current = event.detail?.user || null;
      syncWishlistButtons();
    };

    authUserRef.current = getCurrentWishlistUser();

    document.addEventListener('click', onClick);
    document.addEventListener('click', consumeTouchClick, true);
    document.addEventListener('scroll', onPointerCancel, { capture: true, passive: true });
    document.addEventListener('load', onProductImageLoad, true);
    document.addEventListener('error', onProductImageError, true);
    document.addEventListener('pointerover', onPointerOver, { passive: true });
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerup', onPointerUp, { passive: true });
    document.addEventListener('pointercancel', onPointerCancel, { passive: true });
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
      document.removeEventListener('click', consumeTouchClick, true);
      document.removeEventListener('scroll', onPointerCancel, true);
      document.removeEventListener('load', onProductImageLoad, true);
      document.removeEventListener('error', onProductImageError, true);
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerCancel);
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
    let dwellTimerId = 0;
    let nearTimerId = 0;
    let observer = null;
    let visibleObserver = null;
    let scrollRoot = null;
    let lastScrollTop = 0;
    let scrollDirection = 1;
    let navigating = false;
    const visibleCards = new Set();
    const nearCards = new Set();
    const observedCards = new Set();
    let detailGeneration = 0;
    const stopDetailWarmup = () => {
      detailGeneration += 1;
      clearQueuedImageLoads('gallery-detail');
      clearQueuedImageLoads('gallery-decode');
    };

    const sortedCards = (cards) => {
      const bounds = scrollRoot?.getBoundingClientRect();
      const top = Math.max(0, bounds?.top || 0);
      const bottom = Math.min(window.innerHeight, bounds?.bottom ?? window.innerHeight);
      const center = (top + bottom) / 2;
      return Array.from(cards).filter((card) => card.isConnected && card.getClientRects().length)
        .map((card) => {
          const rect = card.getBoundingClientRect();
          return { card, distance: Math.abs(rect.top + rect.height / 2 - center) };
        })
        .sort((a, b) => a.distance - b.distance).map(({ card }) => card);
    };
    const warmupNearCards = () => {
      nearTimerId = 0;
      if (cancelled || navigating || document.hidden || shouldSkipSoftWarmup()) return;
      const visible = sortedCards(visibleCards);
      visibleRouteUrlsRef.current = new Set(visible.map((card) => card.dataset.productUrl).filter(Boolean));
      visibleRouteUrlsRef.current.forEach(prefetchProductRoute);

      const bounds = scrollRoot?.getBoundingClientRect();
      const center = (Math.max(0, bounds?.top || 0) + Math.min(window.innerHeight, bounds?.bottom ?? window.innerHeight)) / 2;
      const nearby = sortedCards(nearCards).filter((card) => {
        if (visibleCards.has(card)) return false;
        const rect = card.getBoundingClientRect();
        return (rect.top + rect.height / 2 - center) * scrollDirection > 0;
      }).slice(0, window.matchMedia(GALLERY_INTERNAL_SCROLL_QUERY).matches ? 2 : 5);
      const requests = [];
      // Batch all visible primaries first, then their backdrops, then the next
      // row. The queue preserves useful work and updates priority in place.
      for (const cards of [visible, nearby]) {
        const isVisible = cards === visible;
        for (const primary of [true, false]) {
          cards.forEach((card) => {
            const src = primary
              ? card.querySelector('[data-product-media-warmup]')?.dataset.productMediaWarmup
              : readThumbWarmups(card)[0];
            if (src) requests.push({ src, priority: isVisible ? 'auto' : 'low', order: requests.length, retain: isVisible });
          });
        }
      }
      // A product may occur in several gallery sections: keep its best rank.
      const unique = new Map();
      requests.forEach((request) => { if (!unique.has(request.src)) unique.set(request.src, request); });
      syncImageLoadPlan('gallery-visible', [...unique.values()]);
    };

    const scheduleNearWarmup = () => {
      if (!nearTimerId) nearTimerId = window.setTimeout(warmupNearCards, 60);
    };
    const onRouteInvalidated = (event) => {
      if (!document.hidden && visibleRouteUrlsRef.current.has(event.detail?.productUrl)) scheduleNearWarmup();
    };
    window.addEventListener('sv:product-route-invalidated', onRouteInvalidated);

    // Only optional decoding and albums wait for a pause. Every visible card
    // participates, including partial rows, with one resource per card/round.
    const warmupDwelledCards = async () => {
      dwellTimerId = 0;
      if (cancelled || navigating || document.hidden || shouldSkipSoftWarmup()) return;
      const cards = [...new Map(sortedCards(visibleCards).map((card) => [card.dataset.productUrl, card])).values()];
      stopDetailWarmup();
      const generation = detailGeneration;
      const current = () => !cancelled && !navigating && !document.hidden && generation === detailGeneration;
      for (const card of cards) {
        if (!current()) return;
        const src = card.querySelector('[data-product-media-warmup]')?.dataset.productMediaWarmup;
        await preloadImage(src, { owner: 'gallery-decode', priority: 'auto', decode: true });
      }
      const thumbs = cards.map(readThumbWarmups);
      const images = cards.map((card) => decodeProductThumbWarmups(
        card.querySelector('[data-product-images-warmup]')?.dataset.productImagesWarmup || ''
      ));
      for (const albums of [thumbs, images]) {
        for (let index = 1; index < Math.max(0, ...albums.map((list) => list.length)); index += 1) {
          if (!current()) return;
          await Promise.all(albums.map((list) => list[index] && preloadImage(list[index], {
            owner: 'gallery-detail', priority: 'low', decode: false,
          })));
        }
      }
    };

    const scheduleDwellWarmup = () => {
      if (dwellTimerId) window.clearTimeout(dwellTimerId);
      dwellTimerId = window.setTimeout(warmupDwelledCards, DWELL_WARMUP_DELAY_MS);
    };

    const onScroll = () => {
      const scrollTop = scrollRoot ? scrollRoot.scrollTop : window.scrollY;
      if (scrollTop !== lastScrollTop) scrollDirection = scrollTop > lastScrollTop ? 1 : -1;
      lastScrollTop = scrollTop;
      navigating = false;
      stopDetailWarmup();
      pauseSpeculativeProductImages(180);
      // Throttle selection, not the native scrolling or visible card downloads.
      if (!nearTimerId) nearTimerId = window.setTimeout(warmupNearCards, 120);
      scheduleDwellWarmup();
    };

    stopGalleryWarmupRef.current = () => {
      navigating = true;
      stopDetailWarmup();
      clearQueuedImageLoads('gallery-visible');
      window.clearTimeout(dwellTimerId);
      window.clearTimeout(nearTimerId);
      dwellTimerId = 0;
      nearTimerId = 0;
    };

    const selector = surface === 'category'
      ? '[data-category-native-view] [data-gallery-product-card]'
      : '[data-ssr-gallery] [data-gallery-product-card]';
    const syncCards = () => {
      if (!observer || !visibleObserver) return;
      for (const card of observedCards) {
        if (card.isConnected) continue;
        observer.unobserve(card);
        visibleObserver.unobserve(card);
        observedCards.delete(card);
        nearCards.delete(card);
        visibleCards.delete(card);
      }
      document.querySelectorAll(selector).forEach((card) => {
        if (observedCards.has(card)) return;
        observedCards.add(card);
        observer.observe(card);
        visibleObserver.observe(card);
      });
    };

    const setupObserver = () => {
      if (cancelled) return;
      stopDetailWarmup();
      observer?.disconnect();
      visibleObserver?.disconnect();
      observer = null;
      visibleObserver = null;
      visibleCards.clear();
      nearCards.clear();
      observedCards.clear();
      const root = getVisibleWarmupRoot(surface);
      scrollRoot = root;
      lastScrollTop = root ? root.scrollTop : window.scrollY;
      navigating = false;
      visibleRouteUrlsRef.current.clear();
      clearQueuedImageLoads('gallery-visible');

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const card = entry.target;
          if (entry.isIntersecting) nearCards.add(card);
          else nearCards.delete(card);
        });
        scheduleNearWarmup();
      }, {
        root,
        rootMargin: '250px 0px',
        threshold: 0.01,
      });

      visibleObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0) visibleCards.add(entry.target);
          else visibleCards.delete(entry.target);
        });
        stopDetailWarmup();
        // No dwell requirement for the page or its first image.
        if (nearTimerId) window.clearTimeout(nearTimerId);
        warmupNearCards();
        scheduleDwellWarmup();
      }, {
        root,
        threshold: [0, 0.01],
      });

      syncCards();
    };

    setupObserver();

    // Une fenetre redimensionnee de part et d'autre de 1024px change le
    // conteneur qui defile ; les images deja amorcees restent dedoublonnees.
    const scrollRegionQuery = surface === 'gallery' ? window.matchMedia?.(GALLERY_INTERNAL_SCROLL_QUERY) : null;
    scrollRegionQuery?.addEventListener?.('change', setupObserver);
    // Capture : recoit aussi le scroll interne de la galerie mobile.
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    const mutations = new MutationObserver(() => {
      stopDetailWarmup();
      syncCards();
      if (!nearTimerId) nearTimerId = window.setTimeout(warmupNearCards, 120);
      scheduleDwellWarmup();
    });
    const grid = document.querySelector(surface === 'category' ? '[data-category-native-view]' : '[data-ssr-gallery]');
    if (grid) mutations.observe(grid, { childList: true, subtree: true, attributes: true,
      attributeFilter: ['data-product-url', 'data-product-media-warmup', 'data-product-thumbs-warmup', 'data-product-images-warmup'] });
    window.addEventListener('sv:catalog-version-changed', setupObserver);
    const onVisibility = () => {
      if (document.hidden) {
        stopDetailWarmup();
        clearQueuedImageLoads('gallery-visible');
        clearQueuedProductImageWarmups();
        clearQueuedProductThumbWarmups();
      } else { navigating = false; warmupNearCards(); scheduleDwellWarmup(); }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      visibleRouteUrlsRef.current.clear();
      window.removeEventListener('sv:product-route-invalidated', onRouteInvalidated);
      stopGalleryWarmupRef.current = null;
      stopDetailWarmup();
      clearQueuedImageLoads('gallery-visible');
      scrollRegionQuery?.removeEventListener?.('change', setupObserver);
      document.removeEventListener('scroll', onScroll, { capture: true });
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('sv:catalog-version-changed', setupObserver);
      mutations.disconnect();
      if (dwellTimerId) window.clearTimeout(dwellTimerId);
      if (nearTimerId) window.clearTimeout(nearTimerId);
      observer?.disconnect();
      visibleObserver?.disconnect();
      clearQueuedProductImageWarmups();
      clearQueuedProductThumbWarmups();
    };
  }, [observeVisibleWarmup, surface, prefetchProductRoute]);

  return null;
}
