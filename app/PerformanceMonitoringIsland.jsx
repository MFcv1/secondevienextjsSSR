'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { app } from '../src/kit/config/firebaseCore';
import { isPerformanceSafePath } from '../src/kit/shared/performanceRoutePolicy';

const CONTROL_KEY = '__SV_PERFORMANCE_CONTROL__';
let performancePromise = null;

const setCollection = (performance, enabled) => {
  performance.dataCollectionEnabled = enabled;
  performance.instrumentationEnabled = enabled;
};

const loadPerformance = async () => {
  if (!performancePromise) {
    performancePromise = import('firebase/performance')
      .then(({ getPerformance }) => getPerformance(app))
      .catch(() => null);
  }
  return performancePromise;
};

export default function PerformanceMonitoringIsland() {
  const pathname = usePathname();

  React.useEffect(() => {
    const safe = isPerformanceSafePath(pathname);

    const control = async (enabled) => {
      if (!enabled && !performancePromise) return;
      const performance = enabled ? await loadPerformance() : await performancePromise;
      if (performance) setCollection(performance, enabled);
    };

    window[CONTROL_KEY] = control;
    control(safe);

    return () => {
      if (window[CONTROL_KEY] === control) delete window[CONTROL_KEY];
    };
  }, [pathname]);

  return null;
}
