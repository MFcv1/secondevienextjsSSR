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

const prepareDeferredReturnLayout = (saved) => {
  const sections = Array.from(document.querySelectorAll('.gallery-deferred-render'));
  if (!sections.length) return;

  const targetSectionId = typeof saved?.productSectionId === 'string'
    ? saved.productSectionId
    : '';
  let targetFound = !targetSectionId;

  sections.forEach((section) => {
    if (targetFound) return;
    section.dataset.cvPrerendered = 'true';
    if (section.id === targetSectionId) targetFound = true;
  });

  if (!targetFound) {
    sections.forEach((section) => {
      section.dataset.cvPrerendered = 'true';
    });
  }
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
    let popstateFrame = 0;
    let popstateCommitFrame = 0;
    let cancelledByUser = false;
    let restoreInProgress = false;
    let consumedReturnSavedAt = null;
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    const previousScrollRestoration = 'scrollRestoration' in window.history
      ? window.history.scrollRestoration
      : null;

    const releaseReturnMask = () => {
      root.removeAttribute(PENDING_ATTRIBUTE);
    };

    const clearScheduledRestore = () => {
      if (restoreFrame) window.cancelAnimationFrame(restoreFrame);
      if (popstateFrame) window.cancelAnimationFrame(popstateFrame);
      if (popstateCommitFrame) window.cancelAnimationFrame(popstateCommitFrame);
      if (cleanupTimer) window.clearTimeout(cleanupTimer);
      restoreFrame = 0;
      popstateFrame = 0;
      popstateCommitFrame = 0;
      cleanupTimer = 0;
    };

    const removeConsumedReturnRecord = () => {
      const consumedSavedAt = consumedReturnSavedAt;
      consumedReturnSavedAt = null;
      if (!Number.isFinite(consumedSavedAt)) return;

      try {
        const raw = window.sessionStorage.getItem(RETURN_KEY);
        const current = raw ? JSON.parse(raw) : null;
        if (Number(current?.savedAt) === consumedSavedAt) {
          window.sessionStorage.removeItem(RETURN_KEY);
        }
      } catch {
        // A newer return target must survive even if the consumed record is unreadable.
      }
    };

    function cancelRestore() {
      cancelledByUser = true;
      clearScheduledRestore();
      removeConsumedReturnRecord();
      try {
        window.sessionStorage.removeItem(PENDING_KEY);
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
        consumedReturnSavedAt = Number(saved.savedAt);
        cancelledByUser = false;

        root.style.scrollBehavior = 'auto';
        if (previousScrollRestoration !== null) {
          window.history.scrollRestoration = 'manual';
        }

        window.addEventListener('wheel', cancelRestore, { passive: true, once: true });
        window.addEventListener('touchstart', cancelRestore, { passive: true, once: true });
        window.addEventListener('keydown', cancelRestore, { passive: true, once: true });

        const applyAtomicRestore = () => {
          restoreExpandedProductGrids(saved.expandedProductGridIds);
          prepareDeferredReturnLayout(saved);

          if (scrollContainerId) {
            const scroller = document.getElementById(scrollContainerId);
            if (scroller) {
              const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
              scroller.scrollTop = maxTop > 0 ? Math.min(containerTop, maxTop) : containerTop;
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

          const announcement = document.querySelector('[data-gallery-announcement]');
          if (announcement && scrollContainerId && window.matchMedia('(max-width: 767px)').matches) {
            announcement.setAttribute('data-announcement-collapsed', containerTop > 8 ? 'true' : 'false');
          }
        };

        applyAtomicRestore();

        restoreFrame = window.requestAnimationFrame(() => {
          restoreFrame = 0;
          if (cancelledByUser) return;
          applyAtomicRestore();
          restoreFrame = window.requestAnimationFrame(() => {
            restoreFrame = 0;
            if (cancelledByUser) return;
            cleanupTimer = window.setTimeout(() => {
              cleanupTimer = 0;
              removeConsumedReturnRecord();
              finishRestore();
            }, 0);
          });
        });

        return true;
      } catch {
        releaseReturnMask();
        // Best effort return restoration only.
        return false;
      }
    };

    const scheduleProductReturnRestore = () => {
      if (popstateFrame) window.cancelAnimationFrame(popstateFrame);
      if (popstateCommitFrame) window.cancelAnimationFrame(popstateCommitFrame);
      popstateFrame = window.requestAnimationFrame(() => {
        popstateFrame = 0;
        popstateCommitFrame = window.requestAnimationFrame(() => {
          popstateCommitFrame = 0;
          restoreProductReturn();
        });
      });
    };

    window.addEventListener('popstate', scheduleProductReturnRestore);
    restoreProductReturn();

    return () => {
      cancelledByUser = true;
      document.removeEventListener('pointerdown', rememberProductReturnTarget, true);
      document.removeEventListener('click', rememberProductReturnTarget, true);
      window.removeEventListener('popstate', scheduleProductReturnRestore);
      clearScheduledRestore();
      removeConsumedReturnRecord();
      finishRestore();
    };
  }, [scrollContainerId]);

  return null;
}
