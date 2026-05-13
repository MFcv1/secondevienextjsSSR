import React, { useState } from 'react';
import { PaymentElement, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AlertCircle, Lock, ShieldCheck } from 'lucide-react';

/**
 * CheckoutPaymentStep — Placé INLINE dans la page de checkout
 * Couleurs Premium : Amber / Stone / Noir (Zéro violet)
 */
const CheckoutPaymentStep = ({ total, onPaymentSuccess, onPaymentError, darkMode = false }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [expressCheckoutReady, setExpressCheckoutReady] = useState(false);

    const handleCardSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.origin + '/?order_success=true',
                },
                redirect: 'if_required'
            });

            if (error) {
                setErrorMessage(error.message);
                onPaymentError?.(error.message);
                setIsProcessing(false);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                onPaymentSuccess?.(paymentIntent);
            }
        } catch (err) {
            setErrorMessage(err?.message || "Une erreur inattendue est survenue.");
            setIsProcessing(false);
        }
    };

    const handleExpressCheckoutConfirm = async () => {
        if (!stripe || !elements) return;
        setIsProcessing(true);
        setErrorMessage(null);

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.origin + '/?order_success=true',
                },
                redirect: 'if_required'
            });

            if (error) {
                setErrorMessage(error.message);
                onPaymentError?.(error.message);
                setIsProcessing(false);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                onPaymentSuccess?.(paymentIntent);
            }
        } catch {
            setErrorMessage("Erreur lors du paiement express.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 mt-4">
            {/* BADGE SÉCURITÉ PREMIUM */}
            <div className={`flex items-center gap-4 p-4 rounded-xl ring-1 ring-inset ${darkMode ? 'bg-[#0a0a0a] ring-white/10' : 'bg-stone-50 ring-stone-200'}`}>
                <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-white/5 text-white' : 'bg-white shadow-sm text-stone-900'}`}>
                    <ShieldCheck size={18} strokeWidth={2} />
                </div>
                <div>
                    <p className={`text-xs font-black tracking-wide ${darkMode ? 'text-white' : 'text-stone-900'}`}>Paiement 100% sécurisé</p>
                    <p className={`text-[10px] font-medium mt-0.5 ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>Cryptage SSL 256 bits — Stripe PCI DSS</p>
                </div>
            </div>

            {/* EXPRESS CHECKOUT */}
            <div className={`rounded-xl overflow-hidden ${expressCheckoutReady ? '' : 'hidden'}`}>
                <ExpressCheckoutElement
                    onReady={() => setExpressCheckoutReady(true)}
                    onConfirm={handleExpressCheckoutConfirm}
                    options={{
                        buttonHeight: 48,
                        buttonTheme: {
                            applePay: darkMode ? 'white' : 'black',
                            googlePay: darkMode ? 'white' : 'black',
                            paypal: 'gold'
                        },
                        layout: {
                            maxColumns: 2,
                            maxRows: 2,
                            overflow: 'auto',
                        },
                        paymentMethods: {
                            link: 'never',
                        },
                    }}
                />
            </div>

            {/* SÉPARATEUR */}
            {expressCheckoutReady && (
                <div className="flex items-center gap-4 py-2">
                    <div className={`flex-1 h-px ${darkMode ? 'bg-stone-800' : 'bg-stone-200'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>ou par carte</span>
                    <div className={`flex-1 h-px ${darkMode ? 'bg-stone-800' : 'bg-stone-200'}`} />
                </div>
            )}

            {/* FORMULAIRE CARTE */}
            <form onSubmit={handleCardSubmit} className="space-y-6">
                <div className={`p-4 md:p-5 rounded-2xl ring-1 ring-inset ${darkMode ? 'bg-stone-900/50 ring-stone-800' : 'bg-white ring-stone-200'}`}>
                    <PaymentElement
                        options={{
                            layout: {
                                type: 'accordion',
                                defaultCollapsed: false,
                                radios: true,
                                spacedAccordionItems: true,
                            },
                            fields: {
                                billingDetails: 'auto',
                            },
                            wallets: {
                                applePay: 'never',
                                googlePay: 'never',
                            }
                        }}
                    />
                </div>

                {/* ERREUR */}
                {errorMessage && (
                    <div className={`p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in ${darkMode ? 'bg-red-500/10 ring-1 ring-red-500/20 text-red-400' : 'bg-red-50 ring-1 ring-red-100 text-red-600'}`}>
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">Erreur de paiement</p>
                            <p className="mt-1 text-xs opacity-90">{errorMessage}</p>
                        </div>
                    </div>
                )}

            {/* BOUTON PAYER TOTAL PREMIUM */}
            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className={`relative w-full overflow-hidden py-4 md:py-5 rounded-[1rem] font-black uppercase text-[11px] md:text-xs tracking-widest transition-all duration-500 flex items-center justify-center gap-3 shadow-xl outline-none group
                    ${(!stripe || isProcessing) ? 'cursor-wait' : 'cursor-pointer active:scale-[0.985] hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)]'}
                    ${(!stripe || isProcessing)
                        ? (darkMode ? 'bg-stone-800/50 text-stone-500 opacity-70' : 'bg-stone-200 text-stone-400 opacity-70')
                        : (darkMode ? 'bg-white text-stone-900 shadow-[0_4px_20px_rgba(0,0,0,0.5)]' : 'bg-stone-900 text-white shadow-[0_4px_20px_rgba(0,0,0,0.1)]')
                    }
                `}
            >
                {/* Effet Shimmer de base pour le bouton au hover */}
                {!isProcessing && stripe && (
                    <div className={`absolute inset-0 -translate-x-[150%] group-hover:animate-[shimmer-sweep_2s_infinite_cubic-bezier(0.16,1,0.3,1)] w-1/2 skew-x-12 blur-md pointer-events-none ${
                        darkMode 
                            ? 'bg-gradient-to-r from-transparent via-stone-400/20 to-transparent' 
                            : 'bg-gradient-to-r from-transparent via-white/20 to-transparent'
                    }`} />
                )}

                <div className="relative z-10 flex items-center justify-center gap-3 w-full">
                    {isProcessing ? (
                        <>
                            <svg className={`animate-spin h-5 w-5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className={darkMode ? 'text-stone-500' : 'text-stone-400'}>Traitement en cours...</span>
                        </>
                    ) : (
                        <>
                            <Lock size={16} className={darkMode ? 'text-stone-900/80' : 'text-white/80'} />
                            Payer {total} €
                        </>
                    )}
                </div>
            </button>
        </form>
        </div>
    );
};

export default CheckoutPaymentStep;
