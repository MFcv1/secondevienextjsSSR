'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const GlobalMenuPanelAuthIsland = dynamic(() => import('./GlobalMenuPanelAuthIsland'), {
  ssr: false,
  loading: () => null,
});

function MenuIcon({ open }) {
  return (
    <span className="relative block h-4 w-5">
      <span className={`absolute left-0 top-1/2 h-[1.25px] origin-center rounded-full bg-current transition-all duration-[420ms] ${open ? 'w-[19px] rotate-45' : 'w-5 -translate-y-[6px]'}`} />
      <span className={`absolute left-0 top-1/2 h-[1.25px] origin-center rounded-full bg-current transition-all duration-300 ${open ? 'w-[19px] scale-x-0 opacity-0' : 'w-[15px]'}`} />
      <span className={`absolute left-0 top-1/2 h-[1.25px] origin-center rounded-full bg-current transition-all duration-[420ms] ${open ? 'w-[19px] -rotate-45' : 'w-[10px] translate-y-[6px]'}`} />
    </span>
  );
}

export default function GlobalMenuTriggerIsland({ darkMode = false } = {}) {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setPanelOpen((value) => !value)}
        className={`relative mr-1 flex h-10 min-w-10 items-center justify-center gap-2 rounded-full px-2.5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] md:mr-0 md:px-3.5 ${darkMode ? 'bg-white/[0.07] text-stone-100 hover:bg-white/[0.12] hover:text-[#D9B58D]' : 'bg-white text-stone-900 shadow-sm shadow-stone-900/5 hover:text-[#8B5C42]'}`}
        aria-label={panelOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={panelOpen}
      >
        <MenuIcon open={panelOpen} />
        <span className="hidden text-[10px] font-black uppercase tracking-[0.16em] md:inline">Menu</span>
      </button>
      {panelOpen ? <GlobalMenuPanelAuthIsland darkMode={darkMode} panelOpen={panelOpen} setPanelOpen={setPanelOpen} /> : null}
    </>
  );
}
