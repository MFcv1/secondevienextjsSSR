'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CheckoutView from '../../src/kit/commerce/CheckoutView';
import OrderSuccessModal from '../../src/kit/commerce/OrderSuccessModal';
import { useAuth } from '../../src/kit/contexts/AuthContext';
import { getDb, loadFirestoreModule } from '../../src/kit/config/firebaseLazy';
import {
  clearCheckoutCartHandoff,
  clearGuestCart,
  getCartDocumentId,
  GUEST_CART_CHANGED_EVENT,
  readCheckoutCartHandoff,
  readGuestCart,
} from '../../src/kit/commerce/guestCart';

const getCartTotal = (items) => (
  items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0)
);

const getUserCartPayload = (item = {}, serverTimestamp) => ({
  originalId: item.originalId || item.productId || item.id,
  collectionName: item.collectionName || 'furniture',
  name: item.name || item.title || 'Piece Seconde Vie',
  price: Number(item.price || item.currentPrice || item.startingPrice || 0),
  stock: Number(item.stock || 0),
  sold: Boolean(item.sold),
  priceOnRequest: Boolean(item.priceOnRequest),
  image: item.image || item.imageUrl || '',
  material: item.material || 'Bois',
  quantity: Number(item.quantity || 1),
  addedAt: serverTimestamp(),
});

const migrateGuestCartToUserCart = async (db, firestore, user) => {
  const guestItems = readGuestCart();
  if (!user || guestItems.length === 0) return false;

  const batch = firestore.writeBatch(db);
  let hasWrites = false;
  guestItems.forEach((item) => {
    const cartDocId = getCartDocumentId(item);
    if (!cartDocId) return;
    batch.set(
      firestore.doc(db, 'users', user.uid, 'cart', cartDocId),
      getUserCartPayload(item, firestore.serverTimestamp),
      { merge: true }
    );
    hasWrites = true;
  });

  if (!hasWrites) return false;
  await batch.commit();
  clearGuestCart();
  return true;
};

function CheckoutPageContent() {
  const { user, loading } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [orderSuccessMethod, setOrderSuccessMethod] = useState('');
  const [checkoutReturnNotice, setCheckoutReturnNotice] = useState('');
  const [cartLoading, setCartLoading] = useState(true);
  const handledStripeReturnRef = useRef(false);

  useEffect(() => {
    try {
      setDarkMode(window.localStorage.getItem('darkMode') === 'true');
    } catch {
      setDarkMode(false);
    }
  }, []);

  useEffect(() => {
    const handoffItems = readCheckoutCartHandoff();
    if (handoffItems.length === 0) return;
    setCartItems(handoffItems);
    setCartLoading(false);
  }, []);

  useEffect(() => {
    if (!user) {
      setCartItems(readGuestCart());
      setCartLoading(false);
      return undefined;
    }

    let cancelled = false;
    let unsubscribe = null;
    const handoffItems = readCheckoutCartHandoff();
    const guestItems = readGuestCart();
    const fallbackItems = handoffItems.length > 0 ? handoffItems : guestItems;
    if (fallbackItems.length > 0) {
      setCartItems(fallbackItems);
      setCartLoading(false);
    } else {
      setCartLoading(true);
    }

    Promise.all([getDb(), loadFirestoreModule()])
      .then(async ([db, firestore]) => {
        if (cancelled) return;
        await migrateGuestCartToUserCart(db, firestore, user);
        if (cancelled) return;
        const { collection, onSnapshot, query } = firestore;
        unsubscribe = onSnapshot(
          query(collection(db, 'users', user.uid, 'cart')),
          (snap) => {
            setCartItems(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
            clearCheckoutCartHandoff();
            setCartLoading(false);
          },
          (error) => {
            setCartLoading(false);
            console.error('Checkout cart sync error:', error);
          }
        );
      })
      .catch((error) => {
        if (!cancelled) {
          setCartLoading(false);
          console.error('Checkout cart sync error:', error);
        }
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
      clearCheckoutCartHandoff();
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
    clearCheckoutCartHandoff();
    setCartItems([]);
  }, [cartItems, user]);

  const handlePlaceOrder = async (orderData = {}) => {
    await clearCartAfterOrder();
    setOrderSuccessMethod(orderData.paymentMethod || 'deferred');
    setShowOrderSuccess(true);
  };

  const closeOrderSuccess = () => {
    setShowOrderSuccess(false);
    window.location.href = '/';
  };

  const viewOrderAfterSuccess = () => {
    setShowOrderSuccess(false);
    window.location.href = '/mes-commandes';
  };

  const handleContinueShopping = useCallback(() => {
    window.location.href = '/';
  }, []);

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

  if (loading || cartLoading) {
    return <div className="min-h-screen bg-[#FAFAF9]" />;
  }

  if (cartItems.length === 0) {
    return (
      <CheckoutState
        darkMode={darkMode}
        title="Panier vide"
        message="Ajoutez une piece depuis la galerie avant de lancer le checkout."
        primaryLabel="Retour galerie"
        onPrimary={() => { window.location.href = '/'; }}
      />
    );
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
        onBack={handleContinueShopping}
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

function CheckoutState({
  darkMode,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel = '',
  onSecondary,
}) {
  return (
    <section className="min-h-[60vh] px-5 py-20">
      <div className={`mx-auto max-w-lg rounded-3xl border px-6 py-8 text-center shadow-xl md:px-10 md:py-12 ${darkMode ? 'border-stone-800 bg-stone-900 text-stone-100' : 'border-stone-100 bg-white text-stone-950'}`}>
        <h1 className="font-serif text-3xl font-normal tracking-tight">{title}</h1>
        <p className={`mt-4 text-sm leading-6 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>{message}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onPrimary}
            className={`rounded-md px-5 py-3 text-xs font-black uppercase tracking-[0.18em] ${darkMode ? 'bg-stone-100 text-stone-950' : 'bg-stone-950 text-white'}`}
          >
            {primaryLabel}
          </button>
          {secondaryLabel ? (
            <button
              type="button"
              onClick={onSecondary}
              className={`rounded-md border px-5 py-3 text-xs font-black uppercase tracking-[0.18em] ${darkMode ? 'border-stone-700 text-stone-200' : 'border-stone-200 text-stone-700'}`}
            >
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
