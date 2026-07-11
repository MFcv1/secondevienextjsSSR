'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ROUTE_TRANSITION_CONFIG } from './route-transition.config';

const TRANSITION_EVENT = 'sv:route-transition-start';
const ROUTE_TRANSITION_TITLE = 'L\u2019ATELIER';
const ROUTE_TRANSITION_CHARACTERS = Array.from(ROUTE_TRANSITION_TITLE);
const ROUTE_TRANSITION_CENTER_INDEX = (ROUTE_TRANSITION_CHARACTERS.length - 1) / 2;

const isPlainPrimaryClick = (event) => (
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey
);

const normalizePath = (href) => {
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
};

const pathKey = (path) => {
  if (!path) return '/';
  try {
    return new URL(path, window.location.href).pathname;
  } catch {
    return path.split(/[?#]/)[0] || '/';
  }
};

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
const waitForNextPaint = () => new Promise((resolve) => {
  window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
});

const videoWarmups = new Map();
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const warmupVideo = (href) => {
  if (!href || videoWarmups.has(href)) return;
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.src = href;
  video.load();
  videoWarmups.set(href, video);
};

export default function RouteTransitionIsland() {
  const router = useRouter();
  const pathname = usePathname();
  const transitionStartedAtRef = useRef(0);
  const pendingRef = useRef(null);
  const closeTimerRef = useRef(null);
  const [transition, setTransition] = useState(null);

  const activeTarget = transition?.targetConfig || null;
  const activeVariant = useMemo(() => {
    if (!activeTarget) return null;
    return ROUTE_TRANSITION_CONFIG.variants[activeTarget.variant || ROUTE_TRANSITION_CONFIG.defaultVariant] || null;
  }, [activeTarget]);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeTransition = useCallback(async () => {
    const pending = pendingRef.current;
    if (!pending) return;

    const variant = ROUTE_TRANSITION_CONFIG.variants[pending.targetConfig.variant] || ROUTE_TRANSITION_CONFIG.variants[ROUTE_TRANSITION_CONFIG.defaultVariant];
    const reducedMotion = prefersReducedMotion();
    const elapsed = window.performance.now() - transitionStartedAtRef.current;
    const remaining = Math.max(0, (reducedMotion ? 0 : (variant?.minVisibleMs || 0)) - elapsed);
    if (remaining > 0) await wait(remaining);

    setTransition((current) => current ? { ...current, phase: 'leaving' } : current);
    const exitDuration = reducedMotion ? 120 : (variant?.exitDurationMs || 320);
    closeTimerRef.current = window.setTimeout(() => {
      pendingRef.current = null;
      closeTimerRef.current = null;
      setTransition(null);
    }, exitDuration);
  }, []);

  const waitForTargetReady = useCallback((targetConfig) => new Promise((resolve) => {
    if (targetConfig.releaseOnRoute) {
      waitForNextPaint().then(resolve);
      return;
    }

    let done = false;
    let timeoutId = null;

    const finish = () => {
      if (done) return;
      done = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      if (targetConfig.readyEvent) window.removeEventListener(targetConfig.readyEvent, finish);
      resolve();
    };

    const node = targetConfig.readySelector ? document.querySelector(targetConfig.readySelector) : null;
    if (node && ('readyState' in node) && node.readyState >= 2) {
      finish();
      return;
    }

    if (targetConfig.readyEvent) window.addEventListener(targetConfig.readyEvent, finish, { once: true });
    timeoutId = window.setTimeout(finish, targetConfig.readyTimeoutMs || 1200);
  }), []);

  const startTransition = useCallback((href, targetConfig) => {
    clearCloseTimer();
    const variant = ROUTE_TRANSITION_CONFIG.variants[targetConfig.variant || ROUTE_TRANSITION_CONFIG.defaultVariant];
    if (targetConfig.warmupVideo) warmupVideo(targetConfig.warmupVideo);
    const next = {
      href,
      targetPath: pathKey(href),
      targetConfig,
      phase: 'entering',
    };

    pendingRef.current = next;
    transitionStartedAtRef.current = window.performance.now();
    setTransition(next);

    window.dispatchEvent(new CustomEvent(TRANSITION_EVENT, { detail: { href, target: targetConfig } }));

    window.setTimeout(() => {
      router.push(href);
    }, prefersReducedMotion() ? 0 : (variant?.enterDelayMs || 180));
  }, [clearCloseTimer, router]);

  useEffect(() => {
    if (!ROUTE_TRANSITION_CONFIG.enabled) return undefined;

    const maybeWarmup = (event) => {
      const anchor = event.target?.closest?.('a[href]');
      if (!anchor) return;
      const href = normalizePath(anchor.getAttribute('href'));
      if (!href) return;
      const targetConfig = ROUTE_TRANSITION_CONFIG.targets[pathKey(href)];
      if (targetConfig?.warmupVideo) warmupVideo(targetConfig.warmupVideo);
      if (targetConfig) router.prefetch(pathKey(href));
    };

    const onClick = (event) => {
      if (!isPlainPrimaryClick(event) || event.defaultPrevented) return;

      const anchor = event.target?.closest?.('a[href]');
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const href = normalizePath(anchor.getAttribute('href'));
      if (!href) return;

      const targetPath = pathKey(href);
      const targetConfig = ROUTE_TRANSITION_CONFIG.targets[targetPath];
      if (!targetConfig || targetPath === pathname) return;

      event.preventDefault();
      startTransition(href, targetConfig);
    };

    document.addEventListener('pointerover', maybeWarmup, true);
    document.addEventListener('focusin', maybeWarmup, true);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('pointerover', maybeWarmup, true);
      document.removeEventListener('focusin', maybeWarmup, true);
      document.removeEventListener('click', onClick, true);
    };
  }, [pathname, router, startTransition]);

  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending || pathname !== pending.targetPath) return;

    setTransition((current) => current ? { ...current, phase: 'holding' } : current);
    let cancelled = false;

    waitForTargetReady(pending.targetConfig).then(async () => {
      if (cancelled) return;
      const variant = ROUTE_TRANSITION_CONFIG.variants[pending.targetConfig.variant] || ROUTE_TRANSITION_CONFIG.variants[ROUTE_TRANSITION_CONFIG.defaultVariant];
      if (variant?.exitDelayMs) await wait(variant.exitDelayMs);
      if (!cancelled) closeTransition();
    });

    return () => {
      cancelled = true;
    };
  }, [closeTransition, pathname, waitForTargetReady]);

  useEffect(() => () => {
    clearCloseTimer();
  }, [clearCloseTimer]);

  if (!transition || !activeTarget || !activeVariant) return null;

  const style = {
    '--rt-panel': activeVariant.panel,
    '--rt-ink': activeVariant.ink,
    '--rt-accent': activeVariant.accent,
    '--rt-enter-ms': `${activeVariant.enterDurationMs || 680}ms`,
    '--rt-exit-ms': `${activeVariant.exitDurationMs || 320}ms`,
  };

  return (
    <div className="sv-route-transition" data-phase={transition.phase} style={style} aria-hidden="true">
      <div className="sv-route-transition__curtain">
        <div className="sv-route-transition__panel sv-route-transition__panel--left" />
        <div className="sv-route-transition__panel sv-route-transition__panel--right" />
        <img className="sv-route-transition__watermark" src="/images/logoanais-320.webp" alt="" aria-hidden="true" />
        <div className="sv-route-transition__signature">
          <span className="sv-route-transition__eyebrow-mask">
            <span className="sv-route-transition__eyebrow">Seconde Vie</span>
          </span>
          <span className="sv-route-transition__title" aria-label={ROUTE_TRANSITION_TITLE}>
            {ROUTE_TRANSITION_CHARACTERS.map((character, index) => (
              <span className="sv-route-transition__title-char-mask" aria-hidden="true" key={`${character}-${index}`}>
                <span
                  className="sv-route-transition__title-char"
                  style={{
                    '--rt-char-delay': `${1350 + Math.abs(index - ROUTE_TRANSITION_CENTER_INDEX) * 110}ms`,
                    '--rt-char-exit-delay': `${Math.abs(index - ROUTE_TRANSITION_CENTER_INDEX) * 24}ms`,
                    '--rt-char-sway': `${index % 2 === 0 ? -8 : 8}deg`,
                  }}
                >
                  {character}
                </span>
              </span>
            ))}
          </span>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: routeTransitionCss }} />
    </div>
  );
}

const routeTransitionCss = `
.sv-route-transition {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: grid;
  place-items: center;
  overflow: hidden;
  pointer-events: all;
  background: transparent;
  contain: layout paint style;
  isolation: isolate;
}
.sv-route-transition__curtain {
  position: absolute;
  top: -12svh;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  border-radius: 50% 50% 0 0 / 12svh 12svh 0 0;
  transform: translate3d(0, 112svh, 0);
  animation: sv-route-curtain-rise var(--rt-enter-ms) cubic-bezier(.22,1,.36,1) forwards;
  will-change: transform;
}
.sv-route-transition__panel {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50.1%;
  background: var(--rt-panel);
  transition: transform var(--rt-exit-ms) cubic-bezier(.76,0,.24,1);
  will-change: transform;
}
.sv-route-transition__panel--left {
  left: 0;
}
.sv-route-transition__panel--right {
  right: 0;
}
.sv-route-transition__watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  width: clamp(260px, 30vw, 480px);
  height: auto;
  opacity: 0;
  pointer-events: none;
  mix-blend-mode: multiply;
  transform: translate3d(-50%, -50%, 0) scale(.92);
  animation: sv-route-watermark-in 1300ms 350ms cubic-bezier(.16,1,.3,1) forwards;
}
.sv-route-transition__signature {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  color: var(--rt-ink);
  transform: translate3d(-50%, -50%, 0);
  white-space: nowrap;
}
.sv-route-transition__eyebrow-mask {
  display: block;
  overflow: hidden;
  padding: 20px 0 3px;
  margin-top: -20px;
}
.sv-route-transition__eyebrow {
  display: block;
  font-family: var(--font-plus-jakarta), system-ui, sans-serif;
  font-size: clamp(11px, .85vw, 13.5px);
  font-weight: 800;
  letter-spacing: .36em;
  text-transform: uppercase;
  color: var(--rt-accent);
  text-shadow: 0 1px 0 rgba(249,246,240,.8);
  opacity: 0;
  transform: translate3d(0, -14px, 0);
  animation: sv-route-eyebrow-in 950ms 1020ms cubic-bezier(.4,0,.2,1) forwards;
  will-change: opacity;
}
.sv-route-transition__title {
  display: flex;
  justify-content: center;
  perspective: 1100px;
  font-family: var(--font-cormorant), Georgia, serif;
  font-size: clamp(56px, 8vw, 132px);
  font-weight: 400;
  line-height: .82;
  letter-spacing: -.045em;
  text-transform: uppercase;
}
.sv-route-transition__title-char-mask {
  display: block;
  overflow: hidden;
  padding-block: .1em;
  margin-block: -.1em;
}
.sv-route-transition__title-char {
  --rt-char-rotate-x: -62deg;
  --rt-char-effective-sway: var(--rt-char-sway);
  display: block;
  opacity: 0;
  backface-visibility: hidden;
  transform: translate3d(0, 118%, 0) rotateX(var(--rt-char-rotate-x)) rotateY(var(--rt-char-effective-sway)) scaleY(.84);
  transform-origin: center bottom;
  animation: sv-route-title-char-in 1050ms var(--rt-char-delay) cubic-bezier(.16,1,.3,1) forwards;
  will-change: transform, opacity;
}
.sv-route-transition[data-phase="leaving"] .sv-route-transition__panel--left {
  transform: translate3d(-101%, 0, 0);
}
.sv-route-transition[data-phase="leaving"] .sv-route-transition__panel--right {
  transform: translate3d(101%, 0, 0);
}
.sv-route-transition[data-phase="leaving"] .sv-route-transition__watermark {
  animation: none;
  opacity: 0;
  transform: translate3d(-50%, -50%, 0) scale(1.04);
  transition: opacity 320ms ease-out, transform 520ms cubic-bezier(.4,0,1,1);
}
.sv-route-transition[data-phase="leaving"] .sv-route-transition__eyebrow {
  animation: none;
  opacity: 0;
  transform: translate3d(0, -110%, 0);
  transition: opacity 260ms ease-out, transform 420ms cubic-bezier(.4,0,1,1);
}
.sv-route-transition[data-phase="leaving"] .sv-route-transition__title-char {
  animation: none;
  opacity: 0;
  transform: translate3d(0, -110%, 0) rotateX(40deg);
  transition: opacity 240ms ease-out var(--rt-char-exit-delay), transform 440ms cubic-bezier(.4,0,1,1) var(--rt-char-exit-delay);
}
@keyframes sv-route-curtain-rise {
  from { transform: translate3d(0, 112svh, 0); }
  to { transform: translate3d(0, 0, 0); }
}
@keyframes sv-route-watermark-in {
  0% { opacity: 0; transform: translate3d(-50%, -50%, 0) scale(.92); }
  68% { opacity: .085; transform: translate3d(-50%, -50%, 0) scale(1.015); }
  100% { opacity: .075; transform: translate3d(-50%, -50%, 0) scale(1); }
}
@keyframes sv-route-eyebrow-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes sv-route-title-char-in {
  0% { opacity: 0; transform: translate3d(0, 118%, 0) rotateX(var(--rt-char-rotate-x)) rotateY(var(--rt-char-effective-sway)) scaleY(.84); }
  72% { opacity: 1; transform: translate3d(0, -5%, 0) rotateX(3deg) rotateY(0deg) scaleY(1.015); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg) scaleY(1); }
}
@media (max-width: 767px) {
  .sv-route-transition__title-char {
    --rt-char-rotate-x: -18deg;
    --rt-char-effective-sway: 0deg;
    animation-duration: 1000ms;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sv-route-transition__curtain {
    animation: none !important;
    transform: translate3d(0, 0, 0);
  }
  .sv-route-transition__watermark {
    display: none;
  }
  .sv-route-transition__eyebrow {
    animation: none !important;
    opacity: 1;
    transform: translate3d(0, -14px, 0);
  }
  .sv-route-transition__title-char {
    animation: none !important;
    opacity: 1;
    transform: none;
  }
  .sv-route-transition__panel {
    transition-duration: 120ms !important;
  }
}
`;
