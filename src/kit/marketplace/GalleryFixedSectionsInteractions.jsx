'use client';

import { useEffect, useLayoutEffect } from 'react';

const wrapIndex = (index, count) => (index + count) % count;
const EXPANDED_PRODUCT_GRIDS_KEY = 'secondevie:gallery-expanded-product-grids:v1';

const setupRichSectionsPrewarm = () => {
  const mobileScrollRoot = window.matchMedia('(max-width: 1023px)').matches
    ? document.getElementById('marketplaceGalleryScroll')
    : null;
  const scrollTarget = mobileScrollRoot || window;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const beforeAfterSection = document.querySelector('.before-after-premium');
  const instagramSection = document.querySelector('[data-instagram-carousel]');
  const testimonialsSection = document.querySelector('[data-testimonials-carousel]');
  const visibleLayout = window.matchMedia('(min-width: 1024px)').matches ? 'desktop' : 'mobile';
  const tasks = [];

  document.querySelectorAll('.gallery-deferred-render').forEach((section) => {
    tasks.push(() => {
      section.dataset.cvPrerendered = 'true';
    });
  });

  const warmDecorativeBackground = (element) => {
    const style = window.getComputedStyle(element);
    if (style.display === 'none') return;
    const match = /url\("?([^")]+)"?\)/.exec(style.backgroundImage || '');
    if (!match?.[1]) return;
    const image = new Image();
    image.decoding = 'async';
    image.fetchPriority = 'low';
    image.src = match[1];
    if (typeof image.decode === 'function') void image.decode().catch(() => {});
  };

  document.querySelectorAll('.atelier-showcase__ornament, .discount-section__ornament').forEach((element) => {
    tasks.push(() => warmDecorativeBackground(element));
  });

  const warmImage = (image) => {
    if (!image || !(image.currentSrc || image.getAttribute('src'))) return;
    image.fetchPriority = 'low';
    image.loading = 'eager';
    image.dataset.galleryPrewarmRequested = 'true';
    if (typeof image.decode !== 'function') return;
    void image.decode().then(() => {
      image.dataset.galleryPrewarmed = 'true';
      if (image.hasAttribute('data-insta-img')) image.dataset.instaDecoded = 'true';
    }).catch(() => {
      // The normal image request remains the fallback if decoding is interrupted.
    });
  };

  if (beforeAfterSection) {
    if (!reduceMotion) {
      tasks.push(() => {
        if (beforeAfterSection.dataset.baRevealed !== 'true') {
          beforeAfterSection.dataset.baLayerPrepared = 'true';
        }
      });
    }
    beforeAfterSection.querySelectorAll('[data-ba-after-img], [data-ba-before-img]').forEach((image) => {
      tasks.push(() => warmImage(image));
    });
  }

  if (instagramSection) {
    instagramSection
      .querySelectorAll('[data-insta-card]')
      .forEach((card) => {
        const index = Number(card.dataset.instaCard || 0);
        if (index > 2) return;
        tasks.push(() => {
          if (instagramSection.dataset.instaHasTransitioned !== 'true') {
            card.dataset.instaPrepared = 'true';
          }
          if (card.dataset.instaLayout === visibleLayout) {
            warmImage(card.querySelector('img[data-insta-img]'));
          }
        });
      });
  }

  if (testimonialsSection) {
    const cards = Array.from(testimonialsSection.querySelectorAll('[data-testimonial-card]'))
      .filter((card) => Number(card.dataset.testimonialCard || 0) <= 2);
    cards.forEach((card) => {
      tasks.push(() => {
        if (testimonialsSection.dataset.testimonialsPrepared === 'true') return;
        card.dataset.testimonialPrepared = 'true';
      });
    });
    tasks.push(() => {
      testimonialsSection.dataset.testimonialsLayersPrepared = 'true';
    });
  }

  if (!tasks.length) return () => {};

  let disposed = false;
  let scrolling = false;
  let idleHandle = null;
  let fallbackHandle = null;
  let settleHandle = null;

  const cancelScheduledTask = () => {
    if (idleHandle !== null && 'cancelIdleCallback' in window) {
      window.cancelIdleCallback(idleHandle);
    }
    if (fallbackHandle !== null) window.clearTimeout(fallbackHandle);
    idleHandle = null;
    fallbackHandle = null;
  };

  const scheduleNextTask = () => {
    if (disposed || scrolling || !tasks.length || idleHandle !== null || fallbackHandle !== null) return;
    const runNextTask = (deadline) => {
      idleHandle = null;
      fallbackHandle = null;
      if (disposed || scrolling || !tasks.length) return;
      if (deadline && !deadline.didTimeout && deadline.timeRemaining() < 4) {
        scheduleNextTask();
        return;
      }
      tasks.shift()?.();
      scheduleNextTask();
    };

    if ('requestIdleCallback' in window) {
      idleHandle = window.requestIdleCallback(runNextTask, { timeout: 1500 });
      return;
    }
    fallbackHandle = window.setTimeout(runNextTask, 96);
  };

  const resumeAfterScroll = (delay) => {
    if (settleHandle !== null) window.clearTimeout(settleHandle);
    settleHandle = window.setTimeout(() => {
      settleHandle = null;
      scrolling = false;
      scheduleNextTask();
    }, delay);
  };

  const onScroll = () => {
    scrolling = true;
    cancelScheduledTask();
    resumeAfterScroll(180);
  };
  const onScrollEnd = () => resumeAfterScroll(48);

  scrollTarget.addEventListener('scroll', onScroll, { passive: true });
  scrollTarget.addEventListener('scrollend', onScrollEnd, { passive: true });
  scheduleNextTask();

  return () => {
    disposed = true;
    cancelScheduledTask();
    if (settleHandle !== null) window.clearTimeout(settleHandle);
    scrollTarget.removeEventListener('scroll', onScroll);
    scrollTarget.removeEventListener('scrollend', onScrollEnd);
  };
};

const parseItems = (node) => {
  try {
    const parsed = JSON.parse(node.dataset.items || node.dataset.projects || '[]');
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const setProgressDots = (root, selector, activeIndex, {
  color = '#A68A64',
  inactiveColor = '#e7e5e4',
  activeWidth = '2.5rem',
  inactiveWidth = '1.5rem',
  activeHeight,
  inactiveHeight,
  activeBoxShadow,
  inactiveBoxShadow,
  progressDurationMs = 0,
  itemCount,
} = {}) => {
  root.querySelectorAll(selector).forEach((dot, index) => {
    const dotIndex = itemCount ? index % itemCount : index;
    const isActive = dotIndex === activeIndex;
    dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    const visualDot = dot.querySelector('[data-dot-visual]');
    const paintTarget = visualDot || dot;
    paintTarget.style.width = isActive ? activeWidth : inactiveWidth;
    if (activeHeight && inactiveHeight) {
      paintTarget.style.height = isActive ? activeHeight : inactiveHeight;
    }
    if (activeBoxShadow !== undefined || inactiveBoxShadow !== undefined) {
      paintTarget.style.boxShadow = isActive ? (activeBoxShadow || '') : (inactiveBoxShadow || 'none');
    }
    const bar = dot.querySelector('[data-dot-bar]');
    if (bar) {
      paintTarget.style.backgroundColor = inactiveColor;
      bar.style.transition = 'none';
      bar.style.transform = 'scaleX(0)';
      if (isActive) {
        window.requestAnimationFrame(() => {
          bar.style.transition = progressDurationMs > 0 ? `transform ${progressDurationMs}ms linear` : '';
          bar.style.transform = 'scaleX(1)';
        });
      }
      return;
    }
    paintTarget.style.backgroundColor = isActive ? color : inactiveColor;
  });
};

const getInteractionItems = (node) => {
  const itemCount = Number.parseInt(node.dataset.itemCount || '', 10);
  return Number.isFinite(itemCount) && itemCount > 0
    ? Array.from({ length: itemCount }, () => true)
    : parseItems(node);
};

const setupMobileCarouselSwipe = (surface, {
  isEnabled,
  onPrevious,
  onNext,
  onGestureStart,
  onGestureEnd,
}) => {
  if (!surface || surface.dataset.swipeReady === 'true') return;
  surface.dataset.swipeReady = 'true';

  const intentThreshold = 10;
  const swipeThreshold = 42;
  const flingThreshold = 24;
  const flingVelocity = 0.45;
  let gesture = null;
  let resetTimer;

  const releasePointer = (pointerId) => {
    if (!surface.hasPointerCapture?.(pointerId)) return;
    surface.releasePointerCapture(pointerId);
  };

  const resetSurfacePosition = () => {
    window.clearTimeout(resetTimer);
    surface.style.transition = 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)';
    surface.style.transform = '';
    resetTimer = window.setTimeout(() => {
      surface.style.transition = '';
    }, 240);
  };

  surface.addEventListener('pointerdown', (event) => {
    if (
      !isEnabled()
      || !event.isPrimary
      || !['touch', 'pen'].includes(event.pointerType)
    ) {
      return;
    }

    window.clearTimeout(resetTimer);
    surface.style.transition = 'none';
    gesture = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startedAt: event.timeStamp,
      horizontal: false,
    };
    surface.setPointerCapture?.(event.pointerId);
    onGestureStart?.();
  });

  surface.addEventListener('pointermove', (event) => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    const distanceX = Math.abs(deltaX);
    const distanceY = Math.abs(deltaY);

    if (!gesture.horizontal) {
      if (distanceY >= intentThreshold && distanceY > distanceX) {
        const pointerId = gesture.pointerId;
        gesture = null;
        releasePointer(pointerId);
        resetSurfacePosition();
        onGestureEnd?.({ swiped: false });
        return;
      }
      if (distanceX < intentThreshold || distanceX <= distanceY) return;
      gesture.horizontal = true;
    }

    event.preventDefault();
    const visualOffset = Math.max(-72, Math.min(72, deltaX * 0.42));
    surface.style.transform = `translate3d(${visualOffset}px, 0, 0)`;
  });

  const finishGesture = (event, cancelled = false) => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const currentGesture = gesture;
    gesture = null;
    releasePointer(event.pointerId);

    const deltaX = event.clientX - currentGesture.startX;
    const deltaY = event.clientY - currentGesture.startY;
    const distanceX = Math.abs(deltaX);
    const duration = Math.max(1, event.timeStamp - currentGesture.startedAt);
    const velocity = distanceX / duration;
    const horizontalIntent = currentGesture.horizontal
      || distanceX > Math.abs(deltaY) * 1.15;
    const swiped = !cancelled
      && horizontalIntent
      && (distanceX >= swipeThreshold || (distanceX >= flingThreshold && velocity >= flingVelocity));

    resetSurfacePosition();
    if (swiped) {
      if (deltaX < 0) onNext();
      else onPrevious();
    }
    onGestureEnd?.({ swiped });
  };

  surface.addEventListener('pointerup', (event) => finishGesture(event));
  surface.addEventListener('pointercancel', (event) => finishGesture(event, true));
};

const setupProductGridExpansion = () => {
  const getExpandedGridIds = () => {
    try {
      const stored = JSON.parse(window.sessionStorage.getItem(EXPANDED_PRODUCT_GRIDS_KEY) || '[]');
      return new Set(Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : []);
    } catch {
      return new Set();
    }
  };

  const revealAllItems = (section) => {
    section.querySelectorAll('[data-product-grid-item][hidden]').forEach((item) => {
      item.hidden = false;
    });

    const button = section.querySelector('[data-product-grid-more]');
    button?.setAttribute('aria-expanded', 'true');
    button?.closest('.product-grid-more-wrap')?.setAttribute('hidden', '');
  };

  const restoreExpandedGrids = () => {
    const expandedGridIds = getExpandedGridIds();
    if (!expandedGridIds.size) return;

    document.querySelectorAll('[data-expandable-product-grid][id]').forEach((section) => {
      if (expandedGridIds.has(section.id)) revealAllItems(section);
    });
  };

  const onClick = (event) => {
    const button = event.target.closest('[data-product-grid-more]');
    if (!button) return;

    const section = button.closest('[data-expandable-product-grid]');
    if (!section) return;

    revealAllItems(section);

    if (section.id) {
      try {
        const expandedGridIds = getExpandedGridIds();
        expandedGridIds.add(section.id);
        window.sessionStorage.setItem(
          EXPANDED_PRODUCT_GRIDS_KEY,
          JSON.stringify([...expandedGridIds]),
        );
      } catch {
        // The current grid still expands when session storage is unavailable.
      }
    }
  };

  restoreExpandedGrids();
  document.addEventListener('click', onClick);
  window.addEventListener('pageshow', restoreExpandedGrids);
  return () => {
    document.removeEventListener('click', onClick);
    window.removeEventListener('pageshow', restoreExpandedGrids);
  };
};

const setupBeforeAfter = () => {
  document.querySelectorAll('[data-before-after-section]').forEach((root) => {
    if (root.dataset.interactionsReady === 'true') return;
    root.dataset.interactionsReady = 'true';

    const projects = parseItems(root);
    if (!projects.length) return;

    let activeIndex = 0;
    const clip = root.querySelector('[data-ba-clip]');
    const line = root.querySelector('[data-ba-line]');
    const handle = root.querySelector('[data-ba-handle]');
    const range = root.querySelector('[data-ba-range]');
    const pointerSurface = root.querySelector('[data-ba-media-stage]') || range;
    const beforeImg = root.querySelector('[data-ba-before-img]');
    const afterImg = root.querySelector('[data-ba-after-img]');
    const beforeSource = root.querySelector('[data-ba-before-source]');
    const afterSource = root.querySelector('[data-ba-after-source]');
    const tag = root.querySelector('[data-ba-tag]');
    const title = root.querySelector('[data-ba-title]');
    const desc = root.querySelector('[data-ba-desc]');
    const count = root.querySelector('[data-ba-count]');
    const section = root.closest('.before-after-premium');
    const projectCopy = root.querySelector('[data-ba-project-copy]');
    const projectActions = root.querySelector('[data-ba-project-actions]');
    const premiumVisual = section?.querySelector('.before-after-premium-visual');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let projectAnimations = [];
    let touchGesture = null;

    if (section) {
      section.dataset.baMotionReady = 'true';
      if (reduceMotion || !('IntersectionObserver' in window)) {
        section.dataset.baRevealed = 'true';
        section.dataset.baLayerPrepared = 'false';
      } else {
        const releasePreparedVisualLayer = (event) => {
          if (event.target !== premiumVisual) return;
          section.dataset.baLayerPrepared = 'false';
          premiumVisual.removeEventListener('transitionend', releasePreparedVisualLayer);
        };
        premiumVisual?.addEventListener('transitionend', releasePreparedVisualLayer);
        const revealObserver = new IntersectionObserver(
          ([entry]) => {
            if (!entry?.isIntersecting) return;
            section.dataset.baRevealed = 'true';
            revealObserver.disconnect();
          },
          { threshold: 0.18 },
        );
        revealObserver.observe(section);
      }
    }

    const animateProjectChange = () => {
      if (reduceMotion) return;
      projectAnimations.forEach((animation) => animation.cancel());
      projectAnimations = [
        ...[beforeImg, afterImg].map((image) => image?.animate(
          [
            { opacity: 0.4, transform: 'scale(1.03)' },
            { opacity: 1, transform: 'scale(1)' }
          ],
          { duration: 850, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        )),
        projectCopy?.animate(
          [
            { opacity: 0, transform: 'translateY(12px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 750, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        ),
        projectActions?.animate(
          [
            { opacity: 0, transform: 'translateX(8px)' },
            { opacity: 1, transform: 'translateX(0)' },
          ],
          { duration: 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        ),
      ].filter(Boolean);
    };

    const setSlider = (value) => {
      const percentage = `${value}%`;
      if (clip) clip.style.clipPath = `polygon(0 0, ${percentage} 0, ${percentage} 100%, 0 100%)`;
      if (line) line.style.left = percentage;
      if (handle) handle.style.left = percentage;
    };

    const setSliderFromPointer = (event) => {
      if (!range) return;
      const bounds = range.getBoundingClientRect();
      if (!bounds.width) return;
      const value = Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100));
      range.value = String(value);
      setSlider(value);
    };

    const setProject = (nextIndex) => {
      activeIndex = wrapIndex(nextIndex, projects.length);
      const project = projects[activeIndex];
      if (beforeSource && project.avantAvif) {
        beforeSource.setAttribute('srcset', project.avantAvif);
      }
      if (afterSource && project.apresAvif) {
        afterSource.setAttribute('srcset', project.apresAvif);
      }
      if (beforeImg) {
        beforeImg.src = project.avant;
      }
      if (afterImg) {
        afterImg.src = project.apres;
      }
      if (tag) tag.textContent = project.tag;
      if (title) title.textContent = project.title;
      if (desc) desc.textContent = project.desc;
      if (count) count.textContent = `0${activeIndex + 1} / 0${projects.length}`;
      animateProjectChange();
    };

    const startSliderDrag = (event) => {
      event.preventDefault();
      range?.focus({ preventScroll: true });
      pointerSurface?.setPointerCapture(event.pointerId);
      setSliderFromPointer(event);
    };

    const endSliderDrag = (event) => {
      if (pointerSurface?.hasPointerCapture(event.pointerId)) {
        pointerSurface.releasePointerCapture(event.pointerId);
      }
      if (touchGesture?.pointerId === event.pointerId) touchGesture = null;
    };

    range?.addEventListener('input', (event) => setSlider(event.currentTarget.value));
    pointerSurface?.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;

      if (event.pointerType === 'touch') {
        touchGesture = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          dragging: false,
        };
        return;
      }

      startSliderDrag(event);
    });
    pointerSurface?.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') {
        if (!touchGesture || touchGesture.pointerId !== event.pointerId) return;

        if (!touchGesture.dragging) {
          const deltaX = Math.abs(event.clientX - touchGesture.startX);
          const deltaY = Math.abs(event.clientY - touchGesture.startY);
          const intentThreshold = 10;

          if (deltaY >= intentThreshold && deltaY > deltaX) {
            touchGesture = null;
            return;
          }
          if (deltaX < intentThreshold || deltaX <= deltaY) return;

          touchGesture.dragging = true;
          startSliderDrag(event);
          return;
        }

        event.preventDefault();
        setSliderFromPointer(event);
        return;
      }

      if (!pointerSurface.hasPointerCapture(event.pointerId)) return;
      event.preventDefault();
      setSliderFromPointer(event);
    });
    pointerSurface?.addEventListener('pointerup', endSliderDrag);
    pointerSurface?.addEventListener('pointercancel', endSliderDrag);
    root.querySelector('[data-ba-prev]')?.addEventListener('click', () => setProject(activeIndex - 1));
    root.querySelector('[data-ba-next]')?.addEventListener('click', () => setProject(activeIndex + 1));
  });
};

const setupInstagram = () => {
  document.querySelectorAll('[data-instagram-carousel]').forEach((root) => {
    if (root.dataset.carouselReady === 'true') return;
    root.dataset.carouselReady = 'true';

    const items = getInteractionItems(root);
    if (!items.length) return;
    const autoplayDelayMs = 4200;
    const resumeDelayMs = 6500;
    let activeIndex = 1 % items.length;
    let autoplayTimer;
    let preloadTimer;
    let resumeTimer;
    let sectionVisible = false;
    let manuallyPaused = false;
    let swipeActive = false;
    const desktopLayout = window.matchMedia('(min-width: 1024px)');
    const getVisibleLayout = () => (desktopLayout.matches ? 'desktop' : 'mobile');
    const isInputActive = () => swipeActive || root.dataset.instagramInputActive === 'true';

    const mobilePositions = {
      farLeft: { transform: 'translateX(-206%) scale(0.86)', opacity: 0, zIndex: 0, pointerEvents: 'none' },
      left: { transform: 'translateX(-106%) scale(0.88)', opacity: 0.3, zIndex: 1, pointerEvents: 'none' },
      center: { transform: 'translateX(-50%) scale(1)', opacity: 1, zIndex: 3, pointerEvents: 'auto' },
      right: { transform: 'translateX(6%) scale(0.88)', opacity: 0.32, zIndex: 1, pointerEvents: 'none' },
      farRight: { transform: 'translateX(106%) scale(0.86)', opacity: 0, zIndex: 0, pointerEvents: 'none' },
    };
    const desktopPositions = {
      farLeft: { transform: 'translateX(-248%) scale(0.88)', opacity: 0, zIndex: 0, pointerEvents: 'none' },
      left: { transform: 'translateX(-145%) scale(0.92)', opacity: 0.52, zIndex: 1, pointerEvents: 'none' },
      center: { transform: 'translateX(-50%) scale(1)', opacity: 1, zIndex: 3, pointerEvents: 'auto' },
      right: { transform: 'translateX(45%) scale(0.92)', opacity: 0.58, zIndex: 1, pointerEvents: 'none' },
      farRight: { transform: 'translateX(148%) scale(0.88)', opacity: 0, zIndex: 0, pointerEvents: 'none' },
    };

    const getPosition = (index, referenceIndex = activeIndex) => {
      const offset = (index - referenceIndex + items.length) % items.length;
      if (offset === 0) return 'center';
      if (offset === 1) return 'right';
      if (offset === items.length - 1) return 'left';
      if (offset > items.length / 2) return 'farLeft';
      return 'farRight';
    };

    const ensureCardImage = (card) => {
      const image = card.querySelector('img[data-insta-img][data-insta-src]');
      if (!image?.dataset.instaSrc) return;
      image.fetchPriority = 'low';
      image.src = image.dataset.instaSrc;
      delete image.dataset.instaSrc;
    };

    const ensureVisibleWindow = (referenceIndex = activeIndex) => {
      const visibleLayout = getVisibleLayout();
      root.querySelectorAll(`[data-insta-card][data-insta-layout="${visibleLayout}"]`).forEach((card) => {
        const index = Number(card.dataset.instaCard || 0);
        const position = getPosition(index, referenceIndex);
        if (position === 'left' || position === 'center' || position === 'right') {
          ensureCardImage(card);
        }
      });
    };

    const applyPosition = (card, positions) => {
      const index = Number(card.dataset.instaCard || 0);
      const style = positions[getPosition(index)] || positions.farRight;
      card.style.transform = style.transform;
      card.style.opacity = String(style.opacity);
      card.style.zIndex = String(style.zIndex);
      card.style.pointerEvents = style.pointerEvents;
    };

    const stopAutoplay = () => {
      window.clearTimeout(autoplayTimer);
      window.clearTimeout(preloadTimer);
      window.clearTimeout(resumeTimer);
      autoplayTimer = undefined;
      preloadTimer = undefined;
      resumeTimer = undefined;
      setProgressDots(root, '[data-insta-dot]', activeIndex);
    };

    const render = ({
      animateProgress = sectionVisible && !manuallyPaused,
      transitioning = false,
    } = {}) => {
      if (transitioning) root.dataset.instaHasTransitioned = 'true';
      const visibleLayout = getVisibleLayout();
      root.querySelectorAll('[data-insta-card]').forEach((card) => {
        const index = Number(card.dataset.instaCard || 0);
        const position = getPosition(index);
        if (
          transitioning
          && card.dataset.instaLayout === visibleLayout
          && (position === 'left' || position === 'center' || position === 'right')
        ) {
          card.dataset.instaTransitioning = 'true';
          const releaseLayer = () => {
            card.dataset.instaTransitioning = 'false';
            card.dataset.instaPrepared = 'false';
          };
          card.addEventListener('transitionend', releaseLayer, { once: true });
          window.setTimeout(releaseLayer, 650);
        }
        applyPosition(card, card.dataset.instaLayout === 'desktop' ? desktopPositions : mobilePositions);
      });
      setProgressDots(root, '[data-insta-dot]', activeIndex, {
        progressDurationMs: animateProgress ? autoplayDelayMs : 0,
        itemCount: items.length,
      });
    };

    function scheduleAutoplay({ transitioning = false } = {}) {
      window.clearTimeout(autoplayTimer);
      if (!sectionVisible || manuallyPaused) return;
      if (isInputActive()) {
        scheduleAutoplayWhenCalm();
        return;
      }
      render({ animateProgress: true, transitioning });
      preloadTimer = window.setTimeout(() => {
        ensureVisibleWindow(wrapIndex(activeIndex + 1, items.length));
      }, Math.max(800, autoplayDelayMs - 1200));
      autoplayTimer = window.setTimeout(() => {
        if (isInputActive()) {
          scheduleAutoplayWhenCalm();
          return;
        }
        activeIndex = wrapIndex(activeIndex + 1, items.length);
        scheduleAutoplay({ transitioning: true });
      }, autoplayDelayMs);
    }

    function scheduleAutoplayWhenCalm() {
      window.clearTimeout(resumeTimer);
      if (!sectionVisible || manuallyPaused) return;
      resumeTimer = window.setTimeout(() => {
        resumeTimer = undefined;
        if (isInputActive()) {
          scheduleAutoplayWhenCalm();
          return;
        }
        scheduleAutoplay();
      }, 280);
    }

    const goTo = (nextIndex, { manual = true } = {}) => {
      const resolvedIndex = wrapIndex(nextIndex, items.length);
      ensureVisibleWindow(resolvedIndex);
      activeIndex = resolvedIndex;
      if (manual) {
        manuallyPaused = true;
        window.clearTimeout(autoplayTimer);
        window.clearTimeout(preloadTimer);
        window.clearTimeout(resumeTimer);
        render({ animateProgress: false, transitioning: true });
        resumeTimer = window.setTimeout(() => {
          manuallyPaused = false;
          scheduleAutoplayWhenCalm();
        }, resumeDelayMs);
        return;
      }
      render({ animateProgress: true });
    };

    root.querySelectorAll('[data-insta-prev]').forEach((button) => {
      button.addEventListener('click', () => {
        goTo(activeIndex - 1);
      });
    });
    root.querySelectorAll('[data-insta-next]').forEach((button) => {
      button.addEventListener('click', () => {
        goTo(activeIndex + 1);
      });
    });
    root.querySelectorAll('[data-insta-dot]').forEach((dot, index) => {
      dot.addEventListener('click', () => {
        goTo(index);
      });
    });
    setupMobileCarouselSwipe(root.querySelector('[data-insta-swipe-surface]'), {
      isEnabled: () => !desktopLayout.matches,
      onPrevious: () => goTo(activeIndex - 1),
      onNext: () => goTo(activeIndex + 1),
      onGestureStart: () => {
        swipeActive = true;
        window.clearTimeout(autoplayTimer);
        window.clearTimeout(preloadTimer);
      },
      onGestureEnd: ({ swiped }) => {
        swipeActive = false;
        if (!swiped) scheduleAutoplayWhenCalm();
      },
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries.find((item) => item.target === root);
          sectionVisible = Boolean(entry?.isIntersecting);
          if (sectionVisible) {
            scheduleAutoplayWhenCalm();
            return;
          }
          stopAutoplay();
        },
        { rootMargin: '-18% 0px -18% 0px', threshold: 0.28 },
      );
      observer.observe(root);
    } else {
      sectionVisible = true;
      scheduleAutoplay();
    }

    render({ animateProgress: false });
  });
};

const setupTestimonials = () => {
  document.querySelectorAll('[data-testimonials-carousel]').forEach((root) => {
    if (root.dataset.carouselReady === 'true') return;
    root.dataset.carouselReady = 'true';

    const items = getInteractionItems(root);
    if (!items.length) return;
    let activeIndex = 1 % items.length;

    const prepareRenderingLayers = () => {
      root.dataset.testimonialsPrepared = 'true';
      if (root.dataset.testimonialsLayersPrepared === 'true') return;
      root.dataset.testimonialsLayersPrepared = 'true';

      const visibleLayout = window.matchMedia('(min-width: 1024px)').matches ? 'desktop' : 'mobile';
      const cards = Array.from(root.querySelectorAll(`[data-testimonial-card][data-testimonial-layout="${visibleLayout}"]`))
        .filter((card) => {
          const index = Number(card.dataset.testimonialCard || 0);
          return index === 0 || index === 1 || index === 2;
        });
      let cursor = 0;
      const prepareBatch = () => {
        cards.slice(cursor, cursor + 2).forEach((card) => {
          card.dataset.testimonialPrepared = 'true';
        });
        cursor += 2;
        if (cursor < cards.length) window.requestAnimationFrame(prepareBatch);
      };
      window.requestAnimationFrame(prepareBatch);
    };

    if ('IntersectionObserver' in window) {
      const mobileScrollRoot = window.matchMedia('(max-width: 1023px)').matches
        ? document.getElementById('marketplaceGalleryScroll')
        : null;
      const viewportHeight = mobileScrollRoot?.clientHeight || window.innerHeight || 0;
      const verticalMargin = Math.min(240, Math.max(120, Math.round(viewportHeight * 0.3)));
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        prepareRenderingLayers();

        const releaseObserver = new IntersectionObserver((visibleEntries) => {
          if (!visibleEntries.some((entry) => entry.isIntersecting)) return;
          releaseObserver.disconnect();
          root.dataset.testimonialsStarsActive = 'true';
          window.setTimeout(() => {
            root.dataset.testimonialsStarsActive = 'false';
          }, 3200);
          window.setTimeout(() => {
            root.querySelectorAll('[data-testimonial-card]').forEach((card) => {
              card.dataset.testimonialPrepared = 'false';
            });
          }, 850);
        }, { root: mobileScrollRoot, threshold: 0.08 });
        releaseObserver.observe(root);
      }, {
        root: mobileScrollRoot,
        rootMargin: `${verticalMargin}px 0px`,
        threshold: 0.01,
      });
      observer.observe(root);
    } else {
      prepareRenderingLayers();
    }

    const mobilePositions = {
      farLeft: { transform: 'translateX(-206%) scale(0.86)', opacity: 0, zIndex: 0, pointerEvents: 'none' },
      left: { transform: 'translateX(-116%) scale(0.9)', opacity: 0.42, zIndex: 1, pointerEvents: 'none' },
      center: { transform: 'translateX(-50%) scale(1)', opacity: 1, zIndex: 3, pointerEvents: 'auto' },
      right: { transform: 'translateX(16%) scale(0.9)', opacity: 0.46, zIndex: 1, pointerEvents: 'none' },
      farRight: { transform: 'translateX(106%) scale(0.86)', opacity: 0, zIndex: 0, pointerEvents: 'none' },
    };
    const desktopPositions = {
      farLeft: { transform: 'translateX(-248%) scale(0.88)', opacity: 0, zIndex: 0, pointerEvents: 'none' },
      left: { transform: 'translateX(-145%) scale(0.92)', opacity: 0.52, zIndex: 1, pointerEvents: 'none' },
      center: { transform: 'translateX(-50%) scale(1)', opacity: 1, zIndex: 3, pointerEvents: 'auto' },
      right: { transform: 'translateX(45%) scale(0.92)', opacity: 0.58, zIndex: 1, pointerEvents: 'none' },
      farRight: { transform: 'translateX(148%) scale(0.88)', opacity: 0, zIndex: 0, pointerEvents: 'none' },
    };

    const getPosition = (index) => {
      const offset = (index - activeIndex + items.length) % items.length;
      if (offset === 0) return 'center';
      if (offset === 1) return 'right';
      if (offset === items.length - 1) return 'left';
      if (offset > items.length / 2) return 'farLeft';
      return 'farRight';
    };

    const applyPosition = (card, positions) => {
      const index = Number(card.dataset.testimonialCard || 0);
      const style = positions[getPosition(index)] || positions.farRight;
      card.style.transform = style.transform;
      card.style.opacity = String(style.opacity);
      card.style.zIndex = String(style.zIndex);
      card.style.pointerEvents = style.pointerEvents;
    };

    const render = ({ interactive = false } = {}) => {
      root.querySelectorAll('[data-testimonial-card]').forEach((card) => {
        if (interactive) {
          card.dataset.testimonialTransitioning = 'true';
          const releaseLayer = () => {
            card.dataset.testimonialTransitioning = 'false';
          };
          card.addEventListener('transitionend', releaseLayer, { once: true });
          window.setTimeout(releaseLayer, 650);
        }
        applyPosition(card, card.dataset.testimonialLayout === 'desktop' ? desktopPositions : mobilePositions);
      });
      root.querySelectorAll('[data-testimonial-count]').forEach((count) => {
        count.textContent = String(activeIndex + 1).padStart(2, '0');
      });
      setProgressDots(root, '[data-testimonial-dot]', activeIndex, {
        color: '#ff9200',
        inactiveColor: 'rgba(214,204,191,1)',
        activeWidth: '1.75rem',
        inactiveWidth: '0.375rem',
        activeHeight: '0.625rem',
        inactiveHeight: '0.5rem',
        activeBoxShadow: '0 0 0 4px rgba(255, 146, 0, 0.09), 0 5px 12px rgba(255, 146, 0, 0.16)',
        inactiveBoxShadow: 'none',
        itemCount: items.length,
      });
    };

    root.querySelectorAll('[data-testimonial-prev]').forEach((button) => {
      button.addEventListener('click', () => {
        activeIndex = wrapIndex(activeIndex - 1, items.length);
        render({ interactive: true });
      });
    });
    root.querySelectorAll('[data-testimonial-next]').forEach((button) => {
      button.addEventListener('click', () => {
        activeIndex = wrapIndex(activeIndex + 1, items.length);
        render({ interactive: true });
      });
    });
    root.querySelectorAll('[data-testimonial-dot]').forEach((dot, index) => {
      dot.addEventListener('click', () => {
        activeIndex = index % items.length;
        render({ interactive: true });
      });
    });
    setupMobileCarouselSwipe(root.querySelector('[data-testimonial-swipe-surface]'), {
      isEnabled: () => window.matchMedia('(max-width: 1023px)').matches,
      onPrevious: () => {
        activeIndex = wrapIndex(activeIndex - 1, items.length);
        render({ interactive: true });
      },
      onNext: () => {
        activeIndex = wrapIndex(activeIndex + 1, items.length);
        render({ interactive: true });
      },
    });
    render();
  });
};

export default function GalleryFixedSectionsInteractions() {
  useLayoutEffect(() => setupProductGridExpansion(), []);

  useEffect(() => {
    setupBeforeAfter();
    setupInstagram();
    setupTestimonials();
    const cleanupPrewarm = setupRichSectionsPrewarm();
    return () => {
      cleanupPrewarm();
    };
  }, []);

  return null;
}
