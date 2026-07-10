'use client';

import { useEffect } from 'react';

const REVEAL_THRESHOLDS = [0, 0.02, 0.1, 0.2, 0.32, 0.44, 0.56];
const REVEAL_STEP_MS = 105;
const IMAGE_INPUT_SETTLE_MS = 240;

const getRankForRatio = (ratio) => {
  if (ratio >= 0.46) return 5;
  if (ratio >= 0.34) return 4;
  if (ratio >= 0.22) return 3;
  if (ratio >= 0.11) return 2;
  if (ratio >= 0.02) return 1;
  return 0;
};

const scheduleIdle = (callback) => {
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(callback, { timeout: 700 });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(callback, 80);
  return () => window.clearTimeout(id);
};

export default function InstagramFloatingTokensReveal() {
  useEffect(() => {
    const field = document.querySelector('[data-instagram-floating-field="true"]');
    if (!field) return undefined;
    const section = field.closest('[data-instagram-carousel]');
    if (!section) return undefined;

    const tokens = Array.from(field.querySelectorAll('.instagram-floating-token'));
    const isMobile = window.matchMedia('(max-width: 1023px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observerRoot = isMobile.matches
      ? document.getElementById('marketplaceGalleryScroll')
      : null;

    let cancelled = false;
    let prepareScheduled = false;
    let cancelIdle = null;
    let prepareObserver = null;
    let revealObserver = null;
    let revealTimer = null;
    let revealedRank = 0;
    let queuedRank = 0;
    let imageWarmTimer = null;
    let cancelImageIdle = null;
    let imageWarmRunning = false;
    let sectionNearby = false;
    let lastInputAt = window.performance?.now?.() || Date.now();
    const prepareTimers = new Set();
    const settleFallbacks = new Set();
    const transitionCleanups = new Set();

    const getTokenRank = (token) => Number(
      isMobile.matches
        ? token.dataset.floatingRankMobile
        : token.dataset.floatingRankDesktop,
    ) || 5;

    const clearImageWarmSchedule = () => {
      if (imageWarmTimer !== null) {
        window.clearTimeout(imageWarmTimer);
        imageWarmTimer = null;
      }
      cancelImageIdle?.();
      cancelImageIdle = null;
    };

    const scheduleImageWarm = (delay = IMAGE_INPUT_SETTLE_MS + 80) => {
      clearImageWarmSchedule();
      if (cancelled || !sectionNearby || section.dataset.instagramImagesWarmed === 'true') return;
      imageWarmTimer = window.setTimeout(() => {
        imageWarmTimer = null;
        const now = window.performance?.now?.() || Date.now();
        const calmFor = now - lastInputAt;
        if (calmFor < IMAGE_INPUT_SETTLE_MS) {
          scheduleImageWarm(IMAGE_INPUT_SETTLE_MS - calmFor + 60);
          return;
        }
        cancelImageIdle = scheduleIdle(() => {
          cancelImageIdle = null;
          const idleNow = window.performance?.now?.() || Date.now();
          if (idleNow - lastInputAt < IMAGE_INPUT_SETTLE_MS) {
            scheduleImageWarm();
            return;
          }
          void warmInstagramImages();
        });
      }, delay);
    };

    const warmInstagramImages = async () => {
      if (imageWarmRunning || cancelled) return;
      imageWarmRunning = true;
      const layout = isMobile.matches ? 'mobile' : 'desktop';
      const images = Array.from(section.querySelectorAll(`[data-insta-layout="${layout}"] img[data-insta-img]`));
      const uniqueImages = Array.from(new Map(images.map((image) => [image.currentSrc || image.src, image])).values())
        .filter((image) => image.dataset.instaDecoded !== 'true')
        .sort((left, right) => {
          const leftIndex = Number(left.closest('[data-insta-card]')?.dataset.instaCard || 0);
          const rightIndex = Number(right.closest('[data-insta-card]')?.dataset.instaCard || 0);
          return Math.abs(leftIndex - 1) - Math.abs(rightIndex - 1);
        });

      try {
        for (const image of uniqueImages) {
          if (cancelled) return;
          const now = window.performance?.now?.() || Date.now();
          if (now - lastInputAt < IMAGE_INPUT_SETTLE_MS) {
            scheduleImageWarm();
            return;
          }
          image.loading = 'eager';
          image.fetchPriority = 'low';
          try {
            await image.decode();
          } catch {
            // The normal image request remains the fallback if decode is unavailable or interrupted.
          }
          image.dataset.instaDecoded = 'true';
          await new Promise((resolve) => window.setTimeout(resolve, 52));
        }
        section.dataset.instagramImagesWarmed = 'true';
      } finally {
        imageWarmRunning = false;
      }
    };

    const prepare = () => {
      if (cancelled || field.dataset.floatingPrepared === 'true') return;
      field.dataset.floatingPrepared = 'true';
      for (let rank = 1; rank <= 5; rank += 1) {
        const timer = window.setTimeout(() => {
          prepareTimers.delete(timer);
          tokens
            .filter((token) => getTokenRank(token) === rank)
            .forEach((token) => {
              token.dataset.floatingPrepared = 'true';
            });
        }, (rank - 1) * 58);
        prepareTimers.add(timer);
      }
    };

    const schedulePrepare = () => {
      if (prepareScheduled || field.dataset.floatingPrepared === 'true') return;
      prepareScheduled = true;
      cancelIdle = scheduleIdle(() => {
        cancelIdle = null;
        prepare();
      });
    };

    const forcePrepare = () => {
      cancelIdle?.();
      cancelIdle = null;
      prepareScheduled = false;
      prepare();
    };

    const markSettled = (token) => {
      if (token.dataset.floatingSettled === 'true') return;
      token.dataset.floatingSettled = 'true';
    };

    const revealToken = (token) => {
      if (token.dataset.floatingRevealed === 'true') return;
      token.dataset.floatingPrepared = 'true';

      let fallback = null;
      const onTransitionEnd = (event) => {
        if (event.target !== token || event.propertyName !== 'transform') return;
        token.removeEventListener('transitionend', onTransitionEnd);
        transitionCleanups.delete(cleanupTransition);
        if (fallback !== null) {
          window.clearTimeout(fallback);
          settleFallbacks.delete(fallback);
          fallback = null;
        }
        markSettled(token);
      };
      const cleanupTransition = () => token.removeEventListener('transitionend', onTransitionEnd);
      transitionCleanups.add(cleanupTransition);
      token.addEventListener('transitionend', onTransitionEnd);

      fallback = window.setTimeout(() => {
        settleFallbacks.delete(fallback);
        cleanupTransition();
        transitionCleanups.delete(cleanupTransition);
        markSettled(token);
      }, 2400);
      settleFallbacks.add(fallback);

      token.dataset.floatingRevealed = 'true';
    };

    const revealNextRank = () => {
      revealTimer = null;
      if (cancelled || revealedRank >= queuedRank) return;

      revealedRank += 1;
      tokens.filter((token) => getTokenRank(token) === revealedRank).forEach(revealToken);

      if (revealedRank < queuedRank) {
        revealTimer = window.setTimeout(revealNextRank, REVEAL_STEP_MS);
      }
    };

    const queueRevealThrough = (nextRank) => {
      if (nextRank <= queuedRank) return;
      prepare();
      sectionNearby = true;
      scheduleImageWarm();
      queuedRank = Math.min(5, nextRank);
      if (revealTimer === null && revealedRank < queuedRank) {
        revealTimer = window.setTimeout(revealNextRank, revealedRank === 0 ? 0 : REVEAL_STEP_MS);
      }
    };

    if (reducedMotion) {
      forcePrepare();
      tokens.forEach((token) => {
        token.dataset.floatingRevealed = 'true';
        token.dataset.floatingSettled = 'true';
      });
    } else if ('IntersectionObserver' in window) {
      prepareObserver = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          sectionNearby = true;
          forcePrepare();
          scheduleImageWarm();
          prepareObserver?.disconnect();
          prepareObserver = null;
        },
        { root: observerRoot, rootMargin: '75% 0px 75% 0px', threshold: 0 },
      );

      revealObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries.find((item) => item.target === section);
          if (!entry?.isIntersecting) return;
          queueRevealThrough(getRankForRatio(entry.intersectionRatio));
        },
        { root: observerRoot, rootMargin: '0px', threshold: REVEAL_THRESHOLDS },
      );

      prepareObserver.observe(section);
      revealObserver.observe(section);
    } else {
      sectionNearby = true;
      schedulePrepare();
      queueRevealThrough(5);
    }

    const markInput = () => {
      lastInputAt = window.performance?.now?.() || Date.now();
      if (sectionNearby) scheduleImageWarm();
    };
    window.addEventListener('wheel', markInput, { passive: true });
    window.addEventListener('touchmove', markInput, { passive: true });
    window.addEventListener('scroll', markInput, { passive: true });
    observerRoot?.addEventListener('scroll', markInput, { passive: true });

    return () => {
      cancelled = true;
      cancelIdle?.();
      clearImageWarmSchedule();
      prepareObserver?.disconnect();
      revealObserver?.disconnect();
      window.removeEventListener('wheel', markInput);
      window.removeEventListener('touchmove', markInput);
      window.removeEventListener('scroll', markInput);
      observerRoot?.removeEventListener('scroll', markInput);
      if (revealTimer !== null) window.clearTimeout(revealTimer);
      prepareTimers.forEach((timer) => window.clearTimeout(timer));
      settleFallbacks.forEach((timer) => window.clearTimeout(timer));
      transitionCleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}
