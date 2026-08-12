'use client';

import React from 'react';
import { AlertCircle, Facebook, Instagram, Link2, RefreshCw, ShieldCheck } from 'lucide-react';

const STATUS_COPY = {
  loading: 'Vérification…',
  not_connected: 'Réseaux non connectés',
  selection_required: 'Choisir la Page',
  connected: 'Réseaux connectés',
  error: 'Réseaux indisponibles'
};

const DOT_TONE = {
  connected: 'bg-emerald-500',
  error: 'bg-red-500',
  loading: 'bg-stone-400',
  not_connected: 'bg-amber-500',
  selection_required: 'bg-amber-500'
};

export default function MetaConnectionBadge({ darkMode = false, meta, disabled = false }) {
  const {
    connection,
    instagram,
    facebook,
    busy,
    error,
    fallbackUrl,
    fallbackProvider,
    beginOAuth,
    selectCandidate,
    verify,
    disconnect,
    openFallback,
    DISCONNECT_PHRASES,
  } = meta;

  const [open, setOpen] = React.useState(false);
  const [disconnectProvider, setDisconnectProvider] = React.useState('');
  const [disconnectText, setDisconnectText] = React.useState('');
  const wrapperRef = React.useRef(null);

  const status = connection.status || 'not_connected';
  const connected = Boolean(connection.connected);
  const directInstagram = Boolean(connection.directInstagramConnected);
  const facebookConnected = Boolean(connection.facebookConnected);
  const accountLabel = connection.instagramUsername
    ? `@${connection.instagramUsername}`
    : connection.pageName || STATUS_COPY[status] || STATUS_COPY.not_connected;

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

  React.useEffect(() => {
    if (facebook.status === 'selection_required') setOpen(true);
  }, [facebook.status]);

  const beginDisconnect = (provider) => {
    setDisconnectProvider(provider);
    setDisconnectText('');
  };

  const confirmDisconnect = async () => {
    const done = await disconnect(disconnectProvider, disconnectText);
    if (done) {
      setDisconnectProvider('');
      setDisconnectText('');
    }
  };

  const disconnectPhrase = DISCONNECT_PHRASES[disconnectProvider] || '';
  const needsAttention = !connected && status !== 'loading';
  const hasDetails = connected || facebook.status === 'selection_required' || Boolean(error);
  const providerCard = darkMode
    ? 'bg-white/[0.03] ring-white/10'
    : 'bg-[#f8f7f4] ring-black/[0.06]';
  const secondaryAction = darkMode
    ? 'text-stone-400 hover:text-white'
    : 'text-stone-500 hover:text-stone-950';

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => (hasDetails ? setOpen((value) => !value) : beginOAuth('instagram'))}
        disabled={disabled || busy || status === 'loading'}
        aria-expanded={open}
        title={connected ? `Connexions sociales : ${accountLabel}` : 'Connecter Instagram ou Facebook'}
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
          {connected ? accountLabel : status === 'loading' ? STATUS_COPY.loading : 'Connecter les réseaux'}
        </span>
      </button>

      {open && (
        <div className={`absolute right-0 top-[calc(100%+8px)] z-40 w-[min(21rem,calc(100vw-2rem))] rounded-[18px] p-3.5 shadow-[0_22px_60px_rgba(28,25,23,0.18)] ring-1 ${darkMode ? 'bg-[#181816] ring-white/12' : 'bg-white ring-black/[0.08]'}`}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-extrabold">Connexions sociales</span>
            {connected && <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Prêtes</span>}
          </div>

          <div className={`mt-3 rounded-[14px] p-3 ring-1 ${providerCard}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[10px] font-extrabold"><Instagram size={12} />Instagram</p>
                <p className="mt-0.5 truncate text-[9px] text-stone-400">
                  {directInstagram
                    ? `@${instagram.instagramUsername || connection.instagramUsername} · connexion directe`
                    : connection.instagramAvailable
                      ? `@${connection.instagramUsername} · via Facebook`
                      : 'Non connecté'}
                </p>
              </div>
              {!directInstagram && (
                <button type="button" onClick={() => beginOAuth('instagram')} disabled={busy} className="shrink-0 rounded-full px-2.5 py-1.5 text-[8px] font-extrabold ring-1 ring-black/[0.08] disabled:opacity-40 dark:ring-white/12">
                  {connection.instagramAvailable ? 'Connecter en direct' : 'Connecter'}
                </button>
              )}
            </div>
            {directInstagram && (
              <div className="mt-2 flex flex-wrap gap-3">
                <button type="button" onClick={() => verify('instagram')} disabled={busy} className={`inline-flex items-center gap-1 text-[8px] font-bold disabled:opacity-40 ${secondaryAction}`}><ShieldCheck size={10} />Vérifier</button>
                <button type="button" onClick={() => beginOAuth('instagram')} disabled={busy} className={`inline-flex items-center gap-1 text-[8px] font-bold disabled:opacity-40 ${secondaryAction}`}><RefreshCw size={10} />Réassocier</button>
                <button type="button" onClick={() => beginDisconnect('instagram')} disabled={busy} className="text-[8px] font-bold text-red-600 disabled:opacity-40">Déconnecter</button>
              </div>
            )}
          </div>

          <div className={`mt-2 rounded-[14px] p-3 ring-1 ${providerCard}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[10px] font-extrabold"><Facebook size={12} />Facebook</p>
                <p className="mt-0.5 truncate text-[9px] text-stone-400">{facebookConnected ? connection.pageName || 'Page connectée' : 'Non connecté'}</p>
              </div>
              {!facebookConnected && facebook.status !== 'selection_required' && (
                <button type="button" onClick={() => beginOAuth('facebook')} disabled={busy} className="shrink-0 rounded-full px-2.5 py-1.5 text-[8px] font-extrabold ring-1 ring-black/[0.08] disabled:opacity-40 dark:ring-white/12">Connecter</button>
              )}
            </div>
            {facebookConnected && (
              <div className="mt-2 flex flex-wrap gap-3">
                <button type="button" onClick={() => verify('facebook')} disabled={busy} className={`inline-flex items-center gap-1 text-[8px] font-bold disabled:opacity-40 ${secondaryAction}`}><ShieldCheck size={10} />Vérifier</button>
                <button type="button" onClick={() => beginOAuth('facebook')} disabled={busy} className={`inline-flex items-center gap-1 text-[8px] font-bold disabled:opacity-40 ${secondaryAction}`}><RefreshCw size={10} />Réassocier</button>
                <button type="button" onClick={() => beginDisconnect('facebook')} disabled={busy} className="text-[8px] font-bold text-red-600 disabled:opacity-40">Déconnecter</button>
              </div>
            )}
          </div>

          {facebook.status === 'selection_required' && (
            <div className="mt-3 space-y-1.5">
              <p className={`text-[9px] font-extrabold uppercase tracking-[0.1em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Quelle Page utiliser ?</p>
              {facebook.candidates?.map((candidate) => (
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

          {disconnectProvider && (
            <div className="mt-3 rounded-[13px] bg-red-500/5 p-2.5 ring-1 ring-red-500/15">
              <label htmlFor="social-disconnect-confirmation" className="text-[9px] font-bold text-red-700 dark:text-red-400">Écris {disconnectPhrase} pour déconnecter</label>
              <input
                id="social-disconnect-confirmation"
                value={disconnectText}
                onChange={(event) => setDisconnectText(event.target.value)}
                className="mt-1.5 w-full rounded-[10px] bg-white px-2.5 py-2 text-[10px] font-bold text-stone-950 outline-none ring-1 ring-red-500/20 focus:ring-red-500/50"
              />
              <div className="mt-2 flex items-center gap-2">
                <button type="button" disabled={busy || disconnectText !== disconnectPhrase} onClick={confirmDisconnect} className="rounded-full bg-red-600 px-3.5 py-2 text-[9px] font-extrabold text-white transition-opacity disabled:opacity-40">Confirmer</button>
                <button type="button" onClick={() => setDisconnectProvider('')} className={`text-[9px] font-bold ${secondaryAction}`}>Annuler</button>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="mt-3 flex items-start gap-2 rounded-[13px] bg-red-500/10 px-3 py-2.5 text-[9px] font-bold leading-4 text-red-700 ring-1 ring-red-500/15 dark:text-red-400">
              <AlertCircle size={12} className="mt-px shrink-0" strokeWidth={2} />
              <span>
                {error}
                {fallbackUrl && (
                  <button type="button" onClick={openFallback} className="mt-2 block rounded-full bg-red-600 px-3 py-1.5 text-white">Ouvrir {fallbackProvider === 'facebook' ? 'Facebook' : 'Instagram'} dans cet onglet</button>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
