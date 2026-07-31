import { useEffect, useRef } from 'react';
import { ArrowRight, Check, Clock3, Mail, ShoppingBag } from 'lucide-react';

const OrderSuccessModal = ({ onClose, onViewOrders, paymentMethod }) => {
    const isStripe = paymentMethod === 'stripe_elements';
    const primaryActionRef = useRef(null);
    const screenRef = useRef(null);
    const steps = isStripe
        ? [
            ['Paiement', 'Confirmé'],
            ['Commande', 'Bien enregistrée'],
            ['Suivi', 'Disponible dans votre espace']
        ]
        : [
            ['Commande', 'Bien enregistrée'],
            ['Règlement', 'Instructions envoyées'],
            ['Suivi', 'Disponible dans votre espace']
        ];

    useEffect(() => {
        const previousActiveElement = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        primaryActionRef.current?.focus({ preventScroll: true });

        const handleKeyDown = (event) => {
            if (event.key !== 'Tab') return;
            const focusable = Array.from(screenRef.current?.querySelectorAll('button:not([disabled])') || []);
            if (focusable.length === 0) return;
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
    }, []);

    return (
        <section
            ref={screenRef}
            className="fixed inset-0 z-[300] min-h-[100dvh] overflow-y-auto bg-[#f7f4ef] text-stone-950 animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-success-title"
            aria-describedby="order-success-description"
        >
            <div className="grid min-h-[100dvh] w-full lg:grid-cols-[minmax(20rem,38vw)_minmax(0,1fr)] 2xl:grid-cols-[minmax(28rem,42vw)_minmax(0,1fr)]">
                <aside className="relative overflow-hidden bg-[#20201e] px-5 pb-8 pt-5 text-white sm:px-8 lg:flex lg:h-[100dvh] lg:flex-col lg:px-[clamp(3rem,5vw,6.5rem)] lg:pb-12 lg:pt-10">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-300">
                        Seconde Vie
                    </p>

                    <div className="mt-12 max-w-xl lg:my-auto">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-950 sm:h-14 sm:w-14">
                            {isStripe
                                ? <Check size={26} strokeWidth={2} aria-hidden="true" />
                                : <Clock3 size={25} strokeWidth={1.8} aria-hidden="true" />}
                        </div>
                        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                            {isStripe ? 'Commande confirmée' : 'Commande réservée'}
                        </p>
                        <h1 id="order-success-title" className="mt-3 max-w-[13ch] text-[2.5rem] font-semibold leading-[0.98] tracking-[-0.05em] text-white sm:text-5xl lg:text-[clamp(3.5rem,5vw,5.8rem)]">
                            {isStripe ? 'Merci, votre commande est confirmée.' : 'Votre commande est bien réservée.'}
                        </h1>
                        <p id="order-success-description" className="mt-5 max-w-[45ch] text-sm leading-6 text-stone-400 sm:text-base sm:leading-7">
                            {isStripe
                                ? 'Nous vous envoyons maintenant le récapitulatif par e-mail.'
                                : 'Les instructions de règlement arrivent par e-mail.'}
                        </p>
                    </div>

                    <p className="mt-8 hidden max-w-sm text-xs leading-5 text-stone-500 lg:block">
                        Besoin d’aide&nbsp;? Retrouvez toutes les informations utiles dans votre espace client.
                    </p>
                    <div className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-full border border-white/[0.06]" />
                    <div className="pointer-events-none absolute -bottom-10 -right-4 h-40 w-40 rounded-full border border-white/[0.08]" />
                </aside>

                <main className="flex px-5 py-10 sm:px-8 sm:py-14 lg:items-center lg:px-[clamp(3rem,7vw,9rem)] lg:py-16">
                    <div className="mx-auto w-full max-w-[720px]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                            La suite
                        </p>
                        <h2 className="mt-3 max-w-[17ch] text-3xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-4xl">
                            Tout est prêt pour suivre votre commande.
                        </h2>

                        <div className="mt-9 border-y border-stone-200 py-2 sm:mt-12">
                            {steps.map(([label, value]) => (
                                <div key={label} className="grid grid-cols-[7rem_1fr] items-center gap-4 border-t border-stone-200 py-4 first:border-t-0 sm:grid-cols-[9rem_1fr] sm:py-5">
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{label}</span>
                                    <span className="flex items-center gap-2 text-sm font-semibold text-stone-900 sm:text-base">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-white">
                                            <Check size={13} strokeWidth={2.2} aria-hidden="true" />
                                        </span>
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-7 flex items-start gap-3 text-sm leading-6 text-stone-600">
                            <Mail size={19} strokeWidth={1.7} className="mt-0.5 shrink-0" aria-hidden="true" />
                            <p>
                                {isStripe
                                    ? 'L’e-mail de confirmation peut prendre quelques instants. Votre espace client reste accessible immédiatement.'
                                    : 'L’e-mail récapitulatif contient les informations de règlement et de livraison.'}
                            </p>
                        </div>

                        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                            <button
                                ref={primaryActionRef}
                                type="button"
                                onClick={onViewOrders}
                                className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4ef] active:scale-[0.985]"
                            >
                                <ShoppingBag size={18} strokeWidth={1.8} aria-hidden="true" />
                                Voir ma commande
                                <ArrowRight size={17} strokeWidth={1.8} aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex min-h-[54px] items-center justify-center rounded-xl border border-stone-300 px-6 text-sm font-semibold text-stone-800 transition-[background-color,border-color,transform] duration-200 hover:border-stone-400 hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4ef] active:scale-[0.985]"
                            >
                                Retour à la galerie
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </section>
    );
};

export default OrderSuccessModal;
