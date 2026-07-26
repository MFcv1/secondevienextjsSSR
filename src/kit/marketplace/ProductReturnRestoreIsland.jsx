'use client';

import { useLayoutEffect } from 'react';

const RETURN_KEY = 'secondevie:product-return:v1';
const PENDING_KEY = 'secondevie:product-return-pending:v1';
const PENDING_ATTRIBUTE = 'data-product-return-pending';
const MAX_AGE_MS = 30 * 60 * 1000;
const RESTORE_FRAME_LIMIT = 30;

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

const findProductReturnAnchor = (saved) => {
  if (!saved?.productHref) return null;

  const section = saved.productSectionId
    ? document.getElementById(saved.productSectionId)
    : null;
  const root = section?.matches('[data-expandable-product-grid]')
    ? section
    : document;

  return Array.from(root.querySelectorAll('a[href^="/produit/"]')).find((link) => {
    try {
      const linkUrl = new URL(link.getAttribute('href') || '', window.location.origin);
      const linkHref = linkUrl.pathname + linkUrl.search;
      const anchorKind = link.hasAttribute('aria-label') ? 'media' : 'details';
      return linkHref === saved.productHref && anchorKind === saved.productAnchorKind;
    } catch {
      return false;
    }
  }) || null;
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
        const anchorRect = link.getBoundingClientRect();
        window.sessionStorage.removeItem(PENDING_KEY);
        window.sessionStorage.setItem(RETURN_KEY, JSON.stringify({
          href: currentHref(),
          productHref: productUrl.pathname + productUrl.search,
          productSectionId: link.closest('[data-expandable-product-grid][id]')?.id || '',
          productAnchorKind: link.hasAttribute('aria-label') ? 'media' : 'details',
          productAnchorViewportTop: Number.isFinite(anchorRect.top) ? anchorRect.top : null,
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
    let popstateTimer = 0;
    let cancelledByUser = false;
    let restoreInProgress = false;
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
      restoreInProgress = false;
      window.removeEventListener('wheel', cancelRestore);
      window.removeEventListener('touchstart', cancelRestore);
      window.removeEventListener('keydown', cancelRestore);
      root.style.scrollBehavior = previousScrollBehavior;
      if (previousScrollRestoration !== null) {
        window.history.scrollRestoration = previousScrollRestoration;
      }
      releaseReturnMask();
    }

    const restoreProductReturn = () => {
      if (restoreInProgress) return true;

      try {
        const sourceHref = currentHref();
        if (window.sessionStorage.getItem(PENDING_KEY) !== sourceHref) {
          releaseReturnMask();
          return false;
        }

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
          !saved
          || Date.now() - Number(saved.savedAt || 0) > MAX_AGE_MS
          || target?.origin !== window.location.origin
          || targetHref !== sourceHref
        ) {
          releaseReturnMask();
          return false;
        }

        const containerTop = Math.max(0, Number(saved.galleryScrollTop || 0));
        const windowTop = Math.max(0, Number(saved.scrollY || 0));
        restoreInProgress = true;
        cancelledByUser = false;
        restoreFrame = 0;

        root.style.scrollBehavior = 'auto';
        if (previousScrollRestoration !== null) {
          window.history.scrollRestoration = 'manual';
        }

        window.addEventListener('wheel', cancelRestore, { passive: true, once: true });
        window.addEventListener('touchstart', cancelRestore, { passive: true, once: true });
        window.addEventListener('keydown', cancelRestore, { passive: true, once: true });

        const applyRestore = () => {
          if (cancelledByUser) return;

          restoreExpandedProductGrids(saved.expandedProductGridIds);
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

          const anchor = findProductReturnAnchor(saved);
          const savedAnchorTop = Number(saved.productAnchorViewportTop);
          if (anchor && Number.isFinite(savedAnchorTop)) {
            const anchorDelta = anchor.getBoundingClientRect().top - savedAnchorTop;
            const scroller = scrollContainerId
              ? document.getElementById(scrollContainerId)
              : null;
            const maxTop = scroller
              ? Math.max(0, scroller.scrollHeight - scroller.clientHeight)
              : 0;

            if (scroller && maxTop > 0) {
              scroller.scrollTop = Math.max(0, Math.min(scroller.scrollTop + anchorDelta, maxTop));
            } else {
              window.scrollTo(0, Math.max(0, window.scrollY + anchorDelta));
            }
          }

          restoreFrame += 1;

          if (sourceLayoutReady || restoreFrame >= RESTORE_FRAME_LIMIT) {
            releaseReturnMask();
          }

          if (restoreFrame < RESTORE_FRAME_LIMIT) {
            window.requestAnimationFrame(applyRestore);
            return;
          }

          cleanupTimer = window.setTimeout(() => {
            window.sessionStorage.removeItem(RETURN_KEY);
            finishRestore();
          }, 40);
        };

        applyRestore();
        return true;
      } catch {
        releaseReturnMask();
        // Best effort return restoration only.
        return false;
      }
    };

    const scheduleProductReturnRestore = () => {
      if (popstateTimer) window.clearTimeout(popstateTimer);
      popstateTimer = window.setTimeout(() => {
        popstateTimer = 0;
        let retryFrame = 0;
        const retryRestore = () => {
          if (restoreProductReturn() || retryFrame >= RESTORE_FRAME_LIMIT) return;
          retryFrame += 1;
          window.requestAnimationFrame(retryRestore);
        };
        retryRestore();
      }, 0);
    };

    window.addEventListener('popstate', scheduleProductReturnRestore);
    restoreProductReturn();

    return () => {
      cancelledByUser = true;
      document.removeEventListener('pointerdown', rememberProductReturnTarget, true);
      document.removeEventListener('click', rememberProductReturnTarget, true);
      window.removeEventListener('popstate', scheduleProductReturnRestore);
      if (cleanupTimer) window.clearTimeout(cleanupTimer);
      if (popstateTimer) window.clearTimeout(popstateTimer);
      finishRestore();
    };
  }, [scrollContainerId]);

  return null;
}
