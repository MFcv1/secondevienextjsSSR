'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuthState } from '../contexts/AuthContext';
import { initializeAuthStore, resetAuthStoreAfterSignOut, syncAuthStoreUser } from '../auth/authStore';

const LegacyLoginModalIsland = dynamic(() => import('./LegacyLoginModalFullIsland'), {
  ssr: false,
  loading: () => null,
});

export const preloadLoginModal = () => {
  LegacyLoginModalIsland.preload?.();
  return import('./LegacyLoginModalFullIsland').catch(() => null);
};

const REDIRECT_KEY = 'kit_auth_redirect_pending';
const LEGACY_GOOGLE_REDIRECT_KEY = 'kit_google_redirect_pending';

const hasAuthRedirectPending = () => {
  if (typeof window === 'undefined') return false;
  try {
    return (
      window.sessionStorage.getItem(REDIRECT_KEY) === 'true' ||
      window.sessionStorage.getItem(LEGACY_GOOGLE_REDIRECT_KEY) === 'true'
    );
  } catch {
    return false;
  }
};

const hasPersistedFirebaseUser = () => {
  if (typeof window === 'undefined') return false;
  try {
    return Object.keys(window.localStorage).some((key) => key.startsWith('firebase:authUser:'));
  } catch {
    return false;
  }
};

export default function HeaderAccountIsland({ darkMode = false } = {}) {
  const [loginOpen, setLoginOpen] = useState(false);
  const authState = useAuthState();
  const user = authState.user;
  const isAdmin = authState.claims.admin;

  useEffect(() => {
    let cancelled = false;

    const handleOpenLogin = async () => {
      await preloadLoginModal();
      if (!cancelled) setLoginOpen(true);
    };

    window.addEventListener('sv:open-login', handleOpenLogin);
    void initializeAuthStore({
      forceInitialize: hasAuthRedirectPending() || hasPersistedFirebaseUser(),
    }).catch(() => {});

    return () => {
      cancelled = true;
      window.removeEventListener('sv:open-login', handleOpenLogin);
    };
  }, []);

  useEffect(() => {
    const isE2ERun = new URLSearchParams(window.location.search).has('e2e_run');
    const isSandboxHost = window.location.hostname.includes('hosted.app') || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isE2ERun || !isSandboxHost) return undefined;

    window.__svE2ELoginWithEmail = async ({ email, password }) => {
      const { getFirebaseAuth, loadAuthModule } = await import('../config/firebaseLazy');
      const auth = await getFirebaseAuth();
      const { signInWithEmailAndPassword } = await loadAuthModule();
      const result = await signInWithEmailAndPassword(auth, email, password);
      syncAuthStoreUser(result.user, { lastAuthMethod: 'password' });
      return {
        uid: result.user?.uid || null,
        email: result.user?.email || null,
        emailVerified: Boolean(result.user?.emailVerified),
      };
    };

    return () => {
      delete window.__svE2ELoginWithEmail;
    };
  }, []);

  const logout = async () => {
    const { getFirebaseAuth, loadAuthModule } = await import('../config/firebaseLazy');
    const auth = await getFirebaseAuth();
    const { signOut } = await loadAuthModule();
    await signOut(auth);
    resetAuthStoreAfterSignOut();
  };

  const loginButtonClass = `group hidden h-9 items-center gap-2 rounded-full px-3 text-inherit no-underline transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5C42]/25 dark:focus-visible:ring-[#D9B58D]/45 md:flex ${darkMode ? 'bg-white/[0.055] text-stone-300 ring-1 ring-white/[0.06] hover:bg-white/[0.12] hover:text-stone-50' : 'bg-white/70 text-stone-500 hover:bg-white hover:text-stone-900 dark:bg-white/[0.055] dark:text-stone-300 dark:ring-1 dark:ring-white/[0.06] dark:hover:bg-white/[0.12] dark:hover:text-stone-50'}`;
  const logoutButtonClass = `group flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/25 dark:focus-visible:ring-red-300/35 sm:w-auto sm:gap-2 sm:px-3 ${darkMode ? 'text-stone-300 hover:bg-red-400/10 hover:text-red-200' : 'text-stone-500 hover:bg-red-50 hover:text-red-600 dark:text-stone-300 dark:hover:bg-red-400/10 dark:hover:text-red-200'}`;
  const loginModal = loginOpen ? <LegacyLoginModalIsland open={loginOpen} onOpenChange={setLoginOpen} renderTrigger={false} /> : null;

  if (authState.status === 'unknown') {
    return (
      <div className="hidden h-9 w-[94px] animate-pulse rounded-full bg-stone-100/80 dark:bg-white/[0.055] md:block" aria-label="Vérification de la connexion" aria-busy="true" />
    );
  }

  if (user && !user.isAnonymous) {
    return (
      <>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <div className={`hidden rounded-full px-2.5 py-1 sm:block ${darkMode ? 'bg-emerald-400/10 ring-1 ring-emerald-300/10' : 'bg-emerald-50 dark:bg-emerald-400/10 dark:ring-1 dark:ring-emerald-300/10'}`}>
              <span className="cursor-default text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Admin</span>
            </div>
          ) : null}
          <button type="button" onClick={logout} className={logoutButtonClass} title="Se deconnecter" aria-label="Se deconnecter">
            <LogOut size={16} />
            <span className="hidden text-[9px] font-bold uppercase tracking-widest sm:inline">Quitter</span>
          </button>
        </div>
        {loginModal}
      </>
    );
  }

  return (
    <>
      <button type="button" className={loginButtonClass} onPointerEnter={preloadLoginModal} onFocus={preloadLoginModal} onClick={async () => { await preloadLoginModal(); setLoginOpen(true); }} aria-label="Ouvrir la connexion">
        <ShieldCheck size={14} className="text-stone-400 transition-colors group-hover:text-amber-500 dark:text-stone-300 dark:group-hover:text-[#D9B58D]" />
        <span className="text-[10px] font-black uppercase tracking-[0.16em]">Connexion</span>
      </button>
      {loginModal}
    </>
  );
}
