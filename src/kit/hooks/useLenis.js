import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis smooth scroll: GSAP-synced, refresh-rate aware and settled at rest.
 *
 * The important part is keeping a single frame clock:
 * GSAP ticker -> Lenis raf -> Lenis scroll event -> ScrollTrigger.update().
 * A small settle guard removes Lenis' sub-pixel lerp tail once the scroll is
 * visually stopped, which prevents scrubbed elements from vibrating at rest.
 */

const MIN_REFRESH_RATE = 60;
const MAX_REFRESH_RATE = 300;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function detectRefreshRate(sampleSize = 42) {
  return new Promise((resolve) => {
    const timestamps = [];
    let rafId;
    let timeoutId;
    let settled = false;

    const finish = (hz) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
      resolve(clamp(Math.round(hz || MIN_REFRESH_RATE), MIN_REFRESH_RATE, MAX_REFRESH_RATE));
    };

    function tick(time) {
      timestamps.push(time);
      if (timestamps.length <= sampleSize) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const intervals = [];
      for (let i = 1; i < timestamps.length; i += 1) {
        intervals.push(timestamps[i] - timestamps[i - 1]);
      }

      const stableIntervals = intervals
        .filter((interval) => interval >= 2.5 && interval <= 25)
        .sort((a, b) => a - b);
      const start = Math.floor(stableIntervals.length * 0.2);
      const end = Math.ceil(stableIntervals.length * 0.8);
      const trimmed = stableIntervals.slice(start, end);
      const source = trimmed.length ? trimmed : stableIntervals;
      const median = source[Math.floor(source.length / 2)];
      finish(1000 / median);
    }

    rafId = requestAnimationFrame(tick);
    timeoutId = setTimeout(() => finish(MIN_REFRESH_RATE), 2000);
  });
}

function getLenisProfileForHz(hz) {
  const refreshRate = clamp(hz, MIN_REFRESH_RATE, MAX_REFRESH_RATE);
  const referenceHz = 160;
  const referenceLerp = 0.1;
  const normalizedLerp = 1 - Math.pow(1 - referenceLerp, referenceHz / refreshRate);

  return {
    refreshRate,
    lerp: clamp(normalizedLerp, 0.055, 0.18),
    maxFrameDelta: clamp((1000 / refreshRate) * 4, 24, 48),
    settleDistance: refreshRate >= 180 ? 0.2 : 0.3,
    settleVelocity: refreshRate >= 180 ? 0.035 : 0.05,
    settleFrames: refreshRate >= 180 ? 3 : 2,
  };
}

function settleLenisAtTarget(lenis) {
  const target = Math.round(lenis.targetScroll);

  // Lenis exits early when scrollTo() receives the current target. Settle the
  // underlying scroll position directly so the lerp tail cannot keep emitting
  // sub-pixel updates into ScrollTrigger.
  if (typeof lenis.setScroll === 'function') {
    lenis.animatedScroll = target;
    lenis.targetScroll = target;
    lenis.setScroll(target);
    if (typeof lenis.reset === 'function') lenis.reset();
    if (typeof lenis.emit === 'function') lenis.emit();
    return;
  }

  lenis.scrollTo(target, { immediate: true, force: true });
}

function updateSettleState(lenis, settleState, profile) {
  if (lenis.isStopped || lenis.isLocked || lenis.isScrolling !== 'smooth') {
    settleState.frames = 0;
    settleState.lastTarget = lenis.targetScroll;
    return;
  }

  const targetChanged = settleState.lastTarget !== lenis.targetScroll;
  settleState.lastTarget = lenis.targetScroll;

  if (targetChanged) {
    settleState.frames = 0;
    return;
  }

  const distance = Math.abs(lenis.targetScroll - lenis.animatedScroll);
  const velocity = Math.abs(lenis.velocity || 0);

  if (distance <= profile.settleDistance && velocity <= profile.settleVelocity) {
    settleState.frames += 1;
  } else {
    settleState.frames = 0;
  }

  if (settleState.frames >= profile.settleFrames) {
    settleState.frames = 0;
    settleLenisAtTarget(lenis);
    ScrollTrigger.update();
  }
}

const useLenis = () => {
  const lenisRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let destroyed = false;
    let tickerCallback = null;
    let observer = null;
    let scrollTriggerFrame = 0;

    function init() {
      let profile = getLenisProfileForHz(MIN_REFRESH_RATE);
      const settleState = {
        frames: 0,
        lastTarget: null,
      };
      const rafState = {
        lastTime: null,
        lenisTime: 0,
      };

      const lenis = new Lenis({
        autoRaf: false,
        lerp: profile.lerp,

        smoothWheel: true,
        wheelMultiplier: 1,

        syncTouch: false,
        touchMultiplier: 1,

        orientation: 'vertical',
        gestureOrientation: 'vertical',
        autoResize: true,
        overscroll: true,
      });

      lenisRef.current = lenis;
      window.__lenis = lenis;
      window.__lenisProfile = profile;

      const scheduleScrollTriggerUpdate = () => {
        if (scrollTriggerFrame) return;
        scrollTriggerFrame = requestAnimationFrame(() => {
          scrollTriggerFrame = 0;
          ScrollTrigger.update();
        });
      };

      lenis.on('scroll', scheduleScrollTriggerUpdate);

      detectRefreshRate().then((hz) => {
        if (destroyed || !lenisRef.current) return;
        profile = getLenisProfileForHz(hz);
        if (lenis.options) lenis.options.lerp = profile.lerp;
        window.__lenisProfile = profile;
      });

      tickerCallback = (time) => {
        const now = time * 1000;
        const previous = rafState.lastTime ?? now;
        const delta = clamp(now - previous, 0, profile.maxFrameDelta);
        rafState.lastTime = now;
        rafState.lenisTime += delta;

        lenis.raf(rafState.lenisTime);
        updateSettleState(lenis, settleState, profile);
      };
      gsap.ticker.add(tickerCallback);
      gsap.ticker.lagSmoothing(500, 33);

      observer = new MutationObserver(() => {
        const isLocked =
          document.body.classList.contains('modal-open') ||
          document.body.classList.contains('marketplace-mobile-scroll-lock') ||
          document.body.classList.contains('product-detail-scroll-lock') ||
          document.body.style.overflow === 'hidden';
        if (isLocked && !lenis.isStopped) lenis.stop();
        else if (!isLocked && lenis.isStopped) lenis.start();
      });

      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
    }

    init();

    return () => {
      destroyed = true;
      observer?.disconnect();
      if (scrollTriggerFrame) cancelAnimationFrame(scrollTriggerFrame);
      if (tickerCallback) gsap.ticker.remove(tickerCallback);
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      window.__lenis = null;
      window.__lenisProfile = null;
    };
  }, []);

  return lenisRef;
};

export default useLenis;
