'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  disconnectMetaConnectionAdmin,
  getMetaConnectionStatusAdmin,
  selectMetaAssetAdmin,
  startMetaOAuthAdmin,
  verifyMetaConnectionAdmin
} from '../metaPublicationClient';

const isTerminalStatus = (status) => ['connected', 'selection_required'].includes(status);

const DISCONNECT_PHRASE = 'DECONNECTER META';

/**
 * Etat et actions du compte Meta (OAuth, choix de Page, verification, coupure).
 * Extrait du controle historique pour que l'ecran de diffusion puisse
 * presenter la connexion sans reimplementer le protocole.
 */
export default function useMetaConnection({ onConnectionChange } = {}) {
  const [connection, setConnection] = useState({ status: 'loading', connected: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');
  const popupRef = useRef(null);
  const oauthOriginRef = useRef('');
  const onConnectionChangeRef = useRef(onConnectionChange);

  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange;
  }, [onConnectionChange]);

  const applyConnection = useCallback((next) => {
    const normalized = next || { status: 'not_connected', connected: false };
    setConnection(normalized);
    if (isTerminalStatus(normalized.status)) setFallbackUrl('');
    onConnectionChangeRef.current?.(normalized);
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const next = await getMetaConnectionStatusAdmin();
      applyConnection(next);
      setError('');
      return next;
    } catch (statusError) {
      const failed = { status: 'error', connected: false };
      setConnection(failed);
      onConnectionChangeRef.current?.(failed);
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

  const pollPopup = useCallback(async () => {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 1500));
      const next = await refreshStatus();
      if (next && isTerminalStatus(next.status)) return;
      if (popupRef.current?.closed) return;
    }
  }, [refreshStatus]);

  const beginOAuth = useCallback(async () => {
    setBusy(true);
    setError('');
    setFallbackUrl('');
    const popup = window.open('', 'seconde-vie-meta-oauth', 'popup=yes,width=720,height=820');
    if (!popup) {
      try {
        const { url, callbackOrigin } = await startMetaOAuthAdmin(window.location.origin);
        oauthOriginRef.current = callbackOrigin;
        setFallbackUrl(url);
        setError('La fenetre Meta a ete bloquee. Ouvre la connexion dans cet onglet.');
      } catch (connectError) {
        setError(connectError?.message || 'La connexion Meta n’a pas demarre.');
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
      setError(connectError?.message || 'La connexion Meta n’a pas demarre.');
    } finally {
      setBusy(false);
    }
  }, [pollPopup]);

  const selectCandidate = useCallback(async (candidateId) => {
    setBusy(true);
    setError('');
    try {
      applyConnection(await selectMetaAssetAdmin(connection.selectionSessionId, candidateId));
    } catch (selectionError) {
      setError(selectionError?.message || 'Cette Page n’a pas pu etre selectionnee.');
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  }, [applyConnection, connection.selectionSessionId, refreshStatus]);

  const verify = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      applyConnection(await verifyMetaConnectionAdmin());
    } catch (verificationError) {
      setError(verificationError?.message || 'La connexion Meta doit etre renouvelee.');
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  }, [applyConnection, refreshStatus]);

  const disconnect = useCallback(async (confirmationText) => {
    setBusy(true);
    setError('');
    try {
      applyConnection(await disconnectMetaConnectionAdmin(confirmationText));
      return true;
    } catch (disconnectError) {
      setError(disconnectError?.message || 'La deconnexion Meta n’a pas abouti.');
      return false;
    } finally {
      setBusy(false);
    }
  }, [applyConnection]);

  const openFallback = useCallback(() => {
    if (fallbackUrl) window.location.assign(fallbackUrl);
  }, [fallbackUrl]);

  return {
    connection,
    busy,
    error,
    fallbackUrl,
    beginOAuth,
    selectCandidate,
    verify,
    disconnect,
    refreshStatus,
    openFallback,
    DISCONNECT_PHRASE
  };
}
