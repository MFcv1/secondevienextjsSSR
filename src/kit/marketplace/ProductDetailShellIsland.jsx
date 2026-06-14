'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AlignLeft,
  Heart,
  X,
} from 'lucide-react';
import {
  PRODUCT_DETAIL_IMAGE_SIZES,
  getProductDisplayImageSrc,
  preloadImage,
} from '../../utils/imageUtils';
import ProductDetailActionsIsland from './ProductDetailActionsIsland';

const ProductDetailLightboxIsland = dynamic(() => import('./ProductDetailLightboxIsland'), {
  ssr: false,
  loading: () => null,
});

const CartPanelIsland = dynamic(() => import('./CartPanelIsland'), {
  ssr: false,
  loading: () => null,
});

const DEFAULT_PRODUCT_IMAGE_RATIO = 0.75;
const TALL_PRODUCT_IMAGE_RATIO = 0.72;
const DEFAULT_DETAIL_BACKDROP_COLOR = '#fafaf9';

const getProductImageFitMode = (ratio) => (
  Number.isFinite(ratio) && ratio > 0 && ratio < TALL_PRODUCT_IMAGE_RATIO ? 'tall' : 'standard'
);

const getDesktopDetailImageStyle = () => ({
  width: 'min(min(calc((100vw - var(--product-detail-sidebar-width, 500px)) * 0.74), 920px), calc(min(74vh, 760px) * 0.75))',
  height: 'auto',
  aspectRatio: String(DEFAULT_PRODUCT_IMAGE_RATIO),
  maxWidth: 'min(calc((100vw - var(--product-detail-sidebar-width, 500px)) * 0.74), 920px)',
  maxHeight: 'min(74vh, 760px)',
  backgroundColor: 'transparent',
});

const getMobileDetailImageStyle = (ratio = DEFAULT_PRODUCT_IMAGE_RATIO) => ({
  aspectRatio: String(Number.isFinite(ratio) && ratio > 0 ? ratio : DEFAULT_PRODUCT_IMAGE_RATIO),
  width: 'min(94vw, 430px)',
  maxHeight: 'min(62svh, 620px)',
  borderRadius: '0.75rem',
  overflow: 'hidden',
  clipPath: 'inset(0 round 0.75rem)',
});

const getThumbSrc = (image) => (
  image?.thumb || image?.card || image?.medium || image?.src || image?.large || image?.full || ''
);

const getDisplaySrc = (image, viewport = 'desktop') => (
  getProductDisplayImageSrc(image, { viewport })
  || image?.medium
  || image?.large
  || image?.src
  || image?.card
  || image?.thumb
  || image?.full
  || ''
);

const getBackdropSrc = (image) => (
  image?.thumb || image?.card || image?.medium || image?.src || image?.large || image?.full || ''
);

const IMAGE_SWITCH_DECODE_BUDGET_MS = 500;
const IMAGE_PREWARM_STEP_MS = 140;
const IMAGE_PREWARM_MAX = 11;

const isConstrainedConnection = () => {
  if (typeof navigator === 'undefined') return false;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return Boolean(connection?.saveData) || /(^|-)2g$/.test(connection?.effectiveType || '');
};

const ProductThumbRail = ({
  images,
  activeIndex,
  onSelect,
  mobile = false,
  hasPrimaryImagePainted,
}) => {
  if (images.length <= 1) return null;

  if (mobile) {
    const mobileThumbSize = images.length > 12 ? 30 : 32;
    const mobileThumbGap = images.length > 12 ? 5 : 6;

    return (
      <div
        data-mobile-thumb-rail
        className="w-full overflow-x-auto overscroll-x-contain no-scrollbar py-2.5"
        style={{ scrollPaddingInline: '20px' }}
      >
        <div
          data-mobile-thumb-strip
          className={`flex ${images.length <= 7 ? 'min-w-full justify-center px-4' : 'w-max justify-start px-5'}`}
          style={{ gap: `${mobileThumbGap}px` }}
        >
          {images.map((image, index) => {
            const thumbSrc = getThumbSrc(image);
            const thumbPlaceholderSrc = image.metadata?.blurDataUrl || '';
            return (
              <button
                key={`${thumbSrc || index}-${index}`}
                type="button"
                data-thumb-index={index}
                onClick={() => onSelect(index)}
                className={`rounded-md overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${activeIndex === index ? 'border-[#D2C4B7] bg-white opacity-100 ring-1 ring-[#EEE7DF]' : 'border-[#EEE9E3] bg-white opacity-100'}`}
                style={{
                  width: `${mobileThumbSize}px`,
                  height: `${mobileThumbSize}px`,
                  backgroundImage: thumbSrc
                    ? `url("${thumbSrc}")`
                    : (thumbPlaceholderSrc ? `url("${thumbPlaceholderSrc}")` : undefined),
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: image.metadata?.dominantColor || 'rgba(0,0,0,0.04)',
                }}
              >
                {thumbSrc ? (
                  <img
                    src={thumbSrc}
                    className="w-full h-full object-cover rounded-[4px]"
                    alt={`Apercu ${index + 1}`}
                    loading={index < 4 ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority="low"
                    sizes={`${mobileThumbSize}px`}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      data-desktop-thumb-rail
      data-thumb-count={images.length}
      className="hidden lg:flex h-full w-[110px] min-w-[110px] max-w-[110px] flex-shrink-0 flex-col items-end gap-1.5 overflow-y-auto py-16 pt-28 pr-5 no-scrollbar relative z-30 bg-[#FAFAFA] transition-colors duration-1000"
      style={{ scrollSnapType: 'y proximity', contain: 'layout paint' }}
    >
      {images.map((image, index) => {
        const thumbSrc = getThumbSrc(image);
        const thumbPlaceholderSrc = image.metadata?.blurDataUrl || '';
        return (
          <button
            key={`${thumbSrc || index}-${index}`}
            type="button"
            aria-label={`Afficher l'image ${index + 1}`}
            data-thumb-index={index}
            onPointerEnter={() => {
              const src = getDisplaySrc(image, 'desktop');
              if (src) preloadImage(src, { priority: 'high', decode: true }).catch(() => null);
            }}
            onFocus={() => {
              const src = getDisplaySrc(image, 'desktop');
              if (src) preloadImage(src, { priority: 'high', decode: true }).catch(() => null);
            }}
            onClick={() => onSelect(index)}
            className={`h-[58px] w-[58px] flex-shrink-0 rounded-xl overflow-hidden transition-[opacity,box-shadow,transform] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] relative group ${activeIndex === index ? 'scale-100 shadow-[0_10px_40px_rgba(0,0,0,0.3)] opacity-100 z-10' : 'scale-[0.83] hover:scale-[0.9] opacity-90 z-0'}`}
            style={{
              scrollSnapAlign: 'center',
              transformOrigin: 'right center',
              backgroundImage: thumbSrc
                ? `url("${thumbSrc}")`
                : (thumbPlaceholderSrc ? `url("${thumbPlaceholderSrc}")` : undefined),
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: image.metadata?.dominantColor || 'rgba(0,0,0,0.04)',
            }}
          >
            {thumbSrc ? (
              <img
                src={thumbSrc}
                sizes="58px"
                className="w-full h-full object-cover select-none pointer-events-none"
                alt=""
                loading={index < 5 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority="low"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
};

export default function ProductDetailShellIsland({
  product,
  images,
  facts,
  priceLabel,
  desktopInfo,
  cartItem,
  darkMode = false,
}) {
  const [activeImg, setActiveImg] = useState(0);
  const [pendingImg, setPendingImg] = useState(null);
  const [underlayImg, setUnderlayImg] = useState(null);
  const [navTransition, setNavTransition] = useState({ direction: 0, fromX: 0, toX: 0 });
  const [sharpSrcs, setSharpSrcs] = useState({});
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxBaseSrc, setLightboxBaseSrc] = useState('');
  const [hasPrimaryImagePainted, setHasPrimaryImagePainted] = useState(false);
  const [cartPanelEvent, setCartPanelEvent] = useState(null);
  const mainImageRef = useRef(null);
  const swipeRef = useRef({ x: 0, y: 0 });
  const wheelStateRef = useRef({ acc: 0, resetTimer: 0, lastSwitchAt: 0 });
  const containerRef = useRef(null);
  const mobileShellRef = useRef(null);
  const mobileThumbLayerRef = useRef(null);
  const mobileImageStageRef = useRef(null);
  const mobileSummaryLayerRef = useRef(null);
  const mobileOriginBadgeRef = useRef(null);
  const touchStateRef = useRef({ startX: 0, startY: 0, endX: 0, endY: 0, startedAt: 0 });
  const descriptionTouchStateRef = useRef({ startY: 0, scrollTop: 0, isScrollable: false, startedAtTop: false, isClosingFromTop: false });
  const galleryExitTimerRef = useRef(0);
  const galleryExitFallbackTimerRef = useRef(0);
  const isClosingToGalleryRef = useRef(false);
  const hasNavigatedToGalleryRef = useRef(false);
  const activeImgRef = useRef(0);
  const navigationImgRef = useRef(0);
  const imageSwitchRequestRef = useRef(0);
  const cartPanelMountedRef = useRef(false);
  const cartPanelEventIdRef = useRef(0);
  const sharpSrcsRef = useRef({});
  const underlayClearTimerRef = useRef(0);
  const mobileImageDragRef = useRef(null);
  const imageDragStateRef = useRef({ pointerId: null, startX: 0, startY: 0, dx: 0, dy: 0, axis: null, lastX: 0, lastT: 0, velocity: 0, width: 1 });
  const suppressImageClickRef = useRef(false);

  const safeImages = images?.length ? images : [];
  const activeImage = safeImages[Math.min(activeImg, Math.max(0, safeImages.length - 1))] || {};
  const activeImageRatio = activeImage.metadata?.ratio || activeImage.ratio || DEFAULT_PRODUCT_IMAGE_RATIO;
  const activeImageFitMode = getProductImageFitMode(activeImageRatio);
  const activeSharpSrc = sharpSrcs[activeImg] || '';
  const activeDesktopSrc = activeSharpSrc || getDisplaySrc(activeImage, 'desktop');
  const activeMobileSrc = activeSharpSrc || getDisplaySrc(activeImage, 'mobile');
  const activeImageSrc = activeDesktopSrc || activeMobileSrc;
  const underlayImage = underlayImg != null ? safeImages[underlayImg] : null;
  const underlaySharpSrc = underlayImg != null ? (sharpSrcs[underlayImg] || '') : '';
  const underlayDesktopSrc = underlayImage ? (underlaySharpSrc || getDisplaySrc(underlayImage, 'desktop')) : '';
  const underlayMobileSrc = underlayImage ? (underlaySharpSrc || getDisplaySrc(underlayImage, 'mobile')) : '';
  const backdropSrc = getBackdropSrc(activeImage);
  const backdropPlaceholderSrc = activeImage.metadata?.blurDataUrl || '';
  const backdropColor = activeImage.metadata?.dominantColor || DEFAULT_DETAIL_BACKDROP_COLOR;
  const title = product?.name || product?.title || 'Produit';
  const description = product?.description || '';
  const desktopDetailImageFrameStyle = useMemo(() => getDesktopDetailImageStyle(DEFAULT_PRODUCT_IMAGE_RATIO), []);
  const mobileDetailImageFrameStyle = useMemo(
    () => ({
      ...getMobileDetailImageStyle(activeImageRatio || DEFAULT_PRODUCT_IMAGE_RATIO),
      backgroundColor: activeImage.metadata?.dominantColor || 'transparent',
      backgroundImage: activeImage.metadata?.blurDataUrl ? `url("${activeImage.metadata.blurDataUrl}")` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
    [activeImage.metadata?.blurDataUrl, activeImage.metadata?.dominantColor, activeImageRatio]
  );
  const clampImageIndex = useCallback((index) => (
    Math.max(0, Math.min(index, Math.max(0, safeImages.length - 1)))
  ), [safeImages.length]);

  const getDetailImageSrcAtIndex = useCallback((index, viewport = 'desktop') => {
    const clampedIndex = clampImageIndex(index);
    const sharpSrc = sharpSrcsRef.current[clampedIndex];
    if (sharpSrc) return sharpSrc;
    const image = safeImages[clampedIndex] || {};
    const preferredSrc = getDisplaySrc(image, viewport);
    const fallbackViewport = viewport === 'mobile' ? 'desktop' : 'mobile';
    return preferredSrc || getDisplaySrc(image, fallbackViewport);
  }, [clampImageIndex, safeImages]);

  const preloadDetailImageAtIndex = useCallback((index, options = {}) => {
    const src = getDetailImageSrcAtIndex(index, options.viewport);
    if (!src) return Promise.resolve(null);

    return preloadImage(src, {
      priority: options.priority || 'auto',
      sizes: PRODUCT_DETAIL_IMAGE_SIZES,
      decode: options.decode === true,
      decoding: 'async',
    }).catch(() => null);
  }, [getDetailImageSrcAtIndex]);

  const commitImageIndex = useCallback((index, direction = 0) => {
    const nextIndex = clampImageIndex(index);
    const previousIndex = activeImgRef.current;
    const dragNode = mobileImageDragRef.current;
    let fromX = 0;

    if (direction !== 0 && dragNode && typeof window !== 'undefined') {
      const computedTransform = window.getComputedStyle(dragNode).transform;
      if (computedTransform && computedTransform !== 'none') {
        try {
          fromX = new DOMMatrixReadOnly(computedTransform).m41 || 0;
        } catch {
          fromX = imageDragStateRef.current.dx || 0;
        }
      } else {
        fromX = imageDragStateRef.current.dx || 0;
      }
    }

    if (dragNode) {
      dragNode.style.transition = 'none';
      dragNode.style.transform = '';
      dragNode.style.opacity = '';
    }

    const viewportWidth = typeof window !== 'undefined' ? (window.innerWidth || 390) : 390;
    setNavTransition({
      direction,
      fromX,
      toX: direction === 0 ? 0 : (direction > 0 ? -1 : 1) * Math.max(viewportWidth * 0.5, Math.abs(fromX) + 120),
    });
    setUnderlayImg(previousIndex === nextIndex ? null : previousIndex);
    setActiveImg(nextIndex);
    setPendingImg(null);
    setHasPrimaryImagePainted(false);
    setLightboxBaseSrc('');
  }, [clampImageIndex]);

  const handleMainImageLoad = useCallback(() => {
    setHasPrimaryImagePainted(true);
    if (underlayClearTimerRef.current) window.clearTimeout(underlayClearTimerRef.current);
    underlayClearTimerRef.current = window.setTimeout(() => {
      underlayClearTimerRef.current = 0;
      setUnderlayImg(null);
    }, 260);
  }, []);

  const requestImageIndex = useCallback((index, options = {}) => {
    if (!safeImages.length) return false;

    const nextIndex = clampImageIndex(index);
    if (nextIndex === navigationImgRef.current && nextIndex === activeImgRef.current) return false;

    navigationImgRef.current = nextIndex;
    const requestId = imageSwitchRequestRef.current + 1;
    imageSwitchRequestRef.current = requestId;

    const finish = () => {
      if (imageSwitchRequestRef.current !== requestId) return;
      commitImageIndex(nextIndex, options.direction || 0);
    };

    if (options.waitForDecode) {
      setPendingImg(nextIndex);
      const decodePromise = preloadDetailImageAtIndex(nextIndex, {
        viewport: options.viewport,
        priority: 'high',
        decode: true,
      });
      const decodeBudget = new Promise((resolve) => {
        window.setTimeout(resolve, IMAGE_SWITCH_DECODE_BUDGET_MS);
      });
      Promise.race([decodePromise, decodeBudget]).then(finish, finish);
      return true;
    }

    finish();
    return true;
  }, [clampImageIndex, commitImageIndex, preloadDetailImageAtIndex, safeImages.length]);

  const goToIndex = useCallback((index) => {
    const viewport = typeof window !== 'undefined' && window.innerWidth < 1024 ? 'mobile' : 'desktop';
    requestImageIndex(index, { viewport, waitForDecode: true });
  }, [requestImageIndex]);

  const goPrevious = useCallback((event) => {
    event?.stopPropagation?.();
    const viewport = typeof window !== 'undefined' && window.innerWidth < 1024 ? 'mobile' : 'desktop';
    const currentIndex = navigationImgRef.current;
    requestImageIndex(currentIndex <= 0 ? safeImages.length - 1 : currentIndex - 1, { viewport, waitForDecode: true, direction: -1 });
  }, [requestImageIndex, safeImages.length]);

  const goNext = useCallback((event) => {
    event?.stopPropagation?.();
    const viewport = typeof window !== 'undefined' && window.innerWidth < 1024 ? 'mobile' : 'desktop';
    const currentIndex = navigationImgRef.current;
    requestImageIndex(currentIndex >= safeImages.length - 1 ? 0 : currentIndex + 1, { viewport, waitForDecode: true, direction: 1 });
  }, [requestImageIndex, safeImages.length]);

  const handleDesktopImageWheel = useCallback((event) => {
    if (safeImages.length <= 1 || isLightboxOpen) return;
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return;

    event.stopPropagation();

    const wheel = wheelStateRef.current;
    wheel.acc += Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

    if (Math.abs(wheel.acc) >= 60) {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (now - wheel.lastSwitchAt < 70) {
        wheel.acc = 0;
        return;
      }
      const direction = wheel.acc > 0 ? 1 : -1;
      const didSwitch = requestImageIndex(navigationImgRef.current + direction, { viewport: 'desktop', waitForDecode: true });
      if (didSwitch) wheel.lastSwitchAt = now;
      wheel.acc = 0;
    }

    if (wheel.resetTimer) window.clearTimeout(wheel.resetTimer);
    wheel.resetTimer = window.setTimeout(() => {
      wheel.acc = 0;
      wheel.resetTimer = 0;
    }, 150);
  }, [isLightboxOpen, requestImageIndex, safeImages.length]);

  useEffect(() => {
    activeImgRef.current = activeImg;
    navigationImgRef.current = activeImg;
  }, [activeImg]);

  useEffect(() => {
    sharpSrcsRef.current = sharpSrcs;
  }, [sharpSrcs]);

  useEffect(() => {
    if (underlayImg == null) return undefined;
    const timeoutId = window.setTimeout(() => setUnderlayImg(null), 1600);
    return () => window.clearTimeout(timeoutId);
  }, [underlayImg, activeImg]);

  useEffect(() => {
    const deferCartPanelEvent = (event) => {
      if (cartPanelMountedRef.current) return;
      cartPanelEventIdRef.current += 1;
      setCartPanelEvent({
        id: cartPanelEventIdRef.current,
        type: event.type,
        detail: event.detail || null,
      });
    };

    window.addEventListener('sv:open-cart', deferCartPanelEvent);
    window.addEventListener('sv:product-added', deferCartPanelEvent);
    return () => {
      window.removeEventListener('sv:open-cart', deferCartPanelEvent);
      window.removeEventListener('sv:product-added', deferCartPanelEvent);
    };
  }, []);

  const handleCartPanelReady = useCallback(() => {
    cartPanelMountedRef.current = true;
  }, []);

  useEffect(() => {
    if (safeImages.length <= 1 || typeof window === 'undefined') return undefined;
    if (isConstrainedConnection()) return undefined;

    const isDesktop = window.matchMedia?.('(min-width: 1024px)').matches;
    const viewport = isDesktop ? 'desktop' : 'mobile';
    const pending = [];

    for (let offset = 1; offset < safeImages.length && pending.length < IMAGE_PREWARM_MAX; offset += 1) {
      if (activeImg + offset < safeImages.length) pending.push(activeImg + offset);
      if (activeImg - offset >= 0) pending.push(activeImg - offset);
    }

    if (!pending.length) return undefined;

    let cancelled = false;
    let timerId = 0;

    const runNext = () => {
      if (cancelled || !pending.length) return;
      const index = pending.shift();
      preloadDetailImageAtIndex(index, {
        viewport,
        priority: 'low',
        decode: true,
      });
      if (pending.length) timerId = window.setTimeout(runNext, IMAGE_PREWARM_STEP_MS);
    };

    timerId = window.setTimeout(runNext, hasPrimaryImagePainted ? 120 : 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [activeImg, hasPrimaryImagePainted, preloadDetailImageAtIndex, safeImages.length]);

  useEffect(() => {
    if (!hasPrimaryImagePainted || typeof window === 'undefined') return undefined;
    if (isConstrainedConnection()) return undefined;

    const image = safeImages[activeImg];
    const largeSrc = image?.variants?.large || '';
    if (!largeSrc || sharpSrcs[activeImg] === largeSrc) return undefined;

    const isDesktop = window.innerWidth >= 1024;
    const baseSrc = getDisplaySrc(image, isDesktop ? 'desktop' : 'mobile');
    if (!baseSrc || largeSrc === baseSrc) return undefined;

    const dpr = window.devicePixelRatio || 1;
    const frameWidth = isDesktop
      ? Math.min((window.innerWidth - 610) * 0.74, 920)
      : Math.min(window.innerWidth * 0.94, 430);
    if (frameWidth * dpr <= 1100) return undefined;

    let cancelled = false;
    const timerId = window.setTimeout(() => {
      preloadImage(largeSrc, { priority: 'low', decode: true })
        .then(() => {
          if (cancelled) return;
          setSharpSrcs((prev) => (prev[activeImg] === largeSrc ? prev : { ...prev, [activeImg]: largeSrc }));
        })
        .catch(() => null);
    }, 420);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [activeImg, hasPrimaryImagePainted, safeImages, sharpSrcs]);

  useEffect(() => () => {
    if (wheelStateRef.current.resetTimer) {
      window.clearTimeout(wheelStateRef.current.resetTimer);
    }
    if (galleryExitTimerRef.current) {
      window.clearTimeout(galleryExitTimerRef.current);
    }
    if (galleryExitFallbackTimerRef.current) {
      window.clearTimeout(galleryExitFallbackTimerRef.current);
    }
    if (underlayClearTimerRef.current) {
      window.clearTimeout(underlayClearTimerRef.current);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const node = mainImageRef.current;
    if (node?.complete && node.naturalWidth > 0) {
      setHasPrimaryImagePainted(true);
    }
  }, []);

  const restoreUrlFromSession = useCallback(() => {
    try {
      const raw = window.sessionStorage.getItem('secondevie:product-return:v1');
      if (!raw) return '';
      const saved = JSON.parse(raw);
      if (!saved?.href || Date.now() - Number(saved.savedAt || 0) > 30 * 60 * 1000) return '';
      const target = new URL(saved.href, window.location.origin);
      if (target.origin !== window.location.origin || target.pathname !== '/galerie') return '';
      return `${target.pathname}${target.search}${target.hash}`;
    } catch {
      return '';
    }
  }, []);

  const navigateToGalleryTarget = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (hasNavigatedToGalleryRef.current) return;

    hasNavigatedToGalleryRef.current = true;
    const targetHref = restoreUrlFromSession() || '/galerie';
    try {
      window.sessionStorage.setItem('secondevie:open-gallery-on-arrival', 'true');
    } catch {}
    window.location.replace(targetHref);
  }, [restoreUrlFromSession]);

  const applyLayeredGalleryExit = useCallback((progress) => {
    const p = Math.max(0, Math.min(1, progress));
    const viewportHeight = window.visualViewport?.height || window.innerHeight || 800;
    const background = '#FAFAF9';

    [containerRef.current, mobileShellRef.current].forEach((node) => {
      if (!node) return;
      node.style.willChange = 'background-color';
      node.style.backgroundColor = background;
    });

    if (mobileImageStageRef.current) {
      const imageProgress = Math.min(1, p * 1.48);
      mobileImageStageRef.current.style.willChange = 'transform, opacity';
      mobileImageStageRef.current.style.transform = `translate3d(0, ${p * viewportHeight * 0.54}px, 0) scale(${1 - imageProgress * 0.035})`;
      mobileImageStageRef.current.style.opacity = `${1 - imageProgress}`;
    }

    if (mobileSummaryLayerRef.current) {
      mobileSummaryLayerRef.current.style.willChange = 'transform, opacity';
      mobileSummaryLayerRef.current.style.transform = `translate3d(0, ${p * viewportHeight * 0.28}px, 0)`;
      mobileSummaryLayerRef.current.style.opacity = `${1 - Math.pow(p, 1.18)}`;
    }

    if (mobileOriginBadgeRef.current) {
      mobileOriginBadgeRef.current.style.willChange = 'transform, opacity';
      mobileOriginBadgeRef.current.style.transform = `translate3d(0, ${p * viewportHeight * 0.2}px, 0)`;
      mobileOriginBadgeRef.current.style.opacity = `${1 - Math.pow(p, 1.28)}`;
    }

    if (mobileThumbLayerRef.current) {
      mobileThumbLayerRef.current.style.willChange = 'transform, opacity';
      mobileThumbLayerRef.current.style.transform = `translate3d(0, ${-p * viewportHeight * 0.17}px, 0)`;
      mobileThumbLayerRef.current.style.opacity = `${1 - Math.pow(p, 1.85)}`;
    }
  }, []);

  const closeToGallery = useCallback(() => {
    if (typeof window === 'undefined' || isClosingToGalleryRef.current) return;

    isClosingToGalleryRef.current = true;
    if (galleryExitTimerRef.current) window.clearTimeout(galleryExitTimerRef.current);
    if (galleryExitFallbackTimerRef.current) window.clearTimeout(galleryExitFallbackTimerRef.current);

    [containerRef.current, mobileShellRef.current].forEach((node) => {
      if (node) node.style.transition = 'background-color 0.16s ease-out';
    });
    if (mobileImageStageRef.current) {
      mobileImageStageRef.current.style.transition = 'transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.12s ease-out';
    }
    if (mobileSummaryLayerRef.current) {
      mobileSummaryLayerRef.current.style.transition = 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.14s ease-out';
    }
    if (mobileOriginBadgeRef.current) {
      mobileOriginBadgeRef.current.style.transition = 'transform 0.16s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.12s ease-out';
    }
    if (mobileThumbLayerRef.current) {
      mobileThumbLayerRef.current.style.transition = 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.16s ease-out';
    }

    mobileImageStageRef.current?.getBoundingClientRect();
    applyLayeredGalleryExit(1);
    if (containerRef.current) containerRef.current.style.pointerEvents = 'none';

    galleryExitTimerRef.current = window.setTimeout(navigateToGalleryTarget, 150);
    galleryExitFallbackTimerRef.current = window.setTimeout(navigateToGalleryTarget, 380);
  }, [applyLayeredGalleryExit, navigateToGalleryTarget]);

  const openProductLightbox = useCallback(() => {
    if (suppressImageClickRef.current) return;
    const visibleSrc = mainImageRef.current?.currentSrc || mainImageRef.current?.src || activeImageSrc;
    setLightboxBaseSrc(visibleSrc);
    setIsLightboxOpen(true);
  }, [activeImageSrc]);

  const resetImageDrag = (animated) => {
    const node = mobileImageDragRef.current;
    if (!node) return;
    node.style.transition = animated
      ? 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease-out'
      : 'none';
    node.style.transform = '';
    node.style.opacity = '';
  };

  const onPointerDown = (event) => {
    swipeRef.current = { x: event.clientX, y: event.clientY };
    touchStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      endX: event.clientX,
      endY: event.clientY,
      startedAt: performance.now(),
    };
    const drag = imageDragStateRef.current;
    drag.pointerId = event.pointerId ?? null;
    drag.startX = event.clientX;
    drag.startY = event.clientY;
    drag.dx = 0;
    drag.dy = 0;
    drag.axis = null;
    drag.lastX = event.clientX;
    drag.lastT = performance.now();
    drag.velocity = 0;
    drag.width = (typeof window !== 'undefined' && window.innerWidth) || 390;
    const node = mobileImageDragRef.current;
    if (node) {
      node.style.transition = 'none';
      node.style.willChange = 'transform, opacity';
    }
  };

  const onImagePointerMove = (event) => {
    const drag = imageDragStateRef.current;
    if (drag.pointerId === null || event.pointerId !== drag.pointerId) return;
    if (isMobilePanelOpen || isLightboxOpen) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    drag.dx = dx;
    drag.dy = dy;

    const now = performance.now();
    const dt = now - drag.lastT;
    if (dt > 0) {
      drag.velocity = (event.clientX - drag.lastX) / dt;
      drag.lastX = event.clientX;
      drag.lastT = now;
    }

    if (!drag.axis) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) drag.axis = 'x';
      else if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.2) drag.axis = 'y';
    }

    if (drag.axis !== 'x' || safeImages.length <= 1) return;

    const node = mobileImageDragRef.current;
    if (!node) return;
    const progress = Math.min(1, Math.abs(dx) / drag.width);
    node.style.transform = `translate3d(${dx}px, 0, 0) scale(${1 - progress * 0.05})`;
    node.style.opacity = `${1 - progress * 0.4}`;
  };

  const onImagePointerCancel = () => {
    imageDragStateRef.current.pointerId = null;
    imageDragStateRef.current.axis = null;
    resetImageDrag(true);
  };

  const onPointerUp = (event) => {
    const drag = imageDragStateRef.current;
    const axis = drag.axis;
    drag.pointerId = null;
    const dx = event.clientX - swipeRef.current.x;
    const dy = event.clientY - swipeRef.current.y;

    if (axis === 'x' && safeImages.length > 1 && !isMobilePanelOpen && !isLightboxOpen) {
      const flick = Math.abs(drag.velocity) > 0.45 && Math.abs(dx) > 24;
      const shouldCommit = Math.abs(dx) > drag.width * 0.18 || flick;
      if (shouldCommit) {
        suppressImageClickRef.current = true;
        window.setTimeout(() => {
          suppressImageClickRef.current = false;
        }, 420);
        if (dx < 0) goNext(event);
        else goPrevious(event);
        return;
      }
      resetImageDrag(true);
      return;
    }

    resetImageDrag(false);

    if (Math.abs(dy) > 58 && Math.abs(dy) > Math.abs(dx) * 1.2 && dy < 0) {
      setIsMobilePanelOpen(true);
      return;
    }
    if (Math.abs(dy) > 58 && Math.abs(dy) > Math.abs(dx) * 1.2 && dy > 0 && !isMobilePanelOpen) {
      closeToGallery();
    }
  };

  const isDescriptionScrollable = (node) => node.scrollHeight > node.clientHeight + 1;

  const onPanelTouchStart = (event) => {
    const touch = event.targetTouches[0];
    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      endX: touch.clientX,
      endY: touch.clientY,
      startedAt: performance.now(),
    };
  };

  const onPanelTouchMove = (event) => {
    touchStateRef.current.endX = event.targetTouches[0].clientX;
    touchStateRef.current.endY = event.targetTouches[0].clientY;
  };

  const onSheetCloseZoneTouchEnd = (event) => {
    const { startX, startY, endX, endY } = touchStateRef.current;
    if (!startX || !startY || !endX || !endY) return;

    const dy = startY - endY;
    const dx = startX - endX;
    if (dy < -34 && Math.abs(dy) > Math.abs(dx) * 1.05) {
      setIsMobilePanelOpen(false);
    }
    event.stopPropagation();
  };

  const onDescriptionTouchStart = (event) => {
    const scroller = event.currentTarget;
    descriptionTouchStateRef.current = {
      startY: event.targetTouches[0].clientY,
      scrollTop: scroller.scrollTop,
      isScrollable: isDescriptionScrollable(scroller),
      startedAtTop: scroller.scrollTop <= 1,
      isClosingFromTop: false,
    };

    if (!descriptionTouchStateRef.current.isScrollable || descriptionTouchStateRef.current.startedAtTop) {
      onPointerDown({
        clientX: event.targetTouches[0].clientX,
        clientY: event.targetTouches[0].clientY,
      });
    }

    event.stopPropagation();
  };

  const onDescriptionTouchMove = (event) => {
    const scroller = event.currentTarget;
    const state = descriptionTouchStateRef.current;
    if (!state.isScrollable) {
      onPanelTouchMove(event);
      event.stopPropagation();
      return;
    }

    const currentY = event.targetTouches[0].clientY;
    const pullDownDistance = currentY - state.startY;

    if (state.startedAtTop && (state.isClosingFromTop || pullDownDistance > 10)) {
      state.isClosingFromTop = true;
      onPanelTouchMove(event);
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    scroller.scrollTop = state.scrollTop + (state.startY - currentY);
    event.preventDefault();
    event.stopPropagation();
  };

  const onDescriptionTouchEnd = (event) => {
    const state = descriptionTouchStateRef.current;
    if (!state.isScrollable || state.isClosingFromTop) {
      onSheetCloseZoneTouchEnd(event);
      return;
    }
    event.stopPropagation();
  };

  const onDescriptionWheel = (event) => {
    if (event.currentTarget.scrollTop <= 1 && event.deltaY < -80) {
      setIsMobilePanelOpen(false);
    }
    event.stopPropagation();
  };

  const mobileInfoRows = facts?.filter((fact) => fact?.value) || [];
  const shouldReserveDesktopThumbRail = safeImages.length > 1 || product?.__catalogScope !== 'full';

  return (
    <div
      ref={containerRef}
      data-next-product-detail-shell="native"
      data-native-scroll-region
      className={`fixed inset-0 z-[100] w-screen overflow-hidden font-body selection:bg-secondary-container selection:text-on-secondary-container ${darkMode ? 'bg-[#0A0A0A] text-stone-100' : 'bg-[#f4f1ec] text-stone-900'}`}
      style={{
        height: 'var(--marketplace-viewport-height, 100svh)',
        backgroundColor: backdropColor,
      }}
    >
      {backdropSrc || backdropPlaceholderSrc ? (
        <div
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden hidden lg:flex items-center justify-center"
          style={{ backgroundColor: backdropColor }}
        >
          {backdropPlaceholderSrc ? (
            <div
              key={`backdrop-placeholder-${activeImg}`}
              aria-hidden="true"
              className="absolute h-[120%] w-[120%] scale-110 bg-cover bg-center opacity-50 blur-[80px] saturate-150"
              style={{ backgroundImage: `url("${backdropPlaceholderSrc}")` }}
            />
          ) : null}
          {backdropSrc ? (
            <img
              key={backdropSrc}
              src={backdropSrc}
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="h-[120%] w-[120%] scale-110 object-cover object-center opacity-50 blur-[80px] saturate-150"
            />
          ) : null}
        </div>
      ) : null}

      <main className="w-full h-full lg:overflow-hidden lg:flex lg:flex-row relative">
        <div ref={mobileShellRef} className={`fixed inset-0 overflow-hidden overscroll-none transition-colors duration-500 lg:hidden ${darkMode ? 'bg-[#0A0A0A]' : 'bg-[#FAFAF9]'}`} style={{ height: 'var(--marketplace-viewport-height, 100svh)' }}>
          <div ref={mobileThumbLayerRef} className={`absolute top-0 left-0 w-full z-20 px-3 safe-pt-product-thumbs pb-1 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${isMobilePanelOpen ? '-translate-y-full' : 'translate-y-0'}`}>
            <ProductThumbRail
              images={safeImages}
              activeIndex={pendingImg ?? activeImg}
              onSelect={goToIndex}
              mobile
              hasPrimaryImagePainted={hasPrimaryImagePainted}
            />
          </div>

          <div
            ref={mobileImageStageRef}
            className="absolute top-0 left-0 w-full flex items-center justify-center px-2 safe-product-image-stage transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] z-10 touch-none"
            style={{
              height: 'var(--marketplace-viewport-height, 100svh)',
              willChange: 'transform',
              transform: isMobilePanelOpen ? 'translate3d(0, -4rem, 0)' : 'translate3d(0, 0, 0)',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onImagePointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onImagePointerCancel}
          >
            <div className="relative flex h-full w-full cursor-zoom-in items-center justify-center" onClick={openProductLightbox}>
              <div ref={mobileImageDragRef} className="product-detail-mobile-image-shadow pointer-events-none drop-shadow-[0_20px_42px_rgba(92,75,57,0.24)]">
                <div data-fit-mode={activeImageFitMode} className="product-detail-mobile-image-frame" style={mobileDetailImageFrameStyle}>
                  <div className="product-detail-mobile-image-clip">
                    {underlayMobileSrc && underlayMobileSrc !== activeMobileSrc ? (
                      <img
                        key={`mobile-under-${underlayMobileSrc}`}
                        src={underlayMobileSrc}
                        alt=""
                        aria-hidden="true"
                        data-fit-mode={activeImageFitMode}
                        className={`product-detail-mobile-image ${navTransition.direction !== 0 ? 'product-detail-mobile-image-underlay-exit' : ''} object-cover select-none`}
                        style={{
                          zIndex: 1,
                          '--sv-image-exit-from': `${navTransition.fromX}px`,
                          '--sv-image-exit-to': `${navTransition.toX}px`,
                          width: '100%',
                          height: '100%',
                          maxWidth: 'none',
                          maxHeight: 'none',
                          objectFit: 'cover',
                          borderRadius: 0,
                          overflow: 'visible',
                          clipPath: 'none',
                          transition: 'none',
                        }}
                        draggable={false}
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                      />
                    ) : null}
                    {activeMobileSrc ? (
                      <img
                        key={`mobile-${activeImg}`}
                        ref={mainImageRef}
                        src={activeMobileSrc}
                        srcSet={undefined}
                        sizes={PRODUCT_DETAIL_IMAGE_SIZES}
                        alt={title}
                        data-product-main-image="true"
                        data-fit-mode={activeImageFitMode}
                        className={`product-detail-mobile-image product-detail-mobile-image-layer--current ${navTransition.direction === 1 ? 'product-detail-mobile-image-enter--next' : navTransition.direction === -1 ? 'product-detail-mobile-image-enter--prev' : 'product-detail-main-image-fade'} object-cover select-none`}
                        style={{
                          zIndex: 2,
                          width: '100%',
                          height: '100%',
                          maxWidth: 'none',
                          maxHeight: 'none',
                          objectFit: 'cover',
                          borderRadius: 0,
                          overflow: 'visible',
                          clipPath: 'none',
                          transition: 'none',
                        }}
                        onLoad={handleMainImageLoad}
                        draggable={false}
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {product?.origin ? (
              <div ref={mobileOriginBadgeRef} className={`absolute top-[80px] left-4 px-3 py-1.5 rounded-full font-label text-[9px] tracking-[0.2em] uppercase backdrop-blur-md border transition-all duration-300 bg-white/80 text-stone-700 border-stone-200 ${isMobilePanelOpen ? 'opacity-0' : 'opacity-100'}`}>
                {product.origin}
              </div>
            ) : null}

            <div ref={mobileSummaryLayerRef} className={`absolute bottom-0 left-0 w-full px-5 safe-pb-product-summary flex items-end justify-between transition-opacity duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isMobilePanelOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <div className="absolute -top-[70px] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5 text-stone-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
                <span className="text-[9px] uppercase tracking-[0.4em] font-light translate-x-[0.2em] mt-1 text-stone-500 drop-shadow-[0_1px_6px_rgba(255,255,255,0.9)]">
                  Détails
                </span>
              </div>
              <div className="flex-1 pr-4">
                <h2 className="font-serif text-[18px] line-clamp-1 mb-1 text-stone-950 drop-shadow-[0_1px_8px_rgba(255,255,255,0.95)]">{title}</h2>
                <p className="font-sans text-[12px] line-clamp-2 text-stone-600 drop-shadow-[0_1px_8px_rgba(255,255,255,0.95)]">{description}</p>
              </div>
              <div className="flex items-center gap-5 flex-shrink-0 pb-1 text-stone-950 drop-shadow-[0_1px_8px_rgba(255,255,255,0.95)]">
                <button type="button" onClick={() => setIsMobilePanelOpen(true)} aria-label="Ouvrir les details">
                  <AlignLeft size={24} strokeWidth={1.5} />
                </button>
                <button type="button" aria-label="Favori">
                  <Heart size={24} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          <div
            data-mobile-bottom-sheet
            className={`absolute bottom-0 left-0 w-full backdrop-blur-3xl rounded-t-3xl border-t transition-[transform,background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] z-30 flex h-[clamp(30rem,calc(var(--marketplace-viewport-height,100svh)*0.66),40rem)] max-h-[calc(var(--marketplace-viewport-height,100svh)-5.5rem)] flex-col overflow-hidden bg-[#fffdfb]/95 border-stone-200 shadow-[0_-24px_80px_rgba(92,75,57,0.16)] ${isMobilePanelOpen ? 'translate-y-0' : 'translate-y-full'}`}
          >
            <div className="flex h-full min-h-0 w-full flex-col px-5 pt-4 safe-pb-product-sheet">
              <div
                data-mobile-sheet-close-zone
                className="flex-shrink-0 touch-pan-y select-none"
                onTouchStart={onPanelTouchStart}
                onTouchMove={onPanelTouchMove}
                onTouchEnd={onSheetCloseZoneTouchEnd}
              >
                <button
                  type="button"
                  className="block w-12 h-1 rounded-full mx-auto mb-5 cursor-pointer bg-stone-300"
                  onClick={() => setIsMobilePanelOpen(false)}
                  aria-label="Fermer les details"
                />
                <div className="pb-1">
                  <h3 className="font-label text-[10px] tracking-[0.3em] uppercase text-[#91a293] mb-3">Informations</h3>
                  <ul className="space-y-2 font-label text-[9px] tracking-widest uppercase text-[#757575]">
                    {mobileInfoRows.map((fact) => (
                      <li key={fact.label} className="flex justify-between border-b pb-1.5 border-stone-200">
                        <span>{fact.label}</span>
                        <span className="text-stone-800 font-sans">{fact.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 flex min-h-0 flex-1 flex-col">
                <h3 className="font-label text-[10px] tracking-[0.3em] uppercase text-[#91a293] mb-3 flex-shrink-0">La Pièce</h3>
                <div
                  data-mobile-description-scroll
                  className="mobile-description-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y pr-2"
                  onTouchStart={onDescriptionTouchStart}
                  onTouchMove={onDescriptionTouchMove}
                  onTouchEnd={onDescriptionTouchEnd}
                  onWheel={onDescriptionWheel}
                >
                  <p className="font-sans text-[13px] leading-[1.65] whitespace-pre-wrap text-stone-600">{description}</p>
                </div>
              </div>
              <ProductDetailActionsIsland
                productId={product?.id}
                productName={title}
                priceLabel={priceLabel}
                cartItem={cartItem}
                mobile
              />
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 h-[100vh] grid grid-rows-[15vh_72vh_13vh] relative overflow-hidden bg-black/5">
          <div className="w-full h-full pointer-events-none" />
          <div className="w-full h-full flex flex-col items-center justify-center relative row-span-1">
            <button
              type="button"
              onClick={closeToGallery}
              aria-label="Fermer la fiche produit"
              className="group fixed z-[130] flex items-center justify-center rounded-full text-stone-950 outline-none transition-all duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
              style={{
                top: 'clamp(5.5rem, 12vh, 8rem)',
                right: 'calc(clamp(450px, 26vw, 500px) + 110px + 2rem)',
              }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(25,18,10,0.28)] backdrop-blur-md transition-all duration-300 group-hover:border-white group-hover:bg-white group-hover:shadow-[0_22px_54px_rgba(25,18,10,0.36)]">
                <X size={20} strokeWidth={2.4} className="drop-shadow-[0_1px_0_rgba(255,255,255,0.45)] transition-transform duration-300 group-hover:rotate-90" />
              </div>
            </button>

            <div
              className="relative z-10 w-full h-full flex items-center justify-center cursor-zoom-in"
              onClick={openProductLightbox}
              onWheel={handleDesktopImageWheel}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {!activeImageSrc ? (
                  <div
                    aria-hidden="true"
                    className="absolute rounded-2xl bg-stone-200/45 shadow-[0_45px_110px_-25px_rgba(0,0,0,0.45)]"
                    style={{
                      ...desktopDetailImageFrameStyle,
                      backgroundColor: activeImage.metadata?.dominantColor || DEFAULT_DETAIL_BACKDROP_COLOR,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                ) : null}
                <div
                  className="relative overflow-hidden rounded-2xl shadow-[0_45px_110px_-25px_rgba(0,0,0,0.8)]"
                  style={{
                    ...desktopDetailImageFrameStyle,
                    backgroundColor: activeImage.metadata?.dominantColor || 'transparent',
                    backgroundImage: activeImage.metadata?.blurDataUrl ? `url("${activeImage.metadata.blurDataUrl}")` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {underlayDesktopSrc && underlayDesktopSrc !== activeImageSrc ? (
                    <img
                      key={`desktop-under-${underlayDesktopSrc}`}
                      src={underlayDesktopSrc}
                      alt=""
                      aria-hidden="true"
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      className="absolute inset-0 z-10 block h-full w-full object-cover"
                    />
                  ) : null}
                  {activeImageSrc ? (
                    <img
                      key={`desktop-${activeImg}`}
                      ref={mainImageRef}
                      src={activeImageSrc}
                      srcSet={undefined}
                      sizes={PRODUCT_DETAIL_IMAGE_SIZES}
                      alt={title}
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      onLoad={handleMainImageLoad}
                      data-product-main-image="true"
                      data-desktop-image-ready="true"
                      className="product-detail-main-image-fade absolute inset-0 z-20 block h-full w-full object-cover opacity-100"
                    />
                  ) : null}
                </div>
              </div>

              {product?.origin ? (
                <div className="absolute top-4 right-4 bg-black/40 px-3 py-1.5 rounded-full text-white/80 font-label text-[9px] tracking-[0.2em] uppercase backdrop-blur-md z-40 border border-white/10">
                  {product.origin}
                </div>
              ) : null}

            </div>
          </div>
          <div className="w-full h-full pointer-events-none" />
        </div>

        {desktopInfo}

        {shouldReserveDesktopThumbRail ? (
          <ProductThumbRail
            images={safeImages}
            activeIndex={pendingImg ?? activeImg}
            onSelect={goToIndex}
            hasPrimaryImagePainted={hasPrimaryImagePainted}
          />
        ) : null}
      </main>

      {isLightboxOpen ? (
        <ProductDetailLightboxIsland
          activeImage={activeImage}
          activeImageSrc={activeImageSrc}
          activeImageFitMode={activeImageFitMode}
          activeIndex={activeImg}
          imageCount={safeImages.length}
          baseSrc={lightboxBaseSrc}
          onClose={() => setIsLightboxOpen(false)}
          onPrevious={goPrevious}
          onNext={goNext}
        />
      ) : null}
      {cartPanelEvent ? (
        <CartPanelIsland className="hidden" initialEvent={cartPanelEvent} onReady={handleCartPanelReady} />
      ) : null}
    </div>
  );
}
