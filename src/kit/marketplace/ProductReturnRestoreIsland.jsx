'use client';

import { useLayoutEffect } from 'react';

const RETURN_KEY = 'secondevie:product-return:v1';
const PENDING_KEY = 'secondevie:product-return-pending:v1';
const PENDING_ATTRIBUTE = 'data-product-return-pending';
const MAX_AGE_MS = 30 * 60 * 1000;

const currentHref = () => (
  window.location.pathname + (window.location.search || '') + (window.location.hash || '')
);

const getExpandedProductGridIds = () => (
  Array.from(document.querySelectorAll('[data-expandable-product-grid][id]'))
    .filter((section) => section.querySelector('[data-product-grid-more][aria-expanded="true"]'))
    .map((section) => section.id)
);

const restoreExpandedProductGrids = (gridIds) => {
  if (!Array.isArray(gridIds)) return;

  gridIds.forEach((gridId) => {
    if (typeof gridId !== 'string' || !gridId) return;
    const section = document.getElementById(gridId);
    if (!section?.matches('[data-expandable-product-grid]')) return;

    section.querySelectorAll('[data-product-grid-item][hidden]').forEach((item) => {
      item.hidden = false;
    });
    const button = section.querySelector('[data-product-grid-more]');
    button?.setAttribute('aria-expanded', 'true');
    button?.closest('.product-grid-more-wrap')?.setAttribute('hidden', '');
  });
};

export default function ProductReturnRestoreIsland({ scrollContainerId = '' } = {}) {
  useLayoutEffect(() => {
    const rememberProductReturnTarget = (event) => {
      const link = event.target?.closest?.('a[href^="/produit/"]');
      if (!link) return;

      try {
        const scroller = scrollContainerId
          ? document.getElementById(scrollContainerId)
          : null;
        const productUrl = new URL(link.getAttribute('href') || '', window.location.origin);
        window.sessionStorage.removeItem(PENDING_KEY);
        window.sessionStorage.setItem(RETURN_KEY, JSON.stringify({
          href: currentHref(),
          productHref: productUrl.pathname + productUrl.search,
          scrollY: window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0,
          galleryScrollTop: scroller?.scrollTop || 0,
          expandedProductGridIds: getExpandedProductGridIds(),
          savedAt: Date.now(),
        }));
      } catch {
        // Product links must remain usable when session storage is unavailable.
      }
    };

    document.addEventListener('pointerdown', rememberProductReturnTarget, { capture: true, passive: true });
    document.addEventListener('click', rememberProductReturnTarget, { capture: true, passive: true });

    let restoreFrame = 0;
    let cleanupTimer = 0;
    let cancelledByUser = false;
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    const previousScrollRestoration = 'scrollRestoration' in window.history
      ? window.history.scrollRestoration
      : null;

    const releaseReturnMask = () => {
      root.removeAttribute(PENDING_ATTRIBUTE);
    };

    function cancelRestore() {
      cancelledByUser = true;
      try {
        window.sessionStorage.removeItem(RETURN_KEY);
      } catch {
        // The user interaction still wins when storage is unavailable.
      }
      finishRestore();
    }

    function finishRestore() {
      window.removeEventListener('wheel', cancelRestore);
      window.removeEventListener('touchstart', cancelRestore);
      window.removeEventListener('keydown', cancelRestore);
      root.style.scrollBehavior = previousScrollBehavior;
      if (previousScrollRestoration !== null) {
        window.history.scrollRestoration = previousScrollRestoration;
      }
      releaseReturnMask();
    }

    try {
      const sourceHref = currentHref();
      if (window.sessionStorage.getItem(PENDING_KEY) === sourceHref) {
        window.sessionStorage.removeItem(PENDING_KEY);
        const raw = window.sessionStorage.getItem(RETURN_KEY);
        const saved = raw ? JSON.parse(raw) : null;
        const target = saved?.href
          ? new URL(saved.href, window.location.origin)
          : null;
        const targetHref = target
          ? `${target.pathname}${target.search}${target.hash}`
          : '';

        if (
          saved
          && Date.now() - Number(saved.savedAt || 0) <= MAX_AGE_MS
          && target?.origin === window.location.origin
          && targetHref === sourceHref
        ) {
          restoreExpandedProductGrids(saved.expandedProductGridIds);
          const containerTop = Math.max(0, Number(saved.galleryScrollTop || 0));
          const windowTop = Math.max(0, Number(saved.scrollY || 0));

          root.style.scrollBehavior = 'auto';
          if (previousScrollRestoration !== null) {
            window.history.scrollRestoration = 'manual';
          }

          window.addEventListener('wheel', cancelRestore, { passive: true, once: true });
          window.addEventListener('touchstart', cancelRestore, { passive: true, once: true });
          window.addEventListener('keydown', cancelRestore, { passive: true, once: true });

          const applyRestore = () => {
            if (cancelledByUser) return;

            let sourceLayoutReady = true;

            if (scrollContainerId) {
              const scroller = document.getElementById(scrollContainerId);
              if (scroller) {
                const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
                scroller.scrollTop = maxTop > 0 ? Math.min(containerTop, maxTop) : containerTop;
                sourceLayoutReady = containerTop <= 0 || maxTop > 0;
              } else {
                sourceLayoutReady = false;
              }
            }

            window.scrollTo(0, windowTop);
            restoreFrame += 1;

            if (sourceLayoutReady || restoreFrame >= 8) {
              releaseReturnMask();
            }

            if (restoreFrame < 8) {
              window.requestAnimationFrame(applyRestore);
              return;
            }

            cleanupTimer = window.setTimeout(() => {
              window.sessionStorage.removeItem(RETURN_KEY);
              finishRestore();
            }, 40);
          };

          applyRestore();
        } else {
          releaseReturnMask();
        }
      } else {
        releaseReturnMask();
      }
    } catch {
      releaseReturnMask();
      // Best effort return restoration only.
    }

    return () => {
      cancelledByUser = true;
      document.removeEventListener('pointerdown', rememberProductReturnTarget, true);
      document.removeEventListener('click', rememberProductReturnTarget, true);
      if (cleanupTimer) window.clearTimeout(cleanupTimer);
      finishRestore();
    };
  }, [scrollContainerId]);

  return null;
}
