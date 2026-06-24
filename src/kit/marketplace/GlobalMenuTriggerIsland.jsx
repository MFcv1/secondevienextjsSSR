'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';

const GlobalMenuPanelAuthIsland = dynamic(() => import('./GlobalMenuPanelAuthIsland'), {
  ssr: false,
  loading: () => null,
});

let globalMenuPanelPreloadPromise = null;
const THEME_STORAGE_KEY = 'darkMode';

const getCurrentMenuTop = () => {
  if (typeof window === 'undefined') return 110;
  const headerBottom = document.querySelector('header')?.getBoundingClientRect?.().bottom;
  return Math.max(0, Math.round(headerBottom || 110));
};

const preloadGlobalMenuPanel = () => {
  GlobalMenuPanelAuthIsland.preload?.();

  if (!globalMenuPanelPreloadPromise) {
    globalMenuPanelPreloadPromise = import('./GlobalMenuPanelAuthIsland')
      .then(async (module) => {
        await module.preloadGlobalMenu?.();
        return module;
      })
      .catch((error) => {
        globalMenuPanelPreloadPromise = null;
        throw error;
      });
  }

  return globalMenuPanelPreloadPromise;
};

function MenuIcon({ open }) {
  return (
    <span className="relative block h-4 w-5">
      <span className={`absolute left-0 top-1/2 h-[1.25px] origin-center rounded-full bg-current transition-all duration-[420ms] ${open ? 'w-[19px] rotate-45' : 'w-5 -translate-y-[6px]'}`} />
      <span className={`absolute left-0 top-1/2 h-[1.25px] origin-center rounded-full bg-current transition-all duration-300 ${open ? 'w-[19px] scale-x-0 opacity-0' : 'w-[15px]'}`} />
      <span className={`absolute left-0 top-1/2 h-[1.25px] origin-center rounded-full bg-current transition-all duration-[420ms] ${open ? 'w-[19px] -rotate-45' : 'w-[10px] translate-y-[6px]'}`} />
    </span>
  );
}

function GlobalMenuOpeningShell({ darkMode = false, menuTop = 110, open = false, closing = false, onClose } = {}) {
  const interactive = open && !closing;
  const viewportHeight = typeof window === 'undefined' ? 900 : window.innerHeight;
  const panelTone = darkMode
    ? 'border-stone-800 bg-[#111111] text-stone-100'
    : 'border-stone-200 bg-[#fffdfb] text-stone-900';
  const cardTone = darkMode
    ? 'border-white/10 bg-white/[0.045]'
    : 'border-stone-200/70 bg-[#fbfaf8]/95';

  return (
    <div
      className={`${interactive ? 'pointer-events-auto' : 'pointer-events-none'} fixed inset-x-0 bottom-0 z-[2000] overflow-hidden`}
      style={{ top: menuTop }}
      role={interactive ? 'dialog' : undefined}
      aria-modal={interactive ? 'true' : undefined}
      aria-hidden={!interactive}
      aria-label="Menu principal"
    >
      <button
        type="button"
        className={`absolute inset-0 h-full w-full bg-stone-950/20 transition-opacity duration-200 lg:bg-stone-950/35 ${interactive ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-label="Fermer le menu"
      />
      <section
        className={`global-menu-scrollbarless absolute left-0 right-0 hidden overflow-hidden overscroll-contain shadow-[0_28px_80px_rgba(28,25,23,0.13)] transition-[opacity,transform] duration-300 lg:block ${panelTone} ${interactive ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}
        style={{
          top: 0,
          maxHeight: Math.max(0, viewportHeight - menuTop),
          transformOrigin: 'top center',
          contain: 'layout paint',
        }}
      >
        <div className="w-full px-5 pb-7 pt-6 xl:px-7 2xl:px-9" aria-hidden="true">
          <div className="grid grid-cols-[250px_minmax(0,1fr)] gap-4 xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-5">
            <div className={`h-[540px] rounded-[22px] ${cardTone}`} />
            <div className="grid grid-cols-[minmax(230px,0.72fr)_minmax(420px,1.34fr)_minmax(560px,1.94fr)] gap-3 xl:gap-4">
              <div className={`h-[540px] rounded-[22px] ${cardTone}`} />
              <div className={`h-[540px] rounded-[22px] ${cardTone}`} />
              <div className={`h-[540px] rounded-[22px] ${cardTone}`} />
            </div>
          </div>
          <div className={`mt-6 h-[90px] rounded-[22px] ${cardTone}`} />
        </div>
      </section>
    </div>
  );
}

export default function GlobalMenuTriggerIsland({ darkMode = false } = {}) {
  const [effectiveDarkMode, setEffectiveDarkMode] = useState(darkMode);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelClosing, setPanelClosing] = useState(false);
  const [panelReady, setPanelReady] = useState(false);
  const [fallbackMenuTop, setFallbackMenuTop] = useState(110);
  const closeTimerRef = useRef(null);
  const pendingOpenTimerRef = useRef(null);
  const panelReadyRef = useRef(false);
  const warmGlobalMenuPanel = useCallback(() => {
    const promise = preloadGlobalMenuPanel()
      .then(() => {
        panelReadyRef.current = true;
        setPanelReady(true);
      })
      .catch(() => null);
    return promise;
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

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    if (!desktopQuery.matches) return undefined;

    const kickoffId = window.setTimeout(warmGlobalMenuPanel, 260);

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(warmGlobalMenuPanel, { timeout: 1200 });
      return () => {
        window.clearTimeout(kickoffId);
        window.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = window.setTimeout(warmGlobalMenuPanel, 900);
    return () => {
      window.clearTimeout(kickoffId);
      window.clearTimeout(timeoutId);
    };
  }, [warmGlobalMenuPanel]);

  useEffect(() => () => {
    clearCloseTimer();
    if (pendingOpenTimerRef.current) {
      window.clearTimeout(pendingOpenTimerRef.current);
      pendingOpenTimerRef.current = null;
    }
  }, [clearCloseTimer]);

  const openPanel = useCallback(() => {
    clearCloseTimer();
    if (pendingOpenTimerRef.current) {
      window.clearTimeout(pendingOpenTimerRef.current);
      pendingOpenTimerRef.current = null;
    }
    const warmPromise = warmGlobalMenuPanel();
    setFallbackMenuTop(getCurrentMenuTop());
    setPanelMounted(true);
    setPanelClosing(false);

    const revealPanel = () => {
      pendingOpenTimerRef.current = null;
      window.requestAnimationFrame(() => setPanelOpen(true));
    };

    pendingOpenTimerRef.current = window.setTimeout(revealPanel, panelReadyRef.current ? 0 : 40);
    warmPromise.finally(() => {
      if (!pendingOpenTimerRef.current || panelOpen) return;
      window.clearTimeout(pendingOpenTimerRef.current);
      revealPanel();
    });
  }, [clearCloseTimer, panelOpen, warmGlobalMenuPanel]);

  const closePanel = useCallback(() => {
    clearCloseTimer();
    if (pendingOpenTimerRef.current) {
      window.clearTimeout(pendingOpenTimerRef.current);
      pendingOpenTimerRef.current = null;
    }
    setPanelOpen(false);
    setPanelClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      setPanelClosing(false);
      setPanelMounted(false);
      closeTimerRef.current = null;
    }, 1120);
  }, [clearCloseTimer]);

  const setPanelOpenWithMotion = useCallback((nextValue) => {
    const resolvedValue = typeof nextValue === 'function' ? nextValue(panelOpen) : nextValue;
    if (resolvedValue) {
      openPanel();
      return;
    }
    closePanel();
  }, [closePanel, openPanel, panelOpen]);

  const togglePanel = () => {
    if (panelOpen) {
      closePanel();
      return;
    }
    openPanel();
  };

  return (
    <>
      <button
        type="button"
        onClick={togglePanel}
        onFocus={warmGlobalMenuPanel}
        onPointerDown={warmGlobalMenuPanel}
        onPointerEnter={warmGlobalMenuPanel}
        className={`relative mr-1 flex h-10 min-w-10 items-center justify-center gap-2 rounded-full px-2.5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5C42]/25 dark:focus-visible:ring-[#D9B58D]/45 md:mr-0 md:px-3.5 ${effectiveDarkMode ? 'bg-white/[0.08] text-stone-100 ring-1 ring-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/[0.14] hover:text-[#D9B58D]' : 'bg-white text-stone-900 shadow-sm shadow-stone-900/5 hover:text-[#8B5C42] dark:bg-white/[0.08] dark:text-stone-100 dark:ring-1 dark:ring-white/[0.08] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:bg-white/[0.14] dark:hover:text-[#D9B58D]'}`}
        aria-label={panelOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={panelOpen}
      >
        <MenuIcon open={panelOpen} />
        <span className="hidden text-[10px] font-black uppercase tracking-[0.16em] md:inline">Menu</span>
      </button>
      {panelMounted && typeof document !== 'undefined' ? createPortal(
        <>
          {!panelReady ? (
            <GlobalMenuOpeningShell
              darkMode={effectiveDarkMode}
              menuTop={fallbackMenuTop}
              open={panelOpen}
              closing={panelClosing}
              onClose={closePanel}
            />
          ) : null}
          {panelReady ? (
            <GlobalMenuPanelAuthIsland
              darkMode={effectiveDarkMode}
              panelOpen={panelOpen}
              isMenuClosing={panelClosing}
              keepMounted={panelMounted}
              setPanelOpen={setPanelOpenWithMotion}
            />
          ) : null}
        </>,
        document.body
      ) : null}
    </>
  );
}
