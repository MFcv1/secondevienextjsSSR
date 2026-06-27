'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export default function FooterMapFrameIsland({ darkMode = false, address = 'Marseille, France' } = {}) {
  const rootRef = useRef(null);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const mapUrl = useMemo(() => {
    const mapQuery = encodeURIComponent(address || 'Marseille, France');
    return `https://www.google.com/maps?q=${mapQuery}&z=13&output=embed`;
  }, [address]);

  useEffect(() => {
    if (shouldLoadMap) return undefined;
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return undefined;

    const loadMap = () => setShouldLoadMap(true);

    if (!('IntersectionObserver' in window)) {
      let ticking = false;
      const checkVisibility = () => {
        ticking = false;
        const rect = root.getBoundingClientRect();
        if (rect.top <= window.innerHeight && rect.bottom >= 0) {
          loadMap();
          window.removeEventListener('scroll', onScroll, { passive: true });
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
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
      }
      return () => {
        window.removeEventListener('scroll', onScroll, { passive: true });
        window.removeEventListener('resize', onScroll);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        loadMap();
      },
      { rootMargin: '0px', threshold: 0.01 },
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, [shouldLoadMap]);

  return (
    <div ref={rootRef} className={`relative h-full w-full overflow-hidden rounded-xl border ${darkMode ? 'border-[#d5b58d]/12 bg-[#151515]' : 'border-[#eee6dd] bg-white dark:border-[#d5b58d]/12 dark:bg-[#151515]'}`}>
      <div
        className={`absolute inset-0 ${darkMode ? 'bg-[#151515]' : 'bg-[#f7f1ea] dark:bg-[#151515]'}`}
        aria-hidden="true"
      />
      {shouldLoadMap ? (
        <iframe
          src={mapUrl}
          title="Carte de l'atelier a Marseille"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full"
        />
      ) : null}
    </div>
  );
}
