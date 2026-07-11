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
      minVisibleMs: 3250,
      enterDelayMs: 900,
      enterDurationMs: 900,
      exitDelayMs: 150,
      exitDurationMs: 1000,
      panel: '#F9F6F0',
      ink: '#1A130C',
      accent: '#A68A64',
    },
  },
};
