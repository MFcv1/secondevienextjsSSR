'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ROUTE_TRANSITION_CONFIG } from './route-transition.config';

const TRANSITION_EVENT = 'sv:route-transition-start';

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
    '--rt-enter-ms': `${activeVariant.enterDurationMs || 680}ms`,
    '--rt-exit-ms': `${activeVariant.exitDurationMs || 320}ms`,
  };

  return (
    <div className="sv-route-transition" data-phase={transition.phase} style={style} aria-hidden="true">
      <div className="sv-route-transition__curtain">
        <div className="sv-route-transition__panel sv-route-transition__panel--left" />
        <div className="sv-route-transition__panel sv-route-transition__panel--right" />
        <span className="sv-route-transition__axis sv-route-transition__axis--top" />
        <span className="sv-route-transition__axis sv-route-transition__axis--bottom" />
        <svg
          className="sv-route-transition__logo"
          viewBox="495 185 952 1055"
          role="presentation"
          aria-hidden="true"
        >
          <defs>
            <filter id="sv-route-logo-guide" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
              <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="guideOuter" />
              <feMorphology in="SourceAlpha" operator="erode" radius="2" result="guideInner" />
              <feComposite in="guideOuter" in2="guideInner" operator="out" result="guideEdge" />
              <feFlood floodColor="#8b5c42" floodOpacity="0.62" result="guideColor" />
              <feComposite in="guideColor" in2="guideEdge" operator="in" />
            </filter>
            <filter id="sv-route-logo-neon" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
              <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="neonOuter" />
              <feMorphology in="SourceAlpha" operator="erode" radius="2" result="neonInner" />
              <feComposite in="neonOuter" in2="neonInner" operator="out" result="neonEdge" />
              <feGaussianBlur in="neonEdge" stdDeviation="15" result="farBlur" />
              <feFlood floodColor="#a4512f" floodOpacity="0.58" result="farColor" />
              <feComposite in="farColor" in2="farBlur" operator="in" result="farGlow" />
              <feGaussianBlur in="neonEdge" stdDeviation="5" result="nearBlur" />
              <feFlood floodColor="#d99756" floodOpacity="0.92" result="nearColor" />
              <feComposite in="nearColor" in2="nearBlur" operator="in" result="nearGlow" />
              <feFlood floodColor="#fff0cf" result="coreColor" />
              <feComposite in="coreColor" in2="neonEdge" operator="in" result="core" />
              <feMerge>
                <feMergeNode in="farGlow" />
                <feMergeNode in="nearGlow" />
                <feMergeNode in="core" />
              </feMerge>
            </filter>
            <radialGradient id="sv-route-logo-light-head">
              <stop offset="0" stopColor="white" />
              <stop offset="0.32" stopColor="white" />
              <stop offset="0.68" stopColor="#8a8a8a" />
              <stop offset="1" stopColor="black" />
            </radialGradient>
            <radialGradient id="sv-route-logo-detail-head">
              <stop offset="0" stopColor="white" />
              <stop offset="0.2" stopColor="white" />
              <stop offset="0.54" stopColor="#777" />
              <stop offset="1" stopColor="black" />
            </radialGradient>
            <mask id="sv-route-logo-travel" maskUnits="userSpaceOnUse" x="420" y="100" width="1100" height="1220" style={{ maskType: 'luminance' }}>
              <rect x="420" y="100" width="1100" height="1220" fill="black" />
              <circle cx="0" cy="0" r="225" fill="url(#sv-route-logo-light-head)" opacity="0">
                <animate
                  attributeName="opacity"
                  values="0;1;1;.72;.12"
                  keyTimes="0;.06;.78;.9;1"
                  dur="3.2s"
                  begin="2.22s"
                  fill="freeze"
                />
                <animateMotion
                  path="M 505 205 C 790 135 1230 150 1415 390 C 1515 520 1450 750 1270 850 C 1140 925 1055 1005 1070 1220"
                  dur="3.2s"
                  begin="2.22s"
                  calcMode="spline"
                  keyTimes="0;1"
                  keySplines=".45 0 .2 1"
                  fill="freeze"
                />
              </circle>
              <circle cx="0" cy="0" r="210" fill="url(#sv-route-logo-light-head)" opacity="0">
                <animate
                  attributeName="opacity"
                  values="0;1;1;.72;.12"
                  keyTimes="0;.06;.78;.9;1"
                  dur="3.2s"
                  begin="2.22s"
                  fill="freeze"
                />
                <animateMotion
                  path="M 505 205 C 472 330 480 470 500 615 C 520 770 475 930 555 1085 C 650 1260 855 1290 990 1165"
                  dur="3.2s"
                  begin="2.22s"
                  calcMode="spline"
                  keyTimes="0;1"
                  keySplines=".45 0 .2 1"
                  fill="freeze"
                />
              </circle>
              <circle cx="0" cy="0" r="132" fill="url(#sv-route-logo-detail-head)" opacity="0">
                <animate
                  attributeName="opacity"
                  values="0;1;1;.78;.1"
                  keyTimes="0;.08;.8;.92;1"
                  dur="2.7s"
                  begin="2.46s"
                  fill="freeze"
                />
                <animateMotion
                  path="M 720 470 C 840 430 940 520 1055 500 C 1130 487 1180 445 1215 475 C 1185 525 1175 575 1190 620 C 1205 660 1260 695 1250 740 C 1240 790 1200 835 1140 840 C 1080 845 1035 800 1005 745 C 975 700 960 650 990 610"
                  dur="2.7s"
                  begin="2.46s"
                  calcMode="spline"
                  keyTimes="0;1"
                  keySplines=".4 0 .2 1"
                  fill="freeze"
                />
              </circle>
            </mask>
          </defs>
          <image
            className="sv-route-transition__logo-guide"
            href="/images/logoanais.png"
            x="0"
            y="0"
            width="1890"
            height="1417"
            filter="url(#sv-route-logo-guide)"
          />
          <g mask="url(#sv-route-logo-travel)">
            <image
              className="sv-route-transition__logo-neon"
              href="/images/logoanais.png"
              x="0"
              y="0"
              width="1890"
              height="1417"
              filter="url(#sv-route-logo-neon)"
            />
          </g>
        </svg>
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
  --rt-logo-clearance: clamp(126px, 10vw, 174px);
  position: absolute;
  top: -12svh;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  border-radius: 50% 50% 0 0 / 12svh 12svh 0 0;
  box-shadow: 0 -26px 80px rgba(91, 57, 39, .12);
  transform: translate3d(0, 112svh, 0);
  animation: sv-route-curtain-rise var(--rt-enter-ms) cubic-bezier(.22,1,.36,1) forwards;
  will-change: transform;
}
.sv-route-transition__panel {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50.1%;
  overflow: hidden;
  background-color: #f8f3ec;
  background-image: var(--rt-panel);
  background-repeat: no-repeat;
  background-size: 200% 100%;
  transition: transform calc(var(--rt-exit-ms) - 140ms) cubic-bezier(.76,0,.24,1);
  will-change: transform;
}
.sv-route-transition__panel::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: .028;
  mix-blend-mode: multiply;
}
.sv-route-transition__panel--left {
  left: 0;
  background-position: left center;
}
.sv-route-transition__panel--right {
  right: 0;
  background-position: right center;
}
.sv-route-transition__axis {
  --rt-axis-delay: 300ms;
  position: absolute;
  left: 50%;
  z-index: 2;
  width: 2px;
  margin-left: -1px;
  pointer-events: none;
  opacity: 0;
  transform: scaleY(0);
  box-shadow: 0 0 7px rgba(172, 102, 56, .22);
  animation: sv-route-axis-in 1080ms var(--rt-axis-delay) cubic-bezier(.16,1,.3,1) forwards;
  will-change: opacity, transform;
}
.sv-route-transition__axis--top {
  top: calc(12svh + clamp(30px, 7svh, 72px));
  bottom: calc(50% - 6svh + var(--rt-logo-clearance));
  background: linear-gradient(180deg, transparent 0%, rgba(172, 112, 72, .18) 22%, rgba(139, 82, 48, .68) 100%);
  transform-origin: top;
}
.sv-route-transition__axis--bottom {
  --rt-axis-delay: 480ms;
  top: calc(50% + 6svh + var(--rt-logo-clearance));
  bottom: clamp(30px, 7svh, 72px);
  background: linear-gradient(180deg, rgba(139, 82, 48, .68) 0%, rgba(172, 112, 72, .18) 78%, transparent 100%);
  transform-origin: bottom;
}
.sv-route-transition__logo {
  position: absolute;
  top: calc(50% + 6svh);
  left: 50%;
  z-index: 3;
  width: clamp(180px, 15vw, 260px);
  aspect-ratio: 952 / 1055;
  overflow: visible;
  pointer-events: none;
  opacity: 0;
  transform: translate3d(-50%, -50%, 0) perspective(760px) rotateY(-86deg) scale(.14);
  transform-origin: center;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  animation: sv-route-logo-turn-in 1420ms 640ms cubic-bezier(.22,.72,.18,1) forwards;
  will-change: opacity, transform;
}
.sv-route-transition__logo-guide {
  opacity: .68;
}
.sv-route-transition__logo-neon {
  opacity: 1;
}
.sv-route-transition[data-phase="leaving"] .sv-route-transition__panel--left {
  transform: translate3d(-101%, 0, 0);
  transition-delay: 140ms;
}
.sv-route-transition[data-phase="leaving"] .sv-route-transition__panel--right {
  transform: translate3d(101%, 0, 0);
  transition-delay: 140ms;
}
.sv-route-transition[data-phase="leaving"] .sv-route-transition__axis {
  animation: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 90ms cubic-bezier(.4,0,1,1), visibility 0s 90ms;
}
.sv-route-transition[data-phase="leaving"] .sv-route-transition__logo {
  animation: none;
  opacity: 0;
  visibility: hidden;
  transform: translate3d(-50%, -50%, 0);
  transition: opacity 120ms ease-out, visibility 0s 120ms;
}
@keyframes sv-route-curtain-rise {
  from { transform: translate3d(0, 112svh, 0); }
  to { transform: translate3d(0, 0, 0); }
}
@keyframes sv-route-axis-in {
  0% { opacity: 0; transform: scaleY(0); }
  12% { opacity: 1; }
  76% { opacity: 1; transform: scaleY(1); }
  100% { opacity: .78; transform: scaleY(1); }
}
@keyframes sv-route-logo-turn-in {
  from {
    opacity: 0;
    transform: translate3d(-50%, -50%, 0) perspective(760px) rotateY(-86deg) scale(.14);
  }
  to {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) perspective(760px) rotateY(0deg) scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .sv-route-transition__curtain {
    animation: none !important;
    transform: translate3d(0, 0, 0);
  }
  .sv-route-transition__logo {
    animation: none !important;
    opacity: 1;
    transform: translate3d(-50%, -50%, 0);
  }
  .sv-route-transition__logo-guide {
    opacity: .82;
  }
  .sv-route-transition__logo-neon {
    display: none;
  }
  .sv-route-transition__axis {
    animation: none !important;
    opacity: .65;
    transform: none;
  }
  .sv-route-transition__panel {
    transition-duration: 120ms !important;
    transition-delay: 0ms !important;
  }
}
`;
