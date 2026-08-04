'use client';

import { Check, Facebook, Globe, Instagram, Link2, Lock } from 'lucide-react';

/** Interrupteur iOS reutilise par les cartes de destination. */
function SwitchTrack({ on, disabled = false, darkMode = false }) {
  return (
    <span
      aria-hidden="true"
      className={`relative h-[26px] w-[44px] shrink-0 rounded-full ring-1 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        disabled
          ? (darkMode ? 'bg-white/[0.06] ring-white/10' : 'bg-stone-200/70 ring-black/[0.04]')
          : on
            ? 'bg-emerald-500 ring-emerald-500'
            : (darkMode ? 'bg-stone-700 ring-white/10' : 'bg-stone-300 ring-black/[0.05]')
      }`}
    >
      <span
        className={`absolute left-[3px] top-1/2 h-[20px] w-[20px] -translate-y-1/2 rounded-full bg-white shadow-[0_2px_6px_rgba(28,25,23,0.28)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${on ? 'translate-x-[18px]' : 'translate-x-0'}`}
      />
    </span>
  );
}

/**
 * Carte de destination : une seule ligne de lecture (icone, nom, effet),
 * un seul geste (toute la carte est cliquable).
 */
function DestinationCard({
  id,
  Icon,
  title,
  subtitle,
  hint,
  accent,
  selected,
  locked = false,
  disabled = false,
  darkMode = false,
  onToggle,
}) {
  const interactive = !locked && !disabled;
  const Element = interactive ? 'button' : 'div';

  return (
    <Element
      {...(interactive ? { type: 'button', role: 'switch', 'aria-checked': selected, onClick: onToggle } : {})}
      data-destination={id}
      className={`group relative flex w-full items-center gap-3.5 overflow-hidden rounded-[20px] p-3.5 text-left ring-1 transition-[transform,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${interactive ? 'cursor-pointer active:scale-[0.985]' : ''} ${
        selected
          ? (darkMode ? 'bg-white/[0.07] ring-white/20' : 'bg-white ring-black/[0.09] shadow-[0_12px_30px_rgba(28,25,23,0.08)]')
          : disabled
            ? (darkMode ? 'bg-white/[0.02] ring-white/[0.06] opacity-55' : 'bg-stone-50 ring-black/[0.04] opacity-60')
            : (darkMode ? 'bg-white/[0.025] ring-white/10 hover:bg-white/[0.05]' : 'bg-[#F8F7F4] ring-black/[0.05] hover:bg-white hover:ring-black/[0.08]')
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-r-full transition-opacity duration-500 ${selected ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundColor: accent }}
      />

      <span
        className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[14px] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
        style={{
          backgroundColor: selected ? accent : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(28,25,23,0.05)'),
          color: selected ? '#fff' : accent,
        }}
      >
        <Icon size={19} strokeWidth={1.8} />
        {selected && (
          <span className="pub-pop absolute -bottom-1 -right-1 grid h-[18px] w-[18px] place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-[#11110f]">
            <Check size={11} strokeWidth={3} />
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[12.5px] font-extrabold tracking-[-0.015em]">{title}</span>
          {locked && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.1em] ${darkMode ? 'bg-white/10 text-stone-300' : 'bg-stone-950/[0.06] text-stone-500'}`}>
              <Lock size={8} strokeWidth={2.6} />Toujours
            </span>
          )}
        </span>
        <span className={`mt-0.5 block truncate text-[10px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{subtitle}</span>
        {hint && <span className="mt-1 block text-[9px] font-bold text-amber-600 dark:text-amber-400">{hint}</span>}
      </span>

      {locked ? (
        <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
          <Check size={14} strokeWidth={3} />
        </span>
      ) : (
        <SwitchTrack on={selected} disabled={disabled} darkMode={darkMode} />
      )}
    </Element>
  );
}

/**
 * Bloc « Où publier ». Le site est acquis, Instagram et Facebook
 * s'ajoutent en un geste. La connexion Meta elle-meme se pilote depuis
 * l'en-tete du module : c'est un prerequis, pas une option d'ecran.
 */
export default function PublicationDestinations({
  darkMode = false,
  targets,
  onTargetsChange,
  connection,
  onConnectRequest,
  disabled = false,
}) {
  const connected = Boolean(connection?.connected);
  const instagramAvailable = connected && connection?.instagramAvailable !== false;
  const accountLabel = connection?.instagramUsername
    ? `@${connection.instagramUsername}`
    : connection?.pageName || '';

  const toggleTarget = (key) => {
    if (disabled) return;
    onTargetsChange({ ...targets, [key]: !targets[key] });
  };

  return (
    <div>
      <div className="space-y-2.5">
        <DestinationCard
          id="site"
          Icon={Globe}
          title="Site Seconde Vie"
          subtitle="Fiche produit, catalogue et recherche"
          accent="#8B5C42"
          selected
          locked
          darkMode={darkMode}
        />
        <DestinationCard
          id="instagram"
          Icon={Instagram}
          title="Instagram"
          subtitle={instagramAvailable ? `Publication photo · ${accountLabel}` : 'Publication photo dans le fil'}
          hint={connected && !instagramAvailable ? 'Aucun compte Instagram professionnel lié à cette Page.' : ''}
          accent="#C13584"
          selected={Boolean(targets.instagram) && instagramAvailable}
          disabled={disabled || !instagramAvailable}
          darkMode={darkMode}
          onToggle={() => toggleTarget('instagram')}
        />
        <DestinationCard
          id="facebook"
          Icon={Facebook}
          title="Facebook"
          subtitle={connected ? `Page · ${connection.pageName || 'Seconde Vie'}` : 'Publication sur la Page'}
          accent="#0866FF"
          selected={Boolean(targets.facebook) && connected}
          disabled={disabled || !connected}
          darkMode={darkMode}
          onToggle={() => toggleTarget('facebook')}
        />
      </div>

      {!connected && (
        <button
          type="button"
          onClick={onConnectRequest}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-[16px] px-3 py-3 text-[10px] font-extrabold ring-1 transition-colors duration-300 ${darkMode ? 'bg-black/25 text-stone-300 ring-white/10 hover:bg-black/35' : 'bg-[#F8F7F4] text-stone-600 ring-black/[0.05] hover:bg-white'}`}
        >
          <Link2 size={12} strokeWidth={2} />
          Connecter un compte Meta pour activer Instagram et Facebook
        </button>
      )}

    </div>
  );
}
