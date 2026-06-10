'use client';

import { useEffect, useState } from 'react';
import MyOrdersView from '../../src/kit/commerce/MyOrdersView';
import LoginView from '../../src/kit/commerce/LoginView';
import { useAuth } from '../../src/kit/contexts/AuthContext';

function OrdersPageContent({ initialItems = [] }) {
  const { user, loading, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    try {
      setDarkMode(window.localStorage.getItem('darkMode') === 'true');
    } catch {
      setDarkMode(false);
    }
  }, []);

  if (loading) return <div className="min-h-screen bg-[#FAFAF9]" />;
  if (!user || user.isAnonymous) {
    return (
      <LoginView
        onSuccess={() => {}}
        title="Mes commandes"
        subtitle="Connectez-vous pour suivre vos commandes"
        emailPlaceholder="Email client"
      />
    );
  }

  return (
    <MyOrdersView
      user={user}
      onBack={() => { window.location.href = '/galerie'; }}
      darkMode={darkMode}
      activeDesignId="architectural"
      wishlistItems={[]}
      items={initialItems}
      onOpenWishlist={() => { window.location.href = '/wishlist'; }}
      onLogout={logout}
    />
  );
}

export default function OrdersPageIsland(props) {
  return <OrdersPageContent {...props} />;
}
