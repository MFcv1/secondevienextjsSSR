import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

const ArchSection = () => {
    const sectionRef = useRef(null);
    const introTextRef = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {

            // ===================================
            // gsap.matchMedia() — mobile/tablette/desktop
            // ===================================
            let mm = gsap.matchMedia();

            // ─── MOBILE (< 768px) ────────────────────────────────────────────
            mm.add("(max-width: 767px)", () => {

                let roundOuter = "40.3vw";
                let roundInner = "40vw";
                let startClipInner = `inset(15vh 10vw 0vh 10vw round ${roundInner} ${roundInner} 0px 0px)`;
                let endClip = "inset(0vh 0vw 0vh 0vw round 0vw 0vw 0px 0px)";

                gsap.set(".arch-mask-border", {
                    top: "14.8vh", bottom: "0vh",
                    left: "9.5vw", right: "9.5vw",
                    borderTopLeftRadius: roundOuter, borderTopRightRadius: roundOuter,
                    border: "2px solid #A68A64", borderBottom: "none",
                    clipPath: "inset(100% 0 0 0)"
                });

                gsap.set(".arch-mask-container", { clipPath: startClipInner, y: "0vh", opacity: 0 });
                gsap.set(".arch-image", { opacity: 0, scale: 1.4, filter: "blur(15px)" });

                // Pin réduit à 350% sur mobile (au lieu de 600%)
                let archTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: ".arch-pin-container",
                        start: "top top",
                        end: "+=350%",
                        pin: ".arch-wrapper",
                        scrub: 1
                    }
                });

                // Intro text — version simplifiée sur mobile (pas de rotateX 3D lourd)
                if (introTextRef.current) {
                    gsap.set(introTextRef.current, { perspective: 800 });
                    const split = new SplitType(introTextRef.current, { types: "words" });

                    gsap.set(split.words, {
                        opacity: 0,
                        y: 60,
                        filter: "blur(12px)",
                        willChange: "transform, opacity, filter"
                    });

                    archTl.to(split.words, {
                        opacity: 1,
                        y: 0,
                        filter: "blur(0px)",
                        duration: 2.5,
                        stagger: 0.9,
                        ease: "power2.out"
                    }, 1.5);

                    archTl.to(introTextRef.current, {
                        scale: 1.4,
                        opacity: 0,
                        filter: "blur(20px)",
                        duration: 2,
                        ease: "power2.inOut"
                    }, 7);
                }

                gsap.set(".arch-art-print", { opacity: 0, y: 30, scale: 0.96 });
                // Apparition avant le texte (position 0), reveal rapide → images visibles ~2s à ~6s
                archTl.to(".arch-art-print", {
                    opacity: 1, y: 0, scale: 1, duration: 1.5, ease: "power2.out", stagger: 0.5
                }, 0);
                // Disparition légèrement après le texte (5.5) pour laisser de la respiration
                archTl.to(".arch-art-print", {
                    opacity: 0, y: -20, scale: 0.95, duration: 1.5, ease: "power2.inOut"
                }, 7);

                archTl.to(".arch-mask-container", { opacity: 1, duration: 1.5, ease: "power2.inOut" }, 7.5);

                archTl.to(".arch-mask-border",
                    { clipPath: "inset(0% 0 0 0)", duration: 3, ease: "none" },
                    7.5
                );

                archTl.to(".arch-image",
                    { opacity: 1, scale: 1, filter: "blur(0px)", duration: 4, ease: "power2.out" },
                    9.5
                );

                archTl.fromTo(".arch-entry-word",
                    { y: "120%", rotationZ: 5, opacity: 0, filter: "blur(10px)" },
                    {
                        y: "0%", rotationZ: 0, opacity: 1, filter: "blur(0px)",
                        stagger: 0.8, ease: "power3.out", duration: 3
                    },
                    13.0
                );

                let expandStart = 17.0;
                let d = 7;

                archTl.fromTo(".arch-grid",
                    { scale: 1, opacity: 0.05 },
                    { scale: 1.1, opacity: 0, duration: d * 1, ease: "power2.inOut" },
                    expandStart
                );
                archTl.fromTo(".arch-bg-sketch",
                    { y: "5vh", opacity: 0.15 },
                    { y: "-5vh", opacity: 0, duration: d * 1, ease: "none" },
                    expandStart
                );
                archTl.fromTo(".arch-ui-marker",
                    { opacity: 1, y: 0 },
                    { opacity: 0, y: -20, duration: d * 0.5, stagger: d * 0.1, ease: "power2.inOut" },
                    expandStart
                );
                archTl.to(".arch-mask-border",
                    { opacity: 0, duration: d * 0.5, ease: "power2.inOut" },
                    expandStart
                );
                archTl.fromTo(".arch-mask-container",
                    { clipPath: startClipInner },
                    { clipPath: endClip, duration: d * 1, ease: "power2.inOut" },
                    expandStart
                );
                gsap.set(".arch-inner-frame", { opacity: 0, scale: 0.95 });
                archTl.to(".arch-entry-header", { opacity: 0, scale: 1.05, filter: "blur(12px)", duration: d * 0.5, ease: "power2.inOut" }, expandStart);
                archTl.fromTo(".arch-overlay",
                    { opacity: 0.1 },
                    { opacity: 0.45, duration: d * 1, ease: "power2.inOut" },
                    expandStart
                );
                archTl.fromTo(".arch-inner-frame",
                    { y: 80, opacity: 0 },
                    { y: 0, opacity: 1, duration: d * 0.8, ease: "power2.out" },
                    expandStart + d * 0.4
                );
                archTl.fromTo(".arch-text-reveal",
                    { y: 40, opacity: 0 },
                    { y: 0, opacity: 1, duration: d * 0.8, stagger: d * 0.15, ease: "power4.out" },
                    expandStart + d * 0.5
                );
            });

            // ─── TABLETTE (768px – 1023px) ───────────────────────────────────
            mm.add("(min-width: 768px) and (max-width: 1023px)", () => {

                let roundOuter = "20.2vw";
                let roundInner = "20vw";
                let startClipInner = `inset(15vh 30vw 0vh 30vw round ${roundInner} ${roundInner} 0px 0px)`;
                let endClip = "inset(0vh 0vw 0vh 0vw round 0vw 0vw 0px 0px)";

                gsap.set(".arch-mask-border", {
                    top: "14.8vh", bottom: "0vh",
                    left: "29.8vw", right: "29.8vw",
                    borderTopLeftRadius: roundOuter, borderTopRightRadius: roundOuter,
                    border: "2px solid #A68A64", borderBottom: "none",
                    clipPath: "inset(100% 0 0 0)"
                });

                gsap.set(".arch-mask-container", { clipPath: startClipInner, y: "0vh", opacity: 0 });
                gsap.set(".arch-image", { opacity: 0, scale: 1.4, filter: "blur(15px)" });

                // Pin à 450% sur tablette
                let archTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: ".arch-pin-container",
                        start: "top top",
                        end: "+=450%",
                        pin: ".arch-wrapper",
                        scrub: 1
                    }
                });

                if (introTextRef.current) {
                    gsap.set(introTextRef.current, { perspective: 1000 });
                    const split = new SplitType(introTextRef.current, { types: "words" });
                    gsap.set(split.words, {
                        opacity: 0, y: 120, rotateX: -90,
                        transformPerspective: 800, transformOrigin: "bottom center",
                        filter: "blur(20px)", willChange: "transform, opacity, filter"
                    });
                    archTl.to(split.words, {
                        opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)",
                        duration: 3, stagger: 1.2, ease: "power2.out"
                    }, 1.5);
                    archTl.to(introTextRef.current, {
                        scale: 1.5, opacity: 0, filter: "blur(20px)",
                        duration: 3, ease: "power2.inOut"
                    }, 9.5);
                }

                gsap.set(".arch-art-print", { opacity: 0, y: 30, scale: 0.96 });
                // Apparition avant le texte (position 0), reveal rapide → images visibles ~2.6s à ~8s
                archTl.to(".arch-art-print", { opacity: 1, y: 0, scale: 1, duration: 2, ease: "power2.out", stagger: 0.6 }, 0);
                // Disparition après le texte (7.5) → images ont ~5s de vie complète
                archTl.to(".arch-art-print", { opacity: 0, y: -20, scale: 0.95, duration: 2, ease: "power2.inOut" }, 9.5);
                archTl.to(".arch-mask-container", { opacity: 1, duration: 2, ease: "power2.inOut" }, 10.5);
                archTl.to(".arch-mask-border", { clipPath: "inset(0% 0 0 0)", duration: 4, ease: "none" }, 10.5);
                archTl.to(".arch-image", { opacity: 1, scale: 1, filter: "blur(0px)", duration: 6, ease: "power2.out" }, 12.5);
                archTl.fromTo(".arch-entry-word",
                    { y: "120%", rotationZ: 5, opacity: 0, filter: "blur(10px)" },
                    { y: "0%", rotationZ: 0, opacity: 1, filter: "blur(0px)", stagger: 1.0, ease: "power3.out", duration: 4 },
                    17.0
                );

                let expandStart = 23.0;
                let d = 9;

                archTl.fromTo(".arch-grid", { scale: 1, opacity: 0.05 }, { scale: 1.1, opacity: 0, duration: d * 1, ease: "power2.inOut" }, expandStart);
                archTl.fromTo(".arch-bg-sketch", { y: "5vh", opacity: 0.15 }, { y: "-5vh", opacity: 0, duration: d * 1, ease: "none" }, expandStart);
                archTl.fromTo(".arch-ui-marker", { opacity: 1, y: 0 }, { opacity: 0, y: -20, duration: d * 0.5, stagger: d * 0.1, ease: "power2.inOut" }, expandStart);
                archTl.to(".arch-mask-border", { opacity: 0, duration: d * 0.5, ease: "power2.inOut" }, expandStart);
                archTl.fromTo(".arch-mask-container", { clipPath: startClipInner }, { clipPath: endClip, duration: d * 1, ease: "power2.inOut" }, expandStart);
                gsap.set(".arch-inner-frame", { opacity: 0, scale: 0.95 });
                archTl.to(".arch-entry-header", { opacity: 0, scale: 1.05, filter: "blur(12px)", duration: d * 0.5, ease: "power2.inOut" }, expandStart);
                archTl.fromTo(".arch-overlay", { opacity: 0.1 }, { opacity: 0.45, duration: d * 1, ease: "power2.inOut" }, expandStart);
                archTl.fromTo(".arch-inner-frame", { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: d * 0.8, ease: "power2.out" }, expandStart + d * 0.4);
                archTl.fromTo(".arch-text-reveal", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: d * 0.8, stagger: d * 0.15, ease: "power4.out" }, expandStart + d * 0.5);
            });

            // ─── DESKTOP (>= 1024px) — CODE ORIGINAL INTACT ─────────────────
            mm.add("(min-width: 1024px)", () => {

                let roundOuter = "20.2vw";
                let roundInner = "20vw";
                let startClipInner = `inset(15vh 30vw 0vh 30vw round ${roundInner} ${roundInner} 0px 0px)`;
                let endClip = "inset(0vh 0vw 0vh 0vw round 0vw 0vw 0px 0px)";

                gsap.set(".arch-mask-border", {
                    top: "14.8vh", bottom: "0vh",
                    left: "29.8vw", right: "29.8vw",
                    borderTopLeftRadius: roundOuter, borderTopRightRadius: roundOuter,
                    border: "2px solid #A68A64", borderBottom: "none",
                    clipPath: "inset(100% 0 0 0)"
                });

                gsap.set(".arch-mask-container", { clipPath: startClipInner, y: "0vh", opacity: 0 });
                gsap.set(".arch-image", { opacity: 0, scale: 1.4, filter: "blur(15px)" });

                let archTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: ".arch-pin-container",
                        start: "top top",
                        end: "+=600%",
                        pin: ".arch-wrapper",
                        scrub: 1
                    }
                });

                if (introTextRef.current) {
                    gsap.set(introTextRef.current, { perspective: 1000 });
                    const split = new SplitType(introTextRef.current, { types: "words" });
                    gsap.set(split.words, {
                        opacity: 0, y: 120, rotateX: -90,
                        transformPerspective: 800, transformOrigin: "bottom center",
                        filter: "blur(20px)", willChange: "transform, opacity, filter"
                    });
                    archTl.to(split.words, {
                        opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)",
                        duration: 3, stagger: 1.2, ease: "power2.out"
                    }, 1.5);
                    archTl.to(introTextRef.current, {
                        scale: 1.5, opacity: 0, filter: "blur(20px)",
                        duration: 3, ease: "power2.inOut"
                    }, 9.5);
                }

                gsap.set(".arch-art-print", { opacity: 0, y: 30, scale: 0.96 });
                // Apparition avant le texte (position 0), reveal rapide → images visibles ~2.6s à ~8s
                archTl.to(".arch-art-print", { opacity: 1, y: 0, scale: 1, duration: 2, ease: "power2.out", stagger: 0.6 }, 0);
                // Disparition après le texte (7.5) → images ont ~5s de vie complète
                archTl.to(".arch-art-print", { opacity: 0, y: -20, scale: 0.95, duration: 2, ease: "power2.inOut" }, 9.5);
                archTl.to(".arch-mask-container", { opacity: 1, duration: 2, ease: "power2.inOut" }, 10.5);
                archTl.to(".arch-mask-border", { clipPath: "inset(0% 0 0 0)", duration: 4, ease: "none" }, 10.5);
                archTl.to(".arch-image", { opacity: 1, scale: 1, filter: "blur(0px)", duration: 6, ease: "power2.out" }, 12.5);
                archTl.fromTo(".arch-entry-word",
                    { y: "120%", rotationZ: 5, opacity: 0, filter: "blur(10px)" },
                    { y: "0%", rotationZ: 0, opacity: 1, filter: "blur(0px)", stagger: 1.0, ease: "power3.out", duration: 4 },
                    17.0
                );

                let expandStart = 23.0;
                let d = 10;

                archTl.fromTo(".arch-grid", { scale: 1, opacity: 0.05 }, { scale: 1.1, opacity: 0, duration: d * 1, ease: "power2.inOut" }, expandStart);
                archTl.fromTo(".arch-bg-sketch", { y: "5vh", opacity: 0.15 }, { y: "-5vh", opacity: 0, duration: d * 1, ease: "none" }, expandStart);
                archTl.fromTo(".arch-ui-marker", { opacity: 1, y: 0 }, { opacity: 0, y: -20, duration: d * 0.5, stagger: d * 0.1, ease: "power2.inOut" }, expandStart);
                archTl.to(".arch-mask-border", { opacity: 0, duration: d * 0.5, ease: "power2.inOut" }, expandStart);
                archTl.fromTo(".arch-mask-container", { clipPath: startClipInner }, { clipPath: endClip, duration: d * 1, ease: "power2.inOut" }, expandStart);
                gsap.set(".arch-inner-frame", { opacity: 0, scale: 0.95 });
                archTl.to(".arch-entry-header", { opacity: 0, scale: 1.05, filter: "blur(12px)", duration: d * 0.5, ease: "power2.inOut" }, expandStart);
                archTl.fromTo(".arch-overlay", { opacity: 0.1 }, { opacity: 0.45, duration: d * 1, ease: "power2.inOut" }, expandStart);
                archTl.fromTo(".arch-inner-frame", { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: d * 0.8, ease: "power2.out" }, expandStart + d * 0.4);
                archTl.fromTo(".arch-text-reveal", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: d * 0.8, stagger: d * 0.15, ease: "power4.out" }, expandStart + d * 0.5);
            });

        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="w-full relative z-10 bg-[#F9F6F0] pt-0 md:pt-[15vh]">

            <div className="arch-pin-container w-full bg-[#F9F6F0] relative">
                <div className="arch-wrapper w-full h-screen md:h-[100svh] overflow-hidden relative">

                    {/* INTRO TEXT (FRONTMASTER CinematicReveal) */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-[25] pointer-events-none">
                        <h2
                            ref={introTextRef}
                            className="arch-intro-text-element font-serif text-[15vw] md:text-[10vw] text-black/80 tracking-widest uppercase italic font-light drop-shadow-xl flex flex-col items-center justify-center leading-[0.9]"
                        >
                            <span className="block mb-2 md:mb-4">Seconde</span>
                            <span className="block text-[#A68A64] ml-4 md:ml-32">Vie</span>
                            <span className="block text-xl md:text-3xl font-sans tracking-[0.4em] text-black/40 not-italic uppercase mt-6 md:mt-12 ml-8 md:ml-64 font-medium">
                                par Anaïs
                            </span>
                        </h2>
                    </div>

                    {/* FOND ARCHITECTURAL (Damier & Croquis de Restauration) */}
                    <div className="absolute inset-0 bg-[#F9F6F0] overflow-hidden pointer-events-none z-0">
                        {/* DAMIER (Grid) avec Mask Fade */}
                        <div className="arch-grid absolute inset-0 mix-blend-multiply opacity-[0.05]"
                            style={{
                                backgroundImage: 'linear-gradient(black 1px, transparent 1px), linear-gradient(90deg, black 1px, transparent 1px)',
                                backgroundSize: '4rem 4rem',
                                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
                                maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
                            }}>
                        </div>

                        {/* ESTAMPE 1 : Village Perché — mobile: haut paysage gauche / desktop: gauche portrait */}
                        <div className="arch-art-print absolute flex flex-col opacity-70
                            left-[3vw] top-[9vh] w-[52vw] h-[24vh]
                            md:opacity-100 md:left-[2vw] lg:left-[5vw] md:top-[15vh] md:w-[20vw] md:h-[60vh]">
                            <div className="relative w-full h-full md:h-[85%] border border-[#1A1A1A]/10 p-2 md:p-3 bg-[#F9F6F0] shadow-2xl">
                                <div className="w-full h-full overflow-hidden relative">
                                    <img
                                        src="https://images.unsplash.com/photo-1709112831341-761df723875c?q=80&w=800&auto=format&fit=crop"
                                        alt="Village perché provençal"
                                        className="w-full h-full object-cover object-center grayscale contrast-[1.1] sepia-[0.1] mix-blend-multiply opacity-80"
                                    />
                                    <div className="absolute inset-0 border border-[#1A1A1A]/20 m-2 md:m-4 pointer-events-none"></div>
                                </div>
                            </div>
                            <div className="mt-2 hidden md:flex justify-between items-end w-full px-2">
                                <span className="font-serif italic text-sm text-[#1A1A1A]/70">La Cadière d'Azur</span>
                                <span className="font-sans text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/40 font-bold">FIG. 01</span>
                            </div>
                        </div>

                        {/* ESTAMPE 2 : Le Massif — mobile: bas paysage droite / desktop: droite portrait */}
                        <div className="arch-art-print absolute flex flex-col opacity-70
                            right-[3vw] bottom-[8vh] w-[52vw] h-[24vh]
                            md:opacity-100 md:right-[2vw] lg:right-[5vw] md:bottom-auto md:top-[25vh] md:w-[22vw] md:h-[50vh]">
                            <div className="hidden md:flex mb-4 justify-between items-end w-full px-2">
                                <span className="font-sans text-[9px] tracking-[0.3em] uppercase text-[#1A1A1A]/40 font-bold">FIG. 02</span>
                                <span className="font-serif italic text-sm text-[#1A1A1A]/70">Sainte-Baume</span>
                            </div>
                            <div className="relative w-full h-full md:h-[85%] border border-[#1A1A1A]/10 p-2 md:p-3 bg-[#F9F6F0] shadow-2xl">
                                <div className="w-full h-full overflow-hidden relative">
                                    <img
                                        src="https://images.unsplash.com/photo-1466854076813-4aa9ac0fc347?q=80&w=800&auto=format&fit=crop"
                                        alt="Provence Massif"
                                        className="w-full h-full object-cover object-center grayscale contrast-[1.2] sepia-[0.1] mix-blend-multiply opacity-90"
                                    />
                                    <div className="absolute inset-0 border border-[#1A1A1A]/20 m-2 md:m-6 pointer-events-none"></div>
                                </div>
                            </div>
                        </div>

                        {/* UI MARKERS */}
                        <div className="arch-ui-marker absolute top-8 md:top-16 left-6 md:left-12 flex flex-col gap-3">
                            <div className="flex items-center gap-4">
                                <span className="font-sans text-[10px] md:text-xs tracking-[0.4em] uppercase text-black font-bold">La Galerie</span>
                                <div className="w-8 md:w-16 h-[1px] bg-black"></div>
                            </div>
                        </div>

                        <div className="arch-ui-marker hidden md:flex absolute bottom-16 left-12 flex-col gap-4">
                            <div className="w-[1px] h-16 bg-black"></div>
                            <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-black font-bold" style={{ writingMode: 'vertical-rl' }}>
                                43° 11' N / 5° 42' E
                            </span>
                        </div>

                    </div>

                    {/* LISERÉ DORÉ TRACEUR */}
                    <div className="arch-mask-border absolute z-15 will-change-transform box-border"></div>

                    <div className="arch-mask-container absolute inset-0 w-full h-full will-change-transform z-20">

                        <img
                            src="https://images.unsplash.com/photo-1715705742901-a1b979eefd48?auto=format&fit=crop&q=80&w=2000"
                            alt="Paysage Panorama de Provence"
                            className="arch-image absolute w-full h-full object-cover origin-center will-change-transform"
                        />

                        <div className="arch-overlay absolute inset-0 bg-black w-full h-full mix-blend-multiply pointer-events-none"></div>

                        <div className="arch-entry-header absolute inset-0 flex flex-col items-center justify-center pt-[20vh] z-30 pointer-events-none gap-y-2 md:gap-y-4">
                            <div className="flex flex-wrap items-center justify-center gap-x-3 md:gap-x-5 text-[#F9F6F0] font-serif tracking-tighter drop-shadow-2xl leading-[0.9]">
                                <span className="overflow-hidden inline-block pb-2 px-2">
                                    <span className="arch-entry-word block will-change-transform text-[10vw] md:text-[8vw] lg:text-[7vw] xl:text-[6vw] uppercase font-bold not-italic">Provence</span>
                                </span>
                                <span className="overflow-hidden inline-block pb-2 px-2">
                                    <span className="arch-entry-word block will-change-transform text-[8vw] md:text-[6vw] lg:text-[5vw] xl:text-[4vw] italic font-light">Alpes</span>
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-x-3 md:gap-x-5 text-[#F9F6F0] font-serif tracking-tighter drop-shadow-2xl leading-[0.9]">
                                <span className="overflow-hidden inline-block pb-2 px-2">
                                    <span className="arch-entry-word block will-change-transform text-[10vw] md:text-[8vw] lg:text-[7vw] xl:text-[6vw] uppercase font-bold not-italic">Côte</span>
                                </span>
                                <span className="overflow-hidden inline-block pb-2 px-2">
                                    <span className="arch-entry-word block will-change-transform text-[8vw] md:text-[6vw] lg:text-[5vw] xl:text-[4vw] italic font-light">d'Azur</span>
                                </span>
                            </div>
                        </div>

                        <div className="arch-text-content absolute inset-0 flex flex-col items-center justify-center z-20 text-[#F9F6F0] px-4">

                            <div className="arch-inner-frame border border-[#F9F6F0]/20 p-5 md:p-12 lg:p-16 rounded-[2rem] md:rounded-[3rem] flex flex-col items-center justify-center bg-[#1A1A1A]/20 backdrop-blur-md shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
                                    style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stucco.png")' }} />

                                <div className="arch-text-reveal relative z-10 flex items-center justify-center gap-4 mb-6 md:mb-10 w-full">
                                    <div className="w-8 md:w-16 h-[1px] bg-[#E8E3DA]/60"></div>
                                    <span className="text-[10px] md:text-xs font-sans tracking-[0.4em] uppercase text-[#E8E3DA] font-bold">
                                        Seconde Vie
                                    </span>
                                    <div className="w-8 md:w-16 h-[1px] bg-[#E8E3DA]/60"></div>
                                </div>

                                <h2 className="relative z-10 font-serif text-[10vw] md:text-[9vw] lg:text-[7vw] xl:text-[7rem] tracking-tighter leading-[0.85] flex flex-col items-center text-center drop-shadow-2xl">
                                    <span className="arch-text-reveal block italic font-light text-[#A68A64] mb-2">La Galerie</span>
                                    <span className="arch-text-reveal block pr-4">des Merveilles</span>
                                </h2>

                                <p className="arch-text-reveal relative z-10 text-sm md:text-base lg:text-lg text-[#E8E3DA]/80 leading-relaxed font-light mx-auto max-w-[45ch] text-pretty text-center mt-10">
                                    Chaque pièce est méticuleusement chinée dans le Sud de la France,
                                    réparée et sublimée pour démarrer une nouvelle vie dans votre décoration.
                                </p>
                            </div>

                        </div>

                    </div>
                </div>
            </div>

        </section>
    );
};

export default ArchSection;
