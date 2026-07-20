'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import GlobalMenuDesktop from './GlobalMenuDesktop';
import GlobalMenuMobile from './GlobalMenuMobile';

const DESKTOP_MENU_QUERY = '(min-width: 1024px)';
const DESKTOP_MENU_OPEN_CLASS = 'global-menu-desktop-open';
const DESKTOP_ANNOUNCEMENT_VISIBLE_CLASS = 'global-menu-announcement-visible';
const MOBILE_MENU_JOIN_OVERLAP_PX = 1;

const getIsDesktopMenuViewport = () => (
    typeof window !== 'undefined'
    && window.matchMedia(DESKTOP_MENU_QUERY).matches
);

export const preloadCurrentGlobalMenuView = () => {
    if (typeof window === 'undefined') return Promise.resolve(null);
    const isDesktopMenuViewport = getIsDesktopMenuViewport();
    return Promise.resolve(isDesktopMenuViewport ? GlobalMenuDesktop : GlobalMenuMobile);
};

export const preloadDesktopGlobalMenuView = () => {
    if (typeof window === 'undefined') return Promise.resolve(null);
    if (!getIsDesktopMenuViewport()) return Promise.resolve(null);
    return Promise.resolve(GlobalMenuDesktop);
};

const useDesktopMenuViewport = () => {
    const [isDesktopMenuViewport, setIsDesktopMenuViewport] = useState(getIsDesktopMenuViewport);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const mediaQuery = window.matchMedia(DESKTOP_MENU_QUERY);
        const syncViewport = () => setIsDesktopMenuViewport(mediaQuery.matches);

        syncViewport();
        mediaQuery.addEventListener?.('change', syncViewport);
        return () => mediaQuery.removeEventListener?.('change', syncViewport);
    }, []);

    return isDesktopMenuViewport;
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
    onNavigate,
    onShowLogin,
    onOpenCart,
    onOpenWishlist,
    onLogout,
}) => {
    const router = useRouter();
    const isDesktopMenuViewport = useDesktopMenuViewport();
    const [menuTop, setMenuTop] = useState(110);
    const [desktopPanelMaxHeight, setDesktopPanelMaxHeight] = useState(() => (
        typeof window === 'undefined' ? 760 : Math.max(0, Math.round(window.innerHeight - 110))
    ));
    const panelRef = useRef(null);
    const desktopContentRef = useRef(null);
    const mobilePanelRef = useRef(null);
    const lockedScrollYRef = useRef(0);
    const desktopAnnouncementHeightRef = useRef(null);
    const isMenuClosingRef = useRef(false);
    const closingWheelDeltaRef = useRef(0);
    const lastTouchYRef = useRef(null);

    const closeMenu = useCallback(() => {
        setIsMenuOpen(false);
    }, [setIsMenuOpen]);

    const syncMenuGeometry = useCallback(() => {
        if (typeof window === 'undefined') return;

        const announcementHeight = desktopAnnouncementHeightRef.current ?? 0;
        document.documentElement.style.setProperty('--global-menu-announcement-height', `${Math.max(0, Math.round(announcementHeight))}px`);
        const header = document.querySelector('[data-global-site-header]');
        const headerBottom = header?.getBoundingClientRect().bottom || 0;
        const headerHeight = header?.offsetHeight || 110;
        document.documentElement.style.setProperty('--global-menu-header-height', `${Math.max(0, Math.round(headerHeight))}px`);
        const measuredMenuTop = headerBottom > 0 ? headerBottom : headerHeight;
        // High-DPR Android devices can expose a compositor seam when a
        // fractional sticky-header edge is rounded away from the fixed menu.
        // A one CSS-pixel overlap keeps both white surfaces visually fused.
        const nextMenuTop = Math.max(0, isDesktopMenuViewport
            ? Math.round(measuredMenuTop)
            : Math.floor(measuredMenuTop) - MOBILE_MENU_JOIN_OVERLAP_PX);
        const availableHeight = Math.max(0, Math.round(window.innerHeight - nextMenuTop));
        const measuredContentHeight = isDesktopMenuViewport
            ? (desktopContentRef.current?.scrollHeight || availableHeight)
            : availableHeight;
        const nextPanelMaxHeight = Math.min(availableHeight, Math.ceil(measuredContentHeight));

        setMenuTop((current) => current === nextMenuTop ? current : nextMenuTop);
        setDesktopPanelMaxHeight((current) => current === nextPanelMaxHeight ? current : nextPanelMaxHeight);
    }, [isDesktopMenuViewport]);

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
        if (!isMenuOpen || !isDesktopMenuViewport) return undefined;
        if (typeof window === 'undefined') return undefined;

        const warmImages = () => {
            import('./GlobalMenuDesktop')
                .then((module) => module.preloadGlobalMenuImages?.())
                .catch(() => {});
        };

        let idleId = null;
        const afterOpenId = window.setTimeout(() => {
            if ('requestIdleCallback' in window) {
                idleId = window.requestIdleCallback(warmImages, { timeout: 1800 });
                return;
            }

            warmImages();
        }, 1200);

        return () => {
            window.clearTimeout(afterOpenId);
            if (idleId !== null) window.cancelIdleCallback(idleId);
        };
    }, [isDesktopMenuViewport, isMenuOpen]);

    useEffect(() => {
        isMenuClosingRef.current = isMenuClosing;
    }, [isMenuClosing]);

    useLayoutEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const root = document.documentElement;
        const menuIsActive = isMenuOpen || isMenuClosing;
        if (menuIsActive) {
            if (isDesktopMenuViewport) {
                if (desktopAnnouncementHeightRef.current === null) {
                    const announcementBanner = document.querySelector('.gallery-announcement-banner');
                    const announcementRect = announcementBanner?.getBoundingClientRect();
                    const visibleAnnouncementHeight = announcementRect && announcementRect.bottom > 0
                        ? Math.min(announcementRect.height, announcementRect.bottom)
                        : 0;
                    desktopAnnouncementHeightRef.current = Math.max(0, Math.round(visibleAnnouncementHeight));
                }
                root.classList.add(DESKTOP_MENU_OPEN_CLASS);
                root.classList.toggle(DESKTOP_ANNOUNCEMENT_VISIBLE_CLASS, desktopAnnouncementHeightRef.current > 0);
            } else {
                root.classList.add('global-menu-mobile-open');
            }
            syncMenuGeometry();
            return () => {
                root.classList.remove(DESKTOP_MENU_OPEN_CLASS);
                root.classList.remove(DESKTOP_ANNOUNCEMENT_VISIBLE_CLASS);
                root.classList.remove('global-menu-mobile-open');
                desktopAnnouncementHeightRef.current = null;
                root.style.removeProperty('--global-menu-announcement-height');
                root.style.removeProperty('--global-menu-header-height');
            };
        }

        root.classList.remove(DESKTOP_MENU_OPEN_CLASS);
        root.classList.remove(DESKTOP_ANNOUNCEMENT_VISIBLE_CLASS);
        root.classList.remove('global-menu-mobile-open');
        desktopAnnouncementHeightRef.current = null;
        root.style.removeProperty('--global-menu-announcement-height');
        root.style.removeProperty('--global-menu-header-height');
        return undefined;
    }, [isDesktopMenuViewport, isMenuClosing, isMenuOpen, syncMenuGeometry]);

    useLayoutEffect(() => {
        if (!isMenuOpen || typeof window === 'undefined') return undefined;

        lockedScrollYRef.current = window.scrollY;
        closingWheelDeltaRef.current = 0;
        const root = document.documentElement;
        const body = document.body;
        const previousRootOverflowY = root.style.overflowY;
        const previousRootScrollbarGutter = root.style.scrollbarGutter;
        const previousRootOverscrollBehavior = root.style.overscrollBehavior;
        const previousRootScrollBehavior = root.style.scrollBehavior;
        const previousBodyPosition = body.style.position;
        const previousBodyTop = body.style.top;
        const previousBodyLeft = body.style.left;
        const previousBodyRight = body.style.right;
        const previousBodyWidth = body.style.width;
        const previousBodyOverflowY = body.style.overflowY;
        const previousBodyTouchAction = body.style.touchAction;

        root.style.overflowY = 'hidden';
        root.style.scrollbarGutter = 'stable';
        root.style.overscrollBehavior = 'none';
        root.style.scrollBehavior = 'auto';
        if (!isDesktopMenuViewport) {
            body.style.position = 'fixed';
            body.style.top = `-${lockedScrollYRef.current}px`;
            body.style.left = '0';
            body.style.right = '0';
            body.style.width = '100%';
        }
        body.style.overflowY = 'hidden';
        if (!isDesktopMenuViewport) {
            body.style.touchAction = 'none';
        }

        const getScrollablePanel = (target) => {
            const menuPanel = isDesktopMenuViewport ? panelRef.current : mobilePanelRef.current;
            const nestedScrollable = target instanceof Element
                ? target.closest('[data-global-menu-scrollable="true"]')
                : null;

            if (nestedScrollable && menuPanel?.contains(nestedScrollable)) {
                return nestedScrollable.scrollHeight > nestedScrollable.clientHeight
                    ? nestedScrollable
                    : null;
            }

            return [menuPanel].find((panel) => (
                panel
                && panel.contains(target)
                && panel.scrollHeight > panel.clientHeight
            ));
        };

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

        window.addEventListener('wheel', handleWheel, { capture: true, passive: false });
        window.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
        window.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });
        window.addEventListener('keydown', handleKeyDown, { capture: true });

        return () => {
            const restoredScrollY = lockedScrollYRef.current;
            window.removeEventListener('wheel', handleWheel, { capture: true });
            window.removeEventListener('touchstart', handleTouchStart, { capture: true });
            window.removeEventListener('touchmove', handleTouchMove, { capture: true });
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
            root.style.overflowY = previousRootOverflowY;
            root.style.scrollbarGutter = previousRootScrollbarGutter;
            root.style.overscrollBehavior = previousRootOverscrollBehavior;
            root.style.scrollBehavior = previousRootScrollBehavior;
            if (!isDesktopMenuViewport) {
                body.style.position = previousBodyPosition;
                body.style.top = previousBodyTop;
                body.style.left = previousBodyLeft;
                body.style.right = previousBodyRight;
                body.style.width = previousBodyWidth;
            }
            body.style.overflowY = previousBodyOverflowY;
            if (!isDesktopMenuViewport) {
                body.style.touchAction = previousBodyTouchAction;
                window.scrollTo({ top: restoredScrollY, behavior: 'auto' });
            }
            lastTouchYRef.current = null;
        };
    }, [isDesktopMenuViewport, isMenuOpen, isMenuClosing]);

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
        if (onNavigate) {
            onNavigate(path);
            return;
        }
        closeMenu();
        router.push(path);
    };

    const openWishlist = () => {
        if (onOpenWishlist) {
            onOpenWishlist();
            return;
        }
        closeMenu();
        router.push('/wishlist');
        scrollTop();
    };

    const openCart = () => {
        if (onOpenCart) {
            onOpenCart();
            return;
        }
        closeMenu();
    };

    const handleLogin = () => {
        if (onShowLogin) {
            onShowLogin();
            return;
        }
        closeMenu();
    };

    const handleLogout = () => {
        closeMenu();
        onLogout?.();
    };

    const viewProps = {
        closeMenu,
        currentView,
        user,
        isAdmin,
        darkMode,
        contactInfo,
        navigateToPath,
        openWishlist,
        openCart,
        handleLogin,
        handleLogout,
        panelRef,
        desktopContentRef,
        mobilePanelRef,
        menuTop,
        desktopPanelMaxHeight,
        isMenuOpen,
        isMenuClosing,
    };

    const isMenuInteractive = isMenuOpen && !isMenuClosing;

    if (!isMenuOpen && !isMenuClosing && !keepMounted) return null;

    const isMenuDormant = !isMenuOpen && !isMenuClosing;
    const panelTone = darkMode
        ? 'bg-[#111111] text-stone-100 border-stone-800'
        : `${isDesktopMenuViewport ? 'bg-[#fffdfb]' : 'bg-white'} text-stone-900 border-stone-200`;

    return (
        <div
            key="global-menu-shell"
            className={`${isMenuInteractive ? 'pointer-events-auto' : 'pointer-events-none'} ${isMenuDormant ? 'opacity-0' : ''} fixed inset-x-0 bottom-0 z-[2000] overflow-hidden`}
            style={{
                top: menuTop,
                '--global-menu-mobile-available-height': `calc(100dvh - ${menuTop}px)`,
            }}
            role={isMenuInteractive ? 'dialog' : undefined}
            aria-modal={isMenuInteractive ? 'true' : undefined}
            aria-hidden={!isMenuInteractive}
            aria-label="Menu principal"
            inert={isMenuInteractive ? undefined : true}
        >
            <button
                type="button"
                className={`${isMenuInteractive ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'} absolute inset-0 h-full w-full bg-stone-950/20 transition-opacity duration-300 lg:bg-stone-950/45 lg:backdrop-blur-sm`}
                onClick={closeMenu}
                onWheel={(event) => event.preventDefault()}
                aria-label="Fermer le menu"
            />

            {isDesktopMenuViewport ? (
                <GlobalMenuDesktop
                    {...viewProps}
                    isMenuInteractive={isMenuInteractive}
                    panelTone={panelTone}
                />
            ) : (
                <GlobalMenuMobile
                    {...viewProps}
                    isMenuInteractive={isMenuInteractive}
                    panelTone={panelTone}
                />
            )}
        </div>
    );
};

export default GlobalMenu;
