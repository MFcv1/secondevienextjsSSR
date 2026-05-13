import React from 'react';
import { CreditCard, HeartHandshake, Truck } from 'lucide-react';

const REASSURANCE_UNITS = [
    {
        code: '01',
        Icon: Truck,
        label: 'Livraison soignée',
        text: 'Partout en France métropolitaine',
        meta: 'FRANCE / CAVE',
    },
    {
        code: '02',
        Icon: CreditCard,
        label: 'Paiement 4x sans frais',
        text: 'Échelonnez vos paiements facilement',
        meta: '2X / 3X / FRAIS 0%',
    },
    {
        code: '03',
        Icon: HeartHandshake,
        label: 'On est là pour vous',
        text: 'Une équipe humaine à votre écoute',
        meta: 'CONSEILS / SUPPORT',
    },
];

const ReassuranceSection = React.memo(function ReassuranceSection({ darkMode }) {
    return (
        <section
            className={`post-hero-service-section relative hidden overflow-hidden md:block mt-4 md:mt-[92px] lg:mt-[92px] mb-8 ${
                darkMode ? 'bg-[#121212]' : 'bg-[#FAFAF9]'
            }`}
        >
            <div className="relative mx-auto max-w-[1760px] px-4 py-6 md:px-7 lg:px-8 xl:px-10">
                <div className="relative mx-auto max-w-[1380px]">
                    <span
                        className={`pointer-events-none absolute left-1/2 top-0 h-px w-screen -translate-x-1/2 ${
                            darkMode ? 'bg-white/10' : 'bg-stone-200'
                        }`}
                        aria-hidden="true"
                    />
                    <span
                        className={`pointer-events-none absolute bottom-0 left-1/2 h-px w-screen -translate-x-1/2 ${
                            darkMode ? 'bg-white/10' : 'bg-stone-200'
                        }`}
                        aria-hidden="true"
                    />

                    <div className="grid items-stretch md:grid-cols-3">
                        {REASSURANCE_UNITS.map((unit) => {
                            const Icon = unit.Icon;

                            return (
                                <article
                                    key={unit.code}
                                    className={`post-hero-service-card group relative flex min-h-[172px] flex-col items-center justify-center px-5 py-8 text-center md:min-h-[188px] lg:min-h-[196px] xl:min-h-[206px] 2xl:min-h-[214px] ${
                                        darkMode ? 'text-white' : 'text-[#1A1A1A]'
                                    }`}
                                >
                                    <div className={`flex h-[48px] w-[48px] items-center justify-center border transition-colors duration-300 ${
                                        darkMode ? 'border-white/16 bg-white/[0.03] group-hover:border-white/28' : 'border-stone-300 bg-[#faf9f7] group-hover:border-[#1A1A1A]'
                                    }`}>
                                        <Icon size={22} strokeWidth={1.25} />
                                    </div>

                                    <div className="mt-6">
                                        <h4 className="font-sans text-[11px] font-black uppercase leading-none tracking-[0.2em] xl:text-[12px]">
                                            {unit.label}
                                        </h4>
                                        <p className={`mx-auto mt-4 max-w-[18rem] font-sans text-[13px] leading-[1.55] ${
                                            darkMode ? 'text-stone-400' : 'text-stone-500'
                                        }`}>
                                            {unit.text}
                                        </p>
                                    </div>

                                    <div className={`mt-6 flex items-center gap-3 border-t pt-4 ${
                                        darkMode ? 'border-white/10' : 'border-stone-200'
                                    }`}>
                                        <span className="h-[5px] w-[5px] bg-[#c6a27e]" aria-hidden="true" />
                                        <samp className={`font-mono text-[8px] font-bold uppercase tracking-[0.2em] ${
                                            darkMode ? 'text-white/38' : 'text-stone-400'
                                        }`}>
                                            {unit.meta}
                                        </samp>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
});

export default ReassuranceSection;
