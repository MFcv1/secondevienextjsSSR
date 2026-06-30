'use client';

import { useEffect } from 'react';

export default function InstagramFloatingTokensReveal() {
  useEffect(() => {
    const field = document.querySelector('[data-instagram-floating-field="true"]');
    if (!field) return undefined;

    const reveal = () => {
      field.setAttribute('data-floating-ready', 'true');
      window.setTimeout(() => {
        field.setAttribute('data-floating-settled', 'true');
      }, 2200);
    };

    if (!('IntersectionObserver' in window)) {
      const timeout = window.setTimeout(reveal, 240);
      return () => window.clearTimeout(timeout);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        window.setTimeout(reveal, 120);
      },
      { rootMargin: '-8% 0px -18% 0px', threshold: 0.18 },
    );

    observer.observe(field);
    return () => observer.disconnect();
  }, []);

  return null;
}
