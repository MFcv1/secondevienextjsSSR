import { Loader2 } from 'lucide-react';

export const adminSurfaces = (darkMode) => ({
    panel: darkMode
        ? 'border-white/10 bg-[#111111] text-white'
        : 'border-stone-200 bg-white text-stone-900',
    softPanel: darkMode
        ? 'border-white/10 bg-white/[0.03]'
        : 'border-stone-200 bg-stone-50/70',
    divider: darkMode ? 'border-white/10' : 'border-stone-100',
    hairline: darkMode ? 'divide-white/10' : 'divide-stone-100',
    muted: darkMode ? 'text-stone-400' : 'text-stone-500',
    faint: darkMode ? 'text-stone-500' : 'text-stone-400',
    field: darkMode
        ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-stone-600'
        : 'border-stone-200 bg-stone-50 text-stone-950 placeholder:text-stone-400',
    primaryButton: darkMode
        ? 'bg-white text-stone-950 hover:bg-stone-200'
        : 'bg-stone-950 text-white hover:bg-stone-800',
    secondaryButton: darkMode
        ? 'border-white/10 text-stone-200 hover:bg-white/[0.06]'
        : 'border-stone-200 text-stone-700 hover:bg-stone-100',
    hoverRow: darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-stone-50/70'
});

export const focusRing = 'outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15';
export const focusRingWithin = 'transition focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/15';

export function PageHeader({ title, description, actions, badge, darkMode }) {
    const surfaces = adminSurfaces(darkMode);
    return (
        <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className={`text-3xl font-black tracking-tighter md:text-4xl ${darkMode ? 'text-white' : 'text-stone-950'}`}>
                        {title}
                    </h2>
                    {badge}
                </div>
                {description ? <p className={`mt-1 text-sm ${surfaces.muted}`}>{description}</p> : null}
            </div>
            {actions ? <div className="flex flex-col gap-2 sm:flex-row">{actions}</div> : null}
        </header>
    );
}

export function Panel({ title, description, actions, footer, children, darkMode, className = '' }) {
    const surfaces = adminSurfaces(darkMode);
    return (
        <section className={`overflow-hidden rounded-2xl border ${surfaces.panel} ${className}`}>
            {title ? (
                <div className={`flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${surfaces.divider}`}>
                    <div className="min-w-0">
                        <h3 className="text-sm font-black tracking-tight">{title}</h3>
                        {description ? <p className={`mt-1 text-xs leading-5 ${surfaces.muted}`}>{description}</p> : null}
                    </div>
                    {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
                </div>
            ) : null}
            <div className="p-5">{children}</div>
            {footer ? (
                <div className={`flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${surfaces.divider}`}>
                    {footer}
                </div>
            ) : null}
        </section>
    );
}

export function Field({ label, hint, htmlFor, children, className = '', darkMode }) {
    const surfaces = adminSurfaces(darkMode);
    return (
        <div className={`min-w-0 ${className}`}>
            <label className="block text-sm font-bold" htmlFor={htmlFor}>{label}</label>
            <div className="mt-2">{children}</div>
            {hint ? <p className={`mt-1.5 text-xs leading-5 ${surfaces.muted}`}>{hint}</p> : null}
        </div>
    );
}

export const inputClass = (darkMode) => (
    `w-full rounded-lg border px-3 py-2.5 text-sm font-semibold ${adminSurfaces(darkMode).field} ${focusRing}`
);

export function Notice({ tone = 'info', children, darkMode }) {
    const tones = {
        success: darkMode
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
            : 'border-emerald-100 bg-emerald-50 text-emerald-700',
        error: darkMode
            ? 'border-red-500/20 bg-red-500/10 text-red-300'
            : 'border-red-100 bg-red-50 text-red-700',
        info: darkMode
            ? 'border-white/10 bg-white/[0.04] text-stone-300'
            : 'border-stone-200 bg-stone-50 text-stone-600'
    };
    return (
        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${tones[tone] || tones.info}`} role="status">
            {children}
        </div>
    );
}

export function EmptyState({ icon, title, description, action, darkMode }) {
    const surfaces = adminSurfaces(darkMode);
    return (
        <div className={`rounded-2xl border px-6 py-14 text-center ${surfaces.panel}`}>
            {icon ? <div className={`mb-3 flex justify-center ${surfaces.faint}`}>{icon}</div> : null}
            <p className="text-lg font-black">{title}</p>
            {description ? <p className={`mt-1 text-sm ${surfaces.muted}`}>{description}</p> : null}
            {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
        </div>
    );
}

export function Toggle({ checked, onChange, label, disabled, id }) {
    return (
        <button
            aria-pressed={checked}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-white/15'}`}
            disabled={disabled}
            id={id}
            onClick={() => onChange?.(!checked)}
            type="button"
        >
            <span className="sr-only">{label}</span>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
        </button>
    );
}

export function StatusDot({ tone = 'stone', label, darkMode }) {
    const tones = {
        emerald: darkMode ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-emerald-100 bg-emerald-50 text-emerald-700',
        amber: darkMode ? 'border-amber-500/20 bg-amber-500/10 text-amber-300' : 'border-amber-100 bg-amber-50 text-amber-700',
        stone: darkMode ? 'border-white/10 bg-white/[0.04] text-stone-300' : 'border-stone-200 bg-stone-100 text-stone-600'
    };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold ${tones[tone] || tones.stone}`}>
            {label}
        </span>
    );
}

export function LoadingPanel({ label = 'Chargement…', darkMode }) {
    const surfaces = adminSurfaces(darkMode);
    return (
        <div className={`flex min-h-40 items-center justify-center gap-3 rounded-2xl border text-sm font-semibold ${surfaces.panel} ${surfaces.muted}`}>
            <Loader2 className="animate-spin" size={16} /> {label}
        </div>
    );
}
