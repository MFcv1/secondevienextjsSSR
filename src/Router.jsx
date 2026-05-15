
import React, { Suspense } from 'react';
// Ancienne vitrine : page A propos
import { motion, AnimatePresence } from 'framer-motion';

// --- CODE SPLITTING: Chargement différé (kit standardisé) ---
const HomeView = React.lazy(() => import('./vitrine/HomeView'));
const GalleryView = React.lazy(() => import('./kit/marketplace/GalleryView'));
const loadProductDetail = () => import('./kit/marketplace/ProductDetail');
const ProductDetail = React.lazy(loadProductDetail);
const CheckoutView = React.lazy(() => import('./kit/commerce/CheckoutView'));
const LoginView = React.lazy(() => import('./kit/commerce/LoginView'));
const QuoteRequestView = React.lazy(() => import('./kit/marketplace/QuoteRequestView'));
const PerformanceArchitectureStudy = React.lazy(() => import('./kit/admin/PerformanceArchitectureStudy'));
import { Palette,
    CreditCard, Mail, Users, Share2, Globe, Grid,
    Activity, Package, Layout, LayoutPanelTop, BarChart3, ChevronLeft, Gauge,
    MoreHorizontal, ChevronDown, RefreshCw
} from 'lucide-react';

// --- ADMIN (kit standardisé) ---
const AdminDashboard = React.lazy(() => import('./kit/admin/AdminDashboard'));
const AdminHomepage = React.lazy(() => import('./kit/admin/AdminHomepage'));
const AdminOrders = React.lazy(() => import('./kit/admin/AdminOrders'));
const AdminLivraison = React.lazy(() => import('./kit/admin/AdminLivraison'));
const AdminStudio = React.lazy(() => import('./kit/admin/AdminStudio'));
const AdminForm = React.lazy(() => import('./kit/admin/AdminForm'));
const AdminItemList = React.lazy(() => import('./kit/admin/AdminItemList'));
const AdminUsers = React.lazy(() => import('./kit/admin/AdminUsers'));
const AdminNewsletter = React.lazy(() => import('./kit/admin/AdminNewsletter'));
const AdminAnalytics = React.lazy(() => import('./kit/admin/AdminAnalytics'));
const AdminSEO = React.lazy(() => import('./kit/admin/AdminSEO'));
const AdminIPManager = React.lazy(() => import('./kit/admin/AdminIPManager'));
const AdminPaymentSettings = React.lazy(() => import('./kit/admin/AdminPaymentSettings'));
const AdminIPTracker = React.lazy(() => import('./kit/admin/AdminIPTracker'));
const AdminGlobalInventory = React.lazy(() => import('./kit/admin/GlobalInventoryView'));
const AdminMaintenance = React.lazy(() => import('./kit/admin/AdminMaintenance'));

const MyOrdersView = React.lazy(() => import('./kit/commerce/MyOrdersView'));
const OrderSuccessModal = React.lazy(() => import('./kit/commerce/OrderSuccessModal'));

import { useAuth } from './kit/contexts/AuthContext';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from './kit/config/firebase';
import { bumpPublicCatalogVersion } from './kit/admin/publicCatalogInvalidation';
import KIT_CONFIG from './kit/config/constants';
import { getProductUrl } from './utils/slug';

const WishlistView = React.lazy(() => import('./kit/marketplace/WishlistView'));
const CategoryPage = React.lazy(() => import('./kit/marketplace/CategoryPage'));

const MOBILE_MARKETPLACE_QUERY = '(max-width: 1023px)';
const PULL_REFRESH_THRESHOLD = 74;
const PULL_REFRESH_MAX_DISTANCE = 96;

const ProductDetailFallback = ({ darkMode }) => (
    <div
        aria-hidden="true"
        data-product-detail-fallback="true"
        className={`fixed inset-0 z-[100] w-screen overflow-hidden ${darkMode ? 'bg-[#0e0e0e]' : 'bg-[#e8d9c6]'}`}
        style={{ height: 'var(--marketplace-viewport-height, 100svh)' }}
    />
);

const AppRouter = ({
    view,
    setView,
    items,
    isPreparingGallery,
    startGalleryTransition,
    completeGalleryTransition,
    darkMode,
    activeDesignId,
    isSecretGateOpen,
    setShowFullLogin,
    setSelectedItemId,
    selectedItemId,
    addToCart,
    cartItems,
    cartTotal,
    handlePlaceOrder,
    showOrderSuccess,
    setShowOrderSuccess,
    orderSuccessMethod,
    adminCollection,
    setAdminCollection,
    editingItem,
    setEditingItem,
    onOpenMenu,
    onOpenCart,
    toggleTheme,
    onOpenDiscovery,
    setHeaderProps,
    persistentGalleryState,
    saveGalleryState,
    wishlistItems,
    toggleWishlist,
    clearWishlist,
    activeCategoryId,
    onOpenAbout,
    onNavigateCategory,
    onGalleryScrollStateChange,
    isCatalogComplete = false,
    isLoadingFullCatalog = false,
    onLoadFullCatalog,
    onLoadCategoryCatalog,
    onEnsureProductDetail,
    galleryFooter
}) => {
    const { user, isAdmin, logout } = useAuth();
    const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);
    const [pullRefreshDistance, setPullRefreshDistance] = React.useState(0);
    const [isPullRefreshReady, setIsPullRefreshReady] = React.useState(false);
    const galleryScrollRef = React.useRef(null);
    const pullRefreshRef = React.useRef({
        startX: 0,
        startY: 0,
        isTracking: false,
        isRefreshing: false,
    });
    const [isMobileMarketplace, setIsMobileMarketplace] = React.useState(() => (
        typeof window !== 'undefined' && window.matchMedia(MOBILE_MARKETPLACE_QUERY).matches
    ));

    // Icons map — one per admin tab id
    const TAB_ICONS = {
        dashboard: Activity, analytics: BarChart3, studio: Palette,
        homepage: Palette, orders: Package, users: Users,
        ip_manager: Globe, seo: Share2, newsletter: Mail, payment_settings: CreditCard,
        inventory: Grid, maintenance: RefreshCw, performance_study: Gauge
    };
    // Collection tabs get Layout / LayoutPanelTop in order
    const COLLECTION_ICONS = [Layout, LayoutPanelTop];
    let collectionIdx = 0;

    const adminTabs = KIT_CONFIG.adminTabs.map(tab => ({
        ...tab,
        icon: TAB_ICONS[tab.id]
            ?? COLLECTION_ICONS[collectionIdx++ % COLLECTION_ICONS.length],
    }));

    const productReturnTargetRef = React.useRef({ view: 'gallery' });
    const setMarketplaceViewportHeight = React.useCallback(() => {
        if (typeof window === 'undefined') return;

        const height = Math.round(window.visualViewport?.height || window.innerHeight || 0);
        if (height > 0) {
            document.documentElement.style.setProperty('--marketplace-viewport-height', `${height}px`);
        }
    }, []);

    const freezeMobileGalleryScrollForDetail = React.useCallback(() => {
        if (
            typeof window === 'undefined' ||
            !window.matchMedia(MOBILE_MARKETPLACE_QUERY).matches
        ) {
            return;
        }

        const scroller = galleryScrollRef.current;
        const scrollTop = scroller?.scrollTop || 0;

        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        if (!scroller) return;

        scroller.style.overflowY = 'hidden';
        scroller.style.webkitOverflowScrolling = 'auto';
        scroller.style.touchAction = 'none';
        scroller.scrollTop = scrollTop;
    }, []);

    const openProductDetail = (id, returnTarget = { view: 'gallery' }) => {
        if (returnTarget?.view === 'gallery') {
            freezeMobileGalleryScrollForDetail();
        }
        setMarketplaceViewportHeight();
        loadProductDetail().catch(() => {});
        onEnsureProductDetail?.(id)?.catch?.(() => {});
        productReturnTargetRef.current = returnTarget;
        setSelectedItemId(id);
        setView('detail');
    };

    const prefetchProductDetail = React.useCallback((id) => {
        if (!id) return;
        loadProductDetail().catch(() => {});
        onEnsureProductDetail?.(id)?.catch?.(() => {});
    }, [onEnsureProductDetail]);

    const closeProductDetail = () => {
        const returnTarget = productReturnTargetRef.current;

        if (persistentGalleryState) {
            setHeaderProps(prev => ({
                ...prev,
                activeCollection: persistentGalleryState.activeCollection,
                filter: persistentGalleryState.filter
            }));
        }

        if (returnTarget?.view === 'category' && returnTarget.categoryId) {
            setView('category');
        } else {
            setView('gallery');
        }

        setSelectedItemId(null);
    };

    const isDetailFromCategory =
        view === 'detail' &&
        productReturnTargetRef.current?.view === 'category' &&
        activeCategoryId;
    const shouldRenderGallerySurface = view === 'gallery' || isPreparingGallery || (view === 'detail' && !isDetailFromCategory);
    const shouldShowGallerySurface = view === 'gallery' || (view === 'detail' && !isDetailFromCategory);
    const shouldRenderCategorySurface = (view === 'category' || isDetailFromCategory) && activeCategoryId;
    const isGalleryDetailOverlay = view === 'detail' && !isDetailFromCategory;
    const shouldUseMobileGalleryScroll = view === 'gallery' || isGalleryDetailOverlay;

    React.useEffect(() => {
        if (isGalleryDetailOverlay) return;

        const scroller = galleryScrollRef.current;
        if (!scroller) return;

        scroller.style.overflowY = '';
        scroller.style.webkitOverflowScrolling = '';
        scroller.style.touchAction = '';
    }, [isGalleryDetailOverlay]);

    React.useEffect(() => {
        if (!['gallery', 'category', 'wishlist'].includes(view) || typeof window === 'undefined') return undefined;

        let idleId = null;
        const preload = () => {
            loadProductDetail().catch(() => {});
        };
        const timer = window.setTimeout(() => {
            if (typeof window.requestIdleCallback === 'function') {
                idleId = window.requestIdleCallback(preload, { timeout: 3000 });
                return;
            }
            preload();
        }, 9000);

        return () => {
            window.clearTimeout(timer);
            if (idleId !== null && typeof window.cancelIdleCallback === 'function') {
                window.cancelIdleCallback(idleId);
            }
        };
    }, [view]);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(MOBILE_MARKETPLACE_QUERY);
        const syncMobileMarketplace = () => setIsMobileMarketplace(mediaQuery.matches);

        syncMobileMarketplace();
        mediaQuery.addEventListener?.('change', syncMobileMarketplace);

        return () => {
            mediaQuery.removeEventListener?.('change', syncMobileMarketplace);
        };
    }, []);

    React.useEffect(() => {
        if (!shouldUseMobileGalleryScroll || typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(MOBILE_MARKETPLACE_QUERY);
        const updateViewportHeight = () => {
            if (view === 'detail') return;
            if (mediaQuery.matches) {
                setMarketplaceViewportHeight();
            }
        };

        setMarketplaceViewportHeight();
        window.addEventListener('resize', updateViewportHeight);
        window.visualViewport?.addEventListener('resize', updateViewportHeight);

        return () => {
            window.removeEventListener('resize', updateViewportHeight);
            window.visualViewport?.removeEventListener('resize', updateViewportHeight);
        };
    }, [setMarketplaceViewportHeight, shouldUseMobileGalleryScroll, view]);

    React.useEffect(() => {
        if (!shouldUseMobileGalleryScroll || typeof window === 'undefined') return;

        const root = document.documentElement;
        const body = document.body;
        const mediaQuery = window.matchMedia(MOBILE_MARKETPLACE_QUERY);
        const syncLock = () => {
            const shouldLock = mediaQuery.matches;
            root.classList.toggle('marketplace-mobile-scroll-lock', shouldLock);
            body.classList.toggle('marketplace-mobile-scroll-lock', shouldLock);
        };

        syncLock();
        mediaQuery.addEventListener?.('change', syncLock);

        return () => {
            mediaQuery.removeEventListener?.('change', syncLock);
            root.classList.remove('marketplace-mobile-scroll-lock');
            body.classList.remove('marketplace-mobile-scroll-lock');
        };
    }, [shouldUseMobileGalleryScroll]);

    const syncGalleryAnnouncementState = React.useCallback((scrollElement = galleryScrollRef.current) => {
        if (!onGalleryScrollStateChange || typeof window === 'undefined') return;

        const isMobile = window.matchMedia('(max-width: 767px)').matches;
        onGalleryScrollStateChange(Boolean(isMobile && scrollElement && scrollElement.scrollTop > 8));
    }, [onGalleryScrollStateChange]);

    React.useLayoutEffect(() => {
        if (view !== 'gallery') return;

        syncGalleryAnnouncementState();
        const frame = window.requestAnimationFrame(() => syncGalleryAnnouncementState());
        return () => window.cancelAnimationFrame(frame);
    }, [syncGalleryAnnouncementState, view]);

    const handleGalleryScroll = React.useCallback((event) => {
        syncGalleryAnnouncementState(event.currentTarget);
    }, [syncGalleryAnnouncementState]);

    const resetPullRefresh = React.useCallback(() => {
        pullRefreshRef.current = {
            startX: 0,
            startY: 0,
            isTracking: false,
            isRefreshing: false,
        };
        setPullRefreshDistance(0);
        setIsPullRefreshReady(false);
    }, []);

    const isMobileMarketplaceViewport = React.useCallback(() => (
        typeof window !== 'undefined' && window.matchMedia(MOBILE_MARKETPLACE_QUERY).matches
    ), []);

    const handleGalleryTouchStart = React.useCallback((event) => {
        if (view !== 'gallery' || event.touches.length !== 1 || !isMobileMarketplaceViewport()) {
            resetPullRefresh();
            return;
        }

        if (event.currentTarget.scrollTop > 0) {
            resetPullRefresh();
            return;
        }

        const touch = event.touches[0];
        pullRefreshRef.current = {
            startX: touch.clientX,
            startY: touch.clientY,
            isTracking: true,
            isRefreshing: false,
        };
    }, [isMobileMarketplaceViewport, resetPullRefresh, view]);

    const handleGalleryTouchMove = React.useCallback((event) => {
        const state = pullRefreshRef.current;
        if (!state.isTracking || state.isRefreshing || event.touches.length !== 1) return;

        if (event.currentTarget.scrollTop > 0) {
            resetPullRefresh();
            return;
        }

        const touch = event.touches[0];
        const pullY = touch.clientY - state.startY;
        const driftX = Math.abs(touch.clientX - state.startX);

        if (pullY <= 0 || driftX > pullY * 0.85) {
            setPullRefreshDistance(0);
            setIsPullRefreshReady(false);
            return;
        }

        event.preventDefault();
        const distance = Math.min(PULL_REFRESH_MAX_DISTANCE, pullY * 0.58);
        setPullRefreshDistance(distance);
        setIsPullRefreshReady(distance >= PULL_REFRESH_THRESHOLD);
    }, [resetPullRefresh]);

    const handleGalleryTouchEnd = React.useCallback(() => {
        const state = pullRefreshRef.current;
        if (!state.isTracking || state.isRefreshing) return;

        if (isPullRefreshReady) {
            pullRefreshRef.current = { ...state, isRefreshing: true };
            setPullRefreshDistance(PULL_REFRESH_THRESHOLD);
            window.setTimeout(() => window.location.reload(), 90);
            return;
        }

        resetPullRefresh();
    }, [isPullRefreshReady, resetPullRefresh]);

    const handleToggleStatus = async (item, col) => {
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', col, item.id), { status: item.status === 'published' ? 'draft' : 'published' });
            await bumpPublicCatalogVersion('product_status_changed', {
                productId: item.id,
                categoryIds: item.category ? [item.category] : [],
                paths: [getProductUrl(item)]
            });
        } catch (e) { console.error(e); }
    };



    const handleDeleteItem = async (year, id, col) => {
        if (!confirm("Supprimer ?")) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', col, id));
            await bumpPublicCatalogVersion('product_deleted', { productId: id });
        } catch (e) { console.error(e); }
    };

    const handleMarkAsSold = async (item, col) => {
        if (!confirm(`Marquer "${item.name}" comme VENDU ? (Stock à 0)`)) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', col, item.id), {
                sold: true,
                stock: 0,
                soldAt: serverTimestamp()
            });
            await bumpPublicCatalogVersion('product_sold', {
                productId: item.id,
                categoryIds: item.category ? [item.category] : [],
                paths: [getProductUrl(item)]
            });
            alert("✓ Mis à jour avec succès");
        } catch (e) {
            console.error(e);
            alert("❌ Erreur lors de la mise à jour : " + e.message);
        }
    };

    const handleMarkAsAvailable = async (item, col) => {
        if (!confirm(`Remettre "${item.name}" en vente ? (Stock à 1)`)) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', col, item.id), {
                sold: false,
                stock: 1,
                soldAt: null
            });
            await bumpPublicCatalogVersion('product_available', {
                productId: item.id,
                categoryIds: item.category ? [item.category] : [],
                paths: [getProductUrl(item)]
            });
            alert("✓ Remis en vente avec succès");
        } catch (e) {
            console.error(e);
            alert("❌ Erreur lors de la mise à jour : " + e.message);
        }
    };

    return (
        <main>
            {view === 'home' && (
                <Suspense fallback={<div className="min-h-screen bg-[#0F0F11]" />}>
                <div className="contents">
                    <HomeView
                        onEnterMarketplace={completeGalleryTransition}
                        onStartMarketplaceTransition={startGalleryTransition}
                        darkMode={darkMode}
                        onOpenDiscovery={onOpenDiscovery}
                    />
                </div>
                </Suspense>
            )}

            {shouldRenderGallerySurface && (
                <div
                    className={shouldShowGallerySurface ? 'marketplace-gallery-shell animate-in fade-in duration-500' : 'fixed inset-0 pointer-events-none opacity-0 z-0'}
                    data-detail-open={isGalleryDetailOverlay ? 'true' : 'false'}
                    aria-hidden={isGalleryDetailOverlay ? 'true' : undefined}
                >
                    {shouldShowGallerySurface && pullRefreshDistance > 0 && (
                        <div
                            aria-hidden="true"
                            className={`pointer-events-none fixed left-1/2 safe-top-pull-refresh z-[70] flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border bg-white/90 text-stone-800 shadow-[0_12px_28px_rgba(28,25,23,0.16)] backdrop-blur-md transition-opacity duration-150 dark:border-white/10 dark:bg-[#111]/90 dark:text-stone-100 ${isPullRefreshReady ? 'border-emerald-200 text-emerald-700 dark:text-emerald-300' : 'border-stone-200'}`}
                            style={{
                                opacity: Math.min(1, pullRefreshDistance / 48),
                                transform: `translate3d(-50%, ${Math.max(0, pullRefreshDistance - 28)}px, 0)`,
                            }}
                        >
                            <RefreshCw
                                size={18}
                                strokeWidth={1.8}
                                className={pullRefreshRef.current.isRefreshing ? 'animate-spin' : ''}
                                style={{
                                    transform: pullRefreshRef.current.isRefreshing ? undefined : `rotate(${Math.min(180, pullRefreshDistance * 2.1)}deg)`,
                                }}
                            />
                        </div>
                    )}
                    <div
                        id="marketplaceGalleryScroll"
                        ref={galleryScrollRef}
                        className="marketplace-gallery-scroll"
                        data-detail-open={isGalleryDetailOverlay ? 'true' : 'false'}
                        {...(isMobileMarketplace ? { 'data-lenis-prevent': true } : {})}
                        onScroll={handleGalleryScroll}
                        onTouchStart={handleGalleryTouchStart}
                        onTouchMove={handleGalleryTouchMove}
                        onTouchEnd={handleGalleryTouchEnd}
                        onTouchCancel={resetPullRefresh}
                    >
                        <Suspense fallback={<div className="min-h-screen bg-transparent"></div>}>
                            <GalleryView
                                items={items}
                                isAdmin={isAdmin} isSecretGateOpen={isSecretGateOpen} user={user}
                                isPreparingGallery={isPreparingGallery}
                                onShowLogin={() => setShowFullLogin(true)}
                                onSelectItem={(id) => openProductDetail(id, { view: 'gallery' })}
                                onPrefetchItem={prefetchProductDetail}
                                darkMode={darkMode}
                                onOpenMenu={onOpenMenu}
                                onOpenCart={onOpenCart}
                                toggleTheme={toggleTheme}
                                setHeaderProps={setHeaderProps}
                                persistentGalleryState={persistentGalleryState}
                                saveGalleryState={saveGalleryState}
                                onAddToCart={addToCart}
                                wishlistItems={wishlistItems}
                                onToggleWishlist={toggleWishlist}
                                onOpenAbout={onOpenAbout}
                                onNavigateCategory={onNavigateCategory}
                                onOpenQuote={() => { setView('devis'); window.scrollTo(0, 0); }}
                                isDetailOverlayOpen={isGalleryDetailOverlay}
                                isCatalogComplete={isCatalogComplete}
                                isLoadingFullCatalog={isLoadingFullCatalog}
                                onLoadFullCatalog={onLoadFullCatalog}
                            />
                        </Suspense>
                        {view === 'gallery' && galleryFooter}
                    </div>
                </div>
            )}

            {view === 'detail' && selectedItemId && (
                <Suspense fallback={<ProductDetailFallback darkMode={darkMode} />}>
                    <div className="contents">
                        <ProductDetail
                            item={items.find(i => i.id === selectedItemId)}
                            user={user}
                            onBack={closeProductDetail}
                            onAddToCart={addToCart}
                            cartItems={cartItems}
                            darkMode={darkMode}
                            onOpenMenu={onOpenMenu}
                            onOpenCart={onOpenCart}
                            onShowLogin={() => setShowFullLogin(true)}
                            toggleTheme={toggleTheme}
                            setHeaderProps={setHeaderProps}
                        />
                    </div>
                </Suspense>
            )}

            {view === 'checkout' && (
                <Suspense fallback={<div className="min-h-screen bg-transparent"></div>}>
                    <CheckoutView
                        cartItems={cartItems}
                        total={cartTotal}
                        user={user}
                        darkMode={darkMode}
                        onBack={() => {
                            if (persistentGalleryState) {
                                setHeaderProps(prev => ({
                                    ...prev,
                                    activeCollection: persistentGalleryState.activeCollection,
                                    filter: persistentGalleryState.filter
                                }));
                            }
                            setView('gallery');
                        }}
                        onPlaceOrder={handlePlaceOrder}
                    />
                </Suspense>
            )}

            {view === 'devis' && (
                <Suspense fallback={<div className="min-h-screen bg-transparent"></div>}>
                    <QuoteRequestView
                        darkMode={darkMode}
                        setHeaderProps={setHeaderProps}
                    />
                </Suspense>
            )}

            {shouldRenderCategorySurface && (
                <Suspense fallback={<div className="min-h-screen bg-transparent"></div>}>
                    <CategoryPage
                        categoryId={activeCategoryId}
                        items={items}
                        darkMode={darkMode}
                        onSelectItem={(id) => openProductDetail(id, { view: 'category', categoryId: activeCategoryId })}
                        onPrefetchItem={prefetchProductDetail}
                        onBack={() => { setView('gallery'); window.scrollTo(0, 0); }}
                        onAddToCart={addToCart}
                        wishlistItems={wishlistItems}
                        onToggleWishlist={toggleWishlist}
                        onOpenAbout={onOpenAbout}
                        onNavigateCategory={onNavigateCategory}
                        setHeaderProps={setHeaderProps}
                        isCatalogComplete={isCatalogComplete}
                        onLoadFullCatalog={onLoadFullCatalog}
                        onLoadCategoryCatalog={onLoadCategoryCatalog}
                    />
                </Suspense>
            )}

            {view === 'wishlist' && (
                <Suspense fallback={<div className="min-h-screen bg-transparent"></div>}>
                    <WishlistView
                        wishlistItems={wishlistItems}
                        items={items}
                        onAddToCart={addToCart}
                        onToggleWishlist={toggleWishlist}
                        onClearWishlist={clearWishlist}
                        onSelectItem={(id) => openProductDetail(id, { view: 'gallery' })}
                        onOpenAbout={onOpenAbout}
                        onBack={() => setView('gallery')}
                        darkMode={darkMode}
                        user={user}
                        onShowLogin={() => setShowFullLogin(true)}
                    />
                </Suspense>
            )}

            {view === 'my-orders' && user && (
                <Suspense fallback={<div className="min-h-screen bg-transparent"></div>}>
                    <MyOrdersView
                        user={user}
                        onBack={() => setView('gallery')}
                        darkMode={darkMode}
                        activeDesignId={activeDesignId}
                        wishlistItems={wishlistItems}
                        items={items}
                        onOpenWishlist={() => setView('wishlist')}
                        onLogout={logout}
                    />
                </Suspense>
            )}

            {showOrderSuccess && (
                <Suspense fallback={null}>
                    <OrderSuccessModal onClose={() => setShowOrderSuccess(false)} paymentMethod={orderSuccessMethod} />
                </Suspense>
            )}



            {view === 'login' && isSecretGateOpen && <Suspense fallback={null}><LoginView onSuccess={() => setView('admin')} /></Suspense>}

            {view === 'admin' && isAdmin && adminCollection === 'performance_study' && (
                <Suspense fallback={<div className="min-h-screen bg-[#faf9f5]" />}>
                    <PerformanceArchitectureStudy
                        seo={false}
                        onBack={() => {
                            setAdminCollection('dashboard');
                            window.scrollTo(0, 0);
                        }}
                    />
                </Suspense>
            )}

            {view === 'admin' && isAdmin && adminCollection !== 'performance_study' && (
                <div className={`max-w-6xl mx-auto px-4 py-24 md:py-32 space-y-12 md:space-y-16 animate-in fade-in ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                    <Suspense fallback={null}>
                        <AdminIPTracker />
                    </Suspense>
                    {/* GESTION ATELIER HEADER */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <p className={`text-[10px] uppercase font-black tracking-[0.3em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Système de Contrôle</p>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Gestion Boutique</h2>
                        </div>
                        <button 
                            onClick={() => setView('gallery')} 
                            className={`group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-2 px-6 py-2.5 rounded-2xl transition-all ${darkMode ? 'border-white/10 hover:border-white hover:bg-white hover:text-stone-900' : 'border-stone-900 hover:bg-stone-900 hover:text-white'}`}
                        >
                            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Retour au site
                        </button>
                    </div>

                    {/* PREMIUM ADMIN NAVIGATION - BENTO PILL DESIGN */}
                    <div className="relative flex flex-col items-center">
                        <div className={`w-full p-2 rounded-[2.5rem] border ${darkMode ? 'bg-[#111111]/80 border-white/5 backdrop-blur-xl' : 'bg-white/80 border-stone-200/60 backdrop-blur-xl shadow-lg shadow-stone-200/20'}`}>
                            <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
                                {/* Desktop: All tabs | Mobile: First 4 */}
                                {adminTabs.map((tab, idx) => {
                                    const Icon = tab.icon;
                                    const isActive = adminCollection === tab.id;
                                    const isAlwaysVisible = idx < 4;
                                    const isDesktopVisible = idx < 8;
                                    
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => { setAdminCollection(tab.id); setEditingItem(null); setIsMoreMenuOpen(false); }}
                                            className={`group relative flex-none flex items-center gap-2 px-3 md:px-5 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                                                isAlwaysVisible ? 'flex' : isDesktopVisible ? 'hidden md:flex' : 'hidden'
                                            } ${
                                                isActive 
                                                    ? (darkMode ? 'bg-white text-stone-900 shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'bg-stone-900 text-white shadow-xl')
                                                    : (darkMode ? 'text-stone-500 hover:text-white hover:bg-white/5' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50')
                                            }`}
                                        >
                                            <Icon size={14} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-6'}`} />
                                            <span className={`${isActive ? 'opacity-100' : 'opacity-80'}`}>{tab.label}</span>
                                            {isActive && (
                                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current opacity-40"></span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* "More" Button - Universal (Now showing items from line 2) */}
                        <button
                            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                            className={`mt-6 flex items-center gap-2 px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 hover:scale-105 active:scale-95 ${
                                isMoreMenuOpen || adminTabs.slice(8).some(t => t.id === adminCollection)
                                    ? (darkMode ? 'text-white bg-white/10' : 'text-stone-900 bg-stone-100')
                                    : (darkMode ? 'text-stone-600 hover:text-stone-400' : 'text-stone-400 hover:text-stone-600')
                            }`}
                        >
                            <span className="opacity-50 tracking-tighter">•••</span>
                            <span>{isMoreMenuOpen ? 'Fermer' : 'Plus d\'options'}</span>
                            <ChevronDown size={12} className={`transition-transform duration-500 ${isMoreMenuOpen ? 'rotate-180' : 'opacity-40'}`} />
                        </button>

                        {/* Universal Dropdown - Premium Bento Style */}
                        <AnimatePresence>
                            {isMoreMenuOpen && (
                                <>
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setIsMoreMenuOpen(false)}
                                        className="fixed inset-0 z-40"
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className={`absolute top-full left-0 right-0 mt-2 z-50 p-3 rounded-[2.5rem] border grid grid-cols-2 md:grid-cols-4 gap-2 max-w-4xl mx-auto ${
                                            darkMode 
                                                ? 'bg-[#161616] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' 
                                                : 'bg-white border-stone-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)]'
                                        }`}
                                    >
                                        {adminTabs.slice(4).map((tab, idx) => {
                                            const realIdx = idx + 4;
                                            const isDesktopShown = realIdx < 8;
                                            const Icon = tab.icon;
                                            const isActive = adminCollection === tab.id;
                                            
                                            return (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => { 
                                                        setAdminCollection(tab.id); 
                                                        setEditingItem(null); 
                                                        setIsMoreMenuOpen(false); 
                                                    }}
                                                    className={`items-center gap-3 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isDesktopShown ? 'md:hidden flex' : 'flex'} ${
                                                        isActive
                                                            ? (darkMode ? 'bg-white text-stone-900' : 'bg-stone-900 text-white')
                                                            : (darkMode ? 'bg-white/5 text-stone-400 hover:text-white' : 'bg-stone-50 text-stone-500 hover:text-stone-900')
                                                    }`}
                                                >
                                                    <Icon size={14} />
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className={`w-full h-px my-6 ${darkMode ? 'bg-white/10' : 'bg-stone-200'}`} />

                    <Suspense fallback={<div className="flex items-center justify-center p-20"><div className="w-10 h-10 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div></div>}>
                        {adminCollection === 'dashboard' ? (
                            <AdminDashboard user={user} darkMode={darkMode} />
                        ) : adminCollection === 'homepage' ? (
                            <AdminHomepage darkMode={darkMode} />
                        ) : adminCollection === 'orders' ? (
                            <AdminOrders darkMode={darkMode} />
                        ) : adminCollection === 'livraison' ? (
                            <AdminLivraison darkMode={darkMode} />
                        ) : adminCollection === 'studio' ? (
                            <AdminStudio darkMode={darkMode} />
                        ) : adminCollection === 'users' ? (
                            <AdminUsers darkMode={darkMode} />
                        ) : adminCollection === 'ip_manager' ? (
                            <AdminIPManager darkMode={darkMode} />
                        ) : adminCollection === 'newsletter' ? (
                            <AdminNewsletter darkMode={darkMode} />
                        ) : adminCollection === 'seo' ? (
                            <AdminSEO darkMode={darkMode} />
                        ) : adminCollection === 'analytics' ? (
                            <AdminAnalytics darkMode={darkMode} />
                        ) : adminCollection === 'map' ? (
                            <AdminAnalytics darkMode={darkMode} />
                        ) : adminCollection === 'payment_settings' ? (
                            <AdminPaymentSettings darkMode={darkMode} />
                        ) : adminCollection === 'inventory' ? (
                            <AdminGlobalInventory items={items} darkMode={darkMode} onEdit={(item) => { setAdminCollection('furniture'); setEditingItem(item); window.scrollTo(0, 0); }} />
                        ) : adminCollection === 'maintenance' ? (
                            <AdminMaintenance darkMode={darkMode} />
                        ) : (
                            <>
                                <AdminForm
                                    key={adminCollection}
                                    editData={editingItem}
                                    onCancelEdit={() => setEditingItem(null)}
                                    collectionName={adminCollection}
                                    darkMode={darkMode}
                                />
                                <div className="pt-10">
                                    <AdminItemList
                                        collectionName={adminCollection}
                                        darkMode={darkMode}
                                        onEdit={(item) => { setEditingItem(item); window.scrollTo(0, 0); }}
                                        onToggleStatus={(item) => handleToggleStatus(item, adminCollection)}
                                        onDelete={(id) => handleDeleteItem(null, id, adminCollection)}
                                        onMarkAsSold={(item) => handleMarkAsSold(item, adminCollection)}
                                        onMarkAsAvailable={(item) => handleMarkAsAvailable(item, adminCollection)}
                                    />
                                </div>
                            </>
                        )}
                    </Suspense>
                </div>
            )}
        </main>
    );
};

export default AppRouter;
