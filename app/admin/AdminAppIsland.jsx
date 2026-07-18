'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  CreditCard,
  Globe,
  Grid,
  Layout,
  LayoutPanelTop,
  Mail,
  Palette,
  RefreshCw,
  RotateCcw,
  Share2,
  ShieldCheck,
  Users,
  Package,
} from 'lucide-react';
import LoginView from '../../src/kit/commerce/LoginView';
import { useAuth } from '../../src/kit/contexts/AuthContext';
import KIT_CONFIG from '../../src/kit/config/constants';
import { appId } from '../../src/kit/config/firebaseEnv';
import { getDb, loadFirestoreModule } from '../../src/kit/config/firebaseLazy';
import {
  ADMIN_PUBLIC_CATALOG_INVALIDATED_EVENT,
  clearAdminPublicCatalogCache,
  loadAdminPublicCatalog,
} from '../../src/kit/admin/adminPublicCatalog';

const AdminDashboard = React.lazy(() => import('../../src/kit/admin/AdminDashboard'));
const AdminHomepage = React.lazy(() => import('../../src/kit/admin/AdminHomepage'));
const AdminOrders = React.lazy(() => import('../../src/kit/admin/AdminOrders'));
const AdminReturns = React.lazy(() => import('../../src/kit/admin/AdminReturns'));
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
  inventory: Grid,
  maintenance: RefreshCw,
};

const COLLECTION_ICONS = [Layout, LayoutPanelTop];

const adminTabs = KIT_CONFIG.adminTabs.map((tab, index) => ({
  ...tab,
  icon: TAB_ICONS[tab.id] ?? COLLECTION_ICONS[index % COLLECTION_ICONS.length],
}));

const ADMIN_TAB_GROUPS = [
  { label: 'Pilotage', tabIds: ['dashboard', 'analytics'] },
  { label: 'Catalogue', tabIds: ['furniture', 'inventory', 'studio'] },
  { label: 'Experience boutique', tabIds: ['homepage', 'seo'] },
  { label: 'Commerce', tabIds: ['orders', 'returns', 'livraison', 'payment_settings'] },
  { label: 'Relation client', tabIds: ['users', 'newsletter'] },
  { label: 'Systeme', tabIds: ['ip_manager', 'maintenance'] },
];

const adminTabsById = new Map(adminTabs.map((tab) => [tab.id, tab]));
const adminTabGroups = ADMIN_TAB_GROUPS.map((group) => ({
  ...group,
  tabs: group.tabIds.map((tabId) => adminTabsById.get(tabId)).filter(Boolean),
}));

const ADMIN_PUBLIC_CATALOG_TABS = new Set(['analytics', 'map', 'inventory']);

function AdminDesktopSidebar({ adminCollection, darkMode, onIntent, onSelect }) {
  return (
    <aside className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block lg:w-[304px] lg:overflow-hidden lg:border-r ${darkMode ? 'border-white/10 bg-[#101010]' : 'border-stone-200 bg-[#fffefd]'}`}>
      <div className="flex h-full flex-col px-7 py-5">
          <div className={`mb-3 border-b px-2 pb-3 ${darkMode ? 'border-white/10' : 'border-stone-200/80'}`}>
            <Link
              href="/"
              className={`group flex items-center gap-2 rounded-xl py-1.5 text-[9px] font-black uppercase tracking-[0.14em] transition-[transform,color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-x-0.5 ${darkMode ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-950'}`}
            >
              <ChevronLeft size={13} strokeWidth={1.5} className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-x-0.5" />
              Retour au site
            </Link>
          </div>

          <nav aria-label="Navigation administration" className="flex flex-1 flex-col justify-between pb-5 pt-5">
            {adminTabGroups.map((group) => (
              <section key={group.label} aria-label={group.label}>
                <p className={`mb-1 px-2 text-[8px] font-black uppercase tracking-[0.18em] ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = adminCollection === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onFocus={() => onIntent(tab.id)}
                        onMouseEnter={() => onIntent(tab.id)}
                        onClick={() => onSelect(tab.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-[10px] font-bold tracking-[0.015em] transition-[transform,background-color,color,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.985] ${isActive ? (darkMode ? 'bg-white text-stone-950 shadow-[0_10px_20px_-16px_rgba(255,255,255,0.95)]' : 'bg-stone-950 text-white shadow-[0_12px_22px_-18px_rgba(28,25,23,0.9)]') : (darkMode ? 'text-stone-400 hover:bg-white/[0.06] hover:text-white' : 'text-stone-600 hover:bg-stone-100/80 hover:text-stone-950')}`}
                      >
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${isActive ? (darkMode ? 'bg-stone-900 text-white' : 'bg-white/15 text-white') : (darkMode ? 'bg-white/[0.055] text-stone-400' : 'bg-stone-100 text-stone-500')}`}>
                          <Icon size={13} strokeWidth={1.5} />
                        </span>
                        <span className="min-w-0 truncate">{tab.label}</span>
                        {isActive && <span className={`ml-auto h-1.5 w-1.5 rounded-full ${darkMode ? 'bg-stone-950' : 'bg-white'}`} />}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>

      </div>
    </aside>
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

const getAdminFirestoreRuntime = async () => {
  const [db, firestore] = await Promise.all([getDb(), loadFirestoreModule()]);
  return { db, firestore };
};

function AdminContent() {
  const { user, isAdmin, hasStrongAuth, loading } = useAuth();
  const [adminCollection, setAdminCollection] = useState('dashboard');
  const [editingItem, setEditingItem] = useState(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [catalogState, setCatalogState] = useState({ items: [], status: 'idle', error: null });
  const catalogStatusRef = React.useRef('idle');
  const catalogRequestRef = React.useRef(null);

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
    if (ADMIN_PUBLIC_CATALOG_TABS.has(adminCollection)) {
      void ensureAdminCatalog();
    }
  }, [adminCollection, ensureAdminCatalog]);

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

  const handleSelectAdminTab = (tabId) => {
    if (ADMIN_PUBLIC_CATALOG_TABS.has(tabId)) void ensureAdminCatalog();
    setAdminCollection(tabId);
    setEditingItem(null);
    setIsMoreMenuOpen(false);
  };

  const handleAdminTabIntent = (tabId) => {
    if (ADMIN_PUBLIC_CATALOG_TABS.has(tabId)) void ensureAdminCatalog();
  };

  const handleToggleStatus = async (item, collectionName) => {
    const { db, firestore } = await getAdminFirestoreRuntime();
    const { doc, updateDoc } = firestore;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, item.id), {
      status: item.status === 'published' ? 'draft' : 'published',
    });
    clearAdminPublicCatalogCache();
  };

  const handleDeleteItem = async (_year, id, collectionName) => {
    if (!window.confirm('Supprimer ?')) return;
    const { db, firestore } = await getAdminFirestoreRuntime();
    const { deleteDoc, doc } = firestore;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, id));
    clearAdminPublicCatalogCache();
  };

  const handleMarkAsSold = async (item, collectionName) => {
    if (!window.confirm(`Marquer "${item.name}" comme VENDU ? (Stock a 0)`)) return;
    const { db, firestore } = await getAdminFirestoreRuntime();
    const { doc, serverTimestamp, updateDoc } = firestore;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, item.id), {
      sold: true,
      stock: 0,
      soldAt: serverTimestamp(),
    });
    clearAdminPublicCatalogCache();
  };

  const handleMarkAsAvailable = async (item, collectionName) => {
    if (!window.confirm(`Remettre "${item.name}" en vente ? (Stock a 1)`)) return;
    const { db, firestore } = await getAdminFirestoreRuntime();
    const { doc, updateDoc } = firestore;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, item.id), {
      sold: false,
      stock: 1,
      soldAt: null,
    });
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

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0A0A0A] text-white' : 'bg-[#FAFAF9] text-stone-900'}`}>
      <AdminDesktopSidebar
        adminCollection={adminCollection}
        darkMode={darkMode}
        onIntent={handleAdminTabIntent}
        onSelect={handleSelectAdminTab}
      />

      <main className="mx-auto max-w-[1440px] space-y-12 px-4 py-16 md:px-6 md:py-20 lg:ml-[304px] lg:max-w-none lg:px-12">
        <div className="lg:mx-auto lg:max-w-[1180px]">
        <Suspense fallback={null}>
          <AdminIPTracker />
        </Suspense>

        <section className="min-w-0 space-y-12 lg:space-y-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Systeme de Controle</p>
            <h2 className="text-4xl font-black tracking-tighter md:text-5xl">Gestion Boutique</h2>
          </div>
          <Link
            href="/"
            className={`group flex items-center gap-2 rounded-2xl border-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all lg:hidden ${darkMode ? 'border-white/10 hover:border-white hover:bg-white hover:text-stone-900' : 'border-stone-900 hover:bg-stone-900 hover:text-white'}`}
          >
            <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-1" />
            Retour au site
          </Link>
        </div>

        <div className="relative flex flex-col items-center lg:hidden">
          <div className={`w-full rounded-[2.5rem] border p-2 ${darkMode ? 'border-white/5 bg-[#111111]/80 backdrop-blur-xl' : 'border-stone-200/60 bg-white/80 shadow-lg shadow-stone-200/20 backdrop-blur-xl'}`}>
            <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
              {adminTabs.map((tab, idx) => {
                const Icon = tab.icon;
                const isActive = adminCollection === tab.id;
                const isAlwaysVisible = idx < 4;
                const isDesktopVisible = idx < 8;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onFocus={() => handleAdminTabIntent(tab.id)}
                    onMouseEnter={() => handleAdminTabIntent(tab.id)}
                    onClick={() => handleSelectAdminTab(tab.id)}
                    className={`group relative flex-none items-center gap-2 rounded-full px-3 py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-300 md:px-5 ${isAlwaysVisible ? 'flex' : isDesktopVisible ? 'hidden md:flex' : 'hidden'} ${isActive ? (darkMode ? 'bg-white text-stone-900 shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'bg-stone-900 text-white shadow-xl') : (darkMode ? 'text-stone-500 hover:bg-white/5 hover:text-white' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900')}`}
                  >
                    <Icon size={14} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-6'}`} />
                    <span className={isActive ? 'opacity-100' : 'opacity-80'}>{tab.label}</span>
                    {isActive && <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-current opacity-40" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMoreMenuOpen((value) => !value)}
            className={`mt-6 flex items-center gap-2 rounded-full px-6 py-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 hover:scale-105 active:scale-95 ${isMoreMenuOpen || adminTabs.slice(8).some((tab) => tab.id === adminCollection) ? (darkMode ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-900') : (darkMode ? 'text-stone-600 hover:text-stone-400' : 'text-stone-400 hover:text-stone-600')}`}
          >
            <span className="opacity-50 tracking-tighter">•••</span>
            <span>{isMoreMenuOpen ? 'Fermer' : "Plus d'options"}</span>
            <ChevronDown size={12} className={`transition-transform duration-500 ${isMoreMenuOpen ? 'rotate-180' : 'opacity-40'}`} />
          </button>

          {isMoreMenuOpen && (
            <>
              <button type="button" aria-label="Fermer le menu admin" onClick={() => setIsMoreMenuOpen(false)} className="fixed inset-0 z-40 cursor-default" />
              <div className={`admin-more-menu absolute left-0 right-0 top-full z-50 mx-auto mt-2 grid max-w-4xl grid-cols-2 gap-2 rounded-[2.5rem] border p-3 md:grid-cols-4 ${darkMode ? 'border-white/10 bg-[#161616] shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'border-stone-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)]'}`}>
                {adminTabs.slice(4).map((tab, idx) => {
                  const realIdx = idx + 4;
                  const isDesktopShown = realIdx < 8;
                  const Icon = tab.icon;
                  const isActive = adminCollection === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onFocus={() => handleAdminTabIntent(tab.id)}
                      onMouseEnter={() => handleAdminTabIntent(tab.id)}
                      onClick={() => handleSelectAdminTab(tab.id)}
                      className={`items-center gap-3 rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest transition-all ${isDesktopShown ? 'flex md:hidden' : 'flex'} ${isActive ? (darkMode ? 'bg-white text-stone-900' : 'bg-stone-900 text-white') : (darkMode ? 'bg-white/5 text-stone-400 hover:text-white' : 'bg-stone-50 text-stone-500 hover:text-stone-900')}`}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className={`h-px w-full ${darkMode ? 'bg-white/10' : 'bg-stone-200'}`} />

        <Suspense fallback={<div className="flex items-center justify-center p-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-stone-800" /></div>}>
          {adminCollection === 'dashboard' ? (
            <AdminDashboard user={user} darkMode={darkMode} />
          ) : adminCollection === 'homepage' ? (
            <AdminHomepage darkMode={darkMode} />
          ) : adminCollection === 'orders' ? (
            <AdminOrders darkMode={darkMode} />
          ) : adminCollection === 'returns' ? (
            <AdminReturns darkMode={darkMode} />
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
          ) : adminCollection === 'analytics' || adminCollection === 'map' ? (
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
                  onDelete={(id) => handleDeleteItem(null, id, adminCollection)}
                  onMarkAsSold={(item) => handleMarkAsSold(item, adminCollection)}
                  onMarkAsAvailable={(item) => handleMarkAsAvailable(item, adminCollection)}
                />
              </div>
            </>
          )}
        </Suspense>
        </section>
        </div>
      </main>
    </div>
  );
}

export default function AdminAppIsland(props) {
  return <AdminContent {...props} />;
}
