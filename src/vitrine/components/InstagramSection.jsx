import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Instagram, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

const INSTA_POSTS = [
    {
        id: 1,
        img: "/images/before-after/apresu.webp",
        alt: "Atelier bois",
        className: "col-span-2 row-span-2 aspect-square md:aspect-auto"
    },
    {
        id: 2,
        img: "/images/before-after/avantu.webp",
        alt: "Détail patine",
        className: "col-span-1 row-span-1 aspect-square"
    },
    {
        id: 3,
        img: "/images/before-after/apres.webp",
        alt: "Outils artisan",
        className: "col-span-1 row-span-1 aspect-square"
    },
    {
        id: 4,
        img: "/images/before-after/apresx.webp",
        alt: "Intérieur provençal",
        className: "col-span-2 row-span-1 aspect-[2/1] md:aspect-auto"
    }
];

const InstagramSection = () => {
    const sectionRef = useRef(null);
    const contentRef = useRef(null);
    const [displayNumber, setDisplayNumber] = useState('0.0');
    const [isAnimating, setIsAnimating] = useState(false);

    // Animation casino pour le nombre 38.9k
    useEffect(() => {
        let ctx = gsap.context(() => {
            // Animation du compteur au scroll
            ScrollTrigger.create({
                trigger: sectionRef.current,
                start: 'top 80%',
                onEnter: () => {
                    if (!isAnimating) {
                        setIsAnimating(true);
                        animateCounter();
                    }
                },
                once: true
            });
        }, sectionRef);

        return () => ctx.revert();
    }, [isAnimating]);

    const animateCounter = () => {
        const targetNumber = 38.9;
        const duration = 2.5;
        const fps = 30;
        const totalFrames = duration * fps;
        let currentFrame = 0;

        const interval = setInterval(() => {
            currentFrame++;
            const progress = currentFrame / totalFrames;
            const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            const currentValue = targetNumber * easeProgress;
            
            // Afficher directement le nombre avec une décimale
            setDisplayNumber(currentValue.toFixed(1));
            
            if (currentFrame >= totalFrames) {
                clearInterval(interval);
                setDisplayNumber('38.9');
            }
        }, 1000 / fps);
    };

    useEffect(() => {
        let ctx = gsap.context(() => {
            let mm = gsap.matchMedia();

            // ─── MOBILE (< 768px) — dome réduit, pas de parallax images ──────
            mm.add("(max-width: 767px)", () => {
                gsap.fromTo(sectionRef.current,
                    { borderRadius: "50% 50% 0 0 / 30vh 30vh 0 0" },
                    {
                        borderRadius: "0% 0% 0 0 / 0vh 0vh 0 0",
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: sectionRef.current,
                            start: "top bottom",
                            end: "top 10%",
                            scrub: 1.5,
                        }
                    }
                );

                gsap.fromTo(contentRef.current,
                    { y: 60, opacity: 0, filter: "blur(8px)" },
                    {
                        y: 0, opacity: 1, filter: "blur(0px)",
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: sectionRef.current,
                            start: "top 75%", end: "top 25%", scrub: 1,
                        }
                    }
                );
                // Pas de parallax sur images mobile — scale réduit aussi
                gsap.utils.toArray('.insta-img-container img').forEach(img => {
                    img.style.transform = 'scale(1.05)';
                });
            });

            // ─── DESKTOP (>= 768px) — comportement original intact ───────────
            mm.add("(min-width: 768px)", () => {
                gsap.fromTo(sectionRef.current,
                    { borderRadius: "50% 50% 0 0 / 40vh 40vh 0 0" },
                    {
                        borderRadius: "0% 0% 0 0 / 0vh 0vh 0 0",
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: sectionRef.current,
                            start: "top bottom",
                            end: "top 10%",
                            scrub: 1.5,
                        }
                    }
                );

                gsap.fromTo(contentRef.current,
                    { y: 80, opacity: 0, filter: "blur(8px)" },
                    {
                        y: 0, opacity: 1, filter: "blur(0px)",
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: sectionRef.current,
                            start: "top 75%", end: "top 25%", scrub: 1,
                        }
                    }
                );

                gsap.utils.toArray('.insta-img-container').forEach(container => {
                    const img = container.querySelector('img');
                    gsap.fromTo(img,
                        { yPercent: -15 },
                        {
                            yPercent: 15, ease: "none",
                            scrollTrigger: {
                                trigger: container,
                                start: "top bottom", end: "bottom top", scrub: true
                            }
                        }
                    );
                });
            });

        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="relative w-full bg-[#111111] flex flex-col z-30 pb-[20vh] -mt-[5vh] md:mt-0">
            {/* Design "Chambre Noire / Éditorial" full width */}
            <div ref={contentRef} className="relative w-full flex-grow flex flex-col pt-[15vh] md:pt-[20vh] pb-32 px-6 md:px-12 lg:px-20 mx-auto">
                {/* Texture granuleuse subtile */}
                <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none"
                    style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stucco.png")' }}
                />

                <div className="max-w-[1600px] w-full mx-auto flex flex-col z-10 relative">

                    {/* EN-TÊTE ÉDITORIALE (Flex pour Desktop, Stack pour Mobile) */}
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between mb-16 md:mb-24 gap-12">

                        <div className="flex flex-col max-w-2xl">
                            <div className="flex items-center gap-3 mb-8 relative -top-8">
                                <Instagram className="text-[#A68A64]" size={20} />
                                <span className="text-xs font-mono font-bold tracking-[0.3em] uppercase text-[#A68A64]">
                                    Dans l'Atelier
                                </span>
                            </div>

                            <motion.h2
                                initial={{ filter: "blur(12px)", opacity: 0, y: 40 }}
                                whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                                transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                                viewport={{ once: true }}
                                className="text-6xl md:text-7xl lg:text-[7.5rem] font-serif text-[#F9F6F0] leading-[0.85] tracking-tighter uppercase"
                            >
                                L'ARTISANAT <br />
                                <span className="italic font-light lowercase text-[#A68A64]">au quotidien.</span>
                            </motion.h2>
                        </div>

                        {/* BADGE ABONNÉS (Social Proof Massif en Typographie) */}
                        <div className="flex flex-col items-start xl:items-end text-left xl:text-right gap-10 -mt-12">
                            <motion.div
                                initial={{ filter: "blur(10px)", opacity: 0 }}
                                whileInView={{ filter: "blur(0px)", opacity: 1 }}
                                transition={{ duration: 1, delay: 0.2 }}
                                viewport={{ once: true }}
                                className="text-[#F9F6F0] font-serif text-6xl md:text-[6.5rem] tracking-tighter flex items-end leading-none relative -top-4"
                            >
                                <span className="transition-all duration-100">{displayNumber}</span>
                                <span className="text-3xl md:text-5xl text-[#A68A64] ml-1 mb-1 md:mb-2 italic lowercase tracking-normal">k</span>
                            </motion.div>

                            <a
                                href="https://www.instagram.com/seconde_vie_pour_nos_objets/"
                                target="_blank"
                                rel="noreferrer"
                                className="group relative flex items-center gap-4 overflow-hidden rounded-full border border-white/20 bg-white/5 pl-6 pr-2 py-2 transition-all duration-500 backdrop-blur-md hover:border-white"
                            >
                                <span className="relative z-10 text-[10px] md:text-xs uppercase tracking-[0.2em] font-sans text-white/90 group-hover:text-[#111] font-bold ml-2 transition-colors duration-500">
                                    Rejoindre la communauté
                                </span>
                                {/* Premium Layer Hover CSS Animation */}
                                <div className="absolute inset-0 -translate-y-[101%] bg-white transition-transform duration-[600ms] ease-[cubic-bezier(0.39,0.575,0.565,1)] group-hover:translate-y-0 z-0" />

                                <div className="relative z-10 w-10 h-10 rounded-full bg-white group-hover:bg-[#111] flex items-center justify-center text-[#111] group-hover:text-white transition-colors duration-500">
                                    <ArrowUpRight size={18} strokeWidth={2.5} />
                                </div>
                            </a>
                        </div>

                    </div>

                    {/* GRILLE ÉDITORIALE (Type Magazine Asymétrique) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-[auto] md:grid-rows-[300px_300px] lg:grid-rows-[400px_400px] gap-4 md:gap-6 mt-auto">
                        {INSTA_POSTS.map((post, i) => (
                            <motion.a
                                href="https://www.instagram.com/seconde_vie_pour_nos_objets/"
                                target="_blank"
                                rel="noreferrer"
                                key={post.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                                className={`insta-img-container relative overflow-hidden bg-[#1A1A1A] group cursor-pointer border border-white/5 rounded-2xl md:rounded-3xl shadow-xl ${post.className}`}
                            >
                                {/* Overlay "Argentique" (Désaturation + Chaleur) qui disparaît au hover */}
                                <div className="absolute inset-0 bg-black/30 mix-blend-color z-10 group-hover:opacity-0 transition-opacity duration-700" />
                                <div className="absolute inset-0 bg-[#A68A64]/10 mix-blend-multiply z-10 group-hover:opacity-0 transition-opacity duration-700" />

                                <img
                                    src={post.img}
                                    alt={post.alt}
                                    // Utilisation de scale-125 pour cacher les bords pendant le parallax GSAP ! (IMPORTANT)
                                    className="absolute inset-0 w-full h-full scale-[1.3] object-cover object-center grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] will-change-transform"
                                />

                                {/* Icone Insta au hover = Minimaliste et centré */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 z-20 transition-opacity duration-500 pointer-events-none">
                                    <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 transform scale-75 group-hover:scale-100 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] shadow-2xl">
                                        <Instagram className="text-white" size={24} />
                                    </div>
                                </div>
                            </motion.a>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
};

export default InstagramSection;
