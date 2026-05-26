'use client';

import { useEffect, useState } from 'react';
import ClientApp from './ClientApp';

const revealSelector = '.sv-home-section, .sv-home-reveal';

export default function HomeGalleryLauncher() {
  const [shouldMountGallery, setShouldMountGallery] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let frameId = 0;
    const nav = document.querySelector('.sv-home-nav');

    const setNavVisible = (visible) => {
      if (!nav) return;
      nav.style.transform = visible
        ? 'translate3d(-50%, 0, 0)'
        : 'translate3d(-50%, -120%, 0)';
      nav.style.transition = 'transform 640ms cubic-bezier(0.32,0.72,0,1)';
    };

    const onScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        const currentScrollY = window.scrollY;
        if (currentScrollY < 24 || currentScrollY < lastScrollY) {
          setNavVisible(true);
        } else if (currentScrollY > lastScrollY + 4) {
          setNavVisible(false);
        }
        lastScrollY = currentScrollY;
      });
    };

    const launchGallery = () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      setShouldMountGallery(true);
    };

    const buttons = Array.from(document.querySelectorAll('[data-gallery-launcher]'));
    buttons.forEach((button) => button.addEventListener('click', launchGallery));
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', onScroll);
      buttons.forEach((button) => button.removeEventListener('click', launchGallery));
    };
  }, []);

  useEffect(() => {
    const animatedNodes = [
      document.querySelector('.sv-home h1'),
      ...document.querySelectorAll(revealSelector),
    ].filter(Boolean);

    animatedNodes.forEach((node, index) => {
      node.style.transform = `translate3d(0, ${index === 0 ? 36 : 52}px, 0)`;
      node.style.transition = 'transform 900ms cubic-bezier(0.32,0.72,0,1)';
      node.style.transitionDelay = `${Math.min(index * 42, 180)}ms`;
    });

    const reveal = (node) => {
      node.style.transform = 'translate3d(0, 0, 0)';
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    animatedNodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  return shouldMountGallery ? (
    <div className="sv-gallery-launcher-overlay">
      <ClientApp />
    </div>
  ) : null;
}
