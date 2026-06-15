import {
    ClipboardCheck,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import quoteRestorationHero from '../../assets/quote-restoration-hero.webp';
import ArchitecturalHeaderServer from './ArchitecturalHeaderServer';
import QuoteFormIsland from './QuoteFormIsland';

const quoteRestorationHeroSrc = typeof quoteRestorationHero === 'string'
    ? quoteRestorationHero
    : quoteRestorationHero?.src;

const processSteps = [
    {
        title: 'Vous envoyez votre demande',
        text: 'Remplissez le formulaire et ajoutez des photos.',
    },
    {
        title: 'Nous analysons votre projet',
        text: 'Sous 48h, Anais etudie votre meuble.',
    },
    {
        title: 'Devis personnalise sous 48h',
        text: 'Vous recevez un devis detaille et sans engagement.',
    },
    {
        title: 'Restauration & livraison',
        text: 'Votre meuble est restaure avec soin et livre chez vous.',
    },
];

const proofItems = [
    { icon: ClipboardCheck, text: 'Devis personnalise sous 48h' },
    { icon: Sparkles, text: 'Artisanat francais & eco-responsable' },
    { icon: ShieldCheck, text: 'Un accompagnement sur-mesure' },
];

const QuoteHero = ({ darkMode = false } = {}) => (
    <section className="relative overflow-hidden">
        <div className={`absolute inset-0 ${darkMode ? 'bg-[#12100d]' : 'bg-[#f4eee5]'}`} />
        <div className="absolute inset-y-0 right-0 hidden w-[56%] lg:block">
            <img
                src={quoteRestorationHeroSrc}
                alt="Meuble ancien en restauration dans un atelier artisanal"
                className="h-full w-full object-cover object-bottom"
            />
            <div className={`absolute inset-0 ${darkMode ? 'bg-gradient-to-r from-[#12100d] via-[#12100d]/62 to-transparent' : 'bg-gradient-to-r from-[#f4eee5] via-[#f4eee5]/38 to-transparent'}`} />
        </div>
        <div className={`absolute inset-0 opacity-80 ${darkMode ? 'bg-[radial-gradient(circle_at_18%_20%,rgba(166,138,100,0.16),transparent_32%),linear-gradient(90deg,rgba(0,0,0,0.58),transparent_58%)]' : 'bg-[radial-gradient(circle_at_18%_20%,rgba(166,138,100,0.18),transparent_32%),linear-gradient(90deg,rgba(255,255,255,0.62),transparent_58%)]'}`} />

        <div className="relative mx-auto grid max-w-[1480px] items-stretch px-4 py-7 sm:px-6 md:py-9 lg:min-h-[540px] lg:px-10 xl:min-h-[560px] xl:px-16">
            <div className="flex max-w-[540px] flex-col justify-center py-3 md:py-5">
                <div className={`mb-5 flex items-center gap-2 font-sans text-[10px] font-semibold ${darkMode ? 'text-stone-500' : 'text-[#73675c]'}`}>
                    <span>Accueil</span>
                    <span className="h-px w-4 bg-current opacity-30" />
                    <span>Demander un devis</span>
                </div>
                <h1 className="max-w-[500px] font-serif text-[clamp(2.35rem,5vw,3.75rem)] leading-[0.98] tracking-normal">
                    Demandez un devis de restauration
                </h1>
                <p className={`mt-4 max-w-[33rem] font-sans text-[14px] leading-[1.65] md:text-[16px] ${darkMode ? 'text-stone-300' : 'text-[#3f3933]'}`}>
                    Vous avez un meuble a restaurer ? Anais vous accompagne pour lui offrir une seconde vie.
                </p>
                <div className="mt-5 grid gap-3 font-sans text-[12px] font-semibold sm:grid-cols-3 lg:grid-cols-1">
                    {proofItems.map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-3">
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${darkMode ? 'bg-white/10 ring-white/10' : 'bg-white/70 ring-[#d8c7b5]'}`}>
                                <Icon size={16} strokeWidth={1.45} />
                            </span>
                            <span>{text}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className={`mt-4 h-[230px] overflow-hidden rounded-[18px] ring-1 sm:h-[280px] lg:hidden ${darkMode ? 'ring-white/10' : 'ring-black/5'}`}>
                <img
                    src={quoteRestorationHeroSrc}
                    alt="Meuble ancien en restauration"
                    className="h-full w-full object-cover object-bottom"
                />
            </div>
        </div>
    </section>
);

const QuoteProcessSection = ({ darkMode = false } = {}) => (
    <section className="mx-auto max-w-[1480px] px-4 pb-4 sm:px-6 lg:px-10 xl:px-16">
        <div className={`rounded-[8px] p-5 ring-1 sm:p-6 ${darkMode ? 'bg-white/[0.045] ring-white/10' : 'bg-white/72 ring-[#eee7df]'}`}>
            <h2 className="font-serif text-2xl leading-tight">Comment ca se passe ?</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-4">
                {processSteps.map((step, index) => (
                    <div key={step.title} className="relative flex gap-4 md:block">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-serif text-xl ring-1 ${darkMode ? 'bg-white/10 ring-white/12' : 'bg-white ring-[#d7c7b6]'}`}>
                            {index + 1}
                        </div>
                        <div className={index < processSteps.length - 1 ? `md:after:absolute md:after:left-[3.25rem] md:after:top-[1.35rem] md:after:h-px md:after:w-[calc(100%-3rem)] ${darkMode ? 'md:after:bg-white/12' : 'md:after:bg-[#d7c7b6]'}` : ''}>
                            <h3 className="mt-1 font-sans text-[13px] font-bold md:mt-5">{step.title}</h3>
                            <p className={`mt-2 font-sans text-[12px] leading-relaxed ${darkMode ? 'text-stone-400' : 'text-[#6e655d]'}`}>{step.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export default function QuoteRequestServerView({ darkMode = false } = {}) {
    return (
        <main data-ssr-quote="true" className={`overflow-x-hidden ${darkMode ? 'bg-[#0A0A0A] text-stone-100' : 'bg-[#fbfaf7] text-[#1f1b17]'}`}>
            <ArchitecturalHeaderServer darkMode={darkMode} />
            <QuoteHero darkMode={darkMode} />
            <QuoteFormIsland initialDarkMode={darkMode} />
            <QuoteProcessSection darkMode={darkMode} />
        </main>
    );
}
