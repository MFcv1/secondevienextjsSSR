'use client';

import { Check, Loader2 } from 'lucide-react';

const BASE_PHASES = [
  { id: 'authorization', label: 'Vérification sécurisée' },
  { id: 'photos', label: 'Préparation et envoi des photos' },
  { id: 'record', label: 'Enregistrement du meuble' },
  { id: 'catalog', label: 'Mise à jour de la galerie' },
];

export default function PublicationProgressDialog({ darkMode = false, includeSocial = false, open, phase, progress, message }) {
  if (!open) return null;

  const phases = includeSocial
    ? [...BASE_PHASES, { id: 'social', label: 'Publication sur les réseaux' }]
    : BASE_PHASES;
  const activeIndex = phase === 'complete'
    ? phases.length
    : Math.max(0, phases.findIndex((entry) => entry.id === phase));
  const percent = Math.max(1, Math.min(100, Math.round(progress * 100)));

  return (
    <div
      className="absolute inset-0 z-40 grid place-items-center bg-stone-950/35 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publication-progress-title"
      aria-describedby="publication-progress-message"
    >
      <div className={`w-full max-w-[430px] rounded-[22px] border p-5 shadow-[0_24px_70px_rgba(28,25,23,0.24)] sm:p-6 ${darkMode ? 'border-white/10 bg-[#171714] text-white' : 'border-stone-200 bg-white text-stone-950'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-[9px] font-extrabold uppercase tracking-[0.14em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Publication en cours</p>
            <h3 id="publication-progress-title" className="mt-1.5 text-[18px] font-extrabold tracking-[-0.035em]">Mise en ligne de l’ouvrage</h3>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold tabular-nums ${darkMode ? 'bg-white/[0.07] text-stone-300' : 'bg-stone-100 text-stone-600'}`}>{percent}%</span>
        </div>

        <div
          className={`mt-5 h-2 overflow-hidden rounded-full ${darkMode ? 'bg-white/[0.07]' : 'bg-stone-100'}`}
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={percent}
        >
          <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 ease-out" style={{ width: `${percent}%` }} />
        </div>

        <ol className="mt-5 space-y-2.5" aria-label="Étapes de mise en ligne">
          {phases.map((entry, index) => {
            const done = index < activeIndex;
            const active = phase !== 'complete' && index === activeIndex;
            return (
              <li key={entry.id} className={`flex min-h-8 items-center gap-3 text-[11px] font-bold ${active ? (darkMode ? 'text-white' : 'text-stone-950') : done ? 'text-emerald-600' : (darkMode ? 'text-stone-600' : 'text-stone-400')}`}>
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${done ? 'bg-emerald-500 text-white' : active ? 'bg-emerald-500/12 text-emerald-600 ring-1 ring-emerald-500/25' : (darkMode ? 'bg-white/[0.05]' : 'bg-stone-100')}`}>
                  {done ? <Check size={12} strokeWidth={2.8} /> : active ? <Loader2 size={12} strokeWidth={2.2} className="animate-spin" /> : index + 1}
                </span>
                {entry.label}
              </li>
            );
          })}
        </ol>

        <p id="publication-progress-message" role="status" aria-live="polite" className={`mt-5 min-h-5 text-[10px] font-semibold ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
          {message || 'Préparation de la publication…'}
        </p>
        <p className={`mt-2 text-[9px] leading-4 ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>Ne fermez pas cette page. La confirmation finale apparaît uniquement quand le meuble est disponible dans le catalogue.</p>
      </div>
    </div>
  );
}
