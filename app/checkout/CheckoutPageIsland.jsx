'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  writeGuestCart,
} from '../../src/kit/commerce/guestCart';
import {
  clearCheckoutRecoveryDescriptor,
  COMMERCE_V2_RECOVERY_ENABLED,
  getCheckoutRecoveryTerminalMessage,
  getCheckoutRecoveryTerminalReason,
  isPurchasedCartLineUnchanged,
  readCheckoutRecoveryDescriptor,
} from '../../src/kit/commerce/checkoutRecovery';
import {
  COMMERCE_V2_CONSUMERS_ENABLED,
  ensureCheckoutAnonymousIdentity,
  resumeCheckoutV2,
} from '../../src/kit/commerce/commerceV2Client';
import { adaptCommerceOrder } from '../../src/kit/commerce/orderAdapter';
import {
  persistGate8FixtureContext,
  readGate8FixtureCart,
  readGate8FixtureContext,
  restoreGate8FixtureContext,
} from '../../src/kit/commerce/gate8FixtureSession';

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
  cartLineId: item.cartLineId,
  cartRevision: Number.isSafeInteger(item.cartRevision) ? item.cartRevision : 1,
  addedAt: serverTimestamp(),
});

const migrateGuestCartToUserCart = async (db, firestore, user) => {
  const guestItems = readGuestCart();
  if (!user || guestItems.length === 0) return false;

  for (const item of guestItems) {
    const cartDocId = getCartDocumentId(item);
    if (!cartDocId) continue;
    const cartRef = firestore.doc(db, 'users', user.uid, 'cart', cartDocId);
    await firestore.runTransaction(db, async (transaction) => {
      const currentSnapshot = await transaction.get(cartRef);
      const current = currentSnapshot.exists() ? currentSnapshot.data() : null;
      transaction.set(cartRef, {
        ...getUserCartPayload(item, firestore.serverTimestamp),
        cartLineId: current?.cartLineId || item.cartLineId,
        cartRevision: Number.isSafeInteger(current?.cartRevision)
          ? current.cartRevision + 1
          : item.cartRevision,
      }, { merge: true });
    });
  }
  clearGuestCart();
  return true;
};

function CheckoutPageContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [orderSuccessMethod, setOrderSuccessMethod] = useState('');
  const [orderSuccessNumber, setOrderSuccessNumber] = useState(null);
  const [checkoutReturnNotice, setCheckoutReturnNotice] = useState('');
  const [cartLoading, setCartLoading] = useState(true);
  const [fixtureContext, setFixtureContext] = useState(null);
  const [fixtureCartItems, setFixtureCartItems] = useState([]);
  const [checkoutRecoveryChecked, setCheckoutRecoveryChecked] = useState(!COMMERCE_V2_CONSUMERS_ENABLED);
  const [hasRecoverableCheckout, setHasRecoverableCheckout] = useState(false);
  const handledStripeReturnRef = useRef(false);

  useEffect(() => {
    if (!COMMERCE_V2_CONSUMERS_ENABLED) return undefined;
    let cancelled = false;
    ensureCheckoutAnonymousIdentity()
      .then((identity) => {
        if (cancelled) return;
        const descriptor = readCheckoutRecoveryDescriptor(identity.uid, {
          enabled: COMMERCE_V2_RECOVERY_ENABLED,
        });
        setHasRecoverableCheckout(Boolean(descriptor));
      })
      .catch((error) => {
        console.error('Checkout recovery identity failed:', error);
      })
      .finally(() => {
        if (!cancelled) setCheckoutRecoveryChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    try {
      setDarkMode(window.localStorage.getItem('darkMode') === 'true');
    } catch {
      setDarkMode(false);
    }
  }, []);

  useEffect(() => {
    const fromUrl = readGate8FixtureContext(window.location.search);
    const context = fromUrl
      ? persistGate8FixtureContext(fromUrl)
      : restoreGate8FixtureContext();
    setFixtureContext(context);
    setFixtureCartItems(readGate8FixtureCart(window.location.search, context));
  }, []);

  useEffect(() => {
    if (fixtureCartItems.length > 0) {
      setCartItems(fixtureCartItems);
      setCartLoading(false);
      return;
    }
    const handoffItems = readCheckoutCartHandoff();
    if (handoffItems.length === 0) return;
    setCartItems(handoffItems);
    setCartLoading(false);
  }, [fixtureCartItems]);

  useEffect(() => {
    if (fixtureCartItems.length > 0) {
      setCartItems(fixtureCartItems);
      setCartLoading(false);
      return undefined;
    }
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
  }, [fixtureCartItems, user]);

  useEffect(() => {
    if (user) return undefined;

    const handleGuestCartChanged = (event) => {
      setCartItems(Array.isArray(event.detail?.items) ? event.detail.items : readGuestCart());
    };

    window.addEventListener(GUEST_CART_CHANGED_EVENT, handleGuestCartChanged);
    return () => window.removeEventListener(GUEST_CART_CHANGED_EVENT, handleGuestCartChanged);
  }, [user]);

  const total = useMemo(() => getCartTotal(cartItems), [cartItems]);

  const clearCartAfterOrder = useCallback(async (purchasedCartLines = []) => {
    if (!Array.isArray(purchasedCartLines) || purchasedCartLines.length === 0) {
      return;
    }
    const purchasedByLineId = new Map(
      purchasedCartLines.map((line) => [line.cartLineId, line])
    );
    if (!user) {
      const remaining = readGuestCart().filter((line) => {
        const purchased = purchasedByLineId.get(line.cartLineId);
        return !isPurchasedCartLineUnchanged(line, purchased);
      });
      clearCheckoutCartHandoff();
      writeGuestCart(remaining);
      setCartItems(remaining);
      return;
    }
    const [db, { collection, doc, getDocs, writeBatch }] = await Promise.all([getDb(), loadFirestoreModule()]);
    const cartSnap = await getDocs(collection(db, 'users', user.uid, 'cart'));
    const batch = writeBatch(db);
    let deleteCount = 0;
    cartSnap.docs.forEach((docSnap) => {
      const line = docSnap.data();
      const purchased = purchasedByLineId.get(line.cartLineId);
      if (!isPurchasedCartLineUnchanged(line, purchased)) return;
      batch.delete(doc(db, 'users', user.uid, 'cart', docSnap.id));
      deleteCount += 1;
    });
    if (deleteCount > 0) await batch.commit();
    clearCheckoutCartHandoff();
  }, [user]);

  const handleRecoveryTerminal = useCallback(async (reason, purchasedCartLines = []) => {
    clearCheckoutRecoveryDescriptor({ enabled: COMMERCE_V2_RECOVERY_ENABLED });
    setHasRecoverableCheckout(false);
    setCheckoutReturnNotice(getCheckoutRecoveryTerminalMessage(reason));
    if (reason !== 'paid') return;
    try {
      await clearCartAfterOrder(purchasedCartLines);
    } catch (error) {
      console.error('Paid checkout recovery cart cleanup failed:', error);
    }
  }, [clearCartAfterOrder]);

  const handlePlaceOrder = async (orderData = {}) => {
    setOrderSuccessMethod(orderData.paymentMethod || 'deferred');
    setOrderSuccessNumber(Number.isSafeInteger(orderData.orderNumber) ? orderData.orderNumber : null);
    setShowOrderSuccess(true);
    try {
      await clearCartAfterOrder(orderData.purchasedCartLines || []);
      clearCheckoutRecoveryDescriptor({ enabled: COMMERCE_V2_RECOVERY_ENABLED });
    } catch (error) {
      console.error('Paid order cart cleanup failed:', error);
    }
  };

  const closeOrderSuccess = () => {
    setShowOrderSuccess(false);
    router.push('/');
  };

  const viewOrderAfterSuccess = () => {
    setShowOrderSuccess(false);
    router.push('/mes-commandes');
  };

  const handleContinueShopping = useCallback(() => {
    router.push('/');
  }, [router]);

  useEffect(() => {
    if (handledStripeReturnRef.current || typeof window === 'undefined') return undefined;

    const params = new URLSearchParams(window.location.search);
    const isStripeReturn = params.get('order_success') === 'true';
    const orderId = params.get('order_id');
    const paymentIntentClientSecret = params.get('payment_intent_client_secret');
    const redirectStatus = params.get('redirect_status');

    const recoveryDescriptor = user
      ? readCheckoutRecoveryDescriptor(user.uid, {
          enabled: COMMERCE_V2_RECOVERY_ENABLED,
        })
      : null;
    const recoverableOrderId = recoveryDescriptor?.orderId || orderId;

    // La reprise simple apres fermeture/reload est geree dans CheckoutView afin
    // de rouvrir le Payment Element. Cette branche reste reservee au retour
    // Stripe, dont elle confirme le statut durable avant de nettoyer le panier.
    if (!isStripeReturn) return undefined;
    if (!recoverableOrderId || (COMMERCE_V2_CONSUMERS_ENABLED && !user)) {
      return undefined;
    }
    if (paymentIntentClientSecret) {
      console.info('Stripe redirect returned a payment intent client secret; waiting for server-side order confirmation.');
    }

    handledStripeReturnRef.current = true;
    let unsubscribe = null;
    let timeoutId = null;
    let cancelled = false;

    if (redirectStatus && !['succeeded', 'processing'].includes(redirectStatus)) {
      setCheckoutReturnNotice('Le paiement n’a pas été finalisé. Vos articles sont toujours là et vous pouvez reprendre quand vous le souhaitez.');
      window.history.replaceState({}, '', '/checkout');
      return undefined;
    }

    const resumePromise = COMMERCE_V2_CONSUMERS_ENABLED
      ? resumeCheckoutV2(recoverableOrderId)
      : Promise.resolve(null);

    Promise.all([resumePromise, getDb(), loadFirestoreModule()])
      .then(([, db, { doc, onSnapshot }]) => {
        if (cancelled) return;
        timeoutId = window.setTimeout(() => {
          if (cancelled) return;
          window.history.replaceState({}, '', '/checkout');
        }, 45000);
        unsubscribe = onSnapshot(doc(db, 'orders', recoverableOrderId), async (snap) => {
          if (!snap.exists()) return;
          const order = snap.data();
          const projection = adaptCommerceOrder(order, recoverableOrderId);
          const isPaid = projection.schemaVersion === 2
            ? projection.paymentStatus === 'succeeded'
            : projection.status === 'paid';
          if (!isPaid) return;
          if (cancelled) return;
          cancelled = true;
          window.clearTimeout(timeoutId);
          unsubscribe?.();
          setOrderSuccessMethod('stripe_elements');
          setOrderSuccessNumber(Number.isSafeInteger(order.orderNumber) ? order.orderNumber : null);
          setCheckoutReturnNotice('');
          setShowOrderSuccess(true);
          window.history.replaceState({}, '', '/checkout');
          try {
            await clearCartAfterOrder(
              recoveryDescriptor?.cartLines || cartItems.map((item) => ({
                cartLineId: item.cartLineId,
                cartRevision: item.cartRevision,
              }))
            );
            clearCheckoutRecoveryDescriptor({
              enabled: COMMERCE_V2_RECOVERY_ENABLED,
            });
          } catch (error) {
            console.error('Stripe return cart cleanup failed:', error);
          }
        }, (error) => {
          console.error('Stripe return confirmation error:', error);
          window.history.replaceState({}, '', '/checkout');
        });
      })
      .catch((error) => {
        const terminalReason = getCheckoutRecoveryTerminalReason(error);
        if (terminalReason) {
          handleRecoveryTerminal(terminalReason);
        } else {
          console.error('Stripe return setup error:', error);
        }
        window.history.replaceState({}, '', '/checkout');
      });

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      unsubscribe?.();
    };
  }, [cartItems, clearCartAfterOrder, handleRecoveryTerminal, user]);

  if (loading || cartLoading || !checkoutRecoveryChecked) {
    return <div className="min-h-screen bg-[#FAFAF9]" />;
  }

  if (cartItems.length === 0 && !hasRecoverableCheckout && !showOrderSuccess) {
    return (
      <CheckoutState
        darkMode={darkMode}
        title={checkoutReturnNotice ? 'Réservation terminée' : 'Panier vide'}
        message={checkoutReturnNotice || 'Ajoutez une pièce depuis la galerie pour commencer votre commande.'}
        primaryLabel="Retour galerie"
        onPrimary={() => { router.push('/'); }}
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
        key={hasRecoverableCheckout ? 'recovering-checkout' : 'fresh-checkout'}
        cartItems={cartItems}
        total={total}
        user={user}
        darkMode={darkMode}
        onBack={handleContinueShopping}
        onPlaceOrder={handlePlaceOrder}
        fixtureContext={fixtureContext}
        recoveryExpected={hasRecoverableCheckout}
        onRecoveryTerminal={handleRecoveryTerminal}
      />
      {showOrderSuccess ? (
        <OrderSuccessModal
          paymentMethod={orderSuccessMethod}
          orderNumber={orderSuccessNumber}
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
