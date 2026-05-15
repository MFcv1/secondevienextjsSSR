'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';

const LegacyApp = dynamic(() => import('../src/app.jsx'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-[#0F0F11]" />
});

export default function ClientApp() {
  useEffect(() => {
    document.documentElement.dataset.svClientHydrated = 'true';
  }, []);

  return <LegacyApp />;
}
