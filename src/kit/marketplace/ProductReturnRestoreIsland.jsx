'use client';

import { useLayoutEffect } from 'react';

const RETURN_KEY = 'secondevie:product-return:v1';
const PENDING_KEY = 'secondevie:product-return-pending:v1';
const SCROLL_RESTORATION_KEY = 'secondevie:product-return-scroll-restoration:v1';
const PENDING_ATTRIBUTE = 'data-product-return-pending';
const MAX_AGE_MS = 30 * 60 * 1000;
const RESTORE_TIMEOUT_MS = 1200;
const RETURN_COMMIT_SURVIVAL_MS = 5000;
const REQUIRED_STABLE_FRAMES = 2;
const POSITION_EPSILON = 1.5;

const getDeploymentId = () => {
  const asset = document.querySelector('script[src*="dpl="], link[href*="dpl="]');
  const assetUrl = asset?.getAttribute('src') || asset?.getAttribute('href') || '';
  if (!assetUrl) return '';

  try {
    return new URL(assetUrl, window.location.origin).searchParams.get('dpl') || '';
  } catch {
    return '';
  }
};

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
          sourceDeploymentId: getDeploymentId(),
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
    let restoreInProgress = false;
    let consumedReturnSavedAt = null;
    let restoreStartedAt = 0;
    let stableFrameCount = 0;
    let previousStableSignature = '';
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;

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

    const restoreNativeScrollMode = () => {
      if (!('scrollRestoration' in window.history)) return;
      try {
        const savedMode = window.sessionStorage.getItem(SCROLL_RESTORATION_KEY);
        window.history.scrollRestoration = savedMode === 'manual' ? 'manual' : 'auto';
        window.sessionStorage.removeItem(SCROLL_RESTORATION_KEY);
      } catch {
        window.history.scrollRestoration = 'auto';
      }
    };

    const clearConsumedReturnTransaction = () => {
      const consumedSavedAt = consumedReturnSavedAt;
      consumedReturnSavedAt = null;
      if (!Number.isFinite(consumedSavedAt)) return;

      try {
        const raw = window.sessionStorage.getItem(RETURN_KEY);
        const current = raw ? JSON.parse(raw) : null;
        if (Number(current?.savedAt) === consumedSavedAt) {
          window.sessionStorage.removeItem(RETURN_KEY);
          if (window.sessionStorage.getItem(PENDING_KEY) === currentHref()) {
            window.sessionStorage.removeItem(PENDING_KEY);
          }
        }
      } catch {
        // A newer return target must survive even if the consumed record is unreadable.
      }
    };

    const markConsumedReturnCommitted = () => {
      const consumedSavedAt = consumedReturnSavedAt;
      if (!Number.isFinite(consumedSavedAt)) return;
      try {
        const raw = window.sessionStorage.getItem(RETURN_KEY);
        const current = raw ? JSON.parse(raw) : null;
        if (Number(current?.savedAt) === consumedSavedAt) {
          window.sessionStorage.setItem(RETURN_KEY, JSON.stringify({
            ...current,
            committedAt: Date.now(),
          }));
        }
      } catch {
        // The visible return remains valid when storage becomes unavailable.
      }
    };

    const scheduleTransactionCleanup = () => {
      if (cleanupTimer) window.clearTimeout(cleanupTimer);
      cleanupTimer = window.setTimeout(() => {
        cleanupTimer = 0;
        clearConsumedReturnTransaction();
      }, RETURN_COMMIT_SURVIVAL_MS);
    };

    function finishRestore({ releaseMask = true, restoreScrollMode = true } = {}) {
      restoreInProgress = false;
      root.style.scrollBehavior = previousScrollBehavior;
      if (restoreScrollMode) restoreNativeScrollMode();
      if (releaseMask) releaseReturnMask();
    }

    const restoreProductReturn = () => {
      if (restoreInProgress) return true;

      try {
        const sourceHref = currentHref();
        if (window.sessionStorage.getItem(PENDING_KEY) !== sourceHref) {
          releaseReturnMask();
          restoreNativeScrollMode();
          return false;
        }

        root.setAttribute(PENDING_ATTRIBUTE, 'true');
        const raw = window.sessionStorage.getItem(RETURN_KEY);
        const saved = raw ? JSON.parse(raw) : null;
        const committedAt = Number(saved?.committedAt || 0);
        const target = saved?.href
          ? new URL(saved.href, window.location.origin)
          : null;
        const targetHref = target
          ? `${target.pathname}${target.search}${target.hash}`
          : '';

        if (
          !saved
          || Date.now() - Number(saved.savedAt || 0) > MAX_AGE_MS
          || (committedAt > 0 && Date.now() - committedAt > RETURN_COMMIT_SURVIVAL_MS)
          || target?.origin !== window.location.origin
          || targetHref !== sourceHref
        ) {
          window.sessionStorage.removeItem(PENDING_KEY);
          window.sessionStorage.removeItem(RETURN_KEY);
          releaseReturnMask();
          restoreNativeScrollMode();
          return false;
        }

        const containerTop = Math.max(0, Number(saved.galleryScrollTop || 0));
        const windowTop = Math.max(0, Number(saved.scrollY || 0));
        restoreInProgress = true;
        consumedReturnSavedAt = Number(saved.savedAt);
        restoreStartedAt = window.performance.now();
        stableFrameCount = 0;
        previousStableSignature = '';

        root.style.scrollBehavior = 'auto';
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'manual';
        }

        const applyAtomicRestore = () => {
          restoreExpandedProductGrids(saved.expandedProductGridIds);
          prepareDeferredReturnLayout(saved);

          const scroller = scrollContainerId
            ? document.getElementById(scrollContainerId)
            : null;
          let maxTop = 0;

          if (scrollContainerId) {
            if (scroller) {
              maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
              scroller.scrollTop = maxTop > 0 ? Math.min(containerTop, maxTop) : containerTop;
            }
          }

          window.scrollTo(0, windowTop);

          const anchor = findProductReturnAnchor(saved);
          const savedAnchorTop = Number(saved.productAnchorViewportTop);
          if (anchor && Number.isFinite(savedAnchorTop)) {
            const anchorDelta = anchor.getBoundingClientRect().top - savedAnchorTop;
            maxTop = scroller
              ? Math.max(0, scroller.scrollHeight - scroller.clientHeight)
              : maxTop;

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

          const anchorTop = anchor?.getBoundingClientRect().top;
          const anchorReady = !saved.productHref || Boolean(anchor);
          const scrollRangeReady = !scrollContainerId
            || Boolean(scroller && (containerTop <= 1 || maxTop >= containerTop - POSITION_EPSILON));
          const anchorAligned = !anchor
            || !Number.isFinite(savedAnchorTop)
            || Math.abs(anchorTop - savedAnchorTop) <= POSITION_EPSILON;
          const appliedScrollTop = scroller?.scrollTop ?? window.scrollY;

          return {
            ready: anchorReady && scrollRangeReady && anchorAligned,
            signature: `${Math.round(appliedScrollTop * 10)}:${Math.round((anchorTop || 0) * 10)}`,
          };
        };

        const runRestoreFrame = () => {
          restoreFrame = 0;
          if (!restoreInProgress) return;

          const result = applyAtomicRestore();
          if (result.ready && result.signature === previousStableSignature) {
            stableFrameCount += 1;
          } else {
            stableFrameCount = result.ready ? 1 : 0;
            previousStableSignature = result.ready ? result.signature : '';
          }

          const timedOut = window.performance.now() - restoreStartedAt >= RESTORE_TIMEOUT_MS;
          if (stableFrameCount >= REQUIRED_STABLE_FRAMES || timedOut) {
            applyAtomicRestore();
            markConsumedReturnCommitted();
            finishRestore();
            scheduleTransactionCleanup();
            return;
          }

          restoreFrame = window.requestAnimationFrame(runRestoreFrame);
        };

        applyAtomicRestore();
        restoreFrame = window.requestAnimationFrame(runRestoreFrame);

        return true;
      } catch {
        try {
          window.sessionStorage.removeItem(PENDING_KEY);
          window.sessionStorage.removeItem(RETURN_KEY);
        } catch {
          // The visual fallback must still be released when storage is unavailable.
        }
        releaseReturnMask();
        restoreNativeScrollMode();
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
      document.removeEventListener('pointerdown', rememberProductReturnTarget, true);
      document.removeEventListener('click', rememberProductReturnTarget, true);
      window.removeEventListener('popstate', scheduleProductReturnRestore);
      clearScheduledRestore();
      let returnStillPending = false;
      try {
        returnStillPending = window.sessionStorage.getItem(PENDING_KEY) === currentHref();
      } catch {
        returnStillPending = false;
      }
      finishRestore({
        releaseMask: !returnStillPending,
        restoreScrollMode: !returnStillPending,
      });
    };
  }, [scrollContainerId]);

  return null;
}
