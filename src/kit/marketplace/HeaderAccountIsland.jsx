'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LogOut, ShieldCheck } from 'lucide-react';

const LegacyLoginModalIsland = dynamic(() => import('./LegacyLoginModalFullIsland'), {
  ssr: false,
  loading: () => null,
});

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || '';

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
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeAuth = null;

    const syncAdminClaim = async (nextUser) => {
      if (!nextUser || nextUser.isAnonymous) {
        setIsAdmin(false);
        return;
      }
      if (nextUser.email === SUPER_ADMIN_EMAIL) {
        setIsAdmin(true);
        return;
      }
      try {
        const { loadAuthModule } = await import('../config/firebaseLazy');
        const { getIdTokenResult } = await loadAuthModule();
        const tokenResult = await getIdTokenResult(nextUser, true);
        if (!cancelled) setIsAdmin(tokenResult.claims.admin === true);
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    };

    const applyUser = (nextUser) => {
      if (cancelled) return;
      window.__svAuthUser = nextUser || null;
      setUser(nextUser || null);
      syncAdminClaim(nextUser || null);
    };

    const handleExternalAuthChange = (event) => {
      applyUser(event.detail?.user || null);
    };

    const handleOpenLogin = () => {
      setLoginOpen(true);
    };

    window.addEventListener('sv:auth-user-changed', handleExternalAuthChange);
    window.addEventListener('sv:open-login', handleOpenLogin);

    if (hasPersistedFirebaseUser()) {
      import('../config/firebaseLazy')
        .then(async ({ getFirebaseAuth, loadAuthModule }) => {
          const auth = await getFirebaseAuth();
          const { onAuthStateChanged } = await loadAuthModule();
          if (cancelled) return;
          unsubscribeAuth = onAuthStateChanged(auth, applyUser);
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      unsubscribeAuth?.();
      window.removeEventListener('sv:auth-user-changed', handleExternalAuthChange);
      window.removeEventListener('sv:open-login', handleOpenLogin);
    };
  }, []);

  const logout = async () => {
    window.__svAuthUser = null;
    setUser(null);
    setIsAdmin(false);
    window.dispatchEvent(new CustomEvent('sv:auth-user-changed', { detail: { user: null } }));
    const { getFirebaseAuth, loadAuthModule } = await import('../config/firebaseLazy');
    const auth = await getFirebaseAuth();
    const { signOut } = await loadAuthModule();
    await signOut(auth);
  };

  const loginButtonClass = `group hidden h-9 items-center gap-2 rounded-full px-3 text-inherit no-underline transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] md:flex ${darkMode ? 'bg-white/[0.04] text-stone-400 hover:bg-white/[0.09] hover:text-stone-100' : 'bg-white/70 text-stone-500 hover:bg-white hover:text-stone-900'}`;
  const logoutButtonClass = `group flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] sm:w-auto sm:gap-2 sm:px-3 ${darkMode ? 'text-stone-400 hover:bg-red-400/10 hover:text-red-300' : 'text-stone-500 hover:bg-red-50 hover:text-red-600'}`;

  if (user && !user.isAnonymous) {
    return (
      <div className="flex items-center gap-2">
        {isAdmin ? (
          <div className={`hidden rounded-full px-2.5 py-1 sm:block ${darkMode ? 'bg-emerald-400/10' : 'bg-emerald-50'}`}>
            <span className="cursor-default text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Admin</span>
          </div>
        ) : null}
        <button type="button" onClick={logout} className={logoutButtonClass} title="Se deconnecter" aria-label="Se deconnecter">
          <LogOut size={16} />
          <span className="hidden text-[9px] font-bold uppercase tracking-widest sm:inline">Quitter</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <button type="button" className={loginButtonClass} onClick={() => setLoginOpen(true)} aria-label="Ouvrir la connexion">
        <ShieldCheck size={14} className="text-stone-400 transition-colors group-hover:text-amber-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.16em]">Connexion</span>
      </button>
      {loginOpen ? <LegacyLoginModalIsland open={loginOpen} onOpenChange={setLoginOpen} renderTrigger={false} /> : null}
    </>
  );
}
