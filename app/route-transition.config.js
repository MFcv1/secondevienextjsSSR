export const ROUTE_TRANSITION_CONFIG = {
  enabled: true,
  defaultVariant: 'atelierCurtain',
  targets: {
    '/a-propos': {
    variant: 'atelierCurtain',
      readyEvent: 'sv:hero-video-ready',
      readySelector: '.sv4-hero__video.is-active[data-first-frame-ready="true"]',
      warmupVideo: '/video/hero/1-wood-buffet.mp4',
      releaseOnRoute: false,
      readyTimeoutMs: 2200,
    },
  },
  variants: {
    atelierCurtain: {
      minVisibleMs: 5800,
      enterDelayMs: 900,
      enterDurationMs: 900,
      exitDelayMs: 150,
      exitDurationMs: 1950,
      panel: 'linear-gradient(180deg, #fcfaf6 0%, #f7f1ea 100%)',
    },
  },
};
