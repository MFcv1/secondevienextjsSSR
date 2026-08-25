import { isPerformanceSafePath } from './src/kit/shared/performanceRoutePolicy';

export function onRouterTransitionStart(url) {
  globalThis.window?.__SV_PERFORMANCE_CONTROL__?.(isPerformanceSafePath(url));
}
