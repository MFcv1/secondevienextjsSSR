'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, MotionConfig, useReducedMotion } from 'framer-motion';
import {
    Archive,
    Armchair,
    BadgeEuro,
    ChevronRight,
    ClipboardCheck,
    CreditCard,
    DoorClosed,
    DoorOpen,
    Flower2,
    Frame,
    Headphones,
    Home,
    Lamp,
    LogIn,
    LogOut,
    Package,
    Paintbrush,
    RockingChair,
    Search,
    ShieldCheck,
    Sofa,
    Sparkles,
    Sun,
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
    { label: 'Buffets', categoryId: 'buffets', image: '/images/gallery-hero-1.webp' },
    { label: 'Armoires', categoryId: 'armoires', image: '/images/gallery-hero-2.webp' },
    { label: 'Miroirs', categoryId: 'miroirs', image: '/images/before-after/apres.webp' },
    { label: 'Commodes', categoryId: 'commodes', image: '/images/gallery-hero-4.webp' },
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
const MENU_PANEL_OPEN_EASE = [0.16, 1, 0.3, 1];
const MENU_CONTAINER_EASE = [0.21, 1.02, 0.43, 1.01];
const RAINMAKER_PANEL_EASE = [0.88, 0, 0.18, 1];
const MENU_CLOSE_EASE = [0.76, 0, 0.24, 1];
const MENU_SEQUENCE = {
    sidebar: { delay: 0.54 },
    categories: { delay: 0.72 },
    discovery: { delay: 0.92 },
    atelier: { delay: 1.12 },
    atelierInner: { delay: 0.08 },
    atelierMedia: { delay: 0.18 },
    services: { delay: 1.28 },
};

const getMenuStage = (stage = {}) => (
    typeof stage === 'number' ? { delay: stage } : stage
);

const getMenuStageDelay = (stage = {}) => {
    const { delay = 0, reduceMotion = false } = getMenuStage(stage);
    return reduceMotion ? 0 : delay;
};

const getDesktopRevealStyle = (stage = {}) => ({
    '--global-menu-delay': `${Math.round((getMenuStage(stage).delay || 0) * 1000)}ms`,
});

const shellVariants = {
    hidden: {},
    visible: {},
    exit: {},
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.28, ease: MENU_FADE_EASE },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.34, ease: MENU_CLOSE_EASE },
    },
};

const desktopPanelVariants = {
    hidden: {
        opacity: 0,
        y: -14,
        scaleY: 0.965,
        clipPath: 'inset(0 0 100% 0 round 0px)',
        pointerEvents: 'none',
    },
    visible: ({ reduceMotion = false } = {}) => ({
        opacity: 1,
        y: 0,
        scaleY: 1,
        clipPath: 'inset(0 0 0% 0 round 0px)',
        pointerEvents: 'auto',
        transition: {
            duration: reduceMotion ? 0.01 : 0.72,
            ease: MENU_PANEL_OPEN_EASE,
            opacity: { duration: reduceMotion ? 0.01 : 0.24, ease: MENU_FADE_EASE },
            scaleY: { duration: reduceMotion ? 0.01 : 0.7, ease: MENU_PANEL_OPEN_EASE },
            clipPath: { duration: reduceMotion ? 0.01 : 0.72, ease: MENU_PANEL_OPEN_EASE },
        },
    }),
    exit: {
        opacity: 0,
        y: -10,
        scaleY: 0.982,
        clipPath: 'inset(0 0 100% 0 round 0px)',
        pointerEvents: 'none',
        transition: {
            duration: 0.52,
            ease: RAINMAKER_PANEL_EASE,
            opacity: { duration: 0.22, ease: MENU_CLOSE_EASE, delay: 0.16 },
            scaleY: { duration: 0.5, ease: RAINMAKER_PANEL_EASE },
            clipPath: { duration: 0.52, ease: RAINMAKER_PANEL_EASE },
        },
    },
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

const menuContentVariants = {
    hidden: {
        y: 10,
        opacity: 0,
    },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.28,
            ease: MENU_EASE,
            delayChildren: 0.015,
        },
    },
    exit: {
        y: -4,
        opacity: 0,
        transition: {
            duration: 0.16,
            ease: MENU_CLOSE_EASE,
        },
    },
};

const menuRevealVariants = {
    hidden: {
        x: 0,
        y: 0,
        opacity: 0,
    },
    visible: {
        x: 0,
        y: 0,
        opacity: 1,
        transition: { duration: 0.44, ease: MENU_FADE_EASE },
    },
    exit: {
        x: 0,
        y: 0,
        opacity: 1,
        transition: { duration: 0.01 },
    },
};

const menuGroupVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.028,
            delayChildren: 0.018,
        },
    },
    exit: {
        transition: {
            staggerChildren: 0.012,
            staggerDirection: -1,
        },
    },
};

const menuColumnVariants = {
    hidden: (stage = {}) => {
        const { reduceMotion = false } = getMenuStage(stage);
        return {
            x: reduceMotion ? 0 : -24,
            y: reduceMotion ? 0 : 8,
            opacity: 0,
            filter: reduceMotion ? 'none' : 'blur(14px)',
            transition: {
                duration: reduceMotion ? 0.01 : 0.12,
                ease: MENU_CLOSE_EASE,
            },
        };
    },
    visible: (stage = {}) => ({
        y: 0,
        x: 0,
        opacity: 1,
        filter: 'blur(0px)',
        transition: {
            duration: getMenuStage(stage).reduceMotion ? 0.01 : 0.58,
            ease: MENU_CONTAINER_EASE,
            delay: getMenuStageDelay(stage),
            opacity: { duration: getMenuStage(stage).reduceMotion ? 0.01 : 0.42, ease: MENU_FADE_EASE },
            filter: { duration: getMenuStage(stage).reduceMotion ? 0.01 : 0.46, ease: MENU_FADE_EASE },
            delayChildren: getMenuStage(stage).reduceMotion ? 0 : 0.12,
            staggerChildren: getMenuStage(stage).reduceMotion ? 0 : 0.035,
        },
    }),
    exit: {
        x: 0,
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.01,
        },
    },
};

const menuItemVariants = {
    hidden: {
        x: 0,
        y: 0,
        opacity: 0,
    },
    visible: {
        x: 0,
        y: 0,
        opacity: 1,
        transition: { duration: 0.3, ease: MENU_FADE_EASE },
    },
    exit: {
        x: 0,
        y: 0,
        opacity: 1,
        transition: { duration: 0.01 },
    },
};

const menuTileVariants = {
    hidden: {
        x: 0,
        y: 0,
        opacity: 0,
    },
    visible: {
        x: 0,
        y: 0,
        opacity: 1,
        transition: { duration: 0.34, ease: MENU_FADE_EASE },
    },
    exit: {
        x: 0,
        y: 0,
        opacity: 1,
        transition: { duration: 0.01 },
    },
};

const selectionTileVariants = {
    hidden: {
        x: 0,
        y: 0,
        opacity: 0,
    },
    visible: {
        x: 0,
        y: 0,
        opacity: 1,
        transition: { duration: 0.32, ease: MENU_FADE_EASE },
    },
    exit: {
        x: 0,
        y: 0,
        opacity: 1,
        transition: { duration: 0.01 },
    },
};

const mobileRevealGroupVariants = {
    hidden: {},
    visible: {
        transition: {
            delayChildren: 0.035,
            staggerChildren: 0.035,
        },
    },
    exit: {
        transition: {
            staggerChildren: 0.012,
            staggerDirection: -1,
        },
    },
};

const mobileRevealItemVariants = {
    hidden: {
        y: 14,
        opacity: 0,
    },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 560,
            damping: 42,
            mass: 0.7,
            opacity: { duration: 0.18, ease: MENU_FADE_EASE },
        },
    },
    exit: {
        y: -4,
        opacity: 0,
        transition: {
            duration: 0.12,
            ease: MENU_CLOSE_EASE,
        },
    },
};

const mobileDividerVariants = {
    hidden: {
        opacity: 0,
        scaleX: 0.82,
    },
    visible: {
        opacity: 1,
        scaleX: 1,
        transition: {
            duration: 0.24,
            ease: MENU_FADE_EASE,
        },
    },
    exit: {
        opacity: 0,
        scaleX: 0.92,
        transition: {
            duration: 0.1,
            ease: MENU_CLOSE_EASE,
        },
    },
};

const textHoverMotion = {
    x: 3,
    transition: { duration: 0.16, ease: MENU_EASE },
};

const textTapMotion = {
    scale: 0.992,
    transition: { duration: 0.1, ease: MENU_EASE },
};

const mobilePanelVariants = {
    hidden: {
        x: '100%',
        opacity: 0.96,
    },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 520,
            damping: 44,
            mass: 0.78,
            opacity: { duration: 0.16, ease: MENU_FADE_EASE },
        },
    },
    exit: {
        x: '100%',
        opacity: 0.98,
        transition: {
            type: 'spring',
            stiffness: 560,
            damping: 48,
            mass: 0.72,
            opacity: { duration: 0.12, ease: MENU_CLOSE_EASE },
        },
    },
};

const GlobalMenu = ({
    isMenuOpen,
    isMenuClosing = false,
    keepMounted = false,
    setIsMenuOpen,
    currentView,
    user,
    isAdmin,
    darkMode,
    contactInfo,
    onShowLogin,
    onOpenCart,
    cartCount = 0,
    onOpenWishlist,
    wishlistCount = 0,
    toggleTheme,
    onLogout,
}) => {
    const prefersReducedMotion = useReducedMotion();
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
    const [menuTop, setMenuTop] = useState(110);
    const [desktopPanelMaxHeight, setDesktopPanelMaxHeight] = useState(() => (
        typeof window === 'undefined' ? 760 : Math.max(0, Math.round(window.innerHeight - 110))
    ));
    const panelRef = useRef(null);
    const desktopContentRef = useRef(null);
    const mobilePanelRef = useRef(null);
    const lockedScrollYRef = useRef(0);
    const isMenuClosingRef = useRef(false);
    const closingWheelDeltaRef = useRef(0);
    const lastTouchYRef = useRef(null);

    const closeMenu = useCallback(() => {
        setIsMenuOpen(false);
    }, [setIsMenuOpen]);

    const syncMenuGeometry = useCallback(() => {
        if (typeof window === 'undefined') return;

        const header = document.querySelector('header');
        const headerBottom = header?.getBoundingClientRect().bottom;
        const nextMenuTop = Math.max(0, Math.round(headerBottom || 110));
        const availableHeight = Math.max(0, Math.round(window.innerHeight - nextMenuTop));
        const measuredContentHeight = desktopContentRef.current?.scrollHeight || availableHeight;
        const nextPanelMaxHeight = Math.min(availableHeight, Math.ceil(measuredContentHeight));

        setMenuTop((current) => current === nextMenuTop ? current : nextMenuTop);
        setDesktopPanelMaxHeight((current) => current === nextPanelMaxHeight ? current : nextPanelMaxHeight);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        if (!isMenuOpen && !isMenuClosing && !keepMounted) return undefined;

        const frameId = window.requestAnimationFrame(syncMenuGeometry);
        window.addEventListener('resize', syncMenuGeometry);

        return () => {
            window.cancelAnimationFrame(frameId);
            window.removeEventListener('resize', syncMenuGeometry);
        };
    }, [isMenuClosing, isMenuOpen, keepMounted, syncMenuGeometry]);

    useLayoutEffect(() => {
        if (!isMenuOpen || typeof window === 'undefined') return undefined;

        syncMenuGeometry();
        const frameId = window.requestAnimationFrame(syncMenuGeometry);
        return () => window.cancelAnimationFrame(frameId);
    }, [isMenuOpen, syncMenuGeometry]);

    useEffect(() => {
        if (!isMenuOpen) return undefined;
        if (typeof window === 'undefined') return undefined;

        const warmImages = () => {
            MENU_IMAGE_SOURCES.forEach((src) => {
                const image = new Image();
                image.decoding = 'async';
                image.src = src;
                image.decode?.().catch(() => {});
            });
        };

        if ('requestIdleCallback' in window) {
            const idleId = window.requestIdleCallback(warmImages, { timeout: 1400 });
            return () => window.cancelIdleCallback(idleId);
        }

        const timeoutId = window.setTimeout(warmImages, 240);
        return () => window.clearTimeout(timeoutId);
    }, [isMenuOpen]);

    useEffect(() => {
        isMenuClosingRef.current = isMenuClosing;
    }, [isMenuClosing]);

    useLayoutEffect(() => {
        if (!isMenuOpen || typeof window === 'undefined') return undefined;

        lockedScrollYRef.current = window.scrollY;
        closingWheelDeltaRef.current = 0;
        const root = document.documentElement;
        const previousRootOverflowY = root.style.overflowY;
        const previousRootScrollbarGutter = root.style.scrollbarGutter;
        const previousRootOverscrollBehavior = root.style.overscrollBehavior;
        const previousRootScrollBehavior = root.style.scrollBehavior;
        let scrollFreezeFrame = null;

        root.style.overflowY = 'scroll';
        root.style.scrollbarGutter = 'stable';
        root.style.overscrollBehavior = 'none';
        root.style.scrollBehavior = 'auto';

        const getScrollablePanel = (target) => (
            [panelRef.current, mobilePanelRef.current].find((panel) => (
                panel
                && panel.contains(target)
                && panel.scrollHeight > panel.clientHeight
            ))
        );

        const canScrollPanel = (target, deltaY) => {
            const panel = getScrollablePanel(target);
            if (!panel) return false;
            if (deltaY < 0) return panel.scrollTop > 0;
            if (deltaY > 0) return panel.scrollTop + panel.clientHeight < panel.scrollHeight - 1;
            return false;
        };

        const handleWheel = (event) => {
            if (!isMenuClosingRef.current && canScrollPanel(event.target, event.deltaY)) return;
            if (isMenuClosingRef.current) {
                closingWheelDeltaRef.current += event.deltaY;
            }
            event.preventDefault();
            event.stopImmediatePropagation?.();
        };

        const handleTouchStart = (event) => {
            lastTouchYRef.current = event.touches?.[0]?.clientY ?? null;
        };

        const handleTouchMove = (event) => {
            const touchY = event.touches?.[0]?.clientY;
            const previousY = lastTouchYRef.current;
            const deltaY = typeof touchY === 'number' && typeof previousY === 'number' ? previousY - touchY : 0;
            lastTouchYRef.current = touchY ?? null;

            if (canScrollPanel(event.target, deltaY)) return;
            event.preventDefault();
            event.stopImmediatePropagation?.();
        };

        const handleKeyDown = (event) => {
            const target = event.target;
            if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;

            const scrollKeys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '];
            if (scrollKeys.includes(event.key)) {
                event.preventDefault();
                event.stopImmediatePropagation?.();
            }
        };

        const freezeWindowScroll = () => {
            if (window.scrollY !== lockedScrollYRef.current) {
                window.scrollTo({ top: lockedScrollYRef.current, behavior: 'auto' });
            }
            scrollFreezeFrame = window.requestAnimationFrame(freezeWindowScroll);
        };

        window.addEventListener('wheel', handleWheel, { capture: true, passive: false });
        window.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
        window.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });
        window.addEventListener('keydown', handleKeyDown, { capture: true });
        scrollFreezeFrame = window.requestAnimationFrame(freezeWindowScroll);

        return () => {
            const restoredScrollY = lockedScrollYRef.current;
            window.removeEventListener('wheel', handleWheel, { capture: true });
            window.removeEventListener('touchstart', handleTouchStart, { capture: true });
            window.removeEventListener('touchmove', handleTouchMove, { capture: true });
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
            if (scrollFreezeFrame) window.cancelAnimationFrame(scrollFreezeFrame);
            root.style.overflowY = previousRootOverflowY;
            root.style.scrollbarGutter = previousRootScrollbarGutter;
            root.style.overscrollBehavior = previousRootOverscrollBehavior;
            root.style.scrollBehavior = previousRootScrollBehavior;
            window.scrollTo({ top: restoredScrollY, behavior: 'auto' });
            lastTouchYRef.current = null;
        };
    }, [isMenuOpen, isMenuClosing]);

    useEffect(() => {
        if (!isMenuOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') closeMenu();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMenuOpen, closeMenu]);

    const scrollTop = () => {
        requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    };

    const navigateToPath = (path) => {
        closeMenu();
        window.location.assign(path);
    };

    const openAbout = () => {
        closeMenu();
        window.location.assign('/a-propos');
    };

    const goToCategory = (categoryId) => {
        navigateToPath(getCategoryUrl(categoryId));
    };

    const openWishlist = () => {
        if (onOpenWishlist) onOpenWishlist();
        else window.location.assign('/wishlist');
        closeMenu();
        scrollTop();
    };

    const openCart = () => {
        closeMenu();
        onOpenCart?.();
    };

    const openQuoteRequest = () => {
        closeMenu();
        window.location.assign('/devis');
    };

    const handleLogin = () => {
        closeMenu();
        onShowLogin?.();
    };

    const handleLogout = () => {
        closeMenu();
        onLogout?.();
    };

    const openAccount = () => {
        navigateToPath('/mes-commandes');
    };

    const isSignedIn = user && !user.isAnonymous;

    const isGalleryContext = ['gallery', 'wishlist'].includes(currentView);

    const primaryLinks = [
        { label: 'Accueil', desc: 'Galerie principale', Icon: Home, active: isGalleryContext, action: () => navigateToPath('/galerie') },
        { label: 'À propos', desc: 'Atelier et histoire', Icon: UserRound, active: false, action: openAbout },
        { label: 'Commandes', desc: 'Espace client', Icon: Package, active: currentView === 'my-orders', action: () => (isSignedIn ? navigateToPath('/mes-commandes') : handleLogin()) },
        { label: 'Devis', desc: 'Projet sur mesure', Icon: ClipboardCheck, active: false, action: openQuoteRequest },
        ...(isAdmin ? [{ label: 'Admin.', desc: 'Backoffice', Icon: ShieldCheck, active: currentView === 'admin', action: () => navigateToPath('/admin') }] : []),
    ];

    const mobileRows = [
        { label: 'Nouveautés', badge: 'Nouveau', Icon: Sparkles, action: () => navigateToPath('/galerie') },
        { label: 'Meubles', Icon: DoorOpen, action: () => goToCategory('meubles') },
        { label: 'Assises', Icon: Armchair, action: () => goToCategory('assises') },
        { label: 'Éclairage', Icon: Lamp, action: () => goToCategory('eclairage') },
        { label: 'Décorations', Icon: Flower2, action: () => goToCategory('decorations') },
        { label: 'Prix bas', Icon: BadgeEuro, accent: true, action: () => navigateToPath('/galerie') },
        { label: 'À propos', Icon: UserRound, action: openAbout },
    ];

    const panelTone = darkMode
        ? 'bg-[#111111] text-stone-100 border-stone-800'
        : 'bg-[#fffdfb] text-stone-900 border-stone-200';

    const mutedText = darkMode ? 'text-stone-500' : 'text-stone-500';
    const softBorder = darkMode ? 'border-stone-800' : 'border-stone-200';
    const softBg = darkMode ? 'bg-white/5' : 'bg-[#f6f2ee]';
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
    const menuAnimationState = isMenuClosing ? 'exit' : (isMenuOpen ? 'visible' : 'hidden');
    const isMenuInteractive = isMenuOpen && !isMenuClosing;
    const menuContentAnimationState = isMenuInteractive ? 'visible' : 'hidden';

    if (!isMenuOpen && !isMenuClosing && !keepMounted) return null;

    const isMenuDormant = !isMenuOpen && !isMenuClosing;

    return (
        <MotionConfig reducedMotion="user">
        <motion.div
            key="global-menu-shell"
            className={`${isMenuInteractive ? 'pointer-events-auto' : 'pointer-events-none'} ${isMenuDormant ? 'opacity-0' : ''} fixed inset-x-0 bottom-0 z-[2000] overflow-hidden`}
            style={{ top: menuTop }}
            role={isMenuInteractive ? 'dialog' : undefined}
            aria-modal={isMenuInteractive ? 'true' : undefined}
            aria-hidden={!isMenuInteractive}
            aria-label="Menu principal"
            inert={isMenuInteractive ? undefined : true}
            variants={shellVariants}
            initial="hidden"
            animate={menuAnimationState}
        >
                    <motion.button
                        type="button"
                        className={`${isMenuInteractive ? 'pointer-events-auto' : 'pointer-events-none'} absolute inset-0 h-full w-full bg-stone-950/20 lg:bg-stone-950/45 lg:backdrop-blur-sm`}
                        onClick={closeMenu}
                        onWheel={(event) => event.preventDefault()}
                        aria-label="Fermer le menu"
                        variants={backdropVariants}
                    />

                    {/* Desktop mega menu */}
                    <motion.section
                        ref={panelRef}
                        className={`${isMenuInteractive ? 'pointer-events-auto' : 'pointer-events-none'} global-menu-scrollbarless absolute left-0 right-0 hidden overflow-hidden overscroll-contain shadow-[0_28px_80px_rgba(28,25,23,0.13)] lg:block ${panelTone}`}
                        variants={desktopPanelVariants}
                        custom={desktopMotionContext}
                        style={{
                            top: 0,
                            maxHeight: desktopPanelMaxHeight,
                            transformOrigin: 'top center',
                            pointerEvents: 'auto',
                            overflowAnchor: 'none',
                            contain: 'layout paint',
                            willChange: 'transform, opacity',
                        }}
                        >
                            <motion.div
                            ref={desktopContentRef}
                            className="global-menu-desktop-content w-full px-5 pb-7 pt-6 xl:px-7 2xl:px-9"
                            variants={desktopMenuContentVariants}
                            initial="hidden"
                            animate={menuContentAnimationState}
                            custom={desktopMotionContext}
                            data-motion-ready={menuContentAnimationState === 'visible' ? 'true' : 'false'}
                        >
                            <motion.div className="grid grid-cols-[250px_minmax(0,1fr)] gap-4 xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-5">
                                <motion.aside className={`global-menu-reveal-container flex h-[540px] flex-col justify-between rounded-[22px] p-3.5 xl:p-4 ${desktopSoftCard}`} style={getDesktopRevealStyle(MENU_SEQUENCE.sidebar)}>
                                    <motion.nav className="space-y-2" variants={menuGroupVariants}>
                                        {primaryLinks.map(({ label, desc, Icon, active, action }) => (
                                            <motion.button
                                                key={label}
                                                type="button"
                                                onClick={action}
                                                className={`global-menu-hover group flex w-full items-center gap-3.5 rounded-lg px-4 py-3.5 text-left ${active ? (darkMode ? 'bg-white/10' : 'bg-[#f3efeb]') : ''}`}
                                                variants={menuItemVariants}
                                                whileHover={textHoverMotion}
                                                whileTap={textTapMotion}
                                            >
                                                <Icon size={22} strokeWidth={1.35} className={`global-menu-hover__icon ${active ? 'text-[#9A654B]' : mutedText}`} />
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
                                                whileHover={textHoverMotion}
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
                                                whileHover={textHoverMotion}
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

                                <motion.div className="grid grid-cols-[minmax(230px,0.72fr)_minmax(420px,1.34fr)_minmax(560px,1.94fr)] gap-3 xl:gap-4">
                                    <motion.section className={`global-menu-reveal-container flex h-[540px] flex-col rounded-[22px] px-4 py-4 xl:px-5 xl:py-5 2xl:px-6 ${desktopCard}`} style={getDesktopRevealStyle(MENU_SEQUENCE.categories)}>
                                        <motion.h2 className="mb-6 text-[12px] font-black uppercase tracking-[0.18em]" variants={menuRevealVariants}>Meubles par catégorie</motion.h2>
                                        <motion.div className="grid gap-2" variants={menuGroupVariants}>
                                            {categories.map(({ id, label, Icon }) => (
                                                <motion.button
                                                    key={id}
                                                    type="button"
                                                    onClick={() => goToCategory(id)}
                                                    className="global-menu-hover group -mx-2 flex min-h-9 items-center gap-3.5 rounded-md px-2 text-left"
                                                    variants={menuItemVariants}
                                                    whileHover={textHoverMotion}
                                                    whileTap={textTapMotion}
                                                >
                                                    <Icon size={20} strokeWidth={1.35} className="global-menu-hover__icon text-[#9A654B]" />
                                                    <span className="global-menu-hover__label font-serif text-[20px] font-semibold leading-[1.08] text-stone-900 dark:text-stone-100">
                                                        {label}
                                                    </span>
                                                </motion.button>
                                            ))}
                                        </motion.div>
                                        <motion.button
                                            type="button"
                                            onClick={() => navigateToPath('/galerie')}
                                            className={`global-menu-hover global-menu-hover--ambient mt-auto flex items-center gap-3 border-t pt-6 font-serif text-[16px] font-semibold text-[#8B5C42] ${softBorder}`}
                                            variants={menuItemVariants}
                                            whileHover={textHoverMotion}
                                            whileTap={textTapMotion}
                                        >
                                            <span className="global-menu-hover__label">Voir toutes les catégories</span>
                                            <ChevronRight size={17} className="global-menu-hover__chevron" />
                                        </motion.button>
                                    </motion.section>

                                    <motion.section className={`global-menu-reveal-container flex h-[540px] flex-col rounded-[22px] px-4 py-4 xl:px-5 xl:py-5 2xl:px-6 ${desktopCard}`} style={getDesktopRevealStyle(MENU_SEQUENCE.discovery)}>
                                        <motion.div className="mb-4" variants={menuRevealVariants}>
                                            <h2 className="text-[12px] font-black uppercase tracking-[0.18em]">Explorer la maison</h2>
                                            <p className={`mt-2 max-w-[34ch] text-[12px] leading-5 ${mutedText}`}>
                                                Pièces de vie, rangements et coups de cœur.
                                            </p>
                                        </motion.div>

                                        <motion.div className="grid grid-cols-2 gap-2" variants={menuGroupVariants}>
                                            {ROOM_LINKS.map((room) => (
                                                <motion.button
                                                    key={room.label}
                                                    type="button"
                                                    onClick={() => goToCategory(room.categoryId)}
                                                    className={`global-menu-hover group flex min-h-[46px] items-center justify-between rounded-[12px] px-3 py-2 text-left ${darkMode ? 'bg-white/5' : 'bg-white/55'}`}
                                                    variants={menuItemVariants}
                                                    whileHover={textHoverMotion}
                                                    whileTap={textTapMotion}
                                                >
                                                    <span className="global-menu-hover__label font-serif text-[16.5px] font-semibold leading-tight text-stone-900 dark:text-stone-100">
                                                        {room.label}
                                                    </span>
                                                    <ChevronRight size={15} strokeWidth={1.4} className="global-menu-hover__chevron shrink-0 text-[#9A654B]" />
                                                </motion.button>
                                            ))}
                                        </motion.div>

                                        <motion.div className="mt-6" variants={menuRevealVariants}>
                                            <span className="block h-px w-full bg-gradient-to-r from-transparent via-[#e5d8cb]/85 to-transparent dark:via-white/10" />
                                            <div className="flex items-center justify-between pt-4">
                                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">Notre sélection</span>
                                                <span className={`text-[11px] ${mutedText}`}>4 entrées rapides</span>
                                            </div>
                                        </motion.div>

                                        <motion.div className="mb-5 mt-3 grid grid-cols-2 gap-2.5" variants={menuGroupVariants}>
                                            {SELECTION_TILES.map((tile) => (
                                                <motion.button
                                                    key={tile.label}
                                                    type="button"
                                                    onClick={() => goToCategory(tile.categoryId)}
                                                    className="relative min-h-[104px] overflow-hidden rounded-[14px] bg-stone-100 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)] outline-none ring-[#9A654B]/0 transition-[box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-[#9A654B]/55 xl:min-h-[112px]"
                                                    variants={selectionTileVariants}
                                                >
                                                    <img
                                                        src={tile.image}
                                                        alt={tile.label}
                                                        loading="lazy"
                                                        decoding="async"
                                                        fetchPriority="low"
                                                        className="absolute inset-0 h-full w-full object-cover"
                                                    />
                                                    <span className="absolute inset-0 bg-gradient-to-t from-stone-950/48 via-stone-950/8 to-transparent" />
                                                    <span className="absolute bottom-3 left-3 font-serif text-[17px] font-bold leading-none text-white drop-shadow-sm">
                                                        {tile.label}
                                                    </span>
                                                </motion.button>
                                            ))}
                                        </motion.div>

                                        <motion.button
                                            type="button"
                                            onClick={() => navigateToPath('/galerie')}
                                            className={`global-menu-hover mt-auto flex w-full items-center justify-between rounded-[14px] px-4 py-3.5 text-left ${darkMode ? 'bg-white/5' : 'bg-[#f5f0ec]'}`}
                                            variants={menuItemVariants}
                                            whileHover={textHoverMotion}
                                            whileTap={textTapMotion}
                                        >
                                            <span className="flex items-center gap-3">
                                                <span className="global-menu-hover__icon flex h-9 w-9 items-center justify-center rounded-full border border-[#9A654B]/30 text-[#9A654B]">
                                                    <Sparkles size={17} strokeWidth={1.5} />
                                                </span>
                                                <span>
                                                    <span className="global-menu-hover__label block font-serif text-[17px] font-bold">Voir toutes les pièces</span>
                                                    <span className={`global-menu-hover__desc mt-1 block text-[11.5px] ${mutedText}`}>Nouveautés, petits prix et pièces uniques</span>
                                                </span>
                                            </span>
                                            <ChevronRight size={20} strokeWidth={1.5} className="global-menu-hover__chevron text-[#9A654B]" />
                                        </motion.button>
                                    </motion.section>

                                    <motion.section className={`global-menu-reveal-container grid h-[540px] grid-cols-[minmax(220px,0.86fr)_minmax(0,1.44fr)] gap-2 rounded-[22px] p-1.5 ${desktopWarmCard}`} style={getDesktopRevealStyle(MENU_SEQUENCE.atelier)}>
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
                                                        whileHover={textHoverMotion}
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
                                                whileHover={textHoverMotion}
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
                                                onClick={() => navigateToPath('/galerie')}
                                                aria-label="Découvrir la livraison offerte"
                                                className="relative h-[172px] w-full overflow-hidden rounded-[16px] bg-[#f8f4ee] text-left outline-none ring-[#9A654B]/0 transition-[box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-[#9A654B]/55"
                                                variants={menuTileVariants}
                                            >
                                                <img
                                                    src="/images/menu-delivery-marseille-wide.jpg"
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
                                                className={`grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_156px] overflow-hidden rounded-[16px] text-left outline-none ring-[#9A654B]/0 transition-[box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-[#9A654B]/55 ${darkMode ? 'bg-white/5' : 'bg-[#f4eee8]'}`}
                                                variants={menuTileVariants}
                                            >
                                                <span className="flex min-h-0 flex-col justify-between p-5">
                                                    <span>
                                                        <span className="mb-4 block text-[10px] font-black uppercase tracking-[0.16em] text-[#9A654B]">Transformation</span>
                                                        <span className="block font-serif text-[24px] font-bold leading-tight">Rénovation</span>
                                                        <span className="block font-serif text-[24px] font-bold leading-tight">sur-mesure</span>
                                                    </span>
                                                    <span className={`mt-4 max-w-[26ch] text-[12px] leading-5 ${mutedText}`}>Donnez une seconde vie à vos meubles avec une finition pensée pour votre intérieur.</span>
                                                    <span className="mt-4 flex items-center justify-between gap-4 border-t border-[#e7dcd2]/80 pt-3 dark:border-white/10">
                                                        <span className="min-w-0">
                                                            <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[#9A654B]">Conseil atelier</span>
                                                            <span className={`mt-1 block text-[11.5px] leading-5 ${mutedText}`}>Photos et dimensions avant rendez-vous</span>
                                                        </span>
                                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#9A654B] text-[#9A654B]">
                                                            <ChevronRight size={19} />
                                                        </span>
                                                    </span>
                                                </span>
                                                <img
                                                    src="/images/before-after/apresu.webp"
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            </motion.button>
                                        </motion.div>
                                    </motion.section>
                                </motion.div>
                            </motion.div>

                            <motion.div className={`global-menu-reveal-container mt-6 grid grid-cols-4 overflow-hidden rounded-[22px] ${desktopSoftCard}`} style={getDesktopRevealStyle(MENU_SEQUENCE.services)}>
                                {SERVICE_ITEMS.map(({ title, text, Icon }, index) => (
                                    <motion.div key={title} className={`flex items-center gap-5 px-8 py-5 ${index > 0 ? `border-l ${softBorder}` : ''}`} variants={menuItemVariants}>
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

                    {/* Mobile menu */}
                    <motion.aside
                        ref={mobilePanelRef}
                        className={`${isMenuInteractive ? 'pointer-events-auto' : 'pointer-events-none'} thin-scrollbar absolute bottom-0 left-0 right-0 overflow-y-auto overscroll-contain lg:hidden ${panelTone}`}
                        variants={mobilePanelVariants}
                        style={{
                            top: 0,
                            maxHeight: `calc(100dvh - ${menuTop}px)`,
                            pointerEvents: 'auto',
                            WebkitOverflowScrolling: 'touch',
                            contain: 'layout paint',
                            transformOrigin: 'right center',
                            willChange: 'transform, opacity',
                            WebkitBackfaceVisibility: 'hidden',
                            backfaceVisibility: 'hidden',
                        }}
                    >
                        <motion.div className="min-h-full safe-pb-menu" variants={menuContentVariants}>
                            <motion.div className="px-5 pb-7 pt-4 sm:px-6 sm:pb-8 sm:pt-5" variants={mobileRevealGroupVariants}>
                                <motion.label className={`relative mb-5 flex h-[48px] items-center rounded-lg ${softBg}`} variants={mobileRevealItemVariants}>
                                    <span className="sr-only">Rechercher</span>
                                    <input
                                        type="search"
                                        placeholder="Rechercher un produit..."
                                        className={`h-full w-full rounded-lg bg-transparent pl-4 pr-12 text-[15px] outline-none placeholder:text-stone-400 ${darkMode ? 'text-stone-100' : 'text-stone-800'}`}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') navigateToPath('/galerie');
                                        }}
                                    />
                                    <Search className="absolute right-4 text-stone-500" size={21} strokeWidth={1.5} />
                                </motion.label>

                                <motion.div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3" variants={mobileRevealGroupVariants}>
                                    {primaryLinks.map(({ label, desc, Icon, action }) => (
                                        <motion.button
                                            key={label}
                                            type="button"
                                            onClick={action}
                                            className="flex min-h-[78px] flex-col items-center justify-center text-center sm:min-h-[86px]"
                                            variants={mobileRevealItemVariants}
                                            whileTap={textTapMotion}
                                        >
                                            <Icon size={25} strokeWidth={1.45} />
                                            <span className="mt-2 font-serif text-[15px] font-bold leading-tight sm:text-[16px]">{label}</span>
                                            <span className={`mt-1 text-[10px] leading-tight ${mutedText}`}>{desc}</span>
                                        </motion.button>
                                    ))}
                                </motion.div>

                                <motion.div className={`my-5 h-px origin-center ${darkMode ? 'bg-stone-800' : 'bg-stone-200'}`} variants={mobileDividerVariants} />

                                <motion.nav className="divide-y divide-stone-200/80 dark:divide-stone-800" variants={mobileRevealGroupVariants}>
                                    {mobileRows.map(({ label, Icon, badge, accent, action }) => (
                                        <motion.button
                                            key={label}
                                            type="button"
                                            onClick={action}
                                            className={`flex w-full items-center gap-3.5 py-3.5 text-left sm:gap-4 sm:py-4 ${accent ? 'text-[#9A4F31]' : ''}`}
                                            variants={mobileRevealItemVariants}
                                            whileTap={textTapMotion}
                                        >
                                            <Icon size={21} strokeWidth={1.45} className={accent ? 'text-orange-500' : 'text-[#9A654B]'} />
                                            <span className="flex min-w-0 flex-1 items-center gap-2 text-[17px] font-medium tracking-tight sm:text-[18px]">
                                                {label}
                                                {badge && (
                                                    <span className="shrink-0 rounded-full border border-[#9A654B] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#9A654B]">
                                                        {badge}
                                                    </span>
                                                )}
                                            </span>
                                            <ChevronRight size={19} strokeWidth={1.4} />
                                        </motion.button>
                                    ))}
                                </motion.nav>

                                <motion.div className={`mt-8 grid grid-cols-1 rounded-lg min-[390px]:grid-cols-3 ${softBg}`} variants={mobileRevealGroupVariants}>
                                    {SERVICE_ITEMS.slice(0, 3).map(({ title, text, Icon }, index) => (
                                        <motion.div key={title} className={`px-3 py-4 min-[390px]:py-5 ${index > 0 ? `border-t min-[390px]:border-l min-[390px]:border-t-0 ${softBorder}` : ''}`} variants={mobileRevealItemVariants}>
                                            <span className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full min-[390px]:h-12 min-[390px]:w-12 ${darkMode ? 'bg-white/5' : 'bg-white/60'} text-[#9A654B]`}>
                                                <Icon size={23} strokeWidth={1.4} />
                                            </span>
                                            <span className="block text-center font-serif text-[17px] font-bold leading-tight min-[390px]:text-[18px]">{title}</span>
                                            <span className={`mt-2 block text-center text-[12px] leading-4 ${mutedText}`}>{text}</span>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>

                            <motion.div className={`border-t px-6 py-5 ${softBorder}`} variants={mobileRevealItemVariants}>
                                {isSignedIn ? (
                                    <motion.button
                                        type="button"
                                        onClick={openAccount}
                                        className="flex w-full items-center gap-4 text-left"
                                        whileTap={textTapMotion}
                                    >
                                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#9A654B] text-lg font-black text-white">
                                            {(user.email || user.displayName || 'M').charAt(0).toUpperCase()}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[14px] font-black">
                                                Mon espace
                                                {user.emailVerified && <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-500">Vérifié</span>}
                                            </span>
                                            <span className={`mt-1 block truncate text-[13px] ${mutedText}`}>{user.email || user.displayName || 'Commandes et suivi'}</span>
                                        </span>
                                        <ChevronRight size={24} strokeWidth={1.4} />
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        type="button"
                                        onClick={handleLogin}
                                        className="flex w-full items-center gap-4 text-left"
                                        whileTap={textTapMotion}
                                    >
                                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#9A654B] text-white">
                                            <UserRound size={22} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[14px] font-black">Connexion</span>
                                            <span className={`mt-1 block text-[13px] ${mutedText}`}>Accéder à votre espace</span>
                                        </span>
                                        <ChevronRight size={24} strokeWidth={1.4} />
                                    </motion.button>
                                )}
                            </motion.div>

                            {contactInfo?.email && (
                                <motion.a
                                    href={`mailto:${contactInfo.email}`}
                                    className={`mx-6 mb-5 flex items-center justify-center rounded-full border py-3 text-[12px] font-bold ${softBorder}`}
                                    variants={mobileRevealItemVariants}
                                    whileTap={textTapMotion}
                                >
                                    Nous contacter
                                </motion.a>
                            )}
                        </motion.div>
                    </motion.aside>
                </motion.div>
        </MotionConfig>
    );
};

export default GlobalMenu;
