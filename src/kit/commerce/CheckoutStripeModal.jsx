import React from 'react';
import { createPortal } from 'react-dom';
import { Elements } from '@stripe/react-stripe-js';
import { isStripeConfigured, stripePromise } from '../config/stripe';
import CheckoutPaymentStep from './CheckoutPaymentStep';

const CheckoutStripeModal = ({
    darkMode,
    finalTotal,
    orderTotal,
    createdOrderId,
    formData,
    stripeElementsOptions,
    onClose,
    onPlaceOrder,
    setCheckoutState,
}) => {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300"
        style={{ background: 'rgba(0,0,0,0.82)' }}
        onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
        <div className={`w-full max-w-lg relative p-6 md:p-8 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 max-h-[85dvh] overflow-y-auto ios-modal-scroll custom-scrollbar ${darkMode ? 'bg-[#0a0a0a] ring-1 ring-white/5' : 'bg-white ring-1 ring-stone-200'}`}>
            <button
                type="button"
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onClose();
                }}
                className={`absolute z-50 top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${darkMode ? 'hover:bg-white/10 text-stone-400 hover:text-white' : 'hover:bg-stone-100 text-stone-500 hover:text-stone-900'}`}
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
                <Elements stripe={stripePromise} options={stripeElementsOptions}>
                    <CheckoutPaymentStep
                        total={finalTotal}
                        orderId={createdOrderId}
                        darkMode={darkMode}
                        shipping={formData}
                        onPaymentSuccess={async (paymentIntent) => {
                            setCheckoutState('editing');
                            await onPlaceOrder({
                                id: createdOrderId,
                                ...formData,
                                paymentMethod: 'stripe_elements',
                                total: orderTotal,
                                paymentIntentId: paymentIntent.id
                            });
                        }}
                        onPaymentError={(error) => {
                            console.error("Payment error inline:", error);
                        }}
                    />
                </Elements>
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
