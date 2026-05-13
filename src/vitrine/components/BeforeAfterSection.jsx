import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const RESTORATION_PROJECTS = [
    {
        id: 1,
        title: "La Commode Oubliée",
        tag: "Rénovation Complète",
        desc: "Ancien vernis craquelé, bois étouffé. Après un sablage délicat et une peinture Céladon, ce meuble de famille retrouve sa place dans un intérieur moderne.",
        avant: "/images/before-after/avant.webp",
        apres: "/images/before-after/apres.webp",
        accent: "#87A08B" // Sauge
    },
    {
        id: 2,
        title: "La Console d'Époque",
        tag: "Sablage & Patine",
        desc: "Cachée sous des couches de laque sombre. Un travail minutieux a permis de sublimer le veinage naturel du chêne et d'appliquer une finition Wabi-Sabi.",
        avant: "/images/before-after/avantu.webp",
        apres: "/images/before-after/apresu.webp",
        accent: "#C2704E" // Terracotta
    },
    {
        id: 3,
        title: "Le Bureau Vintage",
        tag: "Réparation & Traitement",
        desc: "Pieds fragilisés et plateau marqué par le temps. Consolidation par greffe de bois, traitement curatif et pose d'un vernis mat imperméable.",
        avant: "/images/before-after/avantx.webp",
        apres: "/images/before-after/apresx.webp",
        accent: "#A68A64" // Sable/Ocre
    }
];

const BeforeAfterSection = () => {
    const containerRef = useRef(null);
    const cardRef = useRef(null);
    const titleRef = useRef(null);
    const titleLinesRef = useRef([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [sliderPos, setSliderPos] = useState(50);
    const activeProject = RESTORATION_PROJECTS[activeIndex];

    // GSAP Animation: Premium Intersection Reveal
    useEffect(() => {
        let ctx = gsap.context(() => {

            // 1. B.09 InsetFrameShrink — identique mobile et desktop
            gsap.fromTo(cardRef.current,
                { clipPath: "inset(12% 12% 12% 12% round 3rem)", scale: 0.95, filter: "blur(10px)" },
                {
                    clipPath: "inset(0% 0% 0% 0% round 2.5rem)",
                    scale: 1,
                    filter: "blur(0px)",
                    duration: 2.2,
                    ease: "power3.inOut",
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top 80%",
                    }
                }
            );

            let mm = gsap.matchMedia();

            // ─── MOBILE (< 768px) — animation simplifiée sans z/rotateX lourd ─
            mm.add("(max-width: 767px)", () => {
                const title1 = titleLinesRef.current[1];
                const title2 = titleLinesRef.current[2];

                if (title1 && title2) {
                    gsap.from([title1, title2], {
                        y: 60,
                        opacity: 0,
                        filter: "blur(12px)",
                        stagger: 0.15,
                        duration: 1.8,
                        ease: "power3.out",
                        delay: 0.2,
                        scrollTrigger: {
                            trigger: containerRef.current,
                            start: "top 75%",
                        }
                    });
                }

                gsap.from([titleLinesRef.current[0], titleLinesRef.current[3]], {
                    y: 40, opacity: 0, filter: "blur(8px)",
                    duration: 2, stagger: 0.15, delay: 0.4,
                    ease: "power3.out",
                    scrollTrigger: { trigger: containerRef.current, start: "top 70%" }
                });
            });

            // ─── DESKTOP (>= 768px) — animation 3D originale intacte ─────────
            mm.add("(min-width: 768px)", () => {
                const title1 = titleLinesRef.current[1];
                const title2 = titleLinesRef.current[2];

                if (title1 && title2) {
                    const split1 = new SplitType(title1, { types: "chars" });
                    const split2 = new SplitType(title2, { types: "chars" });

                    gsap.set([...split1.chars, ...split2.chars], { transformPerspective: 1000 });

                    gsap.from([...split1.chars, ...split2.chars], {
                        z: -300,
                        rotateX: -60,
                        yPercent: 100,
                        opacity: 0,
                        stagger: 0.04,
                        duration: 2.5,
                        ease: "expo.out",
                        delay: 0.2,
                        scrollTrigger: {
                            trigger: containerRef.current,
                            start: "top 75%",
                        }
                    });
                }

                gsap.from([titleLinesRef.current[0], titleLinesRef.current[3]], {
                    y: 40, opacity: 0, filter: "blur(8px)",
                    duration: 2.5, stagger: 0.15, delay: 0.4,
                    ease: "power3.out",
                    scrollTrigger: { trigger: containerRef.current, start: "top 70%" }
                });
            });

        }, containerRef);
        return () => ctx.revert();
    }, []);

    // Handlers
    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % RESTORATION_PROJECTS.length);
        setSliderPos(50);
    };

    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + RESTORATION_PROJECTS.length) % RESTORATION_PROJECTS.length);
        setSliderPos(50);
    };

    // Touch handler pour le slider avant/apres sur mobile
    const handleTouchMove = (e) => {
        const touch = e.touches[0];
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = ((touch.clientX - rect.left) / rect.width) * 100;
        setSliderPos(Math.max(0, Math.min(100, pos)));
    };

    return (
        <section ref={containerRef} className="relative w-full min-h-[100svh] bg-[#F9F6F0] p-3 md:p-5 lg:p-6 flex flex-col z-[20]">
            <div ref={cardRef} className="relative w-full flex-grow flex flex-col xl:flex-row overflow-hidden bg-[#1A1A1A] rounded-2xl md:rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.18)] mt-8 md:mt-16 will-change-transform">

                {/* Ligne décorative supérieure (Optionnelle pour effet bento) */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10" />

                {/* GAUCHE : Textes et Navigation */}
                <div className="w-full xl:w-[40%] p-8 md:p-12 lg:p-16 flex flex-col justify-between z-10 relative">

                    {/* BLOC TITRE */}
                    <div>
                        <div className="overflow-hidden mb-6 flex items-center gap-3">
                            <span
                                ref={el => titleLinesRef.current[0] = el}
                                className="text-[10px] md:text-xs font-bold font-mono tracking-[0.3em] uppercase text-white/50"
                            >
                                La Renaissance
                            </span>
                        </div>

                        <h2 className="text-4xl md:text-[5.5rem] leading-[1.1] md:leading-[1] tracking-tighter font-serif text-white">
                            <div className="overflow-hidden py-2 -my-2"><div ref={el => titleLinesRef.current[1] = el} className="uppercase font-bold text-5xl md:text-[6.5rem]">LE POUVOIR</div></div>
                            <div className="overflow-hidden py-4 -my-4"><div ref={el => titleLinesRef.current[2] = el} className="italic lowercase text-[#A68A64]">du geste.</div></div>
                        </h2>
                    </div>

                    {/* DESCRIPTION (Centrée dynamiquement) */}
                    <div className="flex-grow flex flex-col justify-center py-10 xl:py-0">
                        <div className="overflow-hidden">
                            <p ref={el => titleLinesRef.current[3] = el} className="text-white/60 text-sm md:text-base leading-relaxed max-w-md font-sans">
                                Sous la patine du temps se cache souvent une âme intacte. Découvrez notre processus de transformation où l'artisanat redonne vie aux objets oubliés.
                            </p>
                        </div>
                    </div>

                    {/* Contenu Dynamique du Projet Animé avec Framer Motion */}
                    <div className="mt-4 xl:mt-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeProject.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl"
                            >
                                <span className="text-[9px] uppercase tracking-widest font-black" style={{ color: activeProject.accent }}>
                                    {activeProject.tag}
                                </span>
                                <h3 className="text-2xl md:text-3xl font-serif text-white mt-2 mb-4">
                                    {activeProject.title}
                                </h3>
                                <p className="text-white/50 text-xs md:text-sm leading-relaxed mb-8">
                                    {activeProject.desc}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handlePrev}
                                            className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                                        >
                                            <ChevronLeft size={18} strokeWidth={2.5} />
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                                        >
                                            <ChevronRight size={18} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                    <span className="text-white/30 text-[10px] font-mono tracking-widest">
                                        0{activeIndex + 1} / 0{RESTORATION_PROJECTS.length}
                                    </span>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>

                {/* DROITE : Le Slider Interactif */}
                <div className="w-full xl:w-[60%] relative h-[50vh] md:h-[60vh] xl:h-auto min-h-[350px] md:min-h-[500px]">

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`slider-${activeProject.id}`}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                            className="absolute inset-0 w-full h-full bg-[#111]"
                            onTouchMove={handleTouchMove}
                        >
                            {/* L'image de Fond : APRÈS (Complète) */}
                            <img
                                src={activeProject.apres}
                                alt="Après la restauration"
                                className="absolute inset-0 w-full h-full object-cover"
                            />

                            {/* Badges d'état (cachés sous l'autre image, ou visibles si on slide) */}
                            <div className="absolute top-6 right-6 z-0 pointer-events-none">
                                <div className="bg-white/10 backdrop-blur-md px-4 h-8 rounded-full border border-white/20 flex items-center justify-center shadow-lg">
                                    <span className="text-white text-[10px] uppercase font-black tracking-widest text-center mt-[1px]">Après</span>
                                </div>
                            </div>

                            {/* L'image Superposée : AVANT (Coupée par clip-path) */}
                            <div
                                className="absolute inset-0 w-full h-full z-10"
                                style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
                            >
                                <img
                                    src={activeProject.avant}
                                    alt="Avant la restauration"
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                {/* Badge état Avant */}
                                <div className="absolute top-6 left-6 pointer-events-none">
                                    <div className="bg-black/50 backdrop-blur-md px-4 h-8 rounded-full border border-white/10 flex items-center justify-center shadow-lg">
                                        <span className="text-white text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 mt-[1px]">
                                            <span className="w-2 h-2 rounded-full bg-red-500/80 animate-pulse"></span>
                                            Avant
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Ligne de séparation Drag */}
                            <div
                                className="absolute top-0 bottom-0 w-[2px] bg-white z-[25] pointer-events-none drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                            >
                                {/* Le "Thumb" ou poignée visible - Centré verticalement avec design original */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-2xl z-30">
                                    <div className="flex gap-1 items-center">
                                        <ChevronLeft size={16} strokeWidth={3} className="text-stone-900 -mr-1" />
                                        <div className="w-1 h-4 bg-stone-300 rounded-full mx-0.5" />
                                        <ChevronRight size={16} strokeWidth={3} className="text-stone-900 -ml-1" />
                                    </div>
                                </div>
                            </div>

                            {/* Input Range Invisible (Capture les swipes et souries nativement, ultra performant) */}
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={sliderPos}
                                onChange={(e) => setSliderPos(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30 touch-pan-y"
                                aria-label="Curseur Avant/Après"
                            />
                        </motion.div>
                    </AnimatePresence>

                </div>

            </div>
        </section>
    );
};

export default BeforeAfterSection;
