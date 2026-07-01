export const ROUTE_TRANSITION_CONFIG = {
  enabled: true,
  defaultVariant: 'blackDepthCut',
  targets: {
    '/a-propos': {
      variant: 'blackDepthCut',
      readyEvent: 'sv:hero-video-ready',
      readySelector: '.sv4-hero__video.is-active',
      warmupVideo: '/video/hero/1-wood-buffet.mp4',
      releaseOnRoute: true,
      readyTimeoutMs: 80,
    },
  },
  variants: {
    blackDepthCut: {
      minVisibleMs: 0,
      enterDelayMs: 320,
      exitDelayMs: 0,
      exitDurationMs: 170,
      background: '#020202',
      tint: 'rgba(255, 255, 255, 0.055)',
      line: 'rgba(250, 246, 239, 0.72)',
      lineTrack: 'rgba(250, 246, 239, 0.14)',
      lineGlow: 'rgba(250, 246, 239, 0.28)',
    },
  },
};
