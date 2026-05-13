import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

const TransitionToServices = () => {
    const containerRef = useRef(null);
    const step1Ref = useRef(null);
    const step1TitleRef = useRef(null);
    const step2Ref = useRef(null);
    const step3Ref = useRef(null);
    const circleRef = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {

            // 1. Sceau Rotatif Indépendant (Tourne en boucle, en arrière plan)
            gsap.to(circleRef.current, {
                rotateZ: 360,
                duration: 60,
                ease: "none",
                repeat: -1
            });

            // Préparation des typographies pour éviter les flashs
            const splitTitle = new SplitType(step1TitleRef.current, { types: "chars" });
            const splitQuote1 = new SplitType(step2Ref.current.querySelector('p'), { types: "words" });

            let mm = gsap.matchMedia();

            // ─── MOBILE (< 768px) — pin réduit 250%, animation simplifiée ────
            mm.add("(max-width: 767px)", () => {
                // Reset initial — version simplifiée sans rotateX lourd
                gsap.set(splitTitle.chars, { opacity: 0, y: 80, filter: "blur(8px)" });
                gsap.set(splitQuote1.words, { opacity: 0, y: 30, filter: "blur(10px)" });
                gsap.set(step3Ref.current, { opacity: 0, scale: 0.85, filter: "blur(20px)" });

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top top",
                        end: "+=250%",
                        pin: true,
                        scrub: 1.5,
                    }
                });

                tl.to(splitTitle.chars, {
                    opacity: 1, y: 0, filter: "blur(0px)",
                    stagger: 0.06, duration: 1.5, ease: "power2.out"
                })
                .to({}, { duration: 0.8 })
                .to(step1Ref.current, {
                    scale: 1.3, opacity: 0, filter: "blur(20px)",
                    duration: 1.5, ease: "power2.in"
                })
                .to(splitQuote1.words, {
                    opacity: 1, y: 0, filter: "blur(0px)",
                    stagger: 0.04, duration: 1.5, ease: "power2.out"
                }, "-=0.5")
                .to({}, { duration: 0.8 })
                .to(step2Ref.current, {
                    y: -80, opacity: 0, filter: "blur(10px)",
                    duration: 1.5, ease: "power2.in"
                })
                .to(step3Ref.current, {
                    opacity: 1, scale: 1, filter: "blur(0px)",
                    duration: 1.5, ease: "power2.out"
                }, "-=0.5")
                .to({}, { duration: 1 })
                .to(step3Ref.current, { opacity: 0, duration: 0.8 });
            });

            // ─── TABLETTE (768px–1023px) — pin à 300% ────────────────────────
            mm.add("(min-width: 768px) and (max-width: 1023px)", () => {
                gsap.set(splitTitle.chars, { opacity: 0, y: 150, rotateX: -90, transformPerspective: 800 });
                gsap.set(splitQuote1.words, { opacity: 0, y: 30, filter: "blur(10px)" });
                gsap.set(step3Ref.current, { opacity: 0, scale: 0.8, filter: "blur(20px)" });

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top top",
                        end: "+=300%",
                        pin: true,
                        scrub: 1.5,
                    }
                });

                tl.to(splitTitle.chars, { opacity: 1, y: 0, rotateX: 0, stagger: 0.08, duration: 1.8, ease: "power2.out" })
                .to({}, { duration: 0.8 })
                .to(step1Ref.current, { scale: 1.5, opacity: 0, filter: "blur(20px)", duration: 2, ease: "power2.in" })
                .to(splitQuote1.words, { opacity: 1, y: 0, filter: "blur(0px)", stagger: 0.04, duration: 1.8, ease: "power2.out" }, "-=0.5")
                .to({}, { duration: 0.8 })
                .to(step2Ref.current, { y: -100, opacity: 0, filter: "blur(10px)", duration: 2, ease: "power2.in" })
                .to(step3Ref.current, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 2, ease: "power2.out" }, "-=0.5")
                .to({}, { duration: 1.2 })
                .to(step3Ref.current, { opacity: 0, duration: 1 });
            });

            // ─── DESKTOP (>= 1024px) — CODE ORIGINAL INTACT ─────────────────
            mm.add("(min-width: 1024px)", () => {
                gsap.set(splitTitle.chars, { opacity: 0, y: 150, rotateX: -90, transformPerspective: 800 });
                gsap.set(splitQuote1.words, { opacity: 0, y: 30, filter: "blur(10px)" });
                gsap.set(step3Ref.current, { opacity: 0, scale: 0.8, filter: "blur(20px)" });

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top top",
                        end: "+=400%",
                        pin: true,
                        scrub: 1.5,
                    }
                });

                tl.to(splitTitle.chars, {
                    opacity: 1, y: 0, rotateX: 0,
                    stagger: 0.1, duration: 2, ease: "power2.out"
                })
                .to({}, { duration: 1 })
                .to(step1Ref.current, {
                    scale: 1.5, opacity: 0, filter: "blur(20px)",
                    duration: 2, ease: "power2.in"
                })
                .to(splitQuote1.words, {
                    opacity: 1, y: 0, filter: "blur(0px)",
                    stagger: 0.05, duration: 2, ease: "power2.out"
                }, "-=0.5")
                .to({}, { duration: 1 })
                .to(step2Ref.current, {
                    y: -100, opacity: 0, filter: "blur(10px)",
                    duration: 2, ease: "power2.in"
                })
                .to(step3Ref.current, {
                    opacity: 1, scale: 1, filter: "blur(0px)",
                    duration: 2, ease: "power2.out"
                }, "-=0.5")
                .to({}, { duration: 1.5 })
                .to(step3Ref.current, { opacity: 0, duration: 1 });
            });

        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="w-full h-[100svh] relative bg-[#F9F6F0] z-[25] overflow-hidden flex items-center justify-center will-change-transform">

            {/* Texture Globale */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none z-0" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper.png")' }} />

            {/* Le Sceau Typographique Rotatif très léger en fond */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.04] text-[#1A1A1A] z-0">
                <svg viewBox="0 0 200 200" className="w-[90vw] md:w-[70vw] lg:w-[50vw] h-auto" ref={circleRef}>
                    <path id="textPathScroll" d="M 100, 100 m -70, 0 a 70,70 0 1,1 140,0 a 70,70 0 1,1 -140,0" fill="none" />
                    <text className="font-serif text-[14px] uppercase tracking-[0.3em] fill-current">
                        <textPath href="#textPathScroll" startOffset="0%">
                            • LE TEMPS SUBLIMÉ • SAVOIR-FAIRE ARTISANAL •
                        </textPath>
                    </text>
                </svg>
            </div>

            {/* CONTENEURS D'ANIMATION SCROLLYTELLING (Empilés au centre) */}

            {/* Etape 1 : Le Titre Majestueux */}
            <div ref={step1Ref} className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <p className="text-[#A68A64] text-[10px] md:text-xs font-sans font-bold uppercase tracking-[0.4em] mb-8">
                    — Notre Philosophie —
                </p>
                <h2 ref={step1TitleRef} className="font-serif text-[18vw] md:text-[10rem] lg:text-[14rem] text-[#1A1A1A] leading-[0.8] tracking-tighter text-center">
                    L'Héritage.
                </h2>
            </div>

            {/* Etape 2 : La Grande Phrase */}
            <div ref={step2Ref} className="absolute inset-0 flex items-center justify-center px-6 md:px-20 z-10 pointer-events-none">
                <p className="text-3xl md:text-5xl lg:text-7xl font-serif text-[#1A1A1A] text-center leading-[1.2] text-pretty max-w-5xl mix-blend-multiply">
                    Le véritable artisanat ne cherche pas à effacer le temps...
                </p>
            </div>

            {/* Etape 3 : La Punchline Finale */}
            <div ref={step3Ref} className="absolute inset-0 flex flex-col items-center justify-center px-6 md:px-20 z-10 pointer-events-none">
                <div className="w-[1px] h-16 bg-[#A68A64] mb-8"></div>
                <p className="text-xl md:text-3xl lg:text-4xl font-sans font-light uppercase tracking-[0.2em] text-[#A68A64] text-center leading-[1.5] max-w-4xl">
                    Mais à en sublimer la trace pour les générations futures.
                </p>
                <div className="w-[1px] h-16 bg-[#A68A64] mt-8"></div>
            </div>

        </section>
    );
};

export default TransitionToServices;
