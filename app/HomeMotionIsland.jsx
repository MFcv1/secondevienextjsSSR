'use client';

import { useEffect, useRef, useState } from 'react';

const revealSelector = '.sv-home-reveal, .sv-home-animate > *';
const cursorActionSelector = [
  'a[href]',
  'button:not([disabled])',
  'summary',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[role="button"]',
  '[data-cursor-action="true"]',
].join(',');
const cursorForcedActionSelector = [
  'button:not([disabled])',
  '[role="button"]',
  '[data-cursor-action="true"]',
  '.sv-home-button',
  '.sv-home-link-button',
  '.sv-home-nav a',
  '.sv-home-footer__socials a',
  '.hero-cta-particles',
].join(',');
const cursorAmbientLinkSelector = [
  '.sv-product-link',
  '.sv-category-card',
  '[data-gallery-product-link]',
  '.product-card-wrap a',
].join(',');

export default function HomeMotionIsland() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const cursorRootRef = useRef(null);
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);
  const cursorTextRef = useRef(null);
  const cursorTrailRefs = useRef([]);

  useEffect(() => {
    const root = cursorRootRef.current;
    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    const text = cursorTextRef.current;
    const trails = cursorTrailRefs.current.filter(Boolean);
    const canUseCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!root || !dot || !ring || !text || !canUseCursor) return undefined;

    document.documentElement.classList.add('sv-custom-cursor-ready');

    let frameId = 0;
    let pressTimeoutId = 0;
    let idleTimeoutId = 0;
    let scrollTimeoutId = 0;
    let postScrollGuardTimeoutId = 0;
    let lastPointerMoveAt = 0;
    let activeActionTarget = null;
    const idleDelay = 260;
    const scrollSettleDelay = 180;
    const postScrollGuardDelay = 320;
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const dotPoint = { ...target };
    const ringPoint = { ...target };
    const trailPoints = trails.map(() => ({ ...target }));

    const render = () => {
      dotPoint.x += (target.x - dotPoint.x) * 0.42;
      dotPoint.y += (target.y - dotPoint.y) * 0.42;
      ringPoint.x += (target.x - ringPoint.x) * 0.17;
      ringPoint.y += (target.y - ringPoint.y) * 0.17;

      dot.style.transform = `translate3d(${dotPoint.x}px, ${dotPoint.y}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringPoint.x}px, ${ringPoint.y}px, 0) translate(-50%, -50%)`;
      text.style.transform = `translate3d(${ringPoint.x}px, ${ringPoint.y}px, 0) translate(-50%, -50%)`;

      trails.forEach((trail, index) => {
        const previous = index === 0 ? ringPoint : trailPoints[index - 1];
        const point = trailPoints[index];
        point.x += (previous.x - point.x) * 0.2;
        point.y += (previous.y - point.y) * 0.2;
        trail.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) scale(${1 - index * 0.085})`;
      });

      frameId = window.requestAnimationFrame(render);
    };

    const setVisible = (visible) => {
      root.dataset.visible = visible ? 'true' : 'false';
    };

    const clearIdleTimer = () => {
      if (!idleTimeoutId) return;
      window.clearTimeout(idleTimeoutId);
      idleTimeoutId = 0;
    };

    const clearPostScrollGuard = () => {
      if (!postScrollGuardTimeoutId) return;
      window.clearTimeout(postScrollGuardTimeoutId);
      postScrollGuardTimeoutId = 0;
    };

    const isActionAffordance = (node) => {
      if (!node?.matches) return false;
      if (node.matches(cursorAmbientLinkSelector)) return false;
      if (node.matches(cursorForcedActionSelector)) return true;

      const rect = node.getBoundingClientRect();
      const isLargeSurface = rect.width > 260 || rect.height > 160 || rect.width * rect.height > 32000;
      return !isLargeSurface;
    };

    const getActionTarget = (node) => {
      const candidate = node?.closest?.(cursorActionSelector) || null;
      return isActionAffordance(candidate) ? candidate : null;
    };

    const getAmbientTarget = (node) => node?.closest?.(cursorAmbientLinkSelector) || null;

    const getActionTargetAtPointer = () => {
      const node = document.elementFromPoint(target.x, target.y);
      return getActionTarget(node);
    };

    const setActionTarget = (node) => {
      activeActionTarget = node;
      root.dataset.intent = node ? 'action' : 'default';
    };

    const verifyActionTarget = () => {
      if (!activeActionTarget) return false;
      const nodeAtPointer = getActionTargetAtPointer();
      if (nodeAtPointer && nodeAtPointer === activeActionTarget) return true;
      setActionTarget(null);
      return false;
    };

    const scheduleIdle = () => {
      clearIdleTimer();
      idleTimeoutId = window.setTimeout(() => {
        if (window.performance.now() - lastPointerMoveAt < idleDelay - 12) {
          scheduleIdle();
          return;
        }
        if (!verifyActionTarget()) {
          root.dataset.motion = 'idle';
          idleTimeoutId = 0;
          return;
        }
        root.dataset.motion = 'idle';
        idleTimeoutId = 0;
      }, idleDelay);
    };

    const onPointerMove = (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      const actionTarget = getActionTarget(event.target);
      const ambientTarget = getAmbientTarget(event.target);
      target.x = event.clientX;
      target.y = event.clientY;
      lastPointerMoveAt = window.performance.now();
      setVisible(true);

      if (actionTarget) {
        setActionTarget(actionTarget);
        root.dataset.motion = 'idle';
        clearIdleTimer();
        return;
      }

      setActionTarget(null);
      root.dataset.intent = ambientTarget ? 'ambient' : 'default';
      root.dataset.motion = 'moving';
      scheduleIdle();
    };

    const onPointerOver = (event) => {
      const actionTarget = getActionTarget(event.target);
      if (actionTarget) {
        setActionTarget(actionTarget);
        return;
      }
      setActionTarget(null);
      root.dataset.intent = getAmbientTarget(event.target) ? 'ambient' : 'default';
    };

    const onPointerOut = (event) => {
      if (!activeActionTarget) return;
      const nextTarget = event.relatedTarget;
      if (nextTarget && activeActionTarget.contains(nextTarget)) return;
      window.requestAnimationFrame(() => {
        if (!verifyActionTarget()) {
          root.dataset.motion = 'moving';
          scheduleIdle();
        }
      });
    };

    const onPointerDown = () => {
      root.dataset.pressed = 'true';
      if (pressTimeoutId) window.clearTimeout(pressTimeoutId);
      pressTimeoutId = window.setTimeout(() => {
        root.dataset.pressed = 'false';
        pressTimeoutId = 0;
      }, 160);
    };

    const onScroll = () => {
      setActionTarget(null);
      root.dataset.motion = 'scrolling';
      clearIdleTimer();
      clearPostScrollGuard();
      if (scrollTimeoutId) window.clearTimeout(scrollTimeoutId);
      scrollTimeoutId = window.setTimeout(() => {
        const actionTarget = getActionTargetAtPointer();
        if (actionTarget) {
          setActionTarget(actionTarget);
          root.dataset.motion = 'idle';
          scrollTimeoutId = 0;
          return;
        }
        root.dataset.motion = 'moving';
        postScrollGuardTimeoutId = window.setTimeout(() => {
          if (!getActionTargetAtPointer()) scheduleIdle();
          postScrollGuardTimeoutId = 0;
        }, postScrollGuardDelay);
        scrollTimeoutId = 0;
      }, scrollSettleDelay);
    };

    const onPointerLeave = () => {
      setVisible(false);
      root.dataset.motion = 'moving';
      setActionTarget(null);
      clearIdleTimer();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerover', onPointerOver, { passive: true });
    window.addEventListener('pointerout', onPointerOut, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.documentElement.addEventListener('mouseleave', onPointerLeave);
    frameId = window.requestAnimationFrame(render);

    return () => {
      document.documentElement.classList.remove('sv-custom-cursor-ready');
      if (frameId) window.cancelAnimationFrame(frameId);
      if (pressTimeoutId) window.clearTimeout(pressTimeoutId);
      if (idleTimeoutId) window.clearTimeout(idleTimeoutId);
      if (scrollTimeoutId) window.clearTimeout(scrollTimeoutId);
      if (postScrollGuardTimeoutId) window.clearTimeout(postScrollGuardTimeoutId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerover', onPointerOver);
      window.removeEventListener('pointerout', onPointerOut);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onScroll);
      document.documentElement.removeEventListener('mouseleave', onPointerLeave);
    };
  }, []);

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
    <>
      <div ref={cursorRootRef} className="sv-home-cursor" data-visible="false" data-intent="default" data-motion="moving" data-pressed="false" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            ref={(node) => {
              cursorTrailRefs.current[index] = node;
            }}
            className="sv-home-cursor__trail"
            style={{
              '--trail-index': index,
              '--trail-border-alpha': 0.22 - (index * 0.028),
              '--trail-fill-alpha': 0.095 - (index * 0.012),
              '--trail-opacity': 0.34 - (index * 0.045),
            }}
          />
        ))}
        <span ref={cursorRingRef} className="sv-home-cursor__ring" />
        <span ref={cursorTextRef} className="sv-home-cursor__text">Scroll</span>
        <span ref={cursorDotRef} className="sv-home-cursor__dot" />
      </div>

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
    </>
  );
}
