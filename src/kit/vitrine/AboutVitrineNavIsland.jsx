'use client';

import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function AboutVitrineNavIsland() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const lastScrollY = useRef(0);

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

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const openMenu = () => {
    setScrollbarWidth(Math.max(0, window.innerWidth - document.documentElement.clientWidth));
    setMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setScrollbarWidth(0);
  };

  const scrollTo = (id) => {
    closeMenu();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const goGallery = () => {
    window.location.assign('/galerie');
  };

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-[200] flex items-center justify-between px-6 py-5 transition-transform duration-300 ease-in-out md:px-10 md:py-6 ${menuOpen || isNavVisible ? 'translate-y-0' : '-translate-y-full'}`}
        style={{ right: menuOpen ? scrollbarWidth : 0 }}
        aria-label="Navigation vitrine"
      >
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex cursor-pointer items-center gap-2"
        >
          <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#F9F6F0] drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] md:text-[15px]">
            Seconde Vie
          </span>
          <span className="font-serif text-[11px] italic tracking-wide text-[#A68A64] drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)] md:text-[13px]">
            par Anais
          </span>
        </button>

        <button
          type="button"
          onClick={() => (menuOpen ? closeMenu() : openMenu())}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          className="group flex w-[76px] cursor-pointer items-center justify-end gap-3 md:w-[88px]"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#F9F6F0] drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] transition-colors duration-300 group-hover:text-[#A68A64] md:text-[11px]">
            Menu
          </span>
          <span className="relative flex h-8 w-8 items-center justify-center md:h-9 md:w-9">
            <Menu
              size={18}
              className={`absolute inset-0 m-auto text-[#F9F6F0] drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)] transition-all duration-500 ${menuOpen ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`}
            />
            <X
              size={18}
              className={`absolute inset-0 m-auto text-[#F9F6F0] transition-all duration-500 ${menuOpen ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0'}`}
            />
          </span>
        </button>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-[190] flex flex-col items-center justify-center bg-[#111111]">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, white 0 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 0 1px, transparent 1px)',
              backgroundSize: '18px 18px, 31px 31px',
            }}
          />
          <div className="absolute bottom-0 top-0 right-[15%] hidden w-px bg-white/[0.04] md:block" />
          <nav className="relative z-10 flex flex-col items-center gap-2 md:gap-4" aria-label="Menu vitrine">
            <button type="button" onClick={goGallery} className="group relative cursor-pointer py-3 md:py-4">
              <span className="font-serif text-[clamp(2.5rem,8vw,6rem)] leading-[1.1] tracking-tight text-[#F9F6F0] transition-colors duration-500 group-hover:text-[#A68A64]">
                Marketplace
              </span>
              <span className="absolute bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-[#A68A64] transition-transform duration-700 group-hover:scale-x-100" />
            </button>
            <button type="button" onClick={() => scrollTo('vitrine-showcase')} className="group relative cursor-pointer py-3 md:py-4">
              <span className="font-serif text-[clamp(2.5rem,8vw,6rem)] leading-[1.1] tracking-tight text-[#F9F6F0] transition-colors duration-500 group-hover:text-[#A68A64]">
                En vedette
              </span>
              <span className="absolute bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-[#A68A64] transition-transform duration-700 group-hover:scale-x-100" />
            </button>
            <button type="button" onClick={() => scrollTo('vitrine-contact')} className="group relative cursor-pointer py-3 md:py-4">
              <span className="font-serif text-[clamp(2.5rem,8vw,6rem)] leading-[1.1] tracking-tight text-[#F9F6F0] transition-colors duration-500 group-hover:text-[#A68A64]">
                Contact
              </span>
              <span className="absolute bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-[#A68A64] transition-transform duration-700 group-hover:scale-x-100" />
            </button>
          </nav>
          <div className="absolute bottom-8 left-6 right-6 flex items-end justify-between md:bottom-10 md:left-10 md:right-10">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 md:text-[10px]">Restauration de mobilier</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 md:text-[10px]">Sud de la France</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 md:text-[10px]">&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
