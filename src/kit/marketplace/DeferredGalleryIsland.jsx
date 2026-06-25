'use client';

import { useEffect, useRef, useState } from 'react';

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
  enableIdleFallback = true,
  intersectionDelayMs = 140,
  intersectionIdleTimeout = 1200,
  threshold = 0.01,
  children,
} = {}) {
  const anchorRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [LoadedComponent, setLoadedComponent] = useState(null);

  useEffect(() => {
    if (shouldLoad) return undefined;
    const anchor = anchorRef.current;
    let disposed = false;
    let idleHandle;
    let settleHandle;

    const load = () => {
      if (!disposed) setShouldLoad(true);
    };

    const scheduleLoad = (delayMs, timeout) => {
      const requestLoad = () => {
        idleHandle = requestIdle(load, timeout);
      };

      if (delayMs > 0) {
        settleHandle = window.setTimeout(requestLoad, delayMs);
        return;
      }

      requestLoad();
    };

    if (!anchor || !('IntersectionObserver' in window)) {
      scheduleLoad(0, 900);
      return () => {
        disposed = true;
        window.clearTimeout(settleHandle);
        cancelIdle(idleHandle);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        window.clearTimeout(settleHandle);
        cancelIdle(idleHandle);
        scheduleLoad(intersectionDelayMs, intersectionIdleTimeout);
      },
      { rootMargin, threshold },
    );

    observer.observe(anchor);
    if (enableIdleFallback) {
      idleHandle = requestIdle(load, idleTimeout);
    }

    return () => {
      disposed = true;
      observer.disconnect();
      window.clearTimeout(settleHandle);
      cancelIdle(idleHandle);
    };
  }, [enableIdleFallback, idleTimeout, intersectionDelayMs, intersectionIdleTimeout, rootMargin, shouldLoad, threshold]);

  useEffect(() => {
    if (!shouldLoad || LoadedComponent) return undefined;
    let disposed = false;

    const loadModule = async () => {
      let module;
      if (type === 'before-after') {
        module = await import('./BeforeAfterSliderIsland');
      } else if (type === 'instagram') {
        module = await import('./InstagramCarouselIsland');
      } else if (type === 'testimonials') {
        module = await import('./TestimonialsCarouselIsland');
      }

      if (!disposed && module?.default) {
        setLoadedComponent(() => module.default);
      }
    };

    loadModule();

    return () => {
      disposed = true;
    };
  }, [LoadedComponent, shouldLoad, type]);

  let rendered = children;
  if (LoadedComponent && type === 'before-after') {
    rendered = <LoadedComponent projects={projects} darkMode={darkMode} />;
  } else if (LoadedComponent && type === 'instagram') {
    rendered = <LoadedComponent posts={posts} darkMode={darkMode} />;
  } else if (LoadedComponent && type === 'testimonials') {
    rendered = <LoadedComponent darkMode={darkMode} />;
  }

  return (
    <div
      ref={anchorRef}
      data-deferred-gallery-island={type}
      data-load-requested={shouldLoad ? 'true' : 'false'}
      data-loaded={LoadedComponent ? 'true' : 'false'}
    >
      {rendered}
    </div>
  );
}
