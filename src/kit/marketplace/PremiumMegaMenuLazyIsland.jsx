'use client';

import dynamic from 'next/dynamic';

const PremiumMegaMenuIsland = dynamic(() => import('./PremiumMegaMenuIsland'), {
  ssr: false,
  loading: () => null,
});

export default function PremiumMegaMenuLazyIsland({ darkMode = false } = {}) {
  return <PremiumMegaMenuIsland darkMode={darkMode} />;
}
