'use client';

const TARGET = 38.9;

/** Affichage statique ; l'animation casino est pilotée par AboutMotionIsland (DOM). */
export default function AboutInstagramCounterIsland() {
  return (
    <div
      className="about-ig-counter relative -top-4 flex items-end font-serif text-6xl leading-none tracking-tighter text-[#F9F6F0] md:text-[6.5rem]"
      aria-label={`${TARGET} milliers d'abonnés Instagram`}
      data-ig-counter
    >
      <span className="about-ig-counter__value tabular-nums">{TARGET.toFixed(1)}</span>
      <span className="mb-1 ml-1 font-serif text-3xl lowercase italic tracking-normal text-[#A68A64] md:mb-2 md:text-5xl">
        k
      </span>
    </div>
  );
}