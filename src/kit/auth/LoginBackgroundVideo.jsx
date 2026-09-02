'use client';

import { useEffect, useRef } from 'react';

const DESKTOP_MEDIA_QUERY = '(min-width: 768px)';

/**
 * Keeps the login movie while painting it on a regular canvas layer.
 * Chrome can briefly detach a native video surface when a looping video is
 * combined with a blurred modal. A canvas stays in the modal compositor and
 * keeps the last frame visible while the hidden decoder loops.
 */
export function LoginBackgroundVideo({ className = '' }) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia(DESKTOP_MEDIA_QUERY).matches) return undefined;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !video || !context) return undefined;

    let disposed = false;
    let started = false;
    let videoFrameId = null;
    let animationFrameId = null;

    const drawFrame = () => {
      if (disposed || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      if (!video.videoWidth || !video.videoHeight) return;

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    };

    const scheduleFrame = () => {
      if (disposed) return;

      if (typeof video.requestVideoFrameCallback === 'function') {
        videoFrameId = video.requestVideoFrameCallback(() => {
          drawFrame();
          scheduleFrame();
        });
        return;
      }

      animationFrameId = window.requestAnimationFrame(() => {
        drawFrame();
        scheduleFrame();
      });
    };

    const start = () => {
      if (started || disposed) return;
      started = true;
      drawFrame();
      scheduleFrame();
      void video.play().catch(() => {
        // The canvas remains black if the browser blocks decorative autoplay.
      });
    };

    video.addEventListener('loadeddata', start);
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) start();

    return () => {
      disposed = true;
      video.removeEventListener('loadeddata', start);
      if (videoFrameId !== null && typeof video.cancelVideoFrameCallback === 'function') {
        video.cancelVideoFrameCallback(videoFrameId);
      }
      if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
      video.pause();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" className={className} />
      <video
        ref={videoRef}
        aria-hidden="true"
        tabIndex={-1}
        src="/video/login-bg.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="hidden"
      />
    </>
  );
}
