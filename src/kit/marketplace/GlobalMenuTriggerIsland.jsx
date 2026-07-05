'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
  Armchair,
  BadgeEuro,
  ChevronRight,
  ClipboardCheck,
  DoorOpen,
  Flower2,
  Home,
  Lamp,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import GlobalMenu from '../layout/GlobalMenu';

const GlobalMenuPanelAuthIsland = dynamic(() => import('./GlobalMenuPanelAuthIsland'), {
  ssr: false,
  loading: () => null,
});

let globalMenuPanelPreloadPromise = null;
let desktopGlobalMenuPanelPreloadPromise = null;
const THEME_STORAGE_KEY = 'darkMode';
const CLOSE_NAVIGATION_OVERLAYS_EVENT = 'sv:close-navigation-overlays';
const MENU_OPEN_LOCK_MS = 260;
const MENU_CLOSE_LOCK_MS = 220;
const DESKTOP_MENU_CLOSE_MS = 280;
const MOBILE_SHELL_HANDOFF_MS = 420;
const DESKTOP_MENU_QUERY = '(min-width: 1024px)';
const DESKTOP_MENU_OPEN_CLASS = 'global-menu-desktop-open';
const MENU_PANEL_EASE = 'cubic-bezier(0.22,1,0.36,1)';

const INSTANT_PRIMARY_LINKS = [
  { label: 'Accueil', desc: 'Galerie principale', Icon: Home, path: '/' },
  { label: 'A propos', desc: 'Atelier et histoire', Icon: UserRound, path: '/a-propos' },
  { label: 'Commandes', desc: 'Espace client', Icon: Package, path: '/mes-commandes' },
  { label: 'Devis', desc: 'Projet sur mesure', Icon: ClipboardCheck, path: '/devis' },
];

const INSTANT_MOBILE_ROWS = [
  { label: 'Nouveautes', badge: 'Nouveau', Icon: Sparkles, path: '/#gallery-pieces' },
  { label: 'Meubles', Icon: DoorOpen, path: '/categorie/meubles' },
  { label: 'Assises', Icon: Armchair, path: '/categorie/assises' },
  { label: 'Eclairage', Icon: Lamp, path: '/categorie/eclairage' },
  { label: 'Decorations', Icon: Flower2, path: '/categorie/decorations' },
  { label: 'Prix bas', Icon: BadgeEuro, accent: true, path: '/#gallery-small-prices' },
  { label: 'A propos', Icon: UserRound, path: '/a-propos' },
];

const INSTANT_CATEGORY_LINKS = [
  { label: 'Buffets', path: '/categorie/buffets' },
  { label: 'Armoires', path: '/categorie/armoires' },
  { label: 'Commodes', path: '/categorie/commodes' },
  { label: 'Tables', path: '/categorie/tables' },
  { label: 'Chaises', path: '/categorie/chaises' },
  { label: 'Fauteuils', path: '/categorie/fauteuils' },
  { label: 'Miroirs', path: '/categorie/miroirs' },
  { label: 'Decorations', path: '/categorie/decorations' },
];

const isDesktopMenuViewport = () => (
  typeof window !== 'undefined'
  && window.matchMedia(DESKTOP_MENU_QUERY).matches
);

const getCurrentMenuTop = () => {
  if (typeof window === 'undefined') return 110;
  const header = document.querySelector('header');
  const headerBottom = header?.getBoundingClientRect?.().bottom || 0;
  const headerHeight = header?.offsetHeight || 110;
  return Math.max(0, Math.round(headerBottom > 0 ? headerBottom : headerHeight));
};

const preloadGlobalMenuPanel = ({ waitForDesktopView = false } = {}) => {
  GlobalMenuPanelAuthIsland.preload?.();

  if (waitForDesktopView) {
    if (!desktopGlobalMenuPanelPreloadPromise) {
      desktopGlobalMenuPanelPreloadPromise = import('./GlobalMenuPanelAuthIsland')
        .then(async (module) => {
          await module.preloadGlobalMenu?.({ waitForDesktopView: true });
          return module;
        })
        .catch((error) => {
          desktopGlobalMenuPanelPreloadPromise = null;
          throw error;
        });
    }

    return desktopGlobalMenuPanelPreloadPromise;
  }

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

function GlobalMenuOpeningShell({
  darkMode = false,
  menuTop = 110,
  open = false,
  closing = false,
  user = null,
  isAdmin = false,
  onClose,
} = {}) {
  const interactive = open && !closing;
  const signedUser = user && !user.isAnonymous ? user : null;
  const viewportHeight = typeof window === 'undefined' ? 900 : window.innerHeight;
  const panelTone = darkMode
    ? 'border-stone-800 bg-[#111111] text-stone-100'
    : 'border-stone-200 bg-[#fffdfb] text-stone-900';
  const softBg = darkMode ? 'bg-white/5' : 'bg-[#f6f2ee]';
  const mutedText = darkMode ? 'text-stone-500' : 'text-stone-500';
  const desktopSoftCard = darkMode
    ? 'border border-white/10 bg-white/[0.045]'
    : 'border border-stone-200/70 bg-[#fbfaf8]/95';
  const desktopWarmCard = darkMode
    ? 'border border-white/10 bg-[#1f1b18]'
    : 'border border-[#e7ded5] bg-[#f3eee9]';
  const softBorder = darkMode ? 'border-stone-800' : 'border-stone-200';

  const navigateInstant = (path) => {
    if (!path || typeof window === 'undefined') return;
    onClose?.();
    window.requestAnimationFrame(() => {
      window.location.assign(path);
    });
  };

  const openLogin = () => {
    if (typeof window === 'undefined') return;
    onClose?.();
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('sv:open-login'));
    });
  };

  const openAccount = () => {
    navigateInstant(signedUser ? '/mes-commandes' : '/mes-commandes');
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter') navigateInstant('/');
  };

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
        className={`absolute inset-0 h-full w-full bg-stone-950/20 transition-opacity duration-200 lg:bg-stone-950/35 lg:backdrop-blur-sm ${interactive ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-label="Fermer le menu"
      />

      <aside
        className={`global-menu-mobile-panel absolute bottom-0 left-0 right-0 overflow-hidden overscroll-contain transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${panelTone} ${interactive ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
        style={{
          top: 0,
          height: `calc(100dvh - ${menuTop}px)`,
          maxHeight: `calc(100dvh - ${menuTop}px)`,
          pointerEvents: interactive ? 'auto' : 'none',
          contain: 'layout paint',
          transformOrigin: 'right center',
          willChange: 'transform, opacity',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
        }}
      >
        <div className="global-menu-mobile-content flex h-full min-h-0 flex-col safe-pb-menu">
          <div className="global-menu-mobile-inner flex min-h-0 flex-1 flex-col px-4 pb-3 pt-3 sm:px-5">
            <label className={`global-menu-mobile-search relative flex items-center rounded-lg ${softBg}`}>
              <span className="sr-only">Rechercher</span>
              <input
                type="search"
                placeholder="Rechercher un produit..."
                className={`h-full w-full rounded-lg bg-transparent pl-4 pr-11 text-[15px] outline-none placeholder:text-stone-400 ${darkMode ? 'text-stone-100' : 'text-stone-800'}`}
                onKeyDown={handleSearchKeyDown}
              />
              <Search className="absolute right-3.5 text-stone-500" size={20} strokeWidth={1.5} />
            </label>

            <div className="global-menu-mobile-actions grid grid-cols-3 gap-2 sm:grid-cols-4">
              {INSTANT_PRIMARY_LINKS.map(({ label, desc, Icon, path }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigateInstant(path)}
                  className="global-menu-mobile-action flex flex-col items-center justify-center text-center active:scale-[0.992]"
                >
                  <Icon className="global-menu-mobile-action-icon" strokeWidth={1.45} />
                  <span className="global-menu-mobile-action-label mt-1.5 font-serif font-bold leading-tight">{label}</span>
                  <span className={`global-menu-mobile-action-desc mt-0.5 leading-tight ${mutedText}`}>{desc}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={signedUser ? openAccount : openLogin}
                className={`global-menu-mobile-account col-span-2 flex items-center gap-3 rounded-lg px-3.5 text-left active:scale-[0.992] ${softBg}`}
              >
                <span className="global-menu-mobile-account-icon flex shrink-0 items-center justify-center rounded-full bg-[#9A654B] text-sm font-black text-white">
                  {signedUser ? (signedUser.email || signedUser.displayName || 'M').charAt(0).toUpperCase() : <UserRound className="h-5 w-5" />}
                </span>
                <span className="min-w-0">
                  <span className="global-menu-mobile-account-label block truncate font-black">{signedUser ? 'Mon espace' : 'Connexion'}</span>
                  <span className={`global-menu-mobile-account-desc mt-0.5 block truncate ${mutedText}`}>
                    {signedUser ? 'Commandes et suivi' : 'Acceder a votre espace'}
                  </span>
                </span>
                <ChevronRight size={18} strokeWidth={1.4} className="ml-auto shrink-0" />
              </button>
            </div>

            <div className={`global-menu-mobile-divider h-px origin-center ${darkMode ? 'bg-stone-800' : 'bg-stone-200'}`} />

            <nav className={`global-menu-mobile-nav flex min-h-0 flex-1 flex-col divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-200/80'}`}>
              {[
                ...(isAdmin ? [{ label: 'Admin.', Icon: ShieldCheck, path: '/admin' }] : []),
                ...INSTANT_MOBILE_ROWS,
              ].map(({ label, Icon, badge, accent, path }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigateInstant(path)}
                  className={`global-menu-mobile-row flex min-h-0 w-full flex-1 items-center gap-3 text-left active:scale-[0.992] ${accent ? 'text-[#9A4F31]' : ''}`}
                >
                  <Icon className={`global-menu-mobile-row-icon ${accent ? 'text-orange-500' : 'text-[#9A654B]'}`} strokeWidth={1.45} />
                  <span className="global-menu-mobile-row-label flex min-w-0 flex-1 items-center gap-2 font-medium tracking-tight">
                    {label}
                    {badge ? (
                      <span className="global-menu-mobile-badge shrink-0 rounded-full border border-[#9A654B] px-1.5 py-0.5 font-black uppercase tracking-[0.12em] text-[#9A654B]">
                        {badge}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight className="global-menu-mobile-chevron" strokeWidth={1.4} />
                </button>
              ))}
            </nav>
          </div>
        </div>
      </aside>

      <section
        className={`global-menu-scrollbarless absolute left-0 right-0 hidden overflow-hidden overscroll-contain shadow-[0_28px_80px_rgba(28,25,23,0.13)] transition-[opacity,transform] duration-300 lg:block ${panelTone} ${interactive ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}
        style={{
          top: 0,
          maxHeight: Math.max(0, viewportHeight - menuTop),
          transformOrigin: 'top center',
          contain: 'layout paint',
          transitionTimingFunction: MENU_PANEL_EASE,
        }}
      >
        <div className="w-full px-5 pb-7 pt-6 xl:px-7 2xl:px-9">
          <div className="grid grid-cols-[250px_minmax(0,1fr)] gap-4 xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-5">
            <aside className={`flex h-[540px] flex-col justify-between rounded-[22px] p-3.5 xl:p-4 ${desktopSoftCard}`}>
              <nav className="space-y-2">
                {INSTANT_PRIMARY_LINKS.map(({ label, desc, Icon, path }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => navigateInstant(path)}
                    className="global-menu-hover group flex w-full items-center gap-3.5 rounded-lg px-4 py-3.5 text-left active:scale-[0.992]"
                  >
                    <Icon size={22} strokeWidth={1.35} className={`global-menu-hover__icon ${mutedText}`} />
                    <span>
                      <span className="global-menu-hover__label block font-serif text-[18px] font-semibold leading-tight">{label}</span>
                      <span className={`global-menu-hover__desc mt-1 block text-[12px] ${mutedText}`}>{desc}</span>
                    </span>
                  </button>
                ))}
              </nav>
              <button
                type="button"
                onClick={openLogin}
                className={`global-menu-hover flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left active:scale-[0.992] ${darkMode ? 'bg-white/5' : 'bg-stone-50'}`}
              >
                <UserRound size={18} className="global-menu-hover__icon" />
                <span>
                  <span className="global-menu-hover__label block text-[12px] font-black">Se connecter</span>
                  <span className={`global-menu-hover__desc text-[11px] ${mutedText}`}>Acceder a votre espace</span>
                </span>
                <ChevronRight size={18} strokeWidth={1.4} className="global-menu-hover__chevron ml-auto shrink-0 text-[#9A654B]" />
              </button>
            </aside>

            <div className="grid grid-cols-[minmax(660px,2.06fr)_minmax(560px,1.94fr)] gap-3 xl:gap-4">
              <section className={`grid h-[540px] grid-cols-[minmax(220px,0.72fr)_minmax(0,1.34fr)] overflow-hidden rounded-[22px] ${desktopSoftCard}`}>
                <div className="flex min-h-0 flex-col px-4 py-4 xl:px-5 xl:py-5 2xl:px-6">
                  <h2 className="mb-4 text-[11px] font-black uppercase tracking-[0.17em]">Meubles par categorie</h2>
                  <div className="grid gap-1.5">
                    {INSTANT_CATEGORY_LINKS.map(({ label, path }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => navigateInstant(path)}
                        className="global-menu-hover group -mx-2 flex min-h-8 items-center gap-2.5 rounded-md px-2 text-left active:scale-[0.992]"
                      >
                        <DoorOpen size={18} strokeWidth={1.35} className="global-menu-hover__icon text-[#9A654B]" />
                        <span className={`global-menu-hover__label font-serif text-[18px] font-semibold leading-[1.05] ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateInstant('/')}
                    className={`global-menu-hover global-menu-hover--ambient mt-auto flex min-h-10 items-center gap-2 border-t pt-3 font-serif text-[14px] font-semibold leading-none text-[#8B5C42] ${softBorder}`}
                  >
                    <span className="global-menu-hover__label">Voir toutes les categories</span>
                    <ChevronRight size={15} className="global-menu-hover__chevron shrink-0" />
                  </button>
                </div>

                <div className={`flex min-h-0 flex-col border-l px-4 py-4 xl:px-5 xl:py-5 2xl:px-6 ${softBorder}`}>
                  <h2 className="text-[12px] font-black uppercase tracking-[0.18em]">Explorer la maison</h2>
                  <p className={`mt-2 max-w-[34ch] text-[12px] leading-[1.45] ${mutedText}`}>
                    Pieces de vie, rangements et coups de coeur.
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {[
                      ['Salon', '/categorie/meubles'],
                      ['Salle a manger', '/categorie/tables'],
                      ['Chambre', '/categorie/armoires'],
                      ['Entree', '/categorie/commodes'],
                      ['Bureau', '/categorie/tables'],
                      ['Decoration', '/categorie/decorations'],
                    ].map(([label, path]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => navigateInstant(path)}
                        className={`global-menu-hover group flex min-h-10 items-center justify-between rounded-[10px] px-3 py-2 text-left active:scale-[0.992] ${darkMode ? 'bg-white/5' : 'bg-white/55'}`}
                      >
                        <span className={`global-menu-hover__label font-serif text-[15.5px] font-semibold leading-tight ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
                          {label}
                        </span>
                        <ChevronRight size={15} strokeWidth={1.4} className="global-menu-hover__chevron shrink-0 text-[#9A654B]" />
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className={`grid h-[540px] grid-cols-[minmax(220px,0.86fr)_minmax(0,1.44fr)] gap-2 rounded-[22px] p-1.5 ${desktopWarmCard}`}>
                <div className={`flex min-h-0 flex-col rounded-[18px] px-4 py-4 xl:px-4 xl:py-5 ${darkMode ? 'bg-[#151515] ring-1 ring-white/10' : 'bg-[#fffaf6] ring-1 ring-[#eadfd6]'}`}>
                  <h2 className="mb-6 text-[12px] font-black uppercase tracking-[0.18em]">L'atelier Seconde Vie</h2>
                  <div className="flex flex-1 flex-col justify-evenly py-2">
                    {[
                      'Renovation sur-mesure',
                      'Patines & finitions',
                      'Avant / Apres',
                      'Atelier sur rendez-vous',
                    ].map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => navigateInstant('/a-propos')}
                        className="global-menu-hover global-menu-hover--ambient group flex items-start gap-3 rounded-lg text-left active:scale-[0.992]"
                      >
                        <ShieldCheck size={18} strokeWidth={1.4} className="global-menu-hover__icon mt-1 shrink-0 text-[#9A654B]" />
                        <span>
                          <span className="global-menu-hover__label block font-serif text-[16.5px] font-semibold leading-[1.14]">{label}</span>
                          <span className={`global-menu-hover__desc mt-1 block text-[11.5px] leading-[1.35] ${mutedText}`}>Pieces uniques et conseils atelier</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateInstant('/devis')}
                    className={`global-menu-hover mt-3 flex w-full items-center justify-between rounded-[16px] px-4 py-3.5 text-left active:scale-[0.992] ${darkMode ? 'bg-white/5' : 'bg-[#f4eee8]'}`}
                  >
                    <span>
                      <span className="global-menu-hover__label block font-serif text-[17px] font-bold leading-tight">Projet sur-mesure</span>
                      <span className={`global-menu-hover__desc mt-1 block text-[11.5px] leading-5 ${mutedText}`}>Decrivez votre meuble a restaurer</span>
                    </span>
                    <ChevronRight size={18} strokeWidth={1.5} className="global-menu-hover__chevron shrink-0 text-[#9A654B]" />
                  </button>
                </div>

                <div className={`flex min-h-0 flex-col justify-between rounded-[18px] px-5 py-5 ${darkMode ? 'bg-white/5' : 'bg-[#f4eee8]'}`}>
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9A654B]">Selection atelier</span>
                  <div>
                    <span className="block font-serif text-[34px] font-bold leading-none">Pieces</span>
                    <span className="block font-serif text-[34px] font-bold leading-none">uniques</span>
                  </div>
                  <p className={`max-w-[30ch] text-[13px] leading-5 ${mutedText}`}>
                    Meubles restaures, finitions artisanales et coups de coeur disponibles.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateInstant('/#gallery-pieces')}
                    className={`global-menu-hover flex items-center justify-between border-t pt-4 text-left ${softBorder}`}
                  >
                    <span className="global-menu-hover__label font-serif text-[17px] font-bold">Voir les nouveautes</span>
                    <ChevronRight size={19} className="global-menu-hover__chevron text-[#9A654B]" />
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function GlobalMenuTriggerIsland({ darkMode = false } = {}) {
  const router = useRouter();
  const [effectiveDarkMode, setEffectiveDarkMode] = useState(darkMode);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelClosing, setPanelClosing] = useState(false);
  const [panelReady, setPanelReady] = useState(false);
  const [instantShellActive, setInstantShellActive] = useState(false);
  const [fallbackMenuTop, setFallbackMenuTop] = useState(110);
  const [hasClientMounted, setHasClientMounted] = useState(false);
  const [desktopMenuViewport, setDesktopMenuViewport] = useState(false);
  const [criticalAuthUser, setCriticalAuthUser] = useState(null);
  const [criticalAuthIsAdmin, setCriticalAuthIsAdmin] = useState(false);
  const closeTimerRef = useRef(null);
  const openFrameRef = useRef(null);
  const transitionLockTimerRef = useRef(null);
  const transitionLockedRef = useRef(false);
  const panelReadyRef = useRef(false);
  const pointerOpenedRef = useRef(false);
  const [transitionLocked, setTransitionLocked] = useState(false);
  const warmGlobalMenuPanel = useCallback(() => {
    if (isDesktopMenuViewport()) {
      return Promise.resolve(null);
    }

    const promise = preloadGlobalMenuPanel({ waitForDesktopView: isDesktopMenuViewport() })
      .then(() => {
        panelReadyRef.current = true;
        setPanelReady(true);
      })
      .catch(() => null);
    return promise;
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

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const kickoffId = window.requestAnimationFrame(warmGlobalMenuPanel);

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(warmGlobalMenuPanel, { timeout: 1200 });
      return () => {
        window.cancelAnimationFrame(kickoffId);
        window.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = window.setTimeout(warmGlobalMenuPanel, 900);
    return () => {
      window.cancelAnimationFrame(kickoffId);
      window.clearTimeout(timeoutId);
    };
  }, [warmGlobalMenuPanel]);

  useEffect(() => () => {
    clearCloseTimer();
    clearOpenFrame();
    if (transitionLockTimerRef.current) {
      window.clearTimeout(transitionLockTimerRef.current);
      transitionLockTimerRef.current = null;
    }
  }, [clearCloseTimer, clearOpenFrame]);

  const presentPanel = useCallback(() => {
    clearCloseTimer();
    clearOpenFrame();
    const isDesktopOpen = isDesktopMenuViewport();

    if (isDesktopOpen) {
      unlockTransition();
      document.documentElement.classList.add(DESKTOP_MENU_OPEN_CLASS);
      setFallbackMenuTop(getCurrentMenuTop());
      setPanelMounted(true);
      setPanelClosing(false);
      setPanelOpen(true);
      return;
    }

    lockTransition(MENU_OPEN_LOCK_MS);
    setFallbackMenuTop(getCurrentMenuTop());
    setPanelMounted(true);
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
    const isDesktopOpen = isDesktopMenuViewport();
    setInstantShellActive(!isDesktopOpen);
    if (!isDesktopOpen) {
      warmGlobalMenuPanel();
    }
    presentPanel();
  }, [clearCloseTimer, clearOpenFrame, presentPanel, warmGlobalMenuPanel]);

  useEffect(() => {
    if (desktopMenuViewport || !panelOpen || !panelReady || !instantShellActive) {
      return undefined;
    }

    const handoffTimer = window.setTimeout(() => {
      setInstantShellActive(false);
    }, MOBILE_SHELL_HANDOFF_MS);

    return () => window.clearTimeout(handoffTimer);
  }, [desktopMenuViewport, instantShellActive, panelOpen, panelReady]);

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
        setPanelMounted(false);
        setInstantShellActive(false);
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
      setPanelMounted(false);
      setInstantShellActive(false);
      closeTimerRef.current = null;
    }, 540);
  }, [clearCloseTimer, clearOpenFrame, lockTransition, unlockTransition]);

  const closePanelInstantly = useCallback(() => {
    clearCloseTimer();
    clearOpenFrame();
    unlockTransition();
    setPanelOpen(false);
    setPanelClosing(false);
    setPanelMounted(false);
    setInstantShellActive(false);
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
    const isDesktopOpen = isDesktopMenuViewport();
    if (!isDesktopOpen) {
      warmGlobalMenuPanel();
    }
    if (event.button !== undefined && event.button !== 0) return;
    if (isDesktopOpen) {
      if (panelOpen) return;
      pointerOpenedRef.current = true;
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
        type="button"
        onClick={togglePanel}
        onFocus={warmGlobalMenuPanel}
        onPointerDown={handlePointerDown}
        onPointerEnter={warmGlobalMenuPanel}
        aria-disabled={transitionLocked && !desktopMenuViewport}
        className={`relative mr-1 flex h-10 min-w-10 touch-manipulation items-center justify-center gap-2 rounded-full px-2.5 transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5C42]/25 dark:focus-visible:ring-[#D9B58D]/45 md:mr-0 md:px-3.5 ${effectiveDarkMode ? 'bg-white/[0.08] text-stone-100 ring-1 ring-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/[0.14] hover:text-[#D9B58D]' : 'bg-white text-stone-900 shadow-sm shadow-stone-900/5 hover:text-[#8B5C42] dark:bg-white/[0.08] dark:text-stone-100 dark:ring-1 dark:ring-white/[0.08] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:bg-white/[0.14] dark:hover:text-[#D9B58D]'}`}
        aria-label={panelOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={panelOpen}
      >
        <MenuIcon open={panelOpen} />
        <span className="hidden text-[10px] font-black uppercase tracking-[0.16em] md:inline">Menu</span>
      </button>
      {hasClientMounted && typeof document !== 'undefined' ? createPortal(
        <>
          {desktopMenuViewport ? (
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
          ) : (
            <>
              {(!panelMounted || !panelReady || instantShellActive) ? (
                <GlobalMenuOpeningShell
                  darkMode={effectiveDarkMode}
                  menuTop={fallbackMenuTop}
                  open={panelOpen}
                  closing={panelClosing}
                  user={criticalAuthUser}
                  isAdmin={criticalAuthIsAdmin}
                  onClose={closePanel}
                />
              ) : null}
              {(panelMounted && panelReady && !instantShellActive) ? (
                <GlobalMenuPanelAuthIsland
                  darkMode={effectiveDarkMode}
                  panelOpen={panelOpen}
                  isMenuClosing={panelClosing}
                  keepMounted={panelMounted}
                  setPanelOpen={setPanelOpenWithMotion}
                  closePanelInstantly={closePanelInstantly}
                />
              ) : null}
            </>
          )}
        </>,
        document.body
      ) : null}
    </>
  );
}
