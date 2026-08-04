/*
 * Tokens partages par les trois surfaces de la page devis :
 * hero serveur, shell SSR sans JS et assistant client.
 * Toute marge ou couleur de la page doit venir d'ici pour rester symetrique.
 */

/* Un seul conteneur horizontal pour toute la page. */
export const QUOTE_SHELL = 'mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12';

/* Un seul rythme vertical entre sections. */
export const QUOTE_SECTION_TOP = 'pt-12 lg:pt-16';
export const QUOTE_SECTION_BOTTOM = 'pb-12 lg:pb-16';

/* Une seule gouttiere entre modules (rail, colonnes, cartes). */
export const QUOTE_GUTTER = 'gap-4 lg:gap-6';
export const QUOTE_GUTTER_BOTTOM = 'mb-4 lg:mb-6';

/* Un seul rayon par famille. */
export const QUOTE_RADIUS_PANEL = 'rounded-[22px]';
export const QUOTE_RADIUS_CARD = 'rounded-[16px]';
export const QUOTE_RADIUS_FIELD = 'rounded-[13px]';

/* Un seul padding interne de panneau. */
export const QUOTE_PANEL_PADDING = 'p-6 sm:p-8 lg:p-10';

/* Mobile : contenu aere sans boite imbriquee. Desktop : panneau premium conserve. */
export const QUOTE_STEP_PADDING = 'px-0 py-5 sm:py-7 lg:p-10';
export const QUOTE_STEP_RADIUS = 'rounded-none lg:rounded-[22px]';

/* Hauteur fixe reservee au desktop ; le mobile utilise le scroll naturel de la page. */
export const QUOTE_STEP_HEIGHT = 'lg:h-[740px]';

/* Largeur de lecture confortable pour les etapes textuelles. */
export const QUOTE_READABLE = 'max-w-[800px]';

/* Hauteurs de controle alignees sur une seule echelle. */
export const QUOTE_CONTROL_HEIGHT = 'h-[52px]';

/* Zone photo proportionnee au mobile, puis genereuse sur les grands ecrans. */
export const QUOTE_DROPZONE_HEIGHT = 'min-h-[180px] min-[520px]:min-h-[210px] sm:min-h-[240px] lg:min-h-[260px]';

export const quoteTokens = (darkMode = false) => ({
    panel: darkMode
        ? 'bg-white/[0.035] ring-1 ring-white/[0.08]'
        : 'bg-white ring-1 ring-[#eae4dc] shadow-[0_1px_2px_rgba(28,25,23,0.03),0_18px_50px_rgba(28,25,23,0.035)]',
    stepPanel: darkMode
        ? 'bg-transparent lg:bg-white/[0.035] lg:ring-1 lg:ring-white/[0.08]'
        : 'bg-transparent lg:bg-white lg:ring-1 lg:ring-[#eae4dc] lg:shadow-[0_1px_2px_rgba(28,25,23,0.03),0_18px_50px_rgba(28,25,23,0.035)]',
    panelQuiet: darkMode
        ? 'bg-white/[0.02] ring-1 ring-white/[0.06]'
        : 'bg-[#f7f5f1] ring-1 ring-[#ece6de]',
    field: darkMode
        ? 'bg-[#141312] text-stone-100 ring-1 ring-white/10 placeholder:text-stone-600 focus:ring-[#D9B58D]/50'
        : 'bg-[#faf9f7] text-[#1c1917] ring-1 ring-[#e3ddd4] placeholder:text-[#9c948b] focus:ring-[#8B5C42]/45',
    optionIdle: darkMode
        ? 'bg-white/[0.025] ring-1 ring-white/[0.08] hover:bg-white/[0.055]'
        : 'bg-[#faf9f7] ring-1 ring-[#e7e1d9] hover:bg-white hover:ring-[#d8cec1]',
    optionActive: darkMode
        ? 'bg-[#D9B58D]/[0.10] ring-[1.5px] ring-[#D9B58D]/60'
        : 'bg-white ring-[1.5px] ring-[#8B5C42] shadow-[0_1px_2px_rgba(28,25,23,0.03),0_12px_30px_rgba(139,92,66,0.10)]',
    furnitureCardIdle: darkMode
        ? 'bg-white/[0.025] shadow-[0_2px_8px_rgba(0,0,0,0.18)] hover:bg-white/[0.05] hover:shadow-[0_8px_22px_rgba(0,0,0,0.26)]'
        : 'bg-[#faf9f7] shadow-[0_2px_8px_rgba(45,38,32,0.08)] hover:bg-white hover:shadow-[0_8px_22px_rgba(45,38,32,0.13)]',
    furnitureCardActive: darkMode
        ? 'bg-white/[0.08] shadow-[0_10px_28px_rgba(0,0,0,0.34),0_0_0_4px_rgba(217,181,141,0.38),0_0_18px_rgba(217,181,141,0.18)]'
        : 'bg-white shadow-[0_10px_28px_rgba(45,38,32,0.16),0_0_0_4px_rgba(139,92,66,0.40),0_0_18px_rgba(139,92,66,0.18)]',
    imageBed: darkMode ? 'bg-white/[0.04]' : 'bg-[#f1ece5]',
    text: darkMode ? 'text-stone-100' : 'text-[#1c1917]',
    muted: darkMode ? 'text-stone-400' : 'text-[#6e655d]',
    faint: darkMode ? 'text-stone-500' : 'text-[#8d8479]',
    accent: darkMode ? 'text-[#D9B58D]' : 'text-[#8B5C42]',
    accentBg: darkMode ? 'bg-[#D9B58D]' : 'bg-[#8B5C42]',
    accentOn: darkMode ? 'text-[#171411]' : 'text-white',
    trackBg: darkMode ? 'bg-white/[0.10]' : 'bg-[#e6e0d8]',
    hairline: darkMode ? 'border-white/[0.08]' : 'border-[#eae4dc]',
    divide: darkMode ? 'divide-white/[0.08]' : 'divide-[#eae4dc]',
    markIdle: darkMode ? 'ring-1 ring-white/15' : 'ring-1 ring-[#d3c9bc] bg-white',
    primaryBtn: darkMode
        ? 'bg-white text-[#171411] hover:bg-[#efe3d3]'
        : 'bg-[#1c1917] text-white hover:bg-[#332e29]',
    ghostBtn: darkMode
        ? 'border border-white/16 text-stone-200 hover:bg-white/[0.07]'
        : 'border border-[#d5cbbf] text-[#1c1917] hover:bg-white',
    focusRing: darkMode
        ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B58D]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]'
        : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5C42]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf8]',
    surface: darkMode ? 'bg-[#0A0A0A] text-stone-100' : 'bg-[#fbfaf8] text-[#1c1917]',
    heroBg: darkMode ? 'bg-[#100e0c]' : 'bg-[#f4f1ec]',
    barBg: darkMode
        ? 'bg-[#0A0A0A]/92'
        : 'bg-white/92 shadow-[0_-8px_30px_rgba(28,25,23,0.07)]',
    railBg: darkMode ? 'bg-[#0A0A0A]/85' : 'bg-[#fbfaf8]/88',
});

/* Une seule courbe d'animation pour toute la page. */
export const QUOTE_EASE = 'transition-all duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)]';

/* Echelle typographique unique. */
export const QUOTE_TYPE = {
    eyebrow: 'font-sans text-[11px] font-semibold uppercase tracking-[0.2em]',
    display: 'font-serif text-[clamp(2.5rem,5.6vw,3.85rem)] leading-[0.98] tracking-[-0.02em]',
    section: 'font-serif text-[clamp(1.55rem,3.2vw,2.2rem)] leading-[1.04] tracking-[-0.02em]',
    price: 'font-serif text-[clamp(2.35rem,4vw,2.85rem)] leading-none tracking-[-0.02em] tabular-nums',
    cardTitle: 'font-sans text-[13.5px] font-semibold leading-snug',
    label: 'font-sans text-[12px] font-semibold',
    body: 'font-sans text-[13.5px] leading-[1.6]',
    meta: 'font-sans text-[12.5px] leading-[1.55]',
    micro: 'font-sans text-[11.5px] leading-[1.5]',
};
