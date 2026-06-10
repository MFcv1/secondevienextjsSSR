'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Archive,
  Armchair,
  DoorClosed,
  DoorOpen,
  Flower2,
  Frame,
  Lamp,
  LampDesk,
  LampWallDown,
  RockingChair,
  Sofa,
  Table2,
} from 'lucide-react';
import { getCategoryUrl } from '../../utils/slug';

const NOUVEAUTES_ITEMS = [
  {
    id: 'n1',
    title: 'Malle de voyage en cuir',
    date: 'Il y a 2 jours',
    image: '/images/gallery-hero-1.webp',
    desc: 'Superbe malle ancienne restauree, ideale en table basse de salon.',
  },
  {
    id: 'n2',
    title: 'Enfilade scandinave',
    date: 'Il y a 3 jours',
    image: '/images/gallery-hero-2.webp',
    desc: "Design epure des annees 60, patine d'origine et portes planes.",
  },
  {
    id: 'n3',
    title: 'Appliques en laiton',
    date: 'Il y a 4 jours',
    image: '/images/gallery-hero-3.webp',
    desc: "Paire d'appliques restaurees avec jolis globes en opaline.",
  },
  {
    id: 'n4',
    title: 'Fauteuil lounge velours',
    date: 'Cette semaine',
    image: '/images/gallery-hero-4.webp',
    desc: 'Assise refaite a neuf par notre tapissier partenaire, grand confort.',
  },
  {
    id: 'n5',
    title: 'Miroir triptyque vintage',
    date: 'Cette semaine',
    image: '/images/gallery-hero-1.webp',
    desc: "Piece rare aux finitions nickelees, dos cartonne d'epoque.",
  },
];

const MENU_ITEMS = [
  { id: 'nouveautes', label: 'Nouveautes', href: '/galerie#gallery-pieces', hasMega: true, customType: 'preview-list', dropdownWidth: 680 },
  {
    id: 'meubles',
    label: 'Meubles',
    href: getCategoryUrl('meubles'),
    hasMega: true,
    dropdownWidth: 760,
    links: [
      { Icon: Archive, title: 'Commodes / Chevets', desc: 'Rangements elegants et restaures', href: getCategoryUrl('commodes') },
      { Icon: DoorOpen, title: 'Buffets', desc: 'Enfilades et buffets de campagne', href: getCategoryUrl('buffets') },
      { Icon: DoorClosed, title: 'Armoires', desc: 'Armoires normandes et restaurees', href: getCategoryUrl('armoires') },
      { Icon: Table2, title: 'Tables', desc: 'Tables de ferme et de bistrot', href: getCategoryUrl('tables') },
    ],
    resources: ['Notre guide des patines', 'Sur-mesure : nos tarifs'],
  },
  {
    id: 'assises',
    label: 'Assises',
    href: getCategoryUrl('assises'),
    hasMega: true,
    dropdownWidth: 760,
    links: [
      { Icon: Armchair, title: 'Chaises', desc: 'Depareillees ou en lot uniforme', href: getCategoryUrl('chaises') },
      { Icon: Sofa, title: 'Fauteuils', desc: 'Le confort du design du 20eme', href: getCategoryUrl('fauteuils') },
      { Icon: RockingChair, title: 'Bancs', desc: 'Authenticite brute', href: getCategoryUrl('bancs') },
    ],
    resources: ['Selection de tissus nobles', 'Restauration de cannes'],
  },
  {
    id: 'eclairage',
    label: 'Eclairage',
    href: getCategoryUrl('eclairage'),
    hasMega: true,
    dropdownWidth: 760,
    links: [
      { Icon: Lamp, title: 'Suspensions', desc: 'Verre opaline et globes anciens', href: getCategoryUrl('eclairage') },
      { Icon: LampDesk, title: 'Lampes a poser', desc: 'Creer une ambiance feutree', href: getCategoryUrl('eclairage') },
      { Icon: LampWallDown, title: 'Appliques murales', desc: 'Ceramique, laiton et elegance', href: getCategoryUrl('eclairage') },
    ],
    resources: ['Conseil en eclairage', 'Normes electriques vintage'],
  },
  {
    id: 'decorations',
    label: 'Decorations',
    href: getCategoryUrl('decorations'),
    hasMega: true,
    dropdownWidth: 540,
    singleColumn: true,
    links: [
      { Icon: Flower2, title: 'Ceramiques & Vases', desc: 'Vallauris et pepites signees', href: getCategoryUrl('deco') },
      { Icon: Frame, title: 'Cadres & Miroirs', desc: 'Miroirs dores ou en rotin', href: getCategoryUrl('miroirs') },
    ],
    resources: ['Inspiration Galerie'],
  },
  { id: 'prix-bas', label: 'Prix bas', href: '/galerie#gallery-small-prices', customColor: 'text-[#d9534f] hover:text-red-700' },
  { id: 'propos', label: 'A propos', href: '/a-propos' },
];

function NouveautesContent({ darkMode }) {
  const [hoveredId, setHoveredId] = useState(NOUVEAUTES_ITEMS[0].id);
  const activeItem = NOUVEAUTES_ITEMS.find((item) => item.id === hoveredId) || NOUVEAUTES_ITEMS[0];

  return (
    <div className="flex w-[550px] lg:w-[680px]">
      <div className="mega-menu-col mega-menu-col-left flex w-[240px] shrink-0 flex-col justify-center px-4 py-6">
        <ul className="relative flex w-full flex-col gap-0.5">
          {NOUVEAUTES_ITEMS.map((item) => (
            <li key={item.id} onMouseEnter={() => setHoveredId(item.id)} className="relative flex items-center">
              <a
                href="/galerie#gallery-pieces"
                className={`relative z-10 w-full rounded-lg px-4 py-2.5 text-[13px] transition-colors ${
                  hoveredId === item.id
                    ? (darkMode ? 'bg-white/10 font-medium text-white' : 'bg-stone-200 font-medium text-black')
                    : (darkMode ? 'text-stone-400 hover:text-stone-300' : 'text-stone-500 hover:text-stone-700')
                }`}
              >
                {item.title}
              </a>
            </li>
          ))}
          <li className="mt-4 border-t border-stone-200/20 px-4 pt-4">
            <a href="/galerie#gallery-pieces" className={`flex w-full items-center justify-between text-[11px] font-bold uppercase tracking-widest transition-colors group ${darkMode ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-black'}`}>
              Voir le catalogue <span className="transition-transform group-hover:translate-x-1">-&gt;</span>
            </a>
          </li>
        </ul>
      </div>
      <div className={`mega-menu-col mega-menu-col-right flex w-full items-stretch border-l p-6 ${darkMode ? 'border-white/5 bg-[#151515]' : 'border-stone-100 bg-[#F2F2F0]'}`}>
        <a
          href="/galerie#gallery-pieces"
          className={`group flex w-full cursor-pointer rounded-[16px] border p-5 shadow-sm no-underline ${
            darkMode ? 'border-white/10 bg-[#1A1A1A] shadow-black/40' : 'border-stone-100 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]'
          }`}
        >
          <span className="flex flex-1 flex-col justify-center pr-6">
            <span className={`mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] ${darkMode ? 'text-stone-500' : 'text-[#A08E77]'}`}>
              En vedette
            </span>
            <span className={`mb-2 block font-serif text-[15px] font-medium leading-tight transition-colors ${darkMode ? 'text-stone-200 group-hover:text-white' : 'text-stone-800 group-hover:text-black'}`}>
              {activeItem.title}
            </span>
            <span className={`mb-5 block line-clamp-3 text-[11.5px] leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
              {activeItem.desc}
            </span>
            <span className={`mt-auto flex items-center gap-1.5 text-[11px] font-bold ${darkMode ? 'text-[#cfa471]' : 'text-stone-900'} group-hover:underline underline-offset-4 decoration-[#cfa471]/30`}>
              Voir la piece <span className="transition-transform group-hover:translate-x-1">-&gt;</span>
            </span>
          </span>
          <span className="relative flex h-full w-[170px] shrink-0 items-center overflow-hidden rounded-xl shadow-inner">
            <img src={activeItem.image} alt={activeItem.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <span className="absolute inset-0 bg-stone-900/10 mix-blend-multiply transition-opacity group-hover:opacity-0" />
          </span>
        </a>
      </div>
    </div>
  );
}

export default function PremiumMegaMenuIsland({ darkMode = false } = {}) {
  const [hoveredTab, setHoveredTab] = useState(null);
  const [renderedTab, setRenderedTab] = useState(null);
  const [menuMotionState, setMenuMotionState] = useState('closed');
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const timeoutRef = useRef(null);
  const exitTimeoutRef = useRef(null);
  const frameRef = useRef(null);
  const navRef = useRef(null);

  const clearMenuTimers = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (exitTimeoutRef.current) {
      window.clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const openPanel = useCallback((itemId) => {
    clearMenuTimers();
    setRenderedTab(itemId);
    setMenuMotionState((state) => (state === 'open' ? 'open' : 'opening'));
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = window.requestAnimationFrame(() => {
        setMenuMotionState('open');
        frameRef.current = null;
      });
    });
  }, [clearMenuTimers]);

  const closeTab = useCallback((delay = 160) => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      setHoveredTab(null);
      setMenuMotionState('closing');
      exitTimeoutRef.current = window.setTimeout(() => {
        setRenderedTab(null);
        setMenuMotionState('closed');
        exitTimeoutRef.current = null;
      }, 360);
      timeoutRef.current = null;
    }, delay);
  }, []);

  const openTab = useCallback((item, event) => {
    setHoveredTab(item.id);
    if (!item.hasMega) {
      closeTab(80);
      return;
    }
    if (!event?.currentTarget || !navRef.current) return;
    const itemRect = event.currentTarget.getBoundingClientRect();
    const navRect = navRef.current.getBoundingClientRect();
    const width = item.dropdownWidth || 760;
    let left = itemRect.left - navRect.left + 12;
    if (left + width > navRect.width - 20) left = Math.max(0, itemRect.right - navRect.left - width + 12);
    setDropdownLeft(left);
    openPanel(item.id);
  }, [closeTab, openPanel]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeTab(0);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearMenuTimers();
    };
  }, [clearMenuTimers, closeTab]);

  const activeItem = MENU_ITEMS.find((item) => item.id === renderedTab && item.hasMega);
  const isPanelVisible = Boolean(activeItem && menuMotionState !== 'closed');

  return (
    <>
      <nav
        ref={navRef}
        className={`relative z-40 hidden w-full border-b py-[9px] md:block ${darkMode ? 'border-stone-800/20 bg-[#121212]' : 'border-stone-100 bg-[#FAFAF9]'}`}
        onMouseLeave={closeTab}
      >
        <ul className="relative mx-auto flex max-w-7xl items-center justify-center gap-4 font-sans text-[13px] tracking-[0.05em] lg:gap-8">
          {MENU_ITEMS.map((item) => (
            <li
              key={item.id}
              onMouseEnter={(event) => openTab(item, event)}
              className={`relative z-10 flex cursor-pointer items-center gap-1.5 px-3 py-[6px] font-medium transition-colors ${item.customColor || (darkMode ? 'text-stone-300 hover:text-white' : 'text-stone-600 hover:text-black')}`}
            >
              <a href={item.href} className="relative z-10 flex items-center gap-1.5 text-inherit no-underline">
                {item.label}
                {item.hasMega ? <span className={`text-[7px] transition-transform duration-300 ${hoveredTab === item.id || renderedTab === item.id ? '-rotate-180' : 'rotate-0'}`}>v</span> : null}
              </a>
              {hoveredTab === item.id || renderedTab === item.id ? <span className={`absolute inset-0 -z-10 rounded-full ${darkMode ? 'bg-white/10' : 'bg-black/5'}`} /> : null}
            </li>
          ))}
        </ul>

        {isPanelVisible ? (
          <div
            className="absolute left-0 top-full z-50 h-2 w-full pointer-events-auto"
            onMouseEnter={clearMenuTimers}
          >
            <div
              className="premium-mega-menu-positioner absolute top-2 pointer-events-auto"
              style={{ transform: `translate3d(${dropdownLeft}px, 0, 0)`, width: activeItem.dropdownWidth || 760 }}
            >
              <div
                className={`mega-menu-panel overflow-hidden rounded-[20px] shadow-2xl backdrop-blur-2xl ${darkMode ? 'bg-[#1A1A1A]/95 shadow-[0_30px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/10' : 'bg-white/95 shadow-[0_30px_60px_rgba(0,0,0,0.12)] ring-1 ring-stone-200/60'}`}
                data-menu-state={menuMotionState}
                onMouseEnter={() => {
                  clearMenuTimers();
                  setMenuMotionState('open');
                }}
              >
                {activeItem.customType === 'preview-list' ? (
                  <NouveautesContent darkMode={darkMode} key={activeItem.id} />
                ) : (
                  <div className="flex" key={activeItem.id}>
                    <div className={`mega-menu-col mega-menu-col-left p-8 ${activeItem.singleColumn ? 'w-[300px]' : 'w-[500px]'}`}>
                      <h3 className={`mb-6 text-[10px] font-bold uppercase tracking-[0.2em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                        Explorer {activeItem.label}
                      </h3>
                      <div className={`grid ${activeItem.singleColumn ? 'grid-cols-1 gap-y-8' : 'grid-cols-2 gap-x-6 gap-y-8'}`}>
                        {activeItem.links?.map(({ Icon, title, desc, href }) => (
                          <a key={title} href={href} className={`group/link -m-3 flex gap-4 rounded-xl p-3 transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-stone-100/80'}`}>
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border transition-all duration-300 ${darkMode ? 'border-white/5 bg-white/5 group-hover/link:bg-white/10' : 'border-stone-100 bg-stone-50 group-hover/link:border-stone-200 group-hover/link:bg-stone-100'}`}>
                              <Icon size={20} strokeWidth={1.5} className={`transition-all duration-300 group-hover/link:scale-110 group-hover/link:rotate-6 ${darkMode ? 'text-stone-400 group-hover/link:text-white' : 'text-stone-400 group-hover/link:text-stone-800'}`} />
                            </span>
                            <span>
                              <span className={`mb-1 block text-[13px] font-bold transition-colors ${darkMode ? 'text-stone-200 group-hover/link:text-white' : 'text-stone-800 group-hover/link:text-black'}`}>{title}</span>
                              <span className="block text-[11px] leading-tight text-stone-500">{desc}</span>
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                    <div className={`mega-menu-col mega-menu-col-right w-[260px] shrink-0 border-l p-8 ${darkMode ? 'border-white/5 bg-[#151515]' : 'border-stone-100 bg-[#FAFAF9]'}`}>
                      <h3 className={`mb-6 text-[10px] font-bold uppercase tracking-[0.2em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                        Ressources cles
                      </h3>
                      <div className="flex flex-col gap-5">
                        {(activeItem.resources || []).map((title) => (
                          <a key={title} href="/devis" className={`-mx-2.5 flex items-center gap-2 rounded-lg p-2.5 text-[13px] font-medium transition-colors ${darkMode ? 'text-stone-400 hover:bg-white/5 hover:text-white' : 'text-stone-500 hover:bg-stone-100/80 hover:text-black'}`}>
                            <span>-&gt;</span>
                            {title}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </nav>
    </>
  );
}
