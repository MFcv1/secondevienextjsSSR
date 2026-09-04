'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  Activity,
  BarChart3,
  ChevronLeft,
  CreditCard,
  Grid,
  Layout,
  LayoutPanelTop,
  Link2,
  Mail,
  Menu,
  Palette,
  RefreshCw,
  RotateCcw,
  Share2,
  ShieldCheck,
  CircleUserRound,
  ClipboardList,
  Users,
  Package,
  ReceiptText,
  TicketPercent,
  TriangleAlert,
} from 'lucide-react';
import {
  adjustInventoryAdmin,
  deleteProductAdmin,
  publishProductAdmin,
} from '../../src/kit/commerce/adminProductCommandClient';
import { useAuth } from '../../src/kit/contexts/AuthContext';
import KIT_CONFIG from '../../src/kit/config/constants';
import {
  ADMIN_STEP_UP_REQUIRED_EVENT,
  getCallableFunction,
} from '../../src/kit/config/firebaseLazy';
import {
  clearAdminDataCache,
  invalidateAdminCachedData,
} from '../../src/kit/admin/adminDataCache';
import { db } from '../../src/kit/config/firebase';
import {
  ADMIN_PUBLIC_CATALOG_INVALIDATED_EVENT,
  clearAdminPublicCatalogCache,
  loadAdminPublicCatalog,
} from '../../src/kit/admin/adminPublicCatalog';
import AdminSidebar from './AdminSidebar';
import { dataPerformance, startDataPerformance } from '../../src/kit/admin/adminAnalyticsPerformance';
import { ANALYTICS_REALTIME_ENABLED, analyticsChannel } from '../../src/kit/admin/adminAnalyticsRealtime';
import { liveSessionsChannel } from '../../src/kit/admin/liveSessionsChannel';

const loadAdminDashboard = () => import('../../src/kit/admin/AdminDashboard');
const loadAdminOrders = () => import('../../src/kit/admin/AdminOrders');
const loadAdminReturns = () => import('../../src/kit/admin/AdminReturns');
const loadAdminInvoices = () => import('../../src/kit/admin/AdminInvoices');
const loadAdminLivraison = () => import('../../src/kit/admin/AdminLivraison');
const loadAdminQuotes = () => import('../../src/kit/admin/AdminQuotes');
const loadAdminAnalytics = () => dataPerformance.span('chunk', () => import('../../src/kit/admin/AdminAnalytics'));
const loadAdminIncidentConsole = () => import('../../src/kit/admin/AdminIncidentConsole');

const AdminDashboard = React.lazy(loadAdminDashboard);
const AdminHomepage = React.lazy(() => import('../../src/kit/admin/AdminHomepage'));
const AdminOrders = React.lazy(loadAdminOrders);
const AdminInvoices = React.lazy(loadAdminInvoices);
const AdminReturns = React.lazy(loadAdminReturns);
const AdminPromotionCodes = React.lazy(() => import('../../src/kit/admin/AdminPromotionCodes'));
const AdminLivraison = React.lazy(loadAdminLivraison);
const AdminQuotes = React.lazy(loadAdminQuotes);
const AdminStudio = React.lazy(() => import('../../src/kit/admin/AdminStudio'));
const AdminPublicationWorkspace = React.lazy(() => import('../../src/kit/admin/AdminPublicationWorkspace'));
const AdminUsers = React.lazy(() => import('../../src/kit/admin/AdminUsers'));
const AdminNewsletter = React.lazy(() => import('../../src/kit/admin/AdminNewsletter'));
const AdminAnalytics = React.lazy(loadAdminAnalytics);
const AdminIncidentConsole = React.lazy(loadAdminIncidentConsole);
const AdminFunctionPerformance = React.lazy(() => import('../../src/kit/admin/AdminFunctionPerformance'));
const AdminSEO = React.lazy(() => import('../../src/kit/admin/AdminSEO'));
const AdminPaymentSettings = React.lazy(() => import('../../src/kit/admin/AdminPaymentSettings'));
const AdminPaymentLinks = React.lazy(() => import('../../src/kit/admin/AdminPaymentLinks'));
const AdminGlobalInventory = React.lazy(() => import('../../src/kit/admin/GlobalInventoryView'));
const AdminAccount = React.lazy(() => import('../../src/kit/admin/AdminAccount'));
const BillingOnboardingGuide = React.lazy(() => import('../../src/kit/admin/BillingOnboardingGuide'));
const LegacyLoginModalIsland = React.lazy(() => import('../../src/kit/marketplace/LegacyLoginModalFullIsland'));

const TAB_ICONS = {
  dashboard: Activity,
  analytics: BarChart3,
  incidents: TriangleAlert,
  performance: Activity,
  studio: Palette,
  homepage: Palette,
  orders: Package,
  returns: RotateCcw,
  promotions: TicketPercent,
  users: Users,
  seo: Share2,
  newsletter: Mail,
  payment_settings: CreditCard,
  payment_links: Link2,
  invoices: ReceiptText,
  quotes: ClipboardList,
  account: CircleUserRound,
  inventory: Grid,
  maintenance: RefreshCw,
};

const COLLECTION_ICONS = [Layout, LayoutPanelTop];

const adminTabs = KIT_CONFIG.adminTabs.map((tab, index) => ({
  ...tab,
  icon: TAB_ICONS[tab.id] ?? COLLECTION_ICONS[index % COLLECTION_ICONS.length],
}));

const ADMIN_PUBLIC_CATALOG_TABS = new Set(['analytics', 'inventory', 'payment_links', 'promotions']);
const readAdminOrderTarget = () => {
  if (typeof window === 'undefined') return null;
  const orderId = new URLSearchParams(window.location.search).get('order_id');
  return orderId && /^[A-Za-z0-9_-]{8,128}$/.test(orderId) ? orderId : null;
};

function AdminCatalogStatus({ darkMode, error, loading, onRetry }) {
  if (!loading && !error) return null;

  return (
    <div
      aria-live="polite"
      className={`mb-4 flex min-h-11 items-center justify-between gap-4 rounded-2xl border px-4 py-2.5 text-[10px] font-bold ${darkMode ? 'border-white/10 bg-white/[0.035] text-stone-400' : 'border-stone-200 bg-white text-stone-500'}`}
    >
      <span className="flex items-center gap-2.5">
        <RefreshCw size={13} strokeWidth={1.6} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Preparation des visuels du catalogue...' : 'Les visuels du catalogue ne sont pas disponibles.'}
      </span>
      {error && (
        <button
          type="button"
          onClick={onRetry}
          className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] ${darkMode ? 'border-white/15 text-white' : 'border-stone-300 text-stone-800'}`}
        >
          Reessayer
        </button>
      )}
    </div>
  );
}

const ADMIN_NAV_GROUPS = [
  { label: "Vue d'ensemble", tabs: ['dashboard', 'analytics'] },
  { label: 'Catalogue', tabs: ['furniture', 'inventory', 'studio'] },
  { label: 'Ventes', tabs: ['orders', 'quotes', 'payment_links', 'invoices', 'returns', 'promotions', 'livraison', 'payment_settings'] },
  { label: 'Communication', tabs: ['homepage', 'newsletter', 'seo'] },
  { label: 'Administration', tabs: ['account', 'users', 'performance', 'incidents'] },
];

/** Onglets qui pilotent leur propre hauteur : liste et detail scrollent separement. */
const IMMERSIVE_TABS = new Set(['furniture', 'orders']);
function AdminContent() {
  const { user, isAdmin, isSuperAdmin, hasStrongAuth, loading } = useAuth();
  const router = useRouter();
  const [focusedOrderId, setFocusedOrderId] = useState(null);
  const [adminCollection, setAdminCollection] = useState('dashboard');
  const [editingItem, setEditingItem] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [deploymentStale, setDeploymentStale] = useState(false);
  const [deploymentVerified, setDeploymentVerified] = useState(false);
  const [catalogState, setCatalogState] = useState({ items: [], status: 'idle', error: null });
  const [billingGate, setBillingGate] = useState({ status: 'idle', data: null, error: null });
  const [incidentSummary, setIncidentSummary] = useState(null);
  const [actionSummary, setActionSummary] = useState(null);
  const [systemIncidentState, setSystemIncidentState] = useState({ status: 'idle', data: null });
  const [systemIncidentSeenRevision, setSystemIncidentSeenRevision] = useState(0);
  const catalogStatusRef = React.useRef('idle');
  const catalogRequestRef = React.useRef(null);
  const deletedProductIdsRef = React.useRef(new Set());
  const cachedAdminUidRef = React.useRef(null);
  const strongAuthReadyAtRef = React.useRef(null);
  const backOfficeReadyAtRef = React.useRef(null);

  const shouldRedirectToGallery = !loading && (
    !user
    || user.isAnonymous
    || !isAdmin
  );

  React.useEffect(() => {
    if (shouldRedirectToGallery) router.replace('/');
  }, [router, shouldRedirectToGallery]);

  React.useEffect(() => {
    let cancelled = false;
    const checkDeployment = async () => {
      try {
        const currentId = document.documentElement.getAttribute('data-dpl-id');
        if (!currentId) {
          if (!cancelled) setDeploymentVerified(true);
          return;
        }
        const response = await fetch(`/admin?deployment_probe=${Date.now()}`, {
          cache: 'no-store',
          headers: { accept: 'text/html' },
        });
        if (!response.ok || cancelled) return;
        const html = await response.text();
        const servedId = html.match(/<html[^>]*data-dpl-id=["']([^"']+)["']/i)?.[1];
        if (servedId && servedId !== currentId && !cancelled) setDeploymentStale(true);
      } catch {
        // Un controle reseau impossible ne bloque pas le travail administrateur courant.
      } finally {
        if (!cancelled) setDeploymentVerified(true);
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void checkDeployment();
    };
    void checkDeployment();
    window.addEventListener('focus', checkDeployment);
    window.addEventListener('pageshow', checkDeployment);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', checkDeployment);
      window.removeEventListener('pageshow', checkDeployment);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  React.useEffect(() => {
    const orderId = readAdminOrderTarget();
    if (!orderId) return;
    setFocusedOrderId(orderId);
    setAdminCollection('orders');
  }, []);

  React.useEffect(() => {
    const nextUid = user?.uid || null;
    if (!nextUid) {
      if (cachedAdminUidRef.current) clearAdminDataCache();
      dataPerformance.clear();
      cachedAdminUidRef.current = null;
      return;
    }
    if (cachedAdminUidRef.current && cachedAdminUidRef.current !== nextUid) {
      clearAdminDataCache();
      dataPerformance.clear();
    }
    cachedAdminUidRef.current = nextUid;
  }, [user]);

  const refreshBillingGate = React.useCallback(async () => {
    if (!user || !isAdmin || !hasStrongAuth || isSuperAdmin) return null;
    setBillingGate((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const getBillingStatus = await getCallableFunction('getBillingGuideStatus');
      const result = await getBillingStatus({});
      setBillingGate({ status: 'ready', data: result.data, error: null });
      return result.data;
    } catch (error) {
      setBillingGate({ status: 'error', data: null, error });
      throw error;
    }
  }, [hasStrongAuth, isAdmin, isSuperAdmin, user]);

  React.useEffect(() => {
    if (isSuperAdmin) {
      setBillingGate({ status: 'ready', data: { required: false, bypass: true }, error: null });
      return;
    }
    if (user && isAdmin && hasStrongAuth) {
      void refreshBillingGate().catch(() => {});
    }
  }, [hasStrongAuth, isAdmin, isSuperAdmin, refreshBillingGate, user]);

  const backOfficeReady = isSuperAdmin || (billingGate.status === 'ready' && billingGate.data?.required !== true);
  React.useEffect(() => {
    const owner = ANALYTICS_REALTIME_ENABLED && isAdmin && hasStrongAuth && backOfficeReady ? user?.uid : null;
    analyticsChannel.setOwner(owner || null);
    liveSessionsChannel.setOwner(owner || null);
    return () => { analyticsChannel.clear(); liveSessionsChannel.clear(); };
  }, [backOfficeReady, hasStrongAuth, isAdmin, user?.uid]);
  React.useEffect(() => {
    if (ANALYTICS_REALTIME_ENABLED && isAdmin && hasStrongAuth && backOfficeReady && adminCollection === 'analytics') {
      analyticsChannel.start();
      liveSessionsChannel.start();
    }
  }, [adminCollection, backOfficeReady, hasStrongAuth, isAdmin, user?.uid]);
  const perfNow = typeof performance !== 'undefined' ? performance.now() : null;
  if (user?.uid && isAdmin && hasStrongAuth) {
    if (strongAuthReadyAtRef.current === null) strongAuthReadyAtRef.current = perfNow;
  } else {
    strongAuthReadyAtRef.current = null;
  }
  if (backOfficeReady) {
    if (backOfficeReadyAtRef.current === null) backOfficeReadyAtRef.current = perfNow;
  } else {
    backOfficeReadyAtRef.current = null;
  }
  React.useEffect(() => {
    setIncidentSummary(null);
    if (!user?.uid || !isAdmin || !hasStrongAuth || !backOfficeReady) return undefined;
    return onSnapshot(doc(db, 'admin_incident_summary', 'current'), (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : null;
      const valid = data?.schemaVersion === 1 &&
        Number.isSafeInteger(data.activeTotal) && data.activeTotal >= 0 &&
        Number.isSafeInteger(data.activeCritical) && data.activeCritical >= 0 &&
        Number.isSafeInteger(data.activeWarnings) && data.activeWarnings >= 0 &&
        data.activeTotal === data.activeCritical + data.activeWarnings &&
        Number.isSafeInteger(data.revision) && data.revision >= 0 &&
        typeof data.updatedAt?.toMillis === 'function';
      setIncidentSummary(valid ? data : null);
    }, (error) => {
      if (error?.code !== 'permission-denied') {
        console.error('Admin incident summary listener failed', error?.code || error?.name);
      }
      setIncidentSummary(null);
    });
  }, [backOfficeReady, hasStrongAuth, isAdmin, user?.uid]);

  React.useEffect(() => {
    setActionSummary(null);
    if (!user?.uid || !isAdmin || !hasStrongAuth || !backOfficeReady) return undefined;
    return onSnapshot(doc(db, 'admin_action_summary', 'current'), (snapshot) => {
      if (!snapshot.exists()) {
        setActionSummary({ schemaVersion: 1, pendingReturns: 0, totalPending: 0, revision: 0 });
        return;
      }
      const data = snapshot.data();
      const valid = data?.schemaVersion === 1
        && Number.isSafeInteger(data.pendingReturns) && data.pendingReturns >= 0
        && Number.isSafeInteger(data.totalPending) && data.totalPending >= 0
        && data.totalPending === data.pendingReturns
        && Number.isSafeInteger(data.revision) && data.revision >= 0;
      setActionSummary(valid ? data : null);
    }, (error) => {
      if (error?.code !== 'permission-denied') {
        console.error('Admin action summary listener failed', error?.code || error?.name);
      }
      setActionSummary(null);
    });
  }, [backOfficeReady, hasStrongAuth, isAdmin, user?.uid]);

  React.useEffect(() => {
    const storageKey = user?.uid ? `sv-admin-system-incidents-seen:${user.uid}` : null;
    try {
      setSystemIncidentSeenRevision(storageKey ? Number(window.localStorage.getItem(storageKey) || 0) : 0);
    } catch {
      setSystemIncidentSeenRevision(0);
    }
  }, [user?.uid]);

  React.useEffect(() => {
    setSystemIncidentState({ status: 'idle', data: null });
    if (!user?.uid || !isAdmin || !hasStrongAuth || !backOfficeReady) return undefined;
    setSystemIncidentState({ status: 'loading', data: null });
    return onSnapshot(doc(db, 'admin_system_incident_summary', 'current'), (snapshot) => {
      if (!snapshot.exists()) {
        setSystemIncidentState({ status: 'ready', data: { schemaVersion: 1, revision: 0, incidents: [] } });
        return;
      }
      const data = snapshot.data();
      const valid = data?.schemaVersion === 1
        && Number.isSafeInteger(data.revision) && data.revision >= 0
        && Number.isSafeInteger(data.recentTotal) && data.recentTotal >= 0 && data.recentTotal <= 50
        && Number.isSafeInteger(data.recentCritical) && data.recentCritical >= 0
        && Number.isSafeInteger(data.recentErrors) && data.recentErrors >= 0
        && data.recentTotal === data.recentCritical + data.recentErrors
        && Array.isArray(data.incidents) && data.incidents.length <= 50
        && data.incidents.every((incident) => (
          incident?.schemaVersion === 1
          && typeof incident.fingerprint === 'string'
          && Number.isSafeInteger(incident.occurrenceCount) && incident.occurrenceCount >= 1
          && typeof incident.firstSeen?.toMillis === 'function'
          && typeof incident.lastSeen?.toMillis === 'function'
          && typeof incident.event === 'string'
          && typeof incident.errorClass === 'string'
          && typeof incident.service === 'string'
        ))
        && typeof data.updatedAt?.toMillis === 'function';
      setSystemIncidentState(valid
        ? { status: 'ready', data }
        : { status: 'error', data: null });
    }, (error) => {
      if (error?.code !== 'permission-denied') {
        console.error('Admin system incident summary listener failed', error?.code || error?.name);
      }
      setSystemIncidentState({ status: 'error', data: null });
    });
  }, [backOfficeReady, hasStrongAuth, isAdmin, user?.uid]);

  React.useEffect(() => {
    const handleStepUpRequired = () => setStepUpOpen(true);
    window.addEventListener(ADMIN_STEP_UP_REQUIRED_EVENT, handleStepUpRequired);
    return () => window.removeEventListener(ADMIN_STEP_UP_REQUIRED_EVENT, handleStepUpRequired);
  }, []);

  // Data for invisible tabs is loaded by each lazy view only after selection.
  const ensureAdminCatalog = React.useCallback(async () => {
    if (catalogStatusRef.current === 'loaded') return;
    if (catalogRequestRef.current) return catalogRequestRef.current;

    catalogStatusRef.current = 'loading';
    setCatalogState((current) => ({ ...current, status: 'loading', error: null }));

    const request = loadAdminPublicCatalog()
      .then((items) => {
        const currentItems = items.filter((item) => (
          !deletedProductIdsRef.current.has(String(item?.id || '').trim())
          && !deletedProductIdsRef.current.has(String(item?.originalId || '').trim())
        ));
        catalogStatusRef.current = 'loaded';
        setCatalogState({ items: currentItems, status: 'loaded', error: null });
        return currentItems;
      })
      .catch((error) => {
        catalogStatusRef.current = 'error';
        setCatalogState((current) => ({ ...current, status: 'error', error }));
        return [];
      })
      .finally(() => {
        if (catalogRequestRef.current === request) catalogRequestRef.current = null;
      });

    catalogRequestRef.current = request;
    return request;
  }, []);

  React.useEffect(() => {
    if (user && isAdmin && hasStrongAuth && backOfficeReady && ADMIN_PUBLIC_CATALOG_TABS.has(adminCollection)) {
      void ensureAdminCatalog();
    }
  }, [adminCollection, backOfficeReady, ensureAdminCatalog, hasStrongAuth, isAdmin, user]);

  React.useEffect(() => {
    const handleInvalidation = () => {
      catalogStatusRef.current = 'idle';
      catalogRequestRef.current = null;
      setCatalogState({ items: [], status: 'idle', error: null });
    };
    window.addEventListener(ADMIN_PUBLIC_CATALOG_INVALIDATED_EVENT, handleInvalidation);
    return () => window.removeEventListener(ADMIN_PUBLIC_CATALOG_INVALIDATED_EVENT, handleInvalidation);
  }, []);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem('darkMode') === 'true';
      setDarkMode(stored);
      document.documentElement.classList.toggle('dark', stored);
    } catch {
      setDarkMode(false);
    }
  }, []);

  const selectAdminTab = (tabId) => {
    if (tabId === 'analytics' && adminCollection !== 'analytics') startDataPerformance('open');
    if (ADMIN_PUBLIC_CATALOG_TABS.has(tabId)) void ensureAdminCatalog();
    if (tabId === 'incidents' && systemIncidentState.data?.revision) {
      setSystemIncidentSeenRevision(systemIncidentState.data.revision);
      try {
        window.localStorage.setItem(`sv-admin-system-incidents-seen:${user.uid}`, String(systemIncidentState.data.revision));
      } catch {
        // Le badge reste fonctionnel en mémoire si le stockage local est indisponible.
      }
    }
    setAdminCollection(tabId);
    setEditingItem(null);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const publicationMutationsBlocked = !deploymentVerified || deploymentStale;
  const adminAccessIsResolved = Boolean(user && !user.isAnonymous && isAdmin && hasStrongAuth);

  const handleToggleStatus = async (item, collectionName) => {
    if (publicationMutationsBlocked) return;
    await publishProductAdmin(item, collectionName, item.status !== 'published');
    clearAdminPublicCatalogCache();
  };

  const handleDeleteItem = async (_year, item, collectionName, stableCommandId) => {
    if (publicationMutationsBlocked) return;
    await deleteProductAdmin(item, collectionName, stableCommandId);
    [item?.id, item?.originalId]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .forEach((productId) => deletedProductIdsRef.current.add(productId));
    invalidateAdminCachedData('admin-dashboard:insights');
    clearAdminPublicCatalogCache();
  };

  const handleMarkAsSold = async (item, collectionName) => {
    if (publicationMutationsBlocked) return;
    if (!window.confirm(`Marquer "${item.name}" comme VENDU ? (Stock a 0)`)) return;
    const currentStock = Number(item.stock || 0);
    if (!Number.isSafeInteger(currentStock) || currentStock <= 0) return;
    await adjustInventoryAdmin(
      item,
      collectionName,
      -currentStock,
      'Stock ramene a zero depuis le back-office'
    );
    clearAdminPublicCatalogCache();
  };

  const handleMarkAsAvailable = async (item, collectionName) => {
    if (publicationMutationsBlocked) return;
    if (!window.confirm(`Remettre "${item.name}" en vente ? (Stock a 1)`)) return;
    const currentStock = Number(item.stock || 0);
    if (!Number.isSafeInteger(currentStock) || currentStock >= 1) return;
    await adjustInventoryAdmin(
      item,
      collectionName,
      1,
      'Remise en stock apres controle physique'
    );
    clearAdminPublicCatalogCache();
  };

  // A forced token refresh emits a short claimsStatus="loading" transition.
  // Keep an already-resolved strong admin session mounted during that refresh:
  // publication progress and its final view switch are local UI state.
  if ((loading && !adminAccessIsResolved) || shouldRedirectToGallery) {
    return <div className="min-h-screen bg-[#faf9f5]" />;
  }

  if (!hasStrongAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f5] px-6 text-stone-900">
        <div className="w-full max-w-lg rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm md:p-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-950 text-white">
            <ShieldCheck size={24} />
          </span>
          <h1 className="mt-6 text-3xl font-black tracking-tight">Confirmez votre identite</h1>
          <p className="mt-3 text-sm leading-6 text-stone-500">
            L espace client reste accessible. Pour ouvrir l administration, utilisez votre connexion rapide ou Google.
          </p>
          <button
            type="button"
            onClick={() => setStepUpOpen(true)}
            className="mt-7 w-full rounded-full bg-stone-950 px-6 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-stone-800"
          >
            Confirmer mon identite
          </button>
          <Link className="mt-4 inline-block text-xs font-bold text-stone-500 hover:text-stone-900" href="/">
            Retour au site
          </Link>
        </div>
        <Suspense fallback={null}>
          <LegacyLoginModalIsland
            open={stepUpOpen}
            onOpenChange={setStepUpOpen}
            renderTrigger={false}
          />
        </Suspense>
      </div>
    );
  }

  if (!isSuperAdmin && ['idle', 'loading'].includes(billingGate.status)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f3ef] px-6 text-stone-900">
        <div className="flex items-center gap-3 text-sm font-bold text-stone-600">
          <RefreshCw className="animate-spin" size={18} />
          Préparation de votre espace…
        </div>
      </div>
    );
  }

  if (!isSuperAdmin && billingGate.status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f3ef] px-6 text-stone-900">
        <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-black tracking-tight">L’espace ne peut pas être vérifié</h1>
          <p className="mt-3 text-sm leading-6 text-stone-500">
            Aucune donnée n’a été perdue. Réessayez dans quelques instants.
          </p>
          <button
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-stone-950 px-5 text-xs font-black uppercase tracking-[0.12em] text-white"
            onClick={() => void refreshBillingGate().catch(() => {})}
            type="button"
          >
            <RefreshCw size={14} />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin && billingGate.data?.required === true) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#f5f3ef]" />}>
        <BillingOnboardingGuide
          initialStatus={billingGate.data}
          onRefresh={refreshBillingGate}
          onStatusChange={(data) => setBillingGate({ status: 'ready', data, error: null })}
        />
      </Suspense>
    );
  }

  const immersiveLayout = IMMERSIVE_TABS.has(adminCollection);

  return (
    <div className={`${immersiveLayout ? 'xl:h-[100dvh] xl:overflow-hidden' : 'min-h-screen'} ${darkMode ? 'bg-[#0A0A0A] text-white' : 'bg-[#FAFAF9] text-stone-900'}`}>
      <AdminSidebar
        activeTabId={adminCollection}
        darkMode={darkMode}
        groups={ADMIN_NAV_GROUPS}
        incidentCount={(incidentSummary?.activeTotal || 0) + (
          (systemIncidentState.data?.revision || 0) > systemIncidentSeenRevision ? 1 : 0
        )}
        actionCounts={{ returns: actionSummary?.pendingReturns || 0 }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onIntent={(tabId) => {
          if (tabId === 'analytics') void loadAdminAnalytics();
          if (tabId === 'incidents') void loadAdminIncidentConsole();
          if (tabId === 'orders') {
            void loadAdminOrders().then((module) => module.preloadAdminOrdersWorkspace?.());
          }
        }}
        onSelect={selectAdminTab}
        tabs={adminTabs}
      />

      <div className={`${immersiveLayout ? 'xl:h-[100dvh] xl:overflow-hidden' : 'min-h-screen'} lg:pl-[17.5rem]`}>
        <main className={`${immersiveLayout ? 'max-w-none space-y-6 xl:grid xl:h-full xl:grid-rows-[auto_minmax(0,1fr)] xl:gap-5 xl:space-y-0 xl:py-6' : 'mx-auto max-w-[100rem] space-y-8 lg:py-10'} px-4 py-8 sm:px-6 lg:px-7 2xl:px-10`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition lg:hidden ${darkMode ? 'border-white/10 text-stone-300 hover:bg-white/10' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'}`}
              aria-label="Ouvrir la navigation"
            >
              <Menu size={19} />
            </button>
            <div className="space-y-1.5">
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                {adminCollection === 'account' ? 'Espace personnel' : 'Systeme de Controle'}
              </p>
              <h2 className="text-3xl font-black tracking-tighter md:text-4xl">
                {adminCollection === 'account' ? 'Mon compte' : 'Gestion Boutique'}
              </h2>
            </div>
          </div>
          <Link
            href="/"
            className={`group flex items-center gap-2 rounded-2xl border-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all lg:hidden ${darkMode ? 'border-white/10 hover:border-white hover:bg-white hover:text-stone-900' : 'border-stone-900 hover:bg-stone-900 hover:text-white'}`}
          >
            <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-1" />
            Retour au site
          </Link>
        </div>

        <Suspense fallback={<div className="flex items-center justify-center p-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-stone-800" /></div>}>
          {adminCollection === 'dashboard' ? (
            <AdminDashboard
              user={user}
              darkMode={darkMode}
              isSuperAdmin={isSuperAdmin}
              items={catalogState.items}
              onLoadCatalog={ensureAdminCatalog}
              strongAuthReadyAt={strongAuthReadyAtRef.current}
              backOfficeReadyAt={backOfficeReadyAtRef.current}
            />
          ) : adminCollection === 'account' ? (
            <AdminAccount darkMode={darkMode} isSuperAdmin={isSuperAdmin} user={user} />
          ) : adminCollection === 'homepage' ? (
            <AdminHomepage darkMode={darkMode} />
          ) : adminCollection === 'orders' ? (
            <AdminOrders
              darkMode={darkMode}
              focusOrderId={focusedOrderId}
              mutationsEnabled
            />
          ) : adminCollection === 'invoices' ? (
            <AdminInvoices darkMode={darkMode} />
          ) : adminCollection === 'quotes' ? (
            <AdminQuotes darkMode={darkMode} />
          ) : adminCollection === 'returns' ? (
            <AdminReturns darkMode={darkMode} mutationsEnabled />
          ) : adminCollection === 'promotions' ? (
            <div>
              <AdminCatalogStatus
                darkMode={darkMode}
                error={catalogState.error}
                loading={catalogState.status === 'loading'}
                onRetry={ensureAdminCatalog}
              />
              <AdminPromotionCodes darkMode={darkMode} items={catalogState.items} />
            </div>
          ) : adminCollection === 'livraison' ? (
            <AdminLivraison darkMode={darkMode} />
          ) : adminCollection === 'studio' ? (
            <AdminStudio darkMode={darkMode} />
          ) : adminCollection === 'users' ? (
            <AdminUsers darkMode={darkMode} />
          ) : adminCollection === 'newsletter' ? (
            <AdminNewsletter darkMode={darkMode} />
          ) : adminCollection === 'seo' ? (
            <AdminSEO darkMode={darkMode} />
          ) : adminCollection === 'analytics' ? (
            <div>
              <AdminCatalogStatus
                darkMode={darkMode}
                error={catalogState.error}
                loading={catalogState.status === 'loading'}
                onRetry={ensureAdminCatalog}
              />
              <AdminAnalytics darkMode={darkMode} items={catalogState.items} />
            </div>
          ) : adminCollection === 'incidents' ? (
            <AdminIncidentConsole darkMode={darkMode} systemIncidentState={systemIncidentState} />
          ) : adminCollection === 'performance' ? (
            <AdminFunctionPerformance darkMode={darkMode} />
          ) : adminCollection === 'payment_settings' ? (
            <AdminPaymentSettings darkMode={darkMode} />
          ) : adminCollection === 'payment_links' ? (
            <div>
              <AdminCatalogStatus
                darkMode={darkMode}
                error={catalogState.error}
                loading={catalogState.status === 'loading'}
                onRetry={ensureAdminCatalog}
              />
              <AdminPaymentLinks
                darkMode={darkMode}
                items={catalogState.items}
                mutationsEnabled
              />
            </div>
          ) : adminCollection === 'inventory' ? (
            <div>
              <AdminCatalogStatus
                darkMode={darkMode}
                error={catalogState.error}
                loading={catalogState.status === 'loading'}
                onRetry={ensureAdminCatalog}
              />
              {catalogState.status === 'loaded' && (
                <AdminGlobalInventory
                  items={catalogState.items}
                  darkMode={darkMode}
                  onEdit={(item) => {
                    setAdminCollection('furniture');
                    setEditingItem(item);
                    window.scrollTo(0, 0);
                  }}
                />
              )}
            </div>
          ) : (
            <AdminPublicationWorkspace
              collectionName={adminCollection}
              darkMode={darkMode}
              editData={editingItem}
              onCancelEdit={() => setEditingItem(null)}
              onEdit={(item) => setEditingItem(item)}
              onToggleStatus={(item) => handleToggleStatus(item, adminCollection)}
              onDelete={(item, stableCommandId) => handleDeleteItem(null, item, adminCollection, stableCommandId)}
              onMarkAsSold={(item) => handleMarkAsSold(item, adminCollection)}
              onMarkAsAvailable={(item) => handleMarkAsAvailable(item, adminCollection)}
              mutationsBlocked={publicationMutationsBlocked}
            />
          )}
        </Suspense>
      </main>
      </div>
      <Suspense fallback={null}>
        <LegacyLoginModalIsland
          open={stepUpOpen}
          onOpenChange={setStepUpOpen}
          renderTrigger={false}
        />
      </Suspense>
      {deploymentStale && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-stone-950/55 px-5 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="admin-version-title">
          <div className="w-full max-w-md rounded-[24px] bg-white p-7 text-center text-stone-950 shadow-2xl">
            <ShieldCheck className="mx-auto text-amber-500" size={28} strokeWidth={1.6} />
            <h2 id="admin-version-title" className="mt-4 text-xl font-black tracking-tight">Une nouvelle version est disponible</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">Actualise le back-office avant toute publication. Les photos déjà préparées restent conservées pour la reprise.</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-5 min-h-11 w-full rounded-full bg-stone-950 px-5 text-sm font-extrabold text-white">Actualiser et reprendre</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAppIsland(props) {
  return <AdminContent {...props} />;
}
