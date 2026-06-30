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
  progressDurationMs = 0,
  itemCount,
} = {}) => {
  root.querySelectorAll(selector).forEach((dot, index) => {
    const dotIndex = itemCount ? index % itemCount : index;
    const isActive = dotIndex === activeIndex;
    dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    dot.style.width = isActive ? activeWidth : inactiveWidth;
    const bar = dot.querySelector('[data-dot-bar]');
    if (bar) {
      dot.style.backgroundColor = inactiveColor;
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
    dot.style.backgroundColor = isActive ? color : inactiveColor;
  });
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
    const range = root.querySelector('[data-ba-range]');
    const beforeImg = root.querySelector('[data-ba-before-img]');
    const afterImg = root.querySelector('[data-ba-after-img]');
    const tag = root.querySelector('[data-ba-tag]');
    const title = root.querySelector('[data-ba-title]');
    const desc = root.querySelector('[data-ba-desc]');
    const count = root.querySelector('[data-ba-count]');

    const setSlider = (value) => {
      const percentage = `${value}%`;
      if (clip) clip.style.clipPath = `polygon(0 0, ${percentage} 0, ${percentage} 100%, 0 100%)`;
      if (line) line.style.left = percentage;
    };

    const setProject = (nextIndex) => {
      activeIndex = wrapIndex(nextIndex, projects.length);
      const project = projects[activeIndex];
      if (beforeImg) beforeImg.src = project.avant;
      if (afterImg) afterImg.src = project.apres;
      if (tag) tag.textContent = project.tag;
      if (title) title.textContent = project.title;
      if (desc) desc.textContent = project.desc;
      if (count) count.textContent = `0${activeIndex + 1} / 0${projects.length}`;
      if (range) range.value = '50';
      setSlider(50);
    };

    range?.addEventListener('input', (event) => setSlider(event.currentTarget.value));
    root.querySelector('[data-ba-prev]')?.addEventListener('click', () => setProject(activeIndex - 1));
    root.querySelector('[data-ba-next]')?.addEventListener('click', () => setProject(activeIndex + 1));
  });
};

const setupInstagram = () => {
  document.querySelectorAll('[data-instagram-carousel]').forEach((root) => {
    if (root.dataset.carouselReady === 'true') return;
    root.dataset.carouselReady = 'true';

    const items = parseItems(root);
    if (!items.length) return;
    const autoplayDelayMs = 4200;
    const resumeDelayMs = 6500;
    let activeIndex = 1 % items.length;
    let autoplayTimer;
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

    const getPosition = (index) => {
      const offset = (index - activeIndex + items.length) % items.length;
      if (offset === 0) return 'center';
      if (offset === 1) return 'right';
      if (offset === items.length - 1) return 'left';
      if (offset > items.length / 2) return 'farLeft';
      return 'farRight';
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
      autoplayTimer = undefined;
      setProgressDots(root, '[data-insta-dot]', activeIndex);
    };

    const render = ({ animateProgress = sectionVisible && !manuallyPaused } = {}) => {
      root.querySelectorAll('[data-insta-card]').forEach((card) => {
        applyPosition(card, card.dataset.instaLayout === 'desktop' ? desktopPositions : mobilePositions);
      });
      setProgressDots(root, '[data-insta-dot]', activeIndex, {
        progressDurationMs: animateProgress ? autoplayDelayMs : 0,
        itemCount: items.length,
      });
    };

    const scheduleAutoplay = () => {
      window.clearTimeout(autoplayTimer);
      if (!sectionVisible || manuallyPaused) return;
      render({ animateProgress: true });
      autoplayTimer = window.setTimeout(() => {
        activeIndex = wrapIndex(activeIndex + 1, items.length);
        scheduleAutoplay();
      }, autoplayDelayMs);
    };

    const goTo = (nextIndex, { manual = true } = {}) => {
      activeIndex = wrapIndex(nextIndex, items.length);
      if (manual) {
        manuallyPaused = true;
        window.clearTimeout(autoplayTimer);
        window.clearTimeout(resumeTimer);
        render({ animateProgress: false });
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

    const items = parseItems(root);
    if (!items.length) return;
    let activeIndex = 1 % items.length;

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

    const render = () => {
      root.querySelectorAll('[data-testimonial-card]').forEach((card) => {
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
        itemCount: items.length,
      });
    };

    root.querySelectorAll('[data-testimonial-prev]').forEach((button) => {
      button.addEventListener('click', () => {
        activeIndex = wrapIndex(activeIndex - 1, items.length);
        render();
      });
    });
    root.querySelectorAll('[data-testimonial-next]').forEach((button) => {
      button.addEventListener('click', () => {
        activeIndex = wrapIndex(activeIndex + 1, items.length);
        render();
      });
    });
    root.querySelectorAll('[data-testimonial-dot]').forEach((dot, index) => {
      dot.addEventListener('click', () => {
        activeIndex = index % items.length;
        render();
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
