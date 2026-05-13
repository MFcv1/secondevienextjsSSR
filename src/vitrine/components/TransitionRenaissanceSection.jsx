import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * TRANSITION RENAISSANCE
 * Interlude typographique aéré entre AboutSection et BeforeAfterSection.
 * 100% isolé : aucun sticky, aucun z-index qui déborde.
 * Flow normal dans le DOM, fond propre, animations autonomes.
 */
const TransitionRenaissanceSection = () => {
    const sectionRef = useRef(null);

    useEffect(() => {
        let ctx = gsap.context(() => {
            // Reveal typographique : chaque ligne apparaît avec un blur + slide stagger
            const lines = sectionRef.current.querySelectorAll('.transition-line');
            gsap.fromTo(lines,
                { yPercent: 120, rotateZ: 3, opacity: 0, filter: "blur(12px)" },
                {
                    yPercent: 0,
                    rotateZ: 0,
                    opacity: 1,
                    filter: "blur(0px)",
                    stagger: 0.15,
                    ease: "power3.out",
                    duration: 1.2,
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 65%",
                    }
                }
            );

            // Parallaxe légère sur le petit trait décoratif
            const rule = sectionRef.current.querySelector('.decorative-rule');
            if (rule) {
                gsap.fromTo(rule,
                    { scaleX: 0 },
                    {
                        scaleX: 1,
                        ease: "power2.out",
                        duration: 1.5,
                        scrollTrigger: {
                            trigger: sectionRef.current,
                            start: "top 60%",
                        }
                    }
                );
            }
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={sectionRef}
            className="relative w-full bg-[#F9F6F0] z-20 overflow-hidden"
        >
            {/* Texture papier subtile */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper.png")' }} />

            <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-32 md:py-48 lg:py-56">

                {/* Petit label décoratif */}
                <div className="flex items-center gap-3 mb-10 md:mb-14">
                    <div className="decorative-rule w-10 h-[1px] bg-[#A68A64] origin-left" />
                    <span className="text-[10px] md:text-xs font-mono font-bold tracking-[0.3em] uppercase text-[#A68A64]">
                        La Renaissance
                    </span>
                    <div className="decorative-rule w-10 h-[1px] bg-[#A68A64] origin-right" />
                </div>

                {/* Texte Géant — Mix Typographique (Encyclopédie Rule 3A) */}
                <div className="overflow-hidden pb-2 md:pb-4">
                    <span className="transition-line block text-[clamp(3rem,10vw,10rem)] leading-[0.85] font-serif uppercase tracking-tighter text-[#1A1A1A]">
                        CHAQUE PIÈCE
                    </span>
                </div>
                <div className="overflow-hidden pb-2 md:pb-4">
                    <span className="transition-line block text-[clamp(3rem,10vw,10rem)] leading-[0.85] font-serif lowercase italic font-light tracking-normal text-[#A68A64]">
                        mérite une
                    </span>
                </div>
                <div className="overflow-hidden pb-2 md:pb-4">
                    <span className="transition-line block text-[clamp(3rem,10vw,10rem)] leading-[0.85] font-serif uppercase tracking-tighter text-[#1A1A1A]">
                        RENAISSANCE.
                    </span>
                </div>

                {/* Trait décoratif final */}
                <div className="decorative-rule w-20 h-[1px] bg-[#A68A64]/40 mt-12 md:mt-16 origin-center" />
            </div>
        </section>
    );
};

export default TransitionRenaissanceSection;
