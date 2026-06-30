'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const AboutMotionIsland = dynamic(() => import('./AboutMotionIsland'), {
  ssr: false,
  loading: () => null,
});

export default function AboutMotionDeferredIsland() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let timeoutId;
    let idleId;

    const reveal = () => {
      if (!disposed) setReady(true);
    };

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(reveal, { timeout: 1800 });
    } else {
      timeoutId = window.setTimeout(reveal, 900);
    }

    return () => {
      disposed = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      if (idleId && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
    };
  }, []);

  return ready ? <AboutMotionIsland /> : null;
}
