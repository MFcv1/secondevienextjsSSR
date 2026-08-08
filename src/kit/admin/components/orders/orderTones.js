'use client';

/**
 * Palette unique des ventes. Chaque ton existe en clair et en sombre :
 * aucune pastille ne doit dependre d'un aplat qui n'a pas d'equivalent
 * sur fond noir.
 */
const TONES = {
    neutral: {
        pill: ['bg-stone-500/10 text-stone-600', 'bg-white/[0.06] text-stone-300'],
        dot: 'bg-stone-400',
        soft: ['bg-stone-500/10 text-stone-500', 'bg-white/[0.06] text-stone-400'],
    },
    positive: {
        pill: ['bg-emerald-500/10 text-emerald-700', 'bg-emerald-500/12 text-emerald-400'],
        dot: 'bg-emerald-500',
        soft: ['bg-emerald-500/10 text-emerald-600', 'bg-emerald-500/12 text-emerald-400'],
    },
    progress: {
        pill: ['bg-amber-500/12 text-amber-700', 'bg-amber-500/14 text-amber-400'],
        dot: 'bg-amber-500',
        soft: ['bg-amber-500/10 text-amber-600', 'bg-amber-500/14 text-amber-400'],
    },
    transit: {
        pill: ['bg-indigo-500/10 text-indigo-700', 'bg-indigo-500/14 text-indigo-300'],
        dot: 'bg-indigo-500',
        soft: ['bg-indigo-500/10 text-indigo-600', 'bg-indigo-500/14 text-indigo-300'],
    },
    info: {
        pill: ['bg-sky-500/10 text-sky-700', 'bg-sky-500/14 text-sky-300'],
        dot: 'bg-sky-500',
        soft: ['bg-sky-500/10 text-sky-600', 'bg-sky-500/14 text-sky-300'],
    },
    danger: {
        pill: ['bg-red-500/10 text-red-600', 'bg-red-500/14 text-red-400'],
        dot: 'bg-red-500',
        soft: ['bg-red-500/10 text-red-600', 'bg-red-500/14 text-red-400'],
    },
};

const resolve = (tone) => TONES[tone] || TONES.neutral;

export const pillClass = (tone, darkMode) => resolve(tone).pill[darkMode ? 1 : 0];
export const softClass = (tone, darkMode) => resolve(tone).soft[darkMode ? 1 : 0];
export const dotClass = (tone) => resolve(tone).dot;

/** Surfaces recurrentes, alignees sur le revamp Publication. */
export const surfaceClass = (darkMode) => (
    darkMode ? 'border-white/10 bg-[#11110f]' : 'border-stone-200 bg-white'
);

export const insetClass = (darkMode) => (
    darkMode ? 'bg-black/20 ring-white/10' : 'bg-[#F7F6F3] ring-black/[0.045]'
);

export const mutedTextClass = (darkMode) => (darkMode ? 'text-stone-500' : 'text-stone-400');

export const roundActionClass = (darkMode) => (
    `grid h-8 w-8 shrink-0 place-items-center rounded-full ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 ${
        darkMode
            ? 'bg-white/[0.04] text-stone-400 ring-white/10 hover:bg-white hover:text-stone-950'
            : 'bg-white text-stone-500 ring-black/[0.06] hover:bg-stone-950 hover:text-white'
    }`
);
