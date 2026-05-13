import React, { useLayoutEffect, useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import SEO from '../kit/shared/SEO';
import { db } from '../kit/config/firebase';
import Preloader from './components/Preloader';
import HeroSection from './components/HeroSection';
import ArchSection from './components/ArchSection';
import ShowcaseSection from './components/ShowcaseSection';
import BeforeAfterSection from './components/BeforeAfterSection';
import TransitionToServices from './components/TransitionToServices';
import ServicesSection from './components/ServicesSection';
import InterludeTextSection from './components/InterludeTextSection';
import TestimonialsSection from './components/TestimonialsSection';
import InstagramSection from './components/InstagramSection';
import FAQSection from './components/FAQSection';
import ContactCTASection from './components/ContactCTASection';

gsap.registerPlugin(ScrollTrigger);

const HomeView = ({ onEnterMarketplace, onStartMarketplaceTransition, darkMode, onOpenDiscovery }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [personalization, setPersonalization] = useState({});
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const lastScrollY = useRef(0);
  const footerRef = useRef(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      setTimeout(() => { ScrollTrigger.refresh(); }, 500);
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const fetchPersonalization = async () => {
      try {
        const snap = await getDoc(doc(db, 'sys_metadata', 'homepage_images'));
        if (snap.exists()) setPersonalization(snap.data());
      } catch (error) {
        console.error('Error fetching about personalization:', error);
      }
    };

    fetchPersonalization();
  }, []);

  // Smart scroll: hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 0) {
        setIsNavVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      setScrollbarWidth(0);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const getScrollbarWidth = () => Math.max(0, window.innerWidth - document.documentElement.clientWidth);

  const openHeroMenu = () => {
    setScrollbarWidth(getScrollbarWidth());
    setMenuOpen(true);
  };

  const closeHeroMenu = () => {
    setMenuOpen(false);
    setScrollbarWidth(0);
  };

  const handleEnterShop = () => {
    // Ne pas fermer le menu immédiatement pour éviter le flash du Hero en fond
    // Le rideau de transition global (app.jsx) va se superposer à z-[9999]
    onStartMarketplaceTransition();
    setTimeout(() => { 
      closeHeroMenu(); 
      onEnterMarketplace(); 
    }, 800);
  };

  const scrollToFooter = () => {
    closeHeroMenu();
    const footer = document.getElementById('vitrine-contact');
    if (footer) footer.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToShowcase = () => {
    closeHeroMenu();
    const section = document.getElementById('vitrine-showcase');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  // Menu links config
  const menuLinks = [
    { label: 'Marketplace', action: handleEnterShop },
    { label: 'En vedette', action: scrollToShowcase },
    { label: 'Contact', action: scrollToFooter },
  ];

  return (
    <div className="bg-[#F9F6F0] text-[#1A1A1A] min-h-screen">
      <SEO
        title="À propos — Seconde Vie par Anais"
        description="L'histoire de l'atelier Seconde Vie par Anais, entre mobilier restauré, pièces uniques et savoir-faire artisanal."
        url="/a-propos"
      />

      {/* ── NAVBAR VITRINE ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[200] px-6 md:px-10 py-5 md:py-6 flex items-center justify-between transition-transform duration-300 ease-in-out ${menuOpen || isNavVisible ? 'translate-y-0' : '-translate-y-full'}`}
        style={{ right: menuOpen ? scrollbarWidth : 0 }}
      >
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="text-[13px] md:text-[15px] font-bold uppercase tracking-[0.2em] text-[#F9F6F0] drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
            Seconde Vie
          </span>
          <span className="font-serif italic text-[11px] md:text-[13px] text-[#A68A64] tracking-wide drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
            par Anais
          </span>
        </button>

        {/* Menu Toggle */}
        <button
          onClick={() => (menuOpen ? closeHeroMenu() : openHeroMenu())}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          className="flex w-[76px] md:w-[88px] items-center justify-end gap-3 cursor-pointer group"
        >
          <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] text-[#F9F6F0] drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] group-hover:text-[#A68A64] transition-colors duration-300">
            Menu
          </span>
          <div className="relative w-8 h-8 md:w-9 md:h-9 flex items-center justify-center">
            <Menu
              size={18}
              className={`absolute inset-0 m-auto text-[#F9F6F0] drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)] transition-all duration-500 ${menuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}
            />
            <X
              size={18}
              className={`absolute inset-0 m-auto text-[#F9F6F0] transition-all duration-500 ${menuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}
            />
          </div>
        </button>
      </nav>

      {/* ── FULLSCREEN MENU OVERLAY ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[190] bg-[#111111] flex flex-col items-center justify-center"
          >
            {/* Subtle texture */}
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stucco.png")' }}
            />

            {/* Architectural line */}
            <div className="absolute right-[15%] top-0 bottom-0 w-px bg-white/[0.04] hidden md:block" />

            {/* Navigation Links */}
            <nav className="relative z-10 flex flex-col items-center gap-2 md:gap-4">
              {menuLinks.map((link, i) => (
                <motion.button
                  key={link.label}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.15 + i * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onClick={link.action}
                  className="group relative cursor-pointer py-3 md:py-4"
                >
                  <span className="font-serif text-[clamp(2.5rem,8vw,6rem)] text-[#F9F6F0] leading-[1.1] tracking-tight group-hover:text-[#A68A64] transition-colors duration-500">
                    {link.label}
                  </span>
                  {/* Underline reveal on hover */}
                  <span className="absolute bottom-1 left-0 w-full h-px bg-[#A68A64] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                </motion.button>
              ))}
            </nav>

            {/* Bottom info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="absolute bottom-8 md:bottom-10 left-6 md:left-10 right-6 md:right-10 flex justify-between items-end"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
                  Restauration de mobilier
                </span>
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
                  Sud de la France
                </span>
              </div>
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
                &copy; {new Date().getFullYear()}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Preloader />
      <HeroSection themeData={personalization} onEnterShop={handleEnterShop} />
      <ArchSection />
      <div id="vitrine-showcase">
        <ShowcaseSection personalization={personalization} />
      </div>
      <BeforeAfterSection />
      <TransitionToServices />
      <ServicesSection personalization={personalization} />
      <InterludeTextSection />
      <TestimonialsSection />
      <InstagramSection />
      <FAQSection personalization={personalization} />
      <div id="vitrine-contact">
        <ContactCTASection onEnterShop={handleEnterShop} />
      </div>
    </div>
  );
};

export default HomeView;
