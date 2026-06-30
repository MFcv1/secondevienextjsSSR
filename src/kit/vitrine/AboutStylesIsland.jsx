'use client';

import { useEffect } from 'react';

export default function AboutStylesIsland() {
  useEffect(() => {
    import('../../home-v4.css').catch(() => {});
    import('./about-sv4-hero.css').catch(() => {});
  }, []);

  return null;
}
