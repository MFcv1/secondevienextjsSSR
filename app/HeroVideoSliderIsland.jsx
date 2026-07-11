"use client";
import React, { useState, useEffect, useRef } from 'react';

const VIDEOS = [
  '/video/hero/1-wood-buffet.mp4',
  '/video/hero/2-teal-buffet.mp4',
  '/video/hero/3-cream-buffet.mp4',
  '/video/hero/4-coral-buffet.mp4',
  '/video/hero/5-mustard-buffet.mp4'
];

const HERO_VIDEO_READY_EVENT = 'sv:hero-video-ready';

export default function HeroVideoSliderIsland() {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRefs = useRef([]);
  const videoReadyPendingRef = useRef(false);
  const videoReadyEmittedRef = useRef(false);

  // Crossfade logic: switch to next video slightly before current ends
  const handleTimeUpdate = (e, index) => {
    if (index !== activeIndex) return;
    const video = e.target;
    
    // Switch to the next video after 7 seconds for a faster pace
    if (video.currentTime >= 7) {
      const nextIndex = (activeIndex + 1) % VIDEOS.length;
      
      // Prepare and play the next video so it's ready during the CSS fade
      if (videoRefs.current[nextIndex]) {
        // Only reset time if it's not already near the start (prevents stuttering if called multiple times)
        if (videoRefs.current[nextIndex].currentTime > 1) {
            videoRefs.current[nextIndex].currentTime = 0;
        }
        videoRefs.current[nextIndex].play().catch(() => {});
      }
      
      setActiveIndex(nextIndex);
    }
  };

  useEffect(() => {
    // Play the first video on mount
    if (videoRefs.current[0]) {
      videoRefs.current[0].play().catch(console.error);
    }
  }, []);

  const emitHeroVideoReady = (index, video) => {
    if (
      index !== 0 ||
      !video ||
      typeof window === 'undefined' ||
      videoReadyPendingRef.current ||
      videoReadyEmittedRef.current
    ) return;

    videoReadyPendingRef.current = true;
    const finish = () => {
      if (videoReadyEmittedRef.current) return;
      videoReadyEmittedRef.current = true;
      video.dataset.firstFrameReady = 'true';
      window.dispatchEvent(new CustomEvent(HERO_VIDEO_READY_EVENT));
    };

    if (typeof video.requestVideoFrameCallback === 'function') {
      video.requestVideoFrameCallback(finish);
      return;
    }

    window.requestAnimationFrame(() => window.requestAnimationFrame(finish));
  };

  return (
    <div className="sv4-hero__bg">
      {VIDEOS.map((src, i) => (
        <video
          key={src}
          ref={el => videoRefs.current[i] = el}
          src={src}
          autoPlay={i === 0}
          muted
          playsInline
          preload={i === 0 ? 'auto' : 'metadata'}
          className={`sv4-hero__video ${i === activeIndex ? 'is-active' : ''}`}
          onPlaying={(event) => emitHeroVideoReady(i, event.currentTarget)}
          onTimeUpdate={(e) => handleTimeUpdate(e, i)}
          onEnded={() => {
             // Fallback in case onTimeUpdate didn't catch the window
             const nextIndex = (i + 1) % VIDEOS.length;
             if (activeIndex !== nextIndex) {
                 setActiveIndex(nextIndex);
                 if (videoRefs.current[nextIndex]) {
                    videoRefs.current[nextIndex].currentTime = 0;
                    videoRefs.current[nextIndex].play().catch(() => {});
                 }
             }
          }}
        />
      ))}
      <div className="sv4-hero__overlay"></div>
    </div>
  );
}
