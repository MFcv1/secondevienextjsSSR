import React from 'react';
import { ArrowRight, CheckCircle2, Instagram, Mail, Palette, Search, Shield } from 'lucide-react';
import '../../home-v4.css';
import './about-sv4-hero.css';
import AboutBeforeAfterIsland from './AboutBeforeAfterIsland';
import AboutFaqIsland from './AboutFaqIsland';
import AboutInstagramCounterIsland from './AboutInstagramCounterIsland';
import AboutMotionIsland from './AboutMotionIsland';
import AboutSv4HeroMotionIsland from './AboutSv4HeroMotionIsland';
import AboutTestimonialsIsland from './AboutTestimonialsIsland';
import Sv4HomeHero from './Sv4HomeHero';
import Sv4SiteNav from './Sv4SiteNav';
import HomeMotionIslandV4 from '../../../app/HomeMotionIslandV4';
import {
  getFaqItems,
  getProcessSteps,
  getShowcaseItems,
  instagramPosts,
  restorationProjects,
} from './aboutContent';

const iconMap = {
  search: Search,
  shield: Shield,
  palette: Palette,
  check: CheckCircle2,
};

const textureStyle = {
  backgroundImage:
    'radial-gradient(circle at 16% 18%, rgba(255,255,255,0.55) 0 1px, transparent 1px), radial-gradient(circle at 70% 54%, rgba(255,255,255,0.32) 0 1px, transparent 1px)',
  backgroundSize: '17px 17px, 29px 29px',
};

function ArchSection() {
  return (
    <section className="about-arch-section relative z-10 w-full bg-[#F9F6F0] pt-0">
      <div className="arch-pin-container relative w-full bg-[#F9F6F0]">
        <div className="arch-wrapper relative h-screen w-full overflow-hidden md:h-[100svh]">
          <div className="pointer-events-none absolute inset-0 z-[25] flex flex-col items-center justify-center">
            <h2 className="arch-intro-text-element flex flex-col items-center justify-center font-serif text-[15vw] font-light uppercase italic leading-[0.9] tracking-widest text-black/80 opacity-0 drop-shadow-xl md:text-[10vw]">
              <span className="mb-2 block md:mb-4">Seconde</span>
              <span className="ml-4 block text-[#A68A64] md:ml-32">Vie</span>
              <span className="ml-8 mt-6 block font-sans text-xl font-medium uppercase not-italic tracking-[0.4em] text-black/40 md:ml-64 md:mt-12 md:text-3xl">
                par Anais
              </span>
            </h2>
          </div>

          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#F9F6F0]">
            <div 
              className="absolute inset-0 z-0 pointer-events-none" 
              style={{ 
                WebkitMaskImage: 'linear-gradient(to right, transparent 5%, black 25%, black 75%, transparent 95%)', 
                maskImage: 'linear-gradient(to right, transparent 5%, black 25%, black 75%, transparent 95%)' 
              }}
            >
              <div
                className="arch-grid absolute inset-0 mix-blend-multiply opacity-[0.05] pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(black 1px, transparent 1px), linear-gradient(90deg, black 1px, transparent 1px)',
                  backgroundSize: '4rem 4rem',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
                  maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
                }}
              />
            </div>
            <div
              className="arch-map absolute inset-0 z-[1] bg-cover bg-center bg-fixed mix-blend-multiply opacity-100 pointer-events-none"
              style={{
                backgroundImage: "url('/images/map-marseille.png')"
              }}
            />


            <div className="arch-art-print absolute left-[3vw] top-[9vh] z-10 flex h-[24vh] w-[52vw] flex-col opacity-0 md:left-[2vw] md:top-[15vh] md:h-[60vh] md:w-[20vw] lg:left-[5vw]">
              <div className="relative h-full w-full border border-[#1A1A1A]/10 bg-[#F9F6F0] p-2 shadow-2xl md:h-[85%] md:p-3">
                <div className="relative h-full w-full overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1709112831341-761df723875c?q=80&w=800&auto=format&fit=crop"
                    alt="Village perche provencal"
                    className="h-full w-full object-cover object-center opacity-80 mix-blend-multiply grayscale contrast-[1.1] sepia-[0.1]"
                  />
                  <div className="pointer-events-none absolute inset-0 m-2 border border-[#1A1A1A]/20 md:m-4" />
                </div>
              </div>
              <div className="mt-2 hidden w-full items-end justify-between px-2 md:flex">
                <span className="font-serif text-sm italic text-[#1A1A1A]/70">La Cadiere d'Azur</span>
                <span className="font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-[#1A1A1A]/40">FIG. 01</span>
              </div>
            </div>

            <div className="arch-art-print absolute bottom-[8vh] right-[3vw] z-10 flex h-[24vh] w-[52vw] flex-col opacity-0 md:bottom-auto md:right-[2vw] md:top-[25vh] md:h-[50vh] md:w-[22vw] lg:right-[5vw]">
              <div className="mb-4 hidden w-full items-end justify-between px-2 md:flex">
                <span className="font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-[#1A1A1A]/40">FIG. 02</span>
                <span className="font-serif text-sm italic text-[#1A1A1A]/70">Sainte-Baume</span>
              </div>
              <div className="relative h-full w-full border border-[#1A1A1A]/10 bg-[#F9F6F0] p-2 shadow-2xl md:h-[85%] md:p-3">
                <div className="relative h-full w-full overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1466854076813-4aa9ac0fc347?q=80&w=800&auto=format&fit=crop"
                    alt="Massif de Provence"
                    className="h-full w-full object-cover object-center opacity-90 mix-blend-multiply grayscale contrast-[1.2] sepia-[0.1]"
                  />
                  <div className="pointer-events-none absolute inset-0 m-2 border border-[#1A1A1A]/20 md:m-6" />
                </div>
              </div>
            </div>

            <div className="arch-ui-marker absolute left-6 top-8 flex flex-col gap-3 md:left-12 md:top-16">
              <div className="flex items-center gap-4">
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-black md:text-xs">La Galerie</span>
                <div className="h-px w-8 bg-black md:w-16" />
              </div>
            </div>

            <div className="arch-ui-marker absolute bottom-16 left-12 hidden flex-col gap-4 md:flex">
              <div className="h-16 w-px bg-black" />
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-black" style={{ writingMode: 'vertical-rl' }}>
                43 11 N / 5 42 E
              </span>
            </div>
          </div>

          <div className="arch-mask-border absolute z-[15] box-border will-change-transform" />

          <div className="arch-mask-container absolute inset-0 z-20 h-full w-full will-change-transform">
            <img
              src="https://images.unsplash.com/photo-1715705742901-a1b979eefd48?auto=format&fit=crop&q=80&w=2000"
              alt="Paysage panorama de Provence"
              className="arch-image absolute h-full w-full origin-center object-cover will-change-transform"
            />
            <div className="arch-overlay pointer-events-none absolute inset-0 h-full w-full bg-black mix-blend-multiply" />

            <div className="arch-entry-header pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-y-2 px-[11vw] pt-[20vh] md:gap-y-4 md:px-[31vw]">
              <div className="flex flex-wrap items-center justify-center gap-x-3 font-serif leading-[0.9] tracking-tighter text-[#F9F6F0] drop-shadow-2xl md:gap-x-5">
                <span className="inline-block overflow-hidden px-2 pb-2">
                  <span className="arch-entry-word block font-bold uppercase not-italic text-[8.2vw] will-change-transform md:text-[6.3vw] lg:text-[5.4vw] xl:text-[4.6vw]">Provence</span>
                </span>
                <span className="inline-block overflow-hidden px-2 pb-2">
                  <span className="arch-entry-word block font-light italic text-[6.5vw] will-change-transform md:text-[4.6vw] lg:text-[3.8vw] xl:text-[3.2vw]">Alpes</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-3 font-serif leading-[0.9] tracking-tighter text-[#F9F6F0] drop-shadow-2xl md:gap-x-5">
                <span className="inline-block overflow-hidden px-2 pb-2">
                  <span className="arch-entry-word block font-bold uppercase not-italic text-[8.2vw] will-change-transform md:text-[6.3vw] lg:text-[5.4vw] xl:text-[4.6vw]">Cote</span>
                </span>
                <span className="inline-block overflow-hidden px-2 pb-2">
                  <span className="arch-entry-word block font-light italic text-[6.5vw] will-change-transform md:text-[4.6vw] lg:text-[3.8vw] xl:text-[3.2vw]">d'Azur</span>
                </span>
              </div>
            </div>

            <div className="arch-text-content absolute inset-0 z-20 flex flex-col items-center justify-center px-4 text-[#F9F6F0]">
              <div className="arch-inner-frame group relative flex w-[90vw] max-w-2xl flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-[#F9F6F0]/20 bg-[#1A1A1A]/20 py-14 text-center shadow-2xl backdrop-blur-md md:rounded-[3rem] md:py-20 lg:py-24">
                <div className="arch-text-reveal relative z-10 mb-6 flex w-full items-center justify-center gap-4 md:mb-10">
                  <div className="h-px w-8 bg-[#E8E3DA]/60 md:w-16" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#E8E3DA] md:text-xs">Seconde Vie</span>
                  <div className="h-px w-8 bg-[#E8E3DA]/60 md:w-16" />
                </div>
                <h2 className="relative z-10 flex flex-col items-center font-serif text-3xl leading-tight tracking-tighter drop-shadow-2xl md:text-4xl lg:text-5xl xl:text-6xl">
                  <span className="arch-text-reveal mb-3 block font-light italic text-[#A68A64] text-[2.5rem] md:text-[3.5rem] lg:text-[4.2rem] xl:text-[5rem]">Designed by Anaïs</span>
                  <span className="arch-text-reveal block pr-4">with love ❤️</span>
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ShowcaseSection({ items }) {
  return (
    <section id="vitrine-showcase" className="relative z-20 w-full">
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-t-[3rem] opacity-[0.04] mix-blend-multiply md:rounded-t-[4rem]"
        style={{
          backgroundImage: 'linear-gradient(#1A1A1A 1px, transparent 1px), linear-gradient(90deg, #1A1A1A 1px, transparent 1px)',
          backgroundSize: '4rem 4rem',
        }}
      />
      <div className="relative z-20 mx-auto -mt-[8vh] max-w-[1600px] rounded-t-[3rem] bg-[#F9F6F0] px-6 pb-[25vh] pt-[15vh] shadow-[0_-20px_60px_rgba(0,0,0,0.1)] md:rounded-t-[4rem] md:px-12 lg:px-20">
        <div className="relative z-10 flex flex-col gap-[10vh] md:gap-[25vh]">
          {items.map((item, index) => (
            <div key={item.title} className={`showcase-row flex w-full flex-col items-center gap-12 md:gap-20 lg:gap-32 ${item.reverse ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
              <div className="w-full md:w-[60%] lg:w-[55%]">
                <div className="w-full rounded-[2rem] bg-[#EDE8E0] p-4 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] md:rounded-[2.5rem] md:p-6 lg:p-8">
                  <div className="showcase-img-container mx-auto aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] bg-[#E8E3DA] will-change-transform">
                    <img src={item.img} sizes="(max-width: 768px) calc(100vw - 3rem), 55vw" alt={item.title} className="h-full w-full origin-center object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105" loading={index === 0 ? 'eager' : 'lazy'} />
                  </div>
                </div>
              </div>
              <div className={`flex w-full flex-col justify-center space-y-6 text-center md:w-[40%] lg:w-[45%] ${item.reverse ? 'md:items-end md:text-right' : 'md:items-start md:text-left'}`}>
                <div className="overflow-hidden py-1">
                  <div className="showcase-reveal-item block text-sm font-serif italic text-[#A68A64] md:text-base">N 0{index + 1}</div>
                </div>
                <div className="overflow-hidden py-1">
                  <h3 className="showcase-reveal-item block font-serif text-4xl leading-[1.1] tracking-tight text-[#1A1A1A] text-pretty md:text-5xl xl:text-6xl">{item.title}</h3>
                </div>
                <div className="overflow-hidden py-1">
                  <p className="showcase-reveal-item mx-auto block max-w-[40ch] text-base font-light leading-relaxed text-[#5A5550] text-pretty md:mx-0 md:max-w-none md:text-lg">{item.desc}</p>
                </div>
                <div className="pt-4">
                  <div className="showcase-reveal-item flex flex-col gap-6">
                    <div className={`h-px w-full max-w-[150px] bg-[#1A1A1A]/10 ${item.reverse ? 'ml-auto' : 'mr-auto'}`} />
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[#1A1A1A]/40">{item.tag}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TransitionToServicesSection() {
  return (
    <section className="about-transition-services relative z-[25] flex h-[100svh] w-full items-center justify-center overflow-hidden bg-[#F9F6F0] will-change-transform">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay" style={textureStyle} />

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 text-[#1A1A1A] opacity-[0.04]">
        <svg viewBox="0 0 200 200" className="about-service-seal h-auto w-[90vw] md:w-[70vw] lg:w-[50vw]">
          <path id="aboutTextPathScroll" d="M 100, 100 m -70, 0 a 70,70 0 1,1 140,0 a 70,70 0 1,1 -140,0" fill="none" />
          <text className="fill-current font-serif text-[14px] uppercase tracking-[0.3em]">
            <textPath href="#aboutTextPathScroll" startOffset="0%">
              - LE TEMPS SUBLIME - SAVOIR-FAIRE ARTISANAL -
            </textPath>
          </text>
        </svg>
      </div>

      <div className="about-transition-step-1 absolute inset-0 z-10 flex flex-col items-center justify-center">
        <p className="mb-8 font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-[#A68A64] md:text-xs">
          - Notre Philosophie -
        </p>
        <h2 className="about-transition-title text-center font-serif text-[18vw] leading-[0.8] tracking-tighter text-[#1A1A1A] md:text-[10rem] lg:text-[14rem]">
          L'Heritage.
        </h2>
      </div>

      <div className="about-transition-step-2 pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 opacity-0 md:px-20">
        <p className="max-w-5xl text-center font-serif text-3xl leading-[1.2] text-[#1A1A1A] mix-blend-multiply text-pretty md:text-5xl lg:text-7xl">
          Le veritable artisanat ne cherche pas a effacer le temps...
        </p>
      </div>

      <div className="about-transition-step-3 pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 opacity-0 md:px-20">
        <div className="mb-8 h-16 w-px bg-[#A68A64]" />
        <p className="max-w-4xl text-center font-sans text-xl font-light uppercase leading-[1.5] tracking-[0.2em] text-[#A68A64] md:text-3xl lg:text-4xl">
          Mais a en sublimer la trace pour les generations futures.
        </p>
        <div className="mt-8 h-16 w-px bg-[#A68A64]" />
      </div>
    </section>
  );
}

function ServicesSection({ steps }) {
  return (
    <section id="atelier" className="relative z-[30] flex min-h-[100svh] w-full flex-col bg-transparent p-3 md:p-5 lg:p-6">
      <div className="relative flex w-full flex-grow flex-col overflow-hidden rounded-b-2xl rounded-t-3xl border-t border-black/5 bg-[#F9F6F0] px-8 py-16 shadow-[0_-30px_60px_rgba(0,0,0,0.15)] md:rounded-b-[2.5rem] md:rounded-t-[3rem] md:px-16 md:py-24 lg:px-24">
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay" style={textureStyle} />
        <div className="relative z-10 mb-16 max-w-4xl md:mb-24">
          <div className="sur-titre-service mb-6 flex items-center gap-3">
            <div className="h-px w-8 bg-[#A68A64]" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#A68A64] md:text-xs">Le Savoir-Faire</span>
          </div>
          <h2 className="about-services-title mb-8 font-serif text-5xl uppercase leading-[0.9] tracking-tighter text-[#1A1A1A] md:text-7xl lg:text-[6rem]">
            L'ART <span className="font-light lowercase italic text-[#A68A64]">de sauvegarder</span> LA MATIERE.
          </h2>
          <p className="about-services-copy max-w-2xl text-sm font-light leading-relaxed text-[#5A5550] md:text-lg">
            De la chine passionnee au geste technique precis, decouvrez les etapes minutieuses qui transforment un objet oublie en une piece d'exception.
          </p>
        </div>
        <div className="relative z-10 grid flex-grow grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => {
            const Icon = iconMap[step.icon] || Search;
            return (
              <article key={step.id} className="about-service-card group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-black/5 bg-[#F9F6F0]/80 p-8 shadow-sm transition-all duration-[600ms] hover:-translate-y-2 hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)]">
                <div className="absolute inset-0 z-0 translate-y-full bg-white transition-transform duration-700 group-hover:translate-y-0" />
                <div className="relative z-10">
                  <div className="mb-10 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] text-white shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-transform duration-500 group-hover:scale-110" style={{ backgroundColor: step.color }}>
                      <Icon size={22} strokeWidth={1.5} />
                    </div>
                    <span className="font-serif text-2xl italic text-[#1A1A1A]/20 transition-colors duration-500 group-hover:text-[#1A1A1A]/40">{step.id}</span>
                  </div>
                  <h3 className="mb-4 font-serif text-xl text-[#1A1A1A] md:text-2xl">{step.title}</h3>
                  <p className="text-xs font-light leading-relaxed text-[#5A5550] duration-500 group-hover:text-[#1A1A1A] md:text-sm">{step.desc}</p>
                </div>
                <div className="relative z-10 mt-10 overflow-hidden">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#A68A64] transition-all duration-500 md:translate-y-8 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                    Decouvrir l'etape <ArrowRight size={14} />
                  </div>
                </div>
                <div className="pointer-events-none absolute right-[-5%] top-[-5%] z-0 rotate-12 p-4 opacity-5 transition-opacity duration-700 group-hover:opacity-10">
                  <Icon size={120} strokeWidth={0.5} color={step.color} />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function InterludeSection() {
  const dash = <span className="mx-[3vw] inline-block align-middle opacity-80">-</span>;
  return (
    <section id="valeurs" className="about-interlude relative z-0 flex w-full flex-col items-center justify-center overflow-hidden bg-[#F9F6F0] pb-32 pt-16 md:py-40">
      <div className="flex w-full justify-center">
        <div className="about-marquee-scroll-1 w-max will-change-transform">
          <div className="about-marquee-track-1 flex w-max items-center will-change-transform">
            {Array.from({ length: 4 }).map((_, index) => (
              <h2 key={`preserver-${index}`} className="whitespace-nowrap font-serif text-[16vw] uppercase leading-none tracking-tighter text-[#1A1A1A]/15 md:text-[14vw]">
                PRESERVER L'HERITAGE {dash} PRESERVER L'HERITAGE {dash}
              </h2>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-[-2vw] flex w-full justify-center">
        <div className="about-marquee-scroll-2 w-max will-change-transform">
          <div className="about-marquee-track-2 flex w-max items-center will-change-transform">
            {Array.from({ length: 4 }).map((_, index) => (
              <h2 key={`transmettre-${index}`} className="whitespace-nowrap font-serif text-[16vw] font-light lowercase italic leading-none tracking-tighter text-[#A68A64]/40 md:text-[14vw]">
                transmettre l'histoire {dash} transmettre l'histoire {dash}
              </h2>
            ))}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-0 top-0 left-[33%] hidden w-px bg-black/5 lg:block" />
    </section>
  );
}

function InstagramSection() {
  return (
    <section className="about-instagram relative z-30 -mt-[5vh] flex w-full flex-col overflow-hidden bg-[#111111] pb-[20vh] md:mt-0">
      <div className="about-instagram-content relative mx-auto flex w-full flex-grow flex-col px-6 pb-32 pt-[15vh] md:px-12 md:pt-[20vh] lg:px-20">
        <div className="pointer-events-none absolute inset-0 opacity-10 mix-blend-overlay" style={textureStyle} />
        <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col">
          <div className="about-instagram-head mb-16 flex flex-col justify-between gap-12 md:mb-24 xl:flex-row xl:items-end">
            <div className="flex max-w-2xl flex-col">
              <div className="relative -top-8 mb-8 flex items-center gap-3">
                <Instagram className="text-[#A68A64]" size={20} />
                <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-[#A68A64]">Dans l'Atelier</span>
              </div>
              <h2 className="font-serif text-6xl uppercase leading-[0.85] tracking-tighter text-[#F9F6F0] md:text-7xl lg:text-[7.5rem]">
                L'ARTISANAT <br />
                <span className="font-light lowercase italic text-[#A68A64]">au quotidien.</span>
              </h2>
            </div>
            <div className="-mt-12 flex flex-col items-start gap-10 text-left xl:items-end xl:text-right">
              <AboutInstagramCounterIsland />
              <a href="https://www.instagram.com/seconde_vie_pour_nos_objets/" target="_blank" rel="noreferrer" className="group relative flex items-center gap-4 overflow-hidden rounded-full border border-white/20 bg-white/5 py-2 pl-6 pr-2 backdrop-blur-md transition-all duration-500 hover:border-white">
                <span className="relative z-10 ml-2 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 transition-colors duration-500 group-hover:text-[#111] md:text-xs">Rejoindre la communaute</span>
                <span className="absolute inset-0 z-0 -translate-y-[101%] bg-white transition-transform duration-[600ms] group-hover:translate-y-0" />
                <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#111] transition-colors duration-500 group-hover:bg-[#111] group-hover:text-white">
                  <ArrowRight size={18} strokeWidth={2.5} />
                </span>
              </a>
            </div>
          </div>
          <div className="mt-auto grid grid-cols-2 grid-rows-[auto] gap-4 md:grid-cols-4 md:grid-rows-[300px_300px] md:gap-6 lg:grid-rows-[400px_400px]">
            {instagramPosts.map((post) => (
              <a href="https://www.instagram.com/seconde_vie_pour_nos_objets/" target="_blank" rel="noreferrer" key={post.id} className={`about-instagram-card group relative cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-[#1A1A1A] shadow-xl md:rounded-3xl ${post.className}`}>
                <div className="absolute inset-0 z-10 bg-black/30 mix-blend-color transition-opacity duration-700 group-hover:opacity-0" />
                <div className="absolute inset-0 z-10 bg-[#A68A64]/10 mix-blend-multiply transition-opacity duration-700 group-hover:opacity-0" />
                <img src={post.img} alt={post.alt} className="about-instagram-card-image absolute inset-0 h-full w-full scale-[1.08] object-cover object-center grayscale-[20%] transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:grayscale-0" loading="lazy" />
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="flex h-16 w-16 scale-75 items-center justify-center rounded-full border border-white/20 bg-black/40 shadow-2xl backdrop-blur-md transition-transform duration-500 group-hover:scale-100">
                    <Instagram className="text-white" size={24} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection({ items }) {
  return (
    <section className="about-faq relative z-40 -mt-[15vh] flex w-full flex-col overflow-hidden bg-white pb-[7vh] shadow-[0_-30px_60px_rgba(0,0,0,0.2)] md:pb-[9vh]">
      <div className="relative mx-auto flex min-h-screen w-full flex-col justify-center bg-white px-6 pb-[20vh] pt-[20vh] md:px-12 md:pb-[25vh] md:pt-[25vh] lg:px-20">
        <div className="absolute bottom-0 top-0 left-[33%] hidden w-px bg-black/5 lg:block" />
        <div className="relative z-10 mx-auto my-auto flex w-full max-w-[1200px] flex-col items-center gap-16 lg:flex-row lg:gap-24">
          <div className="w-full lg:w-1/3">
            <div className="sticky top-32">
              <div className="mb-6 flex items-center gap-3">
                <div className="h-px w-6 bg-[#A68A64]" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#A68A64] md:text-xs">F.A.Q</span>
              </div>
              <h2 className="mb-8 font-serif text-5xl uppercase leading-[0.9] tracking-tighter text-[#1A1A1A] md:text-7xl lg:text-[5.5rem]">
                VOS <br />
                <span className="font-light lowercase italic tracking-normal text-[#A68A64]">questions.</span>
              </h2>
              <p className="mt-6 border-l border-[#1A1A1A]/10 pl-6 text-base font-light leading-relaxed text-[#5A5550] md:mt-12 md:text-lg">
                Tout ce que vous devez savoir sur notre processus de restauration, l'expedition et l'entretien de vos futures pieces.
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col lg:w-2/3">
            <AboutFaqIsland items={items} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="vitrine-contact" className="about-contact relative z-50 w-full overflow-hidden pb-0" style={{ marginTop: '-15vh', marginBottom: '-1px' }}>
      <div className="relative mx-auto flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#111] px-6 py-24 text-center text-white shadow-[0_-30px_60px_rgba(0,0,0,0.3)] md:px-12 md:py-28 lg:py-32">
        <div className="pointer-events-none absolute inset-0 opacity-10 mix-blend-overlay" style={textureStyle} />
        <div className="pointer-events-none absolute inset-0 z-0 hidden md:block">
          <div className="relative mx-auto h-full w-full max-w-[1920px] md:px-6">
            <div className="relative h-full border-x border-transparent">
              <div className="absolute inset-y-0 w-px bg-[#3a332b]" style={{ left: 'calc(25% - 1px)' }} />
              <div className="absolute inset-y-0 w-px bg-[#3a332b]" style={{ left: 'calc(75% - 1px)' }} />
            </div>
          </div>
        </div>
        <div className="relative z-10 flex max-w-4xl flex-col items-center">
          <div className="relative -top-8 mb-20 flex items-center gap-3 md:-top-10 lg:-top-12">
            <div className="h-px w-8 bg-[#A68A64]" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#A68A64] md:text-xs">Votre Projet</span>
            <div className="h-px w-8 bg-[#A68A64]" />
          </div>
          <h2 className="font-serif text-5xl uppercase leading-[0.85] tracking-tighter text-[#F9F6F0] md:text-7xl lg:text-[7rem]" style={{ marginBottom: '8rem' }}>
            <span className="mb-4 block">PRÊT À ÉCRIRE LA</span>
            <span className="block font-light lowercase italic text-[#A68A64]">suite de l'histoire ?</span>
          </h2>
          <div className="relative top-5 flex flex-col items-center gap-6 md:top-6 sm:flex-row">
            <a href="/devis" className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-full bg-[#F9F6F0] px-8 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A] transition-transform duration-500 hover:scale-105 md:px-10 md:py-5 md:text-xs">
              <Mail size={16} className="relative z-10 text-[#A68A64]" />
              <span className="relative z-10 text-[#1A1A1A] transition-colors duration-500 group-hover:text-white">Demander un devis</span>
              <span className="absolute inset-0 translate-y-full bg-[#A68A64] transition-transform duration-500 group-hover:translate-y-0" />
            </a>
            <a href="/galerie" className="group relative flex cursor-pointer items-center gap-3 px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 transition-colors duration-300 hover:text-white md:text-xs">
              <span className="relative">
                Explorer le catalogue
                <span className="absolute left-0 bottom-[-4px] h-px w-full origin-left scale-x-0 bg-[#A68A64] transition-transform duration-500 group-hover:scale-x-100" />
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 transition-all duration-500 group-hover:border-[#A68A64] group-hover:bg-[#A68A64]">
                <ArrowRight size={14} className="transition-colors group-hover:text-[#1A1A1A]" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function MarqueeSection() {
  return (
    <section className="sv4-marquee" aria-hidden="true" style={{ backgroundColor: '#FAF6EF' }}>
      <div className="sv4-marquee__track">
        {Array.from({ length: 4 }).map((_, i) => (
          <React.Fragment key={`marquee-${i}`}>
            <span className="sv4-marquee__item">Artisanat Français</span>
            <span className="sv4-marquee__dot">•</span>
            <span className="sv4-marquee__item">Mobilier Restauré</span>
            <span className="sv4-marquee__dot">•</span>
            <span className="sv4-marquee__item">Pièces Uniques</span>
            <span className="sv4-marquee__dot">•</span>
            <span className="sv4-marquee__item">Éco-responsable</span>
            <span className="sv4-marquee__dot">•</span>
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

export default function AboutServerView({ personalization = {} }) {
  const showcase = getShowcaseItems(personalization);
  const steps = getProcessSteps(personalization);
  const faqs = getFaqItems(personalization);

  return (
    <div className="sv4 sv4-about-shell min-h-screen bg-[#F9F6F0] text-[#1A1A1A]" data-about-native="true" data-sv4-shell>
      <HomeMotionIslandV4 />
      <Sv4SiteNav />
      <Sv4HomeHero withAboutShell />
      <AboutSv4HeroMotionIsland />
      <MarqueeSection />
      <ArchSection />
      <ShowcaseSection items={showcase} />
      <AboutBeforeAfterIsland projects={restorationProjects} />
      <TransitionToServicesSection />
      <ServicesSection steps={steps} />
      <InterludeSection />
      <AboutTestimonialsIsland />
      <InstagramSection />
      <FaqSection items={faqs} />
      <ContactSection />
      <AboutMotionIsland />
    </div>
  );
}
