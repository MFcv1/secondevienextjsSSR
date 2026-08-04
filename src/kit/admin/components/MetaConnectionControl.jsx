import { useCallback, useEffect, useRef, useState } from 'react';
import {
  disconnectInstagramConnectionAdmin,
  disconnectMetaConnectionAdmin,
  getInstagramConnectionStatusAdmin,
  getMetaConnectionStatusAdmin,
  selectMetaAssetAdmin,
  startInstagramOAuthAdmin,
  startMetaOAuthAdmin,
  verifyInstagramConnectionAdmin,
  verifyMetaConnectionAdmin
} from '../metaPublicationClient';

const EMPTY_CONNECTION = { status: 'not_connected', connected: false };
const isTerminalStatus = (status) => ['connected', 'selection_required'].includes(status);

const MetaConnectionControl = ({
  darkMode = false,
  enabled,
  onEnabledChange,
  onConnectionChange,
  targets,
  onTargetsChange
}) => {
  const [instagram, setInstagram] = useState({ status: 'loading', connected: false });
  const [facebook, setFacebook] = useState({ status: 'loading', connected: false });
  const [busy, setBusy] = useState(false);
  const [oauthProvider, setOauthProvider] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');
  const [disconnectProvider, setDisconnectProvider] = useState('');
  const [disconnectText, setDisconnectText] = useState('');
  const popupRef = useRef(null);
  const oauthOriginRef = useRef('');
  const onEnabledChangeRef = useRef(onEnabledChange);
  const onConnectionChangeRef = useRef(onConnectionChange);

  useEffect(() => {
    onEnabledChangeRef.current = onEnabledChange;
    onConnectionChangeRef.current = onConnectionChange;
  }, [onConnectionChange, onEnabledChange]);

  const applyConnections = useCallback((nextInstagram, nextFacebook) => {
    const normalizedInstagram = nextInstagram || EMPTY_CONNECTION;
    const normalizedFacebook = nextFacebook || EMPTY_CONNECTION;
    setInstagram(normalizedInstagram);
    setFacebook(normalizedFacebook);
    const directInstagram = normalizedInstagram.connected && normalizedInstagram.instagramAvailable;
    const facebookInstagram = normalizedFacebook.connected && normalizedFacebook.instagramAvailable;
    const facebookAvailable = normalizedFacebook.connected && normalizedFacebook.facebookAvailable;
    const composite = {
      connected: directInstagram || facebookInstagram || facebookAvailable,
      status: directInstagram || facebookInstagram || facebookAvailable ? 'connected' : 'not_connected',
      instagramAvailable: directInstagram || facebookInstagram,
      facebookAvailable,
      instagramUsername: directInstagram
        ? normalizedInstagram.instagramUsername
        : normalizedFacebook.instagramUsername,
      pageName: normalizedFacebook.pageName || '',
      directInstagramConnected: directInstagram,
      facebookConnected: facebookAvailable
    };
    onConnectionChangeRef.current?.(composite);
    if (!composite.connected) onEnabledChangeRef.current(false);
    return composite;
  }, []);

  const refreshStatus = useCallback(async () => {
    const [instagramResult, facebookResult] = await Promise.allSettled([
      getInstagramConnectionStatusAdmin(),
      getMetaConnectionStatusAdmin()
    ]);
    if (instagramResult.status === 'rejected' && facebookResult.status === 'rejected') {
      setError(instagramResult.reason?.message || 'Les connexions sociales sont indisponibles.');
      setInstagram({ status: 'error', connected: false });
      setFacebook({ status: 'error', connected: false });
      return null;
    }
    const nextInstagram = instagramResult.status === 'fulfilled' ? instagramResult.value : EMPTY_CONNECTION;
    const nextFacebook = facebookResult.status === 'fulfilled' ? facebookResult.value : EMPTY_CONNECTION;
    const composite = applyConnections(nextInstagram, nextFacebook);
    setError('');
    return { instagram: nextInstagram, facebook: nextFacebook, composite };
  }, [applyConnections]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    const receiveOAuthResult = async (event) => {
      if (!oauthOriginRef.current || event.origin !== oauthOriginRef.current) return;
      if (!['seconde-vie-instagram-oauth', 'seconde-vie-meta-oauth'].includes(event.data?.source)) return;
      const provider = event.data.source === 'seconde-vie-instagram-oauth' ? 'instagram' : 'facebook';
      const next = await refreshStatus();
      const providerState = provider === 'instagram' ? next?.instagram : next?.facebook;
      setOauthProvider('');
      if (providerState && isTerminalStatus(providerState.status)) {
        setError('');
        setNotice(provider === 'instagram'
          ? `Instagram @${providerState.instagramUsername} est connecté et prêt à publier.`
          : 'La Page Facebook est connectée.');
        return;
      }
      setNotice('');
      setError(event.data?.message || (event.data?.status === 'cancelled'
        ? 'Connexion annulée.'
        : 'La connexion n’a pas été confirmée. Réessaie.'));
    };
    window.addEventListener('message', receiveOAuthResult);
    return () => window.removeEventListener('message', receiveOAuthResult);
  }, [refreshStatus]);

  const pollPopup = async (provider) => {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 1500));
      const next = await refreshStatus();
      const providerState = provider === 'instagram' ? next?.instagram : next?.facebook;
      if (providerState && isTerminalStatus(providerState.status)) {
        setOauthProvider('');
        setNotice(provider === 'instagram'
          ? `Instagram @${providerState.instagramUsername} est connecté et prêt à publier.`
          : 'La Page Facebook est connectée.');
        return;
      }
      if (popupRef.current?.closed) {
        setOauthProvider('');
        setNotice('');
        setError('La fenêtre s’est fermée sans confirmation du serveur. Relance la connexion.');
        return;
      }
    }
    setOauthProvider('');
    setError('La confirmation prend trop de temps. Relance la connexion.');
  };

  const beginOAuth = async (provider) => {
    setBusy(true);
    setOauthProvider(provider);
    setError('');
    setNotice('');
    setFallbackUrl('');
    const isInstagram = provider === 'instagram';
    const popupName = isInstagram ? 'seconde-vie-instagram-oauth' : 'seconde-vie-meta-oauth';
    const title = isInstagram ? 'Connexion Instagram' : 'Connexion Facebook';
    const start = isInstagram ? startInstagramOAuthAdmin : startMetaOAuthAdmin;
    const popup = window.open('', popupName, 'popup=yes,width=720,height=820');
    try {
      const { url, callbackOrigin } = await start(window.location.origin);
      oauthOriginRef.current = callbackOrigin;
      if (!popup) {
        setOauthProvider('');
        setFallbackUrl(url);
        setError(`La fenêtre ${title} a été bloquée.`);
        return;
      }
      popup.document.title = title;
      popup.document.body.textContent = `Ouverture de ${isInstagram ? 'Instagram' : 'Facebook'}…`;
      popupRef.current = popup;
      popup.location.replace(url);
      pollPopup(provider);
    } catch (connectError) {
      popup?.close();
      setOauthProvider('');
      setError(connectError?.message || `La ${title.toLowerCase()} n’a pas démarré.`);
    } finally {
      setBusy(false);
    }
  };

  const connectOrToggle = async () => {
    const instagramAvailable = (instagram.connected && instagram.instagramAvailable)
      || (facebook.connected && facebook.instagramAvailable);
    const facebookAvailable = facebook.connected && facebook.facebookAvailable;
    if (instagramAvailable || facebookAvailable) {
      onEnabledChange(!enabled);
      return;
    }
    await beginOAuth('instagram');
  };

  const selectCandidate = async (candidateId) => {
    setBusy(true);
    setError('');
    try {
      const nextFacebook = await selectMetaAssetAdmin(facebook.selectionSessionId, candidateId);
      applyConnections(instagram, nextFacebook);
    } catch (selectionError) {
      setError(selectionError?.message || 'Cette Page n’a pas pu être sélectionnée.');
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  };

  const verify = async (provider) => {
    setBusy(true);
    setError('');
    try {
      const next = provider === 'instagram'
        ? await verifyInstagramConnectionAdmin()
        : await verifyMetaConnectionAdmin();
      applyConnections(provider === 'instagram' ? next : instagram, provider === 'facebook' ? next : facebook);
    } catch (verificationError) {
      setError(verificationError?.message || 'Cette connexion doit être renouvelée.');
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    setError('');
    try {
      if (disconnectProvider === 'instagram') await disconnectInstagramConnectionAdmin(disconnectText);
      else await disconnectMetaConnectionAdmin(disconnectText);
      setDisconnectProvider('');
      setDisconnectText('');
      await refreshStatus();
    } catch (disconnectError) {
      setError(disconnectError?.message || 'La déconnexion n’a pas abouti.');
    } finally {
      setBusy(false);
    }
  };

  const directInstagram = instagram.connected && instagram.instagramAvailable;
  const facebookInstagram = facebook.connected && facebook.instagramAvailable;
  const instagramAvailable = directInstagram || facebookInstagram;
  const facebookAvailable = facebook.connected && facebook.facebookAvailable;
  const connected = instagramAvailable || facebookAvailable;
  const loading = instagram.status === 'loading' || facebook.status === 'loading';
  const connectedLabel = directInstagram
    ? `Instagram · @${instagram.instagramUsername}`
    : facebookInstagram
      ? `@${facebook.instagramUsername} · via Facebook`
    : facebook.pageName || 'Réseaux connectés';
  const confirmation = disconnectProvider === 'instagram' ? 'DECONNECTER INSTAGRAM' : 'DECONNECTER META';

  return (
    <div className="relative">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={connected ? 'Activer la publication sociale' : 'Connecter Instagram'}
        disabled={busy || loading || Boolean(oauthProvider)}
        onClick={connectOrToggle}
        className={`flex min-h-9 items-center gap-2 rounded-full py-1.5 pl-3 pr-2 text-[9px] font-extrabold ring-1 transition-[transform,background-color,color,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none ${enabled && connected ? (darkMode ? 'bg-white text-stone-950 ring-white' : 'bg-stone-950 text-white ring-stone-950') : (darkMode ? 'text-stone-300 ring-white/10 hover:bg-white/5' : 'text-stone-600 ring-black/[0.07] hover:bg-stone-50')}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-stone-400'}`} aria-hidden="true" />
        <span>{connected ? connectedLabel : 'Connecter Instagram'}</span>
        <span className={`relative h-5 w-9 shrink-0 rounded-full ring-1 transition-colors duration-300 ${enabled && connected ? (darkMode ? 'bg-stone-200 ring-black/10' : 'bg-white/20 ring-white/15') : (darkMode ? 'bg-stone-700 ring-white/10' : 'bg-stone-200 ring-black/[0.04]')}`} aria-hidden="true">
          <span className={`absolute left-[3px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${enabled && connected ? `translate-x-[15px] ${darkMode ? 'bg-stone-950' : 'bg-white'}` : `translate-x-0 ${darkMode ? 'bg-stone-300' : 'bg-stone-500'}`}`} />
        </span>
      </button>

      {connected && enabled && (
        <div className={`absolute right-0 top-11 z-30 w-72 rounded-[16px] p-3 shadow-[0_18px_50px_rgba(28,25,23,0.14)] ring-1 ${darkMode ? 'bg-stone-900 ring-white/10' : 'bg-white ring-black/[0.07]'}`}>
          <p className="text-[9px] font-extrabold">Destinations</p>
          <p className={`mt-0.5 text-[8px] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Instagram fonctionne sans compte Facebook.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className={`flex items-center gap-2 rounded-[11px] px-2.5 py-2 text-[9px] font-bold ring-1 ${targets.instagram && instagramAvailable ? 'text-emerald-700 ring-emerald-500/30' : 'text-stone-500 ring-black/[0.06]'} ${!instagramAvailable ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}>
              <input type="checkbox" checked={targets.instagram && instagramAvailable} disabled={!instagramAvailable} onChange={(event) => onTargetsChange({ ...targets, instagram: event.target.checked })} className="accent-emerald-600" />
              Instagram
            </label>
            <label className={`flex items-center gap-2 rounded-[11px] px-2.5 py-2 text-[9px] font-bold ring-1 ${targets.facebook && facebookAvailable ? 'text-emerald-700 ring-emerald-500/30' : 'text-stone-500 ring-black/[0.06]'} ${!facebookAvailable ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}>
              <input type="checkbox" checked={targets.facebook && facebookAvailable} disabled={!facebookAvailable} onChange={(event) => onTargetsChange({ ...targets, facebook: event.target.checked })} className="accent-emerald-600" />
              Facebook
            </label>
          </div>

          <div className={`mt-3 rounded-[11px] p-2.5 ring-1 ${directInstagram ? (darkMode ? 'bg-emerald-400/5 ring-emerald-400/20' : 'bg-emerald-50/70 ring-emerald-600/15') : (darkMode ? 'ring-white/10' : 'ring-black/[0.06]')}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[8px] font-extrabold">Instagram</p>
                  <span className={`rounded-full px-1.5 py-0.5 text-[7px] font-extrabold ${directInstagram ? 'bg-emerald-100 text-emerald-700' : facebookInstagram ? (darkMode ? 'bg-white/10 text-stone-300' : 'bg-stone-100 text-stone-600') : (darkMode ? 'bg-white/10 text-stone-400' : 'bg-stone-100 text-stone-500')}`}>
                    {directInstagram ? 'Connecté' : facebookInstagram ? 'Via Facebook' : 'Non connecté'}
                  </span>
                </div>
                <p className="mt-0.5 text-[8px] text-stone-400">{directInstagram ? `@${instagram.instagramUsername} · connexion directe` : facebookInstagram ? `@${facebook.instagramUsername} · via Facebook` : 'Non connecté'}</p>
              </div>
              {!directInstagram && <button type="button" onClick={() => beginOAuth('instagram')} disabled={busy || oauthProvider === 'instagram'} className="shrink-0 rounded-full px-2.5 py-1.5 text-[8px] font-extrabold ring-1 ring-black/[0.08] disabled:cursor-wait disabled:opacity-55">{oauthProvider === 'instagram' ? 'Connexion…' : facebookInstagram ? 'Connecter en direct' : 'Connecter'}</button>}
            </div>
            {directInstagram && <div className="mt-2 flex gap-3"><button type="button" onClick={() => verify('instagram')} disabled={busy} className="text-[8px] font-bold text-stone-500 underline underline-offset-2">Vérifier</button><button type="button" onClick={() => beginOAuth('instagram')} disabled={busy} className="text-[8px] font-bold text-stone-500 underline underline-offset-2">Réassocier</button><button type="button" onClick={() => { setDisconnectProvider('instagram'); setDisconnectText(''); }} disabled={busy} className="text-[8px] font-bold text-red-600">Déconnecter</button></div>}
          </div>

          {notice && <p aria-live="polite" className={`mt-3 rounded-[10px] px-2.5 py-2 text-[8px] font-bold ${darkMode ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>{notice}</p>}

          <div className={`mt-2 rounded-[11px] p-2.5 ring-1 ${darkMode ? 'ring-white/10' : 'ring-black/[0.06]'}`}>
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-[8px] font-extrabold">Facebook <span className="font-medium text-stone-400">· facultatif</span></p><p className="mt-0.5 text-[8px] text-stone-400">{facebookAvailable ? facebook.pageName : 'Ajoute une Page seulement si nécessaire.'}</p></div>
              {!facebookAvailable && <button type="button" onClick={() => beginOAuth('facebook')} disabled={busy} className="rounded-full px-2.5 py-1.5 text-[8px] font-extrabold ring-1 ring-black/[0.08]">Ajouter</button>}
            </div>
            {facebookAvailable && <div className="mt-2 flex gap-3"><button type="button" onClick={() => verify('facebook')} disabled={busy} className="text-[8px] font-bold text-stone-500 underline underline-offset-2">Vérifier</button><button type="button" onClick={() => beginOAuth('facebook')} disabled={busy} className="text-[8px] font-bold text-stone-500 underline underline-offset-2">Réassocier</button><button type="button" onClick={() => { setDisconnectProvider('facebook'); setDisconnectText(''); }} disabled={busy} className="text-[8px] font-bold text-red-600">Déconnecter</button></div>}
          </div>

          {disconnectProvider && (
            <div className="mt-3 rounded-[11px] bg-red-500/5 p-2 ring-1 ring-red-500/15">
              <label htmlFor="social-disconnect-confirmation" className="text-[8px] font-bold text-red-700">Écris {confirmation}</label>
              <input id="social-disconnect-confirmation" value={disconnectText} onChange={(event) => setDisconnectText(event.target.value)} className="mt-1.5 w-full rounded-[9px] bg-white px-2 py-1.5 text-[9px] text-stone-950 outline-none ring-1 ring-red-500/20 focus:ring-red-500/50" />
              <button type="button" disabled={busy || disconnectText !== confirmation} onClick={disconnect} className="mt-2 rounded-full bg-red-600 px-3 py-1.5 text-[8px] font-extrabold text-white disabled:opacity-40">Confirmer la déconnexion</button>
            </div>
          )}
        </div>
      )}

      {facebook.status === 'selection_required' && (
        <div className={`absolute right-0 top-11 z-30 w-72 rounded-[16px] p-3 shadow-[0_18px_50px_rgba(28,25,23,0.14)] ring-1 ${darkMode ? 'bg-stone-900 ring-white/10' : 'bg-white ring-black/[0.07]'}`}>
          <p className="text-[10px] font-extrabold">Quelle Page Facebook utiliser ?</p>
          <div className="mt-2 space-y-1.5">{facebook.candidates?.map((candidate) => <button key={candidate.id} type="button" disabled={busy} onClick={() => selectCandidate(candidate.id)} className={`w-full rounded-[11px] px-3 py-2 text-left ring-1 ${darkMode ? 'ring-white/10 hover:bg-white/5' : 'ring-black/[0.06] hover:bg-stone-50'}`}><span className="block text-[9px] font-extrabold">{candidate.pageName}</span><span className="mt-0.5 block text-[8px] text-stone-400">{candidate.instagramUsername ? `@${candidate.instagramUsername}` : 'Facebook uniquement'}</span></button>)}</div>
        </div>
      )}

      {error && <div role="alert" className="absolute right-0 top-11 z-40 w-72 rounded-[12px] bg-red-50 px-3 py-2 text-[8px] font-bold text-red-700 shadow-[0_14px_36px_rgba(127,29,29,0.12)] ring-1 ring-red-500/15"><p>{error}</p>{fallbackUrl && <button type="button" onClick={() => window.location.assign(fallbackUrl)} className="mt-2 rounded-full bg-red-700 px-3 py-1.5 text-white">Ouvrir la connexion</button>}</div>}
    </div>
  );
};

export default MetaConnectionControl;
