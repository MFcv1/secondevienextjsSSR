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

const warmupVideo = (href) => {
  if (!href || document.querySelector(`link[data-sv-route-warmup="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'video';
  link.href = href;
  link.type = 'video/mp4';
  link.dataset.svRouteWarmup = href;
  document.head.appendChild(link);
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
    const elapsed = window.performance.now() - transitionStartedAtRef.current;
    const remaining = Math.max(0, (variant?.minVisibleMs || 0) - elapsed);
    if (remaining > 0) await wait(remaining);

    setTransition((current) => current ? { ...current, phase: 'leaving' } : current);
    closeTimerRef.current = window.setTimeout(() => {
      pendingRef.current = null;
      closeTimerRef.current = null;
      setTransition(null);
    }, variant?.exitDurationMs || 320);
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
    }, variant?.enterDelayMs || 180);
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
    '--rt-bg': activeVariant.background,
    '--rt-tint': activeVariant.tint,
    '--rt-line': activeVariant.line,
    '--rt-line-track': activeVariant.lineTrack,
    '--rt-line-glow': activeVariant.lineGlow,
    '--rt-exit-ms': `${activeVariant.exitDurationMs || 320}ms`,
  };

  return (
    <div className="sv-route-transition" data-phase={transition.phase} style={style} aria-hidden="true">
      <div className="sv-route-transition__veil" />
      <div className="sv-route-transition__grain" />
      <div className="sv-route-transition__depth" />
      <div className="sv-route-transition__progress">
        <span />
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
  background: var(--rt-bg);
  opacity: 1;
  contain: layout paint style;
  isolation: isolate;
}
.sv-route-transition[data-phase="leaving"] {
  opacity: 0;
  transition: opacity var(--rt-exit-ms) cubic-bezier(.16,1,.3,1);
}
.sv-route-transition__veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 46%, var(--rt-tint), transparent 34%),
    linear-gradient(180deg, rgba(255,255,255,.035), transparent 30%, rgba(255,255,255,.018) 72%, transparent 100%);
  transform: translate3d(0, 1.8%, 0) scale(1.018);
  opacity: 1;
  animation: sv-route-veil 420ms cubic-bezier(.16,1,.3,1) both;
}
.sv-route-transition__grain {
  position: absolute;
  inset: 0;
  opacity: .035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.sv-route-transition__depth {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 118%, rgba(255,255,255,.08), transparent 42%),
    radial-gradient(ellipse at 50% -12%, rgba(255,255,255,.045), transparent 36%);
  opacity: .82;
  transform: translate3d(0, 0, 0);
  animation: sv-route-depth 440ms cubic-bezier(.16,1,.3,1) both;
}
.sv-route-transition__progress {
  position: absolute;
  z-index: 2;
  right: clamp(22px, 4vw, 72px);
  bottom: clamp(22px, 4vw, 56px);
  left: clamp(22px, 4vw, 72px);
  height: 1px;
  overflow: hidden;
  background: var(--rt-line-track);
  transform: translateZ(0);
}
.sv-route-transition__progress span {
  position: absolute;
  inset-block: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(90deg, transparent 0%, var(--rt-line) 14%, var(--rt-line) 76%, transparent 100%);
  box-shadow: 0 0 18px var(--rt-line-glow);
  transform: scaleX(.02);
  transform-origin: left center;
  animation: sv-route-progress 520ms cubic-bezier(.85,0,.15,1) both;
}
@keyframes sv-route-veil {
  from { transform: translate3d(0, 5%, 0) scale(1.04); opacity: .74; }
  to { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
}
@keyframes sv-route-depth {
  from { transform: scaleY(.94); opacity: .3; }
  to { transform: scaleY(1); opacity: .82; }
}
@keyframes sv-route-progress {
  0% { transform: scaleX(.02); opacity: .25; }
  58% { transform: scaleX(.72); opacity: 1; }
  100% { transform: scaleX(1); opacity: .92; }
}
@media (prefers-reduced-motion: reduce) {
  .sv-route-transition,
  .sv-route-transition * {
    animation: none !important;
    transition-duration: 120ms !important;
  }
  .sv-route-transition__progress span {
    opacity: .9;
    transform: scaleX(1);
  }
}
`;
