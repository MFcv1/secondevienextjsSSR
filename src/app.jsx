import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';

import { AuthProvider, useAuth } from './kit/contexts/AuthContext';
import {
  ShieldCheck, X, Eye, EyeOff, AlertTriangle
} from 'lucide-react';

// --- IMPORTS KIT (standardisé) ---
import { appId } from './kit/config/firebaseEnv';
import { getMillis } from './utils/time';
import { extractCategoryIdFromPath, extractProductIdFromPath, getCategoryUrl, getProductUrl } from './utils/slug';
import { useLiveTheme } from './kit/config/theme';
import KIT_CONFIG from './kit/config/constants';

import AppRouter from './Router';
import ErrorBoundary from './kit/shared/ErrorBoundary';
import SEO from './kit/shared/SEO';
import { emitAnalyticsEvent } from './kit/contexts/AnalyticsContext';
import {
  PUBLIC_ITEMS_CACHE_KEY,
  PUBLIC_ITEMS_FULL_CACHE_KEY,
  PUBLIC_ITEMS_CACHE_TTL_MS,
} from './kit/shared/publicCatalogCache';
import { ToastProvider, useToast } from './kit/ui/Toast';

import ArchitecturalHeader from './kit/marketplace/components/ArchitecturalHeader';
import AnnouncementBanner from './kit/marketplace/components/AnnouncementBanner';

const loadCartSidebar = () => import('./kit/commerce/CartSidebar');
const loadFooter = () => import('./kit/layout/Footer');
const loadGlobalMenu = () => import('./kit/layout/GlobalMenu');
const loadMarketplaceDiscovery = () => import('./kit/marketplace/MarketplaceDiscovery');
const loadAnalyticsProvider = () => import('./kit/shared/AnalyticsProvider');
const loadFirebaseRuntime = () => import('./kit/config/firebaseLazy');

const CartSidebar = React.lazy(loadCartSidebar);
const Footer = React.lazy(loadFooter);
const GlobalMenu = React.lazy(loadGlobalMenu);
const MarketplaceDiscovery = React.lazy(loadMarketplaceDiscovery);

const FooterLoadingPlaceholder = ({ darkMode = false }) => {
  const panelClassName = darkMode
    ? 'border-[#2e2a25] bg-[#111110]'
    : 'border-[#eee6dd] bg-[#fdfbf8]';
  const mutedClassName = darkMode ? 'bg-[#24211d]' : 'bg-[#f3eee7]';
  const lineClassName = darkMode ? 'bg-[#3a332b]' : 'bg-[#e7ded3]';

  return (
    <div
      aria-hidden="true"
      data-footer-loading-placeholder="true"
      className={`min-h-[1320px] w-full px-3 pb-6 pt-10 md:px-6 md:pb-8 ${
        darkMode ? 'bg-[#111] text-[#f4eee6]' : 'bg-[#fbfaf8] text-stone-950'
      }`}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '1320px' }}
    >
      <div className={`mx-auto hidden w-full max-w-[1760px] overflow-hidden rounded-[18px] border md:block ${panelClassName}`}>
        <div className={`grid grid-cols-4 divide-x ${darkMode ? 'divide-[#3a332b]' : 'divide-[#eee6dd]'}`}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-6 px-10 py-8">
              <span className={`h-16 w-16 shrink-0 rounded-full ${mutedClassName}`} />
              <span className="flex flex-1 flex-col gap-3">
                <span className={`h-4 w-36 rounded-full ${lineClassName}`} />
                <span className={`h-3 w-48 rounded-full ${lineClassName}`} />
              </span>
            </div>
          ))}
        </div>

        <div className={`border-t px-12 py-14 ${darkMode ? 'border-[#2e2a25]' : 'border-[#eee6dd]'}`}>
          <div className="grid grid-cols-[240px_140px_150px_155px_190px_minmax(420px,520px)] gap-9">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <span className={`h-16 w-16 rounded-sm ${mutedClassName}`} />
                <span className="space-y-3">
                  <span className={`block h-6 w-32 rounded-full ${lineClassName}`} />
                  <span className={`block h-3 w-28 rounded-full ${lineClassName}`} />
                </span>
              </div>
              <span className={`block h-3 w-full rounded-full ${lineClassName}`} />
              <span className={`block h-3 w-5/6 rounded-full ${lineClassName}`} />
              <span className={`block h-3 w-2/3 rounded-full ${lineClassName}`} />
            </div>

            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-7">
                <span className={`block h-4 w-24 rounded-full ${lineClassName}`} />
                <div className="space-y-5">
                  <span className={`block h-3 w-28 rounded-full ${lineClassName}`} />
                  <span className={`block h-3 w-24 rounded-full ${lineClassName}`} />
                  <span className={`block h-3 w-32 rounded-full ${lineClassName}`} />
                  <span className={`block h-3 w-20 rounded-full ${lineClassName}`} />
                </div>
              </div>
            ))}

            <div className="space-y-5">
              <span className={`block h-4 w-44 rounded-full ${lineClassName}`} />
              <span className={`block h-[260px] w-full rounded-xl ${mutedClassName}`} />
              <span className={`block h-20 w-full rounded-lg ${mutedClassName}`} />
            </div>
          </div>
        </div>
      </div>

      <div className={`mx-auto grid w-full max-w-[430px] gap-4 rounded-[24px] border p-6 md:hidden ${panelClassName}`}>
        <span className={`h-5 w-40 rounded-full ${lineClassName}`} />
        <span className={`h-[220px] w-full rounded-xl ${mutedClassName}`} />
        <span className={`h-4 w-full rounded-full ${lineClassName}`} />
        <span className={`h-4 w-5/6 rounded-full ${lineClassName}`} />
        <span className={`h-4 w-2/3 rounded-full ${lineClassName}`} />
      </div>
    </div>
  );
};

const PUBLIC_ITEMS_INITIAL_LIMIT = 36;
const CONTACT_INFO_CACHE_KEY = 'secondevie:contact-info:v1';
const USER_CONNECTION_LOG_TTL_MS = 10 * 60 * 1000;
const ADMIN_LIVE_ITEM_TABS = new Set(['dashboard', 'furniture', 'inventory']);
const ABOUT_PATH = '/a-propos';
const MOBILE_MARKETPLACE_QUERY = '(max-width: 1023px)';
const NEXT_VIEW_PATHS = {
  '/admin': 'admin',
  '/checkout': 'checkout',
  '/wishlist': 'wishlist',
  '/devis': 'devis',
  '/mes-commandes': 'my-orders',
};

const deferNonCriticalWork = (callback) => {
  if (typeof window === 'undefined') return () => {};

  let idleId = 0;
  const timeoutId = window.setTimeout(() => {
    const run = () => {
      idleId = 0;
      callback();
    };

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(run, { timeout: 8000 });
      return;
    }

    run();
  }, 15000);

  return () => {
    window.clearTimeout(timeoutId);
    if (idleId && 'cancelIdleCallback' in window) {
      window.cancelIdleCallback(idleId);
    }
  };
};

const DeferredAnalyticsProvider = ({ children, ...analyticsNav }) => {
  const [AnalyticsProviderComponent, setAnalyticsProviderComponent] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const cancelDeferredWork = deferNonCriticalWork(() => {
      loadAnalyticsProvider().then((module) => {
        if (!cancelled) {
          setAnalyticsProviderComponent(() => module.default);
        }
      });
    });

    return () => {
      cancelled = true;
      cancelDeferredWork();
    };
  }, []);

  if (!AnalyticsProviderComponent) {
    return children;
  }

  return (
    <AnalyticsProviderComponent {...analyticsNav}>
      {children}
    </AnalyticsProviderComponent>
  );
};

const readJsonStorage = (storage, key, fallback = null) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJsonStorage = (storage, key, value) => {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Cache optional.
  }
};

const getGoogleLoginErrorMessage = (error) => {
  if (error?.code === 'auth/unauthorized-domain') {
    return "Connexion Google bloquee: le domaine App Hosting n'est pas autorise dans Firebase Authentication.";
  }
  if (error?.code === 'auth/operation-not-allowed') {
    return "Connexion Google desactivee dans Firebase Authentication.";
  }
  if (error?.code === 'auth/popup-blocked') {
    return "Popup Google bloquee par le navigateur.";
  }
  if (error?.code === 'auth/popup-closed-by-user') {
    return "Connexion Google annulee.";
  }
  return `Erreur Google : ${error?.message || 'connexion impossible'}`;
};

const mergeItemsById = (currentItems, incomingItems) => {
  const byId = new Map();
  currentItems.forEach((item) => {
    if (item?.id) byId.set(item.id, item);
  });
  incomingItems.forEach((item) => {
    if (!item?.id) return;
    byId.set(item.id, { ...(byId.get(item.id) || {}), ...item });
  });
  return Array.from(byId.values())
    .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
};

const isFullCatalogItem = (item) => item?.__catalogScope === 'full';

const shouldUsePublicCatalogEndpoint = () => {
  return true;
};

const publicCatalogFetches = new Map();

const isRootGalleryEntryUrl = () => (
  typeof window !== 'undefined' &&
  window.location.pathname === '/' &&
  !window.location.search &&
  !window.location.hash
);

const isMobileMarketplaceViewport = () => (
  typeof window !== 'undefined' &&
  window.matchMedia(MOBILE_MARKETPLACE_QUERY).matches
);

const AppContent = () => {
  const toast = useToast();

  // Use Auth Context
  const { user, isAdmin, loading: authLoading, loginWithGoogle, loginWithEmail, signupWithEmail, logout, verifyEmail } = useAuth();
  const shouldPlayInitialGalleryEntryRef = useRef(isRootGalleryEntryUrl());
  const productDetailFetchesRef = useRef(new Map());

  const [items, setItems] = useState([]);
  const [catalogFetchMode, setCatalogFetchMode] = useState('initial');
  const [isCatalogComplete, setIsCatalogComplete] = useState(false);
  const [isLoadingFullCatalog, setIsLoadingFullCatalog] = useState(false);
  const [contactInfo] = useState(() => readJsonStorage(
    typeof window !== 'undefined' ? window.localStorage : null,
    CONTACT_INFO_CACHE_KEY,
    {}
  ));


  const [showMarketplacePopup, setShowMarketplacePopup] = useState(false);
  const footerRef = useRef(null);
  const [footerSentinelNode, setFooterSentinelNode] = useState(null);





  // --- iOS viewport height fix (--vh variable for reliable 100vh) ---
  const requestFullCatalog = useCallback(() => {
    if (!isCatalogComplete) {
      setCatalogFetchMode('full');
    }
  }, [isCatalogComplete]);

  const requestCategoryCatalog = useCallback((categoryId) => {
    if (!categoryId || isCatalogComplete) return Promise.resolve([]);

    return Promise.all([
      import('./kit/marketplace/categoryCatalogLoader'),
      loadFirebaseRuntime(),
    ])
      .then(async ([{ loadCategoryCatalog }, { getDb }]) => loadCategoryCatalog({
        categoryId,
        db: await getDb(),
        appId,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        isCatalogComplete,
      }))
      .then((categoryItems) => {
        if (categoryItems.length) {
          setItems(prev => mergeItemsById(prev, categoryItems));
        }
        return categoryItems;
      });
  }, [isCatalogComplete]);

  const ensureProductDetailItem = useCallback((id) => {
    if (!id) return Promise.resolve(null);

    const currentItem = items.find(item => item.id === id);
    if (isFullCatalogItem(currentItem)) {
      return Promise.resolve(currentItem);
    }

    const inflight = productDetailFetchesRef.current.get(id);
    if (inflight) return inflight;

    const request = loadFirebaseRuntime()
      .then(async ({ getDb, loadFirestoreModule }) => {
        const [db, { doc, getDoc }] = await Promise.all([getDb(), loadFirestoreModule()]);
        return getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'furniture', id));
      })
      .then((snapshot) => {
        if (!snapshot.exists()) return null;

        const fullItem = {
          id: snapshot.id,
          collectionName: 'furniture',
          ...snapshot.data(),
          __catalogScope: 'full'
        };
        setItems(prev => mergeItemsById(prev, [fullItem]));
        return fullItem;
      })
      .catch((error) => {
        console.warn('Lecture detail produit indisponible:', error);
        return null;
      })
      .finally(() => {
        productDetailFetchesRef.current.delete(id);
      });

    productDetailFetchesRef.current.set(id, request);
    return request;
  }, [items]);

  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);

  // Cart State
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Wishlist State
  const [wishlistItems, setWishlistItems] = useState([]);
  const [cartInteracted, setCartInteracted] = useState(false); // Prevents initial flash
  const [shouldReserveDeferredFooter, setShouldReserveDeferredFooter] = useState(false);
  const [shouldRenderDeferredFooter, setShouldRenderDeferredFooter] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [orderSuccessMethod, setOrderSuccessMethod] = useState(''); // Tracks which payment method was used
  const [stockAlert, setStockAlert] = useState(null); // { currentStock: number }

  // Navigation
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (extractProductIdFromPath(pathname)) return 'detail';
      if (extractCategoryIdFromPath(pathname)) return 'category';
      if (pathname === ABOUT_PATH) return 'home';
      if (NEXT_VIEW_PATHS[pathname]) return NEXT_VIEW_PATHS[pathname];
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('category/')) { return 'category'; }
      if (['home', 'gallery', 'login', 'admin', 'my-orders', 'checkout', 'wishlist', 'devis'].includes(hash)) return hash;
      const params = new URLSearchParams(window.location.search);
      if (params.get('page') === 'gallery') return 'gallery';
    }
    return 'gallery';
  }); // 'home', 'gallery', 'detail', 'login', 'admin'
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(() => {
    if (typeof window !== 'undefined') {
      const pathCategoryId = extractCategoryIdFromPath(window.location.pathname);
      if (pathCategoryId) return pathCategoryId;
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('category/')) return hash.replace('category/', '');
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [isSecretGateOpen, setIsSecretGateOpen] = useState(false);
  const [showFullLogin, setShowFullLogin] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [isMenuHeaderActive, setIsMenuHeaderActive] = useState(false);
  const [shouldKeepGlobalMenuMounted, setShouldKeepGlobalMenuMounted] = useState(false);
  const [isMobileAnnouncementCollapsed, setIsMobileAnnouncementCollapsed] = useState(false);
  const menuCloseTimerRef = useRef(null);
  const menuHeaderTimerRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAuthSuccess, setShowAuthSuccess] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const scrollYRef = useRef(0);
  const wasModalOpenRef = useRef(false);
  const lastItemsFetchAtRef = useRef(0);

  const GLOBAL_MENU_EXIT_MS = 820;
  const GLOBAL_MENU_HEADER_RELEASE_MS = 780;

  const prepareGlobalMenu = useCallback(() => {
    loadGlobalMenu().catch(() => {});
    setShouldKeepGlobalMenuMounted(true);
  }, []);

  const openGlobalMenu = () => {
    const activateMenu = () => {
      if (menuCloseTimerRef.current) window.clearTimeout(menuCloseTimerRef.current);
      if (menuHeaderTimerRef.current) window.clearTimeout(menuHeaderTimerRef.current);
      setIsMenuClosing(false);
      setIsMenuHeaderActive(true);
      setIsMenuOpen(true);
    };

    activateMenu();

    prepareGlobalMenu();
  };

  const closeGlobalMenu = () => {
    if (!isMenuOpen || isMenuClosing) return;

    setIsMenuClosing(true);
    if (menuCloseTimerRef.current) window.clearTimeout(menuCloseTimerRef.current);
    if (menuHeaderTimerRef.current) window.clearTimeout(menuHeaderTimerRef.current);
    menuHeaderTimerRef.current = window.setTimeout(() => {
      setIsMenuHeaderActive(false);
      menuHeaderTimerRef.current = null;
    }, GLOBAL_MENU_HEADER_RELEASE_MS);
    menuCloseTimerRef.current = window.setTimeout(() => {
      setIsMenuOpen(false);
      setIsMenuClosing(false);
      menuCloseTimerRef.current = null;
    }, GLOBAL_MENU_EXIT_MS);
  };

  const setGlobalMenuOpen = (nextOpen) => {
    const shouldOpen = typeof nextOpen === 'function' ? nextOpen(isMenuOpen && !isMenuClosing) : nextOpen;
    if (shouldOpen) openGlobalMenu();
    else closeGlobalMenu();
  };

  const openCart = useCallback(() => {
    loadCartSidebar().catch(() => {});
    setCartInteracted(true);
    setIsCartOpen(true);
  }, []);

  const openMarketplaceDiscovery = useCallback(() => {
    loadMarketplaceDiscovery().catch(() => {});
    setShowMarketplacePopup(true);
  }, []);

  const revealDeferredFooter = useCallback(() => {
    setShouldReserveDeferredFooter(true);
    setShouldRenderDeferredFooter(true);
    loadFooter().catch(() => {});
  }, []);

  const setDeferredFooterSentinel = useCallback((node) => {
    setFooterSentinelNode(node);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (shouldRenderDeferredFooter) return undefined;

    const sentinel = footerSentinelNode;
    let frameId = 0;
    const checkFooterDistance = () => {
      frameId = 0;
      if (!sentinel) return;

      if (sentinel.dataset.deferredFooterSentinel === 'gallery') {
        if (window.scrollY > 1200) {
          setShouldReserveDeferredFooter(true);
        }

        if (window.scrollY > 3600) {
          revealDeferredFooter();
          return;
        }

        const newsletterSection = document.querySelector('.discount-section');
        if (!newsletterSection) return;
        revealDeferredFooter();
        return;
      }

      const rect = sentinel.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 1600) {
        revealDeferredFooter();
      }
    };
    const scheduleDistanceCheck = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(checkFooterDistance);
    };

    scheduleDistanceCheck();
    window.addEventListener('scroll', scheduleDistanceCheck, { passive: true });
    window.addEventListener('resize', scheduleDistanceCheck);

    let idleId = null;
    const timer = window.setTimeout(() => {
      const run = () => revealDeferredFooter();
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(run, { timeout: 2500 });
        return;
      }
      run();
    }, 22000);

    return () => {
      window.removeEventListener('scroll', scheduleDistanceCheck);
      window.removeEventListener('resize', scheduleDistanceCheck);
      if (frameId) window.cancelAnimationFrame(frameId);
      window.clearTimeout(timer);
      if (idleId !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [footerSentinelNode, revealDeferredFooter, shouldRenderDeferredFooter]);

  useEffect(() => () => {
    if (menuCloseTimerRef.current) window.clearTimeout(menuCloseTimerRef.current);
    if (menuHeaderTimerRef.current) window.clearTimeout(menuHeaderTimerRef.current);
  }, []);

  useEffect(() => {
    if (view !== 'gallery' && view !== 'detail') {
      setIsMobileAnnouncementCollapsed(false);
    }
  }, [view]);

  // iOS-safe body scroll lock for modals
  useEffect(() => {
    const anyModalOpen = showFullLogin || showOrderSuccess || stockAlert;
    if (anyModalOpen) {
      scrollYRef.current = window.scrollY;
      wasModalOpenRef.current = true;
      document.body.classList.add('modal-open');
      document.body.style.top = `-${scrollYRef.current}px`;
    } else if (wasModalOpenRef.current) {
      wasModalOpenRef.current = false;
      document.body.classList.remove('modal-open');
      document.body.style.top = '';
      window.scrollTo(0, scrollYRef.current);
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.top = '';
    }
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.top = '';
    };
  }, [showFullLogin, showOrderSuccess, stockAlert]);

  // Admin State
  const [adminCollection, setAdminCollection] = useState('dashboard'); // 'dashboard' | 'furniture' | 'orders'

  // Transition State
  const [isPreparingGallery, setIsPreparingGallery] = useState(shouldPlayInitialGalleryEntryRef.current);
  const [isTransitioning, setIsTransitioning] = useState(shouldPlayInitialGalleryEntryRef.current);
  const [isInitialGalleryEntry, setIsInitialGalleryEntry] = useState(shouldPlayInitialGalleryEntryRef.current);



  const startGalleryTransition = () => {
    setIsInitialGalleryEntry(false);
    setIsPreparingGallery(true);
    setIsTransitioning(true);
  };

  const completeGalleryTransition = () => {
    // We swap the view while the curtain is opaque
    setView('gallery');
    setIsPreparingGallery(false);
    setIsInitialGalleryEntry(false);
    window.scrollTo(0, 0);

    // Flow continu ralenti (FRONTMASTER) : Temps de lecture augmenté pour 
    // profiter de l'apparition majestueuse
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1700);
  };

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const mediaQuery = window.matchMedia(MOBILE_MARKETPLACE_QUERY);

    const syncEntryScrollLock = () => {
      const shouldLock = isTransitioning && mediaQuery.matches;
      root.classList.toggle('gallery-entry-scroll-lock', shouldLock);
      body.classList.toggle('gallery-entry-scroll-lock', shouldLock);

      if (shouldLock) {
        window.scrollTo(0, 0);
      }
    };

    syncEntryScrollLock();
    mediaQuery.addEventListener?.('change', syncEntryScrollLock);

    return () => {
      mediaQuery.removeEventListener?.('change', syncEntryScrollLock);
      root.classList.remove('gallery-entry-scroll-lock');
      body.classList.remove('gallery-entry-scroll-lock');
    };
  }, [isTransitioning]);

  useEffect(() => {
    if (!shouldPlayInitialGalleryEntryRef.current || loading) return undefined;

    const timer = window.setTimeout(() => {
      setIsPreparingGallery(false);
      setIsInitialGalleryEntry(false);
      setIsTransitioning(false);
      if (isMobileMarketplaceViewport()) {
        window.scrollTo(0, 0);
      }
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [loading]);

  // Deep Linking State
  const [pendingDeepLink, setPendingDeepLink] = useState(null);

  // Header Props for Architectural Design
  const [headerProps, setHeaderProps] = useState(null);

  // [NEW] Persistent Gallery State (To restore collection after detail/checkout)
  const [persistentGalleryState, setPersistentGalleryState] = useState({
    activeCollection: 'furniture',
    filter: 'fixed'
  });

  const saveGalleryState = React.useCallback((state) => {
    setPersistentGalleryState(prev => ({ ...prev, ...state }));
  }, []);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  const { forcedMode, activeDesignId } = useLiveTheme(darkMode);

  // Effective Dark Mode Logic (Sync State)
  useEffect(() => {
    if (forcedMode === 'dark') {
      setDarkMode(true);
    } else if (forcedMode === 'light') {
      setDarkMode(false);
    }
  }, [forcedMode]);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Marketplace Discovery Trigger (STRICTEMENT sur Accueil - Au Footer)
  useEffect(() => {
    // 1. Si déjà vu, on sort
    const alreadySeen = localStorage.getItem('hasSeenMarketplacePopup');
    if (alreadySeen) return;

    // 2. Uniquement sur la page d'accueil (Home)
    if (view !== 'home') return;

    // 3. Trigger au scroll (proche du bas / après FAQ)
    let scrollHandler = null;
    const timer = setTimeout(() => {
      scrollHandler = () => {
        const scrollPosition = window.scrollY + window.innerHeight;
        const pageHeight = document.documentElement.scrollHeight;
        const triggerPoint = pageHeight - 400; // Proche du footer/après FAQ

        if (scrollPosition > triggerPoint && view === 'home') {
          console.log('MARKETPLACE POPUP TRIGGERED (bottom of home)');
          openMarketplaceDiscovery();
          localStorage.setItem('hasSeenMarketplacePopup', 'true');
          window.removeEventListener('scroll', scrollHandler);
        }
      };
      window.addEventListener('scroll', scrollHandler, { passive: true });
    }, 2000);

    return () => {
      clearTimeout(timer);
      if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
    };
  }, [view]);

  // --- CHARGEMENT ---
  // Public: fetch ponctuel filtré sur les publications.
  // Admin: temps réel uniquement quand l'atelier est ouvert.
  useEffect(() => {
    let cancelled = false;
    let unsubscribe = null;

    const mapItems = (snap) => snap.docs
      .map(d => ({ id: d.id, collectionName: 'furniture', ...d.data() }))
      .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));

    const readCachedPublishedItems = (cacheKey) => {
      try {
        const raw = sessionStorage.getItem(cacheKey);
        if (!raw) return null;

        const cached = JSON.parse(raw);
        if (!cached?.savedAt || !Array.isArray(cached.items)) return null;
        if ((Date.now() - cached.savedAt) > PUBLIC_ITEMS_CACHE_TTL_MS) return null;
        return cached;
      } catch {
        return null;
      }
    };

    const writeCachedPublishedItems = (cacheKey, nextItems, catalogVersion = null) => {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          savedAt: Date.now(),
          catalogVersion,
          items: nextItems
        }));
      } catch {
        // Cache is optional; private mode or quota failures should not affect UX.
      }
    };

    const fetchPublicCatalog = async (full = false) => {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const params = full ? '' : `?limit=${PUBLIC_ITEMS_INITIAL_LIMIT}&scope=cards`;
      const url = `https://us-central1-${projectId}.cloudfunctions.net/publicCatalog${params}`;
      const inflight = publicCatalogFetches.get(url);
      if (inflight) return inflight;

      const request = fetch(url)
        .then(async (response) => {
          if (!response.ok) throw new Error(`publicCatalog ${response.status}`);
          const payload = await response.json();
          const furniture = payload?.collections?.furniture || [];
          const catalogScope = payload?.scope === 'cards' ? 'cards' : 'full';
          return {
            catalogVersion: payload?.catalogVersion || null,
            items: furniture
              .map((item) => ({ collectionName: 'furniture', ...item, __catalogScope: catalogScope }))
              .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt))
          };
        })
        .finally(() => {
          publicCatalogFetches.delete(url);
        });

      publicCatalogFetches.set(url, request);
      return request;
    };

    const fetchPublishedItemsFromFirestore = async (full = false) => {
      const { getDb, loadFirestoreModule } = await loadFirebaseRuntime();
      const [db, { collection, getDocs, limit, orderBy, query, where }] = await Promise.all([
        getDb(),
        loadFirestoreModule(),
      ]);
      const constraints = [
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        ...(full ? [] : [limit(PUBLIC_ITEMS_INITIAL_LIMIT)])
      ];
      const snap = await getDocs(query(
        collection(db, 'artifacts', appId, 'public', 'data', 'furniture'),
        ...constraints
      ));
      return {
        catalogVersion: null,
        items: mapItems(snap).map(item => ({ ...item, __catalogScope: 'full' }))
      };
    };

    const fetchPublishedItems = async (force = false) => {
      const full = catalogFetchMode === 'full';
      const cacheKey = full ? PUBLIC_ITEMS_FULL_CACHE_KEY : PUBLIC_ITEMS_CACHE_KEY;
      const shouldSkip =
        !force &&
        items.length > 0 &&
        (!full || isCatalogComplete) &&
        (Date.now() - lastItemsFetchAtRef.current) < PUBLIC_ITEMS_CACHE_TTL_MS;
      if (shouldSkip) return;

      if (!force) {
        const cached = readCachedPublishedItems(cacheKey);
        if (cached) {
          React.startTransition(() => {
            setItems(prev => full ? mergeItemsById(prev, cached.items) : cached.items);
            setIsCatalogComplete(full);
          });
          lastItemsFetchAtRef.current = cached.savedAt;
          return;
        }
      }

      try {
        if (full) setIsLoadingFullCatalog(true);
        let nextItems;
        let nextCatalogVersion = null;
        if (shouldUsePublicCatalogEndpoint()) {
          try {
            const catalogResult = await fetchPublicCatalog(full);
            nextItems = catalogResult.items;
            nextCatalogVersion = catalogResult.catalogVersion;
          } catch (catalogError) {
            console.warn("Catalogue public cache indisponible, fallback Firestore:", catalogError);
          }
        }

        if (!nextItems) {
          const firestoreResult = await fetchPublishedItemsFromFirestore(full);
          nextItems = firestoreResult.items;
          nextCatalogVersion = firestoreResult.catalogVersion;
        }

        if (!cancelled) {
          React.startTransition(() => {
            setItems(prev => full ? mergeItemsById(prev, nextItems) : nextItems);
            setIsCatalogComplete(full);
          });
          writeCachedPublishedItems(cacheKey, nextItems, nextCatalogVersion);
          lastItemsFetchAtRef.current = Date.now();
        }
      } catch (error) {
        console.error("Erreur lecture publications:", error);
      } finally {
        if (!cancelled && full) setIsLoadingFullCatalog(false);
      }
    };

    const isAdminLiveView = view === 'admin' && isAdmin && ADMIN_LIVE_ITEM_TABS.has(adminCollection);

    if (isAdminLiveView) {
      loadFirebaseRuntime()
        .then(async ({ getDb, loadFirestoreModule }) => {
          const [db, { collection, onSnapshot }] = await Promise.all([getDb(), loadFirestoreModule()]);
          if (cancelled) return;
          unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'furniture'), (snap) => {
            setItems(mapItems(snap).map(item => ({ ...item, __catalogScope: 'full' })));
            lastItemsFetchAtRef.current = Date.now();
          }, (error) => {
            console.error("Erreur lecture publications:", error);
          });
        })
        .catch((error) => {
          if (!cancelled) console.error("Erreur lecture publications:", error);
        });
    } else if (isPreparingGallery || ['gallery', 'detail', 'category', 'wishlist', 'checkout', 'my-orders', 'devis'].includes(view)) {
      fetchPublishedItems();
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          fetchPublishedItems(false);
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      return () => {
        cancelled = true;
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    }

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [view, isAdmin, adminCollection, items.length, isPreparingGallery, catalogFetchMode, isCatalogComplete]);

  // --- LOGIQUE ROUTING & AUTH (Dépend du User) ---
  useEffect(() => {
    // Logic dependent on user/auth state
    const params = new URLSearchParams(window.location.search);
    const productId = extractProductIdFromPath(window.location.pathname) || params.get('product');
    const pathCategoryId = extractCategoryIdFromPath(window.location.pathname);
    const hash = window.location.hash.replace('#', '');

    // --- SECURITY LOG (IP CAPTURE) ---
    if (user && !user.isAnonymous) {
      // We fire and forget. The backend handles rate limiting or lightweight updates.
      const storageKey = `secondevie:logUserConnection:${user.uid}`;
      const lastLogAt = Number(sessionStorage.getItem(storageKey) || 0);
      if (Date.now() - lastLogAt > USER_CONNECTION_LOG_TTL_MS) {
        sessionStorage.setItem(storageKey, String(Date.now()));
        loadFirebaseRuntime()
          .then(({ getCallableFunction }) => getCallableFunction('logUserConnection'))
          .then((logUserConnection) => logUserConnection())
          .catch(e => {
            sessionStorage.removeItem(storageKey);
            console.error("SecLog Error", e);
          });
      }
    }

    // --- STRIPE SUCCESS HANDLING ---
    if (params.get('order_success') === 'true' && user && !user.isAnonymous) {

      const clearCartAfterStripe = async () => {
        // 1. Déclencher l'UI succès immédiatement
        setOrderSuccessMethod('stripe_elements');
        setShowOrderSuccess(true);
        setView('gallery');

        // 2. Nettoyer l'URL pour éviter de re-déclencher au F5
        window.history.replaceState({}, document.title, '/');

        // 3. Vider le panier Firestore réellement
        try {
          const { getDb, loadFirestoreModule } = await loadFirebaseRuntime();
          const [db, { collection, getDocs, writeBatch }] = await Promise.all([
            getDb(),
            loadFirestoreModule(),
          ]);
          const cartRef = collection(db, 'users', user.uid, 'cart');
          const snapshot = await getDocs(cartRef);

          const batch = writeBatch(db);
          snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();

          // Mettre à jour l'état local aussi pour être sûr
          setCartItems([]);

        } catch (e) {
          console.error("Erreur nettoyage panier post-paiement:", e);
        }
      };

      clearCartAfterStripe();
    }
    // -------------------------------


    if (params.get('admin') === 'true' || window.location.pathname === '/admin' || hash === 'admin') {
      setIsSecretGateOpen(true);
      if (isAdmin) setView('admin'); else setView('login');
    } else if (window.location.pathname === ABOUT_PATH) {
      setSelectedItemId(null);
      setActiveCategoryId(null);
      setView('home');
    } else if (NEXT_VIEW_PATHS[window.location.pathname]) {
      setSelectedItemId(null);
      setActiveCategoryId(null);
      setView(NEXT_VIEW_PATHS[window.location.pathname]);
    } else if (productId) {
      setPendingDeepLink(productId);
    } else if (pathCategoryId) {
      setSelectedItemId(null);
      setActiveCategoryId(pathCategoryId);
      setView('category');
    } else if (hash.startsWith('category/')) {
      setSelectedItemId(null);
      setActiveCategoryId(hash.replace('category/', ''));
      setView('category');
    } else {
      if (hash === 'home') setView('home');
      else if (hash === 'devis') setView('devis');
      else if (params.get('page') === 'gallery' || hash === 'gallery' || window.location.pathname === '/') setView('gallery');
    }
    setLoading(false);

  }, [user, isAdmin]); // Re-run when auth state changes

  // --- PERSISTANCE NAVIGATION (PATH, HASH LEGACY & URL) ---
  useEffect(() => {
    const handleLocationChange = () => {
      const productId = extractProductIdFromPath(window.location.pathname);
      if (productId) {
        setPendingDeepLink(productId);
        return;
      }

      const pathCategoryId = extractCategoryIdFromPath(window.location.pathname);
      if (pathCategoryId) {
        setSelectedItemId(null);
        setActiveCategoryId(pathCategoryId);
        setView('category');
        return;
      }

      if (window.location.pathname === ABOUT_PATH) {
        setSelectedItemId(null);
        setActiveCategoryId(null);
        setView('home');
        return;
      }

      if (NEXT_VIEW_PATHS[window.location.pathname]) {
        setSelectedItemId(null);
        setActiveCategoryId(null);
        setView(NEXT_VIEW_PATHS[window.location.pathname]);
        return;
      }

      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('category/')) {
        setSelectedItemId(null);
        setActiveCategoryId(hash.replace('category/', ''));
        setView('category');
      } else if (['home', 'gallery', 'admin', 'login', 'my-orders', 'checkout', 'wishlist', 'devis'].includes(hash)) {
        setSelectedItemId(null);
        setView(hash);
      } else if (window.location.pathname === '/' && !window.location.search) {
        setSelectedItemId(null);
        setActiveCategoryId(null);
        setView('gallery');
      }
    };
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Synchronisation URL <-> View State
  useEffect(() => {
    if (view === 'detail' && selectedItemId) {
      const selectedItemForUrl = items.find(i => i.id === selectedItemId);
      if (!selectedItemForUrl) return;

      const newUrl = getProductUrl(selectedItemForUrl);
      if (window.location.pathname !== newUrl || window.location.search || window.location.hash) {
        window.history.pushState({ view: 'detail', itemId: selectedItemId }, '', newUrl);
      }
    } else if (view === 'category' && activeCategoryId) {
      const categoryUrl = getCategoryUrl(activeCategoryId);
      if (window.location.pathname !== categoryUrl || window.location.search || window.location.hash) {
        window.history.pushState({ view: 'category', categoryId: activeCategoryId }, '', categoryUrl);
      }
    } else if (view === 'gallery') {
      const isProductPath = Boolean(extractProductIdFromPath(window.location.pathname));
      const isCategoryPath = Boolean(extractCategoryIdFromPath(window.location.pathname));
      if (isProductPath || isCategoryPath || window.location.pathname !== '/' || window.location.search || window.location.hash) {
        window.history.pushState({ view: 'gallery' }, '', '/');
      }
    } else if (view !== 'detail' && view !== 'home') {
      // Autres vues : On utilise le hash (ex: #gallery)
      // On nettoie les URLs dédiées si on sort du détail ou d'une catégorie.
      const isProductPath = Boolean(extractProductIdFromPath(window.location.pathname));
      const isCategoryPath = Boolean(extractCategoryIdFromPath(window.location.pathname));
      const targetPath = Object.entries(NEXT_VIEW_PATHS).find(([, mappedView]) => mappedView === view)?.[0];
      if (targetPath && window.location.pathname !== targetPath) {
        window.history.pushState({ view }, '', targetPath);
      } else if (isProductPath || isCategoryPath || window.location.search.includes('product=')) {
        const cleanUrl = `/#${view}`;
        window.history.pushState({ view }, '', cleanUrl);
      } else if (!targetPath) {
        window.location.hash = view;
      }
    } else if (view === 'home') {
      if (window.location.pathname !== ABOUT_PATH || window.location.search || window.location.hash) {
        window.history.pushState({ view: 'home' }, '', ABOUT_PATH);
      }
    }
  }, [view, selectedItemId, activeCategoryId, items]);

  // --- TRAITEMENT DEEP LINK ---
  useEffect(() => {
    if (!pendingDeepLink) return undefined;

    let cancelled = false;
    const targetItem = items.find(i => i.id === pendingDeepLink);

    if (targetItem) {
      if (!isFullCatalogItem(targetItem)) {
        ensureProductDetailItem(pendingDeepLink);
      }
      console.log("Deep link activated for:", targetItem.name);
      setSelectedItemId(pendingDeepLink);
      setView('detail');
      setPendingDeepLink(null);
      return undefined;
    }

    ensureProductDetailItem(pendingDeepLink).then((fullItem) => {
      if (cancelled) return;
      if (fullItem) {
        console.log("Deep link activated for:", fullItem.name);
        setSelectedItemId(pendingDeepLink);
        setView('detail');
      }
      setPendingDeepLink(null);
    });

    return () => {
      cancelled = true;
    };
  }, [items, pendingDeepLink, ensureProductDetailItem]);

  // --- WISHLIST SYNC ---
  useEffect(() => {
    if (user && !user.isAnonymous) {
      let cancelled = false;
      let unsubscribe = null;

      loadFirebaseRuntime()
        .then(async ({ getDb, loadFirestoreModule }) => {
          const [db, { collection, onSnapshot, query }] = await Promise.all([getDb(), loadFirestoreModule()]);
          if (cancelled) return;
          const q = query(collection(db, 'users', user.uid, 'wishlist'));
          unsubscribe = onSnapshot(q, (snap) => {
            setWishlistItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          });
        })
        .catch((error) => {
          if (!cancelled) console.error("Wishlist sync error:", error);
        });

      return () => {
        cancelled = true;
        unsubscribe?.();
      };
    } else {
      setWishlistItems([]);
    }
  }, [user]);

  // --- CART SYNC ---
  useEffect(() => {
    if (user && !user.isAnonymous) {
      console.log("Subscribing to cart for user:", user.uid);
      let cancelled = false;
      let unsubscribe = null;

      loadFirebaseRuntime()
        .then(async ({ getDb, loadFirestoreModule }) => {
          const [db, { collection, onSnapshot, query }] = await Promise.all([getDb(), loadFirestoreModule()]);
          if (cancelled) return;
          const q = query(collection(db, 'users', user.uid, 'cart'));
          unsubscribe = onSnapshot(q, (snap) => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCartItems(items);
          }, (err) => {
            console.error("Cart sync error:", err);
          });
        })
        .catch((error) => {
          if (!cancelled) console.error("Cart sync error:", error);
        });

      return () => {
        cancelled = true;
        unsubscribe?.();
      };
    } else {
      setCartItems([]);
    }
  }, [user]);

  // --- AUTO-ADD PENDING ITEM AFTER LOGIN ---
  useEffect(() => {
    if (user && !user.isAnonymous && pendingItem) {
      console.log("Adding pending item to cart after login:", pendingItem.name);
      addToCart(pendingItem);
      setPendingItem(null);
    }
  }, [user, pendingItem]);

  // --- ACTIONS ---
  // Admin actions moved to Router.jsx

  const handleSocialLogin = async () => {
    // For now we only support Google via context helper
    try {
      await loginWithGoogle();
      setShowFullLogin(false);
    } catch (e) {
      console.error(e);
      toast(getGoogleLoginErrorMessage(e), { type: 'error' });
    }
  };

  // --- CART ACTIONS ---
  const addToCart = async (item) => {
    // console.log("Add to cart clicked", user);
    if (!user || user.isAnonymous) {
      // console.log("User is not logged in or anonymous, showing login modal");
      setPendingItem(item); // Store for after login
      setShowFullLogin(true);
      return false;
    }

    // [NEW] Check Stock Limit
    const currentStock = item.stock !== undefined ? Number(item.stock) : 1;
    const inCartCount = cartItems.filter(c => c.originalId === item.id).length;

    if (inCartCount >= currentStock) {
      setStockAlert({ currentStock });
      return false;
    }

    const cartItemData = {
      originalId: item.id,
      collectionName: item.collectionName || 'furniture', // [NEW] Save collection
      name: item.name,
      price: item.currentPrice || item.startingPrice,
      image: item.images?.[0] || item.imageUrl,
      material: item.material || 'Bois',
      quantity: 1, // [FIX] Required by Firestore Rules
    };


    try {
      const { getDb, loadFirestoreModule } = await loadFirebaseRuntime();
      const [db, { addDoc, collection, serverTimestamp }] = await Promise.all([
        getDb(),
        loadFirestoreModule(),
      ]);
      cartItemData.addedAt = serverTimestamp();
      await addDoc(collection(db, 'users', user.uid, 'cart'), cartItemData);
      emitAnalyticsEvent('cart_add', item.id, item.name, {
        price: cartItemData.price,
        source: view,
        categoryId: activeCategoryId || null
      });
      openCart();
      return true;
    } catch (e) {
      console.error("Error add cart", e);
      toast("Erreur ajout panier : " + e.message, { type: 'error' });
      return false;
    }
  };

  const removeFromCart = async (cartDocId) => {
    if (!user) return;
    const removedItem = cartItems.find(item => item.id === cartDocId);
    const { getDb, loadFirestoreModule } = await loadFirebaseRuntime();
    const [db, { deleteDoc, doc }] = await Promise.all([getDb(), loadFirestoreModule()]);
    await deleteDoc(doc(db, 'users', user.uid, 'cart', cartDocId));
    if (removedItem) {
      emitAnalyticsEvent('cart_remove', removedItem.originalId || removedItem.id, removedItem.name, {
        price: removedItem.price || 0,
        source: view
      });
    }
  };

  // --- WISHLIST ACTIONS ---
  const toggleWishlist = async (item) => {
    if (!user || user.isAnonymous) {
      setShowFullLogin(true);
      return;
    }
    const isLiked = wishlistItems.some(w => w.originalId === item.id);
    const { getDb, loadFirestoreModule } = await loadFirebaseRuntime();
    const [db, { deleteDoc, doc, serverTimestamp, setDoc }] = await Promise.all([
      getDb(),
      loadFirestoreModule(),
    ]);
    const docRef = doc(db, 'users', user.uid, 'wishlist', item.id);
    try {
      if (isLiked) {
        await deleteDoc(docRef);
        emitAnalyticsEvent('favorite_remove', item.id, item.name, {
          price: item.currentPrice || item.startingPrice || item.price || 0,
          source: view,
          categoryId: activeCategoryId || null
        });
      } else {
        await setDoc(docRef, {
          originalId: item.id,
          name: item.name,
          price: item.currentPrice || item.startingPrice || item.price || 0,
          image: item.images?.[0] || item.imageUrl || '',
          material: item.material || 'Bois',
          addedAt: serverTimestamp()
        });
        emitAnalyticsEvent('favorite_add', item.id, item.name, {
          price: item.currentPrice || item.startingPrice || item.price || 0,
          source: view,
          categoryId: activeCategoryId || null
        });
      }
    } catch (e) {
      console.error('Wishlist error:', e);
      toast('Erreur wishlist : ' + e.message, { type: 'error' });
    }
  };

  const clearWishlist = async () => {
    if (!user) return;
    const { getDb, loadFirestoreModule } = await loadFirebaseRuntime();
    const [db, { doc, writeBatch }] = await Promise.all([getDb(), loadFirestoreModule()]);
    const batch = writeBatch(db);
    for (const w of wishlistItems) {
      batch.delete(doc(db, 'users', user.uid, 'wishlist', w.id));
    }
    await batch.commit();
  };

  const handlePlaceOrder = async (orderData) => {
    if (!user) return;

    // 1. Create Order - REMOVED (Handled by Cloud Function createOrder)
    // The order is securely created server-side to manage stock transactions.
    // We just need to clear the local cart now.

    // 2. Clear Cart (Batch — atomique, un seul appel réseau)
    const { getDb, loadFirestoreModule } = await loadFirebaseRuntime();
    const [db, { doc, writeBatch }] = await Promise.all([getDb(), loadFirestoreModule()]);
    const cartBatch = writeBatch(db);
    for (const item of cartItems) {
      cartBatch.delete(doc(db, 'users', user.uid, 'cart', item.id));
    }
    await cartBatch.commit();

    // 3. Handle Payment Redirect or Success
    setCartItems([]); // Clear UI cart immediately
    setIsCartOpen(false);
    setOrderSuccessMethod(orderData.paymentMethod || 'deferred');
    setShowOrderSuccess(true); // Trigger Success Modal

    // Restore gallery state if we have it
    if (persistentGalleryState) {
      setHeaderProps(prev => ({
        ...prev,
        activeCollection: persistentGalleryState.activeCollection,
        filter: persistentGalleryState.filter
      }));
    }

    setView('gallery'); // Go to Marketplace (behind the modal)

    // Email simulation log
    console.log("Order placed restoration:", persistentGalleryState, orderData);
  };

  if (loading) {
    if (shouldPlayInitialGalleryEntryRef.current) {
      return <div className="min-h-screen bg-[#0F0F11]" />;
    }
    return <div className="min-h-screen flex items-center justify-center bg-transparent"><div className="w-10 h-10 border-[3px] border-stone-200 border-t-stone-900 rounded-full animate-spin"></div></div>;
  }

  // Cart Total
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);

  // Analytics nav context : récupéré depuis l'item sélectionné + filtre galerie persistant.
  const selectedItem = selectedItemId ? items.find(i => i.id === selectedItemId) : null;
  const activeCategoryMeta = activeCategoryId
    ? [...(KIT_CONFIG.categoryGroups || []), ...(KIT_CONFIG.productCategories || [])].find(category => category.id === activeCategoryId)
    : null;
  const isAdminPerformanceStudyView = view === 'admin' && adminCollection === 'performance_study';
  const pageSeo = (() => {
    if (view === 'category' && activeCategoryId) {
      const categoryLabel = activeCategoryMeta?.label || activeCategoryId;
      return {
        title: `${categoryLabel} - Mobilier restauré`,
        description: `Sélection de mobilier restauré et de pièces uniques dans la catégorie ${categoryLabel}.`,
        url: getCategoryUrl(activeCategoryId)
      };
    }

    if (view === 'gallery') {
      return {
        title: 'La Galerie',
        description: KIT_CONFIG.seo.galleryDescription,
        url: '/'
      };
    }

    return {};
  })();
  const analyticsNav = {
    view,
    activeCategoryId,
    galleryFilter: persistentGalleryState?.filter,
    selectedItemId,
    selectedItemName: selectedItem?.title || selectedItem?.name || null,
    selectedItemPrice: selectedItem?.currentPrice || selectedItem?.price || null,
    urlParams: typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null,
  };
  const footerContactInfo = contactInfo && Object.keys(contactInfo).length > 0 ? contactInfo : null;

  return (
    <DeferredAnalyticsProvider {...analyticsNav}>
    <div className={`min-h-screen font-sans selection:bg-stone-300 ${darkMode ? 'bg-[#0A0A0A] text-stone-200' : 'bg-[#FAFAF9] text-stone-900'}`}>
      {view !== 'detail' && !isAdminPerformanceStudyView && <SEO {...pageSeo} />}

      {/* RIDEAU DE TRANSITION GLOBAL (Masque le switch de page) */}
      {/* RIDEAU DE TRANSITION GLOBAL (Masque le switch de page) */}
      {isTransitioning && (
          <div
            className={`gallery-entry-curtain fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#0F0F11] pointer-events-auto lg:pointer-events-none shadow-[0_0_50px_rgba(0,0,0,0.5)] ${isInitialGalleryEntry ? '' : 'gallery-entry-curtain--slide-up'}`}
          >
            {/* PANNEAUX LATERAUX (Volets coulissants) */}
            <div
              className="gallery-entry-panel gallery-entry-panel--left absolute inset-y-0 left-0 w-1/2 bg-[#0F0F11]"
            >
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.32)_1px,transparent_0)] [background-size:14px_14px]" />
            </div>

            <div
              className="gallery-entry-panel gallery-entry-panel--right absolute inset-y-0 right-0 w-1/2 bg-[#0F0F11]"
            >
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.32)_1px,transparent_0)] [background-size:14px_14px]" />
            </div>
            
            {/* Arc Ligne architecturale */}
            <div
              className="gallery-entry-line absolute bottom-0 left-1/2 top-0 z-10 w-[1px] origin-top bg-white/10"
            />
            {/* Typography */}
            <div className="relative z-20 flex flex-col items-center justify-center">
              <div className="overflow-hidden mb-6 md:mb-10">
                <span
                  className="gallery-entry-kicker block text-[12px] md:text-[16px] font-bold uppercase tracking-[0.6em] text-white/50 shadow-sm"
                >
                  Entree dans la
                </span>
              </div>
              <div className="overflow-hidden flex">
                {"Galerie".split("").map((char, index) => (
                  <h2
                    key={index}
                    className="gallery-entry-letter text-[#F9F6F0] font-serif text-5xl md:text-8xl tracking-[0.2em] text-center"
                    style={{ animationDelay: `${1.2 + index * 0.05}s` }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </h2>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* COMPOSANT PANIER - Global (Disponible dès que la navbar est visible) */}
      {(cartInteracted || isCartOpen) && (
        <Suspense fallback={null}>
          <CartSidebar
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cartItems}
            onRemoveItem={removeFromCart}
            totalPrice={cartTotal}
            onCheckout={() => { setIsCartOpen(false); setView('checkout'); window.scrollTo(0, 0); }}
            interacted={cartInteracted}
            darkMode={darkMode}
            activeDesignId={activeDesignId}
          />
        </Suspense>
      )}

      {/* MODAL LOGIN (Pour la Marketplace) */}
      {showFullLogin && (
        <div
          className="fixed inset-0 z-[3000] bg-[#0F0F11] md:bg-stone-900/80 md:backdrop-blur-xl flex items-center justify-center md:p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setShowFullLogin(false); }}
        >
          {/* Close button */}
          <button onClick={() => setShowFullLogin(false)} className="absolute top-4 right-4 md:top-8 md:right-8 w-10 h-10 flex items-center justify-center text-stone-500 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all z-[3010]">
             <X size={20} />
          </button>

          <div className="w-full h-[100dvh] md:h-auto md:max-h-[85vh] md:max-w-5xl md:rounded-[2rem] shadow-2xl flex overflow-hidden relative animate-in zoom-in-95 bg-[#0F0F11]">
            
            {/* LEFT: Video PC */}
            <div className="hidden md:block w-1/2 relative bg-black">
               <video src="/video/login-bg.mp4" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0F0F11]"></div>
            </div>

            {/* RIGHT / MOBILE FULL: Formulaire */}
            <div className="w-full md:w-1/2 safe-pt-auth safe-pb-auth px-6 md:px-14 flex flex-col justify-center overflow-y-auto text-white">

            {showAuthSuccess ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 text-center">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20 shadow-sm">
                  <ShieldCheck size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold tracking-tight text-white">Vérifiez vos emails !</h3>
                  <p className="text-sm text-stone-400 font-medium px-2 leading-relaxed">
                    Un lien de confirmation vient d'être envoyé. <br />
                    <span className="text-white font-bold">Pensez à regarder dans vos spams.</span>
                  </p>
                </div>
                <button onClick={() => { setShowFullLogin(false); setShowAuthSuccess(false); }} className="w-full py-4 mt-4 bg-[#24242B] text-white rounded-xl font-bold tracking-wide hover:bg-[#2F2F37] transition-all">
                  C'est compris
                </button>
              </div>
            ) : (
              <>
                {/* HEADER */}
                <div className="text-center md:text-left space-y-2 mb-10">
                  <h3 id="form-title" className="text-2xl md:text-3xl font-bold tracking-tight text-white">Bienvenue sur Seconde Vie</h3>
                  <p className="text-sm text-stone-500 font-medium hidden md:block">Identifiez-vous pour accéder à la vente.</p>
                </div>

                {/* FORMULAIRE EMAIL */}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const email = e.target.email.value;
                  const pass = e.target.password.value;
                  const confirmPass = e.target.confirmPassword?.value;
                  const isSignUp = e.target.getAttribute('data-signup') === 'true';

                  try {
                    if (isSignUp) {
                      if (pass !== confirmPass) throw new Error("Les mots de passe ne correspondent pas.");
                      const userCredential = await signupWithEmail(email, pass);
                      await verifyEmail(userCredential.user);
                      setShowAuthSuccess(true);
                    } else {
                      await loginWithEmail(email, pass);
                      setShowFullLogin(false);
                    }
                  } catch (err) {
                    let msg = "Une erreur est survenue.";
                    if (err.code === 'auth/email-already-in-use') msg = "Cet email est déjà associé à un compte. Connectez-vous.";
                    else if (err.code === 'auth/weak-password') msg = "Le mot de passe doit contenir au moins 6 caractères.";
                    else if (err.code === 'auth/invalid-email') msg = "L'adresse email n'est pas valide.";
                    else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = "Email ou mot de passe incorrect.";

                    toast(msg, { type: 'error' });
                  }
                }} className="space-y-4" data-signup="false">

                  <div className="space-y-1 text-left">
                    <input name="email" type="email" placeholder="Adresse email" className="w-full p-4 rounded-xl bg-[#141417] border border-[#2A2A2E] text-sm outline-none focus:border-[#4f4f56] transition-all text-white placeholder:text-stone-500" required autoComplete="email" />
                  </div>

                  <div className="relative space-y-1 text-left">
                    <input name="password" type={showPassword ? "text" : "password"} placeholder="Mot de passe" className="w-full p-4 rounded-xl bg-[#141417] border border-[#2A2A2E] text-sm outline-none focus:border-[#4f4f56] transition-all text-white placeholder:text-stone-500" required autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div id="confirm-pass-container" className="hidden transition-all duration-300 overflow-hidden" style={{ maxHeight: '0px' }}>
                    <div className="relative text-left">
                      <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirmer mot de passe" className="w-full p-4 rounded-xl bg-[#141417] border border-[#2A2A2E] text-sm outline-none focus:border-[#4f4f56] transition-all text-white placeholder:text-stone-500" autoComplete="new-password" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300">
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="w-full py-4 mt-2 bg-[#24242B] text-white rounded-xl font-bold text-sm hover:bg-[#2F2F37] transition-all">
                    <span id="btn-text">Se connecter</span>
                  </button>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-stone-400">
                      <span id="toggle-text">Pas de compte ?</span>{' '}
                      <button type="button" onClick={() => {
                        const form = document.querySelector('form');
                        const container = document.getElementById('confirm-pass-container');
                        const title = document.getElementById('form-title');
                        const isSignUp = form.getAttribute('data-signup') === 'true';

                        form.setAttribute('data-signup', !isSignUp);

                        if (!isSignUp) { // Opening
                          container.classList.remove('hidden');
                          void container.offsetWidth;
                          container.style.maxHeight = '80px';
                          document.querySelector('input[name="confirmPassword"]').required = true;
                          title.innerText = "Créer un compte";
                          setTimeout(() => { container.style.overflow = 'visible'; }, 300);
                        } else { // Closing
                          container.style.overflow = 'hidden';
                          container.style.maxHeight = '0px';
                          setTimeout(() => container.classList.add('hidden'), 300);
                          document.querySelector('input[name="confirmPassword"]').required = false;
                          title.innerText = "Bienvenue sur Seconde Vie";
                        }

                        document.getElementById('btn-text').innerText = !isSignUp ? "S'inscrire" : "Se connecter";
                        document.getElementById('btn-toggle-link').innerText = !isSignUp ? "Se connecter" : "Créer un compte";
                        document.getElementById('toggle-text').innerText = !isSignUp ? "Déjà un compte ?" : "Pas de compte ?";
                      }} id="btn-toggle-link" className="text-[#A58BFF] hover:text-white transition-colors font-medium">Créer un compte</button>
                    </span>
                    <button type="button" className="text-[#A58BFF] hover:text-white transition-colors font-medium">Mot de passe oublié ?</button>
                  </div>
                </form>

                {/* DIVIDER */}
                <div className="flex items-center gap-4 my-8">
                  <div className="h-px bg-[#2A2A2E] flex-1"></div>
                  <span className="text-[10px] font-bold uppercase text-stone-600">OU</span>
                  <div className="h-px bg-[#2A2A2E] flex-1"></div>
                </div>

                {/* GOOGLE */}
                <button onClick={handleSocialLogin} className="w-full flex items-center justify-center gap-3 bg-[#141417] border border-[#2A2A2E] text-white p-4 rounded-xl font-bold text-sm hover:bg-[#1f1f22] transition-all">
                  <div className="bg-white rounded-full p-0.5 flex-shrink-0"><img src="https://www.google.com/favicon.ico" className="w-[14px] h-[14px]" alt="G" /></div>
                  <span>Continuer avec Google</span>
                </button>

                {/* FOOTER ACTIONS */}
                <div className="mt-8 text-center text-[11px] text-stone-500 leading-relaxed">
                  Votre connexion implique l'acceptation des <button className="text-stone-400 font-bold hover:text-white">Conditions</button> et de la <button className="text-stone-400 font-bold hover:text-white">Politique de confidentialité</button>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      )}

      {/* --- NAVBAR & MENU GLOBAUX (NE S'AFFICHENT PAS SUR LA PAGE D'ACCUEIL) --- */}
      {/* --- MENU GLOBAL (Toujours disponible sauf Home) --- */}
      {view !== 'home' && !isAdminPerformanceStudyView && (isMenuOpen || isMenuClosing || isMenuHeaderActive || shouldKeepGlobalMenuMounted) && (
        <Suspense fallback={null}>
          <GlobalMenu
            isMenuOpen={isMenuOpen}
            isMenuClosing={isMenuClosing}
            keepMounted={shouldKeepGlobalMenuMounted}
            setIsMenuOpen={setGlobalMenuOpen}
            setView={setView}
            currentView={view}
            user={user}
            isAdmin={isAdmin}
            darkMode={darkMode}
            activeDesignId={activeDesignId}
            contactInfo={footerContactInfo}
            onNavigateCategory={(catId) => { setSelectedItemId(null); setActiveCategoryId(catId); setView('category'); closeGlobalMenu(); window.scrollTo(0, 0); }}
            onShowLogin={() => { closeGlobalMenu(); setShowFullLogin(true); }}
            onOpenCart={openCart}
            cartCount={cartItems.length}
            onOpenWishlist={() => setView('wishlist')}
            wishlistCount={wishlistItems.length}
            toggleTheme={() => setDarkMode(!darkMode)}
            onLogout={logout}
          />
        </Suspense>
      )}

      {/* --- NAVBAR GLOBALE --- */}
      {view !== 'home' && !isAdminPerformanceStudyView && (
        <>
          {view === 'gallery' && (
            <AnnouncementBanner
              darkMode={darkMode}
              isMenuOpen={isMenuOpen}
              isCollapsedOnMobile={isMobileAnnouncementCollapsed}
            />
          )}
          {activeDesignId === 'architectural' ? (
            <ArchitecturalHeader
              headerProps={headerProps}
              currentView={view}
              user={user}
              onShowLogin={() => setShowFullLogin(true)}
              onOpenMenu={() => (isMenuOpen && !isMenuClosing ? closeGlobalMenu() : openGlobalMenu())}
              onPrepareMenu={prepareGlobalMenu}
              isMenuOpen={isMenuOpen}
              isMenuClosing={isMenuClosing}
              isMenuHeaderActive={isMenuHeaderActive}
              onOpenCart={openCart}
              cartCount={cartItems.length}
              wishlistCount={wishlistItems.length}
              onOpenWishlist={() => setView('wishlist')}
              toggleTheme={() => setDarkMode(!darkMode)}
              darkMode={darkMode}
              showSearch={view === 'gallery' || view === 'wishlist' || view === 'category' || view === 'detail' || view === 'devis'}
              onGoHome={() => { setSelectedItemId(null); setActiveCategoryId(null); setView('gallery'); window.scrollTo(0, 0); }}
              onOpenDiscovery={openMarketplaceDiscovery}
              setHeaderProps={setHeaderProps}
              persistentGalleryState={persistentGalleryState}
              saveGalleryState={saveGalleryState}
              activeCategoryId={activeCategoryId}
              onNavigateCategory={(catId) => { setSelectedItemId(null); setActiveCategoryId(catId); setView('category'); window.scrollTo(0, 0); }}
            />
          ) : null}
        </>
      )
      }

      {/* --- CONTENU PRINCIPAL --- */}
      <main>
        <AppRouter
          view={view}
          setView={setView}
          items={items}
          isPreparingGallery={isPreparingGallery}
          startGalleryTransition={startGalleryTransition}
          completeGalleryTransition={completeGalleryTransition}
          darkMode={darkMode}
          activeDesignId={activeDesignId}
          isSecretGateOpen={isSecretGateOpen}
          setShowFullLogin={setShowFullLogin}
          setSelectedItemId={setSelectedItemId}
          selectedItemId={selectedItemId}
          addToCart={addToCart}
          cartItems={cartItems}
          cartTotal={cartTotal}
          wishlistItems={wishlistItems}
          toggleWishlist={toggleWishlist}
          clearWishlist={clearWishlist}
          handlePlaceOrder={handlePlaceOrder}
          showOrderSuccess={showOrderSuccess}
          setShowOrderSuccess={setShowOrderSuccess}
          orderSuccessMethod={orderSuccessMethod}
          adminCollection={adminCollection}
          setAdminCollection={setAdminCollection}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          onOpenMenu={openGlobalMenu}
          onOpenCart={openCart}
          toggleTheme={() => setDarkMode(!darkMode)}
          onOpenDiscovery={openMarketplaceDiscovery}
          setHeaderProps={setHeaderProps}
          persistentGalleryState={persistentGalleryState}
          saveGalleryState={saveGalleryState}
          activeCategoryId={activeCategoryId}
          onOpenAbout={() => { setSelectedItemId(null); setActiveCategoryId(null); setView('home'); window.scrollTo(0, 0); }}
          onNavigateCategory={(catId) => { setSelectedItemId(null); setActiveCategoryId(catId); setView('category'); window.scrollTo(0, 0); }}
          onGalleryScrollStateChange={setIsMobileAnnouncementCollapsed}
          isCatalogComplete={isCatalogComplete}
          isLoadingFullCatalog={isLoadingFullCatalog}
          onLoadFullCatalog={requestFullCatalog}
          onLoadCategoryCatalog={requestCategoryCatalog}
          onEnsureProductDetail={ensureProductDetailItem}
          galleryFooter={(
            <div
              ref={setDeferredFooterSentinel}
              data-deferred-footer-sentinel="gallery"
              className="min-h-px"
            >
              {shouldRenderDeferredFooter ? (
                <Suspense fallback={<FooterLoadingPlaceholder darkMode={darkMode} />}>
                  <Footer darkMode={darkMode} contactInfo={footerContactInfo} />
                </Suspense>
              ) : (
                <FooterLoadingPlaceholder darkMode={darkMode} />
              )}
            </div>
          )}
        />
      </main>
      {
        ['home', 'detail', 'checkout', 'my-orders', 'category', 'devis'].includes(view) && (
          <div 
            ref={footerRef} 
            className="transition-all duration-700"
          >
            <div
              ref={setDeferredFooterSentinel}
              data-deferred-footer-sentinel={view}
              className="min-h-px"
            />
            {shouldRenderDeferredFooter ? (
              <>
                {/* A propos (home) : footer TOUJOURS dark pour fusionner avec ContactCTASection (bg-[#111]) et rester dissociee du toggle dark/light de la galerie. */}
                <Suspense fallback={<FooterLoadingPlaceholder darkMode={view === 'home' ? true : darkMode} />}>
                  <Footer darkMode={view === 'home' ? true : darkMode} contactInfo={footerContactInfo} />
                </Suspense>
              </>
            ) : shouldReserveDeferredFooter ? (
              <FooterLoadingPlaceholder darkMode={view === 'home' ? true : darkMode} />
            ) : null}
          </div>
        )
      }

      {/* Global Popups */}
      {showMarketplacePopup && (
        <Suspense fallback={null}>
          <MarketplaceDiscovery
            isOpen={showMarketplacePopup}
            onClose={() => setShowMarketplacePopup(false)}
            onExplore={() => {
              setShowMarketplacePopup(false);
              startGalleryTransition();
              setTimeout(() => {
                completeGalleryTransition();
              }, 800);
            }}
          />
        </Suspense>
      )}

      {/* MODAL STOCK INSUFFISANT (Premium UI) */}
      {stockAlert && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 md:p-6 bg-stone-900/40 backdrop-blur-md">
            <div
              className={`stock-alert-card max-w-md w-full p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-center space-y-8 relative overflow-hidden ${darkMode ? 'bg-stone-800' : 'bg-white'}`}
            >
              <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center text-amber-500 mx-auto border border-amber-500/20 shadow-inner">
                <AlertTriangle size={40} className="animate-pulse" />
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl md:text-4xl font-black tracking-tighter">Stock insuffisant</h3>
                <div className="w-12 h-1 bg-amber-500 mx-auto rounded-full opacity-30"></div>
                <p className={`text-base md:text-lg font-medium leading-relaxed px-4 ${darkMode ? 'text-stone-300' : 'text-stone-500'}`}>
                  Il ne reste que <strong className={darkMode ? 'text-amber-400' : 'text-stone-900'}>{stockAlert.currentStock} exemplaire(s)</strong> disponible(s) pour cette pièce unique.
                </p>
              </div>

              <button
                onClick={() => setStockAlert(null)}
                className="w-full py-5 bg-stone-950 text-white dark:bg-white dark:text-stone-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 group"
              >
                <span>J'ai compris</span>
              </button>
            </div>
          </div>
        )}
    </div >
    </DeferredAnalyticsProvider>
  );
};
// Wrapper to provide Context
export default function App() {
  useEffect(() => {
    const scrollYBeforeClientSwap = window.scrollY;
    document.documentElement.dataset.svClientHydrated = 'true';
    const productPreviewRemovalTimer = window.setTimeout(() => {
      document.querySelectorAll('[data-product-ssr-preview]').forEach((node) => node.remove());
    }, 4200);
    if (scrollYBeforeClientSwap > 0) {
      window.scrollTo(0, scrollYBeforeClientSwap);
      window.requestAnimationFrame(() => {
        window.scrollTo(0, scrollYBeforeClientSwap);
        window.requestAnimationFrame(() => window.scrollTo(0, scrollYBeforeClientSwap));
      });
    }
    return () => {
      window.clearTimeout(productPreviewRemovalTimer);
      delete document.documentElement.dataset.svClientHydrated;
    };
  }, []);

  return (
    <AuthProvider>
      <ErrorBoundary>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ErrorBoundary>
    </AuthProvider>
  );
}
