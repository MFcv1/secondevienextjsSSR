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
} = {}) => {
  root.querySelectorAll(selector).forEach((dot, index) => {
    const isActive = index === activeIndex;
    dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    const bar = dot.querySelector('[data-dot-bar]');
    if (bar) {
      bar.style.transform = isActive ? 'scaleX(1)' : 'scaleX(0)';
      return;
    }
    dot.style.width = isActive ? activeWidth : inactiveWidth;
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
    let activeIndex = 1 % items.length;

    const setCard = (card, itemIndex) => {
      const item = items[wrapIndex(itemIndex, items.length)];
      const img = card.querySelector('[data-insta-img]');
      const label = card.querySelector('[data-insta-label]');
      const title = card.querySelector('[data-insta-title]');
      if (img) img.src = item.img;
      if (label) label.textContent = item.label;
      if (title) title.textContent = item.title;
    };

    const render = () => {
      root.querySelectorAll('[data-insta-card]').forEach((card) => {
        const slot = Number(card.dataset.instaCard || 0);
        setCard(card, activeIndex + slot - 1);
      });
      setProgressDots(root, '[data-insta-dot]', activeIndex);
    };

    root.querySelectorAll('[data-insta-prev]').forEach((button) => {
      button.addEventListener('click', () => {
        activeIndex = wrapIndex(activeIndex - 1, items.length);
        render();
      });
    });
    root.querySelectorAll('[data-insta-next]').forEach((button) => {
      button.addEventListener('click', () => {
        activeIndex = wrapIndex(activeIndex + 1, items.length);
        render();
      });
    });
    root.querySelectorAll('[data-insta-dot]').forEach((dot, index) => {
      dot.addEventListener('click', () => {
        activeIndex = index;
        render();
      });
    });
    render();
  });
};

const setupTestimonials = () => {
  document.querySelectorAll('[data-testimonials-carousel]').forEach((root) => {
    if (root.dataset.carouselReady === 'true') return;
    root.dataset.carouselReady = 'true';

    const items = parseItems(root);
    if (!items.length) return;
    let activeIndex = 1 % items.length;

    const setCard = (card, itemIndex) => {
      const item = items[wrapIndex(itemIndex, items.length)];
      card.style.setProperty('--testimonial-card-bg', item.color);
      const text = card.querySelector('[data-testimonial-text]');
      const author = card.querySelector('[data-testimonial-author]');
      if (text) text.textContent = `"${item.text}"`;
      if (author) author.textContent = item.author;
    };

    const render = () => {
      root.querySelectorAll('[data-testimonial-card]').forEach((card) => {
        const slot = Number(card.dataset.testimonialCard || 0);
        setCard(card, activeIndex + slot - 1);
      });
      root.querySelectorAll('[data-testimonial-count]').forEach((count) => {
        count.textContent = String(activeIndex + 1).padStart(2, '0');
      });
      setProgressDots(root, '[data-testimonial-dot]', activeIndex, {
        color: '#ff9200',
        inactiveColor: 'rgba(214,204,191,1)',
        activeWidth: '1.75rem',
        inactiveWidth: '0.375rem',
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
        activeIndex = index;
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
