import quoteRestorationHero from '../../assets/quote-restoration-hero.webp';
import ArchitecturalHeaderServer from './ArchitecturalHeaderServer';
import PageBreadcrumb from './PageBreadcrumb';
import QuoteFormDeferredIsland from './QuoteFormDeferredIsland';
import QuoteFormSsrShell from './QuoteFormSsrShell';
import QuoteRevealIsland from './QuoteRevealIsland';
import {
    QUOTE_EASE,
    QUOTE_INTRO_DELAY,
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

/* La cascade complete vit dans le theme : le shell du formulaire l'enchaine. */
const HERO_DELAY = QUOTE_INTRO_DELAY;

const QuoteHero = ({ darkMode = false } = {}) => {
    const t = quoteTokens(darkMode);
    const heroTint = darkMode ? '#100e0c' : '#f4f1ec';
    const surfaceTint = darkMode ? '#0A0A0A' : '#fbfaf8';

    return (
        <section data-quote-reveal="hero" data-quote-reveal-mode="eager" className="quote-reveal-group relative overflow-hidden">
            <div className={`absolute inset-0 ${t.heroBg}`} />
            <div className="quote-reveal-media absolute inset-y-0 right-0 hidden w-[46%] lg:block">
                <img
                    src={quoteRestorationHeroSrc}
                    alt="Meuble ancien en restauration dans un atelier artisanal"
                    className="h-full w-full object-cover object-bottom"
                />
                {/*
                 * Fondu long et progressif : la colonne de texte ne vient
                 * jamais buter contre la photo, meme en 1480px.
                 */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `linear-gradient(to right, ${heroTint} 0%, ${heroTint} 18%, ${heroTint}d9 42%, ${heroTint}59 70%, transparent 100%)`,
                    }}
                />
            </div>
            {/* Le hero se fond dans la section suivante au lieu de se couper net. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-24 lg:h-32"
                style={{ backgroundImage: `linear-gradient(to bottom, transparent, ${surfaceTint})` }}
            />

            <div className={`relative ${QUOTE_SHELL} pb-10 pt-4 lg:min-h-[560px] lg:pb-12 lg:pt-6`}>
                <div className="quote-reveal-item" style={{ '--quote-delay': HERO_DELAY.breadcrumb }}>
                    <PageBreadcrumb current="Devis" darkMode={darkMode} />
                </div>

                <div className="mt-7 max-w-[34rem] lg:mt-11 lg:pr-10">
                    <p
                        className={`quote-reveal-item ${QUOTE_TYPE.eyebrow} ${t.accent}`}
                        style={{ '--quote-delay': HERO_DELAY.eyebrow }}
                    >
                        Restauration de meubles anciens
                    </p>
                    <h1
                        className={`quote-reveal-title quote-balance mt-4 max-w-[20ch] ${QUOTE_TYPE.display}`}
                        style={{ '--quote-delay': HERO_DELAY.title }}
                    >
                        Demandez un devis de restauration
                    </h1>
                    <p
                        className={`quote-reveal-item mt-5 max-w-[33rem] text-pretty ${QUOTE_TYPE.lead} ${darkMode ? 'text-stone-300' : 'text-[#4a443d]'}`}
                        style={{ '--quote-delay': HERO_DELAY.lead }}
                    >
                        Décrivez votre meuble en quelques étapes. Anaïs étudie votre projet
                        et vous répond avec un devis détaillé, sans engagement.
                    </p>

                    <div className="mt-9 lg:mt-10">
                        <span
                            aria-hidden="true"
                            className={`quote-reveal-rule block h-px w-full ${t.rule}`}
                            style={{ '--quote-delay': HERO_DELAY.rule }}
                        />
                        <dl className="grid grid-cols-3 pt-6">
                            {heroSpecs.map(({ value, label }, index) => (
                                <div
                                    key={label}
                                    className={`quote-reveal-item ${index > 0 ? `border-l pl-4 sm:pl-6 ${t.hairline}` : 'pr-4'}`}
                                    style={{ '--quote-delay': HERO_DELAY.spec(index) }}
                                >
                                    <dt className="font-serif text-[1.35rem] leading-none tracking-[-0.01em] sm:text-[1.5rem]">
                                        {value}
                                    </dt>
                                    <dd className={`mt-2 font-sans text-[10.5px] font-medium uppercase leading-[1.3] tracking-[0.11em] ${t.faint}`}>
                                        {label}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    <div
                        className="quote-reveal-item mt-9 lg:mt-10"
                        style={{ '--quote-delay': HERO_DELAY.cta }}
                    >
                        <a
                            href="#demande-de-devis"
                            className={`group inline-flex h-[54px] items-center justify-center gap-3 rounded-full pl-7 pr-2 font-sans text-[13px] font-semibold ${QUOTE_EASE} hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] ${darkMode ? 'hover:shadow-[0_14px_34px_rgba(0,0,0,0.45)]' : 'hover:shadow-[0_14px_34px_rgba(28,25,23,0.22)]'} ${t.primaryBtn} ${t.focusRing}`}
                        >
                            Commencer ma demande
                            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${QUOTE_EASE} group-hover:translate-x-1 ${darkMode ? 'bg-black/10' : 'bg-white/15'}`}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M5 12h14" />
                                    <path d="m13 6 6 6-6 6" />
                                </svg>
                            </span>
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
            <div data-quote-reveal="process" className={`quote-reveal-group ${QUOTE_STEP_RADIUS} ${QUOTE_STEP_PADDING} ${t.stepPanel}`}>
                <p className={`quote-reveal-item-1 ${QUOTE_TYPE.eyebrow} ${t.accent}`}>Le parcours</p>
                <h2 className={`quote-reveal-item-2 quote-reveal-soft quote-balance mt-3 max-w-[22ch] ${QUOTE_TYPE.section}`}>
                    Comment ça se passe ?
                </h2>

                <ol className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 sm:gap-x-8 lg:mt-9 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-8">
                    {processSteps.map((step, index) => (
                        <li
                            key={step.title}
                            className={`group quote-reveal-item-${index + 3} min-w-0 ${index > 0 ? `lg:border-l lg:pl-6 ${t.hairline}` : ''}`}
                        >
                            {/* Le numero prend l'accent au survol : le parcours repond sans bouger la mise en page. */}
                            <span className={`block font-serif text-[1.35rem] leading-none tracking-[-0.01em] ${QUOTE_EASE} lg:text-[1.6rem] ${darkMode ? 'text-white/25 group-hover:text-[#D9B58D]' : 'text-[#c9beb0] group-hover:text-[#8B5C42]'}`}>
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <span
                                aria-hidden="true"
                                className={`mt-3 block h-px w-7 origin-left ${QUOTE_EASE} group-hover:w-12 ${t.rule}`}
                            />
                            <h3 className={`mt-3.5 text-pretty ${QUOTE_TYPE.cardTitle} lg:mt-4`}>{step.title}</h3>
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

    /*
     * `overflow-x-clip` et non `hidden` : `overflow-x: hidden` ferait de <main>
     * un conteneur de defilement, et les timelines de scroll des reveals s'y
     * accrocheraient au lieu du document — donc figees a jamais.
     * `clip` bloque le debordement horizontal sans creer de scrollport.
     */
    return (
        <main data-ssr-quote="true" className={`quote-surface overflow-x-clip ${t.surface}`}>
            <ArchitecturalHeaderServer darkMode={darkMode} />
            <QuoteRevealIsland />
            <QuoteHero darkMode={darkMode} />
            <div id="demande-de-devis" className="quote-anchor">
                <QuoteFormSsrShell darkMode={darkMode} />
                <QuoteFormDeferredIsland initialDarkMode={darkMode} />
            </div>
            <QuoteProcessSection darkMode={darkMode} />
        </main>
    );
}
