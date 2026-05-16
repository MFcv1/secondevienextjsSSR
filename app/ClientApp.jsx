'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const LegacyApp = dynamic(() => import('../src/app.jsx'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-[#0F0F11]" />
});

const DeferredLegacyApp = dynamic(() => import('../src/app.jsx'), {
  ssr: false,
  loading: () => null
});

export default function ClientApp({ defer = false, delay = 1800 }) {
  const [shouldMountLegacy, setShouldMountLegacy] = useState(!defer);

  useEffect(() => {
    if (!defer || shouldMountLegacy) return undefined;

    let idleId = 0;
    let timeoutId = 0;
    let mounted = true;

    const mountLegacy = () => {
      if (!mounted) return;
      setShouldMountLegacy(true);
    };

    const scheduleIdle = () => {
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(mountLegacy, { timeout: delay + 1200 });
        return;
      }
      timeoutId = window.setTimeout(mountLegacy, delay);
    };

    const events = ['pointerdown', 'keydown', 'touchstart', 'wheel'];
    events.forEach((eventName) => {
      window.addEventListener(eventName, mountLegacy, { once: true, passive: true });
    });
    timeoutId = window.setTimeout(scheduleIdle, delay);

    return () => {
      mounted = false;
      events.forEach((eventName) => window.removeEventListener(eventName, mountLegacy));
      if (timeoutId) window.clearTimeout(timeoutId);
      if (idleId && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [defer, delay, shouldMountLegacy]);

  if (!shouldMountLegacy) return null;

  return defer ? <DeferredLegacyApp /> : <LegacyApp />;
}
