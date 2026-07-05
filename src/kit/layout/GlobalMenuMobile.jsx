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
    Search,
    ShieldCheck,
    Sparkles,
    UserRound
} from 'lucide-react';
import { getCategoryUrl } from '../../utils/slug';

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
    contactInfo,
    navigateToPath,
    handleLogin,
}) {
    const isSignedIn = user && !user.isAnonymous;
    const isGalleryContext = ['gallery', 'wishlist'].includes(currentView);
    const menuAnimationState = isMenuClosing ? 'exit' : (isMenuOpen ? 'visible' : 'hidden');

    const mutedText = darkMode ? 'text-stone-500' : 'text-stone-500';
    const softBorder = darkMode ? 'border-stone-800' : 'border-stone-200';
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
    const AdminIcon = adminLink?.Icon;

    const mobileRows = [
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
                className={`${isMenuInteractive ? 'pointer-events-auto' : 'pointer-events-none'} thin-scrollbar absolute bottom-0 left-0 right-0 overflow-y-auto overscroll-contain ${panelTone}`}
                variants={mobilePanelVariants}
                initial="hidden"
                animate={menuAnimationState}
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
                                    if (event.key === 'Enter') navigateToPath('/');
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
                            <motion.button
                                type="button"
                                onClick={accountTile.action}
                                className={`col-span-2 flex min-h-[78px] items-center gap-3 rounded-lg px-4 text-left sm:min-h-[86px] ${softBg}`}
                                variants={mobileRevealItemVariants}
                                whileTap={textTapMotion}
                            >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#9A654B] text-sm font-black text-white">
                                    {accountTile.initial || <AccountIcon size={20} />}
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate text-[13px] font-black">{accountTile.label}</span>
                                    <span className={`mt-1 block truncate text-[12px] ${mutedText}`}>{accountTile.desc}</span>
                                </span>
                                <ChevronRight size={20} strokeWidth={1.4} className="ml-auto shrink-0" />
                            </motion.button>
                            {adminLink && (
                                <motion.button
                                    type="button"
                                    onClick={adminLink.action}
                                    className="flex min-h-[78px] flex-col items-center justify-center text-center sm:min-h-[86px]"
                                    variants={mobileRevealItemVariants}
                                    whileTap={textTapMotion}
                                >
                                    <AdminIcon size={25} strokeWidth={1.45} />
                                    <span className="mt-2 font-serif text-[15px] font-bold leading-tight sm:text-[16px]">{adminLink.label}</span>
                                    <span className={`mt-1 text-[10px] leading-tight ${mutedText}`}>{adminLink.desc}</span>
                                </motion.button>
                            )}
                        </motion.div>

                        <motion.div className={`my-5 h-px origin-center ${darkMode ? 'bg-stone-800' : 'bg-stone-200'}`} variants={mobileDividerVariants} />

                        <motion.nav className={`divide-y ${darkMode ? 'divide-stone-800' : 'divide-stone-200/80'}`} variants={mobileRevealGroupVariants}>
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
        </MotionConfig>
    );
}
