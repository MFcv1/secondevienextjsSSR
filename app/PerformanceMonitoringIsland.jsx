'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { app } from '../src/kit/config/firebaseCore';
import { isPerformanceSafePath } from '../src/kit/shared/performanceRoutePolicy';
import useCookieConsent from '../src/kit/shared/useCookieConsent';
import { hasConsent } from '../src/kit/shared/cookieConsent';

const CONTROL_KEY = '__SV_PERFORMANCE_CONTROL__';
let performancePromise = null;

const setCollection = (performance, enabled) => {
  performance.dataCollectionEnabled = enabled;
  performance.instrumentationEnabled = enabled;
};

const loadPerformance = async () => {
  if (!performancePromise) {
    performancePromise = import('firebase/performance')
      .then(({ getPerformance }) => hasConsent('analytics') ? getPerformance(app) : null)
      .then((performance) => {
        if (!performance) performancePromise = null;
        return performance;
      })
      .catch(() => null);
  }
  return performancePromise;
};

export default function PerformanceMonitoringIsland() {
  const pathname = usePathname();
  const consent = useCookieConsent();

  React.useEffect(() => {
    const safe = isPerformanceSafePath(pathname);
    let active = true;
    let requested = false;

    const control = async (enabled) => {
      enabled = enabled && hasConsent('analytics');
      requested = enabled;
      if (!enabled && !performancePromise) return;
      const performance = enabled ? await loadPerformance() : await performancePromise;
      if (performance) setCollection(performance, active && requested && hasConsent('analytics'));
    };

    window[CONTROL_KEY] = control;
    control(safe);

    return () => {
      active = false;
      if (performancePromise) performancePromise.then((performance) => { if (performance) setCollection(performance, false); });
      if (window[CONTROL_KEY] === control) delete window[CONTROL_KEY];
    };
  }, [pathname, consent?.analytics]);

  return null;
}
