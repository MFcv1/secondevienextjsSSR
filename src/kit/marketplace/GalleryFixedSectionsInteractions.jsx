'use client';

import { useEffect, useLayoutEffect } from 'react';
import { ArrowRight } from 'lucide-react';

const wrapIndex = (index, count) => (index + count) % count;
const EXPANDED_PRODUCT_GRIDS_KEY = 'secondevie:gallery-expanded-product-grids:v1';

const getExpandedGridIds = () => {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(EXPANDED_PRODUCT_GRIDS_KEY) || '[]');
    return new Set(Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
};

const revealAllProductGridItems = (section) => {
  section.querySelectorAll('[data-product-grid-item][hidden]').forEach((item) => {
    item.hidden = false;
  });

  const button = section.querySelector('[data-product-grid-more]');
  button?.setAttribute('aria-expanded', 'true');
  button?.closest('.product-grid-more-wrap')?.setAttribute('hidden', '');
};

export function ProductGridMoreButtonIsland({ sectionId, darkMode = false } = {}) {
  useLayoutEffect(() => {
    if (!getExpandedGridIds().has(sectionId)) return;
    const section = document.getElementById(sectionId);
    if (section?.matches('[data-expandable-product-grid]')) {
      revealAllProductGridItems(section);
    }
  }, [sectionId]);

  const revealAll = (event) => {
    const section = event.currentTarget.closest('[data-expandable-product-grid]');
    if (!section) return;

    revealAllProductGridItems(section);
    if (!section.id) return;

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
  };

  return (
    <button
      type="button"
      aria-controls={`${sectionId}-grid`}
      aria-expanded="false"
      data-product-grid-more
      onClick={revealAll}
      className={`flex min-h-11 items-center gap-2 rounded-full px-8 py-3 font-sans text-[10px] font-bold uppercase tracking-widest transition-colors ${darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-stone-100 text-stone-800 hover:bg-stone-200'}`}
    >
      Voir plus <ArrowRight size={12} />
    </button>
  );
}

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

const setupBeforeAfter = () => {
  const cleanups = [];

  document.querySelectorAll('[data-before-after-section]').forEach((root) => {
    if (root.dataset.interactionsReady === 'true') return;
    root.dataset.interactionsReady = 'true';

    const projects = parseItems(root);
    if (!projects.length) return;

    let activeIndex = 0;
    let requestedIndex = 0;
    let requestVersion = 0;
    let transitionRunning = false;
    let disposed = false;
    let touchGesture = null;
    let layerAnimations = [];
    let copyAnimations = [];
    let copyVersion = 0;
    const eventController = new AbortController();
    const eventOptions = { signal: eventController.signal };
    const layerPreparePromises = new Map();
    const clips = Array.from(root.querySelectorAll('[data-ba-clip]'));
    const line = root.querySelector('[data-ba-line]');
    const handle = root.querySelector('[data-ba-handle]');
    const range = root.querySelector('[data-ba-range]');
    const pointerSurface = root.querySelector('[data-ba-media-stage]') || range;
    const projectLayers = Array.from(root.querySelectorAll('[data-ba-project-layer]'));
    const tag = root.querySelector('[data-ba-tag]');
    const title = root.querySelector('[data-ba-title]');
    const desc = root.querySelector('[data-ba-desc]');
    const count = root.querySelector('[data-ba-count]');
    const segments = Array.from(root.querySelectorAll('[data-ba-segment]'));
    const chips = Array.from(root.querySelectorAll('[data-ba-chip]'));
    const section = root.closest('.before-after-premium');
    const projectCopy = root.querySelector('[data-ba-project-copy]');
    const premiumVisual = section?.querySelector('.before-after-premium-visual');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
        cleanups.push(() => premiumVisual?.removeEventListener('transitionend', releasePreparedVisualLayer));
        const revealObserver = new IntersectionObserver(
          ([entry]) => {
            if (!entry?.isIntersecting) return;
            section.dataset.baRevealed = 'true';
            revealObserver.disconnect();
          },
          { threshold: 0.18 },
        );
        revealObserver.observe(section);
        cleanups.push(() => revealObserver.disconnect());
      }
    }

    const waitForImageLoad = (image) => new Promise((resolve) => {
      if (image.complete) {
        resolve(image.naturalWidth > 0);
        return;
      }

      const finish = () => {
        image.removeEventListener('load', finish);
        image.removeEventListener('error', finish);
        resolve(image.naturalWidth > 0);
      };
      image.addEventListener('load', finish, { once: true });
      image.addEventListener('error', finish, { once: true });
    });

    const prepareLayer = (index, { urgent = false } = {}) => {
      const layer = projectLayers[index];
      if (!layer) return Promise.resolve(false);

      const images = Array.from(layer.querySelectorAll('img'));
      images.forEach((image) => {
        image.loading = 'eager';
        image.fetchPriority = urgent ? 'high' : 'low';
      });

      const existing = layerPreparePromises.get(index);
      if (existing) return existing;

      const preparation = Promise.all(images.map(async (image) => {
        const loaded = await waitForImageLoad(image);
        if (!loaded) return false;
        if (typeof image.decode !== 'function') return true;
        try {
          await image.decode();
          return image.naturalWidth > 0;
        } catch {
          return image.complete && image.naturalWidth > 0;
        }
      })).then((results) => {
        const ready = results.every(Boolean);
        layer.dataset.baLayerReady = ready ? 'true' : 'false';
        if (!ready) layerPreparePromises.delete(index);
        return ready;
      });

      layerPreparePromises.set(index, preparation);
      return preparation;
    };

    const prewarmAllLayers = () => {
      projectLayers.forEach((_, index) => {
        void prepareLayer(index);
      });
    };

    if ('IntersectionObserver' in window) {
      const prewarmObserver = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          prewarmAllLayers();
          prewarmObserver.disconnect();
        },
        { rootMargin: '900px 0px', threshold: 0.01 },
      );
      prewarmObserver.observe(root);
      cleanups.push(() => prewarmObserver.disconnect());
    } else {
      prewarmAllLayers();
    }

    const setLayerState = (layer, state) => {
      if (!layer) return;
      layer.dataset.baLayerState = state;
      if (state === 'active' || state === 'incoming') {
        layer.removeAttribute('aria-hidden');
      } else {
        layer.setAttribute('aria-hidden', 'true');
      }
    };

    const updateProjectCopy = (index) => {
      const project = projects[index];
      if (!project) return;
      if (tag) tag.textContent = project.tag;
      if (title) title.textContent = project.title;
      if (desc) desc.textContent = project.desc;
      if (count) count.textContent = `0${index + 1} / 0${projects.length}`;
      segments.forEach((segment, segmentIndex) => {
        segment.dataset.baSegmentState = segmentIndex === index ? 'active' : 'idle';
      });
    };

    // L'ancien traitement remplacait le texte puis faisait remonter la carte entiere
    // depuis 0.45 d'opacite : on lisait le nouveau libelle avant meme que
    // l'animation commence, et le bloc "sautait" d'un projet a l'autre. On separe
    // donc une sortie et une entree, avec le remplacement du texte au creux de la
    // bascule et un leger decalage ligne par ligne.
    const copyLines = () => [tag, title, desc].filter(Boolean);

    const cancelCopyAnimations = () => {
      copyAnimations.forEach((animation) => animation.cancel());
      copyAnimations = [];
    };

    const runProjectCopyTransition = (index) => {
      copyVersion += 1;
      const version = copyVersion;
      cancelCopyAnimations();

      const lines = copyLines();
      if (reduceMotion || !projectCopy || !lines.length) {
        updateProjectCopy(index);
        return;
      }

      const exit = lines.map((node, lineIndex) => node.animate(
        [
          { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' },
          { opacity: 0, transform: 'translateY(-8px)', filter: 'blur(2px)' },
        ],
        { duration: 200, delay: lineIndex * 30, easing: 'cubic-bezier(0.4, 0, 0.8, 0.35)', fill: 'both' },
      ));
      copyAnimations = exit;

      void Promise.allSettled(exit.map((animation) => animation.finished)).then(() => {
        if (disposed || version !== copyVersion) return;

        // Le compteur, les segments et les libelles basculent une fois le bloc vide.
        updateProjectCopy(index);

        const enter = lines.map((node, lineIndex) => node.animate(
          [
            { opacity: 0, transform: 'translateY(10px)', filter: 'blur(2px)' },
            { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' },
          ],
          { duration: 460, delay: lineIndex * 55, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' },
        ));
        copyAnimations = enter;

        void Promise.allSettled(enter.map((animation) => animation.finished)).then(() => {
          if (disposed || version !== copyVersion) return;
          // On relache le `fill: both` pour rendre la main aux styles de la feuille.
          cancelCopyAnimations();
        });
      });
    };

    const waitForNextFrame = () => new Promise((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

    const transitionLayers = async (fromIndex, toIndex) => {
      const outgoingLayer = projectLayers[fromIndex];
      const incomingLayer = projectLayers[toIndex];
      if (!outgoingLayer || !incomingLayer || outgoingLayer === incomingLayer) return;

      layerAnimations.forEach((animation) => animation.cancel());
      layerAnimations = [];
      setLayerState(outgoingLayer, 'outgoing');
      setLayerState(incomingLayer, 'incoming');
      root.dataset.baTransitioning = 'true';
      runProjectCopyTransition(toIndex);

      if (reduceMotion) {
        setLayerState(outgoingLayer, 'inactive');
        setLayerState(incomingLayer, 'active');
        root.dataset.baTransitioning = 'false';
        return;
      }

      await waitForNextFrame();
      if (disposed) return;
      // Fondu enchaine avec un leger recul / avancee : la bascule se lit comme
      // un changement de piece plutot que comme un simple changement d'opacite.
      const dissolve = {
        duration: 620,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'both',
      };
      layerAnimations = [
        outgoingLayer.animate(
          [
            { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
            { opacity: 0, transform: 'scale(1.035)', filter: 'blur(3px)' },
          ],
          dissolve,
        ),
        incomingLayer.animate(
          [
            { opacity: 0, transform: 'scale(1.045)', filter: 'blur(4px)' },
            { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
          ],
          dissolve,
        ),
      ];
      await Promise.allSettled(layerAnimations.map((animation) => animation.finished));
      if (disposed) return;
      setLayerState(outgoingLayer, 'inactive');
      setLayerState(incomingLayer, 'active');
      layerAnimations.forEach((animation) => animation.cancel());
      layerAnimations = [];
      root.dataset.baTransitioning = 'false';
    };

    const processRequestedProject = async () => {
      if (transitionRunning) return;
      transitionRunning = true;
      root.setAttribute('aria-busy', 'true');

      try {
        while (!disposed && activeIndex !== requestedIndex) {
          const targetIndex = requestedIndex;
          const targetVersion = requestVersion;
          const ready = await prepareLayer(targetIndex, { urgent: true });

          if (disposed) break;
          if (targetVersion !== requestVersion || targetIndex !== requestedIndex) continue;
          if (!ready) {
            requestedIndex = activeIndex;
            break;
          }

          await transitionLayers(activeIndex, targetIndex);
          if (disposed) break;
          activeIndex = targetIndex;
        }
      } finally {
        transitionRunning = false;
        root.removeAttribute('aria-busy');
        if (!disposed && activeIndex !== requestedIndex) void processRequestedProject();
      }
    };

    const requestProject = (direction) => {
      if (disposed) return;
      requestedIndex = wrapIndex(requestedIndex + direction, projects.length);
      requestVersion += 1;
      void processRequestedProject();
    };

    const setSlider = (value) => {
      const percentage = `${value}%`;
      clips.forEach((clip) => {
        clip.style.clipPath = `polygon(0 0, ${percentage} 0, ${percentage} 100%, 0 100%)`;
      });
      if (line) line.style.left = percentage;
      if (handle) handle.style.left = percentage;

      // Le CSS derive opacite / echelle de cette seule variable.
      // `value` est la largeur du volet "avant" : plus il grandit, plus son
      // etiquette s'affirme, et inversement pour "apres".
      const ratio = Math.min(1, Math.max(0, Number(value) / 100));
      chips.forEach((chip) => {
        const presence = chip.dataset.baChip === 'before' ? ratio : 1 - ratio;
        chip.style.setProperty('--ba-presence', presence.toFixed(3));
      });
    };

    const setSliderFromPointer = (event) => {
      if (!range) return;
      const bounds = range.getBoundingClientRect();
      if (!bounds.width) return;
      const value = Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100));
      range.value = String(value);
      setSlider(value);
    };

    const mediaStage = root.querySelector('[data-ba-media-stage]');

    const startSliderDrag = (event) => {
      event.preventDefault();
      range?.focus({ preventScroll: true });
      pointerSurface?.setPointerCapture(event.pointerId);
      if (mediaStage) mediaStage.dataset.baDragging = 'true';
      setSliderFromPointer(event);
    };

    const endSliderDrag = (event) => {
      if (pointerSurface?.hasPointerCapture(event.pointerId)) {
        pointerSurface.releasePointerCapture(event.pointerId);
      }
      if (mediaStage) mediaStage.dataset.baDragging = 'false';
      if (touchGesture?.pointerId === event.pointerId) touchGesture = null;
    };

    range?.addEventListener('input', (event) => setSlider(event.currentTarget.value), eventOptions);
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
    }, eventOptions);
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
    }, eventOptions);
    pointerSurface?.addEventListener('pointerup', endSliderDrag, eventOptions);
    pointerSurface?.addEventListener('pointercancel', endSliderDrag, eventOptions);
    root.querySelector('[data-ba-prev]')?.addEventListener('click', () => requestProject(-1), eventOptions);
    root.querySelector('[data-ba-next]')?.addEventListener('click', () => requestProject(1), eventOptions);
    cleanups.push(() => {
      disposed = true;
      eventController.abort();
      layerAnimations.forEach((animation) => animation.cancel());
      copyVersion += 1;
      cancelCopyAnimations();
      projectLayers.forEach((layer, index) => {
        setLayerState(layer, index === 0 ? 'active' : 'inactive');
      });
      activeIndex = 0;
      requestedIndex = 0;
      updateProjectCopy(0);
      if (range) range.value = '50';
      setSlider(50);
      root.dataset.interactionsReady = 'false';
      root.dataset.baTransitioning = 'false';
      root.removeAttribute('aria-busy');
    });
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
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

const setupNewsletterGame = () => {
  const cleanups = [];

  document.querySelectorAll('[data-nl-game]').forEach((game) => {
    const section = game.closest('.discount-section');
    if (!section) return;

    const cards = Array.from(game.querySelectorAll('[data-nl-card]'));
    const cardsWrap = game.querySelector('[data-nl-cards]');
    const fxCanvas = game.querySelector('[data-nl-fx]');
    const fxBack = game.querySelector('[data-nl-fx-back]');
    const won = game.querySelector('[data-nl-won]');
    const wonValue = game.querySelector('[data-nl-won-value]');
    const form = section.querySelector('[data-nl-form]');
    const email = section.querySelector('[data-nl-email]');
    const consent = section.querySelector('[data-nl-consent]');
    const submit = section.querySelector('[data-nl-submit]');
    const submitLabel = section.querySelector('[data-nl-submit-label]');
    const fine = section.querySelector('[data-nl-fine]');
    const fineText = section.querySelector('[data-nl-fine-text]');
    const sent = section.querySelector('[data-nl-sent]');
    const sentCode = section.querySelector('[data-nl-sent-code]');
    const sentText = section.querySelector('[data-nl-sent-text]');
    const errorMessage = section.querySelector('[data-nl-error]');
    const tiers = Array.from(section.querySelectorAll('[data-nl-tier]'));
    const promoCycle = section.querySelector('[data-nl-promo-cycle]');
    const gameLabel = game.querySelector('[data-nl-game-label]');
    if (!cards.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const eventController = new AbortController();
    const eventOptions = { signal: eventController.signal };
    const timers = new Set();
    let disposed = false;
    let prize = null;
    let playId = null;
    let isSubmitting = false;

    game.dataset.nlDealt = 'false';
    game.dataset.nlAct = 'idle';

    /* --- Chronologie ------------------------------------------------------
       La sequence est une suite de rendez-vous annulables : l'echec du tirage
       doit pouvoir effacer d'un coup toutes les etapes en attente, ce qu'une
       liste de setTimeout jamais nettoyee ne permettait pas. */
    const later = (callback, delay) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        if (!disposed) callback();
      }, Math.max(0, delay));
      timers.add(id);
      return id;
    };

    const cancelPending = () => {
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
    };

    // Sous prefers-reduced-motion, tous les rendez-vous tombent a zero : la
    // mecanique reste jouable, la mise en scene disparait.
    const beat = (ms) => (reduceMotion ? 0 : ms);

    const setAct = (act) => {
      game.dataset.nlAct = act;
    };

    const labelText = gameLabel?.querySelector('[data-nl-game-label-text]') || gameLabel;

    const setLabel = (text) => {
      if (!labelText || labelText.textContent === text) return;
      if (reduceMotion || !gameLabel) {
        labelText.textContent = text;
        return;
      }
      gameLabel.dataset.nlLabelSwap = 'out';
      later(() => {
        labelText.textContent = text;
        gameLabel.dataset.nlLabelSwap = 'in';
      }, 240);
    };

    const showError = (message) => {
      if (!errorMessage) return;
      errorMessage.textContent = message;
      errorMessage.hidden = false;
    };

    const clearError = () => {
      if (!errorMessage) return;
      errorMessage.textContent = '';
      errorMessage.hidden = true;
    };

    if ('IntersectionObserver' in window) {
      const dealObserver = new IntersectionObserver(([entry]) => {
        if (!entry?.isIntersecting) return;
        game.dataset.nlDealt = 'true';
        dealObserver.disconnect();
      }, { threshold: 0.3 });
      dealObserver.observe(cardsWrap || game);
      cleanups.push(() => dealObserver.disconnect());
    } else {
      game.dataset.nlDealt = 'true';
    }

    /* --- Mise a l'echelle de la scene -------------------------------------
       La carte choisie doit occuper le panneau, dont la hauteur reelle depend
       de la colonne formulaire d'a cote : elle ne peut donc pas etre ecrite en
       dur dans le CSS. On mesure la place disponible, on en deduit l'echelle
       et le recentrage vertical, et le CSS anime le reste.

       Les reserves haute et basse gardent le libelle et la bande d'appel hors
       de la trajectoire de la carte. */
    const HERO_TOP_RESERVE = 46;
    const HERO_BOTTOM_RESERVE = 84;
    const HERO_MIN_SCALE = 1.1;
    const HERO_MAX_SCALE = 1.55;
    // La carte n'occupe pas toute la bande disponible : elle domine la scene
    // sans l'ecraser.
    const HERO_FILL = 0.8;

    // Geometrie calculee, jamais mesuree sur la carte elle-meme : une fois
    // passee en taille reelle, ses dimensions ne sont plus celles du repos et
    // la mesure se mordrait la queue au redimensionnement.
    const heroGeometry = () => {
      // Sur une carte encore au repos, jamais sur celle deja passee en taille
      // reelle : sa largeur n'est plus celle du repos et le calcul se
      // mordrait la queue. On lit des valeurs de mise en page plutot que
      // --card-w : une propriete personnalisee non enregistree renvoie sa
      // declaration litterale (`clamp(...)`), pas la longueur resolue.
      const reference = cards.find((card) => card !== crisped) || cards[0];
      const baseWidth = reference.offsetWidth;
      const baseHeight = reference.offsetHeight;
      if (!baseWidth || !baseHeight) return null;

      const face = reference.querySelector('.discount-card__face');
      const baseRadius = face ? parseFloat(window.getComputedStyle(face).borderTopLeftRadius) || 0 : 0;

      const styles = window.getComputedStyle(game);
      const padTop = parseFloat(styles.paddingTop) || 0;
      const padBottom = parseFloat(styles.paddingBottom) || 0;
      const padLeft = parseFloat(styles.paddingLeft) || 0;
      const padRight = parseFloat(styles.paddingRight) || 0;

      const innerHeight = game.clientHeight - padTop - padBottom;
      const innerWidth = game.clientWidth - padLeft - padRight;
      const band = Math.max(baseHeight, innerHeight - HERO_TOP_RESERVE - HERO_BOTTOM_RESERVE);

      const scale = Math.max(HERO_MIN_SCALE, Math.min(
        (band * HERO_FILL) / baseHeight,
        (innerWidth - 32) / baseWidth,
        HERO_MAX_SCALE,
      ));

      const width = baseWidth * scale;
      const height = baseHeight * scale;
      const centerInGame = padTop + HERO_TOP_RESERVE + band / 2;
      const wrapTop = cardsWrap?.offsetTop || 0;
      const wrapHeight = cardsWrap?.offsetHeight || baseHeight;
      const wrapWidth = cardsWrap?.clientWidth || innerWidth;

      return {
        scale,
        width,
        height,
        radius: baseRadius * scale,
        left: wrapWidth / 2 - width / 2,
        top: centerInGame - wrapTop - height / 2,
        // Le deplacement precede la mise a l'echelle dans la chaine transform :
        // il se raisonne donc en pixels non mis a l'echelle.
        lift: centerInGame - (wrapTop + wrapHeight / 2),
      };
    };

    const measureHero = () => {
      const geo = heroGeometry();
      if (!geo) return;
      game.style.setProperty('--hero-scale', geo.scale.toFixed(3));
      game.style.setProperty('--hero-lift', `${geo.lift.toFixed(1)}px`);
    };

    let crisped = null;

    // Pose la geometrie definitive de la carte en scene : sortie du flux,
    // dimensions et rayon reels, chaine de transform neutralisee.
    const applyHeroLayout = (card) => {
      const geo = heroGeometry();
      if (!geo || !cardsWrap) return false;
      crisped = card;
      card.style.position = 'absolute';
      card.style.left = `${geo.left.toFixed(1)}px`;
      card.style.top = `${geo.top.toFixed(1)}px`;
      card.style.setProperty('--card-w', `${geo.width.toFixed(1)}px`);
      card.style.setProperty('--card-radius', `${geo.radius.toFixed(1)}px`);
      card.style.setProperty('--scale', '1');
      card.style.setProperty('--slide', '0px');
      card.style.setProperty('--rise', '0px');
      card.style.setProperty('--lift', '0px');
      return true;
    };

    /* --- Agrandissement en pleine resolution -------------------------------
       Agrandir par `transform: scale()` etire un rendu calcule a la petite
       taille : le texte n'est net qu'a l'arrivee, quand le navigateur le
       recalcule. On inverse donc la manoeuvre.

       La carte recoit sa taille DEFINITIVE des la premiere image — son texte
       est donc mis en page en pleine resolution pendant tout le trajet — puis
       un transform inverse annule visuellement ce saut, et on le relache. La
       carte n'est plus agrandie : elle part reduite et revient a l'echelle 1.
       Un rendu qu'on retrecit reste net, celui qu'on etire ne l'est jamais. */
    const growHero = (card) => {
      if (!card || crisped === card) return;

      const before = card.getBoundingClientRect();

      // Les deux cartes ecartees sont epinglees a leur place courante avant
      // que la choisie ne quitte le flux : sans cela le retrait de celle-ci
      // recentrerait les autres, et ce recalage se verrait puisqu'elles sont
      // encore a l'ecran a cet instant. Les positions sont toutes lues avant
      // la moindre ecriture, sinon la premiere fausserait les suivantes.
      const others = cards.filter((other) => other !== card);
      const spots = others.map((other) => ({ left: other.offsetLeft, top: other.offsetTop }));

      card.style.transition = 'none';
      others.forEach((other, index) => {
        other.style.transition = 'none';
        other.style.left = `${spots[index].left}px`;
        other.style.top = `${spots[index].top}px`;
        other.style.position = 'absolute';
      });

      if (!applyHeroLayout(card)) {
        card.style.removeProperty('transition');
        others.forEach((other) => other.style.removeProperty('transition'));
        return;
      }

      const after = card.getBoundingClientRect();
      if (before.width && after.width) {
        const ratio = before.width / after.width;
        const dx = (before.left + before.width / 2) - (after.left + after.width / 2);
        const dy = (before.top + before.height / 2) - (after.top + after.height / 2);
        card.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${ratio.toFixed(4)})`;
      }

      // Fige cet etat de depart avant de rendre la main aux transitions, sans
      // quoi les deux mutations seraient fusionnees et rien ne s'animerait.
      void card.offsetWidth;
      card.style.removeProperty('transition');
      others.forEach((other) => other.style.removeProperty('transition'));
      void card.offsetWidth;
      // Le retrait du transform inverse lance l'agrandissement, desormais un
      // simple retour a l'echelle 1.
      card.style.removeProperty('transform');
    };

    const crispenHero = (card, force = false) => {
      if (!card || (!force && crisped === card)) return;
      card.style.transition = 'none';
      applyHeroLayout(card);
      void card.offsetWidth;
      card.style.removeProperty('transition');
    };

    const releaseHero = (card) => {
      if (crisped === card) crisped = null;
      ['transition', 'position', 'left', 'top', 'transition-delay'].forEach((name) => {
        card.style.removeProperty(name);
      });
      ['--card-w', '--card-radius', '--scale', '--slide', '--rise', '--lift'].forEach((name) => {
        card.style.removeProperty(name);
      });
    };

    // La scene se recalcule au redimensionnement : si la fenetre change pendant
    // que la carte est en scene, elle se recadre au lieu de rester sur
    // l'ancienne hauteur.
    let measureFrame = 0;
    window.addEventListener('resize', () => {
      if (game.dataset.nlAct === 'idle') return;
      if (measureFrame) window.cancelAnimationFrame(measureFrame);
      measureFrame = window.requestAnimationFrame(() => {
        measureFrame = 0;
        if (crisped) crispenHero(crisped, true);
        else measureHero();
      });
    }, eventOptions);

    /* --- Confettis et poussiere d'or --------------------------------------
       Deux canvas, un par plan de profondeur. Pres de 200 particules en DOM
       anime ne tiennent pas les 60 fps ; la meme quantite dessinee en deux
       passes rAF ne coute presque rien. Les canvas sont dimensionnes au
       dernier moment, sur la geometrie reelle de la carte en scene. */
    const CONFETTI_COUNT = 124;
    const DUST_COUNT = 68;

    /* --- Modele de lancement, repris de canvas-confetti --------------------
       Sa signature ne tient ni a ses formes ni a ses couleurs, qui restent
       ici celles du module, mais a deux choix de trajectoire :

       - la vitesse perd 10 % a chaque image (decroissance exponentielle) ;
       - la gravite est un deplacement CONSTANT par image, jamais une
         acceleration.

       On obtient un jet vif, un freinage net, puis une descente reguliere,
       au lieu d'une parabole qui accelere sans fin.

       Puissance de lancement reprise telle quelle (startVelocity 36, gravite
       0.8 qui vaut 2.4 px par image dans la bibliotheque). L'avoir reduite
       pour tenir dans un panneau plus etroit qu'une fenetre ne faisait pas
       tenir la gerbe : elle plafonnait a 111 px d'apogee mediane, soit un jet
       timide. A pleine puissance la mediane monte a ~204 px pour 266 px
       disponibles au-dessus de la carte, et les plus rapides debordent par le
       haut du panneau — c'est ce depassement qui donne l'impression de force.
       Le cone reste plus large que les 70 degres de reference pour que les
       morceaux couvrent aussi les cotes, sur le fond clair. */
    const CONFETTI_TICKS = 240;
    const CONFETTI_DECAY = 0.9;
    const CONFETTI_VELOCITY = 36;
    const CONFETTI_FALL = 2.4;
    const CONFETTI_SPREAD = (90 * Math.PI) / 180;

    let fxFrame = 0;

    const fxLayers = () => [fxBack, fxCanvas].filter(Boolean);

    const stopFx = () => {
      if (fxFrame) window.cancelAnimationFrame(fxFrame);
      fxFrame = 0;
      delete game.dataset.nlFx;
      fxLayers().forEach((canvas) => {
        const context = canvas.getContext('2d');
        if (context) context.clearRect(0, 0, canvas.width, canvas.height);
      });
    };

    const readPalette = () => {
      const styles = window.getComputedStyle(section);
      const pick = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
      return [
        pick('--nl-card-prize-hi', '#ac774e'),
        pick('--nl-bronze', '#9b734a'),
        pick('--nl-card-paper-hi', '#fffcf6'),
        pick('--nl-card-prize-lo', '#67401f'),
        pick('--nl-accent', '#8b5c42'),
      ];
    };

    /* `dustLead` est le retard de la poussiere, en images, sur l'eclat. Il est
       passe par l'appelant plutot que fige ici : la gerbe part la premiere,
       le grain dore se leve dans son sillage, et les deux instants se reglent
       au meme endroit dans la chronologie. */
    const celebrate = (card, dustLead = 0) => {
      if (reduceMotion || !fxCanvas) return;
      const context = fxCanvas.getContext('2d');
      const backContext = fxBack?.getContext('2d') || null;
      if (!context) return;

      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const stage = game.getBoundingClientRect();
      const target = card.getBoundingClientRect();
      const width = stage.width;
      const height = stage.height;
      if (!width || !height) return;

      fxLayers().forEach((canvas) => {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        canvas.getContext('2d')?.setTransform(ratio, 0, 0, ratio, 0, 0);
      });

      const originX = target.left - stage.left + target.width / 2;
      const originY = target.top - stage.top + target.height / 2;
      /* Les confettis partent du BAS de la carte, la poussiere de son centre.
         Emise depuis le centre, la gerbe ne disposait que de la moitie de la
         hauteur utile : 53 morceaux sur 124 sortaient par le haut du cadre au
         lieu de se deployer, ce qui la tassait. Depuis le bas ils ne sont plus
         que 4, et la gerbe s'epanouit en passant devant la carte. */
      const burstY = target.bottom - stage.top;
      const spread = target.width;
      const palette = readPalette();
      const confetti = [];
      const dust = [];

      // `depth` va de 0 (loin, derriere la carte) a 1 (pres, devant). Il pilote
      // ensemble la taille, la vitesse et l'opacite : c'est la correlation des
      // trois qui fait lire la profondeur, pas chacune prise isolement.
      const layerOf = (depth) => (depth < 0.5 && backContext ? backContext : context);

      for (let index = 0; index < CONFETTI_COUNT; index += 1) {
        const depth = Math.random();
        // Cone dirige vers le haut : un jet, pas une sphere.
        const angle = -Math.PI / 2 + (CONFETTI_SPREAD * 0.5 - Math.random() * CONFETTI_SPREAD);
        // Entre la moitie et une fois et demie la vitesse nominale : c'est
        // cet ecart qui etage la gerbe au lieu d'en faire un front unique.
        const velocity = (CONFETTI_VELOCITY * 0.5 + Math.random() * CONFETTI_VELOCITY)
          * (0.72 + depth * 0.5);
        // Un tiers de rubans etroits parmi les rectangles : deux formes qui
        // tombent differemment valent mieux qu'une seule repetee.
        const ribbon = Math.random() < 0.32;
        const size = 0.66 + depth * 0.6;
        confetti.push({
          depth,
          // Emission resserree sur le bord bas de la carte : la dispersion
          // vient de la gerbe, pas d'un semis initial deja etale.
          x: originX + (Math.random() - 0.5) * spread * 0.5,
          y: burstY + (Math.random() - 0.5) * spread * 0.12,
          angle,
          velocity,
          fall: CONFETTI_FALL * (0.7 + depth * 0.6),
          w: (ribbon ? 2.2 + Math.random() * 1.6 : 3.2 + Math.random() * 4.4) * size,
          h: (ribbon ? 9 + Math.random() * 9 : 5.5 + Math.random() * 7) * size,
          tilt: (0.25 + Math.random() * 0.5) * Math.PI,
          // Oscillation de la face : le morceau se presente tantot de face
          // tantot sur la tranche, ce qui le fait battre comme du papier.
          wobble: Math.random() * 10,
          wobbleSpeed: Math.min(0.11, Math.random() * 0.1 + 0.05),
          alpha: 0.42 + depth * 0.58,
          color: palette[index % palette.length],
          life: 0,
          // Eclosion etalee sur quelques images : une floraison, pas un pop.
          delay: Math.random() * 10,
          span: CONFETTI_TICKS,
        });
      }

      // La poussiere se leve dans le sillage de la gerbe et monte lentement :
      // c'est elle qui fait durer la celebration une fois les confettis
      // retombes. Emission etalee sur pres de deux secondes pour que le flux
      // se renouvelle au lieu de partir d'un seul bloc.
      for (let index = 0; index < DUST_COUNT; index += 1) {
        const depth = Math.random();
        // Repartie de part et d'autre plutot qu'autour du centre : au-dessus
        // de la carte le grain dore se perdait sur le brun, sur les cotes il
        // se detache du fond clair.
        const side = Math.random() < 0.5 ? -1 : 1;
        const lateral = (0.42 + Math.random() * 0.95) * spread;
        dust.push({
          depth,
          x: originX + side * lateral,
          y: originY + (Math.random() - 0.15) * spread * 1.05,
          vy: -(0.22 + Math.random() * 0.5) * (0.55 + depth * 0.9),
          drift: (Math.random() - 0.5) * 0.42 * (0.5 + depth),
          phase: Math.random() * Math.PI * 2,
          radius: (0.7 + Math.random() * 1.7) * (0.55 + depth * 0.85),
          alpha: 0.3 + depth * 0.62,
          delay: dustLead + Math.random() * 110,
          life: 0,
          span: 270 + Math.random() * 140,
        });
      }

      game.dataset.nlFx = 'on';
      let previous = performance.now();

      const draw = (now) => {
        if (disposed) {
          stopFx();
          return;
        }

        // Pas normalise sur une image a 60 fps : la chute garde la meme
        // vitesse sur un ecran 120 Hz comme apres une image sautee.
        const step = Math.min(2.4, (now - previous) / 16.667);
        previous = now;

        const contexts = backContext ? [context, backContext] : [context];
        contexts.forEach((target2d) => {
          target2d.clearRect(0, 0, width, height);
          target2d.globalCompositeOperation = 'lighter';
        });

        let alive = 0;

        dust.forEach((particle) => {
          particle.life += step;
          if (particle.life < particle.delay) {
            alive += 1;
            return;
          }
          const age = (particle.life - particle.delay) / particle.span;
          if (age >= 1) return;
          alive += 1;
          particle.y += particle.vy * step;
          particle.phase += 0.05 * step;
          particle.x += (particle.drift + Math.sin(particle.phase) * 0.4) * step;
          const layer = layerOf(particle.depth);
          layer.globalAlpha = Math.sin(age * Math.PI) * particle.alpha;
          layer.fillStyle = palette[0];
          layer.beginPath();
          layer.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          layer.fill();
        });

        contexts.forEach((target2d) => {
          target2d.globalCompositeOperation = 'source-over';
        });

        confetti.forEach((piece) => {
          piece.life += step;
          if (piece.life < piece.delay) {
            alive += 1;
            return;
          }
          const age = (piece.life - piece.delay) / piece.span;
          if (age >= 1 || piece.y > height + 60) return;
          alive += 1;
          // Deplacement puis freinage, dans cet ordre : la chute est un
          // decalage constant qui s'ajoute a l'elan, et l'elan seul s'eteint.
          piece.x += Math.cos(piece.angle) * piece.velocity * step;
          piece.y += (Math.sin(piece.angle) * piece.velocity + piece.fall) * step;
          piece.velocity *= CONFETTI_DECAY ** step;
          piece.wobble += piece.wobbleSpeed * step;
          piece.tilt += 0.1 * step;
          const layer = layerOf(piece.depth);
          // Fondu lineaire sur toute la vie : le morceau s'eteint en tombant
          // au lieu de disparaitre d'un coup en fin de course.
          layer.globalAlpha = (1 - age) * piece.alpha;
          layer.save();
          layer.translate(piece.x, piece.y);
          layer.rotate(piece.tilt);
          // La largeur suit l'oscillation : le rectangle se lit alors comme un
          // morceau de papier qui tourne sur lui-meme.
          layer.scale(Math.max(0.08, Math.abs(Math.cos(piece.wobble))), 1);
          layer.fillStyle = piece.color;
          layer.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
          layer.restore();
        });

        contexts.forEach((target2d) => {
          target2d.globalAlpha = 1;
        });

        if (alive > 0) {
          fxFrame = window.requestAnimationFrame(draw);
          return;
        }
        stopFx();
      };

      fxFrame = window.requestAnimationFrame(draw);
    };

    // Le chiffre monte sur la face de la carte, devenue l'affichage du gain.
    const countUp = (target, node) => {
      if (!node) return;
      if (reduceMotion) {
        node.textContent = String(target);
        return;
      }
      let startTime = null;
      const step = (timestamp) => {
        if (disposed) return;
        if (startTime === null) startTime = timestamp;
        const progress = Math.min(1, (timestamp - startTime) / 800);
        node.textContent = String(Math.round((1 - (1 - progress) ** 3) * target));
        if (progress < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };

    // Dernier temps : la carte est retablie a plat, le gain se lit, le
    // formulaire s'arme.
    const revealPrize = () => {
      setAct('reveal');
      if (won) won.hidden = false;
      // La carte porte le chiffre ; la zone live le dit aux lecteurs d'ecran.
      if (wonValue) wonValue.textContent = `${prize}% de reduction remportes`;

      if (promoCycle) promoCycle.dataset.nlPromoResult = String(prize);

      tiers.forEach((tier) => {
        tier.dataset.nlTierState = Number(tier.dataset.nlTier) === prize ? 'won' : 'dimmed';
      });

      if (submit) submit.disabled = false;
      if (submitLabel) submitLabel.textContent = `Recevoir mes ${prize}%`;
      if (fine) fine.dataset.nlFineState = 'armed';
      if (fineText) fineText.textContent = `Ton code de ${prize}% et nos nouveautes, dans le meme e-mail.`;
    };

    /* --- Reperes de la sequence, en millisecondes depuis le clic -----------
       Ils doublent des durees ecrites en CSS : les modifier d'un cote sans
       l'autre desynchronise la chorégraphie.
         ASCEND_AT + 1200 ms de transition CSS = HERO_SETTLED_AT ;
         TURN_MS doit valoir --turn-ms sur .discount-game. */
    const ASCEND_AT = 200;
    const HERO_SETTLED_AT = 1400;
    const TURN_MS = 1300;
    // La face n'est de face qu'a la moitie de la rotation : le compteur ne
    // demarre qu'apres, sinon le chiffre final se lit avant de monter.
    const VALUE_AT = 700;
    // La gerbe part quand la face devient lisible.
    const CELEBRATE_AT = 1180;
    /* La poussiere ne se leve qu'au moment ou les confettis commencent a ne
       plus se voir. Leur fondu etant lineaire sur 240 images (4 s), ils sont a
       ~40 % d'opacite a 2320 ms : c'est la que le grain dore prend le relais.
       Partir plus tot faisait cohabiter les deux au lieu de les enchainer. */
    const DUST_AT = 3500;
    const DUST_LEAD_FRAMES = Math.round(((DUST_AT - CELEBRATE_AT) / 1000) * 60);
    const SETTLED_AT = TURN_MS;

    // Echec du tirage : la chorégraphie se rembobine au lieu de se couper net.
    // Retirer l'etat rend leur transform de repos aux trois cartes, qui
    // reviennent donc en eventail par la transition de base.
    const rewind = (message) => {
      cancelPending();
      stopFx();
      prize = null;
      playId = null;
      setAct('idle');
      cards.forEach((other) => {
        other.disabled = false;
        releaseHero(other);
        delete other.dataset.nlCardState;
        delete other.dataset.nlCardFlipped;
        const value = other.querySelector('[data-nl-card-value]');
        if (value) value.textContent = '—';
      });
      setLabel('Choisis une carte');
      showError(message);
    };

    cards.forEach((card) => {
      card.addEventListener('click', async () => {
        if (game.dataset.nlAct !== 'idle') return;
        clearError();
        cards.forEach((other) => { other.disabled = true; });

        // La mise en scene demarre a l'instant du clic et ne depend pas du
        // reseau : les cartes ecartees sortent du cadre, la choisie monte sur
        // scene, et elle flotte tant que le tirage n'est pas revenu. Attendre
        // la reponse avant de bouger laissait l'interface figee.
        measureHero();

        // Acte 1 : la dispersion. Le decalage part de la carte choisie, les
        // deux autres ne quittent donc pas le cadre en meme temps.
        setAct('disperse');
        let exitRank = 0;
        cards.forEach((other) => {
          if (other === card) {
            other.dataset.nlCardState = 'picked';
            other.style.removeProperty('transition-delay');
            return;
          }
          other.dataset.nlCardState = 'faded';
          other.style.transitionDelay = `${beat(exitRank * 90)}ms`;
          exitRank += 1;
        });
        setLabel('Ta carte s’avance');

        // Acte 2 : l'ascension. Elle demarre pendant que les autres sortent,
        // les deux mouvements se recouvrent au lieu de se succeder. La carte
        // prend sa taille definitive a cet instant precis, avant de monter :
        // elle est donc nette pendant tout le trajet, pas seulement a
        // l'arrivee.
        later(() => {
          setAct('ascend');
          growHero(card);
        }, beat(ASCEND_AT));
        // Si le tirage traine, la carte reste en vol : rien ne se fige.
        later(() => {
          if (prize === null) setAct('hold');
        }, beat(HERO_SETTLED_AT));

        const startedAt = performance.now();

        try {
          const api = await import('./newsletterRewardClient');
          playId ||= api.createNewsletterPlayId();
          const result = await api.drawNewsletterReward({
            playId,
            cardIndex: Number(card.dataset.nlCard || 0),
          });
          if (disposed) return;
          prize = Number(result.percentage);

          const valueNode = card.querySelector('[data-nl-card-value]');

          // Acte 3 : la rotation, une fois la carte posee sur sa scene, quel
          // que soit le temps qu'a pris le tirage.
          const startFlip = () => {
            // Filet : si le tirage revient avant la fin de l'ascension, la
            // rotation ne doit pas demarrer sur une carte encore agrandie.
            crispenHero(card);
            // Le compteur part de zero : la face ne doit pas devoiler le
            // resultat final avant de l'avoir fait monter.
            if (valueNode) valueNode.textContent = '0';
            setAct('flip');
            card.dataset.nlCardFlipped = 'true';

            later(() => countUp(prize, valueNode), beat(VALUE_AT));
            later(() => celebrate(card, DUST_LEAD_FRAMES), beat(CELEBRATE_AT));
            later(revealPrize, beat(SETTLED_AT));
          };

          later(startFlip, beat(Math.max(0, HERO_SETTLED_AT - (performance.now() - startedAt))));
        } catch (error) {
          console.error('Newsletter draw failed:', error);
          rewind('Le tirage n’a pas abouti. Réessaie dans quelques instants.');
        }
      }, eventOptions);
    });

    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submit?.disabled || prize === null || !playId || isSubmitting) return;
      if (email && !email.checkValidity()) {
        email.reportValidity();
        return;
      }
      if (consent && !consent.checkValidity()) {
        consent.reportValidity();
        return;
      }

      clearError();
      isSubmitting = true;
      if (submit) submit.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Enregistrement...';
      try {
        const api = await import('./newsletterRewardClient');
        const result = await api.claimNewsletterReward({
          playId,
          email: email?.value || '',
          consent: consent?.checked === true,
        });
        if (disposed) return;
        const reward = result.reward || {};
        if (sentCode) sentCode.textContent = reward.code || '';
        if (sentText) {
          sentText.innerHTML = reward.emailStatus === 'sent'
            ? '<b>Enregistré dans ton espace client</b> et envoyé par e-mail. Connecte-toi avec cette adresse pour le retrouver.'
            : '<b>Enregistré dans ton espace client.</b> L’e-mail est momentanément retardé, mais ton code est déjà conservé.';
        }
        if (sent) sent.hidden = false;
        if (submitLabel) submitLabel.textContent = 'Code enregistré';
        email?.blur();
      } catch (error) {
        console.error('Newsletter claim failed:', error);
        if (submit) submit.disabled = false;
        if (submitLabel) submitLabel.textContent = `Recevoir mes ${prize}%`;
        showError('Ton code n’a pas pu être enregistré. Vérifie ton e-mail puis réessaie.');
      } finally {
        isSubmitting = false;
      }
    }, eventOptions);

    cleanups.push(() => {
      disposed = true;
      isSubmitting = false;
      playId = null;
      prize = null;
      eventController.abort();
      cancelPending();
      stopFx();
      if (measureFrame) window.cancelAnimationFrame(measureFrame);
      game.dataset.nlDealt = 'false';
      game.dataset.nlAct = 'idle';
      game.style.removeProperty('--hero-scale');
      game.style.removeProperty('--hero-lift');
      cards.forEach((card) => {
        card.disabled = false;
        releaseHero(card);
        delete card.dataset.nlCardState;
        delete card.dataset.nlCardFlipped;
        const value = card.querySelector('[data-nl-card-value]');
        if (value) value.textContent = '—';
      });
      tiers.forEach((tier) => {
        tier.dataset.nlTierState = 'idle';
      });
      if (promoCycle) delete promoCycle.dataset.nlPromoResult;
      if (won) won.hidden = true;
      if (sent) sent.hidden = true;
      clearError();
      if (submit) submit.disabled = true;
      if (gameLabel) delete gameLabel.dataset.nlLabelSwap;
      if (labelText) labelText.textContent = 'Choisis une carte';
    });
  });

  return () => cleanups.forEach((cleanup) => cleanup());
};

export default function GalleryFixedSectionsInteractions() {
  useEffect(() => {
    const cleanupBeforeAfter = setupBeforeAfter();
    setupInstagram();
    setupTestimonials();
    const cleanupNewsletterGame = setupNewsletterGame();
    const cleanupPrewarm = setupRichSectionsPrewarm();
    return () => {
      cleanupBeforeAfter();
      cleanupNewsletterGame();
      cleanupPrewarm();
    };
  }, []);

  return null;
}
