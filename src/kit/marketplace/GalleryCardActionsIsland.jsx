'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Plus } from 'lucide-react';

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

const shouldSkipSoftWarmup = () => {
  if (typeof navigator === 'undefined') return false;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return Boolean(connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || ''));
};

const getWarmupSrc = (warmupImage) => (
  warmupImage?.medium
  || warmupImage?.src
  || warmupImage?.card
  || warmupImage?.thumb
  || ''
);

const preloadWarmupImage = (src, options = {}) => {
  if (!src || typeof window === 'undefined') return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const image = new Image();
    if (options.priority && 'fetchPriority' in image) {
      image.fetchPriority = options.priority;
    }
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

export default function GalleryCardActionsIsland({ item, productUrl = '', warmupImage = null }) {
  const productId = item?.originalId || item?.id;
  const router = useRouter();
  const rootRef = useRef(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLiked(readWishlist().includes(productId));
  }, [productId]);

  const warmupProduct = useCallback((intent = 'hover') => {
    const src = getWarmupSrc(warmupImage);
    if (!src || (intent === 'hover' && shouldSkipSoftWarmup())) return;

    if (productUrl && !prefetchedRoutes.has(productUrl)) {
      prefetchedRoutes.add(productUrl);
      try {
        router.prefetch(productUrl);
      } catch {
        // Navigation remains a normal link if prefetch is unavailable.
      }
    }

    if (warmedImages.has(src)) return;
    warmedImages.add(src);

    enqueueWarmup(() => preloadWarmupImage(src, {
      priority: intent === 'press' ? 'high' : 'auto',
    }));
  }, [productUrl, router, warmupImage]);

  useEffect(() => {
    if (!productUrl || !rootRef.current) return undefined;

    const card = rootRef.current.closest('.product-card-media')?.parentElement;
    if (!card) return undefined;

    const links = Array.from(card.querySelectorAll(`a[href="${productUrl}"]`));
    const onPointerEnter = (event) => {
      if (event.pointerType === 'touch') return;
      warmupProduct('hover');
    };
    const onPointerDown = () => warmupProduct('press');
    const onFocus = () => warmupProduct('hover');

    links.forEach((link) => {
      link.addEventListener('pointerenter', onPointerEnter);
      link.addEventListener('pointerdown', onPointerDown, { passive: true });
      link.addEventListener('touchstart', onPointerDown, { passive: true });
      link.addEventListener('focus', onFocus);
    });

    return () => {
      links.forEach((link) => {
        link.removeEventListener('pointerenter', onPointerEnter);
        link.removeEventListener('pointerdown', onPointerDown);
        link.removeEventListener('touchstart', onPointerDown);
        link.removeEventListener('focus', onFocus);
      });
    };
  }, [productUrl, warmupProduct]);

  if (!productId) return null;

  if (item?.sold) {
    return <span ref={rootRef} className="hidden" aria-hidden="true" />;
  }

  const addToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    window.dispatchEvent(new CustomEvent('sv:product-added', { detail: item }));
  };

  const toggleLiked = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const current = readWishlist();
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
    setLiked(next.includes(productId));
  };

  return (
    <div ref={rootRef} className="absolute right-2 top-2 z-20 flex flex-col gap-1.5 opacity-100 transition-opacity duration-300 md:right-3 md:top-3 md:gap-2 lg:opacity-0 lg:group-hover:opacity-100">
      <button
        type="button"
        onClick={addToCart}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2f241d] text-white shadow-md transition-colors hover:bg-[#7a4f35] md:h-9 md:w-9"
        title="Ajouter au panier"
        aria-label="Ajouter au panier"
      >
        <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={toggleLiked}
        className={`flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-colors md:h-9 md:w-9 ${liked ? 'bg-rose-500 text-white' : 'bg-white/90 text-stone-700 hover:bg-rose-500 hover:text-white'}`}
        title={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      >
        <Heart className="h-[13px] w-[13px] md:h-[15px] md:w-[15px]" strokeWidth={2} fill={liked ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}
