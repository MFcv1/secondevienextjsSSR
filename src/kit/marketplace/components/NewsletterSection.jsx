import React from 'react';
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles, Tag } from 'lucide-react';

const DISCOUNT_FEATURE_CARDS = [
    {
        Icon: LockKeyhole,
        toneLabel: 'Liberté',
        accent: '#9B6741',
        soft: '#F8ECE5',
        wash: 'linear-gradient(135deg, rgba(255,248,243,0.96), rgba(248,236,229,0.72))',
        ring: 'rgba(155,103,65,0.18)',
        title: 'Sans engagement',
        text: 'Tu restes libre de te désabonner à tout moment.',
    },
    {
        Icon: Tag,
        toneLabel: 'Primeur',
        accent: '#6E765D',
        soft: '#EEF2E7',
        wash: 'linear-gradient(135deg, rgba(250,250,245,0.96), rgba(238,242,231,0.78))',
        ring: 'rgba(110,118,93,0.18)',
        title: 'Offres en avant-première',
        text: 'Découvre nos nouveautés et profite d’offres exclusives.',
    },
    {
        Icon: Mail,
        toneLabel: 'Simple',
        accent: '#A36E55',
        soft: '#F7EAE3',
        wash: 'linear-gradient(135deg, rgba(255,249,244,0.97), rgba(247,234,227,0.76))',
        ring: 'rgba(163,110,85,0.17)',
        title: 'Désinscription facile',
        text: 'Un clic suffit pour ne plus recevoir nos e-mails.',
    },
    {
        Icon: ShieldCheck,
        toneLabel: 'Confiance',
        accent: '#757466',
        soft: '#ECEDE4',
        wash: 'linear-gradient(135deg, rgba(250,249,244,0.97), rgba(236,237,228,0.72))',
        ring: 'rgba(117,116,102,0.18)',
        title: 'Paiement sécurisé',
        text: 'Vos transactions sont protégées et 100% sécurisées.',
    },
];

const NewsletterSection = React.memo(function NewsletterSection({ darkMode }) {
    const sectionRef = React.useRef(null);

    return (
        <section
            ref={sectionRef}
            className={`discount-section relative mb-8 flex items-center overflow-hidden px-3 py-10 sm:px-5 sm:py-12 md:min-h-[690px] md:px-7 md:py-14 lg:mb-10 lg:min-h-[760px] lg:px-8 lg:py-16 2xl:min-h-[780px] 2xl:px-10 ${
                darkMode ? 'bg-[#141210]' : 'bg-[#f7f1ea]'
            }`}
        >
            <div className={`pointer-events-none absolute inset-0 ${
                darkMode
                    ? 'bg-[radial-gradient(circle_at_76%_32%,rgba(184,132,72,0.14),transparent_31%),radial-gradient(circle_at_20%_72%,rgba(130,148,112,0.11),transparent_34%)]'
                    : 'bg-[radial-gradient(circle_at_17%_22%,rgba(184,144,101,0.13),transparent_31%),radial-gradient(circle_at_84%_78%,rgba(157,102,88,0.08),transparent_34%),linear-gradient(180deg,#fbf8f3_0%,#f3ebe2_100%)]'
            }`} />
            <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:radial-gradient(rgba(121,91,61,0.20)_0.7px,transparent_0.7px)] [background-size:11px_11px]" />
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-36 ${
                darkMode
                    ? 'bg-gradient-to-b from-[#141210] via-[#141210] to-transparent opacity-80'
                    : 'bg-gradient-to-b from-[#FAFAF9] via-[#f7f1ea] to-transparent'
            }`} />

            <div className={`relative mx-auto w-full max-w-[1480px] overflow-hidden rounded-[26px] p-[1px] shadow-[0_30px_86px_-68px_rgba(37,29,22,0.56),0_10px_30px_-28px_rgba(124,88,55,0.38)] ring-1 ${
                darkMode ? 'bg-white/[0.04] ring-[#3a332a]/90' : 'bg-gradient-to-br from-[#e1d1bd] via-[#fffaf3] to-[#d7c5b2] ring-[#d8c9b6]'
            }`}>
                <div className={`relative overflow-hidden rounded-[25px] p-1.5 ${
                    darkMode ? 'bg-[#1d1a16] shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]' : 'bg-[#fffaf3] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]'
                }`}>
                    <div className={`pointer-events-none absolute inset-1.5 rounded-[21px] ring-1 ${
                        darkMode ? 'ring-[#3a332a]/80' : 'ring-[#d9c9b5]'
                    }`} />
                    <div className={`relative grid overflow-hidden rounded-[20px] ring-1 lg:grid-cols-[minmax(0,1.02fr)_minmax(370px,0.98fr)] ${
                        darkMode ? 'bg-[#1d1a16] ring-[#332b23]' : 'bg-[#fffdf8] ring-[#e4d7c7]'
                    }`}>
                        <div className={`relative flex min-h-[340px] flex-col justify-center overflow-hidden border-b p-5 sm:min-h-[360px] sm:p-7 md:p-8 lg:min-h-[470px] lg:border-b-0 lg:border-r lg:p-9 xl:p-10 2xl:p-12 ${
                            darkMode ? 'border-[#332b23] bg-[#1d1a16]' : 'border-[#e4d7c7] bg-[#fffdf8]'
                        }`}>
                            <div className={`pointer-events-none absolute inset-0 ${
                                darkMode
                                    ? 'bg-[radial-gradient(circle_at_90%_14%,rgba(184,132,72,0.11),transparent_26%)]'
                                    : 'bg-[radial-gradient(circle_at_89%_13%,rgba(166,138,100,0.12),transparent_24%),radial-gradient(ellipse_at_6%_44%,rgba(119,91,61,0.09),transparent_21%)]'
                            }`} />
                            <div className="pointer-events-none absolute -left-16 top-28 hidden h-56 w-32 rotate-[-18deg] rounded-full bg-[#5e4b37]/10 blur-2xl lg:block" />
                            <div className="discount-reveal relative flex items-center gap-4">
                                <span className={`inline-flex h-8 items-center gap-2 rounded-full px-4 font-sans text-[9px] font-extrabold uppercase tracking-[0.24em] shadow-[inset_0_1px_0_rgba(255,255,255,0.74)] ring-1 ${
                                    darkMode ? 'bg-white/[0.055] text-[#d8c6b2] ring-[#3a332a]' : 'bg-[#f5ede3] text-[#8a6646] ring-[#e6d9c9]'
                                }`}>
                                    <Sparkles size={13} strokeWidth={1.35} aria-hidden="true" />
                                    Offre exclusive
                                </span>
                                <span className={`hidden h-px flex-1 sm:block ${darkMode ? 'bg-[#5c4a36]/55' : 'bg-[#dfd0be]'}`} />
                                <span className={`hidden text-[22px] leading-none sm:block ${darkMode ? 'text-[#8a6b48]' : 'text-[#b79e7d]'}`} aria-hidden="true">✣</span>
                            </div>

                            <h2
                                className={`discount-reveal relative mt-7 max-w-[690px] text-[clamp(2.85rem,4.15vw,4.55rem)] leading-[0.9] tracking-[-0.04em] sm:mt-8 lg:mt-9 ${
                                    darkMode ? 'text-[#f8f1e8]' : 'text-[#191713]'
                                }`}
                                style={{
                                    fontFamily: "'Cormorant Garamond', 'EB Garamond', Georgia, serif",
                                    fontWeight: 500,
                                }}
                            >
                                <span className="block">Abonne-toi</span>
                                <span className="block">et reçois ton</span>
                                <span className="mt-1 block md:whitespace-nowrap">
                                    <span className="italic text-[#9B734A]" style={{ fontWeight: 500, letterSpacing: '-0.055em' }}>code</span> promotionnel
                                </span>
                            </h2>

                            <div className="discount-reveal relative mt-2 flex flex-nowrap items-center gap-x-3 gap-y-2 sm:mt-6 sm:flex-wrap sm:gap-x-4 sm:gap-y-2.5">
                                <span
                                    className="inline-flex shrink-0 items-baseline text-[clamp(3.25rem,14vw,4rem)] italic leading-[0.78] tracking-[-0.055em] text-[#9B734A] sm:translate-y-[-3px] sm:text-[clamp(3.9rem,4.2vw,4.95rem)] lg:translate-y-[-4px]"
                                    style={{
                                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                                        fontWeight: 300,
                                    }}
                                    aria-label="10%"
                                >
                                    <span>10</span>
                                    <span className="ml-[0.01em] inline-block translate-y-[0.015em] text-[0.82em]">%</span>
                                </span>
                                <span className={`ml-1.5 h-[32px] w-px shrink-0 translate-y-[5px] sm:ml-0 sm:h-[48px] sm:translate-y-0 ${darkMode ? 'bg-[#5c4a36]/65' : 'bg-[rgba(155,115,74,0.35)]'}`} aria-hidden="true" />
                                <span className={`translate-x-1 translate-y-[6px] whitespace-nowrap font-sans text-[8px] font-bold uppercase leading-none tracking-[0.13em] sm:max-w-[260px] sm:translate-x-0 sm:translate-y-0 sm:text-[10.5px] sm:tracking-[0.2em] lg:text-[11.5px] ${
                                    darkMode ? 'text-[#f2e8dc]' : 'text-[#26221D]'
                                }`}>
                                    Sur ta première découverte
                                </span>
                                <span className={`hidden h-px min-w-[100px] flex-1 md:block ${darkMode ? 'bg-[#5c4a36]/55' : 'bg-[#dfd0be]'}`} aria-hidden="true" />
                                <span className={`hidden text-[40px] leading-none md:block ${darkMode ? 'text-[#8a6b48]' : 'text-[#b79e7d]'}`} aria-hidden="true">✧</span>
                            </div>

                            <form className={`discount-reveal relative mt-6 grid w-full max-w-[640px] grid-cols-[minmax(0,1fr)_50px] gap-2 rounded-[20px] p-1.5 ring-1 sm:grid-cols-[minmax(0,1fr)_auto] ${
                                darkMode ? 'bg-[#211d18] ring-[#3a332a]/95 shadow-[0_18px_38px_-31px_rgba(12,9,7,0.7),inset_0_1px_0_rgba(255,255,255,0.06)]' : 'bg-[#f3e8dc] ring-[#dccab8] shadow-[0_18px_38px_-31px_rgba(52,37,25,0.45),inset_0_1px_0_rgba(255,255,255,0.82)]'
                            }`} onSubmit={(event) => event.preventDefault()}>
                                <label className={`flex min-h-[50px] min-w-0 items-center gap-3 rounded-[15px] px-4 ring-1 transition-colors duration-300 focus-within:ring-[#cbb89f] sm:min-h-[56px] sm:px-5 ${
                                    darkMode
                                        ? 'bg-[#151310] text-[#f8f1e8] ring-[#3a332a]/80'
                                        : 'bg-[#fffdf8] text-[#242221] ring-[#eadfce]'
                                }`}>
                                    <Mail size={18} strokeWidth={1.45} className={darkMode ? 'text-[#a68a63]' : 'text-[#9a7651]'} aria-hidden="true" />
                                    <input
                                        type="email"
                                        placeholder="Ton adresse e-mail"
                                        className={`min-w-0 flex-1 bg-transparent font-serif text-[15.5px] outline-none placeholder:text-[#91877b] ${
                                            darkMode ? 'text-[#f8f1e8]' : 'text-[#242221]'
                                        }`}
                                    />
                                </label>
                                <button
                                    type="submit"
                                    aria-label="Recevoir mon code"
                                    className={`group inline-flex min-h-[50px] w-[50px] items-center justify-center rounded-[15px] px-0 font-sans text-[9px] font-black uppercase tracking-[0.18em] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_15px_28px_-20px_rgba(20,15,12,0.8)] ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.97] sm:min-h-[56px] sm:w-auto sm:min-w-[250px] sm:justify-between sm:px-3 sm:pl-7 ${
                                        darkMode ? 'bg-[#f8efe2] text-[#17120e] ring-white/20 hover:bg-[#fff6e8]' : 'bg-[#fffaf3] text-[#7b4f2b] ring-[#dccab8] hover:bg-[#f8efe2] sm:bg-[#251f18] sm:text-[#fff8ee] sm:ring-black/10 sm:hover:bg-[#18130f]'
                                    }`}
                                >
                                    <span className="hidden sm:inline">Recevoir mon code</span>
                                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#fff8ee] ring-1 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 sm:ml-4 ${
                                        darkMode ? 'bg-[#7d542b] ring-[#b48655]/50' : 'bg-[#6f4825] ring-[#b48655]/45'
                                    }`}>
                                        <ArrowRight size={16} strokeWidth={1.55} />
                                    </span>
                                </button>
                            </form>

                            <div className={`discount-reveal relative mt-4 flex items-center gap-2.5 font-sans text-[9px] font-extrabold uppercase tracking-[0.17em] sm:text-[10px] ${
                                darkMode ? 'text-[#9a8a77]' : 'text-[#75695f]'
                            }`}>
                                <Mail size={14} strokeWidth={1.45} aria-hidden="true" />
                                <span>Ton code est envoyé instantanément par e-mail.</span>
                            </div>
                        </div>

                        <div className={`relative flex min-h-full p-2 sm:p-4 md:p-5 lg:p-6 ${
                            darkMode ? 'bg-[#1d1a16]' : 'bg-[#fffbf5]'
                        }`}>
                            <div className="mx-auto grid w-full max-w-[355px] grid-cols-2 gap-2 sm:max-w-none sm:gap-3 lg:grid-cols-2">
                                {DISCOUNT_FEATURE_CARDS.map(({ Icon, toneLabel, title, text, accent, soft, wash, ring }) => (
                                    <article
                                        key={title}
                                        style={{
                                            '--feature-accent': accent,
                                            '--feature-soft': soft,
                                            '--feature-wash': wash,
                                            '--feature-ring': ring,
                                        }}
                                        className={`discount-industrial-card group relative min-h-[64px] overflow-hidden rounded-[12px] p-[1px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 sm:min-h-[206px] sm:rounded-[22px] lg:min-h-[214px] ${
                                            darkMode
                                                ? 'bg-gradient-to-br from-[#3a3026] via-[#211d18] to-[#171411] shadow-[0_18px_46px_-36px_rgba(0,0,0,0.95)]'
                                                : 'bg-gradient-to-br from-[#ddcdbc] via-[#fff8ef] to-[#d9c8b8] shadow-[0_18px_44px_-38px_rgba(62,43,27,0.62)] hover:shadow-[0_28px_58px_-40px_rgba(62,43,27,0.72)]'
                                        }`}
                                    >
                                        <div className={`relative flex h-full flex-col overflow-hidden rounded-[11px] p-2.5 ring-1 sm:rounded-[21px] sm:p-5 ${
                                            darkMode ? 'bg-[linear-gradient(135deg,#211d18,#191612)] text-[#f8f1e8] ring-[#3d3228] shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]' : 'text-[#181716] ring-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]'
                                        }`} style={{ background: darkMode ? undefined : 'var(--feature-wash)' }}>
                                            <div className={`pointer-events-none absolute inset-[4px] rounded-[8px] ring-1 sm:inset-[6px] sm:rounded-[16px] ${
                                                darkMode ? 'ring-[#3d3228]/80' : 'ring-white/65'
                                            }`} />
                                            <div className={`pointer-events-none absolute -right-10 -top-10 hidden h-32 w-32 rounded-full opacity-50 blur-3xl transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 sm:block ${
                                                darkMode ? 'bg-[#b9864f]/20' : 'bg-[color:var(--feature-soft)]'
                                            }`} />

                                            <div className="relative z-10 flex h-full items-center gap-2.5 sm:h-auto sm:items-start sm:gap-3">
                                                <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[color:var(--feature-accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_24px_-20px_rgba(60,42,26,0.55)] ring-1 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 sm:h-[50px] sm:w-[50px] ${
                                                    darkMode ? 'bg-[#e8ddd0]/86 ring-[#6d543b]/35' : 'bg-[#fffbf6]/72 ring-[color:var(--feature-ring)]'
                                                }`}>
                                                    <span className="absolute inset-[4px] rounded-full ring-1 ring-[color:var(--feature-ring)] sm:inset-[5px]" aria-hidden="true" />
                                                    <Icon size={18} strokeWidth={1.35} className="h-3.5 w-3.5 sm:h-[22px] sm:w-[22px]" aria-hidden="true" />
                                                </span>
                                                <div className="min-w-0 pt-0 sm:pt-1">
                                                    <span className="hidden font-sans text-[5.8px] font-black uppercase tracking-[0.16em] text-[color:var(--feature-accent)] sm:block sm:text-[8px] sm:tracking-[0.26em]">
                                                        {toneLabel}
                                                    </span>
                                                    <h3 className="max-w-[116px] font-serif text-[10px] font-semibold uppercase leading-[1.02] tracking-normal sm:mt-3 sm:max-w-[220px] sm:text-[21px] sm:leading-[0.96]">
                                                        {title}
                                                    </h3>
                                                </div>
                                            </div>

                                            <p className={`relative z-10 mt-5 hidden max-w-[250px] font-serif text-[15.5px] leading-[1.38] sm:block ${
                                                darkMode ? 'text-stone-300' : 'text-[#62584e]'
                                            }`}>
                                                {text}
                                            </p>

                                            <div className="relative z-10 mt-auto hidden items-center gap-3 pt-5 sm:flex">
                                                <span className={`h-px flex-1 ${
                                                    darkMode ? 'bg-[#5c4a36]/55' : 'bg-[#dfd1c1]'
                                                }`} aria-hidden="true" />
                                                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--feature-accent)] ring-1 ring-[color:var(--feature-ring)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 ${
                                                    darkMode ? 'bg-[#e8ddd0]/70' : 'bg-[#fffbf6]/58'
                                                }`}>
                                                    <ArrowRight size={16} strokeWidth={1.35} aria-hidden="true" />
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
});

export default NewsletterSection;
