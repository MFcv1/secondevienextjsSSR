'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { QUOTE_INTRO_SETTLED_MS } from './quoteTheme';

const EnhancedQuoteForm = dynamic(() => import('./QuoteFormIsland'), {
  ssr: false,
  loading: () => null,
});

export default function QuoteFormDeferredIsland({ initialDarkMode = false }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let timeoutId;

    const reveal = () => {
      if (disposed) return;
      setReady(true);
    };

    /*
     * L'echange shell -> assistant attend la fin de la cascade d'ouverture.
     * Arriver au milieu donnait un enchainement illisible : le hero se
     * composait pendant que le formulaire, lui, se remontait par-dessous.
     * Toute interaction court-circuite l'attente : la reactivite prime.
     */
    const schedule = () => {
      if (document.documentElement.dataset.quoteMotion === 'complete') {
        reveal();
        return;
      }

      timeoutId = window.setTimeout(reveal, QUOTE_INTRO_SETTLED_MS);
    };

    const events = ['pointerdown', 'keydown', 'touchstart', 'focusin'];
    events.forEach((eventName) => window.addEventListener(eventName, reveal, { once: true, passive: true }));
    schedule();

    return () => {
      disposed = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      events.forEach((eventName) => window.removeEventListener(eventName, reveal));
    };
  }, []);

  if (!ready) return null;

  return <EnhancedQuoteForm initialDarkMode={initialDarkMode} />;
}
