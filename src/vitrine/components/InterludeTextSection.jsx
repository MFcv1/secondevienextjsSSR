import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const InterludeTextSection = () => {
    const containerRef = useRef(null);
    const scrollRef1 = useRef(null);
    const scrollRef2 = useRef(null);
    const marqueeRef1 = useRef(null);
    const marqueeRef2 = useRef(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            // 1. SCROLL PARALLAX 
            // En appliquant xPercent sur un conteneur w-max énorme, 
            // on recrée le mouvement balayage très puissant avec accélération au scroll 
            gsap.to(scrollRef1.current, {
                xPercent: -8,
                ease: "none",
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1, 
                }
            });

            gsap.to(scrollRef2.current, {
                xPercent: 8,
                ease: "none",
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1,
                }
            });

            // 2. MARQUEE INFINIE SANS ROLLBACK NI TROUS
            // On a 4 blocs identiques, on décale d'exactement 1 bloc soit -25% de la largeur totale
            gsap.to(marqueeRef1.current, {
                xPercent: -25,
                duration: 32, // Vitesse ralentie pour un rendu plus premium et posé
                repeat: -1,
                ease: "none"
            });

            // Ligne 2 - Défilement opposé (vers la droite)
            gsap.fromTo(marqueeRef2.current, 
                { xPercent: -25 },
                {
                    xPercent: 0,
                    duration: 38, // Légèrement plus lent pour le décalage dynamique
                    repeat: -1,
                    ease: "none"
                }
            );

        }, containerRef);
        return () => ctx.revert();
    }, []);

    // Séparateur avec taille dynamique (scale) et ajustement vertical (yOffset)
    const Dash = ({ scale = 0.4, yOffset = -0.15 }) => (
        <span 
            className="inline-block align-middle mx-[3vw] opacity-80" 
            style={{ fontSize: `${scale}em`, transform: `translateY(${yOffset}em)` }}
        >
            —
        </span>
    );

    const MarqueeBlock1 = () => (
        <h2 className="text-[#1A1A1A]/15 text-[16vw] md:text-[14vw] font-serif leading-none tracking-tighter uppercase whitespace-nowrap">
            PRÉSERVER L'HÉRITAGE <Dash scale={0.55} yOffset={-0.12} /> PRÉSERVER L'HÉRITAGE <Dash scale={0.55} yOffset={-0.12} />
        </h2>
    );

    const MarqueeBlock2 = () => (
        <h2 className="text-[#A68A64]/40 text-[16vw] md:text-[14vw] font-serif italic font-light leading-none tracking-tighter lowercase whitespace-nowrap">
            transmettre l'histoire <Dash scale={0.45} yOffset={-0.16} /> transmettre l'histoire <Dash scale={0.45} yOffset={-0.16} />
        </h2>
    );

    return (
        <section
            ref={containerRef}
            className="relative w-full pt-16 pb-32 md:py-40 bg-[#F9F6F0] flex flex-col items-center justify-center overflow-hidden z-0"
        >
            {/* Ligne 1 - Vers la gauche */}
            <div className="w-full flex justify-center">
                {/* Scroll Wrapper (Parallax) */}
                <div ref={scrollRef1} className="w-max will-change-transform">
                    {/* Marquee Wrapper (Boucle Infinie) */}
                    <div ref={marqueeRef1} className="flex w-max items-center will-change-transform">
                        <MarqueeBlock1 />
                        <MarqueeBlock1 />
                        <MarqueeBlock1 />
                        <MarqueeBlock1 />
                    </div>
                </div>
            </div>

            {/* Ligne 2 - Vers la droite */}
            <div className="w-full flex justify-center mt-[-2vw]">
                <div ref={scrollRef2} className="w-max will-change-transform">
                    <div ref={marqueeRef2} className="flex w-max items-center will-change-transform">
                        <MarqueeBlock2 />
                        <MarqueeBlock2 />
                        <MarqueeBlock2 />
                        <MarqueeBlock2 />
                    </div>
                </div>
            </div>

            {/* Ligne architecturale */}
            <div className="absolute top-0 bottom-0 left-[33%] w-px bg-black/5 hidden lg:block pointer-events-none" />
        </section>
    );
};

export default InterludeTextSection;
