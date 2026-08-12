'use client';

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

const aggregateConnections = (instagram, facebook) => {
  const directInstagram = Boolean(
    instagram?.connected && instagram?.instagramAvailable
  );
  const facebookInstagram = Boolean(
    facebook?.connected && facebook?.instagramAvailable
  );
  const facebookAvailable = Boolean(
    facebook?.connected && facebook?.facebookAvailable
  );
  const connected = directInstagram || facebookInstagram || facebookAvailable;
  const loading = instagram?.status === 'loading' || facebook?.status === 'loading';
  const selectionRequired = facebook?.status === 'selection_required';

  return {
    connected,
    status: connected
      ? 'connected'
      : selectionRequired
        ? 'selection_required'
        : loading
          ? 'loading'
          : 'not_connected',
    instagramAvailable: directInstagram || facebookInstagram,
    facebookAvailable,
    instagramUsername: directInstagram
      ? instagram.instagramUsername
      : facebook?.instagramUsername || '',
    pageName: facebook?.pageName || '',
    directInstagramConnected: directInstagram,
    facebookConnected: facebookAvailable,
    instagram: instagram || EMPTY_CONNECTION,
    facebook: facebook || EMPTY_CONNECTION
  };
};

export default function useMetaConnection({ onConnectionChange } = {}) {
  const [instagram, setInstagram] = useState({ status: 'loading', connected: false });
  const [facebook, setFacebook] = useState({ status: 'loading', connected: false });
  const [connection, setConnection] = useState(() => aggregateConnections(
    { status: 'loading', connected: false },
    { status: 'loading', connected: false }
  ));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');
  const [fallbackProvider, setFallbackProvider] = useState('');
  const popupRef = useRef(null);
  const oauthOriginRef = useRef('');
  const onConnectionChangeRef = useRef(onConnectionChange);

  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange;
  }, [onConnectionChange]);

  const applyConnections = useCallback((nextInstagram, nextFacebook) => {
    const normalizedInstagram = nextInstagram || EMPTY_CONNECTION;
    const normalizedFacebook = nextFacebook || EMPTY_CONNECTION;
    const aggregate = aggregateConnections(normalizedInstagram, normalizedFacebook);
    setInstagram(normalizedInstagram);
    setFacebook(normalizedFacebook);
    setConnection(aggregate);
    onConnectionChangeRef.current?.(aggregate);
    return aggregate;
  }, []);

  const refreshStatus = useCallback(async () => {
    const [instagramResult, facebookResult] = await Promise.allSettled([
      getInstagramConnectionStatusAdmin(),
      getMetaConnectionStatusAdmin()
    ]);

    if (instagramResult.status === 'rejected' && facebookResult.status === 'rejected') {
      const failedInstagram = { status: 'error', connected: false };
      const failedFacebook = { status: 'error', connected: false };
      applyConnections(failedInstagram, failedFacebook);
      setError(instagramResult.reason?.message || facebookResult.reason?.message || 'Les connexions sociales sont indisponibles.');
      return null;
    }

    const nextInstagram = instagramResult.status === 'fulfilled'
      ? instagramResult.value
      : EMPTY_CONNECTION;
    const nextFacebook = facebookResult.status === 'fulfilled'
      ? facebookResult.value
      : EMPTY_CONNECTION;
    const aggregate = applyConnections(nextInstagram, nextFacebook);
    setError('');
    return { instagram: nextInstagram, facebook: nextFacebook, connection: aggregate };
  }, [applyConnections]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    const receiveOAuthResult = (event) => {
      if (!oauthOriginRef.current || event.origin !== oauthOriginRef.current) return;
      if (!['seconde-vie-instagram-oauth', 'seconde-vie-meta-oauth'].includes(event.data?.source)) return;
      refreshStatus();
    };
    window.addEventListener('message', receiveOAuthResult);
    return () => window.removeEventListener('message', receiveOAuthResult);
  }, [refreshStatus]);

  const pollPopup = useCallback(async (provider) => {
    let closedAttempts = 0;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 1500));
      const next = await refreshStatus();
      const providerState = provider === 'instagram' ? next?.instagram : next?.facebook;
      if (providerState && isTerminalStatus(providerState.status)) return;
      if (popupRef.current?.closed) {
        closedAttempts += 1;
        if (closedAttempts >= 12) return;
      } else {
        closedAttempts = 0;
      }
    }
  }, [refreshStatus]);

  const beginOAuth = useCallback(async (provider = 'instagram') => {
    const isInstagram = provider === 'instagram';
    const start = isInstagram ? startInstagramOAuthAdmin : startMetaOAuthAdmin;
    const popupName = isInstagram ? 'seconde-vie-instagram-oauth' : 'seconde-vie-meta-oauth';
    const providerLabel = isInstagram ? 'Instagram' : 'Facebook';
    setBusy(true);
    setError('');
    setFallbackUrl('');
    setFallbackProvider('');
    const popup = window.open('', popupName, 'popup=yes,width=720,height=820');

    try {
      const { url, callbackOrigin } = await start(window.location.origin);
      oauthOriginRef.current = callbackOrigin;
      if (!popup) {
        setFallbackUrl(url);
        setFallbackProvider(provider);
        setError(`La fenêtre ${providerLabel} a été bloquée. Ouvre la connexion dans cet onglet.`);
        return;
      }
      popup.document.title = `Connexion ${providerLabel}`;
      popup.document.body.textContent = `Ouverture de ${providerLabel}…`;
      popupRef.current = popup;
      popup.location.replace(url);
      pollPopup(provider);
    } catch (connectError) {
      popup?.close();
      setError(connectError?.message || `La connexion ${providerLabel} n’a pas démarré.`);
    } finally {
      setBusy(false);
    }
  }, [pollPopup]);

  const selectCandidate = useCallback(async (candidateId) => {
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
  }, [applyConnections, facebook.selectionSessionId, instagram, refreshStatus]);

  const verify = useCallback(async (provider = 'instagram') => {
    setBusy(true);
    setError('');
    try {
      if (provider === 'instagram') {
        applyConnections(await verifyInstagramConnectionAdmin(), facebook);
      } else {
        applyConnections(instagram, await verifyMetaConnectionAdmin());
      }
      return true;
    } catch (verificationError) {
      setError(verificationError?.message || 'Cette connexion doit être renouvelée.');
      await refreshStatus();
      return false;
    } finally {
      setBusy(false);
    }
  }, [applyConnections, facebook, instagram, refreshStatus]);

  const disconnect = useCallback(async (provider = 'instagram', confirmationText = '') => {
    setBusy(true);
    setError('');
    try {
      if (provider === 'instagram') await disconnectInstagramConnectionAdmin(confirmationText);
      else await disconnectMetaConnectionAdmin(confirmationText);
      await refreshStatus();
      return true;
    } catch (disconnectError) {
      setError(disconnectError?.message || 'La déconnexion n’a pas abouti.');
      return false;
    } finally {
      setBusy(false);
    }
  }, [refreshStatus]);

  const openFallback = useCallback(() => {
    if (fallbackUrl) window.location.assign(fallbackUrl);
  }, [fallbackUrl]);

  return {
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
    refreshStatus,
    openFallback,
    DISCONNECT_PHRASES: {
      instagram: 'DECONNECTER INSTAGRAM',
      facebook: 'DECONNECTER META'
    }
  };
}
