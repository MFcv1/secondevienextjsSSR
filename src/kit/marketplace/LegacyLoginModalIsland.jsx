'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ShieldCheck } from 'lucide-react';

const LegacyLoginModalFullIsland = dynamic(() => import('./LegacyLoginModalFullIsland'), {
  ssr: false,
  loading: () => null,
});

export default function LegacyLoginModalIsland({
  buttonClassName = '',
  buttonLabel = 'Connexion',
  buttonAriaLabel = 'Ouvrir la connexion',
  showShieldIcon = false,
  open,
  onOpenChange,
  renderTrigger = true,
} = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === 'boolean';
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = (nextOpen) => {
    if (!isControlled) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return (
    <>
      {renderTrigger ? (
        <button type="button" className={buttonClassName} onClick={() => setOpen(true)} aria-label={buttonAriaLabel}>
          {showShieldIcon ? <ShieldCheck size={14} className="text-stone-400 transition-colors group-hover:text-amber-500" /> : null}
          <span className="text-[10px] font-black uppercase tracking-[0.16em]">{buttonLabel}</span>
        </button>
      ) : null}
      {isOpen ? (
        <LegacyLoginModalFullIsland open={isOpen} onOpenChange={setOpen} renderTrigger={false} />
      ) : null}
    </>
  );
}
