'use client';

import { useEffect } from 'react';

const HERO_DURATION = 5500;

export default function HeroMotionIsland() {
  useEffect(() => {
    const root = document.querySelector('[data-gallery-hero]');
    if (!root) return undefined;
    const slides = Array.from(root.querySelectorAll('[data-hero-slide]'));
    const buttons = Array.from(root.querySelectorAll('[data-hero-step]'));
    if (slides.length <= 1) return undefined;

    let activeIndex = 0;
    let timer = 0;

    const setActive = (nextIndex) => {
      activeIndex = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, index) => {
        slide.style.opacity = index === activeIndex ? '1' : '0';
        slide.setAttribute('aria-hidden', index === activeIndex ? 'false' : 'true');
      });
      buttons.forEach((button, index) => {
        const isActive = index === activeIndex;
        button.setAttribute('aria-current', isActive ? 'true' : 'false');
        const fill = button.querySelector('[data-hero-progress-fill]');
        if (fill) {
          fill.style.animation = 'none';
          fill.style.transform = isActive ? 'scaleX(0)' : 'scaleX(0)';
          if (isActive) {
            window.requestAnimationFrame(() => {
              fill.style.animation = `hero-segment-progress ${HERO_DURATION}ms linear forwards`;
            });
          }
        }
      });
    };

    const schedule = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => setActive(activeIndex + 1), HERO_DURATION);
    };

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => {
        setActive(index);
        schedule();
      });
    });

    setActive(0);
    schedule();

    return () => window.clearInterval(timer);
  }, []);

  return null;
}
