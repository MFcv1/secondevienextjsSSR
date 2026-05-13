import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail } from 'lucide-react';
import SplitText from './SplitText';
import MagneticButton from './MagneticButton';

const ContactCTASection = ({ onEnterShop }) => {
    return (
        <section className="relative w-full z-20 pb-0 overflow-hidden" style={{ marginTop: '-15vh', marginBottom: '-1px' }}>
            {/* L'ultime "Floating Frame" */}
            <div className="relative w-full min-h-screen overflow-hidden bg-[#111] flex flex-col items-center justify-center pt-[25vh] pb-24 md:pt-[40vh] md:pb-32 px-6 md:px-12 mx-auto shadow-[0_-30px_60px_rgba(0,0,0,0.3)] text-center">
                {/* Grains ou texture pour le luxe */}
                <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none"
                    style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stucco.png")' }}
                />

                {/* Rule 8A: Lignes 1px alignées pixel-perfect sur les dividers `divide-x` du footer (grille 4 colonnes -> 25%/75%).
                    Wrap identique au footer (max-w-[1920px] + md:px-6).
                    `border-x border-transparent` compense les 2x1px du `border` de la carte bénéfices.
                    `calc(25% - 1px)` / `calc(75% - 1px)` corrige le sub-pixel rendering pour matcher visuellement les divide-x. */}
                <div className="absolute inset-0 z-0 pointer-events-none hidden md:block">
                    <div className="relative mx-auto h-full w-full max-w-[1920px] md:px-6">
                        <div className="relative h-full border-x border-transparent">
                            <div className="absolute inset-y-0 w-px bg-[#3a332b]" style={{ left: 'calc(25% - 1px)' }} />
                            <div className="absolute inset-y-0 w-px bg-[#3a332b]" style={{ left: 'calc(75% - 1px)' }} />
                        </div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 flex flex-col items-center max-w-4xl"
                >
                    {/* Label avec révélation progressive - décalage isolé */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1], delay: 0.1 }}
                        className="flex items-center gap-3 relative -top-6 mb-20"
                    >
                        <div className="w-8 h-[1px] bg-[#A68A64]" />
                        <span className="text-[10px] md:text-xs font-mono font-bold tracking-[0.3em] uppercase text-[#A68A64]">
                            Votre Projet
                        </span>
                        <div className="w-8 h-[1px] bg-[#A68A64]" />
                    </motion.div>

                    {/* Titre avec blur + stagger par ligne */}
                    <motion.h2
                        initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
                        whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
                        className="text-5xl md:text-7xl lg:text-[7rem] font-serif text-[#F9F6F0] leading-[0.85] tracking-tighter mb-16 uppercase"
                    >
                        <motion.span
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1], delay: 0.3 }}
                            className="block mb-4"
                        >
                            PRÊT À ÉCRIRE LA
                        </motion.span>
                        <motion.span
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1], delay: 0.5 }}
                            className="italic font-light lowercase text-[#A68A64] block"
                        >
                            suite de l'histoire ?
                        </motion.span>
                    </motion.h2>

                    {/* Paragraphe avec révélation douce */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1], delay: 0.6 }}
                    >
                        <SplitText className="text-white/60 text-base md:text-lg lg:text-xl font-light max-w-xl mx-auto mb-8 leading-relaxed">
                            Meuble de famille, trouvaille en brocante ou envie de changement. Parlons de votre idée, nous lui donnerons la patine qu'elle mérite.
                        </SplitText>
                    </motion.div>

                    {/* Boutons avec stagger */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1], delay: 0.8 }}
                        className="flex flex-col sm:flex-row items-center gap-6"
                    >
                        {/* Bouton Primaire (Contact) avec Magnetisme (Rule 6B) */}
                        <MagneticButton
                            onClick={() => window.location.href = 'mailto:contact@seconde-vie-anais.fr'}
                            className="group relative overflow-hidden bg-[#F9F6F0] text-[#1A1A1A] rounded-full px-8 py-4 md:px-10 md:py-5 flex items-center justify-center gap-3 font-mono font-bold uppercase text-[10px] md:text-xs tracking-[0.2em] transition-transform hover:scale-105 duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]"
                        >
                            <Mail size={16} className="text-[#A68A64]" />
                            <span className="relative z-10 transition-colors duration-500 group-hover:text-white">Demander un devis</span>
                            {/* Le Fill Reveal Fixaplan Style */}
                            <div className="absolute inset-0 bg-[#A68A64] translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" />
                        </MagneticButton>

                        {/* Bouton Secondaire (Catalogue) */}
                        <button
                            onClick={onEnterShop}
                            className="group relative flex items-center gap-3 font-mono font-bold uppercase text-[10px] md:text-xs tracking-[0.2em] text-white/50 hover:text-white transition-colors duration-300 px-6 py-4 cursor-pointer"
                        >
                            <span className="relative">
                                Explorer le catalogue
                                <span className="absolute left-0 bottom-[-4px] w-full h-[1px] bg-[#A68A64] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" />
                            </span>
                            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-[#A68A64] group-hover:bg-[#A68A64] transition-all duration-500 shrink-0">
                                <ArrowRight size={14} className="group-hover:text-[#1A1A1A] transition-colors" />
                            </div>
                        </button>
                    </motion.div>
                </motion.div>

            </div>
        </section>
    );
};

export default ContactCTASection;
