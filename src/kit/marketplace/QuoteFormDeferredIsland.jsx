'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const FORM_MOUNT_EVENT = 'quote:form-mount-ready';

const EnhancedQuoteForm = dynamic(() => import('./QuoteFormIsland'), {
  ssr: false,
  loading: () => null,
});

export default function QuoteFormDeferredIsland({ initialDarkMode = false }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;

    const reveal = () => {
      if (disposed) return;
      setReady(true);
    };

    if (document.documentElement.dataset.quoteMotion === 'complete') {
      reveal();
    } else {
      window.addEventListener(FORM_MOUNT_EVENT, reveal, { once: true });
    }

    return () => {
      disposed = true;
      window.removeEventListener(FORM_MOUNT_EVENT, reveal);
    };
  }, []);

  if (!ready) return null;

  return <EnhancedQuoteForm initialDarkMode={initialDarkMode} />;
}
