import { useCallback, useEffect, useRef, useState } from 'react';
import {
  disconnectMetaConnectionAdmin,
  getMetaConnectionStatusAdmin,
  selectMetaAssetAdmin,
  startMetaOAuthAdmin,
  verifyMetaConnectionAdmin
} from '../metaPublicationClient';

const STATUS_LABELS = {
  loading: 'Vérification…',
  not_connected: 'Connecter Meta',
  selection_required: 'Choisir une Page',
  connected: 'Meta connecté',
  error: 'Réessayer'
};

const isTerminalStatus = (status) => ['connected', 'selection_required'].includes(status);

const MetaConnectionControl = ({
  darkMode = false,
  enabled,
  onEnabledChange,
  onConnectionChange,
  targets,
  onTargetsChange
}) => {
  const [connection, setConnection] = useState({ status: 'loading', connected: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnectText, setDisconnectText] = useState('');
  const popupRef = useRef(null);
  const oauthOriginRef = useRef('');
  const onEnabledChangeRef = useRef(onEnabledChange);
  const onConnectionChangeRef = useRef(onConnectionChange);

  useEffect(() => {
    onEnabledChangeRef.current = onEnabledChange;
    onConnectionChangeRef.current = onConnectionChange;
  }, [onConnectionChange, onEnabledChange]);

  const applyConnection = useCallback((next) => {
    const normalized = next || { status: 'not_connected', connected: false };
    setConnection(normalized);
    if (isTerminalStatus(normalized.status)) setFallbackUrl('');
    onConnectionChangeRef.current?.(normalized);
    if (!normalized.connected) onEnabledChangeRef.current(false);
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const next = await getMetaConnectionStatusAdmin();
      applyConnection(next);
      setError('');
      return next;
    } catch (statusError) {
      setConnection({ status: 'error', connected: false });
      setError(statusError?.message || 'Connexion Meta indisponible.');
      return null;
    }
  }, [applyConnection]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    const receiveOAuthResult = (event) => {
      if (!oauthOriginRef.current || event.origin !== oauthOriginRef.current) return;
      if (event.data?.source !== 'seconde-vie-meta-oauth') return;
      refreshStatus();
    };
    window.addEventListener('message', receiveOAuthResult);
    return () => window.removeEventListener('message', receiveOAuthResult);
  }, [refreshStatus]);

  const pollPopup = async () => {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 1500));
      const next = await refreshStatus();
      if (next && isTerminalStatus(next.status)) return;
      if (popupRef.current?.closed) return;
    }
  };

  const beginOAuth = async () => {
    setBusy(true);
    setError('');
    setFallbackUrl('');
    const popup = window.open('', 'seconde-vie-meta-oauth', 'popup=yes,width=720,height=820');
    if (!popup) {
      try {
        const { url, callbackOrigin } = await startMetaOAuthAdmin(window.location.origin);
        oauthOriginRef.current = callbackOrigin;
        setFallbackUrl(url);
        setError('La fenêtre Meta a été bloquée. Ouvre la connexion dans cet onglet.');
      } catch (connectError) {
        setError(connectError?.message || 'La connexion Meta n’a pas démarré.');
      } finally {
        setBusy(false);
      }
      return;
    }
    popup.document.title = 'Connexion Meta';
    popup.document.body.textContent = 'Ouverture de Meta…';
    popupRef.current = popup;
    try {
      const { url, callbackOrigin } = await startMetaOAuthAdmin(window.location.origin);
      oauthOriginRef.current = callbackOrigin;
      popup.location.replace(url);
      pollPopup();
    } catch (connectError) {
      popup.close();
      setError(connectError?.message || 'La connexion Meta n’a pas démarré.');
    } finally {
      setBusy(false);
    }
  };

  const connect = async () => {
    if (connection.connected) {
      onEnabledChange(!enabled);
      return;
    }
    await beginOAuth();
  };

  const selectCandidate = async (candidateId) => {
    setBusy(true);
    setError('');
    try {
      const next = await selectMetaAssetAdmin(connection.selectionSessionId, candidateId);
      applyConnection(next);
    } catch (selectionError) {
      setError(selectionError?.message || 'Cette Page n’a pas pu être sélectionnée.');
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setError('');
    try {
      applyConnection(await verifyMetaConnectionAdmin());
    } catch (verificationError) {
      setError(verificationError?.message || 'La connexion Meta doit être renouvelée.');
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    setError('');
    try {
      applyConnection(await disconnectMetaConnectionAdmin(disconnectText));
      setDisconnectOpen(false);
      setDisconnectText('');
    } catch (disconnectError) {
      setError(disconnectError?.message || 'La déconnexion Meta n’a pas abouti.');
    } finally {
      setBusy(false);
    }
  };

  const status = connection.status || 'not_connected';
  const connectedLabel = connection.instagramUsername
    ? `@${connection.instagramUsername}`
    : connection.pageName || 'Meta connecté';

  return (
    <div className="relative">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={connection.connected ? 'Publier aussi sur les réseaux Meta' : 'Connecter le compte Meta'}
        disabled={busy || status === 'loading'}
        onClick={connect}
        className={`flex min-h-9 items-center gap-2 rounded-full py-1.5 pl-3 pr-2 text-[9px] font-extrabold ring-1 transition-[transform,background-color,color,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none ${enabled && connection.connected ? (darkMode ? 'bg-white text-stone-950 ring-white' : 'bg-stone-950 text-white ring-stone-950') : (darkMode ? 'text-stone-300 ring-white/10 hover:bg-white/5' : 'text-stone-600 ring-black/[0.07] hover:bg-stone-50')}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${connection.connected ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : 'bg-stone-400'}`} aria-hidden="true" />
        <span>{connection.connected ? connectedLabel : (STATUS_LABELS[status] || STATUS_LABELS.not_connected)}</span>
        <span className={`relative h-5 w-9 shrink-0 rounded-full ring-1 transition-colors duration-300 ${enabled && connection.connected ? (darkMode ? 'bg-stone-200 ring-black/10' : 'bg-white/20 ring-white/15') : (darkMode ? 'bg-stone-700 ring-white/10' : 'bg-stone-200 ring-black/[0.04]')}`} aria-hidden="true">
          <span className={`absolute left-[3px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${enabled && connection.connected ? `translate-x-[15px] ${darkMode ? 'bg-stone-950' : 'bg-white'}` : `translate-x-0 ${darkMode ? 'bg-stone-300' : 'bg-stone-500'}`}`} />
        </span>
      </button>

      {connection.connected && enabled && (
        <div className={`absolute right-0 top-11 z-30 w-64 rounded-[16px] p-3 shadow-[0_18px_50px_rgba(28,25,23,0.14)] ring-1 ${darkMode ? 'bg-stone-900 ring-white/10' : 'bg-white ring-black/[0.07]'}`}>
          <p className="text-[9px] font-extrabold">Destinations</p>
          <p className={`mt-0.5 text-[8px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>{connection.pageName}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className={`flex cursor-pointer items-center gap-2 rounded-[11px] px-2.5 py-2 text-[9px] font-bold ring-1 ${targets.instagram ? 'text-emerald-700 ring-emerald-500/30' : 'text-stone-500 ring-black/[0.06]'} ${!connection.instagramAvailable ? 'cursor-not-allowed opacity-40' : ''}`}>
              <input
                type="checkbox"
                checked={targets.instagram && connection.instagramAvailable}
                disabled={!connection.instagramAvailable}
                onChange={(event) => onTargetsChange({ ...targets, instagram: event.target.checked })}
                className="accent-emerald-600"
              />
              Instagram
            </label>
            <label className={`flex cursor-pointer items-center gap-2 rounded-[11px] px-2.5 py-2 text-[9px] font-bold ring-1 ${targets.facebook ? 'text-emerald-700 ring-emerald-500/30' : 'text-stone-500 ring-black/[0.06]'}`}>
              <input
                type="checkbox"
                checked={targets.facebook}
                onChange={(event) => onTargetsChange({ ...targets, facebook: event.target.checked })}
                className="accent-emerald-600"
              />
              Facebook
            </label>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button type="button" onClick={verify} disabled={busy} className={`text-[8px] font-bold underline decoration-stone-300 underline-offset-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Vérifier</button>
            <button type="button" onClick={beginOAuth} disabled={busy} className={`text-[8px] font-bold underline decoration-stone-300 underline-offset-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Réassocier</button>
            <button type="button" onClick={() => setDisconnectOpen((open) => !open)} disabled={busy} className="text-[8px] font-bold text-red-600">Déconnecter</button>
          </div>
          {disconnectOpen && (
            <div className="mt-3 rounded-[11px] bg-red-500/5 p-2 ring-1 ring-red-500/15">
              <label htmlFor="meta-disconnect-confirmation" className="text-[8px] font-bold text-red-700">Écris DECONNECTER META</label>
              <input
                id="meta-disconnect-confirmation"
                value={disconnectText}
                onChange={(event) => setDisconnectText(event.target.value)}
                className="mt-1.5 w-full rounded-[9px] bg-white px-2 py-1.5 text-[9px] text-stone-950 outline-none ring-1 ring-red-500/20 focus:ring-red-500/50"
              />
              <button type="button" disabled={busy || disconnectText !== 'DECONNECTER META'} onClick={disconnect} className="mt-2 rounded-full bg-red-600 px-3 py-1.5 text-[8px] font-extrabold text-white disabled:opacity-40">Confirmer la déconnexion</button>
            </div>
          )}
        </div>
      )}

      {status === 'selection_required' && (
        <div className={`absolute right-0 top-11 z-30 w-72 rounded-[16px] p-3 shadow-[0_18px_50px_rgba(28,25,23,0.14)] ring-1 ${darkMode ? 'bg-stone-900 ring-white/10' : 'bg-white ring-black/[0.07]'}`}>
          <p className="text-[10px] font-extrabold">Quelle Page utiliser ?</p>
          <div className="mt-2 space-y-1.5">
            {connection.candidates?.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                disabled={busy}
                onClick={() => selectCandidate(candidate.id)}
                className={`w-full rounded-[11px] px-3 py-2 text-left ring-1 transition-colors ${darkMode ? 'ring-white/10 hover:bg-white/5' : 'ring-black/[0.06] hover:bg-stone-50'}`}
              >
                <span className="block text-[9px] font-extrabold">{candidate.pageName}</span>
                <span className="mt-0.5 block text-[8px] text-stone-400">{candidate.instagramUsername ? `@${candidate.instagramUsername}` : 'Facebook uniquement'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="absolute right-0 top-11 z-40 w-64 rounded-[12px] bg-red-50 px-3 py-2 text-[8px] font-bold text-red-700 ring-1 ring-red-500/15">
          <p>{error}</p>
          {fallbackUrl && <button type="button" onClick={() => window.location.assign(fallbackUrl)} className="mt-2 rounded-full bg-red-700 px-3 py-1.5 text-white">Ouvrir Meta dans cet onglet</button>}
        </div>
      )}
    </div>
  );
};

export default MetaConnectionControl;
