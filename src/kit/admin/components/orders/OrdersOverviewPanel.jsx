'use client';

import { formatPrice } from './orderPresentation';
import { insetClass, mutedTextClass } from './orderTones';

const LINES = [
    ['todo', 'À traiter', 'bg-amber-500'],
    ['waiting', 'En attente', 'bg-indigo-500'],
    ['done', 'Clôturées', 'bg-emerald-500'],
];

/**
 * Panneau affiche tant qu'aucune commande n'est selectionnee.
 * Il remplace un vide par une information : ce qui reste a faire, et sur
 * quel perimetre les compteurs sont calcules.
 */
export default function OrdersOverviewPanel({ darkMode = false, onSelectSegment, segment, summary }) {
    return (
        <div className="flex h-full min-h-0 flex-col justify-center px-6 py-8">
            <p className={`text-[10px] font-extrabold uppercase tracking-[0.12em] ${mutedTextClass(darkMode)}`}>
                À traiter
            </p>
            <p className="mt-2 text-[34px] font-extrabold leading-none tracking-[-0.055em] tabular-nums">
                {summary.todo}
            </p>
            <p className={`mt-1.5 text-[11px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                {summary.todo === 0
                    ? 'Aucune commande n’attend une action.'
                    : `${summary.todo} dossier${summary.todo > 1 ? 's' : ''} attend${summary.todo > 1 ? 'ent' : ''} une action de votre part.`}
            </p>

            <div className={`mt-5 divide-y rounded-[18px] px-3 ring-1 ${insetClass(darkMode)} ${darkMode ? 'divide-white/10' : 'divide-black/[0.055]'}`}>
                {LINES.map(([id, label, color]) => (
                    <button
                        key={id}
                        type="button"
                        aria-pressed={segment === id}
                        onClick={() => onSelectSegment(id)}
                        className={`flex w-full items-center justify-between rounded-[10px] px-1 py-3 text-left transition-colors duration-200 ${
                            segment === id
                                ? (darkMode ? 'bg-white/[0.08]' : 'bg-white')
                                : (darkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-white/70')
                        }`}
                    >
                        <span className={`flex items-center gap-2 text-[11px] font-semibold ${segment === id ? (darkMode ? 'text-white' : 'text-stone-950') : 'text-stone-500'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
                            {label}
                        </span>
                        <strong className="text-[13px] tabular-nums">{summary[id]}</strong>
                    </button>
                ))}
            </div>

            <div className={`mt-5 rounded-[18px] px-4 py-3.5 ring-1 ${insetClass(darkMode)}`}>
                <p className={`text-[10px] font-extrabold uppercase tracking-[0.12em] ${mutedTextClass(darkMode)}`}>Encaissements bruts</p>
                <p className="mt-1.5 text-[17px] font-extrabold tabular-nums tracking-[-0.03em]">
                    {formatPrice(summary.grossCapturedAmount)}
                </p>
                <p className={`mt-1 text-[10.5px] leading-4 ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>
                    Calculé sur les {summary.total} commandes chargées, remboursements non déduits.
                </p>
            </div>

            <p className={`mt-auto pt-6 text-[10.5px] leading-4 ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>
                Sélectionnez une commande pour voir son parcours horodaté, son panier et l’action attendue.
            </p>
        </div>
    );
}
