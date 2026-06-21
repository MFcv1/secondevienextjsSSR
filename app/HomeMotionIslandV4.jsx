'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * HomeMotionIslandV4 — Motion-first client island
 * 
 * Skills applied: gpt-taste (GSAP pinning + scrub), motion (choreography map),
 * frontsymmetry (pixel-perfect positioning guards)
 *
 * Choreography map:
 *  - Hero: word rise via CSS @keyframes (no JS needed)
 *  - Hero bg: GSAP scale scrub 1.06 → 1
 *  - Marquee: CSS infinite scroll
 *  - Pinned narrative: GSAP ScrollTrigger pin + panel crossfade
 *  - Scrubbing text: GSAP word-by-word opacity scrub
 *  - Products/trust/reviews: IO reveal
 *  - Nav: hide/show on scroll
 *  - Back to top: scroll threshold
 */
export default function HomeMotionIslandV4() {
  const [showBtt, setShowBtt] = useState(false);

  /* ─── Nav auto-hide + back-to-top ─── */
  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;
    const nav = document.querySelector('.sv4-nav');

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        setShowBtt(y > 500);
        if (nav) {
          if (y < 60 || y < lastY) {
            nav.style.transform = 'translateY(0)';
          } else if (y > lastY + 6) {
            nav.style.transform = 'translateY(-110%)';
          }
        }
        lastY = y;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  /* ─── IntersectionObserver scroll reveals ─── */
  useEffect(() => {
    const els = document.querySelectorAll('.sv4-reveal');
    if (!els.length) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      els.forEach((el) => el.classList.add('sv4-revealed'));
      return;
    }

    const io = new IntersectionObserver(
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

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* ─── GSAP: Pinned narrative + scrub text + hero bg ─── */
  useEffect(() => {
    let ctx;
    let cancelled = false;

    const timer = setTimeout(() => {
      if (cancelled) return;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) return;

      Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
        .then(([gsapMod, stMod]) => {
          if (cancelled) return;
          const gsap = gsapMod.default || gsapMod.gsap;
          const ScrollTrigger = stMod.ScrollTrigger;
          if (!gsap || !ScrollTrigger) return;

          gsap.registerPlugin(ScrollTrigger);

          ctx = gsap.context(() => {
            /* Hero background image parallax scale */
            const heroBg = document.querySelector('.sv4-hero__bg img');
            if (heroBg) {
              gsap.fromTo(heroBg,
                { scale: 1.06 },
                {
                  scale: 1,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: '.sv4-hero',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true,
                  },
                },
              );
            }

            /* Product images subtle parallax */
            gsap.utils.toArray('.sv4-product__media img').forEach((img) => {
              gsap.fromTo(img,
                { scale: 1.08 },
                {
                  scale: 1,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: img,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                  },
                },
              );
            });

            /* Pinned scroll narrative (desktop only) */
            const mm = gsap.matchMedia();
            mm.add('(min-width: 900px)', () => {
              const pinRoot = document.querySelector('.sv4-pinned');
              if (!pinRoot) return;

              const panels = gsap.utils.toArray('[data-panel]');
              const images = gsap.utils.toArray('[data-panel-image]');
              if (panels.length < 2 || images.length < 2) return;

              gsap.set(panels.slice(1), { autoAlpha: 0, y: 32 });
              gsap.set(images.slice(1), { autoAlpha: 0, scale: 1.04 });

              const tl = gsap.timeline({
                scrollTrigger: {
                  trigger: pinRoot,
                  start: 'top top',
                  end: () => `+=${panels.length * window.innerHeight * 1.2}`, // Give a bit more scroll space for smoothness
                  scrub: 1.2, // Smoother scrub
                  pin: true,
                  anticipatePin: 1,
                },
              });

              panels.forEach((panel, i) => {
                if (i === 0) return;
                
                // Add overlapping crossfades with power2 easing for maximum elegance
                tl.to(panels[i - 1], { autoAlpha: 0, y: -24, duration: 0.5, ease: "power2.inOut" }, i)
                  .to(images[i - 1], { autoAlpha: 0, scale: 0.98, duration: 0.5, ease: "power2.inOut" }, i)
                  .to(panel, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, i + 0.3)
                  .to(images[i], { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power2.out" }, i + 0.3);
              });
            });

            /* Scrubbing text word-by-word opacity */
            const scrubWords = gsap.utils.toArray('.sv4-scrub-word');
            if (scrubWords.length) {
              gsap.to(scrubWords, {
                opacity: 1,
                stagger: 0.06,
                ease: 'none',
                scrollTrigger: {
                  trigger: '.sv4-scrub-section',
                  start: 'top 75%',
                  end: 'bottom 40%',
                  scrub: true,
                },
              });
            }

            /* Trust pillars staggered entry */
            const trustItems = gsap.utils.toArray('.sv4-trust__item');
            if (trustItems.length) {
              gsap.from(trustItems, {
                y: 32,
                opacity: 0,
                duration: 0.7,
                stagger: 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: '.sv4-trust',
                  start: 'top 82%',
                  once: true,
                },
              });
            }
          });
        })
        .catch(() => {});
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      ctx?.revert();
    };
  }, []);

  const handleBtt = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      type="button"
      aria-label="Retourner en haut"
      className="sv4-btt"
      data-visible={showBtt ? 'true' : 'false'}
      onClick={handleBtt}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    </button>
  );
}
