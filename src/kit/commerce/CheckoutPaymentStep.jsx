import { useState } from 'react';
import { PaymentElement, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AlertCircle, Lock, ShieldCheck } from 'lucide-react';

const buildStripeReturnUrl = (orderId, returnPath = '/checkout') => {
    const url = new URL(returnPath, window.location.origin);
    url.searchParams.set('order_success', 'true');
    if (orderId) url.searchParams.set('order_id', orderId);
    return url.toString();
};

/**
 * CheckoutPaymentStep — formulaire Stripe isole dans l'ecran de paiement.
 */
const CheckoutPaymentStep = ({ total, orderId, onPaymentSuccess, onPaymentError, darkMode = false, returnPath = '/checkout' }) => {
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
                    return_url: buildStripeReturnUrl(orderId, returnPath),
                },
                redirect: 'if_required'
            });

            if (error) {
                setErrorMessage(error.message);
                onPaymentError?.(error.message);
                setIsProcessing(false);
            } else if (paymentIntent) {
                onPaymentSuccess?.(paymentIntent);
            } else {
                setErrorMessage('Stripe n’a pas renvoyé d’état de paiement. Réessayez sans recréer la commande.');
                setIsProcessing(false);
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
                    return_url: buildStripeReturnUrl(orderId, returnPath),
                },
                redirect: 'if_required'
            });

            if (error) {
                setErrorMessage(error.message);
                onPaymentError?.(error.message);
                setIsProcessing(false);
            } else if (paymentIntent) {
                onPaymentSuccess?.(paymentIntent);
            } else {
                setErrorMessage('Stripe n’a pas renvoyé d’état de paiement. Réessayez sans recréer la commande.');
                setIsProcessing(false);
            }
        } catch {
            setErrorMessage("Erreur lors du paiement express.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-7 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className={`flex items-center gap-4 border-y py-4 ${darkMode ? 'border-white/10' : 'border-stone-200'}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${darkMode ? 'bg-white/5 text-stone-200' : 'bg-stone-200/70 text-stone-800'}`}>
                    <ShieldCheck size={18} strokeWidth={1.75} />
                </div>
                <div>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-stone-900'}`}>Paiement traité par Stripe</p>
                    <p className={`mt-0.5 text-xs leading-5 ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>Vos informations bancaires sont saisies et protégées directement par Stripe.</p>
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
                <div className="flex items-center gap-4 py-1">
                    <div className={`flex-1 h-px ${darkMode ? 'bg-stone-800' : 'bg-stone-200'}`} />
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>ou par carte</span>
                    <div className={`flex-1 h-px ${darkMode ? 'bg-stone-800' : 'bg-stone-200'}`} />
                </div>
            )}

            {/* FORMULAIRE CARTE */}
            <form onSubmit={handleCardSubmit} className="space-y-6">
                <div className={`rounded-2xl border p-4 md:p-5 ${darkMode ? 'border-white/10 bg-white/[0.025]' : 'border-stone-200 bg-white'}`}>
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
                    <div className={`flex items-start gap-3 border-y py-4 text-sm animate-in fade-in ${darkMode ? 'border-red-400/20 text-red-300' : 'border-red-200 text-red-700'}`} role="alert">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Le paiement n’a pas abouti</p>
                            <p className="mt-1 text-xs opacity-90">{errorMessage}</p>
                        </div>
                    </div>
                )}

            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className={`relative flex min-h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-xl px-5 py-4 text-sm font-semibold transition-[background-color,color,transform] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                    ${(!stripe || isProcessing) ? 'cursor-wait' : 'cursor-pointer active:scale-[0.985]'}
                    ${(!stripe || isProcessing)
                        ? (darkMode ? 'bg-stone-800/50 text-stone-500 opacity-70' : 'bg-stone-200 text-stone-400 opacity-70')
                        : (darkMode ? 'bg-stone-100 text-stone-950 hover:bg-white focus-visible:ring-white focus-visible:ring-offset-stone-950' : 'bg-stone-900 text-white hover:bg-stone-800 focus-visible:ring-stone-900 focus-visible:ring-offset-[#f7f4ef]')
                    }
                `}
            >
                <div className="relative flex w-full items-center justify-center gap-3">
                    {isProcessing ? (
                        <>
                            <svg className={`animate-spin h-5 w-5 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className={darkMode ? 'text-stone-500' : 'text-stone-400'}>Paiement en cours…</span>
                        </>
                    ) : (
                        <>
                            <Lock size={16} className={darkMode ? 'text-stone-900/80' : 'text-white/80'} />
                            <span>Payer <span className="tabular-nums">{total}&nbsp;€</span></span>
                        </>
                    )}
                </div>
            </button>
        </form>
        </div>
    );
};

export default CheckoutPaymentStep;
