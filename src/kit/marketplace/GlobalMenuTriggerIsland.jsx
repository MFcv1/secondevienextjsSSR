'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const GlobalMenuPanelAuthIsland = dynamic(() => import('./GlobalMenuPanelAuthIsland'), {
  ssr: false,
  loading: () => null,
});

let globalMenuPanelPreloadPromise = null;

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

export default function GlobalMenuTriggerIsland({ darkMode = false } = {}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelClosing, setPanelClosing] = useState(false);
  const closeTimerRef = useRef(null);
  const warmGlobalMenuPanel = useCallback(() => {
    preloadGlobalMenuPanel().catch(() => null);
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

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(warmGlobalMenuPanel, { timeout: 2200 });
      return () => window.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(warmGlobalMenuPanel, 1600);
    return () => window.clearTimeout(timeoutId);
  }, [warmGlobalMenuPanel]);

  useEffect(() => () => {
    clearCloseTimer();
  }, [clearCloseTimer]);

  const openPanel = useCallback(() => {
    clearCloseTimer();
    warmGlobalMenuPanel();
    setPanelMounted(true);
    setPanelClosing(false);
    setPanelOpen(true);
  }, [clearCloseTimer, warmGlobalMenuPanel]);

  const closePanel = useCallback(() => {
    clearCloseTimer();
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
        className={`relative mr-1 flex h-10 min-w-10 items-center justify-center gap-2 rounded-full px-2.5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5C42]/25 dark:focus-visible:ring-[#D9B58D]/45 md:mr-0 md:px-3.5 ${darkMode ? 'bg-white/[0.08] text-stone-100 ring-1 ring-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/[0.14] hover:text-[#D9B58D]' : 'bg-white text-stone-900 shadow-sm shadow-stone-900/5 hover:text-[#8B5C42] dark:bg-white/[0.08] dark:text-stone-100 dark:ring-1 dark:ring-white/[0.08] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:bg-white/[0.14] dark:hover:text-[#D9B58D]'}`}
        aria-label={panelOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={panelOpen}
      >
        <MenuIcon open={panelOpen} />
        <span className="hidden text-[10px] font-black uppercase tracking-[0.16em] md:inline">Menu</span>
      </button>
      {panelMounted ? (
        <GlobalMenuPanelAuthIsland
          darkMode={darkMode}
          panelOpen={panelOpen}
          isMenuClosing={panelClosing}
          keepMounted={panelMounted}
          setPanelOpen={setPanelOpenWithMotion}
        />
      ) : null}
    </>
  );
}
