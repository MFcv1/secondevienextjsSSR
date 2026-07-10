'use client';

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

let globalMenuPromise = null;

const loadGlobalMenu = () => {
  if (!globalMenuPromise) {
    globalMenuPromise = import('../layout/GlobalMenu');
  }
  return globalMenuPromise;
};

const GlobalMenu = lazy(loadGlobalMenu);

const THEME_STORAGE_KEY = 'darkMode';
const CLOSE_NAVIGATION_OVERLAYS_EVENT = 'sv:close-navigation-overlays';
const MENU_OPEN_LOCK_MS = 260;
const MENU_CLOSE_LOCK_MS = 220;
const DESKTOP_MENU_CLOSE_MS = 520;
const MENU_IDLE_PRELOAD_DELAY_MS = 180;
const MENU_IDLE_PRELOAD_TIMEOUT_MS = 900;
const DESKTOP_MENU_QUERY = '(min-width: 1024px)';
const DESKTOP_MENU_OPEN_CLASS = 'global-menu-desktop-open';
const isDesktopMenuViewport = () => (
  typeof window !== 'undefined'
  && window.matchMedia(DESKTOP_MENU_QUERY).matches
);

function MenuIcon({ open }) {
  return (
    <span className="relative block h-4 w-5">
      <span className={`absolute left-0 top-1/2 h-[1.25px] origin-center rounded-full bg-current transition-all duration-[420ms] ${open ? 'w-[19px] rotate-45' : 'w-5 -translate-y-[6px]'}`} />
      <span className={`absolute left-0 top-1/2 h-[1.25px] origin-center rounded-full bg-current transition-all duration-300 ${open ? 'w-[19px] scale-x-0 opacity-0' : 'w-[15px]'}`} />
      <span className={`absolute left-0 top-1/2 h-[1.25px] origin-center rounded-full bg-current transition-all duration-[420ms] ${open ? 'w-[19px] -rotate-45' : 'w-[10px] translate-y-[6px]'}`} />
    </span>
  );
}

export default function GlobalMenuTriggerIsland({ darkMode = false } = {}) {
  const router = useRouter();
  const [effectiveDarkMode, setEffectiveDarkMode] = useState(darkMode);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelClosing, setPanelClosing] = useState(false);
  const [hasClientMounted, setHasClientMounted] = useState(false);
  const [hasPanelMounted, setHasPanelMounted] = useState(false);
  const [desktopMenuViewport, setDesktopMenuViewport] = useState(false);
  const [criticalAuthUser, setCriticalAuthUser] = useState(null);
  const [criticalAuthIsAdmin, setCriticalAuthIsAdmin] = useState(false);
  const [menuPreloaded, setMenuPreloaded] = useState(false);
  const closeTimerRef = useRef(null);
  const openFrameRef = useRef(null);
  const transitionLockTimerRef = useRef(null);
  const transitionLockedRef = useRef(false);
  const pointerOpenedRef = useRef(false);
  const pointerOpenedTimerRef = useRef(null);
  const [transitionLocked, setTransitionLocked] = useState(false);

  const preloadMenu = useCallback((mountDesktopPanel = false) => {
    const menuPromise = loadGlobalMenu();
    menuPromise.then(() => {
      setMenuPreloaded(true);
      if (mountDesktopPanel && isDesktopMenuViewport()) {
        setHasPanelMounted(true);
      }
    }).catch(() => {});
    return menuPromise;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia(DESKTOP_MENU_QUERY);
    const syncViewport = () => {
      setHasClientMounted(true);
      setDesktopMenuViewport(mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener?.('change', syncViewport);
    return () => mediaQuery.removeEventListener?.('change', syncViewport);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let cancelled = false;
    let preloadTimer = 0;
    let idleCallbackId = 0;

    const clearScheduledPreload = () => {
      if (preloadTimer) {
        window.clearTimeout(preloadTimer);
        preloadTimer = 0;
      }
      if (idleCallbackId && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleCallbackId);
        idleCallbackId = 0;
      }
    };

    const stopListeningForScrollIntent = () => {
      window.removeEventListener('wheel', cancelPreload);
      window.removeEventListener('touchstart', cancelPreload);
      window.removeEventListener('scroll', cancelPreload);
    };

    const runPreload = () => {
      idleCallbackId = 0;
      if (cancelled || window.scrollY > 4 || !isDesktopMenuViewport()) return;
      stopListeningForScrollIntent();
      void preloadMenu(true);
    };

    const schedulePreload = () => {
      if (cancelled || window.scrollY > 4) return;
      preloadTimer = window.setTimeout(() => {
        preloadTimer = 0;
        if (cancelled || window.scrollY > 4) return;
        if ('requestIdleCallback' in window) {
          idleCallbackId = window.requestIdleCallback(runPreload, {
            timeout: MENU_IDLE_PRELOAD_TIMEOUT_MS,
          });
          return;
        }
        runPreload();
      }, MENU_IDLE_PRELOAD_DELAY_MS);
    };

    function cancelPreload() {
      cancelled = true;
      clearScheduledPreload();
      stopListeningForScrollIntent();
    }

    window.addEventListener('wheel', cancelPreload, { passive: true });
    window.addEventListener('touchstart', cancelPreload, { passive: true });
    window.addEventListener('scroll', cancelPreload, { passive: true });

    if (document.readyState === 'complete') {
      schedulePreload();
    } else {
      window.addEventListener('load', schedulePreload, { once: true });
    }

    return () => {
      cancelled = true;
      clearScheduledPreload();
      stopListeningForScrollIntent();
      window.removeEventListener('load', schedulePreload);
    };
  }, [preloadMenu]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncAuthUser = (event) => {
      setCriticalAuthUser(event?.detail?.user || window.__svAuthUser || null);
    };
    const syncAuthAdmin = (event) => {
      const nextIsAdmin = event?.detail?.isAdmin;
      setCriticalAuthIsAdmin(typeof nextIsAdmin === 'boolean' ? nextIsAdmin : window.__svAuthIsAdmin === true);
    };

    setCriticalAuthUser(window.__svAuthUser || null);
    setCriticalAuthIsAdmin(window.__svAuthIsAdmin === true);
    window.addEventListener('sv:auth-user-changed', syncAuthUser);
    window.addEventListener('sv:auth-admin-changed', syncAuthAdmin);
    return () => {
      window.removeEventListener('sv:auth-user-changed', syncAuthUser);
      window.removeEventListener('sv:auth-admin-changed', syncAuthAdmin);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const readClientTheme = () => {
      const nextDark = window.localStorage.getItem(THEME_STORAGE_KEY) === 'true'
        || document.documentElement.classList.contains('dark');
      setEffectiveDarkMode(nextDark);
    };

    readClientTheme();
    window.addEventListener('sv:theme-change', readClientTheme);
    return () => window.removeEventListener('sv:theme-change', readClientTheme);
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (!closeTimerRef.current) return;
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const clearOpenFrame = useCallback(() => {
    if (!openFrameRef.current) return;
    window.cancelAnimationFrame(openFrameRef.current);
    openFrameRef.current = null;
  }, []);

  const unlockTransition = useCallback(() => {
    if (transitionLockTimerRef.current) {
      window.clearTimeout(transitionLockTimerRef.current);
      transitionLockTimerRef.current = null;
    }
    transitionLockedRef.current = false;
    setTransitionLocked(false);
  }, []);

  const lockTransition = useCallback((duration) => {
    transitionLockedRef.current = true;
    setTransitionLocked(true);
    if (transitionLockTimerRef.current) {
      window.clearTimeout(transitionLockTimerRef.current);
    }
    transitionLockTimerRef.current = window.setTimeout(() => {
      transitionLockedRef.current = false;
      setTransitionLocked(false);
      transitionLockTimerRef.current = null;
    }, duration);
  }, []);

  useEffect(() => () => {
    clearCloseTimer();
    clearOpenFrame();
    if (transitionLockTimerRef.current) {
      window.clearTimeout(transitionLockTimerRef.current);
      transitionLockTimerRef.current = null;
    }
    if (pointerOpenedTimerRef.current) {
      window.clearTimeout(pointerOpenedTimerRef.current);
      pointerOpenedTimerRef.current = null;
    }
  }, [clearCloseTimer, clearOpenFrame]);

  const presentPanel = useCallback(() => {
    clearCloseTimer();
    clearOpenFrame();
    setHasPanelMounted(true);
    const isDesktopOpen = isDesktopMenuViewport();

    if (isDesktopOpen) {
      unlockTransition();
      setPanelClosing(false);
      setPanelOpen(true);
      return;
    }

    lockTransition(MENU_OPEN_LOCK_MS);
    setPanelClosing(false);
    setPanelOpen(false);
    openFrameRef.current = window.requestAnimationFrame(() => {
      setPanelOpen(true);
      openFrameRef.current = null;
    });
  }, [clearCloseTimer, clearOpenFrame, lockTransition, unlockTransition]);

  const openPanel = useCallback(() => {
    clearCloseTimer();
    clearOpenFrame();
    presentPanel();
  }, [clearCloseTimer, clearOpenFrame, presentPanel]);

  const closePanel = useCallback(() => {
    clearCloseTimer();
    clearOpenFrame();
    const isDesktopOpen = isDesktopMenuViewport();

    if (isDesktopOpen) {
      unlockTransition();
      setPanelOpen(false);
      setPanelClosing(true);
      closeTimerRef.current = window.setTimeout(() => {
        setPanelClosing(false);
        document.documentElement.classList.remove(DESKTOP_MENU_OPEN_CLASS);
        closeTimerRef.current = null;
      }, DESKTOP_MENU_CLOSE_MS);
      return;
    }

    lockTransition(MENU_CLOSE_LOCK_MS);
    setPanelOpen(false);
    setPanelClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      setPanelClosing(false);
      closeTimerRef.current = null;
    }, 540);
  }, [clearCloseTimer, clearOpenFrame, lockTransition, unlockTransition]);

  const closePanelInstantly = useCallback(() => {
    clearCloseTimer();
    clearOpenFrame();
    unlockTransition();
    setPanelOpen(false);
    setPanelClosing(false);
    document.documentElement.classList.remove(DESKTOP_MENU_OPEN_CLASS);
  }, [clearCloseTimer, clearOpenFrame, unlockTransition]);

  const setPanelOpenWithMotion = useCallback((nextValue) => {
    const resolvedValue = typeof nextValue === 'function' ? nextValue(panelOpen) : nextValue;
    if (resolvedValue) {
      if (transitionLockedRef.current && !isDesktopMenuViewport()) return;
      openPanel();
      return;
    }
    closePanel();
  }, [closePanel, openPanel, panelOpen]);

  const togglePanel = () => {
    if (pointerOpenedRef.current) {
      pointerOpenedRef.current = false;
      return;
    }
    if (panelClosing) {
      openPanel();
      return;
    }
    if (panelOpen) {
      closePanel();
      return;
    }
    if (transitionLockedRef.current && !isDesktopMenuViewport()) return;
    openPanel();
  };

  const handlePointerDown = (event) => {
    void preloadMenu();
    const isDesktopOpen = isDesktopMenuViewport();
    if (event.button !== undefined && event.button !== 0) return;
    if (isDesktopOpen) {
      if (panelOpen) return;
      pointerOpenedRef.current = true;
      if (pointerOpenedTimerRef.current) window.clearTimeout(pointerOpenedTimerRef.current);
      pointerOpenedTimerRef.current = window.setTimeout(() => {
        pointerOpenedRef.current = false;
        pointerOpenedTimerRef.current = null;
      }, 350);
      openPanel();
      return;
    }
    if (panelOpen || panelClosing || transitionLockedRef.current) return;

    pointerOpenedRef.current = true;
    openPanel();
  };

  const navigateCriticalDesktop = useCallback((path) => {
    if (!path) return;
    closePanelInstantly();
    window.requestAnimationFrame(() => {
      router.push(path);
    });
  }, [closePanelInstantly, router]);

  const openCriticalDesktopLogin = useCallback(() => {
    closePanelInstantly();
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('sv:open-login'));
    });
  }, [closePanelInstantly]);

  const openCriticalDesktopCart = useCallback(() => {
    closePanelInstantly();
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('sv:open-cart'));
    });
  }, [closePanelInstantly]);

  useEffect(() => {
    window.addEventListener(CLOSE_NAVIGATION_OVERLAYS_EVENT, closePanelInstantly);
    return () => window.removeEventListener(CLOSE_NAVIGATION_OVERLAYS_EVENT, closePanelInstantly);
  }, [closePanelInstantly]);

  return (
    <>
      <button
        data-global-menu-trigger
        data-menu-preloaded={menuPreloaded ? 'true' : 'false'}
        type="button"
        onClick={togglePanel}
        onPointerDown={handlePointerDown}
        onPointerEnter={() => { void preloadMenu(true); }}
        onFocus={() => { void preloadMenu(true); }}
        aria-disabled={transitionLocked && !desktopMenuViewport}
        className={`relative mr-1 flex h-10 min-w-10 touch-manipulation items-center justify-center gap-2 rounded-full px-2.5 transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5C42]/25 dark:focus-visible:ring-[#D9B58D]/45 md:mr-0 md:px-3.5 ${effectiveDarkMode ? 'bg-white/[0.08] text-stone-100 ring-1 ring-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/[0.14] hover:text-[#D9B58D]' : 'bg-white text-stone-900 shadow-sm shadow-stone-900/5 hover:text-[#8B5C42] dark:bg-white/[0.08] dark:text-stone-100 dark:ring-1 dark:ring-white/[0.08] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:bg-white/[0.14] dark:hover:text-[#D9B58D]'}`}
        aria-label={panelOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={panelOpen}
      >
        <MenuIcon open={panelOpen} />
        <span className="hidden text-[10px] font-black uppercase tracking-[0.16em] md:inline">Menu</span>
      </button>
      {hasClientMounted && hasPanelMounted && typeof document !== 'undefined' ? createPortal(
        <Suspense fallback={null}>
          <GlobalMenu
            darkMode={effectiveDarkMode}
            isMenuOpen={panelOpen}
            isMenuClosing={panelClosing}
            keepMounted
            setIsMenuOpen={setPanelOpenWithMotion}
            currentView="gallery"
            user={criticalAuthUser}
            isAdmin={criticalAuthIsAdmin}
            onNavigate={navigateCriticalDesktop}
            onShowLogin={openCriticalDesktopLogin}
            onOpenWishlist={() => navigateCriticalDesktop('/wishlist')}
            onOpenCart={openCriticalDesktopCart}
            onLogout={() => {}}
          />
        </Suspense>,
        document.body
      ) : null}
    </>
  );
}
