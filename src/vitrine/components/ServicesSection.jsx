import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { Search, Shield, Palette, CheckCircle2, ArrowRight } from 'lucide-react';
import SplitText from './SplitText';

gsap.registerPlugin(ScrollTrigger);

const PROCESS_STEPS = [
    {
        id: "01",
        title: "La Chine",
        desc: "Parcourir les villages et marchés de Provence à la recherche de pièces oubliées. Nous ne choisissons que des meubles ayant une structure saine et un potentiel unique.",
        icon: Search,
        color: "#C2704E" // Terracotta
    },
    {
        id: "02",
        title: "Le Diagnostic",
        desc: "Aérogommage basse pression pour retrouver le bois brut sans l'agresser. Traitement curatif et préventif contre les insectes pour garantir la pérennité.",
        icon: Shield,
        color: "#87A08B" // Sauge
    },
    {
        id: "03",
        title: "L'Artisanat",
        desc: "Réparation des greffes de bois, application de teintes minérales et finitions artisanales. Chaque geste est pensé pour sublimer sans dénaturer.",
        icon: Palette,
        color: "#A68A64" // Sable
    },
    {
        id: "04",
        title: "La Transmission",
        desc: "Pose d'un vernis protecteur ou d'une cire naturelle. La pièce est prête à rejoindre son nouvel intérieur pour une seconde vie éternelle.",
        icon: CheckCircle2,
        color: "#1A1A1A" // Onyx
    }
];

const ServicesSection = ({ personalization = {} }) => {
    const containerRef = useRef(null);
    const titleRef = useRef(null);
    const processSteps = PROCESS_STEPS.map((step, index) => {
        const text = personalization[`process_${index + 1}_text`] || {};
        return {
            ...step,
            title: text.t || step.title,
            desc: text.d || step.desc,
        };
    });

    useEffect(() => {
        let ctx = gsap.context(() => {
            // FRONTMASTER: A.01 MaskSlideUp + A.02 BlurFadeIn combinés
            if (titleRef.current) {
                const split = new SplitType(titleRef.current, { types: "lines, words" });
                
                // Hack A.01: overflow hidden pour le Masking 
                split.lines.forEach(l => {
                    const wrap = document.createElement("div");
                    wrap.style.overflow = "hidden";
                    wrap.style.paddingTop = "15px"; // Anti-crop des ascenders
                    wrap.style.paddingBottom = "15px"; // Anti-crop
                    wrap.style.marginTop = "-15px";
                    wrap.style.marginBottom = "-15px";
                    l.parentNode.insertBefore(wrap, l);
                    wrap.appendChild(l);
                });

                gsap.from(split.words, {
                    yPercent: 120, // vient d'en bas
                    rotateZ: 4,    // Léger tilt premium (Inversa)
                    filter: "blur(12px)",
                    opacity: 0,
                    duration: 1.8,
                    stagger: 0.08, // Stagger mot par mot
                    ease: "power4.out",
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top 70%",
                    }
                });
            }

            // Animation du sur-titre "Le Savoir-Faire" (A.05 LetterSpacingCrush)
            gsap.from(".sur-titre-service", {
                letterSpacing: "0.5em",
                opacity: 0,
                duration: 2,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 75%",
                }
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="relative w-full min-h-[100svh] bg-transparent p-3 md:p-5 lg:p-6 flex flex-col z-[30]">
            <div className="relative w-full flex-grow overflow-hidden bg-[#F9F6F0] rounded-t-3xl md:rounded-t-[3rem] rounded-b-2xl md:rounded-b-[2.5rem] shadow-[0_-30px_60px_rgba(0,0,0,0.15)] border-t border-black/5 flex flex-col py-16 md:py-24 px-8 md:px-16 lg:px-24">

                {/* Rule 8B: Texture de fond pour volume */}
                <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
                    style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper.png")' }} />

                {/* Header de section */}
                <div className="max-w-4xl mb-16 md:mb-24 relative z-10">
                    <div className="flex items-center gap-3 mb-6 sur-titre-service">
                        <div className="w-8 h-[1px] bg-[#A68A64]" />
                        <span className="text-[10px] md:text-xs font-bold font-mono tracking-[0.3em] uppercase text-[#A68A64]">
                            Le Savoir-Faire
                        </span>
                    </div>

                    {/* Rule 1: Mix Typography (Uppercase + Italic Lowercase) */}
                    <h2 ref={titleRef} className="text-5xl md:text-7xl lg:text-[6rem] font-serif text-[#1A1A1A] leading-[0.9] tracking-tighter mb-8 uppercase">
                        L'ART <span className="italic font-light lowercase text-[#A68A64]">de sauvegarder</span> LA MATIÈRE.
                    </h2>

                    {/* Rule 3D: Word-by-Word Stagger Reveal */}
                    <SplitText className="text-[#5A5550] text-sm md:text-lg max-w-2xl font-light leading-relaxed">
                        De la chine passionnée au geste technique précis, découvrez les étapes minutieuses qui transforment un objet oublié en une pièce d'exception.
                    </SplitText>
                </div>

                {/* Bento Grid Processus */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-grow relative z-10">
                    {processSteps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 50, filter: "blur(5px)" }} // Blur Reveal
                            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            viewport={{ once: true }}
                            transition={{
                                type: "spring",
                                stiffness: 80,
                                damping: 15,
                                delay: index * 0.1
                            }}
                            className="group relative bg-[#F9F6F0]/80 border border-black/5 p-8 rounded-[2rem] flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                        >
                            {/* Hover Premium: Pseudo-couche qui monte */}
                            <div className="absolute inset-0 translate-y-full bg-white transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-y-0 z-0" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-10">
                                    <div
                                        className="w-12 h-12 rounded-[1rem] flex items-center justify-center text-white shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-transform duration-500 group-hover:scale-110"
                                        style={{ backgroundColor: step.color }}
                                    >
                                        <step.icon size={22} strokeWidth={1.5} />
                                    </div>
                                    <span className="text-2xl font-serif italic text-[#1A1A1A]/20 transition-colors duration-500 group-hover:text-[#1A1A1A]/40">
                                        {step.id}
                                    </span>
                                </div>

                                <h3 className="text-xl md:text-2xl font-serif text-[#1A1A1A] mb-4">
                                    {step.title}
                                </h3>

                                <p className="text-[#5A5550] text-xs md:text-sm leading-relaxed font-light duration-500 group-hover:text-[#1A1A1A]">
                                    {step.desc}
                                </p>
                            </div>

                            <div className="mt-10 overflow-hidden relative z-10">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#A68A64] md:translate-y-8 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
                                    Découvrir l'étape <ArrowRight size={14} />
                                </div>
                            </div>

                            {/* Texture décorative très légère */}
                            <div className="absolute top-[-5%] right-[-5%] p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none z-0 rotate-12 group-hover:rotate-0">
                                <step.icon size={120} strokeWidth={0.5} color={step.color} />
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default ServicesSection;
