'use client';

import dynamic from 'next/dynamic';

const PremiumMegaMenuIsland = dynamic(() => import('./PremiumMegaMenuIsland'), {
  ssr: false,
  loading: () => null,
});

export default function PremiumMegaMenuLazyIsland({ darkMode = false } = {}) {
  return (
    <div className="hidden min-h-[50.5px] w-full md:block">
      <PremiumMegaMenuIsland darkMode={darkMode} />
    </div>
  );
}
