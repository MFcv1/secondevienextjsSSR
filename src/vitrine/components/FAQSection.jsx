import React, { useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FAQS = [
    {
        id: "01",
        question: "Comment se passe la livraison d'un meuble volumineux ?",
        answer: "Nous travaillons avec un transporteur spécialisé dans le mobilier fragile. Votre meuble est soigneusement emballé (couvertures, bulles, protections d'angles) et livré directement dans la pièce de votre choix, partout en France."
    },
    {
        id: "02",
        question: "Puis-je vous confier la restauration d'un meuble de famille ?",
        answer: "Absolument. C'est même le cœur de notre métier. Envoyez-nous des photos de votre meuble via le formulaire de contact, nous vous établirons un diagnostic et un devis personnalisé pour lui redonner vie tout en respectant son histoire."
    },
    {
        id: "03",
        question: "Qu'est-ce que l'aérogommage exactement ?",
        answer: "C'est une technique de décapage à très basse pression. Contrairement au sablage traditionnel (trop agressif) ou aux produits chimiques, l'aérogommage utilise un granulat naturel très fin qui retire vernis et peintures sans creuser ni abîmer les veines du bois."
    },
    {
        id: "04",
        question: "Comment entretenir vos meubles patinés au quotidien ?",
        answer: "Nos finitions sont conçues pour être durables. Pour l'entretien courant, un chiffon doux légèrement humide suffit. Évitez les produits chimiques abrasifs. Nous fournissons une fiche de conseils spécifiques avec chaque meuble (cire ou vernis) acheté."
    }
];

const FAQSection = ({ personalization = {} }) => {
    // État pour gérer quel accordéon est ouvert (null si tout est fermé)
    const [openId, setOpenId] = useState(null);
    const sectionRef = useRef(null);
    const contentRef = useRef(null);
    const faqText = personalization.faq_main_text || {};
    const faqItems = [1, 2, 3, 4, 5]
        .map((id, index) => ({
            id: String(id).padStart(2, '0'),
            question: faqText[`q${id}`] || FAQS[index]?.question,
            answer: faqText[`a${id}`] || FAQS[index]?.answer,
        }))
        .filter((faq) => faq.question && faq.answer);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            let mm = gsap.matchMedia();

            // ─── MOBILE (< 768px) — seulement opacity, pas de scale/y ────────
            mm.add("(max-width: 767px)", () => {
                const nextSibling = sectionRef.current.nextElementSibling;
                if (nextSibling) {
                    gsap.to(contentRef.current, {
                        opacity: 0.3,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: nextSibling,
                            start: "top bottom",
                            end: "top top",
                            scrub: true,
                        }
                    });
                }
            });

            // ─── DESKTOP (>= 768px) — effet complet original intact ──────────
            mm.add("(min-width: 768px)", () => {
                const nextSibling = sectionRef.current.nextElementSibling;
                if (nextSibling) {
                    gsap.to(contentRef.current, {
                        scale: 0.9,
                        opacity: 0.3,
                        y: 100,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: nextSibling,
                            start: "top bottom",
                            end: "top top",
                            scrub: true,
                        }
                    });
                }
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    const toggleFaq = (id) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <section ref={sectionRef} className="relative w-full bg-white flex flex-col z-40 shadow-[0_-30px_60px_rgba(0,0,0,0.2)] mt-[-15vh] overflow-hidden">
            <div ref={contentRef} className="relative w-full bg-white flex flex-col pt-[20vh] pb-[20vh] md:pt-[25vh] md:pb-[25vh] px-6 md:px-12 lg:px-20 mx-auto min-h-screen justify-center">

                {/* 1px Rule Decoration */}
                <div className="absolute top-0 bottom-0 left-[33%] w-px bg-black/5 hidden lg:block" />

                <div className="max-w-[1200px] w-full mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 relative z-10 items-center my-auto">

                    {/* GAUCHE : Titre Fixe (Sticky) */}
                    <div className="w-full lg:w-1/3">
                        <div className="sticky top-32">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-6 h-[1px] bg-[#A68A64]"></div>
                                <span className="text-[10px] md:text-xs font-mono font-bold tracking-[0.3em] uppercase text-[#A68A64]">
                                    F.A.Q
                                </span>
                            </div>

                            <motion.h2
                                initial={{ filter: "blur(12px)", opacity: 0, y: 30 }}
                                whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                                viewport={{ once: true }}
                                className="text-5xl md:text-7xl lg:text-[5.5rem] font-serif text-[#1A1A1A] leading-[0.9] tracking-tighter mb-8 uppercase"
                            >
                                VOS <br />
                                <span className="italic font-light text-[#A68A64] lowercase tracking-normal">questions.</span>
                            </motion.h2>

                            <motion.p
                                initial={{ filter: "blur(10px)", opacity: 0 }}
                                whileInView={{ filter: "blur(0px)", opacity: 1 }}
                                transition={{ duration: 1, delay: 0.2 }}
                                viewport={{ once: true }}
                                className="text-[#5A5550] text-base md:text-lg leading-relaxed font-light border-l border-[#1A1A1A]/10 pl-6 mt-6 md:mt-12"
                            >
                                Tout ce que vous devez savoir sur notre processus de restauration, l'expédition et l'entretien de vos futures pièces.
                            </motion.p>
                        </div>
                    </div>

                    {/* DROITE : Les Accordéons */}
                    <div className="w-full lg:w-2/3 flex flex-col">
                        <div className="w-full border-t border-[#1A1A1A]/10">
                            {faqItems.map((faq) => {
                                const isOpen = openId === faq.id;

                                return (
                                    <div
                                        key={faq.id}
                                        className="border-b border-[#1A1A1A]/10 group"
                                    >
                                        <button
                                            onClick={() => toggleFaq(faq.id)}
                                            className="w-full flex items-center justify-between py-6 md:py-10 lg:py-12 text-left outline-none"
                                        >
                                            <div className="flex gap-6 md:gap-10 pr-4 items-center">
                                                <span className="text-[#1A1A1A]/30 font-serif italic text-lg md:text-xl mt-1">
                                                    {faq.id}
                                                </span>
                                                <span className={`font-serif text-xl md:text-3xl tracking-tight transition-colors duration-300 ${isOpen ? 'text-[#A68A64]' : 'text-[#1A1A1A] group-hover:text-[#A68A64]'}`}>
                                                    {faq.question}
                                                </span>
                                            </div>

                                            <motion.div
                                                animate={{ rotate: isOpen ? 45 : 0 }}
                                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                                className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full border border-[#1A1A1A]/10 flex items-center justify-center bg-[#F9F6F0] group-hover:bg-[#1A1A1A] group-hover:border-[#1A1A1A] group-hover:text-white transition-colors duration-300"
                                            >
                                                <Plus size={20} strokeWidth={1.5} className={isOpen ? "text-[#1A1A1A] group-hover:text-white" : "text-[#1A1A1A] group-hover:text-white"} />
                                            </motion.div>
                                        </button>

                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} // Courbe de vitesse Awwwards
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pb-8 md:pb-10 pl-[52px] md:pl-[72px] pr-12">
                                                        <p className="text-[#5A5550] text-sm md:text-base leading-relaxed font-light">
                                                            {faq.answer}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default FAQSection;
