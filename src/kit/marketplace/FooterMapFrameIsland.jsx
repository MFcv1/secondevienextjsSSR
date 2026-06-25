'use client';

import { useMemo, useState } from 'react';

export default function FooterMapFrameIsland({ darkMode = false, address = 'Marseille, France' } = {}) {
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const mapUrl = useMemo(() => {
    const mapQuery = encodeURIComponent(address || 'Marseille, France');
    return `https://www.google.com/maps?q=${mapQuery}&z=13&output=embed`;
  }, [address]);

  if (shouldLoadMap) {
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

  return (
    <div
      className={`relative flex h-full w-full overflow-hidden rounded-xl border ${
        darkMode ? 'border-[#d5b58d]/12 bg-[#151515]' : 'border-[#eee6dd] bg-[#fbfaf8] dark:border-[#d5b58d]/12 dark:bg-[#151515]'
      }`}
      data-footer-map-placeholder="true"
    >
      <div className={`absolute inset-0 ${darkMode ? 'bg-[linear-gradient(135deg,#151515,#1d1914)]' : 'bg-[linear-gradient(135deg,#fffdf9,#f0e7dd)]'}`} />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(142,111,78,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(142,111,78,0.28)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className={`absolute left-[18%] top-[22%] h-3 w-3 rounded-full ${darkMode ? 'bg-[#d5b58d]' : 'bg-[#9a714c]'}`} />
      <div className={`absolute right-[22%] top-[38%] h-2 w-2 rounded-full ${darkMode ? 'bg-[#7d6a55]' : 'bg-[#c7aa8c]'}`} />
      <div className={`absolute bottom-[20%] left-[36%] h-2.5 w-2.5 rounded-full ${darkMode ? 'bg-[#a98d68]' : 'bg-[#b9864f]'}`} />
      <div className={`absolute left-[18%] right-[20%] top-1/2 h-px -rotate-6 ${darkMode ? 'bg-[#d5b58d]/24' : 'bg-[#9a714c]/24'}`} />
      <div className="relative z-10 m-auto flex max-w-[220px] flex-col items-center px-5 text-center">
        <span className={`flex h-11 w-11 items-center justify-center rounded-full text-[22px] leading-none ${darkMode ? 'bg-[#211f1b] text-[#f4eee6]' : 'bg-white text-[#9a714c] shadow-sm'}`} aria-hidden="true">
          +
        </span>
        <p className={`mt-4 font-serif text-[18px] leading-tight ${darkMode ? 'text-[#f4eee6]' : 'text-stone-950'}`}>Notre atelier</p>
        <p className={`mt-2 text-xs leading-5 ${darkMode ? 'text-[#ded6cc]/72' : 'text-stone-600'}`}>{address}</p>
        <button
          type="button"
          onClick={() => setShouldLoadMap(true)}
          className={`mt-4 rounded-full px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.16em] transition-colors ${
            darkMode ? 'bg-[#f8efe2] text-[#18130f] hover:bg-white' : 'bg-[#211911] text-[#fff7ec] hover:bg-[#18130f]'
          }`}
        >
          Afficher la carte
        </button>
      </div>
    </div>
  );
}
