'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const DeferredBeforeAfterSlider = dynamic(() => import('./BeforeAfterSliderIsland'), {
  ssr: false,
  loading: () => null,
});

const DeferredInstagramCarousel = dynamic(() => import('./InstagramCarouselIsland'), {
  ssr: false,
  loading: () => null,
});

const DeferredTestimonialsCarousel = dynamic(() => import('./TestimonialsCarouselIsland'), {
  ssr: false,
  loading: () => null,
});

const requestIdle = (callback, timeout) => {
  if (typeof window === 'undefined') return undefined;
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout });
  }
  return window.setTimeout(callback, Math.min(timeout, 1800));
};

const cancelIdle = (handle) => {
  if (handle === undefined || typeof window === 'undefined') return;
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(handle);
    return;
  }
  window.clearTimeout(handle);
};

export default function DeferredGalleryIsland({
  type,
  darkMode = false,
  projects,
  posts,
  rootMargin = '900px 0px',
  idleTimeout = 5200,
  children,
} = {}) {
  const anchorRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) return undefined;
    const anchor = anchorRef.current;
    let disposed = false;
    let idleHandle;

    const load = () => {
      if (!disposed) setShouldLoad(true);
    };

    if (!anchor || !('IntersectionObserver' in window)) {
      idleHandle = requestIdle(load, 900);
      return () => {
        disposed = true;
        cancelIdle(idleHandle);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        load();
      },
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(anchor);
    idleHandle = requestIdle(load, idleTimeout);

    return () => {
      disposed = true;
      observer.disconnect();
      cancelIdle(idleHandle);
    };
  }, [idleTimeout, rootMargin, shouldLoad]);

  let rendered = children;
  if (shouldLoad && type === 'before-after') {
    rendered = <DeferredBeforeAfterSlider projects={projects} darkMode={darkMode} />;
  } else if (shouldLoad && type === 'instagram') {
    rendered = <DeferredInstagramCarousel posts={posts} darkMode={darkMode} />;
  } else if (shouldLoad && type === 'testimonials') {
    rendered = <DeferredTestimonialsCarousel darkMode={darkMode} />;
  }

  return (
    <div ref={anchorRef} data-deferred-gallery-island={type} data-loaded={shouldLoad ? 'true' : 'false'}>
      {rendered}
    </div>
  );
}
