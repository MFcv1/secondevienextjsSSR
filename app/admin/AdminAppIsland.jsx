'use client';

import React, { Suspense, useState } from 'react';
import {
  Activity,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  CreditCard,
  Gauge,
  Globe,
  Grid,
  Layout,
  LayoutPanelTop,
  Mail,
  Palette,
  RefreshCw,
  Share2,
  Users,
  Package,
} from 'lucide-react';
import LoginView from '../../src/kit/commerce/LoginView';
import { useAuth } from '../../src/kit/contexts/AuthContext';
import KIT_CONFIG from '../../src/kit/config/constants';
import { appId } from '../../src/kit/config/firebaseEnv';
import { getDb, loadFirestoreModule } from '../../src/kit/config/firebaseLazy';
import { getProductUrl } from '../../src/utils/slug';

const AdminDashboard = React.lazy(() => import('../../src/kit/admin/AdminDashboard'));
const AdminHomepage = React.lazy(() => import('../../src/kit/admin/AdminHomepage'));
const AdminOrders = React.lazy(() => import('../../src/kit/admin/AdminOrders'));
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
const PerformanceArchitectureStudy = React.lazy(() => import('../../src/kit/admin/PerformanceArchitectureStudy'));

const TAB_ICONS = {
  dashboard: Activity,
  analytics: BarChart3,
  studio: Palette,
  homepage: Palette,
  orders: Package,
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

const getAdminFirestoreRuntime = async () => {
  const [{ bumpPublicCatalogVersion }, db, firestore] = await Promise.all([
    import('../../src/kit/admin/publicCatalogInvalidation'),
    getDb(),
    loadFirestoreModule(),
  ]);
  return { db, firestore, bumpPublicCatalogVersion };
};

function AdminContent({ initialItems = [] }) {
  const { user, isAdmin, loading } = useAuth();
  const [adminCollection, setAdminCollection] = useState('dashboard');
  const [editingItem, setEditingItem] = useState(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

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
        <a className="rounded-full bg-stone-950 px-5 py-3 text-sm font-bold text-white" href="/">
          Retour au site
        </a>
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

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0A0A0A] text-white' : 'bg-[#FAFAF9] text-stone-900'}`}>
      <main className="mx-auto max-w-6xl space-y-12 px-4 py-24 md:space-y-16 md:py-32">
        <Suspense fallback={null}>
          <AdminIPTracker />
        </Suspense>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Systeme de Controle</p>
            <h2 className="text-4xl font-black tracking-tighter md:text-5xl">Gestion Boutique</h2>
          </div>
          <a
            href="/galerie"
            className={`group flex items-center gap-2 rounded-2xl border-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${darkMode ? 'border-white/10 hover:border-white hover:bg-white hover:text-stone-900' : 'border-stone-900 hover:bg-stone-900 hover:text-white'}`}
          >
            <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-1" />
            Retour au site
          </a>
        </div>

        <div className="relative flex flex-col items-center">
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
                    onClick={() => {
                      setAdminCollection(tab.id);
                      setEditingItem(null);
                      setIsMoreMenuOpen(false);
                    }}
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
                      onClick={() => {
                        setAdminCollection(tab.id);
                        setEditingItem(null);
                        setIsMoreMenuOpen(false);
                      }}
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
            <AdminAnalytics darkMode={darkMode} />
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
  );
}

export default function AdminAppIsland(props) {
  return <AdminContent {...props} />;
}

