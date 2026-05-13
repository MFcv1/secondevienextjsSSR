import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Heart, Instagram, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
const INSTAGRAM_URL = 'https://www.instagram.com/secondevie_anais';
const INSTAGRAM_FOLLOWERS_TARGET = 38.9;

const InstagramFollowerCount = ({ darkMode, compact = false, className = '' }) => {
    const [displayNumber, setDisplayNumber] = useState('0.0');
    const hasAnimatedRef = useRef(false);
    const timerRef = useRef(null);

    useEffect(() => () => {
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    const animateCounter = () => {
        if (hasAnimatedRef.current) return;
        hasAnimatedRef.current = true;

        const duration = 2500;
        const fps = 30;
        const totalFrames = duration / (1000 / fps);
        let currentFrame = 0;

        timerRef.current = setInterval(() => {
            currentFrame += 1;
            const progress = Math.min(currentFrame / totalFrames, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = INSTAGRAM_FOLLOWERS_TARGET * easeProgress;

            setDisplayNumber(currentValue.toFixed(1));

            if (progress >= 1) {
                clearInterval(timerRef.current);
                timerRef.current = null;
                setDisplayNumber(INSTAGRAM_FOLLOWERS_TARGET.toFixed(1));
            }
        }, 1000 / fps);
    };

    return (
        <motion.div
            initial={{ filter: 'blur(10px)', opacity: 0, y: compact ? 10 : 14 }}
            whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            onViewportEnter={animateCounter}
            viewport={{ once: true, margin: compact ? '-40px' : '-80px' }}
            transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
            className={`flex flex-col ${compact ? 'items-center' : 'items-center md:items-end'} ${className}`}
        >
            <div className={`flex origin-bottom translate-y-[-5px] scale-[1.045] items-end font-serif leading-none tracking-normal ${compact ? 'text-[48px]' : 'text-[58px] md:text-[68px]'} ${darkMode ? 'text-[#F9F6F0]' : 'text-[#1A1A1A]'}`}>
                <span className="transition-all duration-100">{displayNumber}</span>
                <span className={`${compact ? 'mb-1 ml-1 text-[25px]' : 'mb-1.5 ml-1 text-[30px] md:text-[38px]'} italic lowercase tracking-normal text-[#A68A64]`}>
                    k
                </span>
            </div>
            <p className={`${compact ? 'mt-[15px]' : 'mt-[13px]'} font-sans text-[9px] font-black uppercase tracking-[0.24em] ${darkMode ? 'text-white/55' : 'text-[#8f8579]'}`}>
                abonnés Instagram
            </p>
        </motion.div>
    );
};


const INSTA_DURATION = 2500;
const isThemeTransitionActive = () => (
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('theme-transitioning')
);
const MOBILE_INSTA_COPY = [
    { label: "Détails", title: "Porte céladon" },
    { label: "Relooking complet", title: "Buffet parisien" },
    { label: "Atelier", title: "Patine douce" },
    { label: "Avant / Après", title: "Meuble restauré" }
];

const MOBILE_INSTA_POSITIONS = {
    hiddenLeft: { transform: 'translateX(-190%) scale(0.86)', opacity: 1, zIndex: 0, pointerEvents: 'none' },
    left: { transform: 'translateX(-134%) scale(0.88)', opacity: 1, zIndex: 1, pointerEvents: 'none' },
    center: { transform: 'translateX(-50%) scale(1)', opacity: 1, zIndex: 3, pointerEvents: 'auto' },
    right: { transform: 'translateX(34%) scale(0.88)', opacity: 1, zIndex: 1, pointerEvents: 'none' },
    hiddenRight: { transform: 'translateX(90%) scale(0.86)', opacity: 1, zIndex: 0, pointerEvents: 'none' }
};

const DESKTOP_INSTA_POSITIONS = {
    hiddenLeft: { x: '-285%', scale: 0.82, opacity: 0, zIndex: 0, pointerEvents: 'none' },
    left: { x: '-166%', scale: 0.88, opacity: 1, zIndex: 1, pointerEvents: 'none' },
    center: { x: '-50%', scale: 1, opacity: 1, zIndex: 3, pointerEvents: 'auto' },
    right: { x: '66%', scale: 0.88, opacity: 1, zIndex: 1, pointerEvents: 'none' },
    hiddenRight: { x: '185%', scale: 0.82, opacity: 0, zIndex: 0, pointerEvents: 'none' },
};


const InstagramSection = ({ darkMode, posts = [] }) => {
    const dynamicInsta = Array.isArray(posts) ? posts : [];
    const [activeInstaIndex, setActiveInstaIndex] = useState(1);
    const [activeInstaDirection, setActiveInstaDirection] = useState(1);
    const [instaSlideVersion, setInstaSlideVersion] = useState(0);
    const [isInstaSectionActive, setIsInstaSectionActive] = useState(false);
    const activeInstaIndexRef = useRef(1);
    const instaSectionRef = useRef(null);
    const goToInsta = useCallback((idx) => {
        if (!dynamicInsta.length) return;
        const next = (idx + dynamicInsta.length) % dynamicInsta.length;
        const current = activeInstaIndexRef.current;
        const forwardDistance = (next - current + dynamicInsta.length) % dynamicInsta.length;
        const backwardDistance = (current - next + dynamicInsta.length) % dynamicInsta.length;
        if (next !== current) {
            setActiveInstaDirection(forwardDistance <= backwardDistance ? 1 : -1);
        }
        activeInstaIndexRef.current = next;
        setActiveInstaIndex(next);
        setInstaSlideVersion(v => v + 1);
    }, [dynamicInsta.length]);
    const handleInstaDragEnd = useCallback((_, info) => {
        const shouldAdvance = info.offset.x < -42 || info.velocity.x < -360;
        const shouldRewind = info.offset.x > 42 || info.velocity.x > 360;
        if (shouldAdvance) goToInsta(activeInstaIndexRef.current + 1);
        if (shouldRewind) goToInsta(activeInstaIndexRef.current - 1);
    }, [goToInsta]);
    const getMobileInstaPosition = useCallback((index) => {
        const offset = (index - activeInstaIndex + dynamicInsta.length) % dynamicInsta.length;
        if (offset === 0) return 'center';
        if (offset === 1) return 'right';
        if (offset === dynamicInsta.length - 1) return 'left';
        return 'hidden';
    }, [activeInstaIndex, dynamicInsta.length]);
    const getDesktopInstaPosition = useCallback((index) => {
        const offset = (index - activeInstaIndex + dynamicInsta.length) % dynamicInsta.length;
        if (offset === 0) return 'center';
        if (offset === 1) return 'right';
        if (offset === dynamicInsta.length - 1) return 'left';
        return 'hidden';
    }, [activeInstaIndex, dynamicInsta.length]);
    useEffect(() => {
        activeInstaIndexRef.current = activeInstaIndex;
    }, [activeInstaIndex]);
    useEffect(() => {
        if (!dynamicInsta.length) return;
        if (activeInstaIndexRef.current >= dynamicInsta.length) goToInsta(0);
    }, [dynamicInsta.length, goToInsta]);
    useEffect(() => {
        const section = instaSectionRef.current;
        if (!section || typeof IntersectionObserver === 'undefined') {
            setIsInstaSectionActive(true);
            return undefined;
        }
        const observer = new IntersectionObserver(([entry]) => {
            setIsInstaSectionActive(entry.isIntersecting);
        }, { rootMargin: '420px 0px' });
        observer.observe(section);
        return () => observer.disconnect();
    }, []);
    useEffect(() => {
        if (!isInstaSectionActive || !dynamicInsta.length) return undefined;
        const timer = setInterval(() => {
            if (isThemeTransitionActive()) return;
            goToInsta(activeInstaIndexRef.current + 1);
        }, INSTA_DURATION);
        return () => clearInterval(timer);
    }, [goToInsta, isInstaSectionActive, dynamicInsta.length]);
    const handleInstaSelect = (index) => {
        goToInsta(index);
    };
    const handlePrevInsta = () => goToInsta(activeInstaIndexRef.current - 1);
    const handleNextInsta = () => goToInsta(activeInstaIndexRef.current + 1);
    if (!dynamicInsta.length) return null;
    return (
            <section
                ref={instaSectionRef}
                className="pt-[48px] pb-[86px] px-0 md:px-6 md:py-[72px] lg:px-[5vw] lg:py-[78px] xl:py-[86px] overflow-hidden relative"
            >
                <div className="lg:hidden">
                    <div className="mx-auto max-w-[430px] px-5 text-center">
                        <div className="mb-8 flex items-center justify-center gap-3">
                            <span className="h-px w-8 bg-[#A68A64]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#A68A64]">Lifestyle & Atelier</span>
                            <span className="h-px w-8 bg-[#A68A64]" />
                        </div>

                        <h2 className={`font-serif text-[38px] leading-[1.02] tracking-normal ${darkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>
                            Nous aussi on vous aime
                        </h2>

                        <div className="mt-5 flex flex-col items-center gap-5">
                            <InstagramFollowerCount darkMode={darkMode} compact />

                            <motion.a
                                href={INSTAGRAM_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
                                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                viewport={{ once: true, margin: '-50px' }}
                                transition={{ duration: 0.75, delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
                                className={`mx-auto flex h-[48px] w-full max-w-[286px] items-center justify-between rounded-full border pl-4 pr-1.5 shadow-[0_14px_36px_rgba(32,26,20,0.08)] transition-colors ${darkMode ? 'border-white/10 bg-white/5 text-white' : 'border-stone-200 bg-white text-[#1A1A1A]'}`}
                            >
                                <Instagram size={16} strokeWidth={1.8} />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Rejoindre Instagram</span>
                                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${darkMode ? 'bg-white text-black' : 'bg-[#1A1A1A] text-white'}`}>
                                    <ArrowUpRight size={16} strokeWidth={2.1} />
                                </span>
                            </motion.a>
                        </div>
                    </div>

                    <motion.div
                        className="relative mx-auto mt-12 h-[432px] max-w-[430px] overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing md:h-[462px] md:max-w-[560px]"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.12}
                        dragMomentum={false}
                        onDragEnd={handleInstaDragEnd}
                    >
                        <AnimatePresence initial={false}>
                            {dynamicInsta.map((post, index) => {
                                const position = getMobileInstaPosition(index);
                                if (position === 'hidden') return null;
                                const copy = MOBILE_INSTA_COPY[index] || MOBILE_INSTA_COPY[0];
                                const isCenter = position === 'center';
                                return (
                                    <motion.article
                                        key={`insta-${index}-${post.img}`}
                                        initial={MOBILE_INSTA_POSITIONS[activeInstaDirection > 0 ? 'hiddenRight' : 'hiddenLeft']}
                                        animate={MOBILE_INSTA_POSITIONS[position]}
                                        exit={MOBILE_INSTA_POSITIONS[activeInstaDirection > 0 ? 'hiddenLeft' : 'hiddenRight']}
                                        transition={{ type: "spring", stiffness: 190, damping: 27, mass: 1.05 }}
                                        className={`absolute left-1/2 top-0 w-[62vw] max-w-[226px] overflow-hidden rounded-[22px] shadow-[0_18px_38px_rgba(32,26,20,0.12)] will-change-transform md:max-w-[250px] ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}
                                        aria-hidden={!isCenter}
                                    >
                                        <div className="aspect-[4/5] overflow-hidden bg-stone-100">
                                            <img
                                                src={post.img}
                                                sizes="(min-width: 768px) 250px, 62vw"
                                                alt={copy.title}
                                                loading="lazy"
                                                decoding="async"
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className={`relative min-h-[88px] px-4 pb-5 pt-4 text-left ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
                                            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#A68A64]">
                                                {copy.label}
                                            </p>
                                            <h3 className={`mt-1.5 pr-12 font-serif text-[20px] leading-tight tracking-normal ${darkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>
                                                {copy.title}
                                            </h3>
                                            <button
                                                type="button"
                                                tabIndex={isCenter ? 0 : -1}
                                                className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full shadow-[0_10px_24px_rgba(32,26,20,0.12)] ${darkMode ? 'bg-white/10 text-white' : 'bg-white text-[#9A714C]'}`}
                                                aria-label="Ajouter aux favoris"
                                            >
                                                <Heart size={18} strokeWidth={1.8} />
                                            </button>
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>

                    <div className="mx-auto mt-8 flex max-w-[220px] items-center justify-center gap-4 px-5">
                        {dynamicInsta.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleInstaSelect(index)}
                                className={`relative h-[2px] flex-1 overflow-hidden rounded-full transition-colors ${darkMode ? 'bg-white/15' : 'bg-stone-200'}`}
                                aria-label={`Voir la photo ${index + 1}`}
                            >
                                <span
                                    key={index === activeInstaIndex ? `insta-active-${instaSlideVersion}` : index}
                                    className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[#A68A64]"
                                    style={index === activeInstaIndex
                                        ? { animation: `hero-progress ${INSTA_DURATION}ms linear forwards` }
                                        : { transform: index < activeInstaIndex ? 'scaleX(1)' : 'scaleX(0)' }
                                    }
                                />
                            </button>
                        ))}
                    </div>

                    <div className="mt-12 px-6 pt-9 text-center">
                        <Sparkles className="mx-auto mb-4 text-[#A68A64]" size={30} strokeWidth={1.6} />
                        <p className="text-[12px] font-black uppercase tracking-[0.22em] text-[#A68A64]">Créations uniques</p>
                        <p className={`mx-auto mt-4 max-w-[330px] text-[16px] leading-7 ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                            Chaque meuble est chiné, restauré et sublimé à la main dans notre atelier.
                        </p>
                    </div>
                </div>

                <div className="hidden max-w-[1280px] mx-auto lg:block">
                    {/* En-tête avec Badge */}
                    <div className="flex flex-col items-center text-center mb-10 xl:mb-12">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-3 mb-6"
                        >
                            <div className="w-8 h-[1px] bg-[#A68A64]" />
                            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#A68A64]">Lifestyle & Atelier</span>
                            <div className="w-8 h-[1px] bg-[#A68A64]" />
                        </motion.div>
                        
                        <h2 className={`font-serif text-4xl lg:text-5xl xl:text-6xl ${darkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>
                            Nous aussi on vous aime
                        </h2>

                        <div className="mt-6 flex items-center justify-center gap-7 xl:mt-8 xl:gap-8">
                            <InstagramFollowerCount darkMode={darkMode} className="min-w-[168px]" />

                            <motion.a 
                                href={INSTAGRAM_URL}
                                target="_blank" 
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
                                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                viewport={{ once: true, margin: '-70px' }}
                                transition={{ duration: 0.8, delay: 0.16, ease: [0.23, 1, 0.32, 1] }}
                                className={`group relative flex min-h-[54px] items-center gap-4 overflow-hidden rounded-full border py-2 pl-5 pr-2 transition-all duration-500 backdrop-blur-md ${darkMode ? 'border-white/10 bg-white/5 hover:border-white/40' : 'border-black/5 bg-stone-50 hover:border-black/20'}`}
                            >
                                <Instagram size={17} className={darkMode ? 'relative z-10 text-white' : 'relative z-10 text-black'} />
                                <span className={`relative z-10 text-[11px] uppercase tracking-[0.2em] font-bold transition-colors duration-500 ${darkMode ? 'text-white group-hover:text-black' : 'text-black group-hover:text-white'}`}>
                                    Rejoindre la communauté
                                </span>
                                <span className={`absolute inset-0 translate-y-[101%] transition-transform duration-[600ms] ease-[cubic-bezier(0.39,0.575,0.565,1)] group-hover:translate-y-0 ${darkMode ? 'bg-white' : 'bg-[#1A1A1A]'}`} />
                                <div className={`relative z-10 flex h-10 w-10 rounded-full items-center justify-center transition-colors duration-500 ${darkMode ? 'bg-white text-black group-hover:bg-[#111] group-hover:text-white' : 'bg-[#1A1A1A] text-white group-hover:bg-white group-hover:text-[#1A1A1A]'}`}>
                                    <ArrowUpRight size={17} strokeWidth={2.2} />
                                </div>
                            </motion.a>
                        </div>
                    </div>

                    {/* Carousel Instagram desktop */}
                    <motion.div
                        className="relative mx-auto h-[470px] w-full max-w-[1120px] overflow-visible touch-pan-y cursor-grab active:cursor-grabbing xl:h-[520px] xl:max-w-[1240px]"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.08}
                        dragMomentum={false}
                        onDragEnd={handleInstaDragEnd}
                    >
                        <AnimatePresence initial={false}>
                            {dynamicInsta.map((post, index) => {
                                const position = getDesktopInstaPosition(index);
                                if (position === 'hidden') return null;
                                const copy = MOBILE_INSTA_COPY[index] || MOBILE_INSTA_COPY[0];
                                const isCenter = position === 'center';

                                return (
                                    <motion.article
                                        key={`insta-desktop-${index}-${post.img}`}
                                        initial={DESKTOP_INSTA_POSITIONS[activeInstaDirection > 0 ? 'hiddenRight' : 'hiddenLeft']}
                                        animate={DESKTOP_INSTA_POSITIONS[position]}
                                        exit={DESKTOP_INSTA_POSITIONS[activeInstaDirection > 0 ? 'hiddenLeft' : 'hiddenRight']}
                                        transition={{ type: "spring", stiffness: 145, damping: 32, mass: 1.12 }}
                                        className={`absolute left-1/2 top-2 w-[min(26vw,312px)] overflow-hidden rounded-[28px] shadow-[0_24px_60px_rgba(32,26,20,0.13)] will-change-transform xl:w-[min(25vw,340px)] xl:rounded-[34px] ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}
                                        aria-hidden={!isCenter}
                                    >
                                    <div className="aspect-[4/5] overflow-hidden bg-stone-100">
                                        <img
                                            src={post.img}
                                            sizes="(min-width: 1280px) 340px, 26vw"
                                            alt={copy.title}
                                            loading="lazy"
                                            decoding="async"
                                            className={`h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isCenter ? 'scale-100' : 'scale-[1.03]'}`}
                                        />
                                    </div>
                                    <div className={`relative min-h-[88px] px-5 pb-5 pt-4 text-left xl:min-h-[96px] xl:px-6 xl:pb-6 xl:pt-5 ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A68A64]">
                                            {copy.label}
                                        </p>
                                        <h3 className={`mt-2 pr-12 font-serif text-[23px] leading-tight tracking-normal xl:pr-14 xl:text-[26px] ${darkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>
                                            {copy.title}
                                        </h3>
                                        <button
                                            type="button"
                                            tabIndex={isCenter ? 0 : -1}
                                            className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full shadow-[0_14px_30px_rgba(32,26,20,0.12)] transition-transform duration-300 hover:-translate-y-0.5 active:scale-95 xl:right-5 xl:top-5 xl:h-12 xl:w-12 ${darkMode ? 'bg-white/10 text-white' : 'bg-white text-[#9A714C]'}`}
                                            aria-label="Ajouter aux favoris"
                                        >
                                            <Heart size={20} strokeWidth={1.8} />
                                        </button>
                                    </div>
                                    </motion.article>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>

                    <div className="mx-auto mt-7 grid w-full max-w-[380px] grid-cols-[52px_1fr_52px] items-center gap-4 xl:mt-9 xl:max-w-[420px] xl:grid-cols-[58px_1fr_58px] xl:gap-5">
                        <button
                            type="button"
                            onClick={handlePrevInsta}
                            className={`flex h-[52px] w-[52px] items-center justify-center rounded-full border shadow-[0_14px_34px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 xl:h-[58px] xl:w-[58px] ${
                                darkMode ? 'border-white/10 bg-white/8 text-white hover:border-white/25 hover:bg-white/12' : 'border-[#efebe5] bg-white text-[#5f5b56] hover:border-[#e4ded5] hover:text-[#242221]'
                            }`}
                            aria-label="Photo Instagram précédente"
                        >
                            <ChevronLeft size={24} strokeWidth={1.8} />
                        </button>

                        <div className="flex items-center justify-center gap-4">
                            {dynamicInsta.map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleInstaSelect(index)}
                                    className={`relative h-[3px] flex-1 overflow-hidden rounded-full transition-colors ${darkMode ? 'bg-white/15' : 'bg-stone-200'}`}
                                    aria-label={`Voir la photo Instagram ${index + 1}`}
                                >
                                    <span
                                        key={index === activeInstaIndex ? `insta-desktop-active-${instaSlideVersion}` : index}
                                        className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[#A68A64]"
                                        style={index === activeInstaIndex
                                            ? { animation: `hero-progress ${INSTA_DURATION}ms linear forwards` }
                                            : { transform: index < activeInstaIndex ? 'scaleX(1)' : 'scaleX(0)' }
                                        }
                                    />
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={handleNextInsta}
                            className={`flex h-[52px] w-[52px] items-center justify-center rounded-full border shadow-[0_14px_34px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 xl:h-[58px] xl:w-[58px] ${
                                darkMode ? 'border-white/10 bg-white/8 text-white hover:border-white/25 hover:bg-white/12' : 'border-[#efebe5] bg-white text-[#5f5b56] hover:border-[#e4ded5] hover:text-[#242221]'
                            }`}
                            aria-label="Photo Instagram suivante"
                        >
                            <ChevronRight size={24} strokeWidth={1.8} />
                        </button>
                    </div>
                </div>
            </section>
    );
};
export default InstagramSection;
