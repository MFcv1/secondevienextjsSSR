'use client';

import React from 'react';
import { AlertCircle, Link2, RefreshCw, ShieldCheck } from 'lucide-react';

const STATUS_COPY = {
  loading: 'Vérification…',
  not_connected: 'Meta non connecté',
  selection_required: 'Choisir la Page',
  connected: 'Meta connecté',
  error: 'Meta indisponible'
};

const DOT_TONE = {
  connected: 'bg-emerald-500',
  error: 'bg-red-500',
  loading: 'bg-stone-400',
  not_connected: 'bg-amber-500',
  selection_required: 'bg-amber-500'
};

/**
 * Etat du compte Meta dans l'en-tete du module, a cote du rail d'etapes :
 * la connexion est un prerequis global, pas une option de l'ecran diffusion.
 * Le detail (Page, verification, coupure) vit dans un panneau deroulant.
 */
export default function MetaConnectionBadge({ darkMode = false, meta, disabled = false }) {
  const {
    connection,
    busy,
    error,
    fallbackUrl,
    beginOAuth,
    selectCandidate,
    verify,
    disconnect,
    openFallback,
    DISCONNECT_PHRASE,
  } = meta;

  const [open, setOpen] = React.useState(false);
  const [disconnectOpen, setDisconnectOpen] = React.useState(false);
  const [disconnectText, setDisconnectText] = React.useState('');
  const wrapperRef = React.useRef(null);

  const status = connection.status || 'not_connected';
  const connected = Boolean(connection.connected);
  const accountLabel = connection.instagramUsername
    ? `@${connection.instagramUsername}`
    : connection.pageName || STATUS_COPY[status] || STATUS_COPY.not_connected;

  // Le panneau se referme des qu'on regarde ailleurs : il ne doit jamais gener la saisie.
  React.useEffect(() => {
    if (!open) return undefined;
    const closeOnOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  // Seul un choix de Page en attente s'impose : une anomalie se signale par
  // la pastille, sans recouvrir le formulaire.
  React.useEffect(() => {
    if (status === 'selection_required') setOpen(true);
  }, [status]);

  const confirmDisconnect = async () => {
    const done = await disconnect(disconnectText);
    if (done) {
      setDisconnectText('');
      setDisconnectOpen(false);
      setOpen(false);
    }
  };

  const needsAttention = !connected && status !== 'loading';
  const hasDetails = connected || status === 'selection_required' || Boolean(error);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => (hasDetails ? setOpen((value) => !value) : beginOAuth())}
        disabled={disabled || busy || status === 'loading'}
        aria-expanded={open}
        title={connected ? `Compte Meta : ${accountLabel}` : 'Connecter un compte Meta'}
        className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-[10px] font-extrabold transition-[background-color,color,transform] duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] disabled:cursor-wait disabled:opacity-50 ${
          connected
            ? (darkMode ? 'text-stone-300 ring-1 ring-white/12 hover:bg-white/[0.07]' : 'text-stone-600 ring-1 ring-black/[0.08] hover:bg-stone-50')
            : needsAttention
              ? (darkMode ? 'bg-white text-stone-950' : 'bg-stone-950 text-white')
              : (darkMode ? 'text-stone-500 ring-1 ring-white/10' : 'text-stone-400 ring-1 ring-black/[0.06]')
        }`}
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_TONE[status] || DOT_TONE.not_connected}`} aria-hidden="true" />
        {!connected && <Link2 size={11} strokeWidth={2.2} aria-hidden="true" />}
        <span className="max-w-[9rem] truncate">
          {connected ? accountLabel : status === 'loading' ? STATUS_COPY.loading : 'Connecter Meta'}
        </span>
      </button>

      {open && (
        <div
          className={`absolute right-0 top-[calc(100%+8px)] z-40 w-[min(19rem,calc(100vw-2rem))] rounded-[18px] p-3.5 shadow-[0_22px_60px_rgba(28,25,23,0.18)] ring-1 ${darkMode ? 'bg-[#181816] ring-white/12' : 'bg-white ring-black/[0.08]'}`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-[10px] font-extrabold">{connected ? accountLabel : STATUS_COPY[status]}</span>
            {connected && (
              <span className="shrink-0 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Connecté</span>
            )}
          </div>

          {connected && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" onClick={verify} disabled={busy} className={`inline-flex items-center gap-1 text-[9px] font-bold disabled:opacity-40 ${darkMode ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-950'}`}><ShieldCheck size={11} strokeWidth={2} />Vérifier</button>
              <button type="button" onClick={beginOAuth} disabled={busy} className={`inline-flex items-center gap-1 text-[9px] font-bold disabled:opacity-40 ${darkMode ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-950'}`}><RefreshCw size={11} strokeWidth={2} />Réassocier</button>
              <button type="button" onClick={() => setDisconnectOpen((value) => !value)} disabled={busy} className="text-[9px] font-bold text-red-600 disabled:opacity-40">Déconnecter</button>
            </div>
          )}

          {!connected && (
            <button
              type="button"
              onClick={beginOAuth}
              disabled={busy}
              className={`mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-full text-[10px] font-extrabold transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] disabled:opacity-50 ${darkMode ? 'bg-white text-stone-950' : 'bg-stone-950 text-white'}`}
            >
              <Link2 size={12} strokeWidth={2} />Connecter Meta
            </button>
          )}

          {status === 'selection_required' && (
            <div className="mt-3 space-y-1.5">
              <p className={`text-[9px] font-extrabold uppercase tracking-[0.1em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Quelle Page utiliser ?</p>
              {connection.candidates?.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  disabled={busy}
                  onClick={() => selectCandidate(candidate.id)}
                  className={`w-full rounded-[13px] px-3 py-2.5 text-left ring-1 transition-colors duration-200 ${darkMode ? 'bg-white/[0.03] ring-white/10 hover:bg-white/[0.07]' : 'bg-white ring-black/[0.06] hover:bg-stone-50'}`}
                >
                  <span className="block text-[10px] font-extrabold">{candidate.pageName}</span>
                  <span className="mt-0.5 block text-[9px] text-stone-400">{candidate.instagramUsername ? `@${candidate.instagramUsername}` : 'Facebook uniquement'}</span>
                </button>
              ))}
            </div>
          )}

          {connected && disconnectOpen && (
            <div className="mt-3 rounded-[13px] bg-red-500/5 p-2.5 ring-1 ring-red-500/15">
              <label htmlFor="meta-disconnect-confirmation" className="text-[9px] font-bold text-red-700 dark:text-red-400">Écris {DISCONNECT_PHRASE} pour déconnecter</label>
              <input
                id="meta-disconnect-confirmation"
                value={disconnectText}
                onChange={(event) => setDisconnectText(event.target.value)}
                className="mt-1.5 w-full rounded-[10px] bg-white px-2.5 py-2 text-[10px] font-bold text-stone-950 outline-none ring-1 ring-red-500/20 focus:ring-red-500/50"
              />
              <button type="button" disabled={busy || disconnectText !== DISCONNECT_PHRASE} onClick={confirmDisconnect} className="mt-2 rounded-full bg-red-600 px-3.5 py-2 text-[9px] font-extrabold text-white transition-opacity disabled:opacity-40">Confirmer la déconnexion</button>
            </div>
          )}

          {error && (
            <div role="alert" className="mt-3 flex items-start gap-2 rounded-[13px] bg-red-500/10 px-3 py-2.5 text-[9px] font-bold leading-4 text-red-700 ring-1 ring-red-500/15 dark:text-red-400">
              <AlertCircle size={12} className="mt-px shrink-0" strokeWidth={2} />
              <span>
                {error}
                {fallbackUrl && (
                  <button type="button" onClick={openFallback} className="mt-2 block rounded-full bg-red-600 px-3 py-1.5 text-white">Ouvrir Meta dans cet onglet</button>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
