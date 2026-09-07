'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const PremiumMegaMenuIsland = dynamic(() => import('./PremiumMegaMenuIsland'), {
  ssr: false,
  loading: () => null,
});

const THEME_STORAGE_KEY = 'darkMode';

export default function PremiumMegaMenuLazyIsland({ darkMode = false } = {}) {
  const [effectiveDarkMode, setEffectiveDarkMode] = useState(darkMode);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const readClientTheme = () => {
      let nextDark = document.documentElement.classList.contains('dark');
      try {
        const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (stored !== null) nextDark = stored === 'true';
      } catch { /* Theme remains usable when storage is denied. */ }
      setEffectiveDarkMode(nextDark);
    };

    readClientTheme();
    window.addEventListener('sv:theme-change', readClientTheme);
    return () => window.removeEventListener('sv:theme-change', readClientTheme);
  }, []);

  return (
    <div className="hidden min-h-[50.5px] w-full md:block">
      <PremiumMegaMenuIsland darkMode={effectiveDarkMode} />
    </div>
  );
}
