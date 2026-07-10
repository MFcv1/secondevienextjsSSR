'use client';

import { useEffect } from 'react';

const HERO_DURATION = 5500;
const HERO_PRELOAD_CALM_MS = 1800;
const INPUT_SETTLE_MS = 360;

const getNow = () => window.performance?.now?.() || Date.now();

export default function HeroMotionIsland() {
  useEffect(() => {
    const root = document.querySelector('[data-gallery-hero]');
    if (!root) return undefined;
    const slides = Array.from(root.querySelectorAll('[data-hero-slide]'));
    const buttons = Array.from(root.querySelectorAll('[data-hero-step]'));
    if (slides.length <= 1) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const loadPromises = new WeakMap();
    let activeIndex = 0;
    let timer = 0;
    let preloadTimer = 0;
    let idleHandle = 0;
    let idleUsesWindow = false;
    let disposed = false;
    let pendingActivation = 0;
    let lastInputAt = getNow();
    let heroVisible = root.getBoundingClientRect().bottom > 0;

    const clearFallback = () => {
      window.clearTimeout(timer);
      timer = 0;
    };

    const clearWarmup = () => {
      window.clearTimeout(preloadTimer);
      preloadTimer = 0;
      if (!idleHandle) return;
      if (idleUsesWindow && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleHandle);
      } else {
        window.clearTimeout(idleHandle);
      }
      idleHandle = 0;
    };

    const getActiveFill = () => (
      buttons[activeIndex]?.querySelector('[data-hero-progress-fill]') || null
    );

    const getActiveAnimation = () => (
      getActiveFill()?.getAnimations?.()
        ?.find((entry) => entry.animationName === 'hero-segment-progress') || null
    );

    const getRemainingProgressMs = () => {
      const animation = getActiveAnimation();
      const duration = Number(animation?.effect?.getTiming?.().duration) || HERO_DURATION;
      const currentTime = Number(animation?.currentTime) || 0;
      return Math.max(0, duration - currentTime);
    };

    const ensureSlideLoaded = (index) => {
      const slide = slides[index];
      const image = slide?.querySelector('[data-hero-image]');
      if (!image || image.currentSrc || image.src) return Promise.resolve();

      const existingPromise = loadPromises.get(image);
      if (existingPromise) return existingPromise;

      const source = slide.querySelector('source[data-hero-mobile-src]');
      if (source?.dataset.heroMobileSrc) {
        source.srcset = source.dataset.heroMobileSrc;
        delete source.dataset.heroMobileSrc;
      }
      if (image.dataset.heroSrc) {
        image.fetchPriority = 'low';
        image.src = image.dataset.heroSrc;
        delete image.dataset.heroSrc;
      }

      const loadPromise = typeof image.decode === 'function'
        ? image.decode().catch(() => {})
        : Promise.resolve();
      loadPromises.set(image, loadPromise);
      return loadPromise;
    };

    const scheduleFallback = () => {
      clearFallback();
      if (disposed || reducedMotion || !heroVisible || document.hidden) return;
      timer = window.setTimeout(() => {
        timer = 0;
        requestActive(activeIndex + 1);
      }, getRemainingProgressMs() + 80);
    };

    const applyActive = (nextIndex) => {
      if (disposed) return;
      activeIndex = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, index) => {
        slide.style.opacity = index === activeIndex ? '1' : '0';
        slide.setAttribute('aria-hidden', index === activeIndex ? 'false' : 'true');
      });
      buttons.forEach((button, index) => {
        const isActive = index === activeIndex;
        button.setAttribute('aria-current', isActive ? 'true' : 'false');
        const fill = button.querySelector('[data-hero-progress-fill]');
        if (!fill) return;
        fill.style.animation = 'none';
        fill.style.transform = 'scaleX(0)';
        if (isActive && !reducedMotion) {
          window.requestAnimationFrame(() => {
            if (disposed) return;
            fill.style.animation = `hero-segment-progress ${HERO_DURATION}ms linear forwards`;
          });
        }
      });
      scheduleFallback();
      scheduleWarmNext();
    };

    function requestActive(nextIndex) {
      const resolvedIndex = (nextIndex + slides.length) % slides.length;
      const activation = pendingActivation + 1;
      pendingActivation = activation;
      clearFallback();
      void ensureSlideLoaded(resolvedIndex).then(() => {
        if (disposed || activation !== pendingActivation) return;
        applyActive(resolvedIndex);
      });
    }

    function scheduleWarmNext(delay = HERO_PRELOAD_CALM_MS) {
      clearWarmup();
      if (disposed || reducedMotion || !heroVisible || document.hidden) return;

      preloadTimer = window.setTimeout(() => {
        preloadTimer = 0;
        if (disposed || !heroVisible || document.hidden) return;
        const calmFor = getNow() - lastInputAt;
        if (calmFor < INPUT_SETTLE_MS) {
          scheduleWarmNext(INPUT_SETTLE_MS - calmFor + 80);
          return;
        }

        const warm = () => {
          idleHandle = 0;
          if (disposed || !heroVisible || document.hidden) return;
          if (getNow() - lastInputAt < INPUT_SETTLE_MS) {
            scheduleWarmNext(240);
            return;
          }
          void ensureSlideLoaded((activeIndex + 1) % slides.length);
        };

        if ('requestIdleCallback' in window) {
          idleUsesWindow = true;
          idleHandle = window.requestIdleCallback(warm, { timeout: 1200 });
        } else {
          idleUsesWindow = false;
          idleHandle = window.setTimeout(warm, 120);
        }
      }, delay);
    }

    const handleProgressEnd = (event) => {
      const button = event.target?.closest?.('[data-hero-step]');
      const index = buttons.indexOf(button);
      if (index === activeIndex && heroVisible) requestActive(activeIndex + 1);
    };

    const markInput = () => {
      lastInputAt = getNow();
      if (heroVisible) scheduleWarmNext();
    };

    const clickHandlers = buttons.map((button, index) => {
      const handleClick = () => requestActive(index);
      button.addEventListener('click', handleClick);
      return [button, handleClick];
    });

    buttons.forEach((button, index) => {
      if (button.getAttribute('aria-current') === 'true') activeIndex = index;
      button.querySelector('[data-hero-progress-fill]')?.addEventListener('animationend', handleProgressEnd);
    });

    const visibilityObserver = 'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => {
        const nextVisible = Boolean(entry?.isIntersecting && entry.intersectionRatio > 0.02);
        if (nextVisible === heroVisible) return;
        heroVisible = nextVisible;
        if (!heroVisible) {
          clearFallback();
          clearWarmup();
          getActiveAnimation()?.pause?.();
          return;
        }
        getActiveAnimation()?.play?.();
        scheduleFallback();
        scheduleWarmNext();
      }, { threshold: [0, 0.02] })
      : null;
    visibilityObserver?.observe(root);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearFallback();
        clearWarmup();
        getActiveAnimation()?.pause?.();
        return;
      }
      if (!heroVisible) return;
      getActiveAnimation()?.play?.();
      scheduleFallback();
      scheduleWarmNext();
    };

    window.addEventListener('scroll', markInput, { passive: true });
    window.addEventListener('wheel', markInput, { passive: true });
    window.addEventListener('touchmove', markInput, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    scheduleFallback();
    scheduleWarmNext();

    return () => {
      disposed = true;
      pendingActivation += 1;
      clearFallback();
      clearWarmup();
      visibilityObserver?.disconnect();
      window.removeEventListener('scroll', markInput);
      window.removeEventListener('wheel', markInput);
      window.removeEventListener('touchmove', markInput);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clickHandlers.forEach(([button, handleClick]) => button.removeEventListener('click', handleClick));
      buttons.forEach((button) => {
        button.querySelector('[data-hero-progress-fill]')?.removeEventListener('animationend', handleProgressEnd);
      });
    };
  }, []);

  return null;
}
