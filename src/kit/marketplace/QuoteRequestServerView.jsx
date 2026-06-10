import {
    ClipboardCheck,
    Heart,
    Search,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
} from 'lucide-react';
import quoteRestorationHero from '../../assets/quote-restoration-hero.webp';
import DarkModeToggleIsland from './DarkModeToggleIsland';
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

const headerLinks = [
    { label: 'Accueil', href: '/' },
    { label: 'Galerie', href: '/galerie' },
    { label: 'Devis', href: '/devis' },
    { label: 'Wishlist', href: '/wishlist' },
];

const proofItems = [
    { icon: ClipboardCheck, text: 'Devis personnalise sous 48h' },
    { icon: Sparkles, text: 'Artisanat francais & eco-responsable' },
    { icon: ShieldCheck, text: 'Un accompagnement sur-mesure' },
];

const QuotePageHeader = ({ darkMode = false } = {}) => {
    const actionButtonClass = `flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 active:scale-[0.96] ${darkMode ? 'text-stone-200 hover:bg-white/[0.08] hover:text-[#D9B58D]' : 'text-stone-900 hover:bg-white hover:text-[#8B5C42]'}`;

    return (
        <header className={`sticky top-0 z-50 safe-pt-header shadow-[0_1px_0_rgba(28,24,20,0.06)] ${darkMode ? 'bg-[#0A0A0A] text-stone-200' : 'bg-white text-stone-900'}`}>
            <div className="mx-auto flex h-16 max-w-[1920px] items-center justify-between px-3 md:h-[76px] md:px-8">
                <a href="/" className="-ml-1 flex shrink-0 items-center gap-1 md:-ml-8" aria-label="Retour a l'accueil Seconde Vie">
                    <img
                        src="/images/logoanais-320.webp"
                        alt="Logo Seconde Vie"
                        width="320"
                        height="240"
                        decoding="async"
                        className={`h-10 w-auto object-contain md:h-[50px] ${darkMode ? 'brightness-0 invert opacity-100' : 'brightness-0 opacity-80'}`}
                    />
                    <span className="flex flex-col leading-none">
                        <span className={`flex items-center gap-0.5 font-serif text-[16px] font-bold tracking-normal md:text-[24px] ${darkMode ? 'text-stone-200' : 'text-stone-900'}`}>
                            Seconde Vie<span className="-mb-1 text-[26px] leading-none text-orange-600">.</span>
                        </span>
                        <span className={`mt-0.5 font-serif text-[11px] italic md:text-[14px] ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>par Anais</span>
                    </span>
                </a>

                <form action="/galerie" className="absolute left-1/2 hidden w-full max-w-xl -translate-x-1/2 px-4 lg:block xl:max-w-2xl">
                    <label className="relative block">
                        <span className="sr-only">Rechercher un produit</span>
                        <input
                            type="search"
                            name="q"
                            placeholder="Rechercher un produit..."
                            className={`h-11 w-full rounded-md border py-2.5 pl-4 pr-10 font-sans text-[13px] tracking-wide outline-none transition-colors ${darkMode ? 'border-white/10 bg-[#1A1A1A] text-stone-200 placeholder:text-stone-500 focus:border-white/30' : 'border-transparent bg-[#F2F0ED] text-stone-800 placeholder:text-stone-400 focus:border-stone-300'}`}
                        />
                        <Search size={16} strokeWidth={1.5} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    </label>
                </form>

                <div className="relative z-10 flex shrink-0 items-center gap-2 md:gap-4">
                    <div className={`flex items-center gap-1 rounded-full p-1 ring-1 ${darkMode ? 'bg-white/[0.045] ring-white/[0.09]' : 'bg-stone-100/85 ring-stone-200/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'}`}>
                        <a href="/admin" className={`group hidden h-9 items-center gap-2 rounded-full px-3 font-sans transition-all duration-300 active:scale-[0.97] md:flex ${darkMode ? 'bg-white/[0.04] text-stone-400 hover:bg-white/[0.09] hover:text-stone-100' : 'bg-white/70 text-stone-500 hover:bg-white hover:text-stone-900'}`}>
                            <ShieldCheck size={14} className="text-stone-400 transition-colors group-hover:text-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.16em]">Connexion</span>
                        </a>
                        <DarkModeToggleIsland className={actionButtonClass} />
                        <a href="/wishlist" className={actionButtonClass} aria-label="Ma wishlist" title="Ma wishlist">
                            <Heart size={18} strokeWidth={1.5} />
                        </a>
                        <a href="/checkout" className={actionButtonClass} aria-label="Panier" title="Panier">
                            <ShoppingBag size={18} strokeWidth={1.5} />
                        </a>
                        <details className="relative">
                            <summary className={`mr-1 flex h-10 min-w-10 cursor-pointer list-none items-center justify-center gap-2 rounded-full px-2.5 font-sans text-[10px] font-black uppercase tracking-[0.16em] transition-all duration-300 active:scale-[0.96] md:mr-0 md:px-3.5 ${darkMode ? 'bg-white/[0.07] text-stone-100 hover:text-[#D9B58D]' : 'bg-white text-stone-900 shadow-sm hover:text-[#8B5C42]'}`}>
                                Menu
                            </summary>
                            <nav className={`absolute right-0 top-12 z-[2100] grid w-64 gap-2 rounded-[18px] border p-3 text-sm font-bold shadow-2xl ${darkMode ? 'border-white/10 bg-[#121212]' : 'border-stone-200 bg-[#fbfaf7]'}`} aria-label="Menu principal">
                                {headerLinks.map((link) => (
                                    <a key={link.href} href={link.href} className={`rounded-[8px] border px-4 py-3 transition-colors ${darkMode ? 'border-white/10 bg-white/[0.04] hover:border-[#D9B58D] hover:text-[#D9B58D]' : 'border-stone-200 bg-white hover:border-[#9A714C] hover:text-[#8B5C42]'}`}>
                                        {link.label}
                                    </a>
                                ))}
                            </nav>
                        </details>
                    </div>
                </div>
            </div>
        </header>
    );
};

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
            <QuotePageHeader darkMode={darkMode} />
            <QuoteHero darkMode={darkMode} />
            <QuoteFormIsland darkMode={darkMode} />
            <QuoteProcessSection darkMode={darkMode} />
        </main>
    );
}
