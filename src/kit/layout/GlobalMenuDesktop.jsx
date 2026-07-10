'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, MotionConfig, useReducedMotion } from 'framer-motion';
import {
    Archive,
    Armchair,
    ChevronRight,
    ClipboardCheck,
    DoorClosed,
    DoorOpen,
    Flower2,
    Frame,
    Headphones,
    Home,
    Lamp,
    Package,
    Paintbrush,
    RockingChair,
    ShieldCheck,
    Sofa,
    Sparkles,
    Table2,
    Truck,
    UserRound,
    Wrench
} from 'lucide-react';
import KIT_CONFIG from '../config/constants';
import { getCategoryUrl } from '../../utils/slug';

const CATEGORY_ICONS = {
    armoires: DoorClosed,
    buffets: DoorOpen,
    commodes: Archive,
    tables: Table2,
    chaises: Armchair,
    fauteuils: Sofa,
    bancs: RockingChair,
    eclairage: Lamp,
    miroirs: Frame,
    deco: Flower2,
};

const ROOM_LINKS = [
    { label: 'Salon', categoryId: 'meubles' },
    { label: 'Salle à manger', categoryId: 'tables' },
    { label: 'Chambre', categoryId: 'armoires' },
    { label: 'Entrée', categoryId: 'commodes' },
    { label: 'Bureau', categoryId: 'tables' },
    { label: 'Extérieur', categoryId: 'meubles' },
];

const SELECTION_TILES = [
    { label: 'Buffets', categoryId: 'buffets', image: '/images/categories/buffets-config-rail.webp' },
    { label: 'Armoires', categoryId: 'armoires', image: '/images/categories/armoires-config-rail.webp' },
    { label: 'Miroirs', categoryId: 'miroirs', image: '/images/categories/miroirs-config-rail.webp' },
    { label: 'Commodes', categoryId: 'commodes', image: '/images/categories/commodes-config-rail.webp' },
];

const MENU_IMAGE_SOURCES = [
    ...SELECTION_TILES.map(({ image }) => image),
    '/images/menu-delivery-marseille-wide.jpg',
    '/images/before-after/apresu.webp',
];

const ATELIER_LINKS = [
    { label: 'Rénovation sur‑mesure', desc: 'Confiez-nous vos meubles', Icon: Wrench },
    { label: 'Patines & Finitions', desc: 'Des finitions artisanales', Icon: Paintbrush },
    { label: 'Avant / Après', desc: 'Nos transformations', Icon: Sparkles },
    { label: 'Atelier sur rendez‑vous', desc: 'Venez nous rencontrer', Icon: ShieldCheck },
];

const SERVICE_ITEMS = [
    { title: 'Livraison soignée', text: 'Partout en France', Icon: Truck },
    { title: 'Paiement sécurisé', text: 'et 4x sans frais', Icon: ShieldCheck },
    { title: 'Meubles uniques', text: 'Sélectionnés avec passion', Icon: Sparkles },
    { title: 'Une équipe humaine', text: 'à votre écoute', Icon: Headphones },
];

const formatCategoryLabel = (label = '') => {
    const cleaned = label
        .replace(/^LES\s+/i, '')
        .replace(/^LE\s+/i, '')
        .replace(/^LA\s+/i, '')
        .replace(/^L['’]\s*/i, '');

    return cleaned
        .toLocaleLowerCase('fr-FR')
        .replace(/(^|[\s&/-])([^\s&/-])/g, (_, separator, char) => (
            `${separator}${char.toLocaleUpperCase('fr-FR')}`
        ));
};

const MENU_EASE = [0.22, 1, 0.36, 1];
const MENU_FADE_EASE = [0.16, 1, 0.3, 1];
const MENU_PANEL_OPEN_EASE = [0.22, 1, 0.36, 1];
const MENU_CONTAINER_EASE = [0.22, 1, 0.36, 1];
const MENU_CLOSE_EASE = [0.7, 0, 0.3, 1];
const MENU_SEQUENCE = {
    sidebar: { delay: 0.22, exitDelay: 0.09 },
    categories: { delay: 0.38, exitDelay: 0.06 },
    categoriesColumn: { delay: 0.48 },
    discovery: { delay: 0.66 },
    atelier: { delay: 0.84, exitDelay: 0.03 },
    atelierInner: { delay: 0.96 },
    atelierMedia: { delay: 1.12 },
    services: { delay: 1.3, exitDelay: 0 },
};

let menuImagesWarmPromise = null;

export const preloadGlobalMenuImages = () => {
    if (typeof window === 'undefined') return Promise.resolve();
    if (menuImagesWarmPromise) return menuImagesWarmPromise;

    menuImagesWarmPromise = Promise.allSettled(MENU_IMAGE_SOURCES.map((src) => (
        new Promise((resolve) => {
            const image = new Image();
            image.decoding = 'async';
            image.onload = resolve;
            image.onerror = resolve;
            image.src = src;
            image.decode?.().then(resolve).catch(resolve);
        })
    )));

    return menuImagesWarmPromise;
};

const getMenuStage = (stage = {}) => (
    typeof stage === 'number' ? { delay: stage } : stage
);

const getMenuStageDelay = (stage = {}) => {
    const { delay = 0, reduceMotion = false } = getMenuStage(stage);
    return reduceMotion ? 0 : delay;
};

const desktopPanelVariants = {
    hidden: {
        opacity: 0,
        y: -10,
        clipPath: 'inset(0 0 100% 0 round 0px)',
        pointerEvents: 'none',
    },
    visible: ({ reduceMotion = false } = {}) => ({
        opacity: 1,
        y: 0,
        clipPath: 'inset(0 0 0% 0 round 0px)',
        pointerEvents: 'auto',
        transition: {
            duration: reduceMotion ? 0.01 : 0.62,
            ease: MENU_PANEL_OPEN_EASE,
            opacity: { duration: reduceMotion ? 0.01 : 0.26, ease: MENU_FADE_EASE },
        },
    }),
    exit: {
        opacity: 0,
        y: -8,
        clipPath: 'inset(0 0 100% 0 round 0px)',
        pointerEvents: 'none',
        transition: {
            duration: 0.42,
            ease: MENU_CLOSE_EASE,
            delay: 0.05,
            opacity: { duration: 0.01, delay: 0.45 },
        },
    },
};

const menuBlockVariants = {
    hidden: (stage = {}) => {
        const { reduceMotion = false } = getMenuStage(stage);
        return {
            opacity: 0,
            x: reduceMotion ? 0 : -14,
            y: reduceMotion ? 0 : 12,
            transition: { duration: 0.01 },
        };
    },
    visible: (stage = {}) => {
        const { reduceMotion = false } = getMenuStage(stage);
        const delay = getMenuStageDelay(stage);
        return {
            opacity: 1,
            x: 0,
            y: 0,
            transition: {
                duration: reduceMotion ? 0.01 : 0.56,
                ease: MENU_CONTAINER_EASE,
                delay,
                opacity: { duration: reduceMotion ? 0.01 : 0.32, ease: MENU_FADE_EASE, delay },
            },
        };
    },
    exit: (stage = {}) => ({
        opacity: 0,
        x: 0,
        y: -10,
        transition: {
            duration: 0.22,
            ease: MENU_CLOSE_EASE,
            delay: getMenuStage(stage).exitDelay || 0,
        },
    }),
};

const desktopMenuContentVariants = {
    hidden: {},
    visible: ({ reduceMotion = false } = {}) => ({
        opacity: 1,
        transition: {
            delayChildren: reduceMotion ? 0 : 0.01,
        },
    }),
    exit: {},
};

const menuRevealVariants = {
    hidden: { x: 0, y: 6, opacity: 0 },
    visible: {
        x: 0,
        y: 0,
        opacity: 1,
        transition: { duration: 0.38, ease: MENU_FADE_EASE },
    },
    exit: { x: 0, y: 0, opacity: 1, transition: { duration: 0.01 } },
};

const menuGroupVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.024,
            delayChildren: 0.015,
        },
    },
    exit: {},
};

const menuColumnVariants = {
    hidden: (stage = {}) => {
        const { reduceMotion = false } = getMenuStage(stage);
        return {
            x: 0,
            y: reduceMotion ? 0 : 8,
            opacity: 0,
            transition: { duration: 0.01 },
        };
    },
    visible: (stage = {}) => {
        const { reduceMotion = false } = getMenuStage(stage);
        const delay = getMenuStageDelay(stage);
        return {
            y: 0,
            x: 0,
            opacity: 1,
            transition: {
                duration: reduceMotion ? 0.01 : 0.48,
                ease: MENU_CONTAINER_EASE,
                delay,
                opacity: { duration: reduceMotion ? 0.01 : 0.34, ease: MENU_FADE_EASE, delay },
                delayChildren: reduceMotion ? 0 : delay + 0.05,
                staggerChildren: reduceMotion ? 0 : 0.028,
            },
        };
    },
    exit: { x: 0, y: 0, opacity: 1, transition: { duration: 0.01 } },
};

const menuItemVariants = {
    hidden: { x: 0, y: 7, opacity: 0 },
    visible: {
        x: 0,
        y: 0,
        opacity: 1,
        transition: { duration: 0.32, ease: MENU_FADE_EASE },
    },
    exit: { x: 0, y: 0, opacity: 1, transition: { duration: 0.01 } },
};

const menuTileVariants = {
    hidden: { x: 0, y: 9, opacity: 0 },
    visible: {
        x: 0,
        y: 0,
        opacity: 1,
        transition: { duration: 0.36, ease: MENU_FADE_EASE },
    },
    exit: { x: 0, y: 0, opacity: 1, transition: { duration: 0.01 } },
};

const selectionTileVariants = {
    hidden: { x: 0, y: 9, opacity: 0 },
    visible: {
        x: 0,
        y: 0,
        opacity: 1,
        transition: { duration: 0.34, ease: MENU_FADE_EASE },
    },
    exit: { x: 0, y: 0, opacity: 1, transition: { duration: 0.01 } },
};

const textTapMotion = {
    scale: 0.992,
    transition: { duration: 0.1, ease: MENU_EASE },
};

export default function GlobalMenuDesktop({
    isMenuInteractive,
    isMenuClosing,
    isMenuOpen,
    panelRef,
    desktopContentRef,
    desktopPanelMaxHeight,
    panelTone,
    currentView,
    user,
    isAdmin,
    darkMode,
    navigateToPath,
    handleLogin,
}) {
    const prefersReducedMotion = useReducedMotion();
    const [shouldAnimateOpen, setShouldAnimateOpen] = useState(() => isMenuOpen && !isMenuClosing);
    const [openCycle, setOpenCycle] = useState(0);
    const openFrameRef = useRef(null);
    const desktopMotionContext = useMemo(() => ({
        reduceMotion: Boolean(prefersReducedMotion),
    }), [prefersReducedMotion]);

    const withDesktopMotionContext = useCallback((stage = {}) => ({
        ...getMenuStage(stage),
        ...desktopMotionContext,
    }), [desktopMotionContext]);

    const categories = useMemo(() => (
        KIT_CONFIG.productCategories.map((category) => ({
            ...category,
            label: formatCategoryLabel(category.label),
            Icon: CATEGORY_ICONS[category.id] || Archive,
        }))
    ), []);

    useEffect(() => {
        if (!isMenuOpen || isMenuClosing) {
            if (openFrameRef.current) {
                window.cancelAnimationFrame(openFrameRef.current);
                openFrameRef.current = null;
            }
            setShouldAnimateOpen(false);
            return undefined;
        }

        setShouldAnimateOpen(false);
        setOpenCycle((cycle) => cycle + 1);
        openFrameRef.current = window.requestAnimationFrame(() => {
            setShouldAnimateOpen(true);
            openFrameRef.current = null;
        });

        return () => {
            if (openFrameRef.current) {
                window.cancelAnimationFrame(openFrameRef.current);
                openFrameRef.current = null;
            }
        };
    }, [isMenuClosing, isMenuOpen]);

    const isSignedIn = user && !user.isAnonymous;
    const isGalleryContext = ['gallery', 'wishlist'].includes(currentView);
    const shouldLoadMenuMedia = isMenuOpen || isMenuClosing || isMenuInteractive;
    const menuAnimationState = isMenuClosing ? 'exit' : (shouldAnimateOpen ? 'visible' : 'hidden');
    const menuContentAnimationState = isMenuClosing ? 'exit' : (shouldAnimateOpen && isMenuInteractive ? 'visible' : 'hidden');

    const mutedText = darkMode ? 'text-stone-500' : 'text-stone-500';
    const softBorder = darkMode ? 'border-stone-800' : 'border-stone-200';
    const desktopCard = darkMode
        ? 'border border-white/10 bg-[#181818]/95 shadow-[0_18px_54px_rgba(0,0,0,0.32)]'
        : 'border border-stone-200/80 bg-white/95 shadow-[0_18px_54px_rgba(92,64,47,0.07)]';
    const desktopSoftCard = darkMode
        ? 'border border-white/10 bg-white/[0.045]'
        : 'border border-stone-200/70 bg-[#fbfaf8]/95';
    const desktopWarmCard = darkMode
        ? 'border border-white/10 bg-[#1f1b18]'
        : 'border border-[#e7ded5] bg-[#f3eee9]';
    const desktopInsetCard = darkMode
        ? 'bg-[#151515] ring-1 ring-white/10'
        : 'bg-[#fffaf6] ring-1 ring-[#eadfd6]';

    const openAbout = () => navigateToPath('/a-propos');
    const goToCategory = (categoryId) => navigateToPath(getCategoryUrl(categoryId));
    const openQuoteRequest = () => navigateToPath('/devis');
    const openAccount = () => navigateToPath('/mes-commandes');

    const primaryLinks = [
        { label: 'Accueil', desc: 'Galerie principale', Icon: Home, active: isGalleryContext, action: () => navigateToPath('/') },
        { label: 'À propos', desc: 'Atelier et histoire', Icon: UserRound, active: false, action: openAbout },
        { label: 'Commandes', desc: 'Espace client', Icon: Package, active: currentView === 'my-orders', action: () => (isSignedIn ? navigateToPath('/mes-commandes') : handleLogin()) },
        { label: 'Devis', desc: 'Projet sur mesure', Icon: ClipboardCheck, active: false, action: openQuoteRequest },
        ...(isAdmin ? [{ label: 'Admin.', desc: 'Backoffice', Icon: ShieldCheck, active: currentView === 'admin', action: () => navigateToPath('/admin') }] : []),
    ];

    return (
        <MotionConfig reducedMotion="user">
            <motion.section
                ref={panelRef}
                className={`${isMenuInteractive ? 'pointer-events-auto' : 'pointer-events-none'} global-menu-scrollbarless absolute left-0 right-0 overflow-hidden overscroll-contain shadow-[0_28px_80px_rgba(28,25,23,0.13)] ${panelTone}`}
                variants={desktopPanelVariants}
                custom={desktopMotionContext}
                initial="hidden"
                animate={menuAnimationState}
                style={{
                    top: 0,
                    maxHeight: desktopPanelMaxHeight,
                    pointerEvents: 'auto',
                    overflowAnchor: 'none',
                    contain: 'layout paint',
                    willChange: 'transform, opacity, clip-path',
                }}
            >
                <motion.div
                    key={`desktop-menu-open-${openCycle}`}
                    ref={desktopContentRef}
                    className="global-menu-desktop-content w-full px-5 pb-7 pt-6 xl:px-7 2xl:px-9"
                    variants={desktopMenuContentVariants}
                    initial="hidden"
                    animate={menuContentAnimationState}
                    custom={desktopMotionContext}
                >
                    <motion.div className="grid grid-cols-[250px_minmax(0,1fr)] gap-4 xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-5">
                        <motion.aside data-global-menu-panel="sidebar" className={`flex h-[540px] flex-col justify-between rounded-[22px] p-3.5 xl:p-4 ${desktopSoftCard}`} variants={menuBlockVariants} custom={withDesktopMotionContext(MENU_SEQUENCE.sidebar)}>
                            <motion.nav className="space-y-2" variants={menuGroupVariants}>
                                {primaryLinks.map(({ label, desc, Icon, action }) => (
                                    <motion.button
                                        key={label}
                                        type="button"
                                        onClick={action}
                                        className="global-menu-hover group flex w-full items-center gap-3.5 rounded-lg px-4 py-3.5 text-left"
                                        variants={menuItemVariants}
                                        whileTap={textTapMotion}
                                    >
                                        <Icon size={22} strokeWidth={1.35} className={`global-menu-hover__icon ${mutedText}`} />
                                        <span>
                                            <span className="global-menu-hover__label block font-serif text-[18px] font-semibold leading-tight">{label}</span>
                                            <span className={`global-menu-hover__desc mt-1 block text-[12px] ${mutedText}`}>{desc}</span>
                                        </span>
                                    </motion.button>
                                ))}
                            </motion.nav>

                            <motion.div className={`border-t px-1.5 pt-6 ${softBorder}`} variants={menuItemVariants}>
                                {isSignedIn ? (
                                    <motion.button
                                        type="button"
                                        onClick={openAccount}
                                        className={`global-menu-hover flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${darkMode ? 'bg-white/5' : 'bg-stone-50'}`}
                                        variants={menuItemVariants}
                                        whileTap={textTapMotion}
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#9A654B] text-sm font-black text-white">
                                            {(user.email || user.displayName || 'M').charAt(0).toUpperCase()}
                                        </div>
                                        <span className="min-w-0">
                                            <span className="global-menu-hover__label block text-[12px] font-black">Mon espace</span>
                                            <span className={`global-menu-hover__desc block truncate text-[11px] ${mutedText}`}>
                                                Commandes et suivi
                                            </span>
                                        </span>
                                        <ChevronRight size={18} strokeWidth={1.4} className="ml-auto shrink-0 text-[#9A654B]" />
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        type="button"
                                        onClick={handleLogin}
                                        className={`global-menu-hover flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${darkMode ? 'bg-white/5' : 'bg-stone-50'}`}
                                        variants={menuItemVariants}
                                        whileTap={textTapMotion}
                                    >
                                        <UserRound size={18} className="global-menu-hover__icon" />
                                        <span>
                                            <span className="global-menu-hover__label block text-[12px] font-black">Se connecter</span>
                                            <span className={`global-menu-hover__desc text-[11px] ${mutedText}`}>Accéder à votre espace</span>
                                        </span>
                                    </motion.button>
                                )}
                            </motion.div>
                        </motion.aside>

                        <motion.div className="grid grid-cols-[minmax(660px,2.06fr)_minmax(560px,1.94fr)] gap-3 xl:gap-4">
                            <motion.section className={`grid h-[540px] grid-cols-[minmax(220px,0.72fr)_minmax(0,1.34fr)] overflow-hidden rounded-[22px] ${desktopCard}`} variants={menuBlockVariants} custom={withDesktopMotionContext(MENU_SEQUENCE.categories)}>
                                <motion.div data-global-menu-panel="categories" className="flex min-h-0 flex-col px-4 py-4 xl:px-5 xl:py-5 2xl:px-6" variants={menuColumnVariants} custom={withDesktopMotionContext(MENU_SEQUENCE.categoriesColumn)}>
                                <motion.h2 className="mb-4 text-[11px] font-black uppercase tracking-[0.17em]" variants={menuRevealVariants}>Meubles par catégorie</motion.h2>
                                <motion.div className="grid gap-1.5" variants={menuGroupVariants}>
                                    {categories.map(({ id, label, Icon }) => (
                                        <motion.button
                                            key={id}
                                            type="button"
                                            onClick={() => goToCategory(id)}
                                            className="global-menu-hover group -mx-2 flex min-h-8 items-center gap-2.5 rounded-md px-2 text-left"
                                            variants={menuItemVariants}
                                            whileTap={textTapMotion}
                                        >
                                            <Icon size={18} strokeWidth={1.35} className="global-menu-hover__icon text-[#9A654B]" />
                                            <span className={`global-menu-hover__label font-serif text-[18px] font-semibold leading-[1.05] ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
                                                {label}
                                            </span>
                                        </motion.button>
                                    ))}
                                </motion.div>
                                <motion.button
                                    type="button"
                                    onClick={() => navigateToPath('/')}
                                    className={`global-menu-hover global-menu-hover--ambient mt-auto flex min-h-10 items-center gap-2 border-t pt-3 font-serif text-[14px] font-semibold leading-none text-[#8B5C42] ${softBorder}`}
                                    variants={menuItemVariants}
                                    whileTap={textTapMotion}
                                >
                                    <span className="global-menu-hover__label">Voir toutes les catégories</span>
                                    <ChevronRight size={15} className="global-menu-hover__chevron shrink-0" />
                                </motion.button>
                                </motion.div>

                                <motion.div data-global-menu-panel="discovery" className={`flex min-h-0 flex-col border-l px-4 py-4 xl:px-5 xl:py-5 2xl:px-6 ${softBorder}`} variants={menuColumnVariants} custom={withDesktopMotionContext(MENU_SEQUENCE.discovery)}>
                                <motion.div className="mb-3" variants={menuRevealVariants}>
                                    <h2 className="text-[12px] font-black uppercase tracking-[0.18em]">Explorer la maison</h2>
                                    <p className={`mt-2 max-w-[34ch] text-[12px] leading-[1.45] ${mutedText}`}>
                                        Pièces de vie, rangements et coups de cœur.
                                    </p>
                                </motion.div>

                                <motion.div className="grid grid-cols-2 gap-1.5" variants={menuGroupVariants}>
                                    {ROOM_LINKS.map((room) => (
                                        <motion.button
                                            key={room.label}
                                            type="button"
                                            onClick={() => goToCategory(room.categoryId)}
                                            className={`global-menu-hover group flex min-h-8 items-center justify-between rounded-[10px] px-3 py-1 text-left ${darkMode ? 'bg-white/5' : 'bg-white/55'}`}
                                            variants={menuItemVariants}
                                            whileTap={textTapMotion}
                                        >
                                            <span className={`global-menu-hover__label font-serif text-[15.5px] font-semibold leading-tight ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
                                                {room.label}
                                            </span>
                                            <ChevronRight size={15} strokeWidth={1.4} className="global-menu-hover__chevron shrink-0 text-[#9A654B]" />
                                        </motion.button>
                                    ))}
                                </motion.div>

                                <motion.div className="mt-3" variants={menuRevealVariants}>
                                    <span className={`block h-px w-full bg-gradient-to-r from-transparent to-transparent ${darkMode ? 'via-white/10' : 'via-[#e5d8cb]/85'}`} />
                                    <div className="flex items-center justify-between pt-2.5">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">Notre sélection</span>
                                        <span className={`text-[11px] ${mutedText}`}>4 entrées rapides</span>
                                    </div>
                                </motion.div>

                                <motion.div className="mt-2 grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2" variants={menuGroupVariants}>
                                    {SELECTION_TILES.map((tile) => (
                                        <motion.button
                                            key={tile.label}
                                            type="button"
                                            onClick={() => goToCategory(tile.categoryId)}
                                            className="group relative h-full min-h-0 overflow-hidden rounded-[13px] bg-stone-100 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)] outline-none ring-[#9A654B]/0 transition-[box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-[#9A654B]/55"
                                            variants={selectionTileVariants}
                                        >
                                            <img
                                                src={shouldLoadMenuMedia ? tile.image : undefined}
                                                alt={tile.label}
                                                loading="lazy"
                                                decoding="async"
                                                fetchPriority="low"
                                                className="absolute inset-0 h-full w-full object-cover"
                                            />
                                            <span className="absolute inset-0 bg-gradient-to-t from-stone-950/48 via-stone-950/8 to-transparent" />
                                            <span className="absolute bottom-2.5 left-3 font-serif text-[15px] font-bold leading-none text-white drop-shadow-sm">
                                                {tile.label}
                                            </span>
                                        </motion.button>
                                    ))}
                                </motion.div>
                                </motion.div>
                            </motion.section>

                            <motion.section data-global-menu-panel="atelier" className={`grid h-[540px] grid-cols-[minmax(220px,0.86fr)_minmax(0,1.44fr)] gap-2 rounded-[22px] p-1.5 ${desktopWarmCard}`} variants={menuBlockVariants} custom={withDesktopMotionContext(MENU_SEQUENCE.atelier)}>
                                <motion.div className={`flex min-h-0 flex-col rounded-[18px] px-4 py-4 xl:px-4 xl:py-5 ${desktopInsetCard}`} variants={menuColumnVariants} custom={withDesktopMotionContext(MENU_SEQUENCE.atelierInner)}>
                                    <motion.h2 className="mb-6 text-[12px] font-black uppercase tracking-[0.18em]" variants={menuRevealVariants}>L’atelier Seconde Vie</motion.h2>
                                    <motion.div className="flex flex-1 flex-col justify-evenly py-2" variants={menuGroupVariants}>
                                        {ATELIER_LINKS.map(({ label, desc, Icon }) => (
                                            <motion.button
                                                key={label}
                                                type="button"
                                                onClick={openAbout}
                                                className="global-menu-hover global-menu-hover--ambient group flex items-start gap-3 rounded-lg text-left"
                                                variants={menuItemVariants}
                                                whileTap={textTapMotion}
                                            >
                                                <Icon size={18} strokeWidth={1.4} className="global-menu-hover__icon mt-1 shrink-0 text-[#9A654B]" />
                                                <span>
                                                    <span className="global-menu-hover__label block font-serif text-[16.5px] font-semibold leading-[1.14]">{label}</span>
                                                    <span className={`global-menu-hover__desc mt-1 block text-[11.5px] leading-[1.35] ${mutedText}`}>{desc}</span>
                                                </span>
                                            </motion.button>
                                        ))}
                                    </motion.div>

                                    <motion.button
                                        type="button"
                                        onClick={openQuoteRequest}
                                        className={`global-menu-hover mt-3 flex w-full items-center justify-between rounded-[16px] px-4 py-3.5 text-left ${darkMode ? 'bg-white/5' : 'bg-[#f4eee8]'}`}
                                        variants={menuItemVariants}
                                        whileTap={textTapMotion}
                                    >
                                        <span>
                                            <span className="global-menu-hover__label block font-serif text-[17px] font-bold leading-tight">Projet sur-mesure</span>
                                            <span className={`global-menu-hover__desc mt-1 block text-[11.5px] leading-5 ${mutedText}`}>Décrivez votre meuble à restaurer</span>
                                        </span>
                                        <ChevronRight size={18} strokeWidth={1.5} className="global-menu-hover__chevron shrink-0 text-[#9A654B]" />
                                    </motion.button>
                                </motion.div>

                                <motion.div className="flex min-h-0 flex-col gap-3" variants={menuColumnVariants} custom={withDesktopMotionContext(MENU_SEQUENCE.atelierMedia)}>
                                    <motion.button
                                        type="button"
                                        onClick={() => navigateToPath('/devis')}
                                        aria-label="Découvrir la livraison offerte"
                                        className="group relative h-[172px] w-full overflow-hidden rounded-[16px] bg-[#f8f4ee] text-left outline-none ring-[#9A654B]/0 transition-[box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-[#9A654B]/55"
                                        variants={menuTileVariants}
                                    >
                                        <img
                                            src={shouldLoadMenuMedia ? '/images/menu-delivery-marseille-wide.jpg' : undefined}
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                            fetchPriority="low"
                                            className="absolute inset-0 h-full w-full object-cover object-center"
                                        />
                                        <span className="absolute inset-x-0 bottom-0 px-5 pb-4 pt-10 text-[10px] font-black uppercase tracking-[0.16em] text-[#8B5C42] [background:linear-gradient(0deg,rgba(248,244,238,0.92),rgba(248,244,238,0))]">
                                            Atelier & livraison autour de Marseille
                                        </span>
                                        <span className="absolute inset-0 rounded-[16px] ring-1 ring-inset ring-stone-200/70" />
                                    </motion.button>

                                    <motion.button
                                        type="button"
                                        onClick={openAbout}
                                        className={`group grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_156px] overflow-hidden rounded-[16px] text-left outline-none ring-[#9A654B]/0 transition-[box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-[#9A654B]/55 ${darkMode ? 'bg-white/5' : 'bg-[#f4eee8]'}`}
                                        variants={menuTileVariants}
                                    >
                                        <span className="flex min-h-0 flex-col justify-between p-5">
                                            <span>
                                                <span className="mb-4 block text-[10px] font-black uppercase tracking-[0.16em] text-[#9A654B]">Transformation</span>
                                                <span className="block font-serif text-[24px] font-bold leading-tight">Rénovation</span>
                                                <span className="block font-serif text-[24px] font-bold leading-tight">sur-mesure</span>
                                            </span>
                                            <span className={`mt-4 max-w-[26ch] text-[12px] leading-5 ${mutedText}`}>Donnez une seconde vie à vos meubles avec une finition pensée pour votre intérieur.</span>
                                            <span className={`mt-4 flex items-center justify-between gap-4 border-t pt-3 ${darkMode ? 'border-white/10' : 'border-[#e7dcd2]/80'}`}>
                                                <span className="min-w-0">
                                                    <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[#9A654B]">Conseil atelier</span>
                                                    <span className={`mt-1 block text-[11.5px] leading-5 ${mutedText}`}>Photos et dimensions avant rendez-vous</span>
                                                </span>
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#9A654B] text-[#9A654B] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-[#9A654B] group-hover:text-white">
                                                    <ChevronRight size={19} className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5" />
                                                </span>
                                            </span>
                                        </span>
                                        <span className="relative block h-full w-full overflow-hidden">
                                            <img
                                                src={shouldLoadMenuMedia ? '/images/before-after/apresu.webp' : undefined}
                                                alt=""
                                                loading="lazy"
                                                decoding="async"
                                                fetchPriority="low"
                                                className="h-full w-full object-cover"
                                            />
                                        </span>
                                    </motion.button>
                                </motion.div>
                            </motion.section>
                        </motion.div>
                    </motion.div>

                    <motion.div data-global-menu-panel="services" className={`mt-6 grid grid-cols-4 overflow-hidden rounded-[22px] ${desktopSoftCard}`} variants={menuBlockVariants} custom={withDesktopMotionContext(MENU_SEQUENCE.services)}>
                        {SERVICE_ITEMS.map(({ title, text, Icon }, index) => (
                            <motion.div key={title} className={`group flex items-center gap-5 px-8 py-5 ${index > 0 ? `border-l ${softBorder}` : ''}`} variants={menuItemVariants}>
                                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${darkMode ? 'bg-white/5' : 'bg-white/60'} text-[#9A654B]`}>
                                    <Icon size={23} strokeWidth={1.4} />
                                </span>
                                <span>
                                    <span className="block font-serif text-[18px] font-bold leading-tight">{title}</span>
                                    <span className={`mt-1 block text-[12px] ${mutedText}`}>{text}</span>
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </motion.section>
        </MotionConfig>
    );
}
