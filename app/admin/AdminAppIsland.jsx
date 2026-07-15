'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  BarChart3,
  ChevronLeft,
  CreditCard,
  Gauge,
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
  Users,
  Package,
} from 'lucide-react';
import LoginView from '../../src/kit/commerce/LoginView';
import { useAuth } from '../../src/kit/contexts/AuthContext';
import KIT_CONFIG from '../../src/kit/config/constants';
import { appId } from '../../src/kit/config/firebaseEnv';
import { getDb, loadFirestoreModule } from '../../src/kit/config/firebaseLazy';
import { getProductUrl } from '../../src/utils/slug';
import AdminSidebar from './AdminSidebar';

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
const AdminAnalytics = React.lazy(() => import('../../src/kit/admin/AdminDataStudio'));
const AdminSEO = React.lazy(() => import('../../src/kit/admin/AdminSEO'));
const AdminIPManager = React.lazy(() => import('../../src/kit/admin/AdminIPManager'));
const AdminPaymentSettings = React.lazy(() => import('../../src/kit/admin/AdminPaymentSettings'));
const AdminIPTracker = React.lazy(() => import('../../src/kit/admin/AdminIPTracker'));
const AdminGlobalInventory = React.lazy(() => import('../../src/kit/admin/GlobalInventoryView'));
const AdminMaintenance = React.lazy(() => import('../../src/kit/admin/AdminMaintenance'));
const PerformanceArchitectureStudy = React.lazy(() => import('../../src/kit/admin/PerformanceArchitectureStudy'));
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
  performance_study: Gauge,
};

const COLLECTION_ICONS = [Layout, LayoutPanelTop];

const adminTabs = KIT_CONFIG.adminTabs.map((tab, index) => ({
  ...tab,
  icon: TAB_ICONS[tab.id] ?? COLLECTION_ICONS[index % COLLECTION_ICONS.length],
}));

const ADMIN_NAV_GROUPS = [
  { label: "Vue d'ensemble", tabs: ['dashboard', 'analytics'] },
  { label: 'Catalogue', tabs: ['furniture', 'inventory', 'studio'] },
  { label: 'Ventes', tabs: ['orders', 'returns', 'livraison', 'payment_settings'] },
  { label: 'Communication', tabs: ['homepage', 'newsletter', 'seo'] },
  { label: 'Administration', tabs: ['users', 'ip_manager', 'maintenance', 'performance_study'] },
];

const getAdminFirestoreRuntime = async () => {
  const [{ bumpPublicCatalogVersion }, db, firestore] = await Promise.all([
    import('../../src/kit/admin/publicCatalogInvalidation'),
    getDb(),
    loadFirestoreModule(),
  ]);
  return { db, firestore, bumpPublicCatalogVersion };
};

function AdminContent({ initialItems = [] }) {
  const { user, isAdmin, hasStrongAuth, loading } = useAuth();
  const [adminCollection, setAdminCollection] = useState('dashboard');
  const [editingItem, setEditingItem] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [stepUpOpen, setStepUpOpen] = useState(false);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem('darkMode') === 'true';
      setDarkMode(stored);
      document.documentElement.classList.toggle('dark', stored);
    } catch {
      setDarkMode(false);
    }
  }, []);

  const handleToggleStatus = async (item, collectionName) => {
    const { db, firestore, bumpPublicCatalogVersion } = await getAdminFirestoreRuntime();
    const { doc, updateDoc } = firestore;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, item.id), {
      status: item.status === 'published' ? 'draft' : 'published',
    });
    await bumpPublicCatalogVersion('product_status_changed', {
      productId: item.id,
      categoryIds: item.category ? [item.category] : [],
      paths: [getProductUrl(item)],
    });
  };

  const handleDeleteItem = async (_year, id, collectionName) => {
    if (!window.confirm('Supprimer ?')) return;
    const { db, firestore, bumpPublicCatalogVersion } = await getAdminFirestoreRuntime();
    const { deleteDoc, doc } = firestore;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, id));
    await bumpPublicCatalogVersion('product_deleted', { productId: id });
  };

  const handleMarkAsSold = async (item, collectionName) => {
    if (!window.confirm(`Marquer "${item.name}" comme VENDU ? (Stock a 0)`)) return;
    const { db, firestore, bumpPublicCatalogVersion } = await getAdminFirestoreRuntime();
    const { doc, serverTimestamp, updateDoc } = firestore;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, item.id), {
      sold: true,
      stock: 0,
      soldAt: serverTimestamp(),
    });
    await bumpPublicCatalogVersion('product_sold', {
      productId: item.id,
      categoryIds: item.category ? [item.category] : [],
      paths: [getProductUrl(item)],
    });
  };

  const handleMarkAsAvailable = async (item, collectionName) => {
    if (!window.confirm(`Remettre "${item.name}" en vente ? (Stock a 1)`)) return;
    const { db, firestore, bumpPublicCatalogVersion } = await getAdminFirestoreRuntime();
    const { doc, updateDoc } = firestore;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, item.id), {
      sold: false,
      stock: 1,
      soldAt: null,
    });
    await bumpPublicCatalogVersion('product_available', {
      productId: item.id,
      categoryIds: item.category ? [item.category] : [],
      paths: [getProductUrl(item)],
    });
  };

  if (loading) return <div className="min-h-screen bg-[#faf9f5]" />;
  if (!user) return <LoginView onSuccess={() => {}} />;
  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-5 px-6 text-center text-stone-900">
        <h1 className="text-3xl font-black tracking-tight">Acces admin refuse</h1>
        <p className="text-sm text-stone-500">Ce compte n'a pas les droits administrateur.</p>
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

  if (adminCollection === 'performance_study') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#faf9f5]" />}>
        <PerformanceArchitectureStudy
          seo={false}
          onBack={() => {
            setAdminCollection('dashboard');
            window.scrollTo(0, 0);
          }}
        />
      </Suspense>
    );
  }

  const selectAdminTab = (tabId) => {
    setAdminCollection(tabId);
    setEditingItem(null);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isDataWorkspace = adminCollection === 'analytics' || adminCollection === 'map';

  return (
    <div className={`min-h-screen ${darkMode || isDataWorkspace ? 'bg-[#080807] text-white' : 'bg-[#FAFAF9] text-stone-900'}`}>
      <AdminSidebar
        activeTabId={adminCollection}
        dataMode={isDataWorkspace}
        darkMode={darkMode || isDataWorkspace}
        groups={ADMIN_NAV_GROUPS}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelect={selectAdminTab}
        tabs={adminTabs}
      />

      <div className="min-h-screen lg:pl-[17.5rem]">
        <main className={isDataWorkspace ? 'min-h-screen' : 'mx-auto max-w-[100rem] space-y-8 px-4 py-8 sm:px-6 lg:px-10 lg:py-10'}>
        <Suspense fallback={null}>
          <AdminIPTracker />
        </Suspense>

        {!isDataWorkspace ? <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
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
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Systeme de Controle</p>
              <h2 className="text-3xl font-black tracking-tighter md:text-4xl">Gestion Boutique</h2>
            </div>
          </div>
          <Link
            href="/"
            className={`group flex items-center gap-2 rounded-2xl border-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${darkMode ? 'border-white/10 hover:border-white hover:bg-white hover:text-stone-900' : 'border-stone-900 hover:bg-stone-900 hover:text-white'}`}
          >
            <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-1" />
            Retour au site
          </Link>
        </div> : null}

        <Suspense fallback={<div className={`flex min-h-[50vh] items-center justify-center ${isDataWorkspace ? 'bg-[#080807]' : ''}`}><div className={`h-10 w-10 animate-spin rounded-full border-4 ${isDataWorkspace ? 'border-white/10 border-t-[#ec8546]' : 'border-stone-200 border-t-stone-800'}`} /></div>}>
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
            <AdminAnalytics
              catalogItems={initialItems}
              onOpenNavigation={() => setIsSidebarOpen(true)}
            />
          ) : adminCollection === 'payment_settings' ? (
            <AdminPaymentSettings darkMode={darkMode} />
          ) : adminCollection === 'inventory' ? (
            <AdminGlobalInventory
              items={initialItems}
              darkMode={darkMode}
              onEdit={(item) => {
                setAdminCollection('furniture');
                setEditingItem(item);
                window.scrollTo(0, 0);
              }}
            />
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
      </main>
      </div>
    </div>
  );
}

export default function AdminAppIsland(props) {
  return <AdminContent {...props} />;
}
