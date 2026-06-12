'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const wrapIndex = (index, length) => (index + length) % length;

export default function AboutBeforeAfterIsland({ projects }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sliderPos, setSliderPos] = useState(50);
  const activeProject = projects[activeIndex] || projects[0];

  if (!activeProject) return null;

  const goTo = (nextIndex) => {
    setActiveIndex(wrapIndex(nextIndex, projects.length));
    setSliderPos(50);
  };

  const handleTouchMove = (event) => {
    const touch = event.touches[0];
    const rect = event.currentTarget.getBoundingClientRect();
    const pos = ((touch.clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  };

  return (
    <section className="about-before-after relative z-[20] flex min-h-[100svh] w-full flex-col bg-[#F9F6F0] p-3 md:p-5 lg:p-6">
      <div className="about-before-card relative mt-8 flex w-full flex-grow flex-col overflow-hidden rounded-2xl bg-[#1A1A1A] shadow-[0_30px_60px_rgba(0,0,0,0.18)] md:mt-16 md:rounded-[2.5rem] xl:flex-row">
        <div className="absolute left-0 top-0 z-10 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative z-10 flex w-full flex-col justify-between p-8 md:p-12 lg:p-16 xl:w-[40%]">
          <div>
            <div className="about-before-kicker mb-6 flex items-center gap-3 overflow-hidden">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 md:text-xs">La Renaissance</span>
            </div>
            <h2 className="font-serif text-4xl leading-[1.1] tracking-tighter text-white md:text-[5.5rem] md:leading-[1]">
              <span className="about-before-title-line block overflow-hidden py-2 text-5xl font-bold uppercase md:text-[6.5rem]">LE POUVOIR</span>
              <span className="about-before-title-line block overflow-hidden py-4 font-light lowercase italic text-[#A68A64]">du geste.</span>
            </h2>
          </div>

          <div className="flex flex-grow flex-col justify-center py-10 xl:py-0">
            <p className="about-before-copy max-w-md font-sans text-sm leading-relaxed text-white/60 md:text-base">
              Sous la patine du temps se cache souvent une ame intacte. Decouvrez notre processus de transformation ou l'artisanat redonne vie aux objets oublies.
            </p>
          </div>

          <div className="mt-4 xl:mt-0">
            <div className="about-before-project rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: activeProject.accent }}>
                {activeProject.tag}
              </span>
              <h3 className="mb-4 mt-2 font-serif text-2xl text-white md:text-3xl">{activeProject.title}</h3>
              <p className="mb-8 text-xs leading-relaxed text-white/50 md:text-sm">{activeProject.desc}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button type="button" onClick={() => goTo(activeIndex - 1)} aria-label="Projet precedent" className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white/50 transition-all hover:bg-white/10 hover:text-white active:scale-95">
                    <ChevronLeft size={18} strokeWidth={2.5} />
                  </button>
                  <button type="button" onClick={() => goTo(activeIndex + 1)} aria-label="Projet suivant" className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white/50 transition-all hover:bg-white/10 hover:text-white active:scale-95">
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </button>
                </div>
                <span className="font-mono text-[10px] tracking-widest text-white/30">
                  0{activeIndex + 1} / 0{projects.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="about-before-visual relative h-[50vh] min-h-[350px] w-full md:h-[60vh] md:min-h-[500px] xl:h-auto xl:w-[60%]">
          <div className="absolute inset-0 h-full w-full bg-[#111]" onTouchMove={handleTouchMove}>
            <img src={activeProject.apres} alt="Apres la restauration" className="absolute inset-0 h-full w-full object-cover" />
            <div className="pointer-events-none absolute right-6 top-6 z-0">
              <div className="flex h-8 items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 shadow-lg backdrop-blur-md">
                <span className="mt-[1px] text-center text-[10px] font-black uppercase tracking-widest text-white">Apres</span>
              </div>
            </div>
            <div className="absolute inset-0 z-10 h-full w-full" style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}>
              <img src={activeProject.avant} alt="Avant la restauration" className="absolute inset-0 h-full w-full object-cover" />
              <div className="pointer-events-none absolute left-6 top-6">
                <div className="flex h-8 items-center justify-center rounded-full border border-white/10 bg-black/50 px-4 shadow-lg backdrop-blur-md">
                  <span className="mt-[1px] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white">
                    <span className="h-2 w-2 rounded-full bg-red-500/80" />
                    Avant
                  </span>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-0 top-0 z-[25] w-[2px] bg-white drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}>
              <div className="absolute left-1/2 top-1/2 z-30 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-2xl md:h-12 md:w-12">
                <div className="flex items-center gap-1">
                  <ChevronLeft size={16} strokeWidth={3} className="-mr-1 text-stone-900" />
                  <div className="mx-0.5 h-4 w-1 rounded-full bg-stone-300" />
                  <ChevronRight size={16} strokeWidth={3} className="-ml-1 text-stone-900" />
                </div>
              </div>
            </div>
            <input type="range" min="0" max="100" value={sliderPos} onChange={(event) => setSliderPos(Number(event.target.value))} className="absolute inset-0 z-30 h-full w-full cursor-ew-resize touch-pan-y opacity-0" aria-label="Curseur Avant Apres" />
          </div>
        </div>
      </div>
    </section>
  );
}
