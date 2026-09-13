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
const DWELL_VISIBLE_RATIO = 0.6;
const DWELL_WARMUP_MAX_CARDS_COMPACT = 2;
const DWELL_WARMUP_MAX_CARDS_WIDE = 5;

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

  const syncWishlistButtons = useCallback(() => {
    const wishlist = new Set(readWishlistIds());
    document.querySelectorAll('[data-gallery-wishlist-button][data-product-id]').forEach((button) => {
      setWishlistButtonState(button, wishlist.has(button.dataset.productId));
    });
  }, []);

  const warmupProduct = useCallback((card, intent = 'hover') => {
    if (!card || (intent !== 'press' && (document.hidden || shouldSkipSoftWarmup()))) return;
    const productUrl = card.dataset.productUrl || '';
    const shouldPrefetchRoute = intent === 'hover' || intent === 'press' || intent === 'dwell';
    const warmupSrc = card.querySelector('[data-product-media-warmup]')?.dataset.productMediaWarmup || '';

    if (shouldPrefetchRoute && productUrl && Date.now() - (prefetchedRoutes.get(productUrl) || 0) > 60000) {
      const requestedAt = Date.now();
      prefetchedRoutes.set(productUrl, requestedAt);
      if (prefetchedRoutes.size > 32) prefetchedRoutes.delete(prefetchedRoutes.keys().next().value);
      try {
        router.prefetch(productUrl, { onInvalidate: () => {
          if (prefetchedRoutes.get(productUrl) === requestedAt) prefetchedRoutes.delete(productUrl);
        } });
      } catch {
        prefetchedRoutes.delete(productUrl);
        // Links remain normal navigation if prefetch is unavailable.
      }
    }

    scheduleProductImageWarmup(warmupSrc, { intent }).catch(() => null);

    // Carte simplement visible : fond flou et premiere miniature. Intention
    // reelle (scroll arrete, survol, focus, pression) : toutes les miniatures.
    const thumbs = readThumbWarmups(card);
    scheduleProductThumbWarmups(intent === 'visible' ? thumbs.slice(0, 1) : thumbs, { intent });
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
    let idleId = 0;
    let timeoutId = 0;
    let dwellTimerId = 0;
    let nearTimerId = 0;
    let observer = null;
    let dwellObserver = null;
    const wellVisibleCards = new Set();
    const nearCards = new Set();
    const observedCards = new Set();
    let detailGeneration = 0;
    const stopDetailWarmup = () => {
      detailGeneration += 1;
      clearQueuedImageLoads('gallery-detail');
    };

    const sortedCards = (cards) => {
      const root = getVisibleWarmupRoot(surface);
      const bounds = root ? root.getBoundingClientRect() : { top: 0, height: window.innerHeight };
      const center = bounds.top + bounds.height / 2;
      return Array.from(cards).filter((card) => card.isConnected && card.getClientRects().length)
        .map((card) => {
          const rect = card.getBoundingClientRect();
          return { card, distance: Math.abs(rect.top + rect.height / 2 - center) };
        })
        .sort((a, b) => a.distance - b.distance).map(({ card }) => card);
    };
    const warmupNearCards = () => {
      nearTimerId = 0;
      if (cancelled || document.hidden) return;
      clearQueuedProductImageWarmups();
      clearQueuedProductThumbWarmups();
      sortedCards(nearCards).slice(0, 8).forEach((card) => warmupProduct(card, 'visible'));
    };

    // Scroll arrete sur des cartes bien visibles : la personne regarde ces
    // pieces, on amorce leurs miniatures puis leurs photos par tours equitables.
    // Un nouveau scroll arrete les tours et retire les transferts en attente.
    const warmupDwelledCards = async () => {
      dwellTimerId = 0;
      if (cancelled || document.hidden || !wellVisibleCards.size) return;
      const compactViewport = window.matchMedia?.(GALLERY_INTERNAL_SCROLL_QUERY).matches;
      const cards = sortedCards(wellVisibleCards)
        .slice(0, compactViewport ? DWELL_WARMUP_MAX_CARDS_COMPACT : DWELL_WARMUP_MAX_CARDS_WIDE);
      cards.forEach((card, index) => {
        warmupProduct(card, index < 2 ? 'dwell' : 'visible');
        scheduleProductThumbWarmups(readThumbWarmups(card), { intent: 'dwell' });
      });
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return;
      stopDetailWarmup();
      const generation = detailGeneration;
      const images = cards.map((card) => decodeProductThumbWarmups(
        card.querySelector('[data-product-images-warmup]')?.dataset.productImagesWarmup || ''
      ));
      // One photo per visible product per round: never fill the queue with a
      // single product's whole album. Downloads share the global 2/3-slot cap.
      for (let index = 1; index < Math.max(0, ...images.map((list) => list.length)); index += 1) {
        if (cancelled || document.hidden || generation !== detailGeneration) return;
        await Promise.all(images.map((list) => list[index] && preloadImage(list[index], {
          owner: 'gallery-detail', priority: 'low', decode: false,
        })));
      }
    };

    const scheduleDwellWarmup = () => {
      if (dwellTimerId) window.clearTimeout(dwellTimerId);
      dwellTimerId = window.setTimeout(warmupDwelledCards, DWELL_WARMUP_DELAY_MS);
    };

    const onScroll = () => {
      stopDetailWarmup();
      pauseSpeculativeProductImages(180);
      // Throttle selection, not the native scrolling or visible card downloads.
      if (!nearTimerId) nearTimerId = window.setTimeout(warmupNearCards, 120);
      scheduleDwellWarmup();
    };

    const selector = surface === 'category'
      ? '[data-category-native-view] [data-gallery-product-card]'
      : '[data-ssr-gallery] [data-gallery-product-card]';
    const syncCards = () => {
      if (!observer || !dwellObserver) return;
      for (const card of observedCards) {
        if (card.isConnected) continue;
        observer.unobserve(card);
        dwellObserver.unobserve(card);
        observedCards.delete(card);
        nearCards.delete(card);
        wellVisibleCards.delete(card);
      }
      document.querySelectorAll(selector).forEach((card) => {
        if (observedCards.has(card)) return;
        observedCards.add(card);
        observer.observe(card);
        dwellObserver.observe(card);
      });
    };

    const setupObserver = () => {
      if (cancelled) return;
      stopDetailWarmup();
      observer?.disconnect();
      dwellObserver?.disconnect();
      observer = null;
      dwellObserver = null;
      wellVisibleCards.clear();
      nearCards.clear();
      observedCards.clear();
      const root = getVisibleWarmupRoot(surface);

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const card = entry.target;
          if (entry.isIntersecting) nearCards.add(card);
          else nearCards.delete(card);
        });
        if (!nearTimerId) nearTimerId = window.setTimeout(warmupNearCards, 60);
      }, {
        root,
        rootMargin: '250px 0px',
        threshold: 0.01,
      });

      dwellObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= DWELL_VISIBLE_RATIO) wellVisibleCards.add(entry.target);
          else wellVisibleCards.delete(entry.target);
        });
        scheduleDwellWarmup();
      }, {
        root,
        threshold: [0, DWELL_VISIBLE_RATIO],
      });

      syncCards();
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(setupObserver, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(setupObserver, 120);
    }

    // Une fenetre redimensionnee de part et d'autre de 1024px change le
    // conteneur qui defile ; les images deja amorcees restent dedoublonnees.
    const scrollRegionQuery = surface === 'gallery' ? window.matchMedia?.(GALLERY_INTERNAL_SCROLL_QUERY) : null;
    scrollRegionQuery?.addEventListener?.('change', setupObserver);
    // Capture : recoit aussi le scroll interne de la galerie mobile.
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    const mutations = new MutationObserver(() => {
      syncCards();
      if (!nearTimerId) nearTimerId = window.setTimeout(warmupNearCards, 120);
      scheduleDwellWarmup();
    });
    const grid = document.querySelector(surface === 'category' ? '[data-category-native-view]' : '[data-ssr-gallery]');
    if (grid) mutations.observe(grid, { childList: true, subtree: true, attributes: true,
      attributeFilter: ['data-product-media-warmup', 'data-product-thumbs-warmup', 'data-product-images-warmup'] });
    window.addEventListener('sv:catalog-version-changed', setupObserver);
    const onVisibility = () => {
      if (document.hidden) {
        stopDetailWarmup();
        clearQueuedProductImageWarmups();
        clearQueuedProductThumbWarmups();
      } else { warmupNearCards(); scheduleDwellWarmup(); }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      stopDetailWarmup();
      scrollRegionQuery?.removeEventListener?.('change', setupObserver);
      document.removeEventListener('scroll', onScroll, { capture: true });
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('sv:catalog-version-changed', setupObserver);
      mutations.disconnect();
      if (idleId && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
      if (dwellTimerId) window.clearTimeout(dwellTimerId);
      if (nearTimerId) window.clearTimeout(nearTimerId);
      observer?.disconnect();
      dwellObserver?.disconnect();
      clearQueuedProductImageWarmups();
      clearQueuedProductThumbWarmups();
    };
  }, [observeVisibleWarmup, surface, warmupProduct]);

  return null;
}
