'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [checkoutReturnNotice, setCheckoutReturnNotice] = useState('');
  const handledStripeReturnRef = useRef(false);

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

  const clearCartAfterOrder = useCallback(async () => {
    if (!user) {
      clearGuestCart();
      setCartItems([]);
      return;
    }
    const [db, { collection, doc, getDocs, writeBatch }] = await Promise.all([getDb(), loadFirestoreModule()]);
    const batch = writeBatch(db);
    let itemsToDelete = cartItems;
    if (itemsToDelete.length === 0) {
      const cartSnap = await getDocs(collection(db, 'users', user.uid, 'cart'));
      itemsToDelete = cartSnap.docs.map((docSnap) => ({ id: docSnap.id }));
    }
    if (itemsToDelete.length === 0) return;
    itemsToDelete.forEach((item) => {
      batch.delete(doc(db, 'users', user.uid, 'cart', item.id));
    });
    await batch.commit();
    setCartItems([]);
  }, [cartItems, user]);

  const handlePlaceOrder = async (orderData = {}) => {
    await clearCartAfterOrder();
    setOrderSuccessMethod(orderData.paymentMethod || 'deferred');
    setShowOrderSuccess(true);
  };

  const closeOrderSuccess = () => {
    setShowOrderSuccess(false);
    window.location.href = '/galerie';
  };

  const viewOrderAfterSuccess = () => {
    setShowOrderSuccess(false);
    window.location.href = '/mes-commandes';
  };

  useEffect(() => {
    if (handledStripeReturnRef.current || typeof window === 'undefined') return undefined;

    const params = new URLSearchParams(window.location.search);
    const isStripeReturn = params.get('order_success') === 'true';
    const orderId = params.get('order_id');
    const paymentIntentClientSecret = params.get('payment_intent_client_secret');
    const redirectStatus = params.get('redirect_status');

    if (!isStripeReturn || !orderId) return undefined;
    if (paymentIntentClientSecret) {
      console.info('Stripe redirect returned a payment intent client secret; waiting for server-side order confirmation.');
    }

    handledStripeReturnRef.current = true;
    let unsubscribe = null;
    let timeoutId = null;
    let cancelled = false;

    if (redirectStatus && !['succeeded', 'processing'].includes(redirectStatus)) {
      setCheckoutReturnNotice('Paiement annule ou non finalise. Votre panier est conserve, vous pouvez reprendre le paiement.');
      window.history.replaceState({}, '', '/checkout');
      return undefined;
    }

    Promise.all([getDb(), loadFirestoreModule()])
      .then(([db, { doc, onSnapshot }]) => {
        if (cancelled) return;
        timeoutId = window.setTimeout(() => {
          if (cancelled) return;
          window.history.replaceState({}, '', '/checkout');
        }, 45000);
        unsubscribe = onSnapshot(doc(db, 'orders', orderId), async (snap) => {
          if (!snap.exists()) return;
          const order = snap.data();
          if (order.status !== 'paid') return;
          if (cancelled) return;
          cancelled = true;
          window.clearTimeout(timeoutId);
          unsubscribe?.();
          await clearCartAfterOrder();
          setOrderSuccessMethod('stripe_elements');
          setCheckoutReturnNotice('');
          setShowOrderSuccess(true);
          window.history.replaceState({}, '', '/checkout');
        }, (error) => {
          console.error('Stripe return confirmation error:', error);
          window.history.replaceState({}, '', '/checkout');
        });
      })
      .catch((error) => {
        console.error('Stripe return setup error:', error);
        window.history.replaceState({}, '', '/checkout');
      });

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      unsubscribe?.();
    };
  }, [cartItems, clearCartAfterOrder, user]);

  if (loading) {
    return <div className="min-h-screen bg-[#FAFAF9]" />;
  }

  return (
    <>
      {checkoutReturnNotice ? (
        <div className="fixed left-1/2 top-24 z-[250] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800 shadow-xl shadow-amber-200/30">
          {checkoutReturnNotice}
        </div>
      ) : null}
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
          onViewOrders={viewOrderAfterSuccess}
        />
      ) : null}
    </>
  );
}

export default function CheckoutPageIsland() {
  return <CheckoutPageContent />;
}
