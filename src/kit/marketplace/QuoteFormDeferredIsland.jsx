'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const EnhancedQuoteForm = dynamic(() => import('./QuoteFormIsland'), {
  ssr: false,
  loading: () => null,
});

export default function QuoteFormDeferredIsland({ initialDarkMode = false }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let timeoutId;
    let idleId;

    const reveal = () => {
      if (disposed) return;
      setReady(true);
    };

    const schedule = () => {
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(reveal, { timeout: 1400 });
        return;
      }
      timeoutId = window.setTimeout(reveal, 700);
    };

    const events = ['pointerdown', 'keydown', 'touchstart', 'focusin'];
    events.forEach((eventName) => window.addEventListener(eventName, reveal, { once: true, passive: true }));
    schedule();

    return () => {
      disposed = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      if (idleId && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
      events.forEach((eventName) => window.removeEventListener(eventName, reveal));
    };
  }, []);

  if (!ready) return null;

  return <EnhancedQuoteForm initialDarkMode={initialDarkMode} />;
}
