'use client';

import { getFirebaseAuth, loadAuthModule } from '../config/firebaseLazy';

const REDIRECT_KEYS = ['kit_auth_redirect_pending', 'kit_google_redirect_pending'];
const AUTH_ROUTES = ['/admin', '/checkout', '/wishlist', '/mes-commandes'];
const AUTH_CHANNEL = 'secondevie-auth';
const AUTH_SIGNAL_KEY = 'sv:auth-signal';
const initialSnapshot = Object.freeze({
  status: 'unknown',
  user: null,
  claims: Object.freeze({
    admin: false,
    superAdmin: false,
    authAssurance: 'none',
    authMethod: null,
    userVerified: false,
    authTime: 0,
  }),
  claimsStatus: 'idle',
  lastAuthMethod: null,
  authReady: false,
  error: null,
});

const runtime = globalThis.__svAuthStoreRuntime || {
  snapshot: initialSnapshot,
  listeners: new Set(),
  initializePromise: null,
  unsubscribe: null,
  claimsSequence: 0,
  channel: null,
  crossTabReady: false,
  sourceId: Math.random().toString(36).slice(2),
  lastBroadcastStatus: null,
  e2eInjected: false,
};
globalThis.__svAuthStoreRuntime = runtime;

const emitLegacyBridge = (snapshot) => {
  if (typeof window === 'undefined') return;
  window.__svAuthUser = snapshot.user || null;
  window.__svAuthIsAdmin = snapshot.claims.admin === true;
  window.dispatchEvent(new CustomEvent('sv:auth-user-changed', {
    detail: { user: snapshot.user || null, status: snapshot.status, source: 'auth-store' },
  }));
  window.dispatchEvent(new CustomEvent('sv:auth-admin-changed', {
    detail: { isAdmin: snapshot.claims.admin === true },
  }));
};

const publish = (patch) => {
  runtime.snapshot = Object.freeze({ ...runtime.snapshot, ...patch });
  emitLegacyBridge(runtime.snapshot);
  runtime.listeners.forEach((listener) => listener());
  return runtime.snapshot;
};

const handleCrossTabSignal = (signal) => {
  if (!signal || signal.sourceId === runtime.sourceId) return;
  void initializeAuthStore({ forceInitialize: true }).catch(() => {});
};

const setupCrossTabSync = () => {
  if (typeof window === 'undefined' || runtime.crossTabReady) return;
  runtime.crossTabReady = true;
  if ('BroadcastChannel' in window) {
    runtime.channel = new BroadcastChannel(AUTH_CHANNEL);
    runtime.channel.addEventListener('message', (event) => handleCrossTabSignal(event.data));
  }
  window.addEventListener('storage', (event) => {
    if (event.key !== AUTH_SIGNAL_KEY || !event.newValue) return;
    try {
      handleCrossTabSignal(JSON.parse(event.newValue));
    } catch {
      // Ignore malformed or legacy storage values.
    }
  });
  const isE2ERun = new URLSearchParams(window.location.search).has('e2e_run');
  const isSafeE2EHost = window.location.hostname === 'localhost'
    || window.location.hostname === '127.0.0.1'
    || window.location.hostname.endsWith('.hosted.app');
  if (isE2ERun && isSafeE2EHost) {
    window.__svE2EInjectAuthUser = (user) => {
      runtime.e2eInjected = true;
      syncAuthStoreUser(user || null, { lastAuthMethod: 'passkey' });
    };
  }
};

const broadcastAuthStatus = (status) => {
  if (typeof window === 'undefined' || runtime.lastBroadcastStatus === status) return;
  runtime.lastBroadcastStatus = status;
  const signal = { sourceId: runtime.sourceId, status, at: Date.now() };
  runtime.channel?.postMessage(signal);
  try {
    window.localStorage.setItem(AUTH_SIGNAL_KEY, JSON.stringify(signal));
  } catch {
    // BroadcastChannel remains the primary path when storage is unavailable.
  }
};

export const hasAuthSessionHint = () => {
  if (typeof window === 'undefined') return false;
  try {
    if (REDIRECT_KEYS.some((key) => window.sessionStorage.getItem(key) === 'true')) return true;
    if (Object.keys(window.localStorage).some((key) => key.startsWith('firebase:authUser:'))) return true;
  } catch {
    // Storage can be unavailable in hardened/private browsing contexts.
  }
  return AUTH_ROUTES.some((path) => window.location.pathname.startsWith(path));
};

const clearRedirectPending = () => {
  if (typeof window === 'undefined') return;
  REDIRECT_KEYS.forEach((key) => window.sessionStorage.removeItem(key));
};

const syncClaims = async (user) => {
  const sequence = ++runtime.claimsSequence;
  if (!user || user.isAnonymous) {
    publish({
      claims: { admin: false, superAdmin: false, authAssurance: 'none', authMethod: null, userVerified: false, authTime: 0 },
      claimsStatus: 'ready',
    });
    return;
  }
  publish({ claimsStatus: 'loading' });
  try {
    const { getIdTokenResult } = await loadAuthModule();
    const tokenResult = await getIdTokenResult(user, false);
    if (sequence !== runtime.claimsSequence) return;
    const superAdmin = tokenResult.claims.superAdmin === true;
    const firebaseProvider = tokenResult.claims.firebase?.sign_in_provider || null;
    const claimedMethod = tokenResult.claims.authMethod || tokenResult.claims.signInProvider || null;
    const verifiedPasskey = claimedMethod === 'passkey'
      && tokenResult.claims.authAssurance === 'aal2'
      && tokenResult.claims.userVerified === true;
    const google = firebaseProvider === 'google.com';
    publish({
      claims: {
        admin: tokenResult.claims.admin === true || superAdmin,
        superAdmin,
        authAssurance: verifiedPasskey || google ? 'aal2' : 'aal1',
        authMethod: verifiedPasskey ? 'passkey' : google ? 'google' : (claimedMethod || firebaseProvider || 'unknown'),
        userVerified: verifiedPasskey || google,
        authTime: Number(tokenResult.claims.auth_time || 0),
      },
      claimsStatus: 'ready',
    });
  } catch (error) {
    if (sequence !== runtime.claimsSequence) return;
    publish({
      claims: { admin: false, superAdmin: false, authAssurance: 'none', authMethod: null, userVerified: false, authTime: 0 },
      claimsStatus: 'error',
      error,
    });
  }
};

export const syncAuthStoreUser = (user, { lastAuthMethod } = {}) => {
  const status = user && !user.isAnonymous ? 'authenticated' : 'anonymous';
  publish({
    status,
    user: user || null,
    authReady: true,
    error: null,
    ...(lastAuthMethod ? { lastAuthMethod } : {}),
  });
  broadcastAuthStatus(status);
  void syncClaims(user || null);
};

export const initializeAuthStore = ({ forceInitialize = false } = {}) => {
  setupCrossTabSync();
  if (runtime.e2eInjected) return Promise.resolve(runtime.snapshot);
  if (runtime.unsubscribe || runtime.initializePromise) return runtime.initializePromise || Promise.resolve(runtime.snapshot);
  if (!forceInitialize && !hasAuthSessionHint()) {
    if (runtime.snapshot.status === 'unknown') publish({ status: 'anonymous', authReady: true, claimsStatus: 'ready' });
    return Promise.resolve(runtime.snapshot);
  }

  publish({ status: 'unknown', authReady: false, error: null });
  runtime.initializePromise = (async () => {
    const auth = await getFirebaseAuth();
    const { getRedirectResult, onIdTokenChanged } = await loadAuthModule();
    if (REDIRECT_KEYS.some((key) => window.sessionStorage.getItem(key) === 'true')) {
      try {
        await getRedirectResult(auth);
      } finally {
        clearRedirectPending();
      }
    }
    runtime.unsubscribe = onIdTokenChanged(auth, (user) => syncAuthStoreUser(user || null));
    return runtime.snapshot;
  })().catch((error) => {
    publish({ status: 'error', authReady: true, error });
    throw error;
  }).finally(() => {
    runtime.initializePromise = null;
  });
  return runtime.initializePromise;
};

export const getAuthSnapshot = () => runtime.snapshot;
export const getAuthServerSnapshot = () => initialSnapshot;
export const subscribeAuthStore = (listener) => {
  runtime.listeners.add(listener);
  return () => runtime.listeners.delete(listener);
};
export const resetAuthStoreAfterSignOut = () => syncAuthStoreUser(null);
