'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import './about-instagram-counter.css';

const DEFAULT_VALUE = '38.9';

function buildStrip(targetDigit) {
  const rows = [];
  const cycles = 4;
  for (let c = 0; c < cycles; c += 1) {
    for (let d = 0; d < 10; d += 1) {
      rows.push(d);
    }
  }
  rows.push(targetDigit);
  return rows;
}

function DigitReel({ digit, index }) {
  const strip = useMemo(() => buildStrip(digit), [digit]);

  return (
    <span
      className="about-ig-counter__reel"
      data-reel
      data-target={digit}
      data-reel-index={index}
      aria-hidden="true"
    >
      <span className="about-ig-counter__strip">
        {strip.map((value, i) => (
          <span className="about-ig-counter__cell" key={`${digit}-${i}`}>
            {value}
          </span>
        ))}
      </span>
    </span>
  );
}

export default function AboutInstagramCounterIsland({ value = DEFAULT_VALUE }) {
  const rootRef = useRef(null);

  const settleReels = (root, animateFromZero = false) => {
    const reels = Array.from(root.querySelectorAll('[data-reel]'));
    reels.forEach((reel) => {
      const strip = reel.querySelector('.about-ig-counter__strip');
      const cells = reel.querySelectorAll('.about-ig-counter__cell');
      const cellHeight = cells[0]?.offsetHeight || 0;
      if (!strip || !cellHeight) return;
      const finalIndex = cells.length - 1;
      const y = -finalIndex * cellHeight;
      strip.style.transform = animateFromZero ? 'translateY(0px)' : `translateY(${y}px)`;
    });
  };

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    settleReels(root, false);
    root.dataset.ready = 'true';

    let cancelled = false;
    let ctx = null;

    async function run() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const [gsapModule, scrollTriggerModule] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);

      if (cancelled) return;

      const gsap = gsapModule.gsap || gsapModule.default;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger || scrollTriggerModule.default;
      const section = root.closest('.about-instagram');

      if (!gsap || !ScrollTrigger || !section) return;

      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const reels = Array.from(root.querySelectorAll('[data-reel]'));

        const play = () => {
          if (root.dataset.animated === 'true') return;
          root.dataset.animated = 'true';

          settleReels(root, true);

          reels.forEach((reel, i) => {
            const strip = reel.querySelector('.about-ig-counter__strip');
            const cells = reel.querySelectorAll('.about-ig-counter__cell');
            const cellHeight = cells[0]?.offsetHeight || 0;
            if (!strip || !cellHeight) return;

            const finalIndex = cells.length - 1;
            const jitter = gsap.utils.random(-cellHeight * 0.28, cellHeight * 0.28);

            gsap
              .timeline({ delay: i * 0.16 })
              .to(strip, {
                y: -finalIndex * cellHeight + jitter,
                duration: gsap.utils.random(1.45, 2.05),
                ease: 'power2.in',
              })
              .to(strip, {
                y: -finalIndex * cellHeight,
                duration: 0.62,
                ease: 'bounce.out',
              });
          });
        };

        ScrollTrigger.create({
          trigger: section,
          start: 'top 72%',
          once: true,
          onEnter: play,
        });

        ScrollTrigger.refresh();
      }, root);
    }

    run();

    return () => {
      cancelled = true;
      ctx?.revert?.();
    };
  }, [value]);

  const chars = value.split('');

  return (
    <div
      ref={rootRef}
      className="about-ig-counter relative -top-4 flex items-end font-serif text-6xl leading-none tracking-tighter text-[#F9F6F0] md:text-[6.5rem]"
      aria-label={`${value} milliers d'abonnés Instagram`}
    >
      <span className="about-ig-counter__value flex items-end">
        {chars.map((char, index) => {
          if (char === '.') {
            return (
              <span className="about-ig-counter__dot" key={`dot-${index}`}>
                .
              </span>
            );
          }
          const digit = Number(char);
          if (Number.isNaN(digit)) return null;
          return <DigitReel key={`d-${index}`} digit={digit} index={index} />;
        })}
      </span>
      <span className="mb-1 ml-1 font-serif text-3xl lowercase italic tracking-normal text-[#A68A64] md:mb-2 md:text-5xl">
        k
      </span>
    </div>
  );
}