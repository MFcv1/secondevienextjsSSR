import quoteRestorationHero from '../../assets/quote-restoration-hero.webp';
import ArchitecturalHeaderServer from './ArchitecturalHeaderServer';
import PageBreadcrumb from './PageBreadcrumb';
import QuoteFormDeferredIsland from './QuoteFormDeferredIsland';
import QuoteFormSsrShell from './QuoteFormSsrShell';
import {
    QUOTE_EASE,
    QUOTE_SHELL,
    QUOTE_STEP_PADDING,
    QUOTE_STEP_RADIUS,
    QUOTE_TYPE,
    quoteTokens,
} from './quoteTheme';

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
        text: 'Sous 48h, Anaïs étudie votre meuble.',
    },
    {
        title: 'Devis personnalisé sous 48h',
        text: 'Vous recevez un devis détaillé et sans engagement.',
    },
    {
        title: 'Restauration & livraison',
        text: 'Votre meuble est restauré avec soin et livré chez vous.',
    },
];

const heroSpecs = [
    { value: '48 h', label: 'Réponse au devis' },
    { value: 'Gratuit', label: 'Sans engagement' },
    { value: 'Atelier', label: 'Artisanat français' },
];

const QuoteHero = ({ darkMode = false } = {}) => {
    const t = quoteTokens(darkMode);

    return (
        <section className="relative overflow-hidden">
            <div className={`absolute inset-0 ${t.heroBg}`} />
            <div className="absolute inset-y-0 right-0 hidden w-[48%] lg:block">
                <img
                    src={quoteRestorationHeroSrc}
                    alt="Meuble ancien en restauration dans un atelier artisanal"
                    className="h-full w-full object-cover object-bottom"
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${darkMode ? 'from-[#100e0c] via-[#100e0c]/70 to-transparent' : 'from-[#f4f1ec] via-[#f4f1ec]/45 to-transparent'}`} />
            </div>

            <div className={`relative ${QUOTE_SHELL} pb-11 pt-4 lg:min-h-[560px] lg:pb-16 lg:pt-6`}>
                <PageBreadcrumb current="Devis" darkMode={darkMode} />

                <div className="mt-7 max-w-[36rem] lg:mt-11">
                    <p className={`${QUOTE_TYPE.eyebrow} ${t.accent}`}>
                        Restauration de meubles anciens
                    </p>
                    <h1 className={`quote-balance mt-4 max-w-[20ch] ${QUOTE_TYPE.display}`}>
                        Demandez un devis de restauration
                    </h1>
                    <p className={`mt-5 max-w-[34rem] font-sans text-[14.5px] leading-[1.65] md:text-[15.5px] ${darkMode ? 'text-stone-300' : 'text-[#4a443d]'}`}>
                        Décrivez votre meuble en quelques étapes. Anaïs étudie votre projet
                        et vous répond avec un devis détaillé, sans engagement.
                    </p>

                    <dl className={`mt-9 grid grid-cols-3 border-t pt-6 ${t.hairline}`}>
                        {heroSpecs.map(({ value, label }, index) => (
                            <div
                                key={label}
                                className={index > 0 ? `border-l pl-4 sm:pl-6 ${t.hairline}` : 'pr-4'}
                            >
                                <dt className="font-serif text-[1.35rem] leading-none tracking-[-0.01em] sm:text-[1.5rem]">
                                    {value}
                                </dt>
                                <dd className={`mt-2 font-sans text-[10.5px] font-medium uppercase leading-[1.3] tracking-[0.1em] ${t.faint}`}>
                                    {label}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <a
                            href="#demande-de-devis"
                            className={`group inline-flex h-[54px] items-center justify-center gap-3 rounded-full pl-7 pr-2 font-sans text-[13px] font-semibold ${QUOTE_EASE} active:scale-[0.98] ${t.primaryBtn} ${t.focusRing}`}
                        >
                            Commencer ma demande
                            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${QUOTE_EASE} group-hover:translate-x-0.5 ${darkMode ? 'bg-black/10' : 'bg-white/15'}`}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M5 12h14" />
                                    <path d="m13 6 6 6-6 6" />
                                </svg>
                            </span>
                        </a>
                        <a
                            href="tel:+33612345678"
                            className={`inline-flex h-[54px] items-center justify-center rounded-full px-7 font-sans text-[13px] font-semibold ${QUOTE_EASE} active:scale-[0.98] ${t.ghostBtn} ${t.focusRing}`}
                        >
                            Parler à Anaïs
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

const QuoteProcessSection = ({ darkMode = false } = {}) => {
    const t = quoteTokens(darkMode);

    return (
        <section className={`${QUOTE_SHELL} quote-process-section pt-7 lg:pt-0`}>
            <div className={`${QUOTE_STEP_RADIUS} ${QUOTE_STEP_PADDING} ${t.stepPanel}`}>
                <p className={`${QUOTE_TYPE.eyebrow} ${t.accent}`}>Le parcours</p>
                <h2 className={`quote-balance mt-3 max-w-[22ch] ${QUOTE_TYPE.section}`}>
                    Comment ça se passe ?
                </h2>

                <ol className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 sm:gap-x-8 lg:mt-9 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-8">
                    {processSteps.map((step, index) => (
                        <li
                            key={step.title}
                            className={`min-w-0 ${index > 0 ? `lg:border-l lg:pl-6 ${t.hairline}` : ''}`}
                        >
                            <span className={`font-serif text-[1.35rem] leading-none tracking-[-0.01em] lg:text-[1.6rem] ${darkMode ? 'text-white/25' : 'text-[#c9beb0]'}`}>
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <h3 className={`mt-3 text-pretty ${QUOTE_TYPE.cardTitle} lg:mt-4`}>{step.title}</h3>
                            <p className={`mt-1.5 max-w-[26ch] ${QUOTE_TYPE.meta} ${t.muted} lg:mt-2`}>
                                {step.text}
                            </p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
};

export default function QuoteRequestServerView({ darkMode = false } = {}) {
    const t = quoteTokens(darkMode);

    return (
        <main data-ssr-quote="true" className={`quote-surface overflow-x-hidden ${t.surface}`}>
            <ArchitecturalHeaderServer darkMode={darkMode} />
            <QuoteHero darkMode={darkMode} />
            <div id="demande-de-devis" className="quote-anchor">
                <QuoteFormSsrShell darkMode={darkMode} />
                <QuoteFormDeferredIsland initialDarkMode={darkMode} />
            </div>
            <QuoteProcessSection darkMode={darkMode} />
        </main>
    );
}
