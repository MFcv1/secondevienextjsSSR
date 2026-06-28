'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  getProductZoomFullImageSrc,
  getProductZoomInitialImageSrc,
  preloadImage,
} from '../../utils/imageUtils';

const MORPH_DURATION_MS = 520;
const CLOSE_DURATION_MS = 260;
const MORPH_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

const prefersReducedMotion = () => (
  typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
);

const getMorphTransform = (originRect, targetNode) => {
  if (!originRect || !targetNode) return null;
  const targetRect = targetNode.getBoundingClientRect();
  if (!targetRect.width || !targetRect.height || !originRect.width || !originRect.height) return null;

  return {
    x: originRect.left - targetRect.left,
    y: originRect.top - targetRect.top,
    scaleX: originRect.width / targetRect.width,
    scaleY: originRect.height / targetRect.height,
  };
};

const toTransform = ({ x, y, scaleX, scaleY }) => (
  `translate3d(${x}px, ${y}px, 0) scale(${scaleX}, ${scaleY})`
);

export default function ProductDetailLightboxIsland({
  activeImage,
  activeImageSrc,
  activeImageFitMode,
  activeIndex,
  imageCount,
  baseSrc,
  originRect,
  onClose,
  onPrevious,
  onNext,
}) {
  const [fullSrc, setFullSrc] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const rootRef = useRef(null);
  const imageRef = useRef(null);
  const controlsRef = useRef(null);
  const openAnimationPlayedRef = useRef(false);
  const closeTimerRef = useRef(0);
  const wheelStateRef = useRef({ acc: 0, lastSwitchAt: 0, resetTimer: 0 });
  const pointerStateRef = useRef({ pointerId: null, startX: 0, startY: 0, dx: 0, dy: 0 });
  const initialSrc = useMemo(
    () => getProductZoomInitialImageSrc(activeImage, {
      displaySrc: baseSrc || activeImageSrc,
      viewport: 'desktop',
    }),
    [activeImage, activeImageSrc, baseSrc]
  );
  const lightboxSrc = fullSrc || initialSrc;
  const canNavigate = imageCount > 1;

  useLayoutEffect(() => {
    if (!lightboxSrc || openAnimationPlayedRef.current || typeof window === 'undefined') return undefined;

    const frameId = window.requestAnimationFrame(() => {
      openAnimationPlayedRef.current = true;
      const imageNode = imageRef.current;
      const morph = getMorphTransform(originRect, imageNode);

      rootRef.current?.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 220, easing: 'ease-out', fill: 'both' }
      );
      controlsRef.current?.animate(
        [
          { opacity: 0, transform: 'translate3d(-50%, 16px, 0) scale(0.96)' },
          { opacity: 1, transform: 'translate3d(-50%, 0, 0) scale(1)' },
        ],
        { duration: 360, delay: 160, easing: MORPH_EASING, fill: 'both' }
      );

      if (!morph || prefersReducedMotion()) return;

      imageNode?.animate(
        [
          {
            opacity: 0.98,
            transform: toTransform(morph),
            borderRadius: '12px',
          },
          {
            opacity: 1,
            transform: 'translate3d(0, 0, 0) scale(1, 1)',
            borderRadius: '0px',
          },
        ],
        { duration: MORPH_DURATION_MS, easing: MORPH_EASING, fill: 'both' }
      );
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [lightboxSrc, originRect]);

  useEffect(() => {
    setFullSrc('');
    const zoomSrc = getProductZoomFullImageSrc(activeImage);
    const visibleSrc = baseSrc || activeImageSrc;
    if (!zoomSrc || zoomSrc === visibleSrc) return undefined;

    let cancelled = false;
    const timerId = window.setTimeout(() => {
      preloadImage(zoomSrc, { priority: 'auto', decode: true })
        .then(() => {
          if (!cancelled) setFullSrc(zoomSrc);
        })
        .catch(() => null);
    }, 420);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [activeImage, activeImageSrc, baseSrc]);

  const finishClose = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = 0;
    }
    onClose?.();
  }, [onClose]);

  const requestClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);

    const imageNode = imageRef.current;
    const morph = getMorphTransform(originRect, imageNode);
    const animations = [];

    if (prefersReducedMotion() || !morph) {
      finishClose();
      return;
    }

    animations.push(rootRef.current?.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: CLOSE_DURATION_MS, easing: 'ease-in', fill: 'both' }
    ));
    animations.push(controlsRef.current?.animate(
      [
        { opacity: 1, transform: 'translate3d(-50%, 0, 0) scale(1)' },
        { opacity: 0, transform: 'translate3d(-50%, 14px, 0) scale(0.97)' },
      ],
      { duration: 180, easing: 'ease-in', fill: 'both' }
    ));
    animations.push(imageNode?.animate(
      [
        {
          opacity: 1,
          transform: 'translate3d(0, 0, 0) scale(1, 1)',
          borderRadius: '0px',
        },
        {
          opacity: 0.96,
          transform: toTransform(morph),
          borderRadius: '12px',
        },
      ],
      { duration: CLOSE_DURATION_MS, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'both' }
    ));

    let done = false;
    const finishOnce = () => {
      if (done) return;
      done = true;
      finishClose();
    };

    closeTimerRef.current = window.setTimeout(finishOnce, CLOSE_DURATION_MS + 120);
    Promise.all(
      animations
        .filter(Boolean)
        .map((animation) => animation.finished.catch(() => null))
    ).then(finishOnce, finishOnce);
  }, [finishClose, isClosing, originRect]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        requestClose();
        return;
      }
      if (!canNavigate) return;
      if (event.key === 'ArrowLeft') onPrevious?.(event);
      if (event.key === 'ArrowRight') onNext?.(event);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canNavigate, onNext, onPrevious, requestClose]);

  useEffect(() => () => {
    if (wheelStateRef.current.resetTimer) {
      window.clearTimeout(wheelStateRef.current.resetTimer);
    }
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
  }, []);

  const switchImage = useCallback((direction, event) => {
    if (!canNavigate || isClosing) return;
    if (direction > 0) onNext?.(event);
    else onPrevious?.(event);
  }, [canNavigate, isClosing, onNext, onPrevious]);

  const handleWheel = useCallback((event) => {
    if (!canNavigate || isClosing) return;
    event.preventDefault();
    event.stopPropagation();

    const wheel = wheelStateRef.current;
    wheel.acc += Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

    if (Math.abs(wheel.acc) >= 42) {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (now - wheel.lastSwitchAt >= 120) {
        switchImage(wheel.acc > 0 ? 1 : -1, event);
        wheel.lastSwitchAt = now;
      }
      wheel.acc = 0;
    }

    if (wheel.resetTimer) window.clearTimeout(wheel.resetTimer);
    wheel.resetTimer = window.setTimeout(() => {
      wheel.acc = 0;
      wheel.resetTimer = 0;
    }, 160);
  }, [canNavigate, isClosing, switchImage]);

  const handlePointerDown = useCallback((event) => {
    pointerStateRef.current = {
      pointerId: event.pointerId ?? null,
      startX: event.clientX,
      startY: event.clientY,
      dx: 0,
      dy: 0,
    };
  }, []);

  const handlePointerMove = useCallback((event) => {
    const state = pointerStateRef.current;
    if (state.pointerId === null || event.pointerId !== state.pointerId) return;
    state.dx = event.clientX - state.startX;
    state.dy = event.clientY - state.startY;
  }, []);

  const handlePointerEnd = useCallback((event) => {
    const state = pointerStateRef.current;
    if (state.pointerId === null || event.pointerId !== state.pointerId) return;
    pointerStateRef.current.pointerId = null;

    const absX = Math.abs(state.dx);
    const absY = Math.abs(state.dy);
    if (!canNavigate || isClosing || absX < 42 || absX < absY * 1.1) return;

    event.preventDefault();
    event.stopPropagation();
    switchImage(state.dx < 0 ? 1 : -1, event);
  }, [canNavigate, isClosing, switchImage]);

  const handleControlClick = useCallback((handler) => (event) => {
    event.preventDefault();
    event.stopPropagation();
    handler(event);
  }, []);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Image produit agrandie"
      data-product-lightbox="true"
      data-lightbox-closing={isClosing ? 'true' : 'false'}
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-[#f7f2ec]/96 text-stone-800 backdrop-blur-md"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      <div className="absolute left-5 top-6 z-[3100] font-label text-[10px] uppercase tracking-[0.4em] text-stone-500 md:left-10 md:top-10">
        {activeIndex + 1} / {imageCount}
      </div>
      <div className="flex h-full w-full cursor-zoom-in touch-none items-center justify-center overflow-hidden px-2 pb-28 pt-12 sm:px-5 md:px-12 md:py-16">
        {lightboxSrc ? (
          <img
            ref={imageRef}
            src={lightboxSrc}
            srcSet={undefined}
            sizes="100vw"
            alt="Detail"
            data-fit-mode={activeImageFitMode}
            data-lightbox-current-image="true"
            data-lightbox-initial-src={initialSrc}
            data-lightbox-full-src={fullSrc || ''}
            className="product-detail-lightbox-image pointer-events-none select-none object-contain drop-shadow-[0_24px_54px_rgba(92,75,57,0.18)] will-change-transform"
            draggable={false}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        ) : null}
      </div>
      <div
        ref={controlsRef}
        data-lightbox-controls="bottom"
        className="absolute bottom-[max(1rem,calc(env(safe-area-inset-bottom,0px)+1rem))] left-1/2 z-[3100] flex items-center gap-1 rounded-full border border-[#fff8ef]/18 bg-[#17130f]/88 p-1 text-[#fff8ef] shadow-[0_20px_60px_rgba(38,24,12,0.32)] backdrop-blur-xl"
        style={{ transform: 'translate3d(-50%, 0, 0)' }}
        onPointerDown={(event) => event.stopPropagation()}
        onWheel={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Image precedente"
          disabled={!canNavigate || isClosing}
          onClick={handleControlClick((event) => switchImage(-1, event))}
          className="flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 hover:bg-[#fff8ef]/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff8ef]/80 disabled:cursor-not-allowed disabled:opacity-35 sm:h-12 sm:w-12"
        >
          <ChevronLeft size={22} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          aria-label="Fermer le zoom"
          disabled={isClosing}
          onClick={handleControlClick(requestClose)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff8ef] text-[#17130f] shadow-[inset_0_1px_0_rgba(255,255,255,0.62),0_8px_22px_rgba(0,0,0,0.22)] transition-all duration-200 hover:scale-[1.03] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff8ef]/90 disabled:cursor-wait disabled:opacity-80 sm:h-14 sm:w-14"
        >
          <X size={22} strokeWidth={2.1} />
        </button>
        <button
          type="button"
          aria-label="Image suivante"
          disabled={!canNavigate || isClosing}
          onClick={handleControlClick((event) => switchImage(1, event))}
          className="flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 hover:bg-[#fff8ef]/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff8ef]/80 disabled:cursor-not-allowed disabled:opacity-35 sm:h-12 sm:w-12"
        >
          <ChevronRight size={22} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}