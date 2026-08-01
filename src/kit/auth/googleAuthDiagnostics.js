'use client';

import { logClientPerf } from '../shared/clientPerf.js';

const GOOGLE_AUTH_DIAGNOSTICS_KEY = 'secondevie:google-auth-diagnostics:v1';
const GOOGLE_AUTH_DIAGNOSTICS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const GOOGLE_AUTH_DIAGNOSTICS_LIMIT = 12;

const readUnderlyingMessage = (error) => String(
  error?.customData?.message
  || error?.customData?._tokenResponse?.error?.message
  || ''
).slice(0, 500);

export const classifyGoogleAuthError = (error, { online = true } = {}) => {
  const code = String(error?.code || 'auth/unknown');
  const underlyingMessage = readUnderlyingMessage(error);

  if (code === 'auth/network-request-failed') {
    if (!online) return 'offline';
    if (/timeout|timed out|aborted/i.test(underlyingMessage)) return 'auth-fetch-timeout';
    if (/failed to fetch|load failed|networkerror/i.test(underlyingMessage)) return 'auth-fetch-failed';
    return 'firebase-popup-transport';
  }
  if (code === 'auth/popup-blocked') return 'popup-blocked';
  if (code === 'auth/popup-closed-by-user') return 'popup-closed';
  if (code === 'auth/cancelled-popup-request') return 'popup-conflict';
  if (code === 'auth/google-not-prepared') return 'runtime-not-prepared';
  if (code === 'auth/unauthorized-domain') return 'unauthorized-domain';
  if (code === 'auth/operation-not-allowed') return 'provider-disabled';
  return 'firebase-auth-error';
};

const readStoredDiagnostics = () => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(GOOGLE_AUTH_DIAGNOSTICS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - GOOGLE_AUTH_DIAGNOSTICS_TTL_MS;
    return parsed.filter((entry) => Number(entry?.at) >= cutoff).slice(-GOOGLE_AUTH_DIAGNOSTICS_LIMIT);
  } catch {
    return [];
  }
};

export const readGoogleAuthDiagnostics = () => readStoredDiagnostics();

export const beginGoogleAuthAttempt = () => ({
  id: globalThis.crypto?.randomUUID?.() || `google-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  startedAt: typeof performance !== 'undefined' ? performance.now() : Date.now(),
});

export const recordGoogleAuthDiagnostic = ({ attempt, phase, outcome, error = null }) => {
  const online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  const code = error?.code ? String(error.code) : null;
  const category = error ? classifyGoogleAuthError(error, { online }) : null;
  const entry = {
    at: Date.now(),
    attemptId: attempt?.id || null,
    phase,
    outcome,
    code,
    category,
    online,
  };

  logClientPerf(`auth.google.${phase}`, attempt?.startedAt || Date.now(), {
    phase: outcome,
    code,
    category,
    online,
    attemptId: entry.attemptId,
  });

  if (typeof window !== 'undefined') {
    try {
      const next = [...readStoredDiagnostics(), entry].slice(-GOOGLE_AUTH_DIAGNOSTICS_LIMIT);
      window.localStorage.setItem(GOOGLE_AUTH_DIAGNOSTICS_KEY, JSON.stringify(next));
    } catch {
      // Diagnostics must never block authentication in restricted browsers.
    }
  }

  return entry;
};

export const getGoogleAuthErrorMessage = (error) => {
  if (error?.code === 'auth/unauthorized-domain') {
    return 'Connexion Google bloquee : domaine non autorise dans Firebase Authentication.';
  }
  if (error?.code === 'auth/operation-not-allowed') {
    return 'Connexion Google desactivee dans Firebase Authentication.';
  }
  if (error?.code === 'auth/popup-blocked') return 'Fenetre Google bloquee par le navigateur.';
  if (error?.code === 'auth/popup-closed-by-user') return 'Connexion Google annulee.';
  if (error?.code === 'auth/cancelled-popup-request') return 'Une autre connexion Google a remplace cette tentative.';
  if (error?.code === 'auth/network-request-failed') {
    return 'Le transport Firebase ou Google a ete interrompu. Verifiez la fenetre Google puis reessayez.';
  }
  if (error?.code === 'auth/google-not-prepared') {
    return 'Google n est pas encore pret. Relancez la preparation puis reconnectez-vous.';
  }
  return 'Connexion Google impossible pour le moment.';
};
