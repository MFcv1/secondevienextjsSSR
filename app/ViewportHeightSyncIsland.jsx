'use client';

import { useEffect } from 'react';

const VIEWPORT_HEIGHT_PROPERTY = '--marketplace-viewport-height';

export default function ViewportHeightSyncIsland() {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    let animationFrameId = 0;

    const syncViewportHeight = () => {
      animationFrameId = 0;
      const height = Math.round(viewport?.height || window.innerHeight || 0);
      if (height <= 0) return;

      const nextValue = `${height}px`;
      if (root.style.getPropertyValue(VIEWPORT_HEIGHT_PROPERTY) !== nextValue) {
        root.style.setProperty(VIEWPORT_HEIGHT_PROPERTY, nextValue);
      }
    };

    const scheduleViewportSync = () => {
      if (animationFrameId) return;
      animationFrameId = window.requestAnimationFrame(syncViewportHeight);
    };

    const syncWhenVisible = () => {
      if (document.visibilityState === 'visible') scheduleViewportSync();
    };

    syncViewportHeight();
    viewport?.addEventListener('resize', scheduleViewportSync);
    viewport?.addEventListener('scroll', scheduleViewportSync);
    window.addEventListener('resize', scheduleViewportSync);
    window.addEventListener('orientationchange', scheduleViewportSync);
    window.addEventListener('pageshow', scheduleViewportSync);
    window.addEventListener('focus', scheduleViewportSync);
    document.addEventListener('visibilitychange', syncWhenVisible);

    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      viewport?.removeEventListener('resize', scheduleViewportSync);
      viewport?.removeEventListener('scroll', scheduleViewportSync);
      window.removeEventListener('resize', scheduleViewportSync);
      window.removeEventListener('orientationchange', scheduleViewportSync);
      window.removeEventListener('pageshow', scheduleViewportSync);
      window.removeEventListener('focus', scheduleViewportSync);
      document.removeEventListener('visibilitychange', syncWhenVisible);
    };
  }, []);

  return null;
}
