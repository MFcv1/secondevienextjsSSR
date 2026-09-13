'use client';

import { useEffect, useRef, useState } from 'react';

// The temporary three-photo strip owns motion; the normal image owns loading
// and zoom. Keep the strip until the selected normal image is ready underneath.
export default function useProductSwipeMotion(activeIndex, painted) {
  const frameRef = useRef(null);
  const current = useRef(null);
  const timer = useRef(0);
  const [visual, setVisual] = useState(null);
  const clear = () => {
    window.clearTimeout(timer.current);
    current.current = null;
    setVisual(null);
  };
  useEffect(() => {
    if (visual?.settled && visual.target === activeIndex && painted) {
      current.current = null;
      setVisual(null);
    }
  }, [visual, activeIndex, painted]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const move = (dx, sources) => {
    const frame = frameRef.current;
    if (!frame) return;
    if (!current.current) {
      const bounds = frame.getBoundingClientRect();
      const next = { sources, width: bounds.width, height: bounds.height, settled: false };
      current.current = next;
      setVisual(next);
    }
    frame.style.setProperty('--swipe-duration', '0ms');
    frame.style.setProperty('--swipe-x', `${Math.max(-current.current.width, Math.min(current.current.width, dx))}px`);
  };
  const settle = (direction, target) => {
    const frame = frameRef.current;
    if (!frame || !current.current) return;
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 190;
    frame.style.setProperty('--swipe-duration', `${duration}ms`);
    frame.style.setProperty('--swipe-x', `${-direction * current.current.width}px`);
    timer.current = window.setTimeout(() => {
      if (direction === 0) { clear(); return; }
      const next = { ...current.current, target, settled: true };
      current.current = next;
      setVisual(next);
    }, duration);
  };
  return { frameRef, visual, move, settle, clear };
}
