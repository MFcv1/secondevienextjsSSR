import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Elements } from '@stripe/react-stripe-js';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getStripePromise, isStripeConfigured } from '../config/stripe';
import { db, functions } from '../config/firebase';
import { getFunctionTarget } from '../config/functionTargets';
import CheckoutPaymentStep from './CheckoutPaymentStep';
import { COMMERCE_V2_CONSUMERS_ENABLED } from './commerceV2Client';
import { adaptCommerceOrder } from './orderAdapter';
import orderReferenceHelpers from '../../../shared/orderReference.cjs';

const { formatOrderReference } = orderReferenceHelpers;

const isTerminalPaymentFailure = (status) => ['payment_failed', 'canceled', 'cancelled', 'cancelled_by_client'].includes(status);

const waitForPaidOrderViaFunction = ({ orderId, email, checkoutOtpToken }, timeoutMs = 45000) => new Promise((resolve, reject) => {
    const getOrderStatusClient = httpsCallable(functions, getFunctionTarget('getOrderStatusClient'));
    const startedAt = Date.now();

    const tick = async () => {
        try {
            const result = await getOrderStatusClient({ orderId, email, checkoutOtpToken });
            const order = result.data?.order || {};
            if (order.status === 'paid') {
                resolve(order);
                return;
            }
            if (isTerminalPaymentFailure(order.status)) {
                reject(new Error('Le paiement n’a pas été confirmé. Vos articles restent dans votre panier.'));
                return;
            }
        } catch (error) {
            if (Date.now() - startedAt > timeoutMs) {
                reject(error);
                return;
            }
        }

        if (Date.now() - startedAt > timeoutMs) {
            reject(new Error('Nous vérifions encore le paiement. Votre commande apparaîtra dans votre espace dès sa confirmation.'));
            return;
        }
        window.setTimeout(tick, 2500);
    };

    tick();
});

const waitForPaidOrder = ({ orderId, email, checkoutOtpToken }, timeoutMs = 45000) => new Promise((resolve, reject) => {
    if (!orderId) {
        reject(new Error('Commande introuvable pour confirmer le paiement.'));
        return;
    }

    let settled = false;
    const timeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        unsubscribe();
        reject(new Error('Nous vérifions encore le paiement. Votre commande apparaîtra dans votre espace dès sa confirmation.'));
    }, timeoutMs);

    const unsubscribe = onSnapshot(doc(db, 'orders', orderId), (snap) => {
        if (!snap.exists()) return;
        const order = snap.data();
        const projectedOrder = adaptCommerceOrder(order, snap.id);
        const paymentSucceeded = projectedOrder.schemaVersion === 2
            ? projectedOrder.paymentStatus === 'succeeded'
            : projectedOrder.status === 'paid';
        if (paymentSucceeded) {
            settled = true;
            window.clearTimeout(timeout);
            unsubscribe();
            resolve(order);
            return;
        }
        if (
            isTerminalPaymentFailure(projectedOrder.status) ||
            isTerminalPaymentFailure(projectedOrder.paymentStatus)
        ) {
            settled = true;
            window.clearTimeout(timeout);
            unsubscribe();
            reject(new Error('Le paiement n’a pas été confirmé. Vos articles restent dans votre panier.'));
        }
    }, (_error) => {
        if (settled) return;
        window.clearTimeout(timeout);
        unsubscribe();
        if (COMMERCE_V2_CONSUMERS_ENABLED) {
            reject(new Error('Nous ne pouvons pas encore afficher la confirmation. Vos articles restent dans votre panier.'));
            return;
        }
        waitForPaidOrderViaFunction({ orderId, email, checkoutOtpToken }, timeoutMs).then(resolve, reject);
    });
});

const PaymentConfirmationPanel = ({ darkMode, state, message }) => (
    <div className={`border-y px-0 py-6 md:py-8 ${darkMode ? 'border-white/10' : 'border-stone-200'}`} aria-live="polite">
        <div className="flex items-start gap-4 md:gap-5">
            <div className={`relative mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${darkMode ? 'bg-stone-100 text-stone-950' : 'bg-stone-900 text-white'}`}>
                {state === 'error' ? (
                    <span className="text-xl leading-none">!</span>
                ) : (
                    <>
                        <span className="h-2.5 w-2.5 rounded-full bg-current opacity-70" />
                        <span className="absolute inset-0 rounded-full border border-current opacity-20 animate-ping motion-reduce:animate-none" />
                    </>
                )}
            </div>
            <div className="min-w-0">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                    {state === 'error' ? 'À vérifier' : 'Paiement reçu'}
                </p>
                <h4 className={`mt-2 text-xl font-semibold tracking-[-0.025em] md:text-2xl ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                    {state === 'error' ? 'Nous vérifions votre paiement' : 'Votre commande se finalise'}
                </h4>
                <p className={`mt-2 max-w-[58ch] text-sm leading-6 ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                    {message || "Cela ne prend généralement que quelques instants. Vous retrouverez ensuite la commande dans votre espace client."}
                </p>
            </div>
        </div>
    </div>
);

const CheckoutStripeModal = ({
    darkMode,
    finalTotal,
    orderTotal,
    createdOrderId,
    createdOrderNumber,
    checkoutOtpToken,
    stripeConnectedAccountId,
    formData,
    stripeElementsOptions,
    purchasedCartLines,
    onClose,
    onPlaceOrder,
    onPaymentConfirmed,
}) => {
    const [confirmationState, setConfirmationState] = useState('idle');
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const closeButtonRef = useRef(null);
    const dialogRef = useRef(null);
    const stripePromise = getStripePromise(stripeConnectedAccountId || '');

    const canClose = confirmationState === 'idle' || confirmationState === 'error';
    const requestClose = useCallback(() => {
        if (!canClose) return;
        onClose();
    }, [canClose, onClose]);

    useEffect(() => {
        const previousActiveElement = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus({ preventScroll: true });

        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && canClose) {
                event.preventDefault();
                requestClose();
                return;
            }
            if (event.key !== 'Tab') return;
            const focusable = Array.from(dialogRef.current?.querySelectorAll(
                'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
            ) || []).filter((element) => element.getClientRects().length > 0);
            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
            previousActiveElement?.focus?.({ preventScroll: true });
        };
    }, [canClose, requestClose]);

    if (typeof document === 'undefined') return null;

    const humanOrderReference = formatOrderReference(createdOrderNumber, '');

    return createPortal(
        <div
            ref={dialogRef}
            className={`fixed inset-0 z-[300] min-h-[100dvh] overflow-y-auto overscroll-contain ${
                darkMode ? 'bg-stone-950 text-stone-100' : 'bg-[#f7f4ef] text-stone-900'
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="stripe-payment-title"
            aria-describedby="stripe-payment-description"
        >
            <div className="grid min-h-[100dvh] w-full lg:grid-cols-[minmax(20rem,38vw)_minmax(0,1fr)] 2xl:grid-cols-[minmax(28rem,42vw)_minmax(0,1fr)]">
                <aside className="relative overflow-hidden bg-[#20201e] px-5 pb-7 pt-5 text-stone-100 sm:px-8 sm:pb-8 lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:flex-col lg:px-[clamp(3rem,5vw,6.5rem)] lg:pb-12 lg:pt-10">
                    <div className="relative flex items-center justify-between gap-4">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-300">
                            Seconde Vie
                        </span>
                        <span className="text-[11px] font-medium tabular-nums text-stone-500">
                            {humanOrderReference ? `Commande ${humanOrderReference}` : 'Commande sécurisée'}
                        </span>
                    </div>

                    <div className="relative mt-8 max-w-xl lg:my-auto lg:mt-12">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                            Dernière étape
                        </p>
                        <h2 className="mt-3 max-w-[14ch] text-[2rem] font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-4xl lg:mt-4 lg:text-[clamp(2.6rem,4vw,4.8rem)]">
                            Votre pièce vous attend.
                        </h2>
                        <p className="mt-4 max-w-[46ch] text-sm leading-6 text-stone-400 lg:mt-6 lg:text-base lg:leading-7">
                            Elle reste réservée le temps de régler votre commande. Vous pouvez encore revenir vérifier vos informations.
                        </p>

                        <div className="mt-8 border-y border-white/10 py-5 lg:mt-10 lg:py-6">
                            <div className="flex items-end justify-between gap-4">
                                <span className="pb-1 text-xs font-medium text-stone-400">Total à régler</span>
                                <span className="text-3xl font-semibold tracking-[-0.04em] tabular-nums text-white sm:text-4xl">
                                    {finalTotal}&nbsp;€
                                </span>
                            </div>
                        </div>

                        <ol className="mt-6 hidden space-y-4 text-sm lg:block">
                            <li className="flex items-center gap-3 text-white">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-[11px] font-bold text-stone-900">1</span>
                                Coordonnées et livraison vérifiées
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-[11px] font-bold text-stone-900">2</span>
                                Paiement sécurisé
                            </li>
                            <li className="flex items-center gap-3 text-stone-500">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-[11px] font-bold">3</span>
                                Commande confirmée
                            </li>
                        </ol>
                    </div>

                    <p className="relative mt-8 hidden max-w-sm text-xs leading-5 text-stone-500 lg:block">
                        Le paiement est traité par Stripe. Seconde Vie ne stocke pas vos données bancaires.
                    </p>
                    <div className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-full border border-white/[0.06]" />
                    <div className="pointer-events-none absolute -bottom-10 -right-4 h-40 w-40 rounded-full border border-white/[0.08]" />
                </aside>

                <main className={`px-5 pb-12 pt-5 sm:px-8 lg:px-[clamp(3rem,6vw,8rem)] lg:pb-16 lg:pt-10 ${
                    darkMode ? 'bg-stone-950' : 'bg-[#f7f4ef]'
                }`}>
                    <div className="mx-auto w-full max-w-[720px]">
                        <div className="flex min-h-11 items-center justify-between">
                            <button
                                ref={closeButtonRef}
                                type="button"
                                onClick={requestClose}
                                disabled={!canClose}
                                className={`group inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold transition-[color,background-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] ${
                                    !canClose ? 'cursor-not-allowed opacity-35' : ''
                                } ${
                                    darkMode
                                        ? 'text-stone-300 hover:bg-white/5 hover:text-white focus-visible:ring-white focus-visible:ring-offset-stone-950'
                                        : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-950 focus-visible:ring-stone-900 focus-visible:ring-offset-[#f7f4ef]'
                                }`}
                                aria-label="Revenir au récapitulatif de la commande"
                            >
                                <svg className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 18l-6-6 6-6" />
                                </svg>
                                <span>Récapitulatif</span>
                            </button>
                            <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                                Paiement
                            </span>
                        </div>

                        <header className="pb-7 pt-9 sm:pt-12 lg:pb-10 lg:pt-[clamp(4rem,8vh,7rem)]">
                            <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>
                                Étape 2 sur 3
                            </p>
                            <h1 id="stripe-payment-title" className={`mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl ${darkMode ? 'text-white' : 'text-stone-950'}`}>
                                Comment souhaitez-vous régler&nbsp;?
                            </h1>
                            <p id="stripe-payment-description" className={`mt-4 max-w-[58ch] text-sm leading-6 sm:text-base ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                                Choisissez la carte ou l’option de paiement disponible sur votre appareil.
                            </p>
                        </header>

                        {isStripeConfigured ? (
                            <>
                                {confirmationState !== 'idle' ? (
                                    <PaymentConfirmationPanel darkMode={darkMode} state={confirmationState} message={confirmationMessage} />
                                ) : null}
                                {confirmationState === 'idle' ? (
                                    <Elements stripe={stripePromise} options={stripeElementsOptions}>
                                        <CheckoutPaymentStep
                                            total={finalTotal}
                                            orderId={createdOrderId}
                                            darkMode={darkMode}
                                            shipping={formData}
                                            onPaymentSuccess={async (paymentIntent) => {
                                                setConfirmationState('waiting');
                                                setConfirmationMessage('');
                                                try {
                                                    const confirmedOrder = await waitForPaidOrder({
                                                        orderId: createdOrderId,
                                                        email: formData.email,
                                                        checkoutOtpToken
                                                    });
                                                    onPaymentConfirmed?.(confirmedOrder);
                                                    await onPlaceOrder({
                                                        id: createdOrderId,
                                                        orderNumber: confirmedOrder?.orderNumber || createdOrderNumber,
                                                        ...formData,
                                                        paymentMethod: 'stripe_elements',
                                                        total: orderTotal,
                                                        paymentIntentId: paymentIntent.id,
                                                        purchasedCartLines
                                                    });
                                                } catch (error) {
                                                    console.error('Order paid confirmation timeout:', error);
                                                    setConfirmationState('error');
                                                    setConfirmationMessage(error?.message || 'Nous vérifions encore le paiement. Votre commande apparaîtra dans votre espace dès sa confirmation.');
                                                }
                                            }}
                                            onPaymentError={(error) => {
                                                console.error('Payment error inline:', error);
                                            }}
                                        />
                                    </Elements>
                                ) : null}
                            </>
                        ) : (
                            <div className={`border-y py-6 text-sm leading-6 ${
                                darkMode
                                    ? 'border-amber-300/20 text-amber-100'
                                    : 'border-amber-300 text-amber-950'
                            }`}>
                                Le paiement Stripe n’est pas configuré. Aucun paiement ne peut être lancé depuis cet écran.
                            </div>
                        )}

                        <footer className={`mt-8 flex flex-col gap-2 border-t pt-5 text-xs leading-5 sm:flex-row sm:items-center sm:justify-between ${
                            darkMode ? 'border-white/10 text-stone-500' : 'border-stone-200 text-stone-500'
                        }`}>
                            <span>Connexion chiffrée</span>
                            <span>Données bancaires traitées par Stripe</span>
                        </footer>
                    </div>
                </main>
            </div>
        </div>,
        document.body
    );
};

export default CheckoutStripeModal;
