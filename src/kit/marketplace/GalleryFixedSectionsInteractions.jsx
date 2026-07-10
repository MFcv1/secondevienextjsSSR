'use client';

import { useEffect } from 'react';

const wrapIndex = (index, count) => (index + count) % count;

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
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let projectAnimations = [];

    if (section) {
      section.dataset.baMotionReady = 'true';
      if (reduceMotion || !('IntersectionObserver' in window)) {
        section.dataset.baRevealed = 'true';
      } else {
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
          [{ opacity: 0.74 }, { opacity: 1 }],
          { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        )),
        projectCopy?.animate(
          [
            { opacity: 0, transform: 'translateY(6px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        ),
        projectActions?.animate(
          [
            { opacity: 0.72, transform: 'translateX(4px)' },
            { opacity: 1, transform: 'translateX(0)' },
          ],
          { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
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
        beforeSource.removeAttribute('data-cold-scroll-deferred-source');
        beforeSource.removeAttribute('data-cold-scroll-deferred-srcset');
        beforeSource.setAttribute('srcset', project.avantAvif);
      }
      if (afterSource && project.apresAvif) {
        afterSource.removeAttribute('data-cold-scroll-deferred-source');
        afterSource.removeAttribute('data-cold-scroll-deferred-srcset');
        afterSource.setAttribute('srcset', project.apresAvif);
      }
      if (beforeImg) {
        beforeImg.removeAttribute('data-cold-scroll-deferred-image');
        beforeImg.removeAttribute('data-cold-scroll-deferred-src');
        beforeImg.src = project.avant;
      }
      if (afterImg) {
        afterImg.removeAttribute('data-cold-scroll-deferred-image');
        afterImg.removeAttribute('data-cold-scroll-deferred-src');
        afterImg.src = project.apres;
      }
      if (tag) tag.textContent = project.tag;
      if (title) title.textContent = project.title;
      if (desc) desc.textContent = project.desc;
      if (count) count.textContent = `0${activeIndex + 1} / 0${projects.length}`;
      animateProjectChange();
    };

    range?.addEventListener('input', (event) => setSlider(event.currentTarget.value));
    range?.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      range.focus({ preventScroll: true });
      range.setPointerCapture(event.pointerId);
      setSliderFromPointer(event);
    });
    range?.addEventListener('pointermove', (event) => {
      if (!range.hasPointerCapture(event.pointerId)) return;
      event.preventDefault();
      setSliderFromPointer(event);
    });
    range?.addEventListener('pointerup', (event) => {
      if (range.hasPointerCapture(event.pointerId)) range.releasePointerCapture(event.pointerId);
    });
    range?.addEventListener('pointercancel', (event) => {
      if (range.hasPointerCapture(event.pointerId)) range.releasePointerCapture(event.pointerId);
    });
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
      root.querySelectorAll('[data-insta-card]').forEach((card) => {
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
      autoplayTimer = undefined;
      preloadTimer = undefined;
      setProgressDots(root, '[data-insta-dot]', activeIndex);
    };

    const render = ({
      animateProgress = sectionVisible && !manuallyPaused,
      transitioning = false,
    } = {}) => {
      const visibleLayout = window.matchMedia('(min-width: 1024px)').matches ? 'desktop' : 'mobile';
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

    const scheduleAutoplay = ({ transitioning = false } = {}) => {
      window.clearTimeout(autoplayTimer);
      if (!sectionVisible || manuallyPaused) return;
      render({ animateProgress: true, transitioning });
      preloadTimer = window.setTimeout(() => {
        ensureVisibleWindow(wrapIndex(activeIndex + 1, items.length));
      }, Math.max(800, autoplayDelayMs - 1200));
      autoplayTimer = window.setTimeout(() => {
        activeIndex = wrapIndex(activeIndex + 1, items.length);
        scheduleAutoplay({ transitioning: true });
      }, autoplayDelayMs);
    };

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
          scheduleAutoplay();
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

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries.find((item) => item.target === root);
          sectionVisible = Boolean(entry?.isIntersecting);
          if (sectionVisible) {
            scheduleAutoplay();
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
      if (root.dataset.testimonialsPrepared === 'true') return;
      root.dataset.testimonialsPrepared = 'true';

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
      const verticalMargin = Math.max(640, mobileScrollRoot?.clientHeight || window.innerHeight || 0);
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        prepareRenderingLayers();

        const releaseObserver = new IntersectionObserver((visibleEntries) => {
          if (!visibleEntries.some((entry) => entry.isIntersecting)) return;
          releaseObserver.disconnect();
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
    render();
  });
};

export default function GalleryFixedSectionsInteractions() {
  useEffect(() => {
    setupBeforeAfter();
    setupInstagram();
    setupTestimonials();
  }, []);

  return null;
}
