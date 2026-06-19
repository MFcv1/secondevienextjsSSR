import React from 'react';
import { ArrowRight, CheckCircle2, Clock3, ReceiptText, ShoppingBag } from 'lucide-react';

const OrderSuccessModal = ({ onClose, onViewOrders, paymentMethod }) => {
    const isStripe = paymentMethod === 'stripe_elements';
    const steps = isStripe
        ? [
            ['Paiement', 'Confirme par Stripe'],
            ['Commande', 'Validee cote serveur'],
            ['Suivi', 'Disponible dans votre espace client']
        ]
        : [
            ['Reservation', 'Articles mis de cote'],
            ['Reglement', 'Instructions envoyees'],
            ['Suivi', 'Disponible dans votre espace client']
        ];

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#f5f5f7]/92 p-4 backdrop-blur-2xl md:p-6 animate-in fade-in duration-300">
            <div className="relative w-full max-w-[520px] overflow-hidden rounded-[32px] border border-black/5 bg-white text-[#1d1d1f] shadow-[0_28px_90px_rgba(0,0,0,0.16)] animate-in zoom-in-95 slide-in-from-bottom-3 duration-300">
                <div className="px-6 pb-6 pt-7 md:px-8 md:pb-8 md:pt-9">
                    <div className="mb-7 flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
                                {isStripe ? 'Paiement confirme' : 'Commande reservee'}
                            </p>
                            <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-[-0.035em] text-[#1d1d1f] md:text-[40px]">
                                {isStripe ? 'C est confirme.' : 'Presque termine.'}
                            </h2>
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f] text-white">
                            {isStripe ? <CheckCircle2 size={24} strokeWidth={1.8} /> : <Clock3 size={24} strokeWidth={1.8} />}
                        </div>
                    </div>

                    <div className="rounded-[24px] bg-[#f5f5f7] p-5 md:p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#1d1d1f] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]">
                                <ShoppingBag size={20} strokeWidth={1.7} />
                            </div>
                            <div>
                                <h3 className="text-[17px] font-semibold tracking-[-0.01em]">
                                    {isStripe ? 'Votre commande est validee.' : 'Vos pieces sont reservees.'}
                                </h3>
                                <p className="mt-2 text-[14px] leading-6 text-[#6e6e73]">
                                    {isStripe
                                        ? "Le paiement est confirme durablement. Le recapitulatif est accessible dans Mes commandes."
                                        : "Les instructions de reglement sont envoyees par email et restent disponibles dans Mes commandes."}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-2">
                            {steps.map(([label, value]) => (
                                <div key={label} className="grid grid-cols-[112px_1fr] items-center gap-3 border-t border-black/[0.06] pt-3 first:border-t-0 first:pt-0">
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#86868b]">{label}</span>
                                    <span className="text-[14px] font-medium text-[#1d1d1f]">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-5 flex items-start gap-3 rounded-[18px] border border-black/[0.06] px-4 py-3.5">
                        <ReceiptText size={18} strokeWidth={1.6} className="mt-0.5 shrink-0 text-[#6e6e73]" />
                        <p className="text-[13px] leading-5 text-[#6e6e73]">
                            {isStripe
                                ? "Un email de confirmation part apres validation serveur. En cas de delai, l espace client reste la source la plus fiable."
                                : "Un email recapitulatif contient les coordonnees de reglement et les informations de livraison."}
                        </p>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <button
                            onClick={onViewOrders}
                            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-6 text-[14px] font-semibold text-white transition-colors hover:bg-black focus:outline-none focus-visible:ring-4 focus-visible:ring-black/15 active:scale-[0.99]"
                        >
                            Voir ma commande
                            <ArrowRight size={17} strokeWidth={1.8} />
                        </button>
                        <button
                            onClick={onClose}
                            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-black/[0.08] bg-white px-6 text-[14px] font-semibold text-[#1d1d1f] transition-colors hover:bg-[#f5f5f7] focus:outline-none focus-visible:ring-4 focus-visible:ring-black/10 active:scale-[0.99]"
                        >
                            Retour a la galerie
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessModal;
