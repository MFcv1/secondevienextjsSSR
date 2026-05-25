import React, { useState, useEffect } from 'react';
import { useLiveTheme } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingBag, Heart, ShieldCheck, LogOut, LogIn, Armchair, Gavel, Search, Moon, Sun } from 'lucide-react';
import KIT_CONFIG from '../../config/constants';

const CuttingBoard = ({ size = 14, strokeWidth = 2, ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <rect x="3" y="7" width="18" height="12" rx="1.5" />
        <circle cx="7" cy="13" r="1.2" />
        <path d="M21 11V15" opacity="0.3" />
    </svg>
);

/**
 * COMPONENT : ARCHITECTURAL HEADER
 * Shared header for Gallery and Product Detail views in Architectural Theme.
 * - [UX] Smart Scroll: Hides on scroll down, shows on scroll up.
 */
const ArchitecturalHeader = ({
    headerProps,
    currentView,
    user,
    onShowLogin,
    onOpenMenu,
    onPrepareMenu,
    isMenuOpen,
    isMenuClosing = false,
    isMenuHeaderActive = isMenuOpen,
    onOpenCart,
    cartCount = 0,
    wishlistCount = 0,
    onOpenWishlist,
    toggleTheme,
    showSearch,
    onGoHome,
    onBack,
    darkMode // Explicit prop
}) => {
    // Optional props destructuring with defaults
    const { activeCollection, setActiveCollection } = headerProps || {};
    useLiveTheme(); // Used for side effects, no need to extract unused forcedMode
    const { logout, isAdmin } = useAuth();

    // We always show the toggle to allow user override
    const showToggle = true;
    // We need to know current state for the icon. Since we don't have 'darkMode' prop here (oops, missed it in drilling),
    // we can check document class or localStorage. Or better, just fix the drilling in next step if needed. 
    // Let's assume standard Tailwind 'dark' class presence for icon state.
    const isDark = darkMode;
    const isMenuSurfaceOpen = isMenuHeaderActive;
    const isMenuIconOpen = isMenuOpen && !isMenuClosing;
    const headerSurfaceStyle = {
        opacity: isMenuSurfaceOpen ? 1 : 0,
        transitionProperty: 'opacity',
        transitionDuration: isMenuSurfaceOpen ? '150ms' : '92ms',
        transitionTimingFunction: isMenuSurfaceOpen
            ? 'cubic-bezier(0.22, 1, 0.36, 1)'
            : 'cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'opacity',
    };
    const actionClusterTone = darkMode
        ? 'bg-white/[0.045] ring-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
        : 'bg-stone-100/85 ring-stone-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]';
    const actionButtonTone = darkMode
        ? 'text-stone-200 hover:bg-white/[0.08] hover:text-[#D9B58D]'
        : 'text-stone-800 hover:bg-white hover:text-[#8B5C42]';
    const actionButtonClass = `relative group flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] ${actionButtonTone}`;
    const countBadgeTone = darkMode
        ? 'bg-stone-100 text-stone-950 ring-[#0A0A0A]'
        : 'bg-stone-950 text-white ring-white';
    const menuButtonClass = `relative mr-1 flex h-10 min-w-10 items-center justify-center gap-2 rounded-full px-2.5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] md:mr-0 md:px-3.5 ${darkMode ? 'bg-white/[0.07] text-stone-100 hover:bg-white/[0.12] hover:text-[#D9B58D]' : 'bg-white text-stone-900 shadow-sm shadow-stone-900/5 hover:text-[#8B5C42]'}`;

    // --- SMART SCROLL LOGIC ---
    const [isMobileViewport, setIsMobileViewport] = useState(() => (
        typeof window === 'undefined' ? false : window.matchMedia('(max-width: 767px)').matches
    ));
    const [isVisible, setIsVisible] = useState(() => (typeof window === 'undefined' ? true : window.scrollY <= 0));
    const isVisibleRef = React.useRef(isVisible);
    const lastScrollY = React.useRef(typeof window === 'undefined' ? 0 : window.scrollY); // Use Ref for performance
    const wasMenuOpenRef = React.useRef(isMenuOpen);
    const previousViewRef = React.useRef(currentView);
    const shouldPinUnderMobileBanner = currentView === 'gallery' && isMobileViewport;
    const updateHeaderVisibility = React.useCallback((nextVisible) => {
        if (isVisibleRef.current === nextVisible) return;
        isVisibleRef.current = nextVisible;
        setIsVisible(nextVisible);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(max-width: 767px)');
        const handleViewportChange = () => setIsMobileViewport(mediaQuery.matches);

        handleViewportChange();
        mediaQuery.addEventListener('change', handleViewportChange);
        return () => mediaQuery.removeEventListener('change', handleViewportChange);
    }, []);

    useEffect(() => {
        if (shouldPinUnderMobileBanner) {
            updateHeaderVisibility(true);
        }
    }, [shouldPinUnderMobileBanner, updateHeaderVisibility]);

    React.useLayoutEffect(() => {
        const previousView = previousViewRef.current;
        previousViewRef.current = currentView;

        if (
            !shouldPinUnderMobileBanner &&
            previousView === 'detail' &&
            ['gallery', 'category', 'wishlist'].includes(currentView) &&
            typeof window !== 'undefined' &&
            window.scrollY > 20 &&
            !isMenuOpen
        ) {
            lastScrollY.current = window.scrollY;
            updateHeaderVisibility(false);
        }
    }, [currentView, isMenuOpen, shouldPinUnderMobileBanner, updateHeaderVisibility]);

    useEffect(() => {
        let frameId = 0;

        const processScroll = () => {
            frameId = 0;
            if (isMenuOpen) return;

            const currentScrollY = window.scrollY;

            if (shouldPinUnderMobileBanner) {
                updateHeaderVisibility(true);
                lastScrollY.current = currentScrollY;
                return;
            }

            // Immediate reaction: hide on scroll down, show on scroll up
            if (currentScrollY <= 0) {
                updateHeaderVisibility(true);
            } else if (currentScrollY > lastScrollY.current) {
                // Scrolling DOWN -> Hide
                updateHeaderVisibility(false);
            } else if (currentScrollY < lastScrollY.current) {
                // Scrolling UP -> Show
                updateHeaderVisibility(true);
            }
            lastScrollY.current = currentScrollY;
        };

        const handleScroll = () => {
            if (frameId) return;
            frameId = window.requestAnimationFrame(processScroll);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            if (frameId) window.cancelAnimationFrame(frameId);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isMenuOpen, shouldPinUnderMobileBanner, updateHeaderVisibility]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const wasMenuOpen = wasMenuOpenRef.current;
        wasMenuOpenRef.current = isMenuOpen;

        if (isMenuOpen || !wasMenuOpen) return;

        const currentScrollY = window.scrollY;
        lastScrollY.current = currentScrollY;

        if (shouldPinUnderMobileBanner || currentScrollY <= 0) {
            updateHeaderVisibility(true);
        }
    }, [isMenuOpen, shouldPinUnderMobileBanner, updateHeaderVisibility]);


    return (
        <header
            className={`sticky top-0 ${isMenuOpen ? 'z-[2105]' : 'z-50'} transition-[transform,background-color,color] duration-150 ease-in-out transform ${isMenuSurfaceOpen || isVisible ? 'translate-y-0' : '-translate-y-full'} ${darkMode ? 'bg-[#0A0A0A] text-stone-200' : 'bg-white text-stone-900'}
                safe-pt-header`}
        >
            <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 ${darkMode ? 'bg-[#0A0A0A]' : 'bg-white'}`}
                style={headerSurfaceStyle}
            />
            <div className="max-w-[1920px] mx-auto px-3 md:px-8 h-16 md:h-[76px] flex items-center justify-between relative">

                {/* 1. LEFT: LOGO */}
                <div className="flex items-center z-10 shrink-0 -ml-1 md:-ml-8">
                    <div className="flex items-center gap-1 cursor-pointer group" onClick={() => onGoHome ? onGoHome() : (window.location.href = '/')}>
                        <img 
                            src="/images/logoanais-320.webp"
                            alt="Logo" 
                            width="320"
                            height="240"
                            decoding="async"
                            className={`h-10 w-auto md:h-[50px] object-contain transition-all duration-500 ${darkMode ? 'brightness-0 invert opacity-100' : 'brightness-0 opacity-80'}`} 
                        />
                        <div className="flex flex-col leading-none">
                            <span className={`font-serif font-bold text-[16px] md:text-[24px] tracking-[-0.01em] transition-colors flex items-center gap-0.5 ${darkMode ? 'text-stone-200 group-hover:text-stone-400' : 'text-stone-900 group-hover:text-stone-600'}`}>
                                {KIT_CONFIG.brandName}<span className="text-orange-600 text-[26px] leading-0 -mb-1">.</span>
                            </span>
                            <span className={`font-serif italic text-[11px] md:text-[14px] mt-0.5 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{KIT_CONFIG.brandTagline}</span>
                        </div>
                    </div>
                </div>

                {/* 2. CENTER: SEARCH BAR (Debongout Style) */}
                {showSearch && (
                    <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 w-full max-w-xl xl:max-w-2xl px-4 z-0 opacity-100 pointer-events-auto">
                        <div className="w-full">
                            <div className={`w-full relative flex items-center rounded-md overflow-hidden transition-colors ${darkMode ? 'bg-[#1A1A1A] border border-white/10 focus-within:border-white/30' : 'bg-[#F2F0ED] border border-transparent focus-within:border-stone-300'}`}>
                                <input
                                    type="text"
                                    placeholder="Rechercher un produit..."
                                    value={headerProps?.searchQuery || ''}
                                    onChange={(e) => {
                                        if (headerProps?.setSearchQuery) {
                                            headerProps.setSearchQuery(e.target.value);
                                        }
                                    }}
                                    className={`w-full py-2.5 pl-4 pr-10 bg-transparent outline-none font-sans text-[13px] tracking-wide ${darkMode ? 'text-stone-200 placeholder-stone-500' : 'text-stone-800 placeholder-stone-400'}`}
                                />
                                <button
                                    type="button"
                                    aria-label="Rechercher"
                                    className="absolute right-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                                >
                                    <Search size={16} strokeWidth={1.5} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* 3. RIGHT: ACTIONS */}
                <div className="z-10 flex shrink-0 items-center gap-2 md:gap-4">

                    {/* GLOBAL ACTIONS */}
                    <div className={`flex items-center gap-1 rounded-full p-1 ring-1 ${actionClusterTone}`}>

                        {/* LOGIN / LOGOUT BUTTON (Integrated Mobile + Desktop) */}
                        {(!user || user.isAnonymous) ? (
                            <div className="flex items-center gap-1 md:gap-2">
                                {/* Mobile Icon (LogIn) */}
                                <button
                                    onClick={onShowLogin}
                                    className={`${actionButtonClass} hidden`}
                                    title="Connexion Admin"
                                >
                                    <LogIn size={18} strokeWidth={1.5} />
                                </button>

                                {/* Desktop Button */}
                                <button onClick={onShowLogin} className={`group hidden h-9 items-center gap-2 rounded-full px-3 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] md:flex ${darkMode ? 'bg-white/[0.04] text-stone-400 hover:bg-white/[0.09] hover:text-stone-100' : 'bg-white/70 text-stone-500 hover:bg-white hover:text-stone-900'}`}>
                                    <ShieldCheck size={14} className={`group-hover:text-amber-500 transition-colors ${darkMode ? 'text-stone-400' : 'text-stone-400'}`} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.16em]">Connexion</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                {/* Mobile/Desktop Indicator */}
                                {isAdmin && (
                                    <div className={`hidden rounded-full px-2.5 py-1 sm:block ${darkMode ? 'bg-emerald-400/10' : 'bg-emerald-50'}`}>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 cursor-default">Admin</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => logout()}
                                    className={`group flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] sm:w-auto sm:gap-2 sm:px-3 ${darkMode ? 'text-stone-400 hover:bg-red-400/10 hover:text-red-300' : 'text-stone-500 hover:bg-red-50 hover:text-red-600'}`}
                                    title="Se déconnecter"
                                >
                                    <LogOut size={16} />
                                    <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-widest">Quitter</span>
                                </button>
                            </div>
                        )}

                        {/* DARK MODE TOGGLE (Only if Auto) */}
                        {showToggle && toggleTheme && (
                            <div className="hidden md:block">
                                <button
                                    type="button"
                                    onClick={toggleTheme}
                                    className={actionButtonClass}
                                    title={isDark ? 'Mode clair' : 'Mode sombre'}
                                    aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
                                >
                                    {isDark ? (
                                        <Sun size={18} strokeWidth={1.5} />
                                    ) : (
                                        <Moon size={18} strokeWidth={1.5} />
                                    )}
                                </button>
                            </div>
                        )}

                        {/* MOBILE SEARCH BUTTON */}
                        {showSearch && (
                            <button
                                onClick={() => {
                                    const input = document.querySelector('input[placeholder="Rechercher un produit..."]');
                                    if (input) input.focus();
                                }}
                                className={`${actionButtonClass} lg:hidden`}
                                title="Rechercher"
                            >
                                <Search size={18} strokeWidth={1.5} className={`transition-colors duration-300 ${darkMode ? 'text-stone-200 group-hover:text-amber-400' : 'text-stone-900 group-hover:text-amber-600'}`} />
                            </button>
                        )}

                        {/* WISHLIST BUTTON */}
                        <button onClick={onOpenWishlist} className={actionButtonClass} title="Ma wishlist" aria-label="Ma wishlist">
                            <Heart size={18} strokeWidth={1.5} className={`transition-colors duration-300 ${wishlistCount > 0 ? (darkMode ? 'text-rose-400 fill-rose-400' : 'text-rose-500 fill-rose-500') : (darkMode ? 'text-stone-200 group-hover:text-rose-400' : 'text-stone-900 group-hover:text-rose-500')}`} />
                            {wishlistCount > 0 && (
                                <span className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black leading-none ring-2 ${countBadgeTone}`}>
                                    {Math.min(wishlistCount, 9)}
                                </span>
                            )}
                        </button>

                        <button onClick={onOpenCart} className={actionButtonClass} title="Panier" aria-label="Panier">
                            <ShoppingBag size={18} strokeWidth={1.5} className={`transition-colors duration-300 ${darkMode ? 'text-stone-200 group-hover:text-amber-400' : 'text-stone-900 group-hover:text-amber-600'}`} />
                            {cartCount > 0 && (
                                <span className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black leading-none ring-2 ${countBadgeTone}`}>
                                    {Math.min(cartCount, 9)}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={onOpenMenu}
                            onPointerEnter={onPrepareMenu}
                            onFocus={onPrepareMenu}
                            className={menuButtonClass}
                            title="Menu"
                            aria-label={isMenuIconOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                        >
                            <span className="relative block h-4 w-5">
                                <span
                                    className="absolute left-0 top-1/2 h-[1.25px] origin-center rounded-full bg-current transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                                    style={{
                                        width: isMenuIconOpen ? 19 : 20,
                                        transform: isMenuIconOpen ? 'translate3d(0,0,0) rotate(45deg)' : 'translate3d(0,-6px,0) rotate(0deg)',
                                    }}
                                />
                                <span
                                    className="absolute left-0 top-1/2 h-[1.25px] origin-center rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                                    style={{
                                        width: isMenuIconOpen ? 19 : 15,
                                        opacity: isMenuIconOpen ? 0 : 1,
                                        transform: isMenuIconOpen ? 'scaleX(0.2)' : 'scaleX(1)',
                                    }}
                                />
                                <span
                                    className="absolute left-0 top-1/2 h-[1.25px] origin-center rounded-full bg-current transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                                    style={{
                                        width: isMenuIconOpen ? 19 : 10,
                                        transform: isMenuIconOpen ? 'translate3d(0,0,0) rotate(-45deg)' : 'translate3d(0,6px,0) rotate(0deg)',
                                    }}
                                />
                            </span>
                            <span className="hidden text-[10px] font-black uppercase tracking-[0.16em] md:inline">Menu</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default ArchitecturalHeader;
