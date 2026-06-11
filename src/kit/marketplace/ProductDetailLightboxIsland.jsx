'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import {
  getProductZoomFullImageSrc,
  getProductZoomInitialImageSrc,
  preloadImage,
} from '../../utils/imageUtils';

export default function ProductDetailLightboxIsland({
  activeImage,
  activeImageSrc,
  activeImageFitMode,
  activeIndex,
  imageCount,
  baseSrc,
  onClose,
  onPrevious,
  onNext,
}) {
  const [fullSrc, setFullSrc] = useState('');
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

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
        return;
      }
      if (imageCount <= 1) return;
      if (event.key === 'ArrowLeft') onPrevious?.(event);
      if (event.key === 'ArrowRight') onNext?.(event);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [imageCount, onClose, onNext, onPrevious]);

  useEffect(() => () => {
    if (wheelStateRef.current.resetTimer) {
      window.clearTimeout(wheelStateRef.current.resetTimer);
    }
  }, []);

  const switchImage = useCallback((direction, event) => {
    if (imageCount <= 1) return;
    if (direction > 0) onNext?.(event);
    else onPrevious?.(event);
  }, [imageCount, onNext, onPrevious]);

  const handleWheel = useCallback((event) => {
    if (imageCount <= 1) return;
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
  }, [imageCount, switchImage]);

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
    if (imageCount <= 1 || absX < 42 || absX < absY * 1.1) return;

    event.preventDefault();
    event.stopPropagation();
    switchImage(state.dx < 0 ? 1 : -1, event);
  }, [imageCount, switchImage]);

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center animate-in fade-in duration-300 backdrop-blur-md bg-[#FAFAF9]/95 text-stone-700"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      <button
        aria-label="Fermer l'image agrandie"
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-[3100] w-12 h-12 flex items-center justify-center rounded-full transition-all text-stone-700 border border-[#EEE9E3] bg-white/85 shadow-[0_10px_30px_rgba(92,75,57,0.10)] hover:bg-white hover:text-stone-950"
      >
        <X size={20} />
      </button>
      <div className="absolute top-6 left-5 md:top-10 md:left-10 z-[3100] text-[10px] font-label uppercase tracking-[0.4em] text-stone-500">
        {activeIndex + 1} / {imageCount}
      </div>
      <div className="w-full h-full flex items-center justify-center overflow-hidden touch-none p-1 sm:p-3 md:p-12 cursor-zoom-in">
        {lightboxSrc ? (
          <img
            src={lightboxSrc}
            srcSet={undefined}
            sizes="100vw"
            alt="Detail"
            data-fit-mode={activeImageFitMode}
            data-lightbox-initial-src={initialSrc}
            data-lightbox-full-src={fullSrc || ''}
            className="product-detail-lightbox-image object-contain pointer-events-none select-none will-change-transform drop-shadow-[0_24px_54px_rgba(92,75,57,0.18)]"
            draggable={false}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        ) : null}
      </div>
    </div>
  );
}
