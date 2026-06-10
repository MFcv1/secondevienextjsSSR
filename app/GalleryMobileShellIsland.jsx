'use client';

import { useEffect, useRef } from 'react';

const MOBILE_MARKETPLACE_QUERY = '(max-width: 1023px)';
const PULL_REFRESH_THRESHOLD = 74;
const PULL_REFRESH_MAX_DISTANCE = 96;

export default function GalleryMobileShellIsland() {
  const pullRefreshRef = useRef({
    startX: 0,
    startY: 0,
    isTracking: false,
    isRefreshing: false,
  });
  const indicatorRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const galleryScroll = document.getElementById('marketplaceGalleryScroll');
    const mediaQuery = window.matchMedia(MOBILE_MARKETPLACE_QUERY);

    const setViewportHeight = () => {
      const height = Math.round(window.visualViewport?.height || window.innerHeight || 0);
      if (height > 0) {
        root.style.setProperty('--marketplace-viewport-height', `${height}px`);
      }
    };

    const syncMobileShell = () => {
      const shouldLock = mediaQuery.matches;
      setViewportHeight();
      root.classList.toggle('marketplace-mobile-scroll-lock', shouldLock);
      body.classList.toggle('marketplace-mobile-scroll-lock', shouldLock);
      if (galleryScroll) {
        if (shouldLock) galleryScroll.setAttribute('data-native-scroll-region', 'true');
        else galleryScroll.removeAttribute('data-native-scroll-region');
      }
    };

    const setIndicator = (distance, ready = false) => {
      const indicator = indicatorRef.current;
      if (!indicator) return;
      indicator.style.opacity = String(Math.min(1, distance / 48));
      indicator.style.transform = `translate3d(-50%, ${Math.max(0, distance - 28)}px, 0)`;
      indicator.dataset.ready = ready ? 'true' : 'false';
    };

    const resetPullRefresh = () => {
      pullRefreshRef.current = {
        startX: 0,
        startY: 0,
        isTracking: false,
        isRefreshing: false,
      };
      setIndicator(0, false);
    };

    const onTouchStart = (event) => {
      if (!mediaQuery.matches || event.touches.length !== 1 || !galleryScroll || galleryScroll.scrollTop > 0) {
        resetPullRefresh();
        return;
      }
      const touch = event.touches[0];
      pullRefreshRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        isTracking: true,
        isRefreshing: false,
      };
    };

    const onTouchMove = (event) => {
      const state = pullRefreshRef.current;
      if (!state.isTracking || state.isRefreshing || event.touches.length !== 1 || !galleryScroll) return;
      if (galleryScroll.scrollTop > 0) {
        resetPullRefresh();
        return;
      }
      const touch = event.touches[0];
      const pullY = touch.clientY - state.startY;
      const driftX = Math.abs(touch.clientX - state.startX);
      if (pullY <= 0 || driftX > pullY * 0.85) {
        setIndicator(0, false);
        return;
      }
      event.preventDefault();
      const distance = Math.min(PULL_REFRESH_MAX_DISTANCE, pullY * 0.58);
      setIndicator(distance, distance >= PULL_REFRESH_THRESHOLD);
    };

    const onTouchEnd = () => {
      const state = pullRefreshRef.current;
      if (!state.isTracking || state.isRefreshing) return;
      const ready = indicatorRef.current?.dataset.ready === 'true';
      if (ready) {
        pullRefreshRef.current = { ...state, isRefreshing: true };
        setIndicator(PULL_REFRESH_THRESHOLD, true);
        window.setTimeout(() => window.location.reload(), 90);
        return;
      }
      resetPullRefresh();
    };

    syncMobileShell();
    mediaQuery.addEventListener?.('change', syncMobileShell);
    window.addEventListener('resize', syncMobileShell);
    window.visualViewport?.addEventListener('resize', syncMobileShell);
    galleryScroll?.addEventListener('touchstart', onTouchStart, { passive: true });
    galleryScroll?.addEventListener('touchmove', onTouchMove, { passive: false });
    galleryScroll?.addEventListener('touchend', onTouchEnd, { passive: true });
    galleryScroll?.addEventListener('touchcancel', resetPullRefresh, { passive: true });

    return () => {
      mediaQuery.removeEventListener?.('change', syncMobileShell);
      window.removeEventListener('resize', syncMobileShell);
      window.visualViewport?.removeEventListener('resize', syncMobileShell);
      galleryScroll?.removeEventListener('touchstart', onTouchStart);
      galleryScroll?.removeEventListener('touchmove', onTouchMove);
      galleryScroll?.removeEventListener('touchend', onTouchEnd);
      galleryScroll?.removeEventListener('touchcancel', resetPullRefresh);
      root.classList.remove('marketplace-mobile-scroll-lock');
      body.classList.remove('marketplace-mobile-scroll-lock');
      galleryScroll?.removeAttribute('data-native-scroll-region');
    };
  }, []);

  return (
    <div
      ref={indicatorRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-1/2 safe-top-pull-refresh z-[70] flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/90 text-stone-800 opacity-0 shadow-[0_12px_28px_rgba(28,25,23,0.16)] backdrop-blur-md transition-opacity duration-150"
    >
      <span className="block h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
    </div>
  );
}
