'use client';

import React from 'react';
import { motion, MotionConfig } from 'framer-motion';
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
    ShieldCheck,
    Sparkles,
    UserRound
} from 'lucide-react';
import { getCategoryUrl } from '../../utils/slug';
import SearchSuggestIsland from '../marketplace/SearchSuggestIsland';

const MENU_EASE = [0.22, 1, 0.36, 1];
const MENU_FADE_EASE = [0.16, 1, 0.3, 1];
const MENU_CLOSE_EASE = [0.76, 0, 0.24, 1];

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

const textTapMotion = {
    scale: 0.992,
    transition: { duration: 0.1, ease: MENU_EASE },
};

const mobilePanelVariants = {
  hidden: {
    x: 0,
    opacity: 1,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0,
    },
  },
  exit: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0,
    },
  },
};

export default function GlobalMenuMobile({
    isMenuInteractive,
    isMenuClosing,
    isMenuOpen,
    mobilePanelRef,
    menuTop,
    panelTone,
    currentView,
    user,
    isAdmin,
    darkMode,
    navigateToPath,
    handleLogin,
}) {
    const isSignedIn = user && !user.isAnonymous;
    const isGalleryContext = ['gallery', 'wishlist'].includes(currentView);
    const menuAnimationState = isMenuClosing ? 'exit' : (isMenuOpen ? 'visible' : 'hidden');

    const mutedText = darkMode ? 'text-stone-500' : 'text-stone-500';
    const softBg = darkMode ? 'bg-white/5' : 'bg-[#f6f2ee]';

    const openAbout = () => navigateToPath('/a-propos');
    const goToCategory = (categoryId) => navigateToPath(getCategoryUrl(categoryId));
    const openQuoteRequest = () => navigateToPath('/devis');
    const openAccount = () => navigateToPath('/mes-commandes');

    const primaryLinks = [
        { label: 'Accueil', desc: 'Galerie principale', Icon: Home, active: isGalleryContext, action: () => navigateToPath('/') },
        { label: 'À propos', desc: 'Atelier et histoire', Icon: UserRound, active: false, action: openAbout },
        { label: 'Commandes', desc: 'Espace client', Icon: Package, active: currentView === 'my-orders', action: () => (isSignedIn ? navigateToPath('/mes-commandes') : handleLogin()) },
        { label: 'Devis', desc: 'Projet sur mesure', Icon: ClipboardCheck, active: false, action: openQuoteRequest },
    ];
    const adminLink = isAdmin
        ? { label: 'Admin.', desc: 'Backoffice', Icon: ShieldCheck, active: currentView === 'admin', action: () => navigateToPath('/admin') }
        : null;
    const accountTile = isSignedIn
        ? {
            label: 'Mon espace',
            desc: user.email || user.displayName || 'Commandes et suivi',
            action: openAccount,
            initial: (user.email || user.displayName || 'M').charAt(0).toUpperCase(),
        }
        : {
            label: 'Connexion',
            desc: 'Accéder à votre espace',
            action: handleLogin,
            Icon: UserRound,
        };
    const AccountIcon = accountTile.Icon || UserRound;

    const mobileRows = [
        ...(adminLink ? [{ label: 'Admin.', Icon: ShieldCheck, action: adminLink.action }] : []),
        { label: 'Nouveautés', badge: 'Nouveau', Icon: Sparkles, action: () => navigateToPath('/#gallery-pieces') },
        { label: 'Meubles', Icon: DoorOpen, action: () => goToCategory('meubles') },
        { label: 'Assises', Icon: Armchair, action: () => goToCategory('assises') },
        { label: 'Éclairage', Icon: Lamp, action: () => goToCategory('eclairage') },
        { label: 'Décorations', Icon: Flower2, action: () => goToCategory('decorations') },
        { label: 'Prix bas', Icon: BadgeEuro, accent: true, action: () => navigateToPath('/#gallery-small-prices') },
        { label: 'À propos', Icon: UserRound, action: openAbout },
    ];

    return (
        <MotionConfig reducedMotion="user">
            <motion.aside
                ref={mobilePanelRef}
                className={`${isMenuInteractive ? 'pointer-events-auto' : 'pointer-events-none'} global-menu-mobile-panel absolute bottom-0 left-0 right-0 overflow-hidden overscroll-contain ${panelTone}`}
                variants={mobilePanelVariants}
                initial="hidden"
                animate={menuAnimationState}
                style={{
                    top: 0,
                    height: `calc(100dvh - ${menuTop}px)`,
                    maxHeight: `calc(100dvh - ${menuTop}px)`,
                    pointerEvents: 'auto',
                    contain: 'layout paint',
                    transformOrigin: 'right center',
                    willChange: 'transform, opacity',
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden',
                }}
            >
                <motion.div className="global-menu-mobile-content flex h-full min-h-0 flex-col safe-pb-menu" variants={menuContentVariants}>
                    <motion.div className="global-menu-mobile-inner flex min-h-0 flex-1 flex-col px-4 pb-3 pt-3 sm:px-5" variants={mobileRevealGroupVariants}>
                        <motion.div className="global-menu-mobile-search-stage relative z-20" variants={mobileRevealItemVariants}>
                            <SearchSuggestIsland
                                darkMode={darkMode}
                                variant="mobile"
                                wrapperClassName={`global-menu-mobile-search relative flex items-center rounded-lg ${softBg}`}
                                inputClassName={`h-full w-full rounded-lg bg-transparent pl-4 pr-11 text-[15px] outline-none placeholder:text-stone-400 ${darkMode ? 'text-stone-100' : 'text-stone-800'}`}
                            />
                        </motion.div>

                        <motion.div className="global-menu-mobile-actions grid grid-cols-3 gap-2 sm:grid-cols-4" variants={mobileRevealGroupVariants}>
                            {primaryLinks.map(({ label, desc, Icon, action }) => (
                                <motion.button
                                    key={label}
                                    type="button"
                                    onClick={action}
                                    className="global-menu-mobile-action flex flex-col items-center justify-center text-center"
                                    variants={mobileRevealItemVariants}
                                    whileTap={textTapMotion}
                                >
                                    <Icon className="global-menu-mobile-action-icon" strokeWidth={1.45} />
                                    <span className="global-menu-mobile-action-label mt-1.5 font-serif font-bold leading-tight">{label}</span>
                                    <span className={`global-menu-mobile-action-desc mt-0.5 leading-tight ${mutedText}`}>{desc}</span>
                                </motion.button>
                            ))}
                            <motion.button
                                type="button"
                                onClick={accountTile.action}
                                className={`global-menu-mobile-account col-span-2 flex items-center gap-3 rounded-lg px-3.5 text-left ${softBg}`}
                                variants={mobileRevealItemVariants}
                                whileTap={textTapMotion}
                            >
                                <span className="global-menu-mobile-account-icon flex shrink-0 items-center justify-center rounded-full bg-[#9A654B] text-sm font-black text-white">
                                    {accountTile.initial || <AccountIcon className="h-5 w-5" />}
                                </span>
                                <span className="min-w-0">
                                    <span className="global-menu-mobile-account-label block truncate font-black">{accountTile.label}</span>
                                    <span className={`global-menu-mobile-account-desc mt-0.5 block truncate ${mutedText}`}>{accountTile.desc}</span>
                                </span>
                                <ChevronRight size={18} strokeWidth={1.4} className="ml-auto shrink-0" />
                            </motion.button>
                        </motion.div>

                        <motion.div className={`global-menu-mobile-divider h-px origin-center ${darkMode ? 'bg-stone-800' : 'bg-stone-200'}`} variants={mobileDividerVariants} />

                        <motion.nav className={`global-menu-mobile-nav flex min-h-0 flex-1 flex-col divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-200/80'}`} variants={mobileRevealGroupVariants}>
                            {mobileRows.map(({ label, Icon, badge, accent, action }) => (
                                <motion.button
                                    key={label}
                                    type="button"
                                    onClick={action}
                                    className={`global-menu-mobile-row flex min-h-0 w-full flex-1 items-center gap-3 text-left ${accent ? 'text-[#9A4F31]' : ''}`}
                                    variants={mobileRevealItemVariants}
                                    whileTap={textTapMotion}
                                >
                                    <Icon className={`global-menu-mobile-row-icon ${accent ? 'text-orange-500' : 'text-[#9A654B]'}`} strokeWidth={1.45} />
                                    <span className="global-menu-mobile-row-label flex min-w-0 flex-1 items-center gap-2 font-medium tracking-tight">
                                        {label}
                                        {badge && (
                                            <span className="global-menu-mobile-badge shrink-0 rounded-full border border-[#9A654B] px-1.5 py-0.5 font-black uppercase tracking-[0.12em] text-[#9A654B]">
                                                {badge}
                                            </span>
                                        )}
                                    </span>
                                    <ChevronRight className="global-menu-mobile-chevron" strokeWidth={1.4} />
                                </motion.button>
                            ))}
                        </motion.nav>
                    </motion.div>
                </motion.div>
            </motion.aside>
        </MotionConfig>
    );
}
