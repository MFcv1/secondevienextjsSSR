'use client';

import { useMemo } from 'react';

export default function FooterMapFrameIsland({ darkMode = false, address = 'Marseille, France' } = {}) {
  const mapUrl = useMemo(() => {
    const mapQuery = encodeURIComponent(address || 'Marseille, France');
    return `https://www.google.com/maps?q=${mapQuery}&z=13&output=embed`;
  }, [address]);

  return (
    <div className={`relative h-full w-full overflow-hidden rounded-xl border ${darkMode ? 'border-[#d5b58d]/12 bg-[#151515]' : 'border-[#eee6dd] bg-white dark:border-[#d5b58d]/12 dark:bg-[#151515]'}`}>
      <iframe
        src={mapUrl}
        title="Carte de l'atelier a Marseille"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
