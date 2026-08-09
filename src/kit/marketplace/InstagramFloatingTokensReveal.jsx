'use client';

import { useEffect } from 'react';

const REVEAL_THRESHOLDS = [0, 0.02, 0.1, 0.2, 0.32, 0.44, 0.56];
const REVEAL_GAP_DESKTOP_MS = 180;
const REVEAL_GAP_MOBILE_MS = 220;
const COUNTER_DURATION_MS = 1200;
const COUNTER_TO_BUBBLES_LEAD_MS = 450;
const INPUT_SETTLE_MS = 150;
const IMAGE_INPUT_SETTLE_MS = 240;

const DESKTOP_TOKEN_ORDER = [
  'gram',
  'send',
  'spark',
  'message',
  'left-star',
  'right-tag',
  'heart',
  'save',
  'left-mini',
  'at',
];

const MOBILE_TOKEN_ORDER = [
  'gram',
  'message',
  'mail',
  'spark',
  'send',
  'save',
  'heart',
  'at',
];

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

    const allTokens = Array.from(field.querySelectorAll('.instagram-floating-token'));
    const isMobile = window.matchMedia('(max-width: 1023px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observerRoot = isMobile.matches
      ? document.getElementById('marketplaceGalleryScroll')
      : null;
    const scrollTarget = observerRoot || window;
    const tokenById = new Map(allTokens.map((token) => [token.dataset.floatingId, token]));
    const tokenOrder = isMobile.matches ? MOBILE_TOKEN_ORDER : DESKTOP_TOKEN_ORDER;
    const tokens = tokenOrder.map((id) => tokenById.get(id)).filter(Boolean);
    const counterValues = Array.from(section.querySelectorAll('[data-instagram-counter-value]'));
    const counterTargetValue = Number(section.dataset.instagramCounterTarget);
    const counterValueTarget = Number.isFinite(counterTargetValue) && counterTargetValue > 0
      ? counterTargetValue
      : null;
    const counterTarget = counterValues.find((counterValue) => counterValue.offsetParent !== null)
      || counterValues[0];
    const revealGapMs = isMobile.matches ? REVEAL_GAP_MOBILE_MS : REVEAL_GAP_DESKTOP_MS;

    let cancelled = false;
    let prepareObserver = null;
    let revealObserver = null;
    let counterObserver = null;
    let revealTimer = null;
    let pendingRevealFrame = null;
    let pendingRevealToken = null;
    let queuedRank = 0;
    let imageWarmTimer = null;
    let cancelImageIdle = null;
    let imageWarmRunning = false;
    let sectionNearby = false;
    let sectionVisible = false;
    let inputActive = false;
    let inputSettleTimer = null;
    let lastInputAt = window.performance?.now?.() || Date.now();
    let counterAnimationFrame = null;
    let counterStarted = counterValues.length === 0 || counterValueTarget === null;
    let tokenRevealNotBefore = 0;
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
        .filter((image) => Boolean(image.currentSrc || image.getAttribute('src')))
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
    };

    const markSettled = (token) => {
      if (token.dataset.floatingSettled === 'true') return;
      token.dataset.floatingSettled = 'true';
    };

    const setCounterValue = (value) => {
      const formattedValue = value.toFixed(1);
      counterValues.forEach((counterValue) => {
        counterValue.textContent = formattedValue;
      });
    };

    const startCounterAnimation = () => {
      if (counterStarted || counterValues.length === 0 || counterValueTarget === null) return;
      counterStarted = true;
      const startedAt = window.performance.now();
      tokenRevealNotBefore = startedAt + COUNTER_TO_BUBBLES_LEAD_MS;
      section.dataset.instagramCounterState = 'running';
      setCounterValue(0);

      const animateCounter = (now) => {
        if (cancelled) return;
        const progress = Math.min(1, (now - startedAt) / COUNTER_DURATION_MS);
        const easedProgress = 1 - (1 - progress) ** 4;
        const displayedValue = progress >= 0.96
          ? counterValueTarget
          : counterValueTarget * easedProgress;
        setCounterValue(displayedValue);

        if (progress < 1) {
          counterAnimationFrame = window.requestAnimationFrame(animateCounter);
          return;
        }

        counterAnimationFrame = null;
        setCounterValue(counterValueTarget);
        section.dataset.instagramCounterState = 'complete';
      };

      counterAnimationFrame = window.requestAnimationFrame(animateCounter);
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
      }, 1200);
      settleFallbacks.add(fallback);

      token.dataset.floatingRevealed = 'true';
    };

    const cancelPendingReveal = () => {
      if (pendingRevealFrame !== null) {
        window.cancelAnimationFrame(pendingRevealFrame);
        pendingRevealFrame = null;
      }
      if (pendingRevealToken && pendingRevealToken.dataset.floatingRevealed !== 'true') {
        pendingRevealToken.dataset.floatingPrepared = 'false';
      }
      pendingRevealToken = null;
    };

    const pauseRevealQueue = () => {
      if (revealTimer !== null) {
        window.clearTimeout(revealTimer);
        revealTimer = null;
      }
      cancelPendingReveal();
    };

    const revealNextToken = () => {
      revealTimer = null;
      if (cancelled || inputActive || !sectionVisible) return;

      const token = tokens.find((candidate) => (
        candidate.dataset.floatingRevealed !== 'true'
        && getTokenRank(candidate) <= queuedRank
      ));
      if (!token) return;

      pendingRevealToken = token;
      token.dataset.floatingPrepared = 'true';
      pendingRevealFrame = window.requestAnimationFrame(() => {
        pendingRevealFrame = null;
        if (cancelled || inputActive || !sectionVisible) {
          cancelPendingReveal();
          return;
        }
        pendingRevealToken = null;
        revealToken(token);
        revealTimer = window.setTimeout(revealNextToken, revealGapMs);
      });
    };

    const scheduleReveal = (delay = 0) => {
      if (
        cancelled
        || inputActive
        || !sectionVisible
        || !counterStarted
        || revealTimer !== null
        || pendingRevealFrame !== null
      ) return;
      const now = window.performance?.now?.() || Date.now();
      const counterLeadDelay = Math.max(0, tokenRevealNotBefore - now);
      revealTimer = window.setTimeout(revealNextToken, Math.max(delay, counterLeadDelay));
    };

    const queueRevealThrough = (nextRank) => {
      prepare();
      sectionNearby = true;
      scheduleImageWarm();
      queuedRank = Math.max(queuedRank, Math.min(5, nextRank));
      scheduleReveal();
    };

    const setInputActive = (active) => {
      if (inputActive === active) return;
      inputActive = active;
      field.dataset.floatingScrollActive = String(active);
      section.dataset.instagramInputActive = String(active);
      if (active) {
        pauseRevealQueue();
        return;
      }
      scheduleReveal();
      if (sectionNearby) scheduleImageWarm(80);
    };

    const armInputSettle = () => {
      if (inputSettleTimer !== null) {
        window.clearTimeout(inputSettleTimer);
      }
      inputSettleTimer = window.setTimeout(() => {
        inputSettleTimer = null;
        if (cancelled) return;
        setInputActive(false);
      }, INPUT_SETTLE_MS);
    };

    if (reducedMotion) {
      prepare();
      section.dataset.instagramCounterState = 'complete';
      if (counterValueTarget !== null) setCounterValue(counterValueTarget);
      tokens.forEach((token) => {
        token.dataset.floatingPrepared = 'true';
        token.dataset.floatingRevealed = 'true';
        token.dataset.floatingSettled = 'true';
      });
    } else if ('IntersectionObserver' in window) {
      prepareObserver = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          sectionNearby = true;
          prepare();
          const now = window.performance?.now?.() || Date.now();
          if (now - lastInputAt < INPUT_SETTLE_MS) {
            setInputActive(true);
            armInputSettle();
          }
          scheduleImageWarm();
          prepareObserver?.disconnect();
          prepareObserver = null;
        },
        { root: observerRoot, rootMargin: '75% 0px 75% 0px', threshold: 0 },
      );

      revealObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries.find((item) => item.target === section);
          if (!entry) return;
          sectionVisible = entry.isIntersecting;
          field.dataset.floatingVisible = String(sectionVisible);
          if (!sectionVisible) {
            pauseRevealQueue();
            return;
          }
          queueRevealThrough(getRankForRatio(entry.intersectionRatio));
        },
        { root: observerRoot, rootMargin: '0px', threshold: REVEAL_THRESHOLDS },
      );

      if (counterTarget) {
        counterObserver = new IntersectionObserver(
          (entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            startCounterAnimation();
            scheduleReveal();
            counterObserver?.disconnect();
            counterObserver = null;
          },
          { root: observerRoot, rootMargin: '0px 0px -10% 0px', threshold: 0.35 },
        );
        counterObserver.observe(counterTarget);
      }

      prepareObserver.observe(section);
      revealObserver.observe(section);
    } else {
      sectionNearby = true;
      sectionVisible = true;
      field.dataset.floatingVisible = 'true';
      prepare();
      startCounterAnimation();
      queueRevealThrough(5);
    }

    const markInput = () => {
      lastInputAt = window.performance?.now?.() || Date.now();
      if (!sectionNearby && !sectionVisible) return;
      setInputActive(true);
      armInputSettle();
    };
    const markInputEnd = () => {
      if (inputSettleTimer !== null) {
        window.clearTimeout(inputSettleTimer);
      }
      inputSettleTimer = window.setTimeout(() => {
        inputSettleTimer = null;
        if (!cancelled) setInputActive(false);
      }, 48);
    };
    scrollTarget.addEventListener('scroll', markInput, { passive: true });
    scrollTarget.addEventListener('scrollend', markInputEnd, { passive: true });

    return () => {
      cancelled = true;
      clearImageWarmSchedule();
      prepareObserver?.disconnect();
      revealObserver?.disconnect();
      counterObserver?.disconnect();
      scrollTarget.removeEventListener('scroll', markInput);
      scrollTarget.removeEventListener('scrollend', markInputEnd);
      pauseRevealQueue();
      if (counterAnimationFrame !== null) {
        window.cancelAnimationFrame(counterAnimationFrame);
      }
      if (inputSettleTimer !== null) window.clearTimeout(inputSettleTimer);
      settleFallbacks.forEach((timer) => window.clearTimeout(timer));
      transitionCleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}
