'use client';

import { useEffect } from 'react';

/** Motion for Sv4HomeHero when embedded on /a-propos (reveals + hero video scrub). */
export default function AboutSv4HeroMotionIsland() {
  useEffect(() => {
    const root = document.querySelector('[data-about-sv4-hero]');
    if (!root) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealEls = root.querySelectorAll('.sv4-reveal');

    let io;
    if (revealEls.length) {
      if (reduced) {
        revealEls.forEach((el) => el.classList.add('sv4-revealed'));
      } else {
        io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('sv4-revealed');
                io.unobserve(entry.target);
              }
            });
          },
          { rootMargin: '0px 0px -6% 0px', threshold: 0.05 },
        );
        revealEls.forEach((el) => io.observe(el));
      }
    }

    let ctx;
    let cancelled = false;

    if (!reduced) {
      Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([gsapMod, stMod]) => {
        if (cancelled) return;
        const gsap = gsapMod.default || gsapMod.gsap;
        const ScrollTrigger = stMod.ScrollTrigger;
        const hero = root.querySelector('.sv4-hero');
        if (!gsap || !ScrollTrigger || !hero) return;

        gsap.registerPlugin(ScrollTrigger);
        ctx = gsap.context(() => {
          const activeVideo = hero.querySelector('.sv4-hero__video.is-active') || hero.querySelector('.sv4-hero__video');
          if (activeVideo) {
            gsap.fromTo(
              activeVideo,
              { scale: 1.06 },
              {
                scale: 1,
                ease: 'none',
                scrollTrigger: {
                  trigger: hero,
                  start: 'top top',
                  end: 'bottom top',
                  scrub: true,
                },
              },
            );
          }
        }, root);
      });
    }

    return () => {
      cancelled = true;
      io?.disconnect();
      ctx?.revert?.();
    };
  }, []);

  return null;
}