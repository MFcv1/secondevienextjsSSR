'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export default function FooterMapFrameIsland({ darkMode = false, address = 'Marseille, France' } = {}) {
  const rootRef = useRef(null);
  const mapFrameRef = useRef(null);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapUrl = useMemo(() => {
    const mapQuery = encodeURIComponent(address || 'Marseille, France');
    return `https://www.google.com/maps?q=${mapQuery}&z=13&output=embed`;
  }, [address]);

  useEffect(() => {
    if (shouldLoadMap) return undefined;
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return undefined;

    const loadMap = () => setShouldLoadMap(true);
    const mobileScrollRoot = window.matchMedia('(max-width: 1023px)').matches
      ? document.getElementById('marketplaceGalleryScroll')
      : null;
    const scrollRoot = mobileScrollRoot?.contains(root) ? mobileScrollRoot : null;
    const preloadDistance = Math.min(
      Math.max((scrollRoot?.clientHeight || window.innerHeight) * 0.75, 480),
      900,
    );

    if (!('IntersectionObserver' in window)) {
      let ticking = false;
      const checkVisibility = () => {
        ticking = false;
        const rect = root.getBoundingClientRect();
        const viewportRect = scrollRoot?.getBoundingClientRect();
        const viewportTop = viewportRect?.top || 0;
        const viewportBottom = viewportRect?.bottom || window.innerHeight;
        if (rect.top <= viewportBottom + preloadDistance && rect.bottom >= viewportTop - preloadDistance) {
          loadMap();
          (scrollRoot || window).removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onScroll);
        }
      };
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(checkVisibility);
      };

      checkVisibility();
      if (!shouldLoadMap) {
        (scrollRoot || window).addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
      }
      return () => {
        (scrollRoot || window).removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        loadMap();
      },
      {
        root: scrollRoot,
        rootMargin: `${Math.round(preloadDistance)}px 0px`,
        threshold: 0.01,
      },
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, [shouldLoadMap]);

  useEffect(() => {
    const frame = mapFrameRef.current;
    if (!shouldLoadMap || !frame) return undefined;

    const markMapAsLoaded = () => setIsMapLoaded(true);
    frame.addEventListener('load', markMapAsLoaded);
    return () => frame.removeEventListener('load', markMapAsLoaded);
  }, [shouldLoadMap]);

  return (
    <div ref={rootRef} className={`relative h-full w-full overflow-hidden rounded-xl border ${darkMode ? 'border-[#d5b58d]/12 bg-[#151515]' : 'border-[#eee6dd] bg-white dark:border-[#d5b58d]/12 dark:bg-[#151515]'}`}>
      <div
        className={`absolute inset-0 ${darkMode ? 'bg-[#151515]' : 'bg-[#f7f1ea] dark:bg-[#151515]'}`}
        aria-hidden="true"
      />
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isMapLoaded ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
        aria-hidden="true"
      >
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] ${darkMode ? 'border-white/10 bg-white/[0.04] text-stone-400' : 'border-[#e7ddd2] bg-white/65 text-stone-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-400'}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500 motion-safe:animate-pulse" />
          Chargement de la carte
        </span>
      </div>
      {shouldLoadMap ? (
        <iframe
          ref={mapFrameRef}
          src={mapUrl}
          title="Carte de l'atelier a Marseille"
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
          className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${isMapLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : null}
    </div>
  );
}
