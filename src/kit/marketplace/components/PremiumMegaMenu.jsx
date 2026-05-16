import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, DoorOpen, DoorClosed, Table2, Armchair, Sofa, RockingChair, Lamp, LampDesk, LampWallDown, Flower2, Frame } from 'lucide-react';
import { getCategoryUrl } from '../../../utils/slug';

const NOUVEAUTES_ITEMS = [
    {
        id: 'n1',
        title: 'Malle de voyage en cuir',
        date: 'Il y a 2 jours',
        image: '/images/gallery-hero-1.webp',
        desc: 'Superbe malle ancienne restaurée, idéale en table basse de salon.'
    },
    {
        id: 'n2',
        title: 'Enfilade scandinave',
        date: 'Il y a 3 jours',
        image: '/images/gallery-hero-2.webp',
        desc: 'Design épuré des années 60, patine d\'origine et portes planes.'
    },
    {
        id: 'n3',
        title: 'Appliques en laiton',
        date: 'Il y a 4 jours',
        image: '/images/gallery-hero-3.webp',
        desc: 'Paire d\'appliques restaurées avec jolis globes en opaline.'
    },
    {
        id: 'n4',
        title: 'Fauteuil Lounge velours',
        date: 'Cette semaine',
        image: '/images/gallery-hero-4.webp',
        desc: 'Assise refaite à neuf par notre tapissier partenaire, grand confort.'
    },
    {
        id: 'n5',
        title: 'Miroir triptyque vintage',
        date: 'Cette semaine',
        image: '/images/gallery-hero-1.webp',
        desc: 'Pièce rare aux finitions nickelées, dos cartonné d\'époque.'
    }
];

// Sous-composant spécifique pour le layout "Nouveautés" dynamique au survol
function NouveautesContent({ darkMode }) {
    const [hoveredId, setHoveredId] = useState(NOUVEAUTES_ITEMS[0].id);
    const activeItem = NOUVEAUTES_ITEMS.find(i => i.id === hoveredId);

    return (
        <div className="flex w-[550px] lg:w-[680px]">
            {/* Colonne de gauche (Liste de liens) */}
            <div className="py-6 px-4 w-[240px] flex flex-col justify-center shrink-0">
                <ul className="flex flex-col relative w-full gap-0.5">
                    {NOUVEAUTES_ITEMS.map(item => (
                        <li 
                            key={item.id}
                            onMouseEnter={() => setHoveredId(item.id)}
                            className="relative flex items-center"
                        >
                            <a href="#" className={`relative z-10 w-full py-2.5 px-4 text-[13px] transition-colors rounded-lg
                                ${hoveredId === item.id 
                                    ? (darkMode ? 'text-white font-medium' : 'text-black font-medium') 
                                    : (darkMode ? 'text-stone-400 hover:text-stone-300' : 'text-stone-500 hover:text-stone-700')}
                                `}
                            >
                                {item.title}
                            </a>
                            {hoveredId === item.id && (
                                <motion.div 
                                    layoutId="nouveautes-active-bg"
                                    className={`absolute inset-0 rounded-lg -z-10 ${darkMode ? 'bg-white/10' : 'bg-stone-200'}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                />
                            )}
                        </li>
                    ))}
                    
                    <div className="mt-4 pt-4 border-t border-stone-200/20 px-4">
                         <a href="#" className={`text-[11px] font-bold uppercase tracking-widest flex items-center justify-between w-full transition-colors group ${darkMode ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-black'}`}>
                             Voir le catalogue <span className="transform transition-transform group-hover:translate-x-1">→</span>
                         </a>
                    </div>
                </ul>
            </div>
            
            {/* Colonne de droite (Carte de prévisualisation ONA-style) */}
            <div className={`p-6 w-full flex items-stretch ${darkMode ? 'bg-[#151515] border-l border-white/5' : 'bg-[#F2F2F0] border-l border-stone-100'}`}>
                 <AnimatePresence mode="wait">
                     <motion.div 
                         key={activeItem.id}
                         initial={{ opacity: 0, y: 5 }}
                         animate={{ opacity: 1, y: 0, pointerEvents: "auto" }}
                         exit={{ opacity: 0, y: -5, pointerEvents: "none" }}
                         transition={{ duration: 0.15, ease: "easeOut" }}
                         className={`w-full flex rounded-[16px] p-5 shadow-sm border group cursor-pointer
                             ${darkMode ? 'bg-[#1A1A1A] border-white/10 shadow-black/40' : 'bg-white border-stone-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)]'}
                         `}
                     >
                         <div className="flex-1 pr-6 flex flex-col justify-center">
                             <span className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-2 block ${darkMode ? 'text-stone-500' : 'text-[#A08E77]'}`}>
                                 En Vedette
                             </span>
                             <h4 className={`text-[15px] font-serif font-medium leading-tight mb-2 ${darkMode ? 'text-stone-200 group-hover:text-white' : 'text-stone-800 group-hover:text-black'} transition-colors`}>
                                 {activeItem.title}
                             </h4>
                             <p className={`text-[11.5px] leading-relaxed mb-5 pl-0 ${darkMode ? 'text-stone-400' : 'text-stone-500'} line-clamp-3`}>
                                 {activeItem.desc}
                             </p>
                             <div className={`mt-auto text-[11px] font-bold flex items-center gap-1.5 ${darkMode ? 'text-[#cfa471]' : 'text-stone-900'} group-hover:underline underline-offset-4 decoration-[#cfa471]/30`}>
                                 Voir la pièce <span className="transform transition-transform group-hover:translate-x-1">→</span>
                             </div>
                         </div>
                         <div className="w-[170px] h-full shrink-0 flex items-center rounded-xl overflow-hidden relative shadow-inner">
                             <img 
                                src={activeItem.image} 
                                alt={activeItem.title} 
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                             />
                             <div className="absolute inset-0 bg-stone-900/10 mix-blend-multiply transition-opacity group-hover:opacity-0"></div>
                         </div>
                     </motion.div>
                 </AnimatePresence>
            </div>
        </div>
    );
}

const MENU_ITEMS = [
    { id: 'nouveautes', label: 'Nouveautés', hasMega: true, customType: 'preview-list', dropdownWidth: 680 },
    { 
        id: 'meubles', label: 'Meubles', hasMega: true, groupId: 'meubles',
        dropdownWidth: 760,
        leftLinks: [
            { Icon: Archive,     title: 'Commodes / Chevets', desc: 'Rangements élégants et restaurés',  categoryId: 'commodes' },
            { Icon: DoorOpen,    title: 'Buffets',             desc: 'Enfilades et buffets de campagne', categoryId: 'buffets' },
            { Icon: DoorClosed,  title: 'Armoires',            desc: 'Armoires normandes et restaurées', categoryId: 'armoires' },
            { Icon: Table2,      title: 'Tables',              desc: 'Tables de ferme et de bistrot',    categoryId: 'tables' }
        ],
        rightLinks: [
            { title: 'Notre guide des patines' },
            { title: 'Sur-mesure : nos tarifs' }
        ]
    },
    { 
        id: 'assises', label: 'Assises', hasMega: true, groupId: 'assises',
        dropdownWidth: 760,
        leftLinks: [
            { Icon: Armchair,      title: 'Chaises',           desc: 'Dépareillées ou en lot uniforme',  categoryId: 'chaises' },
            { Icon: Sofa,          title: 'Fauteuils',          desc: 'Le confort du design du 20ème',    categoryId: 'fauteuils' },
            { Icon: RockingChair,  title: 'Bancs',              desc: 'Authenticité brute',               categoryId: 'bancs' },
        ],
        rightLinks: [
            { title: 'Sélection de tissus nobles' },
            { title: 'Restauration de cannés' }
        ]
    },
    { 
        id: 'eclairage', label: 'Éclairage', hasMega: true, groupId: 'eclairage',
        dropdownWidth: 760,
        leftLinks: [
            { Icon: Lamp,          title: 'Suspensions',        desc: 'Verre opaline et globes anciens',  categoryId: 'eclairage' },
            { Icon: LampDesk,      title: 'Lampes à poser',     desc: 'Créer une ambiance feutrée',       categoryId: 'eclairage' },
            { Icon: LampWallDown,  title: 'Appliques murales',  desc: 'Céramique, laiton et élégance',    categoryId: 'eclairage' }
        ],
        rightLinks: [
            { title: 'Conseil en éclairage' },
            { title: 'Normes électriques vintage' }
        ]
    },
    { 
        id: 'decorations', label: 'Décorations', hasMega: true, groupId: 'decorations',
        dropdownWidth: 540, singleColumn: true,
        leftLinks: [
            { Icon: Flower2,  title: 'Céramiques & Vases', desc: 'Vallauris et pépites signées',  categoryId: 'deco' },
            { Icon: Frame,    title: 'Cadres & Miroirs',   desc: 'Miroirs dorés ou en rotin',     categoryId: 'miroirs' },
        ],
        rightLinks: [
            { title: 'Inspiration Galerie (Lookbook)' }
        ]
    },
    { id: 'prix-bas', label: 'Prix bas ⚡', hasMega: false, customColor: 'text-[#d9534f] hover:text-red-700' },
    { id: 'propos', label: 'À propos', hasMega: false }
];

const navListVariants = {
    visible: {
        transition: {
            staggerChildren: 0.035,
            delayChildren: 0.015,
        },
    },
    hidden: {
        transition: {
            staggerChildren: 0.014,
            staggerDirection: -1,
        },
    },
};

const navItemVariants = {
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            duration: 0.18,
            ease: [0.22, 1, 0.36, 1],
        },
    },
    hidden: {
        opacity: 0,
        y: -3,
        filter: 'blur(2px)',
        transition: {
            duration: 0.08,
            ease: [0.4, 0, 1, 1],
        },
    },
};

export default function PremiumMegaMenu({ darkMode, onOpenAbout, onNavigateCategory }) {
    const [hoveredTab, setHoveredTab] = useState(null);
    const [dropdownLeft, setDropdownLeft] = useState(0);
    const [isVisibleAtTop, setIsVisibleAtTop] = useState(true);
    const timeoutRef = useRef(null);
    const lastScrollYRef = useRef(0);
    const hasScrollBaselineRef = useRef(false);
    const isVisibleAtTopRef = useRef(true);
    const hoveredTabRef = useRef(null);
    const navRef = useRef(null);

    const updateIsVisibleAtTop = (nextVisible) => {
        if (isVisibleAtTopRef.current === nextVisible) return;
        isVisibleAtTopRef.current = nextVisible;
        setIsVisibleAtTop(nextVisible);
    };

    const updateHoveredTab = (nextTab) => {
        if (hoveredTabRef.current === nextTab) return;
        hoveredTabRef.current = nextTab;
        setHoveredTab(nextTab);
    };
    
    const handleMouseEnter = (id, event) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        updateHoveredTab(id);

        if (event && navRef.current && event.currentTarget.tagName === 'LI') {
            const itemRect = event.currentTarget.getBoundingClientRect();
            const navRect = navRef.current.getBoundingClientRect();
            
            const activeMenuItem = MENU_ITEMS.find(item => item.id === id);
            const activeWidth = activeMenuItem?.dropdownWidth || 760;
            
            let leftPos = (itemRect.left - navRect.left) + 12; // align to text ignore padding
            
            if (leftPos + activeWidth > navRect.width - 20) {
                // If it overflows right side, align the dropdown's right edge to the tab's right edge
                leftPos = (itemRect.right - navRect.left) - activeWidth + 12;
                // Safety clamp if it falls completely off the left side
                if (leftPos < 20) leftPos = Math.max(0, navRect.width - activeWidth - 20);
            }
            
            setDropdownLeft(leftPos);
        }
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            updateHoveredTab(null);
        }, 200); 
    };

    const handleMenuItemClick = (item) => {
        if (item.id === 'propos') {
            updateHoveredTab(null);
            onOpenAbout?.();
            return;
        }

        if (item.groupId && onNavigateCategory) {
            onNavigateCategory(item.groupId);
        }
    };

    const getMenuItemHref = (item) => {
        if (item.id === 'propos') return '/a-propos';
        if (item.groupId) return getCategoryUrl(item.groupId);
        return '/';
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    useLayoutEffect(() => {
        if (typeof window === 'undefined') return;

        const currentScrollY = window.scrollY;
        lastScrollYRef.current = currentScrollY;
        hasScrollBaselineRef.current = true;

        if (currentScrollY > 160) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            updateHoveredTab(null);
            updateIsVisibleAtTop(false);
        } else if (currentScrollY <= 4) {
            updateIsVisibleAtTop(true);
        }
    }, []);

    useEffect(() => {
        let frameId = 0;

        const processScroll = () => {
            frameId = 0;
            const currentScrollY = window.scrollY;
            if (!hasScrollBaselineRef.current) {
                hasScrollBaselineRef.current = true;
                lastScrollYRef.current = currentScrollY;
                updateIsVisibleAtTop(currentScrollY <= 4);
                return;
            }

            const isScrollingDown = currentScrollY > lastScrollYRef.current;
            const isPastMenu = currentScrollY > 160;
            const isBackAtTop = currentScrollY <= 4;

            if (isPastMenu) {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                updateHoveredTab(null);
                updateIsVisibleAtTop(false);
            } else if (isScrollingDown) {
                updateIsVisibleAtTop(true);
            } else if (isBackAtTop) {
                updateIsVisibleAtTop(true);
            }

            lastScrollYRef.current = currentScrollY;
        };

        const handleScroll = () => {
            if (frameId) return;
            frameId = window.requestAnimationFrame(processScroll);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            if (frameId) window.cancelAnimationFrame(frameId);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const activeItem = MENU_ITEMS.find(item => item.id === hoveredTab);
    const hasActiveMega = activeItem?.hasMega;

    return (
        <nav 
            ref={navRef}
            className={`w-full py-[9px] hidden md:block border-b relative z-40 ${isVisibleAtTop ? 'pointer-events-auto' : 'pointer-events-none'} ${darkMode ? 'bg-[#121212] border-stone-800/20' : 'bg-[#FAFAF9] border-stone-100'}`}
            onMouseLeave={handleMouseLeave}
        >
            <motion.ul
                initial={false}
                animate={isVisibleAtTop ? 'visible' : 'hidden'}
                variants={navListVariants}
                className="flex items-center justify-center gap-4 lg:gap-8 text-[13px] font-sans tracking-[0.05em] relative mx-auto max-w-7xl"
            >
                {MENU_ITEMS.map((item) => (
                    <motion.li
                        key={item.id}
                        variants={navItemVariants}
                        onMouseEnter={(e) => handleMouseEnter(item.id, e)}
                        className={`cursor-pointer transition-colors flex items-center gap-1.5 font-medium z-10 py-[6px] px-3 relative
                            ${item.customColor 
                                ? item.customColor 
                                : darkMode ? 'text-stone-300 hover:text-white' : 'text-stone-600 hover:text-black'}
                        `}
                    >
                        <a
                            href={getMenuItemHref(item)}
                            onClick={(event) => {
                                if (item.id === 'propos' || item.groupId) {
                                    event.preventDefault();
                                    handleMenuItemClick(item);
                                }
                            }}
                            className="relative z-10 flex items-center gap-1.5"
                        >
                            {item.label}
                        {item.hasMega && (
                            <span className={`text-[7px] transition-transform duration-300 ${hoveredTab === item.id ? '-rotate-180' : 'rotate-0'}`}>▼</span>
                        )}
                        
                        </a>

                        {hoveredTab === item.id && (
                           <motion.div 
                               layoutId="mega-menu-pill"
                               className={`absolute inset-0 rounded-full -z-10 ${darkMode ? 'bg-white/10' : 'bg-black/5'}`}
                               initial={{ opacity: 0 }}
                               animate={{ opacity: 1 }}
                               exit={{ opacity: 0 }}
                               transition={{ type: "spring", stiffness: 400, damping: 30 }}
                           />
                        )}
                    </motion.li>
                ))}
            </motion.ul>

            <div className="absolute top-full mt-[1px] left-0 w-full z-50">
                <AnimatePresence>
                    {hasActiveMega && (
                        <motion.div
                            key="mega-menu-overlay"
                            initial={{ opacity: 0, scale: 0.97, y: 10, x: dropdownLeft, pointerEvents: "none" }}
                            animate={{ opacity: 1, scale: 1, y: 0, x: dropdownLeft, pointerEvents: "auto" }}
                            exit={{ opacity: 0, scale: 1, y: 0, x: dropdownLeft, pointerEvents: "none" }}
                            transition={{
                                default: { type: "spring", stiffness: 450, damping: 30 },
                                opacity: { duration: 0.09, ease: [0.4, 0, 1, 1] }
                            }}
                            style={{
                                willChange: 'opacity, transform',
                                WebkitBackfaceVisibility: 'hidden',
                                backfaceVisibility: 'hidden',
                            }}
                            className={`origin-top-left absolute top-2 rounded-[20px] overflow-hidden shadow-2xl transform-gpu
                                ${darkMode
                                    ? 'bg-[#1A1A1A]/95 backdrop-blur-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/10'
                                    : 'bg-white/95 backdrop-blur-2xl shadow-[0_30px_60px_rgba(0,0,0,0.12)] ring-1 ring-stone-200/60'}
                            `}
                            onMouseEnter={() => handleMouseEnter(hoveredTab)}
                        >
                            <motion.div 
                                layout
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className="relative overflow-hidden"
                            >
                                <AnimatePresence mode="popLayout" initial={false}>
                                    <motion.div 
                                        key={activeItem.id}
                                        initial={{ opacity: 0, x: -15, pointerEvents: "none" }}
                                        animate={{ opacity: 1, x: 0, pointerEvents: "auto" }}
                                        exit={{ opacity: 0, x: 15, pointerEvents: "none" }}
                                        transition={{ duration: 0.2 }}
                                        className=""
                                    >
                                        {activeItem.customType === 'preview-list' ? (
                                            <NouveautesContent darkMode={darkMode} />
                                        ) : (
                                            <div className="flex">
                                                <div className={`p-8 ${activeItem.singleColumn ? 'w-[300px]' : 'w-[400px] lg:w-[500px]'}`}>
                                                    <h3 className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-6 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                                                        Explorer {activeItem.label}
                                                    </h3>
                                                    <div className={`grid ${activeItem.singleColumn ? 'grid-cols-1 gap-y-8' : 'grid-cols-2 gap-x-6 gap-y-8'}`}>
                                                        {activeItem.leftLinks?.map((link, idx) => {
                                                            const LinkIcon = link.Icon;
                                                            return (
                                                            <a key={idx} href={link.categoryId ? getCategoryUrl(link.categoryId) : '#'} onClick={(e) => { e.preventDefault(); if (link.categoryId && onNavigateCategory) { onNavigateCategory(link.categoryId); updateHoveredTab(null); } }} className={`flex gap-4 group/link p-3 -m-3 rounded-xl transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-stone-100/80'}`}>
                                                                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 transition-all duration-300 ${darkMode ? 'bg-white/5 border border-white/5 group-hover/link:bg-white/10' : 'bg-stone-50 border border-stone-100 group-hover/link:bg-stone-100 group-hover/link:border-stone-200'}`}>
                                                                    {LinkIcon && <LinkIcon size={20} strokeWidth={1.5} className={`transition-all duration-300 group-hover/link:scale-110 group-hover/link:rotate-6 ${darkMode ? 'text-stone-400 group-hover/link:text-white' : 'text-stone-400 group-hover/link:text-stone-800'}`} />}
                                                                </div>
                                                                <div>
                                                                    <span className={`block text-[13px] font-bold mb-1 transition-colors ${darkMode ? 'text-stone-200 group-hover/link:text-white' : 'text-stone-800 group-hover/link:text-black'}`}>{link.title}</span>
                                                                    <span className={`block text-[11px] leading-tight ${darkMode ? 'text-stone-500' : 'text-stone-500'}`}>{link.desc}</span>
                                                                </div>
                                                            </a>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className={`p-8 ${activeItem.singleColumn ? 'w-[240px]' : 'w-[260px]'} shrink-0 border-l ${darkMode ? 'bg-[#151515] border-white/5' : 'bg-[#FAFAF9] border-stone-100'}`}>
                                                    <h3 className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-6 ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                                                        Ressources clés
                                                    </h3>
                                                    <div className="flex flex-col gap-5">
                                                        {activeItem.rightLinks?.map((link, idx) => (
                                                            <a key={idx} href="#" className={`flex items-center gap-2 p-2.5 -mx-2.5 rounded-lg text-[13px] font-medium transition-colors group ${darkMode ? 'text-stone-400 hover:text-white hover:bg-white/5' : 'text-stone-500 hover:text-black hover:bg-stone-100/80'}`}>
                                                                <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">→</span>
                                                                {link.title}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
}
