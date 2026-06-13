'use client';

import { useEffect, useState } from 'react';

const revealSelector = '.sv-home-reveal, .sv-home-animate > *';

export default function HomeMotionIsland() {
  const [showBackToTop, setShowBackToTop] = useState(false);

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
        setShowBackToTop(currentScrollY > 520);
        if (currentScrollY < 24 || currentScrollY < lastScrollY) {
          setNavVisible(true);
        } else if (currentScrollY > lastScrollY + 4) {
          setNavVisible(false);
        }
        lastScrollY = currentScrollY;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    setShowBackToTop(window.scrollY > 520);
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', onScroll);
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

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.style.transform = 'translate3d(0, 0, 0)';
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    animatedNodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let ctx;
    let cancelled = false;
    const idleId = window.requestIdleCallback
      ? window.requestIdleCallback(startMotion, { timeout: 1600 })
      : window.setTimeout(startMotion, 900);

    function startMotion() {
      Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]).then(([gsapModule, scrollTriggerModule]) => {
        if (cancelled) return;
        const gsap = gsapModule.default || gsapModule.gsap;
        const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
        if (!gsap || !ScrollTrigger || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        gsap.registerPlugin(ScrollTrigger);
        ctx = gsap.context(() => {
          gsap.utils.toArray('.sv-category-card, .sv-product-card, .sv-location-card, .sv-route-visual, .sv-faq-list details').forEach((node, index) => {
            gsap.fromTo(node,
              { autoAlpha: 0.72, y: 34, scale: 0.965 },
              {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                duration: 0.9,
                ease: 'power3.out',
                delay: Math.min(index * 0.025, 0.18),
                scrollTrigger: {
                  trigger: node,
                  start: 'top 88%',
                  once: true,
                },
              }
            );
          });

          gsap.utils.toArray('.sv-route-visual img, .sv-product-card__media img').forEach((image) => {
            gsap.fromTo(image,
              { scale: 1.035 },
              {
                scale: 1,
                ease: 'none',
                scrollTrigger: {
                  trigger: image,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 0.6,
                },
              }
            );
          });
        });
      }).catch(() => {});
    }

    return () => {
      cancelled = true;
      if (window.cancelIdleCallback && typeof idleId === 'number') window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
      ctx?.revert();
    };
  }, []);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      aria-label="Retour en haut"
      className="sv-home-back-to-top"
      data-visible={showBackToTop ? 'true' : 'false'}
      onClick={handleBackToTop}
    >
      <span className="sv-home-back-to-top__core" aria-hidden="true">
        <span className="sv-home-back-to-top__chevron" />
      </span>
    </button>
  );
}
