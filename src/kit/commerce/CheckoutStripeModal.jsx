import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Elements } from '@stripe/react-stripe-js';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { isStripeConfigured, stripePromise } from '../config/stripe';
import { db, functions } from '../config/firebase';
import CheckoutPaymentStep from './CheckoutPaymentStep';

const isTerminalPaymentFailure = (status) => ['payment_failed', 'canceled', 'cancelled', 'cancelled_by_client'].includes(status);

const waitForPaidOrderViaFunction = ({ orderId, email, checkoutOtpToken }, timeoutMs = 45000) => new Promise((resolve, reject) => {
    const getOrderStatusClient = httpsCallable(functions, 'getOrderStatusClient');
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
                reject(new Error('Le paiement n a pas ete confirme. Aucun panier ne sera vide.'));
                return;
            }
        } catch (error) {
            if (Date.now() - startedAt > timeoutMs) {
                reject(error);
                return;
            }
        }

        if (Date.now() - startedAt > timeoutMs) {
            reject(new Error('Paiement recu. Confirmation de commande encore en cours.'));
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
        reject(new Error('Paiement recu. Confirmation de commande encore en cours.'));
    }, timeoutMs);

    const unsubscribe = onSnapshot(doc(db, 'orders', orderId), (snap) => {
        if (!snap.exists()) return;
        const order = snap.data();
        if (order.status === 'paid') {
            settled = true;
            window.clearTimeout(timeout);
            unsubscribe();
            resolve(order);
            return;
        }
        if (isTerminalPaymentFailure(order.status)) {
            settled = true;
            window.clearTimeout(timeout);
            unsubscribe();
            reject(new Error('Le paiement n a pas ete confirme. Aucun panier ne sera vide.'));
        }
    }, (error) => {
        if (settled) return;
        window.clearTimeout(timeout);
        unsubscribe();
        waitForPaidOrderViaFunction({ orderId, email, checkoutOtpToken }, timeoutMs).then(resolve, reject);
    });
});

const PaymentConfirmationPanel = ({ darkMode, state, message }) => (
    <div className={`rounded-[1.75rem] border p-5 md:p-6 ${darkMode ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200 bg-[#f5f5f7]'}`}>
        <div className="flex items-start gap-4">
            <div className={`relative mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${darkMode ? 'bg-white text-stone-950' : 'bg-stone-950 text-white'}`}>
                {state === 'error' ? (
                    <span className="text-xl leading-none">!</span>
                ) : (
                    <>
                        <span className="h-2.5 w-2.5 rounded-full bg-current opacity-70" />
                        <span className="absolute inset-0 rounded-full border border-current opacity-20 animate-ping" />
                    </>
                )}
            </div>
            <div className="min-w-0">
                <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                    {state === 'error' ? 'Verification requise' : 'Confirmation securisee'}
                </p>
                <h4 className={`mt-2 text-xl font-semibold tracking-[-0.02em] ${darkMode ? 'text-white' : 'text-[#1d1d1f]'}`}>
                    {state === 'error' ? 'Paiement a verifier' : 'Paiement recu. Finalisation en cours.'}
                </h4>
                <p className={`mt-2 text-sm leading-6 ${darkMode ? 'text-stone-400' : 'text-[#6e6e73]'}`}>
                    {message || "Nous attendons la confirmation durable du serveur avant de valider la commande et vider le panier."}
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
    checkoutOtpToken,
    formData,
    stripeElementsOptions,
    onClose,
    onPlaceOrder,
    setCheckoutState,
}) => {
    const [confirmationState, setConfirmationState] = useState('idle');
    const [confirmationMessage, setConfirmationMessage] = useState('');

    if (typeof document === 'undefined') return null;
    const canClose = confirmationState === 'idle' || confirmationState === 'error';
    const requestClose = () => {
        if (!canClose) return;
        if (confirmationState === 'error') {
            setCheckoutState('editing');
            return;
        }
        onClose();
    };

    return createPortal(
        <div
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300"
        style={{ background: 'rgba(0,0,0,0.72)' }}
        onClick={(event) => { if (event.target === event.currentTarget) requestClose(); }}
    >
        <div className={`w-full max-w-lg relative p-6 md:p-8 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 max-h-[85dvh] overflow-y-auto ios-modal-scroll custom-scrollbar ${darkMode ? 'bg-[#0a0a0a] ring-1 ring-white/5' : 'bg-white ring-1 ring-stone-200'}`}>
            <button
                type="button"
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    requestClose();
                }}
                disabled={!canClose}
                className={`absolute z-50 top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${!canClose ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'} ${darkMode ? 'hover:bg-white/10 text-stone-400 hover:text-white' : 'hover:bg-stone-100 text-stone-500 hover:text-stone-900'}`}
                aria-label="Fermer le paiement"
            >
                <svg className="w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="mb-6 pr-10">
                <h3 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-stone-900'}`}>Paiement sécurisé.</h3>
                <p className={`text-xs mt-1 font-medium ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>Finalisez votre transaction via Stripe.</p>
            </div>

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
                                        await waitForPaidOrder({
                                            orderId: createdOrderId,
                                            email: formData.email,
                                            checkoutOtpToken
                                        });
                                        setCheckoutState('editing');
                                        await onPlaceOrder({
                                            id: createdOrderId,
                                            ...formData,
                                            paymentMethod: 'stripe_elements',
                                            total: orderTotal,
                                            paymentIntentId: paymentIntent.id
                                        });
                                    } catch (error) {
                                        console.error('Order paid confirmation timeout:', error);
                                        setConfirmationState('error');
                                        setConfirmationMessage(error?.message || 'Paiement recu. La commande sera confirmee des que le serveur Stripe aura termine.');
                                    }
                                }}
                                onPaymentError={(error) => {
                                    console.error("Payment error inline:", error);
                                }}
                            />
                        </Elements>
                    ) : null}
                </>
            ) : (
                <div className={`rounded-2xl border p-5 text-sm leading-relaxed ${darkMode ? 'border-amber-400/20 bg-amber-400/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                    Le paiement Stripe n'est pas encore configuré. Choisissez un autre moyen de paiement ou ajoutez la clé publique Stripe avant la mise en ligne.
                </div>
            )}
        </div>
        </div>,
        document.body
    );
};

export default CheckoutStripeModal;
