'use client';

import { Archive, ArrowRight, Check, Loader2, Package, Truck } from 'lucide-react';

const ICONS = {
    package: Package,
    check: Check,
    truck: Truck,
    archive: Archive,
    arrow: ArrowRight,
};

export const actionIcon = (name) => ICONS[name] || ArrowRight;

/** Pilule sombre a pastille : meme geometrie que l'action primaire de Publication. */
export function PrimaryAction({ busy = false, darkMode = false, disabled = false, icon = 'arrow', label, onClick }) {
    const Icon = actionIcon(icon);
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || busy}
            className={`group relative flex min-h-11 w-full items-center justify-between gap-2.5 overflow-hidden rounded-full py-1 pl-5 pr-1 text-[12px] font-extrabold transition-[transform,box-shadow,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45 ${
                darkMode
                    ? 'bg-white text-stone-950 shadow-[0_10px_26px_rgba(0,0,0,0.4)]'
                    : 'bg-stone-950 text-white shadow-[0_10px_26px_rgba(28,25,23,0.18)] hover:shadow-[0_14px_34px_rgba(28,25,23,0.24)]'
            }`}
        >
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-full motion-reduce:hidden"
            />
            <span className="relative truncate">{label}</span>
            <span className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 ${darkMode ? 'bg-black/[0.07]' : 'bg-white/12'}`}>
                {busy ? <Loader2 size={15} strokeWidth={2.2} className="animate-spin" /> : <Icon size={15} strokeWidth={2.2} />}
            </span>
        </button>
    );
}

/** Action secondaire : anneau discret, jamais de couleur pleine. */
export function GhostAction({ darkMode = false, disabled = false, icon, label, onClick, tone = 'neutral' }) {
    const Icon = icon ? actionIcon(icon) : null;
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-[11px] font-extrabold ring-1 transition-[transform,background-color,color] duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 ${
                tone === 'danger'
                    ? (darkMode ? 'text-red-400 ring-red-500/25 hover:bg-red-500/10' : 'text-red-600 ring-red-500/20 hover:bg-red-50')
                    : (darkMode ? 'text-stone-300 ring-white/12 hover:bg-white/[0.07] hover:text-white' : 'text-stone-600 ring-black/[0.08] hover:bg-stone-50 hover:text-stone-950')
            }`}
        >
            {Icon && <Icon size={14} strokeWidth={2} />}
            {label}
        </button>
    );
}
