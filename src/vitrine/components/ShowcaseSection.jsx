import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const vitrineItems = [
    {
        title: "La Commode Céladon",
        desc: "Mise en valeur dans une douce teinte sauge, cette pièce maîtresse dévoile de magnifiques motifs floraux sculptés. Une patine délicate vient sublimer ses courbes d'origine, prête à insuffler une âme organique à votre espace.",
        img: "/images/about/about-1.webp",
        reverse: false
    },
    {
        title: "Le Grand Vaisselier",
        desc: "Une prestance architecturale rare, rehaussée par un bleu profond rappelant les volets typiques du Sud. Ses moulures élégantes et sa ferronnerie d'origine témoignent d'un artisanat intemporel que nous avons préservé.",
        img: "/images/about/about-2.webp",
        reverse: true
    },
    {
        title: "Le Chevet Provençal",
        desc: "L'authenticité dans ses dimensions les plus charmantes. Restauré pour conserver les nobles marques du temps, son bois clair et lumineux s'intègre avec une élégance absolue dans une décoration Wabi-Sabi contemporaine.",
        img: "/images/about/about-3.webp",
        reverse: false
    }
];

const ShowcaseSection = ({ personalization = {} }) => {
    const sectionRef = useRef(null);
    const items = vitrineItems.map((item, index) => {
        const key = `manifesto_${index + 1}`;
        const text = personalization[`${key}_text`] || {};
        return {
            ...item,
            title: text.title || item.title,
            desc: text.desc || item.desc,
            tag: text.tag || 'Pièce unique',
            img: personalization[key] || item.img,
        };
    });

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {

            let mm = gsap.matchMedia();

            // ─── MOBILE (< 768px) — sans rotateZ, animation simplifiée ───────
            mm.add("(max-width: 767px)", () => {
                gsap.utils.toArray('.showcase-row').forEach((row) => {
                    let imgContainer = row.querySelector('.showcase-img-container');
                    let img = row.querySelector('img');

                    gsap.fromTo(imgContainer,
                        { y: 80, scale: 0.95, opacity: 0, filter: "blur(12px)", willChange: "filter, transform" },
                        {
                            y: 0, scale: 1, opacity: 1, filter: "blur(0px)",
                            duration: 1.4, ease: "power3.out",
                            scrollTrigger: { trigger: row, start: "top 88%" }
                        }
                    );

                    gsap.set(img, { scale: 1 });

                    let textElements = row.querySelectorAll('.showcase-reveal-item');
                    gsap.fromTo(textElements,
                        { yPercent: 80, scale: 0.96, opacity: 0 },
                        {
                            yPercent: 0, scale: 1, opacity: 1,
                            duration: 1.0, stagger: 0.07, ease: "power3.out",
                            scrollTrigger: { trigger: row, start: "top 85%" }
                        }
                    );
                });
            });

            // ─── DESKTOP (>= 768px) — animation originale avec rotateZ ───────
            mm.add("(min-width: 768px)", () => {
                gsap.utils.toArray('.showcase-row').forEach((row) => {
                    let imgContainer = row.querySelector('.showcase-img-container');
                    let img = row.querySelector('img');
                    let isReversed = row.classList.contains('md:flex-row-reverse');

                    gsap.fromTo(imgContainer,
                        {
                            y: 150, rotateZ: isReversed ? -3 : 3, scale: 0.9,
                            opacity: 0, filter: "blur(20px)", willChange: "filter, transform"
                        },
                        {
                            y: 0, rotateZ: 0, scale: 1, opacity: 1, filter: "blur(0px)",
                            duration: 1.8, ease: "power4.out",
                            scrollTrigger: { trigger: row, start: "top 85%" }
                        }
                    );

                    gsap.set(img, { scale: 1 });

                    let textElements = row.querySelectorAll('.showcase-reveal-item');
                    gsap.fromTo(textElements,
                        { yPercent: 120, rotateZ: 4, scale: 0.9, opacity: 0 },
                        {
                            yPercent: 0, rotateZ: 0, scale: 1, opacity: 1,
                            duration: 1.1, stagger: 0.08, ease: "power4.out",
                            scrollTrigger: { trigger: row, start: "top 82%" }
                        }
                    );
                });
            });

        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="w-full relative z-20">
            {/* DAMIER (Grid) Architectural Background - sur toute la largeur avec fondu multi-directionnel (mask-image) */}
            <div className="absolute inset-0 mix-blend-multiply opacity-[0.04] pointer-events-none z-0 rounded-t-[3rem] md:rounded-t-[4rem]"
                style={{
                    backgroundImage: 'linear-gradient(#1A1A1A 1px, transparent 1px), linear-gradient(90deg, #1A1A1A 1px, transparent 1px)',
                    backgroundSize: '4rem 4rem',
                    WebkitMaskImage: 'linear-gradient(to right, black 0%, black 10%, transparent 10%, transparent 90%, black 90%, black 100%), linear-gradient(to bottom, transparent 0%, transparent 2%, black 6%, black 92%, transparent 100%)',
                    maskImage: 'linear-gradient(to right, black 0%, black 10%, transparent 10%, transparent 90%, black 90%, black 100%), linear-gradient(to bottom, transparent 0%, transparent 2%, black 6%, black 92%, transparent 100%)',
                    WebkitMaskComposite: 'source-in',
                    maskComposite: 'intersect'
                }}>
            </div>

            {/* L'Astuce de transition : Marge externe négative pour monter PAR-DESSUS l'image punaisée */}
            {/* Rule 8B: Texture de fond subtile pour habiller le fond uni beige */}
            <div className="relative z-20 bg-[#F9F6F0] rounded-t-[3rem] md:rounded-t-[4rem] -mt-[8vh] pt-[15vh] pb-[25vh] px-6 md:px-12 lg:px-20 max-w-[1600px] mx-auto shadow-[0_-20px_60px_rgba(0,0,0,0.1)]">
                <div className="absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay pointer-events-none rounded-t-[3rem] md:rounded-t-[4rem]"
                    style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper.png")' }} />

                <div className="relative z-10 flex flex-col gap-[10vh] md:gap-[25vh]">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className={`showcase-row flex flex-col ${item.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-20 lg:gap-32 w-full`}
                        >

                            {/* Colonne Image - Passe-Partout (Encyclopédie Rule 5A) */}
                            <div className="w-full md:w-[60%] lg:w-[55%]">
                                <div className="bg-[#EDE8E0] p-4 md:p-6 lg:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] w-full">
                                    <div className="showcase-img-container aspect-[4/5] md:aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-[#E8E3DA] ml-auto mr-auto w-full will-change-transform">
                                        <img
                                            src={item.img}
                                            sizes="(max-width: 768px) calc(100vw - 3rem), 55vw"
                                            alt={item.title}
                                            className="w-full h-full object-cover origin-center transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Colonne Texte */}
                            <div className={`w-full md:w-[40%] lg:w-[45%] flex flex-col justify-center ${item.reverse ? 'md:items-end md:text-right' : 'md:items-start md:text-left'} text-center space-y-6`}>
                                <div className="overflow-hidden py-1">
                                    <div className="showcase-reveal-item block text-[#A68A64] text-sm md:text-base font-serif italic">
                                        N° 0{index + 1}
                                    </div>
                                </div>

                                <div className="overflow-hidden py-1">
                                    <h3 className="showcase-reveal-item block text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-serif text-[#1A1A1A] leading-[1.1] tracking-tight text-pretty">
                                        {item.title}
                                    </h3>
                                </div>

                                <div className="overflow-hidden py-1">
                                    <p className="showcase-reveal-item block text-[#5A5550] text-base md:text-lg font-light leading-relaxed max-w-[40ch] md:max-w-none mx-auto md:mx-0 text-pretty">
                                        {item.desc}
                                    </p>
                                </div>

                                <div className="overflow-hidden pt-4 py-1">
                                    <div className="showcase-reveal-item block">
                                        <div className="flex flex-col gap-6">
                                            <div className={`w-full h-[1px] bg-[#1A1A1A]/10 ${item.reverse ? 'ml-auto' : 'mr-auto'} max-w-[150px]`}></div>
                                            <span className="text-[10px] uppercase font-sans tracking-[0.3em] font-bold text-[#1A1A1A]/40">Pièce Unique</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </div>

        </section>
    );
};

export default ShowcaseSection;
