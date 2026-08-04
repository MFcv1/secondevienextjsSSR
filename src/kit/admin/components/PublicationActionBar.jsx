'use client';

import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Facebook, Globe, Instagram, Loader2 } from 'lucide-react';

/** Puce compacte du resume : une valeur, sa legende, rien de plus. */
function SummaryChip({ label, value, darkMode, tone = 'neutral' }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-[9.5px] font-extrabold ring-1 transition-colors duration-300 ${
        tone === 'accent'
          ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400'
          : tone === 'warn'
            ? 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400'
            : darkMode ? 'text-stone-300 ring-white/10' : 'text-stone-600 ring-black/[0.06]'
      }`}
    >
      {label && <span className={`text-[8px] font-bold uppercase tracking-[0.08em] ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>{label}</span>}
      {value}
    </span>
  );
}

/** Bouton principal : pilule sombre, pastille qui avance, appui elastique. */
function PrimaryAction({ label, Icon = ArrowRight, onClick, disabled, busy, darkMode, tone = 'default' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex min-h-10 shrink-0 items-center justify-between gap-2.5 overflow-hidden rounded-full py-1 pl-4 pr-1 text-[11px] font-extrabold transition-[transform,box-shadow,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.975] disabled:cursor-not-allowed disabled:opacity-45 ${
        tone === 'publish'
          ? 'bg-emerald-600 text-white shadow-[0_10px_26px_rgba(5,150,105,0.28)] hover:shadow-[0_14px_34px_rgba(5,150,105,0.36)]'
          : darkMode
            ? 'bg-white text-stone-950 shadow-[0_10px_26px_rgba(0,0,0,0.4)]'
            : 'bg-stone-950 text-white shadow-[0_10px_26px_rgba(28,25,23,0.2)] hover:shadow-[0_14px_34px_rgba(28,25,23,0.26)]'
      }`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-full motion-reduce:hidden"
      />
      <span className="relative whitespace-nowrap">{label}</span>
      <span className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 ${tone === 'publish' ? 'bg-white/15' : darkMode ? 'bg-black/[0.07]' : 'bg-white/12'}`}>
        {busy ? <Loader2 size={14} strokeWidth={2.2} className="animate-spin" /> : <Icon size={14} strokeWidth={2.2} />}
      </span>
    </button>
  );
}

/** Bouton secondaire : anneau discret, meme geometrie que le principal. */
function GhostAction({ label, Icon, onClick, disabled, darkMode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-[11px] font-extrabold ring-1 transition-[transform,background-color,color] duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.975] disabled:cursor-not-allowed disabled:opacity-40 ${
        darkMode ? 'text-stone-300 ring-white/12 hover:bg-white/[0.07] hover:text-white' : 'text-stone-600 ring-black/[0.08] hover:bg-white hover:text-stone-950'
      }`}
    >
      {Icon && <Icon size={14} strokeWidth={2} className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-x-0.5" />}
      {label}
    </button>
  );
}

/**
 * Pied du module de publication : les valeurs cles de l'ouvrage a gauche,
 * l'avancee du parcours a droite. Il vit dans la meme carte que la saisie
 * pour ne pas ajouter un bloc — ni une hauteur — de plus a l'ecran.
 */
export default function PublicationActionBar({
  darkMode = false,
  step,
  categoryLabel,
  priceLabel,
  stockLabel,
  photoCount,
  photoLimit,
  targets,
  connection,
  editData,
  uploading,
  progress = 0,
  message,
  messageTone = 'neutral',
  onBack,
  onNext,
  onPublish,
  onCancelEdit,
  publishLabel,
  retryMode = false,
}) {
  const instagramOn = Boolean(targets?.instagram) && Boolean(connection?.connected) && connection?.instagramAvailable !== false;
  const facebookOn = Boolean(targets?.facebook) && Boolean(connection?.connected);
  const isReview = step === 'review';

  return (
    <div className="pub-action-bar relative mt-3 shrink-0">
      {/* La jauge n'apparait que pendant l'envoi : au repos elle n'informe de rien. */}
      {uploading && (
        <div className={`absolute -top-px left-0 h-[2px] w-full overflow-hidden rounded-full ${darkMode ? 'bg-white/[0.06]' : 'bg-stone-950/[0.05]'}`}>
          <div
            className="pub-progress-fill h-full rounded-r-full bg-emerald-500"
            style={{ width: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%` }}
          />
        </div>
      )}

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {isReview ? (
            <>
              <SummaryChip darkMode={darkMode} value={<><Globe size={11} strokeWidth={2} />Site</>} tone="accent" />
              {instagramOn && <SummaryChip darkMode={darkMode} value={<><Instagram size={11} strokeWidth={2} />Instagram</>} tone="accent" />}
              {facebookOn && <SummaryChip darkMode={darkMode} value={<><Facebook size={11} strokeWidth={2} />Facebook</>} tone="accent" />}
              {!instagramOn && !facebookOn && <SummaryChip darkMode={darkMode} value="Réseaux désactivés" />}
            </>
          ) : (
            <>
              <SummaryChip darkMode={darkMode} label="Type" value={categoryLabel} tone={categoryLabel === 'Non choisie' ? 'warn' : 'neutral'} />
              <SummaryChip darkMode={darkMode} label="Prix" value={priceLabel} />
              <SummaryChip darkMode={darkMode} label="Stock" value={stockLabel} />
              <SummaryChip darkMode={darkMode} label="Photos" value={`${photoCount}/${photoLimit}`} tone={photoCount === 0 ? 'warn' : 'neutral'} />
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 sm:ml-auto">
          {message && (
            <p
              role={messageTone === 'error' ? 'alert' : 'status'}
              aria-live={messageTone === 'error' ? 'assertive' : 'polite'}
              className={`hidden max-w-[16rem] truncate rounded-full px-3 py-1.5 text-[10px] font-bold sm:block lg:max-w-[22rem] ${
                messageTone === 'error'
                  ? 'bg-red-500/10 text-red-600 ring-1 ring-red-500/15 dark:text-red-400'
                  : messageTone === 'success'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : darkMode ? 'bg-white/[0.06] text-stone-400' : 'bg-stone-500/10 text-stone-500'
              }`}
              title={message}
            >
              {message}
            </p>
          )}

          {editData && !isReview && (
            <GhostAction darkMode={darkMode} label="Annuler" onClick={onCancelEdit} disabled={uploading} />
          )}

          {isReview ? (
            <>
              <GhostAction darkMode={darkMode} label="Retour" Icon={ArrowLeft} onClick={onBack} disabled={uploading} />
              <PrimaryAction
                darkMode={darkMode}
                tone="publish"
                label={publishLabel}
                Icon={retryMode ? ArrowUpRight : Check}
                onClick={onPublish}
                busy={uploading}
                disabled={uploading}
              />
            </>
          ) : (
            <PrimaryAction
              darkMode={darkMode}
              label="Suivant"
              Icon={ArrowRight}
              onClick={onNext}
              busy={uploading}
              disabled={uploading}
            />
          )}
        </div>

        {/* Sur mobile le message passe sous la ligne d'actions plutot que de la casser. */}
        {message && (
          <p
            className={`w-full truncate rounded-full px-3 py-1.5 text-[10px] font-bold sm:hidden ${
              messageTone === 'error'
                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                : messageTone === 'success'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : darkMode ? 'bg-white/[0.06] text-stone-400' : 'bg-stone-500/10 text-stone-500'
            }`}
            title={message}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
