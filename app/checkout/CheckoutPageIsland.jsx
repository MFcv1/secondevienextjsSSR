'use client';

import { useEffect, useMemo, useState } from 'react';
import CheckoutView from '../../src/kit/commerce/CheckoutView';
import OrderSuccessModal from '../../src/kit/commerce/OrderSuccessModal';
import { useAuth } from '../../src/kit/contexts/AuthContext';
import { getDb, loadFirestoreModule } from '../../src/kit/config/firebaseLazy';
import { clearGuestCart, GUEST_CART_CHANGED_EVENT, readGuestCart } from '../../src/kit/commerce/guestCart';

const getCartTotal = (items) => (
  items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0)
);

function CheckoutPageContent() {
  const { user, loading } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [orderSuccessMethod, setOrderSuccessMethod] = useState('');

  useEffect(() => {
    try {
      setDarkMode(window.localStorage.getItem('darkMode') === 'true');
    } catch {
      setDarkMode(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setCartItems(readGuestCart());
      return undefined;
    }

    let cancelled = false;
    let unsubscribe = null;

    Promise.all([getDb(), loadFirestoreModule()])
      .then(([db, { collection, onSnapshot, query }]) => {
        if (cancelled) return;
        unsubscribe = onSnapshot(
          query(collection(db, 'users', user.uid, 'cart')),
          (snap) => setCartItems(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))),
          (error) => console.error('Checkout cart sync error:', error)
        );
      })
      .catch((error) => {
        if (!cancelled) console.error('Checkout cart sync error:', error);
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [user]);

  useEffect(() => {
    if (user) return undefined;

    const handleGuestCartChanged = (event) => {
      setCartItems(Array.isArray(event.detail?.items) ? event.detail.items : readGuestCart());
    };

    window.addEventListener(GUEST_CART_CHANGED_EVENT, handleGuestCartChanged);
    return () => window.removeEventListener(GUEST_CART_CHANGED_EVENT, handleGuestCartChanged);
  }, [user]);

  const total = useMemo(() => getCartTotal(cartItems), [cartItems]);

  const clearCartAfterOrder = async () => {
    if (cartItems.length === 0) return;
    if (!user) {
      clearGuestCart();
      setCartItems([]);
      return;
    }
    const [db, { doc, writeBatch }] = await Promise.all([getDb(), loadFirestoreModule()]);
    const batch = writeBatch(db);
    cartItems.forEach((item) => {
      batch.delete(doc(db, 'users', user.uid, 'cart', item.id));
    });
    await batch.commit();
    setCartItems([]);
  };

  const handlePlaceOrder = async (orderData = {}) => {
    await clearCartAfterOrder();
    setOrderSuccessMethod(orderData.paymentMethod || 'deferred');
    setShowOrderSuccess(true);
  };

  const closeOrderSuccess = () => {
    setShowOrderSuccess(false);
    window.location.href = '/galerie';
  };

  if (loading) {
    return <div className="min-h-screen bg-[#FAFAF9]" />;
  }

  return (
    <>
      <CheckoutView
        cartItems={cartItems}
        total={total}
        user={user}
        darkMode={darkMode}
        onBack={() => { window.location.href = '/galerie'; }}
        onPlaceOrder={handlePlaceOrder}
      />
      {showOrderSuccess ? (
        <OrderSuccessModal
          paymentMethod={orderSuccessMethod}
          onClose={closeOrderSuccess}
        />
      ) : null}
    </>
  );
}

export default function CheckoutPageIsland() {
  return <CheckoutPageContent />;
}
