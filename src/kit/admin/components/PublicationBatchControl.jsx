'use client';

import { Check, ChevronDown, Layers3, Plus } from 'lucide-react';

export default function PublicationBatchControl({
  active = false,
  entries = [],
  selectedIndex = 0,
  onToggle,
  onSelect,
  disabled = false,
  darkMode = false,
  review = false,
}) {
  const selected = entries[selectedIndex];

  if (review && active && entries.length > 0) {
    return (
      <label className={`group relative flex min-h-9 items-center gap-2 rounded-full pl-2.5 pr-2 text-[10px] font-extrabold ring-1 transition-colors duration-200 ${darkMode ? 'bg-white/[0.055] text-stone-200 ring-white/10' : 'bg-white text-stone-700 ring-black/[0.08]'}`}>
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-stone-950 text-[8px] tabular-nums text-white dark:bg-white dark:text-stone-950">
          {selectedIndex + 1}
        </span>
        <span className="max-w-[150px] truncate">{selected?.formData?.name || `Publication ${selectedIndex + 1}`}</span>
        <ChevronDown size={12} strokeWidth={2} className="shrink-0 text-stone-400" aria-hidden="true" />
        <select
          aria-label="Choisir la publication à prévisualiser"
          value={selectedIndex}
          onChange={(event) => onSelect?.(Number(event.target.value))}
          disabled={disabled}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        >
          {entries.map((entry, index) => (
            <option key={entry.id} value={index}>{index + 1}. {entry.formData.name}</option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={active}
        className={`group flex min-h-9 items-center gap-2 rounded-full px-3 text-[10px] font-extrabold ring-1 transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 disabled:cursor-not-allowed disabled:opacity-45 ${active
          ? (darkMode ? 'bg-white text-stone-950 ring-white' : 'bg-stone-950 text-white ring-stone-950')
          : (darkMode ? 'text-stone-400 ring-white/12 hover:bg-white/[0.06] hover:text-white' : 'bg-white text-stone-500 ring-black/[0.08] hover:text-stone-950')}`}
      >
        <Layers3 size={13} strokeWidth={1.9} />
        Lot
        {active && entries.length > 0 && (
          <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[8px] tabular-nums ${darkMode ? 'bg-stone-950/10' : 'bg-white/15'}`}>{entries.length}</span>
        )}
      </button>

      {active && (
        <div className={`hidden min-h-9 items-center gap-2 rounded-full px-3 text-[9px] font-bold ring-1 sm:flex ${entries.length > 0
          ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400'
          : (darkMode ? 'text-stone-500 ring-white/10' : 'text-stone-400 ring-black/[0.06]')}`}
          role="status"
          aria-live="polite"
        >
          {entries.length > 0 ? <Check size={11} strokeWidth={3} /> : <Plus size={11} strokeWidth={2} />}
          {entries.length > 0
            ? `${entries.length} publication${entries.length > 1 ? 's' : ''} prête${entries.length > 1 ? 's' : ''}`
            : 'Ajoutez le premier meuble'}
        </div>
      )}
    </div>
  );
}
