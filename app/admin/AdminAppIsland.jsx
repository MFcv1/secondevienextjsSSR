'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  BarChart3,
  ChevronLeft,
  CreditCard,
  Globe,
  Grid,
  Layout,
  LayoutPanelTop,
  Mail,
  Menu,
  Palette,
  RefreshCw,
  RotateCcw,
  Share2,
  ShieldCheck,
  CircleUserRound,
  Users,
  Package,
} from 'lucide-react';
import LoginView from '../../src/kit/commerce/LoginView';
import {
  adjustInventoryAdmin,
  archiveProductAdmin,
  COMMERCE_V2_ADMIN_COMMANDS_ENABLED,
  publishProductAdmin,
} from '../../src/kit/commerce/adminProductCommandClient';
import { useAuth } from '../../src/kit/contexts/AuthContext';
import KIT_CONFIG from '../../src/kit/config/constants';
import {
  ADMIN_STEP_UP_REQUIRED_EVENT,
  getCallableFunction,
} from '../../src/kit/config/firebaseLazy';
import {
  getAdminCachedData,
  loadAdminCachedData,
} from '../../src/kit/admin/adminDataCache';
import {
  ADMIN_PUBLIC_CATALOG_INVALIDATED_EVENT,
  clearAdminPublicCatalogCache,
  loadAdminPublicCatalog,
} from '../../src/kit/admin/adminPublicCatalog';
import AdminSidebar from './AdminSidebar';

const loadAdminDashboard = () => import('../../src/kit/admin/AdminDashboard');
const loadAdminOrders = () => import('../../src/kit/admin/AdminOrders');
const loadAdminReturns = () => import('../../src/kit/admin/AdminReturns');

const AdminDashboard = React.lazy(loadAdminDashboard);
const AdminHomepage = React.lazy(() => import('../../src/kit/admin/AdminHomepage'));
const AdminOrders = React.lazy(loadAdminOrders);
const AdminReturns = React.lazy(loadAdminReturns);
const AdminLivraison = React.lazy(() => import('../../src/kit/admin/AdminLivraison'));
const AdminStudio = React.lazy(() => import('../../src/kit/admin/AdminStudio'));
const AdminForm = React.lazy(() => import('../../src/kit/admin/AdminForm'));
const AdminItemList = React.lazy(() => import('../../src/kit/admin/AdminItemList'));
const AdminUsers = React.lazy(() => import('../../src/kit/admin/AdminUsers'));
const AdminNewsletter = React.lazy(() => import('../../src/kit/admin/AdminNewsletter'));
const AdminAnalytics = React.lazy(() => import('../../src/kit/admin/AdminAnalytics'));
const AdminSEO = React.lazy(() => import('../../src/kit/admin/AdminSEO'));
const AdminIPManager = React.lazy(() => import('../../src/kit/admin/AdminIPManager'));
const AdminPaymentSettings = React.lazy(() => import('../../src/kit/admin/AdminPaymentSettings'));
const AdminIPTracker = React.lazy(() => import('../../src/kit/admin/AdminIPTracker'));
const AdminGlobalInventory = React.lazy(() => import('../../src/kit/admin/GlobalInventoryView'));
const AdminMaintenance = React.lazy(() => import('../../src/kit/admin/AdminMaintenance'));
const AdminAccount = React.lazy(() => import('../../src/kit/admin/AdminAccount'));
const BillingOnboardingGuide = React.lazy(() => import('../../src/kit/admin/BillingOnboardingGuide'));
const LegacyLoginModalIsland = React.lazy(() => import('../../src/kit/marketplace/LegacyLoginModalFullIsland'));

const TAB_ICONS = {
  dashboard: Activity,
  analytics: BarChart3,
  studio: Palette,
  homepage: Palette,
  orders: Package,
  returns: RotateCcw,
  users: Users,
  ip_manager: Globe,
  seo: Share2,
  newsletter: Mail,
  payment_settings: CreditCard,
  account: CircleUserRound,
  inventory: Grid,
  maintenance: RefreshCw,
};

const COLLECTION_ICONS = [Layout, LayoutPanelTop];

const adminTabs = KIT_CONFIG.adminTabs.map((tab, index) => ({
  ...tab,
  icon: TAB_ICONS[tab.id] ?? COLLECTION_ICONS[index % COLLECTION_ICONS.length],
}));

const ADMIN_PUBLIC_CATALOG_TABS = new Set(['dashboard', 'analytics', 'inventory']);
const COMMERCE_READ_ONLY_TABS = new Set(['furniture', 'inventory', 'orders', 'returns', 'livraison', 'payment_settings', 'maintenance']);
const PRODUCT_COMMAND_TABS = new Set(['furniture', 'inventory']);

const isCommerceReadOnlyTab = (tabId, mutationsEnabled) => {
  if (!COMMERCE_READ_ONLY_TABS.has(tabId)) return false;
  if (['orders', 'returns'].includes(tabId)) return false;
  if (tabId === 'maintenance') return true;
  if (PRODUCT_COMMAND_TABS.has(tabId) && !COMMERCE_V2_ADMIN_COMMANDS_ENABLED) return true;
  return !mutationsEnabled;
};

function CommerceReadOnlySurface({ children, darkMode, readOnly }) {
  if (!readOnly) return children;
  return (
    <section>
      <div className={`mb-4 rounded-2xl border px-5 py-4 text-sm ${darkMode ? 'border-amber-300/20 bg-amber-300/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        Commerce en lecture seule : commandes, prix, stocks, remboursements, politiques et outils destructifs sont neutralises.
      </div>
      <div inert="" aria-disabled="true" className="pointer-events-none select-none opacity-60">
        {children}
      </div>
    </section>
  );
}

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
  { label: 'Ventes', tabs: ['orders', 'returns', 'livraison', 'payment_settings'] },
  { label: 'Communication', tabs: ['homepage', 'newsletter', 'seo'] },
  { label: 'Administration', tabs: ['account', 'users', 'ip_manager', 'maintenance'] },
];
function AdminContent() {
  const { user, isAdmin, isSuperAdmin, hasStrongAuth, loading } = useAuth();
  const [adminCollection, setAdminCollection] = useState('dashboard');
  const [editingItem, setEditingItem] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [catalogState, setCatalogState] = useState({ items: [], status: 'idle', error: null });
  const [billingGate, setBillingGate] = useState({ status: 'idle', data: null, error: null });
  const [commerceStatus, setCommerceStatus] = useState(() => ({
    status: getAdminCachedData('commerce-status') ? 'ready' : 'idle',
    data: getAdminCachedData('commerce-status'),
    error: null,
  }));
  const catalogStatusRef = React.useRef('idle');
  const catalogRequestRef = React.useRef(null);

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
  const commerceMutationsEnabled = commerceStatus.data?.control?.adminMutationMode === 'v2';

  React.useEffect(() => {
    if (!user || !isAdmin || !hasStrongAuth) return undefined;
    let cancelled = false;
    if (!commerceStatus.data) {
      setCommerceStatus((current) => ({ ...current, status: 'loading', error: null }));
    }
    void loadAdminCachedData('commerce-status', async () => {
      const getCommerceStatus = await getCallableFunction('getCommerceOperationsStatusAdmin');
      let lastError = null;
      for (const delayMs of [0, 500, 1500]) {
        if (delayMs > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, delayMs));
        }
        try {
          const result = await getCommerceStatus({});
          return result.data;
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError;
    }).then((data) => {
      if (!cancelled) setCommerceStatus({ status: 'ready', data, error: null });
    }).catch((error) => {
      if (!cancelled) {
        setCommerceStatus((current) => (
          current.data
            ? { ...current, status: 'ready', error }
            : { ...current, status: 'error', error }
        ));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [commerceStatus.data, hasStrongAuth, isAdmin, user]);

  React.useEffect(() => {
    const handleStepUpRequired = () => setStepUpOpen(true);
    window.addEventListener(ADMIN_STEP_UP_REQUIRED_EVENT, handleStepUpRequired);
    return () => window.removeEventListener(ADMIN_STEP_UP_REQUIRED_EVENT, handleStepUpRequired);
  }, []);

  React.useEffect(() => {
    if (!user || !isAdmin || !hasStrongAuth || !backOfficeReady) return undefined;
    const preload = () => {
      void loadAdminDashboard();
      void loadAdminOrders();
      void loadAdminReturns();
    };
    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(preload, { timeout: 1800 });
      return () => window.cancelIdleCallback(idleId);
    }
    const timeoutId = window.setTimeout(preload, 500);
    return () => window.clearTimeout(timeoutId);
  }, [backOfficeReady, hasStrongAuth, isAdmin, user]);

  const ensureAdminCatalog = React.useCallback(async () => {
    if (catalogStatusRef.current === 'loaded') return;
    if (catalogRequestRef.current) return catalogRequestRef.current;

    catalogStatusRef.current = 'loading';
    setCatalogState((current) => ({ ...current, status: 'loading', error: null }));

    const request = loadAdminPublicCatalog()
      .then((items) => {
        catalogStatusRef.current = 'loaded';
        setCatalogState({ items, status: 'loaded', error: null });
        return items;
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
    if (ADMIN_PUBLIC_CATALOG_TABS.has(tabId)) void ensureAdminCatalog();
    setAdminCollection(tabId);
    setEditingItem(null);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleStatus = async (item, collectionName) => {
    await publishProductAdmin(item, collectionName, item.status !== 'published');
    clearAdminPublicCatalogCache();
  };

  const handleDeleteItem = async (_year, item, collectionName) => {
    if (!window.confirm('Archiver ce produit sans supprimer son historique ?')) return;
    await archiveProductAdmin(item, collectionName);
    clearAdminPublicCatalogCache();
  };

  const handleMarkAsSold = async (item, collectionName) => {
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

  if (loading) return <div className="min-h-screen bg-[#faf9f5]" />;
  if (!user) return <LoginView onSuccess={() => {}} />;
  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-5 px-6 text-center text-stone-900">
        <h1 className="text-3xl font-black tracking-tight">Acces admin refuse</h1>
        <p className="text-sm text-stone-500">Ce compte n&apos;a pas les droits administrateur.</p>
        <Link className="rounded-full bg-stone-950 px-5 py-3 text-sm font-bold text-white" href="/">
          Retour au site
        </Link>
      </div>
    );
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

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0A0A0A] text-white' : 'bg-[#FAFAF9] text-stone-900'}`}>
      <AdminSidebar
        activeTabId={adminCollection}
        darkMode={darkMode}
        groups={ADMIN_NAV_GROUPS}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelect={selectAdminTab}
        tabs={adminTabs}
      />

      <div className="min-h-screen lg:pl-[17.5rem]">
        <main className="mx-auto max-w-[100rem] space-y-8 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <Suspense fallback={null}>
          <AdminIPTracker />
        </Suspense>
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
          <CommerceReadOnlySurface
            darkMode={darkMode}
            readOnly={isCommerceReadOnlyTab(adminCollection, commerceMutationsEnabled)}
          >
          {adminCollection === 'dashboard' ? (
            <AdminDashboard
              user={user}
              darkMode={darkMode}
              isSuperAdmin={isSuperAdmin}
              items={catalogState.items}
              commerceStatus={commerceStatus}
            />
          ) : adminCollection === 'account' ? (
            <AdminAccount darkMode={darkMode} isSuperAdmin={isSuperAdmin} user={user} />
          ) : adminCollection === 'homepage' ? (
            <AdminHomepage darkMode={darkMode} />
          ) : adminCollection === 'orders' ? (
            <AdminOrders darkMode={darkMode} mutationsEnabled={commerceMutationsEnabled} />
          ) : adminCollection === 'returns' ? (
            <AdminReturns darkMode={darkMode} mutationsEnabled={commerceMutationsEnabled} />
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
            <div>
              <AdminCatalogStatus
                darkMode={darkMode}
                error={catalogState.error}
                loading={catalogState.status === 'loading'}
                onRetry={ensureAdminCatalog}
              />
              <AdminAnalytics darkMode={darkMode} items={catalogState.items} />
            </div>
          ) : adminCollection === 'payment_settings' ? (
            <AdminPaymentSettings darkMode={darkMode} />
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
                  onEdit={(item) => {
                    setEditingItem(item);
                    window.scrollTo(0, 0);
                  }}
                  onToggleStatus={(item) => handleToggleStatus(item, adminCollection)}
                  onDelete={(item) => handleDeleteItem(null, item, adminCollection)}
                  onMarkAsSold={(item) => handleMarkAsSold(item, adminCollection)}
                  onMarkAsAvailable={(item) => handleMarkAsAvailable(item, adminCollection)}
                />
              </div>
            </>
          )}
          </CommerceReadOnlySurface>
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
    </div>
  );
}

export default function AdminAppIsland(props) {
  return <AdminContent {...props} />;
}
