'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const wrapIndex = (index, count) => (index + count) % count;

export default function BeforeAfterSliderIsland({ projects = [], darkMode = false } = {}) {
  const safeProjects = Array.isArray(projects) ? projects.filter(Boolean) : [];
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const sliderClipRef = useRef(null);
  const sliderLineRef = useRef(null);
  const sliderInputRef = useRef(null);
  const activeProject = safeProjects[activeProjectIndex] || safeProjects[0];

  useLayoutEffect(() => {
    if (sliderClipRef.current) sliderClipRef.current.style.clipPath = 'polygon(0 0, 50% 0, 50% 100%, 0 100%)';
    if (sliderLineRef.current) sliderLineRef.current.style.left = '50%';
    if (sliderInputRef.current) sliderInputRef.current.value = '50';
  }, [activeProjectIndex]);

  if (!activeProject) return null;

  const handleSliderInput = (event) => {
    const value = event.currentTarget.value;
    if (sliderClipRef.current) sliderClipRef.current.style.clipPath = `polygon(0 0, ${value}% 0, ${value}% 100%, 0 100%)`;
    if (sliderLineRef.current) sliderLineRef.current.style.left = `${value}%`;
  };

  const goPrevious = () => setActiveProjectIndex((index) => wrapIndex(index - 1, safeProjects.length));
  const goNext = () => setActiveProjectIndex((index) => wrapIndex(index + 1, safeProjects.length));

  return (
    <>
      <div className={`relative mx-auto w-full max-w-[780px] rounded-[22px] p-1.5 ring-1 md:rounded-[26px] ${
        darkMode
          ? 'bg-[#15120f] ring-[#d8ad73]/12 shadow-[0_26px_82px_-58px_rgba(0,0,0,0.95)]'
          : 'bg-[#f2e5d4] ring-[#d4bea4] shadow-[0_30px_80px_-56px_rgba(82,54,28,0.86)] dark:bg-[#15120f] dark:ring-[#d8ad73]/12 dark:shadow-[0_26px_82px_-58px_rgba(0,0,0,0.95)]'
      }`}>
        <div className={`rounded-[20px] p-1.5 ring-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] md:rounded-[23px] ${
          darkMode ? 'bg-[#1a1713] ring-[#d8ad73]/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]' : 'bg-[#fff9ef] ring-white/90 dark:bg-[#1a1713] dark:ring-[#d8ad73]/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]'
        }`}>
          <div className={`group relative aspect-[4/3] w-full cursor-ew-resize overflow-hidden rounded-[16px] ring-1 md:aspect-[16/9.7] sm:rounded-[19px] ${
            darkMode ? 'bg-[#0f0e0c] ring-[#d8ad73]/10' : 'bg-[#e8dbc9] ring-[#d7c3aa] dark:bg-[#0f0e0c] dark:ring-[#d8ad73]/10'
          }`}>
            <img
              key={`apres-${activeProject.title}`}
              src={activeProject.apres}
              sizes="(max-width: 768px) calc(100vw - 3rem), 700px"
              alt="Projet restauration apres"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
            />
            <div className="pointer-events-none absolute right-3 top-3 z-20 sm:right-5 sm:top-5">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-[7.5px] font-extrabold uppercase tracking-[0.16em] shadow-[0_14px_30px_-22px_rgba(24,18,12,0.72)] ring-1 sm:px-3.5 sm:py-2 sm:text-[9px] ${
                darkMode ? 'bg-[#0f0d0a]/84 text-[#d8ad73] ring-[#d8ad73]/14' : 'bg-[#fffaf3]/94 text-[#3e352c] ring-white/90 dark:bg-[#0f0d0a]/84 dark:text-[#d8ad73] dark:ring-[#d8ad73]/14'
              }`}>
                Apres
              </span>
            </div>
            <div ref={sliderClipRef} className="absolute inset-0 z-10 h-full w-full">
              <img
                key={`avant-${activeProject.title}`}
                src={activeProject.avant}
                sizes="(max-width: 768px) calc(100vw - 3rem), 700px"
                alt="Projet restauration avant"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
              />
              <div className="pointer-events-none absolute left-3 top-3 sm:left-5 sm:top-5">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-[7.5px] font-extrabold uppercase tracking-[0.16em] shadow-[0_14px_30px_-22px_rgba(24,18,12,0.72)] ring-1 sm:px-3.5 sm:py-2 sm:text-[9px] ${
                  darkMode ? 'bg-[#0f0d0a]/84 text-[#d8ad73] ring-[#d8ad73]/14' : 'bg-[#fffaf3]/94 text-[#3e352c] ring-white/90 dark:bg-[#0f0d0a]/84 dark:text-[#d8ad73] dark:ring-[#d8ad73]/14'
                }`}>
                  <span className="h-1 w-1 rounded-full bg-[#b9854f] sm:h-1.5 sm:w-1.5" />
                  Avant
                </span>
              </div>
            </div>
            <div
              ref={sliderLineRef}
              className={`pointer-events-none absolute bottom-0 top-0 z-[25] w-px ${darkMode ? 'bg-[#f1d6aa]/58 shadow-[0_0_0_1px_rgba(216,173,115,0.1),0_0_16px_rgba(0,0,0,0.2)]' : 'bg-white/[0.95] shadow-[0_0_0_1px_rgba(64,43,24,0.18),0_0_18px_rgba(0,0,0,0.18)] dark:bg-[#f1d6aa]/58 dark:shadow-[0_0_0_1px_rgba(216,173,115,0.1),0_0_16px_rgba(0,0,0,0.2)]'}`}
              style={{ left: '50%', transform: 'translateX(-50%)' }}
            >
              <span className={`absolute left-1/2 top-1/2 z-30 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-[0_18px_38px_rgba(37,27,17,0.2),inset_0_1px_0_rgba(255,255,255,0.88)] ring-1 transition-transform duration-500 group-active:scale-95 sm:h-11 sm:w-11 ${
                darkMode ? 'bg-[#17130f] text-[#f5eadb] ring-[#d8ad73]/16 shadow-[0_16px_34px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.06)]' : 'bg-[#fffaf3] text-[#151515] ring-[#d9c3a6] dark:bg-[#17130f] dark:text-[#f5eadb] dark:ring-[#d8ad73]/16 dark:shadow-[0_16px_34px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.06)]'
              }`}>
                <ChevronLeft size={14} strokeWidth={1.45} />
                <span className="mx-0.5 h-3.5 w-px bg-[#d4c1aa]" />
                <ChevronRight size={14} strokeWidth={1.45} />
              </span>
            </div>
            <input
              ref={sliderInputRef}
              type="range"
              min="0"
              max="100"
              defaultValue="50"
              onInput={handleSliderInput}
              className="absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0 touch-pan-y"
              aria-label="Curseur Avant Apres"
            />
          </div>
        </div>
      </div>
      <div className={`relative mx-auto mt-4 grid w-full max-w-[780px] gap-2 overflow-hidden rounded-[18px] p-1 ring-1 md:mt-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-3 md:rounded-[22px] md:p-1.5 ${
        darkMode ? 'bg-transparent ring-[#d8ad73]/8 shadow-none' : 'bg-[#f2e5d4] ring-[#d9c4aa] shadow-[0_26px_68px_-56px_rgba(82,54,28,0.82)] dark:bg-transparent dark:ring-[#d8ad73]/8 dark:shadow-none'
      }`}>
        <div className={`relative rounded-[14px] px-3.5 py-2.5 ring-1 md:rounded-[18px] md:p-3.5 ${
          darkMode ? 'bg-[#11100e] ring-[#d8ad73]/10' : 'bg-[#fffaf3] ring-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] dark:bg-[#11100e] dark:ring-[#d8ad73]/10 dark:shadow-none'
        }`}>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="h-1.5 w-1.5 rotate-45 bg-[#b9854f]" aria-hidden="true" />
            <span className="font-sans text-[8px] font-extrabold uppercase tracking-[0.2em] text-[#7F946E] sm:text-[10px] sm:tracking-[0.22em]">
              {activeProject.tag}
            </span>
            <span className={`hidden h-px w-14 sm:block ${darkMode ? 'bg-[#d8ad73]/16' : 'bg-[#dfd1c2] dark:bg-[#d8ad73]/16'}`} />
          </div>
          <h3 className={`mt-2 font-serif text-[1.2rem] font-semibold leading-none tracking-normal sm:mt-2.5 sm:text-[1.5rem] ${
            darkMode ? 'text-[#f8f1e8]' : 'text-[#191713]'
          }`}>
            {activeProject.title}
          </h3>
          <p className={`mt-1.5 font-sans text-[11px] leading-[1.55] sm:text-[12px] ${
            darkMode ? 'text-stone-300' : 'text-[#62584e]'
          }`}>
            {activeProject.desc}
          </p>
        </div>
        <div className="relative flex items-center justify-between gap-2 px-1 md:justify-end md:gap-2.5 md:px-2.5 md:pb-1">
          <div className="flex gap-2">
            <button type="button" onClick={goPrevious} className={`flex h-8 w-8 items-center justify-center rounded-full ring-1 transition-all duration-500 hover:-translate-y-1 active:scale-95 md:h-9 md:w-9 ${darkMode ? 'bg-[#17130f] text-[#f8f1e8] ring-[#d8ad73]/14' : 'bg-[#fffaf3] text-[#151515] ring-[#dfd1c2] shadow-[0_14px_26px_-20px_rgba(43,31,19,0.78)] dark:bg-[#17130f] dark:text-[#f8f1e8] dark:ring-[#d8ad73]/14 dark:shadow-none'}`} aria-label="Projet precedent">
              <ChevronLeft size={16} strokeWidth={1.45} />
            </button>
            <button type="button" onClick={goNext} className={`flex h-8 w-8 items-center justify-center rounded-full ring-1 transition-all duration-500 hover:-translate-y-1 active:scale-95 md:h-9 md:w-9 ${darkMode ? 'bg-[#17130f] text-[#f8f1e8] ring-[#d8ad73]/14' : 'bg-[#fffaf3] text-[#151515] ring-[#dfd1c2] shadow-[0_14px_26px_-20px_rgba(43,31,19,0.78)] dark:bg-[#17130f] dark:text-[#f8f1e8] dark:ring-[#d8ad73]/14 dark:shadow-none'}`} aria-label="Projet suivant">
              <ChevronRight size={16} strokeWidth={1.45} />
            </button>
          </div>
          <span className={`rounded-full px-3 py-1.5 font-sans text-[8px] font-extrabold uppercase tracking-[0.16em] ring-1 md:px-3.5 md:text-[8.5px] ${
            darkMode ? 'bg-[#17130f] text-[#d8c9b8] ring-[#d8ad73]/12' : 'bg-[#fff8ee] text-[#9A714C] ring-[#dfd1c2] dark:bg-[#17130f] dark:text-[#d8c9b8] dark:ring-[#d8ad73]/12'
          }`}>
            0{activeProjectIndex + 1} / 0{safeProjects.length}
          </span>
        </div>
      </div>
    </>
  );
}
