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
    let disposed = false;

    const getActiveFill = () => (
      buttons[activeIndex]?.querySelector('[data-hero-progress-fill]') || null
    );

    const getRemainingProgressMs = () => {
      const fill = getActiveFill();
      const animation = fill?.getAnimations?.()
        ?.find((entry) => entry.animationName === 'hero-segment-progress');
      const duration = Number(animation?.effect?.getTiming?.().duration) || HERO_DURATION;
      const currentTime = Number(animation?.currentTime) || 0;
      return Math.max(0, duration - currentTime);
    };

    const scheduleFallback = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setActive(activeIndex + 1), getRemainingProgressMs() + 80);
    };

    const setActive = (nextIndex) => {
      if (disposed) return;
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
      scheduleFallback();
    };

    const handleProgressEnd = (event) => {
      const button = event.target?.closest?.('[data-hero-step]');
      const index = buttons.indexOf(button);
      if (index === activeIndex) setActive(activeIndex + 1);
    };

    const clickHandlers = buttons.map((button, index) => {
      const handleClick = () => setActive(index);
      button.addEventListener('click', handleClick);
      return [button, handleClick];
    });

    buttons.forEach((button, index) => {
      if (button.getAttribute('aria-current') === 'true') activeIndex = index;
      button.querySelector('[data-hero-progress-fill]')?.addEventListener('animationend', handleProgressEnd);
    });

    scheduleFallback();

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      clickHandlers.forEach(([button, handleClick]) => button.removeEventListener('click', handleClick));
      buttons.forEach((button) => {
        button.querySelector('[data-hero-progress-fill]')?.removeEventListener('animationend', handleProgressEnd);
      });
    };
  }, []);

  return null;
}
