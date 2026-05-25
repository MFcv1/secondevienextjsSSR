import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const TRANSPARENT_IMAGE_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const BeforeAfterSection = ({ darkMode, projects = [] }) => {
    const safeProjects = Array.isArray(projects) ? projects : [];
    const sectionRef = useRef(null);
    const sliderClipRef = useRef(null);
    const sliderLineRef = useRef(null);
    const sliderInputRef = useRef(null);
    const [activeProjectIndex, setActiveProjectIndex] = useState(0);
    const [isMediaReady, setIsMediaReady] = useState(false);
    const activeProject = safeProjects[activeProjectIndex] || safeProjects[0];

    React.useEffect(() => {
        if (isMediaReady) return undefined;
        if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
            setIsMediaReady(true);
            return undefined;
        }

        const node = sectionRef.current;
        if (!node) return undefined;

        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            setIsMediaReady(true);
            observer.disconnect();
        }, {
            rootMargin: '760px 0px 960px',
            threshold: 0.01,
        });

        observer.observe(node);
        return () => observer.disconnect();
    }, [isMediaReady]);

    useLayoutEffect(() => {
        if (sliderClipRef.current) sliderClipRef.current.style.clipPath = 'polygon(0 0, 50% 0, 50% 100%, 0 100%)';
        if (sliderLineRef.current) sliderLineRef.current.style.left = '50%';
        if (sliderInputRef.current) sliderInputRef.current.value = '50';
    }, [activeProjectIndex]);
    const handleSliderInput = useCallback((e) => {
        const val = e.target.value;
        if (sliderClipRef.current) sliderClipRef.current.style.clipPath = `polygon(0 0, ${val}% 0, ${val}% 100%, 0 100%)`;
        if (sliderLineRef.current) sliderLineRef.current.style.left = `${val}%`;
    }, []);
    const handleNextProject = () => setActiveProjectIndex((prev) => (safeProjects.length ? (prev + 1) % safeProjects.length : 0));
    const handlePrevProject = () => setActiveProjectIndex((prev) => (safeProjects.length ? (prev - 1 + safeProjects.length) % safeProjects.length : 0));
    if (!activeProject) return null;
    const apresSrc = isMediaReady ? activeProject.apres : TRANSPARENT_IMAGE_SRC;
    const avantSrc = isMediaReady ? activeProject.avant : TRANSPARENT_IMAGE_SRC;

    return (
            <section
                ref={sectionRef}
                className={`before-after-industrial relative flex w-full items-center overflow-hidden px-3 py-10 sm:px-5 sm:py-12 md:min-h-[690px] md:px-7 md:py-14 lg:min-h-[760px] lg:px-8 lg:py-16 2xl:min-h-[780px] 2xl:px-10 ${
                darkMode ? 'bg-[#141210]' : 'bg-[#f8f1e6]'
            }`}
            >
                <div className={`pointer-events-none absolute inset-0 ${
                    darkMode
                        ? 'bg-[radial-gradient(circle_at_76%_32%,rgba(184,132,72,0.14),transparent_31%),radial-gradient(circle_at_20%_72%,rgba(130,148,112,0.11),transparent_34%)]'
                        : 'bg-[radial-gradient(circle_at_77%_30%,rgba(188,142,84,0.2),transparent_32%),radial-gradient(circle_at_17%_76%,rgba(135,160,139,0.15),transparent_34%)]'
                }`} />
                <div className={`pointer-events-none absolute inset-0 opacity-[0.33] ${
                    darkMode
                        ? 'bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.035)_48%,transparent_74%)]'
                        : 'bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.7)_48%,transparent_74%)]'
                }`} />
                <div className="pointer-events-none absolute -right-16 top-12 h-80 w-80 rounded-full bg-[#c6a177]/20 blur-3xl" />
                <div className="pointer-events-none absolute left-6 top-0 h-44 w-72 rounded-full bg-white/45 blur-3xl" />

                <div
                    className={`relative mx-auto grid w-full max-w-[1480px] overflow-hidden rounded-[26px] p-1 shadow-[0_30px_92px_-68px_rgba(42,31,21,0.76),0_10px_30px_-28px_rgba(103,71,40,0.56)] ring-1 md:rounded-[30px] md:p-1.5 lg:grid-cols-[minmax(0,0.95fr)_minmax(410px,1.05fr)] ${
                    darkMode ? 'bg-white/[0.035] ring-[#3a332a]/90' : 'bg-[#fff9ef]/78 ring-[#d7c4ad]/80'
                }`}>
                    <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#5c4630_0.55px,transparent_0.55px)] [background-size:6px_6px]" />
                    <div className={`pointer-events-none absolute left-[47.5%] top-8 hidden h-[calc(100%-4rem)] w-px lg:block ${
                        darkMode ? 'bg-gradient-to-b from-transparent via-[#5c4a36]/60 to-transparent' : 'bg-gradient-to-b from-transparent via-[#c9ad8e] to-transparent'
                    }`}>
                        <span className={`absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 border ${
                            darkMode ? 'border-[#6d543b]/70 bg-[#1d1a16]' : 'border-[#c7a47b] bg-[#fffaf3]'
                        }`} />
                    </div>
                    <div className={`relative flex min-h-[320px] flex-col justify-center rounded-t-[24px] border-b p-5 sm:min-h-[340px] sm:p-7 md:p-8 lg:min-h-[430px] lg:rounded-l-[26px] lg:rounded-tr-none lg:border-b-0 lg:border-r lg:p-8 xl:p-9 2xl:p-10 ${
                        darkMode ? 'border-[#332b23] bg-[#1d1a16] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]' : 'border-[#ead8c4] bg-[#fffaf3] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]'
                    }`}>
                        <div className="flex items-center gap-4">
                            <span className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 font-sans text-[8.5px] font-extrabold uppercase tracking-[0.22em] ring-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_10px_24px_-22px_rgba(79,55,31,0.85)] ${
                                darkMode ? 'bg-white/[0.055] text-[#d8c6b2] ring-white/12' : 'bg-[#fff7ee] text-[#8b5c37] ring-[#d8c5af]'
                            }`}>
                                <span className="h-1.5 w-1.5 rounded-full bg-[#b9854f]" />
                                Service maison
                            </span>
                            <span className={`relative hidden h-px flex-1 sm:block ${darkMode ? 'bg-white/12' : 'bg-[#d9c6ae]'}`}>
                                <span className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rotate-45 bg-[#b9854f]" />
                            </span>
                        </div>

                        <h2 className={`mt-6 max-w-[620px] font-serif text-[clamp(2.85rem,7vw,4.75rem)] font-semibold leading-[0.9] tracking-normal lg:mt-7 lg:text-[clamp(3rem,3.8vw,4.55rem)] ${
                            darkMode ? 'text-[#fbf2e7]' : 'text-[#1d1914]'
                        }`}>
                            <span className="block">Chiner sans</span>
                            <span className="block">courir les</span>
                            <span className="block">brocantes,</span>
                            <span className="block pt-1 italic font-light text-[#b9864f]">c'est possible&nbsp;!</span>
                        </h2>

                        <div className="mt-4 flex items-center gap-4">
                            <span className={`h-px w-20 ${darkMode ? 'bg-white/12' : 'bg-[#dcc8af]'}`} />
                            <span className="h-2 w-2 rotate-45 border border-[#b9864f]" aria-hidden="true" />
                            <span className={`h-px w-20 ${darkMode ? 'bg-white/12' : 'bg-[#dcc8af]'}`} />
                        </div>

                        <p className={`mt-5 max-w-[520px] font-sans text-[13px] leading-[1.6] sm:text-[13.5px] md:text-[14px] ${
                            darkMode ? 'text-[#d5c8b9]/78' : 'text-[#5f554a]'
                        }`}>
                            On s'occupe de tout pour vous. De la sélection à la livraison de nos pépites, découvrez comment chiner autrement avec Seconde Vie.
                        </p>

                        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                            <button
                                type="button"
                                className={`group inline-flex min-h-[48px] w-full max-w-[270px] items-center justify-between rounded-full px-2 pl-5 font-sans text-[8.5px] font-extrabold uppercase tracking-[0.16em] ring-1 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] sm:min-h-[56px] sm:max-w-[330px] sm:px-2.5 sm:pl-7 sm:text-[10px] sm:tracking-[0.18em] sm:hover:-translate-y-1 ${
                                    darkMode
                                        ? 'bg-[#f8efe2] text-[#18130f] ring-white/20 shadow-[0_22px_48px_-32px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.88)]'
                                        : 'bg-[#211911] text-[#fff7ec] ring-[#c59b61]/55 shadow-[0_24px_52px_-34px_rgba(43,27,14,0.9),inset_0_1px_0_rgba(255,255,255,0.16)]'
                                }`}
                            >
                                <span>On vous explique tout</span>
                                <span className={`ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] sm:ml-4 sm:h-10 sm:w-10 sm:group-hover:translate-x-1 ${
                                    darkMode ? 'bg-black/[0.08] text-[#17120e] ring-black/10' : 'bg-[#302115] text-[#e6bd77] ring-[#d7aa63]/45'
                                }`}>
                                    <ArrowRight size={14} strokeWidth={1.45} className="sm:h-4 sm:w-4" />
                                </span>
                            </button>

                            <span className={`max-w-[220px] font-sans text-[9.5px] font-bold uppercase leading-relaxed tracking-[0.17em] ${
                                darkMode ? 'text-[#9a8a77]' : 'text-[#9b8b78]'
                            }`}>
                                Sélection, restauration, livraison
                            </span>
                        </div>
                    </div>

                    <div className={`relative flex min-h-full flex-col justify-center gap-4 rounded-b-[24px] p-2 sm:p-4 md:gap-4 md:p-5 lg:rounded-r-[26px] lg:rounded-bl-none lg:p-6 ${
                        darkMode ? 'bg-[#1d1a16]' : 'bg-[#fffaf3]'
                    }`}>
                        <div className="pointer-events-none absolute inset-8 rounded-full bg-[#d8b17c]/15 blur-3xl" />
                        <div className={`relative mx-auto w-full max-w-[780px] rounded-[22px] p-1.5 ring-1 md:rounded-[26px] ${
                            darkMode
                                ? 'bg-white/[0.055] ring-white/12 shadow-[0_26px_82px_-58px_rgba(0,0,0,0.95)]'
                                : 'bg-[#f2e5d4] ring-[#d4bea4] shadow-[0_30px_80px_-56px_rgba(82,54,28,0.86)]'
                        }`}>
                            <div className={`rounded-[20px] p-1.5 ring-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] md:rounded-[23px] ${
                                darkMode ? 'bg-[#211d18] ring-white/[0.08]' : 'bg-[#fff9ef] ring-white/90'
                            }`}>
                                <div className={`group relative aspect-[4/3] w-full cursor-ew-resize overflow-hidden rounded-[16px] ring-1 md:aspect-[16/9.7] sm:rounded-[19px] ${
                                    darkMode ? 'bg-[#111] ring-white/[0.08]' : 'bg-[#e8dbc9] ring-[#d7c3aa]'
                                }`}>
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={`apres-${activeProject.id}-${isMediaReady ? 'real' : 'placeholder'}`}
                                        src={apresSrc}
                                        sizes="(max-width: 768px) calc(100vw - 3rem), 700px"
                                        alt="Projet Restauration Après"
                                        loading="lazy"
                                        decoding="async"
                                        fetchPriority="low"
                                        initial={{ opacity: 0, scale: 1.015 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.62, ease: [0.32, 0.72, 0, 1] }}
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                </AnimatePresence>

                                <div className="pointer-events-none absolute right-3 top-3 z-0 sm:right-5 sm:top-5">
                                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-[7.5px] font-extrabold uppercase tracking-[0.16em] shadow-[0_14px_30px_-22px_rgba(24,18,12,0.72)] ring-1 sm:gap-2 sm:px-3.5 sm:py-2 sm:text-[9px] sm:tracking-[0.18em] ${
                                        darkMode ? 'bg-[#f8efe2]/92 text-[#201913] ring-white/30' : 'bg-[#fffaf3]/94 text-[#3e352c] ring-white/90'
                                    }`}>
                                        Après
                                    </div>
                                </div>

                                <div
                                    ref={sliderClipRef}
                                    className="absolute inset-0 z-10 h-full w-full"
                                >
                                    <AnimatePresence mode="wait">
                                        <motion.img
                                            key={`avant-${activeProject.id}-${isMediaReady ? 'real' : 'placeholder'}`}
                                            src={avantSrc}
                                            sizes="(max-width: 768px) calc(100vw - 3rem), 700px"
                                            alt="Projet Restauration Avant"
                                            loading="lazy"
                                            decoding="async"
                                            fetchPriority="low"
                                            initial={{ opacity: 0, scale: 1.015 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.62, ease: [0.32, 0.72, 0, 1] }}
                                            className="absolute inset-0 h-full w-full object-cover"
                                        />
                                    </AnimatePresence>

                                    <div className="pointer-events-none absolute left-3 top-3 sm:left-5 sm:top-5">
                                        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-[7.5px] font-extrabold uppercase tracking-[0.16em] shadow-[0_14px_30px_-22px_rgba(24,18,12,0.72)] ring-1 sm:gap-2 sm:px-3.5 sm:py-2 sm:text-[9px] sm:tracking-[0.18em] ${
                                            darkMode ? 'bg-[#f8efe2]/92 text-[#201913] ring-white/30' : 'bg-[#fffaf3]/94 text-[#3e352c] ring-white/90'
                                        }`}>
                                            <span className="h-1 w-1 rounded-full bg-[#b9854f] sm:h-1.5 sm:w-1.5" />
                                            Avant
                                        </div>
                                    </div>
                                </div>

                                <div
                                    ref={sliderLineRef}
                                    className="pointer-events-none absolute bottom-0 top-0 z-[25] w-px bg-white/[0.95] shadow-[0_0_0_1px_rgba(64,43,24,0.18),0_0_18px_rgba(0,0,0,0.18)]"
                                    style={{ left: '50%', transform: 'translateX(-50%)' }}
                                >
                                    <div className={`absolute left-1/2 top-1/2 z-30 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-[0_18px_38px_rgba(37,27,17,0.2),inset_0_1px_0_rgba(255,255,255,0.88)] ring-1 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-active:scale-95 sm:h-11 sm:w-11 ${
                                        darkMode ? 'bg-[#f8efe2] text-[#171411] ring-white/28' : 'bg-[#fffaf3] text-[#151515] ring-[#d9c3a6]'
                                    }`}>
                                        <ChevronLeft size={14} strokeWidth={1.45} />
                                        <span className="mx-0.5 h-3.5 w-px bg-[#d4c1aa]" />
                                        <ChevronRight size={14} strokeWidth={1.45} />
                                    </div>
                                </div>

                                <input
                                    ref={sliderInputRef}
                                    type="range"
                                    min="0"
                                    max="100"
                                    defaultValue="50"
                                    onInput={handleSliderInput}
                                    className="absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0 touch-pan-y"
                                    aria-label="Curseur Avant/Après"
                                />
                                </div>
                            </div>
                        </div>

                        <div className={`relative mx-auto mt-4 grid w-full max-w-[780px] gap-2 overflow-hidden rounded-[18px] p-1 ring-1 md:mt-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-3 md:rounded-[22px] md:p-1.5 ${
                            darkMode ? 'bg-white/[0.045] ring-white/10 shadow-[0_24px_72px_-58px_rgba(0,0,0,0.95)]' : 'bg-[#f2e5d4] ring-[#d9c4aa] shadow-[0_26px_68px_-56px_rgba(82,54,28,0.82)]'
                        }`}>
                            <div className={`relative rounded-[14px] px-3.5 py-2.5 ring-1 md:rounded-[18px] md:p-3.5 ${
                                darkMode ? 'bg-[#211d18] ring-white/[0.07]' : 'bg-[#fffaf3] ring-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]'
                            }`}>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <span className="h-1.5 w-1.5 rotate-45 bg-[#b9854f]" aria-hidden="true" />
                                    <span className="font-sans text-[8px] font-extrabold uppercase tracking-[0.2em] text-[#7F946E] sm:text-[10px] sm:tracking-[0.22em]">
                                        {activeProject.tag}
                                    </span>
                                    <span className={`hidden h-px w-14 sm:block ${darkMode ? 'bg-white/[0.12]' : 'bg-[#dfd1c2]'}`} />
                                </div>
                                <h3 className={`mt-2 font-serif text-[1.2rem] font-semibold leading-none tracking-normal sm:mt-2.5 sm:text-[1.5rem] ${
                                    darkMode ? 'text-[#f8f1e8]' : 'text-[#191713]'
                                }`}>
                                    {activeProject.title}
                                </h3>
                                <p className={`mt-1.5 font-sans text-[11px] leading-[1.55] sm:text-[12px] ${
                                    darkMode ? 'text-stone-300' : 'text-[#62584e]'
                                }`}>
                                    {activeProject.desc}
                                </p>
                            </div>

                            <div className="relative flex items-center justify-between gap-2 px-1 md:justify-end md:gap-2.5 md:px-2.5 md:pb-1">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handlePrevProject}
                                        className={`flex h-8 w-8 items-center justify-center rounded-full ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 active:scale-95 md:h-9 md:w-9 ${
                                            darkMode ? 'bg-[#241f19] text-[#f8f1e8] ring-white/[0.12] hover:bg-white/[0.08]' : 'bg-[#fffaf3] text-[#151515] ring-[#dfd1c2] shadow-[0_14px_26px_-20px_rgba(43,31,19,0.78)] hover:bg-[#f8efe2]'
                                        }`}
                                        aria-label="Projet précédent"
                                    >
                                        <ChevronLeft size={16} strokeWidth={1.45} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNextProject}
                                        className={`flex h-8 w-8 items-center justify-center rounded-full ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 active:scale-95 md:h-9 md:w-9 ${
                                            darkMode ? 'bg-[#241f19] text-[#f8f1e8] ring-white/[0.12] hover:bg-white/[0.08]' : 'bg-[#fffaf3] text-[#151515] ring-[#dfd1c2] shadow-[0_14px_26px_-20px_rgba(43,31,19,0.78)] hover:bg-[#f8efe2]'
                                        }`}
                                        aria-label="Projet suivant"
                                    >
                                        <ChevronRight size={16} strokeWidth={1.45} />
                                    </button>
                                </div>
                                <span className={`rounded-full px-3 py-1.5 font-sans text-[8px] font-extrabold uppercase tracking-[0.16em] ring-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.58)] md:px-3.5 md:py-1.5 md:text-[8.5px] md:tracking-[0.17em] ${
                                    darkMode ? 'bg-white/[0.04] text-[#d8c9b8] ring-white/10' : 'bg-[#fff8ee] text-[#9A714C] ring-[#dfd1c2]'
                                }`}>
                                    0{activeProjectIndex + 1} / 0{safeProjects.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
    );
};
export default BeforeAfterSection;
