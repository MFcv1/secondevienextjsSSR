'use client';

import { useLayoutEffect } from 'react';

const select = (root, selector) => root?.querySelector(selector) || null;
const selectAll = (root, selector) => Array.from(root?.querySelectorAll(selector) || []);

export default function AboutMotionIsland() {
  useLayoutEffect(() => {
    let cancelled = false;
    let ctx = null;
    const splitInstances = [];

    const cleanupSplits = () => {
      while (splitInstances.length) {
        const split = splitInstances.pop();
        try {
          split?.revert?.();
        } catch {
          // SplitType cleanup is best-effort because the page remains readable without it.
        }
      }
    };

    const registerSplit = (split) => {
      splitInstances.push(split);
      return split;
    };

    async function setupMotion() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const [gsapModule, scrollTriggerModule, splitTypeModule] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('split-type'),
      ]);

      if (cancelled) return;

      const gsap = gsapModule.gsap || gsapModule.default;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger || scrollTriggerModule.default;
      const SplitType = splitTypeModule.default || splitTypeModule;
      const root = document.querySelector('[data-about-native="true"]');

      if (!gsap || !ScrollTrigger || !SplitType || !root) return;

      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        animateArch(gsap, ScrollTrigger, SplitType, registerSplit, root);
        animateShowcase(gsap, root);
        animateBeforeAfter(gsap, root);
        animateTransitionToServices(gsap, ScrollTrigger, SplitType, registerSplit, root);
        animateServices(gsap, SplitType, registerSplit, root);
        animateInterlude(gsap, root);
        animateInstagramDomeParallax(gsap, ScrollTrigger, root);
        animateFaqDepth(gsap, ScrollTrigger, root);
        animateSimpleReveals(gsap, root);
        animateInstagramCounter(gsap, ScrollTrigger, root);

        window.setTimeout(() => ScrollTrigger.refresh(), 450);
      }, root);
    }

    setupMotion();

    return () => {
      cancelled = true;
      ctx?.revert?.();
      cleanupSplits();
    };
  }, []);

  return null;
}

function animateArch(gsap, ScrollTrigger, SplitType, registerSplit, root) {
  const section = select(root, '.about-arch-section');
  const pinContainer = select(section, '.arch-pin-container');
  const wrapper = select(section, '.arch-wrapper');
  if (!section || !pinContainer || !wrapper) return;

  const introText = select(section, '.arch-intro-text-element');
  const mm = gsap.matchMedia();

  const buildTimeline = ({ end, roundOuter, roundInner, startInset, introMobile = false }) => {
    const startClipInner = `inset(15vh ${startInset} 0vh ${startInset} round ${roundInner} ${roundInner} 0px 0px)`;
    const endClip = 'inset(0vh 0vw 0vh 0vw round 0vw 0vw 0px 0px)';

    gsap.set(select(section, '.arch-mask-border'), {
      top: '14.8vh',
      bottom: '0vh',
      left: startInset === '10vw' ? '9.5vw' : '29.8vw',
      right: startInset === '10vw' ? '9.5vw' : '29.8vw',
      borderTopLeftRadius: roundOuter,
      borderTopRightRadius: roundOuter,
      border: '2px solid #A68A64',
      borderBottom: 'none',
      clipPath: 'inset(100% 0 0 0)',
    });

    gsap.set(select(section, '.arch-mask-container'), { clipPath: startClipInner, y: '0vh', opacity: 0 });
    gsap.set(select(section, '.arch-image'), { opacity: 0, scale: 1.4, filter: 'blur(15px)' });
    gsap.set(selectAll(section, '.arch-art-print'), { opacity: 0, y: 30, scale: 0.96 });
    gsap.set(select(section, '.arch-inner-frame'), { opacity: 0, scale: 0.95 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pinContainer,
        start: 'top top',
        end,
        pin: wrapper,
        scrub: 1,
      },
    });

    if (introText) {
      const split = registerSplit(new SplitType(introText, { types: 'words' }));
      gsap.set(introText, { autoAlpha: 1, perspective: introMobile ? 800 : 1000 });
      gsap.set(split.words, {
        opacity: 0,
        y: introMobile ? 60 : 120,
        rotateX: introMobile ? 0 : -90,
        filter: introMobile ? 'blur(12px)' : 'blur(20px)',
        willChange: 'transform, opacity, filter',
      });
      if (!introMobile) {
        gsap.set(split.words, {
          transformPerspective: 800,
          transformOrigin: 'bottom center',
        });
      }
      tl.to(split.words, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        filter: 'blur(0px)',
        duration: introMobile ? 2.5 : 3,
        stagger: introMobile ? 0.9 : 1.2,
        ease: 'power2.out',
      }, 1.5);
      tl.to(introText, {
        scale: introMobile ? 1.4 : 1.5,
        opacity: 0,
        filter: 'blur(20px)',
        duration: introMobile ? 2 : 3,
        ease: 'power2.inOut',
      }, introMobile ? 7 : 9.5);
    }

    const maskStart = introMobile ? 7.5 : 10.5;
    const imageStart = introMobile ? 9.5 : 12.5;
    const wordsStart = introMobile ? 13 : 17;
    const expandStart = introMobile ? 17 : 23;
    const d = introMobile ? 7 : 10;

    tl.to(selectAll(section, '.arch-art-print'), {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: introMobile ? 1.5 : 2,
      ease: 'power2.out',
      stagger: introMobile ? 0.5 : 0.6,
    }, 0);


    tl.to(selectAll(section, '.arch-art-print'), {
      opacity: 0,
      y: -20,
      scale: 0.95,
      duration: introMobile ? 1.5 : 2,
      ease: 'power2.inOut',
    }, introMobile ? 7 : 9.5);
    tl.to(select(section, '.arch-mask-container'), { opacity: 1, duration: introMobile ? 1.5 : 2, ease: 'power2.inOut' }, maskStart);
    tl.to(select(section, '.arch-mask-border'), { clipPath: 'inset(0% 0 0 0)', duration: introMobile ? 3 : 4, ease: 'none' }, maskStart);
    tl.to(select(section, '.arch-image'), { opacity: 1, scale: 1, filter: 'blur(0px)', duration: introMobile ? 4 : 6, ease: 'power2.out' }, imageStart);
    tl.fromTo(selectAll(section, '.arch-entry-word'),
      { y: '120%', rotationZ: 5, opacity: 0, filter: 'blur(10px)' },
      { y: '0%', rotationZ: 0, opacity: 1, filter: 'blur(0px)', stagger: introMobile ? 0.8 : 1, ease: 'power3.out', duration: introMobile ? 3 : 4 },
      wordsStart
    );
    tl.fromTo(select(section, '.arch-grid'), { scale: 1, opacity: 0.05 }, { scale: 1.1, opacity: 0, duration: d, ease: 'power2.inOut' }, expandStart);
    tl.fromTo(selectAll(section, '.arch-ui-marker'), { opacity: 1, y: 0 }, { opacity: 0, y: -20, duration: d * 0.5, stagger: d * 0.1, ease: 'power2.inOut' }, expandStart);
    tl.to(select(section, '.arch-mask-border'), { opacity: 0, duration: d * 0.5, ease: 'power2.inOut' }, expandStart);
    tl.fromTo(select(section, '.arch-mask-container'), { clipPath: startClipInner }, { clipPath: endClip, duration: d, ease: 'power2.inOut' }, expandStart);
    tl.to(select(section, '.arch-entry-header'), { opacity: 0, scale: 1.05, filter: 'blur(12px)', duration: d * 0.5, ease: 'power2.inOut' }, expandStart);
    tl.fromTo(select(section, '.arch-overlay'), { opacity: 0.1 }, { opacity: 0.45, duration: d, ease: 'power2.inOut' }, expandStart);
    tl.fromTo(select(section, '.arch-inner-frame'), { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: d * 0.8, ease: 'power2.out' }, expandStart + d * 0.4);
    tl.fromTo(selectAll(section, '.arch-text-reveal'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: d * 0.8, stagger: d * 0.15, ease: 'power4.out' }, expandStart + d * 0.5);
  };

  mm.add('(max-width: 767px)', () => buildTimeline({ end: '+=350%', roundOuter: '40.3vw', roundInner: '40vw', startInset: '10vw', introMobile: true }));
  mm.add('(min-width: 768px) and (max-width: 1023px)', () => buildTimeline({ end: '+=450%', roundOuter: '20.2vw', roundInner: '20vw', startInset: '30vw' }));
  mm.add('(min-width: 1024px)', () => buildTimeline({ end: '+=600%', roundOuter: '20.2vw', roundInner: '20vw', startInset: '30vw' }));
}

function animateShowcase(gsap, root) {
  selectAll(root, '.showcase-row').forEach((row) => {
    const imgContainer = select(row, '.showcase-img-container');
    const img = select(row, 'img');
    const textElements = selectAll(row, '.showcase-reveal-item');
    const isReversed = row.classList.contains('md:flex-row-reverse');

    gsap.matchMedia().add('(max-width: 767px)', () => {
      gsap.fromTo(imgContainer,
        { y: 80, scale: 0.95, opacity: 0, filter: 'blur(12px)', willChange: 'filter, transform' },
        { y: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: row, start: 'top 88%' } }
      );
      gsap.set(img, { scale: 1 });
      gsap.fromTo(textElements,
        { yPercent: 80, scale: 0.96, opacity: 0 },
        { yPercent: 0, scale: 1, opacity: 1, duration: 1, stagger: 0.07, ease: 'power3.out', scrollTrigger: { trigger: row, start: 'top 85%' } }
      );
    });

    gsap.matchMedia().add('(min-width: 768px)', () => {
      gsap.fromTo(imgContainer,
        { y: 150, rotateZ: isReversed ? -3 : 3, scale: 0.9, opacity: 0, filter: 'blur(20px)', willChange: 'filter, transform' },
        { y: 0, rotateZ: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1.8, ease: 'power4.out', scrollTrigger: { trigger: row, start: 'top 85%' } }
      );
      gsap.set(img, { scale: 1 });
      gsap.fromTo(textElements,
        { yPercent: 120, rotateZ: 4, scale: 0.9, opacity: 0 },
        { yPercent: 0, rotateZ: 0, scale: 1, opacity: 1, duration: 1.1, stagger: 0.08, ease: 'power4.out', scrollTrigger: { trigger: row, start: 'top 82%' } }
      );
    });
  });
}

function animateBeforeAfter(gsap, root) {
  const section = select(root, '.about-before-after');
  if (!section) return;

  const card = select(section, '.about-before-card');
  const titleLines = selectAll(section, '.about-before-title-line');
  const textItems = selectAll(section, '.about-before-kicker, .about-before-copy, .about-before-project');
  const visual = select(section, '.about-before-visual');

  gsap.fromTo(card,
    {
      clipPath: 'inset(12% 12% 12% 12% round 3rem)',
      scale: 0.95,
      filter: 'blur(10px)',
      transformOrigin: 'center center',
    },
    {
      clipPath: 'inset(0% 0% 0% 0% round 2.5rem)',
      scale: 1,
      filter: 'blur(0px)',
      duration: 1.65,
      ease: 'power3.inOut',
      scrollTrigger: {
        trigger: section,
        start: 'top 84%',
      },
    }
  );

  gsap.fromTo(titleLines,
    { yPercent: 120, opacity: 0, filter: 'blur(10px)' },
    {
      yPercent: 0,
      opacity: 1,
      filter: 'blur(0px)',
      duration: 1.05,
      stagger: 0.12,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 66%',
      },
    }
  );

  gsap.fromTo(textItems,
    { y: 26, opacity: 0, filter: 'blur(8px)' },
    {
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      duration: 0.9,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 64%',
      },
    }
  );

  gsap.fromTo(visual,
    { scale: 1.035, filter: 'blur(8px)', transformOrigin: 'center center' },
    {
      scale: 1,
      filter: 'blur(0px)',
      duration: 1.55,
      ease: 'power3.inOut',
      scrollTrigger: {
        trigger: section,
        start: 'top 82%',
      },
    }
  );
}

function animateTransitionToServices(gsap, ScrollTrigger, SplitType, registerSplit, root) {
  const section = select(root, '.about-transition-services');
  if (!section) return;

  const seal = select(section, '.about-service-seal');
  const step1 = select(section, '.about-transition-step-1');
  const title = select(section, '.about-transition-title');
  const step2 = select(section, '.about-transition-step-2');
  const quote = select(step2, 'p');
  const step3 = select(section, '.about-transition-step-3');
  if (!step1 || !title || !step2 || !quote || !step3) return;

  gsap.to(seal, { rotateZ: 360, duration: 60, ease: 'none', repeat: -1 });

  const splitTitle = registerSplit(new SplitType(title, { types: 'chars' }));
  const splitQuote = registerSplit(new SplitType(quote, { types: 'words' }));
  const mm = gsap.matchMedia();

  const build = ({ end, mobile = false }) => {
    gsap.set(splitTitle.chars, mobile
      ? { opacity: 0, y: 80, filter: 'blur(8px)' }
      : { opacity: 0, y: 150, rotateX: -90, transformPerspective: 800 });
    gsap.set(splitQuote.words, { opacity: 0, y: 30, filter: 'blur(10px)' });
    gsap.set(step3, { opacity: 0, scale: mobile ? 0.85 : 0.8, filter: 'blur(20px)' });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end,
        pin: true,
        scrub: 1.5,
      },
    });

    tl.to(splitTitle.chars, {
      opacity: 1,
      y: 0,
      rotateX: 0,
      filter: 'blur(0px)',
      stagger: mobile ? 0.06 : 0.1,
      duration: mobile ? 1.5 : 2,
      ease: 'power2.out',
    })
      .to({}, { duration: mobile ? 0.8 : 1 })
      .to(step1, { scale: mobile ? 1.3 : 1.5, opacity: 0, filter: 'blur(20px)', duration: mobile ? 1.5 : 2, ease: 'power2.in' })
      .set(step2, { opacity: 1 })
      .to(splitQuote.words, { opacity: 1, y: 0, filter: 'blur(0px)', stagger: mobile ? 0.04 : 0.05, duration: mobile ? 1.5 : 2, ease: 'power2.out' }, '-=0.5')
      .to({}, { duration: mobile ? 0.8 : 1 })
      .to(step2, { y: mobile ? -80 : -100, opacity: 0, filter: 'blur(10px)', duration: mobile ? 1.5 : 2, ease: 'power2.in' })
      .to(step3, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: mobile ? 1.5 : 2, ease: 'power2.out' }, '-=0.5')
      .to({}, { duration: mobile ? 1 : 1.5 })
      .to(step3, { opacity: 0, duration: mobile ? 0.8 : 1 });
  };

  mm.add('(max-width: 767px)', () => build({ end: '+=250%', mobile: true }));
  mm.add('(min-width: 768px) and (max-width: 1023px)', () => build({ end: '+=300%' }));
  mm.add('(min-width: 1024px)', () => build({ end: '+=400%' }));
}

function animateServices(gsap, SplitType, registerSplit, root) {
  const title = select(root, '.about-services-title');
  const section = title?.closest('section');
  if (!title || !section) return;

  const split = registerSplit(new SplitType(title, { types: 'lines, words' }));
  split.lines.forEach((line) => {
    const wrap = document.createElement('div');
    wrap.style.overflow = 'hidden';
    wrap.style.paddingTop = '15px';
    wrap.style.paddingBottom = '15px';
    wrap.style.marginTop = '-15px';
    wrap.style.marginBottom = '-15px';
    line.parentNode.insertBefore(wrap, line);
    wrap.appendChild(line);
  });

  gsap.from(split.words, {
    yPercent: 120,
    rotateZ: 4,
    filter: 'blur(12px)',
    opacity: 0,
    duration: 1.8,
    stagger: 0.08,
    ease: 'power4.out',
    scrollTrigger: {
      trigger: section,
      start: 'top 70%',
    },
  });

  gsap.from(select(section, '.sur-titre-service'), {
    letterSpacing: '0.5em',
    opacity: 0,
    duration: 2,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: section,
      start: 'top 75%',
    },
  });

  gsap.from(select(root, '.about-services-copy'), {
    y: 28,
    opacity: 0,
    filter: 'blur(8px)',
    duration: 1.1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: section,
      start: 'top 68%',
    },
  });

  gsap.fromTo(selectAll(root, '.about-service-card'),
    { y: 50, filter: 'blur(5px)' },
    {
      y: 0,
      filter: 'blur(0px)',
      duration: 1,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 82%',
      },
    }
  );
}

function animateInterlude(gsap, root) {
  const section = select(root, '.about-interlude');
  if (!section) return;

  gsap.to(select(section, '.about-marquee-scroll-1'), {
    xPercent: -8,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
    },
  });

  gsap.to(select(section, '.about-marquee-scroll-2'), {
    xPercent: 8,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
    },
  });

  gsap.to(select(section, '.about-marquee-track-1'), {
    xPercent: -25,
    duration: 32,
    repeat: -1,
    ease: 'none',
  });

  gsap.fromTo(select(section, '.about-marquee-track-2'),
    { xPercent: -25 },
    { xPercent: 0, duration: 38, repeat: -1, ease: 'none' }
  );
}

function animateInstagramDomeParallax(gsap, ScrollTrigger, root) {
  const section = select(root, '.about-instagram');
  const content = select(section, '.about-instagram-content');
  if (!section || !content) return;

  const mm = gsap.matchMedia();

  const buildDome = ({ radius, contentY, mobile = false }) => {
    gsap.fromTo(section,
      { borderRadius: `50% 50% 0 0 / ${radius} ${radius} 0 0` },
      {
        borderRadius: '0% 0% 0 0 / 0vh 0vh 0 0',
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'top 10%',
          scrub: 1.5,
        },
      }
    );

    gsap.fromTo(content,
      { y: contentY, opacity: 0, filter: 'blur(8px)' },
      {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          end: 'top 25%',
          scrub: 1,
        },
      }
    );

    if (mobile) {
      selectAll(section, '.about-instagram-card-image').forEach((img) => {
        gsap.set(img, { yPercent: 0, scale: 1.05 });
      });
      return;
    }

    selectAll(section, '.about-instagram-card').forEach((card) => {
      const img = select(card, '.about-instagram-card-image');
      if (!img) return;
      gsap.fromTo(img,
        { yPercent: -15 },
        {
          yPercent: 15,
          ease: 'none',
          scrollTrigger: {
            trigger: card,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    });
  };

  mm.add('(max-width: 767px)', () => buildDome({ radius: '30vh', contentY: 60, mobile: true }));
  mm.add('(min-width: 768px)', () => buildDome({ radius: '40vh', contentY: 80 }));
}

function animateFaqDepth(gsap, ScrollTrigger, root) {
  const section = select(root, '.about-faq');
  const content = section?.firstElementChild;
  const nextSection = section?.nextElementSibling;
  if (!section || !content || !nextSection) return;

  const mm = gsap.matchMedia();

  mm.add('(max-width: 767px)', () => {
    gsap.to(content, {
      opacity: 0.3,
      ease: 'none',
      scrollTrigger: {
        trigger: nextSection,
        start: 'top bottom',
        end: 'top top',
        scrub: true,
      },
    });
  });

  mm.add('(min-width: 768px)', () => {
    gsap.to(content, {
      scale: 0.9,
      opacity: 0.3,
      y: 100,
      ease: 'none',
      scrollTrigger: {
        trigger: nextSection,
        start: 'top bottom',
        end: 'top top',
        scrub: true,
      },
    });
  });
}

function animateInstagramCounter(_gsap, ScrollTrigger, root) {
  const counter = select(root, '.about-ig-counter');
  const valueEl = select(counter, '.about-ig-counter__value');
  if (!counter || !valueEl) return;

  const TARGET = 38.9;
  let intervalId = null;

  const runCasino = () => {
    if (counter.dataset.animated === 'true') return;
    counter.dataset.animated = 'true';
    window.clearInterval(intervalId);

    const duration = 2.4;
    const fps = 30;
    const totalFrames = Math.round(duration * fps);
    let currentFrame = 0;

    valueEl.textContent = '0.0';

    intervalId = window.setInterval(() => {
      currentFrame += 1;
      const progress = Math.min(1, currentFrame / totalFrames);
      const easeProgress = 1 - (1 - progress) ** 3;
      let currentValue = TARGET * easeProgress;

      if (progress >= 0.94) {
        currentValue = TARGET;
      }

      valueEl.textContent = currentValue.toFixed(1);

      if (currentFrame >= totalFrames) {
        window.clearInterval(intervalId);
        intervalId = null;
        valueEl.textContent = TARGET.toFixed(1);
      }
    }, 1000 / fps);
  };

  const runIfVisible = () => {
    if (counter.dataset.animated === 'true') return;
    const rect = counter.getBoundingClientRect();
    const vh = window.innerHeight;
    if (rect.top < vh * 0.9 && rect.bottom > vh * 0.08) {
      runCasino();
    }
  };

  ScrollTrigger.create({
    trigger: counter,
    start: 'top 88%',
    once: true,
    onEnter: runCasino,
  });

  window.setTimeout(runIfVisible, 600);

  const scrollUntilPlay = () => {
    if (counter.dataset.animated === 'true') {
      window.removeEventListener('scroll', scrollUntilPlay);
      return;
    }
    runIfVisible();
  };
  window.addEventListener('scroll', scrollUntilPlay, { passive: true });
}

function animateSimpleReveals(gsap, root) {
  [
    '.about-instagram-head',
    '.about-instagram a',
    '.about-faq .sticky',
    '.about-faq details',
    '.about-contact h2',
    '.about-contact p',
  ].forEach((selector) => {
    selectAll(root, selector).forEach((node, index) => {
      gsap.fromTo(node,
        { opacity: 0, y: 34, filter: 'blur(10px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          delay: Math.min(index * 0.04, 0.18),
          ease: 'power3.out',
          scrollTrigger: {
            trigger: node,
            start: 'top 88%',
          },
        }
      );
    });
  });
}
